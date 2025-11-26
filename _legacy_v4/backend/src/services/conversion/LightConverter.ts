// ABOUTME: Light/PAR sensor converter for photosynthetically active radiation measurement
// ABOUTME: Converts Modbus register values to PAR measurements with calibration support

import { BaseConverter, ConversionResult, ConversionParams, CalibrationPoint } from './BaseConverter'

export class LightConverter extends BaseConverter {
  private static readonly DEFAULT_CALIBRATION_POINTS: CalibrationPoint[] = [
    { adc: null, targetValue: 100.0 },   // 100 µmol/m²·s
    { adc: null, targetValue: 1000.0 }   // 1000 µmol/m²·s
  ]

  constructor() {
    super('light', ['µmol/m²·s', 'raw'])
  }

  getDefaultUnit(): string {
    return 'µmol/m²·s'
  }

  async convert(rawValue: any, params?: ConversionParams): Promise<ConversionResult> {
    let convertedValue: number
    let calibrationApplied = false
    let calibrationPointCount = 0
    let conversionMethod = 'default'

    // Extract data from MODBUS_RTU_READ Arduino response
    const registers = rawValue?.registers || []
    const rawReading = registers[0] || 0  // First register contains PAR value

    // Get device-specific parameters
    const deviceType = params?.deviceType || 'SEN0641'

    try {
      // Check if device has calibration points
      if (params?.calibrationData?.isCalibrated && params.calibrationData.points?.length > 0) {
        // Apply calibration correction to PAR value
        convertedValue = this.applyCorrection(rawReading, params.calibrationData.points)
        calibrationApplied = true
        calibrationPointCount = params.calibrationData.points.length
        conversionMethod = this.getCorrectionMethod(calibrationPointCount)
        this.logConversion(rawReading, convertedValue, `PAR Correction (${conversionMethod})`, `${calibrationPointCount} points`)
      }
      // No calibration - use default formula (direct mapping)
      else {
        convertedValue = this.applyDefaultFormula(rawReading, deviceType)
        conversionMethod = 'direct_mapping'
        this.logConversion(rawReading, convertedValue, `PAR Direct Mapping (${deviceType})`, `raw=${rawReading}`)
      }

      // Clamp PAR value to valid range (0-4000 µmol/m²·s for SEN0641)
      convertedValue = this.clampValue(convertedValue, 0, 4000)

    } catch (error) {
      console.warn(`[LightConverter] Error during PAR conversion: ${error}`)
      convertedValue = this.applyDefaultFormula(rawReading, deviceType)
      conversionMethod = 'error_fallback'
    }

    const result = this.createResult(
      convertedValue,
      rawReading,
      this.getDefaultUnit(),
      calibrationApplied,
      calibrationPointCount,
      conversionMethod
    )

    // Add additional PAR data for debugging/monitoring
    Object.assign(result, {
      rawRegisterValue: rawReading,
      deviceType: deviceType,
      registerCount: registers.length
    })

    return result
  }

  /**
   * Apply correction based on calibration points
   */
  private applyCorrection(rawPAR: number, calibrationPoints: CalibrationPoint[]): number {
    const points = calibrationPoints
      .filter(point => point.targetValue !== undefined && point.measuredValue !== undefined)
      .sort((a, b) => (a.measuredValue! - b.measuredValue!))

    if (points.length === 0) {
      return rawPAR
    }

    if (points.length === 1) {
      // Single point offset correction
      const offset = points[0].targetValue! - points[0].measuredValue!
      return rawPAR + offset
    }

    // Linear interpolation for multiple points
    return this.applyMultiPointCalibration(rawPAR, points)
  }

  /**
   * Apply default PAR formula (direct mapping for most sensors)
   */
  private applyDefaultFormula(rawReading: number, deviceType: string): number {
    // SEN0641 returns PAR value directly in µmol/m²·s
    // No conversion needed - sensor is factory calibrated
    const deviceMultipliers: Record<string, number> = {
      'SEN0641': 1.0,  // DFRobot PAR sensor: direct reading
      'generic': 1.0   // Default: direct reading
    }

    const multiplier = deviceMultipliers[deviceType] || deviceMultipliers['generic']
    return rawReading * multiplier
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
   * Validate PAR calibration point
   */
  static validateCalibrationPoint(targetValue: number): boolean {
    // PAR values should be positive and reasonable (0-4000 µmol/m²·s)
    return targetValue >= 0 && targetValue <= 4000
  }

  /**
   * Get recommended calibration points for PAR sensors
   */
  static getRecommendedCalibrationPoints(): Array<{name: string, targetValue: number, type: string}> {
    return [
      { name: 'low_light', targetValue: 100.0, type: 'PAR (µmol/m²·s)' },
      { name: 'medium_light', targetValue: 500.0, type: 'PAR (µmol/m²·s)' },
      { name: 'high_light', targetValue: 1500.0, type: 'PAR (µmol/m²·s)' }
    ]
  }

  /**
   * Convert PAR to PPFD (Photosynthetic Photon Flux Density) - they are equivalent
   */
  static convertToE_per_m2_per_day(parValue: number, hoursOfLight: number): number {
    // Convert µmol/m²·s to mol/m²·day
    // 1 mol = 1,000,000 µmol
    // PPFD (mol/m²·day) = PAR (µmol/m²·s) * hours * 3600 / 1,000,000
    return (parValue * hoursOfLight * 3600) / 1000000
  }
}
