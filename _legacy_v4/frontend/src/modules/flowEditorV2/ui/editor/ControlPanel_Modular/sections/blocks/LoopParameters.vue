<!--
/**
 * 🔄 Loop Block Parameters Component
 * ✅ Dedicated component for Loop block parameter rendering
 * Extracted from ParametersSection.vue for better maintainability
 */
-->
<template>
  <!-- DEACTIVATED: Executor Mode System - Phase 3C -->
  <!-- <div v-if="!props.readonly" class="executor-mode-section">
    <q-toggle
      v-model="executorMode"
      label="🎯 Executor Mode"
      color="purple"
      size="md"
      class="executor-mode-toggle"
    >
      <q-tooltip class="bg-purple text-white">
        {{ executorMode ? 'Изключи Executor Mode - скрий target контролите' : 'Включи Executor Mode - покажи target контролите' }}
      </q-tooltip>
    </q-toggle>
  </div> -->

  <!-- Loop Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="loop"
    label="Loop Параметри"
    header-class="expansion-header"
    class="expansion-section loop-parameters"
  >
    <div class="expansion-content">
  
      
      <!-- 📦 Основна конфигурация -->
      <div class="config-section main-config">
        <div class="section-header">
          <q-icon name="settings" size="sm" color="primary" />
          <span class="section-title">Основна конфигурация</span>
        </div>
        
        <div class="section-content">
          <!-- Максимален брой итерации -->
          <div class="config-field">
            <q-input
              :model-value="selectedBlock?.parameters['maxIterations']"
              label="Максимален брой итерации"
              type="number"
              outlined
              dense
              :readonly="props.readonly"
              class="max-iterations-input"
              @update:model-value="(value) => updateParameterValue('maxIterations', parseFloat(String(value)) || 10)"
            >
              <template v-slot:prepend>
                <q-icon name="repeat" size="xs" color="indigo" />
              </template>
              <template v-slot:hint>
                Максимален брой итерации за предотвратяване на безкрайни цикли
              </template>
            </q-input>
          </div>

          <!-- Забавяне между итерации -->
          <div class="config-field">
            <q-input
              :model-value="selectedBlock?.parameters['delay']"
              label="Забавяне между итерации (сек)"
              type="number"
              outlined
              dense
              :readonly="props.readonly"
              class="delay-input"
              @update:model-value="(value) => updateParameterValue('delay', parseFloat(String(value)) || 1)"
            >
              <template v-slot:prepend>
                <q-icon name="timer" size="xs" color="orange" />
              </template>
              <template v-slot:hint>
                Време за пауза между итерации в секунди
              </template>
            </q-input>
          </div>
        </div>
      </div>

      <!-- ⚙️ Условие за продължаване -->
      <div class="config-section condition-config">
        <div class="section-header">
          <q-icon name="rule" size="sm" color="success" />
          <span class="section-title">Условие за продължаване</span>
        </div>
        
        <div class="section-content">
          <!-- Входна стойност -->
          <div class="config-field">
            <q-input
              :model-value="hasSetVarDataConnection() ? getConnectedVariableName() : selectedBlock?.parameters['manualConditionValue']"
              :label="hasSetVarDataConnection() ? '📥 Входна стойност (променлива)' : '📥 Входна стойност (ръчно)'"
              :type="hasSetVarDataConnection() ? 'text' : 'number'"
              :readonly="hasSetVarDataConnection() || props.readonly"
              outlined
              dense
              class="input-value-field"
              :class="{ 'variable-connected': hasSetVarDataConnection() }"
              @update:model-value="(value) => updateParameterValue('manualConditionValue', parseFloat(String(value)) || 0)"
            >
              <template v-slot:prepend>
                <q-icon :name="hasSetVarDataConnection() ? 'link' : 'edit'" size="xs" :color="hasSetVarDataConnection() ? 'positive' : 'blue'" />
              </template>
              <template v-slot:hint>
                {{ hasSetVarDataConnection() ? 'Закачена променлива от setVarData блок' : 'Ръчно въведена входна стойност' }}
              </template>
            </q-input>
          </div>

          <!-- Оператор за сравнение -->
          <div class="config-field">
            <q-select
              :model-value="getConditionOperator()"
              :options="getOperatorOptions()"
              label="Оператор за сравнение"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="operator-select"
              @update:model-value="updateConditionOperator"
            >
              <template v-slot:prepend>
                <q-icon name="compare_arrows" size="xs" color="purple" />
              </template>
              <template v-slot:hint>
                Как да се сравни входната стойност с целевата
              </template>
            </q-select>
          </div>

          <!-- Целева стойност -->
          <div class="config-field">
            <!-- Global Variable Checkbox (separate) -->
            <q-checkbox
              :model-value="selectedBlock?.parameters['useGlobalVariable']"
              label="📊 Глобална променлива"
              color="orange" 
              size="sm"
              @update:model-value="(value) => updateParameterValue('useGlobalVariable', value)"
              :disable="hasComparisonValueConnection() || props.readonly"
              class="global-variable-checkbox-separate"
            />
            
            <!-- Global Variable Dropdown -->
            <q-select
              v-if="selectedBlock?.parameters['useGlobalVariable'] && !hasComparisonValueConnection()"
              :model-value="selectedBlock?.parameters['selectedGlobalVariable']"
              :options="getGlobalVariableOptions()"
              label="Избери глобална променлива"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="global-variable-select"
              @update:model-value="(value) => updateParameterValue('selectedGlobalVariable', value)"
            >
              <template v-slot:prepend>
                <q-icon name="public" color="orange" size="xs" />
              </template>
            </q-select>
            
            <!-- Manual Input -->
            <q-input
              v-else
              :model-value="hasComparisonValueConnection() ? getConnectedComparisonVariableName() : selectedBlock?.parameters['comparisonValue']"
              :label="getComparisonValueFieldLabel()"
              :type="hasComparisonValueConnection() ? 'text' : 'number'"
              :readonly="hasComparisonValueConnection() || props.readonly"
              outlined
              dense
              :class="['target-value-field', { 'variable-connected': hasComparisonValueConnection(), 'has-target': hasActiveTarget('comparisonValue') }]"
              @update:model-value="(value) => updateParameterValue('comparisonValue', parseFloat(String(value)) || 10)"
            >
              <template v-slot:prepend>
                <q-icon 
                  :name="getComparisonValueFieldIcon()" 
                  size="xs" 
                  :color="getComparisonValueFieldIconColor()"
                >
                  <q-tooltip v-if="hasActiveTarget('comparisonValue') && !hasComparisonValueConnection()" class="bg-purple text-white">
                    <div class="target-tooltip">
                      <div class="target-name">🎯 {{ selectedBlock?.parameters['comparisonValue_target'] }}</div>
                      <div v-if="selectedBlock?.parameters['comparisonValue_target_comment']" class="target-comment">
                        💬 {{ selectedBlock?.parameters['comparisonValue_target_comment'] }}
                      </div>
                    </div>
                  </q-tooltip>
                  <q-tooltip v-else-if="hasComparisonValueConnection()" class="bg-positive text-white">
                    Закачена променлива
                  </q-tooltip>
                  <q-tooltip v-else class="bg-red text-white">
                    Целева стойност
                  </q-tooltip>
                </q-icon>
              </template>
              <template v-slot:hint>
                {{ getComparisonValueFieldHint() }}
              </template>
            </q-input>
            
            <!-- DEACTIVATED: Executor Mode System - Phase 3C -->
            <!-- <div v-if="executorMode && isExecutorField('comparisonValue') && !hasComparisonValueConnection()" class="target-controls">
              <q-select
                :model-value="selectedBlock?.parameters['comparisonValue_target']"
                :options="availableTargets"
                label="🎯 Target"
                outlined
                dense
                clearable
                use-input
                fill-input
                hide-selected
                input-debounce="300"
                emit-value
                map-options
                :readonly="props.readonly"
                class="target-select"
                @update:model-value="(value) => updateParameterValue('comparisonValue_target', value)"
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
              
              <q-input
                :model-value="selectedBlock?.parameters['comparisonValue_target_comment']"
                label="💬 Коментар"
                outlined
                dense
                :readonly="props.readonly"
                class="target-comment"
                @update:model-value="(value) => updateParameterValue('comparisonValue_target_comment', value)"
              >
                <template v-slot:prepend>
                  <q-icon name="comment" size="xs" color="blue-grey" />
                </template>
                <template v-slot:hint>
                  Описание на target за Action Template
                </template>
              </q-input>
            </div> -->
          </div>

          <!-- 🎯 Tolerance Tag Selection -->
          <div class="loop-field">
            <q-select
              :model-value="selectedBlock?.parameters['toleranceTagId']"
              :options="availableToleranceTags"
              :loading="loadingToleranceTags"
              label="Толеранс таг *"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="tolerance-tag-select"
              :rules="[val => !!val || 'Толеранс тагът е задължителен']"
              @update:model-value="(value) => updateParameterValue('toleranceTagId', value)"
            >
              <template v-slot:prepend>
                <q-icon name="tune" size="xs" color="orange" />
              </template>
              <template v-slot:hint>
                Избери таг за толерантност при сравнение (задължително)
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      Толеранс: ±{{ scope.opt.tolerance }}
                      <q-chip 
                        size="xs" 
                        :color="scope.opt.isActive ? 'positive' : 'negative'" 
                        text-color="white"
                        class="q-ml-sm"
                      >
                        {{ scope.opt.isActive ? 'Активен' : 'Неактивен' }}
                      </q-chip>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ loadingToleranceTags ? 'Зареждане на толеранс тагове...' : 'Няма налични толеранс тагове' }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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
