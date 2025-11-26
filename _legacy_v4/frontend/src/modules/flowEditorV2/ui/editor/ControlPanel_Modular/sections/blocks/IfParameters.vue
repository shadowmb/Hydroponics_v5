<!--
/**
 * ❓ If Block Parameters Component
 * ✅ Dedicated component for If block parameter rendering
 * Modular approach for better maintainability
 */
-->
<template>
  <!-- DEACTIVATED: Executor Mode System - Phase 3B -->
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

  <!-- If Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="alt_route"
    label="If Параметри"
    header-class="expansion-header"
    class="expansion-section if-parameters"
  >
    <div class="expansion-content">
      
      <!-- 💬 Block Comment Field -->
      
      
      <!-- ❓ If Logic Status Display -->
      <!-- <div class="if-status-display">
        <div class="status-indicator">
          <q-icon name="alt_route" color="green" size="sm" />
          <span class="status-text">
            If блок - условна логика за разклоняване на потока
          </span>
        </div>
        <div class="logic-info">
          <q-icon name="call_split" size="xs" color="success" />
          <span class="info-text">
            2 входа → 2 изхода (Да/Не) | Условно разклоняване
          </span>
        </div>
      </div> -->
      
      <!-- Logic Operator Selection -->
      <!-- <div class="logic-operator-section" v-if="getConditionsArray().length > 1">
        <div class="operator-header">
          <q-icon name="account_tree" size="sm" color="orange" />
          <span class="operator-label">Логически оператор между условията</span>
        </div>
        <q-toggle
          :model-value="selectedBlock?.parameters['logicOperator'] === 'AND'"
          @update:model-value="(value) => updateParameterValue('logicOperator', value ? 'AND' : 'OR')"
          :disable="props.readonly"
          class="logic-toggle"
          color="orange"
          :label="selectedBlock?.parameters['logicOperator'] === 'AND' ? 'И (AND) - всички условия' : 'ИЛИ (OR) - поне едно условие'"
        />
      </div> -->

      <!-- Conditions List -->
      <div class="conditions-list">
        <!-- <div class="conditions-header">
          <q-icon name="list_alt" size="sm" color="blue" />
          <span class="conditions-title">Условия за проверка</span>
          <q-btn
            size="sm"
            round
            dense
            icon="add"
            color="positive"
            @click="addCondition"
            :disable="props.readonly"
            class="add-condition-btn"
          >
            <q-tooltip>Добави ново условие</q-tooltip>
          </q-btn>
        </div> -->

        <div 
          v-for="(condition, index) in getConditionsArray()"
          :key="`condition-${index}`"
          class="condition-item"
          :class="{ 'single-condition': getConditionsArray().length === 1 }"
        >
          <!-- Condition Header -->
          <div class="condition-header">
            <div class="condition-number">
              <q-icon name="filter_alt" size="xs" color="blue" />
              <span>Условие {{ index + 1 }}</span>
            </div>
            <q-btn
              v-if="getConditionsArray().length > 1"
              size="xs"
              round
              dense
              icon="close"
              color="negative"
              @click="removeCondition(index)"
              :disable="props.readonly"
              class="remove-condition-btn"
            >
              <q-tooltip>Премахни условието</q-tooltip>
            </q-btn>
          </div>

          <!-- Value Input -->
          <div class="condition-field">
            <q-input
              :model-value="hasSetVarDataConnection() ? getConnectedVariableName() : selectedBlock?.parameters['manualConditionValue']"
              :label="hasSetVarDataConnection() ? '📥 Входна стойност (променлива)' : '📥 Входна стойност (ръчно)'"
              :type="getValueInputType(condition.dataType)"
              :readonly="hasSetVarDataConnection() || props.readonly"
              outlined
              dense
              class="value-input"
              :class="{ 'variable-connected': hasSetVarDataConnection() }"
              @update:model-value="(value) => updateParameterValue('manualConditionValue', parseFloat(String(value)) || null)"
              
            >
              <template v-slot:prepend>
                <q-icon :name="hasSetVarDataConnection() ? 'link' : 'pin'" size="xs" :color="hasSetVarDataConnection() ? 'orange' : 'blue'" />
              </template>
            </q-input>
          </div>
          <!-- Condition Type Selection -->
          <div class="condition-field">
            <q-select
              :model-value="condition.condition"
              :options="getConditionOptions()"
              label="Тип условие"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="condition-select"
              @update:model-value="(value) => updateConditionProperty(index, 'condition', value)"
            >
              <template v-slot:prepend>
                <q-icon name="compare" size="xs" color="green" />
              </template>
            </q-select>
          </div>
          <!-- Comparison Value Input -->
          <div class="condition-field">
            <!-- Global Variable Checkbox -->
            <div class="global-variable-checkbox">
              <q-checkbox
                :model-value="selectedBlock?.parameters['useGlobalVariable']"
                label="📊 Глобална променлива"
                color="orange" 
                size="sm"
                @update:model-value="(value) => updateParameterValue('useGlobalVariable', value)"
                :disable="hasIfComparisonValueConnection() || props.readonly"
              />
            </div>
            
            <!-- Global Variable Dropdown -->
            <q-select
              v-if="selectedBlock?.parameters['useGlobalVariable'] && !hasIfComparisonValueConnection()"
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
              :model-value="hasIfComparisonValueConnection() ? getIfConnectedComparisonVariableName() : selectedBlock?.parameters['comparisonValue']"
              :label="getComparisonFieldLabel()"
              :type="hasIfComparisonValueConnection() ? 'text' : 'number'"
              :readonly="hasIfComparisonValueConnection() || props.readonly"
              outlined
              dense
              :class="['comparison-value-input', { 'variable-connected': hasIfComparisonValueConnection(), 'has-target': hasActiveTarget('comparisonValue') }]"
              @update:model-value="(value) => updateParameterValue('comparisonValue', parseFloat(String(value)) || null)"
            >
              <template v-slot:prepend>
                <q-icon 
                  :name="getComparisonFieldIcon()" 
                  size="xs" 
                  :color="getComparisonFieldIconColor()"
                >
                  <q-tooltip v-if="hasActiveTarget('comparisonValue') && !hasIfComparisonValueConnection()" class="bg-purple text-white">
                    <div class="target-tooltip">
                      <div class="target-name">🎯 {{ selectedBlock?.parameters['manualComparisonValue_target'] }}</div>
                      <div v-if="selectedBlock?.parameters['manualComparisonValue_target_comment']" class="target-comment">
                        💬 {{ selectedBlock?.parameters['manualComparisonValue_target_comment'] }}
                      </div>
                    </div>
                  </q-tooltip>
                  <q-tooltip v-else-if="hasIfComparisonValueConnection()" class="bg-positive text-white">
                    Закачена променлива
                  </q-tooltip>
                  <q-tooltip v-else class="bg-orange text-white">
                    Ръчно въведена стойност
                  </q-tooltip>
                </q-icon>
              </template>
              <template v-slot:hint>
                {{ getComparisonFieldHint() }}
              </template>
            </q-input>
            
          
          </div>

          <!-- 🎯 Tolerance Tag Selection -->
          <div class="condition-field">
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

          <!-- Data Type Selection -->
          <!-- <div class="condition-field">
            <q-select
              :model-value="condition.dataType"
              :options="getDataTypeOptions()"
              label="Тип данни"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="data-type-select"
              @update:model-value="(value) => updateConditionProperty(index, 'dataType', value)"
            >
              <template v-slot:prepend>
                <q-icon name="data_object" size="xs" color="indigo" />
              </template>
            </q-select>
          </div> -->
        </div>
      </div>

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

