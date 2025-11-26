// ABOUTME: This file implements three-layer sensor health validation system for detecting sensor malfunctions
// ABOUTME: It provides communication, range, and historical data analysis to determine sensor health status

import { IDevice, IValidationConfig } from '../models/Device'
import { MonitoringData } from '../models/MonitoringData'
import { HardwareCommunicationService } from './HardwareCommunicationService'
import { IStartupCommand } from '../types/startup-interfaces'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { LogTags } from '../utils/LogTags'

export type SensorHealthStatus = 'HEALTHY' | 'WARNING' | 'UNHEALTHY'

export interface SensorHealthResult {
  status: SensorHealthStatus
  communicationHealth: boolean
  rangeHealth: boolean
  historicalHealth: boolean
  message: string
  details: {
    lastValue?: number
    expectedRange?: [number, number]
    physicalRange?: [number, number]
    physicalValid?: boolean
    expectedValid?: boolean
    changeRate?: number
    stuckDuration?: number
    patternAnomaly?: boolean
  }
}

export class SensorHealthValidator {
  private logger = UnifiedLoggingService.createModuleLogger('SensorHealthValidator.ts')

  constructor(
    private hardwareComm: HardwareCommunicationService
  ) {}

  /**
   * Main validation method - validates sensor health using cached data without real-time communication
   */
  async validateSensorHealth(device: IDevice): Promise<SensorHealthResult> {
    // Remove startup spam - only log final result
    
    // Skip validation for actuators only
    if (device.category !== 'sensor') {
      // this.logger.info(LogTags.sensor.validation.passed, {
      //   reason: 'Not a sensor device',
      //   deviceName: device.name,
      //   category: device.category
      // }, {
      //   source: { file: 'SensorHealthValidator.ts', method: 'validateSensorHealth' },
      //   business: { category: 'sensor', operation: 'validation_skip' },
      //   deviceId: device._id.toString()
      // })
      
      return {
        status: 'HEALTHY',
        communicationHealth: true,
        rangeHealth: true,
        historicalHealth: true,
        message: 'Validation skipped - not a sensor',
        details: {}
      }
    }

    const config = device.validationConfig
    // Remove config debug logging to reduce startup noise
    
    // Communication layer always true for cached data validation
    const communicationHealth = true
    
    // Range Validation using cached lastReading values
    const rangeResult = await this.validateRangeFromCache(device, config)
    const physicalValid = rangeResult.physicalValid
    const expectedValid = rangeResult.expectedValid
    const lastValue = rangeResult.value

    // Historical Analysis (only if we have recent data)
    const historicalHealth = await this.validateHistoricalPatterns(device, config)

    // Determine overall status - with communication always healthy, focus on range/historical
    const status = this.determineOverallStatusForCachedData(physicalValid, expectedValid, historicalHealth)
    
    // Generate comprehensive message
    const message = this.generateStatusMessageForCachedData(status, physicalValid, expectedValid, historicalHealth)

    // Log final validation result with appropriate tag based on status
    const logTag = status === 'HEALTHY' ? LogTags.sensor.validation.passed : LogTags.sensor.validation.failed
    const logLevel = status === 'UNHEALTHY' ? 'error' : status === 'WARNING' ? 'warn' : 'info'

    this.logger[logLevel](logTag, {
      deviceName: device.name,
      validationResult: {
        status,
        communicationHealth,
        physicalValid,
        expectedValid,
        historicalHealth,
        message
      },
      lastValue
    }, {
      source: { file: 'SensorHealthValidator.ts', method: 'validateSensorHealth' },
      business: {
        category: 'sensor',
        operation: 'health_validation_complete',
        severity: status === 'UNHEALTHY' ? 'critical' : status === 'WARNING' ? 'high' : 'low'
      },
      deviceId: device._id.toString()
    })

    return {
      status,
      communicationHealth,
      rangeHealth: physicalValid && expectedValid, // Overall range health for backward compatibility
      historicalHealth,
      message,
      details: {
        lastValue,
        physicalValid,
        expectedValid,
        expectedRange: [config.expectedMin, config.expectedMax],
        physicalRange: [config.physicalMin, config.physicalMax]
      }
    }
  }

