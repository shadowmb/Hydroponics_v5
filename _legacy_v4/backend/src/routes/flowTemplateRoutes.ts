import { Router, Request, Response } from 'express'
import { FlowTemplate, type IFlowTemplate } from '../models'
import { FlowProtectionService } from '../services/FlowProtectionService'
import { FlowDirectoryManager } from '../services/FlowDirectoryManager'
import mongoose from 'mongoose'

// Simple backend flow validation function
const validateFlowData = (flowData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Basic structure validation
  if (!flowData || typeof flowData !== 'object') {
    errors.push('Invalid flow data structure')
    return { isValid: false, errors }
  }
  
  // Check required fields
  if (!Array.isArray(flowData.blocks)) {
    errors.push('Flow must have blocks array')
  }
  
  if (!Array.isArray(flowData.connections)) {
    errors.push('Flow must have connections array')
  }
  
  // Check for empty flow
  if (flowData.blocks?.length === 0) {
    errors.push('Flow cannot be empty')
  }
  
  // Check for START block
  const hasStartBlock = flowData.blocks?.some((block: any) => 
    block.definitionId === 'system.start' || 
    (block.definitionId && block.definitionId.includes('start'))
  )
  
  if (!hasStartBlock && flowData.blocks?.length > 0) {
    errors.push('Flow must have a START block')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

const router = Router()

/**
 * GET /api/v1/flow-templates/test
 * Test endpoint to verify routes are working
 */
router.get('/test', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'FlowTemplate routes are working',
    timestamp: new Date().toISOString()
  })
})

/**
 * GET /api/v1/flow-templates
 * Get all flow templates metadata (without loading JSON files)
 * Enhanced с latest-only filter за UI versioning simplification
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected. ReadyState: ' + mongoose.connection.readyState)
    }
    
    const { isActive, flowId, isDraft, latestOnly } = req.query
    
    const filter: any = {}
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'
    }
    if (flowId) {
      filter.flowId = flowId
    }
    if (isDraft !== undefined) {
      filter.isDraft = isDraft === 'true'
    }

    let flowTemplates

    // Latest-only filter за UI versioning simplification
    if (latestOnly === 'true') {
      flowTemplates = await FlowTemplate.aggregate([
        { $match: filter },
        { $sort: { flowId: 1, version: -1 } },
        { $group: { 
          _id: '$flowId', 
          doc: { $first: '$$ROOT' } 
        }},
        { $replaceRoot: { newRoot: '$doc' } },
        { $sort: { flowId: 1 } }
      ])
    } else {
      flowTemplates = await FlowTemplate.find(filter)
        .sort({ flowId: 1, version: -1 })
        .lean()
    }

    // Add linkedActionTemplates count за protection indication
    const flowsWithUsage = await Promise.all(
      flowTemplates.map(async (template: any) => {
        try {
          const protection = await FlowProtectionService.checkFlowProtection(template.flowId)
          return {
            ...template,
            linkedActionTemplates: protection.usageCount,
            isProtected: protection.isProtected
          }
        } catch (error) {
          return {
            ...template,
            linkedActionTemplates: 0,
            isProtected: false
          }
        }
      })
    )

    res.status(200).json({
      success: true,
      data: flowsWithUsage,
      count: flowsWithUsage.length
    })
  } catch (error) {
    console.error('Error fetching flow templates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flow templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/v1/flow-templates/flows
 * Get list of unique flow IDs
 */
router.get('/flows', async (req: Request, res: Response) => {
  try {
    const flows = await FlowTemplate.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$flowId', 
        latestVersion: { $max: '$version' },
        name: { $first: '$name' },
        description: { $first: '$description' },
        createdAt: { $max: '$createdAt' }
      } },
      { $project: { 
        flowId: '$_id', 
        latestVersion: 1, 
        name: 1, 
        description: 1,
        createdAt: 1,
        _id: 0 
      } },
      { $sort: { flowId: 1 } }
    ])

    res.status(200).json({
      success: true,
      data: flows,
      count: flows.length
    })
  } catch (error) {
    console.error('Error fetching flow list:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flow list'
    })
  }
})

