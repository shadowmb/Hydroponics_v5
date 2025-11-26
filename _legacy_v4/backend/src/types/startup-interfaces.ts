// ABOUTME: Shared interfaces for StartupService and related hardware communication services
// ABOUTME: Centralized type definitions to avoid duplication across services

/**
 * Command interface for hardware operations and device control
 * Used by StartupService, HardwareCommunicationService, and DeviceCommandService
 */
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
  stopOnDisconnect?: boolean
}

/**
 * Response interface for hardware operations and device control
 * Used by StartupService, HardwareCommunicationService, and DeviceCommandService
 */
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
  capabilities?: string[]
}