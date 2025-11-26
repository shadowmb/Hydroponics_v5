// Alert Types for Dashboard Integration
// 4 Alert Sources: Flow Execution, Sensor Validation, Hardware Health, System Performance

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertType = 'execution' | 'sensor' | 'hardware' | 'system'
export type AlertStatus = 'new' | 'acknowledged' | 'resolved'

export interface DashboardAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  message: string
  deviceName?: string
  deviceId?: string
  timestamp: string
  duration?: string  // "5 мин", "12 мин"
  metadata?: {
    module?: string
    tag?: string
    programId?: string
    blockId?: string
    blockType?: string
    businessCategory?: string
    businessOperation?: string
    value?: number
    expectedRange?: [number, number]
    responseTime?: number
  }
}

// Settings for Alert filtering and display
export interface AlertSettings {
  // 4 Alert Types - Enable/Disable
  showExecutionErrors: boolean     // Flow/Program execution failures
  showSensorAlerts: boolean        // Sensor validation warnings/errors
  showHardwareIssues: boolean      // Device/Controller connectivity issues
  showSystemAlerts: boolean        // Performance/Memory alerts

  // Severity Filter
  severityFilter: 'all' | 'critical' | 'critical_warning'

  // Display Options
  maxDisplayCount: number          // 3-10 alerts to show
  timeWindow: '6h' | '24h' | '7d'  // Time range for alerts
}

// API Response types for different alert sources
export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'analytics'
  tag: string
  module: string
  data: any
  context?: {
    programId?: string
    cycleId?: string
    blockId?: string
    deviceId?: string
    sessionId?: string
    business?: {
      category: string
      operation?: string
    }
  }
  storage: 'memory' | 'session' | 'persistent'
}

export interface DeviceHealthStatus {
  deviceId: string
  deviceName: string
  healthStatus: 'healthy' | 'warning' | 'error' | 'unknown'
  lastHealthCheck: string
  errorMessage?: string
  responseTime?: number
}

export interface FailedExecutionBlock {
  blockId: string
  blockName: string
  blockType: string
  blockStatus: 'failed'
  blockStartTime: string
  blockEndTime?: string
  duration?: number
  inputData?: any
  outputData?: any
}

// Service response types
export interface AlertsApiResponse {
  success: boolean
  data: {
    alerts: DashboardAlert[]
    count: number
    filter: any
    timestamp: string
  }
  error?: string
}

// Transform functions type
export type LogToAlertTransformer = (log: LogEntry) => DashboardAlert | null
export type HealthToAlertTransformer = (health: DeviceHealthStatus) => DashboardAlert | null