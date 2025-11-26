// ABOUTME: SystemRecoveryService handles controller recovery, reconnection logic, and failure notifications
// ABOUTME: Extracted from StartupService as part of delegation pattern refactoring (Phase 3)

import { PhysicalController, IPhysicalController } from '../models/PhysicalController'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { SystemInitializationService } from './SystemInitializationService'
import { ConnectionManagerService } from './ConnectionManagerService'
import { LogTags } from '../utils/LogTags'

export class SystemRecoveryService {
  private static instance: SystemRecoveryService
  private systemInitialization: SystemInitializationService // Phase 1 dependency
  private connectionManager: ConnectionManagerService       // Phase 2 dependency
  private logger = UnifiedLoggingService.createModuleLogger('SystemRecoveryService.ts')

  // Recovery configuration constants
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAYS = [1000, 3000, 5000] // 1s, 3s, 5s

  constructor() {
    this.systemInitialization = SystemInitializationService.getInstance()
    this.connectionManager = ConnectionManagerService.getInstance()
  }

  static getInstance(): SystemRecoveryService {
    if (!SystemRecoveryService.instance) {
      SystemRecoveryService.instance = new SystemRecoveryService()
    }
    return SystemRecoveryService.instance
  }

  /**
   * Auto-reconnection mechanism for failed controllers
   * Called by HardwareHealthChecker when ping fails
   */
  async reconnectController(controllerId: string): Promise<boolean> {
    // За мониторинг на възстановяване на връзки - автоматично reconnection при изгубена връзка с контролер
    // this.logger.info(LogTags.system.recovery.started, {
    //   message: 'Starting reconnection for controller',
    //   controllerId: controllerId
    // }, {
    //   source: { file: 'SystemRecoveryService.ts', method: 'reconnectController' },
    //   business: { category: 'system', operation: 'recovery_start' },
    //   controllerId: controllerId
    // })
    
    try {
      // Get controller from database
      const controller = await PhysicalController.findById(controllerId).exec()
      if (!controller) {
        this.logger.error(LogTags.system.recovery.failed, {
          message: 'Controller not found',
          controllerId: controllerId,
          reason: 'database_lookup_failed'
        }, {
          source: { file: 'SystemRecoveryService.ts', method: 'reconnectController' },
          business: { category: 'system', operation: 'recovery_validation' },
          controllerId: controllerId
        })
        return false
      }

      // Processing controller for recovery - no logging needed

      // Close existing connections if any - delegate to ConnectionManagerService
      await this.closeControllerConnection(controllerId)

      // Execute recovery attempts with retry logic
      const recoverySuccess = await this.executeRecoveryWithRetries(controller)

      // Send appropriate notifications
      await this.sendRecoveryNotifications(controller, recoverySuccess)

      if (recoverySuccess) {
        // this.logger.info(LogTags.system.recovery.completed, {
        //   message: 'Successfully reconnected controller',
        //   controllerName: controller.name,
        //   controllerId: controllerId
        // }, {
        //   source: { file: 'SystemRecoveryService.ts', method: 'reconnectController' },
        //   business: { category: 'system', operation: 'recovery_success' },
        //   controllerId: controllerId
        // })
      } else {
        this.logger.error(LogTags.system.recovery.failed, {
          message: 'Failed to reconnect controller',
          controllerName: controller.name,
          controllerId: controllerId,
          reason: 'max_retries_exceeded'
        }, {
          source: { file: 'SystemRecoveryService.ts', method: 'reconnectController' },
          business: { category: 'system', operation: 'recovery_failure' },
          controllerId: controllerId
        })
      }

      return recoverySuccess

    } catch (error) {
      this.logger.error(LogTags.system.recovery.failed, {
        message: 'Unexpected error during reconnection',
        error: error,
        controllerId: controllerId
      }, {
        source: { file: 'SystemRecoveryService.ts', method: 'reconnectController' },
        business: { category: 'system', operation: 'recovery_error' },
        controllerId: controllerId
      })
      return false
    }
  }

  /**
   * Execute recovery attempts with intelligent retry logic
   */
  private async executeRecoveryWithRetries(controller: IPhysicalController): Promise<boolean> {
    const controllerId = controller._id.toString()

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Re-initialize the controller via SystemInitializationService
        await this.systemInitialization.initializeSingleController(controller, true)

        // Test the connection
        const isConnected = this.connectionManager.isConnected(controllerId)
        if (isConnected) {
          return true
        }

      } catch (error) {
        // Silent retry - errors logged by initialization service
      }

