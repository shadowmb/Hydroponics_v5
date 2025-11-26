import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Device } from '../types'
import { deviceApi } from '../services/api'
import { useMainStore } from './main'
import debugSystem from '../utils/debugSystem'

export const useDeviceStore = defineStore('device', () => {
  const mainStore = useMainStore()
  
  // State
  const devices = ref<Device[]>([])
  const selectedDevice = ref<Device | null>(null)
  const lastFetch = ref<Date | null>(null)

  // Getters
  const activeDevices = computed(() => 
    devices.value.filter(device => device.isActive)
  )
  
  const devicesByType = computed(() => {
    const grouped: Record<string, Device[]> = {}
    devices.value.forEach(device => {
      if (!grouped[device.type]) {
        grouped[device.type] = []
      }
      grouped[device.type].push(device)
    })
    return grouped
  })

  const sensorsCount = computed(() => 
    devices.value.filter(d => d.type === 'sensor').length
  )
  
  const pumpsCount = computed(() => 
    devices.value.filter(d => d.type === 'pump').length
  )
  
  const valvesCount = computed(() => 
    devices.value.filter(d => d.type === 'valve').length
  )
  
  const lightsCount = computed(() => 
    devices.value.filter(d => d.type === 'light').length
  )

  // Actions
  async function fetchDevices() {
    try {
      debugSystem.trackAPI('/api/devices', 'GET', 0, { action: 'fetch_all' })
      mainStore.setLoading(true, 'Loading devices...')
      const data = await deviceApi.getAll()
      devices.value = data
      lastFetch.value = new Date()
      debugSystem.trackAPI('/api/devices', 'GET', 200, { count: data.length })
      mainStore.clearError()
    } catch (error: any) {
      debugSystem.trackAPI('/api/devices', 'GET', 500, { error: error.message })
      mainStore.setError(true, `Failed to load devices: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function fetchDeviceById(id: string) {
    try {
      mainStore.setLoading(true, 'Loading device...')
      const device = await deviceApi.getById(id)
      selectedDevice.value = device
      
      // Update in devices array if exists
      const index = devices.value.findIndex(d => d._id === id)
      if (index !== -1) {
        devices.value[index] = device
      }
      
      mainStore.clearError()
      return device
    } catch (error: any) {
      mainStore.setError(true, `Failed to load device: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function createDevice(deviceData: Partial<Device>) {
    try {
      mainStore.setLoading(true, 'Creating device...')
      const newDevice = await deviceApi.create(deviceData)
      devices.value.push(newDevice)
      mainStore.showNotification('Device created successfully', 'positive')
      return newDevice
    } catch (error: any) {
      mainStore.setError(true, `Failed to create device: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function updateDevice(id: string, deviceData: Partial<Device>) {
    try {
      mainStore.setLoading(true, 'Updating device...')
      const updatedDevice = await deviceApi.update(id, deviceData)
      
      const index = devices.value.findIndex(d => d._id === id)
      if (index !== -1) {
        devices.value[index] = updatedDevice
      }
      
      if (selectedDevice.value?._id === id) {
        selectedDevice.value = updatedDevice
      }
      
      mainStore.showNotification('Device updated successfully', 'positive')
      return updatedDevice
    } catch (error: any) {
      mainStore.setError(true, `Failed to update device: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  async function deleteDevice(id: string) {
    try {
      mainStore.setLoading(true, 'Deleting device...')
      await deviceApi.delete(id)
      
      devices.value = devices.value.filter(d => d._id !== id)
      
      if (selectedDevice.value?._id === id) {
        selectedDevice.value = null
      }
      
      mainStore.showNotification('Device deleted successfully', 'positive')
    } catch (error: any) {
      mainStore.setError(true, `Failed to delete device: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  function selectDevice(device: Device | null) {
    selectedDevice.value = device
  }

  function clearSelectedDevice() {
    selectedDevice.value = null
  }

  function getDeviceByPin(pin: number): Device | undefined {
    return devices.value.find(device => device.pin === pin)
  }

  function getDevicesByType(type: Device['type']): Device[] {
    return devices.value.filter(device => device.type === type)
  }

  return {
    // State
    devices,
    selectedDevice,
    lastFetch,
    
    // Getters
    activeDevices,
    devicesByType,
    sensorsCount,
    pumpsCount,
    valvesCount,
    lightsCount,
    
    // Actions
    fetchDevices,
    fetchDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
    selectDevice,
    clearSelectedDevice,
    getDeviceByPin,
    getDevicesByType
  }
})