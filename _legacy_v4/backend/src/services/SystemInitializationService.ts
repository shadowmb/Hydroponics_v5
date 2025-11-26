// ABOUTME: SystemInitializationService handles all system startup and controller initialization logic
// ABOUTME: Extracted from StartupService as part of delegation pattern refactoring

import { PhysicalController, IPhysicalController } from '../models/PhysicalController'
import { Device, IDevice } from '../models/Device'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { ControllerAdapterFactory, IControllerAdapter } from '../adapters'
import { HardwareHealthChecker } from './HardwareHealthChecker'
import { LogTags } from '../utils/LogTags'

type InitializationCallback = (
  controllerId: string, 
  adapter: IControllerAdapter, 
  connection?: SerialPort, 
  parser?: ReadlineParser
) => void

export class SystemInitializationService {
  private static instance: SystemInitializationService
  private adapterFactory: ControllerAdapterFactory
  private healthChecker: HardwareHealthChecker
  private logger = UnifiedLoggingService.createModuleLogger('SystemInitializationService.ts')
  private initializationCallback?: InitializationCallback

  constructor() {
    this.adapterFactory = ControllerAdapterFactory.getInstance()
    this.healthChecker = HardwareHealthChecker.getInstance()
  }

  static getInstance(): SystemInitializationService {
    if (!SystemInitializationService.instance) {
      SystemInitializationService.instance = new SystemInitializationService()
    }
    return SystemInitializationService.instance
  }

  // Callback mechanism to pass initialized connections back to StartupService
  setInitializationCallback(callback: InitializationCallback): void {
    this.initializationCallback = callback
  }

  // Initialize a single controller - used by reconnection logic
  async initializeSingleController(controller: IPhysicalController, isRecoveryAttempt: boolean = false): Promise<void> {
    await this.initializeController(controller, isRecoveryAttempt)
  }

  /**
   * Ensures a controller is initialized and has an active adapter.
   * Idempotent - safe to call multiple times.
   *
   * Use cases:
   * - After creating new controller via UI
   * - After UDP discovery finds active controller
   * - After changing controller status to active
   *
   * @param controllerId - Controller ID to ensure initialization
   * @returns true if initialized, false if controller is not active
   * @throws Error if controller not found or initialization fails
   */
  async ensureControllerInitialized(controllerId: string): Promise<boolean> {
    try {
      // Import ConnectionManagerService to check for existing adapter
      const { ConnectionManagerService } = await import('./ConnectionManagerService')
      const connectionManager = ConnectionManagerService.getInstance()

      // Check if adapter already exists (idempotent check)
      const existingAdapter = connectionManager.getAdapter(controllerId)
      if (existingAdapter) {
        return true // Already initialized
      }

      // Load controller from database
      const controller = await PhysicalController.findById(controllerId).exec()
      if (!controller) {
        throw new Error(`Controller not found: ${controllerId}`)
      }

      // Validate controller is active
      if (!controller.isActive) {
        return false
      }

      // Initialize controller using existing method
      await this.initializeSingleController(controller, false)

      this.logger.info(LogTags.controller.connect.success, {
        message: 'Controller initialized successfully',
        controllerId,
        controllerName: controller.name
      }, {
        source: { file: 'SystemInitializationService.ts', method: 'ensureControllerInitialized' },
        business: { category: 'controller', operation: 'runtime_initialization' }
      })

      return true
    } catch (error) {
      this.logger.error(LogTags.controller.connect.failed, {
        message: 'Failed to ensure controller initialization',
        controllerId,
        error: error instanceof Error ? error.message : String(error)
      }, {
        source: { file: 'SystemInitializationService.ts', method: 'ensureControllerInitialized' },
        business: { category: 'controller', operation: 'runtime_initialization', severity: 'high' }
      })
      throw error
    }
  }

  async initializeControllers(): Promise<void> {
    // this.logger.info(LogTags.system.startup.started, {
    //   message: 'Starting controller initialization process'
    // }, {
    //   source: { file: 'SystemInitializationService.ts', method: 'initializeControllers' },
    //   business: { category: 'system', operation: 'controller_initialization' }
    // })
    
    try {
      // Load all active controllers from database
      const controllers = await this.loadActiveControllers()
      
      
      // Initialize each controller
      for (const controller of controllers) {
        await this.initializeController(controller)
      }

      // this.logger.info(LogTags.system.startup.completed, {
      //   message: 'Controller initialization completed successfully',
      //   controllerCount: controllers.length
      // }, {
      //   source: { file: 'SystemInitializationService.ts', method: 'initializeControllers' },
      //   business: { category: 'system', operation: 'controller_initialization' }
      // })
    } catch (error) {
      this.logger.error(LogTags.system.startup.failed, {
        message: 'Controller initialization failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, {
        source: { file: 'SystemInitializationService.ts', method: 'initializeControllers' },
        business: { category: 'system', operation: 'controller_initialization' }
      })
      throw error
    }
  }

