import { DeviceMapper } from './DeviceMapper'
import { SerialAdapter } from './adapters/SerialAdapter'
import { HttpAdapter } from './adapters/HttpAdapter'
import { IProtocolAdapter, ISerialConfig, IHttpConfig } from '../types/ProtocolTypes'
import { IDeviceCommand, IHardwareResponse, HardwareError, HardwareErrorType } from '../types/HardwareTypes'

export class HardwareService {
  private deviceMapper: DeviceMapper
  private adapters = new Map<string, IProtocolAdapter>()

  constructor() {
    this.deviceMapper = new DeviceMapper()
  }

  async readSensor(deviceId: string): Promise<number> {
    try {
      const { device, controller } = await this.deviceMapper.resolveDevice(deviceId)
      
      if (!device.isActive) {
        throw new HardwareError(HardwareErrorType.DEVICE_NOT_FOUND, `Device ${deviceId} is not active`, deviceId)
      }

      const adapter = await this.getAdapter(controller.controllerId.toString(), controller)
      
      const command: IDeviceCommand = {
        deviceId,
        action: 'READ_SENSOR'
      }

      const response = await adapter.sendCommand(command)
      
      if (!response.success) {
        throw new HardwareError(HardwareErrorType.COMMAND_FAILED, response.error || 'Sensor read failed', deviceId)
      }

      return response.value || 0
    } catch (error) {
      if (error instanceof HardwareError) {
        throw error
      }
      throw new HardwareError(HardwareErrorType.COMMAND_FAILED, (error as Error).message, deviceId)
    }
  }

  async controlDevice(deviceId: string, action: string, duration?: number): Promise<void> {
    try {
      const { device, controller } = await this.deviceMapper.resolveDevice(deviceId)
      
      if (!device.isActive) {
        throw new HardwareError(HardwareErrorType.DEVICE_NOT_FOUND, `Device ${deviceId} is not active`, deviceId)
      }

      const adapter = await this.getAdapter(controller.controllerId.toString(), controller)
      
      const command: IDeviceCommand = {
        deviceId,
        action,
        duration
      }

      const response = await adapter.sendCommand(command)
      
      if (!response.success) {
        throw new HardwareError(HardwareErrorType.COMMAND_FAILED, response.error || 'Device control failed', deviceId)
      }
    } catch (error) {
      if (error instanceof HardwareError) {
        throw error
      }
      throw new HardwareError(HardwareErrorType.COMMAND_FAILED, (error as Error).message, deviceId)
    }
  }

  private async getAdapter(controllerId: string, controller: any): Promise<IProtocolAdapter> {
    console.log(`[HardwareService] getAdapter called for controller: ${controllerId}`)
    let adapter = this.adapters.get(controllerId)
    
    if (!adapter) {
      console.log(`[HardwareService] No existing adapter, creating new one...`)
      adapter = this.createAdapter(controller)
      console.log(`[HardwareService] Adapter created, connecting...`)
      try {
        await adapter.connect()
        console.log(`[HardwareService] await adapter.connect() completed`)
        console.log(`[HardwareService] Adapter connected, caching...`)
        this.adapters.set(controllerId, adapter)
      } catch (error) {
        console.log(`[HardwareService] Connection failed: ${error}`)
        throw error
      }
    }

    console.log(`[HardwareService] Checking if adapter is connected...`)
    if (!adapter.isConnected()) {
      console.log(`[HardwareService] Adapter not connected, removing from cache and reconnecting...`)
      this.adapters.delete(controllerId) // Remove broken adapter
      await adapter.disconnect() // Try to cleanup
      
      // Create fresh adapter
      adapter = this.createAdapter(controller)
      await adapter.connect()
      this.adapters.set(controllerId, adapter)
      console.log(`[HardwareService] Fresh adapter created and connected`)
    }

    console.log(`[HardwareService] Returning adapter`)
    return adapter
  }

  private createAdapter(controller: any): IProtocolAdapter {
    switch (controller.communicationType) {
      case 'raw_serial':
        // Default serial config for Arduino Uno on /dev/ttyUSB0
        const serialConfig: ISerialConfig = {
          port: controller.config.port || '/dev/ttyUSB0',
          baudRate: controller.config.baudRate || 9600,
          timeout: controller.config.timeout || 5000
        }
        return new SerialAdapter(serialConfig)
      case 'http':
        return new HttpAdapter(controller.config as IHttpConfig)
      default:
        throw new HardwareError(
          HardwareErrorType.COMMAND_FAILED,
          `Unsupported communication type: ${controller.communicationType}`
        )
    }
  }

  async disconnect(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.disconnect()
    }
    this.adapters.clear()
  }

  async testConnection(controllerId: string): Promise<{ success: boolean; message?: string; details?: any }> {
    console.log(`[HardwareService] testConnection called for controller: ${controllerId}`)
    try {
      const controllerDoc = await (await import('../../models/PhysicalController')).PhysicalController.findById(controllerId)
      if (!controllerDoc) {
        console.log(`[HardwareService] Controller not found in database: ${controllerId}`)
        return { success: false, message: `Controller ${controllerId} not found` }
      }
      
      console.log(`[HardwareService] Controller doc found: ${controllerDoc.name}`)

      const controller = {
        controllerId: controllerDoc._id,
        type: controllerDoc.type,
        communicationBy: controllerDoc.communicationBy,
        communicationType: controllerDoc.communicationType,
        config: controllerDoc.communicationConfig,
        status: controllerDoc.status
      }

      console.log(`[HardwareService] Getting adapter...`)
      const adapter = await this.getAdapter(controllerId, controller)
      console.log(`[HardwareService] Adapter obtained, checking for healthCheck method...`)
      
      // Perform health check
      if ('healthCheck' in adapter && typeof adapter.healthCheck === 'function') {
        console.log(`[HardwareService] Calling healthCheck on adapter...`)
        const result = await (adapter as any).healthCheck()
        
        // Close adapter after health check to free the port
        await adapter.disconnect()
        this.adapters.delete(controllerId)
        
        // Add small delay to ensure port is fully released
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Update controller status in database
        await (await import('../../models/PhysicalController')).PhysicalController.findByIdAndUpdate(
          controllerId,
          { 
            status: result.success ? 'online' : 'offline',
            lastHeartbeat: new Date()
          }
        )
        
        return result
      } else {
        return { success: false, message: 'Health check not supported for this adapter type' }
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${(error as Error).message}`
      }
    }
  }

  clearCache(): void {
    this.deviceMapper.clearCache()
  }
}