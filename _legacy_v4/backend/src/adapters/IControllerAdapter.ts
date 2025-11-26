/**
 * Controller Adapter Interface
 * 
 * Unified interface for all controller communication protocols.
 * Provides standardized methods for initializing connections, sending commands,
 * and managing controller lifecycle regardless of the underlying protocol
 * (Serial, HTTP, MQTT, Bluetooth, etc.)
 */

import { IPhysicalController } from '../models/PhysicalController'

// Re-export existing types from StartupService for consistency
export interface IStartupCommand {
  cmd: string
  pin?: number | string
  state?: number
  port?: number | string
  value?: number
  deviceId?: string
  relayLogic?: 'active_high' | 'active_low'
  data?: any
  pins?: Array<{p: number, s: number}> // For BATCH command
  duration?: number
  powerLevel?: number
  powerFrom?: number
  powerTo?: number
  direction?: 'up' | 'down'
  // Template-based execution parameters
  actionType?: string
  triggerPin?: number
  echoPin?: number
  maxDistance?: number
  timeout?: number
}

export interface IStartupResponse {
  ok: number
  message?: string
  error?: string
  port?: number | string
  data?: any
  value?: any
  timestamp?: number
  status?: string
  volt?: number
  duration?: number
  unit?: string
  state?: number
}

// Connection result interface
export interface IConnectionResult {
  success: boolean
  controllerId: string
  protocol: string
  connectionInfo?: any
  error?: string
}

/**
 * Main Controller Adapter Interface
 * 
 * All controller adapters must implement this interface to ensure
 * consistent behavior across different communication protocols.
 */
export interface IControllerAdapter {
  // Core properties
  readonly controllerId: string
  readonly protocol: string
  readonly isConnected: boolean

  // Connection management
  initialize(controller: IPhysicalController): Promise<IConnectionResult>
  disconnect(): Promise<void>
  
  // Command execution - uses existing StartupService types
  sendCommand(command: IStartupCommand): Promise<IStartupResponse>
  
  // Health checking
  isHealthy(): Promise<boolean>
  ping(): Promise<boolean>
  
  // Pin state management
  restorePinStates(controller: IPhysicalController): Promise<void>
  
  // Optional protocol-specific methods
  getConnectionInfo?(): any
  updateConfig?(config: any): Promise<void>
}

/**
 * Controller Adapter Factory Interface
 */
export interface IControllerAdapterFactory {
  createAdapter(
    controllerId: string, 
    controller: IPhysicalController
  ): Promise<IControllerAdapter>
  
  getSupportedProtocols(): string[]
  isProtocolSupported(protocol: string): boolean
}

/**
 * Adapter Configuration Interface
 */
export interface IAdapterConfig {
  controllerId: string
  protocol: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  [key: string]: any // Protocol-specific configuration
}