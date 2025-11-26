// ABOUTME: DFRobot SEN0641 PAR (Photosynthetically Active Radiation) sensor template
// ABOUTME: Defines RS485/Modbus PAR light sensor specifications and configuration

import { IDeviceTemplate } from '../../models/DeviceTemplate'

const sen0641Template: Omit<IDeviceTemplate, '_id' | 'createdAt' | 'updatedAt'> = {
  type: 'SEN0641',
  physicalType: 'light',
  displayName: 'DFRobot PAR Light Sensor',
  description: 'RS485 Photosynthetically Active Radiation sensor with Modbus-RTU protocol (0-4000 µmol/m²·s)',
  manufacturer: 'DFRobot',
  model: 'SEN0641',
  requiredCommand: 'MODBUS_RTU_READ',
  defaultUnits: ['µmol/m²·s'],

  portRequirements: [
    {
      role: 'rx',
      type: 'digital',
      required: true,
      defaultPin: 'D2',
      description: 'RX pin for UART communication (via RS485-to-UART converter)'
    },
    {
      role: 'tx',
      type: 'digital',
      required: true,
      defaultPin: 'D3',
      description: 'TX pin for UART communication (via RS485-to-UART converter)'
    }
  ],

  executionConfig: {
    strategy: 'arduino_native',
    commandType: 'MODBUS_RTU_READ',
    parameters: {
      // Arduino defaults are used (baudRate: 4800, deviceAddress: 1, etc.)
      // Only rxPin and txPin are required and mapped from device ports
    },
    responseMapping: {
      valueKey: 'registers',
      unit: 'µmol/m²·s',
      conversion: 'light_par'
    },
    timeout: 2000
  },

  uiConfig: {
    // icon: 'wb_sunny',  // UNUSED: Not currently used in frontend
    // color: '#FFC107',  // UNUSED: Not currently used in frontend
    category: 'Светлинни сензори',
    // formFields: {        // UNUSED: Not currently used in frontend
    // showLightSettings: true,
    // lightFields: ['par', 'ppfd']
    // }
  },

  

  isActive: true,
  version: '1.0.0'
}

export default sen0641Template
