import { Router, Request, Response } from 'express'
import { Device, PhysicalController, DeviceTemplate, Relay, HealthConfig } from '../models'
import { DevicePortService } from '../services/DevicePortService'
import { StartupService } from '../services/StartupService'
import { HardwareHealthChecker } from '../services/HardwareHealthChecker'
import { SchedulerService } from '../services/SchedulerService'
import { UdpDiscoveryService } from '../services/UdpDiscoveryService'

const router = Router()
const startupService = StartupService.getInstance()

// GET /api/devices - Get all devices
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, controllerId, isActive } = req.query

    const filter: any = {}
    if (type) filter.type = type
    if (controllerId) filter.controllerId = controllerId
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    const devices = await Device.find(filter)
      .populate('controllerId', 'name type connectionType address status')
      .sort({ createdAt: -1 })

    res.json(devices)
  } catch (error) {
    console.error('Error fetching devices:', error)
    res.status(500).json({ error: 'Failed to fetch devices' })
  }
})

/**
 * NETWORK DISCOVERY CONFIGURATION ENDPOINTS
 * Phase 1 UDP Integration - Network Configuration API
 * IMPORTANT: Place before /:id route to avoid conflicts
 */

// GET /api/v1/devices/network-settings - Get network discovery settings
router.get('/network-settings', async (req: Request, res: Response) => {
  try {
    // Get UDP settings from HealthConfig database
    const healthConfig = await HealthConfig.getSingleton()
    
    const networkConfig = {
      discoveryMode: healthConfig.udp?.enabled ? 'udp' : 'http', // Convert from old udpEnabled flag
      broadcastAddress: healthConfig.udp?.broadcastAddress ?? '192.168.0.255',
      udpPort: healthConfig.udp?.port ?? 8888,
      responseTimeout: healthConfig.udp?.responseTimeout ?? 2000,
      retryAttempts: healthConfig.udp?.retryAttempts ?? 3,
      discoveryMethod: healthConfig.udp?.discoveryMethod ?? 'network_scan'  // WSL-friendly default
    }

    res.json({
      success: true,
      data: networkConfig,
      message: 'Network discovery settings retrieved successfully'
    })

  } catch (error: any) {
    console.error('[NetworkSettings] Error getting network settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get network settings',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/network-settings - Update network discovery settings  
router.put('/network-settings', async (req: Request, res: Response) => {
  try {
    const {
      discoveryMode,
      broadcastAddress,
      udpPort,
      responseTimeout,
      retryAttempts,
      discoveryMethod
    } = req.body

    // Validation according to plan specification
    const updates: any = {}

    if (discoveryMode !== undefined) {
      const validModes = ['http', 'udp']
      if (!validModes.includes(discoveryMode)) {
        return res.status(400).json({
          success: false,
          error: `Invalid discovery mode. Valid options: ${validModes.join(', ')}`
        })
      }
      updates.udpEnabled = discoveryMode === 'udp'
    }
    if (broadcastAddress !== undefined) {
      // Basic IP validation
      if (!broadcastAddress.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid broadcast address format'
        })
      }
      updates.broadcastAddress = broadcastAddress
    }
    if (udpPort !== undefined) {
      if (udpPort < 1024 || udpPort > 65535) {
        return res.status(400).json({
          success: false,
          error: 'UDP port must be between 1024 and 65535'
        })
      }
      updates.udpPort = udpPort
    }
    if (responseTimeout !== undefined) {
      if (responseTimeout < 500 || responseTimeout > 10000) {
        return res.status(400).json({
          success: false,
          error: 'Response timeout must be between 500 and 10000ms'
        })
      }
      updates.responseTimeout = responseTimeout
    }
    if (retryAttempts !== undefined) {
      if (retryAttempts < 1 || retryAttempts > 5) {
        return res.status(400).json({
          success: false,
          error: 'Retry attempts must be between 1 and 5'
        })
      }
      updates.retryAttempts = retryAttempts
    }
    // Remove fallbackToHttp - it's now automatic when UDP fails
    if (discoveryMethod !== undefined) {
      const validMethods = ['broadcast', 'network_scan']
      if (!validMethods.includes(discoveryMethod)) {
        return res.status(400).json({
          success: false,
          error: `Invalid discovery method. Valid options: ${validMethods.join(', ')}`
        })
      }
      updates.discoveryMethod = discoveryMethod
    }

    // Save network discovery settings to HealthConfig database
    const udpUpdates = {
      udp: {
        enabled: updates.udpEnabled,
        port: updates.udpPort, 
        broadcastAddress: updates.broadcastAddress,
        responseTimeout: updates.responseTimeout,
        retryAttempts: updates.retryAttempts,
        fallbackToHttp: true, // Always enable automatic fallback
        discoveryMethod: updates.discoveryMethod
      }
    }
    
    const updatedConfig = await HealthConfig.updateSingleton(udpUpdates, 'api-user')
    console.log('[NetworkSettings] UDP Discovery settings saved to database:', updatedConfig.udp)

    res.json({
      success: true,
      data: updatedConfig.udp,
      message: 'Network discovery settings updated successfully'
    })

  } catch (error: any) {
    console.error('[NetworkSettings] Error updating network settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update network settings',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/network-settings/discovery-mode - Update discovery mode
router.put('/network-settings/discovery-mode', async (req: Request, res: Response) => {
  try {
    const { discoveryMode } = req.body

    if (discoveryMode === undefined) {
      return res.status(400).json({
        success: false,
        error: 'discoveryMode field is required'
      })
    }

    const validModes = ['http', 'udp']
    if (!validModes.includes(discoveryMode)) {
      return res.status(400).json({
        success: false,
        error: `Invalid discovery mode. Valid options: ${validModes.join(', ')}`
      })
    }

    // Get config and update only the specific field using dot notation
    const config = await HealthConfig.getSingleton()

    await HealthConfig.findByIdAndUpdate(config._id, {
      $set: {
        'udp.enabled': discoveryMode === 'udp',
        lastUpdated: new Date(),
        updatedBy: 'api-user'
      }
    }, { new: true })

    res.json({
      success: true,
      data: { discoveryMode },
      message: 'Discovery mode updated successfully'
    })

  } catch (error: any) {
    console.error('[NetworkSettings] Error updating discovery mode:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update discovery mode',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/network-settings/broadcast-address - Update broadcast address
router.put('/network-settings/broadcast-address', async (req: Request, res: Response) => {
  try {
    const { broadcastAddress } = req.body

    if (broadcastAddress === undefined) {
      return res.status(400).json({
        success: false,
        error: 'broadcastAddress field is required'
      })
    }

    if (!broadcastAddress.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid broadcast address format'
      })
    }

    // Get config and update only the specific field using dot notation
    const config = await HealthConfig.getSingleton()

    await HealthConfig.findByIdAndUpdate(config._id, {
      $set: {
        'udp.broadcastAddress': broadcastAddress,
        lastUpdated: new Date(),
        updatedBy: 'api-user'
      }
    }, { new: true })

    res.json({
      success: true,
      data: { broadcastAddress },
      message: 'Broadcast address updated successfully'
    })

  } catch (error: any) {
    console.error('[NetworkSettings] Error updating broadcast address:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update broadcast address',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/network-settings/udp-port - Update UDP port
router.put('/network-settings/udp-port', async (req: Request, res: Response) => {
  try {
    const { udpPort } = req.body
    
    if (udpPort === undefined) {
      return res.status(400).json({
        success: false,
        error: 'udpPort field is required'
      })
    }
    
    if (udpPort < 1024 || udpPort > 65535) {
      return res.status(400).json({
        success: false,
        error: 'UDP port must be between 1024 and 65535'
      })
    }

    // Get current config to preserve existing UDP settings
    const currentConfig = await HealthConfig.getSingleton()
    
    const udpUpdates = {
      udp: {
        ...currentConfig.udp,
        port: udpPort
      }
    }
    
    await HealthConfig.updateSingleton(udpUpdates, 'api-user')
    
    res.json({
      success: true,
      data: { udpPort },
      message: 'UDP port updated successfully'
    })

  } catch (error: any) {
    console.error('[NetworkSettings] Error updating UDP port:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update UDP port',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/network-settings/response-timeout - Update response timeout
router.put('/network-settings/response-timeout', async (req: Request, res: Response) => {
  try {
    const { responseTimeout } = req.body
    
    if (responseTimeout === undefined) {
      return res.status(400).json({
        success: false,
        error: 'responseTimeout field is required'
      })
    }
    
    if (responseTimeout < 500 || responseTimeout > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Response timeout must be between 500 and 10000ms'
      })
    }

    // Get current config to preserve existing UDP settings
    const currentConfig = await HealthConfig.getSingleton()
    
    const udpUpdates = {
      udp: {
        ...currentConfig.udp,
        responseTimeout: responseTimeout
      }
    }
    
    await HealthConfig.updateSingleton(udpUpdates, 'api-user')
    
    res.json({
      success: true,
      data: { responseTimeout },
      message: 'Response timeout updated successfully'
    })

  } catch (error: any) {
    console.error('[NetworkSettings] Error updating response timeout:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update response timeout',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/network-settings/retry-attempts - Update retry attempts
router.put('/network-settings/retry-attempts', async (req: Request, res: Response) => {
  try {
    const { retryAttempts } = req.body
    
    if (retryAttempts === undefined) {
      return res.status(400).json({
        success: false,
        error: 'retryAttempts field is required'
      })
    }
    
    if (retryAttempts < 1 || retryAttempts > 5) {
      return res.status(400).json({
        success: false,
        error: 'Retry attempts must be between 1 and 5'
      })
    }

    // Get current config to preserve existing UDP settings
    const currentConfig = await HealthConfig.getSingleton()
    
    const udpUpdates = {
      udp: {
        ...currentConfig.udp,
        retryAttempts: retryAttempts
      }
    }
    
    await HealthConfig.updateSingleton(udpUpdates, 'api-user')
    
    res.json({
      success: true,
      data: { retryAttempts },
      message: 'Retry attempts updated successfully'
    })

  } catch (error: any) {
    console.error('[NetworkSettings] Error updating retry attempts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update retry attempts',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/network-settings/discovery-method - Update discovery method
router.put('/network-settings/discovery-method', async (req: Request, res: Response) => {
  try {
    const { discoveryMethod } = req.body

    console.log('🔍 [Discovery Method Update] Received request:', { discoveryMethod, body: req.body })

    if (discoveryMethod === undefined) {
      return res.status(400).json({
        success: false,
        error: 'discoveryMethod field is required'
      })
    }

    const validMethods = ['broadcast', 'network_scan']
    if (!validMethods.includes(discoveryMethod)) {
      return res.status(400).json({
        success: false,
        error: `Invalid discovery method. Valid options: ${validMethods.join(', ')}`
      })
    }

    // Get current config to preserve existing UDP settings
    const currentConfig = await HealthConfig.getSingleton()
    console.log('🔍 [Discovery Method Update] Current config discoveryMethod:', currentConfig.udp?.discoveryMethod)

    // Convert Mongoose subdocument to plain object to avoid spread issues
    const currentUdp = (currentConfig.udp as any)?.toObject ? (currentConfig.udp as any).toObject() : currentConfig.udp

    const udpUpdates = {
      udp: {
        ...currentUdp,
        discoveryMethod: discoveryMethod
      }
    }

    console.log('🔍 [Discovery Method Update] Updating with:', udpUpdates)
    await HealthConfig.updateSingleton(udpUpdates, 'api-user')

    const updatedConfig = await HealthConfig.getSingleton()
    console.log('🔍 [Discovery Method Update] After save discoveryMethod:', updatedConfig.udp?.discoveryMethod)

    res.json({
      success: true,
      data: { discoveryMethod },
      message: 'Discovery method updated successfully'
    })

  } catch (error: any) {
    console.error('[NetworkSettings] Error updating discovery method:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update discovery method',
      details: error.message
    })
  }
})

// POST /api/v1/devices/register - Device auto-registration endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      macAddress,
      ipAddress,
      deviceType,
      firmwareVersion,
      capabilities
    } = req.body

    // Validation
    if (!macAddress || !ipAddress || !deviceType) {
      return res.status(400).json({
        success: false,
        error: 'macAddress, ipAddress, and deviceType are required'
      })
    }

    // MAC address format validation
    if (!macAddress.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid MAC address format'
      })
    }

    // Check if controller already exists by MAC address
    let controller = await PhysicalController.findOne({ macAddress })

    if (controller) {
      // Update existing controller IP if changed
      if (controller.address !== ipAddress) {
        console.log(`[DeviceRegistration] Updating IP for ${macAddress}: ${controller.address} -> ${ipAddress}`)
        controller.address = ipAddress
        controller.lastSeen = new Date()
        await controller.save()
      }
    } else {
      // Create new controller
      controller = new PhysicalController({
        name: `Auto-discovered ${deviceType}`,
        type: deviceType,
        address: ipAddress,
        macAddress: macAddress,
        connectionType: 'http', // Will be enhanced in Phase 2
        status: 'online',
        lastSeen: new Date(),
        firmwareVersion: firmwareVersion || 'unknown'
      })
      await controller.save()
      console.log(`[DeviceRegistration] Registered new controller ${macAddress} at ${ipAddress}`)
    }

    res.json({
      success: true,
      data: {
        controllerId: controller._id,
        macAddress: controller.macAddress,
        ipAddress: controller.address,
        isNewDevice: !controller.lastSeen || controller.lastSeen.getTime() < Date.now() - 60000
      },
      message: 'Device registered successfully'
    })

  } catch (error: any) {
    console.error('[DeviceRegistration] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to register device',
      details: error.message
    })
  }
})

// GET /api/devices/:id - Get device by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('controllerId', 'name type connectionType address status')

    if (!device) {
      return res.status(404).json({ error: 'Device not found' })
    }

    res.json(device)
  } catch (error) {
    console.error('Error fetching device:', error)
    res.status(500).json({ error: 'Failed to fetch device' })
  }
})

// POST /api/devices - Create new device
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, physicalType, category, controllerId, connectionMethod, relayId, relayPort, ports, controlMode, description, settings, validationConfig, isActive, priority, icon, unit } = req.body

    // Debug: Log incoming request data
    console.log('[DeviceRoutes] POST /devices - Request body:', JSON.stringify(req.body, null, 2))

    // Validate controller exists
    const controller = await PhysicalController.findById(controllerId)
    if (!controller) {
      console.log('[DeviceRoutes] Controller not found:', controllerId)
      return res.status(400).json({ error: 'Controller not found' })
    }

    // Validate ports array - allow empty ports after user confirmation
    if (!ports || !Array.isArray(ports)) {
      console.log('[DeviceRoutes] Invalid ports array:', ports)
      return res.status(400).json({ error: 'Ports must be an array' })
    }

    // Check if any port is already used by another device on same controller
    console.log('[DeviceRoutes] DEBUG: Checking port occupation for ports:', ports)
    for (const port of ports) {
      // Skip empty ports
      if (!port || port.trim() === '') continue
      
      console.log('[DeviceRoutes] DEBUG: Checking if port', port, 'is occupied...')
      const existingDevice = await Device.findOne({ 
        controllerId, 
        ports: { $in: [port] }
      })
      console.log('[DeviceRoutes] DEBUG: Found existing device for port', port, ':', existingDevice ? `${existingDevice.name} (${existingDevice._id})` : 'NONE')
      
      if (existingDevice) {
        console.log('[DeviceRoutes] ERROR: Port', port, 'is already used by device:', existingDevice.name)
        return res.status(400).json({ error: `Port ${port} is already used on this controller` })
      }
    }
    console.log('[DeviceRoutes] DEBUG: All ports are available, proceeding with device creation...')

    // Clean ports array - remove empty strings
    const cleanedPorts = ports.filter((port: string) => port && port.trim() !== '')
    
    // Auto-deactivate device if no ports are configured
    const hasActivePorts = cleanedPorts.length > 0
    const shouldActivate = isActive !== undefined ? isActive : true
    const finalIsActive = hasActivePorts ? shouldActivate : false
    
    const device = new Device({
      name,
      type,
      physicalType,
      category,
      controllerId,
      connectionMethod,
      relayId: relayId && relayId.trim() !== '' ? relayId : undefined,
      relayPort: relayPort || undefined,
      ports: cleanedPorts,
      controlMode: controlMode || 'duration',
      description,
      settings: settings || {},
      validationConfig: validationConfig || undefined,
      isActive: finalIsActive,
      priority: priority || 'normal',
      icon: icon || undefined,
      unit: unit || undefined
    })

    console.log('[DeviceRoutes] DEBUG: Saving device to database...')
    const savedDevice = await device.save()
    console.log('[DeviceRoutes] DEBUG: Device saved successfully with ID:', savedDevice._id)
    
    // Update port occupation in controller
    console.log('[DeviceRoutes] DEBUG: Updating port occupation for controller:', controllerId, 'ports:', ports)
    try {
      await DevicePortService.updatePortOccupation(controllerId, ports)
      console.log('[DeviceRoutes] DEBUG: Port occupation updated successfully')
    } catch (portError) {
      console.error('[DeviceRoutes] ERROR: Failed to update port occupation:', portError)
      // ВАЖНО: Не rollback-ваме device, просто логваме грешката
      // Device ще работи, но port occupation може да е неточен в UI
      console.warn('[DeviceRoutes] WARNING: Device created but port occupation may be out of sync')
    }
    
    // If relay connection, occupy relay port
    if (connectionMethod === 'relay' && relayId && relayPort) {
      const relay = await Relay.findById(relayId)
      if (relay) {
        relay.occupyPort(relayPort, savedDevice._id.toString())
        await relay.save()
        console.log(`[DeviceRoutes] Occupied relay port ${relayPort} on relay ${relay.name}`)
      }
    }
    
    const populatedDevice = await Device.findById(savedDevice._id)
      .populate('controllerId', 'name type connectionType address status')

    res.status(201).json(populatedDevice)
  } catch (error: any) {
    console.error('Error creating device:', error)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to create device' })
  }
})

// PUT /api/devices/:id - Update device
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, type, controllerId, connectionMethod, relayId, relayPort, ports, controlMode, description, settings, validationConfig, isActive, priority, healthCheckEnabled, icon, unit } = req.body

    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ error: 'Device not found' })
    }

    const oldPorts = device.ports
    const oldControllerId = device.controllerId.toString()
    const oldConnectionMethod = device.connectionMethod
    const oldRelayId = device.relayId?.toString()
    const oldRelayPort = device.relayPort

    // If controller changed, validate
    if (controllerId && controllerId !== device.controllerId.toString()) {
      const controller = await PhysicalController.findById(controllerId)
      if (!controller) {
        return res.status(400).json({ error: 'Controller not found' })
      }
    }

    // If ports changed, validate they're not occupied
    if (ports && Array.isArray(ports)) {
      const newControllerId = controllerId || oldControllerId
      for (const port of ports) {
        if (!oldPorts.includes(port)) {
          const existingDevice = await Device.findOne({ 
            controllerId: newControllerId, 
            ports: { $in: [port] },
            _id: { $ne: req.params.id }
          })
          if (existingDevice) {
            return res.status(400).json({ error: `Port ${port} is already used on this controller` })
          }
        }
      }
    }

    // Clean and process update data
    const cleanedPorts = ports ? ports.filter((port: string) => port && port.trim() !== '') : undefined
    let cleanRelayId = relayId && relayId.trim() !== '' ? relayId : undefined
    let cleanRelayPort = relayPort || undefined
    let finalConnectionMethod = connectionMethod
    
    // Handle relay connection cleanup logic when relay port becomes null/empty
    if (device.connectionMethod === 'relay' && (relayPort === null || relayPort === undefined || relayPort === '')) {
      // Device was connected to relay but relay port is now empty - switch to direct connection
      finalConnectionMethod = 'direct'
      cleanRelayId = undefined
      cleanRelayPort = undefined
      console.log(`[DeviceRoutes] Device ${device.name} switched from relay to direct connection (relay port cleared)`)
    }
    
    // Force clear relay data when connection method is direct
    if (finalConnectionMethod === 'direct' || connectionMethod === 'direct') {
      cleanRelayId = null  // Force null in DB
      cleanRelayPort = null  // Force null in DB
      console.log(`[DeviceRoutes] Direct connection - clearing relay data for device ${device.name}`)
    }
    
    // Auto-deactivate if no ports configured (only if isActive is being set)
    let finalIsActive = isActive
    if (cleanedPorts !== undefined && cleanedPorts.length === 0 && isActive === true) {
      finalIsActive = false
    }

    // Calculate checkingEnabled based on final values
    const isCheckingEnabled = (finalIsActive !== undefined ? finalIsActive : device.isActive) && 
                             (healthCheckEnabled !== undefined ? healthCheckEnabled : device.healthCheckEnabled)

    const updatedDevice = await Device.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(controllerId !== undefined && { controllerId }),
        ...(finalConnectionMethod && { connectionMethod: finalConnectionMethod }),
        relayId: cleanRelayId,
        relayPort: cleanRelayPort,
        ...(cleanedPorts !== undefined && { ports: cleanedPorts }),
        ...(controlMode !== undefined && { controlMode }),
        ...(description !== undefined && { description }),
        ...(settings !== undefined && { settings }),
        ...(validationConfig !== undefined && { validationConfig }),
        ...(finalIsActive !== undefined && { isActive: finalIsActive }),
        ...(priority !== undefined && { priority }),
        ...(healthCheckEnabled !== undefined && { healthCheckEnabled }),
        ...(icon !== undefined && { icon }),
        ...(unit !== undefined && { unit }),
        checkingEnabled: isCheckingEnabled
      },
      { new: true, runValidators: true }
    ).populate('controllerId', 'name type connectionType address status')

    // Update port occupation if ports changed
    if (ports !== undefined) {
      const newControllerId = controllerId || oldControllerId
      await DevicePortService.updatePortOccupation(newControllerId, ports, oldPorts)
    }
    
    // Handle relay port changes - release old relay port if needed
    if (oldConnectionMethod === 'relay' && oldRelayId && oldRelayPort) {
      // Release old relay port (either switching to direct or changing relay)
      const oldRelay = await Relay.findById(oldRelayId)
      if (oldRelay) {
        oldRelay.releasePort(oldRelayPort)
        await oldRelay.save()
        console.log(`[DeviceRoutes] Released old relay port ${oldRelayPort} on relay ${oldRelay.name}`)
      }
    }
    
    // Occupy new relay port only if final connection method is still relay
    if (finalConnectionMethod === 'relay' && cleanRelayId && cleanRelayPort) {
      const newRelay = await Relay.findById(cleanRelayId)
      if (newRelay) {
        newRelay.occupyPort(cleanRelayPort, req.params.id)
        await newRelay.save()
        console.log(`[DeviceRoutes] Occupied relay port ${cleanRelayPort} on relay ${newRelay.name}`)
      }
    }

    res.json(updatedDevice)
  } catch (error: any) {
    console.error('Error updating device:', error)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to update device' })
  }
})