/**
 * GET /api/v1/flow-templates/flow/:flowId/latest
 * Get latest version of a specific flow
 */
router.get('/flow/:flowId/latest', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params
    
    const latestVersion = await FlowTemplate.findLatestVersion(flowId)
    
    if (!latestVersion) {
      return res.status(404).json({
        success: false,
        error: 'Flow not found'
      })
    }

    res.status(200).json({
      success: true,
      data: latestVersion
    })
  } catch (error) {
    console.error('Error fetching latest flow version:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest flow version'
    })
  }
})

/**
 * GET /api/v1/flow-templates/flow/:flowId/versions
 * Get all versions of a specific flow
 */
router.get('/flow/:flowId/versions', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params
    
    const versions = await FlowTemplate.getAllVersions(flowId)
    
    res.status(200).json({
      success: true,
      data: versions,
      count: versions.length
    })
  } catch (error) {
    console.error('Error fetching flow versions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flow versions'
    })
  }
})

/**
 * GET /api/v1/flow-templates/version/:versionId
 * Get specific version by versionId
 */
router.get('/version/:versionId', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params
    
    const flowTemplate = await FlowTemplate.findByVersionId(versionId)
    
    if (!flowTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Flow version not found'
      })
    }

    res.status(200).json({
      success: true,
      data: flowTemplate
    })
  } catch (error) {
    console.error('Error fetching flow version:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flow version'
    })
  }
})

