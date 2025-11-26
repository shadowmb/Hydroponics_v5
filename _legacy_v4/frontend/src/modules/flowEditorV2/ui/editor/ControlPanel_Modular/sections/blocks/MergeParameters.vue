<!--
/**
 * 🔀 Merge Block Parameters Component
 * ✅ Dedicated component for Merge block parameter rendering
 * Modular approach for better maintainability
 */
-->
<template>
  <!-- Merge Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="merge"
    label="Merge Параметри"
    header-class="expansion-header"
    class="expansion-section merge-parameters"
  >
    <div class="expansion-content">
      
      <!-- 💬 Block Comment Field -->
      <div class="block-comment-field">
        <q-input
          :model-value="selectedBlock?.parameters['comment'] || ''"
          label="💬 Коментар за блока"
          outlined
          dense
          maxlength="200"
          counter
          type="textarea"
          :readonly="props.readonly"
          class="comment-input"
          @update:model-value="(value) => updateParameterValue('comment', value)"
        >
          <template v-slot:prepend>
            <q-icon name="comment" size="xs" color="blue-grey" />
          </template>
          <template v-slot:hint>
            Описание на блока (до 200 символа)
          </template>
        </q-input>
      </div>
      
       
      <!-- Parameters List -->
      <div class="parameters-list">
        <div 
          v-for="param in blockDefinition.parameters"
          :key="param.id"
          class="parameter-item"
          :class="{ 'param-required': param.required }"
        >
          <div class="param-header">
            <span class="param-name">
              {{ param.label }}
              <span v-if="param.required" class="required-indicator">*</span>
            </span>
            <span class="param-type">{{ param.type }}</span>
          </div>
          
          <div class="param-input">
            
            <!-- 🔀 Merge Mode Selection (critical parameter) -->
            <q-select
              v-if="param.id === 'mergeMode'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select merge-mode-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="hub" size="xs" color="blue-grey" />
              </template>
              <template v-slot:hint>
                Стратегия за синхронизация на входящите потоци
              </template>
            </q-select>
            
            <!-- ⏰ Timeout Input (important parameter) -->
            <q-input
              v-else-if="param.id === 'timeout'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="number"
              outlined
              dense
              suffix="сек"
              class="param-input-field timeout-input"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(String(value)) || 30)"
            >
              <template v-slot:prepend>
                <q-icon name="timer" size="xs" color="amber" />
              </template>
              <template v-slot:hint>
                Максимално изчакване ({{ param.validation?.min || 1 }}-{{ param.validation?.max || 300 }}сек)
              </template>
            </q-input>
            
            <!-- 🚨 On Timeout Action Selection -->
            <q-select
              v-else-if="param.id === 'onTimeout'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select timeout-action-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="warning" size="xs" color="red" />
              </template>
              <template v-slot:hint>
                Действие при изтичане на максималното време
              </template>
            </q-select>
            
            <!-- 🎯 Priority Selection -->
            <q-select
              v-else-if="param.id === 'priority'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select priority-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="priority_high" size="xs" color="purple" />
              </template>
              <template v-slot:hint>
                Приоритизиране на входовете при конфликт
              </template>
            </q-select>
            
            <!-- 🔄 Enable/Disable Toggle -->
            <q-toggle
              v-else-if="param.id === 'enabled' || param.id === 'isActive'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              class="param-toggle merge-toggle"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:default>
                <q-icon 
                  :name="selectedBlock?.parameters[param.id] ? 'power' : 'power_off'" 
                  :color="selectedBlock?.parameters[param.id] ? 'positive' : 'negative'"
                  size="xs" 
                />
              </template>
            </q-toggle>
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: Select -->
            <q-select
              v-else-if="param.type === 'select'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="list" size="xs" />
              </template>
            </q-select>
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: Number -->
            <q-input
              v-else-if="param.type === 'number'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="number"
              outlined
              dense
              class="param-input-field"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(String(value)) || 0)"
            >
              <template v-slot:prepend>
                <q-icon name="tag" size="xs" />
              </template>
            </q-input>
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: String -->
            <q-input
              v-else-if="param.type === 'string'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              outlined
              dense
              class="param-input-field"
              @update:model-value="(value) => updateParameterValue(param.id, String(value))"
            >
              <template v-slot:prepend>
                <q-icon name="text_fields" size="xs" />
              </template>
            </q-input>
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: Boolean -->
            <q-toggle
              v-else-if="param.type === 'boolean'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              class="param-toggle"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            />
            
            <!-- 🔄 Fallback Display -->
            <div v-else class="param-value-display">
              <strong>{{ formatParameterValue(param) }}</strong>
              <small class="param-type-hint">({{ param.type }})</small>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { 
  BlockInstance, 
  BlockDefinition, 
  BlockParameter,
  BlockConnection
} from '../../../../../types/BlockConcept';

