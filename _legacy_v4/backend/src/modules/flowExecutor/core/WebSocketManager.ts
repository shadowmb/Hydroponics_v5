// WebSocketManager.ts - Real-time event broadcasting for FlowExecutor
import { WebSocket as WS } from 'ws'
import { ExecutionLoggerService } from '../../../services/ExecutionLoggerService'
import { ExecutionSession } from '../../../models/ExecutionSession'

export interface FlowEvent {
  type: 'status_change' | 'block_started' | 'block_executed' | 'variable_updated' | 'log_added' | 'error_occurred' | 'block_started_enhanced' | 'block_executed_enhanced' | 'initial_execution_state' | 'dashboard_refresh' | 'flow_status_changed' | 'action_template_completed' | 'action_template_started' | 'cycle_completed'
  timestamp: string
  data: any
}

export interface ClientInfo {
  ws: WS
  id: string
  name?: string
  page?: string
  connectedAt: Date
}

// Enhanced execution context for rich WebSocket events
export interface ExecutionContextInfo {
  executionSessionId: string
  programId: string
  programName: string
  cycleId?: string
  cycleName?: string
}

// Enhanced timing information
export interface TimingInfo {
  startTime?: string
  endTime?: string
  duration?: number
}

// Enhanced block event with full context and device information
export interface EnhancedBlockEvent {
  blockId: string
  blockType: string
  blockName: string
  deviceName?: string
  deviceType?: string
  parameters?: any
  executionContext: ExecutionContextInfo
  timing: TimingInfo
  status: 'started' | 'completed' | 'failed'
  result?: any
  displayText?: string
}

export class WebSocketManager {
  private clients: Map<string, ClientInfo> = new Map()
  private static instance: WebSocketManager | null = null
  private logger: ExecutionLoggerService

  private constructor() {
    this.logger = new ExecutionLoggerService()
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  addClient(ws: WS): void {
    const clientId = `frontend_${Date.now()}`

    const clientInfo: ClientInfo = {
      ws,
      id: clientId,
      connectedAt: new Date()
    }

    this.clients.set(clientId, clientInfo)

    console.log(`🔌 Frontend connected: ${clientId} (Total: ${this.clients.size})`)

    ws.on('close', () => {
      const client = this.clients.get(clientId)
      console.log(`🔌 [WebSocket DEBUG] CLIENT DISCONNECTED:`)
      console.log(`   📋 Client ID: ${clientId}`)
      console.log(`   📊 Remaining Clients: ${this.clients.size - 1}`)
      this.clients.delete(clientId)
    })

    ws.on('error', (error) => {
      console.error(`🔌 [WebSocket DEBUG] CLIENT ERROR:`)
      console.error(`   📋 Client ID: ${clientId}`)
      console.error(`   ❌ Error:`, error)
      this.clients.delete(clientId)
    })

    ws.on('message', (message) => {
      console.log(`🔌 [WebSocket DEBUG] MESSAGE FROM CLIENT:`)
      console.log(`   📋 Client ID: ${clientId}`)
      console.log(`   📨 Message: ${message}`)
    })

    // Send initial status
    this.sendToClient(ws, {
      type: 'status_change',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Connected to FlowExecutor WebSocket',
        clientId,
      }
    })

    // Send initial execution state to new client if available
    this.sendInitialStateToNewClient(ws)
  }

