// ABOUTME: Flow sensor converter for liquid flow measurement using pulse counting (SEN0551, etc.)
// ABOUTME: Converts pulse counts to flow rates with calibration support and multiple output units

import { BaseConverter, ConversionResult, ConversionParams, CalibrationPoint } from './BaseConverter'

export class FlowConverter extends BaseConverter {
  private static readonly DEFAULT_CALIBRATION_POINTS: CalibrationPoint[] = [
    { adc: null, targetValue: 1.0 },   // 1 L/min flow rate
    { adc: null, targetValue: 10.0 }   // 10 L/min flow rate
  ]

  constructor() {
    super('flow', ['L/min', 'L/h', 'mL/min', 'pulses/sec', 'raw'])
  }

  getDefaultUnit(): string {
    return 'L/min'
  }

  async convert(rawValue: any, params?: ConversionParams): Promise<ConversionResult> {
    let convertedValue: number
    let calibrationApplied = false
    let calibrationPointCount = 0
    let conversionMethod = 'default'

    // Extract data from PULSE_COUNT Arduino response
    const pulseCount = rawValue?.pulseCount || 0
    const measurementTime = rawValue?.measurementTime || 5000  // ms
    const pulsesPerSecond = rawValue?.pulsesPerSecond || 0

    // Get device-specific parameters
    const deviceType = params?.deviceType || 'SEN0551'
    const pulsesPerLiter = this.getPulsesPerLiter(deviceType)

    try {
      // Check if device has calibration points
      if (params?.calibrationData?.isCalibrated && params.calibrationData.points?.length > 0) {
        // Apply calibration correction to flow rate
        const rawFlowRate = this.calculateFlowRate(pulsesPerSecond, pulsesPerLiter)
        convertedValue = this.applyCorrection(rawFlowRate, params.calibrationData.points)
        calibrationApplied = true
        calibrationPointCount = params.calibrationData.points.length
        conversionMethod = this.getCorrectionMethod(calibrationPointCount)
        this.logConversion(pulsesPerSecond, convertedValue, `Flow Correction (${conversionMethod})`, `${calibrationPointCount} points`)
      }
      // No calibration - use default formula
      else {
        convertedValue = this.applyDefaultFormula(pulsesPerSecond, pulsesPerLiter)
        conversionMethod = 'default_formula'
        this.logConversion(pulsesPerSecond, convertedValue, `Flow Formula Applied (${deviceType})`, `${pulseCount} pulses in ${measurementTime}ms`)
      }

      // Clamp flow rate to valid range (0-50 L/min for typical flow sensors)
      convertedValue = this.clampValue(convertedValue, 0, 50)

    } catch (error) {
      console.warn(`[FlowConverter] Error during flow conversion: ${error}`)
      convertedValue = this.applyDefaultFormula(pulsesPerSecond, pulsesPerLiter)
      conversionMethod = 'error_fallback'
    }

    const result = this.createResult(
      convertedValue,
      pulsesPerSecond,
      this.getDefaultUnit(),
      calibrationApplied,
      calibrationPointCount,
      conversionMethod
    )

    // Add additional flow data for debugging/monitoring
    Object.assign(result, {
      pulseCount: pulseCount,
      measurementTime: measurementTime,
      pulsesPerSecond: pulsesPerSecond,
      pulsesPerLiter: pulsesPerLiter,
      deviceType: deviceType
    })

    return result
  }

  /**
   * Get pulses per liter for different flow sensor types
   */
  private getPulsesPerLiter(deviceType: string): number {
    const pulsesPerLiterMap: Record<string, number> = {
      'SEN0550': 150,    // DFRobot SEN0550: 150 pulses = 1L
      'SEN0551': 75,     // DFRobot SEN0551: 75 pulses = 1L
      'YF-S201': 450,    // Generic water flow sensor: 450 pulses = 1L
      'YF-S401': 5880,   // Precision flow sensor: 5880 pulses = 1L
      'generic': 450     // Default fallback
    }

    return pulsesPerLiterMap[deviceType] || pulsesPerLiterMap['generic']
  }

  /**
   * Apply correction based on calibration points
   */
  private applyCorrection(rawFlowRate: number, calibrationPoints: CalibrationPoint[]): number {
    const points = calibrationPoints
      .filter(point => point.targetValue !== undefined && point.measuredValue !== undefined)
      .sort((a, b) => (a.measuredValue! - b.measuredValue!))

    if (points.length === 0) {
      return rawFlowRate
    }

    if (points.length === 1) {
      // Single point offset correction
      const offset = points[0].targetValue! - points[0].measuredValue!
      return rawFlowRate + offset
    }

    // Linear interpolation for multiple points
    return this.applyMultiPointCalibration(rawFlowRate, points)
  }

  /**
   * Apply default flow calculation formula
   */
  private applyDefaultFormula(pulsesPerSecond: number, pulsesPerLiter: number): number {
    // Convert pulses/sec to L/min
    // Flow rate (L/min) = (pulses/sec * 60) / pulses_per_liter
    const flowRateL_per_min = (pulsesPerSecond * 60) / pulsesPerLiter
    return flowRateL_per_min
  }

  /**
   * Calculate flow rate from pulses per second
   */
  private calculateFlowRate(pulsesPerSecond: number, pulsesPerLiter: number): number {
    return this.applyDefaultFormula(pulsesPerSecond, pulsesPerLiter)
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
   * Validate flow rate calibration point
   */
  static validateCalibrationPoint(targetValue: number): boolean {
    // Flow rates should be positive and reasonable (0-100 L/min)
    return targetValue >= 0 && targetValue <= 100
  }

  /**
   * Get recommended calibration points for flow sensors
   */
  static getRecommendedCalibrationPoints(): Array<{name: string, targetValue: number, type: string}> {
    return [
      { name: 'low_flow', targetValue: 1.0, type: 'flow rate (L/min)' },
      { name: 'medium_flow', targetValue: 5.0, type: 'flow rate (L/min)' },
      { name: 'high_flow', targetValue: 15.0, type: 'flow rate (L/min)' }
    ]
  }

  /**
   * Convert flow rate to different units
   */
  static convertFlowUnit(value: number, fromUnit: string, toUnit: string): number {
    // Base unit: L/min
    const toL_per_min = (value: number, from: string): number => {
      switch (from) {
        case 'L/h': return value / 60
        case 'mL/min': return value / 1000
        case 'L/min': 
        default: return value
      }
    }

    const fromL_per_min = (value: number, to: string): number => {
      switch (to) {
        case 'L/h': return value * 60
        case 'mL/min': return value * 1000
        case 'L/min':
        default: return value
      }
    }

    const baseValue = toL_per_min(value, fromUnit)
    return fromL_per_min(baseValue, toUnit)
  }
}