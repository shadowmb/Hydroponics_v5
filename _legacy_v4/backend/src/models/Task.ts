import mongoose, { Schema, Document } from 'mongoose'

export interface ITaskAction {
  deviceId: mongoose.Types.ObjectId
  action: 'turn_on' | 'turn_off' | 'set_value' | 'read_sensor'
  value?: number
  duration?: number
}

export interface ITask extends Document {
  name: string
  type: 'water' | 'fertilize' | 'light' | 'monitor' | 'custom'
  actions: ITaskAction[]
  isActive: boolean
  priority: number
  description?: string
  createdAt: Date
  updatedAt: Date
}

const TaskActionSchema = new Schema<ITaskAction>({
  deviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device ID is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['turn_on', 'turn_off', 'set_value', 'read_sensor']
  },
  value: {
    type: Number,
    min: [0, 'Value must be positive']
  },
  duration: {
    type: Number,
    min: [0, 'Duration must be positive']
  }
}, { _id: false })

const TaskSchema = new Schema<ITask>({
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true,
    maxlength: [100, 'Task name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Task type is required'],
    enum: ['water', 'fertilize', 'light', 'monitor', 'custom']
  },
  actions: {
    type: [TaskActionSchema],
    required: [true, 'At least one action is required'],
    validate: {
      validator: function(actions: ITaskAction[]) {
        return actions.length > 0
      },
      message: 'Task must have at least one action'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: [1, 'Priority must be at least 1'],
    max: [10, 'Priority cannot exceed 10']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true
})

TaskSchema.index({ type: 1, isActive: 1 })
TaskSchema.index({ priority: -1 })

export const Task = mongoose.model<ITask>('Task', TaskSchema)