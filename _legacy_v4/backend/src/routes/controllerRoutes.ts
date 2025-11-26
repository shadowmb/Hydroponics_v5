import { Router, Request, Response } from 'express'
import { PhysicalController, Device } from '../models'
import { HardwareService } from '../hardware'
import { DevicePortService } from '../services/DevicePortService'
import { StartupService } from '../services/StartupService'

const router = Router()

// GET /api/controllers - Get all controllers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, status, isActive } = req.query

    const filter: any = {}
    if (type) filter.type = type
    if (status) filter.status = status
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const controllers = await PhysicalController.find(filter).sort({ createdAt: -1 })

    res.json(controllers)
  } catch (error) {
    console.error('Error fetching controllers:', error)
    res.status(500).json({ error: 'Failed to fetch controllers' })
  }
})

// GET /api/controllers/status - Get controllers status summary
router.get('/status', async (req: Request, res: Response) => {
  try {
    const controllers = await PhysicalController.find().select('name status lastHeartbeat communicationType')
    
    const summary = {
      total: controllers.length,
      online: controllers.filter(c => c.status === 'online').length,
      offline: controllers.filter(c => c.status === 'offline').length,
      controllers: controllers
    }
    
    res.json(summary)
  } catch (error) {
    console.error('Error fetching controller status:', error)
    res.status(500).json({ error: 'Failed to fetch controller status' })
  }
})

// GET /api/controllers/:id - Get controller by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const controller = await PhysicalController.findById(req.params.id)

    if (!controller) {
      return res.status(404).json({ error: 'Controller not found' })
    }

    res.json(controller)
  } catch (error) {
    console.error('Error fetching controller:', error)
    res.status(500).json({ error: 'Failed to fetch controller' })
  }
})

// GET /api/controllers/:id/devices - Get devices for controller
router.get('/:id/devices', async (req: Request, res: Response) => {
  try {
    const controller = await PhysicalController.findById(req.params.id)
    if (!controller) {
      return res.status(404).json({ error: 'Controller not found' })
    }

    const devices = await Device.find({ controllerId: req.params.id }).sort({ port: 1 })
    
    res.json(devices)
  } catch (error) {
    console.error('Error fetching controller devices:', error)
    res.status(500).json({ error: 'Failed to fetch controller devices' })
  }
})

// GET /api/controllers/:id/available-ports - Get available ports for controller
router.get('/:id/available-ports', async (req: Request, res: Response) => {
  try {
    const controller = await PhysicalController.findById(req.params.id)
    if (!controller) {
      return res.status(404).json({ error: 'Controller not found' })
    }

    // Get used ports
    const devices = await Device.find({ controllerId: req.params.id })
    const usedPorts = devices.flatMap(device => device.ports)
    
    // Filter available ports to show only unused ones
    const availablePorts = controller.availablePorts
      .filter(port => port.isActive && !usedPorts.includes(port.key))
    
    res.json(availablePorts)
  } catch (error) {
    console.error('Error fetching available ports:', error)
    res.status(500).json({ error: 'Failed to fetch available ports' })
  }
})

// POST /api/controllers - Create new controller
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      type, 
      communicationBy, 
      communicationType, 
      communicationConfig, 
      description, 
      isActive, 
      availablePorts,
      connectionType,
      lastDiscoveryMethod 
    } = req.body

    // Extract MAC address from communicationConfig if present
    let macAddress = undefined
    if (communicationConfig && communicationConfig.mac_address) {
      macAddress = communicationConfig.mac_address
    }

    const controller = new PhysicalController({
      name,
      type,
      communicationBy,
      communicationType,
      communicationConfig,
      macAddress, // Map MAC address to dedicated field
      description,
      status: 'offline',
      isActive: isActive !== undefined ? isActive : true,
      availablePorts: availablePorts || [],
      connectionType,
      lastDiscoveryMethod
    })

    const savedController = await controller.save()

    // Auto-initialize controller if it's active
    if (savedController.isActive) {
      try {
        const { SystemInitializationService } = await import('../services/SystemInitializationService')
        const systemInit = SystemInitializationService.getInstance()
        await systemInit.ensureControllerInitialized(savedController._id.toString())
      } catch (initError: any) {
        console.warn(`[Controller Creation] Failed to auto-initialize controller ${savedController.name}:`, initError.message)
        // Don't fail the request - initialization can be retried
      }
    }

    res.status(201).json(savedController)
  } catch (error: any) {
    console.error('Error creating controller:', error)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Controller name already exists' })
    }
    res.status(500).json({ error: 'Failed to create controller' })
  }
})

