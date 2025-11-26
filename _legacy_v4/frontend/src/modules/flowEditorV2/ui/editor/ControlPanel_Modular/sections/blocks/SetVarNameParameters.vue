<!--
/**
 * 🏷️ SetVarName Block Parameters Component
 * ✅ Dedicated component for SetVarName block parameter rendering
 * ⚠️ CRITICAL: Complex VariableManager integration with global state
 * Modular approach for better maintainability
 */
-->
<template>
  <!-- SetVarName Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="badge"
    label="SetVarName Параметри"
    header-class="expansion-header"
    class="expansion-section setvarname-parameters"
  >
    <div class="expansion-content">
      
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
            
            <!-- 🏷️ CRITICAL: Internal Variable Selection (auto-loads displayName) -->
            <q-select
              v-if="param.id === 'internalVar'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select internal-var-select"
              @update:model-value="(value) => updateInternalVar(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="variable" size="xs" color="green" />
              </template>
              <template v-slot:hint>
                Избери vътрешна променлива (var1-var10) - автоматично зарежда displayName
              </template>
            </q-select>
            
            <!-- 🏷️ CRITICAL: Display Name Input (with save mechanism) -->
            <div v-else-if="param.id === 'displayName'" class="display-name-container">
              <q-input
                :model-value="localDisplayName"
                :label="param.label"
                outlined
                dense
                maxlength="30"
                counter
                class="param-input-field display-name-input"
                @update:model-value="(value) => updateDisplayNameLocal(value)"
                :hint="getDisplayNameHint()"
              >
                <template v-slot:prepend>
                  <q-icon name="edit" size="xs" color="blue" />
                </template>
                <template v-slot:append>
                  <q-btn
                    v-if="shouldShowSaveButton()"
                    :icon="getSaveButtonIcon()"
                    :color="getSaveButtonColor()"
                    :disable="!canSave()"
                    dense
                    flat
                    size="sm"
                    @click="saveDisplayName"
                    :tooltip="getSaveButtonTooltip()"
                  />
                </template>
              </q-input>
              <div class="display-name-help">
                <q-icon name="info" size="xs" color="info" />
                <span class="help-text">
                  Описателно име за визуализация (напр. "pH стойност", "Температура въздух")
                </span>
              </div>
            </div>
            
            <!-- 📋 Data Type Selection -->
            <q-select
              v-else-if="param.id === 'dataType'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select data-type-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="data_object" size="xs" color="indigo" />
              </template>
              <template v-slot:hint>
                Очакваният тип данни на променливата
              </template>
            </q-select>
            
            <!-- 🔄 Enable/Disable Toggle -->
            <q-toggle
              v-else-if="param.id === 'enabled' || param.id === 'isActive'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              class="param-toggle setvarname-toggle"
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
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: String (но НЕ displayName) -->
            <q-input
              v-else-if="param.type === 'string' && param.id !== 'displayName'"
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
import { computed, ref, watch } from 'vue';
import type { 
  BlockInstance, 
  BlockDefinition, 
  BlockParameter,
  BlockConnection
} from '../../../../../types/BlockConcept';
import { VariableManager } from '../../../../../services/VariableManager';

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

// 🏷️ CRITICAL: Local state for display name management
const localDisplayName = ref('');
const originalDisplayName = ref('');
const saveStatus = ref<'idle' | 'pending' | 'saved' | 'conflict'>('idle');

// 🏷️ CRITICAL: Watch selectedBlock for initialization
watch(
  () => props.selectedBlock,
  (newBlock) => {
    if (newBlock && newBlock.definitionId === 'setVarName') {
      // Initialize local state with current values
      const currentDisplayName = newBlock.parameters.displayName || '';
      const internalVar = newBlock.parameters.internalVar;
      
      localDisplayName.value = currentDisplayName;
      
      // Load existing display name from VariableManager if available
      if (internalVar && !currentDisplayName) {
        const existingName = VariableManager.getDisplayName(internalVar);
        if (existingName) {
          localDisplayName.value = existingName;
         // console.log(`[SetVarNameParameters] Auto-loaded displayName for ${internalVar}: "${existingName}"`);
        }
      }
      
      originalDisplayName.value = localDisplayName.value;
      saveStatus.value = 'idle';
    } else {
      // Reset state for non-setVarName blocks
      localDisplayName.value = '';
      originalDisplayName.value = '';
      saveStatus.value = 'idle';
    }
  },
  { immediate: true }
);

// 🔧 Parameter Management Functions

/**
 * CRITICAL: Updates internalVar parameter and auto-loads existing displayName
 */