// DELETE /api/devices/:id - Delete device
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    console.log(`[DeviceRoutes] DELETE request for device ID: ${req.params.id}`)
    const device = await Device.findById(req.params.id)
    console.log(`[DeviceRoutes] DEBUG: Device found:`, device ? `${device.name} (${device.type})` : 'NONE')
    
    if (!device) {
      console.log(`[DeviceRoutes] ERROR: Device with ID ${req.params.id} not found in database`)
      return res.status(404).json({ error: 'Device not found' })
    }

    const controllerId = device.controllerId.toString()
    const ports = device.ports
    
    // Release relay port if device uses relay connection
    if (device.connectionMethod === 'relay' && device.relayId && device.relayPort) {
      const relay = await Relay.findById(device.relayId)
      if (relay) {
        relay.releasePort(device.relayPort)
        await relay.save()
        console.log(`[DeviceRoutes] Released relay port ${device.relayPort} on relay ${relay.name}`)
      }
    }

    await Device.findByIdAndDelete(req.params.id)
    
    // Free the ports in controller
    await DevicePortService.freePorts(controllerId, ports)

    res.json({ message: 'Device deleted successfully', device })
  } catch (error) {
    console.error('Error deleting device:', error)
    res.status(500).json({ error: 'Failed to delete device' })
  }
})

