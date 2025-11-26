import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { NotificationMessage, INotificationMessage } from '../models/NotificationMessage'
import { NotificationProvider, INotificationProvider } from '../models/NotificationProvider'
import { ErrorNotificationSettings, IErrorNotificationSettings } from '../models/ErrorNotificationSettings'
import { LifecycleNotificationSettings, ILifecycleNotificationSettings, LIFECYCLE_EVENT_TYPES } from '../models/LifecycleNotificationSettings'
import { MonitoringTag } from '../models/MonitoringTag'
import { notificationService } from '../services/NotificationService'

const router = Router()

// ===============================
// NOTIFICATION MESSAGES ROUTES
// ===============================

// GET /api/v1/notifications/messages - Get all notification messages
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const { active, type } = req.query
    
    const filter: any = {}
    if (active !== undefined) {
      filter.isActive = active === 'true'
    }
    if (type !== undefined) {
      filter.type = type
    }

    const messages = await NotificationMessage.find(filter).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length
    })
  } catch (error: any) {
    console.error('Error fetching notification messages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification messages',
      details: error.message
    })
  }
})

// GET /api/v1/notifications/messages/:id - Get single notification message
router.get('/messages/:id', async (req: Request, res: Response) => {
  try {
    const message = await NotificationMessage.findById(req.params.id)

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Notification message not found'
      })
    }

    res.status(200).json({
      success: true,
      data: message
    })
  } catch (error: any) {
    console.error('Error fetching notification message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification message',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/messages - Create new notification message
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const { name, description, schedule, tags, deliveryMethods } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message name is required'
      })
    }

    if (!schedule || !schedule.type) {
      return res.status(400).json({
        success: false,
        error: 'Schedule configuration is required'
      })
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one monitoring tag is required'
      })
    }

    if (!deliveryMethods || !Array.isArray(deliveryMethods) || deliveryMethods.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one delivery method is required'
      })
    }

    // Validate that all tags exist
    const existingTags = await MonitoringTag.find({ 
      name: { $in: tags },
      isActive: true 
    })
    
    if (existingTags.length !== tags.length) {
      const foundTagNames = existingTags.map(tag => tag.name)
      const missingTags = tags.filter(tag => !foundTagNames.includes(tag))
      return res.status(400).json({
        success: false,
        error: `Invalid or inactive monitoring tags: ${missingTags.join(', ')}`
      })
    }

    // Validate schedule configuration
    if (schedule.type === 'interval') {
      if (!schedule.interval || schedule.interval < 1 || schedule.interval > 1440) {
        return res.status(400).json({
          success: false,
          error: 'Interval must be between 1 and 1440 minutes'
        })
      }
    }

    if (schedule.type === 'fixed_time') {
      if (!schedule.time || !schedule.days || !Array.isArray(schedule.days) || schedule.days.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Fixed time schedule requires time and days'
        })
      }
    }

    const messageData: any = {
      name: name.trim(),
      description: description?.trim() || '',
      type: 'periodic',
      schedule,
      tags,
      deliveryMethods,
      isActive: true
    }

    const message = new NotificationMessage(messageData)
    const savedMessage = await message.save()

    res.status(201).json({
      success: true,
      data: savedMessage,
      message: 'Notification message created successfully'
    })
  } catch (error: any) {
    console.error('Error creating notification message:', error)
    
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
      error: 'Failed to create notification message',
      details: error.message
    })
  }
})

// PUT /api/v1/notifications/messages/:id - Update notification message
router.put('/messages/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, schedule, tags, deliveryMethods, isActive } = req.body

    const updateData: Partial<INotificationMessage> = {}
    
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Message name cannot be empty'
        })
      }
      updateData.name = name.trim()
    }
    
    if (description !== undefined) updateData.description = description.trim()
    if (schedule !== undefined) updateData.schedule = schedule
    if (tags !== undefined) updateData.tags = tags
    if (deliveryMethods !== undefined) updateData.deliveryMethods = deliveryMethods
    if (isActive !== undefined) updateData.isActive = isActive

    const message = await NotificationMessage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Notification message not found'
      })
    }

    res.status(200).json({
      success: true,
      data: message,
      message: 'Notification message updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating notification message:', error)
    
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
      error: 'Failed to update notification message',
      details: error.message
    })
  }
})

// DELETE /api/v1/notifications/messages/:id - Delete notification message
router.delete('/messages/:id', async (req: Request, res: Response) => {
  try {
    const message = await NotificationMessage.findById(req.params.id)

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Notification message not found'
      })
    }

    await NotificationMessage.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Notification message deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting notification message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification message',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/messages/:id/activate - Activate notification message
