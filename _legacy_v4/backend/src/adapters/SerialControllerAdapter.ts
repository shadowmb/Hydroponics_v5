/**
 * Serial Controller Adapter
 * 
 * Adapter for Serial/USB communication with Arduino controllers.
 * Wraps existing serial port logic from StartupService.
 */

import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { UnifiedLoggingService } from '../services/UnifiedLoggingService'
import { IPhysicalController } from '../models/PhysicalController'
import { 
  IControllerAdapter, 
  IStartupCommand, 
  IStartupResponse, 
  IConnectionResult 
} from './IControllerAdapter'

export class SerialControllerAdapter implements IControllerAdapter {
  private serialPort?: SerialPort
  private parser?: ReadlineParser
  private logger = UnifiedLoggingService.createModuleLogger('SerialControllerAdapter.ts')

  constructor(
    public readonly controllerId: string,
    private controller: IPhysicalController
  ) {}

  public readonly protocol = 'raw_serial'

  get isConnected(): boolean {
    return this.serialPort?.isOpen || false
  }

  async initialize(controller: IPhysicalController): Promise<IConnectionResult> {
    try {
      //this.logger.info('SerialControllerAdapter.ts', `Серийна инициализация на контролер: ${controller.name}`)
      
      // Extract serial port configuration
      const serialConfig = controller.communicationConfig
      if (!serialConfig || !serialConfig.port) {
        throw new Error(`No serial port configuration found for controller ${controller.name}`)
      }

      // Establish direct serial connection
      const connectionResult = await this.connectToController(
        serialConfig.port,
        serialConfig.baudRate || 9600
      )

      if (connectionResult) {
        this.serialPort = connectionResult.serialPort
        this.parser = connectionResult.parser
        
        this.logger.info('SerialControllerAdapter.ts', `Успешна серийна връзка с контролер: ${controller.name}`)
        
        // 🚀 LIFECYCLE NOTIFICATION: Controller Reconnect (Serial)
        try {
          const { notificationService } = await import('../services/NotificationService')
          const timestamp = new Date()
          
          await notificationService.sendLifecycleNotification('controller_reconnect', {
            controllerName: controller.name,
            controllerIp: 'Serial Connection',
            deviceName: controller.name,
            deviceType: 'serial controller',
            timestamp: timestamp,
            reconnectTime: timestamp,
            downtime: 'неизвестно'
          })
          
          this.logger.info('SerialControllerAdapter.ts', 
            `🔔 Serial controller reconnect notification sent for ${controller.name}`
          )
        } catch (lifecycleNotificationError) {
          this.logger.warn('SerialControllerAdapter.ts', 
            `⚠️ Failed to send serial controller reconnect notification: ${lifecycleNotificationError}`
          )
        }
        
        // Wait a bit for Arduino to stabilize after startup message
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        
        // Pure connection setup - NO ping test (Phase 4.1)  
        // Health checks are now handled by HardwareHealthChecker
        this.logger.info('SerialControllerAdapter.ts', `Серийен контролер инициализиран: ${controller.name}`)

        return {
          success: true,
          controllerId: this.controllerId,
          protocol: this.protocol,
          connectionInfo: {
            port: serialConfig.port,
            baudRate: serialConfig.baudRate || 9600
          }
        }
      } else {
        throw new Error('Failed to establish serial connection')
      }
      
    } catch (error) {
      // Error already logged by underlying connection attempt
      return {
        success: false,
        controllerId: this.controllerId,
        protocol: this.protocol,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log(`\n🔌 [SERIAL ADAPTER] Disconnect called for ${this.controller.name}`)
      console.log(`   Port: ${this.controller.communicationConfig?.port}`)
      console.log(`   isOpen: ${this.serialPort?.isOpen}`)

      if (this.serialPort && this.serialPort.isOpen) {
        console.log(`   Closing serial port...`)

        await new Promise<void>((resolve, reject) => {
          this.serialPort!.close((error) => {
            if (error) {
              console.log(`   ❌ Close error: ${error}`)
              reject(error)
            } else {
              console.log(`   ✅ Port closed successfully`)
              resolve()
            }
          })
        })

        // Clear references
        this.serialPort = undefined
        this.parser = undefined
        console.log(`   ✅ References cleared`)

        this.logger.info('SerialControllerAdapter.ts', `Серийна връзка затворена за контролер: ${this.controllerId}`)

        // 🚀 LIFECYCLE NOTIFICATION: Controller Disconnect (Serial)
        try {
          const { notificationService } = await import('../services/NotificationService')
          const timestamp = new Date()

          await notificationService.sendLifecycleNotification('controller_disconnect', {
            controllerName: this.controller.name,
            controllerIp: 'Serial Connection',
            deviceName: this.controller.name,
            deviceType: 'serial controller',
            timestamp: timestamp,
            disconnectTime: timestamp,
            lastSeen: timestamp
          })

          this.logger.info('SerialControllerAdapter.ts',
            `🔔 Serial controller disconnect notification sent for ${this.controller.name}`
          )
        } catch (lifecycleNotificationError) {
          this.logger.warn('SerialControllerAdapter.ts',
            `⚠️ Failed to send serial controller disconnect notification: ${lifecycleNotificationError}`
          )
        }
      } else {
        console.log(`   ℹ️  Port already closed or not initialized`)
      }
    } catch (error) {
      console.log(`   ❌ [SERIAL ADAPTER] Disconnect exception: ${error}`)
      this.logger.error('SerialControllerAdapter.ts', `Грешка при затваряне на серийна връзка: ${error}`)
      throw error
    }
  }

  async sendCommand(command: IStartupCommand): Promise<IStartupResponse> {
    if (!this.serialPort || !this.serialPort.isOpen || !this.parser) {
      return {
        ok: 0,
        error: `Serial port not connected for controller ${this.controllerId}`
      }
    }

    try {
      // Format command for Arduino protocol
      const commandString = this.formatCommandForArduino(command)
      
      //this.logger.debug('SerialControllerAdapter.ts', `Изпращане на серийна команда: ${commandString}`)
      
      // Send command
      this.serialPort.write(commandString + '\n')
      
      // Wait for response
      const response = await this.waitForResponse(5000) // 5 second timeout
      
      //this.logger.debug('SerialControllerAdapter.ts', `Получен отговор: ${JSON.stringify(response)}`)
      
      return response
      
    } catch (error) {
      this.logger.error('SerialControllerAdapter.ts', `Грешка при изпълнение на серийна команда: ${error}`)
      
      return {
        ok: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    return this.isConnected
  }

  async ping(): Promise<boolean> {
    // Used by HardwareHealthChecker for SERIAL health verification (Phase 4.3) 
    // NO longer used in initialize() - health checks handled separately
    try {
      const response = await this.sendCommand({ cmd: 'PING' })
      return response.ok === 1
    } catch (error) {
      return false
    }
  }

  async restorePinStates(controller: IPhysicalController): Promise<void> {
    try {
      this.logger.info('SerialControllerAdapter.ts', `Възстановяване на състоянието на пиновете на контролер: "${controller.name}"`)
      
      const pinsToCheck = controller.availablePorts.filter(port => 
        port.isActive && 
        port.type === 'digital' && 
        port.currentState !== null && 
        port.currentState !== undefined
      )

      //this.logger.info('SerialControllerAdapter.ts', `Проверяване на ${pinsToCheck.length} цифрови пинове.`)

      let restoredCount = 0
      
      for (const port of pinsToCheck) {
        try {
          const portNumber = this.extractPortNumber(port.key)
          const expectedState = port.currentState === 'HIGH' ? 1 : 0
          
          // 1. Read current state from controller
          const currentStateResponse = await this.sendCommand({
            cmd: 'READ',
            pin: portNumber
          })

          if (currentStateResponse.ok !== 1) {
            this.logger.warn('SerialControllerAdapter.ts', `Не може да се прочете състоянието на порт ${port.key}: ${currentStateResponse.error}`)
            continue
          }

          const currentState = currentStateResponse.value || currentStateResponse.state || 0
          
          // 2. Compare with DB state
          if (currentState === expectedState) {
            //this.logger.debug('SerialControllerAdapter.ts', `Порт ${port.key} вече е в правилното състояние: ${port.currentState}`)
            continue
          }

          // 3. Restore pin to DB state only if different
          //this.logger.info('SerialControllerAdapter.ts', `Възстановяване на порт ${port.key}: текущо=${currentState}, очаквано=${expectedState}`)
          
          const restoreResponse = await this.sendCommand({
            cmd: 'SET_PIN',
            pin: portNumber,
            state: expectedState
          })

          if (restoreResponse.ok === 1) {
            //this.logger.info('SerialControllerAdapter.ts', `Успешно възстановен порт: ${port.key} на ${port.currentState}`)
            restoredCount++
          } else {
            this.logger.warn('SerialControllerAdapter.ts', `Неуспешно възстановяване на порт ${port.key}: ${restoreResponse.error}`)
          }

        } catch (error) {
          this.logger.error('SerialControllerAdapter.ts', `Грешка при възстановяване на порт ${port.key}: ${error}`)
        }
      }

      this.logger.info('SerialControllerAdapter.ts', `Завършено възстановяване: ${restoredCount} пинове променени от общо ${pinsToCheck.length} проверени.`)

    } catch (error) {
      this.logger.error('SerialControllerAdapter.ts', `Грешка при възстановяване на пиновете: ${error}`)
    }
  }

  getConnectionInfo(): any {
    return {
      port: this.controller.communicationConfig?.port,
      baudRate: this.controller.communicationConfig?.baudRate || 9600,
      isOpen: this.serialPort?.isOpen || false,
      protocol: this.protocol,
      serialPort: this.serialPort,
      parser: this.parser
    }
  }

  // Private helper methods (wrapped from StartupService logic)

  private async connectToController(portPath: string, baudRate: number): Promise<{serialPort: SerialPort, parser: ReadlineParser} | null> {
    try {
      console.log(`\n🔌 [CONNECT] Attempting to connect to ${portPath} @ ${baudRate} baud`)

      const serialPort = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        autoOpen: false
      })

      // Open connection
      console.log(`   📂 Opening port...`)
      await new Promise<void>((resolve, reject) => {
        serialPort.open((error) => {
          if (error) {
            console.log(`   ❌ Port open error: ${error.message}`)
            reject(error)
          } else {
            console.log(`   ✅ Port opened successfully`)
            resolve()
          }
        })
      })

      // Wait for Arduino ready signal
      console.log(`   ⏳ Waiting for Arduino startup message (5 sec timeout)...`)
      const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }))

