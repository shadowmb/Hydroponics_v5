// ABOUTME: Alert data service for fetching and transforming alerts from backend logging API
// ABOUTME: Connects 4 alert sources through UnifiedLoggingService to dashboard AlertContainer

import type {
  DashboardAlert,
  AlertSettings,
  LogEntry,
  DeviceHealthStatus,
  FailedExecutionBlock,
  AlertsApiResponse,
  LogToAlertTransformer,
  HealthToAlertTransformer
} from '../types/alerts'
import { API_BASE_URL } from '../config/ports'

// Tag-to-Alert Type Mapping for new LogTags system
const TAG_TO_ALERT_TYPE: Record<string, DashboardAlert['type']> = {
  // Hardware alerts
  'controller:connect:failed': 'hardware',
  'controller:health:offline': 'hardware',
  'controller.disconnect.failed': 'hardware',
  'controller.discovery.failed': 'hardware',
  'device:connect:failed': 'hardware',
  'device:health:offline': 'hardware',
  'network:udp:timeout': 'hardware',
  'network:discovery:failed': 'hardware',

  // Execution alerts
  'flow:execute:failed': 'execution',
  'flow:block:failed': 'execution',
  'device:command:failed': 'execution',

  // Sensor alerts
  'sensor:validation:failed': 'sensor',
  'sensor:range:critical': 'sensor',
  'sensor:range:warning': 'sensor',
  'sensor:calibration:failed': 'sensor',

  // System alerts
  'system:startup:failed': 'system',
  'system:recovery:failed': 'system',
  'system:health:critical': 'system',
  'system:health:warning': 'system'
}

// Business category to alert type mapping
const BUSINESS_CATEGORY_TO_ALERT_TYPE: Record<string, DashboardAlert['type']> = {
  'controller': 'hardware',
  'device': 'execution',
  'sensor': 'sensor',
  'system': 'system',
  'network': 'hardware',
  'flow': 'execution'
}

// Transform log entries to dashboard alerts
const logToAlertTransformer: LogToAlertTransformer = (log: LogEntry): DashboardAlert | null => {
  // Filter only relevant alert-worthy logs
  if (log.level !== 'error' && log.level !== 'warn') return null

  // Determine alert type from log tag or business category
  let alertType: DashboardAlert['type'] = 'system'
  let severity: DashboardAlert['severity'] = log.level === 'error' ? 'critical' : 'warning'

  // First try exact tag match
  if (TAG_TO_ALERT_TYPE[log.tag]) {
    alertType = TAG_TO_ALERT_TYPE[log.tag]
  } else if (log.context?.business?.category && BUSINESS_CATEGORY_TO_ALERT_TYPE[log.context.business.category]) {
    // Fallback to business category
    alertType = BUSINESS_CATEGORY_TO_ALERT_TYPE[log.context.business.category]
  } else {
    // Pattern matching for tags that start with category
    if (log.tag.startsWith('controller:') || log.tag.startsWith('network:')) {
      alertType = 'hardware'
    } else if (log.tag.startsWith('flow:') || log.tag.startsWith('device:command:')) {
      alertType = 'execution'
    } else if (log.tag.startsWith('sensor:')) {
      alertType = 'sensor'
    } else if (log.tag.startsWith('system:')) {
      alertType = 'system'
    }
  }

  // Extract message from structured log data
  const logMessage = typeof log.data === 'object' && log.data !== null
    ? log.data.message || log.data.reason || log.data.error || 'Структуриран лог без съобщение'
    : typeof log.data === 'string'
    ? log.data
    : 'Неизвестен проблем'

  // Extract device information from structured data
  const deviceName = typeof log.data === 'object' && log.data !== null
    ? log.data.controllerName || log.data.deviceName
    : log.context?.deviceId ? `Устройство ${log.context.deviceId}` : undefined

  const deviceId = typeof log.data === 'object' && log.data !== null
    ? log.data.controllerId || log.data.deviceId
    : log.context?.deviceId

  // Create dashboard alert
  return {
    id: `log-${log.timestamp}-${Math.random().toString(36).substr(2, 5)}`,
    type: alertType,
    severity,
    status: 'new',
    title: getAlertTitle(log.tag, alertType),
    message: logMessage,
    deviceName,
    deviceId,
    timestamp: log.timestamp,
    metadata: {
      module: log.module,
      tag: log.tag,
      programId: log.context?.programId,
      blockId: log.context?.blockId,
      businessCategory: log.context?.business?.category,
      businessOperation: log.context?.business?.operation,
      value: typeof log.data === 'object' && log.data !== null ? log.data.value : undefined,
      expectedRange: typeof log.data === 'object' && log.data !== null ? log.data.expectedRange : undefined
    }
  }
}

