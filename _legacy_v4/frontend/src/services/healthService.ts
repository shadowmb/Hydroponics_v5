// ABOUTME: Health check service for monitoring backend and system component status
// ABOUTME: Provides real-time health status polling and reactive state management

import axios from 'axios'
import { ref, computed } from 'vue'
import { URLS, API_BASE_URL } from '../config/ports'

export interface HealthStatus {
  status: 'ready' | 'initializing' | 'degraded' | 'unknown'
  timestamp: string
  version: string
  environment: string
  components: {
    database: {
      status: string
      readyState: number
      healthy: boolean
      error?: {
        message: string
        code?: string
        uri?: string
      }
    }
  }
}

export interface SystemStatus {
  color: 'positive' | 'warning' | 'negative' | 'grey'
  icon: string
  text: string
  details?: string
}

// Reactive health status
const healthStatus = ref<HealthStatus | null>(null)
const lastCheckTime = ref<Date | null>(null)
const isChecking = ref(false)
const checkError = ref<string | null>(null)

// Polling configuration
let pollingInterval: number | null = null
const POLL_INTERVAL_MS = 60000 // 60 seconds

/**
 * Fetch current health status from backend
 */
export async function checkHealth(): Promise<HealthStatus | null> {
  if (isChecking.value) return healthStatus.value

  isChecking.value = true
  checkError.value = null

  try {
    const response = await axios.get<HealthStatus>(URLS.BACKEND_HEALTH, {
      timeout: 5000
    })

    //console.log('[HealthService] Raw response from /health:', response.data)
    //console.log('[HealthService] Database component:', response.data.components?.database)

    healthStatus.value = response.data
    lastCheckTime.value = new Date()

    return response.data
  } catch (error: any) {
    // Build detailed error message
    let errorMessage = 'Failed to check health'

    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Backend server is not responding'
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      errorMessage = 'Backend server timeout'
    } else if (error.response) {
      // Backend responded with error status (like 503), but may have data
      errorMessage = `Backend error: ${error.response.status} ${error.response.statusText}`

      // Use response data if available (backend sends health data even on 503)
      if (error.response.data) {
        console.log('[HealthService] Got error response with data:', error.response.data)
        healthStatus.value = error.response.data
        lastCheckTime.value = new Date()
        checkError.value = errorMessage
        return error.response.data
      }
    } else if (error.request) {
      errorMessage = 'No response from backend server'
    } else {
      errorMessage = error.message || 'Unknown error'
    }

    checkError.value = errorMessage

    // Set degraded status on error (only if no response data)
    healthStatus.value = {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      version: 'unknown',
      environment: 'unknown',
      components: {
        database: {
          status: 'disconnected',
          readyState: 0,
          healthy: false
        }
      }
    }

    return null
  } finally {
    isChecking.value = false
  }
}

/**
 * Start automatic health polling
 */
export function startHealthPolling() {
  if (pollingInterval !== null) {
    return // Already polling
  }

  // Initial check
  checkHealth()

  // Start polling
  pollingInterval = window.setInterval(() => {
    checkHealth()
  }, POLL_INTERVAL_MS)
}

/**
 * Stop automatic health polling
 */
