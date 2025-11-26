import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILogContext {
  programId?: string
  cycleId?: string
  blockId?: string
  sessionId?: string
  deviceId?: string
}

export interface ILogEntry extends Document {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error' | 'analytics'
  tag: string
  module: string
  data: any
  context?: ILogContext
  storage: 'memory' | 'session' | 'persistent'
  ttl?: Date
  createdAt: Date
  updatedAt: Date
}

// Interface за static методите на модела
export interface ILogEntryModel extends Model<ILogEntry> {
  findByLevel(level: string, limit?: number): Promise<ILogEntry[]>
  findByModule(module: string, limit?: number): Promise<ILogEntry[]>
  findByTag(tag: string, limit?: number): Promise<ILogEntry[]>
  findByTimeRange(startTime: Date, endTime: Date): Promise<ILogEntry[]>
  findByProgram(programId: string, limit?: number): Promise<ILogEntry[]>
  getAnalytics(startTime: Date, endTime: Date): Promise<any[]>
}

const logContextSchema = new Schema<ILogContext>({
  programId: {
    type: String,
    trim: true
  },
  cycleId: {
    type: String,
    trim: true
  },
  blockId: {
    type: String,
    trim: true
  },
  sessionId: {
    type: String,
    trim: true
  },
  deviceId: {
    type: String,
    trim: true
  }
}, { _id: false })

const logEntrySchema = new Schema<ILogEntry>({
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
    index: true
  },
  level: {
    type: String,
    enum: ['debug', 'info', 'warn', 'error', 'analytics'],
    required: [true, 'Log level is required'],
    index: true
  },
  tag: {
    type: String,
    required: [true, 'Tag is required'],
    trim: true,
    maxlength: [100, 'Tag cannot exceed 100 characters'],
    index: true
  },
  module: {
    type: String,
    required: [true, 'Module is required'],
    trim: true,
    maxlength: [100, 'Module cannot exceed 100 characters'],
    index: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: [true, 'Data is required']
  },
  context: {
    type: logContextSchema,
    required: false
  },
  storage: {
    type: String,
    enum: ['memory', 'session', 'persistent'],
    required: [true, 'Storage type is required'],
    index: true
  },
  ttl: {
    type: Date,
    required: false,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Composite indexes for common queries
logEntrySchema.index({ timestamp: -1, level: 1 })
logEntrySchema.index({ module: 1, tag: 1, timestamp: -1 })
logEntrySchema.index({ 'context.programId': 1, timestamp: -1 })
logEntrySchema.index({ storage: 1, timestamp: -1 })

// TTL index for automatic cleanup
logEntrySchema.index({ ttl: 1 }, { expireAfterSeconds: 0 })

// Pre-save middleware to set TTL based on storage type and level
logEntrySchema.pre('save', function(next) {
  if (!this.ttl) {
    const now = new Date()
    
    switch (this.storage) {
      case 'memory':
        // Memory entries don't get saved to DB
        break
      case 'session':
        // Session entries expire after 24 hours
        this.ttl = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'persistent':
        // Persistent entries have different TTL based on level
        switch (this.level) {
          case 'info':
            this.ttl = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
            break
          case 'warn':
            this.ttl = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
            break
          case 'error':
            this.ttl = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
            break
          case 'analytics':
            this.ttl = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
            break
          default:
            this.ttl = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Default 24 hours
        }
        break
    }
  }
  next()
})

// Virtual for formatted timestamp
logEntrySchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString()
})

// Virtual for time ago
logEntrySchema.virtual('timeAgo').get(function() {
  const now = new Date()
  const diff = now.getTime() - this.timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
})

// Static methods for common queries
logEntrySchema.statics.findByLevel = function(level: string, limit: number = 100) {
  return this.find({ level }).sort({ timestamp: -1 }).limit(limit)
}

logEntrySchema.statics.findByModule = function(module: string, limit: number = 100) {
  return this.find({ module }).sort({ timestamp: -1 }).limit(limit)
}

logEntrySchema.statics.findByTag = function(tag: string, limit: number = 100) {
  return this.find({ tag }).sort({ timestamp: -1 }).limit(limit)
}

logEntrySchema.statics.findByTimeRange = function(startTime: Date, endTime: Date) {
  return this.find({
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  }).sort({ timestamp: -1 })
}

logEntrySchema.statics.findByProgram = function(programId: string, limit: number = 100) {
  return this.find({ 'context.programId': programId }).sort({ timestamp: -1 }).limit(limit)
}

logEntrySchema.statics.getAnalytics = function(startTime: Date, endTime: Date) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime, $lte: endTime }
      }
    },
    {
      $group: {
        _id: {
          level: '$level',
          module: '$module'
        },
        count: { $sum: 1 },
        latestTimestamp: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ])
}

export const LogEntry = mongoose.model<ILogEntry, ILogEntryModel>('LogEntry', logEntrySchema)