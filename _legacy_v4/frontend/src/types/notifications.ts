// Notification Types

export interface NotificationMessage {
  _id: string
  name: string
  description?: string
  type: 'periodic'
  schedule: NotificationSchedule
  tags: string[]
  deliveryMethods: string[]
  isActive: boolean
  lastSent?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationSchedule {
  type: 'interval' | 'fixed_time'
  interval?: number  // minutes for interval type
  time?: string      // "14:30" for fixed_time
  days?: string[]    // ['monday', 'tuesday'] or ['daily']
}

export interface NotificationProvider {
  _id: string
  type: 'email' | 'telegram' | 'viber'
  name: string
  config: NotificationProviderConfig
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationProviderConfig {
  // Email config
  host?: string
  port?: number
  user?: string
  password?: string
  from?: string
  to?: string

  // Telegram config
  botToken?: string
  chatId?: string

  // Viber config
  authToken?: string
}

export interface ErrorNotificationSettings {
  _id: string
  globalEnabled: boolean
  globalDeliveryMethods: string[]
  blockSettings: Record<string, {
    enabled: boolean
    deliveryMethods: string[]
    rateLimitMinutes: number
  }>
  blockTypeSettings: Record<string, {
    enabled: boolean
    messageTemplate: string
    deliveryMethods?: string[]
    rateLimitMinutes?: number
  }>
  rateLimitMinutes: number
  updatedAt: string
}

export interface NotificationDeliveryResult {
  success: boolean
  provider: string
  error?: string
  messageId?: string
}

export interface MonitoringTag {
  _id: string
  name: string
  description?: string
  isActive: boolean
  unit?: string
}

// Form data interfaces
export interface NotificationMessageFormData {
  name: string
  description?: string
  schedule: NotificationSchedule
  tags: string[]
  deliveryMethods: string[]
  isActive: boolean
}

export interface NotificationProviderFormData {
  type: 'email' | 'telegram' | 'viber'
  name: string
  config: NotificationProviderConfig
  isActive: boolean
}

export interface ErrorNotificationSettingsFormData {
  globalEnabled: boolean
  globalDeliveryMethods: string[]
  rateLimitMinutes: number
  blockSettings: Record<string, {
    enabled: boolean
    deliveryMethods: string[]
    rateLimitMinutes: number
  }>
  blockTypeSettings: Record<string, {
    enabled: boolean
    messageTemplate: string
    deliveryMethods?: string[]
    rateLimitMinutes?: number
  }>
}

// Lifecycle Notifications Types
export interface LifecycleNotificationSettings {
  _id: string
  globalSettings: {
    enabled: boolean
    rateLimitMinutes: number
    deliveryMethods: string[]
  }
  eventSettings: Record<string, {
    enabled: boolean
    messageTemplate: string
    deliveryMethods?: string[]
    rateLimitMinutes?: number
    includeCycleDetails?: boolean
    includeDeviceInfo?: boolean
  }>
  createdAt: string
  updatedAt: string
}

export interface LifecycleEventSetting {
  enabled: boolean
  messageTemplate: string
  deliveryMethods?: string[]
  rateLimitMinutes?: number
  includeCycleDetails?: boolean
  includeDeviceInfo?: boolean
}

export interface LifecycleEventType {
  key: string
  value: string
  displayName: string
}

// Form data for lifecycle notifications
export interface LifecycleNotificationSettingsFormData {
  globalSettings: {
    enabled: boolean
    rateLimitMinutes: number
    deliveryMethods: string[]
  }
  eventSettings: Record<string, LifecycleEventSetting>
}

export interface LifecycleEventSettingFormData {
  enabled: boolean
  messageTemplate: string
  deliveryMethods?: string[]
  rateLimitMinutes?: number
  includeCycleDetails?: boolean
  includeDeviceInfo?: boolean
}

// Lifecycle event types constants
export const LIFECYCLE_EVENT_TYPES = {
  CYCLE_START: 'cycle_start',
  CYCLE_SUCCESS: 'cycle_success', 
  CYCLE_FAILURE: 'cycle_failure',
  CONTROLLER_DISCONNECT: 'controller_disconnect',
  CONTROLLER_RECONNECT: 'controller_reconnect',
  SENSOR_DISCONNECT: 'sensor_disconnect',
  SENSOR_RECONNECT: 'sensor_reconnect'
} as const

export type LifecycleEventTypeValue = typeof LIFECYCLE_EVENT_TYPES[keyof typeof LIFECYCLE_EVENT_TYPES]