// FlowInterpreter.ts - The brain of flow execution

import {
  FlowDefinition,
  ExecutionGraph,
  BlockNode,
  Connection,
  ValidationResult,
  ValidationError,
  ExecutionResult,
  ExecutionError,
  ErrorSeverity,
  ErrorType,
  LogLevel
} from '../types'
import { ExecutionContext } from './ExecutionContext'
import { SystemStateManager } from './SystemStateManager'
import { BlockExecutor } from './BlockExecutor'
import { CancellationToken } from './CancellationToken'
import { WebSocketManager, EnhancedBlockEvent, ExecutionContextInfo, TimingInfo } from './WebSocketManager'

export class FlowInterpreter {
  private static readonly TRACKABLE_BLOCKS = ['sensor', 'actuator', 'if', 'loop']
  private static readonly UI_VISIBLE_BLOCKS = ['sensor', 'actuator', 'if', 'loop']

  private executionGraph?: ExecutionGraph
  private context?: ExecutionContext
  private isExecuting: boolean = false
  private blockStates: Map<string, { iterations: number }> = new Map()
  private cancellationToken: CancellationToken
  private webSocketManager: WebSocketManager
  private deviceCache: Map<string, any> = new Map()

  constructor(
    private systemStateManager: SystemStateManager,
    private blockExecutor?: BlockExecutor,
    cancellationToken?: CancellationToken
  ) {
    this.cancellationToken = cancellationToken || new CancellationToken()
    this.webSocketManager = WebSocketManager.getInstance()
    // Предай cancellationToken на BlockExecutor ако има
    if (this.blockExecutor) {
      this.blockExecutor = new BlockExecutor(
        (this.blockExecutor as any).hardwareService,
        (this.blockExecutor as any).alertService,
        (this.blockExecutor as any).blockStates,
        this.cancellationToken
      )
    }
  }

  private shouldTrackBlock(blockType: string): boolean {
    return FlowInterpreter.TRACKABLE_BLOCKS.includes(blockType)
  }

  // === WEBSOCKET BROADCASTING HELPERS ===

  /**
   * Fetch device information from database and cache it
   */
  private async fetchDeviceData(deviceId: string): Promise<any> {
    try {
      // Check cache first
      if (this.deviceCache.has(deviceId)) {
        return this.deviceCache.get(deviceId)
      }

      // Import Device model dynamically to avoid circular dependencies
      const { Device } = await import('../../../models/Device')
      const device = await Device.findById(deviceId).lean()

      if (device) {
        // Cache the device data
        this.deviceCache.set(deviceId, device)
        return device
      }

      return null
    } catch (error) {
      console.warn(`⚠️ [FlowInterpreter] Failed to fetch device data for ${deviceId}:`, error)
      return null
    }
  }

  /**
   * Prepare execution context information for WebSocket events
   */
  private prepareExecutionContextInfo(): ExecutionContextInfo {
    const executionSessionId = this.context?.getVariable('executionSessionId') || this.context?.getVariable('executionId') || 'unknown'
    const programId = this.context?.getVariable('programId') || 'unknown'
    const programName = this.context?.getVariable('programName') || 'Unknown Program'
    const cycleId = this.context?.getVariable('cycleId')
    const cycleName = this.context?.getVariable('cycleName')

    return {
      executionSessionId,
      programId,
      programName,
      cycleId,
      cycleName
    }
  }

  /**
   * Prepare enhanced block event data for WebSocket broadcasting
   */
  private async prepareEnhancedBlockEvent(
    block: BlockNode,
    status: 'started' | 'completed' | 'failed',
    timing: TimingInfo,
    result?: any
  ): Promise<EnhancedBlockEvent> {
    // Get device information for sensor/actuator blocks
    let deviceName: string | undefined
    let deviceType: string | undefined

    if ((block.definitionId === 'sensor' || block.definitionId === 'actuator') && block.parameters?.deviceId) {
      const deviceData = await this.fetchDeviceData(block.parameters.deviceId)
      if (deviceData) {
        deviceName = deviceData.name
        deviceType = deviceData.type
      }
    }

    // Get block name from parameters or fallback to block type
    const blockName = block.parameters?.name || block.parameters?.blockName || `${block.definitionId} (${block.id.slice(-6)})`

    return {
      blockId: block.id,
      blockType: block.definitionId,
      blockName,
      deviceName,
      deviceType,
      parameters: block.parameters,
      executionContext: this.prepareExecutionContextInfo(),
      timing,
      status,
      result
    }
  }

  /**
   * Safely broadcast WebSocket event without interrupting execution
   */
  private async safeBroadcastBlockEvent(event: EnhancedBlockEvent, eventType: 'started' | 'completed'): Promise<void> {
    try {
      console.log(`🚀 [FlowInterpreter] Broadcasting ${eventType} event for block ${event.blockId} (${event.blockType})`)
      if (eventType === 'started') {
        this.webSocketManager.broadcastBlockStartedEnhanced(event)
      } else {
        this.webSocketManager.broadcastBlockExecutedEnhanced(event)
      }
    } catch (error) {
      console.warn(`⚠️ [FlowInterpreter] Failed to broadcast ${eventType} event:`, error)
      // Never throw - WebSocket failures must not interrupt execution
    }
  }