// POST /api/devices/:id/test - Test device functionality
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const { testType, parameters } = req.body
    const deviceId = req.params.id

    // Get device with populated controller
    const device = await Device.findById(deviceId)
      .populate('controllerId', 'name type connectionType address status')

    if (!device) {
      return res.status(404).json({ 
        success: false, 
        error: 'Device not found' 
      })
    }

    // Check if controller is online
    const controller = device.controllerId as any
    if (!controller || controller.status !== 'online') {
      return res.status(400).json({
        success: false,
        error: 'Controller is not online or not found'
      })
    }

    // Get device template for command configuration
    const template = await DeviceTemplate.findOne({ type: device.type })
    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Device template not found'
      })
    }

    // Prepare command based on device type and test type
    let command: any = {}
    let expectedResponse = 'OK'

    switch (testType) {
      case 'quick_reading':
        // For sensors - take a quick analog reading
        if (device.category === 'sensor') {
          command = {
            command: 'ANALOG',
            pin: device.ports[0], // Primary port
            ...parameters
          }
          expectedResponse = 'ANALOG_RESULT'
        } else {
          return res.status(400).json({
            success: false,
            error: 'Quick reading test only available for sensors'
          })
        }
        break

      case 'pulse_measure':
        // For pH/EC sensors using PULSE_MEASURE
        if (device.type.includes('ph_sensor') || device.type.includes('ec_sensor')) {
          command = {
            command: 'PULSE_MEASURE',
            pin: device.ports[0],
            duration: parameters?.duration || 1000,
            samples: parameters?.samples || 10,
            ...parameters
          }
          expectedResponse = 'PULSE_RESULT'
        } else {
          return res.status(400).json({
            success: false,
            error: 'Pulse measure test only available for pH/EC sensors'
          })
        }
        break

      case 'actuator_toggle':
        // For actuators - toggle on/off
        if (device.category === 'actuator') {
          command = {
            command: 'DIGITAL_WRITE',
            pin: device.ports[0],
            value: parameters?.state === 'on' ? 1 : 0,
            duration: parameters?.duration || 2000
          }
          expectedResponse = 'DIGITAL_WRITE_OK'
        } else {
          return res.status(400).json({
            success: false,
            error: 'Actuator toggle test only available for actuators'
          })
        }
        break

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid test type. Supported: quick_reading, pulse_measure, actuator_toggle'
        })
    }

    // Send command via StartupService
    console.log(`[DeviceTest] Testing device ${device.name} via ${controller.name}`)
    
    try {
      let result: any = {}
      
      // Use appropriate StartupService method based on test type
      switch (testType) {
        case 'quick_reading':
        case 'pulse_measure':
          // For sensor readings - send template-based command via StartupService
          const sensorCommand: any = {
            deviceId: deviceId,
            duration: parameters?.duration || 1000
          }

          console.log(`[DeviceTest] DEBUG: Sending command to StartupService for ${device.type}`)
          console.log(`[DeviceTest] DEBUG: Device info - Type: ${device.type}, Ports: [${device.ports.join(', ')}]`)

          const readResponse = await startupService.sendCommand(controller._id.toString(), sensorCommand)
          
          console.log(`[DeviceTest] DEBUG: StartupService response:`, readResponse)
          
          if (readResponse.ok !== 1) {
            throw new Error(readResponse.error || 'Sensor reading failed')
          }
          
          // Extract converted value from modern conversion system
          // StartupService applies appropriate Converter and returns converted values in readResponse.value
          const convertedValue = readResponse.value || 0
          const unit = readResponse.data?.unit || 'pH'

          // Extract raw value based on sensor type (from Arduino response)
          let rawValue = convertedValue // fallback
          if (readResponse.data?.rawResponse) {
            const arduinoResponse = readResponse.data.rawResponse
            // For ultrasonic sensors (HC-SR04) and pulse-based sensors (pH, EC) - use duration (µs)
            if (arduinoResponse.duration !== undefined) {
              rawValue = arduinoResponse.duration
            }
            // For flow sensors - use pulse count
            else if (arduinoResponse.pulseCount !== undefined) {
              rawValue = arduinoResponse.pulseCount
            }
            // For distance sensors (UART) and light sensors (Modbus) - use rawValue from converter
            else if (readResponse.data?.rawValue !== undefined &&
                     (device.physicalType === 'distance' || device.physicalType === 'light')) {
              rawValue = readResponse.data.rawValue
            }
            // For ADC-based sensors (soil moisture, etc.) - use adc value
            else if (arduinoResponse.adc !== undefined) {
              rawValue = arduinoResponse.adc
            }
            // For voltage-based sensors
            else if (arduinoResponse.volt !== undefined) {
              rawValue = arduinoResponse.volt
            }
            // For digital protocol sensors (DHT22, DS18B20) - use data field (already processed by converter)
            else if (arduinoResponse.data !== undefined && typeof arduinoResponse.data === 'number') {
              rawValue = arduinoResponse.data
            }
          }

          const voltage = readResponse.data?.rawResponse?.volt || null
          const adc = readResponse.data?.rawResponse?.adc || null

          result = {
            success: true,
            value: convertedValue,
            unit: unit,
            rawValue: rawValue,
            voltage: voltage,
            adc: adc,
            timestamp: new Date(),
            rawResponse: readResponse
          }
          break
          
        case 'actuator_toggle':
          // For actuator control using StartupService
          const controlResponse = await startupService.sendCommand(controller._id.toString(), {
            cmd: 'CONTROL_ACTUATOR',
            deviceId: deviceId,
            actionType: parameters?.state === 'on' ? 'on' : 'off',
            duration: parameters?.duration || 0
          })
          
          if (controlResponse.ok !== 1) {
            throw new Error(controlResponse.error || 'Actuator control failed')
          }
          
          result = {
            success: true,
            action: parameters?.state === 'on' ? 'turned_on' : 'turned_off',
            timestamp: new Date(),
            rawResponse: controlResponse
          }
          break
          
        default:
          throw new Error('Unsupported test type')
      }
      
      // Update device last reading value and timestamp
      await Device.findByIdAndUpdate(deviceId, {
        lastReading: result.success && result.value !== undefined ? result.value : null,
        lastError: null
      })

      res.json({
        success: true,
        data: {
          testType,
          command,
          result,
          timestamp: new Date(),
          deviceId,
          controllerName: controller.name
        }
      })

    } catch (commandError: any) {
      console.error('[DeviceTest] Command execution failed:', commandError)
      
      // Update device with error
      await Device.findByIdAndUpdate(deviceId, {
        lastError: commandError.message || 'Test command failed'
      })

      res.status(500).json({
        success: false,
        error: 'Test command failed',
        details: commandError.message
      })
    }

  } catch (error: any) {
    console.error('[DeviceTest] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to execute device test'
    })
  }
})