import { computed, ref, onMounted } from 'vue';
import type { 
  BlockInstance, 
  BlockDefinition, 
  BlockParameter,
  BlockConnection
} from '../../../../../types/BlockConcept';
import { ConnectionDetector } from '../../../../../utils/ConnectionDetector';
import { monitoringService } from '../../../../../../../services/monitoringService';

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

// DEACTIVATED: Executor Mode System - Phase 3C
// const executorMode = ref(false);
const executorMode = ref(false); // Always disabled

// 🏷️ Tolerance Tags State
const availableToleranceTags = ref<Array<{label: string, value: string, isActive: boolean, tolerance: number}>>([]);
const loadingToleranceTags = ref(false);

// DEACTIVATED: Executor Mode System - Phase 3C
const executorFields = computed(() => {
  // return props.blockDefinition.executorFields || [];
  return []; // Always empty
});

const isExecutorField = computed(() => (paramId: string) => {
  // return executorFields.value.includes(paramId);
  return false; // Always false
});

// Mock data for available targets (TODO: Load from TargetRegistry)
// const availableTargets = computed(() => [
//   { label: '❌ Без target', value: null },
//   { label: 'target.pH_Target', value: 'target.pH_Target' },
//   { label: 'target.EC_Optimal', value: 'target.EC_Optimal' },
//   { label: 'target.Temperature_Max', value: 'target.Temperature_Max' },
//   { label: 'target.Humidity_Min', value: 'target.Humidity_Min' },
//   { label: 'target.Nutrient_Level', value: 'target.Nutrient_Level' },
// ]);

