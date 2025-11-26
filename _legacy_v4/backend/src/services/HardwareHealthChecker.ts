/**
 * Hardware Health Checker Service
 * 
 * Централизиран сервис за проверка на здравословното състояние на хардуера
 * Интегрира се с SchedulerService, FlowExecutor и StartupService
 */

import { UnifiedLoggingService } from './UnifiedLoggingService'
import { UdpDiscoveryService } from './UdpDiscoveryService'
import { PhysicalController, IPhysicalController } from '../models/PhysicalController'
import { Device, IDevice } from '../models/Device'
import { HealthConfig } from '../models/HealthConfig'
import { SensorHealthValidator, SensorHealthStatus, SensorHealthResult } from './SensorHealthValidator'
import { HardwareCommunicationService } from './HardwareCommunicationService'
import { LogTags } from '../utils/LogTags'

export interface DeviceHealthStatus {
  deviceId: string
  name: string
  status: 'online' | 'offline' | 'error' | 'unknown'
  lastCheck: Date
  error?: string
  responseTime?: number
  sensorHealth?: {
    status: SensorHealthStatus
    communicationHealth: boolean
    rangeHealth: boolean
    historicalHealth: boolean
    message: string
  }
}

export interface ControllerHealthStatus {
  controllerId: string
  name: string
  status: 'online' | 'offline' | 'error' | 'unknown'
  lastCheck: Date
  error?: string
  responseTime?: number
  devicesCount: number
}

export interface HealthCheckReport {
  timestamp: Date
  totalControllers: number
  onlineControllers: number
  totalDevices: number
  onlineDevices: number
  criticalIssues: string[]
  warnings: string[]
  controllers: ControllerHealthStatus[]
  devices: DeviceHealthStatus[]
}

export interface FlowValidationResult {
  isValid: boolean
  canExecute: boolean
  issues: string[]
  offlineDevices: string[]
  criticalFailures: string[]
}

// ===============================================
// PHASE 2: PROTOCOL ABSTRACTION LAYER
// ===============================================

export interface ProtocolMetrics {
  name: string
  totalRequests: number
  successfulRequests: number
  averageResponseTime: number
  lastUsed: Date
}

export interface IHealthProtocol {
  name: string
  checkAllControllers(controllers: IPhysicalController[]): Promise<ControllerHealthStatus[]>
  checkSingleController(controller: IPhysicalController): Promise<ControllerHealthStatus>
  supportsDiscovery(): boolean
  getPerformanceMetrics(): ProtocolMetrics
}

export class HttpHealthProtocol implements IHealthProtocol {
  name = 'HTTP'
  private startupService: any
  private metrics: ProtocolMetrics = {
    name: 'HTTP',
    totalRequests: 0,
    successfulRequests: 0,
    averageResponseTime: 0,
    lastUsed: new Date()
  }

  constructor(startupService: any) {
    this.startupService = startupService
  }

  async checkAllControllers(controllers: IPhysicalController[]): Promise<ControllerHealthStatus[]> {
    // За мониторинг на protocol abstraction - HTTP и UDP health check protocols със metrics tracking
    const results: ControllerHealthStatus[] = []
    const startTime = Date.now()

    // Existing HTTP-based batch processing logic
    for (const controller of controllers) {
      try {
        const result = await this.checkSingleController(controller)
        results.push(result)
      } catch (error: any) {
        results.push({
          controllerId: controller._id.toString(),
          name: controller.name,
          status: 'error',
          lastCheck: new Date(),
          error: error.message,
          responseTime: undefined,
          devicesCount: 0
        })
      }
    }

    // Update metrics
    this.metrics.totalRequests += controllers.length
    this.metrics.successfulRequests += results.filter(r => r.status === 'online').length
    this.metrics.averageResponseTime = (Date.now() - startTime) / controllers.length
    this.metrics.lastUsed = new Date()

    return results
  }

  async checkSingleController(controller: IPhysicalController): Promise<ControllerHealthStatus> {
    const startTime = Date.now()

    try {
      // Get adapter from ConnectionManager
      const { ConnectionManagerService } = await import('./ConnectionManagerService')
      const connectionManager = ConnectionManagerService.getInstance()
      const adapter = connectionManager.getAdapter(controller._id.toString())

      if (!adapter) {
        return {
          controllerId: controller._id.toString(),
          name: controller.name,
          status: 'offline',
          lastCheck: new Date(),
          error: 'No adapter found',
          responseTime: Date.now() - startTime,
          devicesCount: 0
        }
      }

      // Use adapter.ping() for health check
      const isOnline = await adapter.ping()
      const responseTime = Date.now() - startTime

      return {
        controllerId: controller._id.toString(),
        name: controller.name,
        status: isOnline ? 'online' : 'offline',
        lastCheck: new Date(),
        responseTime: responseTime,
        devicesCount: 0
      }
    } catch (error: any) {
      return {
        controllerId: controller._id.toString(),
        name: controller.name,
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
        responseTime: Date.now() - startTime,
        devicesCount: 0
      }
    }
  }

  supportsDiscovery(): boolean {
    return false // HTTP doesn't support discovery
  }

  getPerformanceMetrics(): ProtocolMetrics {
    return { ...this.metrics }
  }
}

export class SerialHealthProtocol implements IHealthProtocol {
  name = 'SERIAL'
  private startupService: any
  private healthChecker: HardwareHealthChecker
  private metrics: ProtocolMetrics = {
    name: 'SERIAL',
    totalRequests: 0,
    successfulRequests: 0,
    averageResponseTime: 0,
    lastUsed: new Date()
  }

  constructor(startupService: any, healthChecker?: HardwareHealthChecker) {
    this.startupService = startupService
    this.healthChecker = healthChecker || HardwareHealthChecker.getInstance()
  }

  async checkAllControllers(controllers: IPhysicalController[]): Promise<ControllerHealthStatus[]> {
    // За мониторинг на serial protocol health checking - serial port health verification with metrics tracking
    const results: ControllerHealthStatus[] = []
    const startTime = Date.now()

    // Filter only serial controllers
    const serialControllers = controllers.filter(c => 
      c.connectionType === 'serial' || 
      c.communicationType === 'raw_serial'
    )

    for (const controller of serialControllers) {
      try {
        const result = await this.checkSingleController(controller)
        results.push(result)
      } catch (error: any) {
        results.push({
          controllerId: controller._id.toString(),
          name: controller.name,
          status: 'error',
          lastCheck: new Date(),
          error: error.message,
          responseTime: undefined,
          devicesCount: 0
        })
      }
    }

    // Update metrics
    this.metrics.totalRequests += serialControllers.length
    this.metrics.successfulRequests += results.filter(r => r.status === 'online').length
    this.metrics.averageResponseTime = (Date.now() - startTime) / Math.max(serialControllers.length, 1)
    this.metrics.lastUsed = new Date()

    return results
  }

  async checkSingleController(controller: IPhysicalController): Promise<ControllerHealthStatus> {
    const startTime = Date.now()

    try {
      // Get adapter from ConnectionManager
      const { ConnectionManagerService } = await import('./ConnectionManagerService')
      const connectionManager = ConnectionManagerService.getInstance()
      const adapter = connectionManager.getAdapter(controller._id.toString())

      if (!adapter) {
        return {
          controllerId: controller._id.toString(),
          name: controller.name,
          status: 'offline',
          lastCheck: new Date(),
          error: 'No adapter found',
          responseTime: Date.now() - startTime,
          devicesCount: 0
        }
      }

      // Use adapter.ping() for health check
      const isOnline = await adapter.ping()
      const responseTime = Date.now() - startTime

      return {
        controllerId: controller._id.toString(),
        name: controller.name,
        status: isOnline ? 'online' : 'offline',
        lastCheck: new Date(),
        responseTime: responseTime,
        devicesCount: 0
      }
    } catch (error: any) {
      return {
        controllerId: controller._id.toString(),
        name: controller.name,
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
        responseTime: Date.now() - startTime,
        devicesCount: 0
      }
    }
  }

  supportsDiscovery(): boolean {
    return false // Serial doesn't support network discovery
  }

  getPerformanceMetrics(): ProtocolMetrics {
    return { ...this.metrics }
  }
}

export class UdpHealthProtocol implements IHealthProtocol {
  name = 'UDP'
  private udpDiscoveryService: UdpDiscoveryService
  private metrics: ProtocolMetrics = {
    name: 'UDP',
    totalRequests: 0,
    successfulRequests: 0,
    averageResponseTime: 0,
    lastUsed: new Date()
  }

  constructor(udpDiscoveryService: UdpDiscoveryService) {
    this.udpDiscoveryService = udpDiscoveryService
  }

  async checkAllControllers(controllers: IPhysicalController[]): Promise<ControllerHealthStatus[]> {
    const startTime = Date.now()
    
    try {
      // Use UDP broadcast discovery
      const results = await this.udpDiscoveryService.checkAllControllers()
      
      // Update metrics
      this.metrics.totalRequests++
      this.metrics.successfulRequests = results.length
      this.metrics.averageResponseTime = Date.now() - startTime
      this.metrics.lastUsed = new Date()
      
      return results
    } catch (error: any) {
      this.metrics.totalRequests++
      this.metrics.lastUsed = new Date()
      throw error
    }
  }

