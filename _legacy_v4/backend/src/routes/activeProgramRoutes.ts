import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { ActiveProgram, IActiveProgram } from '../models/ActiveProgram'
import { Program } from '../models/Program'
import { SchedulerService } from '../services/SchedulerService'
import { ActiveProgramService } from '../services/ActiveProgramService'
import { SystemStateManager } from '../modules/flowExecutor/core/SystemStateManager'

const router = Router()

// GET /api/v1/active-programs - Get current active program
router.get('/', async (req: Request, res: Response) => {
  try {
    const activeProgram = await ActiveProgram.findOne()
      .populate('programId', 'name description')
      .populate('controllerId', 'name')
      .populate('activeCycles.taskId', 'name actionTemplateId')

    // Get ActionTemplates for each cycle from the original Program
    if (activeProgram && activeProgram.programId) {
      // Step 1: Get programId from active program
      const programId = typeof activeProgram.programId === 'object' 
        ? activeProgram.programId._id 
        : activeProgram.programId
      
      // Step 2: Query Programs collection to get cycles with actionTemplateIds
      const program = await Program.findById(programId).lean()
      
      if (program) {
        // Convert to plain object so we can modify it
        const activeProgramObj = activeProgram.toObject()
        
        // Step 3: For each cycle, get ActionTemplate IDs and query ActionTemplates collection
        for (let index = 0; index < activeProgramObj.activeCycles.length; index++) {
          const activeCycle = activeProgramObj.activeCycles[index]
          const programCycle = program.cycles[index]
          
          if (programCycle && programCycle.actions && programCycle.actions.length > 0) {
            // Extract ActionTemplate IDs
            const actionTemplateIds = programCycle.actions.map(action => action.actionTemplateId)
            
            // Step 4: Query ActionTemplates collection
            const { ActionTemplate } = await import('../models/ActionTemplate')
            const actionTemplates = await ActionTemplate.find({
              _id: { $in: actionTemplateIds }
            }).select('name icon description')
            
            // Add ActionTemplates data to active cycle
            activeCycle.actionTemplates = actionTemplates.map(template => ({
              name: template.name,
              icon: template.icon || 'settings',
              description: template.description || ''
            }))
            
            // Get parameters grouped by ActionTemplate with displayNames
            const cycleGlobalParameters: any[] = []
            
            for (let actionIndex = 0; actionIndex < programCycle.actions.length; actionIndex++) {
              const action = programCycle.actions[actionIndex]
              if (action.overrideParameters && Object.keys(action.overrideParameters).length > 0) {
                // Get ActionTemplate metadata for displayNames
                const { ActionTemplate } = await import('../models/ActionTemplate')
                const actionTemplate = await ActionTemplate.findById(action.actionTemplateId)
                  .select('name description globalVariablesMetadata')
                
                if (actionTemplate) {
                  const parameters: any[] = []
                  
                  Object.keys(action.overrideParameters).forEach(paramKey => {
                    // Find displayName from metadata
                    const metadata = actionTemplate.globalVariablesMetadata?.find(
                      (meta: any) => meta.variableName === paramKey
                    )
                    
                    parameters.push({
                      name: paramKey,
                      displayName: metadata?.displayName || paramKey,
                      value: action.overrideParameters![paramKey],
                      comment: metadata?.comment || ''
                    })
                  })
                  
                  if (parameters.length > 0) {
                    cycleGlobalParameters.push({
                      actionTemplateId: action.actionTemplateId.toString(),
                      actionTemplateName: actionTemplate.name,
                      actionTemplateDescription: actionTemplate.description || '',
                      actionIndex,
                      parameters
                    })
                  }
                }
              }
            }
            
            activeCycle.cycleGlobalParameters = cycleGlobalParameters
          }
        }
        
        // Send the modified object
        res.status(200).json({
          success: true,
          data: activeProgramObj
        })
        return
      }
    }

    res.status(200).json({
      success: true,
      data: activeProgram
    })
  } catch (error: any) {
    console.error('Error fetching active program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active program',
      details: error.message
    })
  }
})

