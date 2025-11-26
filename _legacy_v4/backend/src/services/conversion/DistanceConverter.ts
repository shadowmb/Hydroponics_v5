// ABOUTME: Distance converter for UART-based distance sensors (e.g., SEN0311 ultrasonic)
// ABOUTME: Converts raw mm values from UART stream data to cm with optional calibration

import { BaseConverter, ConversionResult, ConversionParams, CalibrationPoint } from './BaseConverter'

export class DistanceConverter extends BaseConverter {

  constructor() {
    super('distance', ['mm', 'cm', 'm', 'raw'])
  }

  getDefaultUnit(): string {
    return 'cm'
  }

  async convert(rawValue: number | any, params?: ConversionParams): Promise<ConversionResult> {
    let distanceMm: number
    let calibrationApplied = false
    let calibrationPointCount = 0
    let conversionMethod = 'direct'

    try {
      // Extract distance from UART_STREAM_READ response
      if (params?.rawResponse?.data && Array.isArray(params.rawResponse.data)) {
        const data = params.rawResponse.data

        // For SEN0311: data[0] = header (0xFF), data[1] = high byte, data[2] = low byte
        if (data.length >= 3) {
          distanceMm = (data[1] << 8) | data[2]
          conversionMethod = 'uart_stream_parse'
          console.log(`[DistanceConverter] Parsed UART data: [${data}] → ${distanceMm} mm`)
        } else {
          throw new Error(`Invalid UART data length: ${data.length}`)
        }
      } else if (typeof rawValue === 'number') {
        // Direct mm value provided
        distanceMm = rawValue
        conversionMethod = 'direct'
      } else {
        throw new Error('Invalid input: expected number or UART response with data array')
      }

      // Apply calibration if available
      if (params?.calibrationData?.isCalibrated && params.calibrationData.points?.length > 0) {
        distanceMm = this.applyCorrection(distanceMm, params.calibrationData.points)
        calibrationApplied = true
        calibrationPointCount = params.calibrationData.points.length
        conversionMethod = `${conversionMethod}_with_${this.getCorrectionMethod(calibrationPointCount)}`
      }

      // Convert mm → cm
      const distanceCm = distanceMm / 10

      // Clamp to valid range (0-500 cm for typical UART ultrasonic sensors)
      const clampedDistance = this.clampValue(distanceCm, 0, 500)

      const calibInfo = calibrationPointCount > 0 ? `${calibrationPointCount} points` : undefined
      this.logConversion(distanceMm, clampedDistance, conversionMethod, calibInfo)

      return this.createResult(
        clampedDistance,
        distanceMm,
        this.getDefaultUnit(),
        calibrationApplied,
        calibrationPointCount,
        conversionMethod
      )

    } catch (error) {
      console.error(`[DistanceConverter] Conversion error: ${error}`)
      // Fallback: assume rawValue is already in mm
      const fallbackMm = typeof rawValue === 'number' ? rawValue : 0
      const fallbackCm = fallbackMm / 10

      return this.createResult(
        fallbackCm,
        fallbackMm,
        this.getDefaultUnit(),
        false,
        0,
        'error_fallback'
      )
    }
  }

  /**
   * Apply correction based on calibration points
   */
  private applyCorrection(distanceMm: number, calibrationPoints: CalibrationPoint[]): number {
    const points = calibrationPoints
      .filter(point => point.targetValue !== undefined && point.measuredValue !== undefined)
      .map(point => ({
        measured: point.measuredValue!,  // mm measured
        target: point.targetValue!       // mm target
      }))
      .sort((a, b) => a.measured - b.measured)

    if (points.length === 0) {
      throw new Error('No valid calibration points found')
    }

    if (points.length === 1) {
      // Single point offset correction
      const offset = points[0].target - points[0].measured
      return distanceMm + offset
    }

    if (points.length === 2) {
      // Linear correction: y = mx + b
      const x1 = points[0].measured, y1 = points[0].target
      const x2 = points[1].measured, y2 = points[1].target
      const slope = (y2 - y1) / (x2 - x1)
      const intercept = y1 - slope * x1
      return slope * distanceMm + intercept
    }

    // 3+ points: Use linear interpolation
    return this.linearInterpolation(distanceMm, points.map(p => ({ x: p.measured, y: p.target })))
  }

  /**
   * Get correction method name based on point count
   */
  private getCorrectionMethod(pointCount: number): string {
    if (pointCount === 1) return 'offset'
    if (pointCount === 2) return 'linear'
    return 'interpolated'
  }

}