// POST /api/devices/:id/calibrate - Save dynamic calibration data (V2 - supports custom points)
router.post('/:id/calibrate', async (req: Request, res: Response) => {
  try {
    const { calibrationType, points, settings } = req.body
    const deviceId = req.params.id

    console.log(`[DeviceCalibration] V2 Dynamic calibration request for device ${deviceId}:`, {
      calibrationType,
      pointsCount: points?.length,
      settings,
      rawPoints: JSON.stringify(points, null, 2)
    })

    // Get device with populated controller
    const device = await Device.findById(deviceId)
      .populate('controllerId', 'name type connectionType address status')

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      })
    }

    // Verify device template exists (but calibrationConfig is optional - BaseSensorCalibration.vue handles it dynamically)
    const template = await DeviceTemplate.findOne({ type: device.type })
    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Device template not found'
      })
    }

    // Initialize device settings if not exists
    if (!device.settings) {
      device.settings = {}
    }
    if (!device.settings.calibration) {
      device.settings.calibration = {
        points: [],
        lastCalibrated: null,
        isCalibrated: false,
        method: 'linear',
        temperatureCompensation: false
      }
    }

    // Validate calibration type
    if (calibrationType !== 'dynamic') {
      return res.status(400).json({
        success: false,
        error: 'Only dynamic calibration type is supported in V2'
      })
    }

    // Validate points array - allow empty array (will use default calibration)
    if (!Array.isArray(points)) {
      return res.status(400).json({
        success: false,
        error: 'Calibration points must be an array'
      })
    }

    // Validate each calibration point based on sensor type
    console.log(`[DeviceCalibration] Starting validation for ${points.length} points`)
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      console.log(`[DeviceCalibration] Validating point ${i}:`, JSON.stringify(point, null, 2))
      
      if (!point.id) {
        console.log(`[DeviceCalibration] Point ${i} failed: missing id`)
        return res.status(400).json({
          success: false,
          error: `Invalid calibration point at index ${i}: requires id`
        })
      }
      
      // Universal validation - accept both old format and new universal format
      const hasUniversalFormat = typeof point.targetValue === 'number' && typeof point.measuredValue === 'number'
      const hasLegacyFormat = (device.physicalType === 'ultrasonic' && typeof point.targetDistance === 'number') ||
                             (device.physicalType === 'soil_moisture' && typeof point.targetMoisture === 'number') ||
                             (['ph', 'ec'].includes(device.physicalType) && (point.solutionPH || point.solutionEC))
      
      console.log(`[DeviceCalibration] Point ${i} validation:`, {
        hasUniversalFormat,
        hasLegacyFormat,
        targetValueType: typeof point.targetValue,
        measuredValueType: typeof point.measuredValue,
        devicePhysicalType: device.physicalType
      })
      
      if (!hasUniversalFormat && !hasLegacyFormat) {
        console.log(`[DeviceCalibration] Point ${i} failed validation`)
        return res.status(400).json({
          success: false,
          error: `Invalid calibration point at index ${i}: requires id, targetValue (number), and measuredValue (number)`
        })
      }
      
      console.log(`[DeviceCalibration] Point ${i} validation passed`)
      
      // Convert universal format to legacy format internally if needed
      if (hasUniversalFormat && !hasLegacyFormat) {
        if (device.physicalType === 'ultrasonic') {
          point.targetDistance = point.targetValue
          point.measuredDistance = point.measuredValue
        } else if (device.physicalType === 'soil_moisture') {
          point.targetMoisture = point.targetValue
          point.measuredMoisture = point.measuredValue
        } else if (device.physicalType === 'ph') {
          point.solutionPH = point.targetValue
          point.measuredADC = point.measuredValue
        } else if (device.physicalType === 'ec') {
          point.solutionEC = point.targetValue
          point.measuredADC = point.measuredValue
        }
      }
      
      // Validate range based on sensor type - check both universal and sensor-specific formats
      if (device.physicalType === 'ultrasonic') {
        // UltraSonic sensor validation - use targetValue if available, otherwise targetDistance
        const targetVal = point.targetValue !== undefined ? point.targetValue : point.targetDistance
        if (targetVal < 0 || targetVal > 400) {
          return res.status(400).json({
            success: false,
            error: `Invalid target distance at point ${i}: must be between 0 and 400 cm`
          })
        }
        if (point.pulseDuration !== undefined && (point.pulseDuration < 0 || point.pulseDuration > 25000)) {
          return res.status(400).json({
            success: false,
            error: `Invalid pulse duration at point ${i}: must be between 0 and 25000 μs`
          })
        }
        const measuredVal = point.measuredValue !== undefined ? point.measuredValue : point.measuredDistance
        if (measuredVal !== undefined && (measuredVal < 0 || measuredVal > 25000)) {
          return res.status(400).json({
            success: false,
            error: `Invalid measured duration at point ${i}: must be between 0 and 25000 µs`
          })
        }
      } else if (device.physicalType === 'soil_moisture') {
        // SoilMoisture sensor validation - use targetValue if available, otherwise targetMoisture
        const targetVal = point.targetValue !== undefined ? point.targetValue : point.targetMoisture
        if (targetVal < 0 || targetVal > 100) {
          return res.status(400).json({
            success: false,
            error: `Invalid target moisture at point ${i}: must be between 0 and 100%`
          })
        }
        const measuredVal = point.measuredValue !== undefined ? point.measuredValue : point.measuredMoisture
        if (measuredVal < 0 || measuredVal > 100) {
          return res.status(400).json({
            success: false,
            error: `Invalid measured moisture at point ${i}: must be between 0 and 100%`
          })
        }
        if (point.adcValue !== undefined && (point.adcValue < 0 || point.adcValue > 1023)) {
          return res.status(400).json({
            success: false,
            error: `Invalid ADC value at point ${i}: must be between 0 and 1023`
          })
        }
      } else {
        // pH/EC sensor validation - use targetValue if available, otherwise sensor-specific properties
        if (device.physicalType === 'ph') {
          const targetVal = point.targetValue !== undefined ? point.targetValue : point.solutionPH
          if (targetVal !== undefined && (targetVal < 0 || targetVal > 14)) {
            return res.status(400).json({
              success: false,
              error: `Invalid pH value at point ${i}: must be between 0 and 14`
            })
          }
        } else if (device.physicalType === 'ec') {
          const targetVal = point.targetValue !== undefined ? point.targetValue : point.solutionEC
          if (targetVal !== undefined && (targetVal < 0 || targetVal > 50000)) {
            return res.status(400).json({
              success: false,
              error: `Invalid EC value at point ${i}: must be between 0 and 50000 μS/cm`
            })
          }
        }
        
        // For pH/EC measured value can be either measuredValue (universal) or measuredADC (legacy)
        const measuredVal = point.measuredValue !== undefined ? point.measuredValue : point.measuredADC
        if (measuredVal < 0 || measuredVal > 1023) {
          return res.status(400).json({
            success: false,
            error: `Invalid ADC value at point ${i}: must be between 0 and 1023`
          })
        }
      }
    }

    // Prepare calibration data
    console.log(`[DeviceCalibration] Preparing calibration data for device type: ${device.physicalType}`)
    
    // Determine recordedVoltage: keep existing if points exist, otherwise use current referenceVoltage
    let recordedVoltage = req.body.referenceVoltage || 5.0
    if (device.settings?.calibration?.recordedVoltage && device.settings.calibration.points?.length > 0) {
      // Keep existing recordedVoltage if there are already calibration points
      recordedVoltage = device.settings.calibration.recordedVoltage
      console.log(`[DeviceCalibration] Preserving existing recordedVoltage: ${recordedVoltage}V`)
    } else {
      console.log(`[DeviceCalibration] Setting new recordedVoltage: ${recordedVoltage}V`)
    }
    
    const calibrationData: any = {
      points: points.map((point: any, index: number) => {
        const mappedPoint = {
          id: point.id,
          targetValue: parseFloat(point.targetValue),
          measuredValue: parseFloat(point.measuredValue),
          timestamp: point.timestamp ? new Date(point.timestamp) : new Date()
        }
        console.log(`[DeviceCalibration] Mapped point ${index}:`, JSON.stringify(mappedPoint, null, 2))
        return mappedPoint
      }),
      method: req.body.method || 'offset',
      referenceVoltage: req.body.referenceVoltage || 5.0,
      recordedVoltage: recordedVoltage,
      lastCalibrated: new Date(),
      isCalibrated: points.length > 0
    }

    console.log(`[DeviceCalibration] Calibration data prepared with ${calibrationData.points.length} points using ${calibrationData.method} method`)

    console.log(`[DeviceCalibration] Final calibration data to save:`, JSON.stringify(calibrationData, null, 2))

    // Update ONLY the calibration settings without overwriting other device data
    const updateResult = await Device.findByIdAndUpdate(deviceId, {
      $set: {
        'settings.calibration': calibrationData
      }
    }, { new: true })
    
    console.log(`[DeviceCalibration] Database update result:`, {
      success: !!updateResult,
      pointsCountSaved: updateResult?.settings?.calibration?.points?.length || 0,
      isCalibrated: updateResult?.settings?.calibration?.isCalibrated
    })

    console.log(`[DeviceCalibration] Successfully saved dynamic calibration for ${device.name} with ${points.length} points`)

    res.json({
      success: true,
      data: {
        deviceId,
        calibrationType: 'dynamic',
        pointsCount: calibrationData.points.length,
        method: calibrationData.method,
        temperatureCompensation: calibrationData.temperatureCompensation,
        isCalibrated: calibrationData.isCalibrated,
        lastCalibrated: calibrationData.lastCalibrated,
        slope: calibrationData.slope,
        offset: calibrationData.offset,
        rSquared: calibrationData.rSquared,
        timestamp: new Date()
      }
    })

  } catch (error: any) {
    console.error('[DeviceCalibration] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to save calibration data',
      details: error.message
    })
  }
})

