// ABOUTME: HC-SR04 ultrasonic distance sensor template configuration
// ABOUTME: Defines sensor specifications, calibration config, and execution parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const hcSr04Template: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'HC-SR04',
  physicalType: 'ultrasonic',
  displayName: 'HC-SR04 Ultrasonic Sensor',
  description: 'Ultrasonic distance sensor for measuring distances from 2cm to 400cm.',
  manufacturer: 'Various',
  model: 'HC-SR04',
  requiredCommand: 'PULSE_MEASURE',
  defaultUnits: ['cm'],

  portRequirements: [
    {
      role: 'trigger',
      type: 'digital',
      required: true,
      defaultPin: 'D9',
      description: 'Trigger pin - sends ultrasonic pulse'
    },
    {
      role: 'echo',
      type: 'digital',
      required: true,
      defaultPin: 'D10',
      description: 'Echo pin - receives reflected pulse'
    }
  ],

  executionConfig: {
    strategy: 'arduino_native',
    commandType: 'PULSE_MEASURE',
    parameters: {
      triggerDuration: 10, // microseconds
      timeout: 30000 // microseconds
    },
    responseMapping: {
      valueKey: 'distance',
      unit: 'cm',
      conversion: 'duration * 0.034 / 2' // Convert μs to cm using speed of sound
    },
    timeout: 5000
  },

  uiConfig: {
    // icon: 'straighten',  // UNUSED: Not currently used in frontend
    // color: '#4CAF50',    // UNUSED: Not currently used in frontend
    category: 'Сензори за Разстояние',
    // formFields: {        // UNUSED: Not currently used in frontend
    //   showCalibration: true,
    //   calibrationFields: ['maxDistance', 'timeout']
    // }
  },

  

  isActive: true,
  version: '1.0.0'
}

export default hcSr04Template