export function stopHealthPolling() {
  if (pollingInterval !== null) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

/**
 * Attempt to reconnect to MongoDB
 */
export async function reconnectDatabase(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/database/reconnect`)

    // Trigger immediate health check to refresh status
    await checkHealth()

    return response.data
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data
    }

    return {
      success: false,
      message: 'Failed to communicate with backend',
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * Computed system status for UI display
 */
export const systemStatus = computed<SystemStatus>(() => {
  if (!healthStatus.value) {
    return {
      color: 'grey',
      icon: 'help',
      text: 'Проверка...',
      details: 'Checking system status'
    }
  }

  const status = healthStatus.value.status
  const dbHealthy = healthStatus.value.components.database.healthy

  switch (status) {
    case 'ready':
      if (dbHealthy) {
        return {
          color: 'positive',
          icon: 'check_circle',
          text: 'Онлайн',
          details: `System operational\nDatabase: ${healthStatus.value.components.database.status}`
        }
      } else {
        return {
          color: 'warning',
          icon: 'warning',
          text: 'Внимание',
          details: `Database status: ${healthStatus.value.components.database.status}\nDatabase not healthy`
        }
      }

    case 'initializing':
      return {
        color: 'warning',
        icon: 'hourglass_empty',
        text: 'Стартиране...',
        details: 'System initializing'
      }

    case 'degraded':
      // Build detailed error message for tooltip
      let details = checkError.value || 'System degraded'

      // Add database info if available
      if (healthStatus.value.components?.database) {
        const dbStatus = healthStatus.value.components.database.status
        details += `\nDatabase: ${dbStatus}`
      }

      return {
        color: 'negative',
        icon: 'error',
        text: 'Грешка',
        details
      }

    default:
      return {
        color: 'grey',
        icon: 'help',
        text: 'Неизвестно',
        details: 'Unknown status'
      }
  }
})

/**
 * Computed system issues for modal display
 */
export const systemIssues = computed(() => {
  const issues: Array<{
    severity: 'critical' | 'warning' | 'info'
    icon: string
    color: string
    title: string
    message: string
    details?: string
    timestamp?: Date
  }> = []

  if (!healthStatus.value) {
    return issues
  }

  const status = healthStatus.value.status
  const dbStatus = healthStatus.value.components?.database

  // Backend connectivity issues
  if (checkError.value) {
    issues.push({
      severity: 'critical',
      icon: 'cloud_off',
      color: 'negative',
      title: 'Backend Server Connection Failed',
      message: checkError.value,
      details: `Status: ${status}\nTimestamp: ${healthStatus.value.timestamp}`,
      timestamp: lastCheckTime.value || undefined
    })
  }

  // Database issues
  if (dbStatus && !dbStatus.healthy) {
    let dbMessage = `Database status: ${dbStatus.status}`
    let dbDetails = `Ready State: ${dbStatus.readyState}\n0 = disconnected\n1 = connected\n2 = connecting\n3 = disconnecting`

    // Add error details if available
    if (dbStatus.error) {
      console.log('[HealthService] Database error details:', dbStatus.error)
      dbMessage = dbStatus.error.message || dbMessage
      dbDetails = `Error Code: ${dbStatus.error.code || 'N/A'}\nURI: ${dbStatus.error.uri || 'N/A'}\n\n${dbDetails}`
    } else {
      console.log('[HealthService] No error details in dbStatus:', dbStatus)
    }

    issues.push({
      severity: dbStatus.readyState === 2 ? 'warning' : 'critical',
      icon: 'storage',
      color: dbStatus.readyState === 2 ? 'warning' : 'negative',
      title: 'Database Connection Issue',
      message: dbMessage,
      details: dbDetails,
      timestamp: lastCheckTime.value || undefined,
      actionButton: dbStatus.readyState === 0 ? {
        label: 'Свържи се',
        icon: 'refresh',
        handler: async () => {
          const result = await reconnectDatabase()
          if (result.success) {
            // Success notification will be shown by Quasar Notify
            console.log('✅ Database reconnected successfully')
          } else {
            console.error('❌ Database reconnection failed:', result.error)
          }
        }
      } : undefined
    })
  }

  return issues
})

// Export reactive refs for component usage
export const useHealthService = () => ({
  healthStatus: computed(() => healthStatus.value),
  systemStatus,
  systemIssues,
  lastCheckTime: computed(() => lastCheckTime.value),
  isChecking: computed(() => isChecking.value),
  checkError: computed(() => checkError.value),
  checkHealth,
  startHealthPolling,
  stopHealthPolling,
  reconnectDatabase
})