// Helper function to calculate R-squared for linear regression
function calculateRSquared(points: any[], slope: number, offset: number): number {
  let ssRes = 0  // Sum of squares of residuals
  let ssTot = 0  // Total sum of squares
  const meanY = points.reduce((sum, p) => sum + (p.solutionPH || p.solutionEC || 0), 0) / points.length
  
  points.forEach(point => {
    const predicted = slope * point.measuredADC + offset
    const actualValue = point.solutionPH || point.solutionEC || 0
    ssRes += Math.pow(actualValue - predicted, 2)
    ssTot += Math.pow(actualValue - meanY, 2)
  })
  
  return ssTot === 0 ? 1 : (1 - (ssRes / ssTot))
}

// PUT /api/devices/:id/settings - Update device settings (calibration parameters)
router.put('/:id/settings', async (req: Request, res: Response) => {
  try {
    const { settings } = req.body
    const deviceId = req.params.id

    const device = await Device.findById(deviceId)
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      })
    }

    // Get device template for validation
    const template = await DeviceTemplate.findOne({ type: device.type })
    if (!template || !template.calibrationConfig) {
      return res.status(400).json({
        success: false,
        error: 'Device does not support settings configuration'
      })
    }

    // Validate settings against template parameters
    if (settings && typeof settings === 'object') {
      
      // For calibration parameters validation
      if (settings.calibration && template.calibrationConfig?.parametersToCalibrate) {
        const validParams = template.calibrationConfig.parametersToCalibrate.map(p => p.name)
        
        Object.keys(settings.calibration).forEach(paramName => {
          if (!['points', 'lastCalibrated', 'isCalibrated', 'slope', 'offset'].includes(paramName)) {
            const param = template.calibrationConfig?.parametersToCalibrate?.find(p => p.name === paramName)
            if (!param) {
              throw new Error(`Invalid calibration parameter: ${paramName}`)
            }
            
            // Validate parameter type and range
            const value = settings.calibration[paramName]
            if (param.type === 'number' && typeof value !== 'number') {
              throw new Error(`Parameter ${paramName} must be a number`)
            }
            if (param.min !== undefined && value < param.min) {
              throw new Error(`Parameter ${paramName} must be >= ${param.min}`)
            }
            if (param.max !== undefined && value > param.max) {
              throw new Error(`Parameter ${paramName} must be <= ${param.max}`)
            }
          }
        })
      }

      // Merge new settings with existing ones
      device.settings = {
        ...device.settings,
        ...settings
      }

      await device.save()

      console.log(`[DeviceSettings] Updated settings for ${device.name}`)

      res.json({
        success: true,
        data: {
          deviceId,
          settings: device.settings,
          timestamp: new Date()
        }
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid settings format'
      })
    }

  } catch (error: any) {
    console.error('[DeviceSettings] Error:', error)
    
    if (error.message.includes('Invalid') || error.message.includes('must be')) {
      res.status(400).json({
        success: false,
        error: error.message
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update device settings'
      })
    }
  }
})

