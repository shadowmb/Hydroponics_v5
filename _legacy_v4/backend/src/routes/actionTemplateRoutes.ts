import { Router, Request, Response } from 'express'
import { ActionTemplate, type IActionTemplate, getDefaultParameters, FlowTemplate } from '../models'
import mongoose from 'mongoose'
import fs from 'fs/promises'
import path from 'path'

const router = Router()

/**
 * GET /api/v1/action-templates/test
 * Test endpoint to verify routes are working
 */
router.get('/test', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ActionTemplate routes are working',
    timestamp: new Date().toISOString()
  })
})

/**
 * GET /api/v1/action-templates
 * Get all action templates
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    //console.log('GET /action-templates - Request received')
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected. ReadyState: ' + mongoose.connection.readyState)
    }
    
    const { isActive } = req.query
    
    const filter: any = {}
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'
    }

    //console.log('Filter:', filter)
   // console.log('Database state:', mongoose.connection.readyState)
    
    const actionTemplates = await ActionTemplate.find(filter)
      .sort({ name: 1 })
      .lean()

    //console.log('Found action templates:', actionTemplates.length)
    res.status(200).json({
      success: true,
      data: actionTemplates,
      count: actionTemplates.length
    })
  } catch (error) {
    console.error('Error fetching action templates:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Unknown error')
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/v1/action-templates/flow-files
 * Get available validated FlowTemplates from database
 */
router.get('/flow-files', async (req: Request, res: Response) => {
  try {
    // Get validated FlowTemplates from database
    const flowTemplates = await FlowTemplate.find({
      isActive: true,
      validationStatus: { $in: ['ready', 'validated'] },
      isMonitoringFlow: false
    })
    .sort({ name: 1 })
    .lean()

    // Format response for frontend compatibility
    const files = flowTemplates.map(template => ({
      name: template.jsonFileName,
      displayName: template.name,
      description: template.description || '',
      flowId: template.flowId,
      version: template.version,
      _id: template._id
    }))

    res.status(200).json({
      success: true,
      data: files,
      count: files.length
    })
  } catch (error) {
    console.error('Error getting flow templates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get flow templates'
    })
  }
})

// OLD FILE SCANNING CODE - COMMENTED OUT
/*
router.get('/flow-files-old', async (req: Request, res: Response) => {
  try {
    const tasksDir = path.join(__dirname, '../../../frontend/tasks')
    
    let files: any[] = []
    try {
      const dirContents = await fs.readdir(tasksDir)
      files = dirContents
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          displayName: file.replace('.json', ''),
          fullPath: path.join(tasksDir, file)
        }))
    } catch (dirError) {
      // Directory doesn't exist yet, return empty array
     // console.log('Tasks directory does not exist yet:', tasksDir)
    }

    res.status(200).json({
      success: true,
      data: files,
      directory: tasksDir
    })
  } catch (error) {
    console.error('Error getting flow files:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get flow files'
    })
  }
})
*/

/**
 * GET /api/v1/action-templates/default-parameters
 * Get default parameters structure
 */
router.get('/default-parameters', (req: Request, res: Response) => {
  try {
    const defaultParams = getDefaultParameters()
    
    res.status(200).json({
      success: true,
      data: defaultParams
    })
  } catch (error) {
    console.error('Error getting default parameters:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get default parameters'
    })
  }
})

/**
 * GET /api/v1/action-templates/:id
 * Get action template by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action template ID format'
      })
    }

    const actionTemplate = await ActionTemplate.findById(id).lean()

    if (!actionTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Action template not found'
      })
    }

    res.status(200).json({
      success: true,
      data: actionTemplate
    })
  } catch (error) {
    console.error('Error fetching action template:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action template'
    })
  }
})

/**
 * POST /api/v1/action-templates
 * Create new action template
 */
router.post('/', async (req: Request, res: Response) => {
  try {

    
    const { name, description, icon, flowFile, parameters, parameterOverrides, globalVariables, globalVariablesMetadata } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Action template name is required'
      })
    }

    // Check if name already exists
    const existingTemplate = await ActionTemplate.findOne({ name })
    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        error: 'Action template with this name already exists'
      })
    }

    // Use default parameters if none provided
    let finalParameters = parameters
    if (!parameters || parameters.length === 0) {
      finalParameters = getDefaultParameters()
    }



    // Extract flowId from flowFile if present for usedFlowIds tracking
    let flowId = null
    if (flowFile) {
      // Extract flowId from filename like "flow_abc123_v1_0_0.json" -> "flow_abc123" 
      const match = flowFile.match(/^(flow_[^_]+)_v\d+_\d+_\d+\.json$/)
      if (match) {
        flowId = match[1]
      }
    }

    const actionTemplate = new ActionTemplate({
      name,
      description,
      icon: icon || '🔧',
      flowFile,
      usedFlowIds: flowId ? [flowId] : [],
      parameters: finalParameters,
      parameterOverrides: parameterOverrides || {},
      globalVariables: globalVariables || {},
      globalVariablesMetadata: globalVariablesMetadata || []
    })

    const savedTemplate = await actionTemplate.save()

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: 'Action template created successfully'
    })
  } catch (error: any) {
    console.error('Error creating action template:', error)
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Action template with this name already exists'
      })
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create action template'
    })
  }
})