/**
 * GET /api/v1/flow-templates/:id
 * Get flow template by MongoDB ID and return with JSON file data
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flow template ID format'
      })
    }

    const flowTemplate = await FlowTemplate.findById(id).lean()

    if (!flowTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Flow template not found'
      })
    }

    // Read JSON file data
    const fs = await import('fs').then(m => m.promises)
    const fullFilePath = `${process.cwd()}/../${flowTemplate.filePath}${flowTemplate.jsonFileName}`
    
    // FIXED: Always guarantee proper flowData structure
    let flowData = null
    try {
      const fileContent = await fs.readFile(fullFilePath, 'utf-8')
      flowData = JSON.parse(fileContent)
    } catch (fileError) {
      console.warn('JSON file not found or corrupted, using default structure:', fileError instanceof Error ? fileError.message : 'Unknown error')
      // Don't return error - create default structure instead
    }

    // CRITICAL FIX: Ensure flowData always has proper structure
    if (!flowData || typeof flowData !== 'object' || !Array.isArray(flowData.blocks)) {
      console.log('🔧 Creating default flowData structure for:', flowTemplate._id)
      flowData = {
        id: `flow_${flowTemplate._id}_${Date.now()}`,
        version: "3.0.0",
        meta: {
          name: flowTemplate.name || 'Unnamed Flow',
          description: flowTemplate.description || '',
          version: "3.0.0",
          createdAt: flowTemplate.createdAt || new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          flowEditorVersion: "3.0.0",
          formatVersion: "3.0.0"
        },
        blocks: [],
        connections: [],
        canvas: {
          zoom: 1.0,
          pan: { x: 0, y: 0 },
          grid: { size: 20, visible: true, snap: true }
        }
      }
    }

    // VALIDATION: Ensure required arrays exist
    if (!Array.isArray(flowData.blocks)) {
      flowData.blocks = []
    }
    if (!Array.isArray(flowData.connections)) {
      flowData.connections = []
    }
    if (!flowData.meta || typeof flowData.meta !== 'object') {
      flowData.meta = {
        name: flowTemplate.name || 'Unnamed Flow',
        description: flowTemplate.description || '',
        version: "3.0.0",
        createdAt: flowTemplate.createdAt || new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    }

    console.log('✅ Returning flowData with guaranteed structure:', {
      blocksCount: flowData.blocks.length,
      connectionsCount: flowData.connections.length,
      hasMeta: !!flowData.meta
    })

    // Return metadata + flow data for compatibility
    res.status(200).json({
      success: true,
      data: {
        ...flowTemplate,
        flowData // Now guaranteed to have proper structure
      }
    })
  } catch (error) {
    console.error('Error fetching flow template:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flow template'
    })
  }
})

/**
 * POST /api/v1/flow-templates
 * Create new flow template
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { flowId, version, name, description, flowData, createdBy } = req.body

    if (!flowId || !version || !name || !flowData) {
      return res.status(400).json({
        success: false,
        error: 'flowId, version, name and flowData are required'
      })
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      return res.status(400).json({
        success: false,
        error: 'Version must follow semantic versioning format (x.y.z)'
      })
    }

    // Check if this exact version already exists
    const existingVersion = await FlowTemplate.findOne({ flowId, version })
    if (existingVersion) {
      return res.status(409).json({
        success: false,
        error: 'This version already exists for this flow'
      })
    }

    // Generate JSON filename and file path - check for monitoring flow option
    const jsonFileName = `${flowId}_v${version.replace(/\./g, '_')}.json`
    let filePath = '/flow-templates/flows/'
    
    // All flows go to /flows/ directory regardless of monitoring status
    
    const fullFilePath = `${process.cwd()}/../${filePath}${jsonFileName}`

    // Write JSON file
    const fs = await import('fs').then(m => m.promises)
    const path = await import('path')
    
    // Ensure directory exists
    const dirPath = path.dirname(fullFilePath)
    await fs.mkdir(dirPath, { recursive: true })
    
    // Write flow data to JSON file
    await fs.writeFile(fullFilePath, JSON.stringify(flowData, null, 2), 'utf-8')

    // Validate flowData
    let validationStatus: 'draft' | 'ready' | 'invalid' | 'validated' = 'draft'
    try {
      const validationResult = validateFlowData(flowData)
      validationStatus = validationResult.isValid ? 'ready' : 'draft'
    } catch (validationError) {
      validationStatus = 'invalid'
    }

    // Create database record with file metadata
    const flowTemplate = new FlowTemplate({
      flowId,
      version,
      name,
      description,
      jsonFileName,
      filePath,
      isDraft: false,
      validationStatus,
      isMonitoringFlow: req.body.saveOptions?.isMonitoringFlow || false,
      createdBy
    })

    const savedTemplate = await flowTemplate.save()

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: 'Flow template created successfully'
    })
  } catch (error: any) {
    console.error('Error creating flow template:', error)
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Flow template version already exists'
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
      error: 'Failed to create flow template'
    })
  }
})

/**
 * POST /api/v1/flow-templates/flow/:flowId/increment
 * Create new version by incrementing existing flow
 */
