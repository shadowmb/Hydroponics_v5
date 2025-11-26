// ABOUTME: DFRobot EC (electrical conductivity) sensor template configuration
// ABOUTME: Defines water quality sensor specifications, calibration config, and analog measurement parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const dfrobotEcSensorTemplate: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'dfrobot_ec_sensor',
  physicalType: 'ec',
  displayName: 'DFRobot EC Sensor (K=1)',
  description: 'Lab-grade analog electrical conductivity sensor for water quality monitoring (0-20 ms/cm)',
  manufacturer: 'DFRobot',
  model: 'DFR0300 - Gravity Analog EC Sensor V2',
  requiredCommand: 'ANALOG',
  defaultUnits: ['µS/cm'],

  portRequirements: [
    {
      role: 'primary',
      type: 'analog',
      required: true,
      defaultPin: 'A1',
      description: 'Analog signal pin for EC measurement (0-3.4V output)'
    }
  ],

  executionConfig: {
    strategy: 'single_command',
    commandType: 'ANALOG',
    parameters: {
      measurementRange: {
        min: 0,      // 0 ms/cm
        max: 20000,  // 20 ms/cm (20,000 µS/cm)
        recommended: { min: 1000, max: 15000 } // 1-15 ms/cm
      }
    },
    responseMapping: {
      valueKey: 'sensor_reading',
      unit: 'µS/cm',
      conversion: 'ec_dfrobot_k1', // Custom conversion method identifier
      validation: {
        min: 0,
        max: 20000,
        warningThreshold: 15000
      }
    },
    timeout: 5000
  },

  uiConfig: {
    // icon: 'scatter_plot',  // UNUSED: Not currently used in frontend
    // color: '#2196F3',  // UNUSED: Not currently used in frontend
    category: 'EC Сензори',
    // formFields: {        // UNUSED: Not currently used in frontend
    // showCalibration: true,
    // calibrationFields: ['lowPoint', 'highPoint', 'temperature', 'kFactor'],
    // calibrationNotes: 'Use 1413 µS/cm and 12.88 ms/cm buffer solutions for two-point calibration'
    // }
  },

  

  isActive: true,
  version: '1.0.0'
}

export default dfrobotEcSensorTemplate
