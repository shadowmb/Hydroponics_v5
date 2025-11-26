import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { IProtocolAdapter, ISerialConfig } from '../../types/ProtocolTypes'
import { IDeviceCommand, IHardwareResponse, HardwareError, HardwareErrorType } from '../../types/HardwareTypes'

export class SerialAdapter implements IProtocolAdapter {
  private serialPort?: SerialPort
  private parser?: ReadlineParser
  private connected = false

  constructor(private config: ISerialConfig) {}

  async connect(): Promise<boolean> {
    try {
      this.serialPort = new SerialPort({
        path: this.config.port,
        baudRate: this.config.baudRate,
        autoOpen: true
      })

      this.parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }))
      
      // Wait for port to open and Arduino ready signal
      return new Promise((resolve, reject) => {
        const READY_TIMEOUT = 10000 // 10 seconds max wait for ready signal
        let readyTimeout: NodeJS.Timeout
        
        const cleanup = () => {
          if (readyTimeout) clearTimeout(readyTimeout)
          this.parser?.off('data', onData)
        }

        const onData = (data: string) => {
          console.log(`[SerialAdapter] Startup data received: "${data}"`)
          
          try {
            const cleanData = data.replace(/\r?\n/g, '').trim()
            if (cleanData.length === 0) return
            
            const message = JSON.parse(cleanData)
            
            // Look for Arduino ready signal
            if (message.status === 'ready') {
              console.log(`[SerialAdapter] Arduino ready signal received: ${message.message}`)
              cleanup()
              resolve(true)
            }
          } catch (error) {
            console.log(`[SerialAdapter] Non-JSON startup data: "${data}" - ignoring`)
            // Ignore non-JSON data during startup
          }
        }

        this.serialPort!.on('open', () => {
          console.log(`[SerialAdapter] Port opened successfully: ${this.config.port}`)
          this.connected = true
          
          // Prevent Arduino reset to maintain port states
          this.serialPort!.set({ dtr: false, rts: false }, (err) => {
            if (err) {
              console.log(`[SerialAdapter] DTR/RTS set error: ${err}`)
            } else {
              console.log(`[SerialAdapter] DTR/RTS disabled to prevent Arduino reset`)
            }
          })
          
          // Listen for ready signal with timeout
          this.parser!.on('data', onData)
          
          readyTimeout = setTimeout(() => {
            cleanup()
            console.log(`[SerialAdapter] Timeout waiting for Arduino ready signal`)
            reject(new Error('Timeout waiting for Arduino ready signal'))
          }, READY_TIMEOUT)
          
          console.log(`[SerialAdapter] Waiting for Arduino ready signal...`)
        })
        
        this.serialPort!.on('error', (error) => {
          console.log(`[SerialAdapter] Port open error: ${error}`)
          cleanup()
          reject(error)
        })
      })
    } catch (error) {
      throw new HardwareError(
        HardwareErrorType.COMMUNICATION_TIMEOUT,
        `Failed to connect to serial port ${this.config.port}: ${(error as Error).message}`
      )
    }
  }

  async disconnect(): Promise<void> {
    if (this.serialPort && this.connected) {
      return new Promise((resolve) => {
        this.serialPort!.close((err) => {
          if (err) {
            console.log(`[SerialAdapter] Error closing port: ${err}`)
          } else {
            console.log('[SerialAdapter] Serial connection closed successfully')
          }
          this.connected = false
          resolve()
        })
      })
    } else if (this.serialPort) {
      // Force close even if not marked as connected
      return new Promise((resolve) => {
        this.serialPort!.close((err) => {
          if (err) console.log(`[SerialAdapter] Error force-closing port: ${err}`)
          this.connected = false
          resolve()
        })
      })
    }
    this.connected = false
  }

  async sendCommand(command: IDeviceCommand): Promise<IHardwareResponse> {
    if (!this.connected || !this.serialPort || !this.parser) {
      throw new HardwareError(HardwareErrorType.CONTROLLER_OFFLINE, 'Serial adapter not connected')
    }

    try {
      const serialCommand = JSON.stringify({
        cmd: command.action,
        port: command.value, // For new Arduino code: port number
        deviceId: command.deviceId,
        value: command.value,
        duration: command.duration,
        timestamp: Date.now()
      })

      console.log(`[SerialAdapter] Sending command: ${serialCommand}`)
      
      // Clear any pending data in buffer first
      // this.serialPort.flush()
      
      // Skip any startup message that might be in buffer
      // try {
      //   await this.waitForResponse(1000) // Skip startup message
      // } catch {} // Ignore timeout
      
      // Send command to Arduino
      this.serialPort.write(serialCommand + '\n')

      // Wait for actual response with timeout
      const response = await this.waitForResponse()
      
      console.log(`[SerialAdapter] Received response: ${JSON.stringify(response)}`)

      return {
        success: response.ok === 1,
        value: response.value,
        error: response.ok === 0 ? response.error : undefined,
        details: response, // Pass full Arduino response for detailed info
        timestamp: new Date()
      }
    } catch (error) {
      throw new HardwareError(
        HardwareErrorType.COMMAND_FAILED,
        `Serial command failed: ${(error as Error).message}`,
        command.deviceId
      )
    }
  }

  private async waitForResponse(customTimeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log(`[SerialAdapter] Setting up response listener with ${customTimeout || this.config.timeout}ms timeout`)
      
      const timeout = setTimeout(() => {
        console.log(`[SerialAdapter] Response timeout after ${customTimeout || this.config.timeout}ms`)
        reject(new Error('Response timeout'))
      }, customTimeout || this.config.timeout)

      const onData = (data: string) => {
        console.log(`[SerialAdapter] Raw data received: "${data}"`)
        clearTimeout(timeout)
        this.parser!.off('data', onData)
        
        try {
          const cleanData = data.replace(/\r?\n/g, '').trim()
          console.log(`[SerialAdapter] Cleaned data: "${cleanData}"`)
          
          if (cleanData.length === 0) {
            console.log(`[SerialAdapter] Empty response received`)
            reject(new Error(`Empty response received`))
            return
          }
          
          const response = JSON.parse(cleanData)
          console.log(`[SerialAdapter] Parsed JSON: ${JSON.stringify(response)}`)
          resolve(response)
        } catch (error) {
          console.log(`[SerialAdapter] JSON parse error: ${error}`)
          reject(new Error(`Invalid JSON response: ${data}`))
        }
      }

      this.parser!.on('data', onData)
      console.log(`[SerialAdapter] Data listener attached`)
    })
  }

  isConnected(): boolean {
    return this.connected
  }

  async healthCheck(): Promise<{ success: boolean; message?: string; details?: any }> {
    if (!this.connected || !this.serialPort || !this.parser) {
      return { success: false, message: 'Serial adapter not connected' }
    }

    try {
      const pingCommand = JSON.stringify({
        cmd: 'PING',
        timestamp: Date.now()
      })

      console.log(`[SerialAdapter] Health check: sending PING command: ${pingCommand}`)
      
      // Send PING command
      this.serialPort.write(pingCommand + '\n')
      console.log(`[SerialAdapter] PING command written to serial port`)
      
      console.log(`[SerialAdapter] Waiting for Arduino response...`)
      // Now wait for response
      const response = await this.waitForResponse(10000) // 10 second timeout for health check
      
      console.log(`[SerialAdapter] Health check response: ${JSON.stringify(response)}`)

      if (response.ok === 1 && response.pong === 1) {
        return {
          success: true,
          message: 'Arduino is responsive',
          details: {
            uptime: response.uptime,
            freeMemory: response.freeMemory,
            version: response.version
          }
        }
      } else {
        return {
          success: false,
          message: 'Invalid PING response from Arduino',
          details: response
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Health check failed: ${(error as Error).message}`
      }
    }
  }

  private getMockSensorValue(action: string): number {
    const mockValues: Record<string, number> = {
      'READ_SENSOR': 23.5,
      'READ_PH': 6.8,
      'READ_EC': 1.2,
      'READ_TEMP': 24.1,
      'READ_HUMIDITY': 65.3
    }
    
    return mockValues[action] || Math.random() * 100
  }
}