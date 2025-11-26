<template>
  <div 
    class="block-header" 
    :style="{ backgroundColor: categoryColor }"
  >
    <q-icon 
      :name="categoryIcon"
      class="block-icon"
    />
    <span class="block-name" :title="blockDefinition?.description">
      <template v-if="isCompact">
        {{ compactBlockDisplayName }}
      </template>
      <template v-else>
        {{ regularBlockDisplayName }}
      </template>
    </span>
    
    <!-- Status indicators with enhanced tooltips -->
    <div class="block-status">
      <!-- Deprecated indicator -->
      <q-icon
        v-if="blockSchema?.deprecated"
        name="warning"
        class="status-deprecated"
        size="xs"
        title="Този блок е остарял"
      />
      <q-icon
        v-else-if="hasErrors"
        name="error"
        class="status-error"
        size="xs"
        :title="validationTooltip || 'Блокът има грешки'"
      />
      <q-icon
        v-else-if="hasWarnings"
        name="warning"
        class="status-warning"
        size="xs"
        :title="validationTooltip || 'Блокът има предупреждения'"
      />
      <q-icon
        v-else-if="validationResult?.isValid"
        name="check_circle"
        class="status-success"
        size="xs"
        :title="validationTooltip || 'Блокът е валиден'"
      />

      <!-- Delete button -->
      <q-icon
        name="delete"
        class="delete-button"
        size="xs"
        title="Изтрий блок"
        @click.stop="handleDeleteClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VariableManager } from '../../services/VariableManager'
import type { BlockInstance } from '../../types/BlockConcept'
import type { BlockDefinition } from '../../types/BlockConcept'

// Props
interface Props {
  block: BlockInstance
  blockDefinition?: BlockDefinition
  blockSchema?: any
  categoryColor: string
  categoryIcon: string
  isCompact: boolean
  hasErrors: boolean
  hasWarnings: boolean
  validationResult?: any
  validationTooltip?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  deleteBlock: []
}>()

// Computed
const regularBlockDisplayName = computed((): string => {
  if (!props.blockDefinition) return 'Неизвестен блок'
  
  // Use customName for regular blocks, fallback to definition name
  return props.block.parameters.customName || props.blockDefinition.name
})

const compactBlockDisplayName = computed((): string => {
  if (!props.blockDefinition) return 'Неизвестен блок'
  
  // Special handling for setVarName - show only SAVED names, not local changes
  if (props.blockDefinition.id === 'setVarName') {
    const internalVar = props.block.parameters.internalVar
    
    if (internalVar && VariableManager.isValidInternalVar(internalVar)) {
      // Show only globally saved display name - no local changes until Save is clicked
      const globalDisplayName = VariableManager.getDisplayName(internalVar)
      return globalDisplayName || internalVar
    } else {
      // No variable selected - show default name
      return props.blockDefinition.name
    }
  }
  
  // For other blocks, use customName or definition name
  return props.block.parameters.customName || props.blockDefinition.name
})

// Event Handlers
function handleDeleteClick(event: MouseEvent) {
  event.stopPropagation()
  emit('deleteBlock')
}
</script>

<style scoped>
/* Header - Colored category bar */
.block-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px 6px 0 0;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.block-icon {
  font-size: 16px;
  color: white;
  opacity: 0.95;
}

.block-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: white;
  opacity: 1;
}

.block-status {
  display: flex;
  align-items: center;
  gap: 2px;
}

.status-success {
  color: #4caf50;
}

.status-error {
  color: #f44336;
}

.status-warning {
  color: #ff9800;
}

.status-deprecated {
  color: #ff9800;
}

/* Delete button styling */
.delete-button {
  margin-left: 4px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s ease;
  opacity: 0.7;
}

.delete-button:hover {
  color: #f44336;
  opacity: 1;
  transform: scale(1.1);
}

/* Compact block header styling */
.block-renderer.block-compact .block-header {
  padding: 6px 30px 6px 8px !important; /* More padding on right for output port + delete */
  font-size: 11px !important; /* Slightly smaller font */
  height: 32px !important; /* Fixed header height */
  display: flex;
  align-items: center;
  position: relative;
  width: 220px !important; /* Fixed width 220px - NO fit-content */
  box-sizing: border-box; /* Include padding in width calculation */
}

.block-renderer.block-compact .block-name {
  font-weight: 500;
  white-space: nowrap;
  display: inline-block;
  overflow: hidden; /* Hide overflow text */
  text-overflow: ellipsis; /* Show ... when text is too long */
  max-width: calc(100% - 40px); /* Reserve space for icon + delete button */
  flex: 1; /* Take remaining space */
}
</style>