import { PhysicalController } from '../models/PhysicalController'
import { Device } from '../models/Device'

export type LogicalState = 'active' | 'inactive'
export type HardwareState = 'HIGH' | 'LOW'

export interface PortStatus {
  port: string
  label: string
  type?: 'digital' | 'analog'
  isOccupied: boolean
  deviceName?: string
  deviceType?: string
  hardwareState?: HardwareState
  logicalState?: LogicalState
  relayLogic?: 'active_high' | 'active_low'
}

export class DevicePortService {
  /**
   * Converts hardware state to logical state based on device relay logic
   */
  private static hardwareToLogical(hardwareState: HardwareState, relayLogic: 'active_high' | 'active_low'): LogicalState {
    if (relayLogic === 'active_high') {
      return hardwareState === 'HIGH' ? 'active' : 'inactive'
    } else {
      return hardwareState === 'LOW' ? 'active' : 'inactive'
    }
  }

  /**
   * Converts logical state to hardware state based on device relay logic
   */
  private static logicalToHardware(logicalState: LogicalState, relayLogic: 'active_high' | 'active_low'): HardwareState {
    if (relayLogic === 'active_high') {
      return logicalState === 'active' ? 'HIGH' : 'LOW'
    } else {
      return logicalState === 'active' ? 'LOW' : 'HIGH'
    }
  }

  /**
   * Gets comprehensive port status with logical states for a controller
   */
  static async getPortsStatus(controllerId: string): Promise<PortStatus[]> {
    try {
      const controller = await PhysicalController.findById(controllerId)
      if (!controller) {
        throw new Error(`Controller ${controllerId} not found`)
      }

      // Get all devices for this controller to map ports to devices
      const devices = await Device.find({ controllerId: controllerId })
      const deviceByPort = new Map<string, typeof devices[0]>()
      
      // Create port-to-device mapping (handle multiple ports per device)
      devices.forEach(device => {
        device.ports.forEach(port => {
          deviceByPort.set(port, device)
        })
      })

      const portStatuses: PortStatus[] = controller.availablePorts.map(port => {
        const device = deviceByPort.get(port.key)
        const status: PortStatus = {
          port: port.key,
          label: port.label,
          type: port.type,
          isOccupied: port.isOccupied,
          hardwareState: port.currentState
        }

        if (device) {
          status.deviceName = device.name
          status.deviceType = device.type
          status.relayLogic = device.relayLogic
          
          // Convert hardware state to logical state if it's a digital port with a state
          if (port.type === 'digital' && port.currentState) {
            status.logicalState = this.hardwareToLogical(port.currentState, device.relayLogic)
          }
        }

        return status
      })

      console.log(`[DevicePortService] Retrieved port status for controller ${controllerId}: ${portStatuses.length} ports`)
      return portStatuses
    } catch (error) {
      console.error('[DevicePortService] Error getting ports status:', error)
      throw error
    }
  }
  /**
   * Updates port occupation status when device is saved (supports multiple ports)
   */
  static async updatePortOccupation(controllerId: string, newPorts: string[], oldPorts?: string[]): Promise<void> {
    try {
      console.log(`[DevicePortService] DEBUG: Starting updatePortOccupation for controller ${controllerId}`)
      console.log(`[DevicePortService] DEBUG: newPorts:`, newPorts)
      console.log(`[DevicePortService] DEBUG: oldPorts:`, oldPorts)
      
      const controller = await PhysicalController.findById(controllerId)
      if (!controller) {
        throw new Error(`Controller ${controllerId} not found`)
      }
      
      console.log(`[DevicePortService] DEBUG: Controller found:`, controller.name)

      // Free old ports if this is an edit operation
      if (oldPorts && oldPorts.length > 0) {
        console.log(`[DevicePortService] DEBUG: Freeing old ports...`)
        for (const oldPort of oldPorts) {
          // Skip empty ports
          if (!oldPort || oldPort.trim() === '') continue
          
          if (!newPorts.includes(oldPort)) {
            const oldPortObj = controller.availablePorts.find(p => p.key === oldPort)
            if (oldPortObj) {
              console.log(`[DevicePortService] DEBUG: Freeing port ${oldPort}`)
              oldPortObj.isOccupied = false
            } else {
              console.log(`[DevicePortService] DEBUG: Port ${oldPort} not found in controller`)
            }
          }
        }
      }

      // Occupy new ports
      console.log(`[DevicePortService] DEBUG: Occupying new ports...`)
      for (const newPort of newPorts) {
        // Skip empty ports
        if (!newPort || newPort.trim() === '') continue
        
        console.log(`[DevicePortService] DEBUG: Looking for port ${newPort} in controller...`)
        const newPortObj = controller.availablePorts.find(p => p.key === newPort)
        if (newPortObj) {
          console.log(`[DevicePortService] DEBUG: Setting port ${newPort} as occupied (was: ${newPortObj.isOccupied})`)
          newPortObj.isOccupied = true
        } else {
          console.log(`[DevicePortService] ERROR: Port ${newPort} not found in controller availablePorts!`)
        }
      }

      console.log(`[DevicePortService] DEBUG: Saving controller with updated port occupation...`)
      await controller.save()
      console.log(`[DevicePortService] Port occupation updated: [${oldPorts?.join(', ') || 'none'}] -> [${newPorts.join(', ')}]`)
    } catch (error) {
      console.error('[DevicePortService] Error updating port occupation:', error)
      throw error
    }
  }

