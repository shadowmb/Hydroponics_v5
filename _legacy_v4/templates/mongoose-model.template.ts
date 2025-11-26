import mongoose, { Schema, Document } from 'mongoose'

// Sub-interfaces (if needed)
export interface IExampleSubItem {
  name: string
  value: number
  isActive: boolean
}

// Main interface - always use I-prefix and extend Document
export interface IExample extends Document {
  name: string
  description?: string
  status: 'active' | 'inactive' | 'pending'
  category: string
  tags: string[]
  metadata: Record<string, any>
  subItems: IExampleSubItem[]
  // Optional fields
  parentId?: mongoose.Types.ObjectId
  settings?: {
    autoUpdate: boolean
    priority: number
  }
  // Dates (handled by timestamps)
  createdAt: Date
  updatedAt: Date
}

// Sub-schema (if needed)
const ExampleSubItemSchema = new Schema<IExampleSubItem>({
  name: {
    type: String,
    required: [true, 'Sub-item name is required'],
    trim: true,
    maxlength: [50, 'Sub-item name cannot exceed 50 characters']
  },
  value: {
    type: Number,
    required: [true, 'Sub-item value is required'],
    min: [0, 'Value must be non-negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false }) // Don't create _id for sub-documents if not needed

// Main schema definition
const exampleSchema = new Schema<IExample>({
  name: {
    type: String,
    required: [true, 'Example name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    unique: true,
    index: true // Add index for frequently queried fields
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending'],
      message: 'Status must be either active, inactive, or pending'
    },
    default: 'pending',
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    lowercase: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  },
  subItems: [ExampleSubItemSchema],
  // Optional reference fields
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Example', // Self-reference example
    index: true
  },
  settings: {
    autoUpdate: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, 'Priority must be at least 1'],
      max: [10, 'Priority cannot exceed 10']
    }
  }
}, {
  timestamps: true, // Automatically handle createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields if any
      delete ret.__v
      return ret
    }
  },
  toObject: { virtuals: true }
})

// Virtual properties (computed fields)
exampleSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.status})`
})

exampleSchema.virtual('isActive').get(function() {
  return this.status === 'active'
})

exampleSchema.virtual('activeSubItemsCount').get(function() {
  return this.subItems.filter(item => item.isActive).length
})

// Indexes (add compound indexes for common queries)
exampleSchema.index({ category: 1, status: 1 })
exampleSchema.index({ name: 'text', description: 'text' }) // Text search
exampleSchema.index({ createdAt: -1 }) // Sort by creation date

// Pre-save middleware
exampleSchema.pre('save', function(next) {
  // Custom validation or data transformation before save
  if (this.isNew) {
    console.log(`Creating new example: ${this.name}`)
  }
  
  // Example: Auto-generate category if not provided
  if (!this.category && this.name) {
    this.category = this.name.toLowerCase().split(' ')[0]
  }
  
  next()
})

// Post-save middleware
exampleSchema.post('save', function(doc, next) {
  console.log(`Example saved: ${doc.name} (${doc._id})`)
  next()
})

// Static methods
exampleSchema.statics.findActive = function() {
  return this.find({ status: 'active' })
}

exampleSchema.statics.findByCategory = function(category: string) {
  return this.find({ category: category.toLowerCase() })
}

exampleSchema.statics.findWithSubItems = function() {
  return this.find({ 'subItems.0': { $exists: true } })
}

// Instance methods
exampleSchema.methods.activate = function() {
  this.status = 'active'
  return this.save()
}

exampleSchema.methods.deactivate = function() {
  this.status = 'inactive'
  return this.save()
}

exampleSchema.methods.addSubItem = function(subItem: IExampleSubItem) {
  this.subItems.push(subItem)
  return this.save()
}

// Export the model
export const Example = mongoose.model<IExample>('Example', exampleSchema)

// Helper functions for the service layer
export class ExampleModel {
  /**
   * Create a new example with validation
   */
  static async createExample(data: Partial<IExample>): Promise<IExample> {
    const example = new Example(data)
    return await example.save()
  }

  /**
   * Find examples with pagination
   */
  static async findPaginated(
    filter: any = {}, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ items: IExample[], total: number, page: number, limit: number }> {
    const skip = (page - 1) * limit
    
    const [items, total] = await Promise.all([
      Example.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('parentId', 'name'),
      Example.countDocuments(filter)
    ])

    return { items, total, page, limit }
  }

  /**
   * Update example safely
   */
  static async updateExample(id: string, updates: Partial<IExample>): Promise<IExample | null> {
    return await Example.findByIdAndUpdate(
      id, 
      updates, 
      { 
        new: true, 
        runValidators: true,
        populate: 'parentId'
      }
    )
  }

  /**
   * Safe delete with dependency check
   */
  static async deleteExample(id: string): Promise<boolean> {
    // Check if this example is referenced by others
    const hasChildren = await Example.exists({ parentId: id })
    if (hasChildren) {
      throw new Error('Cannot delete example that has child references')
    }

    const result = await Example.findByIdAndDelete(id)
    return !!result
  }
}

export default Example