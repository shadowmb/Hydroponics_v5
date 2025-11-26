// ABOUTME: DFRobot SEN0551 flow sensor template configuration
// ABOUTME: Defines G3/4" water flow sensor specifications, calibration config, and pulse counting parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const sen0551Template: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'SEN0551',
  physicalType: 'flow',
  displayName: 'DFRobot Flow Sensor',
  description: 'Gravity water flow sensor G3/4" for liquid flow measurement with pulse counting',
  manufacturer: 'DFRobot',
  model: 'SEN0551',
  requiredCommand: 'PULSE_COUNT',
  defaultUnits: ['L/min'],

  portRequirements: [
    {
      role: 'signal',
      type: 'digital',
      required: true,
      defaultPin: 'D2',
      description: 'Signal pin - pulse output from flow sensor'
    }
  ],

  executionConfig: {
    strategy: 'arduino_native',
    commandType: 'PULSE_COUNT',
    parameters: {
      measurementTime: 5000,    // 5 seconds measurement period
      pullupEnabled: true,      // Enable internal pullup resistor
      timeout: 10000           // 10 seconds total timeout
    },
    responseMapping: {
      valueKey: 'flowRate',
      unit: 'L/min',
      conversion: 'pulses_to_flow_rate' // Handled by FlowConverter
    },
    timeout: 12000 // Allow extra time for long measurements
  },

  uiConfig: {
    // icon: 'water_drop',  // UNUSED: Not currently used in frontend
    // color: '#2196F3', // Blue for water  // UNUSED: Not currently used in frontend
    category: 'Сензори за поток(дебит)',
    // formFields: {        // UNUSED: Not currently used in frontend
    // showFlowSettings: true,
    // flowFields: ['flowRate', 'totalVolume', 'pulseCount']
    // }
  },

  

  isActive: true,
  version: '1.0.0'
}

export default sen0551Template