// Transform device health to dashboard alerts
const healthToAlertTransformer: HealthToAlertTransformer = (health: DeviceHealthStatus): DashboardAlert | null => {
  if (health.healthStatus === 'healthy') return null

  return {
    id: `health-${health.deviceId}-${Date.now()}`,
    type: 'hardware',
    severity: health.healthStatus === 'error' ? 'critical' : 'warning',
    status: 'new',
    title: 'Хардуерен проблем',
    message: health.errorMessage || `Устройство ${health.deviceName} не отговаря`,
    deviceName: health.deviceName,
    deviceId: health.deviceId,
    timestamp: health.lastHealthCheck,
    metadata: {
      responseTime: health.responseTime
    }
  }
}

// Get alert title from log tag and type
function getAlertTitle(tag: string, type: DashboardAlert['type']): string {
  const titleMap: Record<string, string> = {
    // Hardware alerts
    'controller:connect:failed': 'Контролер не се свързва',
    'controller:health:offline': 'Контролер офлайн',
    'controller.disconnect.failed': 'Грешка при изключване',
    'controller.discovery.failed': 'Контролер не е открит',
    'device:connect:failed': 'Устройство не се свързва',
    'device:health:offline': 'Устройство офлайн',
    'network:udp:timeout': 'Мрежова грешка',
    'network:discovery:failed': 'Мрежово откриване неуспешно',

    // Execution alerts
    'flow:execute:failed': 'Грешка при изпълнение на поток',
    'flow:block:failed': 'Грешка при изпълнение на блок',
    'device:command:failed': 'Команда към устройство неуспешна',

    // Sensor alerts
    'sensor:validation:failed': 'Грешка при валидация на сензор',
    'sensor:range:critical': 'Критична стойност на сензор',
    'sensor:range:warning': 'Стойност извън граници',
    'sensor:calibration:failed': 'Грешка при калибриране',

    // System alerts
    'system:startup:failed': 'Грешка при стартиране',
    'system:recovery:failed': 'Грешка при възстановяване',
    'system:health:critical': 'Критична системна грешка',
    'system:health:warning': 'Системно предупреждение'
  }

  return titleMap[tag] || (type === 'execution' ? 'Грешка при изпълнение' :
                           type === 'sensor' ? 'Проблем със сензор' :
                           type === 'hardware' ? 'Хардуерен проблем' : 'Системен проблем')
}

// Calculate time window for API filter
function getTimeWindowMs(timeWindow: AlertSettings['timeWindow']): number {
  const now = Date.now()
  switch (timeWindow) {
    case '6h': return now - (6 * 60 * 60 * 1000)
    case '24h': return now - (24 * 60 * 60 * 1000)
    case '7d': return now - (7 * 24 * 60 * 60 * 1000)
    default: return now - (24 * 60 * 60 * 1000)
  }
}

// Apply severity filter
function matchesSeverityFilter(alert: DashboardAlert, filter: AlertSettings['severityFilter']): boolean {
  switch (filter) {
    case 'all': return true
    case 'critical': return alert.severity === 'critical'
    case 'critical_warning': return alert.severity === 'critical' || alert.severity === 'warning'
    default: return true
  }
}

