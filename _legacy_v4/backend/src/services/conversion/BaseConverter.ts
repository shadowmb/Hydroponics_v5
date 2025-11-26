// ABOUTME: Base abstract class for sensor data conversion with calibration support
// ABOUTME: Provides common methods for linear interpolation and calibration management

export interface ConversionResult {
  value: number
  unit: string
  rawValue: number
  calibrationApplied?: boolean
  calibrationPoints?: number
  conversionMethod?: string
}

export interface CalibrationPoint {
  name?: string
  adc?: number
  voltage?: number
  targetValue: number
  measuredValue?: number
  timestamp?: Date
}

export interface ConversionParams {
  calibrationData?: {
    points?: CalibrationPoint[]
    slope?: number
    offset?: number
    isCalibrated?: boolean
    lastCalibrated?: Date
    method?: 'linear' | 'piecewise' | 'pchip'
    referenceVoltage?: number
    recordedVoltage?: number  // Voltage при който са записани точките
  }
  deviceType?: string  // Device type for sensor-specific conversion logic
  templateParams?: Record<string, any>
  additionalData?: Record<string, any>
  rawResponse?: any  // Raw response from hardware for additional processing
}

export abstract class BaseConverter {
  protected physicalType: string
  protected supportedUnits: string[]

  constructor(physicalType: string, supportedUnits: string[] = ['raw']) {
    this.physicalType = physicalType
    this.supportedUnits = supportedUnits
  }

  /**
   * Main conversion method - must be implemented by each converter
   */
  abstract convert(rawValue: number, params?: ConversionParams): Promise<ConversionResult>

  /**
   * Get the default unit for this converter
   */
  abstract getDefaultUnit(): string

  /**
   * Validate if a unit is supported by this converter
   */
  isUnitSupported(unit: string): boolean {
    return this.supportedUnits.includes(unit)
  }

  /**
   * Apply calibration using multiple calibration points with linear interpolation
   */
  protected applyMultiPointCalibration(rawValue: number, calibrationPoints: CalibrationPoint[]): number {
    if (!calibrationPoints || calibrationPoints.length === 0) {
      return rawValue
    }

    // Single point calibration - simple offset
    if (calibrationPoints.length === 1) {
      const point = calibrationPoints[0]
      const measuredValue = point.measuredValue || point.adc || rawValue
      const offset = point.targetValue - measuredValue
      return rawValue + offset
    }

    // Multi-point calibration - linear interpolation
    const sortedPoints = calibrationPoints
      .filter(p => p.measuredValue !== undefined || p.adc !== undefined)
      .map(p => ({
        x: p.measuredValue || p.adc || 0,
        y: p.targetValue
      }))
      .sort((a, b) => a.x - b.x)

    if (sortedPoints.length < 2) {
      return rawValue
    }

    return this.linearInterpolation(rawValue, sortedPoints)
  }

  /**
   * Apply linear regression calibration using slope and offset
   */
  protected applyLinearRegression(rawValue: number, slope: number, offset: number): number {
    return slope * rawValue + offset
  }

  /**
   * Linear interpolation between calibration points
   */
  protected linearInterpolation(x: number, points: Array<{x: number, y: number}>): number {
    if (points.length === 0) return x
    if (points.length === 1) return points[0].y

    // Find the two points that bracket the input value
    let i = 0
    while (i < points.length - 1 && points[i + 1].x <= x) {
      i++
    }

    // If x is outside the range, use the closest endpoint
    if (i === 0 && x < points[0].x) {
      return points[0].y
    }
    if (i === points.length - 1) {
      return points[points.length - 1].y
    }

    // Linear interpolation between points[i] and points[i+1]
    const p1 = points[i]
    const p2 = points[i + 1]
    
    const slope = (p2.y - p1.y) / (p2.x - p1.x)
    return p1.y + slope * (x - p1.x)
  }

  /**
   * Clamp value to specified range
   */
  protected clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  /**
   * Round value to specified decimal places
   */
  protected roundToPrecision(value: number, decimals: number = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  /**
   * Convert ADC value to voltage
   */
  protected adcToVoltage(adcValue: number, maxAdc: number = 1023, maxVoltage: number = 5.0): number {
    return (adcValue / maxAdc) * maxVoltage
  }

  /**
   * Log conversion details for debugging
   */
  protected logConversion(rawValue: number, convertedValue: number, method: string, additionalInfo?: string): void {
    const info = additionalInfo ? ` (${additionalInfo})` : ''
    console.log(`[${this.physicalType.toUpperCase()}Converter] ${method}: ${rawValue} → ${convertedValue}${info}`)
  }

  /**
   * Create standard conversion result
   */
  protected createResult(
    convertedValue: number, 
    rawValue: number, 
    unit: string, 
    calibrationApplied: boolean = false,
    calibrationPoints: number = 0,
    method: string = 'standard'
  ): ConversionResult {
    return {
      value: this.roundToPrecision(convertedValue),
      unit,
      rawValue,
      calibrationApplied,
      calibrationPoints,
      conversionMethod: method
    }
  }
}