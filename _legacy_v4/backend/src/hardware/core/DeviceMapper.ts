import { Device } from '../../models/Device'
import { PhysicalController } from '../../models/PhysicalController'
import { IDeviceInfo, IControllerConfig, HardwareError, HardwareErrorType } from '../types'

export class DeviceMapper {
  private deviceCache = new Map<string, IDeviceInfo>()
  private controllerCache = new Map<string, IControllerConfig>()

  async resolveDevice(deviceId: string): Promise<{ device: IDeviceInfo; controller: IControllerConfig }> {
    let device = this.deviceCache.get(deviceId)
    
    if (!device) {
      const deviceDoc = await Device.findById(deviceId).populate('controllerId')
      if (!deviceDoc) {
        throw new HardwareError(HardwareErrorType.DEVICE_NOT_FOUND, `Device ${deviceId} not found`, deviceId)
      }

      device = {
        deviceId: deviceDoc._id.toString(),
        name: deviceDoc.name,
        type: deviceDoc.type,
        controllerId: deviceDoc.controllerId._id,
        ports: deviceDoc.ports,
        isActive: deviceDoc.isActive
      }
      
      this.deviceCache.set(deviceId, device)
    }

    let controller = this.controllerCache.get(device.controllerId.toString())
    
    if (!controller) {
      const controllerDoc = await PhysicalController.findById(device.controllerId)
      if (!controllerDoc) {
        throw new HardwareError(
          HardwareErrorType.CONTROLLER_OFFLINE, 
          `Controller ${device.controllerId} not found`, 
          deviceId, 
          device.controllerId.toString()
        )
      }

      controller = {
        controllerId: controllerDoc._id,
        type: controllerDoc.type,
        communicationBy: controllerDoc.communicationBy,
        communicationType: controllerDoc.communicationType,
        config: controllerDoc.communicationConfig,
        status: controllerDoc.status
      }
      
      this.controllerCache.set(device.controllerId.toString(), controller)
    }

    if (controller.status !== 'online') {
      throw new HardwareError(
        HardwareErrorType.CONTROLLER_OFFLINE,
        `Controller ${controller.controllerId} is ${controller.status}`,
        deviceId,
        controller.controllerId.toString()
      )
    }

    return { device, controller }
  }

  clearCache(): void {
    this.deviceCache.clear()
    this.controllerCache.clear()
  }

  removeCachedDevice(deviceId: string): void {
    this.deviceCache.delete(deviceId)
  }

  removeCachedController(controllerId: string): void {
    this.controllerCache.delete(controllerId)
  }
}