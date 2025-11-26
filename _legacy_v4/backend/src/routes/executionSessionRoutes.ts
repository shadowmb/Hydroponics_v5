import express from 'express'
import { ExecutionSession, IExecutionSession } from '../models/ExecutionSession'
import crypto from 'crypto'

// Generate UUID v4 without external library
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

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

// GET /api/v1/execution-sessions - Get all execution sessions with filtering
router.get('/', async (req, res) => {
  try {
    const {
      programStatus,
      programId,
      limit = '50',
      page = '1',
      sortBy = 'programStartTime',
      sortOrder = 'desc'
    } = req.query

    // Build query
    const query: any = {}
    if (programStatus) query.programStatus = programStatus
    if (programId) query.programId = programId

    // Pagination
    const limitNum = parseInt(limit as string)
    const pageNum = parseInt(page as string)
    const skip = (pageNum - 1) * limitNum

    // Sort
    const sortOptions: any = {}
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1

    const sessions = await ExecutionSession.find(query)
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip)
      .lean()

    const total = await ExecutionSession.countDocuments(query)

    sendResponse(res, true, {
      sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error fetching execution sessions:', error)
    sendResponse(res, false, null, 'Failed to fetch execution sessions')
  }
})

// GET /api/v1/execution-sessions/current - Get currently active execution session
router.get('/current', async (req, res) => {
  try {
    const currentExecution = await ExecutionSession.findOne({
      programStatus: { $in: ['running', 'paused'] }
    }).lean()

    if (!currentExecution) {
      return sendResponse(res, true, null, null, 'No active execution found')
    }

    sendResponse(res, true, currentExecution)
  } catch (error) {
    console.error('Error fetching current execution:', error)
    sendResponse(res, false, null, 'Failed to fetch current execution')
  }
})

// GET /api/v1/execution-sessions/current-execution - Get current execution for UI (backward compatibility)
router.get('/current-execution', async (req, res) => {
  try {
    console.log('🔍 [CURRENT-EXECUTION] NEW HIERARCHICAL ENDPOINT CALLED')

    // Find active execution session
    let activeExecution = await ExecutionSession.findOne({
      programStatus: { $in: ['running', 'paused'] }
    }).lean()
    console.log('🔍 [CURRENT-EXECUTION] Active execution:', !!activeExecution)

    let active = []
    let recent = []
    let executionContext = null

    if (activeExecution) {
      // If there's an active execution, get current cycle and flow data
      const currentCycle = activeExecution.cycles.find(c => c.cycleStatus === 'running')

      if (currentCycle) {
        const currentFlow = currentCycle.flows.find(f => f.flowStatus === 'running')

        if (currentFlow) {
          // Show current block from active flow
          const currentBlock = currentFlow.blocks.find(b => b.blockStatus === 'running')
          active = currentBlock ? [currentBlock] : []

          // Show recent completed blocks from current flow
          recent = currentFlow.blocks
            .filter(block => block.blockStatus === 'completed')
            .slice(-3)
            .reverse()
        }
      }

      executionContext = {
        executionId: activeExecution._id.toString(),
        programId: activeExecution.programId,
        programName: activeExecution.programName,
        programStatus: activeExecution.programStatus,
        currentCycle: currentCycle ? {
          cycleId: currentCycle.cycleId,
          cycleName: currentCycle.cycleName,
          cycleStatus: currentCycle.cycleStatus
        } : null
      }
    } else {
      // If no active execution, show recent data from the most recent completed execution
      const recentExecution = await ExecutionSession.findOne({
        programStatus: 'completed'
      }).sort({ programEndTime: -1 }).lean()

      if (recentExecution) {
        // Get blocks from the last completed cycle
        const lastCycle = recentExecution.cycles[recentExecution.cycles.length - 1]

        if (lastCycle && lastCycle.flows.length > 0) {
          const lastFlow = lastCycle.flows[lastCycle.flows.length - 1]

          recent = lastFlow.blocks
            .filter(block => block.blockStatus === 'completed')
            .slice(-4)
            .reverse()
        }

        executionContext = {
          executionId: recentExecution._id.toString(),
          programId: recentExecution.programId,
          programName: recentExecution.programName,
          programStatus: recentExecution.programStatus,
          isCompleted: true
        }
      }
    }

    sendResponse(res, true, {
      active,
      recent,
      executionContext
    })
  } catch (error) {
    console.error('Error fetching current execution:', error)
    sendResponse(res, false, null, 'Failed to fetch current execution')
  }
})

// GET /api/v1/execution-sessions/recent-blocks - Get recent completed blocks from all flows
router.get('/recent-blocks', async (req, res) => {
  try {
    const { limit = '10', programId } = req.query

    // Build query for execution sessions
    const sessionQuery: any = {}
    if (programId) sessionQuery.programId = programId

    const limitNum = parseInt(limit as string)

    // MongoDB aggregation to get recent completed blocks
    const recentBlocks = await ExecutionSession.aggregate([
      { $match: sessionQuery },
      { $unwind: '$cycles' },
      { $unwind: '$cycles.flows' },
      { $unwind: '$cycles.flows.blocks' },
      {
        $match: {
          'cycles.flows.blocks.blockStatus': 'completed'
        }
      },
      {
        $project: {
          _id: 0,
          blockId: '$cycles.flows.blocks.blockId',
          blockName: '$cycles.flows.blocks.blockName',
          blockType: '$cycles.flows.blocks.blockType',
          blockStartTime: '$cycles.flows.blocks.blockStartTime',
          blockEndTime: '$cycles.flows.blocks.blockEndTime',
          blockStatus: '$cycles.flows.blocks.blockStatus',
          duration: '$cycles.flows.blocks.duration',
          inputData: '$cycles.flows.blocks.inputData',
          outputData: '$cycles.flows.blocks.outputData',
          flowName: '$cycles.flows.flowName',
          flowId: '$cycles.flows.flowId',
          cycleId: '$cycles.cycleId',
          programId: '$programId',
          programName: '$programName',
          executionStartTime: '$programStartTime'
        }
      },
      {
        $sort: {
          blockEndTime: -1 // Sort by end time, newest first
        }
      },
      {
        $limit: limitNum
      }
    ])

    sendResponse(res, true, {
      blocks: recentBlocks,
      count: recentBlocks.length,
      limit: limitNum
    })
  } catch (error) {
    console.error('Error fetching recent blocks:', error)
    sendResponse(res, false, null, 'Failed to fetch recent blocks')
  }
})

// GET /api/v1/execution-sessions/stats - Get execution statistics
router.get('/stats', async (req, res) => {
  try {
    const { days = '7' } = req.query
    const daysNum = parseInt(days as string)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysNum)

    const stats = await ExecutionSession.aggregate([
      {
        $match: {
          programStartTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            programStatus: '$programStatus'
          },
          count: { $sum: 1 },
          avgCycles: { $avg: { $size: '$cycles' } },
          totalCycles: { $sum: { $size: '$cycles' } }
        }
      }
    ])

    sendResponse(res, true, { stats, period: `${daysNum} days` })
  } catch (error) {
    console.error('Error fetching execution stats:', error)
    sendResponse(res, false, null, 'Failed to fetch execution stats')
  }
})