  // Main execution methods
  async executeFlow(flowDefinition: any, globalVariables?: Record<string, any>): Promise<boolean> {
    // За мониторинг на flow execution lifecycle - main flow execution със ExecutionSession conflict detection
    //console.log(`🚀 [FlowInterpreter] Starting flow execution for: ${flowDefinition.id}`)
    
    try {
      // Reset block states for new execution
      if (this.blockExecutor) {
        this.blockExecutor.resetBlockStates()
        //console.log(`🔄 [FlowInterpreter] Block states reset for new execution`)
      }

      // Clear device cache for fresh execution
      this.deviceCache.clear()
      //console.log(`🔄 [FlowInterpreter] Device cache cleared for new execution`)

      // За мониторинг на ExecutionSession conflict detection - API-based flow conflict resolution
      // 🚀 NEW: Check ExecutionSession API for conflicts instead of local SystemStateManager
      // This allows monitoring flows to coexist properly with better conflict detection
      try {
        const response = await fetch('http://localhost:5000/api/v1/execution-sessions/current')
        if (response.ok) {
          const data = await response.json() as any
          if (data.success && data.data) {
            const activeExecution = data.data as any
            
            // За мониторинг на cycle vs monitoring flow management - execution type conflict resolution
            // If there's an active cycle execution, only monitoring flows should be queued (not other cycles)
            if (activeExecution.flowType === 'cycle' && globalVariables?.isMonitoring) {
              console.log(`⏸️ [FlowInterpreter] Active cycle found - monitoring flow should be queued`)
              throw new Error('Active cycle execution found - monitoring flow should be queued')
            }
            
            // 🔧 FIXED: For monitoring flows, only block if it's a DIFFERENT monitoring flow
            // Allow the same flow to continue executing (e.g., when it creates ExecutionSession and then starts execution)
            if (activeExecution.flowType === 'monitoring' && globalVariables?.isMonitoring) {
              // Check if it's the same flow by comparing flowId
              const currentFlowId = globalVariables.flowId || flowDefinition.id
              const activeFlowId = activeExecution.flowId
              
              if (currentFlowId !== activeFlowId) {
                console.log(`⏭️ [FlowInterpreter] Different monitoring flow is active (active: ${activeFlowId}, current: ${currentFlowId}) - skipping`)
                throw new Error('Another monitoring flow is already active')
              } else {
                console.log(`✅ [FlowInterpreter] Same monitoring flow continuing execution (${currentFlowId})`)
              }
            }
          }
        }
        
        // 🚫 COMMENTED OUT: Duplicate SystemStateManager check conflicts with ExecutionSession API
        // This was causing "system not in idle state" errors even after successful ExecutionSession validation
        // No conflicts found - proceed with SystemStateManager validation
        //console.log(`🔍 [FlowInterpreter] Checking system state...`)
        // if (!this.systemStateManager.startExecution(flowDefinition.id)) {
        //   console.error(`❌ [FlowInterpreter] Cannot start execution - system not in idle state`)
        //   throw new Error('Cannot start execution - system not in idle state')
        // }
        console.log(`✅ [FlowInterpreter] ExecutionSession validation passed - proceeding`)
       // console.log(`✅ [FlowInterpreter] System state OK`)

        // 🚀 Set SystemStateManager state for status tracking
        this.systemStateManager.startExecution(flowDefinition.id)

      } catch (fetchError: any) {
        // If ExecutionSession API fails, fall back to original SystemStateManager check
        if (fetchError.message.includes('Active') || fetchError.message.includes('monitoring flow')) {
          // Re-throw ExecutionSession conflict errors
          throw fetchError
        }
        
        // 🚫 COMMENTED OUT: SystemStateManager fallback also conflicts with ExecutionSession API
        // When ExecutionSession API is unavailable, we should trust that SchedulerService handles conflicts
        console.log(`⚠️ [FlowInterpreter] ExecutionSession API unavailable - proceeding with execution`)
        // if (!this.systemStateManager.startExecution(flowDefinition.id) ) {
        //   console.error(`❌ [FlowInterpreter] Cannot start execution - system not in idle state`)
        //   throw new Error('Cannot start execution - system not in idle state')
        // }
        console.log(`✅ [FlowInterpreter] Proceeding with execution (API unavailable)`)
        
        // 🚀 NEW: Still set SystemStateManager state for status tracking, but don't validate
        this.systemStateManager.startExecution(flowDefinition.id)
      }

      // За мониторинг на execution graph creation - FlowEditor v3 format към ExecutionGraph conversion
      // Parse and validate flow
      //console.log(`📋 [FlowInterpreter] Creating execution graph...`)
      this.executionGraph = this.createExecutionGraph(flowDefinition)
      //console.log(`✅ [FlowInterpreter] Execution graph created with ${this.executionGraph.blocks.size} blocks`)
      
      // За мониторинг на flow validation - orphaned blocks, circular dependencies detection
      //console.log(`🔎 [FlowInterpreter] Validating flow...`)
      const validation = this.validateFlow(this.executionGraph)
      
      if (!validation.isValid) {
        const errorMsg = validation.errors.map(e => e.message).join('; ')
        console.error(`❌ [FlowInterpreter] Flow validation failed: ${errorMsg}`)
        throw new Error(`Flow validation failed: ${errorMsg}`)
      }
      //console.log(`✅ [FlowInterpreter] Flow validation passed`)

      // За мониторинг на execution context initialization - ExecutionContext setup със global variables
      // Initialize execution context
      //console.log(`🏗️ [FlowInterpreter] Initializing execution context...`)
      this.context = new ExecutionContext()
      this.context.start()
      
      // Reset block states for new execution
      this.blockStates.clear()
      
      // Set flowId as global variable for monitoring system
      this.context.setVariable('flowId', flowDefinition.id)
      //console.log(`🌐 [FlowInterpreter] Set global variable: flowId = ${flowDefinition.id}`)
      
      // Set global variables if provided
      if (globalVariables) {
        for (const [key, value] of Object.entries(globalVariables)) {
          this.context.setVariable(key, value)
          //console.log(`🌐 [FlowInterpreter] Set global variable: ${key} = ${value}`)
        }
      }
      
      //console.log(`✅ [FlowInterpreter] Execution context initialized`)

      // Update system context
      this.systemStateManager.updateContext({
        flowId: flowDefinition.id,
        currentAction: 'Flow validation completed'
      })

      // Start execution from start blocks
      this.isExecuting = true
      const startBlocks = this.findStartBlocks(this.executionGraph)
      //console.log(`🎯 [FlowInterpreter] Found ${startBlocks.length} start blocks: [${startBlocks.join(', ')}]`)
      
      if (startBlocks.length === 0) {
        console.error(`❌ [FlowInterpreter] No start blocks found in flow`)
        throw new Error('No start blocks found in flow')
      }

      // Execute first start block (MVP supports only sequential execution)
      //console.log(`▶️ [FlowInterpreter] Starting execution from block: ${startBlocks[0]}`)
      const success = await this.executeFromBlock(startBlocks[0])
      
      if (success) {
        console.log(`✅ [FlowInterpreter] Flow completed successfully`)
        this.systemStateManager.updateContext({
          currentAction: 'Flow completed successfully'
        })
      } else {
        console.error(`❌ [FlowInterpreter] Flow execution failed`)
      }

      return success

    } catch (error) {
      console.error(`💥 [FlowInterpreter] Flow execution error:`, error)
      this.handleExecutionError(error as Error)
      return false
    } finally {
      this.isExecuting = false
      
      // 🚩 ЗАЩИТА 2: Reset CancellationToken при завършване на ВСЕКИ поток
      this.cancellationToken.reset()
      console.log(`🔄 [FlowInterpreter] CancellationToken reset after flow completion`)
      
      // 🚫 COMMENTED OUT: Automatic stopExecution conflicts with ExecutionSession lifecycle management
      // The ExecutionSession API and SchedulerService now handle system state transitions
      // this.systemStateManager.stopExecution()
      console.log(`🏁 [FlowInterpreter] Flow execution finished`)
    }
  }