/**
 * PUT /api/v1/action-templates/:id
 * Update action template
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {

    
    const { id } = req.params
    const { 
      name, 
      description, 
      icon, 
      flowFile, 
      parameters, 
      isActive,
      parameterOverrides,
      globalVariables,
      globalVariablesMetadata,
      targetMapping // 🎯 Phase 5: Support for individual target mapping updates
    } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action template ID format'
      })
    }

    // Check if name already exists (excluding current template)
    if (name) {
      const existingTemplate = await ActionTemplate.findOne({ 
        name, 
        _id: { $ne: id } 
      })
      if (existingTemplate) {
        return res.status(409).json({
          success: false,
          error: 'Action template with this name already exists'
        })
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (flowFile !== undefined) {
      updateData.flowFile = flowFile
      
      // Update usedFlowIds when flowFile changes
      let flowId = null
      if (flowFile) {
        const match = flowFile.match(/^(flow_[^_]+)_v\d+_\d+_\d+\.json$/)
        if (match) {
          flowId = match[1]
        }
      }
      updateData.usedFlowIds = flowId ? [flowId] : []
    }
    if (parameters !== undefined) updateData.parameters = parameters
    if (parameterOverrides !== undefined) updateData.parameterOverrides = parameterOverrides
    if (globalVariables !== undefined) updateData.globalVariables = globalVariables
    if (globalVariablesMetadata !== undefined) updateData.globalVariablesMetadata = globalVariablesMetadata
    if (isActive !== undefined) updateData.isActive = isActive

    if (name || description || icon || flowFile || parameters) {
      const { ActionTemplateUsageService } = await import('../services/ActionTemplateUsageService')
      const usage = await ActionTemplateUsageService.checkUsageInPrograms(id)

      if (usage.isUsed && !req.body.confirmEdit) {
        const programNames = usage.programs.map(p => p.programName).join(', ')
        return res.status(409).json({
          success: false,
          error: `ActionTemplate се използва в програми: ${programNames}. Искате ли да продължите?`,
          usedInPrograms: usage.programs,
          requiresConfirmation: true
        })
      }
    }

    const updatedTemplate = await ActionTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Action template not found'
      })
    }

    res.status(200).json({
      success: true,
      data: updatedTemplate,
      message: 'Action template updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating action template:', error)

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Action template with this name already exists'
      })
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update action template'
    })
  }
})

/**
 * 🎯 Phase 5: PATCH /api/v1/action-templates/:id
 * Update ActionTemplate with target mapping
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { targetMapping } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action template ID format'
      })
    }

    if (!targetMapping) {
      return res.status(400).json({
        success: false,
        error: 'targetMapping is required for PATCH operation'
      })
    }

    // Find the existing template
    const template = await ActionTemplate.findById(id)
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Action template not found'
      })
    }

    // Update or add target mapping
    const { blockId, fieldName, targetKey, comment, configuredAt, configuredBy } = targetMapping
    
    if (!blockId || !fieldName) {
      return res.status(400).json({
        success: false,
        error: 'blockId and fieldName are required in targetMapping'
      })
    }

    // Find existing mapping or create new one
    const existingMappingIndex = template.targetMappings.findIndex(
      mapping => mapping.blockId === blockId && mapping.fieldName === fieldName
    )

    if (targetKey === null || targetKey === '') {
      // Remove mapping if targetKey is null/empty
      if (existingMappingIndex >= 0) {
        template.targetMappings.splice(existingMappingIndex, 1)
      }
    } else {
      // Add or update mapping
      const newMapping = {
        blockId,
        fieldName,
        targetKey,
        comment: comment || '',
        configuredAt: configuredAt ? new Date(configuredAt) : new Date(),
        configuredBy: configuredBy || 'FlowEditor'
      }

      if (existingMappingIndex >= 0) {
        // Update existing mapping
        template.targetMappings[existingMappingIndex] = newMapping
      } else {
        // Add new mapping
        template.targetMappings.push(newMapping)
      }
    }

    // Save the updated template
    const updatedTemplate = await template.save()

    res.status(200).json({
      success: true,
      data: updatedTemplate,
      message: 'Target mapping updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating target mapping:', error)

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update target mapping'
    })
  }
})

/**
 * DELETE /api/v1/action-templates/:id
 * Delete action template
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action template ID format'
      })
    }

    const { ActionTemplateUsageService } = await import('../services/ActionTemplateUsageService')
    const usage = await ActionTemplateUsageService.checkUsageInPrograms(id)

    if (usage.isUsed) {
      const programNames = usage.programs.map(p => p.programName).join(', ')
      return res.status(400).json({
        success: false,
        error: `ActionTemplate се използва в програми: ${programNames}. Не може да се изтрие.`,
        usedInPrograms: usage.programs
      })
    }

    const deletedTemplate = await ActionTemplate.findByIdAndDelete(id)

    if (!deletedTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Action template not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Action template deleted successfully',
      data: { id: deletedTemplate._id }
    })
  } catch (error) {
    console.error('Error deleting action template:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete action template'
    })
  }
})

/**
 * GET /api/v1/action-templates/:id/flow
 * Load flow data from flowFile or linkedFlowId
 */