// GET /api/v1/execution-sessions/:id - Get specific execution session
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const session = await ExecutionSession.findById(id).lean()

    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    sendResponse(res, true, session)
  } catch (error) {
    console.error('Error fetching execution session:', error)
    sendResponse(res, false, null, 'Failed to fetch execution session')
  }
})

// POST /api/v1/execution-sessions/:id/programs/complete - Complete program in execution session
router.post('/:id/programs/complete', async (req, res) => {
  try {
    const { id } = req.params
    const { status = 'completed' } = req.body

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    session.programEndTime = new Date()
    session.programStatus = status
    await session.save()

    sendResponse(res, true, session.toObject(), null, `Program marked as ${status}`)
  } catch (error) {
    console.error('Error completing program:', error)
    sendResponse(res, false, null, 'Failed to complete program')
  }
})

// POST /api/v1/execution-sessions/:id/cycles/:cycleId/flows - Add flow to cycle
router.post('/:id/cycles/:cycleId/flows', async (req, res) => {
  try {
    const { id, cycleId } = req.params
    const { flowId, flowName } = req.body

    if (!flowId || !flowName) {
      return sendResponse(res, false, null, 'flowId and flowName are required')
    }

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    const cycle = session.cycles.find(c => c.cycleId === cycleId)
    if (!cycle) {
      return sendResponse(res, false, null, 'Cycle not found')
    }

    cycle.flows.push({
      flowId,
      flowName,
      flowStartTime: new Date(),
      flowStatus: 'running',
      blocks: []
    })

    await session.save()
    sendResponse(res, true, session.toObject(), null, 'Flow added to cycle successfully')
  } catch (error) {
    console.error('Error adding flow to cycle:', error)
    sendResponse(res, false, null, 'Failed to add flow to cycle')
  }
})