// DEACTIVATED: Executor Mode System - Phase 3B
// const executorMode = ref(false);
const executorMode = ref(false); // Always disabled

// 🏷️ Tolerance Tags State
const availableToleranceTags = ref<Array<{label: string, value: string, isActive: boolean, tolerance: number}>>([]);
const loadingToleranceTags = ref(false);

// DEACTIVATED: Executor Mode System - Phase 3B
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
//   { label: 'target.EC_Optimal', value: 'target.EC_Optimal' },
//   { label: 'target.pH_Target', value: 'target.pH_Target' },
//   { label: 'target.Temperature_Max', value: 'target.Temperature_Max' },
//   { label: 'target.Humidity_Min', value: 'target.Humidity_Min' },
//   { label: 'target.Nutrient_Level', value: 'target.Nutrient_Level' },
// ]);

// 🔧 Target Helper Functions

/**
 * Checks if a field has an active target
 */
function hasActiveTarget(paramId: string): boolean {
  const targetKey = paramId + '_target';
  return !!(props.selectedBlock?.parameters[targetKey]);
}

/**
 * Gets comparison field label with target indicator
 */
function getComparisonFieldLabel(): string {
  if (hasIfComparisonValueConnection()) {
    return '🎯 Сравни с (променлива)';
  }
  const hasTarget = hasActiveTarget('comparisonValue');
  return hasTarget ?  '🧩 Целева стойност (ръчно)' : '🎯 Целева стойност (ръчно)';
}

