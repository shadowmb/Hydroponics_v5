<!--
/**
 * 📦 ParametersSection - Block Parameters & Variable Logic
 * ✅ Modular component extracted from ControlPanel.vue
 * Handles all block parameters including setVarName/setVarData complex logic
 */
-->
<template>
  <!-- Parameters Section -->
  <q-expansion-item
    v-if="selectedBlock && blockDefinition?.parameters.length > 0 && selectedBlock.definitionId !== 'loop' && selectedBlock.definitionId !== 'sensor' && selectedBlock.definitionId !== 'actuator' && selectedBlock.definitionId !== 'merge' && selectedBlock.definitionId !== 'if' && selectedBlock.definitionId !== 'setVarName' && selectedBlock.definitionId !== 'setVarData' && selectedBlock.definitionId !== 'errorHandler' && selectedBlock.definitionId !== 'container' && selectedBlock.definitionId !== 'goto'"
    default-opened
    icon="settings"
    :label="`Параметри (${blockDefinition.parameters.length})`"
    header-class="expansion-header"
    class="expansion-section"
  >
    <div class="expansion-content">
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
          
          <!-- Interactive Parameter Input -->
          <div class="param-input">
            <!-- setVarName internalVar parameter - Dropdown with auto-loading of displayName -->
            <q-select
              v-if="param.type === 'select' && selectedBlock?.definitionId === 'setVarName' && param.id === 'internalVar'"
              :model-value="selectedBlock?.parameters[param.id]"
              @update:model-value="(value) => updateSetVarNameInternalVar(param.id, value)"
              :options="param.options"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="param-select"
              placeholder="Избери променлива..."
            >
              <template v-slot:prepend>
                <q-icon name="badge" size="xs" />
              </template>
            </q-select>
            
            <!-- setVarName displayName parameter - String input with save button -->
            <div v-else-if="param.type === 'string' && selectedBlock?.definitionId === 'setVarName' && param.id === 'displayName'" class="display-name-input-container">
              <q-input
                :model-value="selectedBlock?.parameters[param.id]"
                @update:model-value="(value) => updateDisplayNameLocal(value)"
                :label="param.label"
                outlined
                dense
                :readonly="props.readonly"
                class="param-input-field display-name-input"
                placeholder="Въведи описателно име..."
              >
                <template v-slot:prepend>
                  <q-icon name="edit" size="xs" />
                </template>
                <template v-slot:hint>
                  Това име ще се покаже във всички блокове използващи тази променлива
                </template>
              </q-input>
              
              <!-- Save icon button -->
              <q-btn
                :icon="getSaveIconName()"
                :color="getSaveIconColor()"
                flat
                dense
                size="sm"
                class="save-display-name-btn"
                :disable="!hasDisplayNameChanges() || props.readonly"
                @click="saveDisplayName()"
                :title="getSaveIconTooltip()"
              />
            </div>
            
            <!-- setVarData sourceVariable parameter - Dynamic Dropdown -->
            <q-select
              v-else-if="param.type === 'select' && selectedBlock?.definitionId === 'setVarData' && param.id === 'sourceVariable'"
              :model-value="selectedBlock?.parameters[param.id]"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
              :options="getParameterOptions(param)"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="param-select"
            >
              <template v-slot:prepend>
                <q-icon name="storage" size="xs" />
              </template>
            </q-select>
            
            <!-- Other select parameters -->
            <q-select
              v-else-if="param.type === 'select'"
              :model-value="selectedBlock?.parameters[param.id]"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="param-select"
            >
              <template v-slot:prepend>
                <q-icon name="tune" size="xs" />
              </template>
            </q-select>
            
            <!-- Number parameters -->
            <q-input
              v-else-if="param.type === 'number'"
              :model-value="selectedBlock?.parameters[param.id]"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(value) || 0)"
              :label="param.label"
              type="number"
              outlined
              dense
              :readonly="props.readonly"
              class="param-input-field"
            >
              <template v-slot:prepend>
                <q-icon name="tag" size="xs" />
              </template>
            </q-input>
            
            <!-- String parameters -->
            <q-input
              v-else-if="param.type === 'string'"
              :model-value="selectedBlock?.parameters[param.id]"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
              :label="param.label"
              outlined
              dense
              :readonly="props.readonly"
              class="param-input-field"
            >
              <template v-slot:prepend>
                <q-icon name="text_fields" size="xs" />
              </template>
            </q-input>
            
            <!-- Boolean parameters -->
            <q-toggle
              v-else-if="param.type === 'boolean'"
              :model-value="selectedBlock?.parameters[param.id]"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
              :label="param.label"
              :disable="props.readonly"
              class="param-toggle"
            />
            
            <!-- Fallback - Display only -->
            <div v-else class="param-value-display">
              <strong>{{ formatParameterValue(param) }}</strong>
              <small class="param-type-hint">({{ param.type }})</small>
            </div>
          </div>
          
          <!-- Dynamic options display for setVarData (Advanced mode) -->
          <div v-if="showAdvanced && param.id === 'sourceVariable' && selectedBlock?.definitionId === 'setVarData'" class="param-dynamic-options">
            <small class="dynamic-options-label">Налични променливи:</small>
            <div class="dynamic-options-list">
              <span 
                v-for="option in getParameterOptions(param)" 
                :key="option.value"
                class="dynamic-option"
                :class="{ 'option-selected': selectedBlock?.parameters[param.id] === option.value }"
              >
                {{ option.label }}
              </span>
            </div>
          </div>
          
          <div v-if="showAdvanced && param.validation" class="param-validation">
            <small>
              <span v-if="param.validation.min !== undefined">Min: {{ param.validation.min }}</span>
              <span v-if="param.validation.max !== undefined">Max: {{ param.validation.max }}</span>
              <span v-if="param.validation.pattern">Pattern: {{ param.validation.pattern }}</span>
            </small>
          </div>
        </div>
      </div>
    </div>
  </q-expansion-item>
  
  <!-- 🆕 NEW: LoopParameters Component Integration -->
  <LoopParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'loop'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: SensorParameters Component Integration -->
  <SensorParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'sensor'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: ActuatorParameters Component Integration -->
  <ActuatorParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'actuator'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: MergeParameters Component Integration -->
  <MergeParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'merge'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: IfParameters Component Integration -->
  <IfParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'if'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: SetVarNameParameters Component Integration -->
  <SetVarNameParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'setVarName'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: SetVarDataParameters Component Integration -->
  <SetVarDataParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'setVarData'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :show-advanced="showAdvanced"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: GotoParameters Component Integration -->
  <GotoParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'goto'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: ErrorHandlerParameters Component Integration -->
  <ErrorHandlerParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'errorHandler'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

  <!-- 🆕 NEW: ContainerParameters Component Integration -->
  <ContainerParameters
    v-if="selectedBlock && selectedBlock.definitionId === 'container'"
    :selected-block="selectedBlock"
    :block-definition="blockDefinition"
    :workspace-blocks="workspaceBlocks"
    :connections="connections"
    :readonly="props.readonly"
    @parameter-updated="handleParameterUpdated"
    @block-updated="handleBlockUpdated"
  />

