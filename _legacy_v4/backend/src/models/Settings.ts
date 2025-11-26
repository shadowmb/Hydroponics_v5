import mongoose, { Schema, Document } from 'mongoose'

export interface ISystemSettings {
  timezone: string
  language: string
  units: 'metric' | 'imperial'
  autoStart: boolean
  logLevel: 'info' | 'warn' | 'error' | 'debug'
  maxLogEntries: number
}

export interface INotificationSettings {
  email: {
    enabled: boolean
    recipients: string[]
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpPassword?: string
  }
  alerts: {
    systemErrors: boolean
    deviceFailures: boolean
    programCompletion: boolean
    lowWaterLevel: boolean
  }
}

export interface IThresholds {
  ph: {
    min: number
    max: number
  }
  ec: {
    min: number
    max: number
  }
  temperature: {
    min: number
    max: number
  }
  humidity: {
    min: number
    max: number
  }
  waterLevel: {
    min: number
    critical: number
  }
}

export interface ISettings extends Document {
  name: string
  system: ISystemSettings
  notifications: INotificationSettings
  thresholds: IThresholds
  customSettings: Record<string, any>
  version: string
  createdAt: Date
  updatedAt: Date
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'bg', 'de', 'fr', 'es']
  },
  units: {
    type: String,
    default: 'metric',
    enum: ['metric', 'imperial']
  },
  autoStart: {
    type: Boolean,
    default: false
  },
  logLevel: {
    type: String,
    default: 'info',
    enum: ['info', 'warn', 'error', 'debug']
  },
  maxLogEntries: {
    type: Number,
    default: 1000,
    min: [100, 'Maximum log entries must be at least 100'],
    max: [10000, 'Maximum log entries cannot exceed 10000']
  }
}, { _id: false })

const NotificationSettingsSchema = new Schema<INotificationSettings>({
  email: {
    enabled: {
      type: Boolean,
      default: false
    },
    recipients: {
      type: [String],
      default: [],
      validate: {
        validator: function(recipients: string[]) {
          return recipients.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        },
        message: 'All recipients must be valid email addresses'
      }
    },
    smtpHost: String,
    smtpPort: {
      type: Number,
      min: [1, 'SMTP port must be at least 1'],
      max: [65535, 'SMTP port cannot exceed 65535']
    },
    smtpUser: String,
    smtpPassword: String
  },
  alerts: {
    systemErrors: {
      type: Boolean,
      default: true
    },
    deviceFailures: {
      type: Boolean,
      default: true
    },
    programCompletion: {
      type: Boolean,
      default: false
    },
    lowWaterLevel: {
      type: Boolean,
      default: true
    }
  }
}, { _id: false })

const ThresholdsSchema = new Schema<IThresholds>({
  ph: {
    min: {
      type: Number,
      default: 5.5,
      min: [0, 'pH minimum cannot be negative'],
      max: [14, 'pH minimum cannot exceed 14']
    },
    max: {
      type: Number,
      default: 6.5,
      min: [0, 'pH maximum cannot be negative'],
      max: [14, 'pH maximum cannot exceed 14']
    }
  },
  ec: {
    min: {
      type: Number,
      default: 1.2,
      min: [0, 'EC minimum cannot be negative']
    },
    max: {
      type: Number,
      default: 2.0,
      min: [0, 'EC maximum cannot be negative']
    }
  },
  temperature: {
    min: {
      type: Number,
      default: 18,
      min: [-50, 'Temperature minimum cannot be below -50°C']
    },
    max: {
      type: Number,
      default: 28,
      max: [100, 'Temperature maximum cannot exceed 100°C']
    }
  },
  humidity: {
    min: {
      type: Number,
      default: 40,
      min: [0, 'Humidity minimum cannot be negative'],
      max: [100, 'Humidity minimum cannot exceed 100%']
    },
    max: {
      type: Number,
      default: 70,
      min: [0, 'Humidity maximum cannot be negative'],
      max: [100, 'Humidity maximum cannot exceed 100%']
    }
  },
  waterLevel: {
    min: {
      type: Number,
      default: 20,
      min: [0, 'Water level minimum cannot be negative'],
      max: [100, 'Water level minimum cannot exceed 100%']
    },
    critical: {
      type: Number,
      default: 10,
      min: [0, 'Water level critical cannot be negative'],
      max: [100, 'Water level critical cannot exceed 100%']
    }
  }
}, { _id: false })

const SettingsSchema = new Schema<ISettings>({
  name: {
    type: String,
    required: [true, 'Settings name is required'],
    unique: true,
    default: 'system'
  },
  system: {
    type: SystemSettingsSchema,
    default: () => ({})
  },
  notifications: {
    type: NotificationSettingsSchema,
    default: () => ({})
  },
  thresholds: {
    type: ThresholdsSchema,
    default: () => ({})
  },
  customSettings: {
    type: Schema.Types.Mixed,
    default: {}
  },
  version: {
    type: String,
    default: '1.0.0'
  }
}, {
  timestamps: true
})

SettingsSchema.index({ name: 1 }, { unique: true })

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema)