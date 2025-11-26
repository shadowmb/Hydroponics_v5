import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILifecycleNotificationSettings extends Document {
  globalSettings: {
    enabled: boolean                 // Global lifecycle notifications on/off
    rateLimitMinutes: number        // Rate limit between notifications
    deliveryMethods: string[]       // Default delivery methods
  }
  eventSettings: Map<string, {      // eventType -> settings
    enabled: boolean
    messageTemplate: string
    deliveryMethods?: string[]      // Override global delivery methods
    rateLimitMinutes?: number       // Override global rate limit
    includeCycleDetails?: boolean   // Include cycle/program details in message
    includeDeviceInfo?: boolean     // Include device/controller info
  }>
  createdAt: Date
  updatedAt: Date
}

// Supported lifecycle event types
export const LIFECYCLE_EVENT_TYPES = {
  CYCLE_START: 'cycle_start',
  CYCLE_SUCCESS: 'cycle_success',
  CYCLE_FAILURE: 'cycle_failure',
  CONTROLLER_DISCONNECT: 'controller_disconnect',
  CONTROLLER_RECONNECT: 'controller_reconnect',
  SENSOR_DISCONNECT: 'sensor_disconnect',
  SENSOR_RECONNECT: 'sensor_reconnect'
} as const

export type LifecycleEventType = typeof LIFECYCLE_EVENT_TYPES[keyof typeof LIFECYCLE_EVENT_TYPES]

// Interface for static methods
export interface ILifecycleNotificationSettingsModel extends Model<ILifecycleNotificationSettings> {
  getSettings(): Promise<ILifecycleNotificationSettings>
}

// Interface for instance methods
export interface ILifecycleNotificationSettingsDocument extends ILifecycleNotificationSettings {
  getEventSetting(eventType: LifecycleEventType): {
    enabled: boolean
    messageTemplate: string
    deliveryMethods: string[]
    rateLimitMinutes: number
    includeCycleDetails: boolean
    includeDeviceInfo: boolean
  } | null
}