// Apply alert type filters
function matchesTypeFilters(alert: DashboardAlert, settings: AlertSettings): boolean {
  switch (alert.type) {
    case 'execution': return settings.showExecutionErrors
    case 'sensor': return settings.showSensorAlerts
    case 'hardware': return settings.showHardwareIssues
    case 'system': return settings.showSystemAlerts
    default: return false
  }
}

// Main alert service class
export class AlertService {
  // Fetch alerts from all 4 systems
  async fetchAlerts(settings: AlertSettings): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = []

    try {
      // 1. Fetch Flow Execution Errors from ExecutionSession
      if (settings.showExecutionErrors) {
        const executionAlerts = await this.fetchExecutionAlerts(settings.timeWindow)
        alerts.push(...executionAlerts)
      }

      // 2. Fetch Sensor Validation Alerts from SensorHealthValidator
      if (settings.showSensorAlerts) {
        const sensorAlerts = await this.fetchSensorAlerts(settings.timeWindow)
        alerts.push(...sensorAlerts)
      }

      // 3. Fetch Hardware Health Issues from HardwareHealthChecker
      if (settings.showHardwareIssues) {
        const hardwareAlerts = await this.fetchHardwareAlerts(settings.timeWindow)
        alerts.push(...hardwareAlerts)
      }

      // 4. Fetch System Performance Alerts from UnifiedLoggingService
      if (settings.showSystemAlerts) {
        const systemAlerts = await this.fetchSystemAlerts(settings.timeWindow)
        alerts.push(...systemAlerts)
      }

      // Apply filters and sort
      const filteredAlerts = alerts
        .filter(alert => matchesSeverityFilter(alert, settings.severityFilter))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, settings.maxDisplayCount)