function updateInternalVar(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  //console.log(`[SetVarNameParameters] Updating internalVar: ${paramId} = ${value}`);
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Auto-load existing display name from VariableManager
  if (value) {
    const existingName = VariableManager.getDisplayName(value);
    if (existingName) {
      localDisplayName.value = existingName;
      props.selectedBlock.parameters['displayName'] = existingName;
      //console.log(`[SetVarNameParameters] Auto-loaded displayName for ${value}: "${existingName}"`);
    } else {
      //console.log(`[SetVarNameParameters] No existing displayName for ${value}, cleared local state`);
      localDisplayName.value = '';
      props.selectedBlock.parameters['displayName'] = '';
    }
    originalDisplayName.value = localDisplayName.value;
    saveStatus.value = 'idle';
  }
  
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * CRITICAL: Updates local displayName state (does not save immediately)
 */
function updateDisplayNameLocal(value: string) {
  localDisplayName.value = String(value);
  
  // Update save status
  if (localDisplayName.value !== originalDisplayName.value) {
    saveStatus.value = 'pending';
  } else {
    saveStatus.value = 'idle';
  }
  
  //console.log(`[SetVarNameParameters] Local displayName updated: "${value}", status: ${saveStatus.value}`);
}

/**
 * CRITICAL: Saves displayName to VariableManager and block parameters
 */
function saveDisplayName() {
  if (!props.selectedBlock) return;
  
  const internalVar = props.selectedBlock.parameters['internalVar'];
  if (!internalVar) {
    console.warn('[SetVarNameParameters] Cannot save displayName: no internalVar selected');
    return;
  }
  
  const trimmedName = localDisplayName.value.trim();
  
  try {
    // Save to VariableManager (global state)
    const dataType = props.selectedBlock.parameters['dataType'] || 'auto';
    VariableManager.setDisplayName(internalVar, trimmedName, dataType);
    
    // Save to block parameters (local state)
    props.selectedBlock.parameters['displayName'] = trimmedName;
    
    // Update original reference and status
    originalDisplayName.value = trimmedName;
    saveStatus.value = 'saved';
    
    //console.log(`[SetVarNameParameters] Saved displayName for ${internalVar}: "${trimmedName}"`);
    
    // Reset to idle after 2 seconds
    setTimeout(() => {
      saveStatus.value = 'idle';
    }, 2000);
    
    emit('parameterUpdated', 'displayName', trimmedName);
    emit('blockUpdated', props.selectedBlock.id);
    
  } catch (error) {
    console.error('[SetVarNameParameters] Error saving displayName:', error);
    saveStatus.value = 'conflict';
  }
}

/**
 * Standard parameter update for non-critical parameters
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  //console.log(`[SetVarNameParameters] Updating parameter: ${paramId} = ${value}`);
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

// 🎨 UI Helper Functions

function shouldShowSaveButton(): boolean {
  return saveStatus.value !== 'idle';
}

function canSave(): boolean {
  return saveStatus.value === 'pending' && 
         localDisplayName.value.trim() !== originalDisplayName.value.trim();
}

function getSaveButtonIcon(): string {
  switch (saveStatus.value) {
    case 'pending': return 'save';
    case 'saved': return 'check';
    case 'conflict': return 'error';
    default: return 'save';
  }
}

function getSaveButtonColor(): string {
  switch (saveStatus.value) {
    case 'pending': return 'primary';
    case 'saved': return 'positive';
    case 'conflict': return 'negative';
    default: return 'grey';
  }
}

function getSaveButtonTooltip(): string {
  switch (saveStatus.value) {
    case 'pending': return 'Запази промените';
    case 'saved': return 'Записано успешно';
    case 'conflict': return 'Грешка при записване';
    default: return 'Записване';
  }
}

function getSaveStatusIcon(): string {
  switch (saveStatus.value) {
    case 'pending': return 'edit';
    case 'saved': return 'check_circle';
    case 'conflict': return 'error';
    default: return 'storage';
  }
}

function getSaveStatusColor(): string {
  switch (saveStatus.value) {
    case 'pending': return 'warning';
    case 'saved': return 'positive';
    case 'conflict': return 'negative';
    default: return 'info';
  }
}

function getSaveStatusText(): string {
  switch (saveStatus.value) {
    case 'pending': return 'Има несъхранени промени';
    case 'saved': return 'Записано в VariableManager';
    case 'conflict': return 'Грешка при записване';
    default: return 'Синхронизирано';
  }
}

function getDisplayNameHint(): string {
  const internalVar = props.selectedBlock?.parameters['internalVar'];
  if (!internalVar) return 'Първо избери променлива';
  
  return `Описателно име за ${internalVar} (напр. "pH стойност")`;
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
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  
  return String(value);
}
</script>

<style scoped>
/* SetVarName Parameters Specific Styles - ЗЕЛЕН КАНТ */

.setvarname-parameters {
  border: 2px solid #4CAF50;
  border-radius: 8px;
  margin-bottom: 16px;
}

.setvarname-parameters .expansion-header {
  background: rgba(76, 175, 80, 0.1);
  color: #2E7D32;
  font-weight: 600;
}

/* Variable Management Status Display */
.variable-status-display {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #4CAF50;
  background: rgba(76, 175, 80, 0.05);
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
  color: #2E7D32;
}

.variable-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}

.info-text {
  font-size: 11px;
  color: #388E3C;
  font-weight: 500;
}

/* Save Status Indicator */
.save-status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.save-status-indicator.status-idle {
  background: rgba(33, 150, 243, 0.1);
  color: #1976D2;
}

.save-status-indicator.status-pending {
  background: rgba(255, 193, 7, 0.1);
  color: #F57C00;
}

.save-status-indicator.status-saved {
  background: rgba(76, 175, 80, 0.1);
  color: #388E3C;
}

.save-status-indicator.status-conflict {
  background: rgba(244, 67, 54, 0.1);
  color: #D32F2F;
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

/* Special SetVarName Input Styling */
.internal-var-select {
  border-left: 3px solid #4CAF50;
}

.display-name-container {
  /* Container for display name with help text */
}

.display-name-input {
  border-left: 3px solid #2196F3;
}

.display-name-help {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 2px 4px;
}

.help-text {
  font-size: 11px;
  color: #666;
  font-style: italic;
}

.data-type-select {
  border-left: 3px solid #3F51B5;
}

.setvarname-toggle {
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
  .variable-status-display {
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