router.post('/messages/:id/activate', async (req: Request, res: Response) => {
  try {
    const message = await NotificationMessage.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    )

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Notification message not found'
      })
    }

    res.status(200).json({
      success: true,
      data: message,
      message: 'Notification message activated successfully'
    })
  } catch (error: any) {
    console.error('Error activating notification message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to activate notification message',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/messages/:id/deactivate - Deactivate notification message
router.post('/messages/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const message = await NotificationMessage.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Notification message not found'
      })
    }

    res.status(200).json({
      success: true,
      data: message,
      message: 'Notification message deactivated successfully'
    })
  } catch (error: any) {
    console.error('Error deactivating notification message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate notification message',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/messages/:id/trigger - Send notification message immediately
router.post('/messages/:id/trigger', async (req: Request, res: Response) => {
  try {
    const message = await NotificationMessage.findById(req.params.id)

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Notification message not found'
      })
    }

    if (message.type !== 'periodic') {
      return res.status(400).json({
        success: false,
        error: 'Only periodic messages can be triggered'
      })
    }

    const results = await notificationService.sendPeriodicNotification(req.params.id)

    res.status(200).json({
      success: true,
      data: {
        messageId: req.params.id,
        messageName: message.name,
        deliveryResults: results
      },
      message: 'Notification message sent successfully'
    })
  } catch (error: any) {
    console.error('Error triggering notification message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to trigger notification message',
      details: error.message
    })
  }
})

// ===============================
// NOTIFICATION PROVIDERS ROUTES
// ===============================

// GET /api/v1/notifications/providers - Get all notification providers
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const { active, type } = req.query
    
    const filter: any = {}
    if (active !== undefined) {
      filter.isActive = active === 'true'
    }
    if (type !== undefined) {
      filter.type = type
    }

    const providers = await NotificationProvider.find(filter).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: providers,
      count: providers.length
    })
  } catch (error: any) {
    console.error('Error fetching notification providers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification providers',
      details: error.message
    })
  }
})

// GET /api/v1/notifications/providers/:id - Get single notification provider
router.get('/providers/:id', async (req: Request, res: Response) => {
  try {
    const provider = await NotificationProvider.findById(req.params.id)

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Notification provider not found'
      })
    }

    res.status(200).json({
      success: true,
      data: provider
    })
  } catch (error: any) {
    console.error('Error fetching notification provider:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification provider',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/providers - Create new notification provider
router.post('/providers', async (req: Request, res: Response) => {
  try {
    const { type, name, config } = req.body

    if (!type || !['email', 'telegram', 'viber'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Valid provider type is required (email, telegram, viber)'
      })
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Provider name is required'
      })
    }

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Provider configuration is required'
      })
    }

    const providerData: any = {
      type,
      name: name.trim(),
      config,
      isActive: true
    }

    const provider = new NotificationProvider(providerData)
    const savedProvider = await provider.save()

    res.status(201).json({
      success: true,
      data: savedProvider,
      message: 'Notification provider created successfully'
    })
  } catch (error: any) {
    console.error('Error creating notification provider:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Provider with this type and name already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create notification provider',
      details: error.message
    })
  }
})

// PUT /api/v1/notifications/providers/:id - Update notification provider
router.put('/providers/:id', async (req: Request, res: Response) => {
  try {
    const { name, config, isActive } = req.body

    const updateData: Partial<INotificationProvider> = {}
    
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Provider name cannot be empty'
        })
      }
      updateData.name = name.trim()
    }
    
    if (config !== undefined) updateData.config = config
    if (isActive !== undefined) updateData.isActive = isActive

    const provider = await NotificationProvider.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Notification provider not found'
      })
    }

    res.status(200).json({
      success: true,
      data: provider,
      message: 'Notification provider updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating notification provider:', error)
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Provider with this type and name already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update notification provider',
      details: error.message
    })
  }
})

// DELETE /api/v1/notifications/providers/:id - Delete notification provider
router.delete('/providers/:id', async (req: Request, res: Response) => {
  try {
    const provider = await NotificationProvider.findById(req.params.id)

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Notification provider not found'
      })
    }

    await NotificationProvider.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Notification provider deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting notification provider:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification provider',
      details: error.message
    })
  }
})

// ===============================
// ERROR NOTIFICATION SETTINGS ROUTES
// ===============================