// PUT /api/devices/:id/relay-settings - Update relay/pump device settings
router.put('/:id/relay-settings', async (req: Request, res: Response) => {
  try {
    const { flowRate, defaultState, safetyTimeout } = req.body
    const deviceId = req.params.id

    const device = await Device.findById(deviceId)
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      })
    }

    // Verify this is a relay-type device
    const relayTypes = ['relay', 'pumps', 'water_pump', 'solenoid_valve']
    if (!relayTypes.includes(device.type)) {
      return res.status(400).json({
        success: false,
        error: 'Device type does not support relay settings'
      })
    }

    // Validate and update relay settings
    const updates: any = {}

    if (flowRate !== undefined) {
      if (typeof flowRate !== 'number' || flowRate < 0.1 || flowRate > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Flow rate must be a number between 0.1 and 1000 л/мин'
        })
      }
      updates.flowRate = flowRate
    }

    if (defaultState !== undefined) {
      if (!['LOW', 'HIGH'].includes(defaultState)) {
        return res.status(400).json({
          success: false,
          error: 'Default state must be "LOW" or "HIGH"'
        })
      }
      // Map Default ON State to relayLogic
      updates.relayLogic = defaultState === 'LOW' ? 'active_low' : 'active_high'
    }

    if (safetyTimeout !== undefined) {
      if (typeof safetyTimeout !== 'number' || safetyTimeout < 1 || safetyTimeout > 300) {
        return res.status(400).json({
          success: false,
          error: 'Safety timeout must be a number between 1 and 300 seconds'
        })
      }
      updates.safetyTimeout = safetyTimeout
    }

    // Apply updates to device
    Object.assign(device, updates)
    await device.save()

    console.log(`[RelaySettings] Updated relay settings for ${device.name}:`, updates)

    res.json({
      success: true,
      data: {
        deviceId,
        flowRate: device.flowRate,
        defaultState: device.relayLogic === 'active_low' ? 'LOW' : 'HIGH',
        safetyTimeout: device.safetyTimeout,
        timestamp: new Date()
      },
      message: 'Relay settings updated successfully'
    })

  } catch (error: any) {
    console.error('[RelaySettings] Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update relay settings'
    })
  }
})

