import { api } from './api'
import type {
  NotificationMessage,
  NotificationProvider,
  ErrorNotificationSettings,
  LifecycleNotificationSettings,
  LifecycleEventType,
  LifecycleNotificationSettingsFormData,
  LifecycleEventSettingFormData,
  MonitoringTag,
  NotificationMessageFormData,
  NotificationProviderFormData,
  ErrorNotificationSettingsFormData,
  ApiResponse
} from '../types'

export class NotificationService {
  private static readonly BASE_URL = '/notifications'

  // Periodic Messages API
  static async getMessages(): Promise<NotificationMessage[]> {
    return await api.get<NotificationMessage[]>(`${this.BASE_URL}/messages`)
  }

  static async getMessage(id: string): Promise<NotificationMessage> {
    return await api.get<NotificationMessage>(`${this.BASE_URL}/messages/${id}`)
  }

  static async createMessage(data: NotificationMessageFormData): Promise<NotificationMessage> {
    return await api.post<NotificationMessage>(`${this.BASE_URL}/messages`, data)
  }

  static async updateMessage(id: string, data: Partial<NotificationMessageFormData>): Promise<NotificationMessage> {
    return await api.put<NotificationMessage>(`${this.BASE_URL}/messages/${id}`, data)
  }

  static async deleteMessage(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/messages/${id}`)
  }

  static async triggerMessage(id: string): Promise<void> {
    await api.post(`${this.BASE_URL}/messages/${id}/trigger`)
  }

  // Providers API
  static async getProviders(): Promise<NotificationProvider[]> {
    return await api.get<NotificationProvider[]>(`${this.BASE_URL}/providers`)
  }

  static async getProvider(id: string): Promise<NotificationProvider> {
    return await api.get<NotificationProvider>(`${this.BASE_URL}/providers/${id}`)
  }

  static async createProvider(data: NotificationProviderFormData): Promise<NotificationProvider> {
    return await api.post<NotificationProvider>(`${this.BASE_URL}/providers`, data)
  }

  static async updateProvider(id: string, data: Partial<NotificationProviderFormData>): Promise<NotificationProvider> {
    return await api.put<NotificationProvider>(`${this.BASE_URL}/providers/${id}`, data)
  }

  static async deleteProvider(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/providers/${id}`)
  }

  static async testProvider(id: string): Promise<{ success: boolean, error?: string }> {
    return await api.post<{ success: boolean, error?: string }>(`${this.BASE_URL}/providers/${id}/test`)
  }

  // Error Settings API
  static async getErrorSettings(): Promise<ErrorNotificationSettings> {
    return await api.get<ErrorNotificationSettings>(`${this.BASE_URL}/errors-settings`)
  }

  static async updateErrorSettings(data: ErrorNotificationSettingsFormData): Promise<ErrorNotificationSettings> {
    return await api.put<ErrorNotificationSettings>(`${this.BASE_URL}/errors-settings`, data)
  }

  // Monitoring Tags API (for periodic message configuration)
  static async getMonitoringTags(): Promise<MonitoringTag[]> {
    return await api.get<MonitoringTag[]>('/monitoring/tags')
  }

  // Block Types API (for error settings configuration)
  static async getBlockTypes(): Promise<Array<{type: string, name: string, category: string}>> {
    return await api.get<Array<{type: string, name: string, category: string}>>(`${this.BASE_URL}/errors-settings/block-types`)
  }

  // Scheduler Status API
  static async getSchedulerStatus(): Promise<{
    isRunning: boolean
    scheduledCount: number
    scheduledNotifications: Array<{
      messageId: string
      messageName: string
      scheduleType: string
      nextExecution?: string
    }>
  }> {
    return await api.get<any>(`${this.BASE_URL}/scheduler/status`)
  }

  static async reloadScheduler(): Promise<void> {
    await api.post(`${this.BASE_URL}/scheduler/reload`)
  }

  static async triggerScheduler(messageId: string): Promise<void> {
    await api.post(`${this.BASE_URL}/scheduler/trigger/${messageId}`)
  }

  // Lifecycle Notifications API
  static async getLifecycleSettings(): Promise<LifecycleNotificationSettings> {
    return await api.get<LifecycleNotificationSettings>(`${this.BASE_URL}/lifecycle-settings`)
  }

  static async updateLifecycleSettings(data: Partial<LifecycleNotificationSettingsFormData>): Promise<LifecycleNotificationSettings> {
    return await api.put<LifecycleNotificationSettings>(`${this.BASE_URL}/lifecycle-settings`, data)
  }

  static async getLifecycleEventTypes(): Promise<LifecycleEventType[]> {
    return await api.get<LifecycleEventType[]>(`${this.BASE_URL}/lifecycle-settings/event-types`)
  }

  static async updateLifecycleEventSettings(
    eventType: string, 
    data: LifecycleEventSettingFormData
  ): Promise<LifecycleNotificationSettings> {
    return await api.post<LifecycleNotificationSettings>(`${this.BASE_URL}/lifecycle-settings/events/${eventType}`, data)
  }

  static async testLifecycleNotification(
    eventType: string, 
    context?: Record<string, any>
  ): Promise<{ success: boolean, data: { eventType: string, deliveryResults: any[] }, message: string }> {
    const response = await api.client.post<any>(`${this.BASE_URL}/lifecycle/test/${eventType}`, context || {})
    return response.data
  }
}

export const notificationService = NotificationService