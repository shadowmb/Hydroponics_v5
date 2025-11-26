import mongoose from 'mongoose'

export interface IDeviceCommand {
  deviceId: string
  action: string
  value?: number
  duration?: number
  timestamp?: Date
}

export interface IHardwareResponse {
  success: boolean
  value?: number
  error?: string
  details?: any
  timestamp: Date
}

export interface IControllerConfig {
  controllerId: mongoose.Types.ObjectId
  type: string
  communicationBy: string
  communicationType: string
  config: Record<string, any>
  status: 'online' | 'offline' | 'error' | 'maintenance'
}

export interface IDeviceInfo {
  deviceId: string
  name: string
  type: string
  controllerId: mongoose.Types.ObjectId
  ports: string[]
  isActive: boolean
}

export enum HardwareErrorType {
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  CONTROLLER_OFFLINE = 'CONTROLLER_OFFLINE',
  COMMUNICATION_TIMEOUT = 'COMMUNICATION_TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  COMMAND_FAILED = 'COMMAND_FAILED'
}

export class HardwareError extends Error {
  constructor(
    public type: HardwareErrorType,
    public message: string,
    public deviceId?: string,
    public controllerId?: string
  ) {
    super(message)
    this.name = 'HardwareError'
  }
}