  // Flow parsing and validation
  createExecutionGraph(flowDefinition: any): ExecutionGraph {
    // За мониторинг на FlowEditor conversion - FlowEditor v3 към ExecutionGraph transformation
    //console.log(`📋 [FlowInterpreter] Converting FlowEditor v3 format to execution graph`)
    const blocks = new Map<string, BlockNode>()
    const connections = new Map<string, Connection[]>()

    // Convert blocks from FlowEditor v3 format
    flowDefinition.blocks.forEach((blockDef: any) => {
      //console.log(`🧩 [FlowInterpreter] Processing block: ${blockDef.id} (${blockDef.definitionId})`)
      
      // Convert connections.inputs to inputPorts array
      const inputPorts: any[] = []
      if (blockDef.connections && blockDef.connections.inputs) {
        Object.keys(blockDef.connections.inputs).forEach(portName => {
          inputPorts.push({
            id: portName,
            name: portName,
            type: 'input'
          })
        })
      }

      // Convert connections.outputs to outputPorts array  
      const outputPorts: any[] = []
      if (blockDef.connections && blockDef.connections.outputs) {
        Object.keys(blockDef.connections.outputs).forEach(portName => {
          outputPorts.push({
            id: portName,
            name: portName,
            type: 'output'
          })
        })
      }

      const blockNode: BlockNode = {
        id: blockDef.id,
        definitionId: blockDef.definitionId,
        parameters: blockDef.parameters,
        inputPorts,
        outputPorts
      }
      blocks.set(blockDef.id, blockNode)
    })

    // Convert connections from FlowEditor v3 format
    flowDefinition.connections.forEach((connDef: any) => {
      const connection: Connection = {
        sourceBlockId: connDef.sourceBlockId,
        sourcePortId: connDef.sourcePortId,
        targetBlockId: connDef.targetBlockId,
        targetPortId: connDef.targetPortId
      }

      const sourceConnections = connections.get(connDef.sourceBlockId) || []
      sourceConnections.push(connection)
      connections.set(connDef.sourceBlockId, sourceConnections)
    })

    const startBlocks = this.findStartBlocks({ blocks, connections, startBlocks: [], metadata: flowDefinition.meta })

    //console.log(`✅ [FlowInterpreter] Execution graph created: ${blocks.size} blocks, ${connections.size} connection groups`)
    
    return {
      blocks,
      connections,
      startBlocks,
      metadata: flowDefinition.meta
    }
  }

  validateFlow(graph: ExecutionGraph): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: any[] = []

    // Check for orphaned blocks
    graph.blocks.forEach((block, blockId) => {
      const hasIncomingConnections = this.hasIncomingConnections(blockId, graph)
      const hasOutgoingConnections = graph.connections.has(blockId)
      
      if (!hasIncomingConnections && !graph.startBlocks.includes(blockId)) {
        errors.push({
          type: 'unreachable_block',
          blockId,
          message: `Block ${blockId} is not reachable (no incoming connections and not a start block)`
        })
      }
    })

    // Check for missing connections
    graph.blocks.forEach((block, blockId) => {
      const requiredOutputs = block.outputPorts.filter(p => p.name === 'flowOut')
      const connections = graph.connections.get(blockId) || []
      
      if (requiredOutputs.length > 0 && connections.length === 0) {
        // This might be an end block, so just warn
        warnings.push({
          type: 'unused_variable',
          blockId,
          message: `Block ${blockId} has no outgoing connections`
        })
      }
    })