  private async loadActiveControllers(): Promise<IPhysicalController[]> {
    try {
      const controllers = await PhysicalController.find({ 
        isActive: true 
      }).exec()
      
      return controllers
    } catch (error) {
      this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to load controllers from database',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, {
        source: { file: 'SystemInitializationService.ts', method: 'loadActiveControllers' },
        business: { category: 'system', operation: 'database_load' }
      })
      throw error
    }
  }

  async initializeController(controller: IPhysicalController, isRecoveryAttempt: boolean = false): Promise<void> {
    const controllerId = controller._id.toString()
    
    let adapter: IControllerAdapter | undefined
    
    try {
      // Create appropriate adapter using factory
      adapter = await this.adapterFactory.createAdapter(controllerId, controller)
      
      // Initialize the adapter
      const connectionResult = await adapter.initialize(controller)
      
      if (connectionResult.success) {
        // Get legacy connection info for backward compatibility
        let serialPort: SerialPort | undefined
        let parser: ReadlineParser | undefined
        
        if (adapter.protocol === 'raw_serial') {
          const connectionInfo = adapter.getConnectionInfo?.()
          if (connectionInfo?.serialPort && connectionInfo?.parser) {
            serialPort = connectionInfo.serialPort
            parser = connectionInfo.parser
          }
        }
        
        // FIRST: Register connection in StartupService via callback
        if (this.initializationCallback) {
          this.initializationCallback(controllerId, adapter, serialPort, parser)
        }
        
              
        // Simply restore pin states after successful connection
        await adapter.restorePinStates(controller)
        
        // this.logger.info(LogTags.controller.connect.success, {
        //   message: 'Controller initialized successfully',
        //   controllerId,
        //   controllerName: controller.name,
        //   protocol: adapter.protocol
        // }, {
        //   source: { file: 'SystemInitializationService.ts', method: 'initializeController' },
        //   business: { category: 'controller', operation: 'initialization' }
        // })
        
      } else {
        throw new Error(connectionResult.error || `Failed to initialize ${controller.name}`)
      }
      
    } catch (error) {
      // Only log initialization errors during first attempt, not recovery attempts
      if (!isRecoveryAttempt) {
        this.logger.error(LogTags.controller.connect.failed, {
          message: 'Controller initialization failed',
          controllerId,
          controllerName: controller.name,
          error: error instanceof Error ? error.message : String(error),
          //stack: error instanceof Error ? error.stack : undefined
        }, {
          source: { file: 'SystemInitializationService.ts', method: 'initializeController' },
          business: { category: 'controller', operation: 'initialization' }
        })
      }

      // CLEANUP: Disconnect failed adapter to free serial port
      if (adapter && adapter.disconnect) {
        try {
          await adapter.disconnect()
          this.logger.debug(LogTags.controller.disconnect.success, {
            message: 'Failed adapter disconnected for cleanup',
            controllerId,
            controllerName: controller.name
          }, {
            source: { file: 'SystemInitializationService.ts', method: 'initializeController' },
            business: { category: 'controller', operation: 'cleanup' }
          })
        } catch (disconnectError) {
          if (!isRecoveryAttempt) {
            this.logger.warn(LogTags.controller.disconnect.failed, {
              message: 'Failed to cleanup connection',
              controllerId,
              controllerName: controller.name,
              error: disconnectError instanceof Error ? disconnectError.message : String(disconnectError)
            }, {
              source: { file: 'SystemInitializationService.ts', method: 'initializeController' },
              business: { category: 'controller', operation: 'cleanup' }
            })
          }
        }
      }

      // Update controller status to offline
      await this.updateControllerStatus(controller._id.toString(), 'offline')
    }
  }

  private async updateControllerStatus(controllerId: string, status: 'online' | 'offline'): Promise<void> {
    try {
      await PhysicalController.findByIdAndUpdate(
        controllerId,
        { 
          status,
          lastHeartbeat: status === 'online' ? new Date() : undefined
        }
      ).exec()
      
    } catch (error) {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'Failed to update controller status',
        controllerId,
        status,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, {
        source: { file: 'SystemInitializationService.ts', method: 'updateControllerStatus' },
        business: { category: 'controller', operation: 'status_update' }
      })
    }
  }
}