import mongoose, { Schema, Document } from 'mongoose'

export interface IPhysicalController extends Document {
  name: string
  type: 'Arduino_Uno' | 'ESP32' | 'Arduino_Mega' | 'WeMos_D1_R2' | 'NodeMCU_Amica_V2' | 'Mini_Nano_V3_0' | 'Arduino_Uno_R4_WiFi' | 'Arduino_Nano' | 'FireBeetle_ESP32_E'
  communicationBy: 'serial' | 'wifi' | 'bluetooth' | 'usb' | 'network'
  communicationType: 'raw_serial' | 'http' | 'mqtt' | 'websocket'
  communicationConfig: Record<string, any>
  address?: string  // IP address for network controllers
  status: 'online' | 'offline' | 'error' | 'maintenance'
  description?: string
  isActive: boolean
  capabilities?: string[]
  availablePorts: Array<{ 
    key: string, 
    label: string, 
    type?: 'digital' | 'analog',
    isActive: boolean,
    isOccupied: boolean,
    currentState?: 'HIGH' | 'LOW'  // For digital ports only
  }>
  lastHeartbeat?: Date
  // Health monitoring fields
  priority: 'critical' | 'high' | 'normal' | 'low'
  healthCheckEnabled: boolean
  lastHealthCheck?: Date
  consecutiveFailures: number
  healthStatus?: 'healthy' | 'warning' | 'error' | 'unknown'
  lastResponseTime?: number
  // Health Check Enhancement fields (Phase 2.1)
  connectionType?: 'network' | 'serial'  // For health check routing logic
  // UDP Discovery fields (Phase 1)
  discoveryMethod?: 'http' | 'udp' | 'hybrid' | 'serial' | 'manual'
  macAddress?: string
  lastDiscoveryMethod?: 'http' | 'udp'
  udpResponseTime?: number
  httpResponseTime?: number
  firmwareVersion?: string
  lastSeen?: Date
  createdAt: Date
  updatedAt: Date
}

