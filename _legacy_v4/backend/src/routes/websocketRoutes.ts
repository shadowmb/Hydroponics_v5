// websocketRoutes.ts - WebSocket server for FlowExecutor real-time events and logging
import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { WebSocketManager } from '../modules/flowExecutor/core/WebSocketManager'
import { LogStorageManager } from '../services/LogStorageManager'
import { LogEntry } from '../services/UnifiedLoggingService'

interface LogSubscription {
  ws: WebSocket
  filters?: {
    level?: string[]
    tag?: string
    module?: string
  }
}

// Track log subscribers
const logSubscribers: LogSubscription[] = []

export function setupWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/flow'
  })
  
  const wsManager = WebSocketManager.getInstance()
  
  // Subscribe to log events from LogStorageManager
  LogStorageManager.subscribe(handleLogEntry)
  
  wss.on('connection', (ws: WebSocket, request) => {
    const clientIp = request.socket.remoteAddress
    console.log(`🔌 WebSocket client connected from ${clientIp}`)
    
    // Add client to WebSocketManager (for flow events)
    wsManager.addClient(ws)
    
    // Handle client messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        await handleClientMessage(ws, message, wsManager)
      } catch (error) {
        console.error('Invalid WebSocket message:', error)
        ws.send(JSON.stringify({
          type: 'error',
          timestamp: new Date().toISOString(),
          data: { error: 'Invalid message format' }
        }))
      }
    })
    
    ws.on('close', () => {
      console.log(`🔌 WebSocket client disconnected from ${clientIp}`)

      // Remove from log subscribers
      const index = logSubscribers.findIndex(sub => sub.ws === ws)
      if (index > -1) {
        logSubscribers.splice(index, 1)
      }
    })
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientIp}:`, error)
    })
  })
  
  console.log(`🚀 WebSocket server started on /ws/flow`)
  console.log(`📝 WebSocket logging events enabled`)
  return wss
}

async function handleClientMessage(ws: WebSocket, message: any, wsManager: any) {
  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString(),
        data: { message: 'pong' }
      }))
      break
      
    case 'subscribe':
      // Client wants to subscribe to specific events
      ws.send(JSON.stringify({
        type: 'subscribed',
        timestamp: new Date().toISOString(),
        data: { events: message.events || ['all'] }
      }))
      break

    case 'subscribe_logs':
      // Client wants to subscribe to log events
      const filters = message.filters || {}
      
      // Remove existing subscription for this client
      const existingIndex = logSubscribers.findIndex(sub => sub.ws === ws)
      if (existingIndex > -1) {
        logSubscribers.splice(existingIndex, 1)
      }
      
      // Add new subscription
      logSubscribers.push({
        ws,
        filters: {
          level: filters.level ? (Array.isArray(filters.level) ? filters.level : [filters.level]) : undefined,
          tag: filters.tag,
          module: filters.module
        }
      })
      
      ws.send(JSON.stringify({
        type: 'logs_subscribed',
        timestamp: new Date().toISOString(),
        data: { 
          message: 'Subscribed to log events',
          filters
        }
      }))
      break

    case 'unsubscribe_logs':
      // Client wants to unsubscribe from log events
      const subIndex = logSubscribers.findIndex(sub => sub.ws === ws)
      if (subIndex > -1) {
        logSubscribers.splice(subIndex, 1)
        ws.send(JSON.stringify({
          type: 'logs_unsubscribed',
          timestamp: new Date().toISOString(),
          data: { message: 'Unsubscribed from log events' }
        }))
      }
      break

    case 'get_recent_logs':
      // Client requests recent logs
      const limit = message.limit || 50
      const recentLogs = LogStorageManager.getMemoryLogs({ limit })
      
      ws.send(JSON.stringify({
        type: 'recent_logs',
        timestamp: new Date().toISOString(),
        data: {
          logs: recentLogs,
          count: recentLogs.length
        }
      }))
      break

    case 'hardware_health_update':
      // Handle hardware health status updates from SchedulerService
      console.log('Received hardware health update:', message.data)

      // Broadcast to all connected clients (already handled by WebSocketManager)
      // This case just acknowledges receipt and prevents "Unknown message type" error
      ws.send(JSON.stringify({
        type: 'health_update_received',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Hardware health update received',
          controllersOnline: message.data?.controllersOnline || 0
        }
      }))
      break

    case 'identify_client':
      // Client wants to identify itself with name and page
      const clientInfo = wsManager.getClientByWebSocket(ws)

      if (clientInfo) {
        wsManager.updateClientInfo(
          clientInfo.id,
          message.clientInfo?.name,
          message.clientInfo?.page
        )

        ws.send(JSON.stringify({
          type: 'client_identified',
          timestamp: new Date().toISOString(),
          data: {
            clientId: clientInfo.id,
            name: message.clientInfo?.name,
            page: message.clientInfo?.page
          }
        }))
      }
      break

    case 'request_initial_state':
      // Client requests current execution state - send initial execution data
      console.log('🔌 [WebSocket] Client requesting initial execution state via manual fetch')

      // Manually send initial execution state using sendToSpecificClient
      try {
        // Get current execution state from the API endpoint
        const response = await fetch('http://localhost:5000/api/v1/execution-sessions/current-execution')
        const data = await response.json() as any

        wsManager.sendToSpecificClient(ws, {
          type: 'initial_execution_state',
          timestamp: new Date().toISOString(),
          data: data.success ? data.data : null
        })
      } catch (error) {
        console.error('Failed to get initial execution state:', error)
        // Send fallback empty state
        wsManager.sendToSpecificClient(ws, {
          type: 'initial_execution_state',
          timestamp: new Date().toISOString(),
          data: null
        })
      }
      break

    default:
      console.log('Unknown WebSocket message type:', message.type)
  }
}

/**
 * Handle new log entry from LogStorageManager
 */
function handleLogEntry(logEntry: LogEntry): void {
  if (logSubscribers.length === 0) return

  // Send to all matching subscribers
  logSubscribers.forEach(subscription => {
    try {
      // Check if log entry matches subscriber filters
      if (shouldSendToSubscriber(logEntry, subscription.filters)) {
        const message = {
          type: 'log_entry',
          timestamp: new Date().toISOString(),
          data: {
            timestamp: logEntry.timestamp.toISOString(),
            level: logEntry.level,
            tag: logEntry.tag,
            module: logEntry.module,
            data: logEntry.data,
            context: logEntry.context
          }
        }

        subscription.ws.send(JSON.stringify(message))
      }
    } catch (error) {
      console.error('Failed to send log entry to WebSocket client:', error)
      
      // Remove failed subscription
      const index = logSubscribers.indexOf(subscription)
      if (index > -1) {
        logSubscribers.splice(index, 1)
      }
    }
  })
}

/**
 * Check if log entry should be sent to subscriber based on filters
 */
function shouldSendToSubscriber(logEntry: LogEntry, filters?: LogSubscription['filters']): boolean {
  if (!filters) return true

  // Check level filter
  if (filters.level && filters.level.length > 0) {
    if (!filters.level.includes(logEntry.level)) {
      return false
    }
  }

  // Check tag filter
  if (filters.tag) {
    if (!logEntry.tag.toLowerCase().includes(filters.tag.toLowerCase())) {
      return false
    }
  }

  // Check module filter
  if (filters.module) {
    if (!logEntry.module.toLowerCase().includes(filters.module.toLowerCase())) {
      return false
    }
  }

  return true
}

/**
 * Broadcast log entry to all subscribers (for external use)
 */
export function broadcastLogEntry(logEntry: LogEntry): void {
  handleLogEntry(logEntry)
}