  /**
   * Range Validation using cached lastReading values only
   * Checks if cached sensor values are within expected and physical limits
   */
  private async validateRangeFromCache(device: IDevice, config: IValidationConfig): Promise<{
    physicalValid: boolean, 
    expectedValid: boolean, 
    value?: number
  }> {
    try {
      // Use cached lastReading value only
      const cachedValue = device.lastReading
      
      if (cachedValue === null || cachedValue === undefined) {
        // this.logger.info(LogTags.sensor.validation.passed, {
        //   reason: 'No cached reading available',
        //   deviceName: device.name
        // }, {
        //   source: { file: 'SensorHealthValidator.ts', method: 'validateRangeFromCache' },
        //   business: { category: 'sensor', operation: 'range_validation_skip' },
        //   deviceId: device._id.toString()
        // })
        return { physicalValid: true, expectedValid: true } // Don't fail validation if no cached data available
      }

      const value = Number(cachedValue)
      
      // Check if value is a valid number
      if (isNaN(value)) {
        this.logger.warn(LogTags.sensor.validation.failed, {
          reason: 'Invalid cached reading',
          deviceName: device.name,
          invalidValue: cachedValue
        }, {
          source: { file: 'SensorHealthValidator.ts', method: 'validateRangeFromCache' },
          business: { category: 'sensor', operation: 'range_validation', severity: 'medium' },
          deviceId: device._id.toString()
        })
        return { physicalValid: false, expectedValid: false, value: cachedValue }
      }
      
      // Remove debug range logging to reduce startup noise

      // Check against physical limits (critical - leads to error status)
      const physicalValid = value >= config.physicalMin && value <= config.physicalMax
      if (!physicalValid) {
        this.logger.error(LogTags.sensor.range.critical, {
          deviceName: device.name,
          currentValue: value,
          physicalRange: [config.physicalMin, config.physicalMax],
          violation: 'physical_range'
        }, {
          source: { file: 'SensorHealthValidator.ts', method: 'validateRangeFromCache' },
          business: { category: 'sensor', operation: 'range_violation', severity: 'critical' },
          deviceId: device._id.toString()
        })
      }

      // Check against expected operational range (warning - leads to warning status)
      const expectedValid = value >= config.expectedMin && value <= config.expectedMax
      
      // Remove debug expected range logging to reduce startup noise
      
      if (!expectedValid) {
        this.logger.warn(LogTags.sensor.range.warning, {
          deviceName: device.name,
          currentValue: value,
          expectedRange: [config.expectedMin, config.expectedMax],
          violation: 'expected_range'
        }, {
          source: { file: 'SensorHealthValidator.ts', method: 'validateRangeFromCache' },
          business: { category: 'sensor', operation: 'range_violation', severity: 'high' },
          deviceId: device._id.toString()
        })
      }
      
      return { physicalValid, expectedValid, value }
    } catch (error) {
      this.logger.error(LogTags.sensor.validation.failed, {
        deviceName: device.name,
        error: error.message
      }, {
        source: { file: 'SensorHealthValidator.ts', method: 'validateRangeFromCache' },
        business: { category: 'sensor', operation: 'range_validation', severity: 'high' },
        deviceId: device._id.toString()
      })
      return { physicalValid: false, expectedValid: false }
    }
  }

