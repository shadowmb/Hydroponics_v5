<!--
/**
 * 🎯 TargetConfigSection - Target Configuration Panel
 * ✅ Phase 4: Dedicated component for Flow Target Configuration
 * Allows assigning targets to executor fields from loaded flow
 */
-->
<template>
  <!-- Target Configuration Panel -->
  <q-expansion-item
    default-opened
    icon="target"
    label="Target Конфигурация"
    header-class="expansion-header target-config-header"
    class="expansion-section target-config-panel"
  >
    <div class="expansion-content">
      
      <!-- 🎯 Header Controls -->
      <div class="config-header">
        <div class="header-info">
          <q-icon name="account_tree" size="sm" color="purple" />
          <span class="header-title">Конфигуриране на targets за flow блокове</span>
        </div>
        <div class="header-actions">
          <q-btn
            dense
            flat
            round
            icon="refresh"
            color="primary"
            @click="refreshFlowData"
            :disable="loading"
            size="sm"
          >
            <q-tooltip>Обнови flow данните</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- 📊 Flow Summary -->
      <div v-if="flowSummary" class="flow-summary">
        <div class="summary-item">
          <q-icon name="extension" size="xs" color="blue" />
          <span class="summary-label">Общо блокове:</span>
          <span class="summary-value">{{ flowSummary.totalBlocks }}</span>
        </div>
        <div class="summary-item">
          <q-icon name="target" size="xs" color="purple" />
          <span class="summary-label">Executor полета:</span>
          <span class="summary-value">{{ flowSummary.executorFields }}</span>
        </div>
        <div class="summary-item">
          <q-icon name="check_circle" size="xs" color="positive" />
          <span class="summary-label">Конфигурирани:</span>
          <span class="summary-value">{{ flowSummary.configuredFields }}</span>
        </div>
      </div>

      <!-- 🔍 Search and Filter Controls -->
      <div class="filter-controls">
        <q-input
          v-model="searchText"
          placeholder="🔍 Търси блок или поле..."
          outlined
          dense
          clearable
          class="search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        
        <q-select
          v-model="filterType"
          :options="filterOptions"
          label="Филтър"
          outlined
          dense
          emit-value
          map-options
          class="filter-select"
        >
          <template v-slot:prepend>
            <q-icon name="filter_list" size="xs" />
          </template>
        </q-select>
      </div>

      <!-- 📋 Executor Fields List -->
      <div class="executor-fields-list">
        <div v-if="loading" class="loading-state">
          <q-spinner color="primary" size="2em" />
          <div class="q-mt-sm">Зареждане на flow данни...</div>
        </div>

        <div v-else-if="filteredExecutorFields.length === 0" class="empty-state">
          <q-icon name="target" size="3em" color="grey-5" />
          <div class="empty-text">
            {{ executorFields.length === 0 ? 'Няма executor полета в текущия flow' : 'Няма резултати от филтрирането' }}
          </div>
        </div>

        <!-- Field Items -->
        <div 
          v-for="field in filteredExecutorFields"
          :key="`${field.blockId}-${field.fieldId}`"
          class="field-item"
          :class="{ 
            'field-configured': field.hasTarget,
            'field-missing': !field.hasTarget && field.required 
          }"
        >
          <!-- Field Header -->
          <div class="field-header">
            <div class="field-info">
              <q-icon :name="getBlockIcon(field.blockType)" size="sm" :color="getBlockColor(field.blockType)" />
              <div class="field-details">
                <div class="field-name">
                  {{ field.blockLabel }} → {{ field.fieldLabel }}
                  <q-chip v-if="field.required" size="xs" color="orange" text-color="white" label="Required" />
                </div>
                <div class="field-meta">
                  <span class="block-id">{{ field.blockId }}</span>
                  <span class="field-type">{{ field.fieldType }}</span>
                </div>
              </div>
            </div>
            <div class="field-status">
              <q-icon 
                :name="field.hasTarget ? 'check_circle' : 'radio_button_unchecked'" 
                :color="field.hasTarget ? 'positive' : 'grey-5'" 
                size="sm"
              />
            </div>
          </div>

          <!-- Target Assignment -->
          <div class="target-assignment">
            <div class="assignment-controls">
              <q-select
                :model-value="field.currentTarget"
                :options="availableTargets"
                :label="`🎯 Target за ${field.fieldLabel}`"
                outlined
                dense
                clearable
                use-input
                fill-input
                hide-selected
                input-debounce="300"
                emit-value
                map-options
                class="target-select"
                @update:model-value="(value) => updateFieldTarget(field, value)"
              >
                <template v-slot:prepend>
                  <q-icon name="target" size="xs" color="purple" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Няма налични targets
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-btn
                v-if="field.hasTarget"
                icon="clear"
                color="negative"
                flat
                dense
                round
                size="sm"
                class="clear-target-btn"
                @click="clearFieldTarget(field)"
              >
                <q-tooltip>Изчисти target</q-tooltip>
              </q-btn>
            </div>

            <!-- Target Comment -->
            <q-input
              :model-value="field.targetComment"
              :label="`💬 Коментар за ${field.fieldLabel}`"
              outlined
              dense
              class="target-comment"
              @update:model-value="(value) => updateFieldTargetComment(field, value)"
            >
              <template v-slot:prepend>
                <q-icon name="comment" size="xs" color="blue-grey" />
              </template>
              <template v-slot:hint>
                Описание на target за Action Template
              </template>
            </q-input>

            <!-- Target Info Display -->
            <div v-if="field.hasTarget && field.targetInfo" class="target-info">
              <q-icon name="info" size="xs" color="info" />
              <span class="target-info-text">
                {{ field.targetInfo.visualName }} ({{ field.targetInfo.targetKey }})
              </span>
              <span v-if="field.targetInfo.description" class="target-info-desc">
                - {{ field.targetInfo.description }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 🎯 Bulk Actions -->
      <div v-if="executorFields.length > 0" class="bulk-actions">
        <div class="bulk-header">
          <q-icon name="checklist" size="sm" color="primary" />
          <span class="bulk-title">Групови действия</span>
        </div>
        <div class="bulk-buttons">
          <q-btn
            label="Изчисти всички"
            icon="clear_all"
            color="negative"
            outline
            dense
            @click="clearAllTargets"
          />
          <q-btn
            label="Експорт конфигурация"
            icon="download"
            color="primary"
            outline
            dense
            @click="exportConfiguration"
          />
        </div>
      </div>

    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { BlockInstance, BlockDefinition } from '../../../../types/BlockConcept';
// DEACTIVATED: Target Registry System - Phase 1D
// import { targetRegistryApi } from '../../../../../../services/api';

// Props
interface Props {
  workspaceBlocks?: BlockInstance[];
  blockDefinitions?: BlockDefinition[];
}

const props = withDefaults(defineProps<Props>(), {
  workspaceBlocks: () => [],
  blockDefinitions: () => []
});

// Events
const emit = defineEmits<{
  targetConfigUpdated: [fieldId: string, targetKey: string | null, comment?: string];
  configurationExported: [config: any];
}>();

// State
const loading = ref(false);
const searchText = ref('');
const filterType = ref('all');

// Filter Options
const filterOptions = [
  { label: '🎯 Всички полета', value: 'all' },
  { label: '✅ Конфигурирани', value: 'configured' },
  { label: '❌ Неконфигурирани', value: 'unconfigured' },
  { label: '⚠️ Задължителни', value: 'required' }
];

// Target Registry Data
const availableTargets = ref<Array<{label: string, value: string, visualName: string, targetKey: string, description?: string}>>([]);

// Executor Fields Interface
interface ExecutorField {
  blockId: string;
  blockType: string;
  blockLabel: string;
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
  hasTarget: boolean;
  currentTarget: string | null;
  targetComment: string;
  targetInfo?: {
    visualName: string;
    targetKey: string;
    description?: string;
  };
}

// Computed Properties
const executorFields = computed<ExecutorField[]>(() => {
  const fields: ExecutorField[] = [];
  
  if (!props.workspaceBlocks || !props.blockDefinitions) {
    return fields;
  }

  for (const block of props.workspaceBlocks) {
    const definition = props.blockDefinitions.find(def => def.id === block.definitionId);
    if (!definition || !definition.executorFields) continue;

    for (const fieldId of definition.executorFields) {
      const param = definition.parameters?.find(p => p.id === fieldId);
      if (!param) continue;

      const targetKey = fieldId + '_target';
      const targetCommentKey = fieldId + '_target_comment';
      const currentTarget = block.parameters[targetKey];
      const targetComment = block.parameters[targetCommentKey] || '';

      // Find target info
      const targetInfo = currentTarget ? availableTargets.value.find(t => t.targetKey === currentTarget) : null;

      fields.push({
        blockId: block.id,
        blockType: block.definitionId,
        blockLabel: block.label || definition.name,
        fieldId: fieldId,
        fieldLabel: param.label,
        fieldType: param.type,
        required: param.required || false,
        hasTarget: !!currentTarget,
        currentTarget: currentTarget,
        targetComment: targetComment,
        targetInfo: targetInfo ? {
          visualName: targetInfo.visualName,
          targetKey: targetInfo.targetKey,
          description: targetInfo.description
        } : undefined
      });
    }
  }

  return fields;
});

// Filtered executor fields
const filteredExecutorFields = computed(() => {
  let filtered = executorFields.value;

  // Apply search filter
  if (searchText.value.trim()) {
    const search = searchText.value.toLowerCase();
    filtered = filtered.filter(field => 
      field.blockLabel.toLowerCase().includes(search) ||
      field.fieldLabel.toLowerCase().includes(search) ||
      field.blockId.toLowerCase().includes(search) ||
      field.fieldId.toLowerCase().includes(search)
    );
  }

  // Apply type filter
  switch (filterType.value) {
    case 'configured':
      filtered = filtered.filter(field => field.hasTarget);
      break;
    case 'unconfigured':
      filtered = filtered.filter(field => !field.hasTarget);
      break;
    case 'required':
      filtered = filtered.filter(field => field.required);
      break;
  }

  return filtered;
});

// Flow summary
const flowSummary = computed(() => {
  if (executorFields.value.length === 0) return null;
  
  return {
    totalBlocks: new Set(executorFields.value.map(f => f.blockId)).size,
    executorFields: executorFields.value.length,
    configuredFields: executorFields.value.filter(f => f.hasTarget).length
  };
});

// Methods
async function loadTargets() {
  try {
    loading.value = true;
    // DEACTIVATED: Target Registry System - Phase 1D
    // const targets = await targetRegistryApi.getAll('control');
    const targets = []; // Mock empty targets array
    
    availableTargets.value = [
      { label: '❌ Без target', value: '', visualName: '', targetKey: '', description: 'Премахни target' },
      ...targets.map((target: any) => ({
        label: `${target.visualName} (${target.targetKey})`,
        value: target.targetKey,
        visualName: target.visualName,
        targetKey: target.targetKey,
        description: target.description
      }))
    ];
  } catch (error) {
    console.error('Failed to load targets:', error);
    availableTargets.value = [
      { label: '❌ Без target', value: '', visualName: '', targetKey: '', description: 'Премахни target' }
    ];
  } finally {
    loading.value = false;
  }
}

function refreshFlowData() {
  loadTargets();
  emit('targetConfigUpdated', 'refresh', null);
}

function updateFieldTarget(field: ExecutorField, targetKey: string | null) {
  if (!targetKey || targetKey === '') {
    clearFieldTarget(field);
    return;
  }

  // Find target in blocks and update
  const block = props.workspaceBlocks?.find(b => b.id === field.blockId);
  if (!block) return;

  const targetFieldKey = field.fieldId + '_target';
  block.parameters[targetFieldKey] = targetKey;

  emit('targetConfigUpdated', `${field.blockId}.${field.fieldId}`, targetKey);
}

function clearFieldTarget(field: ExecutorField) {
  const block = props.workspaceBlocks?.find(b => b.id === field.blockId);
  if (!block) return;

  const targetFieldKey = field.fieldId + '_target';
  const commentFieldKey = field.fieldId + '_target_comment';
  
  delete block.parameters[targetFieldKey];
  delete block.parameters[commentFieldKey];

  emit('targetConfigUpdated', `${field.blockId}.${field.fieldId}`, null);
}

function updateFieldTargetComment(field: ExecutorField, comment: string) {
  const block = props.workspaceBlocks?.find(b => b.id === field.blockId);
  if (!block) return;

  const commentFieldKey = field.fieldId + '_target_comment';
  if (comment.trim()) {
    block.parameters[commentFieldKey] = comment;
  } else {
    delete block.parameters[commentFieldKey];
  }

  emit('targetConfigUpdated', `${field.blockId}.${field.fieldId}`, field.currentTarget, comment);
}

function clearAllTargets() {
  for (const field of executorFields.value) {
    if (field.hasTarget) {
      clearFieldTarget(field);
    }
  }
}

function exportConfiguration() {
  const config = {
    timestamp: new Date().toISOString(),
    totalFields: executorFields.value.length,
    configuredFields: executorFields.value.filter(f => f.hasTarget).length,
    fields: executorFields.value.map(field => ({
      blockId: field.blockId,
      blockType: field.blockType,
      blockLabel: field.blockLabel,
      fieldId: field.fieldId,
      fieldLabel: field.fieldLabel,
      hasTarget: field.hasTarget,
      currentTarget: field.currentTarget,
      targetComment: field.targetComment
    }))
  };

  emit('configurationExported', config);
}

// Helper functions
function getBlockIcon(blockType: string): string {
  switch (blockType) {
    case 'actuator': return 'power';
    case 'sensor': return 'sensors';
    case 'if': return 'alt_route';
    case 'loop': return 'loop';
    default: return 'extension';
  }
}

function getBlockColor(blockType: string): string {
  switch (blockType) {
    case 'actuator': return 'orange';
    case 'sensor': return 'blue';
    case 'if': return 'green';
    case 'loop': return 'purple';
    default: return 'grey';
  }
}

// Lifecycle
onMounted(() => {
  loadTargets();
});

// Watch for changes
watch(() => props.workspaceBlocks, () => {
  // Fields will be recomputed automatically
}, { deep: true });
</script>

<style scoped>
/* Target Config Panel Specific Styles */

.target-config-panel {
  border: 2px solid #9C27B0;
  border-radius: 8px;
  margin-bottom: 16px;
}

.target-config-panel .target-config-header {
  background: rgba(156, 39, 176, 0.1);
  color: #7b1fa2;
  font-weight: 600;
}

/* Config Header */
.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #9C27B0;
  border-radius: 6px;
  background: rgba(156, 39, 176, 0.05);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #7b1fa2;
}