</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
// 🔍 CRITICAL: Correct import paths for ControlPanel_Modular location
import type { 
  BlockInstance, 
  BlockDefinition, 
  BlockParameter,
  BlockConnection
} from '../../../../types/BlockConcept';
import { useVariableTracker } from '../../../../utils/VariableWorkspaceTracker';
import { VariableManager } from '../../../../services/VariableManager';
// 🆕 NEW: Import modular components
import LoopParameters from './blocks/LoopParameters.vue';
import SensorParameters from './blocks/SensorParameters.vue';
import ActuatorParameters from './blocks/ActuatorParameters.vue';
import MergeParameters from './blocks/MergeParameters.vue';
import IfParameters from './blocks/IfParameters.vue';
import SetVarNameParameters from './blocks/SetVarNameParameters.vue';
import SetVarDataParameters from './blocks/SetVarDataParameters.vue';
import GotoParameters from './blocks/GotoParameters.vue';
import ErrorHandlerParameters from './blocks/ErrorHandlerParameters.vue';
import ContainerParameters from './blocks/ContainerParameters.vue';

// Props
interface Props {
  selectedBlock?: BlockInstance;
  blockDefinition?: BlockDefinition;
  workspaceBlocks?: BlockInstance[];
  showAdvanced?: boolean;
  connections?: BlockConnection[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  workspaceBlocks: () => [],
  showAdvanced: false,
  connections: () => [],
  readonly: false
});

