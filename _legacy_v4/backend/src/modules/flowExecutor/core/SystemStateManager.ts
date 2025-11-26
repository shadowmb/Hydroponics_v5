// SystemStateManager.ts - Central system state coordinator

import {
  SystemState,
  StateTransition,
  ResourceLock,
  SystemStateContext,
  StateChangeHandler,
  WebSocketEvent,
  WebSocketEventType,
  MonitoringQueueState
} from '../types'
import { WebSocketManager } from './WebSocketManager'
import { CancellationToken } from './CancellationToken'

export class SystemStateManager {
  private currentState: SystemState = SystemState.IDLE
  private stateHistory: StateTransition[] = []
  private resourceLocks = new Map<string, ResourceLock>()
  private stateChangeHandlers: StateChangeHandler[] = []
  private cancellationToken: CancellationToken
  
  // Current execution context
  private currentContext: SystemStateContext = {
    currentState: SystemState.IDLE
  }

  // Monitoring queue state
  private monitoringQueueState: MonitoringQueueState = {
    pendingFlows: [],
    isPaused: false
  }

  constructor(cancellationToken?: CancellationToken) {
    this.addStateTransition(SystemState.IDLE, SystemState.IDLE, 'System initialized')
    this.cancellationToken = cancellationToken || new CancellationToken()
  }

  // State management
  getCurrentState(): SystemState {
    // За мониторинг на system state exposure - current state access за external coordination
    return this.currentState
  }

  getCurrentContext(): SystemStateContext {
    return { ...this.currentContext }
  }

  /**
   * 🚩 NEW: Получава cancellation token за интеграция с flow execution
   */
  getCancellationToken(): CancellationToken {
    return this.cancellationToken
  }

  private setState(newState: SystemState, reason?: string): boolean {
    // За мониторинг на system state transitions - internal state change engine със validation
    const previousState = this.currentState
    
    if (!this.isValidTransition(previousState, newState)) {
      return false
    }

    this.currentState = newState
    this.currentContext.currentState = newState
    
    this.addStateTransition(previousState, newState, reason)
    this.notifyStateChange(newState, previousState)
    
    return true
  }

  // State transitions
  startExecution(flowId: string): boolean {
    // За мониторинг на execution lifecycle - flow start operations със CancellationToken reset
    if (this.currentState !== SystemState.IDLE) {
      return false
    }

    // 🚩 NEW: Рестартирай cancellation token за новата execution
    this.cancellationToken.reset()

    this.currentContext = {
      currentState: SystemState.RUNNING,
      flowId,
      currentBlockId: undefined,
      currentAction: 'Starting flow...',
      variables: {},
      error: undefined
    }

    const success = this.setState(SystemState.RUNNING, `Started flow: ${flowId}`)
    
    if (success) {
      this.broadcastEvent(WebSocketEventType.FLOW_STARTED, {
        flowId,
        timestamp: new Date()
      })
    }

    return success
  }

  pauseExecution(): boolean {
    // За мониторинг на execution lifecycle - flow pause operations със WebSocket broadcasting
    console.log(`[SystemStateManager] pauseExecution() - currentState: ${this.currentState}`)
    if (this.currentState !== SystemState.RUNNING) {
      console.log(`[SystemStateManager] Cannot pause - state is not RUNNING`)
      return false
    }

    const success = this.setState(SystemState.PAUSED, 'Execution paused by user')
    
    if (success) {
      this.currentContext.currentAction = 'Paused'
      this.broadcastEvent(WebSocketEventType.FLOW_PAUSED, {
        flowId: this.currentContext.flowId,
        timestamp: new Date()
      })
    }

    return success
  }

  resumeExecution(): boolean {
    // За мониторинг на execution lifecycle - flow resume operations със state restoration
    console.log(`[SystemStateManager] resumeExecution() - currentState: ${this.currentState}`)
    if (this.currentState !== SystemState.PAUSED) {
      console.log(`[SystemStateManager] Cannot resume - state is not PAUSED`)
      return false
    }

    const success = this.setState(SystemState.RUNNING, 'Execution resumed')
    
    if (success) {
      this.currentContext.currentAction = 'Resuming...'
      this.broadcastEvent(WebSocketEventType.FLOW_STARTED, {
        flowId: this.currentContext.flowId,
        resumed: true,
        timestamp: new Date()
      })
    }

    return success
  }

