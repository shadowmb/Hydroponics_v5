// ABOUTME: Moisture sensor converter for capacitive soil moisture sensors with calibration support
// ABOUTME: Uses calibration-based approach like pH/EC sensors with voltage scaling and correction methods

import { BaseConverter, ConversionResult, ConversionParams, CalibrationPoint } from './BaseConverter'

export class MoistureConverter extends BaseConverter {

  constructor() {
    super('moisture', ['%', 'raw'])
  }

  getDefaultUnit(): string {
    return '%'
  }

  async convert(rawValue: number, params?: ConversionParams): Promise<ConversionResult> {
    let convertedValue: number
    let calibrationApplied = false
    let calibrationPointCount = 0
    let conversionMethod = 'default'

    try {
      // Check if device has calibration points
      if (params?.calibrationData?.isCalibrated && params.calibrationData.points?.length > 0) {
        const referenceVoltage = params.calibrationData.referenceVoltage || 3.3
        const recordedVoltage = params.calibrationData.recordedVoltage || 3.3
        convertedValue = this.applyCorrection(rawValue, params.calibrationData.points, referenceVoltage, recordedVoltage)
        calibrationApplied = true
        calibrationPointCount = params.calibrationData.points.length
        conversionMethod = this.getCorrectionMethod(calibrationPointCount)
        this.logConversion(rawValue, convertedValue, `Moisture Correction (${conversionMethod})`, `${calibrationPointCount} points`)
      }
      // No calibration - use default formula with voltage scaling
      else {
        const referenceVoltage = params?.calibrationData?.referenceVoltage || 3.3
        convertedValue = this.applyDefaultFormula(rawValue, referenceVoltage)
        conversionMethod = 'default_formula'
        this.logConversion(rawValue, convertedValue, `Default Formula Applied (${referenceVoltage}V)`)
      }

      // Clamp moisture to valid range (0-100%)
      convertedValue = this.clampValue(convertedValue, 0, 100)

    } catch (error) {
      console.warn(`[MoistureConverter] Error during moisture conversion: ${error}`)
      const referenceVoltage = params?.calibrationData?.referenceVoltage || 3.3
      convertedValue = this.applyDefaultFormula(rawValue, referenceVoltage) // Use default formula even in error case
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
  private applyCorrection(rawValue: number, calibrationPoints: CalibrationPoint[], referenceVoltage: number = 3.3, recordedVoltage: number = 3.3): number {
    // Convert to simple point format and scale based on voltage difference
    const voltageRatio = referenceVoltage / recordedVoltage
    const points = calibrationPoints
      .filter(point => point.targetValue !== undefined && point.measuredValue !== undefined)
      .map(point => ({
        measured: Math.round(point.measuredValue! * voltageRatio),
        target: point.targetValue!
      }))
      .sort((a, b) => a.measured - b.measured)

    if (points.length === 0) {
      throw new Error('No valid calibration points found')
    }

    if (points.length === 1) {
      // Single point offset correction using default formula as baseline
      const calibrationPoint = points[0]
      
      // Get expected moisture from default formula for both calibration and current reading
      const expectedMoistureAtCalibration = this.applyDefaultFormula(calibrationPoint.measured, referenceVoltage)
      const expectedMoistureAtCurrent = this.applyDefaultFormula(rawValue, referenceVoltage)
      
      // Calculate moisture offset between expected and actual moisture at calibration point
      const moistureOffset = calibrationPoint.target - expectedMoistureAtCalibration
      
      // Apply the same moisture offset to current reading
      return expectedMoistureAtCurrent + moistureOffset
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
   * Default moisture formula with voltage scaling
   * Base points at 3.3V: 0% → 1023 ADC, 100% → 0 ADC (inverted for capacitive sensors)
   */
  private applyDefaultFormula(rawValue: number, referenceVoltage: number = 3.3): number {
    // Base points at 3.3V: high ADC = low moisture (dry), low ADC = high moisture (wet)
    const basePoints = [
      { measured: 0, target: 100.0 },    // Wet: 0 ADC → 100% moisture
      { measured: 1023, target: 0.0 }    // Dry: 1023 ADC → 0% moisture
    ]
    
    // Scale based on voltage (3.3V base)
    const voltageRatio = referenceVoltage / 3.3
    const scaledPoints = basePoints.map(point => ({
      measured: Math.round(point.measured * voltageRatio),
      target: point.target
    }))
    
    // Linear interpolation between scaled points
    const x1 = scaledPoints[0].measured, y1 = scaledPoints[0].target
    const x2 = scaledPoints[1].measured, y2 = scaledPoints[1].target
    const slope = (y2 - y1) / (x2 - x1)
    const offset = y1 - slope * x1
    
    return slope * rawValue + offset
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
    console.log(`[MoistureConverter] ${rawValue} ADC → ${convertedValue.toFixed(2)}% via ${method}${detailsStr}`)
  }
}