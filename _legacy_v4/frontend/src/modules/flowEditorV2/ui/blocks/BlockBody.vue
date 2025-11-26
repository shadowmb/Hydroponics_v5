<template>
  <!-- Block Body (not shown for compact blocks) -->
  <div v-if="!isCompact" class="block-body">
    <!-- Parameters preview with enhanced info -->
    <div v-if="hasParameters && block.definitionId !== 'container'" class="block-params-preview">
      <div
        v-for="param in previewParameters"
        :key="param.id"
        class="param-preview"
        :title="getParameterTooltip(param)"
      >
        <span class="param-label">
          {{ param.label }}:
          <span v-if="param.required" class="required-indicator">*</span>
        </span>
        <span 
          class="param-value"
          :class="{
            'param-required': param.required && !block.parameters[param.id],
            'param-invalid': validationResult?.errors?.some(e => e.field.includes(param.id))
          }"
        >
          {{ getParameterDisplayValue(param) }}
        </span>
      </div>
    </div>
    
    <!-- Container comment display (only if comment exists) -->
    <div v-if="block.definitionId === 'container' && block.parameters.comment" class="container-comment">
      {{ block.parameters.comment }}
    </div>

    <!-- Container Enter Button -->
    <div v-if="block.definitionId === 'container'" class="container-enter-section">
      <q-btn 
        flat 
        color="primary" 
        icon="login"
        label="ENTER"
        size="md"
        @click.stop="handleEnterContainer"
        class="container-enter-btn container-enter-btn-large"
      >
        <q-tooltip>Влез в контейнера</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BlockInstance } from '../../types/BlockConcept'
import type { BlockDefinition, BlockParameter } from '../../types/BlockConcept'

// Props
interface Props {
  block: BlockInstance
  blockDefinition?: BlockDefinition
  isCompact: boolean
  validationResult?: any
  maxPreviewParams?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxPreviewParams: 3
})

// Emits
const emit = defineEmits<{
  updateParameter: [paramName: string, value: any]
  variableNameChange: [oldName: string, newName: string]
  enterContainer: [containerId: string]
}>()

// Computed
const hasParameters = computed((): boolean => {
  return (props.blockDefinition?.parameters.length || 0) > 0
})

const previewParameters = computed((): BlockParameter[] => {
  if (!props.blockDefinition) return []
  
  return props.blockDefinition.parameters
    .filter(param => {
      const currentValue = props.block.parameters[param.id]
      // Показваме required параметри или такива които са променени от default
      return param.required || (currentValue !== undefined && currentValue !== param.defaultValue)
    })
    .slice(0, props.maxPreviewParams)
})

// Methods
function getParameterDisplayValue(param: BlockParameter): string {
  const value = props.block.parameters[param.id]
  
  if (value === undefined || value === null) {
    return param.required ? '[Required]' : '—'
  }
  
  if (param.type === 'select' && param.options) {
    const option = param.options.find(opt => opt.value === value)
    return option?.label || String(value)
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Не'
  }
  
  return String(value)
}

function getParameterTooltip(param: BlockParameter): string {
  const parts = [`${param.label} (${param.type})`]
  
  if (param.required) {
    parts.push('Required parameter')
  }
  
  if (param.validation) {
    if (param.validation.min !== undefined) {
      parts.push(`Min: ${param.validation.min}`)
    }
    if (param.validation.max !== undefined) {
      parts.push(`Max: ${param.validation.max}`)
    }
    if (param.validation.pattern) {
      parts.push(`Pattern: ${param.validation.pattern}`)
    }
  }
  
  return parts.join('\n')
}

function handleEnterContainer() {
  const containerId = props.block.parameters?.containerId || props.block.id
  emit('enterContainer', containerId)
}
</script>

<style scoped>
/* Body */
.block-body {
  padding: 3px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative; /* Important for absolute positioning of corner ports */
}

/* Parameters preview */
.block-params-preview {
  background: rgba(0, 0, 0, 0.43);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 10px;
  opacity: 0.8;
}

.param-preview {
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
}

.param-preview:last-child {
  margin-bottom: 0;
}

.param-label {
  opacity: 0.7;
}

.param-value {
  font-weight: 600;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.param-required {
  color: #f44336;
  font-style: italic;
}

.param-invalid {
  color: #f44336;
  text-decoration: underline;
}

.required-indicator {
  color: #f44336;
  font-weight: bold;
}

/* Container styles */
.container-comment {
  padding: 6px 8px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 11px;
  font-style: italic;
  opacity: 0.8;
}

/* Container Enter Button Styles */
.container-enter-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  margin: 4px 0;
}

.container-enter-btn {
  min-width: 80px;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.container-enter-btn:hover {
  background-color: rgba(74, 144, 226, 0.1);
  transform: scale(1.05);
}

.container-enter-btn-large {
  min-width: 120px;
  min-height: 40px;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
}
</style>