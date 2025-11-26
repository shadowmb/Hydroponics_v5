// ABOUTME: Mock data provider for tutorial demo mode with realistic hydroponic system data
// ABOUTME: Provides demo controllers, devices, flows and programs based on backend schemas

import { TutorialSessionData } from './tutorial-service'

// Mock Controllers Data
export const mockControllers = [
  {
    _id: 'demo_controller_main',
    name: 'Главен Контролер',
    type: 'ESP32',
    ipAddress: '192.168.1.100',
    port: 80,
    status: 'online',
    connectionType: 'wifi',
    firmwareVersion: '1.2.0',
    discoveryMethod: 'static',
    lastHeartbeat: new Date().toISOString(),
    communicationSettings: {
      timeout: 5000,
      retryAttempts: 3,
      healthCheckInterval: 30
    },
    capabilities: ['digital_output', 'analog_input', 'i2c', 'uart'],
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo_controller_secondary',
    name: 'Сензорен Контролер',
    type: 'Arduino Nano',
    ipAddress: '192.168.1.101',
    port: 80,
    status: 'online',
    connectionType: 'wifi',
    firmwareVersion: '1.1.5',
    discoveryMethod: 'auto',
    lastHeartbeat: new Date(Date.now() - 60000).toISOString(),
    communicationSettings: {
      timeout: 3000,
      retryAttempts: 2,
      healthCheckInterval: 60
    },
    capabilities: ['analog_input', 'digital_input', 'i2c'],
    isActive: true,
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: new Date().toISOString()
  }
]

// Mock Devices Data
export const mockDevices = [
  {
    _id: 'demo_device_ph_sensor',
    name: 'pH Сензор',
    type: 'ph_sensor',
    controllerId: 'demo_controller_secondary',
    port: 'A0',
    settings: {
      calibration: {
        ph4: 512,
        ph7: 350,
        ph10: 200
      },
      readingInterval: 30,
      averageSamples: 5
    },
    status: 'active',
    lastReading: {
      value: 6.8,
      timestamp: new Date().toISOString(),
      unit: 'pH'
    },
    thresholds: {
      min: 5.5,
      max: 7.5,
      critical: { min: 5.0, max: 8.0 }
    },
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo_device_ec_sensor',
    name: 'EC Сензор',
    type: 'ec_sensor',
    controllerId: 'demo_controller_secondary',
    port: 'A1',
    settings: {
      calibration: {
        dry: 0,
        solution: 1413,
        factor: 1.0
      },
      readingInterval: 30,
      temperatureCompensation: true
    },
    status: 'active',
    lastReading: {
      value: 1.2,
      timestamp: new Date().toISOString(),
      unit: 'mS/cm'
    },
    thresholds: {
      min: 0.8,
      max: 2.0,
      critical: { min: 0.5, max: 2.5 }
    },
    isActive: true,
    createdAt: '2024-01-15T10:35:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo_device_water_pump',
    name: 'Водна Помпа',
    type: 'water_pump',
    controllerId: 'demo_controller_main',
    port: 'D2',
    settings: {
      flowRate: 200, // ml/min
      maxRunTime: 300, // 5 minutes
      pumpType: 'peristaltic'
    },
    status: 'idle',
    lastOperation: {
      action: 'stop',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      duration: 45
    },
    isActive: true,
    createdAt: '2024-01-15T10:40:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo_device_nutrient_pump',
    name: 'Помпа за Хранителни Вещества',
    type: 'nutrient_pump',
    controllerId: 'demo_controller_main',
    port: 'D3',
    settings: {
      flowRate: 50, // ml/min
      maxRunTime: 60,
      pumpType: 'peristaltic'
    },
    status: 'idle',
    lastOperation: {
      action: 'stop',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      duration: 15
    },
    isActive: true,
    createdAt: '2024-01-15T10:45:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo_device_air_pump',
    name: 'Въздушна Помпа',
    type: 'air_pump',
    controllerId: 'demo_controller_main',
    port: 'D4',
    settings: {
      flowRate: 500, // L/hour
      maxRunTime: 7200, // 2 hours
      pumpType: 'diaphragm'
    },
    status: 'running',
    lastOperation: {
      action: 'start',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      duration: null
    },
    isActive: true,
    createdAt: '2024-01-15T10:50:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo_device_grow_light',
    name: 'LED Лампа',
    type: 'grow_light',
    controllerId: 'demo_controller_main',
    port: 'D5',
    settings: {
      power: 50, // watts
      spectrum: 'full_spectrum',
      dimming: true,
      currentIntensity: 75 // percentage
    },
    status: 'running',
    lastOperation: {
      action: 'set_intensity',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      value: 75
    },
    isActive: true,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: new Date().toISOString()
  }
]

