/**
 * 🗃️ Block Data Composable
 * ✅ Manages all data-related computations for block components
 * 🎯 Clean separation of data logic from UI rendering
 */

import { computed, inject, ref } from 'vue'
import {
  getBlockDefinition as getAdapterBlockDefinition,
  getBlockSchema
} from '../ui/adapters/BlockFactoryAdapter'
import type { BlockInstance } from '../types/BlockConcept'
import type { BlockDefinition } from '../types/BlockConcept'
import { validateBlock } from '../validation/BlockValidator'

export function useBlockData(
  block: BlockInstance,
  showValidation: boolean = true
) {
  // Get validation context from parent (inject must be at top level)
  const connections = inject('currentConnections', ref([]))
  const allBlocks = inject('currentBlocks', ref([]))

  // Core block data
  const blockDefinition = computed((): BlockDefinition | undefined => {
    // Get definition from new system via adapter
    const definition = getAdapterBlockDefinition(block.definitionId)
    return definition
  })

  const blockSchema = computed(() => {
    const adapterSchema = getBlockSchema(block.definitionId)
    return adapterSchema
  })

  // Visual properties
  const categoryColor = computed((): string => {
    // 🎨 PRIORITY 1: Custom user-selected color (highest priority)
    const customColor = block.parameters?.customHeaderColor
    if (customColor && typeof customColor === 'string' && customColor.trim()) {
      return customColor
    }
    
    // 🎨 PRIORITY 2: Block definition color (from .block.ts file)
    const blockColor = blockDefinition.value?.color
    if (blockColor && typeof blockColor === 'string' && blockColor.trim()) {
      return blockColor
    }
    
    // 🎨 PRIORITY 3: Category-based color (fallback)
    const category = blockDefinition.value?.category
    const categoryColors: Record<string, string> = {
      'Сензори': '#4CAF50',       // Green
      'Актуатори': '#2196F3',     // Blue
      'Логика': '#9C27B0',        // Purple
      'Управление': '#FF9800',    // Orange
      'Условия': '#E91E63',       // Pink
      'Таймери': '#009688',       // Teal
      'Уведомления': '#FFC107',   // Amber
      'Променливи': '#607D8B',    // Blue Grey
      'Поток': '#795548',         // Brown
    }
    
    return categoryColors[category || ''] || '#424242'
  })

  const categoryIcon = computed((): string => {
    const category = blockDefinition.value?.category
    const categoryIcons: Record<string, string> = {
      'Сензори': 'sensors',
      'Актуатори': 'settings_remote',
      'Логика': 'psychology',
      'Управление': 'tune',
      'Условия': 'rule',
      'Таймери': 'schedule',
      'Уведомления': 'notifications',
      'Променливи': 'data_object',
      'Поток': 'account_tree',
    }
    return categoryIcons[category || ''] || 'extension'
  })

  // Validation properties with reactive triggers
  const validationResult = computed(() => {
    if (!showValidation) return null

    // Use imported validation function
    try {
      console.log('🔧 [useBlockData] Starting validation for block:', block.id)

      // Force reactivity by accessing block properties
      // This ensures computed triggers when block parameters change
      const _triggerReactivity = {
        parameters: block.parameters,
        definitionId: block.definitionId,
        position: block.position
      }

      // Perform immediate validation for UI feedback
      const result = validateBlock(block, connections.value, allBlocks.value)

      // Debug logging
      if (result.errors.length > 0 || result.warnings.length > 0) {
        console.log(`🔍 [useBlockData] Validation for block ${block.id}:`, {
          blockType: block.definitionId,
          hasParameters: Object.keys(block.parameters || {}).length > 0,
          hasConnections: connections.value.filter(conn =>
            conn.sourceBlockId === block.id || conn.targetBlockId === block.id
          ).length > 0,
          errors: result.errors,
          warnings: result.warnings,
          isValid: result.isValid
        })
      }

      return {
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        status: result.status,
        summary: result.summary
      }
    } catch (error) {
      console.error('❌ [useBlockData] Validation system FAILED to load:', error)
      console.error('❌ This means validation will always show as valid!')
      // Fallback to basic validation
      return {
        isValid: true,
        errors: [],
        warnings: [],
        status: 'valid',
        summary: { totalIssues: 0, criticalErrors: 0, regularErrors: 0, warnings: 0 }
      }
    }
  })

  const hasErrors = computed((): boolean => {
    if (validationResult.value) {
      return !validationResult.value.isValid
    }
    return block.meta?.status === 'invalid' || (block.meta?.errors?.length || 0) > 0
  })

  const hasWarnings = computed((): boolean => {
    if (validationResult.value) {
      return validationResult.value.warnings.length > 0
    }
    return block.meta?.status === 'warning' || (block.meta?.warnings?.length || 0) > 0
  })

  const validationTooltip = computed((): string => {
    if (!validationResult.value) return ''
    
    const result = validationResult.value
    const parts = []
    
    if (result.isValid && result.warnings.length === 0) {
      parts.push('✅ Валиден блок')
    } else {
      if (result.errors.length > 0) {
        parts.push('❌ Грешки:')
        result.errors.forEach(error => parts.push(`  • ${error.message}`))
      }
      
      if (result.warnings.length > 0) {
        parts.push('⚠️ Предупреждения:')
        result.warnings.forEach(warning => parts.push(`  • ${warning.message}`))
      }
    }
    
    return parts.join('\n')
  })

  // Block type properties
  const isCompactBlock = computed((): boolean => {
    return blockDefinition.value?.blockType === 'support'
  })

  const blockType = computed((): string => {
    return blockDefinition.value?.type || 'unknown'
  })

  // Block naming
  const blockDisplayName = computed((): string => {
    if (!blockDefinition.value) return 'Неизвестен блок'
    
    // Use customName if available, fallback to definition name
    return block.parameters?.customName || blockDefinition.value?.name
  })

  // System information
  const isSystemBlock = computed((): boolean => {
    return false // Simplified for now - can be enhanced later
  })

  const blockVersion = computed((): string => {
    return blockSchema.value?.version || '1.0.0'
  })

  const isDeprecated = computed((): boolean => {
    return blockSchema.value?.deprecated === true
  })

  // Schema information for debugging
  const schemaInfo = computed((): string => {
    if (!blockSchema.value) return ''
    
    const parts = [
      `Schema: ${block.definitionId}`,
      `Version: ${blockSchema.value.version}`,
      `Category: ${blockDefinition.value?.category}`,
    ]
    
    if (blockSchema.value.deprecated) {
      parts.push(`⚠️ Deprecated`)
    }
    
    if (block.meta?.containerId) {
      parts.push(`Container: ${block.meta.containerId}`)
    }
    
    return parts.join('\n')
  })

  return {
    // Core data
    blockDefinition,
    blockSchema,
    
    // Visual properties
    categoryColor,
    categoryIcon,
    
    // Validation
    validationResult,
    hasErrors,
    hasWarnings,
    validationTooltip,
    
    // Block properties
    isCompactBlock,
    blockType,
    blockDisplayName,
    isSystemBlock,
    blockVersion,
    isDeprecated,
    
    // Debug info
    schemaInfo
  }
}

export type BlockDataComposable = ReturnType<typeof useBlockData>