      console.log(`📊 [AlertService] Loaded ${filteredAlerts.length} alerts from 4 systems`)
      return filteredAlerts

    } catch (error) {
      console.error('❌ [AlertService] Failed to fetch alerts:', error)
      return []
    }
  }

  // 1. Fetch Flow Execution Errors from ExecutionSession failed blocks
  async fetchExecutionAlerts(timeWindow: AlertSettings['timeWindow']): Promise<DashboardAlert[]> {
    try {
      const since = new Date(getTimeWindowMs(timeWindow)).toISOString()
      //console.log(`🔍 [AlertService] Fetching execution alerts since ${since}`)

      // Get recent blocks with failed status
      const response = await fetch(`${API_BASE_URL}/execution-sessions/recent-blocks?limit=50`)

      //console.log(`🌐 [AlertService] API response status: ${response.status}`)

      if (!response.ok) {
        console.warn(`⚠️ [AlertService] API returned ${response.status}`)
        return []
      }

      const result = await response.json()
      const blocks = result.blocks || []

      //console.log(`📦 [AlertService] Received ${blocks.length} total blocks`)

      // Filter failed blocks within time window
      const failedBlocks = blocks.filter((block: any) =>
        block.blockStatus === 'failed' &&
        new Date(block.blockStartTime) >= new Date(since)
      )

      //console.log(`❌ [AlertService] Found ${failedBlocks.length} failed blocks in time window`)

      if (failedBlocks.length > 0) {
        console.log('🔴 [AlertService] Failed blocks:', failedBlocks.map((b: any) => ({
          id: b.blockId,
          name: b.blockName,
          status: b.blockStatus,
          startTime: b.blockStartTime
        })))
      }

      return failedBlocks.map((block: any) => ({
        id: `exec-${block.blockId}`,
        type: 'execution' as const,
        severity: 'critical' as const,
        status: 'new' as const,
        title: 'Грешка при изпълнение',
        message: `Блок "${block.blockName}" се провали при изпълнение`,
        deviceName: block.blockType === 'sensor' || block.blockType === 'actuator' ? `${block.blockType} устройство` : undefined,
        timestamp: block.blockStartTime,
        duration: block.duration ? `${Math.round(block.duration / 1000)} сек` : undefined,
        metadata: {
          module: 'FlowExecutor',
          blockId: block.blockId,
          blockType: block.blockType
        }
      }))
    } catch (error) {
      console.error('❌ [AlertService] Failed to fetch execution alerts:', error)
      return []
    }
  }

  // 2. Fetch Sensor Validation Alerts from UnifiedLoggingService logs
  private async fetchSensorAlerts(timeWindow: AlertSettings['timeWindow']): Promise<DashboardAlert[]> {
    try {
      // Use real ULS API endpoint for all warn/error logs
      const response = await fetch(`${API_BASE_URL}/logs?level=warn,error&limit=50`)

      if (!response.ok) return []

      const result = await response.json()
      const logs = result.data?.logs || []

      // Filter logs using new LogTags system - sensor category
      const sensorLogs = logs.filter((log: any) => {
        // Check by tag pattern
        const isSensorTag = log.tag && log.tag.startsWith('sensor:')
        // Check by business category
        const isSensorCategory = log.context?.business?.category === 'sensor'
        // Check specific sensor-related tags
        const specificSensorTags = [
          'sensor:validation:failed',
          'sensor:range:warning',
          'sensor:range:critical',
          'sensor:calibration:failed'
        ]
        const isSpecificSensorTag = specificSensorTags.includes(log.tag)

        return isSensorTag || isSensorCategory || isSpecificSensorTag
      })

      return sensorLogs.map((log: any) => {
        const transformed = logToAlertTransformer(log)
        return transformed ? {
          ...transformed,
          id: `sensor-${log.timestamp}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'sensor' as const
        } : null
      }).filter(Boolean)
    } catch (error) {
      console.warn('Failed to fetch sensor alerts:', error)
      return []
    }
  }

  // 3. Fetch Hardware Health Issues from UnifiedLoggingService logs
  private async fetchHardwareAlerts(timeWindow: AlertSettings['timeWindow']): Promise<DashboardAlert[]> {
    try {
      // Use real ULS API endpoint for all warn/error logs
      const response = await fetch(`${API_BASE_URL}/logs?level=warn,error&limit=50`)

      if (!response.ok) return []

      const result = await response.json()
      const logs = result.data?.logs || []

      // Filter logs using new LogTags system - hardware related categories
      const hardwareLogs = logs.filter((log: any) => {
        // Check by tag pattern
        const isControllerTag = log.tag && log.tag.startsWith('controller:')
        const isNetworkTag = log.tag && log.tag.startsWith('network:')
        const isDeviceHardwareTag = log.tag && (log.tag.startsWith('device:connect:') || log.tag.startsWith('device:health:'))

        // Check by business category
        const isHardwareCategory = log.context?.business?.category === 'controller' ||
                                  log.context?.business?.category === 'network'

        // Check specific hardware-related tags
        const specificHardwareTags = [
          'controller:connect:failed',
          'controller:health:offline',
          'controller.disconnect.failed',
          'controller.discovery.failed',
          'device:connect:failed',
          'device:health:offline',
          'network:udp:timeout',
          'network:discovery:failed',
          'system:recovery:failed'
        ]
        const isSpecificHardwareTag = specificHardwareTags.includes(log.tag)

        return isControllerTag || isNetworkTag || isDeviceHardwareTag || isHardwareCategory || isSpecificHardwareTag
      })

      return hardwareLogs.map((log: any) => {
        const transformed = logToAlertTransformer(log)
        return transformed ? {
          ...transformed,
          id: `hardware-${log.timestamp}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'hardware' as const
        } : null
      }).filter(Boolean)
    } catch (error) {
      console.warn('Failed to fetch hardware alerts:', error)
      return []
    }
  }

  // 4. Fetch System Performance Alerts from UnifiedLoggingService analytics
  private async fetchSystemAlerts(timeWindow: AlertSettings['timeWindow']): Promise<DashboardAlert[]> {
    try {
      // Use real ULS API endpoint for all info/warn/error logs
      const response = await fetch(`${API_BASE_URL}/logs?level=info,warn,error&limit=50`)

      if (!response.ok) return []

      const result = await response.json()
      const logs = result.data?.logs || []

      // Filter logs using new LogTags system - system category
      const systemLogs = logs.filter((log: any) => {
        // Check by tag pattern
        const isSystemTag = log.tag && log.tag.startsWith('system:')

        // Check by business category
        const isSystemCategory = log.context?.business?.category === 'system'

        // Check specific system-related tags
        const specificSystemTags = [
          'system:startup:failed',
          'system:recovery:failed',
          'system:health:check',
          'system:health:warning',
          'system:health:critical',
          'system.health.failed'
        ]
        const isSpecificSystemTag = specificSystemTags.includes(log.tag)

        // Include info level for system health checks
        const isHealthCheck = log.tag === 'system:health:check' && log.level === 'info'

        return isSystemTag || isSystemCategory || isSpecificSystemTag || isHealthCheck
      })

      return systemLogs.map((log: any) => {
        const transformed = logToAlertTransformer(log)
        return transformed ? {
          ...transformed,
          id: `system-${log.timestamp}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'system' as const,
          // For system health checks, show as info even if they contain warnings
          severity: log.tag === 'system:health:check' ? 'info' as const :
                   (log.level === 'error' ? 'critical' as const :
                    log.level === 'warn' ? 'warning' as const : 'info' as const)
        } : null
      }).filter(Boolean)
    } catch (error) {
      console.warn('Failed to fetch system alerts:', error)
      return []
    }
  }

  // Helper method to extract device name from log message
  private extractDeviceFromMessage(message: string): string | undefined {
    if (!message) return undefined

    // Extract device names from common log patterns
    const patterns = [
      /ArduinoUno_01/,
      /WeMos 01/,
      /Sensor "([^"]+)"/,
      /Device "([^"]+)"/,
      /controller: ([^"]+)/
    ]

    for (const pattern of patterns) {
      const match = message.match(pattern)
      if (match) {
        return match[1] || match[0]
      }
    }

    return undefined
  }

  // Mock alert data for development (fallback)
  getMockAlerts(settings: AlertSettings): DashboardAlert[] {
    const mockAlerts: DashboardAlert[] = [
      {
        id: 'mock-1',
        type: 'execution',
        severity: 'critical',
        status: 'new',
        title: 'Грешка при изпълнение',
        message: 'Блок "Напояване зона 1" не успя да се изпълни',
        deviceName: 'Помпа 1',
        deviceId: 'pump-001',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        duration: '5 мин',
        metadata: {
          module: 'FlowExecutor',
          programId: 'prog-001',
          blockId: 'block-watering-1'
        }
      },
      {
        id: 'mock-2',
        type: 'sensor',
        severity: 'warning',
        status: 'new',
        title: 'Стойност извън граници',
        message: 'pH сензор показва стойност 8.5 (очаквано: 6.0-7.0)',
        deviceName: 'pH Сензор A',
        deviceId: 'ph-sensor-a',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        duration: '12 мин',
        metadata: {
          module: 'SensorHealthValidator',
          value: 8.5,
          expectedRange: [6.0, 7.0]
        }
      },
      {
        id: 'mock-3',
        type: 'hardware',
        severity: 'critical',
        status: 'new',
        title: 'Устройство офлайн',
        message: 'Контролер зона 2 не отговаря повече от 10 минути',
        deviceName: 'Контролер Зона 2',
        deviceId: 'controller-zone-2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        duration: '15 мин',
        metadata: {
          module: 'HardwareHealthChecker',
          responseTime: 0
        }
      }
    ]

    return mockAlerts
      .filter(alert => matchesTypeFilters(alert, settings))
      .filter(alert => matchesSeverityFilter(alert, settings.severityFilter))
      .slice(0, settings.maxDisplayCount)
  }
}

// Export singleton instance
export const alertService = new AlertService()