import mongoose, { Schema, Document } from 'mongoose'

export interface IActionParameter {
  name: string
  displayName: string
  value: number | string
  showInPreview: boolean
}

// Target mapping interface for executor fields  
export interface ITargetMapping {
  blockId: string
  fieldName: string
  targetKey: string
  comment?: string
  configuredAt: Date
  configuredBy?: string
}

export interface IActionTemplate extends Document {
  name: string
  description?: string
  icon: string
  
  // Legacy flow file reference (for backward compatibility)
  flowFile?: string
  
  // New flow versioning fields
  linkedFlowId?: string        // Base flow ID (e.g., "flow_mixing_process")
  linkedFlowVersion?: string   // Locked version (e.g., "1.2.3") 
  linkedFlowVersionId?: string // Full reference (e.g., "flow_mixing_process_v1_2_3")
  
  // Target configuration
  targetMappings: ITargetMapping[]
  
  // Template status
  syncStatus: 'synced' | 'outdated' | 'broken' | 'unknown'
  lastSyncCheck?: Date
  
  // Flow validation status (Phase 4)
  flowValidationStatus?: 'draft' | 'invalid' | 'validated' | 'ready'
  lastFlowCheck?: Date
  
  // Parameter overrides for FlowExecutor
  parameterOverrides?: Record<string, Record<string, any>>
  
  // Global variables for FlowExecutor
  globalVariables?: Record<string, any>
  
  // Global variables metadata (display names, comments, units, etc.)
  globalVariablesMetadata?: any[]
  
  // Program usage tracking
  usedInPrograms: Array<{
    programId: string
    programName: string
    dateAdded: Date
  }>
  
  // Flow usage tracking for cross-reference integrity
  usedFlowIds: string[]
  
  parameters: IActionParameter[]
  runStatus: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ActionParameterSchema = new Schema<IActionParameter>({
  name: {
    type: String,
    required: [true, 'Parameter name is required'],
    trim: true
  },
  displayName: {
    type: String,
    required: [true, 'Parameter display name is required'],
    trim: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, 'Parameter value is required']
  },
  showInPreview: {
    type: Boolean,
    default: false
  }
}, { _id: false })

// Target mapping sub-schema following TargetRegistry patterns
const TargetMappingSchema = new Schema<ITargetMapping>({
  blockId: {
    type: String,
    required: [true, 'Block ID is required'],
    trim: true
  },
  fieldName: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true
  },
  targetKey: {
    type: String,
    required: [true, 'Target key is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^target\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)
      },
      message: 'Target key must start with "target." and contain valid characters'
    }
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [200, 'Comment cannot exceed 200 characters']
  },
  configuredAt: {
    type: Date,
    default: Date.now
  },
  configuredBy: {
    type: String,
    trim: true
  }
}, { _id: false })

const ActionTemplateSchema = new Schema<IActionTemplate>({
  name: {
    type: String,
    required: [true, 'Action template name is required'],
    trim: true,
    minlength: [4, 'Action template name must be at least 4 characters'],
    maxlength: [20, 'Action template name cannot exceed 20 characters'],
    unique: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    trim: true
  },
  icon: {
    type: String,
    required: [true, 'Icon is required'],
    default: '🔧'
  },
  // Legacy flow file reference (for backward compatibility)
  flowFile: {
    type: String,
    trim: true
  },
  
  // New flow versioning fields
  linkedFlowId: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^flow_[a-zA-Z0-9_]+$/.test(v)
      },
      message: 'Flow ID must start with "flow_" and contain only alphanumeric characters and underscores'
    }
  },
  linkedFlowVersion: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^\d+\.\d+\.\d+$/.test(v)
      },
      message: 'Version must follow semantic versioning format (x.y.z)'
    }
  },
  linkedFlowVersionId: {
    type: String,
    trim: true
  },
  
  // Target configuration
  targetMappings: {
    type: [TargetMappingSchema],
    default: []
  },
  
  // Template status
  syncStatus: {
    type: String,
    enum: ['synced', 'outdated', 'broken', 'unknown'],
    default: 'unknown'
  },
  lastSyncCheck: {
    type: Date,
    default: null
  },
  
  // Flow validation status (Phase 4)
  flowValidationStatus: {
    type: String,
    enum: ['draft', 'invalid', 'validated', 'ready'],
    default: 'draft'
  },
  lastFlowCheck: {
    type: Date,
    default: null
  },
  
  // Parameter overrides for FlowExecutor
  parameterOverrides: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Global variables for FlowExecutor
  globalVariables: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Global variables metadata
  globalVariablesMetadata: {
    type: Schema.Types.Mixed,
    default: []
  },
  
  // Program usage tracking
  usedInPrograms: {
    type: [{
      programId: {
        type: String,
        required: true
      },
      programName: {
        type: String,
        required: true
      },
      dateAdded: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  
  // Flow usage tracking for cross-reference integrity
  usedFlowIds: {
    type: [String],
    default: []
  },
  
  parameters: {
    type: [ActionParameterSchema],
    default: []
  },
  runStatus: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes for performance - following established patterns
ActionTemplateSchema.index({ name: 1 }, { unique: true })
ActionTemplateSchema.index({ isActive: 1 })
ActionTemplateSchema.index({ linkedFlowId: 1 })
ActionTemplateSchema.index({ linkedFlowVersionId: 1 })
ActionTemplateSchema.index({ syncStatus: 1 })
ActionTemplateSchema.index({ 'targetMappings.targetKey': 1 })
ActionTemplateSchema.index({ 'usedInPrograms.programId': 1 })
ActionTemplateSchema.index({ 'usedFlowIds': 1 })
ActionTemplateSchema.index({ runStatus: 1 })

// Default parameters function
export function getDefaultParameters(): IActionParameter[] {
  return [
    {
      name: 'target_EC',
      displayName: 'ЕС',
      value: 0,
      showInPreview: false
    },
    {
      name: 'target_PH',
      displayName: 'PH',
      value: 0,
      showInPreview: false
    },
    {
      name: 'mix_time',
      displayName: 'Време разбъркване',
      value: 0,
      showInPreview: false
    },
    {
      name: 'watering_time',
      displayName: 'Време за поливане',
      value: 0,
      showInPreview: false
    },
    {
      name: 'tank_level',
      displayName: 'Ниво на главен резервоар',
      value: 0,
      showInPreview: false
    }
  ]
}

export const ActionTemplate = mongoose.model<IActionTemplate>('ActionTemplate', ActionTemplateSchema)