    // Check for circular dependencies (basic check)
    if (this.hasCircularDependency(graph)) {
      errors.push({
        type: 'circular_dependency',
        message: 'Flow contains circular dependencies'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Block execution
  private async executeFromBlock(blockId: string): Promise<boolean> {
    // За мониторинг на sequential block execution - block-by-block execution coordinator
    //console.log(`🎯 [FlowInterpreter] executeFromBlock starting with: ${blockId}`)
    
    if (!this.executionGraph || !this.context) {
      console.error(`❌ [FlowInterpreter] Execution not properly initialized`)
      throw new Error('Execution not properly initialized')
    }

    let currentBlockId: string | null = blockId

    while (currentBlockId && this.isExecuting) {
      //console.log(`🔄 [FlowInterpreter] Processing block: ${currentBlockId}`)
      
      // За мониторинг на cancellation handling - graceful flow cancellation със jump to end block
      // 🚩 NEW: Check for cancellation before each block
      if (this.cancellationToken.isCancelled()) {
        console.log(`🚩 [FlowInterpreter] Cancellation detected - jumping to end block`)
        
        // 🚩 ЗАЩИТА 1: Reset преди jumpToEndBlock за сигурност
        this.cancellationToken.reset()
        console.log(`🔄 [FlowInterpreter] CancellationToken reset before jumping to end block`)
        
        const endBlockResult = await this.jumpToEndBlock()
        return endBlockResult
      }
      
      // Check for pause/stop signals
      if (this.context.isPaused) {
        console.log(`⏸️ [FlowInterpreter] Execution paused - waiting for resume/stop signal`)
        await this.waitForResumeOrStop()

        // After wait, check if stopped or can continue
        if (this.context.isStopped) {
          console.log(`🛑 [FlowInterpreter] Execution stopped after pause`)
          this.broadcastFlowStatusEvent('stopped')
          return false
        }
        console.log(`▶️ [FlowInterpreter] Execution resumed`)
        this.broadcastFlowStatusEvent('resumed')
        continue // Restart the loop to check conditions again
      }

      if (this.context.isStopped) {
        console.log(`🛑 [FlowInterpreter] Execution stopped`)
        this.broadcastFlowStatusEvent('stopped')
        return false
      }

      try {
        // За мониторинг на block execution coordination - BlockExecutor integration и result processing
        // Execute current block
        const block = this.executionGraph.blocks.get(currentBlockId)
        if (!block) {
          console.error(`❌ [FlowInterpreter] Block not found: ${currentBlockId}`)
          throw new Error(`Block not found: ${currentBlockId}`)
        }

       // console.log(`🧩 [FlowInterpreter] Executing block: ${currentBlockId} (${block.definitionId})`)
        this.context.setCurrentBlock(currentBlockId)
        await this.systemStateManager.updateCurrentBlock(currentBlockId, `Executing ${block.definitionId}`)

        // Start block execution tracking in ExecutionSession
        if (this.shouldTrackBlock(block.definitionId)) {
          await this.startBlockExecutionTracking(currentBlockId, block.definitionId, block.definitionId)
          // TODO: REMOVED - current-block tracking is redundant with hierarchical tracking
          // await this.updateCurrentBlockTracking(currentBlockId, block.definitionId, block.definitionId)
        }

        // Execute block via BlockExecutor with WebSocket broadcasting
        const blockStartTime = Date.now()
        const startTimeISO = new Date().toISOString()

        // 🚀 BROADCAST BLOCK START EVENT
        if (this.shouldTrackBlock(block.definitionId) || FlowInterpreter.UI_VISIBLE_BLOCKS.includes(block.definitionId)) {
          const startEvent = await this.prepareEnhancedBlockEvent(block, 'started', { startTime: startTimeISO })
          await this.safeBroadcastBlockEvent(startEvent, 'started')
        }

        const result = await this.executeBlock(block)
        const blockDuration = Date.now() - blockStartTime
        const endTimeISO = new Date().toISOString()

        // 🚀 BROADCAST BLOCK COMPLETION EVENT
        if (this.shouldTrackBlock(block.definitionId) || FlowInterpreter.UI_VISIBLE_BLOCKS.includes(block.definitionId)) {
          const completionEvent = await this.prepareEnhancedBlockEvent(
            block,
            result.success ? 'completed' : 'failed',
            {
              startTime: startTimeISO,
              endTime: endTimeISO,
              duration: blockDuration
            },
            result.data
          )
          await this.safeBroadcastBlockEvent(completionEvent, 'completed')
        }

        //console.log(`📊 [FlowInterpreter] Block ${currentBlockId} result:`, { success: result.success, outputPort: result.outputPort })

        // Complete block execution tracking in ExecutionSession
        if (this.shouldTrackBlock(block.definitionId)) {
          await this.completeBlockExecutionTracking(currentBlockId, result.data, blockDuration)
          // TODO: REMOVED - current-block tracking is redundant with hierarchical tracking
          // await this.clearCurrentBlockTracking()
        }

        this.context.addExecutedBlock(currentBlockId)

        if (!result.success) {
          console.error(`❌ [FlowInterpreter] Block ${currentBlockId} execution failed:`, result.error)
          
          // За мониторинг на ErrorHandler integration - custom notification и recovery strategy processing
          // Find ErrorHandler block connected to this block (metadata approach)
          const errorHandlerBlock = this.findErrorHandlerForBlock(currentBlockId)
          if (errorHandlerBlock) {
            console.log(`🔀 [FlowInterpreter] Found ErrorHandler for ${currentBlockId}, applying configuration`)
            
            // Apply ErrorHandler instructions directly (metadata approach)
            const shouldContinue = await this.applyErrorHandlerInstructions(
              errorHandlerBlock, 
              result.error, 
              currentBlockId
            )
            
            if (shouldContinue) {
              // Find next block(s) based on normal flow
              const nextBlocks = this.getNextBlocks(currentBlockId, 'flowOut')
              if (nextBlocks.length > 0) {
                currentBlockId = nextBlocks[0].targetBlockId
                continue
              }
            }
            
            // ErrorHandler requested stop or no next blocks
            return false
          }
          
          // No error handler - fail execution
          await this.handleBlockError(block, result.error)
          return false
        }

        // Add 2-second delay after each block execution for UI refresh
        await new Promise(resolve => setTimeout(resolve, 2000))

        // За мониторинг на GOTO redirection - flow navigation control със target block validation
        // Handle GOTO redirection
        if (result.outputPort === 'REDIRECT') {
          const targetBlockId = result.data?.targetBlockId
          if (targetBlockId && this.executionGraph.blocks.has(targetBlockId)) {
           // console.log(`🔀 [FlowInterpreter] GOTO redirect: ${currentBlockId} → ${targetBlockId}`)
            currentBlockId = targetBlockId
            continue
          } else {
            console.error(`❌ [FlowInterpreter] GOTO target block not found: ${targetBlockId}`)
            throw new Error(`GOTO target block not found: ${targetBlockId}`)
          }
        }

        // Handle ErrorHandler stop commands
        if (result.outputPort === 'flowOutStop') {
          console.log(`🛑 [FlowInterpreter] ErrorHandler requested flow stop`)
          this.context.addLog(`Flow stopped by ErrorHandler: ${result.data?.strategy || 'unknown'}`)
          return false
        }

        // Find next block(s)
        const nextBlocks = this.getNextBlocks(currentBlockId, result.outputPort)
        //console.log(`➡️ [FlowInterpreter] Next blocks from ${currentBlockId}: ${nextBlocks.length} connections`)
        
        if (nextBlocks.length === 0) {
          // End of flow
          //console.log(`🏁 [FlowInterpreter] Flow completed at block: ${currentBlockId}`)
          this.context.addLog(`Flow completed at block: ${currentBlockId}`)
          return true
        }

        // For MVP, take first next block (no parallel execution)
        currentBlockId = nextBlocks[0].targetBlockId
        //console.log(`⏭️ [FlowInterpreter] Moving to next block: ${currentBlockId}`)

      } catch (error) {
        console.error(`💥 [FlowInterpreter] Error executing block ${currentBlockId}:`, error)
        this.handleExecutionError(error as Error, currentBlockId || undefined)
        return false
      }
    }

    console.log(`✅ [FlowInterpreter] executeFromBlock completed successfully`)
    return true
  }

  // Navigation helpers
  private findStartBlocks(graph: ExecutionGraph): string[] {
    const startBlocks: string[] = []
    
    graph.blocks.forEach((block, blockId) => {
      if (!this.hasIncomingConnections(blockId, graph)) {
        startBlocks.push(blockId)
      }
    })

    return startBlocks
  }

  private hasIncomingConnections(blockId: string, graph: ExecutionGraph): boolean {
    for (const connections of graph.connections.values()) {
      if (connections.some(conn => conn.targetBlockId === blockId)) {
        return true
      }
    }
    return false
  }

  private getNextBlocks(blockId: string, outputPort: string): Connection[] {
    if (!this.executionGraph) return []
    
    const connections = this.executionGraph.connections.get(blockId) || []
    return connections.filter(conn => conn.sourcePortId === outputPort)
  }

  private hasCircularDependency(graph: ExecutionGraph): boolean {
    // Simple DFS cycle detection
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (blockId: string): boolean => {
      visited.add(blockId)
      recursionStack.add(blockId)

      const connections = graph.connections.get(blockId) || []
      for (const conn of connections) {
        const nextBlockId = conn.targetBlockId
        
        if (!visited.has(nextBlockId)) {
          if (hasCycle(nextBlockId)) return true
        } else if (recursionStack.has(nextBlockId)) {
          return true
        }
      }

      recursionStack.delete(blockId)
      return false
    }

    for (const blockId of graph.blocks.keys()) {
      if (!visited.has(blockId)) {
        if (hasCycle(blockId)) return true
      }
    }

    return false
  }

  // Execute block via BlockExecutor (Phase 4)
  private async executeBlock(block: BlockNode): Promise<ExecutionResult> {
    // За мониторинг на BlockExecutor delegation - block execution със context и error handling
    //console.log(`🔧 [FlowInterpreter] executeBlock called for: ${block.id} (${block.definitionId})`)
    
    if (!this.blockExecutor) {
      console.log(`🎭 [FlowInterpreter] No BlockExecutor - falling back to mock execution`)
      return this.mockExecuteBlock(block)
    }

    if (!this.context) {
      console.error(`❌ [FlowInterpreter] Execution context not initialized`)
      throw new Error('Execution context not initialized')
    }

    // Pass blockStates to BlockExecutor if it supports it
    if (this.blockExecutor.constructor.length >= 4) {
      (this.blockExecutor as any).blockStates = this.blockStates
    }

   //console.log(`⚙️ [FlowInterpreter] Calling BlockExecutor.execute for block: ${block.id}`)
    
    // Check if this block has ErrorHandler with custom notification enabled
    const hasCustomNotification = this.hasErrorHandlerWithCustomNotification(block.id)
    
    const result = await this.blockExecutor.execute(block, this.context, hasCustomNotification)
    //console.log(`📋 [FlowInterpreter] BlockExecutor result for ${block.id}:`, result)
    return result
  }

  // Mock execution fallback
  private async mockExecuteBlock(block: BlockNode): Promise<ExecutionResult> {
    console.log(`🎭 [FlowInterpreter] Mock executing block: ${block.id} (${block.definitionId})`)
    
    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, 100))

    this.context?.addLog(`Mock execution of ${block.definitionId} block: ${block.id}`)

    const result = {
      success: true,
      outputPort: 'flowOut',
      data: { mock: true }
    }
    
    console.log(`✅ [FlowInterpreter] Mock execution result for ${block.id}:`, result)
    return result
  }

  // Error handling
  private async handleBlockError(block: BlockNode, error?: ExecutionError): Promise<void> {
    // За мониторинг на block error handling - severity-based error processing и recovery actions
    if (!error) return

    this.context?.addError(error)
    
    // Check for error handlers (onErrorIn connections)
    const errorConnections = this.getNextBlocks(block.id, 'onErrorIn')
    
    if (errorConnections.length > 0) {
      // Continue with error handler
      this.context?.addLog(`Redirecting to error handler for block: ${block.id}`)
      return
    }

    // No error handler - decide based on severity
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      this.systemStateManager.setErrorState(error.message)
      throw new Error(`Critical error in block ${block.id}: ${error.message}`)
    }

    // Low/Medium errors - log and continue
    this.context?.addLog(`Non-critical error in block ${block.id}: ${error.message}`, 'warn' as any)
  }

