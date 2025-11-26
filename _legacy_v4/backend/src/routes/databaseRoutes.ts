// ABOUTME: Database management API routes
// ABOUTME: Provides endpoints for database connection management and health checks

import express from 'express'
import { reconnectDB } from '../config/db'

const router = express.Router()

/**
 * POST /api/v1/database/reconnect
 * Attempt to reconnect to MongoDB
 */
router.post('/reconnect', async (req, res) => {
  try {
    const result = await reconnectDB()

    if (result.success) {
      res.status(200).json(result)
    } else {
      res.status(503).json(result)
    }
  } catch (error) {
    console.error('Error in reconnect endpoint:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during reconnection',
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

export default router
