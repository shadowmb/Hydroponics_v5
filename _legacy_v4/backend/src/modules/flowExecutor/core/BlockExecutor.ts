// BlockExecutor.ts - The worker that executes individual blocks

import {
  BlockNode,
  ExecutionResult,
  ExecutionError,
  ErrorType,
  ErrorSeverity,
  BlockType,
  LogLevel,
  LoopType,
  ComparisonOperator
} from '../types'
import { ExecutionContext } from './ExecutionContext'
import { WebSocketManager } from './WebSocketManager'
import { evaluateConditionConfig, loadToleranceValue, evaluateCondition } from '../helpers/evaluateCondition'
import { shouldContinueLoop, createLoopState, incrementLoopIteration } from '../helpers/loopController'
import { HardwareService, HardwareError, ErrorMapper } from '../../../hardware'
import { StartupService } from '../../../services/StartupService'
import { CancellationToken } from './CancellationToken'
import { Device } from '../../../models/Device'
import { UnifiedLoggingService } from '../../../services/UnifiedLoggingService'
import { notificationService } from '../../../services/NotificationService'
import { ErrorNotificationSettings } from '../../../models/ErrorNotificationSettings'
import { HeartbeatService } from '../../../services/HeartbeatService'
// @ts-ignore - fetch is available globally in Node.js 18+

// Block handler function type
type BlockHandler = (
  block: BlockNode,
  context: ExecutionContext,
  executor: BlockExecutor
) => Promise<ExecutionResult>

export class BlockExecutor {
  private handlers = new Map<string, BlockHandler>()
  private startupService: StartupService
  private cancellationToken: CancellationToken
  private lastErrorNotifications = new Map<string, number>()
  private context?: ExecutionContext

  constructor(
    private hardwareService?: HardwareService,
    private alertService?: any,
    private blockStates?: Map<string, { iterations: number; completed?: boolean }>,
    cancellationToken?: CancellationToken
  ) {
    this.registerHandlers()
    this.startupService = StartupService.getInstance()
    this.cancellationToken = cancellationToken || new CancellationToken()
  }

  // Reset block states for new flow execution
  resetBlockStates(): void {
    if (this.blockStates) {
      this.blockStates.clear()
    }
  }