/**
 * Gets comparison field hint with target info
 */
function getComparisonFieldHint(): string {
  if (hasIfComparisonValueConnection()) {
    return 'Закачена променлива';
  }
  
  const hasTarget = hasActiveTarget('comparisonValue');
  if (hasTarget) {
    const targetValue = props.selectedBlock?.parameters['manualComparisonValue_target'];
    const targetComment = props.selectedBlock?.parameters['manualComparisonValue_target_comment'];
    let hint = `Ще се използва: ${targetValue}`;
    if (targetComment) {
      hint += ` (${targetComment})`;
    }
    return hint;
  }
  
  return 'Ръчно въведена стойност';
}

/**
 * Gets comparison field icon based on state
 */
function getComparisonFieldIcon(): string {
  if (hasIfComparisonValueConnection()) {
    return 'link';
  }
  if (hasActiveTarget('comparisonValue')) {
    return 'extension'; // 🧩 puzzle piece icon
  }
  return 'edit';
}

/**
 * Gets comparison field icon color based on state
 */
function getComparisonFieldIconColor(): string {
  if (hasIfComparisonValueConnection()) {
    return 'positive';
  }
  if (hasActiveTarget('comparisonValue')) {
    return 'purple';
  }
  return 'orange';
}

// 🔧 Parameter Management Functions

/**
 * Gets connected variable name for setVarDataIn port
 */
function getConnectedVariableName(): string | null {
  if (!props.selectedBlock || !props.workspaceBlocks || !props.connections) {
    return null;
  }
  
  const connectedBlock = ConnectionDetector.getFirstConnectedBlock(
    props.selectedBlock.id,
    'setVarDataIn',
    'input',
    props.workspaceBlocks,
    props.connections
  );
  
  return connectedBlock?.variableName || null;
}

/**
 * Checks if setVarDataIn port has connection
 */
function hasVariableConnection(): boolean {
  return hasSetVarDataConnection();
}

/**
 * Gets the conditions array from block parameters (compatibility)
 */
function getConditionsArray(): Array<{condition: string, value: any, dataType: string}> {
  // Read from new conditions array format
  if (props.selectedBlock?.parameters?.conditions && Array.isArray(props.selectedBlock.parameters.conditions)) {
    return props.selectedBlock.parameters.conditions;
  }
  // Fallback to default
  return [{ condition: 'greater_than', value: 0, dataType: 'number' }];
}

/**
 * Update condition property - updates conditions array
 */
