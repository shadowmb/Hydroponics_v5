import mongoose, { Schema, Document } from 'mongoose'

export interface IMonitoringTag extends Document {
  name: string
  description?: string
  isActive: boolean
  type: 'monitoring' | 'tolerance'
  tolerance?: number
  createdAt: Date
  updatedAt: Date
}

const MonitoringTagSchema = new Schema<IMonitoringTag>({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    unique: true,
    minlength: [1, 'Tag name must be at least 1 character'],
    maxlength: [12, 'Tag name cannot exceed 12 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['monitoring', 'tolerance'],
    default: 'monitoring',
    required: true
  },
  tolerance: {
    type: Number,
    required: false,
    min: [0, 'Tolerance must be a non-negative number']
  }
}, {
  timestamps: true
})

// Custom validation: tolerance is required when type is 'tolerance'
MonitoringTagSchema.pre('save', function(next) {
  if (this.type === 'tolerance' && (this.tolerance === undefined || this.tolerance === null)) {
    next(new Error('Tolerance value is required when type is "tolerance"'))
  } else {
    next()
  }
})

// Indexes for efficient queries
MonitoringTagSchema.index({ name: 1 })
MonitoringTagSchema.index({ isActive: 1 })
MonitoringTagSchema.index({ type: 1 })
MonitoringTagSchema.index({ createdAt: -1 })

export const MonitoringTag = mongoose.model<IMonitoringTag>('MonitoringTag', MonitoringTagSchema)