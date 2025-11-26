// ABOUTME: Factory class for creating sensor converter instances based on physicalType
// ABOUTME: Provides centralized converter creation with support for dynamic loading and caching

import { BaseConverter } from './BaseConverter'
import { PhConverter } from './PhConverter'
import { EcConverter } from './EcConverter'
import { MoistureConverter } from './MoistureConverter'
import { SonicConverter } from './SonicConverter'
import { TemperatureHumidityConverter } from './TemperatureHumidityConverter'
import { FlowConverter } from './FlowConverter'
import { LightConverter } from './LightConverter'
import { DistanceConverter } from './DistanceConverter'

export class ConverterFactory {
  private static converterCache: Map<string, BaseConverter> = new Map()

  /**
   * Create converter instance based on physical sensor type
   */
  static createConverter(physicalType: string): BaseConverter {
    // Check cache first
    if (this.converterCache.has(physicalType)) {
      return this.converterCache.get(physicalType)!
    }

    let converter: BaseConverter

    switch (physicalType.toLowerCase()) {
      case 'ph':
        converter = new PhConverter()
        break

      case 'ec':
        converter = new EcConverter()
        break

      case 'moisture':
        converter = new MoistureConverter()
        break

      case 'ultrasonic':
        converter = new SonicConverter()
        break

      case 'temperature_humidity':
        converter = new TemperatureHumidityConverter()
        break

      case 'flow':
        converter = new FlowConverter()
        break

      case 'light':
      case 'par':
        converter = new LightConverter()
        break

      case 'distance':
        converter = new DistanceConverter()
        break

      // TODO: Add other converters as they are implemented
      // case 'temperature':
      //   converter = new TemperatureConverter()
      //   break

      default:
        throw new Error(`Unsupported physical sensor type: ${physicalType}`)
    }

    // Cache the converter for future use
    this.converterCache.set(physicalType, converter)
    return converter
  }

  /**
   * Check if a converter is available for the given physical type
   */
  static isConverterAvailable(physicalType: string): boolean {
    try {
      this.createConverter(physicalType)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get list of all supported physical types
   */
  static getSupportedPhysicalTypes(): string[] {
    return [
      'ph',
      'ec',
      'moisture',
      'ultrasonic',
      'temperature_humidity',
      'flow',
      'light',
      'par',
      'distance'
      // TODO: Add other types as converters are implemented
      // 'temperature'
    ]
  }

  /**
   * Clear converter cache (useful for testing)
   */
  static clearCache(): void {
    this.converterCache.clear()
  }

  /**
   * Get cached converter without creating new instance
   */
  static getCachedConverter(physicalType: string): BaseConverter | undefined {
    return this.converterCache.get(physicalType)
  }
}