// ABOUTME: SensorHealthChecker handles sensor device health monitoring and validation
// ABOUTME: Focuses on sensor data range checks and historical analysis

import { UnifiedLoggingService } from './UnifiedLoggingService'
import { Device, IDevice } from '../models/Device'
import { HealthConfig } from '../models/HealthConfig'
import { PhysicalController } from '../models/PhysicalController'
import { SensorHealthValidator, SensorHealthStatus, SensorHealthResult } from './SensorHealthValidator'
import { HardwareCommunicationService } from './HardwareCommunicationService'
import { LogTags } from '../utils/LogTags'

export interface DeviceHealthStatus {
  deviceId: string
  name: string
  status: 'online' | 'offline' | 'error' | 'unknown'
  lastCheck: Date
  error?: string
  responseTime?: number
  sensorHealth?: {
    status: SensorHealthStatus
    communicationHealth: boolean
    rangeHealth: boolean
    historicalHealth: boolean
    message: string
  }
}

export interface SensorHealthReport {
  timestamp: Date
  totalDevices: number
  onlineDevices: number
  criticalIssues: string[]
  warnings: string[]
  devices: DeviceHealthStatus[]
}

export class SensorHealthChecker {
  private static instance: SensorHealthChecker
  private logger = UnifiedLoggingService.createModuleLogger('SensorHealthChecker.ts')
  private sensorHealthValidator: SensorHealthValidator
  private healthConfig?: any
  
  private constructor() {
    const hardwareComm = HardwareCommunicationService.getInstance()
    this.sensorHealthValidator = new SensorHealthValidator(hardwareComm)
  }

  static getInstance(): SensorHealthChecker {
    if (!SensorHealthChecker.instance) {
      SensorHealthChecker.instance = new SensorHealthChecker()
    }
    return SensorHealthChecker.instance
  }

  /**
   * Main sensor health check - validates all active sensors
   */
  async checkAllSensors(options: {
    quickCheck?: boolean
  } = {}): Promise<SensorHealthReport> {
    const startTime = Date.now()

    try {
      this.logger.info(LogTags.sensor.validation.passed, {
        message: 'Starting sensor health check',
        checkType: options.quickCheck ? 'quick' : 'full'
      }, {
        source: { file: 'SensorHealthChecker.ts', method: 'checkAllSensors' },
        business: { category: 'sensor', operation: 'health_check' }
      })

      // Load HealthConfig
      this.healthConfig = await HealthConfig.getSingleton()

      // Get all active devices
      const allDevices = await Device.find({ isActive: true }).populate('controllerId')
      const devices = allDevices.filter(device => device.healthCheckEnabled)

      this.logger.info(LogTags.sensor.validation.passed, {
        message: 'Found devices for health check',
        total: allDevices.length,
        enabled: devices.length
      }, {
        source: { file: 'SensorHealthChecker.ts', method: 'checkAllSensors' },
        business: { category: 'sensor', operation: 'health_check' }
      })

      const deviceStatuses: DeviceHealthStatus[] = []
      const criticalIssues: string[] = []
      const warnings: string[] = []

      // Group devices by controller
      const controllerMap = new Map()
      for (const device of devices) {
        const controller = device.controllerId as any
        if (controller && !controllerMap.has(controller._id.toString())) {
          controllerMap.set(controller._id.toString(), {
            controller,
            devices: [device]
          })
        } else if (controller) {
          controllerMap.get(controller._id.toString()).devices.push(device)
        }
      }

      // Process devices with controller status
      const deviceResults = await this.processDevicesWithControllerStatus(controllerMap, options.quickCheck)
      deviceStatuses.push(...deviceResults)

      // Collect issues
      deviceResults.forEach(result => {
        if (result.status === 'offline' || result.status === 'error') {
          warnings.push(`Sensor ${result.name} is ${result.status}`)
        }
        if (result.sensorHealth?.status === 'UNHEALTHY') {
          criticalIssues.push(`Sensor ${result.name}: ${result.sensorHealth.message}`)
        }
      })

      const report: SensorHealthReport = {
        timestamp: new Date(),
        totalDevices: deviceStatuses.length,
        onlineDevices: deviceStatuses.filter(d => d.status === 'online').length,
        criticalIssues,
        warnings,
        devices: deviceStatuses
      }

      const duration = Date.now() - startTime

      this.logger.info(LogTags.sensor.validation.passed, {
        message: 'Sensor health check completed',
        duration: duration,
        onlineDevices: report.onlineDevices,
        totalDevices: report.totalDevices,
        criticalIssues: criticalIssues.length,
        warnings: warnings.length
      }, {
        source: { file: 'SensorHealthChecker.ts', method: 'checkAllSensors' },
        business: { category: 'sensor', operation: 'health_check' }
      })

      return report

    } catch (error) {
      this.logger.error(LogTags.sensor.validation.failed, {
        message: 'Sensor health check failed',
        error: error
      }, {
        source: { file: 'SensorHealthChecker.ts', method: 'checkAllSensors' },
        business: { category: 'sensor', operation: 'health_check' }
      })
      throw error
    }
  }

  /**
   * Check single sensor health
   */
  async checkSingleSensor(deviceId: string, quickCheck: boolean = false): Promise<DeviceHealthStatus> {
    try {
      const device = await Device.findById(deviceId).populate('controllerId')
      
      if (!device) {
        throw new Error(`Device ${deviceId} not found`)
      }

      return await this.checkSingleDevice(device, quickCheck)
    } catch (error) {
      this.logger.error(LogTags.sensor.validation.failed, {
        message: 'Single sensor check failed',
        deviceId: deviceId,
        error: error
      }, {
        source: { file: 'SensorHealthChecker.ts', method: 'checkSingleSensor' },
        business: { category: 'sensor', operation: 'health_check' },
        deviceId: deviceId
      })
      throw error
    }
  }