/**
 * HARDWARE HEALTH MONITORING ENDPOINTS
 */

// GET /api/v1/devices/health/status - Get overall hardware health status
router.get('/health/status', async (req: Request, res: Response) => {
  try {
    const schedulerService = SchedulerService.getInstance()
    const healthStatus = await schedulerService.getHealthCheckStatus()
    
    res.json({
      success: true,
      data: healthStatus,
      message: 'Hardware health status retrieved successfully'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error getting health status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get hardware health status',
      details: error.message
    })
  }
})

// POST /api/v1/devices/health/check - Manual hardware health check
router.post('/health/check', async (req: Request, res: Response) => {
  try {
    const { fullCheck = false } = req.body
    
    const schedulerService = SchedulerService.getInstance()
    const result = await schedulerService.runManualHealthCheck(fullCheck)
    
    res.status(result.success ? 200 : 500).json(result)

  } catch (error: any) {
    console.error('[DeviceHealth] Error running manual health check:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to run hardware health check',
      details: error.message
    })
  }
})

// POST /api/v1/devices/health/validate-flow - Validate devices for flow execution  
router.post('/health/validate-flow', async (req: Request, res: Response) => {
  try {
    const { flowData } = req.body
    
    if (!flowData) {
      return res.status(400).json({
        success: false,
        error: 'flowData is required'
      })
    }

    const hardwareHealthChecker = HardwareHealthChecker.getInstance()
    const validationResult = await hardwareHealthChecker.validateFlowDevices(flowData)
    
    res.json({
      success: true,
      data: validationResult,
      message: validationResult.canExecute ? 'Flow validation passed' : 'Flow validation failed'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error validating flow devices:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to validate flow devices',
      details: error.message
    })
  }
})

