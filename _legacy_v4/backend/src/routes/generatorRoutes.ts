// ABOUTME: Express router for Arduino firmware generation API
// ABOUTME: Handles firmware generation and command preview endpoints

import { Router, Request, Response } from 'express'
import { ArduinoGeneratorService } from '../services/ArduinoGeneratorService'
import { Command } from '../models'
import * as path from 'path'
import * as fs from 'fs'

const router = Router()
const generatorService = ArduinoGeneratorService.getInstance()

// POST /api/generator/generate - Generate firmware for controller with manual commands
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { controllerId, communicationType, manualCommandNames } = req.body

    // Validate controllerId
    if (!controllerId || typeof controllerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'controllerId is required and must be a string'
      })
    }

    // Validate communicationType
    if (!communicationType) {
      return res.status(400).json({
        success: false,
        error: 'Communication type is required'
      })
    }

    // Validate manualCommandNames is non-empty array
    if (!manualCommandNames || !Array.isArray(manualCommandNames) || manualCommandNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'manualCommandNames must be a non-empty array'
      })
    }

    // Validate controller exists in config
    try {
      await generatorService.getControllerConfig(controllerId)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `Controller not found in configuration: ${controllerId}`
      })
    }

    // Generate firmware with controller id, communication type, and manual commands
    const generatedFilePath = await generatorService.generateFirmware(
      controllerId,
      communicationType,
      manualCommandNames
    )

    res.json({
      success: true,
      data: {
        controllerId,
        filePath: generatedFilePath,
        commandsCount: manualCommandNames.length,
        commands: manualCommandNames,
        timestamp: new Date()
      },
      message: 'Firmware generated successfully'
    })

  } catch (error: any) {
    console.error('[ArduinoGenerator] Error generating firmware:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate firmware',
      details: error.message
    })
  }
})

// GET /api/generator/preview - Get all active controllers and available commands
router.get('/preview', async (req: Request, res: Response) => {
  try {
    // Get all active controllers from config
    const activeControllers = await generatorService.getActiveControllers()

    // Get config for deviceTemplates
    const config = await generatorService.loadConfig()

    // Get all active commands
    const allCommands = await Command.find({
      isActive: true
    }).select('name displayName description memoryFootprint compatibleControllers')

    res.json({
      success: true,
      data: {
        controllers: activeControllers.map(ctrl => ({
          id: ctrl.id,
          displayName: ctrl.displayName,
          chipset: ctrl.chipset,
          communicationTypes: ctrl.communicationTypes,
          incompatibleCommands: ctrl.incompatibleCommands || []
        })),
        availableCommands: allCommands.map(cmd => ({
          name: cmd.name,
          displayName: cmd.displayName,
          description: cmd.description,
          memoryFootprint: cmd.memoryFootprint || null,
          compatibleControllers: cmd.compatibleControllers
        })),
        deviceTemplates: config.deviceTemplates,
        commands: config.commands,
        timestamp: new Date()
      },
      message: 'Generator configuration retrieved successfully'
    })

  } catch (error: any) {
    console.error('[ArduinoGenerator] Error getting preview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get command preview',
      details: error.message
    })
  }
})

// GET /api/generator/download - Download generated firmware file
router.get('/download', async (req: Request, res: Response) => {
  try {
    const { file } = req.query

    // Validate file parameter
    if (!file || typeof file !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'file parameter is required'
      })
    }

    // Security: validate filename to prevent path traversal
    const filename = path.basename(file)
    if (filename !== file || filename.includes('..')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      })
    }

    // Construct file path
    const projectRoot = path.resolve(__dirname, '../../..')
    const generatedDir = path.join(projectRoot, 'Arduino', 'generated')
    const filePath = path.join(generatedDir, filename)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      })
    }

    // Set headers for download
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Stream file to client
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

  } catch (error: any) {
    console.error('[ArduinoGenerator] Error downloading file:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      details: error.message
    })
  }
})

export default router
