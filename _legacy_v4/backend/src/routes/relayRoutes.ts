import { Router } from 'express'
import { Relay, IRelay } from '../models/Relay'
import { DevicePortService } from '../services/DevicePortService'

const router = Router()

/**
 * @route GET /api/v1/relays/test
 * @desc Test endpoint for relay routes
 */
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Relay routes working!',
    timestamp: new Date().toISOString(),
    status: 'ok'
  })
})

/**
 * @route GET /api/v1/relays
 * @desc Get all relays
 * @query isActive - Filter by active status (true/false)
 * @query controllerId - Filter by controller ID
 */
router.get('/', async (req, res) => {
  try {
    const { isActive, controllerId } = req.query
    
    // Build filter object
    const filter: any = {}
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'
    }
    if (controllerId) {
      filter.controllerId = controllerId
    }
    
    const relays = await Relay.find(filter).sort({ name: 1 })
    
    res.json({
      success: true,
      data: relays,
      count: relays.length
    })
  } catch (error) {
    console.error('[RelayRoutes] Error fetching relays:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch relays',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @route GET /api/v1/relays/:id
 * @desc Get relay by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const relay = await Relay.findById(req.params.id)
    
    if (!relay) {
      return res.status(404).json({
        success: false,
        message: 'Relay not found'
      })
    }
    
    res.json({
      success: true,
      data: relay
    })
  } catch (error) {
    console.error('[RelayRoutes] Error fetching relay:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch relay',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @route POST /api/v1/relays
 * @desc Create new relay
 */
router.post('/', async (req, res) => {
  try {
    const relayData = req.body
    
    // Validate required fields
    if (!relayData.name || !relayData.controllerId || !relayData.relayType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, controllerId, relayType'
      })
    }
    
    const relay = new Relay(relayData)
    await relay.save()
    
    // Occupy control pins in controller (copied from DeviceRoutes logic)
    const controlPins = relay.ports
      .map(port => port.controlPin)
      .filter(pin => pin && pin.trim() !== '')
    
    if (controlPins.length > 0) {
      await DevicePortService.updatePortOccupation(relay.controllerId.toString(), controlPins)
      console.log(`[RelayRoutes] Occupied control pins: [${controlPins.join(', ')}]`)
    }
    
    console.log(`[RelayRoutes] Created relay: ${relay.name} (${relay.relayType})`)
    
    res.status(201).json({
      success: true,
      data: relay,
      message: 'Relay created successfully'
    })
  } catch (error) {
    console.error('[RelayRoutes] Error creating relay:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create relay',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @route PUT /api/v1/relays/:id
 * @desc Update relay
 */
router.put('/:id', async (req, res) => {
  try {
    const relayData = req.body
    
    // Get old relay data for port comparison (copied from DeviceRoutes logic)
    const oldRelay = await Relay.findById(req.params.id)
    if (!oldRelay) {
      return res.status(404).json({
        success: false,
        message: 'Relay not found'
      })
    }
    
    const oldControlPins = oldRelay.ports
      .map(port => port.controlPin)
      .filter(pin => pin && pin.trim() !== '')
    
    const relay = await Relay.findByIdAndUpdate(
      req.params.id,
      relayData,
      { new: true, runValidators: true }
    )
    
    if (!relay) {
      return res.status(404).json({
        success: false,
        message: 'Relay not found'
      })
    }
    
    // Update port occupation with old and new pins (copied from DeviceRoutes logic)
    const newControlPins = relay.ports
      .map(port => port.controlPin)
      .filter(pin => pin && pin.trim() !== '')
    
    await DevicePortService.updatePortOccupation(
      relay.controllerId.toString(), 
      newControlPins, 
      oldControlPins
    )
    console.log(`[RelayRoutes] Updated port occupation: [${oldControlPins.join(', ')}] -> [${newControlPins.join(', ')}]`)
    
    console.log(`[RelayRoutes] Updated relay: ${relay.name}`)
    
    res.json({
      success: true,
      data: relay,
      message: 'Relay updated successfully'
    })
  } catch (error) {
    console.error('[RelayRoutes] Error updating relay:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update relay',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @route DELETE /api/v1/relays/:id
 * @desc Delete relay
 */
router.delete('/:id', async (req, res) => {
  try {
    const relay = await Relay.findById(req.params.id)
    
    if (!relay) {
      return res.status(404).json({
        success: false,
        message: 'Relay not found'
      })
    }
    
    // Check if any ports are occupied
    const occupiedPorts = relay.ports.filter(port => port.isOccupied)
    if (occupiedPorts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete relay. ${occupiedPorts.length} ports are occupied by devices.`,
        occupiedPorts: occupiedPorts.map(p => ({ 
          port: p.portNumber, 
          deviceId: p.occupiedBy 
        }))
      })
    }
    
    // Free control pins in controller before deletion (copied from DeviceRoutes logic)
    const controlPins = relay.ports
      .map(port => port.controlPin)
      .filter(pin => pin && pin.trim() !== '')
    
    await Relay.findByIdAndDelete(req.params.id)
    
    // Free the control pins in controller
    if (controlPins.length > 0) {
      await DevicePortService.freePorts(relay.controllerId.toString(), controlPins)
      console.log(`[RelayRoutes] Freed control pins: [${controlPins.join(', ')}]`)
    }
    
    console.log(`[RelayRoutes] Deleted relay: ${relay.name}`)
    
    res.json({
      success: true,
      message: 'Relay deleted successfully'
    })
  } catch (error) {
    console.error('[RelayRoutes] Error deleting relay:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete relay',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @route GET /api/v1/relays/:id/available-ports
 * @desc Get available ports for a relay
 */
router.get('/:id/available-ports', async (req, res) => {
  try {
    const relay = await Relay.findById(req.params.id)
    
    if (!relay) {
      return res.status(404).json({
        success: false,
        message: 'Relay not found'
      })
    }
    
    const availablePorts = relay.getAvailablePorts()
    
    res.json({
      success: true,
      data: availablePorts,
      total: relay.ports.length,
      available: availablePorts.length,
      occupied: relay.ports.length - availablePorts.length
    })
  } catch (error) {
    console.error('[RelayRoutes] Error fetching available ports:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available ports',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @route POST /api/v1/relays/:id/occupy-port
 * @desc Occupy a port on a relay
 * @body { portNumber: number, deviceId: string }
 */
router.post('/:id/occupy-port', async (req, res) => {
  try {
    const { portNumber, deviceId } = req.body
    
    if (!portNumber || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: portNumber, deviceId'
      })
    }
    
    const relay = await Relay.findById(req.params.id)
    
    if (!relay) {
      return res.status(404).json({
        success: false,
        message: 'Relay not found'
      })
    }
    
    const success = relay.occupyPort(portNumber, deviceId)
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Port is already occupied or does not exist'
      })
    }
    
    await relay.save()
    
    console.log(`[RelayRoutes] Port ${portNumber} occupied by device ${deviceId} on relay ${relay.name}`)
    
    res.json({
      success: true,
      message: 'Port occupied successfully',
      data: relay.ports.find(p => p.portNumber === portNumber)
    })
  } catch (error) {
    console.error('[RelayRoutes] Error occupying port:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to occupy port',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @route POST /api/v1/relays/:id/release-port
 * @desc Release a port on a relay
 * @body { portNumber: number }
 */
router.post('/:id/release-port', async (req, res) => {
  try {
    const { portNumber } = req.body
    
    if (!portNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: portNumber'
      })
    }
    
    const relay = await Relay.findById(req.params.id)
    
    if (!relay) {
      return res.status(404).json({
        success: false,
        message: 'Relay not found'
      })
    }
    
    const success = relay.releasePort(portNumber)
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Port is not occupied or does not exist'
      })
    }
    
    await relay.save()
    
    console.log(`[RelayRoutes] Port ${portNumber} released on relay ${relay.name}`)
    
    res.json({
      success: true,
      message: 'Port released successfully',
      data: relay.ports.find(p => p.portNumber === portNumber)
    })
  } catch (error) {
    console.error('[RelayRoutes] Error releasing port:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to release port',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router