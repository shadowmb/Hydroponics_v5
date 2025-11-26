// ABOUTME: Temperature and humidity sensor converter supporting multiple sensor types (DHT22, DS18B20, etc.)
// ABOUTME: Handles both single-value (temperature-only) and dual-value sensors with protocol decoding

import { BaseConverter, ConversionResult, ConversionParams, CalibrationPoint } from './BaseConverter'

export class TemperatureHumidityConverter extends BaseConverter {
  private static readonly DEFAULT_CALIBRATION_POINTS: CalibrationPoint[] = [
    { adc: null, targetValue: 25 },    // Room temperature (25°C) - universal standard
    { adc: null, targetValue: 50 }     // Medium humidity (50% RH) - universal standard
  ]

  constructor() {
    super('temperature_humidity', ['°C', '%RH', 'dual'])
  }

  getDefaultUnit(): string {
    return '°C/%RH'
  }

  async convert(rawValue: number | any, params?: ConversionParams): Promise<ConversionResult> {
    console.log(`[TemperatureHumidityConverter] DEBUG: convert() called with rawValue:`, JSON.stringify(rawValue))
    let convertedValue: any
    let calibrationApplied = false
    let calibrationPointCount = 0
    let conversionMethod = 'default'

    // Extract raw data from new command response formats
    let actualRawData: number[]
    if (typeof rawValue === 'object' && Array.isArray(rawValue.data)) {
      actualRawData = rawValue.data  // Array of bytes from new commands
      console.log(`[TemperatureHumidityConverter] New command response detected, extracting data array: [${actualRawData}]`)
    } else {
      // Fallback for unexpected format
      actualRawData = []
      console.warn(`[TemperatureHumidityConverter] Unexpected data format, using empty array`)
    }

    // Determine sensor type from device context (if available)
    const deviceType = params?.deviceType || 'DHT22' // Default to DHT22 for backward compatibility

    try {
      // Check if device has calibration points
      if (params?.calibrationData?.isCalibrated && params.calibrationData.points?.length > 0) {
        // For digital sensors: no voltage parameters needed
        convertedValue = this.applyCorrection(actualRawData, params.calibrationData.points, deviceType)
        calibrationApplied = true
        calibrationPointCount = params.calibrationData.points.length
        conversionMethod = this.getCorrectionMethod(calibrationPointCount)
        this.logConversion(actualRawData[0] || 0, convertedValue, `TemperatureHumidity Correction (${conversionMethod})`, `${calibrationPointCount} points, data: [${actualRawData}]`)
      }
      // No calibration - use default protocol decoding based on sensor type
      else {
        convertedValue = this.applyDefaultFormula(actualRawData, deviceType)
        conversionMethod = `${deviceType.toLowerCase()}_protocol`
        this.logConversion(actualRawData[0] || 0, convertedValue, `TemperatureHumidity Protocol Decoding Applied (${deviceType})`, `data: [${actualRawData}]`)
      }

    } catch (error) {
      console.warn(`[TemperatureHumidityConverter] Error during conversion: ${error}`)
      convertedValue = this.applyDefaultFormula(actualRawData, deviceType) // Use default decoding even in error case
      conversionMethod = 'error_fallback'
    }

    // Format values based on sensor type
    const formattedValues = this.formatDualValues(convertedValue, deviceType)
    
    // Use temperature as primary value for compatibility
    const result = this.createResult(
      formattedValues.temperature,
      actualRawData[0] || 0,
      this.getDisplayUnit(deviceType),
      calibrationApplied,
      calibrationPointCount,
      conversionMethod
    )
    
    // Add humidity data if available (for dual-value sensors like DHT22)
    if (formattedValues.humidity !== null) {
      Object.assign(result, {
        humidity: formattedValues.humidity,
        humidityUnit: '%RH'
      })
    }
    
    return result
  }

  /**
   * Get display unit based on sensor type
   */
  private getDisplayUnit(deviceType: string): string {
    return deviceType === 'DS18B20' ? '°C' : '°C/%RH'
  }

