// ABOUTME: DFRobot SEN0550 water flow sensor template configuration
// ABOUTME: Defines G1/2" water flow sensor specifications, calibration config, and pulse counting parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const sen0550Template: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'SEN0550',
  physicalType: 'flow',
  displayName: 'DFRobot Water Flow Sensor',
  description: 'G1/2" threaded water flow sensor for liquid flow measurement with pulse counting',
  manufacturer: 'DFRobot',
  model: 'SEN0550',
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

export default sen0550Template
