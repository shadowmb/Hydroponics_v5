import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { 
  activeProgramService, 
  type IActiveProgram, 
  type ILoadProgramRequest,
  type IScheduleProgramRequest,
  type ISkipCycleRequest,
  type IStatusInfo
} from '../services/activeProgramService'
import { useMainStore } from './main'

export const useActiveProgramStore = defineStore('activeProgram', () => {
  // State
  const activeProgram = ref<IActiveProgram | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  
  // Auto-refresh timer
  const refreshTimer = ref<NodeJS.Timeout | null>(null)
  const autoRefreshEnabled = ref(true)
  const refreshInterval = ref(30000) // 30 seconds

  // Computed
  const hasActiveProgram = computed(() => activeProgram.value !== null)
  
  const currentStatus = computed(() => activeProgram.value?.status || null)
  
  const isRunning = computed(() => currentStatus.value === 'running')
  const isPaused = computed(() => currentStatus.value === 'paused')
  const isStopped = computed(() => currentStatus.value === 'stopped')
  const isScheduled = computed(() => currentStatus.value === 'scheduled')
  const isLoaded = computed(() => currentStatus.value === 'loaded')
  
  const statusInfo = computed(() => {
    if (!activeProgram.value) return null
    
    let timeRemaining: number | undefined
    if (activeProgram.value.status === 'scheduled' && activeProgram.value.scheduledStartDate) {
      timeRemaining = Math.max(0, new Date(activeProgram.value.scheduledStartDate).getTime() - Date.now())
    }

    const nextExecution = activeProgram.value.activeCycles
      .filter(cycle => cycle.isActive)
      .map(cycle => new Date(cycle.nextExecution))
      .sort((a, b) => a.getTime() - b.getTime())[0]

    return {
      hasActive: true,
      status: activeProgram.value.status,
      timeRemaining,
      nextExecution,
      displayText: activeProgramService.getStatusDisplayText(activeProgram.value.status),
      color: activeProgramService.getStatusColor(activeProgram.value.status),
      icon: activeProgramService.getStatusIcon(activeProgram.value.status)
    }
  })

  const canStart = computed(() => {
    return hasActiveProgram.value && (isLoaded.value || isScheduled.value)
  })

  const canPause = computed(() => {
    return hasActiveProgram.value && isRunning.value
  })

  const canStop = computed(() => {
    return hasActiveProgram.value && (isRunning.value || isPaused.value || isScheduled.value)
  })

  const canRemove = computed(() => {
    return hasActiveProgram.value && isLoaded.value
  })

  // Main store for notifications
  const mainStore = useMainStore()

  // Actions
  async function fetchActiveProgram(): Promise<void> {
    if (isLoading.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      activeProgram.value = await activeProgramService.getCurrentActive()
      lastUpdated.value = new Date()
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch active program'
      mainStore.showNotification('Грешка при зареждане на активната програма', 'negative')
    } finally {
      isLoading.value = false
    }
  }

  async function loadProgram(programId: string, data: ILoadProgramRequest): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      activeProgram.value = await activeProgramService.loadProgram(programId, data)
      lastUpdated.value = new Date()
      
      mainStore.showNotification('Operation completed', 'positive')
    } catch (err: any) {
      error.value = err.message || 'Operation failed'
      mainStore.showNotification('Operation failed', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function scheduleProgram(data: IScheduleProgramRequest): Promise<void> {
    if (!activeProgram.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      activeProgram.value = await activeProgramService.scheduleProgram(data)
      lastUpdated.value = new Date()
      
      mainStore.showNotification('Operation completed', 'positive')
    } catch (err: any) {
      error.value = err.message || 'Operation failed'
      mainStore.showNotification('Operation failed', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function startProgram(): Promise<void> {
    if (!activeProgram.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      activeProgram.value = await activeProgramService.startProgram()
      lastUpdated.value = new Date()
      
      mainStore.showNotification('Operation completed', 'positive')
    } catch (err: any) {
      error.value = err.message || 'Operation failed'
      mainStore.showNotification('Operation failed', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function pauseProgram(): Promise<void> {
    if (!activeProgram.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      activeProgram.value = await activeProgramService.pauseProgram()
      lastUpdated.value = new Date()
      
      mainStore.showNotification('Operation completed', 'positive')
    } catch (err: any) {
      error.value = err.message || 'Operation failed'
      mainStore.showNotification('Operation failed', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function stopProgram(): Promise<void> {
    if (!activeProgram.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      activeProgram.value = await activeProgramService.stopProgram()
      lastUpdated.value = new Date()
      
      mainStore.showNotification('Operation completed', 'positive')
    } catch (err: any) {
      error.value = err.message || 'Operation failed'
      mainStore.showNotification('Operation failed', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removeActiveProgram(): Promise<void> {
    if (!activeProgram.value) return
    
    isLoading.value = true
    error.value = null
    
    const programName = activeProgram.value.name
    
    try {
      await activeProgramService.removeActiveProgram()
      activeProgram.value = null
      lastUpdated.value = new Date()
      
      mainStore.showNotification('Operation completed', 'positive')
    } catch (err: any) {
      error.value = err.message || 'Operation failed'
      mainStore.showNotification('Operation failed', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }


  async function skipCycle(data: ISkipCycleRequest): Promise<void> {
    if (!activeProgram.value) return

    isLoading.value = true
    error.value = null

    try {
      activeProgram.value = await activeProgramService.skipCycle(data)
      lastUpdated.value = new Date()

      mainStore.showNotification('Operation completed', 'positive')
    } catch (err: any) {
      error.value = err.message || 'Operation failed'
      mainStore.showNotification('Operation failed', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateMinCycleInterval(minCycleInterval: number): Promise<void> {
    if (!activeProgram.value) return

    isLoading.value = true
    error.value = null

    try {
      activeProgram.value = await activeProgramService.updateMinCycleInterval(minCycleInterval)
      lastUpdated.value = new Date()

      mainStore.showNotification(`Минималният интервал е обновен на ${minCycleInterval} минути`, 'positive')
    } catch (err: any) {
      error.value = err.message || 'Неуспешно обновяване на минимален интервал'
      mainStore.showNotification('Грешка при обновяване на минимален интервал', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateMaxExecutionTime(maxExecutionTime: number): Promise<void> {
    if (!activeProgram.value) return

    isLoading.value = true
    error.value = null

    try {
      activeProgram.value = await activeProgramService.updateMaxExecutionTime(maxExecutionTime)
      lastUpdated.value = new Date()

      mainStore.showNotification(`Максималното време е обновено на ${maxExecutionTime} минути`, 'positive')
    } catch (err: any) {
      error.value = err.message || 'Неуспешно обновяване на максимално време'
      mainStore.showNotification('Грешка при обновяване на максимално време', 'negative')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  function startAutoRefresh(): void {
    if (refreshTimer.value) return
    
    refreshTimer.value = setInterval(() => {
      if (autoRefreshEnabled.value && hasActiveProgram.value) {
        fetchActiveProgram()
      }
    }, refreshInterval.value)
  }

  function stopAutoRefresh(): void {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  function setAutoRefreshEnabled(enabled: boolean): void {
    autoRefreshEnabled.value = enabled
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  // Utility functions
  function isCycleSkipped(cycleId: string): boolean {
    if (!activeProgram.value) return false
    return activeProgramService.isCycleSkipped(activeProgram.value, cycleId)
  }

  function getTimeRemainingString(timeRemaining: number): string {
    return activeProgramService.getTimeRemainingString(timeRemaining)
  }

  // Initialize auto-refresh when store is created
  startAutoRefresh()

  return {
    // State
    activeProgram,
    isLoading,
    error,
    lastUpdated,
    autoRefreshEnabled,
    refreshInterval,

    // Computed
    hasActiveProgram,
    currentStatus,
    isRunning,
    isPaused,
    isStopped,
    isScheduled,
    isLoaded,
    statusInfo,
    canStart,
    canPause,
    canStop,
    canRemove,

    // Actions
    fetchActiveProgram,
    loadProgram,
    scheduleProgram,
    startProgram,
    pauseProgram,
    stopProgram,
    removeActiveProgram,
    skipCycle,
    updateMinCycleInterval,
    updateMaxExecutionTime,
    clearError,
    startAutoRefresh,
    stopAutoRefresh,
    setAutoRefreshEnabled,

    // Utilities
    isCycleSkipped,
    getTimeRemainingString
  }
})