import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Settings } from '../types'
import { settingsApi } from '../services/api'
import { useMainStore } from './main'

export const useSettingsStore = defineStore('settings', () => {
  const mainStore = useMainStore()
  
  // State
  const settings = ref<Settings | null>(null)
  const lastFetch = ref<Date | null>(null)

  // Getters
  const systemSettings = computed(() => settings.value?.system)
  const notificationSettings = computed(() => settings.value?.notifications)
  const thresholds = computed(() => settings.value?.thresholds)
  const customSettings = computed(() => settings.value?.customSettings)

  // Helper getters for commonly used settings
  const timezone = computed(() => settings.value?.system.timezone || 'UTC')
  const language = computed(() => settings.value?.system.language || 'en')
  const units = computed(() => settings.value?.system.units || 'metric')
  const autoStart = computed(() => settings.value?.system.autoStart || false)
  const logLevel = computed(() => settings.value?.system.logLevel || 'info')

  // Actions
  async function fetchSettings() {
    try {
      mainStore.setLoading(true, 'Loading settings...')
      const data = await settingsApi.get()
      settings.value = data
      lastFetch.value = new Date()
      mainStore.clearError()
      return data
    } catch (error: any) {
      mainStore.setError(true, `Failed to load settings: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function updateSettings(settingsData: Partial<Settings>) {
    try {
      mainStore.setLoading(true, 'Updating settings...')
      const updatedSettings = await settingsApi.update(settingsData)
      settings.value = updatedSettings
      mainStore.showNotification('Settings updated successfully', 'positive')
      return updatedSettings
    } catch (error: any) {
      mainStore.setError(true, `Failed to update settings: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function updateSystemSettings(systemData: Partial<Settings['system']>) {
    if (!settings.value) {
      throw new Error('Settings not loaded')
    }

    const updatedSettings = {
      ...settings.value,
      system: {
        ...settings.value.system,
        ...systemData
      }
    }

    return updateSettings(updatedSettings)
  }

  async function updateNotificationSettings(notificationData: Partial<Settings['notifications']>) {
    if (!settings.value) {
      throw new Error('Settings not loaded')
    }

    const updatedSettings = {
      ...settings.value,
      notifications: {
        ...settings.value.notifications,
        ...notificationData
      }
    }

    return updateSettings(updatedSettings)
  }

  async function updateThresholds(thresholdData: Partial<Settings['thresholds']>) {
    if (!settings.value) {
      throw new Error('Settings not loaded')
    }

    const updatedSettings = {
      ...settings.value,
      thresholds: {
        ...settings.value.thresholds,
        ...thresholdData
      }
    }

    return updateSettings(updatedSettings)
  }

  async function updateCustomSettings(customData: Record<string, any>) {
    if (!settings.value) {
      throw new Error('Settings not loaded')
    }

    const updatedSettings = {
      ...settings.value,
      customSettings: {
        ...settings.value.customSettings,
        ...customData
      }
    }

    return updateSettings(updatedSettings)
  }

  function getCustomSetting(key: string, defaultValue?: any) {
    return settings.value?.customSettings?.[key] ?? defaultValue
  }

  function setCustomSetting(key: string, value: any) {
    if (settings.value) {
      if (!settings.value.customSettings) {
        settings.value.customSettings = {}
      }
      settings.value.customSettings[key] = value
    }
  }

  // Helper functions for threshold checks
  function isWithinThreshold(type: keyof Settings['thresholds'], value: number): boolean {
    const threshold = thresholds.value?.[type]
    if (!threshold) return true
    
    return value >= threshold.min && value <= threshold.max
  }

  function getThresholdStatus(type: keyof Settings['thresholds'], value: number): 'normal' | 'warning' | 'critical' {
    const threshold = thresholds.value?.[type]
    if (!threshold) return 'normal'
    
    if (value < threshold.min || value > threshold.max) {
      return 'critical'
    }
    
    // Add warning zones (10% of range)
    const range = threshold.max - threshold.min
    const warningMargin = range * 0.1
    
    if (value < threshold.min + warningMargin || value > threshold.max - warningMargin) {
      return 'warning'
    }
    
    return 'normal'
  }

  // General Settings actions
  async function getGeneralSettings() {
    if (!settings.value) {
      await fetchSettings()
    }
    
    return {
      ecUnit: getCustomSetting('ecUnit', 'mS/cm'),
      volumeUnit: getCustomSetting('volumeUnit', 'L'),
      timeFormat: getCustomSetting('timeFormat', '24h'),
      language: settings.value?.system?.language || 'bg',
      theme: getCustomSetting('theme', 'auto')
    }
  }

  async function saveGeneralSettings(generalSettings: {
    ecUnit: string
    volumeUnit: string
    timeFormat: string
    language: string
    theme: string
  }) {
    const customData = {
      ecUnit: generalSettings.ecUnit,
      volumeUnit: generalSettings.volumeUnit,
      timeFormat: generalSettings.timeFormat,
      theme: generalSettings.theme
    }
    
    await updateCustomSettings(customData)
    
    if (generalSettings.language !== settings.value?.system?.language) {
      await updateSystemSettings({
        language: generalSettings.language
      })
    }
  }

  return {
    // State
    settings,
    lastFetch,
    
    // Getters
    systemSettings,
    notificationSettings,
    thresholds,
    customSettings,
    timezone,
    language,
    units,
    autoStart,
    logLevel,
    
    // Actions
    fetchSettings,
    updateSettings,
    updateSystemSettings,
    updateNotificationSettings,
    updateThresholds,
    updateCustomSettings,
    getCustomSetting,
    setCustomSetting,
    isWithinThreshold,
    getThresholdStatus,
    getGeneralSettings,
    saveGeneralSettings
  }
})