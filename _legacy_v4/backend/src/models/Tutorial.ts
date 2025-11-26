// ABOUTME: Tutorial model for tutorial system with schema and validation
// ABOUTME: Defines tutorial structure, steps, prerequisites, and mock data

import mongoose, { Schema, Document } from 'mongoose'

export interface ITutorialStep {
  id: string
  title: string
  description: string
  type: 'action' | 'explanation' | 'validation' | 'interaction'
  targetElement?: string
  targetSelector?: string
  expectedResult?: string
  hints?: string[]
  validationRules?: Record<string, any>
  isOptional?: boolean
  estimatedMinutes?: number
  // Interactive tutorial fields
  action?: 'click' | 'hover' | 'input' | 'navigate' | 'wait'
  actionData?: {
    suggestedValue?: string
    info?: string
  }
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  nextButtonText?: string
  prevButtonText?: string
  skipable?: boolean
  validationFn?: string
}

export interface ITutorial extends Document {
  id: string
  title: string
  description: string
  category: 'basics' | 'advanced' | 'troubleshooting' | 'maintenance'
  prerequisites: string[]
  estimatedMinutes: number
  isActive: boolean
  isCompleted: boolean
  steps: ITutorialStep[]
  mockData: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const TutorialStepSchema = new Schema<ITutorialStep>({
  id: {
    type: String,
    required: [true, 'Step ID is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Step title is required'],
    trim: true,
    maxlength: [200, 'Step title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Step description is required'],
    trim: true,
    maxlength: [1000, 'Step description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Step type is required'],
    enum: ['action', 'explanation', 'validation', 'interaction']
  },
  targetElement: {
    type: String,
    trim: true,
    maxlength: [100, 'Target element cannot exceed 100 characters']
  },
  targetSelector: {
    type: String,
    trim: true,
    maxlength: [100, 'Target selector cannot exceed 100 characters']
  },
  expectedResult: {
    type: String,
    trim: true,
    maxlength: [500, 'Expected result cannot exceed 500 characters']
  },
  hints: {
    type: [String],
    default: [],
    validate: {
      validator: function(hints: string[]) {
        return hints.length <= 5
      },
      message: 'Cannot have more than 5 hints per step'
    }
  },
  validationRules: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  estimatedMinutes: {
    type: Number,
    min: [1, 'Estimated minutes must be at least 1'],
    max: [60, 'Estimated minutes cannot exceed 60 per step']
  },
  // Interactive tutorial fields
  action: {
    type: String,
    enum: ['click', 'hover', 'input', 'navigate', 'wait']
  },
  actionData: {
    type: Schema.Types.Mixed,
    default: undefined
  },
  position: {
    type: String,
    enum: ['top', 'bottom', 'left', 'right', 'center']
  },
  nextButtonText: {
    type: String,
    trim: true,
    maxlength: [50, 'Next button text cannot exceed 50 characters']
  },
  prevButtonText: {
    type: String,
    trim: true,
    maxlength: [50, 'Previous button text cannot exceed 50 characters']
  },
  skipable: {
    type: Boolean,
    default: false
  },
  validationFn: {
    type: String,
    trim: true
  }
}, { _id: false })

const TutorialSchema = new Schema<ITutorial>({
  id: {
    type: String,
    required: [true, 'Tutorial ID is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Tutorial ID cannot exceed 100 characters']
  },
  title: {
    type: String,
    required: [true, 'Tutorial title is required'],
    trim: true,
    maxlength: [200, 'Tutorial title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Tutorial description is required'],
    trim: true,
    maxlength: [1000, 'Tutorial description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Tutorial category is required'],
    enum: ['basics', 'advanced', 'troubleshooting', 'maintenance']
  },
  prerequisites: {
    type: [String],
    default: [],
    validate: {
      validator: function(prerequisites: string[]) {
        return prerequisites.length <= 10
      },
      message: 'Cannot have more than 10 prerequisites'
    }
  },
  estimatedMinutes: {
    type: Number,
    required: [true, 'Estimated minutes is required'],
    min: [1, 'Estimated minutes must be at least 1'],
    max: [120, 'Estimated minutes cannot exceed 120']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  steps: {
    type: [TutorialStepSchema],
    required: [true, 'Tutorial steps are required'],
    validate: {
      validator: function(steps: ITutorialStep[]) {
        return steps.length >= 1 && steps.length <= 50
      },
      message: 'Tutorial must have between 1 and 50 steps'
    }
  },
  mockData: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes for efficient querying
TutorialSchema.index({ id: 1 })
TutorialSchema.index({ category: 1 })
TutorialSchema.index({ isActive: 1 })
TutorialSchema.index({ estimatedMinutes: 1 })

// Validate step IDs are unique within tutorial
TutorialSchema.pre('save', function(next) {
  const stepIds = this.steps.map(step => step.id)
  const uniqueStepIds = new Set(stepIds)

  if (stepIds.length !== uniqueStepIds.size) {
    return next(new Error('Step IDs must be unique within a tutorial'))
  }

  next()
})

export const Tutorial = mongoose.model<ITutorial>('Tutorial', TutorialSchema)