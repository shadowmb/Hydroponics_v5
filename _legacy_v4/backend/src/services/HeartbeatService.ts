// ABOUTME: HeartbeatService manages flow mode protection for controllers during active execution
// ABOUTME: Provides reference counting for active HIGH pins and automatic heartbeat scheduling

import { UnifiedLoggingService } from './UnifiedLoggingService'
import { ConnectionManagerService } from './ConnectionManagerService'
import { LogTags } from '../utils/LogTags'
import { IStartupCommand, IStartupResponse } from '../adapters'

export class HeartbeatService {
  private static instance: HeartbeatService
  private logger = UnifiedLoggingService.createModuleLogger('HeartbeatService.ts')

  // Track active HIGH pins per controller
  private activePins: Map<string, number> = new Map()

  // Track heartbeat intervals per controller
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map()

  // Heartbeat configuration
  private readonly HEARTBEAT_INTERVAL = 5000 // 5 seconds

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): HeartbeatService {
    if (!HeartbeatService.instance) {
      HeartbeatService.instance = new HeartbeatService()
    }
    return HeartbeatService.instance
  }

  /**
   * Called when a pin is set to HIGH
   * Increments active pin counter and starts heartbeat if first HIGH
   */
  onPinHigh(controllerId: string): void {
    const currentCount = this.activePins.get(controllerId) || 0
    const newCount = currentCount + 1

    this.activePins.set(controllerId, newCount)

    this.logger.info(LogTags.controller.health.online, {
      message: `Pin HIGH tracked for controller`,
      controllerId,
      activePins: newCount
    }, {
      source: { file: 'HeartbeatService.ts', method: 'onPinHigh' },
      business: { category: 'controller', operation: 'pin_high_tracked' },
      controllerId
    })

    // Start heartbeat if this is the first HIGH pin
    if (currentCount === 0) {
      this.startHeartbeat(controllerId)
    }
  }

  /**
   * Called when a pin is set to LOW
   * Decrements active pin counter and stops heartbeat if no more active pins
   */
  onPinLow(controllerId: string): void {
    const currentCount = this.activePins.get(controllerId) || 0
    const newCount = Math.max(0, currentCount - 1)

    if (newCount === 0) {
      this.activePins.delete(controllerId)
      this.stopHeartbeat(controllerId)
    } else {
      this.activePins.set(controllerId, newCount)
    }

    this.logger.info(LogTags.controller.health.offline, {
      message: `Pin LOW tracked for controller`,
      controllerId,
      activePins: newCount
    }, {
      source: { file: 'HeartbeatService.ts', method: 'onPinLow' },
      business: { category: 'controller', operation: 'pin_low_tracked' },
      controllerId
    })
  }

  /**
   * Start heartbeat scheduler for a controller
   */
  private startHeartbeat(controllerId: string): void {
    // Check if already running
    if (this.heartbeatIntervals.has(controllerId)) {
      this.logger.warn(LogTags.controller.health.online, {
        message: 'Heartbeat already running for controller',
        controllerId
      }, {
        source: { file: 'HeartbeatService.ts', method: 'startHeartbeat' },
        business: { category: 'controller', operation: 'already_running' },
        controllerId
      })
      return
    }

    this.logger.info(LogTags.controller.health.online, {
      message: `Starting heartbeat for controller (${this.HEARTBEAT_INTERVAL}ms interval)`,
      controllerId
    }, {
      source: { file: 'HeartbeatService.ts', method: 'startHeartbeat' },
      business: { category: 'controller', operation: 'heartbeat_started' },
      controllerId
    })

    // Create interval for sending heartbeat commands
    const interval = setInterval(async () => {
      await this.sendHeartbeat(controllerId)
    }, this.HEARTBEAT_INTERVAL)

    this.heartbeatIntervals.set(controllerId, interval)

    // Send first heartbeat immediately
    this.sendHeartbeat(controllerId).catch(error => {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'Initial heartbeat failed',
        controllerId,
        error
      }, {
        source: { file: 'HeartbeatService.ts', method: 'startHeartbeat' },
        business: { category: 'controller', operation: 'initial_heartbeat_failed', severity: 'medium' },
        controllerId
      })
    })
  }

  /**
   * Stop heartbeat scheduler for a controller
   */
  private stopHeartbeat(controllerId: string): void {
    const interval = this.heartbeatIntervals.get(controllerId)

    if (!interval) {
      this.logger.warn(LogTags.controller.health.offline, {
        message: 'No active heartbeat to stop for controller',
        controllerId
      }, {
        source: { file: 'HeartbeatService.ts', method: 'stopHeartbeat' },
        business: { category: 'controller', operation: 'no_heartbeat_running' },
        controllerId
      })
      return
    }

    clearInterval(interval)
    this.heartbeatIntervals.delete(controllerId)

    this.logger.info(LogTags.controller.health.offline, {
      message: 'Stopped heartbeat for controller',
      controllerId
    }, {
      source: { file: 'HeartbeatService.ts', method: 'stopHeartbeat' },
      business: { category: 'controller', operation: 'heartbeat_stopped' },
      controllerId
    })
  }

  /**
   * Send HEARTBEAT command to controller
   */
  private async sendHeartbeat(controllerId: string): Promise<void> {
    const connectionManager = ConnectionManagerService.getInstance()
    const adapter = connectionManager.getAdapter(controllerId)

    if (!adapter) {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'No adapter found for controller',
        controllerId
      }, {
        source: { file: 'HeartbeatService.ts', method: 'sendHeartbeat' },
        business: { category: 'controller', operation: 'no_adapter', severity: 'high' },
        controllerId
      })
      return
    }

    if (!adapter.isConnected) {
      this.logger.warn(LogTags.controller.health.offline, {
        message: 'Controller adapter not connected',
        controllerId
      }, {
        source: { file: 'HeartbeatService.ts', method: 'sendHeartbeat' },
        business: { category: 'controller', operation: 'adapter_disconnected' },
        controllerId
      })
      return
    }

    try {
      const command: IStartupCommand = { cmd: 'HEARTBEAT' }
      const response: IStartupResponse = await adapter.sendCommand(command)

      if (response.ok) {
        this.logger.debug(LogTags.controller.health.online, {
          message: 'Heartbeat sent successfully',
          controllerId
        }, {
          source: { file: 'HeartbeatService.ts', method: 'sendHeartbeat' },
          business: { category: 'controller', operation: 'heartbeat_success' },
          controllerId
        })
      } else {
        this.logger.warn(LogTags.controller.health.offline, {
          message: 'Heartbeat command failed',
          controllerId,
          response
        }, {
          source: { file: 'HeartbeatService.ts', method: 'sendHeartbeat' },
          business: { category: 'controller', operation: 'heartbeat_failed' },
          controllerId
        })
      }
    } catch (error) {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'Error sending heartbeat',
        controllerId,
        error
      }, {
        source: { file: 'HeartbeatService.ts', method: 'sendHeartbeat' },
        business: { category: 'controller', operation: 'heartbeat_error', severity: 'medium' },
        controllerId
      })
    }
  }

  /**
   * Stop all active heartbeats (for cleanup on shutdown)
   */
  stopAll(): void {
    this.logger.info(LogTags.system.shutdown.started, {
      message: `Stopping all heartbeats (${this.heartbeatIntervals.size} active)`,
    }, {
      source: { file: 'HeartbeatService.ts', method: 'stopAll' },
      business: { category: 'controller', operation: 'stop_all' }
    })

    for (const [controllerId] of this.heartbeatIntervals) {
      this.stopHeartbeat(controllerId)
    }

    this.activePins.clear()
  }

  /**
   * Get current status for monitoring/debugging
   */
  getStatus(): { activeControllers: number, heartbeats: string[] } {
    return {
      activeControllers: this.activePins.size,
      heartbeats: Array.from(this.heartbeatIntervals.keys())
    }
  }
}
