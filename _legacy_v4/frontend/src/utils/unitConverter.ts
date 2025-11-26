/**
 * Unit Converter Utility
 * Централизирано управление на конверсии между различни мерни единици
 */

// TypeScript типове за единиците
export type ECUnit = 'us-cm' | 'ms-cm' | 'ppm-500' | 'ppm-700'
export type TemperatureUnit = 'celsius' | 'fahrenheit'
export type LightUnit = 'lux' | 'ppfd'
export type VolumeUnit = 'ml' | 'l'

export interface UnitConfig {
  ec: ECUnit
  temperature: TemperatureUnit
  light: LightUnit
  volume: VolumeUnit
}

// EC конверсии (всички към µS/cm като база)
export class ECConverter {
  // Конвертиране към µS/cm
  static toMicroSiemens(value: number, fromUnit: ECUnit): number {
    switch (fromUnit) {
      case 'us-cm': return value
      case 'ms-cm': return value * 1000
      case 'ppm-500': return value * 2 // ppm * 2 = µS/cm (factor 500)
      case 'ppm-700': return value * 1.43 // ppm * 1.43 = µS/cm (factor 700)
      default: return value
    }
  }

  // Конвертиране от µS/cm към желаната единица
  static fromMicroSiemens(value: number, toUnit: ECUnit): number {
    switch (toUnit) {
      case 'us-cm': return value
      case 'ms-cm': return value / 1000
      case 'ppm-500': return value / 2
      case 'ppm-700': return value / 1.43
      default: return value
    }
  }

  // Директна конверсия между всякакви EC единици
  static convert(value: number, fromUnit: ECUnit, toUnit: ECUnit): number {
    if (fromUnit === toUnit) return value
    const microSiemens = this.toMicroSiemens(value, fromUnit)
    return this.fromMicroSiemens(microSiemens, toUnit)
  }
}

// Температурни конверсии
export class TemperatureConverter {
  static convert(value: number, fromUnit: TemperatureUnit, toUnit: TemperatureUnit): number {
    if (fromUnit === toUnit) return value
    
    if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
      return (value * 9/5) + 32
    }
    if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
      return (value - 32) * 5/9
    }
    
    return value
  }
}

// Светлинни конверсии (приблизителни)
export class LightConverter {
  // Приблизителна конверсия: 1 PPFD ≈ 54 lux (за бяла LED светлина)
  static convert(value: number, fromUnit: LightUnit, toUnit: LightUnit): number {
    if (fromUnit === toUnit) return value
    
    if (fromUnit === 'lux' && toUnit === 'ppfd') {
      return value / 54
    }
    if (fromUnit === 'ppfd' && toUnit === 'lux') {
      return value * 54
    }
    
    return value
  }
}

// Обемни конверсии
export class VolumeConverter {
  static convert(value: number, fromUnit: VolumeUnit, toUnit: VolumeUnit): number {
    if (fromUnit === toUnit) return value
    
    if (fromUnit === 'ml' && toUnit === 'l') {
      return value / 1000
    }
    if (fromUnit === 'l' && toUnit === 'ml') {
      return value * 1000
    }
    
    return value
  }
}

// Универсален конвертор
export class UnitConverter {
  static convertEC(value: number, fromUnit: ECUnit, toUnit: ECUnit): number {
    return ECConverter.convert(value, fromUnit, toUnit)
  }

  static convertTemperature(value: number, fromUnit: TemperatureUnit, toUnit: TemperatureUnit): number {
    return TemperatureConverter.convert(value, fromUnit, toUnit)
  }

  static convertLight(value: number, fromUnit: LightUnit, toUnit: LightUnit): number {
    return LightConverter.convert(value, fromUnit, toUnit)
  }

  static convertVolume(value: number, fromUnit: VolumeUnit, toUnit: VolumeUnit): number {
    return VolumeConverter.convert(value, fromUnit, toUnit)
  }
}

// Utility функции за форматиране
export class UnitFormatter {
  static formatValue(value: number, decimals: number = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  static getUnitLabel(unit: ECUnit | TemperatureUnit | LightUnit | VolumeUnit): string {
    const labels: Record<string, string> = {
      'us-cm': 'µS/cm',
      'ms-cm': 'mS/cm',
      'ppm-500': 'ppm',
      'ppm-700': 'ppm',
      'celsius': '°C',
      'fahrenheit': '°F',
      'lux': 'lux',
      'ppfd': 'µmol/m²/s',
      'ml': 'ml',
      'l': 'L'
    }
    return labels[unit] || unit
  }
}