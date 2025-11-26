import { IProtocolAdapter, IHttpConfig } from '../../types/ProtocolTypes'
import { IDeviceCommand, IHardwareResponse, HardwareError, HardwareErrorType } from '../../types/HardwareTypes'

export class HttpAdapter implements IProtocolAdapter {
  private connected = false

  constructor(private config: IHttpConfig) {}

  async connect(): Promise<boolean> {
    try {
      // TODO: IMPLEMENT_LATER - Real HTTP connection test
      // const response = await fetch(`${this.config.baseUrl}:${this.config.port}/health`)
      // this.connected = response.ok
      
      this.connected = true
      return true
    } catch (error) {
      throw new HardwareError(
        HardwareErrorType.COMMUNICATION_TIMEOUT,
        `Failed to connect to HTTP endpoint ${this.config.baseUrl}:${this.config.port}: ${(error as Error).message}`
      )
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async sendCommand(command: IDeviceCommand): Promise<IHardwareResponse> {
    if (!this.connected) {
      throw new HardwareError(HardwareErrorType.CONTROLLER_OFFLINE, 'HTTP adapter not connected')
    }

    try {
      // TODO: IMPLEMENT_LATER - Real HTTP communication
      // const url = `${this.config.baseUrl}:${this.config.port}/api/device/${command.port}/${command.action}`
      // const response = await fetch(url, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      //   },
      //   body: JSON.stringify({ value: command.value, duration: command.duration })
      // })

      // Mock response for development
      const mockValue = this.getMockSensorValue(command.action)
      
      return {
        success: true,
        value: mockValue,
        timestamp: new Date()
      }
    } catch (error) {
      throw new HardwareError(
        HardwareErrorType.COMMAND_FAILED,
        `HTTP command failed: ${(error as Error).message}`,
        command.deviceId
      )
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  private getMockSensorValue(action: string): number {
    const mockValues: Record<string, number> = {
      'READ_SENSOR': 25.2,
      'READ_PH': 7.1,
      'READ_EC': 1.4,
      'READ_TEMP': 23.8,
      'READ_HUMIDITY': 68.7
    }
    
    return mockValues[action] || Math.random() * 100
  }
}