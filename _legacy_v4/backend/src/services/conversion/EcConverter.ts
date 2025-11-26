// ABOUTME: EC/TDS sensor data conversion with multi-point calibration support  
// ABOUTME: Handles DFRobot and other EC sensors with standard buffer calibration (1413 µS/cm, 12880 µS/cm)

import { BaseConverter, ConversionResult, ConversionParams, CalibrationPoint } from './BaseConverter'

export class EcConverter extends BaseConverter {
  private static readonly DEFAULT_CALIBRATION_POINTS: CalibrationPoint[] = [
    { adc: null, targetValue: 0 },     // Pure water (0 µS/cm) - universal standard
    { adc: null, targetValue: 1413 }   // Standard EC buffer (1413 µS/cm) - universal standard
  ]

  constructor() {
    super('ec', ['µS/cm', 'mS/cm', 'ppm', 'raw'])
  }

  getDefaultUnit(): string {
    return 'µS/cm'
  }

  async convert(rawValue: number, params?: ConversionParams): Promise<ConversionResult> {
    let convertedValue: number
    let calibrationApplied = false
    let calibrationPointCount = 0
    let conversionMethod = 'default'

    try {
      // Check if device has calibration points
      if (params?.calibrationData?.isCalibrated && params.calibrationData.points?.length > 0) {
        const referenceVoltage = params.calibrationData.referenceVoltage || 5.0
        const recordedVoltage = params.calibrationData.recordedVoltage || 5.0
        convertedValue = this.applyCorrection(rawValue, params.calibrationData.points, referenceVoltage, recordedVoltage)
        calibrationApplied = true
        calibrationPointCount = params.calibrationData.points.length
        conversionMethod = this.getCorrectionMethod(calibrationPointCount)
        this.logConversion(rawValue, convertedValue, `EC Correction (${conversionMethod})`, `${calibrationPointCount} points`)
      }
      // No calibration - use default formula with voltage scaling
      else {
        const referenceVoltage = params?.calibrationData?.referenceVoltage || 5.0
        convertedValue = this.applyDefaultFormula(rawValue, referenceVoltage)
        conversionMethod = 'default_formula'
        this.logConversion(rawValue, convertedValue, `Default Formula Applied (${referenceVoltage}V)`)
      }

      // Clamp EC to valid range (0-20000 µS/cm)
      convertedValue = this.clampValue(convertedValue, 0, 20000)

    } catch (error) {
      console.warn(`[EcConverter] Error during EC conversion: ${error}`)
      const referenceVoltage = params?.calibrationData?.referenceVoltage || 5.0
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
  private applyCorrection(rawValue: number, calibrationPoints: CalibrationPoint[], referenceVoltage: number = 5.0, recordedVoltage: number = 5.0): number {
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
      
      // Get expected EC from default formula for both calibration and current reading
      const expectedECAtCalibration = this.applyDefaultFormula(calibrationPoint.measured, referenceVoltage)
      const expectedECAtCurrent = this.applyDefaultFormula(rawValue, referenceVoltage)
      
      // Calculate EC offset between expected and actual EC at calibration point
      const ecOffset = calibrationPoint.target - expectedECAtCalibration
      
      // Apply the same EC offset to current reading
      return expectedECAtCurrent + ecOffset
    }

    if (points.length === 2) {
      // Linear correction: y = mx + b
      const x1 = points[0].measured, y1 = points[0].target
      const x2 = points[1].measured, y2 = points[1].target
      const slope = (y2 - y1) / (x2 - x1)
      const offset = y1 - slope * x1
      return slope * rawValue + offset
    }

    // 3+ points: Linear interpolation
    return this.linearInterpolation(rawValue, points.map(p => ({ x: p.measured, y: p.target })))
  }

  /**
   * Apply default EC formula using predefined calibration points
   * Uses 2-point linear interpolation: 1413 µS/cm → 193 ADC, 12880 µS/cm → 656 ADC (at 5V)
   * Based on actual measurements with standard calibration solutions
   * Scales points based on reference voltage if provided
   */
  private applyDefaultFormula(rawValue: number, referenceVoltage: number = 5.0): number {
    // Default calibration points based on measured standard EC solutions (at 5V)
    // Using reliable measurements from standard calibration buffers
    const basePoints = [
      { measured: 193, target: 1413 },    // Standard EC buffer (1413 µS/cm) - measured
      { measured: 656, target: 12880 }    // Standard EC buffer (12880 µS/cm) - measured
    ]
    
    // Scale points based on reference voltage
    const voltageRatio = referenceVoltage / 5.0
    const scaledPoints = basePoints.map(point => ({
      measured: Math.round(point.measured * voltageRatio),
      target: point.target
    }))
    
    // Apply linear interpolation with scaled points
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
   * Apply custom calibration using device-specific calibration points (DEPRECATED)
   * This method is kept for backward compatibility but should not be used in new code.
   * Use applyCorrection() instead which includes voltage scaling.
   */
  private applyCustomCalibration(rawValue: number, calibrationPoints: CalibrationPoint[], method: string = 'linear'): number {
    // Convert calibration points to interpolation format
    const interpolationPoints = calibrationPoints
      .filter(point => point.measuredValue !== undefined && point.targetValue !== undefined)
      .map(point => ({
        x: point.measuredValue!,
        y: point.targetValue
      }))
      .sort((a, b) => a.x - b.x)

    if (interpolationPoints.length === 0) {
      throw new Error('No valid calibration points found')
    }

    if (interpolationPoints.length === 1) {
      // Single point calibration - simple offset
      const offset = interpolationPoints[0].y - interpolationPoints[0].x
      return rawValue + offset
    }

    // Apply interpolation based on method
    switch (method.toLowerCase()) {
      case 'piecewise':
        return this.piecewiseInterpolation(rawValue, interpolationPoints)
      case 'pchip':
        return this.pchipInterpolation(rawValue, interpolationPoints)
      case 'linear':
      default:
        return this.linearInterpolation(rawValue, interpolationPoints)
    }
  }

  /**
   * Apply default 2-point linear calibration for universal EC sensors (DEPRECATED)
   * This method is kept for backward compatibility but should not be used in new code.
   * Use applyDefaultFormula() instead which includes voltage scaling.
   */
  private applyDefaultCalibration(adcValue: number): number {
    // Default 2-point linear calibration: EC = slope * ADC + offset
    // Assumptions for typical EC sensor behavior:
    // - EC increases as ADC increases (positive slope)
    // - Theoretical range: 0 µS/cm @ lower ADC, 1413 µS/cm @ higher ADC
    
    // Simple linear mapping for 0-1413 µS/cm range
    // This will need calibration against actual sensor readings
    const EC_RANGE = 1413 - 0 // 1413 µS/cm units
    const TYPICAL_ADC_RANGE = 512 // Assume ~512 ADC units for this EC range
    
    // Linear interpolation: y = mx + b
    // Slope: ΔEC / ΔADC (positive because EC increases as ADC increases)
    const slope = EC_RANGE / TYPICAL_ADC_RANGE
    const midpoint_adc = 256 // Middle ADC value
    const midpoint_ec = (0 + 1413) / 2 // EC 706.5
    const offset = midpoint_ec - (slope * midpoint_adc)
    
    const calculatedEc = slope * adcValue + offset
    
    // Clamp to reasonable range for default calibration
    return Math.max(0, Math.min(20000, calculatedEc))
  }

  /**
   * Convert EC value to different units
   */
  convertToUnit(ecValue: number, targetUnit: string): number {
    switch (targetUnit.toLowerCase()) {
      case 'µs/cm':
      case 'us/cm':
        return ecValue // Already in µS/cm
      
      case 'ms/cm':
        return ecValue / 1000 // Convert µS/cm to mS/cm
      
      case 'ppm':
        // TDS conversion: ppm ≈ EC(µS/cm) * 0.5 (approximate for NaCl solutions)
        return Math.round(ecValue * 0.5)
      
      default:
        throw new Error(`Unsupported EC unit: ${targetUnit}`)
    }
  }

  /**
   * Calculate linear regression parameters from calibration points
   */
  static calculateLinearRegression(calibrationPoints: CalibrationPoint[]): { slope: number, offset: number } {
    if (calibrationPoints.length < 2) {
      throw new Error('At least 2 calibration points required for linear regression')
    }

    const validPoints = calibrationPoints.filter(p => 
      p.measuredValue !== undefined && p.targetValue !== undefined
    )

    if (validPoints.length < 2) {
      throw new Error('At least 2 valid calibration points required')
    }

    const n = validPoints.length
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0

    validPoints.forEach(point => {
      const x = point.measuredValue! // ADC reading
      const y = point.targetValue     // EC value
      sumX += x
      sumY += y
      sumXY += x * y
      sumXX += x * x
    })

    // Linear regression: y = slope * x + offset
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const offset = (sumY - slope * sumX) / n

    return { slope, offset }
  }

  /**
   * Validate EC calibration point
   */
  static validateCalibrationPoint(targetValue: number): boolean {
    // Common EC buffer values in µS/cm
    const standardBuffers = [1413, 12880, 84, 1000, 5000, 10000]
    const tolerance = 50 // µS/cm tolerance

    return standardBuffers.some(buffer => 
      Math.abs(targetValue - buffer) <= tolerance
    ) || (targetValue >= 0 && targetValue <= 20000)
  }

  /**
   * Piecewise linear interpolation between calibration points
   * More accurate than simple linear for multiple segments
   */
  private piecewiseInterpolation(x: number, points: Array<{x: number, y: number}>): number {
    if (points.length < 2) {
      throw new Error('At least 2 points required for piecewise interpolation')
    }

    // Sort points by x value
    const sortedPoints = points.sort((a, b) => a.x - b.x)

    // Handle extrapolation (outside range)
    if (x <= sortedPoints[0].x) {
      return sortedPoints[0].y
    }
    if (x >= sortedPoints[sortedPoints.length - 1].x) {
      return sortedPoints[sortedPoints.length - 1].y
    }

    // Find the segment for interpolation
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i]
      const p2 = sortedPoints[i + 1]
      
      if (x >= p1.x && x <= p2.x) {
        // Linear interpolation within segment
        const t = (x - p1.x) / (p2.x - p1.x)
        return p1.y + t * (p2.y - p1.y)
      }
    }

    // Fallback (should not reach here)
    return this.linearInterpolation(x, points)
  }

