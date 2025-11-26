import mongoose, { Schema, Document } from 'mongoose'

export interface IHealthConfig extends Document {
  // Basic Configuration
  enabled: boolean
  checkControllers: boolean
  checkSensors: boolean
  checkIntervalMinutes: number
  failureThreshold: number
  timeoutMs: number
  
  // Advanced Settings
  quickPingTimeout: number
  fullTestTimeout: number
  maxConcurrentChecks: number
  
  // System Settings
  systemLoadThreshold: number
  skipDuringExecution: boolean
  
  // Priority Settings
  criticalDeviceTypes: string[]
  highPriorityDeviceTypes: string[]
  
  // Notification Settings
  enableNotifications: boolean
  notificationCooldown: number // minutes
  
  // Monitoring Settings
  retainHistoryDays: number
  enableDetailedLogging: boolean
  
  // UDP Discovery Settings (Phase 1)
  udp?: {
    enabled: boolean
    port: number
    broadcastAddress?: string
    responseTimeout: number
    retryAttempts: number
    fallbackToHttp: boolean
    discoveryMethod: 'broadcast' | 'network_scan'
  }
  
  // Metadata
  lastUpdated: Date
  updatedBy?: string
  version: number
  
  // Instance methods
  toSchedulerConfig(): any
  toApiResponse(): any
}

const HealthConfigSchema = new Schema<IHealthConfig>({
  // Basic Configuration
  enabled: {
    type: Boolean,
    default: true,
    required: true
  },
  checkControllers: {
    type: Boolean,
    default: true,
    required: true
  },
  checkSensors: {
    type: Boolean,
    default: false,
    required: true
  },
  checkIntervalMinutes: {
    type: Number,
    default: 5,
    min: 1,
    max: 60,
    required: true
  },
  failureThreshold: {
    type: Number,
    default: 3,
    min: 1,
    max: 10,
    required: true
  },
  timeoutMs: {
    type: Number,
    default: 5000,
    min: 1000,
    max: 30000,
    required: true
  },
  
  // Advanced Settings
  quickPingTimeout: {
    type: Number,
    default: 500,
    min: 100,
    max: 5000
  },
  fullTestTimeout: {
    type: Number,
    default: 3000,
    min: 1000,
    max: 15000
  },
  maxConcurrentChecks: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  
  // System Settings
  systemLoadThreshold: {
    type: Number,
    default: 80, // percent
    min: 50,
    max: 95
  },
  skipDuringExecution: {
    type: Boolean,
    default: true
  },
  
  // Priority Settings
  criticalDeviceTypes: {
    type: [String],
    //default: ['dfrobot_ph_sensor', 'dfrobot_ec_sensor', 'water_pump', 'solenoid_valve']
  },
  highPriorityDeviceTypes: {
    type: [String],
    //default: ['ds18b20_temperature', 'dht22_humidity']
  },
  
  // Notification Settings
  enableNotifications: {
    type: Boolean,
    default: true
  },
  notificationCooldown: {
    type: Number,
    default: 30, // minutes
    min: 5,
    max: 120
  },
  
  // Monitoring Settings
  retainHistoryDays: {
    type: Number,
    default: 7,
    min: 1,
    max: 30
  },
  enableDetailedLogging: {
    type: Boolean,
    default: false
  },
  
  // UDP Discovery Settings (Phase 1)
  udp: {
    type: {
      enabled: { type: Boolean, default: true },
      port: { type: Number, default: 8888 },
      broadcastAddress: { type: String, default: undefined },
      responseTimeout: { type: Number, default: 2000 },
      retryAttempts: { type: Number, default: 3 },
      fallbackToHttp: { type: Boolean, default: true },
      discoveryMethod: { 
        type: String, 
        enum: ['broadcast', 'network_scan'], 
        default: 'network_scan'  // WSL-friendly default 
      }
    },
    default: {
      enabled: true,
      port: 8888,
      responseTimeout: 2000,
      retryAttempts: 3,
      fallbackToHttp: true,
      discoveryMethod: 'network_scan'  // WSL-friendly default
    }
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedBy: {
    type: String,
    default: 'system'
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true,
  collection: 'healthconfigs'
})

// Indexes for performance
HealthConfigSchema.index({ lastUpdated: -1 })
HealthConfigSchema.index({ version: -1 })

// Pre-save middleware to update version and timestamp
HealthConfigSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1
    this.lastUpdated = new Date()
  }
  next()
})