      // Wait before next retry (except for last attempt)
      if (attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[attempt - 1]
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return false
  }

  /**
   * Close specific controller connection - delegate to ConnectionManagerService
   */
  private async closeControllerConnection(controllerId: string): Promise<void> {
    try {
      await this.connectionManager.removeConnection(controllerId)
    } catch (error) {
      this.logger.error(LogTags.controller.health.offline, {
        message: 'Connection cleanup failed',
        controllerId: controllerId,
        error: error
      }, {
        source: { file: 'SystemRecoveryService.ts', method: 'closeControllerConnection' },
        business: { category: 'controller', operation: 'cleanup_failed' },
        controllerId: controllerId
      })
      throw error
    }
  }

  /**
   * Send recovery lifecycle notifications
   */
  private async sendRecoveryNotifications(controller: IPhysicalController, success: boolean): Promise<void> {
    if (!success) {
      // Send controller disconnect notification for failed recovery
      try {
        const { notificationService } = await import('./NotificationService')
        const timestamp = new Date()
        
        await notificationService.sendLifecycleNotification('controller_disconnect', {
          controllerName: controller.name,
          controllerIp: controller.communicationConfig?.port || controller.address || 'Unknown',
          deviceName: controller.name,
          deviceType: controller.communicationBy === 'serial' ? 'serial controller' : 'controller',
          timestamp: timestamp,
          disconnectTime: timestamp,
          lastSeen: controller.lastHeartbeat || timestamp
        })
        
        // this.logger.info(LogTags.controller.health.offline, {
        //   message: 'Controller disconnect notification sent for failed recovery',
        //   controllerName: controller.name,
        //   controllerId: controller._id.toString()
        // }, {
        //   source: { file: 'SystemRecoveryService.ts', method: 'sendRecoveryNotifications' },
        //   business: { category: 'controller', operation: 'notification_sent' },
        //   controllerId: controller._id.toString()
        // })
      } catch (lifecycleNotificationError) {
        this.logger.warn(LogTags.system.health.warning, {
          message: 'Failed to send controller disconnect notification',
          error: lifecycleNotificationError,
          controllerName: controller.name,
          controllerId: controller._id.toString()
        }, {
          source: { file: 'SystemRecoveryService.ts', method: 'sendRecoveryNotifications' },
          business: { category: 'system', operation: 'notification_failed' },
          controllerId: controller._id.toString()
        })
      }
    } else {
      // Send controller reconnect notification for successful recovery
      try {
        const { notificationService } = await import('./NotificationService')
        const timestamp = new Date()
        
        await notificationService.sendLifecycleNotification('controller_reconnect', {
          controllerName: controller.name,
          controllerIp: controller.communicationConfig?.port || controller.address || 'Unknown',
          deviceName: controller.name,
          deviceType: controller.communicationBy === 'serial' ? 'serial controller' : 'controller',
          timestamp: timestamp,
          reconnectTime: timestamp
        })
        
        // this.logger.info(LogTags.controller.health.online, {
        //   message: 'Controller reconnect notification sent for successful recovery',
        //   controllerName: controller.name,
        //   controllerId: controller._id.toString()
        // }, {
        //   source: { file: 'SystemRecoveryService.ts', method: 'sendRecoveryNotifications' },
        //   business: { category: 'controller', operation: 'notification_sent' },
        //   controllerId: controller._id.toString()
        // })
      } catch (lifecycleNotificationError) {
        this.logger.warn(LogTags.system.health.warning, {
          message: 'Failed to send controller reconnect notification',
          error: lifecycleNotificationError,
          controllerName: controller.name,
          controllerId: controller._id.toString()
        }, {
          source: { file: 'SystemRecoveryService.ts', method: 'sendRecoveryNotifications' },
          business: { category: 'system', operation: 'notification_failed' },
          controllerId: controller._id.toString()
        })
      }
    }
  }

  /**
   * Get recovery statistics and configuration
   */
  getRecoveryConfiguration(): {
    maxRetries: number,
    retryDelays: number[],
    totalMaxTime: number
  } {
    const totalMaxTime = this.RETRY_DELAYS.reduce((sum, delay) => sum + delay, 0)
    
    return {
      maxRetries: this.MAX_RETRIES,
      retryDelays: [...this.RETRY_DELAYS],
      totalMaxTime
    }
  }
}