// POST /api/v1/execution-sessions/:id/cycles/:cycleId/flows/:flowId/complete - Complete flow
router.post('/:id/cycles/:cycleId/flows/:flowId/complete', async (req, res) => {
  try {
    const { id, cycleId, flowId } = req.params
    const { status = 'completed' } = req.body

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    const cycle = session.cycles.find(c => c.cycleId === cycleId)
    if (!cycle) {
      return sendResponse(res, false, null, 'Cycle not found')
    }

    const flow = cycle.flows.find(f => f.flowId === flowId)
    if (!flow) {
      return sendResponse(res, false, null, 'Flow not found')
    }

    flow.flowEndTime = new Date()
    flow.flowStatus = status

    await session.save()
    sendResponse(res, true, session.toObject(), null, `Flow marked as ${status}`)
  } catch (error) {
    console.error('Error completing flow:', error)
    sendResponse(res, false, null, 'Failed to complete flow')
  }
})

// POST /api/v1/execution-sessions/:id/blocks/start - Create new block with start data
router.post('/:id/blocks/start', async (req, res) => {
  try {
    const { id } = req.params
    const { blockId, blockType, blockName, inputData, flowName } = req.body

    if (!blockId || !blockType || !blockName) {
      return sendResponse(res, false, null, 'blockId, blockType, and blockName are required')
    }

    // Validate flowName is provided and not empty
    if (!flowName || flowName.trim() === '') {
      return sendResponse(res, false, null, 'flowName is required and cannot be empty')
    }

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    // Find the active cycle
    let activeCycle = session.cycles.find(c => c.cycleStatus === 'running')
    if (!activeCycle) {
      // Create a new cycle if none exists
      const cycleId = `cycle-${session.cycles.length}`
      const newCycle = {
        cycleId,
        cycleName: `Cycle ${session.cycles.length + 1}`,
        cycleStartTime: new Date(),
        cycleStatus: 'running' as const,
        flows: []
      }
      session.cycles.push(newCycle)
      activeCycle = session.cycles[session.cycles.length - 1]
    }

    // Find or create the active flow for this specific flowName
    // Each flowName gets its own separate flow
    const targetFlowName = flowName.trim()

    // Look for existing running flow with the exact same name
    let activeFlow = activeCycle.flows.find(f => f.flowStatus === 'running' && f.flowName === targetFlowName)
    if (!activeFlow) {
      // Create a new flow specifically for this flowName
      const flowId = generateUUID()
      const newFlow = {
        flowId,
        flowName: targetFlowName,
        flowStartTime: new Date(),
        flowStatus: 'running' as const,
        blocks: []
      }
      activeCycle.flows.push(newFlow)
      activeFlow = activeCycle.flows[activeCycle.flows.length - 1]
    }

    // Check if block already exists
    const existingBlock = activeFlow.blocks.find(b => b.blockId === blockId)
    if (existingBlock) {
      return sendResponse(res, false, null, 'Block with this ID already exists')
    }

    // Create new block
    const newBlock = {
      blockId,
      blockName,
      blockType,
      blockStartTime: new Date(),
      blockStatus: 'running' as const,
      inputData: inputData || null
    }

    activeFlow.blocks.push(newBlock)
    await session.save()

    sendResponse(res, true, newBlock, null, 'Block started successfully')
  } catch (error) {
    console.error('Error starting block:', error)
    sendResponse(res, false, null, 'Failed to start block')
  }
})

