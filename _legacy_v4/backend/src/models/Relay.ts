import mongoose, { Schema, Document } from 'mongoose'

// Relay port interface
export interface IRelayPort {
  portNumber: number // 1, 2, 3, 4, etc.
  controlPin: string // D2, D3, D4, etc.
  isOccupied: boolean
  occupiedBy?: string // Device ID if connected
  label?: string // Optional custom label
}

// Main Relay interface  
export interface IRelay extends Document {
  name: string
  sequenceNumber: number // Р1, Р2, Р3... for display
  controllerId: mongoose.Types.ObjectId // Reference to Controller
  relayType: '1-port' | '2-port' | '4-port' | '6-port' | '8-port'
  manufacturer?: string
  modelNumber?: string // Renamed to avoid conflict with Document.model
  description?: string
  
  // Port configuration
  ports: IRelayPort[]
  
  // Technical specs
  maxVoltage?: number // 5V, 12V, 24V, etc.
  maxCurrent?: number // Max current per port in amps
  activationType: 'active_high' | 'active_low' // Signal logic
  
  // Status
  isActive: boolean
  
  // Metadata
  createdAt?: Date
  updatedAt?: Date
  
  // Instance methods
  getAvailablePorts(): IRelayPort[]
  occupyPort(portNumber: number, deviceId: string): boolean
  releasePort(portNumber: number): boolean
}

// Relay port schema
const RelayPortSchema = new Schema<IRelayPort>({
  portNumber: {
    type: Number,
    required: true,
    min: 1
  },
  controlPin: {
    type: String,
    required: false,
    trim: true
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  occupiedBy: {
    type: String,
    trim: true
  },
  label: {
    type: String,
    trim: true
  }
})

// Main Relay schema
const RelaySchema = new Schema<IRelay>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sequenceNumber: {
    type: Number,
    unique: true
  },
  controllerId: {
    type: Schema.Types.ObjectId,
    ref: 'PhysicalController',
    required: [true, 'Controller ID is required']
  },
  relayType: {
    type: String,
    required: true,
    enum: ['1-port', '2-port', '4-port', '6-port', '8-port']
  },
  manufacturer: {
    type: String,
    trim: true
  },
  modelNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ports: {
    type: [RelayPortSchema],
    required: true,
    validate: {
      validator: function(this: IRelay, ports: IRelayPort[]) {
        // Skip validation if relayType is not available (during updates)
        if (!this.relayType || typeof this.relayType !== 'string') {
          return true
        }
        
        // Validate port count matches relay type
        const expectedPorts = parseInt(this.relayType.split('-')[0])
        return ports.length === expectedPorts
      },
      message: 'Number of ports must match relay type'
    }
  },
  maxVoltage: {
    type: Number,
    min: 0
  },
  maxCurrent: {
    type: Number,
    min: 0
  },
  activationType: {
    type: String,
    required: true,
    enum: ['active_high', 'active_low'],
    default: 'active_high'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'relays'
})

// Indexes for performance
RelaySchema.index({ controllerId: 1 })
RelaySchema.index({ name: 1 })
RelaySchema.index({ isActive: 1 })
RelaySchema.index({ sequenceNumber: 1 })

// Pre-save middleware to auto-generate ports and sequence number
RelaySchema.pre('save', async function(next) {
  // Auto-generate sequence number for new relays
  if (this.isNew && !this.sequenceNumber) {
    try {
      // Get all existing sequence numbers
      const existingRelays = await (this.constructor as any).find({}, 'sequenceNumber').sort({ sequenceNumber: 1 })
      const usedNumbers = existingRelays.map((r: any) => r.sequenceNumber).filter((n: number) => n != null)
      
      // Find first available number (fill gaps)
      let nextNumber = 1
      for (const num of usedNumbers) {
        if (num === nextNumber) {
          nextNumber++
        } else {
          break
        }
      }
      
      this.sequenceNumber = nextNumber
    } catch (error) {
      return next(error as Error)
    }
  }
  
  // Auto-generate ports for new relays
  if (this.isNew && this.ports.length === 0) {
    const portCount = parseInt(this.relayType.split('-')[0])
    this.ports = []
    
    for (let i = 1; i <= portCount; i++) {
      this.ports.push({
        portNumber: i,
        controlPin: `D${i + 1}`, // Default pins D2, D3, D4, etc.
        isOccupied: false,
        label: `Port ${i}`
      })
    }
  }
  next()
})

// Instance methods
RelaySchema.methods.getAvailablePorts = function(): IRelayPort[] {
  return this.ports.filter((port: IRelayPort) => !port.isOccupied)
}

RelaySchema.methods.occupyPort = function(portNumber: number, deviceId: string): boolean {
  const port = this.ports.find((p: IRelayPort) => p.portNumber === portNumber)
  if (port && !port.isOccupied) {
    port.isOccupied = true
    port.occupiedBy = deviceId
    return true
  }
  return false
}

RelaySchema.methods.releasePort = function(portNumber: number): boolean {
  const port = this.ports.find((p: IRelayPort) => p.portNumber === portNumber)
  if (port && port.isOccupied) {
    port.isOccupied = false
    port.occupiedBy = undefined
    return true
  }
  return false
}

// Static methods
RelaySchema.statics.findByController = function(controllerId: string) {
  return this.find({ controllerId, isActive: true })
}

export const Relay = mongoose.model<IRelay>('Relay', RelaySchema)