// PUT /api/controllers/:id - Update controller
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      type, 
      communicationBy, 
      communicationType, 
      communicationConfig, 
      description, 
      status, 
      isActive, 
      availablePorts 
    } = req.body

    const controller = await PhysicalController.findById(req.params.id)
    if (!controller) {
      return res.status(404).json({ error: 'Controller not found' })
    }

    // Extract MAC address from communicationConfig if present
    let macAddress = controller.macAddress // Keep existing value if no update
    if (communicationConfig && communicationConfig.mac_address !== undefined) {
      macAddress = communicationConfig.mac_address || undefined
    }

    const wasActive = controller.isActive
    const willBeActive = isActive !== undefined ? isActive : wasActive

    const updatedController = await PhysicalController.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(communicationBy !== undefined && { communicationBy }),
        ...(communicationType !== undefined && { communicationType }),
        ...(communicationConfig !== undefined && { communicationConfig }),
        ...(macAddress !== controller.macAddress && { macAddress }), // Update MAC only if changed
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(isActive !== undefined && { isActive }),
        ...(availablePorts !== undefined && { availablePorts })
      },
      { new: true, runValidators: true }
    )

    // Auto-initialize if controller was activated (inactive -> active)
    if (!wasActive && willBeActive) {
      try {
        const { SystemInitializationService } = await import('../services/SystemInitializationService')
        const systemInit = SystemInitializationService.getInstance()
        await systemInit.ensureControllerInitialized(updatedController!._id.toString())
      } catch (initError: any) {
        console.warn(`[Controller Update] Failed to auto-initialize controller ${updatedController!.name}:`, initError.message)
      }
    }

    // Disconnect if controller was deactivated (active -> inactive)
    if (wasActive && !willBeActive) {
      try {
        const { ConnectionManagerService } = await import('../services/ConnectionManagerService')
        const connectionManager = ConnectionManagerService.getInstance()
        await connectionManager.removeConnection(updatedController!._id.toString())
      } catch (disconnectError: any) {
        console.warn(`[Controller Update] Failed to disconnect controller ${updatedController!.name}:`, disconnectError.message)
      }
    }

    res.json(updatedController)
  } catch (error: any) {
    console.error('Error updating controller:', error)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Controller name already exists' })
    }
    res.status(500).json({ error: 'Failed to update controller' })
  }
})

// PUT /api/controllers/:id/heartbeat - Update controller heartbeat
router.put('/:id/heartbeat', async (req: Request, res: Response) => {
  try {
    const controller = await PhysicalController.findByIdAndUpdate(
      req.params.id,
      { 
        lastHeartbeat: new Date(),
        status: 'online'
      },
      { new: true }
    )

    if (!controller) {
      return res.status(404).json({ error: 'Controller not found' })
    }

    res.json({ message: 'Heartbeat updated', controller })
  } catch (error) {
    console.error('Error updating heartbeat:', error)
    res.status(500).json({ error: 'Failed to update heartbeat' })
  }
})