router.post('/flow/:flowId/increment', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params
    const { type = 'patch', name, description, flowData, createdBy } = req.body

    if (!['major', 'minor', 'patch'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Version increment type must be major, minor, or patch'
      })
    }

    // Get latest version
    const latestVersion = await FlowTemplate.findLatestVersion(flowId)
    if (!latestVersion) {
      return res.status(404).json({
        success: false,
        error: 'Flow not found'
      })
    }

    // Read existing JSON file if no new flowData provided
    let actualFlowData = flowData
    if (!flowData) {
      const fs = await import('fs').then(m => m.promises)
      const existingFilePath = `${process.cwd()}/../${latestVersion.filePath}${latestVersion.jsonFileName}`
      try {
        const fileContent = await fs.readFile(existingFilePath, 'utf-8')
        actualFlowData = JSON.parse(fileContent)
      } catch (fileError) {
        return res.status(404).json({
          success: false,
          error: 'Previous version JSON file not found'
        })
      }
    }

    // Create new version with incremented version number
    const newTemplate = new FlowTemplate({
      flowId,
      version: '0.0.0', // Temporary, will be set by incrementVersion method
      name: name || latestVersion.name,
      description: description || latestVersion.description,
      jsonFileName: '', // Will be set after version is calculated
      filePath: '/flow-templates/flows/',
      isDraft: false,
      validationStatus: 'draft', // Will be updated after validation
      createdBy
    })

    // Set version based on latest and increment type
    const [major, minor, patch] = latestVersion.version.split('.').map(Number)
    
    switch (type) {
      case 'major':
        newTemplate.version = `${major + 1}.0.0`
        break
      case 'minor':
        newTemplate.version = `${major}.${minor + 1}.0`
        break
      case 'patch':
        newTemplate.version = `${major}.${minor}.${patch + 1}`
        break
    }

    // Generate JSON filename after version is set
    const jsonFileName = `${flowId}_v${newTemplate.version.replace(/\./g, '_')}.json`
    newTemplate.jsonFileName = jsonFileName
    
    // Write JSON file
    const fs = await import('fs').then(m => m.promises)
    const path = await import('path')
    const fullFilePath = `${process.cwd()}/../${newTemplate.filePath}${jsonFileName}`
    
    // Ensure directory exists
    const dirPath = path.dirname(fullFilePath)
    await fs.mkdir(dirPath, { recursive: true })
    
    // Write flow data to JSON file
    await fs.writeFile(fullFilePath, JSON.stringify(actualFlowData, null, 2), 'utf-8')

    // Validate flowData for new version
    try {
      const validationResult = validateFlowData(actualFlowData)
      newTemplate.validationStatus = validationResult.isValid ? 'ready' : 'draft'
    } catch (validationError) {
      newTemplate.validationStatus = 'invalid'
    }

    const savedTemplate = await newTemplate.save()

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: `Flow template ${type} version created successfully`
    })
  } catch (error: any) {
    console.error('Error creating incremented flow template:', error)
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Flow template version already exists'
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
      error: 'Failed to create incremented flow template'
    })
  }
})

