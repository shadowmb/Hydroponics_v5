// ABOUTME: Command model for Arduino command file management
// ABOUTME: Stores metadata about available Arduino command implementations for device template execution

import mongoose, { Schema, Document } from 'mongoose'

export interface ICommand extends Document {
  name: string
  displayName: string
  filePath: string
  compatibleControllers: string[]
  description: string
  isActive: boolean
  memoryFootprint: number | null
  createdAt: Date
  updatedAt: Date
}

const CommandSchema = new Schema<ICommand>({
  name: {
    type: String,
    required: [true, 'Command name is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  compatibleControllers: {
    type: [String],
    default: ['arduino_uno'],
    validate: {
      validator: function(controllers: string[]) {
        return controllers.length > 0
      },
      message: 'At least one compatible controller is required'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  memoryFootprint: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  collection: 'commands'
})

// Indexes for performance
CommandSchema.index({ name: 1, isActive: 1 })

export const Command = mongoose.model<ICommand>('Command', CommandSchema)
export default Command