  /**
   * Layer 1: Communication Validation
   * Tests if the Arduino controller can successfully read from the sensor
   */
  private async validateCommunication(device: IDevice): Promise<boolean> {
    try {
      // Send device-specific read command (same logic as range validation)
      let sensorCommand: any = {
        deviceId: device._id.toString(),
        duration: 500 // Shorter duration for communication test
      }
      
      // Set command type based on sensor type
      if (device.type === 'dfrobot_ph_sensor') {
        sensorCommand.cmd = 'ANALOG'
      } else if (device.type === 'DHT22') {
        sensorCommand.cmd = 'SINGLE_WIRE_PULSE'
      } else if (device.type === 'DS18B20') {
        sensorCommand.cmd = 'SINGLE_WIRE_ONEWIRE'
      } else if (device.type === 'SEN0551') {
        sensorCommand.cmd = 'PULSE_COUNT'
      } else {
        sensorCommand.cmd = 'ANALOG'
      }
      
      // Remove debug command sent logging to reduce startup noise
      
      const response = await this.hardwareComm.sendCommand(device.controllerId.toString(), sensorCommand)
      
      // Check if Arduino responded with success
      if (response && typeof response === 'object' && response.ok === 1) {
        // Remove successful command logging
        return true
      }
      
      this.logger.warn(LogTags.device.command.failed, {
        deviceName: device.name,
        response,
        reason: 'Invalid response from Arduino'
      }, {
        source: { file: 'SensorHealthValidator.ts', method: 'validateCommunication' },
        business: { category: 'device', operation: 'communication_test', severity: 'medium' },
        deviceId: device._id.toString(),
        controllerId: device.controllerId.toString()
      })
      return false
    } catch (error) {
      this.logger.error(LogTags.device.command.failed, {
        deviceName: device.name,
        error: error.message
      }, {
        source: { file: 'SensorHealthValidator.ts', method: 'validateCommunication' },
        business: { category: 'device', operation: 'communication_test', severity: 'high' },
        deviceId: device._id.toString(),
        controllerId: device.controllerId?.toString()
      })
      return false
    }
  }