/**
 * PUT /api/v1/flow-templates/:id
 * Update flow template (metadata and JSON file content)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, isActive, flowData, metadata } = req.body
    
    // Handle metadata format from frontend
    const actualName = metadata?.name || name
    const actualDescription = metadata?.description || description

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flow template ID format'
      })
    }

    // Find existing template
    const existingTemplate = await FlowTemplate.findById(id)
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Flow template not found'
      })
    }

    // Initialize validation status variable
    let newValidationStatus: 'draft' | 'ready' | 'invalid' | 'validated' | undefined = undefined
    
    // Update JSON file if flowData is provided
    if (flowData) {
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')
      
      const fullFilePath = `${process.cwd()}/../${existingTemplate.filePath}${existingTemplate.jsonFileName}`
      
      try {
        // Ensure directory exists
        const dirPath = path.dirname(fullFilePath)
        await fs.mkdir(dirPath, { recursive: true })
        
        // Update JSON file content
        await fs.writeFile(fullFilePath, JSON.stringify(flowData, null, 2), 'utf-8')
        
        // Use validation status from frontend if provided, otherwise fallback to backend validation
        if (metadata?.validationStatus) {
          newValidationStatus = metadata.validationStatus
          console.log(`🔍 Using frontend validation status: ${newValidationStatus}`)
        } else {
          // Fallback to backend validation only if frontend didn't provide status
          try {
            const validationResult = validateFlowData(flowData)
            newValidationStatus = validationResult.isValid ? 'ready' : 'draft'
            console.log(`🔍 Using backend validation status: ${newValidationStatus}`)
          } catch (validationError) {
            newValidationStatus = 'invalid'
            console.log(`🔍 Backend validation failed, status: ${newValidationStatus}`)
          }
        }
      } catch (fileError) {
        console.error('Error updating JSON file:', fileError)
        return res.status(500).json({
          success: false,
          error: 'Failed to update flow JSON file'
        })
      }
    }

    // Update metadata - initialize updateData first
    const updateData: any = {}
    if (actualName !== undefined) updateData.name = actualName
    if (actualDescription !== undefined) updateData.description = actualDescription
    if (isActive !== undefined) updateData.isActive = isActive
    if (newValidationStatus !== undefined) updateData.validationStatus = newValidationStatus
    if (req.body.saveOptions?.isMonitoringFlow !== undefined) updateData.isMonitoringFlow = req.body.saveOptions.isMonitoringFlow

    // Add validationSummary from flowData if present (frontend adds it there)
    if (flowData?.validationSummary) {
      updateData.validationSummary = flowData.validationSummary
    }

    const updatedTemplate = await FlowTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Flow template not found'
      })
    }

    res.status(200).json({
      success: true,
      data: updatedTemplate,
      message: 'Flow template updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating flow template:', error)

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update flow template'
    })
  }
})

/**
 * DELETE /api/v1/flow-templates/:id
 * Delete flow template (hard delete from database)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flow template ID format'
      })
    }

    // Find template first to get file info
    const deletedTemplate = await FlowTemplate.findById(id)

    if (!deletedTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Flow template not found'
      })
    }

    // Move physical JSON file to temp directory before DB deletion
    const fs = await import('fs').then(m => m.promises)
    const path = await import('path')
    
    const currentFilePath = `${process.cwd()}/../${deletedTemplate.filePath}${deletedTemplate.jsonFileName}`
    const tempDirectory = '/flow-templates/temp/'
    const tempFilePath = `${process.cwd()}/../${tempDirectory}${deletedTemplate.jsonFileName}`
    
    try {
      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath)
      await fs.mkdir(tempDir, { recursive: true })
      
      // Check if source file exists before moving
      try {
        await fs.access(currentFilePath)
        // Move file to temp directory
        await fs.rename(currentFilePath, tempFilePath)
        console.log(`✅ Moved deleted flow file to temp: ${deletedTemplate.jsonFileName}`)
      } catch (fileError) {
        // File doesn't exist - just log warning, don't fail deletion
        console.warn(`⚠️ Physical file not found during deletion: ${currentFilePath}`)
      }
    } catch (error) {
      console.error('❌ Error moving file to temp:', error)
      // Continue with DB deletion even if file move fails
    }

    // Hard delete from database
    await FlowTemplate.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: 'Flow template deleted successfully',
      data: { id: deletedTemplate._id, versionId: deletedTemplate.versionId }
    })
  } catch (error) {
    console.error('Error deleting flow template:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete flow template'
    })
  }
})

/**
 * POST /api/v1/flow-templates/save
 * Save flow as JSON file and store metadata in DB
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { flowData, metadata: { name, description, isDraft = false, validationStatus }, saveOptions } = req.body

    // Validate required fields
    if (!flowData || !name) {
      return res.status(400).json({
        success: false,
        error: 'flowData and name are required'
      })
    }

    // Generate flow ID using MongoDB ObjectId for uniqueness
    const tempId = new mongoose.Types.ObjectId()
    const flowId = `flow_${tempId.toString()}`
    const version = '1.0.0'
    
    // Generate file name and path - check for monitoring flow option
    const jsonFileName = `${flowId}_v${version.replace(/\./g, '_')}.json`
    let filePath = '/flow-templates/flows/'
    
    // Determine directory based on save options
    if (isDraft) {
      filePath = '/flow-templates/drafts/'
    } else {
      filePath = '/flow-templates/flows/'
    }
    
    const fullFilePath = `${process.cwd()}/../${filePath}${jsonFileName}`

    // Write JSON file
    const fs = await import('fs').then(m => m.promises)
    const path = await import('path')
    
    // Ensure directory exists
    const dirPath = path.dirname(fullFilePath)
    await fs.mkdir(dirPath, { recursive: true })
    
    // Write flow data to JSON file
    await fs.writeFile(fullFilePath, JSON.stringify(flowData, null, 2), 'utf-8')

    // Use validation status from frontend (already validated)
    const finalValidationStatus: 'draft' | 'ready' | 'invalid' | 'validated' = validationStatus || 'draft'
    console.log(`🔍 Using frontend validation status: ${finalValidationStatus}`)

    // Check if flow already exists in DB
    let flowTemplate = await FlowTemplate.findOne({ flowId })
    
    if (flowTemplate) {
      // Update existing metadata
      flowTemplate.jsonFileName = jsonFileName
      flowTemplate.filePath = filePath
      flowTemplate.isDraft = isDraft
      flowTemplate.validationStatus = finalValidationStatus
      flowTemplate.description = description || flowTemplate.description
      flowTemplate.name = name
      flowTemplate.generateVersionId()
    } else {
      // Create new metadata record
      flowTemplate = new FlowTemplate({
        flowId,
        version,
        name,
        description: description || '',
        jsonFileName,
        filePath,
        isDraft,
        validationStatus: finalValidationStatus,
        isMonitoringFlow: saveOptions?.isMonitoringFlow || false,
        createdBy: 'FlowEditor'
      })
      flowTemplate.generateVersionId()
    }

    const savedTemplate = await flowTemplate.save()

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: `Flow "${name}" saved successfully`
    })

  } catch (error: any) {
    console.error('Flow save error:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save flow'
    })
  }
})

/**
 * GET /api/v1/flow-templates/:id/protection
 * Check flow protection status (usage in ActionTemplates)
 */
