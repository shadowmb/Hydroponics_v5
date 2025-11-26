/**
 * 🎯 useFlowValidation Composable
 * ✅ Reusable validation logic за flow operations
 * Следва Vue 3 Composition API patterns от системата
 * Created: 2025-08-10
 */

import { ref, computed, type Ref } from 'vue'
import { UniversalValidationService, type ValidationResult } from '../services/UniversalValidationService'
import type { FlowDefinition } from '../modules/flowEditorV2/types/FlowDefinition'

export function useFlowValidation() {
  // Reactive state
  const validationResult = ref<ValidationResult | null>(null)
  const isValidating = ref(false)
  const lastValidated = ref<Date | null>(null)

  // Computed properties за validation status
  const validationStatus = computed(() => {
    return validationResult.value?.status || 'draft'
  })

  const canUseInActionTemplate = computed(() => {
    return validationResult.value?.canUseInActionTemplate || false
  })

  const hasErrors = computed(() => {
    return validationResult.value?.errors?.length > 0 || false
  })

  const hasWarnings = computed(() => {
    return validationResult.value?.warnings?.length > 0 || false
  })

  // Validation status styling helpers
  const getValidationStatusColor = (status?: string) => {
    const s = status || validationStatus.value
    switch(s) {
      case 'ready': return 'positive'
      case 'validated': return 'warning'
      case 'invalid': return 'negative'
      case 'draft': return 'info'
      default: return 'grey-5'
    }
  }

  const getValidationStatusIcon = (status?: string) => {
    const s = status || validationStatus.value
    switch(s) {
      case 'ready': return 'check_circle'
      case 'validated': return 'warning'
      case 'invalid': return 'error'
      case 'draft': return 'edit'
      default: return 'help'
    }
  }

  const getValidationStatusLabel = (status?: string) => {
    const s = status || validationStatus.value
    switch(s) {
      case 'ready': return 'Готов за ActionTemplate'
      case 'validated': return 'Валидиран (липсват targets)'
      case 'invalid': return 'Невалиден'
      case 'draft': return 'В разработка'
      default: return 'Неизвестен'
    }
  }

  // Target directory determination
  const getTargetDirectory = (status?: string) => {
    const s = status || validationStatus.value
    if (s === 'draft' || s === 'invalid') {
      return '/flow-templates/drafts/'
    } else {
      return '/flow-templates/flows/'
    }
  }

  const getTargetDirectoryMessage = (status?: string) => {
    const dir = getTargetDirectory(status)
    if (dir.includes('/flows/')) {
      return 'Ще се запази във /flows/ (готов за използване)'
    } else {
      return 'Ще се запази във /drafts/ (в процес на разработка)'
    }
  }

  // Main validation function
  const validateFlow = async (
    flowData: FlowDefinition,
    options = { mode: 'full' as const }
  ) => {
    try {
      isValidating.value = true
      
      const result = await UniversalValidationService.validateFlow(flowData, options)
      
      validationResult.value = result
      lastValidated.value = new Date()
      
      return result
      
    } catch (error) {
      console.error('Flow validation error:', error)
      
      // Fallback validation result
      validationResult.value = {
        status: 'invalid',
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Грешка при валидация на потока',
          severity: 'critical'
        }],
        warnings: [],
        canUseInActionTemplate: false,
        summary: {
          totalChecks: 1,
          passedChecks: 0,
          failedChecks: 1,
          structureScore: 0,
          logicScore: 0,
          targetScore: 0
        }
      }
      
      throw error
      
    } finally {
      isValidating.value = false
    }
  }

  // Quick validation (structure only)
  const quickValidate = (flowData: FlowDefinition) => {
    return validateFlow(flowData, { mode: 'quick' })
  }

  // Validation result helpers за UI display
  const formatErrors = computed(() => {
    if (!validationResult.value?.errors) return []
    
    return validationResult.value.errors.map(error => ({
      ...error,
      displayMessage: error.message,
      severity: error.severity || 'error'
    }))
  })

  const formatWarnings = computed(() => {
    if (!validationResult.value?.warnings) return []
    
    return validationResult.value.warnings.map(warning => ({
      ...warning,
      displayMessage: warning.message,
      severity: warning.severity || 'warning'
    }))
  })

  // Reset validation state
  const clearValidation = () => {
    validationResult.value = null
    isValidating.value = false
    lastValidated.value = null
  }

  // Return all reactive state and methods
  return {
    // Reactive state
    validationResult,
    isValidating,
    lastValidated,
    
    // Computed properties
    validationStatus,
    canUseInActionTemplate,
    hasErrors,
    hasWarnings,
    formatErrors,
    formatWarnings,
    
    // Methods
    validateFlow,
    quickValidate,
    clearValidation,
    
    // Helper functions
    getValidationStatusColor,
    getValidationStatusIcon,
    getValidationStatusLabel,
    getTargetDirectory,
    getTargetDirectoryMessage
  }
}

// Export type за TypeScript support
export type FlowValidationComposable = ReturnType<typeof useFlowValidation>