// 🔗 Connection Detection Functions

/**
 * Checks if the loop block has a setVarData connection to its setVarDataIn port
 */
function hasSetVarDataConnection(): boolean {
  if (!props.selectedBlock || props.selectedBlock.definitionId !== 'loop') {
    return false;
  }
  
  const hasConnection = ConnectionDetector.hasConnection(
    props.selectedBlock.id,
    'setVarDataIn',
    'input',
    props.workspaceBlocks || [],
    props.connections || []
  );
  
  return hasConnection;
}

/**
 * Gets the name of the connected variable from setVarData block
 */
function getConnectedVariableName(): string {
  if (!props.selectedBlock || props.selectedBlock.definitionId !== 'loop') {
    return '';
  }
  
  const variableName = ConnectionDetector.getLoopConnectedVariableName(
    props.selectedBlock.id,
    props.workspaceBlocks || [],
    props.connections || []
  );
  
  if (variableName) {
    return variableName;
  }
  
  // Fallback
  const hasAnyConnection = hasSetVarDataConnection();
  if (hasAnyConnection) {
    return 'Закачена променлива (неизвестно име)';
  }
  
  return '';
}

/**
 * Checks if the loop block has a connection to its setVarDataIn2 port (comparison value)
 */
function hasComparisonValueConnection(): boolean {
  if (!props.selectedBlock || props.selectedBlock.definitionId !== 'loop') {
    return false;
  }
  
  const hasConnection = ConnectionDetector.hasConnection(
    props.selectedBlock.id,
    'setVarDataIn2',
    'input',
    props.workspaceBlocks || [],
    props.connections || []
  );
  
  return hasConnection;
}

