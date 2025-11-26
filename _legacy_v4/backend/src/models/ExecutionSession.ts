import mongoose, { Schema, Document } from 'mongoose'

// Block interface
export interface IExecutionBlock {
  blockId: string          // Block execution ID
  blockName: string        // Име на блока
  blockType: string        // sensor, actuator, if, loop
  blockStartTime: Date     // Стартиране на блока
  blockEndTime?: Date      // Завършване на блока
  blockStatus: 'running' | 'completed' | 'failed'
  inputData?: any          // Input data for the block
  outputData?: any         // Output data from the block
  duration?: number        // Duration in milliseconds
}

// Flow interface
export interface IExecutionFlow {
  flowId: string             // Flow execution ID
  flowName: string           // Име на потока/action template
  flowStartTime: Date        // Стартиране на потока
  flowEndTime?: Date         // Завършване на потока
  flowStatus: 'running' | 'completed' | 'failed'

  // === БЛОКОВЕ в потока (Array) ===
  blocks: IExecutionBlock[]
}

// Cycle interface
export interface IExecutionCycle {
  cycleId: string              // cycle-0, cycle-1, cycle-2...
  cycleName: string            // Име на цикъла
  cycleStartTime: Date         // Стартиране на цикъла
  cycleEndTime?: Date          // Завършване на цикъла
  cycleStatus: 'running' | 'completed' | 'failed'

  // === ПОТОЦИ в цикъла (Array) ===
  flows: IExecutionFlow[]
}

// Main ExecutionSession interface
export interface IExecutionSession extends Document {
  // === ПРОГРАМА ===
  programId: string              // Program DB ID
  programName: string            // Име на програмата
  programStartTime: Date         // Стартиране на програмата
  programEndTime?: Date          // Завършване на програмата
  programStatus: 'running' | 'completed' | 'failed' | 'paused'

  // === ЦИКЛИ (Array) ===
  cycles: IExecutionCycle[]

  // === OPTIONAL METADATA ===
  metadata?: {
    cycleId?: string
    actionTemplateId?: string
    actionIndex?: number
    errorMessage?: string
    [key: string]: any
  }

  // === TIMESTAMPS ===
  createdAt: Date
  updatedAt: Date
}

// Block schema
const ExecutionBlockSchema = new Schema<IExecutionBlock>({
  blockId: {
    type: String,
    required: [true, 'Block ID is required']
  },
  blockName: {
    type: String,
    required: [true, 'Block name is required']
  },
  blockType: {
    type: String,
    required: [true, 'Block type is required']
  },
  blockStartTime: {
    type: Date,
    required: [true, 'Block start time is required']
  },
  blockEndTime: {
    type: Date
  },
  blockStatus: {
    type: String,
    required: [true, 'Block status is required'],
    enum: ['running', 'completed', 'failed'],
    default: 'running'
  },
  inputData: {
    type: Schema.Types.Mixed
  },
  outputData: {
    type: Schema.Types.Mixed
  },
  duration: {
    type: Number
  }
}, { _id: false })

// Flow schema
const ExecutionFlowSchema = new Schema<IExecutionFlow>({
  flowId: {
    type: String,
    required: [true, 'Flow ID is required']
  },
  flowName: {
    type: String,
    required: [true, 'Flow name is required']
  },
  flowStartTime: {
    type: Date,
    required: [true, 'Flow start time is required']
  },
  flowEndTime: {
    type: Date
  },
  flowStatus: {
    type: String,
    required: [true, 'Flow status is required'],
    enum: ['running', 'completed', 'failed'],
    default: 'running'
  },
  blocks: [ExecutionBlockSchema]
}, { _id: false })

// Cycle schema
const ExecutionCycleSchema = new Schema<IExecutionCycle>({
  cycleId: {
    type: String,
    required: [true, 'Cycle ID is required']
  },
  cycleName: {
    type: String,
    required: [true, 'Cycle name is required']
  },
  cycleStartTime: {
    type: Date,
    required: [true, 'Cycle start time is required']
  },
  cycleEndTime: {
    type: Date
  },
  cycleStatus: {
    type: String,
    required: [true, 'Cycle status is required'],
    enum: ['running', 'completed', 'failed'],
    default: 'running'
  },
  flows: [ExecutionFlowSchema]
}, { _id: false })

// Main ExecutionSession schema
const ExecutionSessionSchema = new Schema<IExecutionSession>({
  programId: {
    type: String,
    required: [true, 'Program ID is required'],
    index: true
  },
  programName: {
    type: String,
    required: [true, 'Program name is required']
  },
  programStartTime: {
    type: Date,
    required: [true, 'Program start time is required'],
    index: true
  },
  programEndTime: {
    type: Date
  },
  programStatus: {
    type: String,
    required: [true, 'Program status is required'],
    enum: ['running', 'completed', 'failed', 'paused'],
    default: 'running',
    index: true
  },
  cycles: [ExecutionCycleSchema],
  metadata: {
    type: {
      cycleId: { type: String },
      actionTemplateId: { type: String },
      actionIndex: { type: Number },
      errorMessage: { type: String }
    },
    required: false
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
ExecutionSessionSchema.index({ programStatus: 1, programStartTime: -1 })
ExecutionSessionSchema.index({ programId: 1, programStartTime: -1 })

export const ExecutionSession = mongoose.model<IExecutionSession>('ExecutionSession', ExecutionSessionSchema)