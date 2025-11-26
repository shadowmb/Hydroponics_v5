// ABOUTME: DS18B20 digital temperature sensor template configuration
// ABOUTME: Defines 1-Wire temperature sensor specifications, calibration config, and communication parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const ds18b20Template: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'DS18B20',
  physicalType: 'temperature_humidity',
  displayName: 'DS18B20 Temperature Sensor',
  description: 'Digital temperature sensor with 1-Wire communication (-55°C to +125°C, ±0.5°C accuracy)',
  manufacturer: 'Maxim Integrated',
  model: 'DS18B20',
  requiredCommand: 'SINGLE_WIRE_ONEWIRE',
  defaultUnits: ['°C'],

  portRequirements: [
    {
      role: 'data',
      type: 'digital',
      required: true,
      defaultPin: 'D4',
      description: 'DS18B20 data pin for 1-Wire communication (requires 4.7kΩ pull-up resistor)'
    }
  ],

  executionConfig: {
    strategy: 'arduino_native',
    commandType: 'SINGLE_WIRE_ONEWIRE',
    parameters: {
      timeout: 5000          // 5 second timeout for response
    },
    responseMapping: {
      valueKey: 'temperature',
      unit: '°C',
      conversion: 'ds18b20_decode', // Custom conversion method identifier
      validation: {
        temperature: { min: -55, max: 125 }
      }
    },
    timeout: 5000
  },

  uiConfig: {
    // icon: 'device_thermostat',  // UNUSED: Not currently used in frontend
    // color: '#FF5722',            // UNUSED: Not currently used in frontend
    category: 'Температура + Влажност',
    // formFields: {                // UNUSED: Not currently used in frontend
    //   showCalibration: true,
    //   calibrationFields: ['tempOffset', 'referenceConditions'],
    //   calibrationNotes: 'Use reference thermometer for calibration in controlled temperature environment'
    // }
  },

  

  isActive: true,
  version: '1.0.0'
}

export default ds18b20Template