  /**
   * Прекъсваемо чакане - намалява времето на 2 секунди при cancellation
   * @param durationMs Време за чакане в милисекунди
   * @param actionName Име на действието за логов
   */
  private async cancellableWait(durationMs: number, actionName?: string): Promise<void> {
    // За мониторинг на cancellation handling - graceful interruption със timeout reduction
    const startTime = Date.now()
    const checkInterval = 1000 // Проверява всяка секунда
    let actualDuration = durationMs

    while (Date.now() - startTime < actualDuration) {
      // 🚩 КЛЮЧОВ МОМЕНТ: Проверява за cancellation флаг
      if (this.cancellationToken.isCancelled()) {
        const elapsed = Date.now() - startTime
        const remainingTime = actualDuration - elapsed

        if (remainingTime > 2000) {
          // Ако остават повече от 2 секунди, съкращава до 2 секунди
          console.log(`🚩 [BlockExecutor] Cancellation detected during ${actionName || 'wait'} - shortening from ${Math.round(remainingTime/1000)}s to 2s`)
          actualDuration = elapsed + 2000 // Спира след 2 секунди от сега
        }
        // Ако остават под 2 секунди, продължава нормално за да завърши
      }

      // Чака до 1 секунда или до края на времето
      const timeLeft = actualDuration - (Date.now() - startTime)
      const waitTime = Math.min(checkInterval, Math.max(0, timeLeft))
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  // Main execution method
  async execute(
    block: BlockNode,
    context: ExecutionContext,
    hasCustomNotification?: boolean
  ): Promise<ExecutionResult> {
    // За мониторинг на block execution lifecycle - main execution flow със timeout и error handling
    // Store context reference for error notification access
    this.context = context
    // Record block start in database for sensor/actuator blocks
    if (block.definitionId === 'sensor' || block.definitionId === 'actuator') {
      const blockData = this.prepareBlockStartData(block, context)
      

      // 🚀 NOTE: Block recording moved to completion phase to avoid duplication
    }
    
    const handler = this.handlers.get(block.definitionId)
    
    if (!handler) {
      const error: ExecutionError = {
        type: ErrorType.INVALID_BLOCK_TYPE,
        severity: ErrorSeverity.HIGH,
        message: `Unknown block type: ${block.definitionId}`,
        blockId: block.id,
        timestamp: new Date()
      }
      
      context.addError(error)
      return {
        success: false,
        outputPort: 'onErrorOut',
        error
      }
    }

    try {
      context.addLog(`Executing block: ${block.definitionId}`, LogLevel.DEBUG, block.id)
      
      const blockStartTime = new Date()
      const startTime = Date.now()
      const result = await this.executeWithTimeout(handler, block, context, 600000) // 10min timeout - TODO: IMPLEMENT_LATER - Make configurable from global settings
      const executionTime = Date.now() - startTime
      
      context.addLog(
        `Block executed in ${executionTime}ms: ${result.success ? 'SUCCESS' : 'FAILED'}`,
        result.success ? LogLevel.INFO : LogLevel.ERROR,
        block.id
      )
      
      // Record block completion in database
      if (block.definitionId === 'sensor' || block.definitionId === 'actuator') {

        // 🚀 NEW: Record complete block execution in ExecutionSession (block-specific approach)
        const executionSessionId = context.getVariable('executionSessionId')
        if (executionSessionId) {
          try {
            await this.recordBlockInExecutionSession(
              executionSessionId,
              block,
              result,
              blockStartTime,
              executionTime,
              context
            )
          } catch (error) {
            console.warn('Failed to record block in ExecutionSession:', error)
          }
        }
      }
      
      return result
      
    } catch (error) {
      return this.handleExecutionError(error as Error, block, context, hasCustomNotification)
    }
  }

  // Execute with timeout protection
  private async executeWithTimeout(
    handler: BlockHandler,
    block: BlockNode,
    context: ExecutionContext,
    timeoutMs: number
  ): Promise<ExecutionResult> {
    return Promise.race([
      handler(block, context, this),
      new Promise<ExecutionResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Block execution timeout after ${timeoutMs}ms`))
        }, timeoutMs)
      })
    ])
  }

  // Register all block handlers
  private registerHandlers(): void {
    // Data blocks
    this.handlers.set(BlockType.SENSOR, this.handleSensorBlock.bind(this))
    this.handlers.set(BlockType.SET_VAR_NAME, this.handleSetVarNameBlock.bind(this))
    this.handlers.set(BlockType.SET_VAR_DATA, this.handleSetVarDataBlock.bind(this))
    
    // Action blocks
    this.handlers.set(BlockType.ACTUATOR, this.handleActuatorBlock.bind(this))
    this.handlers.set(BlockType.WAIT, this.handleWaitBlock.bind(this))
    
    // Logic blocks
    this.handlers.set(BlockType.IF, this.handleIfBlock.bind(this))
    this.handlers.set(BlockType.LOOP, this.handleLoopBlock.bind(this))
    this.handlers.set(BlockType.GOTO, this.handleGotoBlock.bind(this))
    this.handlers.set('merge', this.handleMergeBlock.bind(this))
    
    // System blocks
    this.handlers.set('system.start', this.handleSystemStartBlock.bind(this))
    this.handlers.set('system.end', this.handleSystemEndBlock.bind(this))
    
    // Support blocks
    this.handlers.set(BlockType.ERROR_HANDLER, this.handleErrorHandlerBlock.bind(this))
  }

  // Actuator block handler
  private async handleActuatorBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    // За мониторинг на actuator control - device command execution със timed operations
    const {
      deviceId,
      actionType,
      duration: blockDuration = 0,
      powerLevel = 0,
      powerFrom = 0,
      powerTo = 0,
      useGlobalVariable = false,
      selectedGlobalVariable = 'globalVar1',
      stopOnDisconnect = true
    } = block.parameters
    
    // DEBUG: Test what parameters are being passed
    // console.log(`[BlockExecutor DEBUG] Actuator parameters:`, {
    //   useGlobalVariable,
    //   selectedGlobalVariable,
    //   blockDuration
    // })
    
    // Use global variable only if explicitly enabled
    let duration = blockDuration
    if (useGlobalVariable) {
      const globalDuration = context.getVariable(selectedGlobalVariable)
      if (globalDuration !== undefined) {
        duration = globalDuration
        context.addLog(
          `Using global variable ${selectedGlobalVariable} for duration: ${duration}s`, 
          LogLevel.INFO, 
          block.id
        )
      }
    }
    
    if (!deviceId || !actionType) {
      throw new Error('Actuator block requires deviceId and actionType parameters')
    }

    try {
      //console.log(`[BlockExecutor DEBUG] Starting actuator block for device: ${deviceId}`)
      
      // First check if we have persistent connection via StartupService
      const deviceData = await this.getDeviceData(deviceId)
      console.log(`[BlockExecutor DEBUG] Device data loaded:`, deviceData)
      
      if (!deviceData) {
        throw new Error(`Device ${deviceId} not found`)
      }
      
      const controllerId = deviceData.controllerId.toString()
      //console.log(`[BlockExecutor DEBUG] Controller ID: ${controllerId}`)
      
      const hasStartupConnection = this.startupService.isControllerConnected(controllerId)
      //console.log(`[BlockExecutor DEBUG] StartupService connection status: ${hasStartupConnection}`)
      //console.log(`[BlockExecutor DEBUG] HardwareService available: ${!!this.hardwareService}`)
      
      if (hasStartupConnection) {
        //console.log(`[BlockExecutor DEBUG] Using StartupService path`)
        // Use StartupService persistent connection
        const command = this.createActuatorCommand(deviceData, actionType, duration, powerLevel, powerFrom, powerTo, stopOnDisconnect)
       // console.log(`[BlockExecutor DEBUG] Command created:`, command)
        
        const response = await this.startupService.sendCommand(controllerId, command)
        //console.log(`[BlockExecutor DEBUG] StartupService response:`, response)

        if (response.ok === 1) {
          // Track pin state for heartbeat flow mode protection
          this.trackPinStateChange(controllerId, actionType)
          // Handle timed operations (on_off_timed and off_on_timed)
          if ((actionType === 'on_off_timed' || actionType === 'off_on_timed') && duration > 0) {
            //console.log(`[BlockExecutor DEBUG] Executing timed operation: ${actionType} for ${duration}s`)
            
            // 🚩 NEW: Използвай cancellableWait вместо директно setTimeout
            await this.cancellableWait(duration * 1000, `${actionType}_${deviceData.name}`)
            
            // Send opposite command
            const oppositeAction = actionType === 'on_off_timed' ? 'off' : 'on'
            const oppositeCommand = this.createActuatorCommand(deviceData, oppositeAction, 0, powerLevel, powerFrom, powerTo, stopOnDisconnect)
            //console.log(`[BlockExecutor DEBUG] Sending opposite command:`, oppositeCommand)
            
            const oppositeResponse = await this.startupService.sendCommand(controllerId, oppositeCommand)
            //console.log(`[BlockExecutor DEBUG] Opposite command response:`, oppositeResponse)

            // Track opposite pin state for heartbeat
            if (oppositeResponse.ok === 1) {
              this.trackPinStateChange(controllerId, oppositeAction)
            }

            if (oppositeResponse.ok !== 1) {
              //console.warn(`[BlockExecutor DEBUG] Opposite command failed: ${oppositeResponse.error}`)
            }
          }
          
          // Return a success result to the FlowInterpreter
          return {
              success: true,
              outputPort: 'flowOut',
              data: {
                  deviceId,
                  deviceName: deviceData.name,
                  actionType,
                  duration,
                  powerLevel,
                  powerFrom,
                  powerTo,
                  hardwareState: response.data?.hardwareState
              }
          }
        } else {
          // The response indicates an error
          const errorMessage = response.message || response.error || 'Unknown device error'
          
          // Throw an error that the FlowInterpreter can catch
          throw new Error(`Arduino command failed: ${errorMessage}`)
        }
      } else if (this.hardwareService) {
        //console.log(`[BlockExecutor DEBUG] Using HardwareService fallback path`)
        // Fallback to HardwareService
        await this.hardwareService.controlDevice(deviceId, actionType, duration)
        context.addLog(`HardwareService fallback: ${deviceId} ${actionType} for ${duration}s`, LogLevel.INFO, block.id)
        
        if (duration > 0) {
          console.log(`[BlockExecutor DEBUG] Waiting ${duration} seconds...`)
          // 🚩 NEW: Използвай cancellableWait вместо директно setTimeout  
          await this.cancellableWait(duration * 1000, `hardware_fallback_${deviceData.name}`)
          console.log(`[BlockExecutor DEBUG] Wait completed`)
        }
      } else {
        // TODO: FUTURE - Add configuration option to allow simulation mode for testing/development
        // For now, fail execution if no hardware connection is available to ensure reliability
        //console.log(`[BlockExecutor DEBUG] No hardware connection available - failing execution`)
        throw new Error(`No hardware connection available for device ${deviceData.name} (${deviceId}). Controller ${controllerId} is not connected and HardwareService is not available.`)
      }

      console.log(`[BlockExecutor DEBUG] Actuator block completed successfully`)
      return {
        success: true,
        outputPort: 'flowOut',
        data: {
          deviceId,
          deviceName: deviceData.name,
          actionType,
          duration,
          powerLevel,
          powerFrom,
          powerTo
        }
      }
      
    } catch (error) {
      let execError: ExecutionError
      
      if (error instanceof HardwareError) {
        // Map HardwareError to FlowExecutor ErrorType
        const mappedError = ErrorMapper.mapToFlowExecutorError(error)
        execError = {
          ...mappedError,
          blockId: block.id
        }
      } else {
        // Generic error fallback
        execError = {
          type: ErrorType.DEVICE_NOT_RESPONDING,
          severity: ErrorSeverity.HIGH,
          message: `Device ${deviceId} failed: ${(error as Error).message}`,
          blockId: block.id,
          timestamp: new Date()
        }
      }
      
      context.addError(execError)
      
      // Note: Notification logic handled by main error handler - these are old paths that should be refactored
      
      return {
        success: false,
        outputPort: 'onErrorOut',
        error: execError
      }
    }
  }

  // === BLOCK HANDLERS ===

  // Sensor block handler
  private async handleSensorBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    // За мониторинг на sensor data reading - hardware communication със fallback logic
    const { deviceId, timeout = 5000, monitoringTagId } = block.parameters
    
    if (!deviceId) {
      throw new Error('Sensor block requires deviceId parameter')
    }

    // Get variable name from setVarNameIn connection  
    // TODO: IMPLEMENT_LATER - Get variable name from connection
    // For now, use a default variable name or get from parameters
    const variableName = 'var1' // Default variable name used in flow

    try {
      // Get device data from database  
      const deviceData = await this.getDeviceData(deviceId)
      if (!deviceData) {
        throw new Error(`Device ${deviceId} not found`)
      }

      // Convert device type to sensor type
      const sensorType = this.convertDeviceTypeToSensorType(deviceData.type)
      
      let sensorValue: any
      
      // Use device data already loaded above
      const controllerId = deviceData.controllerId.toString()
      const hasStartupConnection = this.startupService.isControllerConnected(controllerId)
      
      if (hasStartupConnection) {
        // Use StartupService persistent connection with template-based execution
        const command = this.createSensorCommand(deviceData, 'read')
        const response = await this.startupService.sendCommand(controllerId, command)

        if (response.ok === 1 && response.value !== undefined) {
          sensorValue = response.value
          context.addLog(
            `StartupService: ${deviceId} (${sensorType}) = ${sensorValue} - SUCCESS`, 
            LogLevel.INFO, 
            block.id
          )
        } else {
          throw new Error(`Arduino sensor read failed: ${response.error || response.message}`)
        }
      } else if (this.hardwareService) {
        // Fallback to HardwareService
        sensorValue = await this.hardwareService.readSensor(deviceId)
        context.addLog(
          `HardwareService fallback: ${deviceId} (${sensorType}) = ${sensorValue}`, 
          LogLevel.INFO, 
          block.id
        )
      } else {
        // TODO: FUTURE - Add configuration option to allow mock sensor values for testing/development
        // For now, fail execution if no hardware connection is available to ensure reliability
        throw new Error(`No hardware connection available for sensor ${deviceData.name} (${deviceId}). Controller ${controllerId} is not connected and HardwareService is not available.`)
      }

      // Store value in variable if specified
      if (variableName) {
        context.setVariable(variableName, sensorValue, {
          displayName: `${deviceData.name} Reading`,
          type: 'number',
          source: block.id,
          unit: this.getSensorUnit(sensorType)
        })
      }

      // ✨ MONITORING SYSTEM INTEGRATION - Save data if monitoringTagId is present
      if (monitoringTagId) {
        try {
          // Import MonitoringData model dynamically to avoid circular imports
          const { MonitoringData } = await import('../../../models/MonitoringData')
          
          const monitoringRecord = new MonitoringData({
            tagId: monitoringTagId,
            value: sensorValue,
            timestamp: new Date(),
            flowId: context.getVariable('flowId') || 'unknown',
            blockId: block.id,
            programId: context.getVariable('programId'),
            cycleId: context.getVariable('cycleId')
          })
          
          await monitoringRecord.save()
          
          context.addLog(
            `Monitoring data saved: tag=${monitoringTagId}, value=${sensorValue}`,
            LogLevel.INFO,
            block.id
          )
          
        } catch (monitoringError) {
          // Don't fail the sensor execution if monitoring save fails
          context.addLog(
            `Warning: Failed to save monitoring data: ${(monitoringError as Error).message}`,
            LogLevel.WARN,
            block.id
          )
        }
      }

      return {
        success: true,
        outputPort: 'flowOut',
        data: {
          deviceId,
          deviceType: deviceData.type,
          sensorType,
          value: sensorValue,
          unit: deviceData.unit,
          controller: deviceData.controllerId,
          ports: deviceData.ports,
          monitoringRecorded: !!monitoringTagId
        }
      }
      
    } catch (error) {
      let execError: ExecutionError
      
      if (error instanceof HardwareError) {
        // Map HardwareError to FlowExecutor ErrorType
        const mappedError = ErrorMapper.mapToFlowExecutorError(error)
        execError = {
          ...mappedError,
          blockId: block.id
        }
      } else {
        // Generic error fallback
        execError = {
          type: ErrorType.SENSOR_TIMEOUT,
          severity: ErrorSeverity.MEDIUM,
          message: `Sensor device ${deviceId} failed: ${(error as Error).message}`,
          blockId: block.id,
          timestamp: new Date()
        }
      }
      
      context.addError(execError)
      
      // Note: Notification logic handled by main error handler - these are old paths that should be refactored
      
      return {
        success: false,
        outputPort: 'onErrorOut',
        error: execError
      }
    }
  }

  // SetVarName block handler
  private async handleSetVarNameBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { internalVar, displayName, dataType = 'auto' } = block.parameters
    
    if (!internalVar) {
      throw new Error('SetVarName block requires internalVar parameter')
    }

    // Declare variable (without value)
    context.setVariable(internalVar, undefined, {
      displayName: displayName || internalVar,
      type: dataType === 'auto' ? 'number' : dataType,
      source: block.id
    })

    context.addLog(`Variable declared: ${internalVar} (${displayName || internalVar})`, LogLevel.INFO, block.id)

    return {
      success: true,
      outputPort: 'setVarNameOut',
      data: { variableName: internalVar }
    }
  }

  // SetVarData block handler
  private async handleSetVarDataBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { variableName, value, sourceVariable } = block.parameters
    
    if (!variableName) {
      throw new Error('SetVarData block requires variableName parameter')
    }

    let finalValue = value
    
    // If sourceVariable is specified, get value from it
    if (sourceVariable) {
      finalValue = context.getVariable(sourceVariable)
      if (finalValue === undefined) {
        throw new Error(`Source variable ${sourceVariable} not found`)
      }
    }

    context.setVariable(variableName, finalValue)
    context.addLog(`Variable set: ${variableName} = ${finalValue}`, LogLevel.INFO, block.id)

    return {
      success: true,
      outputPort: 'flowOut',
      data: { variableName, value: finalValue }
    }
  }

  // IF block handler
  private async handleIfBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { 
      conditions, 
      selectedGlobalVariable, 
      useGlobalVariable, 
      comparisonValue,
      manualComparisonValue,
      toleranceTagId
    } = block.parameters
    
    if (!conditions || !conditions[0]) {
      throw new Error('IF block requires conditions array')
    }

    const condition = conditions[0]
    const operator = condition.condition // greater_equal, less_than, etc.
    const leftVariable = 'var1' // Local variable from sensor
    const rightValue = useGlobalVariable ? 
      context.getVariable(selectedGlobalVariable) : 
      (comparisonValue || manualComparisonValue || 0)
    const dataType = condition.dataType || 'number'

    // Load tolerance value from database
    const tolerance = await loadToleranceValue(toleranceTagId)
    
    const variables = context.getVariables()
    const leftValue = variables[leftVariable]
    
    // Use direct evaluation with tolerance support
    const result = evaluateCondition(
      leftValue,
      operator,
      rightValue,
      dataType,
      tolerance
    )
    
    context.addLog(
      `IF condition: ${leftVariable}(${leftValue}) ${operator} ${rightValue} (tolerance: ±${tolerance}) = ${result}`,
      LogLevel.INFO,
      block.id
    )

    return {
      success: true,
      outputPort: result ? 'flowOutTrue' : 'flowOutFalse',
      data: { conditionResult: result, leftValue, operator, rightValue, tolerance }
    }
  }

  // LOOP block handler
  private async handleLoopBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const {
      maxIterations,
      delay = 0,
      conditions,
      selectedGlobalVariable,
      useGlobalVariable,
      comparisonValue,
      manualConditionValue,
      toleranceTagId
    } = block.parameters
    
    // Initialize or get existing block state for persistent iteration tracking
    if (!this.blockStates) {
      this.blockStates = new Map<string, { iterations: number; completed?: boolean }>()
    }
    
    if (!this.blockStates.has(block.id)) {
      this.blockStates.set(block.id, { iterations: 0, completed: false })
    }
    
    const blockState = this.blockStates.get(block.id)!
    
    // If loop was previously completed, exit through flowOut immediately
    if (blockState.completed) {
      context.addLog(`Loop already completed: exiting through flowOut`, LogLevel.INFO, block.id)
      return {
        success: true,
        outputPort: 'flowOut',
        data: { finalIteration: blockState.iterations, alreadyCompleted: true }
      }
    }
    
    // Check if we've reached the maximum iterations before processing
    if (maxIterations && blockState.iterations >= maxIterations) {
      // Mark as completed for future visits
      blockState.completed = true
      context.addLog(`Loop completed: reached max iterations (${maxIterations})`, LogLevel.INFO, block.id)
      return {
        success: true,
        outputPort: 'flowOut',
        data: { finalIteration: blockState.iterations, completed: true }
      }
    }
    
    // Get or create loop state for condition checking
    let loopState = context.getActiveLoop(block.id)
    
    if (!loopState) {
      // Extract condition from conditions array (new format)
      let condition = undefined

      if (conditions && conditions[0]) {
        const operator = conditions[0].condition
        const dataType = (conditions[0].dataType || 'number') as 'number' | 'string' | 'boolean'

        condition = {
          leftVariable: 'var1', // Local variable from sensor
          operator: operator as ComparisonOperator,
          rightValue: useGlobalVariable ?
            context.getVariable(selectedGlobalVariable) :
            (comparisonValue || manualConditionValue || 0),
          dataType: dataType
        }
      }
      
      // First time - create loop state
      loopState = createLoopState(block.id, LoopType.WHILE, {
        maxIterations,
        condition,
        delay
      })
      
      context.addActiveLoop(loopState)
      context.enterLoopContext(block.id)
      context.addLog(`Loop started: conditional (max: ${maxIterations || 'unlimited'})`, LogLevel.INFO, block.id)
    }

    // Check condition if present
    let tolerance = 0
    let conditionEvaluated = false
    let conditionDetails = {}
    
    if (loopState.condition) {
      const variables = context.getVariables()
      
      // Load tolerance value for condition evaluation
      tolerance = await loadToleranceValue(block.parameters.toleranceTagId)
      
      // Evaluate condition with tolerance support
      const leftValue = variables[loopState.condition.leftVariable]
      const conditionResult = evaluateCondition(
        leftValue,
        loopState.condition.operator,
        loopState.condition.rightValue,
        loopState.condition.dataType,
        tolerance
      )
      
      conditionEvaluated = true
      conditionDetails = {
        leftValue,
        operator: loopState.condition.operator,
        rightValue: loopState.condition.rightValue,
        result: conditionResult
      }

      if (conditionResult) {
        // Condition met - exit loop and mark as completed
        blockState.completed = true
        context.removeActiveLoop(block.id)
        context.exitLoopContext(block.id)
        context.addLog(
          `Loop ended by condition: ${loopState.condition.leftVariable}(${leftValue}) ${loopState.condition.operator} ${loopState.condition.rightValue} (tolerance: ±${tolerance}) = true`,
          LogLevel.INFO,
          block.id
        )

        return {
          success: true,
          outputPort: 'flowOut',
          data: { finalIteration: blockState.iterations, condition_met: true, tolerance, conditionDetails }
        }
      } else {
        context.addLog(
          `Loop condition: ${loopState.condition.leftVariable}(${leftValue}) ${loopState.condition.operator} ${loopState.condition.rightValue} (tolerance: ±${tolerance}) = false, continuing`,
          LogLevel.DEBUG,
          block.id
        )
      }
    }
    
    // Continue loop - increment persistent iteration counter
    blockState.iterations++
    context.addLog(
      `Loop iteration ${blockState.iterations}/${maxIterations || '∞'}: continuing`,
      LogLevel.INFO,
      block.id
    )
    
    // Apply delay if specified
    if (delay > 0) {
      // 🚩 NEW: Използвай cancellableWait вместо директно setTimeout
      await this.cancellableWait(delay * 1000, `loop_delay_${delay}s`)
    }
    
    return {
      success: true,
      outputPort: 'loopOut',
      data: {
        iteration: blockState.iterations,
        maxIterations: maxIterations,
        continuing: true,
        ...(conditionEvaluated && { tolerance, conditionDetails })
      }
    }
  }

  // WAIT block handler
  private async handleWaitBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { duration } = block.parameters
    
    if (!duration || duration <= 0) {
      throw new Error('WAIT block requires positive duration parameter')
    }

    context.addLog(`Waiting for ${duration} seconds...`, LogLevel.INFO, block.id)
    
    // 🚩 NEW: Използвай cancellableWait вместо директно setTimeout
    await this.cancellableWait(duration * 1000, `wait_block_${duration}s`)
    
    context.addLog(`Wait completed`, LogLevel.INFO, block.id)

    return {
      success: true,
      outputPort: 'flowOut',
      data: { duration }
    }
  }

  // GOTO block handler
  private async handleGotoBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { targetBlockId } = block.parameters
    
    if (!targetBlockId) {
      throw new Error('GOTO block requires targetBlockId parameter')
    }

    context.addLog(`Redirecting to block: ${targetBlockId}`, LogLevel.INFO, block.id)

    return {
      success: true,
      outputPort: 'REDIRECT',
      data: { targetBlockId }
    }
  }

  // System start block handler
  private async handleSystemStartBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    context.addLog('Flow execution started', LogLevel.INFO, block.id)
    
    return {
      success: true,
      outputPort: 'flowOut',
      data: { systemBlock: true }
    }
  }

  // System end block handler
  private async handleSystemEndBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    context.addLog('Flow execution completed', LogLevel.INFO, block.id)
    
    return {
      success: true,
      outputPort: '', // No output port for end blocks
      data: { systemBlock: true }
    }
  }

  // Merge block handler
  private async handleMergeBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    context.addLog('Merge: combining flows', LogLevel.INFO, block.id)
    
    return {
      success: true,
      outputPort: 'flowOut',
      data: { merged: true }
    }
  }

  // ErrorHandler block handler
  private async handleErrorHandlerBlock(
    block: BlockNode,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    // За мониторинг на error handling - ErrorHandler block processing със recovery actions
    const { 
      errorStrategy = 'log_continue',
      maxRetries = 3,
      retryDelay = 5,
      retryFallback = 'fallback_stop',
      criticalErrors = '',
      recoveryActions = 'none',
      logLevel = 'criticalOnly',
      userMessage = ''
    } = block.parameters

    // Get the source error from context (should be passed by FlowInterpreter)
    const sourceError = context.getLastError()
    const sourceBlockId = sourceError?.blockId

    if (!sourceError || !sourceBlockId) {
      context.addLog('ErrorHandler: No source error found', LogLevel.WARN, block.id)
      return {
        success: true,
        outputPort: 'flowOut',
        data: { noError: true }
      }
    }

    context.addLog(
      `ErrorHandler: Processing ${sourceError.type} from block ${sourceBlockId}`,
      LogLevel.INFO,
      block.id
    )

    // Check if error is critical
    const criticalErrorTypes = criticalErrors.split(',').map((t: string) => t.trim().toUpperCase())
    const isCritical = criticalErrorTypes.includes(sourceError.type.toUpperCase())

    // Log the error according to logLevel
    if (logLevel === 'all' || (logLevel === 'criticalOnly' && isCritical)) {
      context.addLog(
        `Error logged: ${sourceError.message}`,
        isCritical ? LogLevel.ERROR : LogLevel.WARN,
        block.id
      )
    }

    // Send user notification if configured
    if (userMessage) {
      context.addLog(`User notification: ${userMessage}`, LogLevel.INFO, block.id)
    }

    // Apply recovery actions for critical errors
    if (isCritical && recoveryActions !== 'none') {
      await this.executeRecoveryAction(recoveryActions, context, block.id)
      
      if (recoveryActions === 'emergency_stop') {
        return {
          success: true,
          outputPort: 'flowOutStop',
          data: { critical: true, recoveryAction: recoveryActions }
        }
      }
    }

    // Apply error strategy
    switch (errorStrategy) {
      case 'log_continue':
        context.addLog('ErrorHandler: Continuing flow execution', LogLevel.INFO, block.id)
        return {
          success: true,
          outputPort: 'flowOut',
          data: { strategy: 'continue', sourceError: sourceError.type }
        }

      case 'log_stop':
        context.addLog('ErrorHandler: Stopping flow execution', LogLevel.INFO, block.id)
        return {
          success: true,
          outputPort: 'flowOutStop',
          data: { strategy: 'stop', sourceError: sourceError.type }
        }

      case 'retry':
        return await this.executeRetryLogic(
          sourceBlockId,
          maxRetries,
          retryDelay,
          retryFallback,
          context,
          block.id
        )

      default:
        context.addLog(`ErrorHandler: Unknown strategy ${errorStrategy}, defaulting to continue`, LogLevel.WARN, block.id)
        return {
          success: true,
          outputPort: 'flowOut',
          data: { strategy: 'continue_fallback', sourceError: sourceError.type }
        }
    }
  }

  // Execute recovery actions for critical errors
  private async executeRecoveryAction(
    action: string,
    context: ExecutionContext,
    blockId: string
  ): Promise<void> {
    switch (action) {
      case 'restart_module':
        context.addLog('Recovery: Restarting affected module', LogLevel.INFO, blockId)
        // TODO: IMPLEMENT_LATER - Module restart logic
        break

      case 'clear_context':
        context.addLog('Recovery: Clearing execution context', LogLevel.INFO, blockId)
        // Clear only user variables, keep system variables
        const variables = context.getVariables()
        Object.keys(variables).forEach(key => {
          if (!key.startsWith('system_') && !key.startsWith('global_')) {
            context.clearVariable(key)
          }
        })
        break

      case 'emergency_stop':
        context.addLog('Recovery: Executing emergency stop', LogLevel.ERROR, blockId)
        // TODO: IMPLEMENT_LATER - Emergency stop all hardware devices
        break

      default:
        context.addLog(`Recovery: Unknown action ${action}`, LogLevel.WARN, blockId)
    }
  }

  // Execute retry logic with fallback options
  private async executeRetryLogic(
    sourceBlockId: string,
    maxRetries: number,
    delay: number,
    fallback: string,
    context: ExecutionContext,
    errorHandlerBlockId: string
  ): Promise<ExecutionResult> {
    context.addLog(
      `ErrorHandler: Starting retry logic for block ${sourceBlockId} (max: ${maxRetries}, delay: ${delay}s)`,
      LogLevel.INFO,
      errorHandlerBlockId
    )

    // TODO: IMPLEMENT_LATER - Actual retry logic would require FlowInterpreter integration
    // For now, simulate retry attempts and return appropriate result
    
    // In real implementation, this would:
    // 1. Signal FlowInterpreter to retry the source block
    // 2. Track retry attempts across multiple executions
    // 3. Apply fallback strategy after all retries fail

    context.addLog(
      `ErrorHandler: Retry logic configured (implementation pending FlowInterpreter integration)`,
      LogLevel.INFO,
      errorHandlerBlockId
    )

    // For now, simulate fallback logic based on configured strategy
    context.addLog(
      `ErrorHandler: Simulating retry failure, applying fallback: ${fallback}`,
      LogLevel.INFO,
      errorHandlerBlockId
    )

    switch (fallback) {
      case 'fallback_continue':
        return {
          success: true,
          outputPort: 'flowOut',
          data: { 
            strategy: 'retry_fallback_continue', 
            sourceBlockId,
            maxRetries,
            delay,
            implementationPending: true
          }
        }

      case 'fallback_emergency':
        await this.executeRecoveryAction('emergency_stop', context, errorHandlerBlockId)
        return {
          success: true,
          outputPort: 'flowOutStop',
          data: { 
            strategy: 'retry_fallback_emergency', 
            sourceBlockId,
            recoveryAction: 'emergency_stop',
            implementationPending: true
          }
        }

      case 'fallback_stop':
      default:
        return {
          success: true,
          outputPort: 'flowOutStop',
          data: { 
            strategy: 'retry_fallback_stop', 
            sourceBlockId,
            maxRetries,
            delay,
            implementationPending: true
          }
        }
    }
  }

  // === UTILITY METHODS ===

  // Get device data from database
  private async getDeviceData(deviceId: string): Promise<any> {
    try {
      const device = await Device.findById(deviceId).populate('controllerId').exec()
      
      if (!device) {
        throw new Error(`Device with ID ${deviceId} not found`)
      }
      
      if (!device.isActive) {
        throw new Error(`Device ${device.name} is not active`)
      }
      
      return {
        _id: device._id,
        name: device.name,
        type: device.type,
        controllerId: device.controllerId._id || device.controllerId, // Handle both populated and non-populated
        ports: device.ports,
        isActive: device.isActive,
        relayLogic: device.relayLogic,
        settings: device.settings,
        unit: device.unit
      }
    } catch (error) {
      console.error(`[BlockExecutor] Error loading device ${deviceId}:`, error)
      throw error
    }
  }

  // Create actuator command for StartupService with semantic relay commands
  // Maps action types to semantic commands (ACTIVATE_RELAY/DEACTIVATE_RELAY),
  // then converts to hardware commands based on device relay logic
  // Create actuator command for StartupService - Template aware
  private createActuatorCommand(deviceData: any, actionType: string, duration: number, powerLevel: number = 0, powerFrom: number = 0, powerTo: number = 0, stopOnDisconnect: boolean = true): any {
    // Template-based execution: StartupService will handle template lookup and command mapping
    const command: any = {
      cmd: 'CONTROL_ACTUATOR', // Generic command, template determines actual execution
      deviceId: deviceData._id,
      actionType: actionType,
      duration: duration,
      powerLevel: powerLevel,
      powerFrom: powerFrom,
      powerTo: powerTo,
      stopOnDisconnect: stopOnDisconnect,
      timestamp: Date.now()
    }

    //console.log(`[BlockExecutor] Template-aware actuator command: ${actionType} for device ${deviceData._id}`)

    return command
  }

  // Create sensor command for StartupService - Template aware
  private createSensorCommand(deviceData: any, actionType: string): any {
    // Template-based execution: StartupService will handle template lookup and execution
    return {
      cmd: 'READ_SENSOR',
      deviceId: deviceData._id,
      actionType: actionType, // 'read' for sensor readings
      timestamp: Date.now()
    }
  }

  // Track pin state changes for heartbeat flow mode protection
  private trackPinStateChange(controllerId: string, actionType: string): void {
    const heartbeatService = HeartbeatService.getInstance()

    // Determine if action turns pin HIGH or LOW
    if (actionType === 'on' || actionType === 'on_off_timed') {
      heartbeatService.onPinHigh(controllerId)
    } else if (actionType === 'off' || actionType === 'off_on_timed') {
      heartbeatService.onPinLow(controllerId)
    }
    // Other action types (e.g., 'read') don't affect pin state
  }

  // Parse port string to number (D2 -> 2, A1 -> 1)
  private parsePort(portString: string): number {
    if (typeof portString === 'number') {
      return portString
    }
    
    if (typeof portString === 'string') {
      if (portString.startsWith('D') || portString.startsWith('A')) {
        return parseInt(portString.substring(1), 10)
      }
      return parseInt(portString, 10)
    }
    
    return 0
  }

  // Generate mock sensor values
  private getMockSensorValue(sensorType: string): number {
    const mockValues: Record<string, () => number> = {
      'ph': () => 6.5 + Math.random() * 1.5, // 6.5-8.0
      'ec': () => 1.0 + Math.random() * 1.5, // 1.0-2.5
      'temp': () => 20 + Math.random() * 10, // 20-30°C
      'humidity': () => 50 + Math.random() * 30, // 50-80%
      'water_level': () => Math.random() * 100 // 0-100%
    }
    
    const generator = mockValues[sensorType.toLowerCase()]
    return generator ? Math.round(generator() * 100) / 100 : Math.random() * 100
  }

  // Get sensor unit
  private getSensorUnit(sensorType: string): string {
    const units: Record<string, string> = {
      'ph': 'pH',
      'ec': 'mS/cm',
      'temp': '°C',
      'humidity': '%',
      'moisture': '%',
      'water_level': '%'
    }

    return units[sensorType.toLowerCase()] || ''
  }

  // Convert device type to sensor type for mock values
  private convertDeviceTypeToSensorType(deviceType: string): string {
    const typeMapping: Record<string, string> = {
      'ec_sensor': 'ec',
      'ph_sensor': 'ph',
      'temp_sensor': 'temp',
      'humidity_sensor': 'humidity',
      'moisture_sensor': 'moisture',
      'level_sensor': 'water_level',
      'flow_sensor': 'flow'
    }

    return typeMapping[deviceType] || deviceType.replace('_sensor', '')
  }

  // Get device type from device data (no longer needed, device data contains type)
  private getDeviceTypeFromDeviceData(deviceData: any): string {
    return deviceData.type || 'sensor'
  }

  // Handle execution errors
  private handleExecutionError(
    error: Error,
    block: BlockNode,
    context: ExecutionContext,
    hasCustomNotification?: boolean
  ): ExecutionResult {
    const execError: ExecutionError = {
      type: ErrorType.EXECUTION_TIMEOUT,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      blockId: block.id,
      timestamp: new Date(),
      stack: error.stack
    }
    
    context.addError(execError)
    
    // Record block failure in database
    if (block.definitionId === 'sensor' || block.definitionId === 'actuator') {
    }

    // Check if ErrorHandler will send custom notification
    if (hasCustomNotification) {
      console.log(`[BlockExecutor] Skipping automatic error notification for block ${block.id} - ErrorHandler with custom notification found`)
    } else {
      // No ErrorHandler with custom notification - send automatic notification
      this.sendErrorNotification(block, execError)
        .catch(notificationError => console.warn('Failed to send error notification:', notificationError))
    }
    
    return {
      success: false,
      outputPort: 'onErrorOut',
      error: execError
    }
  }

  // Send error notification based on block and error
  private async sendErrorNotification(block: BlockNode, error: ExecutionError): Promise<void> {
    // За мониторинг на error notification - automatic notification delivery със rate limiting
    try {
      // Get error notification settings
      const settings = await (ErrorNotificationSettings as any).getSettings()
      console.log(`[BlockExecutor] Error notification settings:  ${settings} )`)
      
      if (!settings?.globalSettings?.enabled) {
        return // Error notifications disabled globally
      }

      // Note: ErrorHandler notification check is now done before calling this method

      // Check block-specific settings first (legacy support)
      const blockSettings = settings.blockSpecificSettings?.get(block.id)
      if (blockSettings && !blockSettings.enabled) {
        return // Error notifications disabled for this specific block
      }

      // Check block type settings (new feature)
      const blockTypeSettings = settings.blockTypeSettings?.get(block.definitionId)
      if (blockTypeSettings && !blockTypeSettings.enabled) {
        return // Error notifications disabled for this block type
      }

      // If no block type settings, check if we should send automatic notifications
      if (!blockTypeSettings && !blockSettings) {
        return // No settings configured for this block type or specific block
      }

      // Determine settings to use (block-specific takes precedence over block type)
      const effectiveSettings = blockSettings || blockTypeSettings
      const rateLimitMinutes = effectiveSettings?.rateLimitMinutes || settings.globalSettings.rateLimitMinutes || 15
      const deliveryMethods = effectiveSettings?.deliveryMethods || settings.globalSettings.deliveryMethods || ['email']

      // Rate limiting - check if we sent a notification recently
      const lastNotificationKey = `error_notification_${block.id}`
      const now = Date.now()
      
      if (this.lastErrorNotifications.has(lastNotificationKey)) {
        const lastSent = this.lastErrorNotifications.get(lastNotificationKey)!
        const minutesSinceLastSent = (now - lastSent) / (1000 * 60)
        
        if (minutesSinceLastSent < rateLimitMinutes) {
          console.log(`[BlockExecutor] Error notification rate limited for block ${block.id} (${Math.round(minutesSinceLastSent)}/${rateLimitMinutes} minutes)`)
          return
        }
      }

      // Send notification with template if available
      if (blockTypeSettings?.messageTemplate) {
        // Use template-based notification for block types
        await notificationService.sendTemplateErrorNotification(
          block.id,
          block.definitionId,
          error.message,
          deliveryMethods,
          blockTypeSettings.messageTemplate
        )
      } else {
        // Use legacy notification for block-specific settings
        await notificationService.sendErrorNotification(
          block.id,
          block.definitionId,
          error.message,
          deliveryMethods
        )
      }

      // Update rate limiting timestamp
      this.lastErrorNotifications.set(lastNotificationKey, now)

      console.log(`[BlockExecutor] Error notification sent for block ${block.id} (${block.definitionId}): ${error.message}`)
    } catch (notificationError) {
      console.error('[BlockExecutor] Failed to send error notification:', notificationError)
    }
  }

  // === CONFIGURATION METHODS ===

  // Inject services (for testing or late initialization)
  setHardwareService(service: HardwareService): void {
    this.hardwareService = service
  }

  setAlertService(service: any): void {
    this.alertService = service
  }

  // Get available block types
  getAvailableBlockTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  // Note: ErrorHandler detection logic moved to FlowInterpreter for better data access

  // Check if block type is supported
  isBlockTypeSupported(definitionId: string): boolean {
    return this.handlers.has(definitionId)
  }

  // Prepare block start data for WebSocket broadcasting
  private prepareBlockStartData(block: BlockNode, context: ExecutionContext): any {
    if (block.definitionId === 'actuator') {
      const { 
        actionType, 
        duration: blockDuration = 0,
        useGlobalVariable = false,
        selectedGlobalVariable = 'globalVar1'
      } = block.parameters
      
      // Use global variable only if explicitly enabled
      let duration = blockDuration
      if (useGlobalVariable) {
        const globalDuration = context.getVariable(selectedGlobalVariable)
        if (globalDuration !== undefined) {
          duration = globalDuration
        }
      }
      
      return {
        actionType,
        duration,
        displayText: `Действие ${actionType} - ${duration} сек`
      }
    }
    
    if (block.definitionId === 'sensor') {
      const { deviceId } = block.parameters
      // Note: We can't easily make this async, so we'll use a generic message
      // The actual device name will be logged in the block execution
      return {
        deviceId,
        displayText: `Измерва сензор`
      }
    }
    
    return null
  }

  // Get sensor name for display
  private getSensorName(deviceType: string): string {
    const names: Record<string, string> = {
      'ec_sensor': 'ЕС',
      'ph_sensor': 'pH',
      'temp_sensor': 'температура',
      'humidity_sensor': 'влажност',
      'level_sensor': 'ниво на водата',
      'flow_sensor': 'дебит'
    }
    return names[deviceType] || 'сензор'
  }

  // 🚀 NEW: Record block execution with block-specific logic
  private async recordBlockInExecutionSession(
    executionSessionId: string,
    block: BlockNode,
    result: ExecutionResult,
    startTime: Date,
    duration: number,
    context: ExecutionContext
  ): Promise<void> {
    let blockData: any = {
      blockId: block.id,
      blockType: block.definitionId as 'sensor' | 'actuator' | 'logic' | 'system' | 'flow_control',
      status: result.success ? 'completed' : 'failed',
      startTime,
      endTime: new Date(),
      duration,
      errorMessage: result.success ? undefined : result.error?.message,
      inputData: block.parameters || null // Add block configuration as inputData
    }

    // Block-specific data extraction
    switch (block.definitionId) {
      case 'sensor':
        await this.addSensorBlockData(blockData, block, result)
        break
        
      case 'actuator':
        await this.addActuatorBlockData(blockData, block, result)
        break
        
      case 'system.start':
      case 'system.end':
        this.addSystemBlockData(blockData, block, result)
        break
        
      default:
        this.addGenericBlockData(blockData, block, result)
        break
    }

    await this.addBlockToExecutionSession(executionSessionId, blockData)
  }

  // 🚀 NEW: Add sensor-specific data
  private async addSensorBlockData(blockData: any, block: BlockNode, result: ExecutionResult): Promise<void> {
    const deviceId = block.parameters?.deviceId || result.data?.deviceId

    if (deviceId) {
      const deviceData = await this.getDeviceData(deviceId)
      blockData.blockName = deviceData?.name || 'Unknown Sensor'
      blockData.inputData = {
        deviceId,
        timeout: block.parameters?.timeout,
        monitoringTagId: block.parameters?.monitoringTagId,
        ...block.parameters // Include all block parameters as inputData
      }
      blockData.outputData = {
        deviceName: deviceData?.name,
        deviceType: result.data?.deviceType,
        value: result.data?.value,
        sensorType: result.data?.sensorType
      }
    } else {
      blockData.blockName = 'Sensor'
      blockData.inputData = block.parameters || {}
      blockData.outputData = { value: result.data?.value }
    }
  }

  // 🚀 NEW: Add actuator-specific data
  private async addActuatorBlockData(blockData: any, block: BlockNode, result: ExecutionResult): Promise<void> {
    const deviceId = block.parameters?.deviceId
    if (deviceId) {
      const deviceData = await this.getDeviceData(deviceId)
      blockData.blockName = deviceData?.name || 'Unknown Actuator'
      blockData.inputData = {
        deviceId,
        actionType: block.parameters?.actionType,
        duration: block.parameters?.duration,
        powerLevel: block.parameters?.powerLevel,
        powerFrom: block.parameters?.powerFrom,
        powerTo: block.parameters?.powerTo,
        useGlobalVariable: block.parameters?.useGlobalVariable,
        selectedGlobalVariable: block.parameters?.selectedGlobalVariable,
        ...block.parameters // Include all block parameters as inputData
      }
      blockData.outputData = {
        deviceName: deviceData?.name,
        actionType: result.data?.actionType,
        duration: result.data?.duration,
        hardwareState: result.data?.hardwareState
      }
    } else {
      blockData.blockName = 'Actuator'
      blockData.inputData = block.parameters || {}
      blockData.outputData = {
        actionType: result.data?.actionType,
        duration: result.data?.duration
      }
    }
  }

  // 🚀 NEW: Add system block data
  private addSystemBlockData(blockData: any, block: BlockNode, result: ExecutionResult): void {
    blockData.blockName = block.definitionId === 'system.start' ? 'Flow Start' : 'Flow End'
    blockData.inputData = block.parameters || {}
    blockData.outputData = { systemBlock: true }
  }

  // 🚀 NEW: Add generic block data for other block types
  private addGenericBlockData(blockData: any, block: BlockNode, result: ExecutionResult): void {
    blockData.blockName = block.definitionId.toUpperCase()
    blockData.inputData = block.parameters || {}
    blockData.outputData = result.data || {}
  }

  // 🚀 NEW: Add block execution to ExecutionSession via HTTP API
  private async addBlockToExecutionSession(executionSessionId: string, blockData: any): Promise<void> {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/execution-sessions/${executionSessionId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      console.log(`📝 [BlockExecutor] Added ${blockData.blockName} block to ExecutionSession: ${executionSessionId}`)
    } catch (error) {
      console.warn(`⚠️ [BlockExecutor] Failed to add block to ExecutionSession:`, error)
      throw error
    }
  }


}