      const isReady = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`   ⏱️  Timeout - No startup message received`)
          resolve(false)
        }, 5000) // 5 second timeout

        parser.once('data', (data: string) => {
          clearTimeout(timeout)
          console.log(`   ✅ Arduino ready message: ${data}`)
          resolve(true)
        })
      })

      if (!isReady) {
        console.log(`   ❌ Connection failed - No Arduino response`)
        this.logger.warn('SerialControllerAdapter', `Не е получено стартиращо съобщение на контролер от порт: ${portPath}`)
        await serialPort.close()
        return null
      }

      console.log(`   ✅ Connection established successfully`)
      return { serialPort, parser }

    } catch (error) {
      console.log(`   ❌ [CONNECT] Exception: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  private formatCommandForArduino(command: IStartupCommand): string {
    // Arduino expects JSON format for commands, not comma-separated
    // This follows Arduino Command Protocol v2.0 as used in original StartupService
    return JSON.stringify(command)
  }

  private async waitForResponse(timeoutMs: number): Promise<IStartupResponse> {
    return new Promise((resolve, reject) => {
      if (!this.parser) {
        reject(new Error('Parser not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        this.parser!.removeAllListeners('data')
        reject(new Error(`Response timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      this.parser.once('data', (data: string) => {
        clearTimeout(timeout)
        
        try {
          // Try to parse JSON response
          const response = JSON.parse(data.trim())
          resolve(response)
        } catch (error) {
          // If not JSON, treat as simple text response
          resolve({
            ok: 1,
            message: data.trim(),
            value: data.trim()
          })
        }
      })
    })
  }

  private extractPortNumber(portKey: string): number {
    // Convert "D2", "A0", etc. to numeric values
    if (portKey.startsWith('D')) {
      return parseInt(portKey.substring(1))
    } else if (portKey.startsWith('A')) {
      return parseInt(portKey.substring(1))
    } else {
      return parseInt(portKey)
    }
  }
}