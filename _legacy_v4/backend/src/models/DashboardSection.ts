import mongoose, { Schema, Document, Types } from 'mongoose'

type ObjectId = Types.ObjectId

export interface IDashboardModule {
  name: string
  visualizationType: 'number' | 'gauge' | 'gauge-advanced' | 'chart' | 'status' | 'bar' | 'line'
  monitoringTagId?: ObjectId  // За sensors секция - референция към MonitoringTag
  mockData?: any             // За system, program, alerts секции
  isVisible: boolean
  displayOrder: number
  
  // Интелигентни граници (Smart Boundaries)
  smartBoundaries?: {
    enabled: boolean
    optimal: {
      min: number
      max: number
    }
    warningTolerance: number  // ± от оптималната зона за warning
    dangerTolerance: number   // ± от оптималната зона за danger
  }
  
  // Тренд индикатор
  trendIndicator?: {
    enabled: boolean
    toleranceType?: 'auto' | 'manual'
    toleranceTagId?: ObjectId
    manualTolerance?: number
  }

  // Visualization-specific settings
  numberDisplay?: {
    precision: number           // Decimal places: 0-4
    showUnit: boolean          // Show measurement unit
    threshold?: number         // Highlight threshold
  }

  gaugeSettings?: {
    showLabels: boolean        // Show min/max labels
    showSectors: boolean       // Show colored sectors
    animation: boolean         // Animate gauge updates
  }

  barChart?: {
    barCount: 5 | 10 | 15 | 20
    historicalData?: Array<{
      value: number
      timestamp: string | Date
    }>
  }

  lineChart?: {
    pointCount: 5 | 10 | 15 | 20
    historicalData?: Array<{
      value: number
      timestamp: string | Date
    }>
  }

  // Custom range settings for gauge-advanced
  customRange?: {
    min: number
    max: number
  }

}

export interface IDashboardSection extends Document {
  sectionId: 'sensors' | 'system' | 'program' | 'alerts'
  sectionSettings: {
    // Sensors настройки
    maxVisible?: number
    showDataLabels?: boolean
    compactMode?: boolean

    // System настройки
    showControllers?: boolean
    showDeviceHealth?: boolean
    showCriticalOnly?: boolean
    showNetworkStatus?: boolean
    selectedDevices?: {
      controllers: string[]
      devices: string[]
    }
    displayLimit?: number

    // Program настройки
    showCurrentCycle?: boolean
    showTimeline?: boolean
    showParameters?: boolean
    showExecutionStats?: boolean
    activeProgram?: {
      activeProgramId: ObjectId
      programId: ObjectId
      loadedAt: Date
    }
    dailyTracking?: {
      date: string
      completedCycles: Array<{
        cycleId: string
        executedAt: Date
        status: 'completed' | 'failed'
        duration: number
        executionSessionId?: ObjectId
      }>
      cycleExecutions: Array<{
        cycleId: string
        status: 'pending' | 'running' | 'completed' | 'failed'
        startTime?: Date
        endTime?: Date
        duration?: number
        executionSessionId?: ObjectId
      }>
      actionTemplateExecutions: Array<{
        actionTemplateId: ObjectId
        actionTemplateName: string
        cycleId: string
        status: 'pending' | 'running' | 'completed' | 'failed'
        startTime?: Date
        endTime?: Date
        duration?: number
        executionSessionId?: ObjectId
      }>
    }

    // Alerts настройки (legacy)
    errorLevels?: string[]
    maxErrors?: number
    showSystemMessages?: boolean
    showHardwareAlerts?: boolean
    showExecutionErrors?: boolean

    // Alerts настройки (нов формат)
    alerts?: {
      showExecutionErrors: boolean
      showSensorAlerts: boolean
      showHardwareIssues: boolean
      showSystemAlerts: boolean
      severityFilter: 'all' | 'critical' | 'warning'
      maxDisplayCount: number
      timeWindow: '1h' | '6h' | '24h' | '7d'
    }
  }
  modules: IDashboardModule[]
  createdAt: Date
  updatedAt: Date
}

const DashboardModuleSchema = new Schema<IDashboardModule>({
  name: {
    type: String,
    required: [true, 'Module name is required'],
    trim: true,
    maxlength: [50, 'Module name cannot exceed 50 characters']
  },
  visualizationType: {
    type: String,
    enum: ['number', 'gauge', 'gauge-advanced', 'chart', 'status', 'bar', 'line'],
    required: [true, 'Visualization type is required']
  },
  monitoringTagId: {
    type: Schema.Types.ObjectId,
    ref: 'MonitoringTag',
    required: false
  },
  mockData: {
    type: Schema.Types.Mixed,
    required: false
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    required: [true, 'Display order is required'],
    min: 1
  },
  
  // Интелигентни граници (Smart Boundaries)
  smartBoundaries: {
    enabled: {
      type: Boolean,
      default: false
    },
    optimal: {
      min: {
        type: Number,
        required: false
      },
      max: {
        type: Number,
        required: false
      }
    },
    warningTolerance: {
      type: Number,
      required: false,
      min: 0
    },
    dangerTolerance: {
      type: Number,
      required: false,
      min: 0
    }
  },
  
  // Тренд индикатор
  trendIndicator: {
    enabled: {
      type: Boolean,
      default: false
    },
    toleranceType: {
      type: String,
      enum: ['auto', 'manual'],
      required: false,
      default: 'manual'
    },
    toleranceTagId: {
      type: Schema.Types.ObjectId,
      ref: 'MonitoringTag',
      required: false
    },
    manualTolerance: {
      type: Number,
      required: false,
      default: 0.1,
      min: 0
    }
  },

  // Visualization-specific settings
  numberDisplay: {
    precision: {
      type: Number,
      min: 0,
      max: 4,
      default: 2
    },
    showUnit: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      required: false
    }
  },

  gaugeSettings: {
    showLabels: {
      type: Boolean,
      default: true
    },
    showSectors: {
      type: Boolean,
      default: true
    },
    animation: {
      type: Boolean,
      default: true
    }
  },

  barChart: {
    barCount: {
      type: Number,
      enum: [5, 10, 15, 20],
      default: 10
    },
    historicalData: [{
      value: {
        type: Number,
        required: true
      },
      timestamp: {
        type: Schema.Types.Mixed,
        required: true
      }
    }]
  },

  lineChart: {
    pointCount: {
      type: Number,
      enum: [5, 10, 15, 20],
      default: 10
    },
    historicalData: [{
      value: {
        type: Number,
        required: true
      },
      timestamp: {
        type: Schema.Types.Mixed,
        required: true
      }
    }]
  },

  // Custom range settings for gauge-advanced
  customRange: {
    min: {
      type: Number,
      required: false
    },
    max: {
      type: Number,
      required: false
    }
  },

})  // Автоматично генериране на _id за модулите