const PhysicalControllerSchema = new Schema<IPhysicalController>({
  name: {
    type: String,
    required: [true, 'Controller name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Controller name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Controller type is required'],
    enum: ['Arduino_Uno', 'ESP32', 'Arduino_Mega', 'WeMos_D1_R2', 'NodeMCU_Amica_V2', 'Mini_Nano_V3_0', 'Arduino_Uno_R4_WiFi', 'Arduino_Nano', 'FireBeetle_ESP32_E']
  },
  communicationBy: {
    type: String,
    required: [true, 'Communication method is required'],
    enum: ['serial', 'wifi', 'bluetooth', 'usb', 'network']
  },
  communicationType: {
    type: String,
    required: [true, 'Communication type is required'],
    enum: ['raw_serial', 'http', 'mqtt', 'websocket']
  },
  communicationConfig: {
    type: Schema.Types.Mixed,
    required: [true, 'Communication configuration is required'],
    default: {}
  },
  address: {
    type: String,
    trim: true,
    required: false
  },
  status: {
    type: String,
    required: [true, 'Controller status is required'],
    enum: ['online', 'offline', 'error', 'maintenance'],
    default: 'offline'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  capabilities: {
    type: [String],
    default: [],
    required: false
  },
  availablePorts: {
    type: [{
      key: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, enum: ['digital', 'analog'], default: 'digital' },
      isActive: { type: Boolean, default: true },
      isOccupied: { type: Boolean, default: false },
      currentState: { 
        type: Schema.Types.Mixed,  // Позволява null и string стойности
        validate: {
          validator: function(value: any) {
            // null/undefined са валидни (за analog портове)
            if (value === null || value === undefined) {
              return true
            }
            // string стойности трябва да са 'HIGH' или 'LOW' (за digital портове)
            return typeof value === 'string' && ['HIGH', 'LOW'].includes(value)
          },
          message: 'currentState must be HIGH, LOW, or null'
        },
        required: false
      }
    }],
    default: []
  },
  lastHeartbeat: {
    type: Date,
    default: null
  },
  // Health monitoring schema fields
  priority: {
    type: String,
    enum: ['critical', 'high', 'normal', 'low'],
    default: 'normal'
  },
  healthCheckEnabled: {
    type: Boolean,
    default: true
  },
  lastHealthCheck: {
    type: Date,
    default: null
  },
  consecutiveFailures: {
    type: Number,
    default: 0,
    min: 0
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'warning', 'error', 'unknown'],
    default: 'unknown'
  },
  lastResponseTime: {
    type: Number,
    default: null,
    min: 0
  },
  // Health Check Enhancement schema fields (Phase 2.1)
  connectionType: {
    type: String,
    enum: ['network', 'serial'],
    default: undefined,
    required: false
  },
  // UDP Discovery schema fields (Phase 1)
  discoveryMethod: {
    type: String,
    enum: ['http', 'udp', 'hybrid', 'serial', 'manual'],
    default: 'hybrid'
  },
  macAddress: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  lastDiscoveryMethod: {
    type: String,
    enum: ['http', 'udp'],
    default: undefined
  },
  udpResponseTime: {
    type: Number,
    default: null,
    min: 0
  },
  httpResponseTime: {
    type: Number,
    default: null,
    min: 0
  },
  firmwareVersion: {
    type: String,
    default: 'unknown',
    trim: true
  },
  lastSeen: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

PhysicalControllerSchema.index({ status: 1 })
PhysicalControllerSchema.index({ isActive: 1 })
PhysicalControllerSchema.index({ type: 1, communicationBy: 1 })
// Health monitoring indexes
PhysicalControllerSchema.index({ healthCheckEnabled: 1, isActive: 1 })
PhysicalControllerSchema.index({ priority: 1, healthStatus: 1 })
PhysicalControllerSchema.index({ lastHealthCheck: 1 })
// Health Check Enhancement indexes (Phase 2.1)
PhysicalControllerSchema.index({ connectionType: 1, isActive: 1 })
// UDP Discovery indexes
PhysicalControllerSchema.index({ macAddress: 1 })
PhysicalControllerSchema.index({ discoveryMethod: 1 })
PhysicalControllerSchema.index({ lastSeen: 1 })

// Migration helper methods for Phase 2.1
PhysicalControllerSchema.statics.migrateConnectionType = async function() {
  // Automatic migration logic: populate connectionType based on communicationType
  const controllers = await this.find({ connectionType: null }).exec()
  
  for (const controller of controllers) {
    let connectionType: 'network' | 'serial'
    
    // Migration logic based on existing fields
    if (controller.communicationType === 'raw_serial') {
      connectionType = 'serial'
    } else if (controller.communicationType === 'http' || controller.communicationType === 'mqtt' || controller.communicationType === 'websocket') {
      connectionType = 'network'  
    } else {
      // Fallback: use communicationBy field
      connectionType = (controller.communicationBy === 'serial' || controller.communicationBy === 'usb') ? 'serial' : 'network'
    }
    
    await this.findByIdAndUpdate(controller._id, { connectionType })
  }
  
  console.log(`✅ connectionType migration completed for ${controllers.length} controllers`)
}

// MAC address collection from UDP discovery
PhysicalControllerSchema.statics.collectMacAddresses = async function(udpDiscoveryService: any) {
  // Strategy for collecting MAC addresses via UDP discovery
  const networkControllers = await this.find({ 
    connectionType: 'network', 
    macAddress: null,
    address: { $exists: true, $ne: null }
  }).exec()
  
  console.log(`🔍 Attempting MAC address collection for ${networkControllers.length} network controllers`)
  
  for (const controller of networkControllers) {
    try {
      // Use UDP discovery to get MAC address
      const discoveryResult = await udpDiscoveryService.checkSingleController(controller.address)
      
      if (discoveryResult && discoveryResult.mac && discoveryResult.mac !== 'unknown') {
        await this.findByIdAndUpdate(controller._id, {
          macAddress: discoveryResult.mac,
          lastDiscoveryMethod: 'udp',
          lastSeen: new Date()
        })
        console.log(`✅ MAC address collected for ${controller.name}: ${discoveryResult.mac}`)
      }
    } catch (error) {
      console.warn(`⚠️  Failed to collect MAC for ${controller.name}: ${error}`)
    }
  }
}

export const PhysicalController = mongoose.model<IPhysicalController>('PhysicalController', PhysicalControllerSchema)