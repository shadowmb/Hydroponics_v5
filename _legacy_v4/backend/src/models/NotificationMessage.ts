import mongoose, { Schema, Document } from 'mongoose'

export interface INotificationMessage extends Document {
  name: string
  description?: string
  type: 'periodic'
  schedule: {
    type: 'interval' | 'fixed_time'
    interval?: number  // minutes for interval type
    time?: string      // "14:30" for fixed_time
    days?: string[]    // ['monday', 'tuesday'] or ['daily']
  }
  tags: string[]       // MonitoringTag names
  deliveryMethods: string[]  // ['email', 'telegram']
  isActive: boolean
  lastSent?: Date
  createdAt: Date
  updatedAt: Date
}

const NotificationMessageSchema = new Schema<INotificationMessage>({
  name: {
    type: String,
    required: [true, 'Message name is required'],
    trim: true,
    maxlength: [100, 'Message name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  type: {
    type: String,
    enum: ['periodic'],
    default: 'periodic',
    required: true
  },
  schedule: {
    type: {
      type: String,
      enum: ['interval', 'fixed_time'],
      required: [true, 'Schedule type is required']
    },
    interval: {
      type: Number,
      min: [1, 'Interval must be at least 1 minute'],
      max: [1440, 'Interval cannot exceed 1440 minutes (24 hours)']
    },
    time: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format']
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'daily']
    }]
  },
  tags: [{
    type: String,
    required: [true, 'At least one tag is required'],
    trim: true,
    maxlength: [10, 'Tag name cannot exceed 10 characters']
  }],
  deliveryMethods: [{
    type: String,
    required: [true, 'At least one delivery method is required'],
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastSent: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Validation
NotificationMessageSchema.pre('validate', function(next) {
  if (this.schedule.type === 'interval' && !this.schedule.interval) {
    this.invalidate('schedule.interval', 'Interval is required for interval type')
  }
  if (this.schedule.type === 'fixed_time' && (!this.schedule.time || !this.schedule.days?.length)) {
    this.invalidate('schedule.time', 'Time and days are required for fixed_time type')
  }
  if (!this.tags?.length) {
    this.invalidate('tags', 'At least one tag is required')
  }
  if (!this.deliveryMethods?.length) {
    this.invalidate('deliveryMethods', 'At least one delivery method is required')
  }
  next()
})

// Indexes for efficient queries
NotificationMessageSchema.index({ name: 1 })
NotificationMessageSchema.index({ isActive: 1 })
NotificationMessageSchema.index({ type: 1 })
NotificationMessageSchema.index({ 'schedule.type': 1 })
NotificationMessageSchema.index({ lastSent: -1 })
NotificationMessageSchema.index({ createdAt: -1 })

export const NotificationMessage = mongoose.model<INotificationMessage>('NotificationMessage', NotificationMessageSchema)