// GET /api/v1/devices/controllers/discovery-methods - Get all controllers with discovery methods
router.get('/controllers/discovery-methods', async (req: Request, res: Response) => {
  try {
    const controllers = await PhysicalController.find({ isActive: true })
      .select('name discoveryMethod status lastSeen responseTime healthStatus')
      .lean()
    
    const controllerData = controllers.map(controller => ({
      id: controller._id,
      name: controller.name,
      discoveryMethod: controller.discoveryMethod || 'hybrid',
      status: controller.status,
      responseTime: controller.lastResponseTime || 0,
      lastSeen: controller.lastSeen
    }))
    
    res.json({
      success: true,
      data: controllerData,
      message: 'Controllers with discovery methods retrieved successfully'
    })
    
  } catch (error: any) {
    console.error('[ControllerDiscovery] Error getting controllers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get controllers',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/controllers/:id/discovery-method - Update controller discovery method
router.put('/controllers/:id/discovery-method', async (req: Request, res: Response) => {
  try {
    const { discoveryMethod } = req.body
    const controllerId = req.params.id
    
    console.log(`[ControllerDiscovery] PUT request for controller ${controllerId}:`, { discoveryMethod, bodyRaw: req.body })
    
    // Validate discovery method
    const validMethods = ['udp', 'http', 'hybrid', 'serial', 'manual']
    if (!validMethods.includes(discoveryMethod)) {
      console.error(`[ControllerDiscovery] Invalid discovery method received: "${discoveryMethod}" (type: ${typeof discoveryMethod})`)
      return res.status(400).json({
        success: false,
        error: `Invalid discovery method. Valid options: ${validMethods.join(', ')}`
      })
    }
    
    // Update controller
    const controller = await PhysicalController.findByIdAndUpdate(
      controllerId,
      { 
        discoveryMethod,
        lastSeen: new Date() 
      },
      { new: true, runValidators: true }
    )
    
    if (!controller) {
      return res.status(404).json({
        success: false,
        error: 'Controller not found'
      })
    }
    
    console.log(`[ControllerDiscovery] Updated discovery method for ${controller.name}: ${discoveryMethod}`)
    
    res.json({
      success: true,
      data: {
        controllerId: controller._id,
        name: controller.name,
        discoveryMethod: controller.discoveryMethod,
        status: controller.status
      },
      message: 'Controller discovery method updated successfully'
    })
    
  } catch (error: any) {
    console.error('[ControllerDiscovery] Error updating discovery method:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update controller discovery method',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/health/configure - Configure health check settings
router.put('/health/configure', async (req: Request, res: Response) => {
  try {
    const {
      enabled,
      checkControllers,
      checkSensors,
      checkIntervalMinutes,
      failureThreshold,
      timeoutMs,
      quickPingTimeout,
      fullTestTimeout,
      maxConcurrentChecks,
      systemLoadThreshold,
      skipDuringExecution,
      enableNotifications,
      notificationCooldown,
      enableDetailedLogging
    } = req.body
    
    // Validate required fields
    const updates: any = {}
    
    if (enabled !== undefined) updates.enabled = enabled
    if (checkControllers !== undefined) updates.checkControllers = checkControllers
    if (checkSensors !== undefined) updates.checkSensors = checkSensors
    if (checkIntervalMinutes !== undefined) {
      if (checkIntervalMinutes < 1 || checkIntervalMinutes > 60) {
        return res.status(400).json({
          success: false,
          error: 'checkIntervalMinutes must be between 1 and 60'
        })
      }
      updates.checkIntervalMinutes = checkIntervalMinutes
    }
    if (failureThreshold !== undefined) {
      if (failureThreshold < 1 || failureThreshold > 10) {
        return res.status(400).json({
          success: false,
          error: 'failureThreshold must be between 1 and 10'
        })
      }
      updates.failureThreshold = failureThreshold
    }
    if (timeoutMs !== undefined) {
      if (timeoutMs < 1000 || timeoutMs > 30000) {
        return res.status(400).json({
          success: false,
          error: 'timeoutMs must be between 1000 and 30000'
        })
      }
      updates.timeoutMs = timeoutMs
    }
    if (quickPingTimeout !== undefined) updates.quickPingTimeout = quickPingTimeout
    if (fullTestTimeout !== undefined) updates.fullTestTimeout = fullTestTimeout
    if (maxConcurrentChecks !== undefined) updates.maxConcurrentChecks = maxConcurrentChecks
    if (systemLoadThreshold !== undefined) updates.systemLoadThreshold = systemLoadThreshold
    if (skipDuringExecution !== undefined) updates.skipDuringExecution = skipDuringExecution
    if (enableNotifications !== undefined) updates.enableNotifications = enableNotifications
    if (notificationCooldown !== undefined) updates.notificationCooldown = notificationCooldown
    if (enableDetailedLogging !== undefined) updates.enableDetailedLogging = enableDetailedLogging
    
    const schedulerService = SchedulerService.getInstance()
    const result = await schedulerService.configureHealthCheck(updates, 'api-user')
    
    res.json(result)

  } catch (error: any) {
    console.error('[DeviceHealth] Error configuring health check:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to configure health check',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/health/configure/enabled - Update health monitoring enabled status
router.put('/health/configure/enabled', async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body
    
    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'enabled field is required'
      })
    }

    const schedulerService = SchedulerService.getInstance()
    await schedulerService.configureHealthCheck({ enabled }, 'api-user')
    
    res.json({
      success: true,
      data: { enabled },
      message: 'Enabled status updated successfully'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error updating enabled status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update enabled status',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/health/configure/check-controllers - Update controller checking status
router.put('/health/configure/check-controllers', async (req: Request, res: Response) => {
  try {
    const { checkControllers } = req.body
    
    if (checkControllers === undefined) {
      return res.status(400).json({
        success: false,
        error: 'checkControllers field is required'
      })
    }

    const schedulerService = SchedulerService.getInstance()
    await schedulerService.configureHealthCheck({ checkControllers }, 'api-user')
    
    res.json({
      success: true,
      data: { checkControllers },
      message: 'Check controllers updated successfully'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error updating check controllers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update check controllers',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/health/configure/check-sensors - Update sensor checking status
router.put('/health/configure/check-sensors', async (req: Request, res: Response) => {
  try {
    const { checkSensors } = req.body
    
    if (checkSensors === undefined) {
      return res.status(400).json({
        success: false,
        error: 'checkSensors field is required'
      })
    }

    const schedulerService = SchedulerService.getInstance()
    await schedulerService.configureHealthCheck({ checkSensors }, 'api-user')
    
    res.json({
      success: true,
      data: { checkSensors },
      message: 'Check sensors updated successfully'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error updating check sensors:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update check sensors',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/health/configure/check-interval - Update health check interval
router.put('/health/configure/check-interval', async (req: Request, res: Response) => {
  try {
    const { checkIntervalMinutes } = req.body
    
    if (checkIntervalMinutes === undefined) {
      return res.status(400).json({
        success: false,
        error: 'checkIntervalMinutes field is required'
      })
    }
    
    if (checkIntervalMinutes < 1 || checkIntervalMinutes > 60) {
      return res.status(400).json({
        success: false,
        error: 'checkIntervalMinutes must be between 1 and 60'
      })
    }

    const schedulerService = SchedulerService.getInstance()
    await schedulerService.configureHealthCheck({ checkIntervalMinutes }, 'api-user')
    
    res.json({
      success: true,
      data: { checkIntervalMinutes },
      message: 'Check interval updated successfully'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error updating check interval:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update check interval',
      details: error.message
    })
  }
})

// PUT /api/v1/devices/health/configure/failure-threshold - Update failure threshold
router.put('/health/configure/failure-threshold', async (req: Request, res: Response) => {
  try {
    const { failureThreshold } = req.body
    
    if (failureThreshold === undefined) {
      return res.status(400).json({
        success: false,
        error: 'failureThreshold field is required'
      })
    }
    
    if (failureThreshold < 1 || failureThreshold > 10) {
      return res.status(400).json({
        success: false,
        error: 'failureThreshold must be between 1 and 10'
      })
    }

    const schedulerService = SchedulerService.getInstance()
    await schedulerService.configureHealthCheck({ failureThreshold }, 'api-user')
    
    res.json({
      success: true,
      data: { failureThreshold },
      message: 'Failure threshold updated successfully'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error updating failure threshold:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update failure threshold',
      details: error.message
    })
  }
})


// POST /api/v1/devices/health/sync - Read-only refresh of UI data from database
router.post('/health/sync', async (req: Request, res: Response) => {
  try {
    // This is now a read-only operation - no database changes
    // Just return success so frontend refreshes its data from database
    console.log('[DeviceHealth] UI health status refresh requested (read-only)')
    
    res.json({
      success: true,
      message: 'Health statuses refreshed from database successfully'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error refreshing health statuses:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to refresh health statuses',
      details: error.message
    })
  }
})

// GET /api/v1/devices/:id/health - Get health status for specific device
router.get('/:id/health', async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.id
    
    const device = await Device.findById(deviceId)
      .populate('controllerId', 'name status healthStatus lastHealthCheck')
      
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      })
    }

    const controller = device.controllerId as any
    
    res.json({
      success: true,
      data: {
        deviceId: device._id,
        deviceName: device.name,
        devicePriority: device.priority,
        deviceHealthStatus: device.healthStatus,
        deviceHealthCheckEnabled: device.healthCheckEnabled,
        deviceLastHealthCheck: device.lastHealthCheck,
        controllerId: controller._id,
        controllerName: controller.name,
        controllerStatus: controller.status,
        controllerHealthStatus: controller.healthStatus,
        controllerLastHealthCheck: controller.lastHealthCheck,
        timestamp: new Date()
      },
      message: 'Device health status retrieved successfully'
    })

  } catch (error: any) {
    console.error('[DeviceHealth] Error getting device health:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get device health status',
      details: error.message
    })
  }
})

export default router