router.get('/:id/flow', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action template ID format'
      })
    }

    const template = await ActionTemplate.findById(id).lean()

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Action template not found'
      })
    }

    let flowData = null

    // Try to load from FlowTemplate first (new approach)
    if (template.linkedFlowId) {
      try {
        const { FlowTemplate } = await import('../models')
        const latestFlow = await FlowTemplate.findLatestVersion(template.linkedFlowId)
        if (latestFlow) {
          // Read JSON file data
          const fs = await import('fs').then(m => m.promises)
          const fullFilePath = `${process.cwd()}/../${latestFlow.filePath}${latestFlow.jsonFileName}`
          try {
            const fileContent = await fs.readFile(fullFilePath, 'utf-8')
            flowData = JSON.parse(fileContent)
          } catch (fileError) {
            console.error('Error reading flow JSON file:', fileError)
          }
        }
      } catch (error) {
        console.warn('Failed to load from FlowTemplate:', error)
      }
    }

    // Fallback to legacy flowFile approach
    if (!flowData && template.flowFile) {
      try {
        const fs = await import('fs').then(m => m.promises)
        const path = await import('path')
        
        // Construct file path - assume flowFile is relative to frontend/tasks/
        const flowFilePath = path.resolve(process.cwd(), '..', 'frontend', 'tasks', template.flowFile)
        
        // Check if file exists
        await fs.access(flowFilePath)
        
        // Read and parse the flow file
        const fileContent = await fs.readFile(flowFilePath, 'utf-8')
        const parsedData = JSON.parse(fileContent)
        
        flowData = {
          blocks: parsedData.blocks || [],
          connections: parsedData.connections || [],
          canvas: parsedData.canvas || { zoom: 1, pan: { x: 0, y: 0 } },
          meta: parsedData.meta || {}
        }
      } catch (error) {
        console.error('Failed to load flowFile:', template.flowFile, error)
      }
    }

    if (!flowData) {
      return res.status(404).json({
        success: false,
        error: 'No flow data found for this template'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        templateId: template._id,
        templateName: template.name,
        flowSource: template.linkedFlowId ? 'FlowTemplate' : 'flowFile',
        flowData: flowData
      }
    })

  } catch (error: any) {
    console.error('Error loading template flow data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load template flow data',
      details: error.message
    })
  }
})

/**
 * POST /api/v1/action-templates/validate-all
 * Validates all ActionTemplates and their sync status
 */
