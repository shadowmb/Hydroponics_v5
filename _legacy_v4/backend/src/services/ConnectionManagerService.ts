// ABOUTME: ConnectionManagerService manages all active controller connections and provides connection operations
// ABOUTME: Extracted from StartupService as part of delegation pattern refactoring (Phase 2)

import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { IControllerAdapter } from '../adapters'
import { LogTags } from '../utils/LogTags'

export class ConnectionManagerService {
  private static instance: ConnectionManagerService
  private activeConnections: Map<string, SerialPort> = new Map() // TODO: LEGACY - Remove after adapter migration
  private activeParsers: Map<string, ReadlineParser> = new Map() // TODO: LEGACY - Remove after adapter migration
  private activeAdapters: Map<string, IControllerAdapter> = new Map()
  private logger = UnifiedLoggingService.createModuleLogger('ConnectionManagerService.ts')

  constructor() {
    // Initialize connection manager
  }

  static getInstance(): ConnectionManagerService {
    if (!ConnectionManagerService.instance) {
      ConnectionManagerService.instance = new ConnectionManagerService()
    }
    return ConnectionManagerService.instance
  }

  // Add connection to the manager
  addConnection(controllerId: string, adapter: IControllerAdapter, connection?: SerialPort, parser?: ReadlineParser): void {
    // Store modern adapter
    this.activeAdapters.set(controllerId, adapter)
    
    // Store legacy connections for backward compatibility
    if (connection) {
      this.activeConnections.set(controllerId, connection)
    }
    if (parser) {
      this.activeParsers.set(controllerId, parser)
    }
    
    // this.logger.info(LogTags.controller.connect.success, {
    //   message: 'Controller connection registered',
    //   controllerId: controllerId
    // }, {
    //   source: { file: 'ConnectionManagerService.ts', method: 'addConnection' },
    //   business: { category: 'controller', operation: 'connection_registered' },
    //   controllerId: controllerId
    // })
  }

  // Remove connection from the manager
  async removeConnection(controllerId: string): Promise<void> {
    // this.logger.info(LogTags.controller.disconnect.started, {
    //   message: 'Starting connection removal',
    //   controllerId: controllerId
    // }, {
    //   source: { file: 'ConnectionManagerService.ts', method: 'removeConnection' },
    //   business: { category: 'controller', operation: 'connection_removal' },
    //   controllerId: controllerId
    // })
    
    try {
      // Close adapter connection
      const adapter = this.activeAdapters.get(controllerId)
      if (adapter && adapter.disconnect) {
        await adapter.disconnect()
        this.activeAdapters.delete(controllerId)
      }

      // Close legacy serial connection  
      const serialPort = this.activeConnections.get(controllerId)
      if (serialPort && serialPort.isOpen) {
        const parser = this.activeParsers.get(controllerId)
        if (parser) {
          parser.removeAllListeners()
          parser.destroy()
          this.activeParsers.delete(controllerId)
        }
        
        await serialPort.close()
        this.activeConnections.delete(controllerId)
      }

      // this.logger.info(LogTags.controller.disconnect.success, {
      //   message: 'Controller connection removed successfully',
      //   controllerId: controllerId
      // }, {
      //   source: { file: 'ConnectionManagerService.ts', method: 'removeConnection' },
      //   business: { category: 'controller', operation: 'connection_removed' },
      //   controllerId: controllerId
      // })
    } catch (error) {
      this.logger.error(LogTags.controller.disconnect.failed, {
        message: 'Error removing controller connection',
        controllerId: controllerId,
        error: error
      }, {
        source: { file: 'ConnectionManagerService.ts', method: 'removeConnection' },
        business: { category: 'controller', operation: 'connection_removal', severity: 'high' },
        controllerId: controllerId
      })
      throw error
    }
  }

  // Get adapter connection
  getAdapter(controllerId: string): IControllerAdapter | undefined {
    return this.activeAdapters.get(controllerId)
  }

  // Get legacy serial connection (backward compatibility)
  getSerialConnection(controllerId: string): SerialPort | undefined {
    return this.activeConnections.get(controllerId)
  }

  // Get legacy parser (backward compatibility)
  getParser(controllerId: string): ReadlineParser | undefined {
    return this.activeParsers.get(controllerId)
  }

  // Check if controller is connected
  isConnected(controllerId: string): boolean {
    // Primary: Check adapter connection
    const adapter = this.activeAdapters.get(controllerId)
    if (adapter) {
      return adapter.isConnected
    }
    
    // Fallback: Check legacy serial connection
    const serialPort = this.activeConnections.get(controllerId)
    return serialPort ? serialPort.isOpen : false
  }

  // Get all active connection IDs
  getActiveConnectionIds(): string[] {
    return Array.from(this.activeAdapters.keys())
  }