// GET /api/v1/notifications/errors-settings - Get error notification settings
router.get('/errors-settings', async (req: Request, res: Response) => {
  try {
    const settings = await (ErrorNotificationSettings as any).getSettings()

    const transformedData = {
      _id: settings._id,
      globalEnabled: settings.globalSettings.enabled,
      globalDeliveryMethods: settings.globalSettings.deliveryMethods,
      rateLimitMinutes: settings.globalSettings.rateLimitMinutes,
      blockSettings: Object.fromEntries(settings.blockSpecificSettings),
      blockTypeSettings: Object.fromEntries(settings.blockTypeSettings),
      updatedAt: settings.updatedAt
    }

    res.status(200).json({
      success: true,
      data: transformedData
    })
  } catch (error: any) {
    console.error('Error fetching error notification settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error notification settings',
      details: error.message
    })
  }
})

// PUT /api/v1/notifications/errors-settings - Update error notification settings
router.put('/errors-settings', async (req: Request, res: Response) => {
  try {
    const { globalEnabled, globalDeliveryMethods, rateLimitMinutes, blockSettings, blockTypeSettings } = req.body

    const settings = await (ErrorNotificationSettings as any).getSettings()
    
    // Update global settings with flat structure from frontend
    if (globalEnabled !== undefined) {
      settings.globalSettings.enabled = globalEnabled
    }
    
    if (globalDeliveryMethods !== undefined) {
      settings.globalSettings.deliveryMethods = globalDeliveryMethods
    }
    
    if (rateLimitMinutes !== undefined) {
      settings.globalSettings.rateLimitMinutes = rateLimitMinutes
    }
    
    if (blockSettings !== undefined) {
      settings.blockSpecificSettings = new Map(Object.entries(blockSettings))
    }
    
    if (blockTypeSettings !== undefined) {
      settings.blockTypeSettings = new Map(Object.entries(blockTypeSettings))
    }

    const updatedSettings = await settings.save()

    const transformedData = {
      _id: updatedSettings._id,
      globalEnabled: updatedSettings.globalSettings.enabled,
      globalDeliveryMethods: updatedSettings.globalSettings.deliveryMethods,
      rateLimitMinutes: updatedSettings.globalSettings.rateLimitMinutes,
      blockSettings: Object.fromEntries(updatedSettings.blockSpecificSettings),
      blockTypeSettings: Object.fromEntries(updatedSettings.blockTypeSettings),
      updatedAt: updatedSettings.updatedAt
    }

    res.status(200).json({
      success: true,
      data: transformedData,
      message: 'Error notification settings updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating error notification settings:', error)
    
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
      error: 'Failed to update error notification settings',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/errors-settings/blocks/:blockId - Set block-specific error settings
router.post('/errors-settings/blocks/:blockId', async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params
    const { enabled, customMessage, deliveryMethods, rateLimitMinutes } = req.body

    const settings = await (ErrorNotificationSettings as any).getSettings()
    
    const blockSettings = {
      enabled: enabled !== false,
      customMessage: customMessage || undefined,
      deliveryMethods: deliveryMethods || undefined,
      rateLimitMinutes: rateLimitMinutes || undefined
    }

    settings.blockSpecificSettings.set(blockId, blockSettings)
    settings.markModified('blockSpecificSettings')
    
    const updatedSettings = await settings.save()

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: `Block-specific error settings updated for ${blockId}`
    })
  } catch (error: any) {
    console.error('Error updating block-specific error settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update block-specific error settings',
      details: error.message
    })
  }
})

// DELETE /api/v1/notifications/errors-settings/blocks/:blockId - Remove block-specific error settings
router.delete('/errors-settings/blocks/:blockId', async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params

    const settings = await (ErrorNotificationSettings as any).getSettings()
    
    settings.blockSpecificSettings.delete(blockId)
    settings.markModified('blockSpecificSettings')
    
    const updatedSettings = await settings.save()

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: `Block-specific error settings removed for ${blockId}`
    })
  } catch (error: any) {
    console.error('Error removing block-specific error settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove block-specific error settings',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/providers/:id/test - Test notification provider
router.post('/providers/:id/test', async (req: Request, res: Response) => {
  try {
    const provider = await NotificationProvider.findById(req.params.id)

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Notification provider not found'
      })
    }

    let testResult = false

    if (provider.type === 'email') {
      testResult = await notificationService.testEmailProvider(req.params.id)
    } else {
      return res.status(400).json({
        success: false,
        error: `Testing not implemented for provider type: ${provider.type}`
      })
    }

    res.status(200).json({
      success: true,
      data: {
        providerId: req.params.id,
        providerType: provider.type,
        testResult,
        message: testResult ? 'Test email sent successfully' : 'Test failed'
      }
    })
  } catch (error: any) {
    console.error('Error testing notification provider:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to test notification provider',
      details: error.message
    })
  }
})

