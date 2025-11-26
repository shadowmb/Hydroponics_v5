<!--
/**
 * 📊 SetVarData Block Parameters Component
 * ✅ Dedicated component for SetVarData block parameter rendering
 * ⚠️ CRITICAL: Complex setVarName dependency with dynamic options & validation
 * Modular approach for better maintainability
 */
-->
<template>
  <!-- SetVarData Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="edit"
    label="SetVarData Параметри"
    header-class="expansion-header"
    class="expansion-section setvardata-parameters"
  >
    <div class="expansion-content">
      
     
      
      <!-- 📊 Variable Data Status Display -->
      <div class="variable-data-status-display">
        <div class="status-indicator">
          <q-icon name="edit" color="deep-orange" size="sm" />
          <span class="status-text">
            SetVarData блок - задава стойност на променлива от setVarName
          </span>
        </div>
        <div class="dependency-info">
          <q-icon name="link" size="xs" color="deep-orange" />
          <span class="info-text">
            Зависи от setVarName блокове | Dynamic options | Auto block naming
          </span>
        </div>
        <!-- Variables Status -->
        <div class="variables-status" :class="[`status-${getVariablesStatus()}`]">
          <q-icon 
            :name="getVariablesStatusIcon()" 
            :color="getVariablesStatusColor()" 
            size="xs" 
          />
          <span class="variables-status-text">{{ getVariablesStatusText() }}</span>
        </div>
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
            
            <!-- 📊 CRITICAL: Source Variable Selection (dynamic options from setVarName) -->
            <q-select
              v-if="param.id === 'sourceVariable'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="getDynamicVariableOptions()"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select source-variable-select"
              @update:model-value="(value) => updateSourceVariable(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="account_tree" size="xs" color="deep-orange" />
              </template>
              <template v-slot:hint>
                Променлива от setVarName блокове ({{ availableVariablesCount }} налични)
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Няма налични setVarName блокове в workspace
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            
            <!-- 🔄 Enable/Disable Toggle -->
            <q-toggle
              v-else-if="param.id === 'enabled' || param.id === 'isActive'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              class="param-toggle setvardata-toggle"
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
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: Select (но НЕ sourceVariable) -->
            <q-select
              v-else-if="param.type === 'select' && param.id !== 'sourceVariable'"
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
      
      <!-- 📊 Advanced: Available Variables Display -->
      <div v-if="showAdvanced" class="available-variables-section">
        <div class="section-header">
          <q-icon name="info" size="sm" color="info" />
          <span class="section-title">Налични променливи от setVarName блокове:</span>
        </div>
        <div class="variables-list">
          <div 
            v-for="variable in getDynamicVariableOptions()" 
            :key="variable.value"
            class="variable-item"
            :class="{ 'selected': selectedBlock?.parameters?.sourceVariable === variable.value }"
          >
            <q-icon name="badge" size="xs" color="green" />
            <span class="variable-label">{{ variable.label }}</span>
            <q-chip 
              size="sm" 
              color="grey-3" 
              text-color="grey-8"
              :label="variable.value"
            />
          </div>
          <div v-if="getDynamicVariableOptions().length === 0" class="no-variables">
            <q-icon name="warning" size="xs" color="warning" />
            <span class="no-variables-text">Няма налични setVarName блокове</span>
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
import { computed, watch, onMounted, onUnmounted } from 'vue';
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
  showAdvanced?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  workspaceBlocks: () => [],
  connections: () => [],
  showAdvanced: false,
  readonly: false
});

// Events
const emit = defineEmits<{
  parameterUpdated: [paramId: string, value: any];
  blockUpdated: [blockId: string];
}>();

// 📊 CRITICAL: Computed for available variables count
const availableVariablesCount = computed(() => {
  return getDynamicVariableOptions().length;
});

// 📊 CRITICAL: Variable change event handler
let variableChangeHandler: ((event: CustomEvent) => void) | null = null;

// 📊 CRITICAL: Watch workspace changes for validation
watch(
  () => props.workspaceBlocks,
  (newBlocks) => {
    if (newBlocks && newBlocks.length > 0) {
      validateCurrentSelection();
    }
  },
  { immediate: true, deep: true }
);

// 📊 CRITICAL: Listen for VariableManager changes
onMounted(() => {
  variableChangeHandler = (event: CustomEvent) => {
    const { internalVar, displayName } = event.detail;
    
    // Update block name if this block uses the changed variable
    if (props.selectedBlock?.parameters?.sourceVariable === internalVar) {
      const newBlockName = displayName || internalVar;
      props.selectedBlock.parameters.customName = newBlockName;
      
      //console.log(`[SetVarDataParameters] Updated block name from event: "${newBlockName}"`);
      emit('blockUpdated', props.selectedBlock.id);
    }
  };
  
  // Listen for variable changes
  document.addEventListener('variableNameChanged', variableChangeHandler);
});

onUnmounted(() => {
  if (variableChangeHandler) {
    document.removeEventListener('variableNameChanged', variableChangeHandler);
  }
});

// 🔧 Parameter Management Functions

/**
 * CRITICAL: Updates sourceVariable parameter with setVarName dependency logic
 */