/**
 * Gets the name of the connected variable from setVarData block for comparison value
 */
function getConnectedComparisonVariableName(): string {
  if (!props.selectedBlock || props.selectedBlock.definitionId !== 'loop') {
    return '';
  }
  
  const variableName = ConnectionDetector.getLoopConnectedComparisonVariableName(
    props.selectedBlock.id,
    props.workspaceBlocks || [],
    props.connections || []
  );
  
  if (variableName) {
    return variableName;
  }
  
  // Fallback
  const hasAnyConnection = hasComparisonValueConnection();
  if (hasAnyConnection) {
    return 'Закачена променлива (неизвестно име)';
  }
  
  return '';
}

// 🔧 Options Helper Functions

/**
 * Gets operator options from block definition
 */
function getOperatorOptions(): Array<{label: string, value: string}> {
  const param = props.blockDefinition?.parameters?.find(p => p.id === 'conditionOperator');
  return param?.options || [
    { label: 'По-малко от', value: 'less_than' },
    { label: 'По-голямо от', value: 'greater_than' },
    { label: 'Равно на', value: 'equals' }
  ];
}

/**
 * Gets condition operator from conditions array
 */
function getConditionOperator(): string {
  if (props.selectedBlock?.parameters?.conditions && Array.isArray(props.selectedBlock.parameters.conditions)) {
    return props.selectedBlock.parameters.conditions[0]?.condition || 'less_than';
  }
  return 'less_than';
}

/**
 * Updates condition operator in conditions array
 */
function updateConditionOperator(value: string) {
  const currentConditions = props.selectedBlock?.parameters?.conditions || [{ condition: 'less_than', dataType: 'number' }];
  const updatedConditions = [...currentConditions];
  updatedConditions[0] = {
    ...updatedConditions[0],
    condition: value
  };
  updateParameterValue('conditions', updatedConditions);
}

// 🔧 Target Helper Functions

/**
 * Checks if a field has an active target
 */
function hasActiveTarget(paramId: string): boolean {
  const targetKey = paramId + '_target';
  return !!(props.selectedBlock?.parameters[targetKey]);
}

/**
 * Gets comparison value field label with target indicator
 */
function getComparisonValueFieldLabel(): string {
  if (hasComparisonValueConnection()) {
    return '🎯 Целева стойност (променлива)';
  }
  const hasTarget = hasActiveTarget('comparisonValue');
  return hasTarget ? '🧩 Целева стойност (ръчно)' : '🎯 Целева стойност (ръчно)';
}

/**
 * Gets comparison value field hint with target info
 */
function getComparisonValueFieldHint(): string {
  if (hasComparisonValueConnection()) {
    return 'Закачена променлива за сравнение';
  }
  
  const hasTarget = hasActiveTarget('comparisonValue');
  if (hasTarget) {
    const targetValue = props.selectedBlock?.parameters['comparisonValue_target'];
    const targetComment = props.selectedBlock?.parameters['comparisonValue_target_comment'];
    let hint = `Ще се използва: ${targetValue}`;
    if (targetComment) {
      hint += ` (${targetComment})`;
    }
    return hint;
  }
  
  return 'Ръчно въведена целева стойност';
}

/**
 * Gets comparison value field icon based on state
 */
function getComparisonValueFieldIcon(): string {
  if (hasComparisonValueConnection()) {
    return 'link';
  }
  if (hasActiveTarget('comparisonValue')) {
    return 'extension'; // 🧩 puzzle piece icon
  }
  return 'edit';
}

/**
 * Gets comparison value field icon color based on state
 */
function getComparisonValueFieldIconColor(): string {
  if (hasComparisonValueConnection()) {
    return 'positive';
  }
  if (hasActiveTarget('comparisonValue')) {
    return 'purple';
  }
  return 'red';
}

// 🔧 Parameter Management Functions

/**
 * Updates a parameter value for the selected block
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
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
    return value ? 'Да' : 'Не';
  }
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  
  return String(value);
}

/**
 * Gets global variable options for dropdown
 */
