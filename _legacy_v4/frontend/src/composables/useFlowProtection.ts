/**
 * 🛡️ useFlowProtection Composable
 * ✅ Reusable protection logic за flow operations
 * Следва Vue 3 Composition API patterns от системата
 * Created: 2025-08-10
 */

import { ref, computed } from 'vue'
import { flowTemplateApi } from '../services/api'

interface ProtectionInfo {
  isProtected: boolean
  canEdit: boolean
  usageCount: number
  linkedTemplates: {
    templateId: string
    templateName: string
    syncStatus: string
  }[]
  message?: string
}

export function useFlowProtection() {
  // Reactive state
  const protectionInfo = ref<ProtectionInfo | null>(null)
  const isCheckingProtection = ref(false)
  const lastChecked = ref<Date | null>(null)

  // Computed properties
  const isProtected = computed(() => {
    return protectionInfo.value?.isProtected || false
  })

  const canEdit = computed(() => {
    return protectionInfo.value?.canEdit !== false
  })

  const usageCount = computed(() => {
    return protectionInfo.value?.usageCount || 0
  })

  const protectionMessage = computed(() => {
    if (!protectionInfo.value) return ''
    
    if (protectionInfo.value.isProtected) {
      const count = protectionInfo.value.usageCount
      return `Потокът се използва в ${count} ActionTemplate${count > 1 ? 'а' : ''}`
    }
    
    return 'Потокът не се използва в ActionTemplates'
  })

  // Main protection check function
  const checkProtection = async (flowTemplateId: string) => {
    try {
      isCheckingProtection.value = true
      
      const result = await flowTemplateApi.checkProtection(flowTemplateId)
      
      protectionInfo.value = result
      lastChecked.value = new Date()
      
      return result
      
    } catch (error) {
      console.error('Protection check error:', error)
      
      // Fallback protection info
      protectionInfo.value = {
        isProtected: false,
        canEdit: true,
        usageCount: 0,
        linkedTemplates: [],
        message: 'Грешка при проверка на защитата'
      }
      
      throw error
      
    } finally {
      isCheckingProtection.value = false
    }
  }

  // Check protection by flowId
  const checkProtectionByFlowId = async (flowId: string) => {
    try {
      isCheckingProtection.value = true
      
      const result = await flowTemplateApi.checkUsage(flowId)
      
      protectionInfo.value = result
      lastChecked.value = new Date()
      
      return result
      
    } catch (error) {
      console.error('Protection check by flowId error:', error)
      throw error
      
    } finally {
      isCheckingProtection.value = false
    }
  }

  // Protection status helpers за UI
  const getProtectionStatusColor = () => {
    if (!protectionInfo.value) return 'grey-5'
    return protectionInfo.value.isProtected ? 'negative' : 'positive'
  }

  const getProtectionStatusIcon = () => {
    if (!protectionInfo.value) return 'help'
    return protectionInfo.value.isProtected ? 'lock' : 'lock_open'
  }

  const getProtectionStatusLabel = () => {
    if (!protectionInfo.value) return 'Неизвестно'
    return protectionInfo.value.isProtected ? 'Защитен' : 'Свободен'
  }

  // Validation helpers за UI actions
  const validateEdit = (showNotification?: (message: string) => void) => {
    if (isProtected.value && showNotification) {
      showNotification(protectionMessage.value + ' и не може да се редактира')
      return false
    }
    return true
  }

  const validateDelete = (showNotification?: (message: string) => void) => {
    if (isProtected.value && showNotification) {
      showNotification(protectionMessage.value + ' и не може да се изтрие')
      return false
    }
    return true
  }

  // Reset protection state
  const clearProtection = () => {
    protectionInfo.value = null
    isCheckingProtection.value = false
    lastChecked.value = null
  }

  // Return all reactive state and methods
  return {
    // Reactive state
    protectionInfo,
    isCheckingProtection,
    lastChecked,
    
    // Computed properties
    isProtected,
    canEdit,
    usageCount,
    protectionMessage,
    
    // Methods
    checkProtection,
    checkProtectionByFlowId,
    clearProtection,
    validateEdit,
    validateDelete,
    
    // Helper functions
    getProtectionStatusColor,
    getProtectionStatusIcon,
    getProtectionStatusLabel
  }
}

// Export type за TypeScript support
export type FlowProtectionComposable = ReturnType<typeof useFlowProtection>