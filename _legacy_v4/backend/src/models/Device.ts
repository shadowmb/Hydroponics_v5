import mongoose, { Schema, Document } from 'mongoose'

export interface IValidationConfig {
  enabled: boolean
  expectedMin: number
  expectedMax: number
  physicalMin: number
  physicalMax: number
  maxChangeRate: number  // Maximum allowed change per minute
  historyWindow: number  // Hours to analyze for historical patterns
  stuckValueThreshold: number  // Minutes before considering value "stuck"
}

export interface IDevice extends Document {
  name: string
  type: string  // Now accepts any string type from DeviceTemplate
  physicalType: string  // Physical sensor type for conversion logic: 'ph', 'ec', 'moisture', etc.
  category: 'sensor' | 'actuator'
  controllerId: mongoose.Types.ObjectId
  ports: string[]  // Changed from single port to array of ports
  isActive: boolean
  relayLogic: 'active_high' | 'active_low'
  settings: Record<string, any>
  validationConfig?: IValidationConfig
  description?: string
  lastReading?: number
  lastError?: string
  // Health monitoring fields
  priority: 'critical' | 'high' | 'normal' | 'low'
  healthCheckEnabled: boolean
  checkingEnabled?: boolean  // Whether health checks are currently active for this device
  lastHealthCheck?: Date
  healthStatus?: 'healthy' | 'warning' | 'error' | 'unknown'
  // Device icon for dashboard display
  icon?: string
  // Measurement unit for sensor/actuator display
  unit?: string
  // Connection method and relay information
  connectionMethod?: 'direct' | 'relay'
  relayId?: mongoose.Types.ObjectId
  relayPort?: number
  // Relay/pump specific settings
  flowRate?: number
  safetyTimeout?: number
  // Code generation tracking
  capabilities: string[]
  firmwareVersion?: string
  generatedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const DeviceSchema = new Schema<IDevice>({
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Device type is required'],
    trim: true
    // No enum restriction - accepts any DeviceTemplate type
  },
  physicalType: {
    type: String,
    required: [true, 'Physical type is required'],
    trim: true
    // Values: 'ph', 'ec', 'moisture', 'ultrasonic', 'relay', etc.
  },
  category: {
    type: String,
    enum: ['sensor', 'actuator'],
    required: true
  },
  controllerId: {
    type: Schema.Types.ObjectId,
    ref: 'PhysicalController',
    required: [true, 'Controller ID is required']
  },
  ports: {
    type: [String],
    default: []
    // Ports are optional - devices without ports will be auto-deactivated
  },
  isActive: {
    type: Boolean,
    default: true
  },
  relayLogic: {
    type: String,
    enum: ['active_high', 'active_low'],
    default: 'active_low'
  },
  settings: {
    type: Schema.Types.Mixed,
    default: {}
  },
  validationConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    expectedMin: {
      type: Number,
      default: 0
    },
    expectedMax: {
      type: Number,
      default: 100
    },
    physicalMin: {
      type: Number,
      default: 0
    },
    physicalMax: {
      type: Number,
      default: 1023
    },
    maxChangeRate: {
      type: Number,
      default: 10  // Default max change rate per minute
    },
    historyWindow: {
      type: Number,
      default: 24  // Default 24 hours
    },
    stuckValueThreshold: {
      type: Number,
      default: 30  // Default 30 minutes
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  lastReading: {
    type: Number,
    default: null
  },
  lastError: {
    type: String,
    default: null
  },
  // Health monitoring schema fields
  priority: {
    type: String,
    enum: ['critical', 'high', 'normal', 'low'],
    default: function() {
      // Auto-assign priority based on device type
      const type = this.type?.toLowerCase() || ''
      if (type.includes('ph') || type.includes('ec') || type.includes('pump')) {
        return 'critical'
      } else if (type.includes('temperature') || type.includes('sensor')) {
        return 'high'
      }
      return 'normal'
    }
  },
  healthCheckEnabled: {
    type: Boolean,
    default: false
  },
  checkingEnabled: {
    type: Boolean,
    default: false  // Calculated dynamically based on isActive and validation config
  },
  lastHealthCheck: {
    type: Date,
    default: null
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'warning', 'error', 'unknown'],
    default: 'unknown'
  },
  // Device icon for dashboard display
  icon: {
    type: String,
    default: function() {
      // Auto-assign icon based on device type
      const type = this.type?.toLowerCase() || ''
      if (type.includes('dht') || type.includes('temperature')) return 'thermostat'
      if (type.includes('ph')) return 'science'
      if (type.includes('ec')) return 'electrical_services'
      if (type.includes('moisture') || type.includes('soil')) return 'water_drop'
      if (type.includes('hc-sr04') || type.includes('ultrasonic')) return 'straighten'
      if (type.includes('relay') || type.includes('pump')) return 'power'
      return 'device_hub'
    }
  },
  // Measurement unit for sensor/actuator display
  unit: {
    type: String,
    trim: true,
    maxlength: [4, 'Unit cannot exceed 4 characters'],
    default: undefined
  },
  // Connection method and relay information
  connectionMethod: {
    type: String,
    enum: ['direct', 'relay'],
    default: 'direct'
  },
  relayId: {
    type: Schema.Types.ObjectId,
    ref: 'Relay',
    default: undefined
  },
  relayPort: {
    type: Number,
    min: [1, 'Relay port must be at least 1'],
    max: [8, 'Relay port cannot exceed 8'],
    default: undefined
  },
  // Relay/pump specific settings
  flowRate: {
    type: Number,
    min: [0.1, 'Flow rate must be at least 0.1 л/мин'],
    max: [1000, 'Flow rate cannot exceed 1000 л/мин'],
    default: undefined
  },
  safetyTimeout: {
    type: Number,
    min: [1, 'Safety timeout must be at least 1 second'],
    max: [300, 'Safety timeout cannot exceed 300 seconds'],
    default: undefined
  },
  // Code generation tracking
  capabilities: {
    type: [String],
    default: []
  },
  firmwareVersion: {
    type: String,
    default: null
  },
  generatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

DeviceSchema.index({ type: 1, isActive: 1 })
DeviceSchema.index({ physicalType: 1 })
DeviceSchema.index({ physicalType: 1, isActive: 1 })
DeviceSchema.index({ controllerId: 1, ports: 1 })
DeviceSchema.index({ controllerId: 1 })
DeviceSchema.index({ category: 1 })
DeviceSchema.index({ relayId: 1, relayPort: 1 })
DeviceSchema.index({ connectionMethod: 1 })
// Health monitoring indexes
DeviceSchema.index({ priority: 1, healthStatus: 1 })
DeviceSchema.index({ healthCheckEnabled: 1, isActive: 1 })
DeviceSchema.index({ lastHealthCheck: 1 })

export const Device = mongoose.model<IDevice>('Device', DeviceSchema)