// POST /api/v1/active-programs/load/:programId - Load program as active
router.post('/load/:programId', async (req: Request, res: Response) => {
  try {
    const { programId } = req.params
    const { controllerId } = req.body

    // Check if there's already an active program
    const existingActive = await ActiveProgram.findOne()
    if (existingActive && existingActive.status !== 'stopped' && existingActive.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Another program is already active. Stop it first.'
      })
    }

    // Remove any existing active program
    await ActiveProgram.deleteMany({})

    // Get the program details
    const program = await Program.findById(programId).populate('cycles.actions.actionTemplateId')
    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      })
    }

    // Create active cycles from program (one active cycle per program cycle)
    const activeCycles = program.cycles.map((cycle, cycleIndex) => ({
      cycleId: `cycle-${cycleIndex}`,
      taskId: new mongoose.Types.ObjectId(), // Generate new ObjectId for task
      startTime: cycle.startTime,
      duration: cycle.duration,
      nextExecution: (() => {
        const [hours, minutes] = cycle.startTime.split(':').map(Number)
        const nextExec = new Date()
        nextExec.setHours(hours, minutes, 0, 0)
        // If time has passed today, schedule for tomorrow
        if (nextExec.getTime() <= Date.now()) {
          nextExec.setDate(nextExec.getDate() + 1)
        }
        return nextExec
      })(),
      executionCount: 0,
      isActive: true
    }))

    // Extract global parameters from actions
    //const globalParameters: any[] = []
    const seenParams = new Set<string>()

    program.cycles.forEach(cycle => {
      cycle.actions.forEach(action => {
        // ActionTemplateId is populated, so we can access its parameters
        if (action.actionTemplateId && typeof action.actionTemplateId === 'object' && 'parameters' in action.actionTemplateId) {
          const actionTemplate = action.actionTemplateId as any
          if (actionTemplate.parameters) {
            actionTemplate.parameters.forEach((param: any) => {
              const paramKey = `${param.name}_${param.displayName}`
              if (!seenParams.has(paramKey)) {
                // globalParameters.push({
                //   name: param.name,
                //   displayName: param.displayName,
                //   value: param.value,
                //   useGlobal: true
                // })
                seenParams.add(paramKey)
              }
            })
          }
        }
      })
    })

    // Create new active program
    const activeProgram = new ActiveProgram({
      programId: programId,
      controllerId: controllerId,
      name: program.name,
      status: 'loaded',
      startedAt: new Date(),
      maxExecutionTime: program.maxExecutionTime || 60,
      activeCycles,
      //globalParameters,
      skippedCycles: [],
      totalExecutions: 0
    })

    await activeProgram.save()
    
    const populatedActiveProgram = await ActiveProgram.findById(activeProgram._id)
      .populate('programId', 'name description')
      .populate('controllerId', 'name')

    res.status(201).json({
      success: true,
      data: populatedActiveProgram,
      message: 'Program loaded successfully'
    })
  } catch (error: any) {
    console.error('Error loading program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load program',
      details: error.message
    })
  }
})

// PUT /api/v1/active-programs/schedule - Schedule delayed start
router.put('/schedule', async (req: Request, res: Response) => {
  try {
    const { delayDays } = req.body

    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    activeProgram.status = 'scheduled'
    activeProgram.delayDays = delayDays
    activeProgram.scheduledStartDate = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000)

    await activeProgram.save()

    res.status(200).json({
      success: true,
      data: activeProgram,
      message: `Program scheduled to start in ${delayDays} days`
    })
  } catch (error: any) {
    console.error('Error scheduling program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to schedule program',
      details: error.message
    })
  }
})

// PUT /api/v1/active-programs/start - Start active program
router.put('/start', async (req: Request, res: Response) => {
  try {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    if (activeProgram.status === 'running') {
      return res.status(400).json({
        success: false,
        error: 'Program is already running'
      })
    }

    const wasResuming = activeProgram.status === 'paused'

    // Update database status
    activeProgram.status = 'running'
    activeProgram.startedAt = new Date()
    
    // Reset paused/stopped dates
    activeProgram.pausedAt = undefined
    activeProgram.stoppedAt = undefined
    await activeProgram.save()

    // Resume active FlowExecutor executions if resuming from pause
    if (wasResuming) {
      try {
        const schedulerService = SchedulerService.getInstance()
        const resumeResult = await schedulerService.resumeActiveExecutions(activeProgram._id.toString())
        console.log(`▶️ FlowExecutor resume result: ${resumeResult}`)
      } catch (flowError) {
        console.warn('Failed to resume FlowExecutor:', flowError)
        // Continue even if FlowExecutor resume fails - database status is updated
      }
    }

    res.status(200).json({
      success: true,
      data: activeProgram,
      message: wasResuming ? 'Program resumed successfully' : 'Program started successfully'
    })
  } catch (error: any) {
    console.error('Error starting program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to start program',
      details: error.message
    })
  }
})