  async checkSingleController(controller: IPhysicalController): Promise<ControllerHealthStatus> {
    // Extract IP address with fallback strategies
    const ipAddress = controller.address || 
                     controller.communicationConfig?.ip_address ||
                     (controller.communicationConfig && controller.communicationConfig.ip_address)
    
    if (!ipAddress) {
      throw new Error('Controller IP address required for UDP check - neither address nor communicationConfig.ip_address found')
    }

    try {
      const result = await this.udpDiscoveryService.checkSingleController(ipAddress)
      return result || {
        controllerId: controller._id.toString(),
        name: controller.name,
        status: 'offline',
        lastCheck: new Date(),
        devicesCount: 0
      }
    } catch (error: any) {
      return {
        controllerId: controller._id.toString(),
        name: controller.name,
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
        devicesCount: 0
      }
    }
  }

  supportsDiscovery(): boolean {
    return true // UDP supports network discovery
  }

  getPerformanceMetrics(): ProtocolMetrics {
    return { ...this.metrics }
  }
}

export class HybridHealthManager {
  private protocols: IHealthProtocol[]
  private logger = UnifiedLoggingService.createModuleLogger('HybridHealthManager')

  constructor(protocols: IHealthProtocol[]) {
    this.protocols = protocols
  }

  async checkWithUdp(): Promise<ControllerHealthStatus[]> {
    // За мониторинг на hybrid management - protocol coordination и automatic fallback logic
    const udpProtocol = this.protocols.find(p => p.name === 'UDP')
    if (!udpProtocol) {
      throw new Error('UDP protocol not available')
    }
    
    const controllers = await PhysicalController.find({ isActive: true })
    return await udpProtocol.checkAllControllers(controllers)
  }

  async checkWithHttp(): Promise<ControllerHealthStatus[]> {
    const httpProtocol = this.protocols.find(p => p.name === 'HTTP')
    if (!httpProtocol) {
      throw new Error('HTTP protocol not available')
    }
    
    const controllers = await PhysicalController.find({ isActive: true })
    return await httpProtocol.checkAllControllers(controllers)
  }

  async checkWithSerial(): Promise<ControllerHealthStatus[]> {
    // За мониторинг на serial health checking - direct serial port health verification
    const serialProtocol = this.protocols.find(p => p.name === 'SERIAL')
    if (!serialProtocol) {
      throw new Error('Serial protocol not available')
    }
    
    const controllers = await PhysicalController.find({ isActive: true })
    return await serialProtocol.checkAllControllers(controllers)
  }

  async smartHealthCheck(): Promise<ControllerHealthStatus[]> {
    // За мониторинг на smart protocol routing - automatic protocol selection based on connectionType
    const controllers = await PhysicalController.find({ isActive: true })
    const results: ControllerHealthStatus[] = []
    
    // Group controllers by connection type
    const networkControllers = controllers.filter(c => 
      c.connectionType === 'network' || 
      (c.communicationType !== 'raw_serial' && c.connectionType !== 'serial')
    )
    const serialControllers = controllers.filter(c => 
      c.connectionType === 'serial' || 
      c.communicationType === 'raw_serial'
    )
    
    // Parallel health checks by protocol type
    const checks = []
    
    if (networkControllers.length > 0) {
      // For network controllers: UDP discovery first, HTTP fallback
      checks.push(this.checkWithUdp().catch(() => this.checkWithHttp()))
    }
    
    if (serialControllers.length > 0) {
      checks.push(this.checkWithSerial())
    }
    
    // Execute all protocol checks in parallel
    const allResults = await Promise.allSettled(checks)
    
    allResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(...result.value)
      }
    })
    
    return results
  }

  getProtocolByName(name: string): IHealthProtocol | undefined {
    // За мониторинг на protocol access - targeted protocol retrieval for external usage
    return this.protocols.find(p => p.name === name)
  }

  getProtocolMetrics(): ProtocolMetrics[] {
    // За мониторинг на protocol metrics - performance tracking и response time analysis
    return this.protocols.map(p => p.getPerformanceMetrics())
  }
}

export class HardwareHealthChecker {
  private static instance: HardwareHealthChecker
  private logger = UnifiedLoggingService.createModuleLogger('HardwareHealthChecker.ts')
  private startupService?: any
  private hybridManager: HybridHealthManager
  private sensorHealthValidator?: SensorHealthValidator
  private healthConfig?: any
  private udpEnabled: boolean = true // Phase 2 configuration
  
  // Configuration
  private healthCheckInterval: number = 5 * 60 * 1000 // 5 minutes default
  private quickPingTimeout: number = 500 // 500ms for quick checks
  private fullTestTimeout: number = 3000 // 3s for full tests
  private maxConcurrentChecks: number = 3
  private consecutiveFailureThreshold: number = 3
  
  // State tracking
  private isChecking = false
  private lastFullCheck?: Date
  private consecutiveFailures = new Map<string, number>()

  private constructor() {
    // Initialize hybrid manager with protocol implementations (Phase 3.1)
    // StartupService will be dynamically loaded to avoid circular dependency
    const protocols: IHealthProtocol[] = [
      new SerialHealthProtocol(null, this), // Pass health checker reference for getStartupService access
      new UdpHealthProtocol(new UdpDiscoveryService()),
      new HttpHealthProtocol(null) // Will be initialized lazily
    ]
    this.hybridManager = new HybridHealthManager(protocols)
  }

  /**
   * Dynamic import getter for StartupService to avoid circular dependency
   */
  private async getStartupService(): Promise<any> {
    if (!this.startupService) {
      const { StartupService } = await import('./StartupService')
      this.startupService = StartupService.getInstance()
      
      // Initialize protocols with StartupService
      await this.initializeProtocols()
    }
    return this.startupService
  }

  /**
   * Initialize protocols with StartupService after it's loaded
   */
  private async initializeProtocols(): Promise<void> {
    const protocols = this.hybridManager['protocols'] as any[]
    
    // Initialize HTTP and Serial protocols with StartupService
    for (const protocol of protocols) {
      if ((protocol.name === 'HTTP' || protocol.name === 'SERIAL') && !protocol.startupService) {
        protocol.startupService = this.startupService
      }
    }
  }

  /**
   * Initialize SensorHealthValidator with HardwareCommunicationService
   */
  private async initializeSensorValidator(): Promise<void> {
    if (!this.sensorHealthValidator) {
      const hardwareComm = HardwareCommunicationService.getInstance()
      this.sensorHealthValidator = new SensorHealthValidator(hardwareComm)
    }
  }

  static getInstance(): HardwareHealthChecker {
    if (!HardwareHealthChecker.instance) {
      HardwareHealthChecker.instance = new HardwareHealthChecker()
    }
    return HardwareHealthChecker.instance
  }

  /**
   * Single controller health check for StartupService integration (Phase 4.2)
   * Supports multiple Arduino types:
   * - Arduino Uno: Serial connection (UART/USB)
   * - WeMos D1 R2 v1: HTTP + Serial (dual connectivity)  
   * - WeMos D1 R2 v2: UDP + HTTP (hybrid with UDP priority)
   */
  async checkSingleController(controller: IPhysicalController): Promise<ControllerHealthStatus> {
    // За мониторинг на single controller health checking - targeted health verification for StartupService
    try {
      // Load HealthConfig to determine protocol based on Network Discovery settings
      const healthConfig = await HealthConfig.getSingleton()
      let protocol: string
      
      if (controller.communicationBy === 'serial') {
        // Arduino Uno with serial connection - always use serial
        protocol = 'SERIAL'
        // this.logger.debug(LogTags.controller.health.online, {
        //   message: 'Using SERIAL protocol for controller',
        //   controllerName: controller.name,
        //   communicationType: 'serial'
        // }, {
        //   source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleController' },
        //   business: { category: 'controller', operation: 'protocol_selection' },
        //   controllerId: controller._id.toString()
        // })
      } else if (controller.communicationBy === 'wifi' || controller.communicationBy === 'network') {
        // Network controllers - check HealthConfig UDP settings
        if (healthConfig.udp?.enabled) {
          // UDP Discovery mode enabled - use UDP
          protocol = 'UDP'
          // this.logger.debug(LogTags.network.udp.success, {
          //   message: 'Using UDP protocol for controller',
          //   controllerName: controller.name,
          //   discoveryMethod: healthConfig.udp.discoveryMethod
          // }, {
          //   source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleController' },
          //   business: { category: 'controller', operation: 'protocol_selection' },
          //   controllerId: controller._id.toString()
          // })
        } else {
          // HTTP Direct mode - use HTTP
          protocol = 'HTTP'
          // this.logger.debug(LogTags.controller.health.online, {
          //   message: 'Using HTTP protocol for controller',
          //   controllerName: controller.name,
          //   reason: 'UDP disabled - HTTP Direct mode'
          // }, {
          //   source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleController' },
          //   business: { category: 'controller', operation: 'protocol_selection' },
          //   controllerId: controller._id.toString()
          // })
        }
      } else {
        // Fallback for unknown configurations - check global setting
        if (healthConfig.udp?.enabled) {
          protocol = 'UDP'
        } else {
          protocol = 'HTTP'
        }
        this.logger.warn(LogTags.controller.health.offline, {
          message: 'Unknown communicationBy - using HealthConfig default',
          controllerName: controller.name,
          communicationBy: controller.communicationBy,
          defaultProtocol: protocol
        }, {
          source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleController' },
          business: { category: 'controller', operation: 'protocol_selection' },
          controllerId: controller._id.toString()
        })
      }
        
      const healthProtocol = this.hybridManager.getProtocolByName(protocol)
      
      if (!healthProtocol) {
        throw new Error(`Health protocol '${protocol}' not available`)
      }
      
      const result = await healthProtocol.checkSingleController(controller)
      
      // this.logger.info(LogTags.controller.health.online, {
      //   message: 'Single controller health check completed',
      //   controllerName: controller.name,
      //   status: result.status,
      //   responseTime: result.responseTime
      // }, {
      //   source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleController' },
      //   business: { category: 'controller', operation: 'health_check' },
      //   controllerId: controller._id.toString()
      // })
      
      return result
    } catch (error: any) {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'Single controller health check failed',
        controllerName: controller.name,
        error: error.message
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleController' },
        business: { category: 'controller', operation: 'health_check' },
        controllerId: controller._id.toString()
      })
      
