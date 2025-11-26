// ABOUTME: DFRobot SEN0311 (A02YYUW) waterproof ultrasonic distance sensor template
// ABOUTME: Defines UART-based ultrasonic sensor specifications and configuration

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const sen0311Template: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'SEN0311',
  physicalType: 'distance',
  displayName: 'DFRobot SEN0311 Ultrasonic Distance Sensor',
  description: 'Waterproof UART ultrasonic distance sensor (30-500cm range) for liquid level and distance measurement',
  manufacturer: 'DFRobot',
  model: 'A02YYUW',
  requiredCommand: 'UART_STREAM_READ',
  defaultUnits: ['cm'],

  portRequirements: [
    {
      role: 'rx',
      type: 'digital',
      required: true,
      defaultPin: 'D11',
      description: 'RX pin for UART communication'
    },
    {
      role: 'tx',
      type: 'digital',
      required: true,
      defaultPin: 'D10',
      description: 'TX pin for UART communication (not actively used but required for SoftwareSerial)'
    }
  ],

  executionConfig: {
    strategy: 'arduino_native',
    commandType: 'UART_STREAM_READ',
    parameters: {
      frameLength: 3
      // baudRate: 9600 (Arduino default)
      // headerByte: 0xFF (Arduino default)
      // checksumType: 'none' (Arduino default)
      // timeout: 1000 (Arduino default)
    },
    responseMapping: {
      valueKey: 'data',
      unit: 'cm',
      conversion: 'distance'
    },
    timeout: 2000
  },

  uiConfig: {
    // icon: 'waves',  // UNUSED: Not currently used in frontend
    // color: '#2196F3',  // UNUSED: Not currently used in frontend
    category: 'Сензори за Разстояние',
    // formFields: {        // UNUSED: Not currently used in frontend
    // showCalibration: true,
    // calibrationFields: ['offset', 'scaling']
    // }
  },

 

  isActive: true,
  version: '1.0.0'
}

export default sen0311Template
