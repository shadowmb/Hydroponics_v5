import mongoose, { Schema, Document } from 'mongoose'

export interface ICycleAction {
  actionTemplateId: mongoose.Types.ObjectId
  order: number
  overrideParameters?: Record<string, any>
}

export interface ICycle {
  startTime: string
  actions: ICycleAction[]
  duration?: number
  isActive: boolean
}

export interface IProgram extends Document {
  name: string
  description?: string
  cycles: ICycle[]
  maxExecutionTime?: number
  isActive: boolean
  isRunning: boolean
  isMonitoring: boolean
  monitoringInterval: number
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

const CycleActionSchema = new Schema<ICycleAction>({
  actionTemplateId: {
    type: Schema.Types.ObjectId,
    ref: 'ActionTemplate',
    required: [true, 'Action Template ID is required']
  },
  order: {
    type: Number,
    required: [true, 'Action order is required'],
    min: [0, 'Order must be at least 0']
  },
  overrideParameters: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false })

const CycleSchema = new Schema<ICycle>({
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  actions: {
    type: [CycleActionSchema],
    required: [true, 'At least one action is required'],
    validate: {
      validator: function(actions: ICycleAction[]) {
        return actions.length > 0
      },
      message: 'Cycle must have at least one action'
    }
  },
  duration: {
    type: Number,
    min: [1, 'Duration must be at least 1 minute']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false })

const ProgramSchema = new Schema<IProgram>({
  name: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true,
    maxlength: [100, 'Program name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  cycles: {
    type: [CycleSchema],
    required: [true, 'At least one cycle is required'],
    validate: {
      validator: function(cycles: ICycle[]) {
        return cycles.length > 0
      },
      message: 'Program must have at least one cycle'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  isMonitoring: {
    type: Boolean,
    default: false
  },
  monitoringInterval: {
    type: Number,
    min: [1, 'Monitoring interval must be at least 1 minute'],
    max: [1440, 'Monitoring interval cannot exceed 1440 minutes (24 hours)'],
    default: 10
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: IProgram, endDate: Date) {
        return !this.startDate || !endDate || endDate > this.startDate
      },
      message: 'End date must be after start date'
    }
  },
  maxExecutionTime: {
    type: Number,
    min: [1, 'Maximum execution time must be at least 1 minute'],
    max: [1440, 'Maximum execution time cannot exceed 1440 minutes (24 hours)'],
    default: 60
  }
}, {
  timestamps: true
})

ProgramSchema.index({ isActive: 1, isRunning: 1 })
ProgramSchema.index({ isMonitoring: 1, isActive: 1 })
ProgramSchema.index({ startDate: 1, endDate: 1 })

export const Program = mongoose.model<IProgram>('Program', ProgramSchema)