// ABOUTME: DHT22 temperature and humidity sensor template configuration
// ABOUTME: Defines environmental sensor specifications, calibration config, and single-wire pulse communication parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const dht22Template: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'DHT22',
  physicalType: 'temperature_humidity',
  displayName: 'DHT22 Temperature & Humidity Sensor',
  description: 'Digital temperature and humidity sensor with single-wire communication (temp: -40 to +80°C ±0.5°C, humidity: 0-100% RH ±2-5%)',
  manufacturer: 'Aosong Electronics',
  model: 'DHT22/AM2302',
  requiredCommand: 'SINGLE_WIRE_PULSE',
  defaultUnits: ['°C', '%RH'],

  portRequirements: [
    {
      role: 'data',
      type: 'digital',
      required: true,
      defaultPin: 'D2',
      description: 'DHT22 data pin for single-wire communication'
    }
  ],

  executionConfig: {
    strategy: 'arduino_native',
    commandType: 'SINGLE_WIRE_PULSE',
    parameters: {
      startLowDuration: 18000,  // 18ms start signal for DHT22
      startHighDuration: 40,    // 40μs high signal
      bitThreshold: 40,         // 40μs bit threshold
      numBits: 40,             // 40 bits data
      timeout: 5000            // 5 second timeout for response
    },
    responseMapping: {
      valueKey: 'sensor_data',
      unit: '°C/%RH',
      conversion: 'dht22_decode', // Custom conversion method identifier
      validation: {
        temperature: { min: -40, max: 80 },
        humidity: { min: 0, max: 100 }
      }
    },
    timeout: 5000
  },

  uiConfig: {
    // icon: 'thermostat',  // UNUSED: Not currently used in frontend
    // color: '#00BCD4',    // UNUSED: Not currently used in frontend
    category: 'Температура + Влажност',
    // formFields: {        // UNUSED: Not currently used in frontend
    //   showCalibration: true,
    //   calibrationFields: ['tempOffset', 'humidityOffset', 'referenceConditions'],
    //   calibrationNotes: 'Use reference thermometer and hygrometer for calibration in controlled conditions'
    // }
  },



  

  isActive: true,
  version: '1.0.0'
}

export default dht22Template
