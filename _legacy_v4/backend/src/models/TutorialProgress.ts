// ABOUTME: TutorialProgress model for tracking user tutorial progress and completion
// ABOUTME: Manages tutorial state, current step, completed steps, and session tracking

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITutorialProgress extends Document {
  tutorialId: string
  status: 'in_progress'
  currentStep: string
  completedSteps: string[]
  startedAt?: Date
  totalAttempts: number
  sessionData?: Record<string, any>
  notes?: string
  createdAt: Date
  updatedAt: Date

  // Instance methods
  markStepCompleted(stepId: string): Promise<ITutorialProgress>
  setCurrentStep(stepId: string): Promise<ITutorialProgress>
  reset(): Promise<ITutorialProgress>
}

const TutorialProgressSchema = new Schema<ITutorialProgress>({
  tutorialId: {
    type: String,
    required: [true, 'Tutorial ID is required'],
    trim: true,
    maxlength: [100, 'Tutorial ID cannot exceed 100 characters']
  },
  status: {
    type: String,
    required: [true, 'Progress status is required'],
    enum: ['in_progress'],
    default: 'in_progress'
  },
  currentStep: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  completedSteps: {
    type: [String],
    default: [],
    validate: {
      validator: function(steps: string[]) {
        return steps.length <= 100  // Reasonable limit for steps
      },
      message: 'Cannot have more than 100 completed steps'
    }
  },
  startedAt: {
    type: Date,
    default: null
  },
  totalAttempts: {
    type: Number,
    default: 1,
    min: [1, 'Total attempts must be at least 1'],
    max: [50, 'Total attempts cannot exceed 50']
  },
  sessionData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  }
}, {
  timestamps: true
})

// Indexes for efficient querying
TutorialProgressSchema.index({ tutorialId: 1 }, { unique: true })
TutorialProgressSchema.index({ status: 1 })
TutorialProgressSchema.index({ createdAt: -1 })

// Pre-save middleware for validation and business logic
TutorialProgressSchema.pre('save', function(next) {
  // Set startedAt when status changes to in_progress for the first time
  if (this.isModified('status') && this.status === 'in_progress' && !this.startedAt) {
    this.startedAt = new Date()
  }

  // Validate completedSteps don't contain duplicates
  const uniqueSteps = new Set(this.completedSteps)
  if (this.completedSteps.length !== uniqueSteps.size) {
    return next(new Error('Completed steps cannot contain duplicates'))
  }

  next()
})

// Instance methods
TutorialProgressSchema.methods.markStepCompleted = function(stepId: string) {
  if (!this.completedSteps.includes(stepId)) {
    this.completedSteps.push(stepId)
  }
  return this.save()
}

TutorialProgressSchema.methods.setCurrentStep = function(stepId: string) {
  this.currentStep = stepId
  return this.save()
}


TutorialProgressSchema.methods.reset = function() {
  this.status = 'in_progress'
  this.currentStep = ''
  this.completedSteps = []
  this.startedAt = undefined
  this.totalAttempts += 1
  this.sessionData = {}
  return this.save()
}

export interface ITutorialProgressModel extends Model<ITutorialProgress> {
  findByTutorial(tutorialId: string): Promise<ITutorialProgress | null>
  createProgress(tutorialId: string): Promise<ITutorialProgress>
}

// Static methods
TutorialProgressSchema.statics.findByTutorial = function(tutorialId: string) {
  return this.findOne({ tutorialId })
}

TutorialProgressSchema.statics.createProgress = function(tutorialId: string) {
  return this.create({
    tutorialId,
    status: 'in_progress',
    currentStep: '',
    completedSteps: [],
    totalAttempts: 1
  })
}

export const TutorialProgress = mongoose.model<ITutorialProgress, ITutorialProgressModel>('TutorialProgress', TutorialProgressSchema)