  stopExecution(emergency: boolean = false): boolean {
    // За мониторинг на emergency stop handling - flow termination със resource cleanup и CancellationToken activation
    if (!['running', 'paused', 'error'].includes(this.currentState)) {
      return false
    }

    const reason = emergency ? 'Emergency stop' : 'Normal stop'
    
    // 🚩 NEW: Активирай cancellation token за естествено спиране
    this.cancellationToken.cancel(reason)
    
    const success = this.setState(SystemState.STOPPED, reason)
    
    if (success) {
      this.currentContext.currentAction = emergency ? 'Emergency stopped' : 'Stopped'
      
      // Release all resource locks
      this.unlockAllResources()
      
      this.broadcastEvent(WebSocketEventType.FLOW_STOPPED, {
        flowId: this.currentContext.flowId,
        emergency,
        timestamp: new Date()
      })

      // Return to IDLE immediately - no delay needed
      this.setState(SystemState.IDLE, 'Ready for next execution')
      this.currentContext = { currentState: SystemState.IDLE }
    }

    return success
  }

  setErrorState(error: string): boolean {
    // За мониторинг на error state management - error condition handling със WebSocket broadcasting
    if (this.currentState === SystemState.IDLE) {
      return false
    }

    this.currentContext.error = error
    const success = this.setState(SystemState.ERROR, `Error occurred: ${error}`)
    
    if (success) {
      this.broadcastEvent(WebSocketEventType.ERROR_OCCURRED, {
        flowId: this.currentContext.flowId,
        error,
        timestamp: new Date()
      })
    }

    return success
  }

  // Resource management
  lockResource(deviceId: string, requester: string, lockType: 'exclusive' | 'shared' = 'exclusive'): boolean {
    // За мониторинг на resource lock coordination - exclusive/shared device locking със conflict detection
    const existingLock = this.resourceLocks.get(deviceId)
    
    if (existingLock) {
      // Allow shared locks with other shared locks
      if (lockType === 'shared' && existingLock.lockType === 'shared') {
        return true
      }
      return false
    }

    const lock: ResourceLock = {
      deviceId,
      lockedBy: requester,
      lockedAt: new Date(),
      lockType
    }

    this.resourceLocks.set(deviceId, lock)
    return true
  }

  unlockResource(deviceId: string): void {
    this.resourceLocks.delete(deviceId)
  }

  unlockAllResources(): void {
    // За мониторинг на resource cleanup - automatic resource unlock при flow completion
    this.resourceLocks.clear()
  }

  isResourceLocked(deviceId: string): boolean {
    return this.resourceLocks.has(deviceId)
  }

  getResourceLock(deviceId: string): ResourceLock | undefined {
    return this.resourceLocks.get(deviceId)
  }

  getLockedResources(): ResourceLock[] {
    return Array.from(this.resourceLocks.values())
  }

  // Context updates (called by FlowInterpreter)
  updateContext(updates: Partial<SystemStateContext>): void {
    // За мониторинг на execution context synchronization - context updates със WebSocket broadcasting
    this.currentContext = { ...this.currentContext, ...updates }
    
    // Broadcast context updates
    this.broadcastEvent(WebSocketEventType.STATE_CHANGED, {
      context: this.currentContext,
      timestamp: new Date()
    })
  }

  async updateCurrentBlock(blockId: string, action?: string): Promise<void> {
    // За мониторинг на current block tracking - execution progress със action logging
    this.currentContext.currentBlockId = blockId
    if (action) {
      this.currentContext.currentAction = action
    }

    // TODO: REMOVED - current-block database tracking is redundant with hierarchical tracking
    // The database tracking is now handled through the hierarchical block recording system

    this.broadcastEvent(WebSocketEventType.BLOCK_EXECUTED, {
      flowId: this.currentContext.flowId,
      blockId,
      action,
      timestamp: new Date()
    })
  }

  updateVariables(variables: Record<string, any>): void {
    // За мониторинг на variable state synchronization - variable updates със real-time broadcasting
    this.currentContext.variables = { ...variables }
    
    this.broadcastEvent(WebSocketEventType.VARIABLE_UPDATED, {
      flowId: this.currentContext.flowId,
      variables,
      timestamp: new Date()
    })
  }

  // Event handling
  onStateChange(handler: StateChangeHandler): void {
    this.stateChangeHandlers.push(handler)
  }

