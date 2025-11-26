// ABOUTME: Standard relay module template configuration
// ABOUTME: Defines relay control specifications and execution parameters

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const standardRelayTemplate: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'relay',
  physicalType: 'relay',
  displayName: 'Standard Relay',
  description: 'Single channel relay module for controlling high power devices',
  manufacturer: 'Various',
  model: 'Generic Relay Module',
  requiredCommand: 'SET_PIN',
  defaultUnits: ['-','L/min','min','H'],

  portRequirements: [
    {
      role: 'control',
      type: 'digital',
      required: true,
      defaultPin: 'D2',
      description: 'Control pin for relay activation'
    }
  ],

  executionConfig: {
    strategy: 'single_command',
    commandType: 'SET_PIN',
    parameters: {},
    responseMapping: {
      valueKey: 'state',
      states: {
        'active': 'ON',
        'inactive': 'OFF'
      }
    },
    timeout: 3000
  },

  uiConfig: {
    // icon: 'power',  // UNUSED: Not currently used in frontend
    // color: '#FF9800',  // UNUSED: Not currently used in frontend
    category: 'Релета/Помпи',
    // formFields: {        // UNUSED: Not currently used in frontend
    // showRelayLogic: true,
    // relayLogicOptions: ['active_high', 'active_low']
    // }
  },

  isActive: true,
  version: '1.0.0'
}

export default standardRelayTemplate