  // Get connection counts for monitoring
  getConnectionCounts(): { adapters: number, serialConnections: number, parsers: number } {
    return {
      adapters: this.activeAdapters.size,
      serialConnections: this.activeConnections.size,
      parsers: this.activeParsers.size
    }
  }

  // Test connection with retry logic (for manual troubleshooting)
  async testConnection(controllerId: string, maxRetries: number = 3): Promise<{
    success: boolean
    attempts: number
    lastError?: string
  }> {
    console.log(`\n🧪 [TEST CONNECTION] Starting for controller: ${controllerId}`)
    console.log(`   Max retries: ${maxRetries}`)

    let lastError: string | undefined

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\n🔄 [TEST CONNECTION] Attempt ${attempt}/${maxRetries}`)

      try {
        const adapter = await this.recreateAdapter(controllerId)

        if (adapter) {
          console.log(`📡 [TEST CONNECTION] Testing PING...`)
          const pingResult = await adapter.ping()

          if (pingResult) {
            console.log(`✅ [TEST CONNECTION] SUCCESS on attempt ${attempt}`)
            return {
              success: true,
              attempts: attempt
            }
          } else {
            lastError = 'PING failed'
            console.log(`❌ [TEST CONNECTION] PING failed on attempt ${attempt}`)
          }
        } else {
          lastError = 'Failed to recreate adapter'
          console.log(`❌ [TEST CONNECTION] Failed to recreate adapter on attempt ${attempt}`)
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        console.log(`❌ [TEST CONNECTION] Exception on attempt ${attempt}: ${lastError}`)
      }

      // Wait before next retry (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`⏳ [TEST CONNECTION] Waiting 2 seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log(`❌ [TEST CONNECTION] FAILED after ${maxRetries} attempts`)
    console.log(`   Last error: ${lastError}`)

    return {
      success: false,
      attempts: maxRetries,
      lastError
    }
  }

  // Recreate adapter (for USB disconnect/reconnect scenarios)
  async recreateAdapter(controllerId: string): Promise<IControllerAdapter | null> {
    try {
      console.log(`\n🔄 [RECREATE ADAPTER] Starting for controller: ${controllerId}`)

      this.logger.info(LogTags.controller.connect.success, {
        message: 'Recreating adapter for controller',
        controllerId: controllerId
      }, {
        source: { file: 'ConnectionManagerService.ts', method: 'recreateAdapter' },
        business: { category: 'controller', operation: 'adapter_recreation' },
        controllerId: controllerId
      })

      // Get controller from database
      const { PhysicalController } = await import('../models/PhysicalController')
      const controller = await PhysicalController.findById(controllerId)

      if (!controller) {
        console.log(`❌ [RECREATE ADAPTER] Controller not found in DB: ${controllerId}`)
        this.logger.error(LogTags.controller.connect.failed, {
          message: 'Controller not found in database',
          controllerId: controllerId
        }, {
          source: { file: 'ConnectionManagerService.ts', method: 'recreateAdapter' },
          business: { category: 'controller', operation: 'adapter_recreation' },
          controllerId: controllerId
        })
        return null
      }

      console.log(`📋 [RECREATE ADAPTER] Found controller: ${controller.name} (${controller.communicationType})`)
      console.log(`   Port: ${controller.communicationConfig?.port || 'N/A'}`)

      // Remove old adapter
      console.log(`🗑️  [RECREATE ADAPTER] Removing old adapter...`)
      await this.removeConnection(controllerId)
      console.log(`✅ [RECREATE ADAPTER] Old adapter removed`)

      // Create new adapter
      console.log(`🔨 [RECREATE ADAPTER] Creating new adapter...`)
      const { ControllerAdapterFactory } = await import('../adapters')
      const factory = ControllerAdapterFactory.getInstance()
      const newAdapter = await factory.createAdapter(controllerId, controller)
      console.log(`✅ [RECREATE ADAPTER] New adapter created`)

      // Initialize new adapter
      console.log(`🔌 [RECREATE ADAPTER] Initializing new adapter...`)
      const initResult = await newAdapter.initialize(controller)

      if (initResult.success) {
        // Register new adapter
        this.addConnection(controllerId, newAdapter)
        console.log(`✅ [RECREATE ADAPTER] SUCCESS - Adapter recreated and registered`)

        this.logger.info(LogTags.controller.connect.success, {
          message: 'Adapter recreated successfully',
          controllerId: controllerId
        }, {
          source: { file: 'ConnectionManagerService.ts', method: 'recreateAdapter' },
          business: { category: 'controller', operation: 'adapter_recreation' },
          controllerId: controllerId
        })

        return newAdapter
      } else {
        console.log(`❌ [RECREATE ADAPTER] FAILED - Init error: ${initResult.error}`)
        this.logger.warn(LogTags.controller.connect.failed, {
          message: 'Failed to initialize recreated adapter',
          controllerId: controllerId,
          error: initResult.error
        }, {
          source: { file: 'ConnectionManagerService.ts', method: 'recreateAdapter' },
          business: { category: 'controller', operation: 'adapter_recreation' },
          controllerId: controllerId
        })

        return null
      }

    } catch (error) {
      console.log(`❌ [RECREATE ADAPTER] EXCEPTION: ${error}`)
      this.logger.error(LogTags.controller.connect.failed, {
        message: 'Error recreating adapter',
        controllerId: controllerId,
        error: error
      }, {
        source: { file: 'ConnectionManagerService.ts', method: 'recreateAdapter' },
        business: { category: 'controller', operation: 'adapter_recreation' },
        controllerId: controllerId
      })
      return null
    }
  }