  /**
   * Format values for display and processing based on sensor type
   */
  private formatDualValues(convertedValue: any, deviceType: string): {displayValue: string, temperature: number, humidity: number | null} {
    // For temperature-only sensors (DS18B20)
    if (deviceType === 'DS18B20') {
      const temp = typeof convertedValue === 'number' ? convertedValue : (convertedValue?.temperature || 0)
      const clampedTemp = this.clampValue(temp, -55, 125) // DS18B20 range: -55 to +125°C
      
      return {
        displayValue: `${clampedTemp.toFixed(1)}°C`,
        temperature: clampedTemp,
        humidity: null
      }
    }
    
    // For dual-value sensors (DHT22, etc.)
    if (typeof convertedValue === 'object' && convertedValue.temperature !== undefined && convertedValue.humidity !== undefined) {
      const temp = this.clampValue(convertedValue.temperature, -40, 80)  // DHT22 range
      const humidity = this.clampValue(convertedValue.humidity, 0, 100)
      
      return {
        displayValue: `${temp.toFixed(1)}°C / ${humidity.toFixed(1)}%RH`,
        temperature: temp,
        humidity: humidity
      }
    }
    
    // Fallback for unexpected format
    return {
      displayValue: `Invalid ${deviceType} data`,
      temperature: 0,
      humidity: null
    }
  }

  /**
   * Apply correction based on calibration points for temperature/humidity sensors
   */
  private applyCorrection(rawData: number[], calibrationPoints: CalibrationPoint[], deviceType: string): any {
    // First decode the raw data to get temperature (and humidity if applicable)
    const decodedValues = this.decodeProtocol(rawData, deviceType)
    
    // Apply calibration correction to both temperature and humidity if available
    const points = calibrationPoints
      .filter(point => point.targetValue !== undefined && point.measuredValue !== undefined)
      .sort((a, b) => (a.measuredValue! - b.measuredValue!))

    if (points.length === 0) {
      return decodedValues // No calibration, return raw decoded values
    }

    // Apply correction to temperature (and humidity if available)
    let correctedTemperature = decodedValues.temperature
    let correctedHumidity = decodedValues.humidity || null

    if (points.length === 1) {
      // Single point offset correction for temperature
      const tempOffset = points[0].targetValue! - decodedValues.temperature
      correctedTemperature = decodedValues.temperature + tempOffset
    } else if (points.length >= 2) {
      // Linear correction for temperature (assuming temperature calibration points)
      const x1 = points[0].measuredValue!, y1 = points[0].targetValue!
      const x2 = points[1].measuredValue!, y2 = points[1].targetValue!
      const slope = (y2 - y1) / (x2 - x1)
      const offset = y1 - slope * x1
      correctedTemperature = slope * decodedValues.temperature + offset
    }

    // Return appropriate format based on sensor type
    if (deviceType === 'DS18B20') {
      return this.clampValue(correctedTemperature, -55, 125) // DS18B20 temperature range
    } else {
      return {
        temperature: this.clampValue(correctedTemperature, -40, 80), // DHT22 temperature range
        humidity: correctedHumidity !== null ? this.clampValue(correctedHumidity, 0, 100) : null
      }
    }
  }

  /**
   * Apply default protocol decoding based on sensor type
   */
  private applyDefaultFormula(rawData: number[], deviceType: string): any {
    return this.decodeProtocol(rawData, deviceType)
  }

  /**
   * Decode protocol based on sensor type
   */
  private decodeProtocol(rawData: number[], deviceType: string): any {
    switch (deviceType) {
      case 'DS18B20':
        return this.decodeDS18B20Protocol(rawData)
      case 'DHT22':
      default:
        return this.decodeDHT22Protocol(rawData)
    }
  }

  /**
   * Decode DS18B20 protocol from raw data
   * DS18B20 returns temperature data from SINGLE_WIRE_ONEWIRE command
   */
  private decodeDS18B20Protocol(rawData: number[]): number {
    let actualTemperature = 0
    
    if (rawData.length === 0) {
      // No sensor data (presence detected but no actual sensor)
      actualTemperature = 0
      console.log(`[TemperatureHumidityConverter] DS18B20 No sensor data -> Default: 0°C`)
    } else if (rawData.length >= 2) {
      // DS18B20 raw data format: first 2 bytes are temperature (little-endian)
      const tempLow = rawData[0] || 0
      const tempHigh = rawData[1] || 0
      
      // Reconstruct 16-bit signed temperature value
      let temperatureRaw = (tempHigh << 8) | tempLow
      
      // Handle negative temperatures (two's complement)
      if (temperatureRaw & 0x8000) {
        temperatureRaw = -((~temperatureRaw + 1) & 0xFFFF)
      }
      
      // Convert to actual temperature (DS18B20 LSB = 0.0625°C)
      actualTemperature = temperatureRaw * 0.0625
      console.log(`[TemperatureHumidityConverter] DS18B20 Raw bytes: [${rawData}] -> Temp: ${actualTemperature}°C`)
    } else {
      console.warn(`[TemperatureHumidityConverter] DS18B20 Insufficient data: expected 0 or >=2 bytes, got ${rawData.length}`)
    }
    
    // Clamp to DS18B20 valid range
    const clampedTemperature = this.clampValue(actualTemperature, -55, 125)
    
    return clampedTemperature
  }

