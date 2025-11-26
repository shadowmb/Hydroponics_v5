import { Router, Request, Response } from 'express'
import { MonitoringFlow, IMonitoringFlow } from '../models/MonitoringFlow'
import { FlowTemplate } from '../models/FlowTemplate'
import * as fs from 'fs/promises'

const router = Router()

// GET /api/v1/monitoring-flows - Get all monitoring flows
router.get('/', async (req: Request, res: Response) => {
  try {
    const monitoringFlows = await MonitoringFlow.find()
      .populate('flowTemplateId', 'name description version jsonFileName')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: monitoringFlows,
      count: monitoringFlows.length
    })
  } catch (error: any) {
    console.error('Error fetching monitoring flows:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring flows',
      details: error.message
    })
  }
})

// GET /api/v1/monitoring-flows/available-flows - Get FlowTemplates from monitoring directory
router.get('/available-flows', async (req: Request, res: Response) => {
  try {
    // Get flow templates with monitoring flag
    const flowTemplates = await FlowTemplate.find({ 
      isMonitoringFlow: true 
    }).lean()
    
    // Get already active monitoring flows to exclude them
    const activeMonitoringFlows = await MonitoringFlow.find({ isActive: true }).lean()
    const activeFlowTemplateIds = new Set(
      activeMonitoringFlows.map(mf => mf.flowTemplateId.toString())
    )

    const availableFlows = []

    // Process each monitoring flow template
    for (const template of flowTemplates) {
      // Skip if already active as monitoring flow
      if (activeFlowTemplateIds.has(template._id.toString())) {
        continue
      }

      try {
        // Read and parse flow JSON
        const fullFilePath = `${process.cwd()}/../${template.filePath}${template.jsonFileName}`
        const fileContent = await fs.readFile(fullFilePath, 'utf-8')
        const flowData = JSON.parse(fileContent)

        // Count monitoring blocks
        const monitoringBlocksCount = flowData.blocks?.filter((block: any) => 
          block.parameters?.monitoringTagId && block.parameters.monitoringTagId !== ''
        ).length || 0

        availableFlows.push({
          _id: template._id,
          name: template.name,
          description: template.description,
          version: template.version,
          jsonFileName: template.jsonFileName,
          hasMonitoringTags: monitoringBlocksCount > 0,
          monitoringBlocksCount
        })
      } catch (fileError) {
        console.warn(`⚠️ Could not read flow file for template ${template.name}:`, fileError)
        // Continue with next template
      }
    }

    res.status(200).json({
      success: true,
      data: availableFlows,
      count: availableFlows.length
    })
  } catch (error: any) {
    console.error('Error fetching available flows:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available flows',
      details: error.message
    })
  }
})

// GET /api/v1/monitoring-flows/:id - Get single monitoring flow
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const monitoringFlow = await MonitoringFlow.findById(req.params.id)
      .populate('flowTemplateId', 'name description version jsonFileName')

    if (!monitoringFlow) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring flow not found'
      })
    }

    res.status(200).json({
      success: true,
      data: monitoringFlow
    })
  } catch (error: any) {
    console.error('Error fetching monitoring flow:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring flow',
      details: error.message
    })
  }
})

// POST /api/v1/monitoring-flows - Create new monitoring flow
router.post('/', async (req: Request, res: Response) => {
  try {
    const { flowTemplateId, name, description, monitoringInterval } = req.body

    // Validation
    if (!flowTemplateId) {
      return res.status(400).json({
        success: false,
        error: 'FlowTemplate ID is required'
      })
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      })
    }

    if (!monitoringInterval || monitoringInterval < 1 || monitoringInterval > 1440) {
      return res.status(400).json({
        success: false,
        error: 'Monitoring interval must be between 1 and 1440 minutes'
      })
    }

    // Check if FlowTemplate exists
    const flowTemplate = await FlowTemplate.findById(flowTemplateId)
    if (!flowTemplate) {
      return res.status(404).json({
        success: false,
        error: 'FlowTemplate not found'
      })
    }

    // Check if monitoring flow for this template already exists
    const existingMonitoringFlow = await MonitoringFlow.findOne({ flowTemplateId })
    if (existingMonitoringFlow) {
      return res.status(400).json({
        success: false,
        error: 'Monitoring flow for this FlowTemplate already exists'
      })
    }

    // Create monitoring flow
    const monitoringFlow = new MonitoringFlow({
      flowTemplateId,
      name: name.trim(),
      description: description?.trim() || '',
      monitoringInterval
    })

    const savedMonitoringFlow = await monitoringFlow.save()
    await savedMonitoringFlow.populate('flowTemplateId', 'name description version jsonFileName')

    res.status(201).json({
      success: true,
      data: savedMonitoringFlow,
      message: 'Monitoring flow created successfully'
    })
  } catch (error: any) {
    console.error('Error creating monitoring flow:', error)
    
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
      error: 'Failed to create monitoring flow',
      details: error.message
    })
  }
})

// PUT /api/v1/monitoring-flows/:id - Update monitoring flow
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, monitoringInterval, isActive } = req.body

    const updateData: Partial<IMonitoringFlow> = {}
    
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (monitoringInterval !== undefined) {
      if (monitoringInterval < 1 || monitoringInterval > 1440) {
        return res.status(400).json({
          success: false,
          error: 'Monitoring interval must be between 1 and 1440 minutes'
        })
      }
      updateData.monitoringInterval = monitoringInterval
    }
    if (isActive !== undefined) updateData.isActive = isActive

    const monitoringFlow = await MonitoringFlow.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('flowTemplateId', 'name description version jsonFileName')

    if (!monitoringFlow) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring flow not found'
      })
    }

    res.status(200).json({
      success: true,
      data: monitoringFlow,
      message: 'Monitoring flow updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating monitoring flow:', error)
    
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
      error: 'Failed to update monitoring flow',
      details: error.message
    })
  }
})

// DELETE /api/v1/monitoring-flows/:id - Delete monitoring flow
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const monitoringFlow = await MonitoringFlow.findById(req.params.id)

    if (!monitoringFlow) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring flow not found'
      })
    }

    await MonitoringFlow.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Monitoring flow deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting monitoring flow:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete monitoring flow',
      details: error.message
    })
  }
})

// POST /api/v1/monitoring-flows/:id/activate - Activate monitoring flow
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const monitoringFlow = await MonitoringFlow.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: true,
        nextExecution: new Date(Date.now() + 60000) // Start in 1 minute
      },
      { new: true }
    ).populate('flowTemplateId', 'name description version jsonFileName')

    if (!monitoringFlow) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring flow not found'
      })
    }

    res.status(200).json({
      success: true,
      data: monitoringFlow,
      message: 'Monitoring flow activated successfully'
    })
  } catch (error: any) {
    console.error('Error activating monitoring flow:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to activate monitoring flow',
      details: error.message
    })
  }
})

// POST /api/v1/monitoring-flows/:id/deactivate - Deactivate monitoring flow
router.post('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const monitoringFlow = await MonitoringFlow.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        nextExecution: undefined
      },
      { new: true }
    ).populate('flowTemplateId', 'name description version jsonFileName')

    if (!monitoringFlow) {
      return res.status(404).json({
        success: false,
        error: 'Monitoring flow not found'
      })
    }

    res.status(200).json({
      success: true,
      data: monitoringFlow,
      message: 'Monitoring flow deactivated successfully'
    })
  } catch (error: any) {
    console.error('Error deactivating monitoring flow:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate monitoring flow',
      details: error.message
    })
  }
})

export default router