  // Close all connections (system shutdown)
  async closeAllConnections(): Promise<void> {
    this.logger.info(LogTags.system.shutdown.started, {
      message: 'Closing all controller connections'
    }, {
      source: { file: 'ConnectionManagerService.ts', method: 'closeAllConnections' },
      business: { category: 'system', operation: 'connection_shutdown' }
    })
    
    try {
      // Close all adapter connections
      const adapterPromises = Array.from(this.activeAdapters.entries()).map(async ([controllerId, adapter]) => {
        try {
          this.logger.debug(LogTags.controller.disconnect.started, {
            message: 'Closing adapter connection',
            controllerId: controllerId
          }, {
            source: { file: 'ConnectionManagerService.ts', method: 'closeAllConnections' },
            business: { category: 'controller', operation: 'adapter_shutdown' },
            controllerId: controllerId
          })
          if (adapter.disconnect) {
            await adapter.disconnect()
          }
        } catch (error) {
          this.logger.warn(LogTags.controller.disconnect.failed, {
            message: 'Error closing adapter connection',
            controllerId: controllerId,
            error: error
          }, {
            source: { file: 'ConnectionManagerService.ts', method: 'closeAllConnections' },
            business: { category: 'controller', operation: 'adapter_shutdown' },
            controllerId: controllerId
          })
        }
      })
      
      // Close all legacy serial connections
      const serialPromises = Array.from(this.activeConnections.entries()).map(async ([controllerId, serialPort]) => {
        try {
          this.logger.debug(LogTags.controller.disconnect.started, {
            message: 'Closing serial connection',
            controllerId: controllerId
          }, {
            source: { file: 'ConnectionManagerService.ts', method: 'closeAllConnections' },
            business: { category: 'controller', operation: 'serial_shutdown' },
            controllerId: controllerId
          })
          
          // Clean up parser first
          const parser = this.activeParsers.get(controllerId)
          if (parser) {
            parser.removeAllListeners()
            parser.destroy()
          }
          
          if (serialPort.isOpen) {
            await serialPort.close()
          }
        } catch (error) {
          this.logger.warn(LogTags.controller.disconnect.failed, {
            message: 'Error closing serial connection',
            controllerId: controllerId,
            error: error
          }, {
            source: { file: 'ConnectionManagerService.ts', method: 'closeAllConnections' },
            business: { category: 'controller', operation: 'serial_shutdown' },
            controllerId: controllerId
          })
        }
      })
      
      // Wait for all closures to complete
      await Promise.all([...adapterPromises, ...serialPromises])
      
      // Clear all maps
      this.activeAdapters.clear()
      this.activeConnections.clear()
      this.activeParsers.clear()
      
      this.logger.info(LogTags.system.shutdown.completed, {
        message: 'All controller connections closed successfully'
      }, {
        source: { file: 'ConnectionManagerService.ts', method: 'closeAllConnections' },
        business: { category: 'system', operation: 'connection_shutdown' }
      })
    } catch (error) {
      this.logger.error(LogTags.system.shutdown.failed, {
        message: 'Error during connection cleanup',
        error: error
      }, {
        source: { file: 'ConnectionManagerService.ts', method: 'closeAllConnections' },
        business: { category: 'system', operation: 'connection_shutdown', severity: 'high' }
      })
      throw error
    }
  }

  // Share connections with other services (for delegation pattern)
  shareConnections(): {
    adapters: Map<string, IControllerAdapter>,
    connections: Map<string, SerialPort>,
    parsers: Map<string, ReadlineParser>
  } {
    // Remove spam logging - this method is called frequently during startup

    return {
      adapters: new Map(this.activeAdapters),
      connections: new Map(this.activeConnections),
      parsers: new Map(this.activeParsers)
    }
  }
}