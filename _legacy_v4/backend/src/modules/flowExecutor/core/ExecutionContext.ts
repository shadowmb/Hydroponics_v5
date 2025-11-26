// ExecutionContext.ts - Runtime memory and state management

import {
  VariableMetadata,
  ExecutionLog,
  ExecutionError,
  LoopState,
  Timer,
  ExecutionSnapshot,
  LogLevel
} from '../types'
import { WebSocketManager } from './WebSocketManager'

export class ExecutionContext {
  // Navigation state
  public currentBlockId: string | null = null
  public nextBlockIds: string[] = []
  public executedBlockIds: string[] = []

  // Runtime variables
  private variables = new Map<string, any>()
  private variableMetadata = new Map<string, VariableMetadata>()

  // Execution state
  public isRunning: boolean = false
  public isPaused: boolean = false
  public isStopped: boolean = false
  public startTime: Date = new Date()

  // History & logging
  public logs: ExecutionLog[] = []
  public errorStack: ExecutionError[] = []

  // Loop state
  public activeLoops: LoopState[] = []
  
  // Loop context stack for auto-return logic
  private loopContextStack: string[] = []

  // Note: Notification logic moved to BlockExecutor configuration-based approach

  // Timers & delays
  public activeTimers: Timer[] = []
  public suspendedUntil?: Date

  constructor(private maxLogs: number = 1000, private maxVariables: number = 100) {}

  // Variable management
  setVariable(name: string, value: any, metadata?: Partial<VariableMetadata>): void {
    if (this.variables.size >= this.maxVariables && !this.variables.has(name)) {
      throw new Error(`Maximum variables limit (${this.maxVariables}) reached`)
    }

    this.variables.set(name, value)
    
    // Broadcast variable update via WebSocket
    const wsManager = WebSocketManager.getInstance()
    wsManager.broadcastVariableUpdate(name, value)

    if (metadata) {
      const fullMetadata: VariableMetadata = {
        name,
        displayName: metadata.displayName || name,
        type: metadata.type || this.inferType(value),
        source: metadata.source || 'unknown',
        lastUpdated: new Date(),
        unit: metadata.unit
      }
      this.variableMetadata.set(name, fullMetadata)
    }
  }

  getVariable(name: string): any {
    return this.variables.get(name)
  }

  hasVariable(name: string): boolean {
    return this.variables.has(name)
  }

