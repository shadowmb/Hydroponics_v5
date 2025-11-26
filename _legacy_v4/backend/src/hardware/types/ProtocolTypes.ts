import { IDeviceCommand, IHardwareResponse } from './HardwareTypes'

export interface IProtocolAdapter {
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  sendCommand(command: IDeviceCommand): Promise<IHardwareResponse>
  isConnected(): boolean
}

export interface ISerialConfig {
  port: string
  baudRate: number
  timeout: number
}

export interface IHttpConfig {
  baseUrl: string
  port: number
  timeout: number
  apiKey?: string
}

export interface IMqttConfig {
  host: string
  port: number
  username?: string
  password?: string
  topic: string
}

export type ProtocolConfig = ISerialConfig | IHttpConfig | IMqttConfig