const DashboardSectionSchema = new Schema<IDashboardSection>({
  sectionId: {
    type: String,
    enum: ['sensors', 'system', 'program', 'alerts'],
    required: [true, 'Section ID is required'],
    unique: true
  },
  sectionSettings: {
    // Sensors настройки
    maxVisible: {
      type: Number,
      min: 1,
      max: 20
    },
    showDataLabels: {
      type: Boolean
    },
    compactMode: {
      type: Boolean
    },
    
    // System настройки
    showControllers: {
      type: Boolean
    },
    showDeviceHealth: {
      type: Boolean
    },
    showCriticalOnly: {
      type: Boolean
    },
    showNetworkStatus: {
      type: Boolean
    },
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
      min: 4,
      max: 12,
      default: 8
    },

    // Program настройки
    showCurrentCycle: {
      type: Boolean
    },
    showTimeline: {
      type: Boolean
    },
    showParameters: {
      type: Boolean
    },
    showExecutionStats: {
      type: Boolean
    },
    activeProgram: {
      activeProgramId: {
        type: Schema.Types.ObjectId,
        ref: 'ActiveProgram',
        required: false
      },
      programId: {
        type: Schema.Types.ObjectId,
        ref: 'Program',
        required: false
      },
      loadedAt: {
        type: Date,
        required: false
      }
    },
    dailyTracking: {
      date: {
        type: String,
        required: false
      },
      completedCycles: [{
        cycleId: {
          type: String,
          required: true
        },
        executedAt: {
          type: Date,
          required: true
        },
        status: {
          type: String,
          enum: ['completed', 'failed'],
          required: true
        },
        duration: {
          type: Number,
          required: true,
          default: 0
        },
        executionSessionId: {
          type: Schema.Types.ObjectId,
          ref: 'ExecutionSession',
          required: false
        }
      }],
      cycleExecutions: [{
        cycleId: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ['pending', 'running', 'completed', 'failed'],
          required: true
        },
        startTime: {
          type: Date,
          required: false
        },
        endTime: {
          type: Date,
          required: false
        },
        duration: {
          type: Number,
          required: false
        },
        executionSessionId: {
          type: Schema.Types.ObjectId,
          ref: 'ExecutionSession',
          required: false
        }
      }],
      actionTemplateExecutions: [{
        actionTemplateId: {
          type: Schema.Types.ObjectId,
          ref: 'ActionTemplate',
          required: true
        },
        actionTemplateName: {
          type: String,
          required: true
        },
        cycleId: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ['pending', 'running', 'completed', 'failed'],
          required: true
        },
        startTime: {
          type: Date,
          required: false
        },
        endTime: {
          type: Date,
          required: false
        },
        duration: {
          type: Number,
          required: false
        },
        executionSessionId: {
          type: Schema.Types.ObjectId,
          ref: 'ExecutionSession',
          required: false
        }
      }]
    },
    
    // Alerts настройки (legacy)
    errorLevels: [{
      type: String,
      enum: ['error', 'warning', 'info']
    }],
    maxErrors: {
      type: Number,
      min: 1,
      max: 50
    },
    showSystemMessages: {
      type: Boolean
    },
    showHardwareAlerts: {
      type: Boolean
    },
    showExecutionErrors: {
      type: Boolean
    },

    // Alerts настройки (нов формат)
    alerts: {
      showExecutionErrors: {
        type: Boolean,
        default: true
      },
      showSensorAlerts: {
        type: Boolean,
        default: true
      },
      showHardwareIssues: {
        type: Boolean,
        default: true
      },
      showSystemAlerts: {
        type: Boolean,
        default: true
      },
      severityFilter: {
        type: String,
        enum: ['all', 'critical', 'warning'],
        default: 'all'
      },
      maxDisplayCount: {
        type: Number,
        min: 5,
        max: 50,
        default: 10
      },
      timeWindow: {
        type: String,
        enum: ['1h', '6h', '24h', '7d'],
        default: '24h'
      }
    }
  },
  modules: [DashboardModuleSchema]
}, {
  timestamps: true
})

// Indexes
DashboardSectionSchema.index({ sectionId: 1 })
DashboardSectionSchema.index({ 'modules.displayOrder': 1 })
DashboardSectionSchema.index({ 'modules.isVisible': 1 })
DashboardSectionSchema.index({ createdAt: -1 })

// Pre-save middleware to sort modules by displayOrder
DashboardSectionSchema.pre('save', function(next) {
  if (this.modules && this.modules.length > 0) {
    this.modules.sort((a, b) => a.displayOrder - b.displayOrder)
  }
  next()
})

export const DashboardSection = mongoose.model<IDashboardSection>('DashboardSection', DashboardSectionSchema)