  getVariables(): Record<string, any> {
    const result: Record<string, any> = {}
    this.variables.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  getVariableMetadata(name: string): VariableMetadata | undefined {
    return this.variableMetadata.get(name)
  }

  clearVariables(): void {
    this.variables.clear()
    this.variableMetadata.clear()
  }

  clearVariable(name: string): void {
    this.variables.delete(name)
    this.variableMetadata.delete(name)
  }

  // Navigation methods
  setCurrentBlock(blockId: string): void {
    this.currentBlockId = blockId
  }

  addExecutedBlock(blockId: string): void {
    if (!this.executedBlockIds.includes(blockId)) {
      this.executedBlockIds.push(blockId)
    }
  }

  isBlockExecuted(blockId: string): boolean {
    return this.executedBlockIds.includes(blockId)
  }

  // Logging methods
  addLog(message: string, level: LogLevel = LogLevel.INFO, blockId?: string): void {
    const log: ExecutionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blockId: blockId || this.currentBlockId || 'unknown',
      message,
      level,
      timestamp: new Date()
    }

    this.logs.push(log)
    
    // Broadcast log via WebSocket
    const wsManager = WebSocketManager.getInstance()
    wsManager.broadcastLog(level, message, { blockId: blockId || this.currentBlockId })

    // Rotate logs if limit exceeded
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  addError(error: ExecutionError): void {
    this.errorStack.push(error)
    this.addLog(`Error: ${error.message}`, LogLevel.ERROR, error.blockId)
  }

  getLastError(): ExecutionError | undefined {
    return this.errorStack[this.errorStack.length - 1]
  }

  getRecentLogs(count: number = 10): ExecutionLog[] {
    return this.logs.slice(-count)
  }

  getLogsByLevel(level: LogLevel): ExecutionLog[] {
    return this.logs.filter(log => log.level === level)
  }

  // State management
  pause(): void {
    this.isPaused = true
    this.isRunning = false
    this.addLog('Execution paused', LogLevel.INFO)
  }

  resume(): void {
    this.isPaused = false
    this.isRunning = true
    this.addLog('Execution resumed', LogLevel.INFO)
  }

  stop(): void {
    this.isStopped = true
    this.isRunning = false
    this.isPaused = false
    this.addLog('Execution stopped', LogLevel.INFO)
  }

  start(): void {
    this.isRunning = true
    this.isPaused = false
    this.isStopped = false
    this.startTime = new Date()
    this.addLog('Execution started', LogLevel.INFO)
  }

  // Loop management
  addActiveLoop(loopState: LoopState): void {
    this.activeLoops.push(loopState)
  }

  removeActiveLoop(blockId: string): void {
    this.activeLoops = this.activeLoops.filter(loop => loop.blockId !== blockId)
  }

  getActiveLoop(blockId: string): LoopState | undefined {
    return this.activeLoops.find(loop => loop.blockId === blockId)
  }

  updateLoopIteration(blockId: string, iteration: number): void {
    const loop = this.getActiveLoop(blockId)
    if (loop) {
      loop.currentIteration = iteration
    }
  }

  // Timer management
  addTimer(timer: Timer): void {
    this.activeTimers.push(timer)
  }

  removeTimer(timerId: string): void {
    this.activeTimers = this.activeTimers.filter(timer => timer.id !== timerId)
  }

  clearTimers(): void {
    this.activeTimers.forEach(timer => {
      // TODO: Cancel timer callback if needed
    })
    this.activeTimers = []
  }

  // Serialization for persistence
  toSnapshot(): ExecutionSnapshot {
    return {
      flowId: 'unknown', // Will be set by FlowInterpreter
      executionId: `exec_${Date.now()}`,
      currentBlockId: this.currentBlockId,
      variables: this.getVariables(),
      executedBlocks: [...this.executedBlockIds],
      activeLoops: [...this.activeLoops],
      timestamp: new Date()
    }
  }

  fromSnapshot(snapshot: ExecutionSnapshot): void {
    this.currentBlockId = snapshot.currentBlockId
    this.executedBlockIds = [...snapshot.executedBlocks]
    this.activeLoops = [...snapshot.activeLoops]

    // Restore variables
    this.variables.clear()
    for (const [key, value] of Object.entries(snapshot.variables)) {
      this.variables.set(key, value)
    }

    this.addLog('Context restored from snapshot', LogLevel.INFO)
  }

  // Utility methods
  private inferType(value: any): 'number' | 'string' | 'boolean' {
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    return 'string'
  }

  // Loop context management
  enterLoopContext(loopBlockId: string): void {
    this.loopContextStack.push(loopBlockId)
    this.addLog(`Entered loop context: ${loopBlockId}`, LogLevel.DEBUG)
  }

  exitLoopContext(loopBlockId: string): void {
    const lastLoop = this.loopContextStack.pop()
    if (lastLoop !== loopBlockId) {
      this.addLog(`Warning: Loop context mismatch. Expected: ${loopBlockId}, got: ${lastLoop}`, LogLevel.WARN)
    } else {
      this.addLog(`Exited loop context: ${loopBlockId}`, LogLevel.DEBUG)
    }
  }

  getCurrentLoopContext(): string | undefined {
    return this.loopContextStack[this.loopContextStack.length - 1]
  }

  hasActiveLoopContext(): boolean {
    return this.loopContextStack.length > 0
  }

  getLoopContextStack(): string[] {
    return [...this.loopContextStack]
  }

  // Memory management
  cleanup(): void {
    this.clearTimers()
    this.logs = []
    this.errorStack = []
    this.clearVariables()
    this.activeLoops = []
    this.executedBlockIds = []
    this.loopContextStack = []
    this.addLog('Context cleaned up', LogLevel.INFO)
  }

  // Status information
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isStopped: this.isStopped,
      currentBlock: this.currentBlockId,
      variableCount: this.variables.size,
      logCount: this.logs.length,
      errorCount: this.errorStack.length,
      activeLoops: this.activeLoops.length,
      executionTime: Date.now() - this.startTime.getTime()
    }
  }
}