// Static method to get singleton configuration
HealthConfigSchema.statics.getSingleton = async function(): Promise<IHealthConfig> {
  let config = await this.findOne().sort({ version: -1 })
  
  if (!config) {
    // Create default configuration
    config = new this({
      enabled: true,
      checkControllers: true,
      checkSensors: false,
      checkIntervalMinutes: 5,
      failureThreshold: 3,
      timeoutMs: 5000,
      updatedBy: 'system-init'
    })
    await config.save()
    console.log('✅ [HealthConfig] Created default health configuration')
  }
  
  return config
}

// Static method to update singleton configuration
HealthConfigSchema.statics.updateSingleton = async function(updates: Partial<IHealthConfig>, updatedBy: string = 'system'): Promise<IHealthConfig> {
  const HealthConfigModel = this as IHealthConfigModel
  let config = await HealthConfigModel.getSingleton()
  
  // Apply updates
  Object.assign(config, updates, {
    lastUpdated: new Date(),
    updatedBy
  })
  
  await config.save()
  console.log(`✅ [HealthConfig] Updated health configuration by ${updatedBy}`)
  
  return config
}

// Instance method to get basic config object (for SchedulerService compatibility)
HealthConfigSchema.methods.toSchedulerConfig = function() {
  return {
    healthCheckInterval: this.checkIntervalMinutes * 60 * 1000, // convert to ms
    quickPingTimeout: this.quickPingTimeout,
    fullTestTimeout: this.fullTestTimeout,
    maxConcurrentChecks: this.maxConcurrentChecks,
    systemLoadThreshold: this.systemLoadThreshold,
    skipDuringExecution: this.skipDuringExecution,
    enabled: this.enabled,
    failureThreshold: this.failureThreshold,
    checkControllers: this.checkControllers,
    checkSensors: this.checkSensors
  }
}

// Instance method to get API response format
HealthConfigSchema.methods.toApiResponse = function() {
  return {
    enabled: this.enabled,
    checkControllers: this.checkControllers,
    checkSensors: this.checkSensors,
    checkIntervalMinutes: this.checkIntervalMinutes,
    failureThreshold: this.failureThreshold,
    timeoutMs: this.timeoutMs,
    quickPingTimeout: this.quickPingTimeout,
    fullTestTimeout: this.fullTestTimeout,
    maxConcurrentChecks: this.maxConcurrentChecks,
    systemLoadThreshold: this.systemLoadThreshold,
    skipDuringExecution: this.skipDuringExecution,
    criticalDeviceTypes: this.criticalDeviceTypes,
    highPriorityDeviceTypes: this.highPriorityDeviceTypes,
    enableNotifications: this.enableNotifications,
    notificationCooldown: this.notificationCooldown,
    retainHistoryDays: this.retainHistoryDays,
    enableDetailedLogging: this.enableDetailedLogging,
    lastUpdated: this.lastUpdated,
    updatedBy: this.updatedBy,
    version: this.version
  }
}

// Define model interface with static methods
export interface IHealthConfigModel extends mongoose.Model<IHealthConfig> {
  getSingleton(): Promise<IHealthConfig>
  updateSingleton(updates: Partial<IHealthConfig>, updatedBy?: string): Promise<IHealthConfig>
}

export const HealthConfig = mongoose.model<IHealthConfig, IHealthConfigModel>('HealthConfig', HealthConfigSchema)
export default HealthConfig