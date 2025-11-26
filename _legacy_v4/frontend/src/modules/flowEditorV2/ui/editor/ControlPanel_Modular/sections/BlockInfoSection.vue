<!--
/**
 * 📦 BlockInfoSection - Block Header & Basic Information
 * ✅ Modular component extracted from ControlPanel.vue
 * Displays block icon, name, type, description, schema info, container comment
 */
-->
<template>
  <div class="block-info">
    <!-- Block Header Info -->
    <div class="block-header-info">
      <div class="block-icon-wrapper">
        <q-icon 
          :name="blockDefinition?.icon || 'widgets'" 
          :color="getBlockColor()"
          size="lg"
        />
      </div>
      <div class="block-basic-info">
        <!-- Editable Block Name -->
        <div class="block-name-section">
          <q-input
            v-model="blockCustomName"
            :placeholder="blockDefinition?.name || 'Неизвестен блок'"
            label="Име на блока"
            outlined
            dense
            @update:model-value="updateBlockName"
            class="block-name-input"
          >
            <template v-slot:prepend>
              <q-icon name="edit" size="xs" />
            </template>
          </q-input>
        </div>
        <div class="block-type">{{ blockDefinition?.category }}</div>
        <div class="block-id">ID: {{ selectedBlock.id }}</div>
      </div>
    </div>

    <!-- Description -->
    <div v-if="blockDefinition?.description" class="block-description">
      <q-icon name="info_outline" size="xs" />
      <span>{{ blockDefinition.description }}</span>
    </div>

    <!-- Schema Info -->
    <div v-if="showAdvanced && blockSchema" class="schema-info">
      <div class="info-section-header">
        <q-icon name="schema" size="xs" />
        Schema Information
      </div>
      <div class="info-items">
        <div class="info-item">
          <span class="info-label">Version:</span>
          <span class="info-value">{{ blockSchema.version }}</span>
        </div>
        <div v-if="blockSchema.deprecated" class="info-item warning">
          <span class="info-label">Status:</span>
          <span class="info-value">⚠️ Deprecated</span>
        </div>
      </div>
    </div>

    <!-- Container Comment Field -->
    <div v-if="selectedBlock?.definitionId === 'container'" class="container-comment-section">
      <div class="info-section-header">
        <q-icon name="comment" size="xs" />
        Коментар
      </div>
      <div class="comment-input-wrapper">
        <q-input
          :model-value="selectedBlock?.parameters?.comment || ''"
          @update:model-value="(value) => updateParameterValue('comment', value)"
          label="Описание на контейнера (незадължително)"
          outlined
          dense
          type="textarea"
          rows="2"
          maxlength="100"
          counter
          placeholder="Въведете описание какво съдържа контейнера..."
          class="comment-textarea"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
// 🔍 CRITICAL: Correct import paths for ControlPanel_Modular location
import type { 
  BlockInstance, 
  BlockDefinition 
} from '../../../../types/BlockConcept';
// ❌ Legacy import removed - using adapter now
// import { BlockFactory } from '../../../../core/blocks/legacy-BlockFactory';
import { getBlockDefinition as getAdapterBlockDefinition, getBlockSchema as getAdapterBlockSchema } from '../../../../ui/adapters/BlockFactoryAdapter';

// Props
interface Props {
  selectedBlock: BlockInstance;
  blockDefinition?: BlockDefinition;
  showAdvanced?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAdvanced: false
});

// Events
const emit = defineEmits<{
  parameterUpdated: [paramId: string, value: any];
  blockNameUpdated: [newName: string];
}>();

// Local state for block name editing
const blockCustomName = ref('');

// Watch selected block changes to update custom name
watch(
  () => props.selectedBlock,
  (newBlock) => {
    if (newBlock) {
      // Use custom name if exists, otherwise empty for placeholder
      blockCustomName.value = newBlock.parameters?.customName || '';
    } else {
      blockCustomName.value = '';
    }
  },
  { immediate: true }
);

// Computed properties
const blockSchema = computed(() => {
  if (!props.selectedBlock) return undefined;
  return getAdapterBlockSchema(props.selectedBlock.definitionId) || BlockFactory.getBlockSchema(props.selectedBlock.definitionId);
});

// Methods
function getBlockColor(): string {
  return props.blockDefinition?.color?.replace('#', '') || 'primary';
}

/**
 * Updates the custom name of the selected block
 * @param newName - New custom name for the block
 */
function updateBlockName(newName: string) {
  if (!props.selectedBlock) return;
  
  // Update the block's parameters with custom name
  if (newName.trim()) {
    props.selectedBlock.parameters.customName = newName.trim();
  } else {
    // Remove custom name if empty (use default)
    delete props.selectedBlock.parameters.customName;
  }
  
  // Emit event to notify parent
  emit('blockNameUpdated', newName);
}

/**
 * Updates a parameter value (for container comment)
 * @param paramId - ID of the parameter to update
 * @param value - New value for the parameter
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Emit event to notify parent
  emit('parameterUpdated', paramId, value);
}
</script>

<style scoped>
/* Block Info Styles - Extracted from ControlPanel.vue */

.block-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.block-header-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.block-icon-wrapper {
  padding: 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
}

.block-basic-info {
  flex: 1;
}

/* Block name editing */
.block-name-section {
  margin-bottom: 8px;
}

.block-name-input {
  font-size: 14px;
}

.block-name-input .q-field__control {
  min-height: 32px;
}

.block-name-input .q-field__label {
  font-size: 12px;
}

.block-type {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.block-id {
  font-size: 10px;
  color: #999;
  font-family: monospace;
}

.block-description {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* Info sections */
.info-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.info-item.warning {
  color: #ff9800;
}

.info-label {
  color: #666;
}

.info-value {
  font-weight: 600;
  color: #333;
}

/* Container comment section */
.container-comment-section {
  margin: 16px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #1976d2;
}

.comment-input-wrapper {
  margin-top: 8px;
}

.comment-textarea {
  font-size: 13px;
}
</style>