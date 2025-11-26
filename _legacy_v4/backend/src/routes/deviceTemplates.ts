import express from 'express'
import { DeviceTemplate, IDeviceTemplate } from '../models/DeviceTemplate'

const router = express.Router()

/**
 * GET /api/v1/device-templates
 * Get all device templates
 */
router.get('/', async (req, res) => {
  try {
    const { active } = req.query
    
    // Build filter
    const filter: any = {}
    if (active !== undefined) {
      filter.isActive = active === 'true'
    }
    
    const templates = await DeviceTemplate.find(filter)
      .sort({ displayName: 1 })
      .exec()
    
    res.json({
      success: true,
      data: templates,
      count: templates.length
    })
  } catch (error) {
    console.error('[DeviceTemplates] Error fetching templates:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching device templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/v1/device-templates/:id
 * Get single device template by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const template = await DeviceTemplate.findById(req.params.id).exec()
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Device template not found'
      })
    }
    
    res.json({
      success: true,
      data: template
    })
  } catch (error) {
    console.error('[DeviceTemplates] Error fetching template:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching device template',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/v1/device-templates/type/:type
 * Get device template by type
 */
router.get('/type/:type', async (req, res) => {
  try {
    const template = await DeviceTemplate.findOne({ 
      type: req.params.type,
      isActive: true 
    }).exec()
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Device template type '${req.params.type}' not found`
      })
    }
    
    res.json({
      success: true,
      data: template
    })
  } catch (error) {
    console.error('[DeviceTemplates] Error fetching template by type:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching device template',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/v1/device-templates
 * Create new device template
 */
router.post('/', async (req, res) => {
  try {
    const templateData = req.body
    
    // Check if type already exists
    const existingTemplate = await DeviceTemplate.findOne({ type: templateData.type }).exec()
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: `Device template with type '${templateData.type}' already exists`
      })
    }
    
    const template = new DeviceTemplate(templateData)
    const savedTemplate = await template.save()
    
    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: 'Device template created successfully'
    })
  } catch (error) {
    console.error('[DeviceTemplates] Error creating template:', error)
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating device template',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * PUT /api/v1/device-templates/:id
 * Update device template
 */
router.put('/:id', async (req, res) => {
  try {
    const template = await DeviceTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    ).exec()
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Device template not found'
      })
    }
    
    res.json({
      success: true,
      data: template,
      message: 'Device template updated successfully'
    })
  } catch (error) {
    console.error('[DeviceTemplates] Error updating template:', error)
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating device template',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * DELETE /api/v1/device-templates/:id
 * Delete device template (soft delete - set isActive to false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const template = await DeviceTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).exec()
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Device template not found'
      })
    }
    
    res.json({
      success: true,
      data: template,
      message: 'Device template deactivated successfully'
    })
  } catch (error) {
    console.error('[DeviceTemplates] Error deleting template:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting device template',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/v1/device-templates/:id/activate
 * Activate device template
 */
router.post('/:id/activate', async (req, res) => {
  try {
    const template = await DeviceTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).exec()
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Device template not found'
      })
    }
    
    res.json({
      success: true,
      data: template,
      message: 'Device template activated successfully'
    })
  } catch (error) {
    console.error('[DeviceTemplates] Error activating template:', error)
    res.status(500).json({
      success: false,
      message: 'Error activating device template',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router