// POST /api/v1/execution-sessions/:id/blocks/complete - Update existing block with completion data
router.post('/:id/blocks/complete', async (req, res) => {
  try {
    const { id } = req.params
    const { blockId, outputData, status = 'completed', flowName } = req.body

    if (!blockId) {
      return sendResponse(res, false, null, 'blockId is required')
    }

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    // Find the block in the active cycle/flow
    let foundBlock = null
    let foundFlow = null

    for (const cycle of session.cycles) {
      for (const flow of cycle.flows) {
        const block = flow.blocks.find(b => b.blockId === blockId)
        if (block) {
          foundBlock = block
          foundFlow = flow
          break
        }
      }
      if (foundBlock) break
    }

    if (!foundBlock) {
      return sendResponse(res, false, null, 'Block not found')
    }

    // Update block with completion data
    foundBlock.blockEndTime = new Date()
    foundBlock.blockStatus = status as 'completed' | 'failed'
    foundBlock.outputData = outputData || null

    // Calculate duration if we have start time
    if (foundBlock.blockStartTime) {
      foundBlock.duration = foundBlock.blockEndTime.getTime() - foundBlock.blockStartTime.getTime()
    }

    await session.save()

    sendResponse(res, true, foundBlock, null, `Block marked as ${status}`)
  } catch (error) {
    console.error('Error completing block:', error)
    sendResponse(res, false, null, 'Failed to complete block')
  }
})

// POST /api/v1/execution-sessions/:id/blocks - Add completed block (backward compatibility)
router.post('/:id/blocks', async (req, res) => {
  try {
    const { id } = req.params
    const {
      blockId,
      blockType,
      blockName,
      blockStartTime,
      blockEndTime,
      blockStatus = 'completed',
      inputData,
      outputData,
      duration,
      flowName
    } = req.body

    if (!blockId || !blockType || !blockName) {
      return sendResponse(res, false, null, 'blockId, blockType, and blockName are required')
    }

    // Validate flowName is provided and not empty
    if (!flowName || flowName.trim() === '') {
      return sendResponse(res, false, null, 'flowName is required and cannot be empty')
    }

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    // Find the active cycle
    let activeCycle = session.cycles.find(c => c.cycleStatus === 'running')
    if (!activeCycle) {
      // Create a new cycle if none exists
      const cycleId = `cycle-${session.cycles.length}`
      const newCycle = {
        cycleId,
        cycleName: `Cycle ${session.cycles.length + 1}`,
        cycleStartTime: new Date(),
        cycleStatus: 'running' as const,
        flows: []
      }
      session.cycles.push(newCycle)
      activeCycle = session.cycles[session.cycles.length - 1]
    }

    // Find or create the active flow for this specific flowName
    // Each flowName gets its own separate flow
    const targetFlowName = flowName.trim()

    // Look for existing running flow with the exact same name
    let activeFlow = activeCycle.flows.find(f => f.flowStatus === 'running' && f.flowName === targetFlowName)
    if (!activeFlow) {
      // Create a new flow specifically for this flowName
      const flowId = generateUUID()
      const newFlow = {
        flowId,
        flowName: targetFlowName,
        flowStartTime: new Date(),
        flowStatus: 'running' as const,
        blocks: []
      }
      activeCycle.flows.push(newFlow)
      activeFlow = activeCycle.flows[activeCycle.flows.length - 1]
    }

    // Check if block already exists
    const existingBlock = activeFlow.blocks.find(b => b.blockId === blockId)
    if (existingBlock) {
      return sendResponse(res, false, null, 'Block with this ID already exists')
    }

    // Create completed block
    const newBlock = {
      blockId,
      blockName,
      blockType,
      blockStartTime: blockStartTime ? new Date(blockStartTime) : new Date(),
      blockEndTime: blockEndTime ? new Date(blockEndTime) : new Date(),
      blockStatus: blockStatus as 'completed' | 'failed' | 'running',
      inputData: inputData || null,
      outputData: outputData || null,
      duration: duration || null
    }

    activeFlow.blocks.push(newBlock)
    await session.save()

    sendResponse(res, true, newBlock, null, 'Block added successfully')
  } catch (error) {
    console.error('Error adding block:', error)
    sendResponse(res, false, null, 'Failed to add block')
  }
})


// DELETE /api/v1/execution-sessions/:id - Delete execution session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const session = await ExecutionSession.findByIdAndDelete(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    sendResponse(res, true, null, null, 'Execution session deleted successfully')
  } catch (error) {
    console.error('Error deleting execution session:', error)
    sendResponse(res, false, null, 'Failed to delete execution session')
  }
})

// === ExecutionSession Lifecycle Endpoints (Required by SchedulerService) ===

