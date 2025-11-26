// ABOUTME: Capacitive soil moisture sensor template configuration
// ABOUTME: Defines moisture sensor specifications, calibration config, and analog reading parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const capacitiveSoilMoistureTemplate: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'capacitive_soil_moisture',
  physicalType: 'moisture',
  displayName: 'Capacitive Soil Moisture',
  description: 'Capacitive soil moisture sensor with analog output (0-100% humidity)',
  manufacturer: 'Various',
  model: 'Capacitive Soil Moisture Sensor Module',
  requiredCommand: 'ANALOG',
  defaultUnits: ['%'],

  portRequirements: [
    {
      role: 'primary',
      type: 'analog',
      required: true,
      defaultPin: 'A0',
      description: 'Analog signal pin for moisture reading'
    }
  ],

  executionConfig: {
    strategy: 'single_command',
    commandType: 'ANALOG',
    parameters: {},
    responseMapping: {
      valueKey: 'sensor_reading',
      unit: '%',
      conversion: 'Math.round((3.0 - raw_value * 3.0 / 1023) / 3.0 * 100)' // Convert voltage to moisture % (inverted - lower voltage = higher moisture)
    },
    timeout: 5000
  },

  uiConfig: {
    // icon: 'opacity',  // UNUSED: Not currently used in frontend
    // color: '#8BC34A',  // UNUSED: Not currently used in frontend
    category: 'Сензори за Влага',
    // formFields: {        // UNUSED: Not currently used in frontend
    // showCalibration: true,
    // calibrationFields: ['dryValue', 'wetValue', 'conversionFormula']
    // }
  },

 

  isActive: true,
  version: '1.0.0'
}

export default capacitiveSoilMoistureTemplate