router.post('/validate-all', async (req: Request, res: Response) => {
  try {
    const templates = await ActionTemplate.find({ isActive: true }).lean()
    const validationResults: any[] = []
    let totalValidated = 0
    let syncedCount = 0
    let outdatedCount = 0
    let brokenCount = 0

    for (const template of templates) {
      try {
        let syncStatus = 'unknown'
        let flowValidation = null

        // Check if template has flow reference
        if (template.linkedFlowId || template.flowFile) {
          // Try to load flow data
          try {
            // For linkedFlowId - check FlowTemplate
            if (template.linkedFlowId) {
              const { FlowTemplate } = await import('../models')
              const latestFlow = await FlowTemplate.findLatestVersion(template.linkedFlowId)
              
              if (latestFlow) {
                syncStatus = 'synced'
                // TODO: IMPLEMENT_LATER - Add flow validation logic
              } else {
                syncStatus = 'broken'
              }
            }
            // For flowFile - check file system
            else if (template.flowFile) {
              const fs = await import('fs').then(m => m.promises)
              const path = await import('path')
              
              const flowFilePath = path.resolve(process.cwd(), '..', 'frontend', 'tasks', template.flowFile)
              
              try {
                await fs.access(flowFilePath)
                syncStatus = 'synced'
                // TODO: IMPLEMENT_LATER - Add file validation logic
              } catch {
                syncStatus = 'broken'
              }
            }
          } catch (error) {
            console.warn(`Validation error for template ${template._id}:`, error)
            syncStatus = 'broken'
          }
        } else {
          syncStatus = 'broken' // No flow reference
        }

        // Update template sync status if changed
        if (template.syncStatus !== syncStatus) {
          await ActionTemplate.findByIdAndUpdate(template._id, {
            syncStatus,
            lastSyncCheck: new Date()
          })
        }

        // Count status types
        switch (syncStatus) {
          case 'synced': syncedCount++; break
          case 'outdated': outdatedCount++; break
          case 'broken': brokenCount++; break
        }

        validationResults.push({
          templateId: template._id,
          templateName: template.name,
          syncStatus,
          hasFlow: !!(template.linkedFlowId || template.flowFile),
          targetMappings: template.targetMappings?.length || 0
        })

        totalValidated++
      } catch (error) {
        console.error(`Error validating template ${template._id}:`, error)
        validationResults.push({
          templateId: template._id,
          templateName: template.name,
          syncStatus: 'broken',
          error: error instanceof Error ? error.message : 'Validation error'
        })
        brokenCount++
      }
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTemplates: templates.length,
          totalValidated,
          syncedCount,
          outdatedCount,
          brokenCount
        },
        results: validationResults
      },
      message: `Validated ${totalValidated} ActionTemplates`
    })

  } catch (error: any) {
    console.error('Error in validate-all:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to validate ActionTemplates',
      details: error.message
    })
  }
})

/**
 * GET /api/v1/action-templates/by-flow/:flowId
 * Get ActionTemplates that use a specific flow
 */
router.get('/by-flow/:flowId', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params
    
    if (!flowId) {
      return res.status(400).json({
        success: false,
        error: 'Flow ID is required'
      })
    }

    // First, find FlowTemplate to get the jsonFileName
    const flowTemplate = await FlowTemplate.findOne({ flowId }).lean()
    
    let queryConditions = []
    
    // Add modern flow linking conditions
    queryConditions.push(
      { linkedFlowId: flowId },
      { linkedFlowVersionId: { $regex: `^${flowId}_v` } }
    )
    
    // Add legacy flowFile condition if we found a FlowTemplate
    if (flowTemplate?.jsonFileName) {
      queryConditions.push({ flowFile: flowTemplate.jsonFileName })
    }

    // Find ActionTemplates using any of these conditions
    const actionTemplates = await ActionTemplate.find({
      $or: queryConditions,
      isActive: true
    })
    .select('name description icon linkedFlowId linkedFlowVersion flowFile')
    .sort({ name: 1 })
    .lean()

    res.status(200).json({
      success: true,
      data: actionTemplates,
      count: actionTemplates.length,
      flowId,
      searchedJsonFileName: flowTemplate?.jsonFileName || null
    })

  } catch (error: any) {
    console.error('Error finding ActionTemplates by flowId:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to find ActionTemplates',
      details: error.message
    })
  }
})

// ============================================================================
// STANDALONE ACTIONTEMPLATE EXECUTION ENDPOINTS
// ============================================================================

import { ActionTemplateExecutionService } from '../services/ActionTemplateExecutionService'

/**
 * POST /api/v1/action-templates/:id/start
 * Start standalone ActionTemplate execution
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params
    const { globalVariables } = req.body

    const executionService = ActionTemplateExecutionService.getInstance()
    const result = await executionService.startActionTemplate(id, globalVariables)

    if (result.success) {
      res.status(200).json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error: any) {
    console.error('Error starting ActionTemplate:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * POST /api/v1/action-templates/:id/stop
 * Stop standalone ActionTemplate execution
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params

    const executionService = ActionTemplateExecutionService.getInstance()
    const result = await executionService.stopActionTemplate(id)

    if (result.success) {
      res.status(200).json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error: any) {
    console.error('Error stopping ActionTemplate:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * POST /api/v1/action-templates/resume
 * Resume paused ActionTemplate execution
 */
router.post('/resume', async (req, res) => {
  try {
    const executionService = ActionTemplateExecutionService.getInstance()
    const success = executionService.resumeExecution()

    if (success) {
      res.status(200).json({
        success: true,
        message: 'ActionTemplate execution resumed successfully'
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to resume execution'
      })
    }
  } catch (error: any) {
    console.error('Error resuming ActionTemplate execution:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * GET /api/v1/action-templates/running
 * Get currently running ActionTemplates
 */
router.get('/running', async (req, res) => {
  try {
    const runningTemplates = await ActionTemplate.find({ runStatus: true }).lean()

    res.status(200).json({
      success: true,
      data: runningTemplates,
      count: runningTemplates.length
    })
  } catch (error: any) {
    console.error('Error fetching running ActionTemplates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch running ActionTemplates',
      details: error.message
    })
  }
})

export default router