  updateClientInfo(clientId: string, name?: string, page?: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      client.name = name
      client.page = page
      console.log(`🔌 Client identified: ${clientId} as "${name}" (${page})`)
    }
  }

  getClientByWebSocket(ws: WS): ClientInfo | undefined {
    for (const [id, client] of this.clients.entries()) {
      if (client.ws === ws) {
        return client
      }
    }
    return undefined
  }

  broadcast(event: FlowEvent): void {
    // Skip broadcasting log_added and variable_updated events (debug only)
    if (event.type === 'log_added' || event.type === 'variable_updated') {
      // Still log to file system but don't broadcast via WebSocket
      this.logger.logEntry(event.type, event.data)
      return
    }
    
    const message = JSON.stringify(event)
    
    // Log to file system
    this.logger.logEntry(event.type, event.data)
    
    console.log(`📡 [WebSocket] Broadcasting event: ${event.type} to ${this.clients.size} clients`)

    let sentCount = 0
    let failedCount = 0

    this.clients.forEach((clientInfo, clientId) => {
      const displayName = clientInfo.name || clientId
      const displayPage = clientInfo.page || 'unknown'

      if (clientInfo.ws.readyState === WS.OPEN) {
        try {
          clientInfo.ws.send(message)
          sentCount++
          console.log(`   ✅ Sent to ${displayName} (${displayPage})`)
        } catch (error) {
          console.error(`   ❌ Failed to send to ${displayName} (${displayPage}):`, error)
          this.clients.delete(clientId)
          failedCount++
        }
      } else {
        console.log(`   ⚠️ Client ${displayName} (${displayPage}) not ready (state: ${clientInfo.ws.readyState})`)
        this.clients.delete(clientId)
        failedCount++
      }
    })

    console.log(`📡 [WebSocket] Event sent: ${sentCount} success, ${failedCount} failed`)
  }

  private sendToClient(client: WS, event: FlowEvent): void {
    if (client.readyState === WS.OPEN) {
      try {
        client.send(JSON.stringify(event))
      } catch (error) {
        console.error('Failed to send WebSocket message to client:', error)
        // Find and remove client by WebSocket
        for (const [clientId, clientInfo] of this.clients.entries()) {
          if (clientInfo.ws === client) {
            this.clients.delete(clientId)
            break
          }
        }
      }
    }
  }

  // Public method to send data to specific client
  sendToSpecificClient(client: WS, event: FlowEvent): void {
    this.sendToClient(client, event)
  }

  // Public method to send initial execution state to specific client
  async sendInitialExecutionState(client: WS): Promise<void> {
    await this.sendInitialStateToNewClient(client)
  }

  getClientCount(): number {
    return this.clients.size
  }

  // Debug method to get detailed client info
  getClientDetails(): any[] {
    const clientDetails: any[] = []

    this.clients.forEach((clientInfo, clientId) => {
      clientDetails.push({
        clientId,
        name: clientInfo.name || 'unknown',
        page: clientInfo.page || 'unknown',
        connectedAt: clientInfo.connectedAt.toISOString(),
        readyState: clientInfo.ws.readyState,
        readyStateText: clientInfo.ws.readyState === 0 ? 'CONNECTING' :
                       clientInfo.ws.readyState === 1 ? 'OPEN' :
                       clientInfo.ws.readyState === 2 ? 'CLOSING' : 'CLOSED'
      })
    })

    return clientDetails
  }

  // Debug method to log all current clients
  logCurrentClients(): void {
    console.log(`🔌 [WebSocket DEBUG] CURRENT CLIENTS (${this.clients.size} total):`)

    if (this.clients.size === 0) {
      console.log(`   📭 No clients connected`)
      return
    }

    this.getClientDetails().forEach((client, index) => {
      console.log(`   📋 Client ${index + 1}:`)
      console.log(`      🆔 ID: ${client.clientId}`)
      console.log(`      🌐 Address: ${client.remoteAddress}`)
      console.log(`      🖥️  User Agent: ${client.userAgent.substring(0, 50)}...`)
      console.log(`      📍 Origin: ${client.origin}`)
      console.log(`      🔗 Referer: ${client.referer}`)
      console.log(`      ⏰ Connected: ${client.connectedAt}`)
      console.log(`      🔗 State: ${client.readyStateText} (${client.readyState})`)
    })
  }

  // Helper methods for common events
  broadcastStatusChange(status: string, data?: any): void {
    this.broadcast({
      type: 'status_change',
      timestamp: new Date().toISOString(),
      data: { status, ...data }
    })
  }

  broadcastBlockStarted(blockId: string, blockType: string, blockData?: any): void {
   // console.log(`📡 [WebSocket] Broadcasting block_started: ${blockId} (${blockType})`, blockData)
   // console.log(`📡 [WebSocket] Connected clients: ${this.clients.size}`)
    
    this.broadcast({
      type: 'block_started',
      timestamp: new Date().toISOString(),
      data: { blockId, blockType, blockData }
    })
  }

  broadcastBlockExecuted(blockId: string, blockType: string, result: any): void {
    this.broadcast({
      type: 'block_executed',
      timestamp: new Date().toISOString(),
      data: { blockId, blockType, result }
    })
  }

  broadcastVariableUpdate(name: string, value: any): void {
    this.broadcast({
      type: 'variable_updated',
      timestamp: new Date().toISOString(),
      data: { variableName: name, variableValue: value }
    })
  }

  broadcastLog(level: string, message: string, context?: any): void {
    this.broadcast({
      type: 'log_added',
      timestamp: new Date().toISOString(),
      data: { level, message, context }
    })
  }

  broadcastError(error: string, context?: any): void {
    this.broadcast({
      type: 'error_occurred',
      timestamp: new Date().toISOString(),
      data: { error, context }
    })
  }

  // === ENHANCED METHODS FOR RICH EXECUTION TRACKING ===

  broadcastBlockStartedEnhanced(enhancedEvent: EnhancedBlockEvent): void {
    try {
      // Generate display text for Bulgarian UI
      const displayText = this.generateDisplayText(enhancedEvent, 'started')

      const eventData: EnhancedBlockEvent = {
        ...enhancedEvent,
        status: 'started',
        displayText,
        timing: {
          ...enhancedEvent.timing,
          startTime: enhancedEvent.timing.startTime || new Date().toISOString()
        }
      }

      this.broadcast({
        type: 'block_started_enhanced',
        timestamp: new Date().toISOString(),
        data: eventData
      })

      // Also log to execution system
      this.logger.logEntry('block_started_enhanced', eventData)

    } catch (error) {
      console.error('Failed to broadcast enhanced block started event:', error)
      // Fallback to basic event
      this.broadcastBlockStarted(enhancedEvent.blockId, enhancedEvent.blockType)
    }
  }

  broadcastBlockExecutedEnhanced(enhancedEvent: EnhancedBlockEvent): void {
    try {
      // Calculate duration if not provided
      const timing = { ...enhancedEvent.timing }
      if (timing.startTime && timing.endTime && !timing.duration) {
        const start = new Date(timing.startTime).getTime()
        const end = new Date(timing.endTime).getTime()
        timing.duration = end - start
      }

      // Generate display text for Bulgarian UI
      const displayText = this.generateDisplayText(enhancedEvent, enhancedEvent.status)

      const eventData: EnhancedBlockEvent = {
        ...enhancedEvent,
        displayText,
        timing: {
          ...timing,
          endTime: timing.endTime || new Date().toISOString()
        }
      }

      this.broadcast({
        type: 'block_executed_enhanced',
        timestamp: new Date().toISOString(),
        data: eventData
      })

      // Also log to execution system
      this.logger.logEntry('block_executed_enhanced', eventData)

    } catch (error) {
      console.error('Failed to broadcast enhanced block executed event:', error)
      // Fallback to basic event
      this.broadcastBlockExecuted(enhancedEvent.blockId, enhancedEvent.blockType, enhancedEvent.result)
    }
  }

  broadcastInitialExecutionState(executionState: {
    executionSession?: any
    currentProgram?: any
    currentCycle?: any
    activeBlocks?: string[]
    executionHistory?: any[]
    systemStatus?: string
  }): void {
    try {
      this.broadcast({
        type: 'initial_execution_state',
        timestamp: new Date().toISOString(),
        data: executionState
      })

      console.log(`📡 [WebSocket] Initial execution state sent to ${this.clients.size} clients`)

    } catch (error) {
      console.error('Failed to broadcast initial execution state:', error)
    }
  }

  // Helper method to generate Bulgarian display text
  private generateDisplayText(event: EnhancedBlockEvent, status: 'started' | 'completed' | 'failed'): string {
    const { blockType, blockName, deviceName } = event

    try {
      switch (blockType) {
        case 'sensor':
          switch (status) {
            case 'started':
              return `Четене на ${deviceName || blockName || 'сензор'}...`
            case 'completed':
              return `Прочетен ${deviceName || blockName || 'сензор'}`
            case 'failed':
              return `Грешка при четене на ${deviceName || blockName || 'сензор'}`
          }
          break

        case 'actuator':
          switch (status) {
            case 'started':
              return `Активиране на ${deviceName || blockName || 'устройство'}...`
            case 'completed':
              return `Активирано ${deviceName || blockName || 'устройство'}`
            case 'failed':
              return `Грешка при активиране на ${deviceName || blockName || 'устройство'}`
          }
          break

        case 'wait':
          switch (status) {
            case 'started':
              return `Изчакване...`
            case 'completed':
              return `Изчакването завърши`
            case 'failed':
              return `Грешка при изчакване`
          }
          break

        case 'if':
          switch (status) {
            case 'started':
              return `Проверка на условие...`
            case 'completed':
              return `Условието е проверено`
            case 'failed':
              return `Грешка при проверка на условие`
          }
          break

        case 'loop':
          switch (status) {
            case 'started':
              return `Започване на цикъл...`
            case 'completed':
              return `Цикълът завърши`
            case 'failed':
              return `Грешка в цикъла`
          }
          break

        default:
          switch (status) {
            case 'started':
              return `Изпълнение на ${blockName || blockType}...`
            case 'completed':
              return `Завърши ${blockName || blockType}`
            case 'failed':
              return `Грешка в ${blockName || blockType}`
          }
      }
    } catch (error) {
      console.error('Error generating display text:', error)
      return `${blockName || blockType} - ${status}`
    }

    return `${blockName || blockType} - ${status}`
  }

  // Get current execution state using same logic as /current-execution endpoint
  private async getCurrentExecutionState(): Promise<{
    active: any[]
    recent: any[]
    executionContext: any
  }> {
    try {
      // Find active execution session
      let activeExecution = await ExecutionSession.findOne({
        programStatus: { $in: ['running', 'paused'] }
      }).lean()

      let active = []
      let recent = []
      let executionContext = null

      if (activeExecution) {
        // If there's an active execution, get current cycle and flow data
        const currentCycle = activeExecution.cycles.find(c => c.cycleStatus === 'running')

        if (currentCycle) {
          const currentFlow = currentCycle.flows.find(f => f.flowStatus === 'running')

          if (currentFlow) {
            // Show current block from active flow
            const currentBlock = currentFlow.blocks.find(b => b.blockStatus === 'running')
            active = currentBlock ? [currentBlock] : []

            // Show recent completed blocks from current flow
            recent = currentFlow.blocks
              .filter(block => block.blockStatus === 'completed')
              .slice(-3)
              .reverse()
          }
        }

        executionContext = {
          executionId: activeExecution._id.toString(),
          programId: activeExecution.programId,
          programName: activeExecution.programName,
          programStatus: activeExecution.programStatus,
          currentCycle: currentCycle ? {
            cycleId: currentCycle.cycleId,
            cycleName: currentCycle.cycleName,
            cycleStatus: currentCycle.cycleStatus
          } : null
        }
      } else {
        // If no active execution, show recent data from the most recent completed execution
        const recentExecution = await ExecutionSession.findOne({
          programStatus: 'completed'
        }).sort({ programEndTime: -1 }).lean()

        if (recentExecution) {
          // Get blocks from the last completed cycle
          const lastCycle = recentExecution.cycles[recentExecution.cycles.length - 1]

          if (lastCycle && lastCycle.flows.length > 0) {
            const lastFlow = lastCycle.flows[lastCycle.flows.length - 1]

            recent = lastFlow.blocks
              .filter(block => block.blockStatus === 'completed')
              .slice(-4)
              .reverse()
          }

          executionContext = {
            executionId: recentExecution._id.toString(),
            programId: recentExecution.programId,
            programName: recentExecution.programName,
            programStatus: recentExecution.programStatus,
            isCompleted: true
          }
        }
      }

      return {
        active,
        recent,
        executionContext
      }
    } catch (error) {
      console.error('Error fetching current execution state:', error)
      return {
        active: [],
        recent: [],
        executionContext: null
      }
    }
  }

  // Send initial execution state to a newly connected client
  private async sendInitialStateToNewClient(client: WS): Promise<void> {
    try {
      // Get current execution state using the same logic as /current-execution endpoint
      const executionState = await this.getCurrentExecutionState()

      this.sendToClient(client, {
        type: 'initial_execution_state',
        timestamp: new Date().toISOString(),
        data: executionState
      })

      console.log(`📡 [WebSocket] Initial execution state sent to new client`)
    } catch (error) {
      console.error('Failed to send initial state to new client:', error)

      // Send fallback connection confirmation if getting execution state fails
      this.sendToClient(client, {
        type: 'initial_execution_state',
        timestamp: new Date().toISOString(),
        data: {
          connected: true,
          active: [],
          recent: [],
          executionContext: null,
          message: 'WebSocket connection established, no active execution'
        }
      })
    }
  }

  // Execution logging control methods
  startExecutionLogging(programId: string, programName: string, cycleIndex: number, cycleId: string, actionIndex: number, flowId: string): void {
    this.logger.startExecutionLog({
      programId,
      programName,
      cycleIndex,
      cycleId,
      actionIndex,
      flowId
    })
  }

  endExecutionLogging(): void {
    this.logger.endExecutionLog()
  }

  /**
   * Broadcast dashboard refresh event to trigger frontend updates
   */
  broadcastDashboardRefresh(reason: string, data?: any): void {
    this.broadcast({
      type: 'dashboard_refresh',
      timestamp: new Date().toISOString(),
      data: {
        reason,
        ...data
      }
    })
  }
}