/**
 * HTTP Controller Adapter
 * 
 * Adapter for HTTP/WiFi communication with network-enabled controllers like WeMos D1 R2.
 * Implements HTTP-based Arduino Command Protocol v2.0.
 */

import { UnifiedLoggingService } from '../services/UnifiedLoggingService'
import { IPhysicalController } from '../models/PhysicalController'
import {
  IControllerAdapter,
  IStartupCommand,
  IStartupResponse,
  IConnectionResult
} from './IControllerAdapter'
import { LogTags } from '../utils/LogTags'

export class HttpControllerAdapter implements IControllerAdapter {
  private baseUrl: string = ''
  private httpConfig: any = {}
  private logger = UnifiedLoggingService.createModuleLogger('HttpControllerAdapter.ts')
  private _isConnected: boolean = false

  constructor(
    public readonly controllerId: string,
    private controller: IPhysicalController
  ) {}

  public readonly protocol = 'http'

  get isConnected(): boolean {
    return this._isConnected
  }

  async initialize(controller: IPhysicalController): Promise<IConnectionResult> {
    try {
      // Extract HTTP configuration
      this.httpConfig = controller.communicationConfig

      this.logger.debug(LogTags.controller.connect.success, {
        message: 'HTTP configuration loaded',
        controllerName: controller.name,
        config: this.httpConfig
      }, {
        source: { file: 'HttpControllerAdapter.ts', method: 'initialize' },
        business: { category: 'controller', operation: 'http_configuration' }
      })
      
      if (!this.httpConfig || !this.httpConfig.ip_address) {
        throw new Error(`No HTTP configuration found for controller ${controller.name}. Config: ${JSON.stringify(this.httpConfig)}`)
      }

      // Build base URL from components
      this.baseUrl = `http://${this.httpConfig.ip_address}:${this.httpConfig.port || 80}${this.httpConfig.base_path || ''}`

      this.logger.info(LogTags.controller.connect.success, {
        message: 'HTTP controller setup completed',
        baseUrl: this.baseUrl
      }, {
        source: { file: 'HttpControllerAdapter.ts', method: 'initialize' },
        business: { category: 'controller', operation: 'http_setup' }
      })

      // Pure connection setup - NO ping test (Phase 4.1)
      // Health checks are now handled by HardwareHealthChecker
      this._isConnected = true
      // this.logger.info(LogTags.controller.connect.success, {
      //   message: 'HTTP controller initialized successfully',
      //   controllerName: controller.name
      // }, {
      //   source: { file: 'HttpControllerAdapter.ts', method: 'initialize' },
      //   business: { category: 'controller', operation: 'http_initialization' }
      // })
      
      return {
        success: true,
        controllerId: this.controllerId,
        protocol: this.protocol,
        connectionInfo: {
          baseUrl: this.baseUrl,
          ipAddress: this.httpConfig.ip_address,
          port: this.httpConfig.port || 80
        }
      }

    } catch (error) {
      this.logger.error(LogTags.controller.connect.failed, {
        message: 'HTTP controller initialization failed',
        controllerName: controller.name,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, {
        source: { file: 'HttpControllerAdapter.ts', method: 'initialize' },
        business: { category: 'controller', operation: 'http_initialization' }
      })
      
      this._isConnected = false
      
      return {
        success: false,
        controllerId: this.controllerId,
        protocol: this.protocol,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async disconnect(): Promise<void> {
    // HTTP connections are stateless, just mark as disconnected
    this._isConnected = false
    // this.logger.info(LogTags.controller.disconnect.success, {
    //   message: 'HTTP connection disconnected',
    //   controllerId: this.controllerId
    // }, {
    //   source: { file: 'HttpControllerAdapter.ts', method: 'disconnect' },
    //   business: { category: 'controller', operation: 'http_disconnect' }
    // })
  }

  async sendCommand(command: IStartupCommand): Promise<IStartupResponse> {
    if (!this._isConnected) {
      return {
        ok: 0,
        error: `HTTP controller ${this.controllerId} not connected`
      }
    }

    try {
      // Transform pin numbers to GPIO numbers for WeMos
      const transformedCommand = this.transformCommandForWeMos(command)

      const fullUrl = `${this.baseUrl}/command`
      console.log(`[HttpControllerAdapter] Sending HTTP command to: ${fullUrl}`)
      console.log(`[HttpControllerAdapter] Command payload:`, JSON.stringify(transformedCommand))

      // Send HTTP request to controller
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transformedCommand),
        signal: AbortSignal.timeout(this.httpConfig.timeout || 5000)
      })

      console.log(`[HttpControllerAdapter] HTTP response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        return {
          ok: 0,
          error: `HTTP error: ${response.status} ${response.statusText}`
        }
      }

      // Read full response text first (like Serial adapter does with ReadlineParser)
      const text = await response.text()
      console.log(`[HttpControllerAdapter] HTTP response text:`, text)

      // Parse JSON from complete text
      const data = JSON.parse(text.trim())
      console.log(`[HttpControllerAdapter] HTTP response data:`, JSON.stringify(data))
      
      //this.logger.debug('HTTP Адаптер', `Получен HTTP отговор: ${JSON.stringify(data)}`)
      
      // Convert HTTP response to StartupService format
      if (data.success === true && data.data) {
        return {
          ok: 1,
          message: data.data.message || 'Success',
          value: data.data.value || data.data.duration || data.data.volt,  // Map duration to value
          duration: data.data.duration,  // Keep original duration field
          unit: data.data.unit,          // Keep unit field
          data: data.data,
          timestamp: Date.now()
        }
      } else if (data.success === false) {
        return {
          ok: 0,
          error: data.error || 'HTTP command failed',
          message: data.error
        }
      } else {
        // Direct Arduino response format (fallback) - preserve all fields
        return {
          ...data,  // Spread all Arduino fields (ok, capabilities, up, mem, ver, etc.)
          timestamp: Date.now()  // Add backend timestamp
        }
      }
      
    } catch (error) {
      this.logger.error(LogTags.device.command.failed, {
        message: 'HTTP command execution failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        controllerId: this.controllerId
      }, {
        source: { file: 'HttpControllerAdapter.ts', method: 'sendCommand' },
        business: { category: 'device', operation: 'http_command_execution' }
      })
      
      return {
        ok: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    return this._isConnected && await this.ping()
  }

  async ping(): Promise<boolean> {
    // Used by HardwareHealthChecker for HTTP health verification (Phase 4.3)
    // NO longer used in initialize() - health checks handled separately
    // Updated to use /health endpoint for both WeMos v1 and v2 compatibility
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        return false
      }

      // Try to parse as JSON, fallback to text
      try {
        const data = await response.json() as any
        // WeMos v1/v2 both return status information in JSON
        return data.status === 'online' || data.success === true
      } catch {
        // Fallback for plain text response
        const text = await response.text()
        return text.includes('online') || text.includes('OK')
      }

    } catch (error) {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'HTTP ping failed',
        error: error instanceof Error ? error.message : String(error),
        controllerId: this.controllerId
      }, {
        source: { file: 'HttpControllerAdapter.ts', method: 'ping' },
        business: { category: 'controller', operation: 'http_health_check' }
      })
      return false
    }
  }

  async restorePinStates(controller: IPhysicalController): Promise<void> {
    try {
      // this.logger.info(LogTags.device.command.started, {
      //   message: 'Starting pin state restoration',
      //   controllerName: controller.name
      // }, {
      //   source: { file: 'HttpControllerAdapter.ts', method: 'restorePinStates' },
      //   business: { category: 'device', operation: 'pin_state_restoration' }
      // })
      
      const pinsToCheck = controller.availablePorts.filter(port => 
        port.isActive && 
        port.type === 'digital' && 
        port.currentState !== null && 
        port.currentState !== undefined
      )

      this.logger.debug(LogTags.device.command.started, {
        message: 'Checking digital pins',
        pinsCount: pinsToCheck.length
      }, {
        source: { file: 'HttpControllerAdapter.ts', method: 'restorePinStates' },
        business: { category: 'device', operation: 'pin_state_check' }
      })

      let restoredCount = 0
      
      for (const port of pinsToCheck) {
        try {
          const portNumber = this.extractPortNumber(port.key)
          const expectedState = port.currentState === 'HIGH' ? 1 : 0
          
          // Check if this is a valid GPIO pin for WeMos D1 R2
          if (!this.isValidWeMosPin(portNumber)) {
            //this.logger.debug('HTTP Адаптер', `Пропускане на невалиден WeMos pin: ${port.key} (GPIO${portNumber})`)
            continue
          }
          
          // 1. Read current state from controller
          const currentStateResponse = await this.sendCommand({
            cmd: 'READ',
            pin: portNumber
          })

          if (currentStateResponse.ok !== 1) {
            // Remove repeated port warnings - known configuration issue
            continue
          }

          const currentState = currentStateResponse.value || currentStateResponse.state || 0
          
          // 2. Compare with DB state
          if (currentState === expectedState) {
            //this.logger.debug('HTTP Адаптер', `Порт ${port.key} вече е в правилното състояние: ${port.currentState}`)
            continue
          }

          // 3. Restore pin to DB state only if different
         // this.logger.info('HTTP Адаптер', `Възстановяване на порт ${port.key}: текущо=${currentState}, очаквано=${expectedState}`)
          
          const restoreResponse = await this.sendCommand({
            cmd: 'SET_PIN',
            pin: portNumber,
            state: expectedState
          })

          if (restoreResponse.ok === 1) {
            //this.logger.info('HTTP Адаптер', `Успешно възстановен порт: ${port.key} на ${port.currentState}`)
            restoredCount++
          } else {
            this.logger.warn(LogTags.device.command.failed, {
              message: 'Failed to restore port',
              portKey: port.key,
              error: restoreResponse.error
            }, {
              source: { file: 'HttpControllerAdapter.ts', method: 'restorePinStates' },
              business: { category: 'device', operation: 'pin_state_restoration' }
            })
          }

        } catch (error) {
          this.logger.error(LogTags.device.command.failed, {
            message: 'Error restoring port',
            portKey: port.key,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          }, {
            source: { file: 'HttpControllerAdapter.ts', method: 'restorePinStates' },
            business: { category: 'device', operation: 'pin_state_restoration' }
          })
        }
      }

      //this.logger.info('HTTP Адаптер', `Завършено възстановяване: ${restoredCount} пинове променени от общо ${pinsToCheck.length} проверени.`)

    } catch (error) {
      this.logger.error(LogTags.device.command.failed, {
        message: 'Pin state restoration failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, {
        source: { file: 'HttpControllerAdapter.ts', method: 'restorePinStates' },
        business: { category: 'device', operation: 'pin_state_restoration' }
      })
    }
  }

  getConnectionInfo(): any {
    return {
      baseUrl: this.baseUrl,
      ipAddress: this.httpConfig.ip_address,
      port: this.httpConfig.port || 80,
      basePath: this.httpConfig.base_path || '',
      isConnected: this._isConnected,
      protocol: this.protocol
    }
  }

  async updateConfig(config: any): Promise<void> {
    this.httpConfig = { ...this.httpConfig, ...config }
    
    // Rebuild base URL if IP or port changed
    if (config.ip_address || config.port || config.base_path) {
      this.baseUrl = `http://${this.httpConfig.ip_address}:${this.httpConfig.port || 80}${this.httpConfig.base_path || ''}`
      
      // Test new configuration
      const pingSuccess = await this.ping()
      this._isConnected = pingSuccess
      
      this.logger.info(LogTags.controller.connect.success, {
        message: 'HTTP configuration updated',
        connectionStatus: pingSuccess ? 'OK' : 'FAILED',
        baseUrl: this.baseUrl
      }, {
        source: { file: 'HttpControllerAdapter.ts', method: 'updateConfig' },
        business: { category: 'controller', operation: 'http_config_update' }
      })
    }
  }

  private transformCommandForWeMos(command: IStartupCommand): IStartupCommand {
    // Create a copy to avoid modifying the original
    const transformedCommand = { ...command }
    
    //console.log(`[HttpControllerAdapter] DEBUG: Original command:`, command)
    
    // Convert pin numbers to GPIO numbers for specific parameters
    if (transformedCommand.pin !== undefined) {
      const originalPin = transformedCommand.pin
      transformedCommand.pin = this.pinToGpio(transformedCommand.pin) as any
      //console.log(`[HttpControllerAdapter] DEBUG: Pin transform: ${originalPin} -> ${transformedCommand.pin}`)
    }
    if (transformedCommand.triggerPin !== undefined) {
      transformedCommand.triggerPin = this.pinToGpio(transformedCommand.triggerPin) as any
    }
    if (transformedCommand.echoPin !== undefined) {
      transformedCommand.echoPin = this.pinToGpio(transformedCommand.echoPin) as any
    }
    
    //console.log(`[HttpControllerAdapter] DEBUG: Transformed command:`, transformedCommand)
    return transformedCommand
  }

  private isValidWeMosPin(gpioPin: number): boolean {
    // WeMos D1 R2 invalid/reserved GPIO pins
    const invalidPins = [
      6, 7, 8, 11,  // SPI Flash connections (not accessible)
      9, 10         // SPI Flash (GPIO9, GPIO10) - absolutely forbidden
    ]
    return !invalidPins.includes(gpioPin)
  }

  private pinToGpio(pin: number | string): number | string {
    if (typeof pin === 'string') {
      // For analog pins like "A0", keep them as strings
      if (pin.startsWith('A')) {
        return pin  // Return "A0" as string
      }
      // For digital pins like "D2", extract the number first
      return this.extractPortNumber(pin)
    }
    
    // If it's already a number, check if it needs GPIO mapping
    const pinNumber = pin as number
    const wemosGpioMap: { [key: number]: number } = {
      0: 16,  // D0 → GPIO16
      1: 5,   // D1 → GPIO5  
      2: 4,   // D2 → GPIO4
      3: 0,   // D3 → GPIO0
      4: 2,   // D4 → GPIO2
      5: 14,  // D5 → GPIO14
      6: 12,  // D6 → GPIO12
      7: 13,  // D7 → GPIO13
      8: 15,  // D8 → GPIO15
      9: 3,   // D9 → GPIO3
      10: 1,  // D10 → GPIO1
      11: 9,  // D11 → GPIO9
      12: 10, // D12 → GPIO10
      13: 3,  // D13 → GPIO3
      14: 1   // D14 → GPIO1
    }
    
    return wemosGpioMap[pinNumber] ?? pinNumber
  }

  private extractPortNumber(portKey: string): number {
    // WeMos D1 R2 pin to GPIO mapping
    // Unlike Arduino, WeMos requires actual GPIO numbers for HTTP API
    if (portKey.startsWith('D')) {
      const pinNumber = parseInt(portKey.substring(1))
      const wemosGpioMap: { [key: number]: number } = {
        0: 16,  // D0 → GPIO16
        1: 5,   // D1 → GPIO5  
        2: 4,   // D2 → GPIO4
        3: 0,   // D3 → GPIO0
        4: 2,   // D4 → GPIO2
        5: 14,  // D5 → GPIO14
        6: 12,  // D6 → GPIO12
        7: 13,  // D7 → GPIO13
        8: 15,  // D8 → GPIO15
        9: 3,   // D9 → GPIO3
        10: 1,  // D10 → GPIO1
        11: 9,  // D11 → GPIO9 (HSPI CS0)
        12: 10, // D12 → GPIO10 (HSPI CS1)
        13: 3,  // D13 → GPIO3 (RX)
        14: 1   // D14 → GPIO1 (TX)
      }
      return wemosGpioMap[pinNumber] ?? pinNumber
    } else if (portKey.startsWith('A')) {
      // Analog pins - A0 is the only one on WeMos D1 R2
      return parseInt(portKey.substring(1))
    } else {
      return parseInt(portKey)
    }
  }
}