// POST /api/controllers/:id/test-device - Test device on controller
router.post('/:id/test-device', async (req: Request, res: Response) => {
  try {
    const { deviceType, port, testType } = req.body
    
    const controller = await PhysicalController.findById(req.params.id)
    if (!controller) {
      return res.status(404).json({ error: 'Controller not found' })
    }
    
    if (controller.status !== 'online') {
      return res.status(400).json({ 
        error: `Controller is ${controller.status}. Must be online for testing.` 
      })
    }
    
    // Direct hardware testing - check if controller has persistent connection first
    const startupService = StartupService.getInstance()
    const hasStartupConnection = startupService.isControllerConnected(req.params.id)
    
    try {
      if (hasStartupConnection) {
        console.log(`[Controller Test] Using StartupService persistent connection`)
      } else {
        console.log(`[Controller Test] No StartupService connection, falling back to HardwareService`)
      }
      
      if (testType === 'read') {
        // Sensor test - send read command directly
        if (hasStartupConnection) {
          const command = {
            cmd: 'ANALOG',
            pin: port // Should be "A0", "A1", etc.
          }
          
          const response = await startupService.sendCommand(req.params.id, command)
          return res.json({
            success: response.ok === 1,
            message: response.ok === 1 ? `Sensor reading: ${response.value}` : `Sensor test failed: ${response.error}`,
            data: { value: response.value, volt: response.volt, port, deviceType, timestamp: new Date() }
          })
        } else {
          // No StartupService connection available
          return res.status(503).json({
            success: false,
            message: 'Controller not connected through StartupService. Try reconnecting the controller first.',
            data: { port, deviceType, timestamp: new Date() }
          })
        }
      } else {
        // Digital port test - toggle state and return current status
        const portNumber = parseInt(port.replace('D', '')) // D7 -> 7
        
        if (hasStartupConnection) {
          // Get current port state from DB first
          const currentPortInfo = controller.availablePorts.find(p => p.key === port)
          const currentState = currentPortInfo?.currentState || 'HIGH'
          
          // Toggle to opposite state
          const newState = currentState === 'HIGH' ? 0 : 1
          
          const command = {
            cmd: 'SET_PIN',
            pin: portNumber,
            state: newState
          }
          
          const response = await startupService.sendCommand(req.params.id, command)
          
          if (response.ok === 1) {
            // Update database with new state
            const newHardwareState = newState === 1 ? 'HIGH' : 'LOW'
            await PhysicalController.findByIdAndUpdate(
              req.params.id,
              { 
                $set: { 
                  [`availablePorts.$[elem].currentState`]: newHardwareState 
                } 
              },
              { 
                arrayFilters: [{ 'elem.key': port }] 
              }
            ).exec()
            
            return res.json({
              success: true,
              message: `Port ${port} toggled successfully`,
              data: { 
                port, 
                current_state: newHardwareState,
                previous_state: currentState,
                test_result: 'responding',
                timestamp: new Date() 
              }
            })
          } else {
            return res.json({
              success: false,
              message: `Port ${port} test failed: ${response.error}`,
              data: { port, test_result: 'not_responding', timestamp: new Date() }
            })
          }
        } else {
          // No StartupService connection available
          return res.status(503).json({
            success: false,
            message: 'Controller not connected through StartupService. Try reconnecting the controller first.',
            data: { port, timestamp: new Date() }
          })
        }
      }
    } catch (error) {
      console.error('Hardware adapter error:', error)
      return res.json({
        success: false,
        message: `Hardware test failed: ${(error as Error).message}`,
        data: { port, timestamp: new Date() }
      })
    }
    
  } catch (error) {
    console.error('Device test error:', error)
    res.status(500).json({ error: 'Device test failed' })
  }
})

// DELETE /api/controllers/:id - Delete controller
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const controller = await PhysicalController.findById(req.params.id)
    if (!controller) {
      return res.status(404).json({ error: 'Controller not found' })
    }

    // Check if controller has devices
    const connectedDevices = await Device.find({ controllerId: req.params.id }).select('name type')
    if (connectedDevices.length > 0) {
      const deviceNames = connectedDevices.map(device => `${device.name} (${device.type})`).join(', ')
      return res.status(400).json({ 
        error: `Не може да се изтрие контролерът. Първо премахнете свързаните ${connectedDevices.length} устройства: ${deviceNames}`,
        connectedDevices: connectedDevices.length,
        deviceList: connectedDevices
      })
    }

    await PhysicalController.findByIdAndDelete(req.params.id)
    res.json({ message: 'Controller deleted successfully', controller })
  } catch (error) {
    console.error('Error deleting controller:', error)
    res.status(500).json({ error: 'Failed to delete controller' })
  }
})

