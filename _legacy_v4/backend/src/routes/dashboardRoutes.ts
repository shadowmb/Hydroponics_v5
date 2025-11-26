import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { DashboardSection, IDashboardSection, IDashboardModule } from '../models/DashboardSection'
import { DashboardSettings, IDashboardSettings } from '../models/DashboardSettings'
import { MonitoringTag } from '../models/MonitoringTag'
import { ActiveProgram } from '../models/ActiveProgram'
import { ExecutionSession } from '../models/ExecutionSession'

const router = Router()

// ===============================
// DASHBOARD SECTIONS ROUTES
// ===============================

// GET /api/v1/dashboard/sections - Get all dashboard sections
router.get('/sections', async (req: Request, res: Response) => {
  try {
    const sections = await DashboardSection.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: sections,
      count: sections.length
    })
  } catch (error: any) {
    console.error('Error fetching dashboard sections:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard sections'
    })
  }
})

// GET /api/v1/dashboard/sections/:sectionId - Get specific section
router.get('/sections/:sectionId', async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params
    const section = await DashboardSection.findOne({ sectionId })

    if (!section) {
      return res.status(404).json({
        success: false,
        error: `Dashboard section '${sectionId}' not found`
      })
    }

    res.status(200).json({
      success: true,
      data: section
    })
  } catch (error: any) {
    console.error(`Error fetching dashboard section ${req.params.sectionId}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard section'
    })
  }
})

// POST /api/v1/dashboard/sections/:sectionId/modules - Add module to section
router.post('/sections/:sectionId/modules', async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params
    const moduleData = req.body as IDashboardModule

    console.log('🔍 [DEBUG] Dashboard POST request:', {
      sectionId,
      body: req.body,
      headers: req.headers['content-type']
    })

    // Validate required fields
    if (!moduleData.name || !moduleData.visualizationType) {
      console.error('❌ [Dashboard] Validation failed:', { name: moduleData.name, visualizationType: moduleData.visualizationType })
      return res.status(400).json({
        success: false,
        error: 'Module name and visualizationType are required'
      })
    }

    // Validate sectionId
    if (!['sensors', 'system', 'program', 'alerts'].includes(sectionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid section ID. Must be: sensors, system, program, or alerts'
      })
    }

    // For sensor modules, validate monitoring tag exists
    if (sectionId === 'sensors' && moduleData.monitoringTagId) {
      const tagExists = await MonitoringTag.findById(moduleData.monitoringTagId)
      if (!tagExists) {
        return res.status(400).json({
          success: false,
          error: 'Monitoring tag not found'
        })
      }
    }

    // Find or create section
    let section = await DashboardSection.findOne({ sectionId })
    if (!section) {
      section = new DashboardSection({
        sectionId,
        sectionSettings: {},
        modules: []
      })
    }

    // Set display order if not provided
    if (!moduleData.displayOrder) {
      const maxOrder = section.modules.length > 0 
        ? Math.max(...section.modules.map(m => m.displayOrder))
        : 0
      moduleData.displayOrder = maxOrder + 1
    }

    // Set default visibility
    if (moduleData.isVisible === undefined) {
      moduleData.isVisible = true
    }

    // Add module to section
    section.modules.push(moduleData)
    await section.save()

    const newModule = section.modules[section.modules.length - 1]

    res.status(201).json({
      success: true,
      data: newModule,
      message: 'Module added successfully'
    })

  } catch (error: any) {
    console.error(`Error adding module to section ${req.params.sectionId}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to add module'
    })
  }
})