// GET /api/v1/notifications/errors-settings/block-types - Get available block types
router.get('/errors-settings/block-types', async (req: Request, res: Response) => {
  try {
    // Return static block types from the flow editor system
    const blockTypes = [
      { type: 'sensor', name: 'СЕНЗОР', category: 'core' },
      { type: 'actuator', name: 'АКТУАТОР', category: 'core' },
      { type: 'loop', name: 'ЦИКЪЛ', category: 'core' },
      { type: 'if', name: 'УСЛОВИЕ', category: 'core' },
      { type: 'delay', name: 'ИЗЧАКВАНЕ', category: 'core' },
      { type: 'goto', name: 'ОТИДИ НА', category: 'core' },
      { type: 'merge', name: 'ОБЕДИНЯВАНЕ', category: 'core' },
      { type: 'start', name: 'НАЧАЛО', category: 'system' },
      { type: 'end', name: 'КРАЙ', category: 'system' },
      { type: 'errorHandler', name: 'ОБРАБОТКА НА ГРЕШКИ', category: 'support' },
      { type: 'setGlobalVar', name: 'ГЛОБАЛНА ПРОМЕНЛИВА', category: 'support' },
      { type: 'setVarData', name: 'ДАННИ В ПРОМЕНЛИВА', category: 'support' },
      { type: 'setVarName', name: 'ИМЕ НА ПРОМЕНЛИВА', category: 'support' },
      { type: 'container', name: 'КОНТЕЙНЕР', category: 'container' }
    ]

    res.status(200).json({
      success: true,
      data: blockTypes,
      count: blockTypes.length
    })
  } catch (error: any) {
    console.error('Error fetching block types:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch block types',
      details: error.message
    })
  }
})

// ===============================
// BLOCK TYPE SETTINGS ROUTES
// ===============================

// POST /api/v1/notifications/errors-settings/block-types/:blockType - Set block type error settings
router.post('/errors-settings/block-types/:blockType', async (req: Request, res: Response) => {
  try {
    const { blockType } = req.params
    const { enabled, messageTemplate, deliveryMethods, rateLimitMinutes } = req.body

    const settings = await (ErrorNotificationSettings as any).getSettings()
    
    const blockTypeSettings = {
      enabled: enabled !== false,
      messageTemplate: messageTemplate || 'Flow execution error in block {{blockType}}: {{errorMessage}}',
      deliveryMethods: deliveryMethods || undefined,
      rateLimitMinutes: rateLimitMinutes || undefined
    }

    settings.blockTypeSettings.set(blockType, blockTypeSettings)
    settings.markModified('blockTypeSettings')
    
    const updatedSettings = await settings.save()

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: `Block type error settings updated for ${blockType}`
    })
  } catch (error: any) {
    console.error('Error updating block type error settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update block type error settings',
      details: error.message
    })
  }
})

// DELETE /api/v1/notifications/errors-settings/block-types/:blockType - Remove block type error settings
router.delete('/errors-settings/block-types/:blockType', async (req: Request, res: Response) => {
  try {
    const { blockType } = req.params

    const settings = await (ErrorNotificationSettings as any).getSettings()
    
    settings.blockTypeSettings.delete(blockType)
    settings.markModified('blockTypeSettings')
    
    const updatedSettings = await settings.save()

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: `Block type error settings removed for ${blockType}`
    })
  } catch (error: any) {
    console.error('Error removing block type error settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove block type error settings',
      details: error.message
    })
  }
})

// ===============================
// NOTIFICATION SCHEDULER ROUTES
// ===============================

