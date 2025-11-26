import mongoose, { Schema, Document } from 'mongoose'

/**
 * Flow Versioning System
 * Following established patterns from ActionTemplate and TargetRegistry models
 */

export interface IFlowTemplate extends Document {
  flowId: string              // Base flow identifier (e.g., "flow_mixing_process")
  version: string             // Semantic version (e.g., "1.2.3")  
  versionId: string           // Unique version identifier (flowId + version)
  name: string                // Human-readable name
  description?: string        // Optional description
  jsonFileName: string        // JSON file name (e.g., "flow_mixing_v1_0_0.json")
  filePath: string            // File path relative to project root (e.g., "/frontend/tasks/")
  isDraft: boolean            // Whether this is a draft or published flow
  validationStatus: 'draft' | 'ready' | 'invalid' | 'validated'  // Flow validation status
  validationSummary?: {       // Optional validation summary
    isValid: boolean
    lastValidatedAt: string
    criticalErrors: number
    warnings: number
    canExecute: boolean
  }
  isMonitoringFlow: boolean   // Whether this flow is used for monitoring
  createdBy?: string          // Creator identifier
  isActive: boolean           // Whether this version is active
  createdAt: Date
  updatedAt: Date

  // Instance methods
  generateVersionId(): string
  incrementVersion(type?: 'major' | 'minor' | 'patch'): string
  getFullFilePath(): string   // Get complete file path
}

const FlowTemplateSchema = new Schema<IFlowTemplate>({
  flowId: {
    type: String,
    required: [true, 'Flow ID is required'],
    trim: true,
    match: [/^flow_[a-zA-Z0-9_]+$/, 'Flow ID must start with "flow_" and contain only alphanumeric characters and underscores']
  },
  version: {
    type: String,
    required: [true, 'Version is required'],
    trim: true,
    match: [/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning format (x.y.z)']
  },
  versionId: {
    type: String,
    required: [true, 'Version ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Flow name is required'],
    trim: true,
    minlength: [4, 'Flow name must be at least 4 characters'],
    maxlength: [100, 'Flow name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  jsonFileName: {
    type: String,
    required: [true, 'JSON file name is required'],
    trim: true,
    match: [/^[a-zA-Z0-9_-]+\.json$/, 'JSON file name must be a valid filename ending with .json']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true,
    enum: ['/flow-templates/flows/', '/flow-templates/drafts/', '/flow-templates/temp/']
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  validationStatus: {
    type: String,
    enum: ['draft', 'ready', 'invalid', 'validated'],
    default: 'draft'
  },
  validationSummary: {
    type: Schema.Types.Mixed,
    required: false
  },
  createdBy: {
    type: String,
    trim: true
  },
  isMonitoringFlow: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes for performance - following established patterns
FlowTemplateSchema.index({ flowId: 1, version: -1 })
FlowTemplateSchema.index({ versionId: 1 }, { unique: true })
FlowTemplateSchema.index({ flowId: 1, isActive: 1 })
FlowTemplateSchema.index({ isMonitoringFlow: 1 })
FlowTemplateSchema.index({ createdAt: -1 })

// Instance methods following TargetRegistry patterns
FlowTemplateSchema.methods.generateVersionId = function() {
  this.versionId = `${this.flowId}_v${this.version.replace(/\./g, '_')}`
  return this.versionId
}

FlowTemplateSchema.methods.incrementVersion = function(type: 'major' | 'minor' | 'patch' = 'patch') {
  const [major, minor, patch] = this.version.split('.').map(Number)
  
  switch (type) {
    case 'major':
      this.version = `${major + 1}.0.0`
      break
    case 'minor':
      this.version = `${major}.${minor + 1}.0`
      break
    case 'patch':
      this.version = `${major}.${minor}.${patch + 1}`
      break
  }
  
  this.generateVersionId()
  return this.version
}

FlowTemplateSchema.methods.getFullFilePath = function() {
  return `${this.filePath}${this.jsonFileName}`
}

// Static methods following ActionTemplate patterns  
FlowTemplateSchema.statics.findLatestVersion = function(flowId: string) {
  return this.findOne({ flowId, isActive: true }).sort({ version: -1 })
}

FlowTemplateSchema.statics.findByVersionId = function(versionId: string) {
  return this.findOne({ versionId, isActive: true })
}

FlowTemplateSchema.statics.getAllVersions = function(flowId: string) {
  return this.find({ flowId }).sort({ version: -1 })
}

// Pre-save middleware to auto-generate versionId
FlowTemplateSchema.pre('save', function(next) {
  if (this.isModified('flowId') || this.isModified('version')) {
    this.generateVersionId()
  }
  next()
})

export interface IFlowTemplateModel extends mongoose.Model<IFlowTemplate> {
  findLatestVersion(flowId: string): Promise<IFlowTemplate | null>
  findByVersionId(versionId: string): Promise<IFlowTemplate | null>
  getAllVersions(flowId: string): Promise<IFlowTemplate[]>
}

export const FlowTemplate = mongoose.model<IFlowTemplate, IFlowTemplateModel>('FlowTemplate', FlowTemplateSchema)