// POST /api/controllers/:id/detect-capabilities - Detect available capabilities from controller
router.post('/:id/detect-capabilities', async (req: Request, res: Response) => {
  console.log(`[Detect Capabilities] Starting detection for controller ID: ${req.params.id}`)
  try {
    const controllerId = req.params.id

    const controller = await PhysicalController.findById(controllerId)
    if (!controller) {
      console.log(`[Detect Capabilities] Controller not found: ${controllerId}`)
      return res.status(404).json({
        success: false,
        error: 'Controller not found'
      })
    }

    // Check if controller is online
    if (controller.status !== 'online') {
      return res.status(400).json({
        success: false,
        error: `Controller is ${controller.status}. Must be online for capability detection.`,
        message: 'Контролерът трябва да е online за автоматично откриване на capabilities'
      })
    }

    console.log(`[Detect Capabilities] Controller found: ${controller.name}, status: ${controller.status}`)
    console.log(`[Detect Capabilities] Controller type: ${controller.type}, communicationType: ${controller.communicationType}, connectionType: ${controller.connectionType}`)

    // Use StartupService to send INFO command
    const startupService = StartupService.getInstance()
    console.log(`[Detect Capabilities] Checking if controller is connected...`)
    const hasConnection = startupService.isControllerConnected(controllerId)
    console.log(`[Detect Capabilities] Has connection: ${hasConnection}`)

    if (!hasConnection) {
      console.log(`[Detect Capabilities] Controller NOT connected, returning 503`)
      return res.status(503).json({
        success: false,
        error: 'Controller not connected through StartupService',
        message: 'Контролерът не е свързан. Опитайте да рестартирате връзката.'
      })
    }

    // Send INFO command to get capabilities
    const infoCommand = { cmd: 'INFO' }
    console.log(`[Detect Capabilities] Sending INFO command to controller:`, JSON.stringify(infoCommand))
    try {
      const response = await startupService.sendCommand(controllerId, infoCommand)
      console.log(`[Detect Capabilities] Raw response from controller:`, JSON.stringify(response))

      // Check for standardized ok:1 format
      const isSuccess = (response.ok === 1)
      const hasCapabilities = response.capabilities && Array.isArray(response.capabilities)

      if (isSuccess && hasCapabilities) {
        // Extract capabilities array from response
        const capabilities = response.capabilities || []

        console.log(`[Detect Capabilities] Detected capabilities:`, capabilities)

        // Update controller with detected capabilities
        await PhysicalController.findByIdAndUpdate(
          controllerId,
          { capabilities: capabilities },
          { new: true }
        )

        return res.json({
          success: true,
          message: `Успешно открити ${capabilities.length} capabilities`,
          data: {
            capabilities: capabilities,
            timestamp: new Date()
          }
        })
      } else {
        console.log(`[Detect Capabilities] Invalid response - isSuccess: ${isSuccess}, hasCapabilities: ${hasCapabilities}`)
        return res.json({
          success: false,
          error: response.error || 'INFO command did not return capabilities',
          message: 'Контролерът не отговори с информация за capabilities'
        })
      }
    } catch (error) {
      console.error('[Detect Capabilities] Error sending INFO command:', error)
      return res.status(500).json({
        success: false,
        error: `Failed to detect capabilities: ${(error as Error).message}`,
        message: 'Грешка при изпращане на INFO команда'
      })
    }

  } catch (error) {
    console.error('Error detecting capabilities:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to detect capabilities',
      message: (error as Error).message
    })
  }
})

