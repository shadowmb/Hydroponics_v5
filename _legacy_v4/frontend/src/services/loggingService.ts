// loggingService.ts - Frontend service за работа с централизираната logging система

import axios from 'axios'
import { API_BASE_URL, WEBSOCKET_URL } from '../config/ports'
import type { ApiResponse } from '../types'

export interface LogContext {
  programId?: string
  cycleId?: string
  blockId?: string
  sessionId?: string
  deviceId?: string
  controllerId?: string

  // NEW: Source location tracking
  source?: {
    file: string
    method?: string
    line?: number
  }

  // NEW: Business context
  business?: {
    category: 'device' | 'sensor' | 'flow' | 'system' | 'recovery' | 'network' | 'controller'
    operation: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'analytics'
  tag: string
  module: string
  data: any
  context?: LogContext
  storage: 'memory' | 'session' | 'persistent'
}

export interface LogFilter {
  level?: string[]
  tag?: string
  module?: string
  startTime?: Date
  endTime?: Date
  limit?: number
  source?: 'memory' | 'database' | 'all'

  // NEW: Category and business context filtering
  category?: string[]  // device, sensor, flow, system, controller, network
  severity?: string[]  // low, medium, high, critical
  operation?: string   // business operation filtering
}

export interface StorageStats {
  memoryEntries: number
  databaseEntries: number
  memoryUsage: string
  oldestEntry?: Date
  newestEntry?: Date
}

export interface LogsResponse {
  logs: LogEntry[]
  count: number
  filter?: LogFilter
  source?: string
}

export interface WebSocketMessage {
  type: string
  timestamp: string
  data: any
}

class LoggingService {
  private ws: WebSocket | null = null
  private liveLogs: LogEntry[] = []
  private liveLogCallbacks: ((entry: LogEntry) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Get logs with filters
   */
  async getLogs(filter: LogFilter = {}): Promise<LogsResponse> {
    try {
      console.log('🔍 [DEBUG] Starting getLogs with filter:', filter)
      
      const params: any = {}
      
      if (filter.level && filter.level.length > 0) {
        params.level = filter.level.join(',')
      }
      
      if (filter.tag) {
        params.tag = filter.tag
      }
      
      if (filter.module) {
        params.module = filter.module
      }
      
      if (filter.startTime) {
        params.startTime = filter.startTime.toISOString()
      }
      
      if (filter.endTime) {
        params.endTime = filter.endTime.toISOString()
      }
      
      if (filter.limit) {
        params.limit = filter.limit
      }
      
      if (filter.source) {
        params.source = filter.source
      }

      if (filter.category && filter.category.length > 0) {
        params.category = filter.category.join(',')
      }

      if (filter.severity && filter.severity.length > 0) {
        params.severity = filter.severity.join(',')
      }

      if (filter.operation) {
        params.operation = filter.operation
      }

      console.log('🔍 [DEBUG] Making API call to /logs with params:', params)
      
      const response = await axios.get<ApiResponse<LogsResponse>>(`${API_BASE_URL}/logs`, { params })
      
      console.log('🔍 [DEBUG] Full response object:', response)
      console.log('🔍 [DEBUG] Response.data:', response.data)
      console.log('🔍 [DEBUG] Response.data type:', typeof response.data)
      console.log('🔍 [DEBUG] Response.data.success:', response.data?.success)
      console.log('🔍 [DEBUG] Response.data.data:', response.data?.data)
      
      if (response.data && response.data.success) {
        console.log('🔍 [DEBUG] Success! Returning data:', response.data.data)
        return response.data.data
      } else {
        console.log('🔍 [DEBUG] Response not successful, throwing error')
        throw new Error(response.data?.message || 'Failed to fetch logs')
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Error in getLogs:', error)
      console.error('🔍 [DEBUG] Error type:', typeof error)
      console.error('🔍 [DEBUG] Error message:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Get live logs from memory only
   */
  async getLiveLogs(filter: LogFilter = {}): Promise<LogsResponse> {
    try {
      const params: any = {}
      
      if (filter.level && filter.level.length > 0) {
        params.level = filter.level.join(',')
      }
      
      if (filter.tag) {
        params.tag = filter.tag
      }
      
      if (filter.module) {
        params.module = filter.module
      }
      
      if (filter.limit) {
        params.limit = filter.limit
      }

      if (filter.category && filter.category.length > 0) {
        params.category = filter.category.join(',')
      }

      if (filter.severity && filter.severity.length > 0) {
        params.severity = filter.severity.join(',')
      }

      if (filter.operation) {
        params.operation = filter.operation
      }

      const response = await axios.get<ApiResponse<LogsResponse>>(`${API_BASE_URL}/logs/live`, { params })
      
      if (response.data && response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data?.message || 'Failed to fetch live logs')
      }
    } catch (error) {
      console.error('Failed to get live logs:', error)
      throw error
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      console.log('🔍 [DEBUG] Starting getStats')
      
      const response = await axios.get<ApiResponse<StorageStats>>(`${API_BASE_URL}/logs/stats`)
      
      console.log('🔍 [DEBUG] Stats - Full response object:', response)
      console.log('🔍 [DEBUG] Stats - Response.data:', response.data)
      console.log('🔍 [DEBUG] Stats - Response.data type:', typeof response.data)
      console.log('🔍 [DEBUG] Stats - Response.data.success:', response.data?.success)
      console.log('🔍 [DEBUG] Stats - Response.data.data:', response.data?.data)
      
      if (response.data && response.data.success) {
        console.log('🔍 [DEBUG] Stats - Success! Returning data:', response.data.data)
        return response.data.data
      } else {
        console.log('🔍 [DEBUG] Stats - Response not successful, throwing error')
        throw new Error(response.data?.message || 'Failed to fetch stats')
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Stats - Error:', error)
      console.error('🔍 [DEBUG] Stats - Error type:', typeof error)
      console.error('🔍 [DEBUG] Stats - Error message:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(startTime?: Date, endTime?: Date): Promise<any[]> {
    try {
      const params: any = {}
      
      if (startTime) {
        params.startTime = startTime.toISOString()
      }
      
      if (endTime) {
        params.endTime = endTime.toISOString()
      }

      const response = await axios.get<ApiResponse<{ analytics: any[] }>>(`${API_BASE_URL}/logs/analytics`, { params })
      
      if (response.data && response.data.success) {
        return response.data.data.analytics
      } else {
        throw new Error(response.data?.message || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Failed to get analytics:', error)
      throw error
    }
  }

  /**
   * Clear memory logs
   */
  async clearMemoryLogs(): Promise<void> {
    try {
      const response = await axios.delete<ApiResponse<any>>(`${API_BASE_URL}/logs/memory`)
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to clear memory logs')
      }
    } catch (error) {
      console.error('Failed to clear memory logs:', error)
      throw error
    }
  }

  /**
   * Clear database logs
   */
  async clearDatabaseLogs(filter: LogFilter = {}): Promise<number> {
    try {
      const params: any = {}
      
      if (filter.level && filter.level.length > 0) {
        params.level = filter.level.join(',')
      }
      
      if (filter.module) {
        params.module = filter.module
      }
      
      if (filter.startTime) {
        params.startTime = filter.startTime.toISOString()
      }
      
      if (filter.endTime) {
        params.endTime = filter.endTime.toISOString()
      }

      if (filter.category && filter.category.length > 0) {
        params.category = filter.category.join(',')
      }

      if (filter.severity && filter.severity.length > 0) {
        params.severity = filter.severity.join(',')
      }

      if (filter.operation) {
        params.operation = filter.operation
      }

      const response = await axios.delete<ApiResponse<{ deletedCount: number }>>(`${API_BASE_URL}/logs/database`, { params })
      
      if (response.data && response.data.success) {
        return response.data.data.deletedCount
      } else {
        throw new Error(response.data?.message || 'Failed to clear database logs')
      }
    } catch (error) {
      console.error('Failed to clear database logs:', error)
      throw error
    }
  }

  /**
   * Create test log entry
   */
  async createTestLog(level: string = 'info', tag: string = 'test', module: string = 'frontend-test', data: any = { message: 'Test log from frontend' }): Promise<void> {
    try {
      const response = await axios.post<ApiResponse<any>>(`${API_BASE_URL}/logs/test-log`, {
        level,
        tag,
        module,
        data
      })
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to create test log')
      }
    } catch (error) {
      console.error('Failed to create test log:', error)
      throw error
    }
  }

  /**
   * Configure logging settings
   */
  async updateConfig(enabled?: boolean, debugMode?: boolean): Promise<void> {
    try {
      const response = await axios.post<ApiResponse<any>>(`${API_BASE_URL}/logs/config`, {
        enabled,
        debugMode
      })
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to update config')
      }
    } catch (error) {
      console.error('Failed to update config:', error)
      throw error
    }
  }

  /**
   * Subscribe to live log events via WebSocket
   */
  subscribeToLiveLogs(callback: (entry: LogEntry) => void, filters?: LogFilter): void {
    this.liveLogCallbacks.push(callback)
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket()
    }
    
    // Subscribe to log events
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_logs',
        filters: {
          level: filters?.level,
          tag: filters?.tag,
          module: filters?.module,
          category: filters?.category,
          severity: filters?.severity,
          operation: filters?.operation
        }
      }))
    }
  }

  /**
   * Unsubscribe from live log events
   */
  unsubscribeFromLiveLogs(callback?: (entry: LogEntry) => void): void {
    if (callback) {
      const index = this.liveLogCallbacks.indexOf(callback)
      if (index > -1) {
        this.liveLogCallbacks.splice(index, 1)
      }
    } else {
      this.liveLogCallbacks = []
    }
    
    if (this.liveLogCallbacks.length === 0 && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe_logs'
      }))
    }
  }

  /**
   * Connect to WebSocket for real-time log events
   */
  private connectWebSocket(): void {
    try {
      const wsUrl = process.env.VUE_APP_WS_URL || WEBSOCKET_URL
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('📝 Connected to logging WebSocket')
        this.reconnectAttempts = 0

        // Identify client first
        this.ws?.send(JSON.stringify({
          type: 'identify_client',
          clientInfo: {
            name: 'SystemLogs',
            page: 'logs'
          }
        }))

        // Request recent logs
        this.ws?.send(JSON.stringify({
          type: 'get_recent_logs',
          limit: 50
        }))
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleWebSocketMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      this.ws.onclose = () => {
        console.log('📝 Logging WebSocket disconnected')
        this.attemptReconnect()
      }
      
      this.ws.onerror = (error) => {
        console.error('📝 Logging WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect to logging WebSocket:', error)
    }
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'log_entry':
        const logEntry: LogEntry = {
          timestamp: message.data.timestamp,
          level: message.data.level,
          tag: message.data.tag,
          module: message.data.module,
          data: message.data.data,
          context: message.data.context,
          storage: 'memory' // WebSocket entries are always from memory
        }
        
        // Add to live logs
        this.liveLogs.unshift(logEntry)
        
        // Keep only latest 500 entries
        if (this.liveLogs.length > 500) {
          this.liveLogs = this.liveLogs.slice(0, 500)
        }
        
        // Notify callbacks
        this.liveLogCallbacks.forEach(callback => {
          try {
            callback(logEntry)
          } catch (error) {
            console.error('Log callback failed:', error)
          }
        })
        break
        
      case 'recent_logs':
        // Handle recent logs response
        if (message.data.logs && Array.isArray(message.data.logs)) {
          this.liveLogs = message.data.logs
        }
        break
        
      case 'logs_subscribed':
        console.log('📝 Subscribed to log events:', message.data)
        break
        
      case 'logs_unsubscribed':
        console.log('📝 Unsubscribed from log events')
        break
        
      default:
        // Handle other WebSocket message types (flow events, etc.)
        break
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('📝 Max WebSocket reconnect attempts reached')
      return
    }
    
    this.reconnectAttempts++
    
    setTimeout(() => {
      console.log(`📝 Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connectWebSocket()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  /**
   * Export logs to file
   */
  async exportLogs(filter: LogFilter = {}, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const logsResponse = await this.getLogs(filter)
      const logs = logsResponse.logs
      
      let content: string
      let mimeType: string
      
      if (format === 'csv') {
        const headers = ['Timestamp', 'Level', 'Module', 'Tag', 'Data', 'Context']
        const rows = logs.map(log => [
          log.timestamp,
          log.level,
          log.module,
          log.tag,
          typeof log.data === 'object' ? JSON.stringify(log.data) : String(log.data),
          log.context ? JSON.stringify(log.context) : ''
        ])
        
        content = [headers, ...rows]
          .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
          .join('\n')
        
        mimeType = 'text/csv'
      } else {
        content = JSON.stringify(logs, null, 2)
        mimeType = 'application/json'
      }
      
      return new Blob([content], { type: mimeType })
    } catch (error) {
      console.error('Failed to export logs:', error)
      throw error
    }
  }

  /**
   * Get current live logs from memory
   */
  getLiveLogsFromMemory(): LogEntry[] {
    return [...this.liveLogs]
  }

  /**
   * Get available categories for filtering
   */
  getAvailableCategories(): string[] {
    return ['device', 'sensor', 'flow', 'system', 'controller', 'network']
  }

  /**
   * Parse category from tag (first part before colon)
   */
  parseTagCategory(tag: string): string | null {
    const parts = tag.split(':')
    return parts.length >= 2 ? parts[0] : null
  }

  /**
   * Get source location string from log entry
   */
  getSourceLocation(entry: LogEntry): string | null {
    if (entry.context?.source?.file) {
      const method = entry.context.source.method ? `:${entry.context.source.method}` : ''
      const line = entry.context.source.line ? `:${entry.context.source.line}` : ''
      return `${entry.context.source.file}${method}${line}`
    }
    return null
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.liveLogCallbacks = []
    this.liveLogs = []
  }
}

// Export singleton instance
export const loggingService = new LoggingService()

// Export types
export type { LogEntry, LogFilter, StorageStats, LogsResponse, LogContext }