import mongoose, { Schema, Document } from 'mongoose'

/**
 * @deprecated This model is deprecated. Use ExecutionSession instead.
 * Will be removed in future versions.
 */
export interface IActiveExecution extends Document {
  programId: string
  cycleId: string
  blockId: string
  blockType: 'actuator' | 'sensor'
  action: string
  status: 'in_progress' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  duration?: number
  result?: any
  actionTemplateId: string
  actionIndex: number
  createdAt: Date
}

const ActiveExecutionSchema = new Schema<IActiveExecution>({
  programId: { type: String, required: true, index: true },
  cycleId: { type: String, required: true, index: true },
  blockId: { type: String, required: true },
  blockType: { type: String, required: true, enum: ['actuator', 'sensor'] },
  action: { type: String, required: true },
  status: { type: String, required: true, enum: ['in_progress', 'completed', 'failed'], index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
  result: { type: Schema.Types.Mixed },
  actionTemplateId: { type: String, required: true },
  actionIndex: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 259200 } // Auto-delete after 72 hours
})

// Compound indexes for efficient queries
ActiveExecutionSchema.index({ programId: 1, cycleId: 1 })
ActiveExecutionSchema.index({ status: 1, startTime: -1 })

/**
 * @deprecated This model is deprecated. Use ExecutionSession instead.
 * Will be removed in future versions.
 */
export const ActiveExecution = mongoose.model<IActiveExecution>('ActiveExecution', ActiveExecutionSchema)