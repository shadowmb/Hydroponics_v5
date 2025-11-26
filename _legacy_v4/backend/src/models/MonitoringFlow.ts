import mongoose, { Schema, Document } from 'mongoose'

export interface IMonitoringFlow extends Document {
  flowTemplateId: mongoose.Types.ObjectId
  name: string
  description?: string
  monitoringInterval: number // minutes
  isActive: boolean
  lastExecuted?: Date
  nextExecution?: Date
  executionCount: number
  lastError?: string
  createdAt: Date
  updatedAt: Date
  
  // Methods
  calculateNextExecution(): Date
  updateAfterExecution(success: boolean, error?: string): void
}

const MonitoringFlowSchema = new Schema<IMonitoringFlow>({
  flowTemplateId: {
    type: Schema.Types.ObjectId,
    ref: 'FlowTemplate',
    required: [true, 'FlowTemplate ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  monitoringInterval: {
    type: Number,
    required: [true, 'Monitoring interval is required'],
    min: [1, 'Monitoring interval must be at least 1 minute'],
    max: [1440, 'Monitoring interval cannot exceed 1440 minutes (24 hours)']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastExecuted: {
    type: Date
  },
  nextExecution: {
    type: Date
  },
  executionCount: {
    type: Number,
    default: 0,
    min: [0, 'Execution count cannot be negative']
  },
  lastError: {
    type: String,
    maxlength: [1000, 'Error message cannot exceed 1000 characters']
  }
}, {
  timestamps: true
})

// Indexes for performance
MonitoringFlowSchema.index({ isActive: 1 })
MonitoringFlowSchema.index({ nextExecution: 1, isActive: 1 })
MonitoringFlowSchema.index({ flowTemplateId: 1 })

// Виртуално поле за изчисляване на статуса
MonitoringFlowSchema.virtual('status').get(function(this: IMonitoringFlow) {
  if (!this.isActive) return 'inactive'
  if (this.lastError) return 'error'
  if (this.lastExecuted) return 'running'
  return 'pending'
})

// Метод за изчисляване на следващото изпълнение
MonitoringFlowSchema.methods.calculateNextExecution = function(this: IMonitoringFlow): Date {
  const now = new Date()
  const intervalMs = this.monitoringInterval * 60 * 1000
  return new Date(now.getTime() + intervalMs)
}

// Метод за обновяване на статистиките след изпълнение
MonitoringFlowSchema.methods.updateAfterExecution = function(
  this: IMonitoringFlow, 
  success: boolean, 
  error?: string
): void {
  this.lastExecuted = new Date()
  this.executionCount += 1
  this.nextExecution = this.calculateNextExecution()
  
  if (success) {
    this.lastError = undefined
  } else {
    this.lastError = error || 'Unknown execution error'
  }
}

// Pre-save middleware за автоматично изчисляване на nextExecution
MonitoringFlowSchema.pre('save', function(this: IMonitoringFlow, next) {
  if (this.isNew && !this.nextExecution) {
    this.nextExecution = this.calculateNextExecution()
  }
  next()
})

export const MonitoringFlow = mongoose.model<IMonitoringFlow>('MonitoringFlow', MonitoringFlowSchema)