// PUT /api/v1/active-programs/pause - Pause active program
router.put('/pause', async (req: Request, res: Response) => {
  try {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    if (activeProgram.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Program is not running'
      })
    }

    // Update database status
    activeProgram.status = 'paused'
    activeProgram.pausedAt = new Date()
    await activeProgram.save()

    // Pause active FlowExecutor executions via SchedulerService
    try {
      const schedulerService = SchedulerService.getInstance()
      const pauseResult = await schedulerService.pauseActiveExecutions(activeProgram._id.toString())
      console.log(`🔄 FlowExecutor pause result: ${pauseResult}`)
    } catch (flowError) {
      console.warn('Failed to pause FlowExecutor:', flowError)
      // Continue even if FlowExecutor pause fails - database status is updated
    }

    res.status(200).json({
      success: true,
      data: activeProgram,
      message: 'Program paused successfully'
    })
  } catch (error: any) {
    console.error('Error pausing program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to pause program',
      details: error.message
    })
  }
})

// PUT /api/v1/active-programs/stop - Stop active program
router.put('/stop', async (req: Request, res: Response) => {
  try {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    // Update database status
    activeProgram.status = 'loaded'
    activeProgram.stoppedAt = new Date()
    
    // Reset paused date when stopping
    activeProgram.pausedAt = undefined
    await activeProgram.save()

    // Stop active FlowExecutor executions via SchedulerService
    try {
      const schedulerService = SchedulerService.getInstance()
      const stopResult = await schedulerService.stopActiveExecutions(activeProgram._id.toString())
      console.log(`🛑 FlowExecutor stop result: ${stopResult}`)
    } catch (flowError) {
      console.warn('Failed to stop FlowExecutor:', flowError)
      // Continue even if FlowExecutor stop fails - database status is updated
    }

    res.status(200).json({
      success: true,
      data: activeProgram,
      message: 'Program stopped successfully'
    })
  } catch (error: any) {
    console.error('Error stopping program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to stop program',
      details: error.message
    })
  }
})

// DELETE /api/v1/active-programs - Remove active program
router.delete('/', async (req: Request, res: Response) => {
  try {
    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    if (activeProgram.status === 'running') {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove running program. Stop it first.'
      })
    }

    await ActiveProgram.deleteMany({})

    res.status(200).json({
      success: true,
      message: 'Active program removed successfully'
    })
  } catch (error: any) {
    console.error('Error removing active program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove active program',
      details: error.message
    })
  }
})


// PUT /api/v1/active-programs/skip-cycle - Skip cycle for period
router.put('/skip-cycle', async (req: Request, res: Response) => {
  try {
    const { cycleId, skipDays, reason } = req.body

    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    const skipUntil = new Date(Date.now() + skipDays * 24 * 60 * 60 * 1000)
    
    // Remove existing skip for this cycle
    activeProgram.skippedCycles = activeProgram.skippedCycles.filter(
      skip => skip.cycleId !== cycleId
    )

    // Add new skip
    activeProgram.skippedCycles.push({
      cycleId,
      skipUntil,
      reason
    })

    await activeProgram.save()

    res.status(200).json({
      success: true,
      data: activeProgram,
      message: `Cycle skipped for ${skipDays} days`
    })
  } catch (error: any) {
    console.error('Error skipping cycle:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to skip cycle',
      details: error.message
    })
  }
})