// POST /api/controllers/:id/test-connection - Test connection with retry logic
router.post('/:id/test-connection', async (req: Request, res: Response) => {
  console.log(`[Test Connection] Starting test for controller ID: ${req.params.id}`)
  try {
    const controllerId = req.params.id
    const maxRetries = req.body.maxRetries || 3

    const controller = await PhysicalController.findById(controllerId)
    if (!controller) {
      console.log(`[Test Connection] Controller not found: ${controllerId}`)
      return res.status(404).json({ error: 'Controller not found' })
    }

    console.log(`[Test Connection] Controller found: ${controller.name}, starting ${maxRetries} retry attempts...`)

    // Use ConnectionManagerService testConnection with retry logic
    const { ConnectionManagerService } = await import('../services/ConnectionManagerService')
    const connectionManager = ConnectionManagerService.getInstance()

    const result = await connectionManager.testConnection(controllerId, maxRetries)

    if (result.success) {
      // Update controller status to online
      await PhysicalController.findByIdAndUpdate(controllerId, {
        status: 'online',
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        lastHeartbeat: new Date()
      })

      res.json({
        success: true,
        message: `Връзката е успешна след ${result.attempts} опит(а)`,
        data: {
          attempts: result.attempts,
          controller: {
            id: controller._id,
            name: controller.name,
            type: controller.type,
            status: 'online'
          }
        }
      })
    } else {
      res.json({
        success: false,
        message: `Връзката не е успешна след ${result.attempts} опит(а)`,
        error: result.lastError,
        data: {
          attempts: result.attempts,
          lastError: result.lastError,
          controller: {
            id: controller._id,
            name: controller.name,
            type: controller.type,
            status: 'offline'
          }
        }
      })
    }
  } catch (error) {
    console.error('Error testing controller connection:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to test controller connection',
      message: (error as Error).message
    })
  }
})

// POST /api/controllers/:id/test - Test controller connection
router.post('/:id/test', async (req: Request, res: Response) => {
  console.log(`[Controller Test] Starting test for controller ID: ${req.params.id}`)
  try {
    const controllerId = req.params.id

    const controller = await PhysicalController.findById(controllerId)
    if (!controller) {
      console.log(`[Controller Test] Controller not found: ${controllerId}`)
      return res.status(404).json({ error: 'Controller not found' })
    }

    console.log(`[Controller Test] Controller found: ${controller.name}`)

    // Use StartupService connection instead of creating new HardwareService
    const startupService = StartupService.getInstance()
    const hasConnection = startupService.isControllerConnected(controllerId)

    if (hasConnection) {
      // Test using existing connection
      const testCommand = { cmd: 'PING' }
      try {
        const response = await startupService.sendCommand(controllerId, testCommand)
        res.json({
          success: response.ok === 1,
          message: response.ok === 1 ? 'Controller is online and responsive' : `Test failed: ${response.error}`,
          details: response,
            controller: {
              id: controller._id,
              name: controller.name,
              type: controller.type,
              status: response.ok === 1 ? 'online' : 'offline'
            }
          })
        } catch (error) {
          res.json({
            success: false,
            message: `Test failed: ${(error as Error).message}`,
            controller: {
              id: controller._id,
              name: controller.name,
              type: controller.type,
              status: 'error'
            }
          })
        }
      } else {
        // No connection available
        res.json({
          success: false,
          message: 'Controller not connected through StartupService. Try reconnecting the controller first.',
          controller: {
            id: controller._id,
            name: controller.name,
            type: controller.type,
            status: 'offline'
          }
        })
      }
  } catch (error) {
    console.error('Error testing controller connection:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to test controller connection',
      message: (error as Error).message
    })
  }
})

// POST /api/controllers/:id/raw-command - Send raw command to controller (debug tool)
router.post('/:id/raw-command', async (req: Request, res: Response) => {
  try {
    const controllerId = req.params.id
    const command = req.body

    const controller = await PhysicalController.findById(controllerId)
    if (!controller) {
      return res.status(404).json({ error: 'Controller not found' })
    }

    if (controller.status !== 'online') {
      return res.status(400).json({
        error: `Controller is ${controller.status}. Must be online to send commands.`
      })
    }

    // Use HardwareCommunicationService to send raw command
    const { HardwareCommunicationService } = await import('../services/HardwareCommunicationService')
    const hardwareComm = HardwareCommunicationService.getInstance()

    const response = await hardwareComm.sendCommand(controllerId, command)

    res.json(response)
  } catch (error) {
    console.error('Error sending raw command:', error)
    res.status(500).json({
      ok: 0,
      error: 'Failed to send raw command',
      message: (error as Error).message
    })
  }
})

export default router