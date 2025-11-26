import { Router } from 'express'
import { ActiveExecutionService } from '../services/ActiveExecutionService'

const router = Router()

/**
 * GET /api/execution/active
 * Get all currently active (in_progress) executions
 * @deprecated Use /api/v1/execution-sessions/current-execution instead
 */
router.get('/active', async (req, res) => {
  console.warn('⚠️  DEPRECATED: /api/v1/execution/active is deprecated. Use /api/v1/execution-sessions/current-execution instead')
  res.setHeader('X-Deprecated', 'true')
  res.setHeader('X-Deprecated-Replacement', '/api/v1/execution-sessions/current-execution')

  try {
    const activeExecutions = await ActiveExecutionService.getActiveExecutions()
    res.json(activeExecutions)
  } catch (error) {
    console.error('Error fetching active executions:', error)
    res.status(500).json({ error: 'Failed to fetch active executions' })
  }
})

/**
 * GET /api/execution/recent
 * Get recent completed executions
 * @deprecated Use /api/v1/execution-sessions/current-execution instead
 */
router.get('/recent', async (req, res) => {
  console.warn('⚠️  DEPRECATED: /api/v1/execution/recent is deprecated. Use /api/v1/execution-sessions/current-execution instead')
  res.setHeader('X-Deprecated', 'true')
  res.setHeader('X-Deprecated-Replacement', '/api/v1/execution-sessions/current-execution')

  try {
    const limit = parseInt(req.query.limit as string) || 4
    const recentExecutions = await ActiveExecutionService.getRecentExecutions(limit)
    res.json(recentExecutions)
  } catch (error) {
    console.error('Error fetching recent executions:', error)
    res.status(500).json({ error: 'Failed to fetch recent executions' })
  }
})

/**
 * GET /api/execution/status
 * Get both active and recent executions in one call
 * @deprecated Use /api/v1/execution-sessions/current-execution instead
 */
router.get('/status', async (req, res) => {
  console.warn('⚠️  DEPRECATED: /api/v1/execution/status is deprecated. Use /api/v1/execution-sessions/current-execution instead')
  res.setHeader('X-Deprecated', 'true')
  res.setHeader('X-Deprecated-Replacement', '/api/v1/execution-sessions/current-execution')

  try {
    const [active, recent] = await Promise.all([
      ActiveExecutionService.getActiveExecutions(),
      ActiveExecutionService.getRecentExecutions(3)
    ])

    res.json({
      active,
      recent,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching execution status:', error)
    res.status(500).json({ error: 'Failed to fetch execution status' })
  }
})

export default router