// GET /api/v1/active-programs/logs/:cycleId - Get execution logs for cycle
router.get('/logs/:cycleId', async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.params
    const activeProgram = await ActiveProgram.findOne()
      .populate('programId', 'name description')

    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    // Use ExecutionSessions instead of file logs
    const { ExecutionSession } = await import('../models/ExecutionSession')

    // Get program name
    const programName = (activeProgram.programId && (activeProgram.programId as any).name)
      ? (activeProgram.programId as any).name
      : activeProgram.name

    // Find the most recent execution session for this program
    const executionSession = await ExecutionSession.findOne({
      programName: programName,
      programStatus: { $in: ['completed', 'running'] }
    }).sort({ programStartTime: -1 }).lean()

    if (!executionSession) {
      return res.status(404).json({
        success: false,
        error: 'No execution session found for this program'
      })
    }

    // Find the specific cycle
    const cycle = executionSession.cycles.find(c => c.cycleId === cycleId)

    if (!cycle) {
      return res.status(404).json({
        success: false,
        error: `Cycle ${cycleId} not found`
      })
    }

    // Extract sensor and actuator blocks from all flows in the cycle
    const sensorActuatorBlocks: any[] = []

    cycle.flows.forEach(flow => {
      flow.blocks
        .filter(block => block.blockType === 'sensor' || block.blockType === 'actuator')
        .forEach(block => {
          sensorActuatorBlocks.push({
            blockId: block.blockId,
            blockName: block.blockName,
            blockType: block.blockType,
            blockStatus: block.blockStatus,
            duration: block.duration,
            blockStartTime: block.blockStartTime,
            blockEndTime: block.blockEndTime,
            inputData: block.inputData,
            outputData: block.outputData,
            flowName: flow.flowName,
            flowId: flow.flowId
          })
        })
    })

    res.status(200).json({
      success: true,
      data: {
        executionInfo: {
          programName: executionSession.programName,
          cycleId: cycle.cycleId,
          cycleName: cycle.cycleName,
          cycleStatus: cycle.cycleStatus,
          cycleStartTime: cycle.cycleStartTime,
          cycleEndTime: cycle.cycleEndTime,
          executionSessionId: executionSession._id
        },
        blocks: sensorActuatorBlocks,
        totalBlocks: sensorActuatorBlocks.length
      }
    })
  } catch (error: any) {
    console.error('Error fetching execution logs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch execution logs',
      details: error.message
    })
  }
})

// GET /api/v1/active-programs/logs/action/:filename/:actionIndex - Get action details
router.get('/logs/action/:filename/:actionIndex', async (req: Request, res: Response) => {
  try {
    const { filename, actionIndex } = req.params
    
    const fs = await import('fs').then(m => m.promises)
    const path = await import('path')
    const logsDir = path.join(process.cwd(), '..', 'backend', 'logs', 'execution')
    const filePath = path.join(logsDir, filename)
    
    // Read and parse the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const logData = JSON.parse(fileContent)
    
    let actionDetails: any[] = []

    // Check format and extract data accordingly
    if (logData.actionTemplates) {
      // Old format
      const actionTemplate = logData.actionTemplates.find((at: any) => at.actionIndex === parseInt(actionIndex))
      if (!actionTemplate) {
        return res.status(404).json({
          success: false,
          error: 'ActionTemplate not found'
        })
      }
      actionDetails = actionTemplate.executions || []
    } else if (logData.metadata && logData.entries) {
      // New format - since no block_executed entries, create summary from ActionTemplate
      const completedEvent = logData.entries.find((entry: any) =>
        entry.type === 'status_change' && entry.data?.event === 'actionTemplateCompleted'
      )

      if (completedEvent) {
        actionDetails = [{
          blockId: `action_${logData.metadata.actionIndex}`,
          blockType: 'action_template',
          action: `ActionTemplate: ${completedEvent.data?.actionTemplateName || 'Unknown'}`,
          status: 'completed',
          startTime: logData.metadata.startTime,
          endTime: logData.metadata.endTime,
          duration: new Date(logData.metadata.endTime).getTime() - new Date(logData.metadata.startTime).getTime(),
          result: { success: true, actionTemplateId: completedEvent.data?.actionTemplateId }
        }]
      }
    }

    // Transform executions to UI format
    const blockDetails = actionDetails.map((exec: any, index: number) => ({
      blockIndex: index,
      blockId: exec.blockId,
      blockType: exec.blockType,
      action: exec.action,
      status: exec.status,
      startTime: exec.startTime,
      endTime: exec.endTime,
      duration: exec.duration,
      result: exec.result
    }))
    
    res.status(200).json({
      success: true,
      data: {
        actionTemplateId: logData.metadata?.actionTemplateId || (logData.actionTemplates?.[0]?.actionTemplateId) || 'unknown',
        actionIndex: parseInt(actionIndex),
        totalBlocks: actionDetails.length,
        totalDuration: actionDetails.reduce((sum: number, exec: any) => sum + (exec.duration || 0), 0),
        blockDetails
      }
    })
  } catch (error: any) {
    console.error('Error fetching action details:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action details',
      details: error.message
    })
  }
})

