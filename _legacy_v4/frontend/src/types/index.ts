// Base API Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: 'success' | 'error'
  timestamp: string
}

// Export notification types
export * from './notifications'

export interface ApiError {
  message: string
  status: number
  code?: string
}

// Device Types
export interface Device {
  _id: string
  name: string
  type: 'sensor' | 'pump' | 'valve' | 'light'
  pin: number
  isActive: boolean
  settings: Record<string, any>
  lastReading?: number
  lastError?: string
  createdAt: string
  updatedAt: string
}

// Task Types
export interface TaskAction {
  deviceId: string
  action: 'turn_on' | 'turn_off' | 'set_value' | 'read_sensor'
  value?: number
  duration?: number
}

export interface Task {
  _id: string
  name: string
  type: 'water' | 'fertilize' | 'light' | 'monitor' | 'custom'
  actions: TaskAction[]
  isActive: boolean
  priority: number
  description?: string
  createdAt: string
  updatedAt: string
}

// Program Types
export interface Cycle {
  taskId: string
  startTime: string
  duration?: number
  isActive: boolean
}

export interface Program {
  _id: string
  name: string
  description?: string
  cycles: Cycle[]
  isActive: boolean
  isRunning: boolean
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

// Settings Types
export interface SystemSettings {
  timezone: string
  language: string
  units: 'metric' | 'imperial'
  autoStart: boolean
  logLevel: 'info' | 'warn' | 'error' | 'debug'
  maxLogEntries: number
}

export interface NotificationSettings {
  email: {
    enabled: boolean
    recipients: string[]
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpPassword?: string
  }
  alerts: {
    systemErrors: boolean
    deviceFailures: boolean
    programCompletion: boolean
    lowWaterLevel: boolean
  }
}

export interface Thresholds {
  ph: { min: number; max: number }
  ec: { min: number; max: number }
  temperature: { min: number; max: number }
  humidity: { min: number; max: number }
  waterLevel: { min: number; critical: number }
}

export interface Settings {
  _id: string
  name: string
  system: SystemSettings
  notifications: NotificationSettings
  thresholds: Thresholds
  customSettings: Record<string, any>
  version: string
  createdAt: string
  updatedAt: string
}

// Controller Types
export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: Record<string, any>
}

export interface ExecutionState {
  currentProgramId?: string
  currentTaskId?: string
  isRunning: boolean
  lastExecutionTime?: string
  nextExecutionTime?: string
  executionCount: number
}

export interface Controller {
  _id: string
  name: string
  status: 'online' | 'offline' | 'error' | 'maintenance'
  executionState: ExecutionState
  logs: LogEntry[]
  systemInfo: {
    version: string
    uptime: number
    memoryUsage: number
    cpuUsage: number
  }
  lastHeartbeat: string
  createdAt: string
  updatedAt: string
}

// Active Program Types
export interface ActiveCycle {
  cycleId: string
  taskId: string
  startTime: string
  duration?: number
  lastExecuted?: string
  nextExecution: string
  executionCount: number
  isActive: boolean
}

export interface ActiveProgram {
  _id: string
  programId: string
  controllerId: string
  name: string
  status: 'running' | 'paused' | 'stopped' | 'error' | 'completed'
  startedAt: string
  pausedAt?: string
  stoppedAt?: string
  activeCycles: ActiveCycle[]
  totalExecutions: number
  lastError?: string
  estimatedCompletion?: string
  createdAt: string
  updatedAt: string
}

// UI Types
export interface NavigationItem {
  label: string
  icon: string
  to: string
  children?: NavigationItem[]
}

export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  details?: any
}

// Target Registry Types
export interface TargetUsage {
  blockId: string
  blockType: 'actuator' | 'if' | 'loop' | 'custom'
  fieldName: string
  lastUsed: string
  flowId?: string
  flowName?: string
}

// DEACTIVATED: Target Registry System - Phase 1C
// export interface TargetRegistryItem {
//   _id: string
//   visualName: string
//   targetKey: string
//   description?: string
//   type: 'control' | 'device'
//   deviceId?: string
//   deviceName?: string
//   deviceType?: string
//   isActive: boolean
//   
//   // Usage tracking fields
//   usageCount: number
//   usedInBlocks: TargetUsage[]
//   firstUsed?: string
//   lastUsed?: string
//   
//   createdAt: string
//   updatedAt: string
// }