// Props
interface Props {
  selectedBlock: BlockInstance;
  blockDefinition: BlockDefinition;
  workspaceBlocks?: BlockInstance[];
  connections?: BlockConnection[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  workspaceBlocks: () => [],
  connections: () => [],
  readonly: false
});

// Events
const emit = defineEmits<{
  parameterUpdated: [paramId: string, value: any];
  blockUpdated: [blockId: string];
}>();

// 🔧 Parameter Management Functions

/**
 * Updates a parameter value for the selected block
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  console.log(`[MergeParameters] Updating parameter: ${paramId} = ${value}`);
  
  // Special validation for merge parameters
  if (paramId === 'timeout' && value < 1) {
    console.warn(`[MergeParameters] Timeout too low: ${value}s, setting to 1s`);
    value = 1;
  }
  
  if (paramId === 'timeout' && value > 300) {
    console.warn(`[MergeParameters] Timeout too high: ${value}s, setting to 300s`);
    value = 300;
  }
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Emit events to trigger reactivity in parent components
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * Formats parameter value for display
 */
function formatParameterValue(param: BlockParameter): string {
  const value = props.selectedBlock?.parameters[param.id];
  
  if (value === undefined || value === null) {
    return param.required ? '[Required]' : param.defaultValue || '—';
  }
  
  if (param.type === 'select') {
    if (param.options) {
      const option = param.options.find(opt => opt.value === value);
      return option?.label || String(value);
    }
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Активен' : 'Неактивен';
  }
  
  if (typeof value === 'number') {
    // Special formatting for merge values
    if (param.id === 'timeout') {
      if (value >= 60) return `${(value / 60).toFixed(1)}мин`;
      return `${value}сек`;
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  
  return String(value);
}
</script>

<style scoped>
/* Merge Parameters Specific Styles - ТЪМНОСИН КАНТ */

.merge-parameters {
  border: 2px solid #607D8B;
  border-radius: 8px;
  margin-bottom: 16px;
}

.merge-parameters .expansion-header {
  background: rgba(96, 125, 139, 0.1);
  color: #37474F;
  font-weight: 600;
}

/* Merge Status Display */
.merge-status-display {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #607D8B;
  background: rgba(96, 125, 139, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  color: #37474F;
}

.merge-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(33, 150, 243, 0.1);
  border-radius: 4px;
}

.info-text {
  font-size: 11px;
  color: #1976D2;
  font-weight: 500;
}

/* Parameters List */
.parameters-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.parameter-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px;
}

.parameter-item.param-required {
  border-left-color: #f44336;
  border-left-width: 3px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.param-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.param-type {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.param-input {
  margin-top: 8px;
}

/* Special Merge Input Styling */
.merge-mode-select {
  border-left: 3px solid #607D8B;
}

.timeout-input {
  border-left: 3px solid #FFC107;
}

.timeout-action-select {
  border-left: 3px solid #F44336;
}

.priority-select {
  border-left: 3px solid #9C27B0;
}

.merge-toggle {
  padding: 8px 0;
}

/* Common indicators */
.required-indicator {
  color: #f44336;
  font-weight: 700;
  margin-left: 2px;
}

.param-value-display {
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-top: 4px;
}

.param-type-hint {
  color: #999;
  font-style: italic;
  margin-left: 8px;
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

/* Block Comment Field */
.block-comment-field {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #607D8B;
  border-radius: 6px;
  background: rgba(96, 125, 139, 0.05);
}

.comment-input {
  border-left: 3px solid #607D8B;
}

/* Responsive */
@media (max-width: 768px) {
  .merge-status-display {
    padding: 8px;
    margin-bottom: 12px;
  }
  
  .status-text {
    font-size: 12px;
  }
  
  .info-text {
    font-size: 10px;
  }
  
  .expansion-content {
    padding: 12px;
  }
  
  .block-comment-field {
    padding: 8px;
    margin-bottom: 12px;
  }
}
</style>