// POST /api/v1/execution-sessions - Create new execution session
router.post('/', async (req, res) => {
  try {
    const { programId, programName, cycleId, actionTemplateId, actionIndex } = req.body

    if (!programId || !programName) {
      return sendResponse(res, false, null, 'programId and programName are required')
    }

    const newSession = new ExecutionSession({
      programId,
      programName,
      programStatus: 'created',
      programStartTime: null,
      programEndTime: null,
      cycles: [],
      // Optional metadata from SchedulerService
      metadata: {
        cycleId: cycleId || null,
        actionTemplateId: actionTemplateId || null,
        actionIndex: actionIndex || null
      }
    })

    const savedSession = await newSession.save()

    console.log(`✅ [ExecutionSession] Created new session: ${savedSession._id} for program: ${programName}`)

    sendResponse(res, true, {
      id: savedSession._id.toString(),
      programId: savedSession.programId,
      programName: savedSession.programName,
      programStatus: savedSession.programStatus,
      programStartTime: savedSession.programStartTime,
      cycles: savedSession.cycles
    }, null, 'Execution session created successfully')
  } catch (error) {
    console.error('Error creating execution session:', error)
    sendResponse(res, false, null, 'Failed to create execution session')
  }
})

// POST /api/v1/execution-sessions/:id/start - Mark execution session as started
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params
    const { startTime } = req.body

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    // Mark session as started
    session.programStatus = 'running'
    session.programStartTime = startTime ? new Date(startTime) : new Date()

    const savedSession = await session.save()

    console.log(`🚀 [ExecutionSession] Started session: ${id} for program: ${session.programName}`)

    sendResponse(res, true, {
      id: savedSession._id.toString(),
      programId: savedSession.programId,
      programName: savedSession.programName,
      programStatus: savedSession.programStatus,
      programStartTime: savedSession.programStartTime
    }, null, 'Execution session started successfully')
  } catch (error) {
    console.error('Error starting execution session:', error)
    sendResponse(res, false, null, 'Failed to start execution session')
  }
})

// POST /api/v1/execution-sessions/:id/complete - Mark execution session as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params
    const { endTime, success = true } = req.body

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    // Mark session as completed
    session.programStatus = success ? 'completed' : 'failed'
    session.programEndTime = endTime ? new Date(endTime) : new Date()

    const savedSession = await session.save()

    console.log(`✅ [ExecutionSession] Completed session: ${id} for program: ${session.programName} (${session.programStatus})`)

    sendResponse(res, true, {
      id: savedSession._id.toString(),
      programId: savedSession.programId,
      programName: savedSession.programName,
      programStatus: savedSession.programStatus,
      programStartTime: savedSession.programStartTime,
      programEndTime: savedSession.programEndTime
    }, null, `Execution session marked as ${session.programStatus}`)
  } catch (error) {
    console.error('Error completing execution session:', error)
    sendResponse(res, false, null, 'Failed to complete execution session')
  }
})

// POST /api/v1/execution-sessions/:id/fail - Mark execution session as failed
router.post('/:id/fail', async (req, res) => {
  try {
    const { id } = req.params
    const { endTime, error: errorMessage } = req.body

    const session = await ExecutionSession.findById(id)
    if (!session) {
      return sendResponse(res, false, null, 'Execution session not found')
    }

    // Mark session as failed
    session.programStatus = 'failed'
    session.programEndTime = endTime ? new Date(endTime) : new Date()

    // Store error details if provided
    if (errorMessage) {
      if (!session.metadata) session.metadata = {}
      session.metadata.errorMessage = errorMessage
    }

    const savedSession = await session.save()

    console.log(`❌ [ExecutionSession] Failed session: ${id} for program: ${session.programName}`)
    if (errorMessage) console.log(`❌ [ExecutionSession] Error: ${errorMessage}`)

    sendResponse(res, true, {
      id: savedSession._id.toString(),
      programId: savedSession.programId,
      programName: savedSession.programName,
      programStatus: savedSession.programStatus,
      programStartTime: savedSession.programStartTime,
      programEndTime: savedSession.programEndTime,
      errorMessage: errorMessage || null
    }, null, 'Execution session marked as failed')
  } catch (error) {
    console.error('Error failing execution session:', error)
    sendResponse(res, false, null, 'Failed to mark execution session as failed')
  }
})

export default router