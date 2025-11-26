<!--
/**
 * 🔀 Goto Block Parameters Component
 * ✅ Dedicated component for GOTO block parameter rendering
 * Provides dynamic loading of available target blocks
 */
-->
<template>
  <!-- GOTO Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="call_made"
    label="Преход Параметри"
    header-class="expansion-header"
    class="expansion-section goto-parameters"
  >
    <div class="expansion-content">
      
    
      <!-- Target Block Selection (Special handling) -->
      <div class="parameter-item param-required">
        <div class="param-header">
          <span class="param-name">
            Целеви блок
            <span class="required-indicator">*</span>
          </span>
        </div>

        <div class="param-control">
          <!-- 🎯 Target Block Selection -->
          <q-select
            :model-value="selectedBlock?.parameters['targetBlockId']"
            :options="availableBlocks"
            :loading="loadingBlocks"
            label="Целеви блок"
            outlined
            dense
            emit-value
            map-options
            :readonly="props.readonly"
            :disable="loadingBlocks"
            class="param-select target-block-select"
            @update:model-value="(value) => updateParameterValue('targetBlockId', value)"
          >
            <template v-slot:prepend>
              <q-icon name="call_made" size="xs" color="purple" />
            </template>
            <template v-slot:hint>
              Избери блока към който да се пренасочи потока
            </template>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="scope.opt.icon" :color="scope.opt.color" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                  <q-item-label caption>
                    <q-chip size="xs" :color="scope.opt.color" text-color="white">
                      {{ scope.opt.type }}
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  {{ loadingBlocks ? 'Зареждане на блокове...' : 'Няма налични блокове в потока' }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </div>

      <!-- Other Parameters (filtered to exclude targetBlockId) -->
      <div class="parameters-list">
        <div
          v-for="param in blockDefinition.parameters.filter(p => p.id !== 'targetBlockId')"
          :key="param.id"
          class="parameter-item"
          :class="{ 'param-required': param.required }"
        >
          <div class="param-header">
            <span class="param-name">
              {{ param.label }}
              <span v-if="param.required" class="required-indicator">*</span>
            </span>
          </div>

          <div class="param-control">
            <!-- 🔄 Parameter Display -->
            <div class="param-value-display">
              <strong>{{ formatParameterValue(param) }}</strong>
              <small class="param-type-hint">({{ param.type }})</small>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
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

// 🎯 Available blocks state
const availableBlocks = ref<Array<{label: string, value: string, icon: string, color: string, type: string}>>([]);
const loadingBlocks = ref(false);

// Block icon mapping - based on block types
const blockIconMapping: Record<string, {icon: string, color: string}> = {
  'actuator': { icon: 'power', color: 'brown' },
  'sensor': { icon: 'sensors', color: 'blue' },
  'if': { icon: 'alt_route', color: 'orange' },
  'loop': { icon: 'loop', color: 'green' },
  'wait': { icon: 'timer', color: 'teal' },
  'goto': { icon: 'call_made', color: 'purple' },
  'setVarName': { icon: 'label', color: 'indigo' },
  'setVarData': { icon: 'edit', color: 'cyan' },
  'merge': { icon: 'merge', color: 'pink' }
};

// Load available blocks from workspace
function loadAvailableBlocks() {
  if (!props.workspaceBlocks || props.workspaceBlocks.length === 0) {
    availableBlocks.value = [];
    return;
  }
  
  loadingBlocks.value = true;
  
  try {
    // Filter out the current GOTO block to prevent self-reference
    const otherBlocks = props.workspaceBlocks.filter(block => block.id !== props.selectedBlock.id);
    
    availableBlocks.value = otherBlocks.map(block => {
      const blockInfo = blockIconMapping[block.definitionId] || { icon: 'crop_square', color: 'grey' };
      
      return {
        label: `${blockInfo.icon === 'power' ? '📦' : blockInfo.icon === 'sensors' ? '📊' : blockInfo.icon === 'alt_route' ? '🔀' : blockInfo.icon === 'loop' ? '🔄' : blockInfo.icon === 'timer' ? '⏲️' : blockInfo.icon === 'call_made' ? '➡️' : '🧩'} ${getBlockDisplayName(block)} - ${block.id}`,
        value: block.id,
        icon: blockInfo.icon,
        color: blockInfo.color,
        type: block.definitionId.toUpperCase()
      };
    });
    
    console.log(`[GotoParameters] Loaded ${availableBlocks.value.length} available blocks`);
  } catch (error) {
    console.error('[GotoParameters] Failed to load available blocks:', error);
    availableBlocks.value = [];
  } finally {
    loadingBlocks.value = false;
  }
}

// Get display name for block
function getBlockDisplayName(block: BlockInstance): string {
  // Try to get a meaningful name from block parameters or use definition ID
  const comment = block.parameters?.comment;
  if (comment && comment.trim()) {
    return comment.trim().substring(0, 20); // Limit to 20 chars
  }
  
  // Use definition ID as fallback  
  const nameMapping: Record<string, string> = {
    'actuator': 'УСТРОЙСТВО',
    'sensor': 'СЕНЗОР',
    'if': 'УСЛОВИЕ',
    'loop': 'ЦИКЪЛ',
    'wait': 'ИЗЧАКВАНЕ',
    'goto': 'ПРЕХОД',
    'setVarName': 'ИМЕ ПРОМЕНЛИВА',
    'setVarData': 'ДАННИ ПРОМЕНЛИВА',
    'merge': 'СЪБИРАНЕ'
  };
  
  return nameMapping[block.definitionId] || block.definitionId.toUpperCase();
}

// Watch for workspace blocks changes
watch(() => props.workspaceBlocks, () => {
  loadAvailableBlocks();
}, { deep: true, immediate: true });

// Load blocks on mount
onMounted(() => {
  loadAvailableBlocks();
});

// 🔧 Parameter Management Functions

/**
 * Updates a parameter value for the selected block
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  console.log(`[GotoParameters] Updating parameter: ${paramId} = ${value}`);
  
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
    if (param.id === 'targetBlockId' && availableBlocks.value.length > 0) {
      const block = availableBlocks.value.find(opt => opt.value === value);
      return block?.label || String(value);
    }
    if (param.options) {
      const option = param.options.find(opt => opt.value === value);
      return option?.label || String(value);
    }
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Активен' : 'Неактивен';
  }
  
  return String(value);
}
</script>

<style scoped>
.goto-parameters {
  margin-bottom: 1rem;
}

.expansion-content {
  padding: 1rem;
  background: #fafafa;
  border-radius: 4px;
}

.goto-status-display {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f3e5f5;
  border-radius: 4px;
  border-left: 4px solid #9c27b0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-text {
  color: #6a1b9a;
  font-weight: 500;
  font-size: 0.9rem;
}

.parameters-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.parameter-item {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
}

.parameter-item.param-required {
  border-left: 4px solid #f44336;
}

.param-header {
  margin-bottom: 0.5rem;
}

.param-name {
  font-weight: 600;
  color: #424242;
  font-size: 0.95rem;
}

.required-indicator {
  color: #f44336;
  margin-left: 0.25rem;
}

.param-control {
  width: 100%;
}

.target-block-select {
  width: 100%;
}

.param-value-display {
  padding: 0.5rem 0;
  color: #666;
  font-style: italic;
}

.param-type-hint {
  color: #999;
  margin-left: 0.5rem;
}

.block-comment-field {
  margin-bottom: 1rem;
}

.comment-input {
  width: 100%;
}

/* Loading states */
.target-block-select.loading {
  opacity: 0.7;
}
</style>