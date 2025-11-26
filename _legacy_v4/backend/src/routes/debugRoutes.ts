// ABOUTME: Debug routes for WebSocket client monitoring and system diagnostics
// ABOUTME: Provides real-time information about connected clients, execution state, and system health

import express from 'express'
import { WebSocketManager } from '../modules/flowExecutor/core/WebSocketManager'

const router = express.Router()

// Response helper function
const sendResponse = (res: express.Response, success: boolean, data?: any, error?: string | null, message?: string | null) => {
  return res.json({
    success,
    data: data || undefined,
    error: error || undefined,
    message: message || undefined,
    timestamp: new Date().toISOString()
  })
}

// GET /api/v1/debug/websocket-clients - Get all connected WebSocket clients
router.get('/websocket-clients', (req, res) => {
  try {
    const wsManager = WebSocketManager.getInstance()
    const clients = wsManager.getClientDetails()

    // Also log to console
    wsManager.logCurrentClients()

    sendResponse(res, true, {
      totalClients: wsManager.getClientCount(),
      clients: clients
    }, null, `Found ${wsManager.getClientCount()} connected WebSocket clients`)
  } catch (error) {
    console.error('Error fetching WebSocket clients:', error)
    sendResponse(res, false, null, 'Failed to fetch WebSocket clients')
  }
})

// GET /api/v1/debug/websocket-test - Test WebSocket broadcasting
router.post('/websocket-test', (req, res) => {
  try {
    const wsManager = WebSocketManager.getInstance()
    const { message = 'Test message from debug endpoint' } = req.body

    // Broadcast test message
    wsManager.broadcast({
      type: 'status_change',
      timestamp: new Date().toISOString(),
      data: {
        message,
        source: 'debug-endpoint',
        testId: Date.now()
      }
    })

    sendResponse(res, true, {
      broadcastSent: true,
      clientCount: wsManager.getClientCount(),
      message
    }, null, 'Test message broadcasted successfully')
  } catch (error) {
    console.error('Error broadcasting test message:', error)
    sendResponse(res, false, null, 'Failed to broadcast test message')
  }
})

export default router