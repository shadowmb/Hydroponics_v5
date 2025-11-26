<!--
/**
 * 📦 ActionsSection - Block Action Buttons
 * ✅ Modular component extracted from ControlPanel.vue
 * Handles delete, duplicate, and advanced toggle actions
 */
-->
<template>
  <!-- Actions -->
  <div v-if="selectedBlock" class="panel-actions">
    <q-btn
      flat
      dense
      icon="delete"
      color="negative"
      @click="handleDeleteBlock"
      title="Изтрий блок"
    />
    <q-btn
      flat
      dense
      icon="content_copy"
      color="primary"
      @click="handleDuplicateBlock"
      title="Копирай блок"
    />
    <q-btn
      flat
      dense
      :icon="showAdvanced ? 'expand_less' : 'expand_more'"
      color="grey"
      @click="handleToggleAdvanced"
      :title="showAdvanced ? 'Скрий детайли' : 'Покажи детайли'"
    />
  </div>
</template>

<script setup lang="ts">
// 🔍 CRITICAL: Correct import paths for ControlPanel_Modular location
import type { BlockInstance } from '../../../../types/BlockConcept';

// Props
interface Props {
  selectedBlock?: BlockInstance;
  showAdvanced?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAdvanced: false
});

// Events
const emit = defineEmits<{
  deleteBlock: [blockId: string];
  duplicateBlock: [blockId: string];
  toggleAdvanced: [];
}>();

// Methods

/**
 * Handles delete block action
 */
function handleDeleteBlock() {
  if (props.selectedBlock) {
    emit('deleteBlock', props.selectedBlock.id);
  }
}

/**
 * Handles duplicate block action
 */
function handleDuplicateBlock() {
  if (props.selectedBlock) {
    emit('duplicateBlock', props.selectedBlock.id);
  }
}

/**
 * Handles toggle advanced mode
 */
function handleToggleAdvanced() {
  emit('toggleAdvanced');
}
</script>

<style scoped>
/* Actions Styles - Extracted from ControlPanel.vue */

.panel-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
  margin-top: 16px;
}
</style>