const LifecycleNotificationSettingsSchema = new Schema<ILifecycleNotificationSettingsDocument>({
  globalSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    rateLimitMinutes: {
      type: Number,
      required: [true, 'Rate limit is required'],
      min: [1, 'Rate limit must be at least 1 minute'],
      max: [1440, 'Rate limit cannot exceed 1440 minutes (24 hours)'],
      default: 30
    },
    deliveryMethods: [{
      type: String,
      required: [true, 'At least one delivery method is required'],
      trim: true
    }]
  },
  eventSettings: {
    type: Map,
    of: new Schema({
      enabled: {
        type: Boolean,
        default: true
      },
      messageTemplate: {
        type: String,
        required: [true, 'Message template is required'],
        maxlength: [1000, 'Message template cannot exceed 1000 characters'],
        trim: true
      },
      deliveryMethods: [{
        type: String,
        trim: true
      }],
      rateLimitMinutes: {
        type: Number,
        min: [1, 'Rate limit must be at least 1 minute'],
        max: [1440, 'Rate limit cannot exceed 1440 minutes (24 hours)']
      },
      includeCycleDetails: {
        type: Boolean,
        default: true
      },
      includeDeviceInfo: {
        type: Boolean,
        default: false
      }
    }, { _id: false }),
    default: new Map()
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Validation
LifecycleNotificationSettingsSchema.pre('validate', function(next) {
  if (!this.globalSettings.deliveryMethods?.length && this.globalSettings.enabled) {
    this.invalidate('globalSettings.deliveryMethods', 'At least one delivery method is required when enabled')
  }
  next()
})

// Singleton pattern - only one settings document allowed
LifecycleNotificationSettingsSchema.index({}, { 
  unique: true, 
  partialFilterExpression: { _id: { $exists: true } }
})

// Create static method to get or create settings with defaults
LifecycleNotificationSettingsSchema.statics.getSettings = async function(): Promise<ILifecycleNotificationSettingsDocument> {
  let settings = await this.findOne()
  if (!settings) {
    // Default templates for each event type
    const defaultEventSettings = new Map([
      [LIFECYCLE_EVENT_TYPES.CYCLE_START, {
        enabled: true,
        messageTemplate: '🚀 **Цикъл стартиран**\n\nПрограма: {{programName}}\nЦикъл: {{cycleId}}\nВреме: {{startTime}}\nОчакван завършек: {{expectedEndTime}}',
        includeCycleDetails: true,
        includeDeviceInfo: false
      }],
      [LIFECYCLE_EVENT_TYPES.CYCLE_SUCCESS, {
        enabled: true,
        messageTemplate: '✅ **Цикъл завършен успешно**\n\nПрограма: {{programName}}\nЦикъл: {{cycleId}}\nПродължителност: {{duration}}\nВремето за завършване: {{completedTime}}',
        includeCycleDetails: true,
        includeDeviceInfo: false
      }],
      [LIFECYCLE_EVENT_TYPES.CYCLE_FAILURE, {
        enabled: true,
        messageTemplate: '❌ **Цикъл неуспешен**\n\nПрограма: {{programName}}\nЦикъл: {{cycleId}}\nГрешка: {{errorMessage}}\nВреме: {{failureTime}}',
        includeCycleDetails: true,
        includeDeviceInfo: true
      }],
      [LIFECYCLE_EVENT_TYPES.CONTROLLER_DISCONNECT, {
        enabled: true,
        messageTemplate: '🔌 **Контролер изгуби връзка**\n\nКонтролер: {{controllerName}}\nIP: {{controllerIp}}\nВреме: {{disconnectTime}}\nПоследна връзка: {{lastSeen}}',
        includeCycleDetails: false,
        includeDeviceInfo: true
      }],
      [LIFECYCLE_EVENT_TYPES.CONTROLLER_RECONNECT, {
        enabled: true,
        messageTemplate: '🔗 **Контролер възстановен**\n\nКонтролер: {{controllerName}}\nIP: {{controllerIp}}\nВреме: {{reconnectTime}}\nВремето без връзка: {{downtime}}',
        includeCycleDetails: false,
        includeDeviceInfo: true
      }],
      [LIFECYCLE_EVENT_TYPES.SENSOR_DISCONNECT, {
        enabled: false,  // Disabled by default - for future use
        messageTemplate: '📡 **Сензор загуби връзка**\n\nСензор: {{deviceName}}\nТип: {{deviceType}}\nВреме: {{disconnectTime}}\nКонтролер: {{controllerName}}',
        includeCycleDetails: false,
        includeDeviceInfo: true
      }],
      [LIFECYCLE_EVENT_TYPES.SENSOR_RECONNECT, {
        enabled: false,  // Disabled by default - for future use
        messageTemplate: '📱 **Сензор възстановен**\n\nСензор: {{deviceName}}\nТип: {{deviceType}}\nВреме: {{reconnectTime}}\nКонтролер: {{controllerName}}',
        includeCycleDetails: false,
        includeDeviceInfo: true
      }]
    ])

    settings = await this.create({
      globalSettings: {
        enabled: true,
        rateLimitMinutes: 30,
        deliveryMethods: ['email']
      },
      eventSettings: defaultEventSettings
    })
  }
  return settings
}

// Helper method to get event setting with fallbacks
LifecycleNotificationSettingsSchema.methods.getEventSetting = function(eventType: LifecycleEventType) {
  const eventSetting = this.eventSettings.get(eventType)
  if (!eventSetting) return null

  return {
    enabled: this.globalSettings.enabled && eventSetting.enabled,
    messageTemplate: eventSetting.messageTemplate,
    deliveryMethods: eventSetting.deliveryMethods?.length 
      ? eventSetting.deliveryMethods 
      : this.globalSettings.deliveryMethods,
    rateLimitMinutes: eventSetting.rateLimitMinutes ?? this.globalSettings.rateLimitMinutes,
    includeCycleDetails: eventSetting.includeCycleDetails ?? false,
    includeDeviceInfo: eventSetting.includeDeviceInfo ?? false
  }
}

// Indexes for efficient queries
LifecycleNotificationSettingsSchema.index({ 'globalSettings.enabled': 1 })
LifecycleNotificationSettingsSchema.index({ createdAt: -1 })

export const LifecycleNotificationSettings = mongoose.model<ILifecycleNotificationSettingsDocument, ILifecycleNotificationSettingsModel>('LifecycleNotificationSettings', LifecycleNotificationSettingsSchema)