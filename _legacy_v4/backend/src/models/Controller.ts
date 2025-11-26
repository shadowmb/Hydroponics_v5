import mongoose, { Schema, Document } from 'mongoose'

export interface IControllerLogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: Record<string, any>
}

export interface IExecutionState {
  currentProgramId?: mongoose.Types.ObjectId
  currentTaskId?: mongoose.Types.ObjectId
  isRunning: boolean
  lastExecutionTime?: Date
  nextExecutionTime?: Date
  executionCount: number
}

export interface IController extends Document {
  name: string
  status: 'online' | 'offline' | 'error' | 'maintenance'
  executionState: IExecutionState
  logs: IControllerLogEntry[]
  systemInfo: {
    version: string
    uptime: number
    memoryUsage: number
    cpuUsage: number
  }
  lastHeartbeat: Date
  createdAt: Date
  updatedAt: Date
}

const LogEntrySchema = new Schema<IControllerLogEntry>({
  timestamp: {
    type: Date,
    default: Date.now
  },
  level: {
    type: String,
    required: [true, 'Log level is required'],
    enum: ['info', 'warn', 'error', 'debug']
  },
  message: {
    type: String,
    required: [true, 'Log message is required'],
    maxlength: [1000, 'Log message cannot exceed 1000 characters']
  },
  data: {
    type: Schema.Types.Mixed
  }
}, { _id: false })

const ExecutionStateSchema = new Schema<IExecutionState>({
  currentProgramId: {
    type: Schema.Types.ObjectId,
    ref: 'Program'
  },
  currentTaskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  lastExecutionTime: {
    type: Date
  },
  nextExecutionTime: {
    type: Date
  },
  executionCount: {
    type: Number,
    default: 0,
    min: [0, 'Execution count cannot be negative']
  }
}, { _id: false })

const ControllerSchema = new Schema<IController>({
  name: {
    type: String,
    required: [true, 'Controller name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Controller name cannot exceed 100 characters']
  },
  status: {
    type: String,
    required: [true, 'Controller status is required'],
    enum: ['online', 'offline', 'error', 'maintenance'],
    default: 'offline'
  },
  executionState: {
    type: ExecutionStateSchema,
    default: () => ({})
  },
  logs: {
    type: [LogEntrySchema],
    default: [],
    validate: {
      validator: function(logs: IControllerLogEntry[]) {
        return logs.length <= 1000
      },
      message: 'Cannot store more than 1000 log entries'
    }
  },
  systemInfo: {
    version: {
      type: String,
      default: '1.0.0'
    },
    uptime: {
      type: Number,
      default: 0,
      min: [0, 'Uptime cannot be negative']
    },
    memoryUsage: {
      type: Number,
      default: 0,
      min: [0, 'Memory usage cannot be negative']
    },
    cpuUsage: {
      type: Number,
      default: 0,
      min: [0, 'CPU usage cannot be negative'],
      max: [100, 'CPU usage cannot exceed 100%']
    }
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

ControllerSchema.index({ status: 1 })
ControllerSchema.index({ lastHeartbeat: 1 })
ControllerSchema.index({ 'executionState.isRunning': 1 })

export const Controller = mongoose.model<IController>('Controller', ControllerSchema)