  removeStateChangeHandler(handler: StateChangeHandler): void {
    const index = this.stateChangeHandlers.indexOf(handler)
    if (index > -1) {
      this.stateChangeHandlers.splice(index, 1)
    }
  }

  private notifyStateChange(newState: SystemState, previousState: SystemState): void {
    // За мониторинг на state change notifications - multi-layer notification system coordination
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(newState, this.currentContext, previousState)
      } catch (error) {
        console.error('Error in state change handler:', error)
      }
    })
    
    // Broadcast state change via WebSocket
    const wsManager = WebSocketManager.getInstance()
    wsManager.broadcastStatusChange(newState, {
      previousState,
      context: this.getCurrentContext()
    })
  }

  // WebSocket broadcasting (will be implemented later with actual WebSocket service)
  broadcastEvent(eventType: WebSocketEventType, data: any): void {
    // За мониторинг на event broadcasting - comprehensive WebSocket event distribution
    const event: WebSocketEvent = {
      type: eventType,
      data,
      timestamp: new Date()
    }

    // TODO: Implement actual WebSocket broadcasting
    //console.log('WebSocket Event:', event)
  }

  // Validation and utility methods
  private isValidTransition(from: SystemState, to: SystemState): boolean {
    // За мониторинг на state validation - transition matrix validation и invalid transition prevention
    const validTransitions: Record<SystemState, SystemState[]> = {
      [SystemState.IDLE]: [SystemState.RUNNING],
      [SystemState.RUNNING]: [SystemState.PAUSED, SystemState.STOPPED, SystemState.ERROR, SystemState.IDLE],
      [SystemState.PAUSED]: [SystemState.RUNNING, SystemState.STOPPED],
      [SystemState.STOPPED]: [SystemState.IDLE],
      [SystemState.ERROR]: [SystemState.IDLE, SystemState.STOPPED]
    }

    return validTransitions[from]?.includes(to) || false
  }

  private addStateTransition(from: SystemState, to: SystemState, reason?: string): void {
    // За мониторинг на state history tracking - transition logging със automatic pruning
    const transition: StateTransition = {
      from,
      to,
      timestamp: new Date(),
      reason
    }

    this.stateHistory.push(transition)

    // Keep only last 100 transitions
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift()
    }
  }

  // Status and debugging
  getStateHistory(): StateTransition[] {
    return [...this.stateHistory]
  }

  // Monitoring Queue Management
  async pauseAllMonitoringFlows(programId: string): Promise<string[]> {
    // За мониторинг на flow interruption handling - ExecutionSession API integration за active flow detection
    console.log(`⏸️ [SystemStateManager] Stopping any active flows for program cycle: ${programId}`)
    
    try {
      // За мониторинг на ExecutionSession conflict detection - API-based active flow discovery
      // 🚀 NEW: Find any active ExecutionSession (running/starting status)
      const response = await fetch('http://localhost:5000/api/v1/execution-sessions/current')
      
      if (!response.ok) {
        console.log(`✅ [SystemStateManager] No ExecutionSession API available - no active flows to stop`)
        return []
      }
      
      const data = await response.json() as any
      
      if (!data.success || !data.data) {
        console.log(`✅ [SystemStateManager] No active execution found - system ready for cycle`)
        return []
      }
      
      const activeExecution = data.data
      console.log(`🔍 [SystemStateManager] Found active execution: ${activeExecution.executionId} (${activeExecution.flowType}: ${activeExecution.flowName})`)
      
      // 🚀 Stop the active flow execution via FlowExecutor API
      try {
        const stopResponse = await fetch('http://localhost:5000/api/v1/flow/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emergency: false })
        })
        
        if (stopResponse.ok) {
          console.log(`🛑 [SystemStateManager] Stopped active flow execution`)
        } else {
          console.warn(`⚠️ [SystemStateManager] Failed to stop flow execution via API`)
        }
      } catch (stopError) {
        console.warn(`⚠️ [SystemStateManager] Error stopping flow execution:`, stopError)
      }
      
      // 🚀 Mark ExecutionSession as failed due to cycle interruption
      try {
        const failResponse = await fetch(`http://localhost:5000/api/v1/execution-sessions/${activeExecution.executionId}/fail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: `Execution interrupted by higher priority cycle (program: ${programId})`
          })
        })
        
        if (failResponse.ok) {
          console.log(`❌ [SystemStateManager] Marked ExecutionSession as failed: ${activeExecution.executionId}`)
        }
      } catch (failError) {
        console.warn(`⚠️ [SystemStateManager] Error failing ExecutionSession:`, failError)
      }
      
      // За мониторинг на monitoring flow queueing - interrupted flow addition със duplicate prevention
      // 🚀 Add monitoring flow to queue if it was monitoring type
      if (activeExecution.flowType === 'monitoring') {
        try {
          // Import MonitoringQueue and MonitoringFlow
          const { MonitoringQueue } = await import('../../../models/MonitoringQueue')
          
          // Check if already in queue to avoid duplicates
          const existingQueueItem = await MonitoringQueue.findOne({
            flowId: activeExecution.sourceId,
            status: { $in: ['pending', 'executing'] }
          })
          
          if (!existingQueueItem) {
            const queueItem = new MonitoringQueue({
              flowId: activeExecution.sourceId,
              pausedBy: `cycle_interruption_${programId}`,
              status: 'pending',
              priority: 0,
              addedAt: new Date()
            })
            
            await queueItem.save()
            console.log(`📝 [SystemStateManager] Added interrupted monitoring flow to queue: ${activeExecution.flowName}`)
            
            return [activeExecution.flowName]
          } else {
            console.log(`📝 [SystemStateManager] Monitoring flow already in queue - not adding duplicate`)
            return []
          }
        } catch (queueError) {
          console.error(`❌ [SystemStateManager] Error adding monitoring flow to queue:`, queueError)
          return []
        }
      } else {
        console.log(`✅ [SystemStateManager] Stopped ${activeExecution.flowType} execution - not adding to queue`)
        return []
      }
      
    } catch (error) {
      console.error(`❌ [SystemStateManager] Failed to stop active flows:`, error)
      return []
    }
  }

  async resumeMonitoringFlows(): Promise<number> {
    // За мониторинг на queue processing - FIFO monitoring flow resumption
    console.log(`▶️ [SystemStateManager] Resuming paused monitoring flows`)
    
    try {
      // Import MonitoringQueue here to avoid circular dependency
      const { MonitoringQueue } = await import('../../../models/MonitoringQueue')
      
      // Get pending monitoring flows from queue
      const pendingFlows = await MonitoringQueue.find({
        status: 'pending'
      }).populate('flowId', 'name description').sort({ addedAt: 1 }) // FIFO order
      
      console.log(`🔄 [SystemStateManager] Found ${pendingFlows.length} pending monitoring flows in queue`)
      
      // Update local state
      this.monitoringQueueState.isPaused = false
      this.monitoringQueueState.pausedBy = undefined
      this.monitoringQueueState.pausedAt = undefined
      
      // Broadcast WebSocket event
      this.broadcastEvent(WebSocketEventType.STATE_CHANGED, {
        monitoringResumed: true,
        pendingFlowsCount: pendingFlows.length,
        timestamp: new Date()
      })
      
      return pendingFlows.length
      
    } catch (error) {
      console.error(`❌ [SystemStateManager] Failed to resume monitoring flows:`, error)
      return 0
    }
  }

  async getPendingMonitoringFlows(): Promise<any[]> {
    // За мониторинг на queue status queries - pending flow data със population
    try {
      const { MonitoringQueue } = await import('../../../models/MonitoringQueue')
      
      return await MonitoringQueue.find({
        status: 'pending'
      }).populate('flowId', 'name description monitoringInterval').sort({ addedAt: 1 })
      
    } catch (error) {
      console.error(`❌ [SystemStateManager] Failed to get pending monitoring flows:`, error)
      return []
    }
  }

  getMonitoringQueueState(): MonitoringQueueState {
    return { ...this.monitoringQueueState }
  }

  getStatus() {
    return {
      currentState: this.currentState,
      context: this.currentContext,
      lockedResources: this.getLockedResources().length,
      stateHistoryLength: this.stateHistory.length,
      lastTransition: this.stateHistory[this.stateHistory.length - 1],
      monitoringQueue: this.monitoringQueueState
    }
  }

  // Cleanup
  cleanup(): void {
    // За мониторинг на system cleanup - comprehensive state reset и memory management
    this.unlockAllResources()
    this.stateChangeHandlers = []
    this.currentContext = { currentState: SystemState.IDLE }
    this.monitoringQueueState = {
      pendingFlows: [],
      isPaused: false
    }
    this.setState(SystemState.IDLE, 'System cleanup')
  }
}