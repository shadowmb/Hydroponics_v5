import mongoose, { Schema, Document } from 'mongoose'

// Port requirement interface
export interface IPortRequirement {
  role: string // 'trigger', 'echo', 'data', 'power', 'control'
  type: 'digital' | 'analog' | 'pwm'
  required: boolean
  defaultPin?: string
  description?: string
}

// Command step interface for multi-step execution
export interface ICommandStep {
  command: string // Arduino command name
  parameters: Record<string, any> // Command parameters
  delay?: number // Delay in milliseconds after this step
  expectResponse?: boolean // Whether to wait for response
}

// Execution configuration interface
export interface IExecutionConfig {
  strategy: 'single_command' | 'multi_step' | 'arduino_native' // Execution strategy
  commandType?: string // For single_command and arduino_native strategies
  commandSequence?: ICommandStep[] // For multi_step strategy
  parameters?: Record<string, any> // Additional parameters for command
  responseMapping?: Record<string, any> // How to interpret Arduino response
  timeout?: number // Command timeout in milliseconds
}

// UI configuration interface
export interface IUIConfig {
  icon?: string // UNUSED: Not currently used in frontend
  color?: string // UNUSED: Not currently used in frontend
  formFields?: Record<string, any> // UNUSED: Not currently used in frontend
  category: string // Display category in UI
}

// Calibration point interface
export interface ICalibrationPoint {
  name: string // 'acidic', 'neutral', 'basic'
  displayName: string // 'Acidic Buffer'
  targetValue: number // Expected pH, EC, etc.
  targetADC?: number | null // Expected ADC reading
  targetVoltage?: number | null // Expected voltage
  unit: string // 'pH', 'µS/cm', '%'
  bufferSolution?: string // 'pH 4.00 buffer'
  tolerance: number // Acceptable deviation
  isRequired: boolean
  instructions?: string // Instructions for user during calibration
}

// Calibration parameter interface
export interface ICalibrationParameter {
  name: string
  displayName: string
  type: 'boolean' | 'number' | 'select' | 'string'
  defaultValue: any
  options?: string[] // For select type
  min?: number // For number type
  max?: number // For number type
  step?: number // For number type
  unit?: string
  description?: string
}

// Calibration validation rules
export interface ICalibrationValidation {
  minCalibrationPoints: number
  maxTimeBetweenCalibrations: number // milliseconds
  stabilityRequiredTime: number // milliseconds
  maxReadingAge: number // milliseconds
}

// Calibration UI configuration
export interface ICalibrationUI {
  showLiveReadings: boolean
  showStabilityIndicator: boolean
  showCalibrationHistory: boolean
  showTemperatureReading?: boolean
  showDriftAlert?: boolean
  readingInterval: number // milliseconds
  stabilityThreshold: number // units for stability calculation
}

// Main calibration configuration interface
export interface ICalibrationConfig {
  type: 'sensor' | 'actuator'
  calibrationMethod: 'single_point' | 'multi_point' | 'parameter_based'
  isRequired: boolean
  calibrationPoints?: ICalibrationPoint[]
  testActions: string[] // ['quick_read', 'continuous_monitor', 'stability_test']
  parametersToCalibrate: ICalibrationParameter[]
  validation: ICalibrationValidation
  ui: ICalibrationUI
}

// Main DeviceTemplate interface
export interface IDeviceTemplate {
  _id?: string
  type: string // Unique identifier: 'HC-SR04', 'DHT22', 'relay', 'pump'
  physicalType: string // Unique identifier: 'PH', 'EC', 'relay', 'pump'
  displayName: string
  description: string
  manufacturer?: string
  model?: string
  
  // Port requirements for this device type
  portRequirements: IPortRequirement[]
  
  // Execution configuration for BlockExecutor
  executionConfig: IExecutionConfig
  
  // UI configuration for frontend
  uiConfig: IUIConfig

  // Default units for this device type (auto-selects first unit in UI)
  defaultUnits?: string[]

  // NEW: Calibration configuration for sensors and actuators
  calibrationConfig?: ICalibrationConfig

  // Required command for device operation
  requiredCommand?: string

  // Metadata
  isActive: boolean
  version: string
  createdAt?: Date
  updatedAt?: Date
}

// Port requirement schema
const PortRequirementSchema = new Schema<IPortRequirement>({
  role: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['digital', 'analog', 'pwm']
  },
  required: {
    type: Boolean,
    default: true
  },
  defaultPin: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
})

// Command step schema
const CommandStepSchema = new Schema<ICommandStep>({
  command: {
    type: String,
    required: true,
    trim: true
  },
  parameters: {
    type: Schema.Types.Mixed,
    required: true
  },
  delay: {
    type: Number,
    default: 0
  },
  expectResponse: {
    type: Boolean,
    default: true
  }
})

