// ABOUTME: Ultrasonic sensor converter for distance measurement sensors like HC-SR04
// ABOUTME: Uses calibration-based approach like pH/EC sensors with correction methods

import { BaseConverter, ConversionResult, ConversionParams, CalibrationPoint } from './BaseConverter'

export class SonicConverter extends BaseConverter {

  constructor() {
    super('ultrasonic', ['cm', 'raw'])
  }

  getDefaultUnit(): string {
    return 'cm'
  }

  async convert(rawValue: number, params?: ConversionParams): Promise<ConversionResult> {
    let convertedValue: number
    let calibrationApplied = false
    let calibrationPointCount = 0
    let conversionMethod = 'default'

    try {
      // Check if device has calibration points
      if (params?.calibrationData?.isCalibrated && params.calibrationData.points?.length > 0) {
        convertedValue = this.applyCorrection(rawValue, params.calibrationData.points)
        calibrationApplied = true
        calibrationPointCount = params.calibrationData.points.length
        conversionMethod = this.getCorrectionMethod(calibrationPointCount)
        this.logConversion(rawValue, convertedValue, `Distance Correction (${conversionMethod})`, `${calibrationPointCount} points`)
      }
      // No calibration - use default formula
      else {
        convertedValue = this.applyDefaultFormula(rawValue)
        conversionMethod = 'default_formula'
        this.logConversion(rawValue, convertedValue, 'Default Formula Applied')
      }

      // Clamp distance to valid range (0-400 cm for HC-SR04)
      convertedValue = this.clampValue(convertedValue, 0, 400)

    } catch (error) {
      console.warn(`[SonicConverter] Error during distance conversion: ${error}`)
      convertedValue = this.applyDefaultFormula(rawValue) // Use default formula even in error case
      conversionMethod = 'error_fallback'
    }

    return this.createResult(
      convertedValue,
      rawValue,
      this.getDefaultUnit(),
      calibrationApplied,
      calibrationPointCount,
      conversionMethod
    )
  }

  /**
   * Apply correction based on calibration points with automatic method selection
   */
  private applyCorrection(rawValue: number, calibrationPoints: CalibrationPoint[]): number {
    // Convert to simple point format  
    const points = calibrationPoints
      .filter(point => point.targetValue !== undefined && point.measuredValue !== undefined)
      .map(point => ({
        measured: point.measuredValue!,  // µs duration
        target: point.targetValue!      // cm distance
      }))
      .sort((a, b) => a.measured - b.measured)

    if (points.length === 0) {
      throw new Error('No valid calibration points found')
    }

    if (points.length === 1) {
      // Single point offset correction using default formula as baseline
      const calibrationPoint = points[0]
      
      // Get expected distance from default formula for both calibration and current reading
      const expectedDistanceAtCalibration = this.applyDefaultFormula(calibrationPoint.measured)
      const expectedDistanceAtCurrent = this.applyDefaultFormula(rawValue)
      
      // Calculate distance offset between expected and actual distance at calibration point
      const distanceOffset = calibrationPoint.target - expectedDistanceAtCalibration
      
      // Apply the same distance offset to current reading
      return expectedDistanceAtCurrent + distanceOffset
    }

    if (points.length === 2) {
      // Linear correction: y = mx + b
      const x1 = points[0].measured, y1 = points[0].target
      const x2 = points[1].measured, y2 = points[1].target
      const slope = (y2 - y1) / (x2 - x1)
      const intercept = y1 - slope * x1
      return slope * rawValue + intercept
    }

    // 3+ points: Use linear interpolation
    return this.linearInterpolation(rawValue, points.map(p => ({ x: p.measured, y: p.target })))
  }

  /**
   * Default distance formula based on physics formula
   * Using direct physics calculation: distance = duration * 0.034 / 2
   */
  private applyDefaultFormula(rawValue: number): number {
    // Physics formula: distance = duration * 0.034 / 2
    // Sound speed in air: ~343 m/s = 0.034 cm/μs
    // Divide by 2 because sound travels to object and back
    return rawValue * 0.034 / 2
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
   * Clamp value to specified range
   */
  protected clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  /**
   * Log conversion details
   */
  protected logConversion(rawValue: number, convertedValue: number, method: string, details?: string): void {
    const detailsStr = details ? ` (${details})` : ''
    console.log(`[SonicConverter] ${rawValue}µs → ${convertedValue.toFixed(2)}cm via ${method}${detailsStr}`)
  }
}