import mongoose, { Schema, Document } from 'mongoose'

export interface IDashboardSettings extends Document {
  layout: {
    type: 'compact' | 'stacked' | 'priority' | 'tiles'
    refreshInterval: number
    enableAnimations: boolean
    compactMode: boolean
    autoRefresh: boolean
    layoutSettings: {
      layoutType: string
      sectionSizing: {
        sensors: { width: number; height: number }
        system: { width: number; height: number }
        program: { width: number; height: number }
        alerts: { width: number; height: number }
      }
      moduleSize: 'small' | 'medium' | 'large'
      spacing: 'tight' | 'normal' | 'relaxed'
      showSectionBorders: boolean
      enableLayoutTransitions: boolean
    }
  }
  system: {
    selectedDevices: {
      controllers: string[]
      devices: string[]
    }
    displayLimit: number
  }
  units: {
    ec: string
    temperature: string
    light: string
    volume: string
  }
  createdAt: Date
  updatedAt: Date
}

const DashboardSettingsSchema = new Schema<IDashboardSettings>({
  layout: {
    type: {
      type: String,
      enum: ['compact', 'stacked', 'priority', 'tiles'],
      default: 'compact'
    },
    refreshInterval: {
      type: Number,
      default: 10,
      min: 1,
      max: 300
    },
    enableAnimations: {
      type: Boolean,
      default: true
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    autoRefresh: {
      type: Boolean,
      default: true
    },
    layoutSettings: {
      layoutType: {
        type: String,
        default: 'compact'
      },
      sectionSizing: {
        sensors: {
          width: { type: Number, default: 50 },
          height: { type: Number, default: 300 }
        },
        system: {
          width: { type: Number, default: 50 },
          height: { type: Number, default: 300 }
        },
        program: {
          width: { type: Number, default: 50 },
          height: { type: Number, default: 250 }
        },
        alerts: {
          width: { type: Number, default: 50 },
          height: { type: Number, default: 150 }
        }
      },
      moduleSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      spacing: {
        type: String,
        enum: ['tight', 'normal', 'relaxed'],
        default: 'normal'
      },
      showSectionBorders: {
        type: Boolean,
        default: true
      },
      enableLayoutTransitions: {
        type: Boolean,
        default: true
      }
    }
  },
  system: {
    selectedDevices: {
      controllers: {
        type: [String],
        default: []
      },
      devices: {
        type: [String],
        default: []
      }
    },
    displayLimit: {
      type: Number,
      default: 8,
      min: 4,
      max: 12
    }
  },
  units: {
    ec: {
      type: String,
      default: 'us-cm'
    },
    temperature: {
      type: String,
      default: 'celsius'
    },
    light: {
      type: String,
      default: 'lux'
    },
    volume: {
      type: String,
      default: 'liters'
    }
  }
}, {
  timestamps: true
})

// Indexes
DashboardSettingsSchema.index({ createdAt: -1 })

export const DashboardSettings = mongoose.model<IDashboardSettings>('DashboardSettings', DashboardSettingsSchema)