function getGlobalVariableOptions(): Array<{label: string, value: string}> {
  return [
    { label: 'globalVar1', value: 'globalVar1' },
    { label: 'globalVar2', value: 'globalVar2' },
    { label: 'globalVar3', value: 'globalVar3' },
    { label: 'globalVar4', value: 'globalVar4' },
    { label: 'globalVar5', value: 'globalVar5' },
    { label: 'globalVar6', value: 'globalVar6' },
    { label: 'globalVar7', value: 'globalVar7' },
    { label: 'globalVar8', value: 'globalVar8' },
    { label: 'globalVar9', value: 'globalVar9' },
    { label: 'globalVar10', value: 'globalVar10' }
  ];
}

/**
 * Load available tolerance tags from database
 */
async function loadAvailableToleranceTags() {
  loadingToleranceTags.value = true;
  try {
    const tags = await monitoringService.getToleranceTags(true); // Only active tolerance tags
    
    availableToleranceTags.value = tags.map((tag) => ({
      label: tag.name,
      value: tag._id,
      isActive: tag.isActive,
      tolerance: tag.tolerance || 0
    }));
    
    console.log(`[LoopParameters] Loaded ${availableToleranceTags.value.length} tolerance tags`);
    
  } catch (error) {
    console.error('[LoopParameters] Error loading tolerance tags:', error);
    availableToleranceTags.value = [];
  } finally {
    loadingToleranceTags.value = false;
  }
}

// Load data on component mount
onMounted(() => {
  loadAvailableToleranceTags();
});
</script>

<style scoped>
/* Loop Parameters Specific Styles */

.loop-parameters {
  border: 2px solid #9c27b0;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loop-parameters .expansion-header {
  background: rgba(156, 39, 176, 0.1);
  color: #7b1fa2;
  font-weight: 600;
}

/* Config Sections */
.config-section {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.main-config {
  border: 1px solid #2196F3;
  background: rgba(33, 150, 243, 0.02);
}

.condition-config {
  border: 1px solid #4CAF50;
  background: rgba(76, 175, 80, 0.02);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.main-config .section-header {
  background: rgba(33, 150, 243, 0.1);
  color: #1976D2;
}

.condition-config .section-header {
  background: rgba(76, 175, 80, 0.1);
  color: #388E3C;
}

.section-content {
  padding: 16px;
}

.config-field {
  margin-bottom: 12px;
}

.config-field:last-child {
  margin-bottom: 0;
}

.loop-field {
  margin-bottom: 12px;
}

/* Field Styling */
.max-iterations-input {
  border-left: 3px solid #3F51B5;
}

.delay-input {
  border-left: 3px solid #FF9800;
}

.input-value-field {
  border-left: 3px solid #2196F3;
}

.input-value-field.variable-connected {
  border-left: 3px solid #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

.operator-select {
  border-left: 3px solid #9C27B0;
}

.tolerance-tag-select {
  border-left: 3px solid #FF9800;
}

.target-value-field {
  border-left: 3px solid #F44336;
  background: rgba(244, 67, 54, 0.05);
}

.target-value-field.variable-connected {
  border-left: 3px solid #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

/* DEACTIVATED: Executor Mode System - Phase 3C */
/* Executor Mode Section */
/*
.executor-mode-section {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #9C27B0;
  border-radius: 6px;
  background: rgba(156, 39, 176, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.executor-mode-toggle {
  font-weight: 600;
}

.target-controls {
  margin-top: 12px;
  padding: 12px;
  border: 1px dashed #9C27B0;
  border-radius: 6px;
  background: rgba(156, 39, 176, 0.05);
}

.target-select {
  margin-bottom: 8px;
  border-left: 2px solid #9C27B0;
}

.target-comment {
  border-left: 2px solid #607D8B;
}

.has-target {
  border: 2px solid #9C27B0 !important;
  background: rgba(156, 39, 176, 0.02);
}

.target-tooltip {
  max-width: 250px;
}

.target-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.target-comment {
  font-size: 12px;
  opacity: 0.9;
  font-style: italic;
}
*/

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

/* Global Variable Checkbox and Select Styling */
.global-variable-checkbox-separate {
  margin-bottom: 8px;
}

.global-variable-select {
  border-left: 3px solid #FF9800;
  background: rgba(255, 152, 0, 0.05);
}

/* Responsive */
@media (max-width: 768px) {
  .expansion-content {
    padding: 12px;
  }
  
  .block-comment-field {
    padding: 8px;
    margin-bottom: 12px;
  }
}
</style>