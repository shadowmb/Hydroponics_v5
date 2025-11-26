// StateTypes.ts - State management types for FlowExecutor

export enum SystemState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export interface StateTransition {
  from: SystemState
  to: SystemState
  timestamp: Date
  reason?: string
}

export interface ResourceLock {
  deviceId: string
  lockedBy: string
  lockedAt: Date
  lockType: 'exclusive' | 'shared'
}

export interface SystemStateContext {
  currentState: SystemState
  flowId?: string
  currentBlockId?: string
  currentAction?: string
  variables?: Record<string, any>
  error?: string
}

export type StateChangeHandler = (
  newState: SystemState,
  context: SystemStateContext,
  previousState: SystemState
) => void

export interface WebSocketEvent {
  type: WebSocketEventType
  data: any
  timestamp: Date
}

export enum WebSocketEventType {
  FLOW_STARTED = 'flow_started',
  FLOW_PAUSED = 'flow_paused',
  FLOW_STOPPED = 'flow_stopped',
  FLOW_COMPLETED = 'flow_completed',
  BLOCK_EXECUTED = 'block_executed',
  VARIABLE_UPDATED = 'variable_updated',
  ERROR_OCCURRED = 'error_occurred',
  STATE_CHANGED = 'state_changed'
}

export interface Timer {
  id: string
  blockId: string
  startTime: Date
  duration: number
  callback: () => void
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'missing_connection' | 'invalid_parameter' | 'circular_dependency' | 'unreachable_block'
  blockId?: string
  message: string
}

export interface ValidationWarning {
  type: 'unused_variable' | 'long_execution_path' | 'resource_conflict'
  blockId?: string
  message: string
}

// MonitoringQueue management types
export interface MonitoringQueueItem {
  flowId: string
  addedAt: Date
  pausedBy: string
  priority: number
}

export interface MonitoringQueueState {
  pendingFlows: MonitoringQueueItem[]
  isPaused: boolean
  pausedBy?: string
  pausedAt?: Date
}

export enum MonitoringQueueStatus {
  PENDING = 'pending',
  EXECUTING = 'executing', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}