function updateConditionProperty(index: number, property: string, value: any) {
  if (property === 'value') {
    updateParameterValue('manualConditionValue', value);
  } else if (property === 'condition') {
    // Update the conditions array instead of old conditionOperator
    const currentConditions = getConditionsArray();
    const updatedConditions = [...currentConditions];
    if (updatedConditions[index]) {
      updatedConditions[index] = {
        ...updatedConditions[index],
        condition: value
      };
      updateParameterValue('conditions', updatedConditions);
    }
  }
}

/**
 * Gets condition options (compatibility)
 */
function getConditionOptions(): Array<{label: string, value: string}> {
  return getOperatorOptions();
}


/**
 * Gets the conditions array from block parameters
 */
function hasSetVarDataConnection(): boolean {
  if (!props.selectedBlock || props.selectedBlock.definitionId !== 'if') {
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
 * Checks if block has comparison value connection
 */
function hasComparisonValueConnection(): boolean {
  if (!props.selectedBlock) {
    return false;
  }

  const hasConnection = ConnectionDetector.hasConnection(
    props.selectedBlock.id,
    'setVarDataIn3',
    'input',
    props.workspaceBlocks || [],
    props.connections || []
  );

  return hasConnection;
}

/**
 * Gets operator options from block definition
 */
function getOperatorOptions(): Array<{label: string, value: string}> {
  const param = props.blockDefinition?.parameters?.find(p => p.id === 'conditionOperator');
  return param?.options || [
    { label: 'По-голямо от', value: 'greater_than' },
    { label: 'По-малко от', value: 'less_than' },
    { label: 'Равно на', value: 'equals' },
    { label: 'Не е равно на', value: 'not_equals' },
    { label: 'По-малко или равно', value: 'less_equal' },
    { label: 'По-голямо или равно', value: 'greater_equal' }
  ];
}


/**
 * Gets connected comparison variable name from the setVarDataIn3 connection
 */
function getConnectedComparisonVariableName(): string {
  return 'Закачена променлива за сравнение';
}

/**
 * Gets global variable options
 */
function getGlobalVariableOptions(): Array<{label: string, value: string}> {
  const param = props.blockDefinition?.parameters?.find(p => p.id === 'selectedGlobalVariable');
  return param?.options || [
    { label: 'globalVar1', value: 'globalVar1' },
    { label: 'globalVar2', value: 'globalVar2' }
  ];
}


/**
 * Checks if the If block has a connection to its setVarDataIn3 port (comparison value)
 */
function hasIfComparisonValueConnection(): boolean {
  if (!props.selectedBlock || props.selectedBlock.definitionId !== 'if') {
    return false;
  }
  
  const hasConnection = ConnectionDetector.hasConnection(
    props.selectedBlock.id,
    'setVarDataIn3',
    'input',
    props.workspaceBlocks || [],
    props.connections || []
  );
  
  //console.log(`[IfParameters] If ${props.selectedBlock.id} comparison connection check:`, hasConnection);
  return hasConnection;
}

/**
 * Gets the name of the connected variable from setVarData block for comparison value
 */
function getIfConnectedComparisonVariableName(): string {
  if (!props.selectedBlock || props.selectedBlock.definitionId !== 'if') {
    return '';
  }
  
  const variableName = ConnectionDetector.getIfConnectedComparisonVariableName(
    props.selectedBlock.id,
    props.workspaceBlocks || [],
    props.connections || []
  );
  
  //console.log(`[IfParameters] If ${props.selectedBlock.id} connected comparison variable:`, variableName);
  
  if (variableName) {
    return variableName;
  }
  
  // Fallback
  const hasAnyConnection = hasIfComparisonValueConnection();
  if (hasAnyConnection) {
    return 'Закачена променлива (неизвестно име)';
  }
  
  return '';
}

/**
 * Updates a parameter value for the selected block
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
 //console.log(`[IfParameters] Updating parameter: ${paramId} = ${JSON.stringify(value)}`);
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Emit events to trigger reactivity in parent components
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * Gets the input type for the value field based on dataType
 */
function getValueInputType(dataType?: string): string {
  // If variable is connected, always use text type
  if (hasVariableConnection()) {
    return 'text';
  }
  
  switch (dataType || 'number') {
    case 'number': return 'number';
    case 'string': return 'text';
    case 'boolean': return 'text'; // Will be handled by toggle if needed
    default: return 'text';
  }
}

/**
 * Gets the human-readable label for current data type
 */
function getDataTypeLabel(dataType?: string): string {
  switch (dataType || 'number') {
    case 'number': return 'Число';
    case 'string': return 'Текст';
    case 'boolean': return 'Булева стойност';
    default: return 'Неизвестен';
  }
}

/**
 * Parses value according to the selected data type
 */
function parseValueForDataType(value: any, dataType?: string): any {
  switch (dataType || 'number') {
    case 'number':
      return parseFloat(String(value)) || 0;
    case 'string':
      return String(value);
    case 'boolean':
      return Boolean(value);
    default:
      return value;
  }
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
    return value ? 'Истина' : 'Лъжа';
  }
  
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  
  return String(value);
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
    
    console.log(`[IfParameters] Loaded ${availableToleranceTags.value.length} tolerance tags`);
    
  } catch (error) {
    console.error('[IfParameters] Error loading tolerance tags:', error);
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
/* If Parameters Specific Styles - ЗЕЛЕН КАНТ */

.if-parameters {
  border: 2px solid #4CAF50;
  border-radius: 8px;
  margin-bottom: 16px;
}

.if-parameters .expansion-header {
  background: rgba(76, 175, 80, 0.1);
  color: #2E7D32;
  font-weight: 600;
}

/* If Logic Status Display */
.if-status-display {
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

.logic-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
}

.info-text {
  font-size: 11px;
  color: #388E3C;
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

/* Special If Input Styling */
.condition-select {
  border-left: 3px solid #4CAF50;
}

.value-input {
  border-left: 3px solid #2196F3;
}

.data-type-select {
  border-left: 3px solid #3F51B5;
}

.if-toggle {
  padding: 8px 0;
}

/* Logic Operator Section */
.logic-operator-section {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #FF9800;
  border-radius: 6px;
  background: rgba(255, 152, 0, 0.05);
}

.operator-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.operator-label {
  font-size: 13px;
  font-weight: 500;
  color: #F57C00;
}

.logic-toggle {
  padding: 4px 0;
}

/* Conditions List */
.conditions-list {
  margin-bottom: 16px;
}

.conditions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(33, 150, 243, 0.1);
  border-radius: 6px;
  border: 1px solid #2196F3;
}

.conditions-title {
  font-size: 14px;
  font-weight: 600;
  color: #1976D2;
  margin-left: 8px;
}

.add-condition-btn {
  min-width: 32px;
  height: 32px;
}

/* Condition Item */
.condition-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: white;
  transition: all 0.2s ease;
}

.condition-item:hover {
  border-color: #2196F3;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
}

.condition-item.single-condition {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.02);
}

.condition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.condition-number {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #1976D2;
}

.remove-condition-btn {
  min-width: 24px;
  height: 24px;
}

/* Condition Fields */
.condition-field {
  margin-bottom: 8px;
}

.condition-field:last-child {
  margin-bottom: 0;
}

.condition-select {
  border-left: 3px solid #4CAF50;
}

.value-input {
  border-left: 3px solid #2196F3;
}

.data-type-select {
  border-left: 3px solid #3F51B5;
}

.tolerance-tag-select {
  border-left: 3px solid #FF9800;
}

.value-input.variable-connected {
  border-left: 3px solid #FF9800;
  background: rgba(255, 152, 0, 0.05);
}

.comparison-value-input {
  border-left: 3px solid #FF9800;
}

.comparison-value-input.variable-connected {
  border-left: 3px solid #4CAF50;
  background: rgba(76, 175, 80, 0.05);
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

/* DEACTIVATED: Executor Mode System - Phase 3B */
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
  .if-status-display {
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