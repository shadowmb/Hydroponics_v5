// flowExecutorRoutes.ts - API routes for FlowExecutor

import { Router, Request, Response } from 'express'
import { FlowExecutor } from '../modules/flowExecutor'

const router = Router()

// Global FlowExecutor instance (singleton pattern)
let flowExecutor: FlowExecutor | null = null

// Initialize FlowExecutor with mock mode by default
function getFlowExecutor(): FlowExecutor {
  if (!flowExecutor) {
    flowExecutor = new FlowExecutor({
      mockMode: true // Start in mock mode for safety
    })
  }
  return flowExecutor
}

/**
 * POST /api/v1/flow/execute
 * Execute a flow from FlowEditor JSON
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { flowDefinition, mockMode } = req.body

    if (!flowDefinition) {
      return res.status(400).json({
        success: false,
        error: 'FlowDefinition is required'
      })
    }

    const executor = getFlowExecutor()
    
    // Mock mode is deprecated - HardwareService handles mock responses automatically
    if (typeof mockMode === 'boolean') {
      console.log('Mock mode parameter ignored - using HardwareService mock adapters')
    }

    // Check if already executing
    if (executor.isExecuting()) {
      return res.status(409).json({
        success: false,
        error: 'Another flow is already executing',
        currentState: executor.getSystemState()
      })
    }

    console.log(`🚀 Starting flow execution: ${flowDefinition.id || 'unknown'}`)
    
    // Start execution (non-blocking)
    const executionPromise = executor.executeFlow(flowDefinition)
    
    // Return immediately with started status
    res.status(200).json({
      success: true,
      message: 'Flow execution started',
      flowId: flowDefinition.id,
      state: executor.getSystemState(),
      mockMode: mockMode || true
    })

    // Handle execution completion in background
    executionPromise.then(success => {
      console.log(`✅ Flow execution ${success ? 'completed' : 'failed'}: ${flowDefinition.id}`)
    }).catch(error => {
      console.error(`❌ Flow execution error: ${error.message}`)
    })

  } catch (error) {
    console.error('Flow execution error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    })
  }
})

/**
 * POST /api/v1/flow/pause
 * Pause the currently executing flow
 */
router.post('/pause', async (req: Request, res: Response) => {
  try {
    const executor = getFlowExecutor()
    
    if (!executor.isExecuting()) {
      return res.status(400).json({
        success: false,
        error: 'No flow is currently executing'
      })
    }

    const success = executor.pause()
    
    res.status(200).json({
      success,
      message: success ? 'Flow paused successfully' : 'Failed to pause flow',
      state: executor.getSystemState()
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to pause flow',
      details: (error as Error).message
    })
  }
})

/**
 * POST /api/v1/flow/resume
 * Resume a paused flow
 */
router.post('/resume', async (req: Request, res: Response) => {
  try {
    const executor = getFlowExecutor()
    
    if (executor.getSystemState() !== 'paused') {
      return res.status(400).json({
        success: false,
        error: 'Flow is not in paused state',
        currentState: executor.getSystemState()
      })
    }

    const success = executor.resume()
    
    res.status(200).json({
      success,
      message: success ? 'Flow resumed successfully' : 'Failed to resume flow',
      state: executor.getSystemState()
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to resume flow',
      details: (error as Error).message
    })
  }
})

/**
 * POST /api/v1/flow/stop
 * Stop the currently executing flow
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const { emergency = false } = req.body
    const executor = getFlowExecutor()
    
    if (!executor.isExecuting() && executor.getSystemState() === 'idle') {
      return res.status(400).json({
        success: false,
        error: 'No flow is currently executing'
      })
    }

    const success = executor.stop()
    
    res.status(200).json({
      success,
      message: emergency ? 'Emergency stop executed' : 'Flow stopped successfully',
      state: executor.getSystemState(),
      emergency
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop flow',
      details: (error as Error).message
    })
  }
})

/**
 * GET /api/v1/flow/status
 * Get current flow execution status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const executor = getFlowExecutor()
    const context = executor.getExecutionContext()
    
    const status = {
      systemState: executor.getSystemState(),
      isExecuting: executor.isExecuting(),
      currentBlock: context?.getStatus()?.currentBlock || null,
      variables: context?.getVariables() || {},
      executionTime: context?.getStatus()?.executionTime || 0,
      logCount: context?.getStatus()?.logCount || 0,
      errorCount: context?.getStatus()?.errorCount || 0,
      timestamp: new Date().toISOString()
    }
    
    res.status(200).json({
      success: true,
      status
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: (error as Error).message
    })
  }
})

/**
 * GET /api/v1/flow/logs
 * Get execution logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query
    const executor = getFlowExecutor()
    const context = executor.getExecutionContext()
    
    const logs = context?.getRecentLogs(Number(limit)) || []
    
    res.status(200).json({
      success: true,
      logs,
      total: logs.length
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get logs',
      details: (error as Error).message
    })
  }
})

/**
 * GET /api/v1/flow/variables
 * Get current flow variables
 */
router.get('/variables', async (req: Request, res: Response) => {
  try {
    const executor = getFlowExecutor()
    const context = executor.getExecutionContext()
    
    const variables = context?.getVariables() || {}
    
    res.status(200).json({
      success: true,
      variables,
      count: Object.keys(variables).length
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get variables',
      details: (error as Error).message
    })
  }
})

/**
 * POST /api/v1/flow/config
 * Configure FlowExecutor settings
 */
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { mockMode } = req.body
    const executor = getFlowExecutor()
    
    // Mock mode is deprecated - HardwareService handles mock responses automatically
    if (typeof mockMode === 'boolean') {
      console.log('Mock mode configuration ignored - using HardwareService mock adapters')
    }
    
    res.status(200).json({
      success: true,
      message: 'Configuration updated',
      config: {
        mockMode: mockMode
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      details: (error as Error).message
    })
  }
})

/**
 * GET /api/v1/flow/health
 * Health check for FlowExecutor module
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const executor = getFlowExecutor()
    
    res.status(200).json({
      success: true,
      health: {
        module: 'FlowExecutor',
        status: 'healthy',
        systemState: executor.getSystemState(),
        isExecuting: executor.isExecuting(),
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FlowExecutor health check failed',
      details: (error as Error).message
    })
  }
})

export default router