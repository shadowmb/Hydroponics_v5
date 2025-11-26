import mongoose, { Schema, Document } from 'mongoose'

export interface INotificationProvider extends Document {
  type: 'email' | 'telegram' | 'viber'
  name: string
  config: {
    // Email configuration
    host?: string
    port?: number
    secure?: boolean
    user?: string
    password?: string
    from?: string
    to?: string[]
    
    // Telegram configuration
    botToken?: string
    chatId?: string
    
    // Viber configuration
    authToken?: string
    // Future extensibility for other providers
    [key: string]: any
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationProviderSchema = new Schema<INotificationProvider>({
  type: {
    type: String,
    enum: ['email', 'telegram', 'viber'],
    required: [true, 'Provider type is required']
  },
  name: {
    type: String,
    required: [true, 'Provider name is required'],
    trim: true,
    maxlength: [100, 'Provider name cannot exceed 100 characters']
  },
  config: {
    // Email fields
    host: {
      type: String,
      trim: true
    },
    port: {
      type: Number,
      min: [1, 'Port must be positive'],
      max: [65535, 'Port must be valid']
    },
    secure: {
      type: Boolean,
      default: false
    },
    user: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      trim: true
    },
    from: {
      type: String,
      trim: true
    },
    to: [{
      type: String,
      trim: true
    }],
    
    // Telegram fields
    botToken: {
      type: String,
      trim: true
    },
    chatId: {
      type: String,
      trim: true
    },
    
    // Viber fields
    authToken: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Hide sensitive information in JSON output
      if (ret.config) {
        if (ret.config.password) ret.config.password = '[HIDDEN]'
        if (ret.config.botToken) ret.config.botToken = '[HIDDEN]'
        if (ret.config.authToken) ret.config.authToken = '[HIDDEN]'
      }
      return ret
    }
  },
  toObject: { virtuals: true }
})

// Validation
NotificationProviderSchema.pre('validate', function(next) {
  if (this.type === 'email') {
    if (!this.config.host || !this.config.port || !this.config.user || !this.config.password) {
      this.invalidate('config', 'Email provider requires host, port, user, and password')
    }
    if (!this.config.to?.length) {
      this.invalidate('config.to', 'Email provider requires at least one recipient')
    }
  }
  
  if (this.type === 'telegram') {
    if (!this.config.botToken || !this.config.chatId) {
      this.invalidate('config', 'Telegram provider requires botToken and chatId')
    }
  }
  
  if (this.type === 'viber') {
    if (!this.config.authToken) {
      this.invalidate('config', 'Viber provider requires authToken')
    }
  }
  
  next()
})

// Compound index to ensure unique provider name per type
NotificationProviderSchema.index({ type: 1, name: 1 }, { unique: true })
NotificationProviderSchema.index({ isActive: 1 })
NotificationProviderSchema.index({ type: 1 })
NotificationProviderSchema.index({ createdAt: -1 })

export const NotificationProvider = mongoose.model<INotificationProvider>('NotificationProvider', NotificationProviderSchema)