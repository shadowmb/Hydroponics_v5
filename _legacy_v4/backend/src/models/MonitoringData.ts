import mongoose, { Schema, Document } from 'mongoose'

export interface IMonitoringData extends Document {
  tagId: mongoose.Types.ObjectId
  value: number
  timestamp: Date
  flowId: string
  blockId: string
  programId?: mongoose.Types.ObjectId
  cycleId?: string
  createdAt: Date
}

const MonitoringDataSchema = new Schema<IMonitoringData>({
  tagId: {
    type: Schema.Types.ObjectId,
    ref: 'MonitoringTag',
    required: [true, 'Tag ID is required']
  },
  value: {
    type: Number,
    required: [true, 'Value is required']
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  flowId: {
    type: String,
    required: [true, 'Flow ID is required'],
    trim: true,
    maxlength: [100, 'Flow ID cannot exceed 100 characters']
  },
  blockId: {
    type: String,
    required: [true, 'Block ID is required'],
    trim: true,
    maxlength: [100, 'Block ID cannot exceed 100 characters']
  },
  programId: {
    type: Schema.Types.ObjectId,
    ref: 'Program',
    required: false
  },
  cycleId: {
    type: String,
    trim: true,
    maxlength: [50, 'Cycle ID cannot exceed 50 characters'],
    required: false
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Indexes for efficient queries
MonitoringDataSchema.index({ tagId: 1, timestamp: -1 })
MonitoringDataSchema.index({ timestamp: -1 })
MonitoringDataSchema.index({ flowId: 1, blockId: 1 })
MonitoringDataSchema.index({ programId: 1, cycleId: 1 })
MonitoringDataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL

export const MonitoringData = mongoose.model<IMonitoringData>('MonitoringData', MonitoringDataSchema)