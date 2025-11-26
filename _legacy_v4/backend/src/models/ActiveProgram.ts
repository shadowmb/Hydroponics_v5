import mongoose, { Schema, Document } from 'mongoose'


export interface ISkippedCycle {
  cycleId: string
  skipUntil: Date
  reason?: string
}

export interface IActionTemplate {
  name: string
  icon?: string
  description?: string
}

export interface IActiveCycle {
  cycleId: string
  taskId: mongoose.Types.ObjectId
  startTime: string
  duration?: number
  lastExecuted?: Date
  nextExecution: Date
  executionCount: number
  isActive: boolean
  isCurrentlyExecuting: boolean
  actionTemplates?: IActionTemplate[]
  cycleGlobalParameters?: Record<string, any>
}

export interface IActiveProgram extends Document {
  programId: mongoose.Types.ObjectId
  controllerId: mongoose.Types.ObjectId
  name: string
  status: 'loaded' | 'scheduled' | 'running' | 'paused' | 'stopped' | 'error' | 'completed'
  startedAt: Date
  pausedAt?: Date
  stoppedAt?: Date
  scheduledStartDate?: Date  // за отложен старт
  delayDays?: number        // брой дни за отлагане
  minCycleInterval?: number // минимален интервал между циклите в минути (60-240)
  maxExecutionTime?: number // максимално време за изпълнение на цикъл в минути
  activeCycles: IActiveCycle[]
  skippedCycles: ISkippedCycle[]       // прескочени цикли
  totalExecutions: number
  lastError?: string
  estimatedCompletion?: Date
  createdAt: Date
  updatedAt: Date
}


const SkippedCycleSchema = new Schema<ISkippedCycle>({
  cycleId: {
    type: String,
    required: [true, 'Cycle ID is required']
  },
  skipUntil: {
    type: Date,
    required: [true, 'Skip until date is required']
  },
  reason: {
    type: String,
    maxlength: [200, 'Reason cannot exceed 200 characters']
  }
}, { _id: false })

const ActiveCycleSchema = new Schema<IActiveCycle>({
  cycleId: {
    type: String,
    required: [true, 'Cycle ID is required']
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  duration: {
    type: Number,
    min: [1, 'Duration must be at least 1 minute']
  },
  lastExecuted: {
    type: Date
  },
  nextExecution: {
    type: Date,
    required: [true, 'Next execution time is required']
  },
  executionCount: {
    type: Number,
    default: 0,
    min: [0, 'Execution count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCurrentlyExecuting: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const ActiveProgramSchema = new Schema<IActiveProgram>({
  programId: {
    type: Schema.Types.ObjectId,
    ref: 'Program',
    required: [true, 'Program ID is required']
  },
  controllerId: {
    type: Schema.Types.ObjectId,
    ref: 'Controller',
    required: [true, 'Controller ID is required']
  },
  name: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['loaded', 'scheduled', 'running', 'paused', 'stopped', 'error', 'completed'],
    default: 'loaded'
  },
  startedAt: {
    type: Date,
    required: [true, 'Started at time is required'],
    default: Date.now
  },
  pausedAt: {
    type: Date
  },
  stoppedAt: {
    type: Date
  },
  scheduledStartDate: {
    type: Date
  },
  delayDays: {
    type: Number,
    min: [0, 'Delay days cannot be negative'],
    max: [365, 'Delay days cannot exceed 365 days']
  },
  minCycleInterval: {
    type: Number,
    min: [60, 'Minimum cycle interval must be at least 60 minutes'],
    max: [240, 'Minimum cycle interval cannot exceed 240 minutes'],
    default: 120
  },
  maxExecutionTime: {
    type: Number,
    min: [1, 'Maximum execution time must be at least 1 minute'],
    max: [1440, 'Maximum execution time cannot exceed 1440 minutes (24 hours)'],
    default: 60
  },
  activeCycles: {
    type: [ActiveCycleSchema],
    required: [true, 'Active cycles are required'],
    validate: {
      validator: function(cycles: IActiveCycle[]) {
        return cycles.length > 0
      },
      message: 'Active program must have at least one cycle'
    }
  },
  skippedCycles: {
    type: [SkippedCycleSchema],
    default: []
  },
  totalExecutions: {
    type: Number,
    default: 0,
    min: [0, 'Total executions cannot be negative']
  },
  lastError: {
    type: String,
    maxlength: [500, 'Error message cannot exceed 500 characters']
  },
  estimatedCompletion: {
    type: Date
  }
}, {
  timestamps: true
})

ActiveProgramSchema.index({ programId: 1, controllerId: 1 })
ActiveProgramSchema.index({ status: 1 })
ActiveProgramSchema.index({ 'activeCycles.nextExecution': 1 })
ActiveProgramSchema.index({ startedAt: 1 })

ActiveProgramSchema.pre('validate', function(this: IActiveProgram) {
  if (this.status === 'paused' && !this.pausedAt) {
    this.pausedAt = new Date()
  }
  if ((this.status === 'stopped' || this.status === 'completed') && !this.stoppedAt) {
    this.stoppedAt = new Date()
  }
  if (this.status === 'scheduled' && this.delayDays && !this.scheduledStartDate) {
    this.scheduledStartDate = new Date(Date.now() + this.delayDays * 24 * 60 * 60 * 1000)
  }
})

export const ActiveProgram = mongoose.model<IActiveProgram>('ActiveProgram', ActiveProgramSchema)