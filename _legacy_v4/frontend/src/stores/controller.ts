// ABOUTME: Pinia store for Controller state management with demo mode support
// ABOUTME: Handles CRUD operations and integrates with DemoModeManager for tutorials

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Controller } from '../types'
import { useMainStore } from './main'
import { demoModeManager } from '../services/demo-mode-manager'

export const useControllerStore = defineStore('controller', () => {
  const mainStore = useMainStore()

  // State
  const controllers = ref<Controller[]>([])
  const selectedController = ref<Controller | null>(null)
  const lastFetch = ref<Date | null>(null)

  // Getters
  const onlineControllers = computed(() =>
    controllers.value.filter(c => c.status === 'online')
  )

  const offlineControllers = computed(() =>
    controllers.value.filter(c => c.status === 'offline')
  )

  const runningControllers = computed(() =>
    controllers.value.filter(c => c.executionState.isRunning)
  )

  const controllerCount = computed(() => controllers.value.length)

  /**
   * Check if demo mode is active
   */
  const isDemoMode = computed(() => demoModeManager.isActive)

  // Actions

  /**
   * Fetch all controllers
   * In demo mode, returns mock data instead of API call
   */
  async function fetchControllers(): Promise<void> {
    try {
      mainStore.setLoading(true, 'Loading controllers...')

      // Demo mode: use mock data
      if (demoModeManager.isActive) {
        controllers.value = demoModeManager.getMockControllers()
        lastFetch.value = new Date()
        console.log('[ControllerStore] Loaded mock controllers:', controllers.value.length)
        mainStore.clearError()
        return
      }

      // Real mode: API call (TODO: implement when API is ready)
      // const data = await controllerApi.getAll()
      // controllers.value = data

      // Temporary: empty array for real mode
      controllers.value = []
      lastFetch.value = new Date()
      mainStore.clearError()
    } catch (error: any) {
      mainStore.setError(true, `Failed to load controllers: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  /**
   * Fetch controller by ID
   */
  async function fetchControllerById(id: string): Promise<Controller | null> {
    try {
      mainStore.setLoading(true, 'Loading controller...')

      // Demo mode: find in mock data
      if (demoModeManager.isActive) {
        const mockControllers = demoModeManager.getMockControllers()
        const controller = mockControllers.find(c => c._id === id) || null
        if (controller) {
          selectedController.value = controller

          // Update in controllers array if exists
          const index = controllers.value.findIndex(c => c._id === id)
          if (index !== -1) {
            controllers.value[index] = controller
          }
        }
        mainStore.clearError()
        return controller
      }

      // Real mode: API call (TODO: implement when API is ready)
      // const controller = await controllerApi.getById(id)
      // selectedController.value = controller
      // return controller

      mainStore.clearError()
      return null
    } catch (error: any) {
      mainStore.setError(true, `Failed to load controller: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  /**
   * Create new controller
   * Blocked in demo mode (sandbox)
   */
  async function createController(controllerData: Partial<Controller>): Promise<Controller | null> {
    try {
      // Check if write should be blocked
      if (demoModeManager.shouldBlockWrite('create')) {
        // In demo mode, add to mock data instead
        const newController = demoModeManager.addMockController(controllerData)
        controllers.value.push(newController)
        mainStore.showNotification('Controller created (demo mode)', 'info')
        return newController
      }

      mainStore.setLoading(true, 'Creating controller...')

      // Real mode: API call (TODO: implement when API is ready)
      // const newController = await controllerApi.create(controllerData)
      // controllers.value.push(newController)
      // mainStore.showNotification('Controller created successfully', 'positive')
      // return newController

      mainStore.showNotification('Controller API not yet implemented', 'warning')
      return null
    } catch (error: any) {
      mainStore.setError(true, `Failed to create controller: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  /**
   * Update controller
   * Blocked in demo mode (sandbox)
   */
  async function updateController(
    id: string,
    controllerData: Partial<Controller>
  ): Promise<Controller | null> {
    try {
      // Check if write should be blocked
      if (demoModeManager.shouldBlockWrite('update')) {
        // In demo mode, update mock data
        const updated = demoModeManager.updateMockController(id, controllerData)
        if (updated) {
          const index = controllers.value.findIndex(c => c._id === id)
          if (index !== -1) {
            controllers.value[index] = updated
          }

          if (selectedController.value?._id === id) {
            selectedController.value = updated
          }

          mainStore.showNotification('Controller updated (demo mode)', 'info')
        }
        return updated
      }

      mainStore.setLoading(true, 'Updating controller...')

      // Real mode: API call (TODO: implement when API is ready)
      // const updatedController = await controllerApi.update(id, controllerData)
      // const index = controllers.value.findIndex(c => c._id === id)
      // if (index !== -1) {
      //   controllers.value[index] = updatedController
      // }
      // if (selectedController.value?._id === id) {
      //   selectedController.value = updatedController
      // }
      // mainStore.showNotification('Controller updated successfully', 'positive')
      // return updatedController

      mainStore.showNotification('Controller API not yet implemented', 'warning')
      return null
    } catch (error: any) {
      mainStore.setError(true, `Failed to update controller: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  /**
   * Delete controller
   * Blocked in demo mode (sandbox)
   */
  async function deleteController(id: string): Promise<void> {
    try {
      // Check if write should be blocked
      if (demoModeManager.shouldBlockWrite('delete')) {
        // In demo mode, delete from mock data
        const deleted = demoModeManager.deleteMockController(id)
        if (deleted) {
          controllers.value = controllers.value.filter(c => c._id !== id)

          if (selectedController.value?._id === id) {
            selectedController.value = null
          }

          mainStore.showNotification('Controller deleted (demo mode)', 'info')
        }
        return
      }

      mainStore.setLoading(true, 'Deleting controller...')

      // Real mode: API call (TODO: implement when API is ready)
      // await controllerApi.delete(id)
      // controllers.value = controllers.value.filter(c => c._id !== id)
      // if (selectedController.value?._id === id) {
      //   selectedController.value = null
      // }
      // mainStore.showNotification('Controller deleted successfully', 'positive')

      mainStore.showNotification('Controller API not yet implemented', 'warning')
    } catch (error: any) {
      mainStore.setError(true, `Failed to delete controller: ${error.message}`, error)
      throw error
    } finally {
      mainStore.setLoading(false)
    }
  }

  /**
   * Select a controller
   */
  function selectController(controller: Controller | null): void {
    selectedController.value = controller
  }

  /**
   * Clear selected controller
   */
  function clearSelectedController(): void {
    selectedController.value = null
  }

  /**
   * Get controller by name
   */
  function getControllerByName(name: string): Controller | undefined {
    return controllers.value.find(c => c.name === name)
  }

  /**
   * Get controllers by status
   */
  function getControllersByStatus(status: Controller['status']): Controller[] {
    return controllers.value.filter(c => c.status === status)
  }

  return {
    // State
    controllers,
    selectedController,
    lastFetch,

    // Getters
    onlineControllers,
    offlineControllers,
    runningControllers,
    controllerCount,
    isDemoMode,

    // Actions
    fetchControllers,
    fetchControllerById,
    createController,
    updateController,
    deleteController,
    selectController,
    clearSelectedController,
    getControllerByName,
    getControllersByStatus
  }
})