// GET /api/v1/notifications/scheduler/status - Get scheduler status
router.get('/scheduler/status', async (req: Request, res: Response) => {
  try {
    const { notificationSchedulerService } = await import('../services/NotificationSchedulerService')
    
    const status = await notificationSchedulerService.getStatus()

    res.status(200).json({
      success: true,
      data: status
    })
  } catch (error: any) {
    console.error('Error getting scheduler status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/scheduler/reload - Reload scheduler
router.post('/scheduler/reload', async (req: Request, res: Response) => {
  try {
    const { notificationSchedulerService } = await import('../services/NotificationSchedulerService')
    
    await notificationSchedulerService.stop()
    await notificationSchedulerService.start()

    res.status(200).json({
      success: true,
      message: 'Notification scheduler reloaded successfully'
    })
  } catch (error: any) {
    console.error('Error reloading scheduler:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reload scheduler',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/scheduler/trigger/:messageId - Trigger scheduled message
router.post('/scheduler/trigger/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params
    
    // This is the same as direct trigger, but through scheduler context
    const message = await NotificationMessage.findById(messageId)

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Notification message not found'
      })
    }

    const results = await notificationService.sendPeriodicNotification(messageId)

    res.status(200).json({
      success: true,
      data: {
        messageId,
        messageName: message.name,
        deliveryResults: results
      },
      message: 'Scheduled notification triggered successfully'
    })
  } catch (error: any) {
    console.error('Error triggering scheduled notification:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scheduled notification',
      details: error.message
    })
  }
})

// ===============================
// LIFECYCLE NOTIFICATIONS ROUTES
// ===============================

// GET /api/v1/notifications/lifecycle-settings - Get lifecycle notification settings
router.get('/lifecycle-settings', async (req: Request, res: Response) => {
  try {
    const settings = await notificationService.getLifecycleSettings()

    res.status(200).json({
      success: true,
      data: settings
    })
  } catch (error: any) {
    console.error('Error fetching lifecycle settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lifecycle settings',
      details: error.message
    })
  }
})

// PUT /api/v1/notifications/lifecycle-settings - Update lifecycle notification settings
router.put('/lifecycle-settings', async (req: Request, res: Response) => {
  try {
    const updates = req.body

    const updatedSettings = await notificationService.updateLifecycleSettings(updates)

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Lifecycle notification settings updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating lifecycle settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update lifecycle settings',
      details: error.message
    })
  }
})

// GET /api/v1/notifications/lifecycle-settings/event-types - Get available event types
router.get('/lifecycle-settings/event-types', async (req: Request, res: Response) => {
  try {
    const eventTypes = Object.entries(LIFECYCLE_EVENT_TYPES).map(([key, value]) => ({
      key,
      value,
      displayName: key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }))

    res.status(200).json({
      success: true,
      data: eventTypes,
      count: eventTypes.length
    })
  } catch (error: any) {
    console.error('Error fetching lifecycle event types:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lifecycle event types',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/lifecycle-settings/events/:eventType - Update specific event settings
router.post('/lifecycle-settings/events/:eventType', async (req: Request, res: Response) => {
  try {
    const { eventType } = req.params
    const { enabled, messageTemplate, deliveryMethods, rateLimitMinutes, includeCycleDetails, includeDeviceInfo } = req.body

    // Validate event type
    if (!Object.values(LIFECYCLE_EVENT_TYPES).includes(eventType as any)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type'
      })
    }

    const settings = await LifecycleNotificationSettings.getSettings()
    
    const eventSetting = {
      enabled: enabled !== false,
      messageTemplate: messageTemplate || settings.eventSettings.get(eventType)?.messageTemplate || 'Default template',
      deliveryMethods: deliveryMethods || undefined,
      rateLimitMinutes: rateLimitMinutes || undefined,
      includeCycleDetails: includeCycleDetails !== false,
      includeDeviceInfo: includeDeviceInfo !== false
    }

    settings.eventSettings.set(eventType, eventSetting)
    settings.markModified('eventSettings')
    
    const updatedSettings = await settings.save()

    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: `Lifecycle event settings updated for ${eventType}`
    })
  } catch (error: any) {
    console.error('Error updating lifecycle event settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update lifecycle event settings',
      details: error.message
    })
  }
})

// POST /api/v1/notifications/lifecycle/test/:eventType - Test lifecycle notification
router.post('/lifecycle/test/:eventType', async (req: Request, res: Response) => {
  try {
    const { eventType } = req.params
    const context = req.body

    // Validate event type
    if (!Object.values(LIFECYCLE_EVENT_TYPES).includes(eventType as any)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type'
      })
    }

    // Send test lifecycle notification
    const results = await notificationService.sendLifecycleNotification(
      eventType as any,
      {
        ...context,
        programName: context.programName || 'Test програма',
        cycleId: context.cycleId || 'test_cycle',
        controllerName: context.controllerName || 'Test контролер',
        deviceName: context.deviceName || 'Test устройство'
      }
    )

    res.status(200).json({
      success: true,
      data: {
        eventType,
        deliveryResults: results
      },
      message: 'Test lifecycle notification sent successfully'
    })
  } catch (error: any) {
    console.error('Error sending test lifecycle notification:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send test lifecycle notification',
      details: error.message
    })
  }
})

export default router