  private handleExecutionError(error: Error, blockId?: string): void {
    const executionError: ExecutionError = {
      type: ErrorType.EXECUTION_TIMEOUT,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      blockId,
      timestamp: new Date(),
      stack: error.stack
    }

    this.context?.addError(executionError)
    this.systemStateManager.setErrorState(error.message)
  }

  // ErrorHandler metadata methods
  private hasErrorHandlerWithCustomNotification(blockId: string): boolean {
    // За мониторинг на ErrorHandler custom notification detection - enableNotification и userMessage validation
    if (!this.executionGraph) return false
    
    // Find ErrorHandler blocks that connect to this block via onErrorIn
    for (const [errorHandlerBlockId, errorHandlerBlock] of this.executionGraph.blocks) {
      if (errorHandlerBlock.definitionId === 'errorHandler') {
        // Check if this ErrorHandler has connection to the failed block
        const connections = this.executionGraph.connections.get(errorHandlerBlockId) || []
        const hasConnection = connections.some(conn => 
          conn.targetBlockId === blockId && conn.targetPortId === 'onErrorIn'
        )
        
        if (hasConnection) {
          // Check if this ErrorHandler has custom notification enabled
          const enableNotification = errorHandlerBlock.parameters?.enableNotification
          const userMessage = errorHandlerBlock.parameters?.userMessage
          
          if (enableNotification && userMessage) {
            console.log(`[FlowInterpreter] Found ErrorHandler ${errorHandlerBlockId} with custom notification for block ${blockId}`)
            return true
          }
        }
      }
    }
    
    return false
  }

