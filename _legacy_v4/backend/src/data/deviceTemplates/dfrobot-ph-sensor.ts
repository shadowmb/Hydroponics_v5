// ABOUTME: DFRobot pH sensor template configuration
// ABOUTME: Defines pH measurement specifications, multi-point calibration config, and analog reading parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const dfrobotPhSensorTemplate: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'dfrobot_ph_sensor',
  physicalType: 'ph',
  displayName: 'DFRobot pH Sensor Pro',
  description: 'Professional analog pH sensor with industrial electrode (0-14 pH range, ±0.1 accuracy)',
  manufacturer: 'DFRobot',
  model: 'SEN0169 - Analog pH Meter Pro',
  requiredCommand: 'ANALOG',
  defaultUnits: ['pH'],

  portRequirements: [
    {
      role: 'primary',
      type: 'analog',
      required: true,
      defaultPin: 'A2',
      description: 'Analog signal pin for pH measurement (millivolt output)'
    }
  ],

  executionConfig: {
    strategy: 'single_command',
    commandType: 'ANALOG',
    parameters: {
      measurementRange: {
        min: 0,      // 0 pH
        max: 14,     // 14 pH
        recommended: { min: 4, max: 10 } // Most common range for hydroponics
      },
      stabilizationTime: 60000 // 1 minute response time
    },
    responseMapping: {
      valueKey: 'sensor_reading',
      unit: 'pH',
      conversion: 'ph_dfrobot_pro', // Custom conversion method identifier
      validation: {
        min: 0,
        max: 14,
        warningThreshold: { low: 4, high: 10 }
      }
    },
    timeout: 5000
  },

  uiConfig: {
    // icon: 'science',  // UNUSED: Not currently used in frontend
    // color: '#E91E63',  // UNUSED: Not currently used in frontend
    category: 'РН Сензори',
    // formFields: {        // UNUSED: Not currently used in frontend
    // showCalibration: true,
    // calibrationFields: ['acidPoint', 'neutralPoint', 'basicPoint', 'temperature'],
    // calibrationNotes: 'Use pH 4.00, 7.00, and 9.18 buffer solutions for three-point calibration'
    // }
  },

  

  isActive: true,
  version: '1.0.0'
}

export default dfrobotPhSensorTemplate