  /**
   * PCHIP (Piecewise Cubic Hermite Interpolating Polynomial) interpolation
   * Provides smooth curves with monotonicity preservation
   */
  private pchipInterpolation(x: number, points: Array<{x: number, y: number}>): number {
    if (points.length < 4) {
      console.warn('[EcConverter] PCHIP requires 4+ points, falling back to piecewise')
      return this.piecewiseInterpolation(x, points)
    }

    // Sort points by x value
    const sortedPoints = points.sort((a, b) => a.x - b.x)
    const n = sortedPoints.length
    
    // Handle extrapolation
    if (x <= sortedPoints[0].x) return sortedPoints[0].y
    if (x >= sortedPoints[n - 1].x) return sortedPoints[n - 1].y

    // Find segment
    let segmentIndex = 0
    for (let i = 0; i < n - 1; i++) {
      if (x >= sortedPoints[i].x && x <= sortedPoints[i + 1].x) {
        segmentIndex = i
        break
      }
    }

    // Calculate slopes using finite differences
    const slopes = new Array(n)
    
    // First and last slopes
    slopes[0] = (sortedPoints[1].y - sortedPoints[0].y) / (sortedPoints[1].x - sortedPoints[0].x)
    slopes[n - 1] = (sortedPoints[n - 1].y - sortedPoints[n - 2].y) / (sortedPoints[n - 1].x - sortedPoints[n - 2].x)
    
    // Interior slopes using PCHIP formula
    for (let i = 1; i < n - 1; i++) {
      const h1 = sortedPoints[i].x - sortedPoints[i - 1].x
      const h2 = sortedPoints[i + 1].x - sortedPoints[i].x
      const d1 = (sortedPoints[i].y - sortedPoints[i - 1].y) / h1
      const d2 = (sortedPoints[i + 1].y - sortedPoints[i].y) / h2
      
      // PCHIP slope calculation
      if (d1 * d2 <= 0) {
        slopes[i] = 0 // Local extremum
      } else {
        const w1 = 2 * h2 + h1
        const w2 = h2 + 2 * h1
        slopes[i] = (w1 + w2) / (w1 / d1 + w2 / d2)
      }
    }

    // Hermite interpolation within segment
    const i = segmentIndex
    const h = sortedPoints[i + 1].x - sortedPoints[i].x
    const t = (x - sortedPoints[i].x) / h
    
    const y0 = sortedPoints[i].y
    const y1 = sortedPoints[i + 1].y
    const m0 = slopes[i] * h
    const m1 = slopes[i + 1] * h
    
    // Hermite basis functions
    const h00 = 2 * t * t * t - 3 * t * t + 1
    const h10 = t * t * t - 2 * t * t + t
    const h01 = -2 * t * t * t + 3 * t * t
    const h11 = t * t * t - t * t
    
    return h00 * y0 + h10 * m0 + h01 * y1 + h11 * m1
  }

  /**
   * Get recommended calibration points for EC sensors
   */
  static getRecommendedCalibrationPoints(): Array<{name: string, targetValue: number, bufferSolution: string}> {
    return [
      { name: 'low', targetValue: 1413, bufferSolution: '1413 µS/cm EC buffer' },
      { name: 'high', targetValue: 12880, bufferSolution: '12880 µS/cm EC buffer' },
      { name: 'distilled', targetValue: 0, bufferSolution: 'Distilled water (0 µS/cm)' }
    ]
  }
}