  /**
   * Decode DHT22 protocol from raw data
   * Unpacks the 40-bit DHT22 data received from SINGLE_WIRE_BIT_TIMING command
   */
  private decodeDHT22Protocol(rawData: number[]): { temperature: number, humidity: number } {
    console.log(`[TemperatureHumidityConverter] DHT22 DECODE START - Raw data:`, rawData)
    let actualTemperature = 0
    let actualHumidity = 0
    
    if (rawData.length >= 5) {
      // DHT22 data format: 5 bytes [humidityH, humidityL, temperatureH, temperatureL, checksum]
      const byte0 = rawData[0] || 0  // Humidity high byte
      const byte1 = rawData[1] || 0  // Humidity low byte
      const byte2 = rawData[2] || 0  // Temperature high byte
      const byte3 = rawData[3] || 0  // Temperature low byte
      const checksum = rawData[4] || 0
      
      // Verify checksum
      const calculatedChecksum = (byte0 + byte1 + byte2 + byte3) & 0xFF
      if (checksum !== calculatedChecksum) {
        console.warn(`[TemperatureHumidityConverter] DHT22 Checksum error: expected ${calculatedChecksum}, got ${checksum}`)
      }
      
      // Convert to actual values (DHT22 format: values are multiplied by 10)
      const humidityRaw = (byte0 << 8) | byte1
      const temperatureRaw = (byte2 << 8) | byte3
      
      // Handle negative temperature (DHT22 can read negative values)
      let temperature = temperatureRaw
      if (temperature & 0x8000) {
        temperature = -(temperature & 0x7FFF)
      }
      
      actualTemperature = temperature / 10.0
      actualHumidity = humidityRaw / 10.0
      
      console.log(`[TemperatureHumidityConverter] DHT22 Raw bytes: [${rawData}] -> Temp: ${actualTemperature}°C, Humidity: ${actualHumidity}%RH`)
    } else {
      console.warn(`[TemperatureHumidityConverter] DHT22 Insufficient data: expected 5 bytes, got ${rawData.length}`)
    }
    
    // Clamp to DHT22 valid ranges
    const clampedTemperature = this.clampValue(actualTemperature, -40, 80)  // DHT22: -40 to +80°C
    const clampedHumidity = this.clampValue(actualHumidity, 0, 100)         // DHT22: 0-100% RH

    return { temperature: clampedTemperature, humidity: clampedHumidity }
  }

  /**
   * Get correction method name based on point count
   */
  private getCorrectionMethod(pointCount: number): string {
    if (pointCount === 1) return 'offset'
    if (pointCount === 2) return 'linear' 
    return 'interpolated'
  }

  /**
   * Validate DHT22 calibration point for temperature or humidity
   */
  static validateCalibrationPoint(targetValue: number, type: 'temperature' | 'humidity'): boolean {
    if (type === 'temperature') {
      // DHT22 temperature range: -40 to +80°C
      return targetValue >= -40 && targetValue <= 80
    } else {
      // DHT22 humidity range: 0-100% RH
      return targetValue >= 0 && targetValue <= 100
    }
  }

  /**
   * Get recommended calibration points for DHT22 sensors
   */
  static getRecommendedCalibrationPoints(): Array<{name: string, targetValue: number, type: string}> {
    return [
      { name: 'room_temp', targetValue: 25, type: 'temperature (°C)' },
      { name: 'cold_temp', targetValue: 10, type: 'temperature (°C)' },
      { name: 'medium_humidity', targetValue: 50, type: 'humidity (%RH)' },
      { name: 'high_humidity', targetValue: 80, type: 'humidity (%RH)' }
    ]
  }

  /**
   * Parse DHT22 dual values from converter result
   */
  static parseDualValues(convertedValue: any): { temperature: number, humidity: number } {
    if (typeof convertedValue === 'object' && convertedValue.temperature !== undefined && convertedValue.humidity !== undefined) {
      return {
        temperature: Number(convertedValue.temperature) || 0,
        humidity: Number(convertedValue.humidity) || 0
      }
    }
    
    // Fallback for unexpected format
    return { temperature: 0, humidity: 0 }
  }
}