router.get('/:id/protection', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flow template ID format'
      })
    }

    const flowTemplate = await FlowTemplate.findById(id)
    if (!flowTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Flow template not found'
      })
    }

    const protection = await FlowProtectionService.checkFlowProtection(flowTemplate.flowId)

    res.status(200).json({
      success: true,
      data: protection
    })

  } catch (error) {
    console.error('Error checking flow protection:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check flow protection'
    })
  }
})

/**
 * GET /api/v1/flow-templates/flow/:flowId/usage
 * Check flow usage by flowId
 */
router.get('/flow/:flowId/usage', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params

    const protection = await FlowProtectionService.checkFlowProtection(flowId)

    res.status(200).json({
      success: true,
      data: protection
    })

  } catch (error) {
    console.error('Error checking flow usage:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check flow usage'
    })
  }
})

/**
 * POST /api/v1/flow-templates/organize
 * Organize all flows в правилните директории базирано на validation status
 */
router.post('/organize', async (req: Request, res: Response) => {
  try {
    const result = await FlowDirectoryManager.organizeAllFlows()

    res.status(200).json({
      success: true,
      data: result,
      message: `Processed ${result.processed} flows, moved ${result.moved}`
    })

  } catch (error) {
    console.error('Error organizing flows:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to organize flows'
    })
  }
})

/**
 * GET /api/v1/flow-templates/directory-stats
 * Get statistics за файлове по директории
 */
router.get('/directory-stats', async (req: Request, res: Response) => {
  try {
    const stats = await FlowDirectoryManager.getDirectoryStats()

    res.status(200).json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error getting directory stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get directory stats'
    })
  }
})

/**
 * GET /api/v1/flow-templates/:flowId/usage-count
 * Get count of ActionTemplates using a specific flow
 */
router.get('/:flowId/usage-count', async (req: Request, res: Response) => {
  try {
    const { flowId } = req.params
    
    if (!flowId) {
      return res.status(400).json({
        success: false,
        error: 'Flow ID is required'
      })
    }

    // Import ActionTemplate here to avoid circular dependency
    const { ActionTemplate } = await import('../models/ActionTemplate')

    // Count ActionTemplates using this flowId
    const count = await ActionTemplate.countDocuments({
      usedFlowIds: flowId,
      isActive: true
    })

    res.status(200).json({
      success: true,
      data: { count, flowId }
    })

  } catch (error: any) {
    console.error('Error counting flow usage:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to count flow usage',
      details: error.message
    })
  }
})

/**
 * PUT /api/v1/flow-templates/:id/validation-status
 * Update validation status for a flow template
 */