      return {
        controllerId: controller._id.toString(),
        name: controller.name,
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
        devicesCount: 0
      }
    }
  }

  /**
   * Конфигуриране на health checker
   */
  configure(options: {
    healthCheckInterval?: number
    quickPingTimeout?: number
    fullTestTimeout?: number
    maxConcurrentChecks?: number
    consecutiveFailureThreshold?: number
    udpEnabled?: boolean
  }): void {
    // За мониторинг на dynamic configuration - runtime parameter updates и system adaptation
    if (options.healthCheckInterval) this.healthCheckInterval = options.healthCheckInterval
    if (options.quickPingTimeout) this.quickPingTimeout = options.quickPingTimeout
    if (options.fullTestTimeout) this.fullTestTimeout = options.fullTestTimeout
    if (options.maxConcurrentChecks) this.maxConcurrentChecks = options.maxConcurrentChecks
    if (options.consecutiveFailureThreshold) this.consecutiveFailureThreshold = options.consecutiveFailureThreshold
    if (options.udpEnabled !== undefined) this.udpEnabled = options.udpEnabled

    // this.logger.info(LogTags.system.health.check, {
    //   message: 'Health checker configured',
    //   interval: this.healthCheckInterval,
    //   udpEnabled: this.udpEnabled
    // }, {
    //   source: { file: 'HardwareHealthChecker.ts', method: 'configure' },
    //   business: { category: 'system', operation: 'configuration' }
    // })
  }

  /**
   * Get protocol performance metrics (Phase 2)
   */
  getProtocolMetrics(): ProtocolMetrics[] {
    return this.hybridManager.getProtocolMetrics()
  }

  /**
   * ОСНОВЕН МЕТОД: Пълна проверка на всички контролери и устройства
   */
  async checkAllHardware(options: { 
    quickCheck?: boolean,
    forceCheck?: boolean,
    checkControllers?: boolean,
    checkSensors?: boolean
  } = {}): Promise<HealthCheckReport> {
    // За мониторинг на comprehensive health checks - full hardware validation със protocol selection
    
    if (this.isChecking && !options.forceCheck) {
      this.logger.warn(LogTags.system.health.warning, {
        message: 'Health check already in progress, skipping'
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
        business: { category: 'system', operation: 'health_check' }
      })
      throw new Error('Health check already in progress')
    }

    this.isChecking = true
    const startTime = Date.now()

    try {
      // this.logger.info(LogTags.system.health.check, {
      //   message: 'Starting hardware health check',
      //   checkType: options.quickCheck ? 'quick' : 'full'
      // }, {
      //   source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
      //   business: { category: 'system', operation: 'health_check' }
      // })

      // Load HealthConfig for controller cache timeout
      this.healthConfig = await HealthConfig.getSingleton()

      // Get controllers based on settings
      const allControllers = await PhysicalController.find({ isActive: true })
      console.log(`\n🔍 [DEBUG] Found ${allControllers.length} active controllers in database`)
      allControllers.forEach((ctrl, idx) => {
        console.log(`   ${idx + 1}. ${ctrl.name} - healthCheckEnabled: ${ctrl.healthCheckEnabled}, connectionType: ${ctrl.connectionType}, communicationType: ${ctrl.communicationType}`)
      })
      const controllers = allControllers.filter(controller => controller.healthCheckEnabled)
      console.log(`🔍 [DEBUG] After filtering: ${controllers.length} controllers with healthCheckEnabled=true`)
      
      // Get devices based on settings  
      const allDevices = await Device.find({ isActive: true }).populate('controllerId')
      const devices = allDevices.filter(device => device.healthCheckEnabled)

      const controllerStatuses: ControllerHealthStatus[] = []
      const deviceStatuses: DeviceHealthStatus[] = []
      const criticalIssues: string[] = []
      const warnings: string[] = []

      // Phase 2: Hybrid protocol health checking
      let controllerResults: ControllerHealthStatus[] = []
      
      // Add this condition around the entire controller checking section
      if (options.checkControllers !== false) {
        // Try UDP first (if enabled)
        if (this.udpEnabled) {
          try {
            // Update UDP config from database before checking
            const udpProtocol = this.hybridManager['protocols'].find((p: IHealthProtocol) => p.name === 'UDP') as UdpHealthProtocol | undefined
            if (udpProtocol && this.healthConfig?.udp) {
              udpProtocol['udpDiscoveryService'].updateConfig({
                broadcastAddress: this.healthConfig.udp.broadcastAddress || '192.168.0.255',
                port: this.healthConfig.udp.port || 8888,
                responseTimeout: this.healthConfig.udp.responseTimeout || 2000,
                retryAttempts: this.healthConfig.udp.retryAttempts || 3
              })
            }

            // this.logger.info(LogTags.network.discovery.started, {
            //   message: 'Attempting UDP discovery health check'
            // }, {
            //   source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
            //   business: { category: 'controller', operation: 'discovery' }
            // })
            controllerResults = await this.hybridManager.smartHealthCheck()
            // this.logger.info(LogTags.network.discovery.completed, {
            //   message: 'UDP health check succeeded',
            //   controllersFound: controllerResults.length
            // }, {
            //   source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
            //   business: { category: 'controller', operation: 'discovery' }
            // })
            
            // Record successful UDP metrics
            controllerResults.forEach(async (result) => {
              if (result.responseTime) {
                try {
                  // Check if controllerId is a valid ObjectId or MAC address
                  const isObjectId = /^[0-9a-fA-F]{24}$/.test(result.controllerId)

                  if (isObjectId) {
                    // Update by ObjectId
                    // Remove ObjectId update logging (internal housekeeping)
                    const updateResult = await PhysicalController.findByIdAndUpdate(result.controllerId, {
                      udpResponseTime: result.responseTime,
                      lastDiscoveryMethod: 'udp',
                      lastSeen: new Date(),
                      status: 'online',
                      lastHeartbeat: new Date()
                    })
                    // Remove ObjectId update completion logging (internal housekeeping)
                  } else {
                    // Assume it's a MAC address, find controller by MAC and auto-populate if missing
                    const controller = await PhysicalController.findOneAndUpdate({ macAddress: result.controllerId }, {
                      udpResponseTime: result.responseTime,
                      lastDiscoveryMethod: 'udp',
                      lastSeen: new Date()
                    })
                    
                    // If no controller found by MAC, try to auto-populate MAC for existing controller with matching IP
                    if (!controller) {
                      this.logger.info(LogTags.controller.discovery.lost, {
                        message: 'No controller found with MAC - attempting auto-population by name match',
                        macAddress: result.controllerId
                      }, {
                        source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
                        business: { category: 'controller', operation: 'auto_populate' }
                      })
                      
                      // Try to find controller by device name from UDP discovery
                      const controllerByName = await PhysicalController.findOne({ 
                        $or: [
                          { name: { $regex: new RegExp(result.name, 'i') } }, // Case insensitive name match
                          { 'communicationConfig.ip_address': '192.168.0.172' } // Known IP fallback for WeMos 01
                        ],
                        macAddress: { $exists: false } // Only controllers without MAC
                      })
                      
                      if (controllerByName) {
                        // Auto-populate MAC address
                        controllerByName.macAddress = result.controllerId
                        controllerByName.udpResponseTime = result.responseTime
                        controllerByName.lastDiscoveryMethod = 'udp'
                        controllerByName.lastSeen = new Date()
                        await controllerByName.save()
                        
                        // Remove MAC auto-populate logging (internal housekeeping)
                      }
                    }
                  }
                } catch (err: any) {
                  this.logger.warn(LogTags.controller.discovery.lost, {
                    message: 'Failed to update controller UDP metrics',
                    controllerId: result.controllerId,
                    error: err.message
                  }, {
                    source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
                    business: { category: 'controller', operation: 'update_metrics' },
                    controllerId: result.controllerId
                  })
                }
              }
            })
            
          } catch (udpError: any) {
            this.logger.warn(LogTags.network.discovery.failed, {
              message: 'UDP health check failed, falling back to HTTP',
              error: udpError.message
            }, {
              source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
              business: { category: 'controller', operation: 'health_check' }
            })
            
            // Fallback to HTTP
            try {
              controllerResults = await this.hybridManager.checkWithHttp()
              // this.logger.info(LogTags.controller.health.online, {
              //   message: 'HTTP fallback succeeded',
              //   controllersFound: controllerResults.length
              // }, {
              //   source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
              //   business: { category: 'controller', operation: 'health_check' }
              // })
            } catch (httpError: any) {
              this.logger.error(LogTags.controller.health.offline, {
                message: 'HTTP fallback also failed',
                error: httpError.message
              }, {
                source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
                business: { category: 'controller', operation: 'health_check' }
              })
              // Create error statuses for all controllers
              controllerResults = controllers.map(controller => ({
                controllerId: controller._id.toString(),
                name: controller.name,
                status: 'error' as const,
                lastCheck: new Date(),
                error: `Both UDP and HTTP failed: ${udpError.message}`,
                devicesCount: 0
              }))
            }
          }
        } else {
          // HTTP only mode
          // this.logger.info(LogTags.controller.health.online, {
          //   message: 'UDP disabled, using HTTP health check'
          // }, {
          //   source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
          //   business: { category: 'controller', operation: 'health_check' }
          // })
          try {
            controllerResults = await this.hybridManager.checkWithHttp()
          } catch (httpError: any) {
            this.logger.error(LogTags.controller.health.offline, {
              message: 'HTTP health check failed',
              error: httpError.message
            }, {
              source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
              business: { category: 'controller', operation: 'health_check' }
            })
            controllerResults = controllers.map(controller => ({
              controllerId: controller._id.toString(),
              name: controller.name,
              status: 'error' as const,
              lastCheck: new Date(),
              error: httpError.message,
              devicesCount: 0
            }))
          }
        }
      } else {
        // this.logger.info(LogTags.system.health.check, {
        //   message: 'Controller checking disabled, skipping'
        // }, {
        //   source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
        //   business: { category: 'system', operation: 'health_check' }
        // })
      }

      // Process results and generate issues
      controllerResults.forEach(result => {
        controllerStatuses.push(result)
        if (result.status === 'offline' || result.status === 'error') {
          criticalIssues.push(`Controller ${result.name} is ${result.status}${result.error ? ': ' + result.error : ''}`)
        }
      })

      // Update database with health check results for ALL protocols (UDP, HTTP, Serial)
      for (const result of controllerResults) {
        try {
          const isObjectId = /^[0-9a-fA-F]{24}$/.test(result.controllerId)
          if (isObjectId) {
            // Determine healthStatus based on status
            let healthStatus: 'healthy' | 'error' | 'warning' | 'unknown' = 'unknown'
            if (result.status === 'online') {
              healthStatus = 'healthy'
            } else if (result.status === 'offline' || result.status === 'error') {
              healthStatus = 'error'
            }

            await PhysicalController.findByIdAndUpdate(result.controllerId, {
              status: result.status,
              healthStatus: healthStatus,
              lastHealthCheck: new Date(),
              lastHeartbeat: result.status === 'online' ? new Date() : undefined,
              lastResponseTime: result.responseTime
            })
          }
        } catch (updateError: any) {
          this.logger.warn(LogTags.controller.health.offline, {
            message: 'Failed to update controller status in database',
            controllerId: result.controllerId,
            error: updateError.message
          }, {
            source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
            business: { category: 'controller', operation: 'status_update' }
          })
        }
      }

      // Phase 3: Smart sensor checking with controller cache optimization
      if (options.checkSensors !== false) {
        // Step 1: Get unique controllers from all devices (enabled and disabled sensors)
        const allDevicesForCheck = allDevices
        
        if (allDevicesForCheck.length === 0) {
          // this.logger.info(LogTags.device.health.warning, {
          //   message: 'No devices found in database, skipping device processing'
          // }, {
          //   source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
          //   business: { category: 'device', operation: 'health_check' }
          // })
        } else {
        const controllerMap = new Map()
        
        for (const device of allDevicesForCheck) {
          const controller = device.controllerId as any
          if (controller && !controllerMap.has(controller._id.toString())) {
            controllerMap.set(controller._id.toString(), {
              controller,
              devices: [device]
            })
          } else if (controller) {
            controllerMap.get(controller._id.toString()).devices.push(device)
          }
        }

        // Step 2: Process all devices with fresh controller status checks
        const deviceResults = await this.processDevicesWithControllerStatus(controllerMap, options.quickCheck)
        deviceStatuses.push(...deviceResults)
        
        // Count warnings from device results
        deviceResults.forEach(result => {
          if (result.status === 'offline' || result.status === 'error') {
            warnings.push(`Sensor ${result.name} is ${result.status}`)
          }
        })
        }
      } else {
        // this.logger.info(LogTags.system.health.check, {
        //   message: 'Sensor checking disabled, skipping'
        // }, {
        //   source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
        //   business: { category: 'system', operation: 'health_check' }
        // })
      }

      const report: HealthCheckReport = {
        timestamp: new Date(),
        totalControllers: controllerStatuses.length,
        onlineControllers: controllerStatuses.filter(c => c.status === 'online').length,
        totalDevices: deviceStatuses.length,
        onlineDevices: deviceStatuses.filter(d => d.status === 'online').length,
        criticalIssues,
        warnings,
        controllers: controllerStatuses,
        devices: deviceStatuses
      }

      this.lastFullCheck = new Date()
      const duration = Date.now() - startTime

      this.logger.info(LogTags.system.health.check, {
        message: 'Health check completed',
        duration: duration,
        onlineControllers: report.onlineControllers,
        totalControllers: report.totalControllers,
        onlineDevices: report.onlineDevices,
        totalDevices: report.totalDevices,
        criticalIssues: criticalIssues.length,
        warnings: warnings.length
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
        business: { category: 'system', operation: 'health_check' }
      })

      return report

    } catch (error) {
      this.logger.error(LogTags.system.health.critical, {
        message: 'Health check failed',
        error: error
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'checkAllHardware' },
        business: { category: 'system', operation: 'health_check' }
      })
      throw error
    } finally {
      this.isChecking = false
    }
  }


  /**
   * Проверка на единичен контролер
   */
  private async checkSingleControllerWithTracking(
    controller: IPhysicalController, 
    quickCheck: boolean = false
  ): Promise<ControllerHealthStatus> {
    // За мониторинг на controller validation - individual controller health с consecutive failure tracking
    const startTime = Date.now()
    const controllerId = controller._id.toString()

    try {
      // Quick ping test
      const isResponding = await this.quickPingController(controller)
      const responseTime = Date.now() - startTime

      let status: 'online' | 'offline' | 'error' | 'unknown' = 'unknown'
      let error: string | undefined

      if (isResponding) {
        status = 'online'
        this.consecutiveFailures.delete(controllerId)
        
        // Check if this is a status change from offline to online (reconnect)
        const currentController = await PhysicalController.findById(controllerId)
        const wasOffline = currentController && currentController.status === 'offline'
        
        // Update controller status in DB
        await PhysicalController.findByIdAndUpdate(controllerId, {
          status: 'online',
          lastHeartbeat: new Date(),
          healthStatus: 'healthy',
          lastHealthCheck: new Date(),
          consecutiveFailures: 0,
          lastResponseTime: responseTime
        })
        
        // 🚀 LIFECYCLE NOTIFICATION: Controller Reconnect (only if was offline)
        if (wasOffline) {
          try {
            const { notificationService } = await import('./NotificationService')
            const timestamp = new Date()
            
            await notificationService.sendLifecycleNotification('controller_reconnect', {
              controllerName: controller.name,
              controllerIp: controller.address || 'Unknown',
              deviceName: controller.name,
              deviceType: 'controller',
              timestamp: timestamp,
              reconnectTime: timestamp,
              downtime: currentController?.lastHeartbeat 
                ? `${Math.round((timestamp.getTime() - currentController.lastHeartbeat.getTime()) / (1000 * 60))} мин`
                : 'неизвестно',
              lastSeen: currentController?.lastHeartbeat || timestamp
            })
            
            // this.logger.info(LogTags.controller.connect.success, {
            //   message: 'Controller reconnect notification sent',
            //   controllerName: controller.name
            // }, {
            //   source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleControllerWithTracking' },
            //   business: { category: 'controller', operation: 'notification' },
            //   controllerId: controllerId
            // })
          } catch (lifecycleNotificationError) {
            this.logger.warn(LogTags.controller.connect.failed, {
              message: 'Failed to send controller reconnect notification',
              error: lifecycleNotificationError
            }, {
              source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleControllerWithTracking' },
              business: { category: 'controller', operation: 'notification' },
              controllerId: controllerId
            })
          }
        }
        
      } else {
        const failures = (this.consecutiveFailures.get(controllerId) || 0) + 1
        this.consecutiveFailures.set(controllerId, failures)
        
        if (failures >= this.consecutiveFailureThreshold) {
          status = 'offline'
          
          // this.logger.info(LogTags.controller.health.offline, {
          //   message: 'Controller offline after consecutive failures - starting reconnection',
          //   controllerName: controller.name,
          //   failures: failures
          // }, {
          //   source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleControllerWithTracking' },
          //   business: { category: 'controller', operation: 'reconnection' },
          //   controllerId: controllerId
          // })
          
          // Attempt automatic reconnection
          const startupService = await this.getStartupService()
          const reconnectSuccess = await startupService.reconnectController(controllerId)
          
          if (reconnectSuccess) {
            // Reconnection successful - update status to online
            status = 'online'
            this.consecutiveFailures.delete(controllerId)
            // this.logger.info(LogTags.controller.connect.success, {
            //   message: 'Successful auto-reconnection of controller',
            //   controllerName: controller.name
            // }, {
            //   source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleControllerWithTracking' },
            //   business: { category: 'controller', operation: 'reconnection' },
            //   controllerId: controllerId
            // })
            
            await PhysicalController.findByIdAndUpdate(controllerId, {
              status: 'online',
              lastHeartbeat: new Date(),
              healthStatus: 'healthy',
              lastHealthCheck: new Date(),
              consecutiveFailures: 0,
              lastResponseTime: Date.now() - startTime
            })
          } else {
            // Reconnection failed - mark as offline
            await PhysicalController.findByIdAndUpdate(controllerId, {
              status: 'offline',
              healthStatus: 'error',
              lastHealthCheck: new Date(),
              consecutiveFailures: failures
            })

            // Alert: Controller disconnect after consecutive failures
            if (failures === this.consecutiveFailureThreshold) {
              this.logger.error(LogTags.controller.health.offline, {
                message: `Controller ${controller.name} offline after ${failures} failed attempts`,
                controllerId: controllerId,
                deviceName: controller.name,
                consecutiveFailures: failures
              }, {
                source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleControllerWithTracking' },
                business: { category: 'controller', operation: 'disconnect_alert' },
                controllerId: controllerId
              })
            }

            // 🚀 LIFECYCLE NOTIFICATION: Controller Disconnect (only on first disconnect)
            if (failures === this.consecutiveFailureThreshold) {
              try {
                const { notificationService } = await import('./NotificationService')
                const timestamp = new Date()
                
                await notificationService.sendLifecycleNotification('controller_disconnect', {
                  controllerName: controller.name,
                  controllerIp: controller.address || 'Unknown',
                  deviceName: controller.name,
                  deviceType: 'controller',
                  timestamp: timestamp,
                  disconnectTime: timestamp,
                  lastSeen: controller.lastHeartbeat || timestamp
                })
                
                // this.logger.info(LogTags.controller.health.offline, {
                //   message: 'Controller disconnect notification sent',
                //   controllerName: controller.name
                // }, {
                //   source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleControllerWithTracking' },
                //   business: { category: 'controller', operation: 'notification' },
                //   controllerId: controllerId
                // })
              } catch (lifecycleNotificationError) {
                this.logger.warn(LogTags.controller.health.offline, {
                  message: 'Failed to send controller disconnect notification',
                  controllerName: controller.name,
                  error: lifecycleNotificationError
                }, {
                  source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleControllerWithTracking' },
                  business: { category: 'controller', operation: 'notification' },
                  controllerId: controllerId
                })
              }
            }
          }
        } else {
          status = 'error'
          error = `Consecutive failures: ${failures}/${this.consecutiveFailureThreshold}`
          await PhysicalController.findByIdAndUpdate(controllerId, {
            status: 'error',
            healthStatus: 'warning',
            lastHealthCheck: new Date(),
            consecutiveFailures: failures
          })
        }
      }

      // Count devices on this controller
      const devicesCount = await Device.countDocuments({ 
        controllerId: controller._id,
        isActive: true 
      })

      return {
        controllerId,
        name: controller.name,
        status,
        lastCheck: new Date(),
        error,
        responseTime,
        devicesCount
      }

    } catch (error) {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'Controller check error',
        controllerName: controller.name,
        error: error
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleControllerWithTracking' },
        business: { category: 'controller', operation: 'health_check' },
        controllerId: controllerId
      })
      
      return {
        controllerId,
        name: controller.name,
        status: 'error',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
        devicesCount: 0
      }
    }
  }


  /**
   * Process sensors based on their controller status
   */
  private async processDevicesWithControllerStatus(
    controllerMap: Map<string, {controller: any, devices: any[]}>, 
    quickCheck: boolean
  ): Promise<DeviceHealthStatus[]> {
    const results: DeviceHealthStatus[] = []
    
    for (const [controllerId, group] of controllerMap) {
      const controller = group.controller
      const devices = group.devices

      // Always do fresh controller check - no caching
      let isControllerOnline = await this.quickPingController(controller)
      
      // 🔄 If controller is offline and serial, try reconnection before marking as offline
      if (!isControllerOnline && controller.communicationBy === 'serial') {
        // this.logger.info(LogTags.controller.health.offline, {
        //   message: 'Serial controller offline - attempting reconnection',
        //   controllerName: controller.name
        // }, {
        //   source: { file: 'HardwareHealthChecker.ts', method: 'processDevicesWithControllerStatus' },
        //   business: { category: 'controller', operation: 'reconnection' },
        //   controllerId: controller._id.toString()
        // })
        
        try {
          const startupService = await this.getStartupService()
          const reconnectSuccess = await startupService.reconnectController(controller._id.toString())
          
          if (reconnectSuccess) {
            // this.logger.info(LogTags.controller.connect.success, {
            //   message: 'Successfully reconnected serial controller',
            //   controllerName: controller.name
            // }, {
            //   source: { file: 'HardwareHealthChecker.ts', method: 'processDevicesWithControllerStatus' },
            //   business: { category: 'controller', operation: 'reconnection' },
            //   controllerId: controller._id.toString()
            // })
            // Test again after reconnection
            isControllerOnline = await this.quickPingController(controller)
          } else {
            this.logger.warn(LogTags.controller.connect.failed, {
              message: 'Failed to reconnect serial controller',
              controllerName: controller.name
            }, {
              source: { file: 'HardwareHealthChecker.ts', method: 'processDevicesWithControllerStatus' },
              business: { category: 'controller', operation: 'reconnection' },
              controllerId: controller._id.toString()
            })
          }
        } catch (reconnectError) {
          this.logger.error(LogTags.controller.connect.failed, {
            message: 'Error during serial controller reconnection',
            controllerName: controller.name,
            error: reconnectError
          }, {
            source: { file: 'HardwareHealthChecker.ts', method: 'processDevicesWithControllerStatus' },
            business: { category: 'controller', operation: 'reconnection' },
            controllerId: controller._id.toString()
          })
        }
      }
      
      const newStatus = isControllerOnline ? 'online' : 'offline'
      const newHealthStatus = isControllerOnline ? 'healthy' : 'error'

      // Update controller in database
      await PhysicalController.findByIdAndUpdate(controller._id, {
        status: newStatus,
        healthStatus: newHealthStatus,
        lastHealthCheck: new Date()
      })

      // this.logger.info(LogTags.controller.health.online, {
      //   message: 'Controller fresh check completed',
      //   controllerName: controller.name,
      //   status: newStatus
      // }, {
      //   source: { file: 'HardwareHealthChecker.ts', method: 'processDevicesWithControllerStatus' },
      //   business: { category: 'controller', operation: 'health_check' },
      //   controllerId: controller._id.toString()
      // })
      
      for (const device of devices) {
        const isCheckingEnabled = device.isActive && device.healthCheckEnabled
        
        if (!isControllerOnline) {
          // Controller offline - all devices get error status
          const deviceStatus = await this.updateSensorStatus(device, 'error', 'Controller offline')
          results.push(deviceStatus)
        } else if (device.category === 'actuator') {
          // Controller online, actuator - automatically healthy
          const deviceStatus = await this.updateSensorStatus(device, 'healthy', 'Controller online, actuator auto-healthy')
          results.push(deviceStatus)
        } else if (!isCheckingEnabled) {
          // Controller online, but sensor checking disabled - sensor gets healthy status
          const deviceStatus = await this.updateSensorStatus(device, 'healthy', 'Checking disabled, controller online')
          results.push(deviceStatus)
        } else {
          // Controller online and sensor checking enabled - do full sensor validation
          try {
            const deviceStatus = await this.checkSingleDevice(device, quickCheck)
            results.push(deviceStatus)
          } catch (error) {
            const deviceStatus = await this.updateSensorStatus(device, 'error', `Sensor check failed: ${error}`)
            results.push(deviceStatus)
          }
        }
      }
    }
    
    return results
  }

  /**
   * Update sensor status in database and return DeviceHealthStatus
   */
  private async updateSensorStatus(device: any, status: 'healthy' | 'error', message: string): Promise<DeviceHealthStatus> {
    const healthStatus = status === 'healthy' ? 'healthy' : 'error'
    const isCheckingEnabled = device.isActive && device.healthCheckEnabled
    
    await Device.findByIdAndUpdate(device._id, {
      healthStatus,
      checkingEnabled: isCheckingEnabled,
      lastHealthCheck: new Date(),
      lastError: status === 'error' ? message : null
    })
    
    return {
      deviceId: device._id.toString(),
      name: device.name,
      status: status === 'healthy' ? 'online' : 'offline',
      lastCheck: new Date(),
      error: status === 'error' ? message : undefined
    }
  }

  /**
   * Проверка на единично устройство
   */
  private async checkSingleDevice(
    device: IDevice, 
    quickCheck: boolean = false
  ): Promise<DeviceHealthStatus> {
    // За мониторинг на device validation - device health status propagation и controller dependency checking
    const deviceId = device._id.toString()

    try {
      // Do fresh controller check - no caching
      const controller = device.controllerId as any
      if (!controller) {
        throw new Error('Device has no associated controller')
      }

      const isControllerHealthy = await this.quickPingController(controller)
      let status: 'online' | 'offline' | 'error' | 'unknown' = isControllerHealthy ? 'online' : 'offline'
      let error: string | undefined = isControllerHealthy ? undefined : 'Controller offline'
      let sensorHealth: any = undefined

      // If controller is healthy and it's a sensor, perform enhanced sensor validation
      const shouldValidate = device.category === 'sensor' && !quickCheck && device.healthCheckEnabled
      console.log(`🔍 Device ${device.name}: category=${device.category}, quickCheck=${quickCheck}, healthCheckEnabled=${device.healthCheckEnabled}, shouldValidateSensor=${shouldValidate}`)
      
      if (isControllerHealthy && shouldValidate) {
        await this.initializeSensorValidator()
        
        if (this.sensorHealthValidator) {
          const sensorResult = await this.sensorHealthValidator.validateSensorHealth(device)
          
          sensorHealth = {
            status: sensorResult.status,
            communicationHealth: sensorResult.communicationHealth,
            rangeHealth: sensorResult.rangeHealth,
            historicalHealth: sensorResult.historicalHealth,
            message: sensorResult.message
          }

          // Update overall device status based on sensor health
          if (sensorResult.status === 'UNHEALTHY') {
            status = 'error'
            error = `Sensor validation failed: ${sensorResult.message}`
          } else if (sensorResult.status === 'WARNING') {
            status = 'online' // Keep online but flag warning in sensorHealth
          }
        }
      }
      
      // Update device health status in database
      let healthStatus: string
      
      if (sensorHealth) {
        // Sensor validation was performed - use sensor results
        if (sensorHealth.status === 'UNHEALTHY') {
          healthStatus = 'error'
        } else if (sensorHealth.status === 'WARNING') {
          healthStatus = 'warning'
        } else {
          healthStatus = 'healthy'
        }
      } else {
        // No sensor validation - use controller status
        if (status === 'online') {
          healthStatus = 'healthy'
        } else {
          healthStatus = 'error'
        }
      }
      
      // Determine if health checking is currently enabled for this device
      const isCheckingEnabled = device.isActive && device.healthCheckEnabled
      
      await Device.findByIdAndUpdate(deviceId, {
        lastError: error || null,
        healthStatus,
        checkingEnabled: isCheckingEnabled,
        lastHealthCheck: new Date()
      })

      return {
        deviceId,
        name: device.name,
        status,
        lastCheck: new Date(),
        error,
        sensorHealth
      }

    } catch (error) {
      this.logger.error(LogTags.device.health.offline, {
        message: 'Device check error',
        deviceName: device.name,
        error: error
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'checkSingleDevice' },
        business: { category: 'device', operation: 'health_check' },
        deviceId: deviceId
      })
      
      return {
        deviceId,
        name: device.name,
        status: 'error',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Бърз ping тест на контролер
   */
  private async quickPingController(controller: IPhysicalController): Promise<boolean> {
    // За мониторинг на quick ping operations - fast response testing със timeout management
    try {
      const controllerId = controller._id.toString()

      // Get adapter from ConnectionManager
      const { ConnectionManagerService } = await import('./ConnectionManagerService')
      const connectionManager = ConnectionManagerService.getInstance()
      const adapter = connectionManager.getAdapter(controllerId)

      if (!adapter) {
        return false
      }

      // Use adapter.ping() directly with timeout
      const result = await Promise.race([
        adapter.ping(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Ping timeout')), this.quickPingTimeout)
        )
      ])

      return result

    } catch (error) {
      return false
    }
  }

  /**
   * Извличане на device ID-та от flow данни
   */
  private extractDeviceIdsFromFlow(flowData: any): string[] {
    // За мониторинг на device extraction - intelligent parsing на device IDs от flow block parameters
    const deviceIds: string[] = []
    
    // this.logger.info(LogTags.flow.validate.passed, {
    //   message: 'Extracting devices from flow',
    //   blocksCount: flowData.blocks?.length || 0
    // }, {
    //   source: { file: 'HardwareHealthChecker.ts', method: 'extractDeviceIdsFromFlow' },
    //   business: { category: 'flow', operation: 'device_extraction' }
    // })
    
    if (flowData.blocks) {
      for (const block of flowData.blocks) {
        //this.logger.info('HardwareHealthChecker.ts', `🔍 Block: type="${block.type}", id="${block.id}", parameters=${JSON.stringify(block.parameters)}`)
        
        // Check if block uses devices - look for deviceId in parameters regardless of type
        let deviceId = null
        
        if (block.parameters?.deviceId && block.parameters.deviceId !== '') {
          deviceId = block.parameters.deviceId
        } else if (block.parameters?.device && block.parameters.device !== '') {
          deviceId = block.parameters.device
        } else if (block.parameters?.selectedDevice && block.parameters.selectedDevice !== '') {
          deviceId = block.parameters.selectedDevice
        } else if (block.data?.deviceId && block.data.deviceId !== '') {
          deviceId = block.data.deviceId
        } else if (block.deviceId && block.deviceId !== '') {
          deviceId = block.deviceId
        }
        
        if (deviceId) {
          deviceIds.push(deviceId)
         // this.logger.info('HardwareHealthChecker.ts', `✅ Found deviceId: ${deviceId} in block type="${block.type}" (id: ${block.id})`)
        } else if (block.parameters?.deviceId === '' || block.parameters?.deviceType !== undefined) {
          // This block expects a device but none is selected
          //this.logger.warn('HardwareHealthChecker.ts', `⚠️ Block has device parameters but no deviceId selected (type: ${block.type}, id: ${block.id})`)
        }
      }
    } else {
      this.logger.warn(LogTags.flow.validate.failed, {
        message: 'Flow data has no blocks property'
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'extractDeviceIdsFromFlow' },
        business: { category: 'flow', operation: 'device_extraction' }
      })
    }
    
    const uniqueDeviceIds = [...new Set(deviceIds)] // Remove duplicates
    //this.logger.info('HardwareHealthChecker.ts', `🔍 Extracted ${uniqueDeviceIds.length} unique device IDs: [${uniqueDeviceIds.join(', ')}]`)
    
    return uniqueDeviceIds
  }

  /**
   * Разделяне на масив на batch-ове за concurrency control
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    // За мониторинг на batch processing - concurrency control и performance optimization
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Getter методи
   */
  getLastFullCheck(): Date | undefined {
    return this.lastFullCheck
  }

  isHealthCheckInProgress(): boolean {
    return this.isChecking
  }

  getConfiguration() {
    return {
      healthCheckInterval: this.healthCheckInterval,
      quickPingTimeout: this.quickPingTimeout,
      fullTestTimeout: this.fullTestTimeout,
      maxConcurrentChecks: this.maxConcurrentChecks,
      consecutiveFailureThreshold: this.consecutiveFailureThreshold
    }
  }
  
  /**
   * Force update all controller and device health statuses to match their current status
   */
  async syncHealthStatuses(): Promise<void> {
    // За мониторинг на health status synchronization - database status updates и cascade propagation
    try {
      console.log('🔄 [HardwareHealthChecker] Syncing health statuses...')
      
      // Update all controllers health status based on their current status
      const controllers = await PhysicalController.find({})
      
      for (const controller of controllers) {
        let healthStatus = 'unknown'
        switch (controller.status) {
          case 'online':
            healthStatus = 'healthy'
            break
          case 'offline':
          case 'error':
            healthStatus = 'error'
            break
          case 'maintenance':
            healthStatus = 'warning'
            break
          default:
            healthStatus = 'unknown'
        }
        
        await PhysicalController.findByIdAndUpdate(controller._id, {
          healthStatus,
          lastHealthCheck: new Date()
        })
      }
      
      // Update all devices health status based on their controller
      // BUT preserve sensor health status if it was determined by sensor validation
      const devices = await Device.find({}).populate('controllerId') // Get ALL devices to update checkingEnabled
      
      for (const device of devices) {
        const controller = device.controllerId as any
        let healthStatus = 'unknown'
        
        if (controller) {
          switch (controller.status) {
            case 'online':
              // For sensors, only update to healthy if current status is not already error/warning from sensor validation
              if (device.category === 'sensor') {
                // Keep existing healthStatus if it indicates sensor problems (error/warning)
                if (device.healthStatus === 'error' || device.healthStatus === 'warning') {
                  healthStatus = device.healthStatus // Preserve sensor validation results
                } else {
                  healthStatus = 'healthy'
                }
              } else {
                healthStatus = 'healthy'
              }
              break
            case 'offline':
            case 'error':
              healthStatus = 'error' // Changed from 'unhealthy' to match our schema
              break
            case 'maintenance':
              healthStatus = 'warning'
              break
            default:
              healthStatus = 'unknown'
          }
        }
        
        // Determine if health checking is currently enabled for this device
        const isCheckingEnabled = device.isActive && device.healthCheckEnabled
        
        await Device.findByIdAndUpdate(device._id, {
          healthStatus,
          checkingEnabled: isCheckingEnabled,
          lastHealthCheck: new Date()
        })
      }
      
      console.log('✅ [HardwareHealthChecker] Health statuses synced successfully')
      
    } catch (error) {
      console.error('❌ [HardwareHealthChecker] Error syncing health statuses:', error)
      throw error
    }
  }

  /**
   * ФАЗА 2: Валидиране на устройства за изпълнение на flow
   * Този метод проверява всички устройства в flow-то и определя дали може да се изпълни
   */
  async validateFlowDevices(flowData: any): Promise<FlowValidationResult> {
    // За мониторинг на flow device validation - comprehensive flow readiness checking със critical device analysis
    try {
      // this.logger.info(LogTags.flow.validate.passed, {
      //   message: 'Starting flow device validation'
      // }, {
      //   source: { file: 'HardwareHealthChecker.ts', method: 'validateFlowDevices' },
      //   business: { category: 'flow', operation: 'validation' }
      // })
      
      // 1. Извличаме всички deviceId от блоковете в потока
      const deviceIds = this.extractDeviceIdsFromFlow(flowData)
      
      if (deviceIds.length === 0) {
        // this.logger.info(LogTags.flow.validate.passed, {
        //   message: 'No devices found in flow - allowing execution'
        // }, {
        //   source: { file: 'HardwareHealthChecker.ts', method: 'validateFlowDevices' },
        //   business: { category: 'flow', operation: 'validation' }
        // })
        return {
          isValid: true,
          canExecute: true,
          issues: [],
          offlineDevices: [],
          criticalFailures: []
        }
      }

      // this.logger.info(LogTags.flow.validate.passed, {
      //   message: 'Found devices to validate',
      //   deviceCount: deviceIds.length,
      //   deviceIds: deviceIds
      // }, {
      //   source: { file: 'HardwareHealthChecker.ts', method: 'validateFlowDevices' },
      //   business: { category: 'flow', operation: 'validation' }
      // })

      // 2. Извличаме устройствата от базата данни с populated контролери
      const devices = await Device.find({ 
        _id: { $in: deviceIds },
        isActive: true 
      }).populate('controllerId')

      const issues: string[] = []
      const offlineDevices: string[] = []
      const criticalFailures: string[] = []
      let canExecute = true

      // 3. За всяко устройство проверяваме:
      for (const device of devices) {
        const controller = device.controllerId as any
        
        if (!controller) {
          const issue = `Device "${device.name}" has no associated controller`
          issues.push(issue)
          offlineDevices.push(device.name)
          if (device.priority === 'critical') {
            criticalFailures.push(issue)
            canExecute = false
          }
          continue
        }

        // Проверяваме статуса на контролера
        if (controller.status !== 'online') {
          const issue = `Device "${device.name}" controller "${controller.name}" is ${controller.status}`
          issues.push(issue)
          offlineDevices.push(device.name)
          
          // Критични устройства блокират изпълнението
          if (device.priority === 'critical') {
            criticalFailures.push(issue)
            canExecute = false
          }
        }

        // Проверяваме здравословното състояние на устройството
        if (device.healthStatus === 'error' || device.healthStatus === 'unknown') {
          const issue = `Device "${device.name}" health status is ${device.healthStatus}`
          issues.push(issue)
          
          if (device.priority === 'critical') {
            criticalFailures.push(issue)
            canExecute = false
          }
        }

        // Enhanced sensor validation for sensors with validation config
        if (device.category === 'sensor' && controller.status === 'online' && device.validationConfig?.enabled) {
          try {
            await this.initializeSensorValidator()

            if (this.sensorHealthValidator) {
              const sensorResult = await this.sensorHealthValidator.validateSensorHealth(device)
              
              if (sensorResult.status === 'UNHEALTHY') {
                const issue = `Sensor "${device.name}" validation failed: ${sensorResult.message}`
                issues.push(issue)
                
                if (device.priority === 'critical') {
                  criticalFailures.push(issue)
                  canExecute = false
                }
              } else if (sensorResult.status === 'WARNING') {
                const issue = `Sensor "${device.name}" has warnings: ${sensorResult.message}`
                issues.push(issue)
                // Warnings don't block execution for non-critical devices
                if (device.priority === 'critical') {
                  this.logger.warn(LogTags.sensor.validation.failed, {
                    message: 'Critical sensor has warnings',
                    issue: issue
                  }, {
                    source: { file: 'HardwareHealthChecker.ts', method: 'validateFlowDevices' },
                    business: { category: 'sensor', operation: 'validation' },
                    deviceId: device._id.toString()
                  })
                }
              }
            }
          } catch (sensorError) {
            const issue = `Sensor "${device.name}" validation error: ${sensorError instanceof Error ? sensorError.message : String(sensorError)}`
            issues.push(issue)
            
            // Sensor validation errors are treated as warnings unless critical device
            if (device.priority === 'critical') {
              criticalFailures.push(issue)
              canExecute = false
            }
          }
        }
      }

      // 4. Проверяваме за липсващи устройства
      const foundDeviceIds = devices.map(d => d._id.toString())
      const missingDeviceIds = deviceIds.filter(id => !foundDeviceIds.includes(id))
      
      for (const missingId of missingDeviceIds) {
        const issue = `Device with ID "${missingId}" not found or inactive`
        issues.push(issue)
        offlineDevices.push(`Unknown Device (${missingId})`)
        criticalFailures.push(issue) // Липсващи устройства винаги блокират
        canExecute = false
      }

      // 5. Генериране на резултат
      const result: FlowValidationResult = {
        isValid: issues.length === 0,
        canExecute,
        issues,
        offlineDevices,
        criticalFailures
      }

      // 6. Логинг на резултата
      if (result.canExecute) {
        // this.logger.info(LogTags.flow.validate.passed, {
        //   message: 'Flow validation passed',
        //   devicesValidated: devices.length
        // }, {
        //   source: { file: 'HardwareHealthChecker.ts', method: 'validateFlowDevices' },
        //   business: { category: 'flow', operation: 'validation' }
        // })
        if (result.issues.length > 0) {
          this.logger.warn(LogTags.flow.validate.failed, {
            message: 'Non-critical issues found',
            issues: result.issues
          }, {
            source: { file: 'HardwareHealthChecker.ts', method: 'validateFlowDevices' },
            business: { category: 'flow', operation: 'validation' }
          })
        }
      } else {
        this.logger.error(LogTags.flow.validate.failed, {
          message: 'Flow validation failed - critical failures',
          criticalFailures: result.criticalFailures
        }, {
          source: { file: 'HardwareHealthChecker.ts', method: 'validateFlowDevices' },
          business: { category: 'flow', operation: 'validation' }
        })
      }

      return result

    } catch (error) {
      this.logger.error(LogTags.flow.validate.failed, {
        message: 'Flow validation error',
        error: error
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'validateFlowDevices' },
        business: { category: 'flow', operation: 'validation' }
      })
      
      // При грешка в валидацията, блокираме изпълнението за безопасност
      return {
        isValid: false,
        canExecute: false,
        issues: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        offlineDevices: [],
        criticalFailures: [`Critical validation failure: ${error instanceof Error ? error.message : String(error)}`]
      }
    }
  }

  /**
   * 🆕 PRE-EXECUTION: Real-time refresh на критичните контролери преди validation
   * Този метод прави ping на контролерите на критичните устройства от flow-а
   * и обновява техния статус в базата данни ако има промени
   */
  async refreshCriticalControllersStatus(flowData: any): Promise<void> {
    // За мониторинг на critical controller refresh - real-time ping операции преди flow execution
    try {
      // this.logger.info(LogTags.controller.health.online, {
      //   message: 'Starting pre-execution critical controller refresh'
      // }, {
      //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
      //   business: { category: 'controller', operation: 'refresh' }
      // })
      
      // 1. Извличаме всички deviceId от flow-а
      const deviceIds = this.extractDeviceIdsFromFlow(flowData)
      
      if (deviceIds.length === 0) {
        // this.logger.info(LogTags.controller.health.online, {
        //   message: 'No devices in flow - skipping controller refresh'
        // }, {
        //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
        //   business: { category: 'controller', operation: 'refresh' }
        // })
        return
      }
      
      // 2. Намираме устройствата с техните контролери (базирано на настройки, не приоритет)
      const devicesInFlow = await Device.find({ 
        _id: { $in: deviceIds },
        isActive: true,
        healthCheckEnabled: true // Базирано на настройки
      }).populate('controllerId')
      
      if (devicesInFlow.length === 0) {
        // this.logger.info(LogTags.controller.health.online, {
        //   message: 'No enabled devices in flow - skipping controller refresh'
        // }, {
        //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
        //   business: { category: 'controller', operation: 'refresh' }
        // })
        return
      }
      
      // 3. Събираме уникалните контролери
      const controllersToCheck = new Map()
      
      for (const device of devicesInFlow) {
        const controller = device.controllerId as any
        if (controller && !controllersToCheck.has(controller._id.toString())) {
          controllersToCheck.set(controller._id.toString(), {
            controller,
            devices: [device]
          })
        } else if (controller && controllersToCheck.has(controller._id.toString())) {
          controllersToCheck.get(controller._id.toString()).devices.push(device)
        }
      }
      
      // this.logger.info(LogTags.controller.health.online, {
      //   message: 'Found controllers for enabled devices',
      //   controllersCount: controllersToCheck.size,
      //   enabledDevicesCount: devicesInFlow.length
      // }, {
      //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
      //   business: { category: 'controller', operation: 'refresh' }
      // })
      
      // 4. Ping всеки контролер и обновяваме статуса ако е нужно
      for (const [controllerId, data] of controllersToCheck) {
        const { controller, devices } = data
        
        try {
          // this.logger.info(LogTags.controller.health.online, {
          //   message: 'Testing controller',
          //   controllerName: controller.name,
          //   communicationType: controller.communicationBy || controller.ipAddress
          // }, {
          //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
          //   business: { category: 'controller', operation: 'ping_test' },
          //   controllerId: controller._id.toString()
          // })
          
          // Quick ping на контролера
          let isOnline = await this.quickPingController(controller)
          
          // 🔄 NEW: If controller is offline, try reconnection before marking as offline
          if (!isOnline && controller.communicationBy === 'serial') {
            // this.logger.info(LogTags.controller.health.offline, {
            //   message: 'Serial controller offline - attempting reconnection',
            //   controllerName: controller.name
            // }, {
            //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
            //   business: { category: 'controller', operation: 'reconnection' },
            //   controllerId: controller._id.toString()
            // })
            
            try {
              const startupService = await this.getStartupService()
              const reconnectSuccess = await startupService.reconnectController(controller._id.toString())
              
              if (reconnectSuccess) {
                // this.logger.info(LogTags.controller.connect.success, {
                //   message: 'Successfully reconnected serial controller',
                //   controllerName: controller.name
                // }, {
                //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
                //   business: { category: 'controller', operation: 'reconnection' },
                //   controllerId: controller._id.toString()
                // })
                // Test again after reconnection
                isOnline = await this.quickPingController(controller)
              } else {
                this.logger.warn(LogTags.controller.connect.failed, {
                  message: 'Failed to reconnect serial controller',
                  controllerName: controller.name
                }, {
                  source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
                  business: { category: 'controller', operation: 'reconnection' },
                  controllerId: controller._id.toString()
                })
                
                // 🚀 LIFECYCLE NOTIFICATION: Controller Disconnect (Serial Reconnect Failed)
                try {
                  const { notificationService } = await import('./NotificationService')
                  const timestamp = new Date()
                  
                  await notificationService.sendLifecycleNotification('controller_disconnect', {
                    controllerName: controller.name,
                    controllerIp: controller.communicationConfig?.port || 'Serial Connection',
                    deviceName: controller.name,
                    deviceType: 'serial controller',
                    timestamp: timestamp,
                    disconnectTime: timestamp,
                    lastSeen: controller.lastHeartbeat || timestamp
                  })
                  
                  // this.logger.info(LogTags.controller.health.offline, {
                  //   message: 'Serial controller disconnect notification sent for failed reconnect',
                  //   controllerName: controller.name
                  // }, {
                  //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
                  //   business: { category: 'controller', operation: 'notification' },
                  //   controllerId: controller._id.toString()
                  // })
                } catch (lifecycleNotificationError) {
                  this.logger.warn(LogTags.controller.health.offline, {
                    message: 'Failed to send serial disconnect notification',
                    controllerName: controller.name,
                    error: lifecycleNotificationError
                  }, {
                    source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
                    business: { category: 'controller', operation: 'notification' },
                    controllerId: controller._id.toString()
                  })
                }
              }
            } catch (reconnectError) {
              this.logger.warn(LogTags.controller.connect.failed, {
                message: 'Reconnection attempt failed',
                controllerName: controller.name,
                error: reconnectError
              }, {
                source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
                business: { category: 'controller', operation: 'reconnection' },
                controllerId: controller._id.toString()
              })
            }
          }
          
          const newStatus = isOnline ? 'online' : 'offline'
          
          // Обновяваме статуса САМО ако има промяна
          if (controller.status !== newStatus) {
            this.logger.warn(LogTags.controller.health.offline, {
              message: 'Controller status change detected',
              controllerName: controller.name,
              oldStatus: controller.status,
              newStatus: newStatus
            }, {
              source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
              business: { category: 'controller', operation: 'status_change' },
              controllerId: controller._id.toString()
            })
            
            // 🚀 LIFECYCLE NOTIFICATION: Controller Status Change
            try {
              const { notificationService } = await import('./NotificationService')
              const eventType = newStatus === 'online' ? 'controller_reconnect' : 'controller_disconnect'
              const timestamp = new Date()
              
              await notificationService.sendLifecycleNotification(eventType, {
                controllerName: controller.name,
                controllerIp: controller.address || 'Unknown',
                deviceName: controller.name,
                deviceType: 'controller',
                timestamp: timestamp,
                disconnectTime: newStatus === 'offline' ? timestamp : undefined,
                reconnectTime: newStatus === 'online' ? timestamp : undefined,
                downtime: newStatus === 'online' && controller.lastHeartbeat 
                  ? `${Math.round((timestamp.getTime() - controller.lastHeartbeat.getTime()) / (1000 * 60))} мин`
                  : undefined,
                lastSeen: controller.lastHeartbeat || timestamp
              })
              
              // this.logger.info(LogTags.controller.health.online, {
              //   message: 'Lifecycle notification sent',
              //   eventType: eventType,
              //   controllerName: controller.name
              // }, {
              //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
              //   business: { category: 'controller', operation: 'notification' },
              //   controllerId: controller._id.toString()
              // })
            } catch (lifecycleNotificationError) {
              this.logger.warn(LogTags.controller.health.offline, {
                message: 'Failed to send lifecycle notification for controller',
                controllerName: controller.name,
                error: lifecycleNotificationError
              }, {
                source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
                business: { category: 'controller', operation: 'notification' },
                controllerId: controller._id.toString()
              })
            }
            
            // Update controller status
            await PhysicalController.findByIdAndUpdate(controller._id, {
              status: newStatus,
              lastHealthCheck: new Date(),
              healthStatus: newStatus === 'online' ? 'healthy' : 'error'
            })
            
            // Update all devices on this controller
            const newDeviceHealthStatus = newStatus === 'online' ? 'healthy' : 'error'
            
            for (const device of devices) {
              // Determine if health checking is currently enabled for this device
              const isCheckingEnabled = device.isActive && device.healthCheckEnabled
              
              await Device.findByIdAndUpdate(device._id, {
                healthStatus: newDeviceHealthStatus,
                checkingEnabled: isCheckingEnabled,
                lastHealthCheck: new Date()
              })
              
              // this.logger.info(LogTags.device.health.online, {
              //   message: 'Updated device health status',
              //   deviceName: device.name,
              //   healthStatus: newDeviceHealthStatus
              // }, {
              //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
              //   business: { category: 'device', operation: 'status_update' },
              //   deviceId: device._id.toString()
              // })
            }
            
          } else {
            // this.logger.info(LogTags.controller.health.online, {
            //   message: 'Controller status confirmed',
            //   controllerName: controller.name,
            //   status: controller.status
            // }, {
            //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
            //   business: { category: 'controller', operation: 'status_check' },
            //   controllerId: controller._id.toString()
            // })
          }
          
        } catch (pingError) {
          this.logger.error(LogTags.controller.health.offline, {
            message: 'Failed to test controller',
            controllerName: controller.name,
            error: pingError
          }, {
            source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
            business: { category: 'controller', operation: 'ping_test' },
            controllerId: controller._id.toString()
          })
          
          // При грешка в ping-а, маркираме като offline ако не е вече
          if (controller.status !== 'offline') {
            this.logger.warn(LogTags.controller.health.offline, {
              message: 'Marking controller as offline due to test failure',
              controllerName: controller.name
            }, {
              source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
              business: { category: 'controller', operation: 'status_change' },
              controllerId: controller._id.toString()
            })
            
            await PhysicalController.findByIdAndUpdate(controller._id, {
              status: 'offline',
              lastHealthCheck: new Date(),
              healthStatus: 'unhealthy'
            })
            
            // Update devices to error state
            for (const device of devices) {
              // Determine if health checking is currently enabled for this device
              const isCheckingEnabled = device.isActive && device.healthCheckEnabled
              
              await Device.findByIdAndUpdate(device._id, {
                healthStatus: 'error',
                checkingEnabled: isCheckingEnabled,
                lastHealthCheck: new Date()
              })
            }
          }
        }
      }
      
      // this.logger.info(LogTags.controller.health.online, {
      //   message: 'Pre-execution controller refresh completed',
      //   controllersCount: controllersToCheck.size
      // }, {
      //   source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
      //   business: { category: 'controller', operation: 'refresh' }
      // })
      
    } catch (error) {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'Controller refresh failed',
        error: error
      }, {
        source: { file: 'HardwareHealthChecker.ts', method: 'refreshCriticalControllersStatus' },
        business: { category: 'controller', operation: 'refresh' }
      })
      // Не хвърляме грешка - ще продължим с обичайната validation
    }
  }
}