  /**
   * Frees ports when device is deleted (supports multiple ports)
   */
  static async freePorts(controllerId: string, ports: string[]): Promise<void> {
    try {
      const controller = await PhysicalController.findById(controllerId)
      if (!controller) {
        throw new Error(`Controller ${controllerId} not found`)
      }

      for (const port of ports) {
        const portObj = controller.availablePorts.find(p => p.key === port)
        if (portObj) {
          portObj.isOccupied = false
        }
      }
      
      await controller.save()
      console.log(`[DevicePortService] Ports freed: [${ports.join(', ')}]`)
    } catch (error) {
      console.error('[DevicePortService] Error freeing ports:', error)
      throw error
    }
  }

  /**
   * Updates port state when device test is performed (hardware state)
   */
  static async updatePortState(controllerId: string, port: string, state: HardwareState): Promise<void> {
    try {
      const controller = await PhysicalController.findById(controllerId)
      if (!controller) {
        throw new Error(`Controller ${controllerId} not found`)
      }

      const portObj = controller.availablePorts.find(p => p.key === port)
      if (portObj && portObj.type === 'digital') {
        const previousState = portObj.currentState
        portObj.currentState = state
        await controller.save()

        // Get device info for logical state logging
        const device = await Device.findOne({ controllerId: controllerId, ports: port })
        if (device) {
          const logicalState = this.hardwareToLogical(state, device.relayLogic)
          const previousLogicalState = previousState ? this.hardwareToLogical(previousState, device.relayLogic) : 'unknown'
          console.log(`[DevicePortService] Port state updated: ${port} (${device.name}) ${previousState} -> ${state} (${previousLogicalState} -> ${logicalState})`)
        } else {
          console.log(`[DevicePortService] Port state updated: ${port} -> ${state}`)
        }
      }
    } catch (error) {
      console.error('[DevicePortService] Error updating port state:', error)
      throw error
    }
  }

  /**
   * Updates port state using logical state (active/inactive)
   */
  static async updatePortLogicalState(controllerId: string, port: string, logicalState: LogicalState): Promise<void> {
    try {
      const device = await Device.findOne({ controllerId: controllerId, ports: port })
      if (!device) {
        throw new Error(`Device not found for controller ${controllerId} and port ${port}`)
      }

      const hardwareState = this.logicalToHardware(logicalState, device.relayLogic)
      await this.updatePortState(controllerId, port, hardwareState)
    } catch (error) {
      console.error('[DevicePortService] Error updating port logical state:', error)
      throw error
    }
  }