// Mock Flow Templates Data
export const mockFlows = [
  {
    _id: 'demo_flow_basic_watering',
    name: 'Основно Поливане',
    flowId: 'basic_watering_v1',
    version: '1.0.0',
    description: 'Базов поток за автоматично поливане на растенията',
    isActive: true,
    isDraft: false,
    validationStatus: 'validated',
    flowData: {
      blocks: [
        {
          id: 'start_1',
          type: 'start',
          x: 100,
          y: 100,
          parameters: {}
        },
        {
          id: 'ph_check_1',
          type: 'sensor',
          x: 300,
          y: 100,
          parameters: {
            deviceId: 'demo_device_ph_sensor',
            readingType: 'current',
            storeVariable: 'current_ph'
          }
        },
        {
          id: 'ph_condition_1',
          type: 'if',
          x: 500,
          y: 100,
          parameters: {
            condition: 'current_ph >= 5.5 AND current_ph <= 7.5',
            description: 'Проверка на pH нивото'
          }
        },
        {
          id: 'water_pump_1',
          type: 'actuator',
          x: 700,
          y: 50,
          parameters: {
            deviceId: 'demo_device_water_pump',
            action: 'turn_on',
            duration: 60,
            description: 'Стартиране на водната помпа'
          }
        },
        {
          id: 'nutrient_adjustment_1',
          type: 'actuator',
          x: 700,
          y: 150,
          parameters: {
            deviceId: 'demo_device_nutrient_pump',
            action: 'turn_on',
            duration: 15,
            description: 'Корекция на хранителните вещества'
          }
        },
        {
          id: 'end_1',
          type: 'end',
          x: 900,
          y: 100,
          parameters: {}
        }
      ],
      connections: [
        { from: 'start_1', to: 'ph_check_1' },
        { from: 'ph_check_1', to: 'ph_condition_1' },
        { from: 'ph_condition_1', to: 'water_pump_1', condition: 'true' },
        { from: 'ph_condition_1', to: 'nutrient_adjustment_1', condition: 'false' },
        { from: 'water_pump_1', to: 'end_1' },
        { from: 'nutrient_adjustment_1', to: 'end_1' }
      ]
    },
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo_flow_daily_monitoring',
    name: 'Ежедневен Мониторинг',
    flowId: 'daily_monitoring_v1',
    version: '1.0.0',
    description: 'Поток за редовни проверки на всички параметри',
    isActive: true,
    isDraft: false,
    validationStatus: 'validated',
    flowData: {
      blocks: [
        {
          id: 'start_2',
          type: 'start',
          x: 100,
          y: 200,
          parameters: {}
        },
        {
          id: 'ph_reading_2',
          type: 'sensor',
          x: 250,
          y: 150,
          parameters: {
            deviceId: 'demo_device_ph_sensor',
            readingType: 'average',
            samples: 5,
            storeVariable: 'daily_ph'
          }
        },
        {
          id: 'ec_reading_2',
          type: 'sensor',
          x: 250,
          y: 250,
          parameters: {
            deviceId: 'demo_device_ec_sensor',
            readingType: 'average',
            samples: 5,
            storeVariable: 'daily_ec'
          }
        },
        {
          id: 'air_pump_cycle_2',
          type: 'actuator',
          x: 450,
          y: 200,
          parameters: {
            deviceId: 'demo_device_air_pump',
            action: 'turn_on',
            duration: 1800,
            description: 'Въздушно насищане - 30 мин'
          }
        },
        {
          id: 'end_2',
          type: 'end',
          x: 650,
          y: 200,
          parameters: {}
        }
      ],
      connections: [
        { from: 'start_2', to: 'ph_reading_2' },
        { from: 'start_2', to: 'ec_reading_2' },
        { from: 'ph_reading_2', to: 'air_pump_cycle_2' },
        { from: 'ec_reading_2', to: 'air_pump_cycle_2' },
        { from: 'air_pump_cycle_2', to: 'end_2' }
      ]
    },
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: new Date().toISOString()
  }
]

