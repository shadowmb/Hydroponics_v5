import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LoadingState, ErrorState } from '../types'

export const useMainStore = defineStore('main', () => {
  // State
  const isLeftDrawerOpen = ref(false)
  const loadingState = ref<LoadingState>({
    isLoading: false,
    message: undefined
  })
  const errorState = ref<ErrorState>({
    hasError: false,
    message: undefined,
    details: undefined
  })
  
  // Getters
  const isLoading = computed(() => loadingState.value.isLoading)
  const hasError = computed(() => errorState.value.hasError)
  const errorMessage = computed(() => errorState.value.message)

  // Actions
  function toggleLeftDrawer() {
    isLeftDrawerOpen.value = !isLeftDrawerOpen.value
  }

  function setLeftDrawer(state: boolean) {
    isLeftDrawerOpen.value = state
  }

  function setLoading(loading: boolean, message?: string) {
    loadingState.value = {
      isLoading: loading,
      message
    }
  }

  function setError(error: boolean, message?: string, details?: any) {
    errorState.value = {
      hasError: error,
      message,
      details
    }
  }

  function clearError() {
    errorState.value = {
      hasError: false,
      message: undefined,
      details: undefined
    }
  }

  function showNotification(message: string, type: 'positive' | 'negative' | 'warning' | 'info' = 'info') {
    // This will be implemented with Quasar Notify plugin
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  return {
    // State
    isLeftDrawerOpen,
    loadingState,
    errorState,
    
    // Getters
    isLoading,
    hasError,
    errorMessage,
    
    // Actions
    toggleLeftDrawer,
    setLeftDrawer,
    setLoading,
    setError,
    clearError,
    showNotification
  }
})