// PUT /api/v1/active-programs/cycle-parameters/:cycleId/:actionTemplateId - Update specific ActionTemplate parameters
router.put('/cycle-parameters/:cycleId/:actionTemplateId', async (req: Request, res: Response) => {
  try {
    const { cycleId, actionTemplateId } = req.params
    const { parameters } = req.body

    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    // Get the original program
    const program = await Program.findById(activeProgram.programId)
    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Original program not found'
      })
    }

    // Extract cycle index from cycleId (e.g., "cycle-0" -> 0)
    const cycleIndex = parseInt(cycleId.split('-')[1] || '0')
    
    if (!program.cycles[cycleIndex]) {
      return res.status(404).json({
        success: false,
        error: 'Cycle not found'
      })
    }

    // Find specific action by actionTemplateId
    const targetCycle = program.cycles[cycleIndex]
    const targetAction = targetCycle.actions.find(action => 
      action.actionTemplateId.toString() === actionTemplateId
    )
    
    if (!targetAction) {
      return res.status(404).json({
        success: false,
        error: 'ActionTemplate not found in cycle'
      })
    }

    // Update overrideParameters for specific action only
    if (!targetAction.overrideParameters) {
      targetAction.overrideParameters = {}
    }
    
    // Handle Mongoose Maps correctly
    if (targetAction.overrideParameters instanceof Map) {
      Object.keys(parameters).forEach(key => {
        targetAction.overrideParameters!.set(key, parameters[key])
      })
    } else {
      Object.assign(targetAction.overrideParameters, parameters)
    }

    await program.save()

    res.status(200).json({
      success: true,
      data: { cycleId, actionTemplateId, parameters },
      message: 'ActionTemplate parameters updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating ActionTemplate parameters:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update ActionTemplate parameters',
      details: error.message
    })
  }
})

// PUT /api/v1/active-programs/cycle-time - Update cycle start time
router.put('/cycle-time', async (req: Request, res: Response) => {
  try {
    const { cycleId, startTime } = req.body

    if (!cycleId || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Both cycleId and startTime are required'
      })
    }

    const updatedProgram = await ActiveProgramService.updateCycleStartTime(cycleId, startTime)

    res.status(200).json({
      success: true,
      data: updatedProgram,
      message: `Cycle ${cycleId} start time updated to ${startTime}`
    })
  } catch (error: any) {
    console.error('Error updating cycle start time:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update cycle start time',
      details: error.message
    })
  }
})

// PUT /api/v1/active-programs/min-cycle-interval - Update minimum cycle interval
router.put('/min-cycle-interval', async (req: Request, res: Response) => {
  try {
    let { minCycleInterval } = req.body

    if (!minCycleInterval || typeof minCycleInterval !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'minCycleInterval is required and must be a number'
      })
    }

    if (minCycleInterval < 60 || minCycleInterval > 240) {
      return res.status(400).json({
        success: false,
        error: 'minCycleInterval must be between 60 and 240 minutes'
      })
    }

    // Round up to nearest multiple of 5
    minCycleInterval = Math.ceil(minCycleInterval / 5) * 5

    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    activeProgram.minCycleInterval = minCycleInterval
    await activeProgram.save()

    res.status(200).json({
      success: true,
      data: activeProgram,
      message: `Minimum cycle interval updated to ${minCycleInterval} minutes`
    })
  } catch (error: any) {
    console.error('Error updating minimum cycle interval:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update minimum cycle interval',
      details: error.message
    })
  }
})

// PUT /api/v1/active-programs/max-execution-time - Update maximum execution time
router.put('/max-execution-time', async (req: Request, res: Response) => {
  try {
    const { maxExecutionTime } = req.body

    if (!maxExecutionTime || typeof maxExecutionTime !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'maxExecutionTime is required and must be a number'
      })
    }

    if (maxExecutionTime < 1 || maxExecutionTime > 1440) {
      return res.status(400).json({
        success: false,
        error: 'maxExecutionTime must be between 1 and 1440 minutes'
      })
    }

    const activeProgram = await ActiveProgram.findOne()
    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    activeProgram.maxExecutionTime = maxExecutionTime
    await activeProgram.save()

    res.status(200).json({
      success: true,
      data: activeProgram,
      message: `Maximum execution time updated to ${maxExecutionTime} minutes`
    })
  } catch (error: any) {
    console.error('Error updating maximum execution time:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update maximum execution time',
      details: error.message
    })
  }
})

export default router