// PUT /api/v1/dashboard/sections/:sectionId/modules/:moduleId - Update module
router.put('/sections/:sectionId/modules/:moduleId', async (req: Request, res: Response) => {
  try {
    const { sectionId, moduleId } = req.params
    const updateData = req.body

    console.log('🔍 [DEBUG Backend] PUT request received:', {
      sectionId,
      moduleId,
      updateData: JSON.stringify(updateData, null, 2)
    })

    const section = await DashboardSection.findOne({ sectionId })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: `Dashboard section '${sectionId}' not found`
      })
    }

    const moduleIndex = section.modules.findIndex((m: any) => m._id?.toString() === moduleId)
    if (moduleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      })
    }

    // Update module
    console.log('🔍 [DEBUG Backend] Module before update:', JSON.stringify(section.modules[moduleIndex], null, 2))
    console.log('🔍 [DEBUG Backend] updateData trendIndicator:', JSON.stringify(updateData.trendIndicator, null, 2))
    Object.assign(section.modules[moduleIndex], updateData)
    console.log('🔍 [DEBUG Backend] Module after update:', JSON.stringify(section.modules[moduleIndex], null, 2))
    await section.save()
    console.log('🔍 [DEBUG Backend] Module saved successfully')

    res.status(200).json({
      success: true,
      data: section.modules[moduleIndex],
      message: 'Module updated successfully'
    })

  } catch (error: any) {
    console.error(`Error updating module ${req.params.moduleId}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to update module'
    })
  }
})

// DELETE /api/v1/dashboard/sections/:sectionId/modules/:moduleId - Remove module
router.delete('/sections/:sectionId/modules/:moduleId', async (req: Request, res: Response) => {
  try {
    const { sectionId, moduleId } = req.params

    const section = await DashboardSection.findOne({ sectionId })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: `Dashboard section '${sectionId}' not found`
      })
    }

    const moduleIndex = section.modules.findIndex((m: any) => m._id?.toString() === moduleId)
    if (moduleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      })
    }

    section.modules.splice(moduleIndex, 1)
    await section.save()

    res.status(200).json({
      success: true,
      message: 'Module removed successfully'
    })

  } catch (error: any) {
    console.error(`Error removing module ${req.params.moduleId}:`, error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove module'
    })
  }
})

// ===============================
// DASHBOARD SETTINGS ROUTES
// ===============================

// GET /api/v1/dashboard/settings - Get dashboard settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    // For now, get the first/only settings document
    let settings = await DashboardSettings.findOne()
    
    if (!settings) {
      // Create default settings if none exist
      settings = new DashboardSettings({
        layout: {
          type: 'compact',
          refreshInterval: 10,
          enableAnimations: true,
          compactMode: false,
          autoRefresh: true,
          layoutSettings: {
            layoutType: 'compact',
            sectionSizing: {
              sensors: { width: 50, height: 300 },
              system: { width: 50, height: 300 },
              program: { width: 50, height: 250 },
              alerts: { width: 50, height: 150 }
            },
            moduleSize: 'medium',
            spacing: 'normal',
            showSectionBorders: true,
            enableLayoutTransitions: true
          }
        },
        units: {
          ec: 'us-cm',
          temperature: 'celsius',
          light: 'lux',
          volume: 'liters'
        }
      })
      await settings.save()
    }

    res.status(200).json({
      success: true,
      data: settings
    })
  } catch (error: any) {
    console.error('Error fetching dashboard settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard settings'
    })
  }
})

// PUT /api/v1/dashboard/settings - Update dashboard settings
router.put('/settings', async (req: Request, res: Response) => {
  try {
    let settings = await DashboardSettings.findOne()
    
    if (!settings) {
      settings = new DashboardSettings(req.body)
    } else {
      Object.assign(settings, req.body)
    }
    
    await settings.save()

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Dashboard settings updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating dashboard settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update dashboard settings'
    })
  }
})

// ===============================
// SYSTEM SECTION PARTIAL UPDATE ROUTES
// ===============================

// PUT /api/v1/dashboard/sections/system/selected-controllers - Update selected controllers
router.put('/sections/system/selected-controllers', async (req: Request, res: Response) => {
  try {
    const { controllers } = req.body

    if (!Array.isArray(controllers)) {
      return res.status(400).json({
        success: false,
        error: 'Controllers must be an array'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'system' })
    if (!section) {
      section = new DashboardSection({
        sectionId: 'system',
        sectionSettings: {
          selectedDevices: { controllers, devices: [] },
          displayLimit: 8
        },
        modules: []
      })
    } else {
      if (!section.sectionSettings.selectedDevices) {
        section.sectionSettings.selectedDevices = { controllers, devices: [] }
      } else {
        section.sectionSettings.selectedDevices.controllers = controllers
      }
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { controllers },
      message: 'Selected controllers updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating selected controllers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update selected controllers'
    })
  }
})

// PUT /api/v1/dashboard/sections/system/selected-devices - Update selected devices
router.put('/sections/system/selected-devices', async (req: Request, res: Response) => {
  try {
    const { devices } = req.body

    if (!Array.isArray(devices)) {
      return res.status(400).json({
        success: false,
        error: 'Devices must be an array'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'system' })
    if (!section) {
      section = new DashboardSection({
        sectionId: 'system',
        sectionSettings: {
          selectedDevices: { controllers: [], devices },
          displayLimit: 8
        },
        modules: []
      })
    } else {
      if (!section.sectionSettings.selectedDevices) {
        section.sectionSettings.selectedDevices = { controllers: [], devices }
      } else {
        section.sectionSettings.selectedDevices.devices = devices
      }
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { devices },
      message: 'Selected devices updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating selected devices:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update selected devices'
    })
  }
})

// PUT /api/v1/dashboard/sections/system/display-limit - Update display limit
router.put('/sections/system/display-limit', async (req: Request, res: Response) => {
  try {
    const { displayLimit } = req.body

    if (typeof displayLimit !== 'number' || displayLimit < 4 || displayLimit > 12) {
      return res.status(400).json({
        success: false,
        error: 'Display limit must be a number between 4 and 12'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'system' })
    if (!section) {
      section = new DashboardSection({
        sectionId: 'system',
        sectionSettings: {
          selectedDevices: { controllers: [], devices: [] },
          displayLimit
        },
        modules: []
      })
    } else {
      if (!section.sectionSettings.displayLimit) {
        section.sectionSettings.displayLimit = displayLimit
      } else {
        section.sectionSettings.displayLimit = displayLimit
      }
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { displayLimit },
      message: 'Display limit updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating display limit:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update display limit'
    })
  }
})

// ===============================
// PROGRAM SECTION TRACKING ROUTES
// ===============================

// PUT /api/v1/dashboard/sections/program/active-program - Track active program
router.put('/sections/program/active-program', async (req: Request, res: Response) => {
  try {
    const activeProgram = await ActiveProgram.findOne()

    if (!activeProgram) {
      return res.status(404).json({
        success: false,
        error: 'No active program found'
      })
    }

    const today = new Date().toISOString().split('T')[0]

    let section = await DashboardSection.findOne({ sectionId: 'program' })
    if (!section) {
      section = new DashboardSection({
        sectionId: 'program',
        sectionSettings: {
          activeProgram: {
            activeProgramId: activeProgram._id,
            programId: activeProgram.programId,
            loadedAt: new Date()
          },
          dailyTracking: {
            date: today,
            completedCycles: []
          }
        },
        modules: []
      })
    } else {
      // Check if program changed or new day
      const currentActiveProgramId = section.sectionSettings.activeProgram?.activeProgramId
      const currentDate = section.sectionSettings.dailyTracking?.date

      const programChanged = !currentActiveProgramId || currentActiveProgramId.toString() !== activeProgram._id.toString()
      const newDay = currentDate !== today

      if (programChanged || newDay) {
        section.sectionSettings.activeProgram = {
          activeProgramId: activeProgram._id,
          programId: activeProgram.programId,
          loadedAt: new Date()
        }
        section.sectionSettings.dailyTracking = {
          date: today,
          completedCycles: [],
          cycleExecutions: [],
          actionTemplateExecutions: []
        }
      }
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: {
        activeProgramId: activeProgram._id,
        programId: activeProgram.programId,
        isNewSession: true
      },
      message: 'Active program tracked successfully'
    })
  } catch (error: any) {
    console.error('Error tracking active program:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to track active program'
    })
  }
})

// PUT /api/v1/dashboard/sections/program/cycle-completed - Mark cycle as completed
router.put('/sections/program/cycle-completed', async (req: Request, res: Response) => {
  try {
    const { cycleId, status, duration, executionSessionId } = req.body

    if (!cycleId || !status) {
      return res.status(400).json({
        success: false,
        error: 'cycleId and status are required'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'program' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Program section not found'
      })
    }

    const today = new Date().toISOString().split('T')[0]

    // Ensure daily tracking exists and is for today
    if (!section.sectionSettings.dailyTracking || section.sectionSettings.dailyTracking.date !== today) {
      section.sectionSettings.dailyTracking = {
        date: today,
        completedCycles: [],
        cycleExecutions: [],
        actionTemplateExecutions: []
      }
    }

    // Update or add cycle completion
    const existingCycleIndex = section.sectionSettings.dailyTracking.completedCycles.findIndex(
      (cycle: any) => cycle.cycleId === cycleId
    )

    const cycleData = {
      cycleId,
      executedAt: new Date(),
      status,
      duration: duration || 0,
      executionSessionId: executionSessionId || null
    }

    if (existingCycleIndex >= 0) {
      section.sectionSettings.dailyTracking.completedCycles[existingCycleIndex] = cycleData
    } else {
      section.sectionSettings.dailyTracking.completedCycles.push(cycleData)
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: cycleData,
      message: 'Cycle completion tracked successfully'
    })
  } catch (error: any) {
    console.error('Error tracking cycle completion:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to track cycle completion'
    })
  }
})

// PUT /api/v1/dashboard/sections/program/cycle-execution-status - Update cycle execution status
router.put('/sections/program/cycle-execution-status', async (req: Request, res: Response) => {
  try {
    const { cycleId, status, startTime, endTime, duration, executionSessionId } = req.body

    // Validate required fields
    if (!cycleId || !status) {
      return res.status(400).json({
        success: false,
        error: 'cycleId and status are required'
      })
    }

    // Validate status enum
    if (!['pending', 'running', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be one of: pending, running, completed, failed'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'program' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Program section not found'
      })
    }

    const today = new Date().toISOString().split('T')[0]

    // Ensure daily tracking exists and is for today
    if (!section.sectionSettings.dailyTracking || section.sectionSettings.dailyTracking.date !== today) {
      section.sectionSettings.dailyTracking = {
        date: today,
        completedCycles: [],
        cycleExecutions: [],
        actionTemplateExecutions: []
      }
    }

    // Ensure cycleExecutions array exists
    if (!section.sectionSettings.dailyTracking.cycleExecutions) {
      section.sectionSettings.dailyTracking.cycleExecutions = []
    }

    // Find existing entry by cycleId
    const existingEntryIndex = section.sectionSettings.dailyTracking.cycleExecutions.findIndex(
      (entry: any) => entry.cycleId === cycleId
    )

    const cycleData = {
      cycleId,
      status,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      duration: duration || undefined,
      executionSessionId: executionSessionId ? new mongoose.Types.ObjectId(executionSessionId) : undefined
    }

    if (existingEntryIndex >= 0) {
      // Update existing entry
      section.sectionSettings.dailyTracking.cycleExecutions[existingEntryIndex] = cycleData
    } else {
      // Create new entry
      section.sectionSettings.dailyTracking.cycleExecutions.push(cycleData)
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: cycleData,
      message: 'Cycle execution status updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating cycle execution status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update cycle execution status'
    })
  }
})

// PUT /api/v1/dashboard/sections/program/actiontemplate-status - Update ActionTemplate execution status
router.put('/sections/program/actiontemplate-status', async (req: Request, res: Response) => {
  try {
    const { actionTemplateId, actionTemplateName, cycleId, status, startTime, endTime, duration, executionSessionId } = req.body

    // Validate required fields
    if (!actionTemplateId || !actionTemplateName || !cycleId || !status) {
      return res.status(400).json({
        success: false,
        error: 'actionTemplateId, actionTemplateName, cycleId, and status are required'
      })
    }

    // Validate status enum
    if (!['pending', 'running', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be one of: pending, running, completed, failed'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'program' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Program section not found'
      })
    }

    const today = new Date().toISOString().split('T')[0]

    // Ensure daily tracking exists and is for today
    if (!section.sectionSettings.dailyTracking || section.sectionSettings.dailyTracking.date !== today) {
      section.sectionSettings.dailyTracking = {
        date: today,
        completedCycles: [],
        cycleExecutions: [],
        actionTemplateExecutions: []
      }
    }

    // Ensure actionTemplateExecutions array exists
    if (!section.sectionSettings.dailyTracking.actionTemplateExecutions) {
      section.sectionSettings.dailyTracking.actionTemplateExecutions = []
    }

    // Find existing entry by actionTemplateId + cycleId combination
    const existingEntryIndex = section.sectionSettings.dailyTracking.actionTemplateExecutions.findIndex(
      (entry: any) => entry.actionTemplateId.toString() === actionTemplateId && entry.cycleId === cycleId
    )

    const actionTemplateData = {
      actionTemplateId: new mongoose.Types.ObjectId(actionTemplateId),
      actionTemplateName,
      cycleId,
      status,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      duration: duration || undefined,
      executionSessionId: executionSessionId ? new mongoose.Types.ObjectId(executionSessionId) : undefined
    }

    if (existingEntryIndex >= 0) {
      // Update existing entry
      section.sectionSettings.dailyTracking.actionTemplateExecutions[existingEntryIndex] = actionTemplateData
    } else {
      // Create new entry
      section.sectionSettings.dailyTracking.actionTemplateExecutions.push(actionTemplateData)
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: actionTemplateData,
      message: 'ActionTemplate execution status updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating ActionTemplate execution status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update ActionTemplate execution status'
    })
  }
})

// ===============================
// ALERTS SECTION SETTINGS ROUTES
// ===============================

// GET /api/v1/dashboard/sections/alerts/settings - Get alerts settings
router.get('/sections/alerts/settings', async (req: Request, res: Response) => {
  try {
    let section = await DashboardSection.findOne({ sectionId: 'alerts' })

    if (!section) {
      // Return default alerts settings if section doesn't exist yet
      const defaultSettings = {
        showExecutionErrors: true,
        showSensorAlerts: true,
        showHardwareIssues: true,
        showSystemAlerts: true,
        severityFilter: 'all',
        maxDisplayCount: 10,
        timeWindow: '24h'
      }

      return res.status(200).json({
        success: true,
        data: defaultSettings
      })
    }

    const alertSettings = section.sectionSettings.alerts || {
      showExecutionErrors: true,
      showSensorAlerts: true,
      showHardwareIssues: true,
      showSystemAlerts: true,
      severityFilter: 'all',
      maxDisplayCount: 10,
      timeWindow: '24h'
    }

    res.status(200).json({
      success: true,
      data: alertSettings
    })
  } catch (error: any) {
    console.error('Error fetching alerts settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts settings'
    })
  }
})

// PUT /api/v1/dashboard/sections/alerts/settings - Update alerts settings
router.put('/sections/alerts/settings', async (req: Request, res: Response) => {
  try {
    const alertSettings = req.body

    // Validate required fields
    if (typeof alertSettings.showExecutionErrors === 'undefined' ||
        typeof alertSettings.showSensorAlerts === 'undefined' ||
        typeof alertSettings.showHardwareIssues === 'undefined' ||
        typeof alertSettings.showSystemAlerts === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'All alert type settings are required (showExecutionErrors, showSensorAlerts, showHardwareIssues, showSystemAlerts)'
      })
    }

    // Validate severityFilter
    if (alertSettings.severityFilter && !['all', 'critical', 'warning'].includes(alertSettings.severityFilter)) {
      return res.status(400).json({
        success: false,
        error: 'severityFilter must be one of: all, critical, warning'
      })
    }

    // Validate timeWindow
    if (alertSettings.timeWindow && !['1h', '6h', '24h', '7d'].includes(alertSettings.timeWindow)) {
      return res.status(400).json({
        success: false,
        error: 'timeWindow must be one of: 1h, 6h, 24h, 7d'
      })
    }

    // Validate maxDisplayCount
    if (alertSettings.maxDisplayCount && (typeof alertSettings.maxDisplayCount !== 'number' || alertSettings.maxDisplayCount < 5 || alertSettings.maxDisplayCount > 50)) {
      return res.status(400).json({
        success: false,
        error: 'maxDisplayCount must be a number between 5 and 50'
      })
    }

    // Find or create alerts section
    let section = await DashboardSection.findOne({ sectionId: 'alerts' })
    if (!section) {
      section = new DashboardSection({
        sectionId: 'alerts',
        sectionSettings: {
          alerts: alertSettings
        },
        modules: [{
          id: 'alerts-main',
          name: 'AlertContainer',
          isVisible: true,
          displayOrder: 1
        }]
      })
    } else {
      // Update existing alerts settings
      section.sectionSettings.alerts = alertSettings
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: alertSettings,
      message: 'Alerts settings updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating alerts settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update alerts settings'
    })
  }
})

// ===============================
// ALERTS SECTION PARTIAL UPDATE ROUTES
// ===============================

// PUT /api/v1/dashboard/sections/alerts/show-execution-errors - Update execution errors visibility
router.put('/sections/alerts/show-execution-errors', async (req: Request, res: Response) => {
  try {
    const { value } = req.body

    if (typeof value !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Value must be a boolean'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'alerts' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Alerts section not found'
      })
    }

    // Запазваме съществуващите настройки и променяме само това поле
    section.sectionSettings.alerts = {
      ...section.sectionSettings.alerts,
      showExecutionErrors: value
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { showExecutionErrors: value },
      message: 'Execution errors visibility updated'
    })

  } catch (error: any) {
    console.error('Error updating execution errors visibility:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update execution errors visibility'
    })
  }
})

// PUT /api/v1/dashboard/sections/alerts/show-sensor-alerts - Update sensor alerts visibility
router.put('/sections/alerts/show-sensor-alerts', async (req: Request, res: Response) => {
  try {
    const { value } = req.body

    if (typeof value !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Value must be a boolean'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'alerts' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Alerts section not found'
      })
    }

    section.sectionSettings.alerts = {
      ...section.sectionSettings.alerts,
      showSensorAlerts: value
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { showSensorAlerts: value },
      message: 'Sensor alerts visibility updated'
    })

  } catch (error: any) {
    console.error('Error updating sensor alerts visibility:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update sensor alerts visibility'
    })
  }
})

// PUT /api/v1/dashboard/sections/alerts/show-hardware-issues - Update hardware issues visibility
router.put('/sections/alerts/show-hardware-issues', async (req: Request, res: Response) => {
  try {
    const { value } = req.body

    if (typeof value !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Value must be a boolean'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'alerts' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Alerts section not found'
      })
    }

    section.sectionSettings.alerts = {
      ...section.sectionSettings.alerts,
      showHardwareIssues: value
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { showHardwareIssues: value },
      message: 'Hardware issues visibility updated'
    })

  } catch (error: any) {
    console.error('Error updating hardware issues visibility:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update hardware issues visibility'
    })
  }
})

// PUT /api/v1/dashboard/sections/alerts/show-system-alerts - Update system alerts visibility
router.put('/sections/alerts/show-system-alerts', async (req: Request, res: Response) => {
  try {
    const { value } = req.body

    if (typeof value !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Value must be a boolean'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'alerts' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Alerts section not found'
      })
    }

    section.sectionSettings.alerts = {
      ...section.sectionSettings.alerts,
      showSystemAlerts: value
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { showSystemAlerts: value },
      message: 'System alerts visibility updated'
    })

  } catch (error: any) {
    console.error('Error updating system alerts visibility:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update system alerts visibility'
    })
  }
})

// PUT /api/v1/dashboard/sections/alerts/severity-filter - Update severity filter
router.put('/sections/alerts/severity-filter', async (req: Request, res: Response) => {
  try {
    const { value } = req.body

    if (!['all', 'critical', 'warning'].includes(value)) {
      return res.status(400).json({
        success: false,
        error: 'Severity filter must be one of: all, critical, warning'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'alerts' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Alerts section not found'
      })
    }

    section.sectionSettings.alerts = {
      ...section.sectionSettings.alerts,
      severityFilter: value
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { severityFilter: value },
      message: 'Severity filter updated'
    })

  } catch (error: any) {
    console.error('Error updating severity filter:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update severity filter'
    })
  }
})

// PUT /api/v1/dashboard/sections/alerts/max-display-count - Update max display count
router.put('/sections/alerts/max-display-count', async (req: Request, res: Response) => {
  try {
    const { value } = req.body

    if (typeof value !== 'number' || value < 5 || value > 50) {
      return res.status(400).json({
        success: false,
        error: 'Max display count must be a number between 5 and 50'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'alerts' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Alerts section not found'
      })
    }

    section.sectionSettings.alerts = {
      ...section.sectionSettings.alerts,
      maxDisplayCount: value
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { maxDisplayCount: value },
      message: 'Max display count updated'
    })

  } catch (error: any) {
    console.error('Error updating max display count:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update max display count'
    })
  }
})

// PUT /api/v1/dashboard/sections/alerts/time-window - Update time window
router.put('/sections/alerts/time-window', async (req: Request, res: Response) => {
  try {
    const { value } = req.body

    if (!['1h', '6h', '24h', '7d'].includes(value)) {
      return res.status(400).json({
        success: false,
        error: 'Time window must be one of: 1h, 6h, 24h, 7d'
      })
    }

    let section = await DashboardSection.findOne({ sectionId: 'alerts' })
    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Alerts section not found'
      })
    }

    section.sectionSettings.alerts = {
      ...section.sectionSettings.alerts,
      timeWindow: value
    }

    await section.save()

    res.status(200).json({
      success: true,
      data: { timeWindow: value },
      message: 'Time window updated'
    })

  } catch (error: any) {
    console.error('Error updating time window:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update time window'
    })
  }
})

// ===============================
// PROGRAM SECTION DATA ROUTE
// ===============================

// GET /api/v1/dashboard/program-data - Get unified program dashboard data
router.get('/program-data', async (req: Request, res: Response) => {
  try {
    // Get active program and current execution session (active OR most recent completed)
    const activeProgram = await ActiveProgram.findOne()
      .populate('programId', 'name description')
      .populate('controllerId', 'name')
      .populate('activeCycles.taskId', 'name actionTemplateId')

    // Simple approach: Get Program data for ActionTemplate information
    if (activeProgram && activeProgram.programId) {
      const { Program } = await import('../models/Program')
      const { ActionTemplate } = await import('../models/ActionTemplate')

      const programId = typeof activeProgram.programId === 'object'
        ? activeProgram.programId._id
        : activeProgram.programId

      const program = await Program.findById(programId).lean()

      if (program && program.cycles) {
        // Enrich each active cycle with ActionTemplate data from the original program
        for (let i = 0; i < activeProgram.activeCycles.length && i < program.cycles.length; i++) {
          const activeCycle = activeProgram.activeCycles[i]
          const programCycle = program.cycles[i]

          if (programCycle.actions && programCycle.actions.length > 0) {
            // Get ActionTemplate IDs from program cycle
            const actionTemplateIds = programCycle.actions.map((action: any) => action.actionTemplateId)

            // Query ActionTemplates for names/descriptions
            const actionTemplates = await ActionTemplate.find({
              _id: { $in: actionTemplateIds }
            }).select('name description')

            // Add simple cycleGlobalParameters with ActionTemplate info
            activeCycle.cycleGlobalParameters = actionTemplates.map((template: any, index: number) => ({
              actionTemplateId: actionTemplateIds[index],
              actionTemplateName: `${template.name} (${index + 1})`,
              actionTemplateDescription: template.description || '',
              actionIndex: index + 1,
              parameters: [],
              status: 'pending' // Default status, will be updated below from DB
            }))

            // Update actionTemplatesCount to reflect actual count
            activeCycle.actionTemplates = actionTemplates.map((template: any) => ({
              name: template.name,
              description: template.description || ''
            }))
          }
        }
      }
    }

    // Read ActionTemplate status from Dashboard DB and update activeCycles
    if (activeProgram && activeProgram.activeCycles) {
      // Get program section for DB status lookup
      const today = new Date().toISOString().split('T')[0]
      const programSection = await DashboardSection.findOne({ sectionId: 'program' })

      if (programSection &&
          programSection.sectionSettings.dailyTracking &&
          programSection.sectionSettings.dailyTracking.actionTemplateExecutions) {

        const dbExecutions = programSection.sectionSettings.dailyTracking.actionTemplateExecutions

        // Update status from DB for each active cycle
        for (const activeCycle of activeProgram.activeCycles) {
          if (activeCycle.cycleGlobalParameters) {
            for (let index = 0; index < activeCycle.cycleGlobalParameters.length; index++) {
              const actionTemplateParam = activeCycle.cycleGlobalParameters[index] as any

              // Find matching DB execution by actionTemplateId + cycleId
              const dbExecution = dbExecutions.find((exec: any) =>
                exec.actionTemplateId.toString() === actionTemplateParam.actionTemplateId.toString() &&
                exec.cycleId === activeCycle.cycleId
              )

              if (dbExecution) {
                // Update status and execution data from DB
                actionTemplateParam.status = dbExecution.status
                if (dbExecution.startTime) actionTemplateParam.startTime = dbExecution.startTime
                if (dbExecution.endTime) actionTemplateParam.endTime = dbExecution.endTime
                if (dbExecution.duration) actionTemplateParam.duration = dbExecution.duration
              } else {
                // Keep default status if no DB record found
                actionTemplateParam.status = 'pending'
              }
            }
          }
        }
      } else {
        // Set default ActionTemplate status when no DB tracking exists
        for (const activeCycle of activeProgram.activeCycles) {
          if (activeCycle.cycleGlobalParameters) {
            for (const actionTemplate of activeCycle.cycleGlobalParameters as any[]) {
              actionTemplate.status = 'pending'
            }
          }
        }
      }
    }

    // First try to find active execution
    let currentExecution = await ExecutionSession.findOne({
      status: { $in: ['starting', 'running', 'paused'] }
    }).lean()

    // If no active execution, get most recent completed execution
    if (!currentExecution) {
      currentExecution = await ExecutionSession.findOne({
        status: 'completed'
      }).sort({ endTime: -1 }).lean()
    }

    // Default data when no active program
    if (!activeProgram) {
      return res.status(200).json({
        success: true,
        data: {
          programOverview: {
            name: 'Няма активна програма',
            status: 'idle',
            totalExecutions: 0
          },
          cyclesStatus: {
            totalCycles: 0,
            cycles: []
          },
          currentExecution: null
        }
      })
    }

    // Get or create program section tracking
    const today = new Date().toISOString().split('T')[0]
    let programSection = await DashboardSection.findOne({ sectionId: 'program' })

    if (!programSection ||
        !programSection.sectionSettings.activeProgram ||
        programSection.sectionSettings.activeProgram.activeProgramId?.toString() !== activeProgram._id.toString() ||
        programSection.sectionSettings.dailyTracking?.date !== today) {

      programSection = await DashboardSection.findOneAndUpdate(
        { sectionId: 'program' },
        {
          sectionId: 'program',
          sectionSettings: {
            activeProgram: {
              activeProgramId: activeProgram._id,
              programId: activeProgram.programId,
              loadedAt: new Date()
            },
            dailyTracking: {
              date: today,
              completedCycles: [],
              cycleExecutions: [],
              actionTemplateExecutions: []
            }
          },
          modules: []
        },
        { upsert: true, new: true }
      )
    }

    // Get cycles data using program section tracking
    const completedCycles = programSection.sectionSettings.dailyTracking?.completedCycles || []
    const cycleExecutions = programSection.sectionSettings.dailyTracking?.cycleExecutions || []

    const cyclesForDay = activeProgram.activeCycles
      .filter(cycle => cycle.isActive)
      .map(cycle => {
        const cycleTime = cycle.startTime

        // Check if cycle was completed today from tracking
        const completedCycle = completedCycles.find((c: any) => c.cycleId === cycle.cycleId)

        // Get detailed execution data from cycleExecutions tracking
        const cycleExecution = cycleExecutions.find((c: any) => c.cycleId === cycle.cycleId)

        let status = 'pending'
        if (cycle.isCurrentlyExecuting) {
          status = 'running'
        } else if (cycleExecution) {
          status = cycleExecution.status // Use status from detailed tracking
        } else if (completedCycle) {
          status = completedCycle.status // Fall back to completedCycles
        } else if (cycle.executionCount > 0 && cycle.lastExecuted) {
          const lastExecutedDate = new Date(cycle.lastExecuted).toISOString().split('T')[0]
          if (lastExecutedDate === today) {
            status = 'completed'
          }
        }

        // Calculate duration info - prioritize cycleExecutions data
        let lastDuration = null
        let executionStartTime = null
        let executionEndTime = null

        if (cycleExecution) {
          lastDuration = cycleExecution.duration
          executionStartTime = cycleExecution.startTime
          executionEndTime = cycleExecution.endTime
        } else if (completedCycle) {
          lastDuration = completedCycle.duration
        }

        // Calculate average duration from completed cycles
        const cycleDurations = completedCycles
          .filter((c: any) => c.cycleId === cycle.cycleId && c.duration)
          .map((c: any) => c.duration)

        const averageDuration = cycleDurations.length > 0
          ? cycleDurations.reduce((sum: number, d: number) => sum + d, 0) / cycleDurations.length
          : null

        return {
          cycleId: cycle.cycleId,
          startTime: cycleTime,
          status: status,
          executionCount: cycle.executionCount,
          actionTemplatesCount: cycle.actionTemplates?.length || 0,
          cycleGlobalParameters: cycle.cycleGlobalParameters || [],
          isCurrentlyExecuting: cycle.isCurrentlyExecuting,
          lastDuration: lastDuration,
          averageDuration: averageDuration,
          estimatedDuration: averageDuration || lastDuration,
          // Enhanced timing data from cycleExecutions
          executionStartTime: executionStartTime,
          executionEndTime: executionEndTime,
          totalDurationMs: lastDuration
        }
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    // Current execution details - using new currentBlock structure and trackable blocks filtering
    let executionDetails = null
    if (currentExecution) {
      const trackableBlocks = ['sensor', 'actuator', 'if', 'loop']
      const isActive = ['running', 'paused'].includes(currentExecution.programStatus)

      // For the new hierarchical schema, we need to get current cycle and flow info
      let currentBlock = null
      const currentCycle = currentExecution.cycles?.find(c => c.cycleStatus === 'running')
      if (isActive && currentCycle) {
        const currentFlow = currentCycle.flows?.find(f => f.flowStatus === 'running')
        if (currentFlow) {
          const activeBlock = currentFlow.blocks?.find(b => b.blockStatus === 'running')
          if (activeBlock) {
            currentBlock = {
              blockName: activeBlock.blockName || 'Executing Block',
              blockType: activeBlock.blockType,
              status: 'executing'
            }
          }
        }
      }

      // Get filtered blocks from all flows in current cycle
      let filteredBlocks: any[] = []
      if (currentCycle) {
        for (const flow of currentCycle.flows || []) {
          const flowBlocks = flow.blocks?.filter(block =>
            trackableBlocks.includes(block.blockType)
          ) || []
          filteredBlocks.push(...flowBlocks)
        }
      }

      // Calculate estimated duration and real progress for current execution
      const currentCycleId = currentCycle?.cycleId
      let estimatedDuration = null
      let realProgressPercent = 0

      if (currentCycleId) {
        // Find duration data for this cycle
        const cycleDurations = completedCycles
          .filter((c: any) => c.cycleId === currentCycleId && c.duration)
          .map((c: any) => c.duration)

        if (cycleDurations.length > 0) {
          estimatedDuration = cycleDurations.reduce((sum: number, d: number) => sum + d, 0) / cycleDurations.length

          // Calculate real progress based on elapsed time vs estimated duration
          const elapsedTime = Date.now() - new Date(currentExecution.programStartTime).getTime()
          realProgressPercent = Math.min(Math.round((elapsedTime / estimatedDuration) * 100), 99) // Never 100% until actually completed
        }
      }

      executionDetails = {
        executionId: currentExecution._id.toString(),
        flowName: currentCycle?.cycleName || 'Program Execution',
        status: currentExecution.programStatus,
        currentBlock: currentBlock,
        progressPercent: realProgressPercent || 0,
        startTime: currentExecution.programStartTime,
        totalBlocks: filteredBlocks.length, // Use filtered count
        completedBlocks: filteredBlocks.filter(block => block.blockStatus === 'completed').length,
        estimatedDuration: estimatedDuration,
        elapsedTime: currentExecution.programStartTime ? Date.now() - new Date(currentExecution.programStartTime).getTime() : 0,
        isCompleted: currentExecution.programStatus === 'completed'
      }
    }

    // Program overview should not show historical errors
    // Only show errors if there's a current execution that's actively failing
    const hasRecentError = false // Program overview is always clean for loaded programs

    const dashboardData = {
      programOverview: {
        name: activeProgram.name,
        status: activeProgram.status,
        totalExecutions: activeProgram.totalExecutions || 0,
        hasError: hasRecentError,
        errorMessage: null // No historical error messages for program overview
      },
      cyclesStatus: {
        totalCycles: cyclesForDay.length,
        completedToday: cyclesForDay.filter(c => c.status === 'completed').length,
        cycles: cyclesForDay
      },
      currentExecution: executionDetails,
      activeCycles: cyclesForDay // Use enriched cycles with cycleGlobalParameters
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    })

  } catch (error: any) {
    console.error('Error fetching program dashboard data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch program dashboard data'
    })
  }
})

export default router