  /**
   * Process sensors based on their controller status
   */
  private async processDevicesWithControllerStatus(
    controllerMap: Map<string, {controller: any, devices: any[]}>, 
    quickCheck?: boolean
  ): Promise<DeviceHealthStatus[]> {
    const results: DeviceHealthStatus[] = []
    
    for (const [controllerId, group] of controllerMap) {
      const controller = group.controller
      const devices = group.devices

      // Check controller online status from database
      const isControllerOnline = controller.status === 'online'
      
      for (const device of devices) {
        const isCheckingEnabled = device.isActive && device.healthCheckEnabled
        
        if (!isControllerOnline) {
          // Controller offline - all devices get error status
          const deviceStatus = await this.updateSensorStatus(device, 'error', 'Controller offline')
          results.push(deviceStatus)
        } else if (device.category === 'actuator') {
          // Controller online, actuator - automatically healthy
          const deviceStatus = await this.updateSensorStatus(device, 'healthy', 'Controller online, actuator auto-healthy')
          results.push(deviceStatus)
        } else if (!isCheckingEnabled) {
          // Controller online, but sensor checking disabled - sensor gets healthy status
          const deviceStatus = await this.updateSensorStatus(device, 'healthy', 'Checking disabled, controller online')
          results.push(deviceStatus)
        } else {
          // Controller online and sensor checking enabled - do full sensor validation
          try {
            const deviceStatus = await this.checkSingleDevice(device, quickCheck)
            results.push(deviceStatus)
          } catch (error) {
            const deviceStatus = await this.updateSensorStatus(device, 'error', `Sensor check failed: ${error}`)
            results.push(deviceStatus)
          }
        }
      }
    }
    
    return results
  }

  /**
   * Update sensor status in database and return DeviceHealthStatus
   */
  private async updateSensorStatus(device: any, status: 'healthy' | 'error', message: string): Promise<DeviceHealthStatus> {
    const healthStatus = status === 'healthy' ? 'healthy' : 'error'
    const isCheckingEnabled = device.isActive && device.healthCheckEnabled
    
    await Device.findByIdAndUpdate(device._id, {
      healthStatus,
      checkingEnabled: isCheckingEnabled,
      lastHealthCheck: new Date(),
      lastError: status === 'error' ? message : null
    })
    
    return {
      deviceId: device._id.toString(),
      name: device.name,
      status: status === 'healthy' ? 'online' : 'offline',
      lastCheck: new Date(),
      error: status === 'error' ? message : undefined
    }
  }

  /**
   * Check single device health with sensor validation
   */
  private async checkSingleDevice(
    device: IDevice, 
    quickCheck: boolean = false
  ): Promise<DeviceHealthStatus> {
    const deviceId = device._id.toString()

    try {
      // Check controller
      const controller = device.controllerId as any
      if (!controller) {
        throw new Error('Device has no associated controller')
      }

      const isControllerHealthy = controller.status === 'online'
      let status: 'online' | 'offline' | 'error' | 'unknown' = isControllerHealthy ? 'online' : 'offline'
      let error: string | undefined = isControllerHealthy ? undefined : 'Controller offline'
      let sensorHealth: any = undefined

      // If controller is healthy and it's a sensor, perform enhanced sensor validation
      const shouldValidate = device.category === 'sensor' && !quickCheck && device.healthCheckEnabled
      
      if (isControllerHealthy && shouldValidate) {
        const sensorResult = await this.sensorHealthValidator.validateSensorHealth(device)
        
        sensorHealth = {
          status: sensorResult.status,
          communicationHealth: sensorResult.communicationHealth,
          rangeHealth: sensorResult.rangeHealth,
          historicalHealth: sensorResult.historicalHealth,
          message: sensorResult.message
        }

        // Update overall device status based on sensor health
        if (sensorResult.status === 'UNHEALTHY') {
          status = 'error'
          error = `Sensor validation failed: ${sensorResult.message}`
        } else if (sensorResult.status === 'WARNING') {
          status = 'online' // Keep online but flag warning in sensorHealth
        }
      }
      
      // Update device health status in database
      let healthStatus: string
      
      if (sensorHealth) {
        // Sensor validation was performed - use sensor results
        if (sensorHealth.status === 'UNHEALTHY') {
          healthStatus = 'error'
        } else if (sensorHealth.status === 'WARNING') {
          healthStatus = 'warning'
        } else {
          healthStatus = 'healthy'
        }
      } else {
        // No sensor validation - use controller status
        if (status === 'online') {
          healthStatus = 'healthy'
        } else {
          healthStatus = 'error'
        }
      }
      
      // Determine if health checking is currently enabled for this device
      const isCheckingEnabled = device.isActive && device.healthCheckEnabled
      
      await Device.findByIdAndUpdate(deviceId, {
        lastError: error || null,
        healthStatus,
        checkingEnabled: isCheckingEnabled,
        lastHealthCheck: new Date()
      })

      return {
        deviceId,
        name: device.name,
        status,
        lastCheck: new Date(),
        error,
        sensorHealth
      }

    } catch (error) {
      this.logger.error(LogTags.sensor.validation.failed, {
        message: 'Device check error',
        deviceName: device.name,
        error: error
      }, {
        source: { file: 'SensorHealthChecker.ts', method: 'checkSingleDevice' },
        business: { category: 'sensor', operation: 'health_check' },
        deviceId: deviceId
      })
      
      return {
        deviceId,
        name: device.name,
        status: 'error',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}
