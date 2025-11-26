import { Router, Request, Response } from 'express'
import { LogStorageManager } from '../services/LogStorageManager'
import { UnifiedLoggingService, LogFilter } from '../services/UnifiedLoggingService'

const router = Router()

// GET /api/v1/logs/test - Test endpoint
router.get('/test', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: { message: 'Logging API is working' },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /api/v1/logs - Get logs with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      level,
      tag,
      module,
      startTime,
      endTime,
      limit = 100,
      source = 'all', // 'memory', 'database', 'all'
      // NEW: Structured logging filters
      category,
      severity,
      operation
    } = req.query

    const filter: LogFilter = {
      limit: parseInt(limit as string) || 100
    }

    // Parse level filter (can be comma-separated)
    if (level) {
      filter.level = (level as string).split(',').map(l => l.trim())
    }

    if (tag) {
      filter.tag = tag as string
    }

    if (module) {
      filter.module = module as string
    }

    if (startTime) {
      filter.startTime = new Date(startTime as string)
    }

    if (endTime) {
      filter.endTime = new Date(endTime as string)
    }

    // Parse new structured logging filters
    if (category) {
      filter.category = (category as string).split(',').map(c => c.trim())
    }

    if (severity) {
      filter.severity = (severity as string).split(',').map(s => s.trim())
    }

    if (operation) {
      filter.operation = operation as string
    }

    let logs
    switch (source) {
      case 'memory':
        logs = LogStorageManager.getMemoryLogs(filter)
        break
      case 'database':
        logs = await LogStorageManager.getPersistedLogs(filter)
        break
      default:
        logs = await LogStorageManager.getAllLogs(filter)
    }

    // Enhance logs with flattened source location and business context
    const enhancedLogs = logs.map(log => ({
      ...log,
      sourceLocation: log.context?.source ? {
        file: log.context.source.file,
        method: log.context.source.method || null,
        line: log.context.source.line || null
      } : null,
      businessContext: log.context?.business ? {
        category: log.context.business.category,
        operation: log.context.business.operation,
        severity: log.context.business.severity || null
      } : null
    }))

    res.json({
      success: true,
      data: {
        logs: enhancedLogs,
        count: enhancedLogs.length,
        filter,
        source
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch logs',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /api/v1/logs/live - Get live memory logs only
router.get('/live', async (req: Request, res: Response) => {
  try {
    const {
      level,
      tag,
      module,
      limit = 50,
      // NEW: Structured logging filters
      category,
      severity,
      operation
    } = req.query

    const filter: LogFilter = {
      limit: parseInt(limit as string) || 50
    }

    if (level) {
      filter.level = (level as string).split(',').map(l => l.trim())
    }

    if (tag) {
      filter.tag = tag as string
    }

    if (module) {
      filter.module = module as string
    }

    // Parse new structured logging filters
    if (category) {
      filter.category = (category as string).split(',').map(c => c.trim())
    }

    if (severity) {
      filter.severity = (severity as string).split(',').map(s => s.trim())
    }

    if (operation) {
      filter.operation = operation as string
    }

    const logs = LogStorageManager.getMemoryLogs(filter)

    // Enhance logs with flattened source location and business context
    const enhancedLogs = logs.map(log => ({
      ...log,
      sourceLocation: log.context?.source ? {
        file: log.context.source.file,
        method: log.context.source.method || null,
        line: log.context.source.line || null
      } : null,
      businessContext: log.context?.business ? {
        category: log.context.business.category,
        operation: log.context.business.operation,
        severity: log.context.business.severity || null
      } : null
    }))

    res.json({
      success: true,
      data: {
        logs: enhancedLogs,
        count: enhancedLogs.length,
        isLive: true
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch live logs',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /api/v1/logs/stats - Get storage statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await LogStorageManager.getStorageStats()

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get stats',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /api/v1/logs/analytics - Get analytics data
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const {
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endTime = new Date().toISOString()
    } = req.query

    const analytics = await LogStorageManager.getAnalytics(
      new Date(startTime as string),
      new Date(endTime as string)
    )

    res.json({
      success: true,
      data: {
        analytics,
        period: {
          startTime: startTime as string,
          endTime: endTime as string
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get analytics',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /api/v1/logs/config - Configure logging settings
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { enabled, debugMode } = req.body

    if (typeof enabled === 'boolean') {
      UnifiedLoggingService.setEnabled(enabled)
    }

    if (typeof debugMode === 'boolean') {
      UnifiedLoggingService.setDebugMode(debugMode)
    }

    res.json({
      success: true,
      data: {
        message: 'Logging configuration updated',
        enabled,
        debugMode
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update config',
      timestamp: new Date().toISOString()
    })
  }
})

// DELETE /api/v1/logs/memory - Clear memory buffer
router.delete('/memory', async (req: Request, res: Response) => {
  try {
    LogStorageManager.clearMemoryLogs()

    res.json({
      success: true,
      data: { message: 'Memory logs cleared' },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear memory logs',
      timestamp: new Date().toISOString()
    })
  }
})

// DELETE /api/v1/logs/database - Clear database logs with filters
router.delete('/database', async (req: Request, res: Response) => {
  try {
    const {
      level,
      module,
      startTime,
      endTime
    } = req.query

    const filter: LogFilter = {}

    if (level) {
      filter.level = (level as string).split(',').map(l => l.trim())
    }

    if (module) {
      filter.module = module as string
    }

    if (startTime) {
      filter.startTime = new Date(startTime as string)
    }

    if (endTime) {
      filter.endTime = new Date(endTime as string)
    }

    const deletedCount = await LogStorageManager.clearDatabaseLogs(filter)

    res.json({
      success: true,
      data: {
        message: 'Database logs cleared',
        deletedCount,
        filter
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear database logs',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /api/v1/logs/test-log - Create test log entry
router.post('/test-log', async (req: Request, res: Response) => {
  try {
    const {
      level = 'info',
      tag = 'test',
      module = 'api-test',
      data = { message: 'Test log entry from API' }
    } = req.body

    const logger = UnifiedLoggingService.createModuleLogger(module)

    switch (level) {
      case 'debug':
        logger.debug(tag, data)
        break
      case 'info':
        logger.info(tag, data)
        break
      case 'warn':
        logger.warn(tag, data)
        break
      case 'error':
        logger.error(tag, data)
        break
      case 'analytics':
        logger.analytics(tag, data)
        break
      default:
        logger.info(tag, data)
    }

    res.json({
      success: true,
      data: {
        message: 'Test log created',
        level,
        tag,
        module,
        data
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create test log',
      timestamp: new Date().toISOString()
    })
  }
})

// GET /api/v1/logs/categories - Get category aggregation for dropdowns
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const {
      source = 'all', // 'memory', 'database', 'all'
      startTime,
      endTime
    } = req.query

    // Build filter for time range if specified
    const filter: LogFilter = {}
    if (startTime) {
      filter.startTime = new Date(startTime as string)
    }
    if (endTime) {
      filter.endTime = new Date(endTime as string)
    }

    let logs
    switch (source) {
      case 'memory':
        logs = LogStorageManager.getMemoryLogs(filter)
        break
      case 'database':
        logs = await LogStorageManager.getPersistedLogs(filter)
        break
      default:
        logs = await LogStorageManager.getAllLogs(filter)
    }

    // Extract unique categories, severities, and operations from logs
    const categories = new Set<string>()
    const severities = new Set<string>()
    const operations = new Set<string>()

    logs.forEach(log => {
      if (log.context?.business?.category) {
        categories.add(log.context.business.category)
      }
      if (log.context?.business?.severity) {
        severities.add(log.context.business.severity)
      }
      if (log.context?.business?.operation) {
        operations.add(log.context.business.operation)
      }
    })

    res.json({
      success: true,
      data: {
        categories: Array.from(categories).sort(),
        severities: Array.from(severities).sort(),
        operations: Array.from(operations).sort(),
        totalLogs: logs.length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get categories',
      timestamp: new Date().toISOString()
    })
  }
})

export default router