function updateSourceVariable(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
 // console.log(`[SetVarDataParameters] Updating sourceVariable: ${paramId} = ${value}`);
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Update block name with selected variable's display name
  if (value) {
    const displayName = VariableManager.getDisplayName(value);
    const blockName = displayName || value;
    
    // Update block's custom name
    props.selectedBlock.parameters.customName = blockName;
    
   // console.log(`[SetVarDataParameters] Updated block name: "${blockName}"`);
  } else {
    // Reset to default name if no valid variable selected
    const defaultName = 'СТОЙНОСТ НА ПРОМЕНЛИВА';
    props.selectedBlock.parameters.customName = defaultName;
    
    //console.log(`[SetVarDataParameters] Reset block name to default`);
  }
  
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * Standard parameter update for non-critical parameters
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
 // console.log(`[SetVarDataParameters] Updating parameter: ${paramId} = ${value}`);
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

// 📊 CRITICAL: Dynamic Options Management

/**
 * CRITICAL: Gets dynamic options from setVarName blocks in workspace
 */
function getDynamicVariableOptions(): { label: string; value: string }[] {
  if (!props.workspaceBlocks || props.workspaceBlocks.length === 0) {
    return [];
  }
  
  // Find all setVarName blocks
  const setVarNameBlocks = props.workspaceBlocks.filter(
    block => block.definitionId === 'setVarName'
  );
  
  if (setVarNameBlocks.length === 0) {
    return [];
  }
  
  // Collect unique variables with their display names
  const variableMap = new Map<string, string>();
  
  setVarNameBlocks.forEach(block => {
    const internalVar = block.parameters?.internalVar;
    if (internalVar && VariableManager.isValidInternalVar(internalVar)) {
      const displayName = VariableManager.getDisplayName(internalVar);
      
      // Use display name if available, otherwise use internal variable name
      const label = displayName ? `${displayName} (${internalVar})` : internalVar;
      variableMap.set(internalVar, label);
    }
  });
  
  // Convert to options array
  const options: { label: string; value: string }[] = [];
  variableMap.forEach((label, value) => {
    options.push({ label, value });
  });
  
  // Sort by label for better UX
  options.sort((a, b) => a.label.localeCompare(b.label, 'bg'));
  
  return options;
}

/**
 * CRITICAL: Validates current sourceVariable selection
 */
function validateCurrentSelection() {
  if (!props.selectedBlock) return;
  
  const currentSourceVar = props.selectedBlock.parameters?.sourceVariable;
  if (!currentSourceVar) return;
  
  // Check if current selection is still valid
  const availableOptions = getDynamicVariableOptions();
  const isValid = availableOptions.some(option => option.value === currentSourceVar);
  
  if (!isValid) {
    //console.log(`[SetVarDataParameters] Cleaning invalid variable reference: ${currentSourceVar}`);
    
    // Clear invalid selection
    props.selectedBlock.parameters.sourceVariable = '';
    props.selectedBlock.parameters.customName = 'СТОЙНОСТ НА ПРОМЕНЛИВА';
    
    emit('parameterUpdated', 'sourceVariable', '');
    emit('blockUpdated', props.selectedBlock.id);
  }
}

// 🎨 UI Status Functions

function getVariablesStatus(): string {
  const count = availableVariablesCount.value;
  if (count === 0) return 'empty';
  if (count < 3) return 'low';
  return 'good';
}

function getVariablesStatusIcon(): string {
  const status = getVariablesStatus();
  switch (status) {
    case 'empty': return 'warning';
    case 'low': return 'info';
    case 'good': return 'check_circle';
    default: return 'storage';
  }
}

function getVariablesStatusColor(): string {
  const status = getVariablesStatus();
  switch (status) {
    case 'empty': return 'negative';
    case 'low': return 'warning';
    case 'good': return 'positive';
    default: return 'info';
  }
}

function getVariablesStatusText(): string {
  const count = availableVariablesCount.value;
  if (count === 0) return 'Няма налични setVarName блокове';
  return `${count} налични променливи от setVarName`;
}

/**
 * Formats parameter value for display
 */
function formatParameterValue(param: BlockParameter): string {
  const value = props.selectedBlock?.parameters[param.id];
  
  if (value === undefined || value === null) {
    return param.required ? '[Required]' : param.defaultValue || '—';
  }
  
  // Special handling for sourceVariable parameter
  if (param.id === 'sourceVariable') {
    const options = getDynamicVariableOptions();
    const option = options.find(opt => opt.value === value);
    return option?.label || String(value);
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
/* SetVarData Parameters Specific Styles - ОРАНЖЕВО-ЖЪЛТ КАНТ */

.setvardata-parameters {
  border: 2px solid #F57F17;
  border-radius: 8px;
  margin-bottom: 16px;
}

.setvardata-parameters .expansion-header {
  background: rgba(245, 127, 23, 0.1);
  color: #E65100;
  font-weight: 600;
}

/* Variable Data Status Display */
.variable-data-status-display {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #F57F17;
  background: rgba(245, 127, 23, 0.05);
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
  color: #E65100;
}

.dependency-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(245, 127, 23, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}

.info-text {
  font-size: 11px;
  color: #FF8F00;
  font-weight: 500;
}

/* Variables Status Indicator */
.variables-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.variables-status.status-empty {
  background: rgba(244, 67, 54, 0.1);
  color: #D32F2F;
}

.variables-status.status-low {
  background: rgba(255, 193, 7, 0.1);
  color: #F57C00;
}

.variables-status.status-good {
  background: rgba(76, 175, 80, 0.1);
  color: #388E3C;
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

/* Special SetVarData Input Styling */
.source-variable-select {
  border-left: 3px solid #F57F17;
}

.setvardata-toggle {
  padding: 8px 0;
}

/* Available Variables Section */
.available-variables-section {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  background: #FAFAFA;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variable-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: white;
  border: 1px solid #E0E0E0;
}

.variable-item.selected {
  border-color: #F57F17;
  background: rgba(245, 127, 23, 0.05);
}

.variable-label {
  font-size: 11px;
  font-weight: 500;
  flex: 1;
}

.no-variables {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  color: #666;
  font-style: italic;
}

.no-variables-text {
  font-size: 11px;
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
  .variable-data-status-display {
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
  
  .available-variables-section {
    padding: 8px;
  }
}
</style>