import mongoose, { Schema, Document } from 'mongoose'

export interface IMonitoringQueue extends Document {
  flowId: mongoose.Types.ObjectId
  flowName: string // Human-readable flow name for easier identification
  flowDescription?: string // Optional flow description
  addedAt: Date
  pausedBy: string  // ActiveProgram._id or special markers like 'system_busy'
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled'
  priority: number // Lower number = higher priority (0 = highest)
  executionAttempts: number
  lastError?: string
  createdAt: Date
  updatedAt: Date
  
  // Methods
  markAsExecuting(): void
  markAsCompleted(): void
  markAsFailed(error: string): void
}

const MonitoringQueueSchema = new Schema<IMonitoringQueue>({
  flowId: {
    type: Schema.Types.ObjectId,
    ref: 'MonitoringFlow',
    required: [true, 'MonitoringFlow ID is required']
  },
  flowName: {
    type: String,
    required: [true, 'Flow name is required for queue visibility'],
    trim: true,
    maxlength: [200, 'Flow name cannot exceed 200 characters']
  },
  flowDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Flow description cannot exceed 500 characters']
  },
  addedAt: {
    type: Date,
    required: [true, 'Added timestamp is required'],
    default: Date.now
  },
  pausedBy: {
    type: String,
    required: [true, 'PausedBy identifier is required'],
    trim: true,
    maxlength: [100, 'PausedBy identifier cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'executing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    required: [true, 'Status is required']
  },
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority cannot be negative']
  },
  executionAttempts: {
    type: Number,
    default: 0,
    min: [0, 'Execution attempts cannot be negative']
  },
  lastError: {
    type: String,
    maxlength: [1000, 'Error message cannot exceed 1000 characters']
  }
}, {
  timestamps: true
})

// Indexes for performance - следвайки pattern от MonitoringFlow
MonitoringQueueSchema.index({ status: 1, priority: 1, addedAt: 1 }) // For queue processing
MonitoringQueueSchema.index({ flowId: 1, status: 1 }) // For deduplication
MonitoringQueueSchema.index({ pausedBy: 1 }) // For cleanup by program
MonitoringQueueSchema.index({ addedAt: 1 }) // For FIFO ordering
MonitoringQueueSchema.index({ flowName: 1 }) // For human-readable searches

// Methods following MonitoringFlow pattern
MonitoringQueueSchema.methods.markAsExecuting = function(this: IMonitoringQueue): void {
  this.status = 'executing'
  this.executionAttempts += 1
}

MonitoringQueueSchema.methods.markAsCompleted = function(this: IMonitoringQueue): void {
  this.status = 'completed'
  this.lastError = undefined
}

MonitoringQueueSchema.methods.markAsFailed = function(this: IMonitoringQueue, error: string): void {
  this.status = 'failed'
  this.lastError = error
}

// Pre-save middleware following MonitoringFlow pattern
MonitoringQueueSchema.pre('save', function(this: IMonitoringQueue, next) {
  // Ensure addedAt is set if it's a new document
  if (this.isNew && !this.addedAt) {
    this.addedAt = new Date()
  }
  next()
})

export const MonitoringQueue = mongoose.model<IMonitoringQueue>('MonitoringQueue', MonitoringQueueSchema)