// Events
const emit = defineEmits<{
  parameterUpdated: [paramId: string, value: any];
  blockUpdated: [blockId: string];
}>();

// Local state for display name management
const localDisplayName = ref('');
const originalDisplayName = ref('');
const saveStatus = ref<'idle' | 'pending' | 'saved' | 'conflict'>('idle');

// Variable tracking
const variableTracker = useVariableTracker();

// Watch workspace blocks for variable changes
watch(
  () => props.workspaceBlocks,
  (newBlocks) => {
    if (newBlocks && newBlocks.length > 0) {
      variableTracker.updateWorkspace(newBlocks);
      
      // Validate setVarData blocks when workspace changes
      validateSetVarDataBlocks();
    }
  },
  { immediate: true, deep: true }
);

// Watch selected block changes to initialize display name state
watch(
  () => props.selectedBlock,
  (newBlock) => {
    if (newBlock && newBlock.definitionId === 'setVarName') {
      // Initialize local state with current values
      const currentDisplayName = newBlock.parameters.displayName || '';
      const internalVar = newBlock.parameters.internalVar;
      
      // If there's an internal var selected, get its global display name
      let originalName = currentDisplayName;
      if (internalVar && VariableManager.isValidInternalVar(internalVar)) {
        const globalName = VariableManager.getDisplayName(internalVar);
        originalName = globalName || currentDisplayName;
      }
      
      localDisplayName.value = currentDisplayName;
      originalDisplayName.value = originalName;
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

// Event listener for variable name changes
let variableChangeHandler: ((event: CustomEvent) => void) | null = null;

onMounted(() => {
  // Listen for variable name changes from VariableManager
  variableChangeHandler = (event: CustomEvent) => {
    const { internalVar, displayName } = event.detail;
    
    // Update ALL setVarData blocks that use this variable (not just selected one)
    if (props.workspaceBlocks && props.workspaceBlocks.length > 0) {
      const newBlockName = displayName || internalVar;
      
      props.workspaceBlocks
        .filter(block => block.definitionId === 'setVarData')
        .filter(block => block.parameters?.sourceVariable === internalVar)
        .forEach(block => {
          // Update block's custom name
          block.parameters.customName = newBlockName;
          
          //console.log(`[ParametersSection] Updated setVarData block ${block.id} name from event: "${newBlockName}"`);
          
          // Force reactivity update for each block
          emit('blockUpdated', block.id);
        });
    }
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('variableNameChanged', variableChangeHandler as EventListener);
  }
});

onUnmounted(() => {
  // Clean up event listener
  if (variableChangeHandler && typeof window !== 'undefined') {
    window.removeEventListener('variableNameChanged', variableChangeHandler as EventListener);
  }
});

// Methods

/**
 * Updates a parameter value for the selected block
 * @param paramId - ID of the parameter to update
 * @param value - New value for the parameter
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  // Special handling for setVarData sourceVariable parameter
  if (paramId === 'sourceVariable' && props.selectedBlock.definitionId === 'setVarData') {
    updateSetVarDataSourceVariable(paramId, value);
    return;
  }
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Emit event to trigger reactivity in parent components
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * Updates setVarName internalVar parameter and automatically loads existing displayName
 * @param paramId - ID of the parameter to update (should be 'internalVar')
 * @param value - New internal variable value (var1-var10)
 */
function updateSetVarNameInternalVar(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  // Update the internal variable parameter
  props.selectedBlock.parameters[paramId] = value;
  
  // Auto-load existing display name for this variable if available
  if (value && VariableManager.isValidInternalVar(value)) {
    const existingDisplayName = VariableManager.getDisplayName(value);
    //console.log(`[ParametersSection] Loading variable ${value}, existing name: "${existingDisplayName}"`);
    
    if (existingDisplayName) {
      // Load the existing display name into the displayName parameter
      props.selectedBlock.parameters.displayName = existingDisplayName;
      
      // Update local state for save tracking
      localDisplayName.value = existingDisplayName;
      originalDisplayName.value = existingDisplayName;
      saveStatus.value = 'idle';
      
      //console.log(`[ParametersSection] Auto-loaded display name: "${existingDisplayName}"`);
    } else {
      // Clear display name if no existing name for this variable
      props.selectedBlock.parameters.displayName = '';
      
      // Update local state
      localDisplayName.value = '';
      originalDisplayName.value = '';
      saveStatus.value = 'idle';
      
      //console.log(`[ParametersSection] No existing name for ${value}, cleared displayName`);
    }
  }
  
  // Emit event to trigger reactivity in parent components
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * Updates display name locally without global sync (for save button approach)
 * @param value - New display name value
 */
function updateDisplayNameLocal(value: string) {
  if (!props.selectedBlock) return;
  
  // Update only the local parameter - no global sync yet
  props.selectedBlock.parameters.displayName = value;
  localDisplayName.value = value;
  
  // Reset save status when typing
  if (saveStatus.value === 'saved') {
    saveStatus.value = 'idle';
  }
  
  // Emit event to trigger reactivity
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * Checks if there are unsaved changes to display name
 */
function hasDisplayNameChanges(): boolean {
  return localDisplayName.value.trim() !== originalDisplayName.value.trim();
}

/**
 * Gets the appropriate save icon name based on current state
 */
function getSaveIconName(): string {
  switch (saveStatus.value) {
    case 'saved': return 'check';
    case 'conflict': return 'warning';
    case 'pending': return 'hourglass_empty';
    default: return 'save';
  }
}

/**
 * Gets the appropriate save icon color based on current state
 */
function getSaveIconColor(): string {
  switch (saveStatus.value) {
    case 'saved': return 'positive';
    case 'conflict': return 'warning';
    case 'pending': return 'info';
    default: return hasDisplayNameChanges() ? 'primary' : 'grey';
  }
}

/**
 * Gets the appropriate tooltip text for save icon
 */
function getSaveIconTooltip(): string {
  switch (saveStatus.value) {
    case 'saved': return 'Запазено успешно';
    case 'conflict': return 'Има конфликт - нужно потвърждение';
    case 'pending': return 'Запазва...';
    default: return hasDisplayNameChanges() ? 'Запази промените' : 'Няма промени за запазване';
  }
}

/**
 * Saves the display name with conflict checking
 */
async function saveDisplayName() {
  if (!props.selectedBlock) return;
  
  const internalVar = props.selectedBlock.parameters.internalVar;
  if (!internalVar || !VariableManager.isValidInternalVar(internalVar)) return;
  
  const newDisplayName = localDisplayName.value || '';
  const currentGlobalName = VariableManager.getDisplayName(internalVar);
  
  saveStatus.value = 'pending';
  
  try {
    // Check if this variable has a different existing global name (simple conflict detection)
    const hasConflict = currentGlobalName && 
                       currentGlobalName.trim() !== newDisplayName.trim() && 
                       currentGlobalName.trim() !== '';
    
    if (hasConflict) {
      // Show confirmation dialog
      const { Dialog } = await import('quasar');
      
      saveStatus.value = 'conflict';
      
      Dialog.create({
        title: 'Потвърждение за промяна',
        message: `Променливата "${internalVar}" вече има визуално име "${currentGlobalName}". Сигурни ли сте, че искате да я преименувате на "${newDisplayName}"?<br><br>Това ще се отрази на всички блокове използващи тази променлива.`,
        html: true,
        cancel: {
          label: 'Отказ',
          color: 'grey',
          flat: true
        },
        ok: {
          label: 'Потвърди промяната',
          color: 'primary'
        },
        persistent: true
      }).onOk(() => {
        // User confirmed - proceed with global save
        performGlobalDisplayNameSave(internalVar, newDisplayName);
      }).onCancel(() => {
        // User canceled - revert to original
        revertDisplayName();
      });
    } else {
      // No conflict - save directly
      performGlobalDisplayNameSave(internalVar, newDisplayName);
    }
  } catch (error) {
    console.error('Error during save:', error);
    saveStatus.value = 'idle';
  }
}

/**
 * Performs the global save of display name
 */
function performGlobalDisplayNameSave(internalVar: string, newDisplayName: string) {
  if (!props.selectedBlock) return;
  
 // console.log(`[ParametersSection] Performing global save: ${internalVar} -> "${newDisplayName}"`);
  
  // Sync with VariableManager (this will trigger global updates via event system)
  const dataType = props.selectedBlock.parameters.dataType || 'auto';
  VariableManager.setDisplayName(internalVar, newDisplayName, dataType);
  
  // Update current block's parameter to match saved value
  props.selectedBlock.parameters.displayName = newDisplayName;
  
  // Update tracking variables
  originalDisplayName.value = newDisplayName;
  localDisplayName.value = newDisplayName;
  
  // Show success state
  saveStatus.value = 'saved';
  
 // console.log(`[ParametersSection] Global save complete. Triggering block updates...`);
  
  // Emit event to trigger reactivity
  emit('blockUpdated', props.selectedBlock.id);
  
  // Reset to idle after 2 seconds
  setTimeout(() => {
    if (saveStatus.value === 'saved') {
      saveStatus.value = 'idle';
    }
  }, 2000);
}

/**
 * Reverts display name to original value
 */
function revertDisplayName() {
  if (!props.selectedBlock) return;
  
  props.selectedBlock.parameters.displayName = originalDisplayName.value;
  localDisplayName.value = originalDisplayName.value;
  saveStatus.value = 'idle';
  
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * Handles sourceVariable parameter change for setVarData blocks
 * Updates block name and validates selection
 */
function updateSetVarDataSourceVariable(paramId: string, value: any) {
  if (!props.selectedBlock || props.selectedBlock.definitionId !== 'setVarData') return;
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Update block name with selected variable's display name
  if (value && VariableManager.isValidInternalVar(value)) {
    const displayName = VariableManager.getDisplayName(value);
    const blockName = displayName || value;
    
    // Update block's custom name
    props.selectedBlock.parameters.customName = blockName;
    
  //  console.log(`[ParametersSection] Updated setVarData block name: "${blockName}"`);
  } else {
    // Reset to default name if no valid variable selected
    const defaultName = 'СТОЙНОСТ НА ПРОМЕНЛИВА';
    props.selectedBlock.parameters.customName = defaultName;
    
    //console.log(`[ParametersSection] Reset setVarData block name to default`);
  }
  
  // Emit event to trigger reactivity
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * Get dynamic options for setVarData block parameter
 * @param param - Block parameter
 * @returns Dynamic options array or original options
 */
function getParameterOptions(param: BlockParameter) {
  // Special handling for setVarData sourceVariable parameter
  if (param.id === 'sourceVariable' && props.selectedBlock?.definitionId === 'setVarData') {
    return getSetVarDataOptions();
  }
  
  // Return original options for other parameters
  return param.options || [];
}

/**
 * Validates and cleans up setVarData blocks that reference removed variables
 * Should be called when workspace blocks change
 */
function validateSetVarDataBlocks() {
  if (!props.workspaceBlocks || props.workspaceBlocks.length === 0) return;
  
  // Get all available variables from setVarName blocks
  const availableVariables = new Set<string>();
  
  props.workspaceBlocks
    .filter(block => block.definitionId === 'setVarName')
    .forEach(block => {
      const internalVar = block.parameters?.internalVar;
      if (internalVar && VariableManager.isValidInternalVar(internalVar)) {
        availableVariables.add(internalVar);
      }
    });
  
  // Check all setVarData blocks for invalid variable references
  props.workspaceBlocks
    .filter(block => block.definitionId === 'setVarData')
    .forEach(block => {
      const sourceVar = block.parameters?.sourceVariable;
      
      if (sourceVar && !availableVariables.has(sourceVar)) {
       // console.log(`[ParametersSection] Cleaning invalid variable reference: ${sourceVar} in block ${block.id}`);
        
        // Clear invalid variable selection
        block.parameters.sourceVariable = '';
        
        // Reset block name to default
        block.parameters.customName = 'СТОЙНОСТ НА ПРОМЕНЛИВА';
        
        // If this is the currently selected block, emit update
        if (props.selectedBlock?.id === block.id) {
          emit('blockUpdated', block.id);
        }
      }
    });
}

/**
 * Get dynamic options for setVarData sourceVariable parameter
 * Scans all setVarName blocks in workspace and returns available variables
 */
function getSetVarDataOptions(): { label: string; value: string }[] {
  if (!props.workspaceBlocks || props.workspaceBlocks.length === 0) {
    return [{ label: '(няма променливи)', value: '' }];
  }
  
  // Find all setVarName blocks
  const setVarNameBlocks = props.workspaceBlocks.filter(
    block => block.definitionId === 'setVarName'
  );
  
  if (setVarNameBlocks.length === 0) {
    return [{ label: '(няма setVarName блокове)', value: '' }];
  }
  
  // Collect unique variables with their display names
  const variableMap = new Map<string, string>();
  
  setVarNameBlocks.forEach(block => {
    const internalVar = block.parameters?.internalVar;
    if (internalVar && VariableManager.isValidInternalVar(internalVar)) {
      const displayName = VariableManager.getDisplayName(internalVar);
      const label = displayName || internalVar;
      variableMap.set(internalVar, label);
    }
  });
  
  // Convert to options array
  const options = Array.from(variableMap.entries()).map(([value, label]) => ({
    label,
    value
  }));
  
  // Sort by label
  options.sort((a, b) => a.label.localeCompare(b.label));
  
  return options.length > 0 ? options : [{ label: '(няма валидни променливи)', value: '' }];
}


function formatParameterValue(param: BlockParameter): string {
  const value = props.selectedBlock?.parameters[param.id];
  
  if (value === undefined || value === null) {
    return param.required ? '[Required]' : param.defaultValue || '—';
  }
  
  if (param.type === 'select') {
    // Special handling for setVarData sourceVariable parameter
    if (param.id === 'sourceVariable' && props.selectedBlock?.definitionId === 'setVarData') {
      const dynamicOptions = getSetVarDataOptions();
      const option = dynamicOptions.find(opt => opt.value === value);
      return option?.label || String(value);
    }
    
    // Standard select parameter handling
    if (param.options) {
      const option = param.options.find(opt => opt.value === value);
      return option?.label || String(value);
    }
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Не';
  }
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  
  return String(value);
}

// 🔗 Event Handlers for modular parameter components

/**
 * Handles parameter updates from modular components (LoopParameters, SensorParameters, etc.)
 * @param paramId - Parameter ID
 * @param value - New parameter value
 */
function handleParameterUpdated(paramId: string, value: any) {
  //console.log(`[ParametersSection] Modular component parameter updated: ${paramId} = ${value}`);
  // Forward to parent component
  emit('parameterUpdated', paramId, value);
}

/**
 * Handles block updates from modular components (LoopParameters, SensorParameters, etc.)
 * @param blockId - Block ID that was updated
 */
function handleBlockUpdated(blockId: string) {
  //console.log(`[ParametersSection] Modular component block updated: ${blockId}`);
  // Forward to parent component
  emit('blockUpdated', blockId);
}
</script>

<style scoped>
/* Parameters Styles - Extracted from ControlPanel.vue */

.expansion-section {
  margin-bottom: 16px;
}

.expansion-section .expansion-header {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.expansion-content {
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

/* Parameters */
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

.param-validation {
  font-size: 10px;
  color: #999;
}

.param-validation span {
  margin-right: 8px;
}

/* Parameter inputs */
.param-input {
  margin-top: 8px;
}

.param-select,
.param-input-field {
  width: 100%;
  margin-bottom: 4px;
}

.param-select .q-field__control,
.param-input-field .q-field__control {
  min-height: 36px;
}

.param-toggle {
  margin: 8px 0;
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

/* Common indicators */
.required-indicator {
  color: #f44336;
  font-weight: 700;
  margin-left: 2px;
}

/* Dynamic options */
.param-dynamic-options {
  margin-top: 6px;
  padding: 6px;
  background: rgba(33, 150, 243, 0.05);
  border-radius: 4px;
  border-left: 2px solid #2196F3;
}

.dynamic-options-label {
  font-size: 10px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 4px;
}

.dynamic-options-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.dynamic-option {
  font-size: 10px;
  background: #f5f5f5;
  color: #333;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #ddd;
  display: inline-block;
  transition: all 0.2s ease;
}

.dynamic-option.option-selected {
  background: #2196F3;
  color: white;
  border-color: #1976D2;
  font-weight: 600;
}

.dynamic-option:not(.option-selected):empty::before {
  content: '(празно)';
  font-style: italic;
  color: #999;
}

/* Display name input with save button layout */
.display-name-input-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.display-name-input {
  flex: 1;
}

.save-display-name-btn {
  margin-top: 8px; /* Align with input field */
  min-width: 36px;
  height: 36px;
}

/* Responsive */
@media (max-width: 768px) {
  .dynamic-options-list {
    gap: 2px;
  }
  
  .dynamic-option {
    font-size: 9px;
    padding: 1px 4px;
  }
}
</style>