// Mock Programs Data
export const mockPrograms = [
  {
    _id: 'demo_program_lettuce_growth',
    name: 'Програма за Отглеждане на Маруля',
    description: 'Пълен цикъл за отглеждане на маруля с автоматично управление',
    controllerId: 'demo_controller_main',
    isActive: true,
    schedule: {
      type: 'recurring',
      interval: 'daily',
      time: '08:00'
    },
    actionTemplates: [
      {
        _id: 'demo_action_morning_check',
        name: 'Сутрешна Проверка',
        flowFile: 'daily_monitoring_v1.json',
        icon: '🌅',
        parameters: {
          lightIntensity: 80,
          wateringDuration: 45
        },
        targetMapping: {
          ph_sensor: 'demo_device_ph_sensor',
          ec_sensor: 'demo_device_ec_sensor',
          water_pump: 'demo_device_water_pump'
        },
        isActive: true
      },
      {
        _id: 'demo_action_nutrient_cycle',
        name: 'Хранителен Цикъл',
        flowFile: 'basic_watering_v1.json',
        icon: '💧',
        parameters: {
          nutrientConcentration: 1.2,
          pumpDuration: 60
        },
        targetMapping: {
          nutrient_pump: 'demo_device_nutrient_pump',
          ph_sensor: 'demo_device_ph_sensor'
        },
        isActive: true
      }
    ],
    statistics: {
      totalExecutions: 24,
      successfulExecutions: 22,
      lastExecution: new Date(Date.now() - 86400000).toISOString(),
      averageExecutionTime: 180
    },
    createdAt: '2024-01-10T15:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo_program_herb_garden',
    name: 'Програма за Билкова Градина',
    description: 'Специализирана програма за отглеждане на подправки',
    controllerId: 'demo_controller_main',
    isActive: true,
    schedule: {
      type: 'recurring',
      interval: 'every_6_hours',
      startTime: '06:00'
    },
    actionTemplates: [
      {
        _id: 'demo_action_herb_watering',
        name: 'Поливане на Билки',
        flowFile: 'basic_watering_v1.json',
        icon: '🌿',
        parameters: {
          wateringIntensity: 'low',
          duration: 30
        },
        targetMapping: {
          water_pump: 'demo_device_water_pump',
          ph_sensor: 'demo_device_ph_sensor'
        },
        isActive: true
      }
    ],
    statistics: {
      totalExecutions: 96,
      successfulExecutions: 94,
      lastExecution: new Date(Date.now() - 21600000).toISOString(),
      averageExecutionTime: 120
    },
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: new Date().toISOString()
  }
]

// Tutorial-specific demo data configurations
export const tutorialDemoConfigs = {
  'add_controller_basics': {
    controllers: mockControllers.slice(0, 1), // Only main controller
    devices: [], // Start with no devices
    flows: [],
    programs: []
  },
  'device_management': {
    controllers: mockControllers,
    devices: mockDevices.slice(0, 3), // pH, EC, and one pump
    flows: [],
    programs: []
  },
  'flow_editor_intro': {
    controllers: mockControllers,
    devices: mockDevices,
    flows: mockFlows.slice(0, 1), // Just the basic watering flow
    programs: []
  },
  'program_creation': {
    controllers: mockControllers,
    devices: mockDevices,
    flows: mockFlows,
    programs: mockPrograms.slice(0, 1) // One example program
  },
  'full_system_demo': {
    controllers: mockControllers,
    devices: mockDevices,
    flows: mockFlows,
    programs: mockPrograms
  }
}

// Main function to get demo data for a specific tutorial
export function getTutorialDemoData(tutorialId: string): TutorialSessionData {
  // Extract tutorial type from ID (assuming format like "add_controller_basics")
  const tutorialType = tutorialId.replace('tutorial_', '').replace(/^.*_/, '')

  const config = tutorialDemoConfigs[tutorialType as keyof typeof tutorialDemoConfigs]
    || tutorialDemoConfigs.full_system_demo

  return {
    controllers: config.controllers,
    devices: config.devices,
    flows: config.flows,
    programs: config.programs,
    isDemo: true,
    originalData: {
      timestamp: Date.now(),
      backupNote: 'Original data backed up before tutorial demo mode'
    }
  }
}

// Helper function to get mock data by category
export function getMockDataByCategory(category: 'controllers' | 'devices' | 'flows' | 'programs') {
  switch (category) {
    case 'controllers':
      return mockControllers
    case 'devices':
      return mockDevices
    case 'flows':
      return mockFlows
    case 'programs':
      return mockPrograms
    default:
      return []
  }
}

// Generate realistic sensor readings for demo
export function generateRealtimeSensorData() {
  const now = new Date().toISOString()

  return {
    ph: {
      value: 6.5 + (Math.random() - 0.5) * 0.4, // 6.3 - 6.7 range
      timestamp: now,
      unit: 'pH'
    },
    ec: {
      value: 1.0 + (Math.random() - 0.5) * 0.4, // 0.8 - 1.2 range
      timestamp: now,
      unit: 'mS/cm'
    },
    temperature: {
      value: 22 + (Math.random() - 0.5) * 4, // 20 - 24°C range
      timestamp: now,
      unit: '°C'
    },
    humidity: {
      value: 65 + (Math.random() - 0.5) * 10, // 60 - 70% range
      timestamp: now,
      unit: '%'
    }
  }
}

export default {
  getTutorialDemoData,
  getMockDataByCategory,
  generateRealtimeSensorData,
  mockControllers,
  mockDevices,
  mockFlows,
  mockPrograms
}