  private findErrorHandlerForBlock(blockId: string): BlockNode | null {
    // За мониторинг на ErrorHandler connection discovery - block-to-ErrorHandler relationship mapping
    if (!this.executionGraph) return null
    
    // Find ErrorHandler blocks that connect back to this block via onErrorIn
    for (const [errorHandlerBlockId, errorHandlerBlock] of this.executionGraph.blocks) {
      if (errorHandlerBlock.definitionId === 'errorHandler') {
        // Check if this ErrorHandler has connection to the failed block
        const connections = this.executionGraph.connections.get(errorHandlerBlockId) || []
        const hasConnection = connections.some(conn => 
          conn.targetBlockId === blockId && conn.targetPortId === 'onErrorIn'
        )
        
        if (hasConnection) {
          console.log(`📋 [FlowInterpreter] Found ErrorHandler ${errorHandlerBlockId} for block ${blockId}`)
          return errorHandlerBlock
        }
      }
    }
    
    console.log(`❌ [FlowInterpreter] No ErrorHandler found for block ${blockId}`)
    return null
  }

  private async applyErrorHandlerInstructions(
    errorHandlerBlock: BlockNode,
    error: ExecutionError | undefined,
    sourceBlockId: string
  ): Promise<boolean> {
    // За мониторинг на ErrorHandler strategy execution - retry logic, custom notifications, fallback strategies
    const { 
      enableRetry = false,
      maxRetries = 3,
      retryDelay = 5,
      fallbackStrategy = 'continue',
      pauseTimeout = 300,
      userMessage = '',
      enableNotification = false,
      includeContextData = false
    } = errorHandlerBlock.parameters

    if (!error) {
      console.log(`⚠️ [FlowInterpreter] No error to process in ErrorHandler`)
      return true
    }

    console.log(`🔧 [FlowInterpreter] ErrorHandler config: enableRetry=${enableRetry}, fallbackStrategy=${fallbackStrategy}, enableNotification=${enableNotification}`)

    // Send custom notification if enabled
    if (enableNotification && userMessage) {
      try {
        // Get source block data for context
        const sourceBlock = this.executionGraph?.blocks.get(sourceBlockId)
        let contextData = undefined

        if (includeContextData && sourceBlock) {
          contextData = {
            sourceBlockId: sourceBlockId,
            sourceBlockType: sourceBlock.definitionId,
            parameters: sourceBlock.parameters,
            error: {
              type: error.type,
              severity: error.severity,
              message: error.message,
              timestamp: error.timestamp
            }
          }
        }

        // Get error notification settings for delivery methods
        const { ErrorNotificationSettings } = await import('../../../models/ErrorNotificationSettings')
        const settings = await (ErrorNotificationSettings as any).getSettings()
        const deliveryMethods = settings?.globalSettings?.deliveryMethods || ['email']

        // Import notification service
        const { notificationService } = await import('../../../services/NotificationService')
        
        await notificationService.sendCustomErrorNotification(
          sourceBlockId,
          sourceBlock?.definitionId || 'unknown',
          userMessage,
          contextData,
          deliveryMethods
        )

        console.log(`📧 [FlowInterpreter] Custom error notification sent for block ${sourceBlockId}`)
        this.context?.addLog(`Custom error notification sent: ${userMessage}`)
        
        // Note: BlockExecutor now handles notification logic based on ErrorHandler configuration
      } catch (notificationError) {
        console.error(`❌ [FlowInterpreter] Failed to send custom error notification:`, notificationError)
        this.context?.addLog(`Failed to send custom error notification: ${notificationError}`)
      }
    } else if (userMessage) {
      // Log user message even if notification is disabled
      console.log(`👤 [FlowInterpreter] User notification (not sent): ${userMessage}`)
      this.context?.addLog(`User notification: ${userMessage}`)
    }

    // За мониторинг на retry mechanism - retry attempts със delay и success validation
    // Apply retry logic if enabled
    if (enableRetry) {
      console.log(`🔄 [FlowInterpreter] Starting retry logic (max: ${maxRetries}, delay: ${retryDelay}s)`)
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🔁 [FlowInterpreter] Retry attempt ${attempt}/${maxRetries}`)
        
        // Apply delay before retry (except for first attempt)
        if (attempt > 1 && retryDelay > 0) {
          console.log(`⏱️ [FlowInterpreter] Waiting ${retryDelay}s before retry...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay * 1000))
        }
        
        // Re-execute the failed block
        const sourceBlock = this.executionGraph?.blocks.get(sourceBlockId)
        if (!sourceBlock) {
          console.error(`❌ [FlowInterpreter] Source block ${sourceBlockId} not found for retry`)
          break
        }
        
        try {
          console.log(`🔄 [FlowInterpreter] Re-executing block ${sourceBlockId}`)
          const retryResult = await this.executeBlock(sourceBlock)
          
          if (retryResult.success) {
            console.log(`✅ [FlowInterpreter] Retry attempt ${attempt} succeeded!`)
            return true // Success - continue flow
          } else {
            console.log(`❌ [FlowInterpreter] Retry attempt ${attempt} failed: ${retryResult.error?.message}`)
          }
        } catch (retryError) {
          console.log(`💥 [FlowInterpreter] Retry attempt ${attempt} threw error: ${(retryError as Error).message}`)
        }
      }
      
      console.log(`🚫 [FlowInterpreter] All ${maxRetries} retry attempts failed, applying fallback strategy: ${fallbackStrategy}`)
    }

    // Apply fallback strategy (either directly or after failed retries)
    switch (fallbackStrategy) {
      case 'continue':
        console.log(`➡️ [FlowInterpreter] ErrorHandler: Continuing flow execution`)
        return true

      case 'stop':
        console.log(`🛑 [FlowInterpreter] ErrorHandler: Stopping flow execution`)
        // Sync ActiveProgram status to 'loaded' (stopped) in database
        await this.syncActiveProgramStatus('loaded', 'ErrorHandler stop strategy')
        return false

      case 'pause':
        console.log(`⏸️ [FlowInterpreter] ErrorHandler: Pausing flow execution`)
        // Pause execution - will wait until resume/stop signal
        if (this.context) {
          this.context.pause()
        }
        this.systemStateManager.pauseExecution()

        // Sync ActiveProgram status to 'paused' in database
        await this.syncActiveProgramStatus('paused', 'ErrorHandler pause strategy')

        // Broadcast pause event
        this.broadcastFlowStatusEvent('paused', errorHandlerBlock.id)

        console.log(`⏸️ [FlowInterpreter] Flow paused, waiting for resume/stop signal`)
        return true

      default:
        console.log(`❓ [FlowInterpreter] Unknown fallback strategy: ${fallbackStrategy}, defaulting to continue`)
        return true
    }
  }

  private async executeRecoveryAction(action: string, blockId: string): Promise<void> {
    switch (action) {
      case 'restart_module':
        console.log(`🔄 [FlowInterpreter] Recovery: Restarting affected module for block ${blockId}`)
        // TODO: IMPLEMENT_LATER - Module restart logic
        break

      case 'clear_context':
        console.log(`🧹 [FlowInterpreter] Recovery: Clearing execution context`)
        // Clear only user variables, keep system variables
        const variables = this.context?.getVariables() || {}
        Object.keys(variables).forEach(key => {
          if (!key.startsWith('system_') && !key.startsWith('global_')) {
            this.context?.clearVariable(key)
          }
        })
        break

      case 'emergency_stop':
        console.log(`🚨 [FlowInterpreter] Recovery: Executing emergency stop`)
        // Emergency stop through SystemStateManager
        this.systemStateManager.stopExecution(true) // emergency = true
        break

      default:
        console.log(`❓ [FlowInterpreter] Unknown recovery action: ${action}`)
    }
  }

  // Control methods
  pause(): boolean {
    // За мониторинг на flow control operations - pause, resume, stop coordination
    if (!this.context) return false
    this.context.pause()
    return this.systemStateManager.pauseExecution()
  }

  resume(): boolean {
    if (!this.context) return false
    const success = this.systemStateManager.resumeExecution()
    if (success) {
      this.context.resume()
    }
    return success
  }

  stop(): boolean {
    this.isExecuting = false
    if (this.context) {
      this.context.stop()
    }
    return this.systemStateManager.stopExecution()
  }

  // Status methods
  getExecutionContext(): ExecutionContext | undefined {
    return this.context
  }

  isFlowExecuting(): boolean {
    return this.isExecuting
  }

  // Pause waiting mechanism
  private async waitForResumeOrStop(): Promise<void> {
    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        // Check if resumed or stopped
        if (!this.context?.isPaused || this.context?.isStopped) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100) // Check every 100ms
    })
  }

  // Sync ActiveProgram status in database
  private async syncActiveProgramStatus(status: string, reason: string): Promise<void> {
    // За мониторинг на ActiveProgram status synchronization - database status updates със timestamp management
    try {
      // Get programId from execution context variables
      const programId = this.context?.getVariable('programId')
      if (!programId) {
        console.warn(`⚠️ [FlowInterpreter] Cannot sync ActiveProgram status - no programId found`)
        return
      }

      // Update ActiveProgram status in database
      const { ActiveProgram } = await import('../../../models/ActiveProgram')
      const activeProgram = await ActiveProgram.findById(programId)
      
      if (activeProgram) {
        const previousStatus = activeProgram.status
        activeProgram.status = status as any
        
        // Set timestamp based on status
        if (status === 'paused') {
          activeProgram.pausedAt = new Date()
        } else if (status === 'stopped') {
          activeProgram.stoppedAt = new Date()
          activeProgram.pausedAt = undefined
        }
        
        await activeProgram.save()
        console.log(`🔄 [FlowInterpreter] ActiveProgram status updated: ${previousStatus} → ${status} (${reason})`)
      } else {
        console.warn(`⚠️ [FlowInterpreter] ActiveProgram not found: ${programId}`)
      }
    } catch (error) {
      console.error(`❌ [FlowInterpreter] Failed to sync ActiveProgram status:`, error)
    }
  }

  private broadcastFlowStatusEvent(status: 'paused' | 'resumed' | 'stopped', blockId?: string): void {
    try {
      const actionTemplateId = this.context?.getVariable('actionTemplateId')
      const sessionId = this.context?.getVariable('sessionId')

      this.webSocketManager.broadcast({
        type: 'flow_status_changed',
        timestamp: new Date().toISOString(),
        data: {
          status,
          actionTemplateId,
          executionSessionId: sessionId,
          blockId
        }
      })

      console.log(`📡 [FlowInterpreter] Broadcasted flow status: ${status}`)
    } catch (error) {
      console.error('Failed to broadcast flow status event:', error)
    }
  }

  /**
   * 🚩 NEW: Прескача към system.end блок за естествено приключване на потока
   */
  private async jumpToEndBlock(): Promise<boolean> {
    // За мониторинг на graceful cancellation - jump to system.end block за natural flow completion
    if (!this.executionGraph || !this.context) {
      console.warn(`⚠️ [FlowInterpreter] Cannot jump to end block - execution not initialized`)
      return true // Приключва като успешно
    }

    // Търси system.end блок в потока
    let endBlockId: string | null = null
    for (const [blockId, block] of this.executionGraph.blocks) {
      if (block.definitionId === 'system.end') {
        endBlockId = blockId
        break
      }
    }

    if (!endBlockId) {
      console.log(`🏁 [FlowInterpreter] No system.end block found - ending execution naturally`)
      this.context.addLog('Flow execution cancelled - no end block found', LogLevel.INFO)
      return true
    }

    console.log(`🚩→🏁 [FlowInterpreter] Jumping to system.end block: ${endBlockId}`)
    this.context.addLog(`Execution cancelled - jumping to end block (${this.cancellationToken.getCancellationReason()})`, LogLevel.INFO)
    
    try {
      // Изпълни end блока директно
      const endBlock = this.executionGraph.blocks.get(endBlockId)!
      await this.systemStateManager.updateCurrentBlock(endBlockId, 'Cancelled - executing end block')
      
      const result = await this.executeBlock(endBlock)
      
      if (result.success) {
        console.log(`🏁 [FlowInterpreter] End block executed successfully - flow completed gracefully`)
        
        this.context.addLog('Flow completed at end block (cancelled)', LogLevel.INFO)
        return true
      } else {
        console.warn(`⚠️ [FlowInterpreter] End block execution failed, but flow will complete anyway`)
        return true // Все пак приключва като успешно
      }
    } catch (error) {
      console.error(`❌ [FlowInterpreter] Error executing end block:`, error)
      return true // Все пак приключва като успешно за да не блокира системата
    }
  }

  // Block execution tracking helpers
  private async startBlockExecutionTracking(blockId: string, blockName: string, blockType: string): Promise<void> {
    try {
      const executionId = this.context?.getVariable('executionId') || this.context?.getVariable('executionSessionId')
      if (!executionId) {
        console.warn(`⚠️ [FlowInterpreter] No execution ID available for block tracking`)
        return
      }

      // Get the ActionTemplate name for flowName - this should always be provided
      const flowName = this.context?.getVariable('actionTemplateName')
      if (!flowName) {
        console.warn(`⚠️ [FlowInterpreter] No actionTemplateName in context for block tracking`)
        return
      }

      const response = await fetch(`http://localhost:5000/api/v1/execution-sessions/${executionId}/blocks/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blockId,
          blockName,
          blockType,
          flowName
        })
      })

      if (!response.ok) {
        console.warn(`⚠️ [FlowInterpreter] Failed to start block tracking: ${response.statusText}`)
      } else {
        console.log(`📝 [FlowInterpreter] Block execution started: ${blockId} (${blockName})`)
      }
    } catch (error) {
      console.warn(`⚠️ [FlowInterpreter] Error starting block tracking:`, error)
    }
  }

  private async completeBlockExecutionTracking(blockId: string, outputData: any, duration: number): Promise<void> {
    try {
      const executionId = this.context?.getVariable('executionId') || this.context?.getVariable('executionSessionId')
      if (!executionId) {
        console.warn(`⚠️ [FlowInterpreter] No execution ID available for block tracking`)
        return
      }

      // Get the ActionTemplate name for flowName - this should always be provided
      const flowName = this.context?.getVariable('actionTemplateName')
      if (!flowName) {
        console.warn(`⚠️ [FlowInterpreter] No actionTemplateName in context for block completion tracking`)
        return
      }

      const response = await fetch(`http://localhost:5000/api/v1/execution-sessions/${executionId}/blocks/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          blockId,
          outputData,
          duration,
          flowName
        })
      })

      if (!response.ok) {
        console.warn(`⚠️ [FlowInterpreter] Failed to complete block tracking: ${response.statusText}`)
      } else {
        console.log(`✅ [FlowInterpreter] Block execution completed: ${blockId} (${duration}ms)`)
      }
    } catch (error) {
      console.warn(`⚠️ [FlowInterpreter] Error completing block tracking:`, error)
    }
  }


  getStatus() {
    return {
      isExecuting: this.isExecuting,
      contextStatus: this.context?.getStatus(),
      systemState: this.systemStateManager.getCurrentState(),
      graphLoaded: !!this.executionGraph
    }
  }
}