  /**
   * Layer 2: Range Validation
   * Checks if sensor values are within expected and physical limits
   */
  private async validateRange(device: IDevice, config: IValidationConfig): Promise<{isValid: boolean, value?: number}> {
    try {
      // Get live sensor reading from Arduino with proper conversion
      // This uses the same logic as device test endpoint to get converted values
      let convertedValue: number | null = null
      
      try {
        // Prepare command based on device type (same as in deviceRoutes test endpoint)
        let sensorCommand: any = {
          deviceId: device._id.toString(),
          duration: 1000
        }
        
        // Set command type based on sensor type
        if (device.type === 'dfrobot_ph_sensor') {
          sensorCommand.cmd = 'ANALOG'
        } else if (device.type === 'DHT22') {
          sensorCommand.cmd = 'SINGLE_WIRE_PULSE'
        } else if (device.type === 'DS18B20') {
          sensorCommand.cmd = 'SINGLE_WIRE_ONEWIRE'
        } else if (device.type === 'SEN0551') {
          sensorCommand.cmd = 'PULSE_COUNT'
        } else {
          sensorCommand.cmd = 'ANALOG'
        }
        
        // Remove debug command sent logging to reduce startup noise
        
        // Send command through HardwareCommunicationService
        const response = await this.hardwareComm.sendCommand(device.controllerId.toString(), sensorCommand)
        
        // Remove successful command debug logging
        
        if (response && response.ok === 1 && response.value !== undefined) {
          convertedValue = response.value // Backend has already converted raw to final value
          this.logger.debug(LogTags.sensor.range.normal, {
            deviceName: device.name,
            convertedValue
          }, {
            source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
            business: { category: 'sensor', operation: 'value_conversion' },
            deviceId: device._id.toString()
          })
        } else {
          this.logger.warn(LogTags.device.command.failed, {
            deviceName: device.name,
            response,
            reason: 'Failed to get live reading'
          }, {
            source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
            business: { category: 'device', operation: 'live_reading_request', severity: 'medium' },
            deviceId: device._id.toString()
          })
          return { isValid: false } // Communication failed
        }
      } catch (liveReadingError) {
        this.logger.warn(LogTags.device.command.failed, {
          deviceName: device.name,
          error: liveReadingError.message,
          fallback: 'cached_value'
        }, {
          source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
          business: { category: 'device', operation: 'live_reading_fallback', severity: 'medium' },
          deviceId: device._id.toString()
        })
        
        // Fallback to cached lastReading if live reading fails
        convertedValue = device.lastReading
        if (convertedValue === null || convertedValue === undefined) {
          // this.logger.info(LogTags.sensor.validation.passed, {
          //   deviceName: device.name,
          //   reason: 'No cached reading available for fallback'
          // }, {
          //   source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
          //   business: { category: 'sensor', operation: 'range_validation_skip' },
          //   deviceId: device._id.toString()
          // })
          return { isValid: true } // Don't fail validation if no data available
        }
      }

      const value = Number(convertedValue)
      
      // Check if value is a valid number
      if (isNaN(value)) {
        this.logger.warn(LogTags.sensor.validation.failed, {
          deviceName: device.name,
          invalidValue: convertedValue,
          reason: 'Invalid sensor reading'
        }, {
          source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
          business: { category: 'sensor', operation: 'range_validation', severity: 'medium' },
          deviceId: device._id.toString()
        })
        return { isValid: false, value: convertedValue }
      }
      
      this.logger.debug(LogTags.sensor.range.normal, {
        deviceName: device.name,
        currentValue: value,
        ranges: {
          expected: [config.expectedMin, config.expectedMax],
          physical: [config.physicalMin, config.physicalMax]
        },
        validationType: 'live_reading'
      }, {
        source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
        business: { category: 'sensor', operation: 'range_check' },
        deviceId: device._id.toString()
      })

      // Check against physical limits (hard failure)
      if (value < config.physicalMin || value > config.physicalMax) {
        this.logger.error(LogTags.sensor.range.critical, {
          deviceName: device.name,
          currentValue: value,
          physicalRange: [config.physicalMin, config.physicalMax],
          violation: 'physical_range',
          validationType: 'live_reading'
        }, {
          source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
          business: { category: 'sensor', operation: 'range_violation', severity: 'critical' },
          deviceId: device._id.toString()
        })
        return { isValid: false, value }
      }

      // Check against expected operational range (warning zone)
      const inExpectedRange = value >= config.expectedMin && value <= config.expectedMax
      
      this.logger.debug(LogTags.sensor.range.normal, {
        deviceName: device.name,
        expectedRangeCheck: {
          value,
          minCheck: value >= config.expectedMin,
          maxCheck: value <= config.expectedMax,
          result: inExpectedRange
        },
        validationType: 'live_reading'
      }, {
        source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
        business: { category: 'sensor', operation: 'expected_range_check' },
        deviceId: device._id.toString()
      })
      
      if (!inExpectedRange) {
        this.logger.warn(LogTags.sensor.range.warning, {
          deviceName: device.name,
          currentValue: value,
          expectedRange: [config.expectedMin, config.expectedMax],
          violation: 'expected_range',
          validationType: 'live_reading'
        }, {
          source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
          business: { category: 'sensor', operation: 'range_violation', severity: 'high' },
          deviceId: device._id.toString()
        })
      }
      
      return { isValid: inExpectedRange, value }
    } catch (error) {
      this.logger.error(LogTags.sensor.validation.failed, {
        deviceName: device.name,
        error: error.message,
        validationType: 'live_reading'
      }, {
        source: { file: 'SensorHealthValidator.ts', method: 'validateRange' },
        business: { category: 'sensor', operation: 'range_validation', severity: 'high' },
        deviceId: device._id.toString()
      })
      return { isValid: false }
    }
  }