router.put('/:id/validation-status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { validationStatus, validationSummary } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flow template ID format'
      })
    }

    // Validate validationStatus
    const validStatuses = ['draft', 'invalid', 'validated', 'ready']
    if (!validStatuses.includes(validationStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid validation status. Must be one of: ' + validStatuses.join(', ')
      })
    }

    // Find and update template
    const template = await FlowTemplate.findByIdAndUpdate(
      id,
      {
        validationStatus,
        ...(validationSummary && { validationSummary }),
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Flow template not found'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        id: template._id,
        validationStatus: template.validationStatus,
        validationSummary: template.validationSummary,
        updatedAt: template.updatedAt
      }
    })

  } catch (error: any) {
    console.error('❌ Error updating validation status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update validation status',
      details: error.message
    })
  }
})

/**
 * POST /api/v1/flow-templates/:id/duplicate
 * Duplicate an existing flow template with a new name
 */
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { newName } = req.body

    // Validate input
    if (!newName || typeof newName !== 'string' || newName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'newName is required and must be a non-empty string'
      })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flow template ID format'
      })
    }

    // Find original template
    const originalTemplate = await FlowTemplate.findById(id)
    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Flow template not found'
      })
    }

    // Check if name already exists
    const existingTemplate = await FlowTemplate.findOne({ name: newName.trim() })
    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        error: 'Поток с това име вече съществува'
      })
    }

    // Generate new flowId
    const newFlowIdObj = new mongoose.Types.ObjectId()
    const newFlowId = `flow_${newFlowIdObj.toString()}`
    const newVersion = '1.0.0'
    const newJsonFileName = `${newFlowId}_v${newVersion.replace(/\./g, '_')}.json`

    // Create new DB record (full copy except name, flowId, version, jsonFileName)
    const duplicatedTemplate = new FlowTemplate({
      flowId: newFlowId,
      version: newVersion,
      name: newName.trim(),
      description: originalTemplate.description,
      jsonFileName: newJsonFileName,
      filePath: originalTemplate.filePath,
      isDraft: originalTemplate.isDraft,
      validationStatus: originalTemplate.validationStatus,
      validationSummary: originalTemplate.validationSummary,
      isMonitoringFlow: originalTemplate.isMonitoringFlow,
      isActive: originalTemplate.isActive,
      createdBy: originalTemplate.createdBy
    })

    // Generate versionId before saving
    duplicatedTemplate.generateVersionId()

    // Save to DB
    const savedTemplate = await duplicatedTemplate.save()

    // Clone JSON file
    try {
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')

      // Read original JSON file
      const originalFilePath = `${process.cwd()}/../${originalTemplate.filePath}${originalTemplate.jsonFileName}`
      const originalFileContent = await fs.readFile(originalFilePath, 'utf-8')
      const originalFlowData = JSON.parse(originalFileContent)

      // Modify JSON content with new data
      const newFlowData = {
        ...originalFlowData,
        id: newFlowId,
        meta: {
          ...originalFlowData.meta,
          name: newName.trim()
        }
      }

      // Write new JSON file
      const newFilePath = `${process.cwd()}/../${duplicatedTemplate.filePath}${duplicatedTemplate.jsonFileName}`
      const dirPath = path.dirname(newFilePath)
      await fs.mkdir(dirPath, { recursive: true })
      await fs.writeFile(newFilePath, JSON.stringify(newFlowData, null, 2), 'utf-8')

      console.log(`✅ JSON file duplicated successfully: ${duplicatedTemplate.jsonFileName}`)
    } catch (fileError) {
      console.error('❌ Error duplicating JSON file:', fileError)
      // Delete DB record if file duplication fails
      await FlowTemplate.findByIdAndDelete(savedTemplate._id)
      return res.status(500).json({
        success: false,
        error: 'Failed to duplicate JSON file',
        details: fileError instanceof Error ? fileError.message : 'Unknown error'
      })
    }

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: `Потокът "${newName}" е дублиран успешно`
    })

  } catch (error: any) {
    console.error('Error duplicating flow template:', error)

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to duplicate flow template',
      details: error.message
    })
  }
})

export default router