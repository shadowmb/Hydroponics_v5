// ABOUTME: Pinia store for tutorial state management and demo mode handling
// ABOUTME: Manages tutorial progress, active sessions, and mock data injection

import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import {
  Tutorial,
  TutorialProgress,
  TutorialStep,
  TutorialSessionData,
  tutorialApi
} from '../services/tutorial-service'
import { getTutorialDemoData } from '../services/tutorial-mock-data'
import sampleTutorials from '../data/sample-tutorials'
import { demoModeManager } from '../services/demo-mode-manager'
import { useControllerStore } from './controller'
import { useMainStore } from './main'

// Tutorial store types
interface TutorialState {
  // Tutorial system
  tutorials: Tutorial[]
  currentTutorial: Tutorial | null
  currentProgress: TutorialProgress | null
  isActive: boolean
  currentStepId: string

  // Demo mode
  isDemoMode: boolean
  demoData: TutorialSessionData | null
  originalData: Record<string, any> | null

  // UI State
  isOverlayVisible: boolean
  isDashboardOpen: boolean

  // Loading states
  isLoading: boolean
  errorMessage: string | null
}

export const useTutorialStore = defineStore('tutorial', () => {
  // State
  const tutorials = ref<Tutorial[]>([])
  const currentTutorial = ref<Tutorial | null>(null)
  const currentProgress = ref<TutorialProgress | null>(null)
  const isActive = ref(false)
  const currentStepId = ref('')

  const isDemoMode = ref(false)
  const demoData = ref<TutorialSessionData | null>(null)
  const originalData = ref<Record<string, any> | null>(null)

  const isOverlayVisible = ref(false)
  const isDashboardOpen = ref(false)

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Validation state
  const validationState = ref({
    isValidating: false,
    isPassed: false,
    lastError: null as string | null,
    lastChecked: null as Date | null
  })

  // Helper: Get step index from step ID
  function getStepIndex(stepId: string): number {
    if (!currentTutorial.value) return -1
    return currentTutorial.value.steps.findIndex(step => step.id === stepId)
  }

  // Helper: Get step ID from index
  function getStepId(index: number): string {
    if (!currentTutorial.value || index < 0 || index >= currentTutorial.value.steps.length) {
      return ''
    }
    return currentTutorial.value.steps[index]?.id || ''
  }

  // Getters
  const currentStep = computed((): TutorialStep | null => {
    if (!currentTutorial.value || !currentTutorial.value.steps || !currentStepId.value) {
      return null
    }
    return currentTutorial.value.steps.find(step => step.id === currentStepId.value) || null
  })

  const currentStepIndex = computed((): number => {
    if (!currentStepId.value) return 0
    return getStepIndex(currentStepId.value)
  })

  const totalSteps = computed((): number => {
    return currentTutorial.value?.steps.length || 0
  })

  const progressPercentage = computed((): number => {
    if (!currentTutorial.value) return 0
    const index = currentStepIndex.value
    return Math.round((index / currentTutorial.value.steps.length) * 100)
  })

  const completedSteps = computed((): string[] => {
    return currentProgress.value?.completedSteps || []
  })

  const canGoNext = computed((): boolean => {
    return currentStepIndex.value < totalSteps.value - 1
  })

  const canGoPrevious = computed((): boolean => {
    return currentStepIndex.value > 0
  })

  const isLastStep = computed((): boolean => {
    return currentStepIndex.value === totalSteps.value - 1
  })

  const tutorialsByCategory = computed(() => {
    return (category: string) => tutorials.value.filter(t => t.category === category)
  })

  const availableTutorials = computed((): Tutorial[] => {
    // Filter based on prerequisites and completion status
    return tutorials.value.filter(tutorial => {
      if (!tutorial.prerequisites || tutorial.prerequisites.length === 0) {
        return true
      }
      // Check if all prerequisites are completed
      // This would need to be enhanced with actual progress data
      return true
    })
  })

  // Actions
  async function loadTutorials(category?: string): Promise<void> {
    try {
      isLoading.value = true
      errorMessage.value = null

      try {
        // Try to load from API first
        if (category) {
          tutorials.value = await tutorialApi.getByCategory(category)
        } else {
          tutorials.value = await tutorialApi.getAll({ isActive: true })
        }
      } catch (apiError) {
        // Fallback to sample tutorials if API is not available
        console.log('API not available, using sample tutorials')
        let fallbackTutorials = sampleTutorials

        if (category) {
          fallbackTutorials = sampleTutorials.filter(t => t.category === category && t.isActive)
        } else {
          fallbackTutorials = sampleTutorials.filter(t => t.isActive)
        }

        tutorials.value = fallbackTutorials
      }
    } catch (error: any) {
      errorMessage.value = error.message || 'Failed to load tutorials'
      console.error('Failed to load tutorials:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function startTutorial(tutorialId: string): Promise<boolean> {
    try {
      isLoading.value = true
      errorMessage.value = null

      // Get tutorial details by tutorialId first
      const tutorial = await tutorialApi.getByTutorialId(tutorialId)
      currentTutorial.value = tutorial

      // Check existing progress for dialog logic
      let existingProgress: TutorialProgress | null = null
      try {
        existingProgress = await tutorialApi.getProgress(tutorial._id)
        if (existingProgress) {
          // Show dialog asking to continue or restart
          const shouldRestart = await new Promise<boolean>((resolve) => {
            // For now, automatically continue (no dialog)
            console.log(`Found existing progress at step: ${existingProgress!.currentStep}`)
            resolve(false) // Continue from current step
          })

          if (shouldRestart) {
            console.log('User chose to restart tutorial')
            const progress = await tutorialApi.start(tutorial._id, true)
            currentProgress.value = progress
          } else {
            console.log('User chose to continue tutorial')
            const progress = await tutorialApi.start(tutorial._id, false)
            currentProgress.value = progress
          }
        } else {
          console.log('No existing progress found, starting fresh...')
          const progress = await tutorialApi.start(tutorial._id, false)
          currentProgress.value = progress
        }
      } catch (error) {
        console.log('No existing progress found, starting fresh...')
        const progress = await tutorialApi.start(tutorial._id, false)
        currentProgress.value = progress
      }

      // Load demo data if available
      if (tutorial.mockData && Object.keys(tutorial.mockData).length > 0) {
        await setupDemoMode(tutorialId)
      }

      // Set initial state - start from first step or resume from saved progress
      if (currentProgress.value?.currentStep) {
        currentStepId.value = currentProgress.value.currentStep
      } else {
        currentStepId.value = tutorial.steps[0]?.id || ''
      }

      // Ensure sidebar is open for navigation steps BEFORE showing overlay
      const mainStore = useMainStore()
      if (!mainStore.isLeftDrawerOpen) {
        console.log('[TutorialStore] Opening sidebar for tutorial')
        mainStore.setLeftDrawer(true)
        // Wait for sidebar animation to complete
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      isActive.value = true
      isOverlayVisible.value = true

      return true
    } catch (error: any) {
      errorMessage.value = error.message || 'Failed to start tutorial'
      console.error('Failed to start tutorial:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function updateProgress(stepId?: string): Promise<void> {
    if (!currentTutorial.value || !currentProgress.value) return

    try {
      const targetStepId = stepId || currentStepId.value

      // Prepare updates
      const updates = {
        currentStep: targetStepId,
        completedSteps: [...completedSteps.value]
      }

      // Add current step to completed if not already there
      if (!updates.completedSteps.includes(currentStepId.value)) {
        updates.completedSteps.push(currentStepId.value)
      }

      // Try to update backend progress using MongoDB _id
      try {
        currentProgress.value = await tutorialApi.updateProgress(
          currentTutorial.value._id,
          updates
        )
      } catch (apiError) {
        console.log('API progress update failed, continuing with local update:', apiError)
        // Update local progress object as fallback
        currentProgress.value = {
          ...currentProgress.value,
          currentStep: updates.currentStep,
          completedSteps: updates.completedSteps,
          updatedAt: new Date().toISOString()
        }
      }

      if (stepId) {
        currentStepId.value = stepId
      }
    } catch (error: any) {
      errorMessage.value = error.message || 'Failed to update progress'
      console.error('Failed to update progress:', error)
    }
  }

  async function nextStep(): Promise<void> {
    if (!canGoNext.value || !currentTutorial.value) return

    const nextIndex = currentStepIndex.value + 1
    const nextStepId = getStepId(nextIndex)
    if (nextStepId) {
      await updateProgress(nextStepId)
    }
  }

  async function previousStep(): Promise<void> {
    if (!canGoPrevious.value || !currentTutorial.value) return

    const prevIndex = currentStepIndex.value - 1
    const prevStepId = getStepId(prevIndex)
    if (prevStepId) {
      currentStepId.value = prevStepId
      await updateProgress()
    }
  }

  async function goToStep(stepIndex: number): Promise<void> {
    if (stepIndex < 0 || stepIndex >= totalSteps.value || !currentTutorial.value) return

    const targetStepId = getStepId(stepIndex)
    if (targetStepId) {
      await updateProgress(targetStepId)
    }
  }

  // Callback to trigger when tutorial completes (e.g., close dialogs)
  const onTutorialCompleteCallback = ref<(() => void) | null>(null)

  function setCompletionCallback(callback: (() => void) | null): void {
    onTutorialCompleteCallback.value = callback
  }

  async function completeTutorial(): Promise<boolean> {
    if (!currentTutorial.value) return false

    try {
      isLoading.value = true

      // Complete tutorial - delete progress and mark tutorial as completed
      try {
        console.log('Completing tutorial and deleting progress')
        await tutorialApi.complete(currentTutorial.value._id)
      } catch (apiError) {
        console.log('API call failed, continuing with local completion:', apiError)
        // Continue anyway - backend will remain out of sync but UI will work
      }

      // Clean up demo mode
      await exitDemoMode()

      // Trigger completion callback (e.g., close controller dialog)
      if (onTutorialCompleteCallback.value) {
        onTutorialCompleteCallback.value()
        onTutorialCompleteCallback.value = null
      }

      // Reset state
      resetTutorialState()

      return true
    } catch (error: any) {
      errorMessage.value = error.message || 'Failed to complete tutorial'
      console.error('Failed to complete tutorial:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function exitTutorial(): Promise<void> {
    try {
      // Simply close tutorial - progress remains in DB
      console.log('Exiting tutorial, progress remains saved')

      // Clean up demo mode
      await exitDemoMode()

      // Reset state
      resetTutorialState()
    } catch (error: any) {
      console.error('Failed to exit tutorial cleanly:', error)
      // Force reset even if save failed
      resetTutorialState()
    }
  }

  function resetTutorialState(): void {
    currentTutorial.value = null
    currentProgress.value = null
    isActive.value = false
    currentStepId.value = ''
    isOverlayVisible.value = false
    errorMessage.value = null
    resetValidation()
  }

  // Demo Mode Functions
  async function setupDemoMode(tutorialId: string): Promise<void> {
    try {
      const controllerStore = useControllerStore()

      // Get demo data from local mock data service (fallback to API if available)
      let tutorialDemoData: TutorialSessionData

      try {
        // Try to get demo data from API first
        tutorialDemoData = await tutorialApi.getDemoData(tutorialId)
      } catch (apiError) {
        // Fallback to local mock data
        console.log('API demo data not available, using local mock data')
        tutorialDemoData = getTutorialDemoData(tutorialId)
      }

      // Store original data for restoration (get real data from stores)
      originalData.value = {
        timestamp: Date.now(),
        controllers: JSON.parse(JSON.stringify(controllerStore.controllers)),
        devices: [], // TODO: Get from device store when needed
        programs: [] // TODO: Get from program store when needed
      }

      // Enable demo mode in DemoModeManager
      await demoModeManager.enableDemoMode(controllerStore.controllers)

      // Set demo data
      demoData.value = tutorialDemoData
      isDemoMode.value = true

      // Reload controller store to get mock data
      await controllerStore.fetchControllers()

      console.log('Demo mode activated for tutorial:', tutorialId)
      console.log('Demo data loaded:', {
        controllers: tutorialDemoData.controllers.length,
        devices: tutorialDemoData.devices.length,
        flows: tutorialDemoData.flows.length,
        programs: tutorialDemoData.programs.length
      })
    } catch (error: any) {
      console.error('Failed to setup demo mode:', error)
      // Continue without demo mode
      isDemoMode.value = false
      demoData.value = null
    }
  }

  async function exitDemoMode(): Promise<void> {
    if (!isDemoMode.value) return

    try {
      const controllerStore = useControllerStore()

      // Disable demo mode in DemoModeManager and get backup
      const backup = await demoModeManager.disableDemoMode()

      // Restore original data to stores
      if (backup && originalData.value) {
        console.log('Restoring original data after demo mode')

        // Restore controllers
        controllerStore.controllers = backup.controllers

        // TODO: Restore devices when device demo mode is needed
        // TODO: Restore programs when program demo mode is needed
      }

      // Clear demo state
      isDemoMode.value = false
      demoData.value = null
      originalData.value = null

      console.log('Demo mode deactivated')
    } catch (error: any) {
      console.error('Failed to exit demo mode cleanly:', error)

      // Force disable demo mode even if restoration failed
      await demoModeManager.disableDemoMode()
      isDemoMode.value = false
      demoData.value = null
      originalData.value = null
    }
  }

  // UI Actions
  function showDashboard(): void {
    isDashboardOpen.value = true
  }

  function hideDashboard(): void {
    isDashboardOpen.value = false
  }

  function showOverlay(): void {
    isOverlayVisible.value = true
  }

  function hideOverlay(): void {
    isOverlayVisible.value = false
  }

  function clearError(): void {
    errorMessage.value = null
  }

  // Validation Helpers
  function markStepValidated(stepId: string, success: boolean): void {
    validationState.value.isPassed = success
    validationState.value.lastChecked = new Date()

    if (success && !completedSteps.value.includes(stepId)) {
      // Mark step as completed in progress
      if (currentProgress.value) {
        currentProgress.value.completedSteps.push(stepId)
      }
    }
  }

  function setValidationError(error: string): void {
    validationState.value.lastError = error
    validationState.value.isPassed = false
  }

  function resetValidation(): void {
    validationState.value.isValidating = false
    validationState.value.isPassed = false
    validationState.value.lastError = null
    validationState.value.lastChecked = null
  }

  // Mock Data Helpers (for integration with other stores)
  function getMockControllers(): any[] {
    return demoData.value?.controllers || []
  }

  function getMockDevices(): any[] {
    return demoData.value?.devices || []
  }

  function getMockFlows(): any[] {
    return demoData.value?.flows || []
  }

  function getMockPrograms(): any[] {
    return demoData.value?.programs || []
  }

  // Reset all tutorial data
  async function resetAll(): Promise<void> {
    try {
      await tutorialApi.reset()
      await loadTutorials()
      resetTutorialState()
    } catch (error: any) {
      errorMessage.value = error.message || 'Failed to reset tutorial data'
      console.error('Failed to reset all tutorial data:', error)
    }
  }

  return {
    // State
    tutorials,
    currentTutorial,
    currentProgress,
    isActive,
    currentStepId,
    isDemoMode,
    demoData,
    isOverlayVisible,
    isDashboardOpen,
    isLoading,
    errorMessage,
    validationState,

    // Getters
    currentStep,
    currentStepIndex,
    totalSteps,
    progressPercentage,
    completedSteps,
    canGoNext,
    canGoPrevious,
    isLastStep,
    tutorialsByCategory,
    availableTutorials,

    // Actions
    loadTutorials,
    startTutorial,
    updateProgress,
    nextStep,
    previousStep,
    goToStep,
    completeTutorial,
    exitTutorial,
    resetTutorialState,
    setCompletionCallback,

    // Validation
    markStepValidated,
    setValidationError,
    resetValidation,

    // Demo Mode
    setupDemoMode,
    exitDemoMode,
    getMockControllers,
    getMockDevices,
    getMockFlows,
    getMockPrograms,

    // UI Actions
    showDashboard,
    hideDashboard,
    showOverlay,
    hideOverlay,
    clearError,
    resetAll
  }
})