// Execution configuration schema
const ExecutionConfigSchema = new Schema<IExecutionConfig>({
  strategy: {
    type: String,
    required: true,
    enum: ['single_command', 'multi_step', 'arduino_native']
  },
  commandType: {
    type: String,
    trim: true
  },
  commandSequence: {
    type: [CommandStepSchema],
    validate: {
      validator: function(sequence: ICommandStep[]) {
        // Command sequence is required for multi_step strategy
        const strategy = (this as any).strategy
        if (strategy === 'multi_step') {
          return sequence && sequence.length > 0
        }
        return true
      },
      message: 'Command sequence is required for multi_step strategy'
    }
  },
  parameters: {
    type: Schema.Types.Mixed,
    default: {}
  },
  responseMapping: {
    type: Schema.Types.Mixed,
    default: {}
  },
  timeout: {
    type: Number,
    default: 5000
  }
})

// UI configuration schema
const UIConfigSchema = new Schema<IUIConfig>({
  icon: {
    type: String,
    required: false,
    trim: true
  },
  color: {
    type: String,
    required: false,
    trim: true
  },
  formFields: {
    type: Schema.Types.Mixed,
    default: {}
  },
  category: {
    type: String,
    required: true,
    trim: true
  }
})

// Calibration point schema
const CalibrationPointSchema = new Schema<ICalibrationPoint>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  targetADC: {
    type: Number,
    default: null
  },
  targetVoltage: {
    type: Number,
    default: null
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  bufferSolution: {
    type: String,
    trim: true
  },
  tolerance: {
    type: Number,
    required: true,
    min: 0
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  instructions: {
    type: String,
    trim: true
  }
})

// Calibration parameter schema
const CalibrationParameterSchema = new Schema<ICalibrationParameter>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['boolean', 'number', 'select', 'string']
  },
  defaultValue: {
    type: Schema.Types.Mixed,
    required: true
  },
  options: {
    type: [String],
    default: undefined
  },
  min: {
    type: Number,
    default: undefined
  },
  max: {
    type: Number,
    default: undefined
  },
  step: {
    type: Number,
    default: undefined
  },
  unit: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
})

// Calibration validation schema
const CalibrationValidationSchema = new Schema<ICalibrationValidation>({
  minCalibrationPoints: {
    type: Number,
    required: true,
    min: 1
  },
  maxTimeBetweenCalibrations: {
    type: Number,
    required: true,
    min: 0
  },
  stabilityRequiredTime: {
    type: Number,
    required: true,
    min: 0
  },
  maxReadingAge: {
    type: Number,
    required: true,
    min: 0
  }
})

// Calibration UI schema
const CalibrationUISchema = new Schema<ICalibrationUI>({
  showLiveReadings: {
    type: Boolean,
    default: true
  },
  showStabilityIndicator: {
    type: Boolean,
    default: true
  },
  showCalibrationHistory: {
    type: Boolean,
    default: true
  },
  showTemperatureReading: {
    type: Boolean,
    default: false
  },
  showDriftAlert: {
    type: Boolean,
    default: false
  },
  readingInterval: {
    type: Number,
    required: true,
    min: 100
  },
  stabilityThreshold: {
    type: Number,
    required: true,
    min: 0
  }
})

// Main calibration configuration schema
const CalibrationConfigSchema = new Schema<ICalibrationConfig>({
  type: {
    type: String,
    required: true,
    enum: ['sensor', 'actuator']
  },
  calibrationMethod: {
    type: String,
    required: true,
    enum: ['single_point', 'multi_point', 'parameter_based']
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  calibrationPoints: {
    type: [CalibrationPointSchema],
    default: undefined
  },
  testActions: {
    type: [String],
    required: true,
    validate: {
      validator: function(actions: string[]) {
        return actions.length > 0
      },
      message: 'At least one test action is required'
    }
  },
  parametersToCalibrate: {
    type: [CalibrationParameterSchema],
    required: true
  },
  validation: {
    type: CalibrationValidationSchema,
    required: true
  },
  ui: {
    type: CalibrationUISchema,
    required: true
  }
})

// Main DeviceTemplate schema
const DeviceTemplateSchema = new Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  physicalType: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  portRequirements: {
    type: [PortRequirementSchema],
    required: true,
    validate: {
      validator: function(ports: IPortRequirement[]) {
        return ports.length > 0
      },
      message: 'At least one port requirement is required'
    }
  },
  executionConfig: {
    type: ExecutionConfigSchema,
    required: true
  },
  uiConfig: {
    type: UIConfigSchema,
    required: true
  },
  defaultUnits: {
    type: [String],
    default: undefined,
    required: false
  },
  calibrationConfig: {
    type: CalibrationConfigSchema,
    required: false
  },
  requiredCommand: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: String,
    default: '1.0.0'
  }
}, {
  timestamps: true,
  collection: 'devicetemplates'
})

// Indexes for performance
DeviceTemplateSchema.index({ type: 1, isActive: 1 })

// Export model
export const DeviceTemplate = mongoose.model<IDeviceTemplate>('DeviceTemplate', DeviceTemplateSchema)
export default DeviceTemplate