  /**
   * Layer 3: Historical Pattern Analysis
   * Analyzes recent sensor data for anomalies like stuck values or erratic behavior
   */
  private async validateHistoricalPatterns(device: IDevice, config: IValidationConfig): Promise<boolean> {
    try {
      const hoursBack = config.historyWindow || 24
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
      
      // Query recent sensor data from MonitoringData
      const recentData = await MonitoringData.find({
        // Note: We'll need to find monitoring data by device association
        // This is a simplified query - in practice we'd need to join with monitoring tags
        timestamp: { $gte: cutoffTime }
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean()

      if (recentData.length < 2) {
        // Not enough data for historical analysis
        return true
      }

      // Check for stuck values
      const stuckValueCheck = this.checkForStuckValues(recentData, config.stuckValueThreshold)
      
      // Check for erratic change rates
      const changeRateCheck = this.checkChangeRates(recentData, config.maxChangeRate)

      return stuckValueCheck && changeRateCheck
    } catch (error) {
      this.logger.error(LogTags.sensor.validation.failed, {
        deviceName: device.name,
        error: error.message,
        validationType: 'historical_patterns'
      }, {
        source: { file: 'SensorHealthValidator.ts', method: 'validateHistoricalPatterns' },
        business: { category: 'sensor', operation: 'historical_validation', severity: 'medium' },
        deviceId: device._id.toString()
      })
      // If historical analysis fails, don't fail the overall validation
      return true
    }
  }

  /**
   * Check if sensor values have been stuck at the same value for too long
   */
  private checkForStuckValues(data: any[], thresholdMinutes: number): boolean {
    if (data.length < 2) return true

    const values = data.map(d => d.value)
    const latestValue = values[0]
    
    // Count consecutive readings with the same value
    let sameValueCount = 0
    const maxConsecutive = Math.ceil(thresholdMinutes / 5) // Assuming readings every 5 minutes
    
    for (const value of values) {
      if (Math.abs(value - latestValue) < 0.01) { // Small tolerance for floating point
        sameValueCount++
        if (sameValueCount > maxConsecutive) {
          return false // Values are stuck
        }
      } else {
        break // Found different value
      }
    }

    return true
  }

  /**
   * Check if sensor change rates are within acceptable limits
   */
  private checkChangeRates(data: any[], maxChangeRate: number): boolean {
    if (data.length < 2) return true

    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i]
      const previous = data[i + 1]
      
      const timeDiff = (current.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60) // minutes
      const valueDiff = Math.abs(current.value - previous.value)
      
      if (timeDiff > 0) {
        const changeRate = valueDiff / timeDiff
        if (changeRate > maxChangeRate) {
          return false // Change rate too high
        }
      }
    }

    return true
  }

  /**
   * Determine overall health status for cached data validation (no communication layer)
   */
  private determineOverallStatusForCachedData(
    physicalValid: boolean, 
    expectedValid: boolean, 
    historical: boolean
  ): SensorHealthStatus {
    // Physical range violation = UNHEALTHY (critical - sensor may be broken)
    if (!physicalValid) {
      return 'UNHEALTHY'
    }

    // Expected range violation = WARNING (needs attention but not critical)
    if (!expectedValid) {
      return 'WARNING'
    }

    // Historical issues = WARNING (trend analysis)
    if (!historical) {
      return 'WARNING'
    }

    // All checks pass = HEALTHY
    return 'HEALTHY'
  }

  /**
   * Determine overall health status based on the three validation layers
   */
  private determineOverallStatus(
    communication: boolean, 
    range: boolean, 
    historical: boolean
  ): SensorHealthStatus {
    // Communication failure = UNHEALTHY
    if (!communication) {
      return 'UNHEALTHY'
    }

    // Range or historical issues = WARNING
    if (!range || !historical) {
      return 'WARNING'
    }

    // All checks pass = HEALTHY
    return 'HEALTHY'
  }

  /**
   * Generate human-readable status message for cached data validation
   */
  private generateStatusMessageForCachedData(
    status: SensorHealthStatus,
    physicalValid: boolean,
    expectedValid: boolean,
    historical: boolean
  ): string {
    if (status === 'HEALTHY') {
      return 'Sensor data is within acceptable ranges - cached validation passed'
    }

    const issues: string[] = []
    
    if (!physicalValid) {
      issues.push('value exceeds physical limits (critical)')
    } else if (!expectedValid) {
      issues.push('value outside expected range (needs attention)')
    }
    if (!historical) {
      issues.push('anomalous behavior pattern')
    }

    return `Sensor health ${status.toLowerCase()} (cached data): ${issues.join(', ')}`
  }

  /**
   * Generate human-readable status message
   */
  private generateStatusMessage(
    status: SensorHealthStatus,
    communication: boolean,
    range: boolean,
    historical: boolean
  ): string {
    if (status === 'HEALTHY') {
      return 'Sensor is operating normally - all validation layers passed'
    }

    const issues: string[] = []
    
    if (!communication) {
      issues.push('communication failure')
    }
    if (!range) {
      issues.push('value out of range')
    }
    if (!historical) {
      issues.push('anomalous behavior pattern')
    }

    return `Sensor health ${status.toLowerCase()}: ${issues.join(', ')}`
  }
}