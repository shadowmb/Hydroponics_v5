import mongoose, { Schema, Document } from 'mongoose'

// Usage tracking interface for individual block usage
export interface ITargetUsage {
  blockId: string
  blockType: 'actuator' | 'if' | 'loop' | 'custom'
  fieldName: string
  lastUsed: Date
  flowId?: string
  flowName?: string
}

export interface ITargetRegistryItem extends Document {
  visualName: string
  targetKey: string
  description?: string
  type: 'control' | 'device'
  deviceId?: mongoose.Types.ObjectId
  deviceName?: string
  deviceType?: string
  isActive: boolean
  
  // Usage tracking fields
  usageCount: number
  usedInBlocks: ITargetUsage[]
  firstUsed?: Date
  lastUsed?: Date
  
  createdAt: Date
  updatedAt: Date
  
  // Instance methods
  addUsage(usage: Omit<ITargetUsage, 'lastUsed'>): Promise<this>
  removeUsage(blockId: string, fieldName: string): Promise<this>
}

// Static methods interface
export interface ITargetRegistryItemModel extends mongoose.Model<ITargetRegistryItem> {
  findByBlockUsage(blockId: string): Promise<ITargetRegistryItem[]>
}

// Usage tracking sub-schema
const TargetUsageSchema = new Schema<ITargetUsage>({
  blockId: {
    type: String,
    required: true,
    trim: true
  },
  blockType: {
    type: String,
    required: true,
    enum: ['actuator', 'if', 'loop', 'custom']
  },
  fieldName: {
    type: String,
    required: true,
    trim: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  flowId: {
    type: String,
    trim: true,
    default: null
  },
  flowName: {
    type: String,
    trim: true,
    default: null
  }
}, { _id: false }) // No separate _id for sub-documents

const TargetRegistryItemSchema = new Schema<ITargetRegistryItem>({
  visualName: {
    type: String,
    required: [true, 'Visual name is required'],
    trim: true,
    maxlength: [100, 'Visual name cannot exceed 100 characters']
  },
  targetKey: {
    type: String,
    required: [true, 'Target key is required'],
    trim: true,
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^target\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
      },
      message: 'Target key must start with "target." and contain only alphanumeric characters and underscores'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['control', 'device']
  },
  deviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Device',
    default: null
  },
  deviceName: {
    type: String,
    trim: true,
    default: null
  },
  deviceType: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false  // Changed: false by default, becomes true when used
  },
  
  // Usage tracking fields
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  usedInBlocks: [TargetUsageSchema],
  firstUsed: {
    type: Date,
    default: null
  },
  lastUsed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

// Indexes for performance
TargetRegistryItemSchema.index({ targetKey: 1 }, { unique: true })
TargetRegistryItemSchema.index({ type: 1, isActive: 1 })
TargetRegistryItemSchema.index({ usageCount: -1 }) // For sorting by most used
TargetRegistryItemSchema.index({ lastUsed: -1 }) // For sorting by recently used
TargetRegistryItemSchema.index({ 'usedInBlocks.blockId': 1 }) // For finding by block usage

// Instance methods for usage tracking
TargetRegistryItemSchema.methods.addUsage = function(usage: Omit<ITargetUsage, 'lastUsed'>) {
  const existingIndex = this.usedInBlocks.findIndex(
    (u: ITargetUsage) => u.blockId === usage.blockId && u.fieldName === usage.fieldName
  )
  
  const now = new Date()
  
  if (existingIndex >= 0) {
    // Update existing usage
    this.usedInBlocks[existingIndex].lastUsed = now
    this.usedInBlocks[existingIndex].blockType = usage.blockType
    this.usedInBlocks[existingIndex].flowId = usage.flowId || this.usedInBlocks[existingIndex].flowId
    this.usedInBlocks[existingIndex].flowName = usage.flowName || this.usedInBlocks[existingIndex].flowName
  } else {
    // Add new usage
    this.usedInBlocks.push({
      ...usage,
      lastUsed: now
    })
    this.usageCount += 1
  }
  
  // Update general usage timestamps
  if (!this.firstUsed) {
    this.firstUsed = now
  }
  this.lastUsed = now
  this.isActive = true // Auto-activate when used
  
  return this.save()
}

TargetRegistryItemSchema.methods.removeUsage = function(blockId: string, fieldName: string) {
  const initialLength = this.usedInBlocks.length
  this.usedInBlocks = this.usedInBlocks.filter(
    (u: ITargetUsage) => !(u.blockId === blockId && u.fieldName === fieldName)
  )
  
  const removedCount = initialLength - this.usedInBlocks.length
  this.usageCount = Math.max(0, this.usageCount - removedCount)
  
  // Update isActive status
  this.isActive = this.usedInBlocks.length > 0
  
  // Update lastUsed if there are still usages
  if (this.usedInBlocks.length > 0) {
    const latestUsage = this.usedInBlocks.reduce((latest: ITargetUsage, current: ITargetUsage) => 
      current.lastUsed > latest.lastUsed ? current : latest
    )
    this.lastUsed = latestUsage.lastUsed
  } else {
    this.lastUsed = null
  }
  
  return this.save()
}

// Static method for finding targets by block usage
TargetRegistryItemSchema.statics.findByBlockUsage = function(blockId: string) {
  return this.find({ 'usedInBlocks.blockId': blockId })
}

export const TargetRegistryItem = mongoose.model<ITargetRegistryItem, ITargetRegistryItemModel>('TargetRegistryItem', TargetRegistryItemSchema)