import { Router, Request, Response } from 'express'
import { Program, IProgram } from '../models/Program'

const router = Router()

// GET /api/v1/programs - Get all programs
router.get('/', async (req: Request, res: Response) => {
  try {
    const programs = await Program.find()
      .populate('cycles.actions.actionTemplateId', 'name icon description parameters globalVariablesMetadata')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: programs,
      count: programs.length
    })
  } catch (error: any) {
    console.error('Error fetching programs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch programs',
      details: error.message
    })
  }
})

// GET /api/v1/programs/:id - Get single program
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('cycles.actions.actionTemplateId', 'name icon description parameters globalVariablesMetadata')

    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      })
    }

    res.status(200).json({
      success: true,
      data: program
    })
  } catch (error: any) {
    console.error('Error fetching program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch program',
      details: error.message
    })
  }
})

// POST /api/v1/programs - Create new program
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, cycles, maxExecutionTime } = req.body

    //console.log('🔧 DEBUG: POST /programs - Received request body:', JSON.stringify(req.body, null, 2))

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Program name is required'
      })
    }

    if (!cycles || cycles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one cycle is required'
      })
    }

    // Validate that each cycle has at least one action
    for (let i = 0; i < cycles.length; i++) {
      if (!cycles[i].actions || cycles[i].actions.length === 0) {
        return res.status(400).json({
          success: false,
          error: `Cycle ${i + 1} must have at least one action`
        })
      }
    }

    const processedCycles = cycles.map((cycle: any, index: number) => {
      console.log(`🔧 DEBUG: Processing cycle ${index}:`, JSON.stringify(cycle, null, 2))
      
      const processedActions = (cycle.actions || []).map((action: any, actionIndex: number) => {
        console.log(`🔧 DEBUG: Processing action ${actionIndex} in cycle ${index}:`, JSON.stringify(action, null, 2))
        return action
      })
      
      const processedCycle = {
        startTime: cycle.time || cycle.startTime,
        actions: processedActions,
        isActive: cycle.isActive !== false
      }
      
      console.log(`🔧 DEBUG: Processed cycle ${index}:`, JSON.stringify(processedCycle, null, 2))
      return processedCycle
    })

    const program = new Program({
      name: name.trim(),
      description: description?.trim() || '',
      maxExecutionTime: maxExecutionTime ?? 60,
      cycles: processedCycles
    })

    console.log('🔧 DEBUG: Program object before save:', JSON.stringify(program.toJSON(), null, 2))

    const savedProgram = await program.save()
    
    console.log('🔧 DEBUG: Saved program:', JSON.stringify(savedProgram.toJSON(), null, 2))

    const { ActionTemplateUsageService } = await import('../services/ActionTemplateUsageService')
    
    const actionTemplateIds = new Set<string>()
    savedProgram.cycles.forEach(cycle => {
      cycle.actions.forEach(action => {
        actionTemplateIds.add(action.actionTemplateId.toString())
      })
    })

    for (const templateId of actionTemplateIds) {
      await ActionTemplateUsageService.syncUsedInPrograms(templateId)
    }

    res.status(201).json({
      success: true,
      data: savedProgram,
      message: 'Program created successfully'
    })
  } catch (error: any) {
    console.error('Error creating program:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create program',
      details: error.message
    })
  }
})

// PUT /api/v1/programs/:id - Update program
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, cycles, maxExecutionTime, isMonitoring, monitoringInterval, isActive } = req.body

    const updateData: Partial<IProgram> = {}
    
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (maxExecutionTime !== undefined) updateData.maxExecutionTime = maxExecutionTime ?? 60
    if (isMonitoring !== undefined) updateData.isMonitoring = isMonitoring
    if (monitoringInterval !== undefined) updateData.monitoringInterval = monitoringInterval
    if (isActive !== undefined) updateData.isActive = isActive
    if (cycles) {
      updateData.cycles = cycles.map((cycle: any) => ({
        startTime: cycle.time || cycle.startTime,
        actions: cycle.actions || [],
        isActive: cycle.isActive !== false
      }))
    }

    const program = await Program.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('cycles.actions.actionTemplateId', 'name icon description globalVariablesMetadata')

    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      })
    }

    const { ActionTemplateUsageService } = await import('../services/ActionTemplateUsageService')
    await ActionTemplateUsageService.syncAllActionTemplateUsage()

    res.status(200).json({
      success: true,
      data: program,
      message: 'Program updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating program:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update program',
      details: error.message
    })
  }
})

// DELETE /api/v1/programs/:id - Delete program
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const program = await Program.findById(req.params.id)

    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      })
    }

    if (program.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a running program. Stop it first.'
      })
    }

    await Program.findByIdAndDelete(req.params.id)

    const { ActionTemplateUsageService } = await import('../services/ActionTemplateUsageService')
    await ActionTemplateUsageService.syncAllActionTemplateUsage()

    res.status(200).json({
      success: true,
      message: 'Program deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete program',
      details: error.message
    })
  }
})

export default router