.header-actions {
  display: flex;
  gap: 4px;
}

/* Flow Summary */
.flow-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(33, 150, 243, 0.05);
  border: 1px solid #2196F3;
  border-radius: 6px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.summary-label {
  font-weight: 500;
  color: #1976D2;
}

.summary-value {
  font-weight: 600;
  color: #0D47A1;
  background: rgba(33, 150, 243, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 2;
}

.filter-select {
  flex: 1;
  min-width: 120px;
}

/* States */
.loading-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-text {
  margin-top: 8px;
  font-size: 14px;
}

/* Executor Fields List */
.executor-fields-list {
  margin-bottom: 16px;
}

.field-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  background: white;
  transition: all 0.2s ease;
}

.field-item:hover {
  border-color: #9C27B0;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.1);
}

.field-item.field-configured {
  border-left: 4px solid #4CAF50;
  background: rgba(76, 175, 80, 0.02);
}

.field-item.field-missing {
  border-left: 4px solid #FF5722;
  background: rgba(255, 87, 34, 0.02);
}

/* Field Header */
.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field-details {
  flex: 1;
}

.field-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.field-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #666;
}

.block-id {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.field-type {
  background: #e3f2fd;
  color: #1976D2;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
}

.field-status {
  display: flex;
  align-items: center;
}

/* Target Assignment */
.target-assignment {
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.assignment-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.target-select {
  flex: 1;
  min-width: 0; /* Allow flex item to shrink below content size */
}

.clear-target-btn {
  min-width: 32px;
  height: 32px;
}

.target-comment {
  border-left: 2px solid #607D8B;
  margin-bottom: 8px;
}

/* Target Info */
.target-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #1976D2;
  background: rgba(33, 150, 243, 0.05);
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid rgba(33, 150, 243, 0.2);
}

.target-info-text {
  font-weight: 500;
}

.target-info-desc {
  color: #666;
  font-style: italic;
}

/* Bulk Actions */
.bulk-actions {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.bulk-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.bulk-title {
  font-size: 14px;
  font-weight: 600;
  color: #1976D2;
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

/* Expansion section common */
.expansion-section {
  margin-bottom: 16px;
}

.expansion-content {
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

/* Responsive */
@media (max-width: 768px) {
  .flow-summary {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .assignment-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  
  .bulk-buttons {
    flex-direction: column;
  }
  
  .expansion-content {
    padding: 12px;
  }
  
  .field-name {
    font-size: 13px;
    line-height: 1.4;
  }
  
  .field-info {
    flex-direction: column;
    gap: 4px;
  }
}
</style>