  /**
   * Toggles port state in DB when test is successful (DB is source of truth)
   * Returns both hardware and logical state information
   */
  static async togglePortState(controllerId: string, port: string): Promise<{
    hardwareState: HardwareState
    logicalState?: LogicalState
    deviceName?: string
  }> {
    try {
      const controller = await PhysicalController.findById(controllerId)
      if (!controller) {
        throw new Error(`Controller ${controllerId} not found`)
      }

      const portObj = controller.availablePorts.find(p => p.key === port)
      if (!portObj || portObj.type !== 'digital') {
        throw new Error(`Digital port ${port} not found`)
      }

      // Get device info for logical state conversion
      const device = await Device.findOne({ controllerId: controllerId, ports: port })

      // Toggle the hardware state in DB
      const currentState = portObj.currentState || 'HIGH'
      const newState: HardwareState = currentState === 'HIGH' ? 'LOW' : 'HIGH'
      
      portObj.currentState = newState
      await controller.save()

      const result = {
        hardwareState: newState,
        logicalState: undefined as LogicalState | undefined,
        deviceName: undefined as string | undefined
      }

      if (device) {
        const currentLogicalState = this.hardwareToLogical(currentState, device.relayLogic)
        const newLogicalState = this.hardwareToLogical(newState, device.relayLogic)
        
        result.logicalState = newLogicalState
        result.deviceName = device.name
        
        console.log(`[DevicePortService] Port state toggled: ${port} (${device.name}) ${currentState} -> ${newState} (${currentLogicalState} -> ${newLogicalState})`)
      } else {
        console.log(`[DevicePortService] Port state toggled: ${port} ${currentState} -> ${newState}`)
      }
      
      return result
    } catch (error) {
      console.error('[DevicePortService] Error toggling port state:', error)
      throw error
    }
  }

  /**
   * Toggles port logical state (active/inactive) and returns new logical state
   */
  static async togglePortLogicalState(controllerId: string, port: string): Promise<LogicalState> {
    try {
      const device = await Device.findOne({ controllerId: controllerId, ports: port })
      if (!device) {
        throw new Error(`Device not found for controller ${controllerId} and port ${port}`)
      }

      const controller = await PhysicalController.findById(controllerId)
      if (!controller) {
        throw new Error(`Controller ${controllerId} not found`)
      }

      const portObj = controller.availablePorts.find(p => p.key === port)
      if (!portObj || portObj.type !== 'digital') {
        throw new Error(`Digital port ${port} not found`)
      }

      // Get current logical state and toggle it
      const currentHardwareState = portObj.currentState || 'HIGH'
      const currentLogicalState = this.hardwareToLogical(currentHardwareState, device.relayLogic)
      const newLogicalState: LogicalState = currentLogicalState === 'active' ? 'inactive' : 'active'
      
      // Convert back to hardware state and update
      const newHardwareState = this.logicalToHardware(newLogicalState, device.relayLogic)
      await this.updatePortState(controllerId, port, newHardwareState)
      
      return newLogicalState
    } catch (error) {
      console.error('[DevicePortService] Error toggling port logical state:', error)
      throw error
    }
  }

  /**
   * Gets the current logical state for a specific port
   */
  static async getPortLogicalState(controllerId: string, port: string): Promise<LogicalState | null> {
    try {
      const device = await Device.findOne({ controllerId: controllerId, ports: port })
      if (!device) {
        return null
      }

      const controller = await PhysicalController.findById(controllerId)
      if (!controller) {
        throw new Error(`Controller ${controllerId} not found`)
      }

      const portObj = controller.availablePorts.find(p => p.key === port)
      if (!portObj || portObj.type !== 'digital' || !portObj.currentState) {
        return null
      }

      return this.hardwareToLogical(portObj.currentState, device.relayLogic)
    } catch (error) {
      console.error('[DevicePortService] Error getting port logical state:', error)
      throw error
    }
  }
}