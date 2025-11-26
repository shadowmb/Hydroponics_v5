import mongoose, { Schema, Document } from 'mongoose'

export interface IErrorNotificationSettings extends Document {
  globalSettings: {
    rateLimitMinutes: number     // Rate limit between notifications
    deliveryMethods: string[]    // Default delivery methods for errors
    messageTemplate?: string     // Template for error messages
    enabled: boolean             // Global error notifications on/off
  }
  blockSpecificSettings: Map<string, {  // blockId -> settings
    enabled: boolean
    customMessage?: string
    deliveryMethods?: string[]   // Override global delivery methods
    rateLimitMinutes?: number    // Override global rate limit
  }>
  blockTypeSettings: Map<string, {  // blockType -> settings
    enabled: boolean
    messageTemplate: string
    deliveryMethods?: string[]   // Override global delivery methods
    rateLimitMinutes?: number    // Override global rate limit
  }>
  createdAt: Date
  updatedAt: Date
}

const ErrorNotificationSettingsSchema = new Schema<IErrorNotificationSettings>({
  globalSettings: {
    rateLimitMinutes: {
      type: Number,
      required: [true, 'Rate limit is required'],
      min: [1, 'Rate limit must be at least 1 minute'],
      max: [1440, 'Rate limit cannot exceed 1440 minutes (24 hours)'],
      default: 15
    },
    deliveryMethods: [{
      type: String,
      required: [true, 'At least one delivery method is required'],
      trim: true
    }],
    messageTemplate: {
      type: String,
      maxlength: [500, 'Message template cannot exceed 500 characters'],
      trim: true,
      default: 'Flow execution error in block {{blockType}}: {{errorMessage}}'
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  blockSpecificSettings: {
    type: Map,
    of: new Schema({
      enabled: {
        type: Boolean,
        default: true
      },
      customMessage: {
        type: String,
        maxlength: [500, 'Custom message cannot exceed 500 characters'],
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
      }
    }, { _id: false }),
    default: new Map()
  },
  blockTypeSettings: {
    type: Map,
    of: new Schema({
      enabled: {
        type: Boolean,
        default: true
      },
      messageTemplate: {
        type: String,
        required: [true, 'Message template is required'],
        maxlength: [500, 'Message template cannot exceed 500 characters'],
        trim: true,
        default: 'Flow execution error in block {{blockType}}: {{errorMessage}}'
      },
      deliveryMethods: [{
        type: String,
        trim: true
      }],
      rateLimitMinutes: {
        type: Number,
        min: [1, 'Rate limit must be at least 1 minute'],
        max: [1440, 'Rate limit cannot exceed 1440 minutes (24 hours)']
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
ErrorNotificationSettingsSchema.pre('validate', function(next) {
  if (!this.globalSettings.deliveryMethods?.length && this.globalSettings.enabled) {
    this.invalidate('globalSettings.deliveryMethods', 'At least one delivery method is required when enabled')
  }
  next()
})

// Singleton pattern - only one settings document allowed
ErrorNotificationSettingsSchema.index({}, { 
  unique: true, 
  partialFilterExpression: { _id: { $exists: true } }
})

// Create static method to get or create settings
ErrorNotificationSettingsSchema.statics.getSettings = async function(): Promise<IErrorNotificationSettings> {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({
      globalSettings: {
        rateLimitMinutes: 15,
        deliveryMethods: ['email'],
        enabled: true,
        messageTemplate: 'Flow execution error in block {{blockType}}: {{errorMessage}}'
      },
      blockSpecificSettings: new Map(),
      blockTypeSettings: new Map()
    })
  }
  return settings
}

// Indexes for efficient queries
ErrorNotificationSettingsSchema.index({ 'globalSettings.enabled': 1 })
ErrorNotificationSettingsSchema.index({ createdAt: -1 })

export const ErrorNotificationSettings = mongoose.model<IErrorNotificationSettings>('ErrorNotificationSettings', ErrorNotificationSettingsSchema)