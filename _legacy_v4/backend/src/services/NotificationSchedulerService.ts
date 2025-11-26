import * as cron from 'node-cron'
import { NotificationMessage, INotificationMessage } from '../models/NotificationMessage'
import { NotificationService, notificationService } from './NotificationService'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { LogTags } from '../utils/LogTags'

interface IScheduledNotification {
  messageId: string
  messageName: string
  schedule: {
    type: 'interval' | 'fixed_time'
    interval?: number
    time?: string
    days?: string[]
  }
  nextExecution?: Date
  cronJob?: cron.ScheduledTask
}

export class NotificationSchedulerService {
  private static instance: NotificationSchedulerService
  private scheduledNotifications: Map<string, IScheduledNotification> = new Map()
  private isRunning = false
  private logger = UnifiedLoggingService.createModuleLogger('NotificationSchedulerService.ts')
  
  private constructor() {
    //this.logger.info('NotificationSchedulerService.ts', { status: 'initialized' })
  }

  public static getInstance(): NotificationSchedulerService {
    if (!NotificationSchedulerService.instance) {
      NotificationSchedulerService.instance = new NotificationSchedulerService()
    }
    return NotificationSchedulerService.instance
  }

  /**
   * Start the notification scheduler
   */
  public async start(): Promise<void> {
    // За мониторинг на scheduler startup - стартиране на notification scheduler с provider initialization
    if (this.isRunning) {
this.logger.warn(LogTags.system.health.warning, {
        message: 'Notification scheduler already running'
      }, {
        source: { file: 'NotificationSchedulerService.ts', method: 'start' },
        business: { category: 'system', operation: 'scheduler_lifecycle' }
      })
      return
    }

    try {
      await notificationService.initializeProviders()
      await this.loadActiveNotifications()
      this.isRunning = true

      // this.logger.info('NotificationSchedulerService.ts', {
      //   status: 'started',
      //   scheduledNotifications: this.scheduledNotifications.size
      // })
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to start notification scheduler',
        error: error.message
      }, {
        source: { file: 'NotificationSchedulerService.ts', method: 'start' },
        business: { category: 'system', operation: 'scheduler_lifecycle' }
      })
      throw error
    }
  }

  /**
   * Stop the notification scheduler
   */
  public async stop(): Promise<void> {
    // За мониторинг на scheduler shutdown - спиране на всички cron jobs и resource cleanup
    if (!this.isRunning) {
      return
    }

    try {
      // Stop all scheduled jobs
      for (const [messageId, notification] of this.scheduledNotifications) {
        if (notification.cronJob) {
          notification.cronJob.stop()
        }
      }

      this.scheduledNotifications.clear()
      await notificationService.cleanup()
      this.isRunning = false

      //this.logger.info('NotificationSchedulerService.ts', { status: 'stopped' })
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to stop notification scheduler',
        error: error.message
      }, {
        source: { file: 'NotificationSchedulerService.ts', method: 'stop' },
        business: { category: 'system', operation: 'scheduler_lifecycle' }
      })
    }
  }

  /**
   * Load and schedule active notification messages
   */
  private async loadActiveNotifications(): Promise<void> {
    // За мониторинг на notification loading - зареждане на активни periodic messages от базата данни
    try {
      const activeMessages = await NotificationMessage.find({ 
        isActive: true,
        type: 'periodic'
      })

      for (const message of activeMessages) {
        await this.scheduleNotification(message)
      }

      // this.logger.info('NotificationSchedulerService.ts', {
      //   action: 'load_active_notifications',
      //   count: activeMessages.length
      // })
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to load active notifications',
        error: error.message
      }, {
        source: { file: 'NotificationSchedulerService.ts', method: 'loadActiveNotifications' },
        business: { category: 'system', operation: 'notification_loading' }
      })
      throw error
    }
  }

  /**
   * Schedule a single notification message
   */
  public async scheduleNotification(message: INotificationMessage): Promise<void> {
    // За мониторинг на individual notification scheduling - планиране на отделни notifications според schedule type
    try {
      const messageId = message._id.toString()
      
      // Stop existing schedule if any
      await this.unscheduleNotification(messageId)

      if (!message.isActive) {
        // this.logger.info('NotificationSchedulerService.ts', {
        //   action: 'schedule_notification',
        //   messageId,
        //   status: 'skipped_inactive'
        // })
        return
      }

      const scheduledNotification: IScheduledNotification = {
        messageId,
        messageName: message.name,
        schedule: message.schedule
      }

      if (message.schedule.type === 'interval') {
        await this.scheduleIntervalNotification(scheduledNotification, message.schedule.interval!)
      } else if (message.schedule.type === 'fixed_time') {
        await this.scheduleFixedTimeNotification(scheduledNotification, message.schedule.time!, message.schedule.days!)
      }

      this.scheduledNotifications.set(messageId, scheduledNotification)

      // this.logger.info('NotificationSchedulerService.ts', {
      //   action: 'notification_scheduled',
      //   messageId,
      //   messageName: message.name,
      //   scheduleType: message.schedule.type
      // })
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to schedule notification',
        messageId: message._id.toString(),
        error: error.message
      }, {
        source: { file: 'NotificationSchedulerService.ts', method: 'scheduleNotification' },
        business: { category: 'system', operation: 'notification_scheduling' }
      })
      throw error
    }
  }

  /**
   * Schedule interval-based notification
   */
  private async scheduleIntervalNotification(notification: IScheduledNotification, intervalMinutes: number): Promise<void> {
    // За мониторинг на interval scheduling - създаване на cron jobs за minute-based интервали
    const cronExpression = `*/${intervalMinutes} * * * *`
    
    const cronJob = cron.schedule(cronExpression, async () => {
      await this.executeNotification(notification.messageId, notification.messageName)
    })

    notification.cronJob = cronJob
    notification.nextExecution = this.getNextIntervalExecution(intervalMinutes)
    cronJob.start()

    // this.logger.info('NotificationSchedulerService.ts', {
    //   action: 'interval_notification_scheduled',
    //   messageId: notification.messageId,
    //   intervalMinutes,
    //   nextExecution: notification.nextExecution
    // })
  }

  /**
   * Schedule fixed-time notification
   */
  private async scheduleFixedTimeNotification(notification: IScheduledNotification, time: string, days: string[]): Promise<void> {
    // За мониторинг на fixed time scheduling - създаване на cron jobs за конкретни времена и дни
    const [hour, minute] = time.split(':').map(n => parseInt(n))
    
    let cronExpression = ''
    if (days.includes('daily')) {
      cronExpression = `${minute} ${hour} * * *`
    } else {
      const cronDays = days.map(day => this.getDayNumber(day)).filter(d => d !== -1).join(',')
      cronExpression = `${minute} ${hour} * * ${cronDays}`
    }

    const cronJob = cron.schedule(cronExpression, async () => {
      await this.executeNotification(notification.messageId, notification.messageName)
    })

    notification.cronJob = cronJob
    notification.nextExecution = this.getNextFixedTimeExecution(time, days)
    cronJob.start()

    // this.logger.info('NotificationSchedulerService.ts', {
    //   action: 'fixed_time_notification_scheduled',
    //   messageId: notification.messageId,
    //   time,
    //   days,
    //   nextExecution: notification.nextExecution
    // })
  }

  /**
   * Execute notification
   */
  private async executeNotification(messageId: string, messageName: string): Promise<void> {
    // За мониторинг на notification execution - изпълнение на scheduled notifications чрез NotificationService
    try {
      // this.logger.info('NotificationSchedulerService.ts', {
      //   action: 'execute_notification_start',
      //   messageId,
      //   messageName
      // })

      const results = await notificationService.sendPeriodicNotification(messageId)
      
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      // За мониторинг на execution results - проследяване на успешни/неуспешни delivery attempts
      // this.logger.info('NotificationSchedulerService.ts', {
      //   action: 'execute_notification_completed',
      //   messageId,
      //   messageName,
      //   successCount,
      //   failureCount,
      //   totalProviders: results.length
      // })

      // Update next execution time for the notification
      const notification = this.scheduledNotifications.get(messageId)
      if (notification) {
        if (notification.schedule.type === 'interval') {
          notification.nextExecution = this.getNextIntervalExecution(notification.schedule.interval!)
        } else if (notification.schedule.type === 'fixed_time') {
          notification.nextExecution = this.getNextFixedTimeExecution(
            notification.schedule.time!,
            notification.schedule.days!
          )
        }
      }
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to execute notification',
        messageId,
        messageName,
        error: error.message
      }, {
        source: { file: 'NotificationSchedulerService.ts', method: 'executeNotification' },
        business: { category: 'system', operation: 'notification_execution' }
      })
    }
  }

  /**
   * Unschedule notification
   */
  public async unscheduleNotification(messageId: string): Promise<void> {
    // За мониторинг на notification unscheduling - спиране и премахване на notifications от scheduler
    const notification = this.scheduledNotifications.get(messageId)
    if (notification?.cronJob) {
      notification.cronJob.stop()
      // this.logger.info('NotificationSchedulerService.ts', {
      //   action: 'notification_unscheduled',
      //   messageId,
      //   messageName: notification.messageName
      // })
    }
    
    this.scheduledNotifications.delete(messageId)
  }

  /**
   * Reload notifications from database
   */
  public async reloadNotifications(): Promise<void> {
    // За мониторинг на schedule reloading - refresh на цялата notification configuration от database
    try {
      // Stop all current schedules
      for (const messageId of this.scheduledNotifications.keys()) {
        await this.unscheduleNotification(messageId)
      }

      // Reload from database
      await this.loadActiveNotifications()

      // this.logger.info('NotificationSchedulerService.ts', {
      //   action: 'notifications_reloaded',
      //   count: this.scheduledNotifications.size
      // })
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to reload notifications',
        error: error.message
      }, {
        source: { file: 'NotificationSchedulerService.ts', method: 'reloadNotifications' },
        business: { category: 'system', operation: 'notification_reloading' }
      })
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    isRunning: boolean
    scheduledCount: number
    scheduledNotifications: Array<{
      messageId: string
      messageName: string
      scheduleType: string
      nextExecution?: Date
    }>
  } {
    const scheduledNotifications = Array.from(this.scheduledNotifications.values()).map(n => ({
      messageId: n.messageId,
      messageName: n.messageName,
      scheduleType: n.schedule.type,
      nextExecution: n.nextExecution
    }))

    return {
      isRunning: this.isRunning,
      scheduledCount: this.scheduledNotifications.size,
      scheduledNotifications
    }
  }

  /**
   * Get next interval execution time
   */
  private getNextIntervalExecution(intervalMinutes: number): Date {
    // За мониторинг на next execution calculations - изчисляване на следващи execution times за различни schedule types
    return new Date(Date.now() + intervalMinutes * 60 * 1000)
  }

  /**
   * Get next fixed time execution
   */
  private getNextFixedTimeExecution(time: string, days: string[]): Date {
    const [hour, minute] = time.split(':').map(n => parseInt(n))
    const now = new Date()
    const nextExecution = new Date()
    
    nextExecution.setHours(hour, minute, 0, 0)
    
    // If time has passed today, move to tomorrow
    if (nextExecution <= now) {
      nextExecution.setDate(nextExecution.getDate() + 1)
    }
    
    // Handle specific days (not daily)
    if (!days.includes('daily')) {
      while (!this.isDayIncluded(nextExecution.getDay(), days)) {
        nextExecution.setDate(nextExecution.getDate() + 1)
      }
    }
    
    return nextExecution
  }

  /**
   * Convert day name to number
   */
  private getDayNumber(dayName: string): number {
    const days: Record<string, number> = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    }
    return days[dayName.toLowerCase()] ?? -1
  }

  /**
   * Check if day is included in schedule
   */
  private isDayIncluded(dayNumber: number, days: string[]): boolean {
    // За мониторинг на day matching logic - проверка дали текущия ден е включен в schedule days
    if (days.includes('daily')) return true
    return days.some(day => this.getDayNumber(day) === dayNumber)
  }

  /**
   * Manual trigger for testing
   */
  public async triggerNotification(messageId: string): Promise<void> {
    // За мониторинг на manual triggers - ръчно задействане на notifications за тестване
    try {
      const notification = this.scheduledNotifications.get(messageId)
      if (!notification) {
        throw new Error(`Notification ${messageId} not found in scheduler`)
      }

      await this.executeNotification(messageId, notification.messageName)
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to trigger notification',
        messageId,
        error: error.message
      }, {
        source: { file: 'NotificationSchedulerService.ts', method: 'triggerNotification' },
        business: { category: 'system', operation: 'notification_trigger' }
      })
      throw error
    }
  }
}

// Export singleton instance
export const notificationSchedulerService = NotificationSchedulerService.getInstance()