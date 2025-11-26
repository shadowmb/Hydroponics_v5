<!--
/**
 * ⚙️ Actuator Block Parameters Component
 * ✅ Dedicated component for Actuator block parameter rendering
 * Modular approach for better maintainability
 */
-->
<template>
  <!-- DEACTIVATED: Executor Mode System - Phase 3A -->
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

  <!-- Actuator Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="power"
    label="Actuator Параметри"
    header-class="expansion-header"
    class="expansion-section actuator-parameters"
  >
    <div class="expansion-content">
         
      <!-- Parameters List -->
      <div class="parameters-list">
        <div 
          v-for="param in blockDefinition.parameters"
          :key="param.id"
          class="parameter-item"
          :class="{ 'param-required': param.required }"
          v-show="shouldShowParameter(param.id)"
        >
          <div class="param-header">
            <span class="param-name">
              {{ param.label }}
              <span v-if="param.required" class="required-indicator">*</span>
            </span>
            <span class="param-type">{{ param.type }}</span>
          </div>
          
          <div class="param-input">
            
            <!-- 🔌 Device Type Selection (critical parameter) -->
            <q-select
              v-if="param.id === 'deviceType'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="deviceTypeOptions"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              :loading="deviceTypesLoading"
              class="param-select device-type-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="devices" size="xs" color="brown" />
              </template>
              <template v-slot:hint>
                Избери типа на устройството за контрол
              </template>
            </q-select>
            
            <!-- 🎯 Device ID Selection (specific device) -->
            <q-select
              v-else-if="param.id === 'deviceId'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="deviceOptions"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly || !selectedBlock?.parameters.deviceType"
              :disable="!selectedBlock?.parameters.deviceType || deviceOptionsLoading"
              :loading="deviceOptionsLoading"
              class="param-select device-id-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="precision_manufacturing" size="xs" color="blue" />
              </template>
              <template v-slot:hint>
                Избери конкретното устройство
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ selectedBlock?.parameters.deviceType ? 'Няма налични устройства от този тип' : 'Първо избери тип устройство' }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            
            <!-- ⚡ Action Type Selection (important parameter) -->
            <q-select
              v-else-if="param.id === 'actionType'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="getActionTypeOptions()"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              :readonly="props.readonly"
              class="param-select action-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="flash_on" size="xs" color="orange" />
              </template>
              <template v-slot:hint>
                Действие за изпълнение върху устройството
              </template>
            </q-select>
            
            <!-- ⏱️ Duration Field with Global Variable Support -->
            <div v-else-if="param.id === 'duration'" class="duration-field">
              <!-- Stop On Disconnect Checkbox -->
              <div class="stop-on-disconnect-checkbox">
                <q-checkbox
                  :model-value="selectedBlock?.parameters['stopOnDisconnect'] ?? true"
                  label="🛡️ Спирай при загуба на връзка (препоръчано)"
                  color="red"
                  size="sm"
                  @update:model-value="(value) => updateParameterValue('stopOnDisconnect', value)"
                  :disable="props.readonly"
                >
                  <q-tooltip class="bg-red text-white">
                    {{ selectedBlock?.parameters['stopOnDisconnect'] ?? true ? 'При загуба на WiFi връзка, този пин ще се изключи автоматично след определено време (безопасност)' : 'При загуба на връзка, пинът няма да се изключва автоматично (ВНИМАНИЕ: може да е опасно!)' }}
                  </q-tooltip>
                </q-checkbox>
              </div>

              <!-- Global Variable Checkbox -->
              <div class="global-variable-checkbox">
                <q-checkbox
                  :model-value="selectedBlock?.parameters['useGlobalVariable']"
                  label="📊 Глобална променлива"
                  color="orange"
                  size="sm"
                  @update:model-value="(value) => updateParameterValue('useGlobalVariable', value)"
                  :disable="props.readonly"
                />
              </div>
              
              <!-- Global Variable Dropdown -->
              <q-select
                v-if="selectedBlock?.parameters['useGlobalVariable']"
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
              
              <!-- Manual Duration Input -->
              <q-input
                v-else
                :model-value="selectedBlock?.parameters['duration']"
                label="Продължителност (сек)"
                type="number"
                outlined
                dense
                suffix="сек"
                min="1"
                max="3600"
                :readonly="props.readonly"
                class="param-input-field duration-input"
                @update:model-value="(value) => updateParameterValue('duration', parseFloat(String(value)) || 60)"
              >
                <template v-slot:prepend>
                  <q-icon name="timer" size="xs" color="teal" />
                </template>
                <template v-slot:hint>
                  Продължителност на действието (1-3600 секунди)
                </template>
              </q-input>
            </div>
            
            <!-- 🔋 Power Level Field -->
            <q-input
              v-else-if="param.id === 'powerLevel'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="number"
              outlined
              dense
              suffix="%"
              min="0"
              max="100"
              :readonly="props.readonly"
              class="param-input-field power-input"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(String(value)) || 50)"
            >
              <template v-slot:prepend>
                <q-icon name="battery_charging_full" size="xs" color="green" />
              </template>
              <template v-slot:hint>
                Ниво на мощност за PWM контрол (0-100%)
              </template>
            </q-input>
            
            <!-- 📈 Power Range Fields - powerFrom -->
            <q-input
              v-else-if="param.id === 'powerFrom'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="number"
              outlined
              dense
              suffix="%"
              min="0"
              max="100"
              :readonly="props.readonly"
              class="param-input-field power-from-input"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(String(value)) || 0)"
            >
              <template v-slot:prepend>
                <q-icon name="trending_up" size="xs" color="blue" />
              </template>
              <template v-slot:hint>
                Начална мощност за плавни преходи
              </template>
            </q-input>
            
            <!-- 📈 Power Range Fields - powerTo -->
            <q-input
              v-else-if="param.id === 'powerTo'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="number"
              outlined
              dense
              suffix="%"
              min="0"
              max="100"
              :readonly="props.readonly"
              class="param-input-field power-to-input"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(String(value)) || 100)"
            >
              <template v-slot:prepend>
                <q-icon name="trending_down" size="xs" color="red" />
              </template>
              <template v-slot:hint>
                Крайна мощност за плавни преходи
              </template>
            </q-input>
            
            
                    
            
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

  <!-- DEACTIVATED: Executor Mode System - Phase 3A -->
  <!-- <q-dialog v-model="targetSelectDialog" persistent>
    <q-card style="min-width: 500px; max-width: 600px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">🎯 Избор на Target</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="searchText"
          placeholder="🔍 Търсене по име, ключ или описание..."
          outlined
          dense
          clearable
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <div v-if="targetsLoading" class="text-center q-py-md">
          <q-spinner color="primary" size="2em" />
          <div class="q-mt-sm">Зареждане на targets...</div>
        </div>

        <div v-else-if="filteredTargets.length === 0" class="text-center text-grey q-py-md">
          <q-icon name="search_off" size="3em" />
          <div class="q-mt-sm">
            {{ availableTargets.length === 0 ? 'Няма налични targets' : 'Няма резултати от търсенето' }}
          </div>
        </div>

        <q-list v-else separator class="target-list">
          <q-item
            v-for="target in filteredTargets"
            :key="target._id"
            clickable
            v-ripple
            @click="selectTarget(target.targetKey)"
            class="target-item"
          >
            <q-item-section avatar>
              <q-avatar color="purple" text-color="white" size="sm">
                <q-icon name="target" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ target.visualName }}</q-item-label>
              <q-item-label caption class="text-purple">{{ target.targetKey }}</q-item-label>
              <q-item-label caption v-if="target.description" class="text-grey-7">
                {{ target.description }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" color="grey-5" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отказ" color="grey" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog> -->
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { 
  BlockInstance, 
  BlockDefinition, 
  BlockParameter,
  BlockConnection
} from '../../../../../types/BlockConcept';
// DEACTIVATED: Target Registry System - Phase 1D
// import { targetRegistryApi, api } from '../../../../../../../services/api';
import { api } from '../../../../../../../services/api';

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

// Quasar
const $q = useQuasar();

// DEACTIVATED: Executor Mode System - Phase 3A
// const executorMode = ref(false);
const executorMode = ref(false); // Always disabled

// DEACTIVATED: Executor Mode System - Phase 3A
const executorFields = computed(() => {
  // return props.blockDefinition.executorFields || [];
  return []; // Always empty
});

const isExecutorField = computed(() => (paramId: string) => {
  // return executorFields.value.includes(paramId);
  return false; // Always false
});

// Target Registry API integration
const availableTargets = ref<Array<{_id: string, visualName: string, targetKey: string, description?: string}>>([]);
const targetsLoading = ref(false);
const targetSelectDialog = ref(false);
const selectedTargetForField = ref<string>(''); // which field is selecting target
const searchText = ref('');

// Load targets from API
async function loadTargets() {
  try {
    targetsLoading.value = true;
    // DEACTIVATED: Target Registry System - Phase 1D
    // const targets = await targetRegistryApi.getAll('control'); // Only control type targets
    const targets = []; // Mock empty targets array
    availableTargets.value = targets;
  } catch (error) {
    console.error('Failed to load targets:', error);
    // Fallback to empty array
    availableTargets.value = [];
  } finally {
    targetsLoading.value = false;
  }
}

// Filtered targets based on search
const filteredTargets = computed(() => {
  if (!searchText.value.trim()) {
    return availableTargets.value;
  }
  
  const search = searchText.value.toLowerCase();
  return availableTargets.value.filter(target => 
    target.visualName.toLowerCase().includes(search) ||
    target.targetKey.toLowerCase().includes(search) ||
    (target.description && target.description.toLowerCase().includes(search))
  );
});

// 🎯 Device Management State
const deviceTypeOptions = ref<Array<{label: string, value: string}>>([]);
const deviceTypesLoading = ref(false);
const deviceOptions = ref<Array<{label: string, value: string}>>([]);
const deviceOptionsLoading = ref(false);

// Load device types from devices API - only actuators for Actuator block
async function loadDeviceTypes() {
  try {
    deviceTypesLoading.value = true;
    
    // Get all devices and extract unique types from actuator category devices
    const response = await api.getClient().get('/devices');
    const devices = response.data;
    
    // Filter devices by Device.category field for actuators
    const actuatorDevices = devices.filter((device: any) => 
      device.category === 'actuator' && device.isActive
    );
    
    // Extract unique device types
    const uniqueTypes = [...new Set(actuatorDevices.map((device: any) => device.type))];
    
    console.log(`[ActuatorParameters] Found actuator device types from category filtering:`, uniqueTypes);
    
    deviceTypeOptions.value = uniqueTypes.map((type: string) => ({
      label: type, // Using type as label since we don't have displayName from devices
      value: type
    }));
  } catch (error) {
    console.error('Failed to load device types:', error);
    deviceTypeOptions.value = [];
  } finally {
    deviceTypesLoading.value = false;
  }
}

// Load devices by type from API - filter by both type and actuator category
async function loadDevicesByType(deviceType: string): Promise<void> {
  if (!deviceType) {
    deviceOptions.value = [];
    return;
  }
  
  try {
    deviceOptionsLoading.value = true;
    const response = await api.getClient().get('/devices');
    const devices = response.data || [];
    
    // Filter devices by both category and type
    const filteredDevices = devices.filter((device: any) => 
      device.category === 'actuator' && 
      device.type === deviceType && 
      device.isActive
    );
    
    deviceOptions.value = filteredDevices.map((device: any) => ({
      label: device.name,
      value: device._id
    }));

    // Check if current deviceId exists in loaded devices
    const currentDeviceId = props.selectedBlock?.parameters.deviceId;
    if (currentDeviceId && typeof currentDeviceId === 'string') {
      const deviceExists = deviceOptions.value.some(device => device.value === currentDeviceId);

      if (!deviceExists) {
        console.warn(`[ActuatorParameters] Current deviceId ${currentDeviceId} not found in available devices. Clearing...`);

        // Clear the invalid deviceId
        updateParameterValue('deviceId', '');

        // Show notification to user
        $q.notify({
          type: 'warning',
          message: 'Избраното устройство не съществува или е деактивирано',
          caption: 'Полето е изчистено. Моля изберете ново устройство.',
          timeout: 5000,
          actions: [
            { icon: 'close', color: 'white', round: true }
          ]
        });
      }
    }

  } catch (error) {
    console.error('Failed to load devices:', error);
    deviceOptions.value = [];
  } finally {
    deviceOptionsLoading.value = false;
  }
}

// Watch for deviceType changes to load devices
watch(() => props.selectedBlock?.parameters?.deviceType, (newDeviceType, oldDeviceType) => {
  if (newDeviceType) {
    // Store current deviceId before loading new devices
    const currentDeviceId = props.selectedBlock?.parameters?.deviceId;
    
    loadDevicesByType(newDeviceType).then(() => {
      // After devices are loaded, restore deviceId if it exists in new options
      if (currentDeviceId && deviceOptions.value.some(opt => opt.value === currentDeviceId)) {
        // Device still exists in new options, keep it selected
        props.selectedBlock.parameters.deviceId = currentDeviceId;
      } else if (oldDeviceType && oldDeviceType !== newDeviceType) {
        // Only clear if type actually changed (not initial load)
        updateParameterValue('deviceId', '');
      }
    });
  } else {
    deviceOptions.value = [];
  }
}, { immediate: true });

// Load device types on mount
onMounted(() => {
  loadDeviceTypes();
});

// Open target selection dialog
function openTargetSelection(fieldId: string) {
  selectedTargetForField.value = fieldId;
  searchText.value = '';
  targetSelectDialog.value = true;
}

// Select target and close dialog
async function selectTarget(targetKey: string) {
  if (selectedTargetForField.value) {
    const fieldId = selectedTargetForField.value;
    const previousTargetKey = props.selectedBlock?.parameters[fieldId + '_target'];
    
    // Update parameter value
    updateParameterValue(fieldId + '_target', targetKey);
    
    // Track usage in Target Registry
    await trackTargetUsage(targetKey, fieldId, previousTargetKey);
    
    targetSelectDialog.value = false;
    selectedTargetForField.value = '';
  }
}

// Clear target selection
async function clearTarget(fieldId: string) {
  const currentTargetKey = props.selectedBlock?.parameters[fieldId + '_target'];
  
  updateParameterValue(fieldId + '_target', null);
  updateParameterValue(fieldId + '_target_comment', '');
  
  // Remove usage tracking
  if (currentTargetKey) {
    await untrackTargetUsage(currentTargetKey, fieldId);
  }
}

// Get display text for selected target
function getSelectedTargetDisplay(fieldId: string): string {
  const targetKey = props.selectedBlock?.parameters[fieldId + '_target'];
  if (!targetKey) return 'Избери Target';
  
  const target = availableTargets.value.find(t => t.targetKey === targetKey);
  if (target) {
    return `${target.visualName} (${target.targetKey})`;
  }
  return targetKey; // fallback
}

// Initialize component
onMounted(() => {
  loadTargets();
});

// 🎯 Usage Tracking Functions

/**
 * Track target usage in Target Registry
 */
async function trackTargetUsage(targetKey: string, fieldName: string, previousTargetKey?: string) {
  try {
    // First untrack previous target if different
    if (previousTargetKey && previousTargetKey !== targetKey) {
      await untrackTargetUsage(previousTargetKey, fieldName);
    }
    
    // Find the target by targetKey
    const target = availableTargets.value.find(t => t.targetKey === targetKey);
    if (!target) {
      console.warn(`Target not found for key: ${targetKey}`);
      return;
    }
    
    // DEACTIVATED: Target Registry System - Phase 1D
    // Track usage
    // await targetRegistryApi.trackUsage(target._id, {
    //   blockId: props.selectedBlock.id,
    //   blockType: 'actuator',
    //   fieldName: fieldName,
    //   flowId: 'current-flow', // TODO: Get from actual flow context
    //   flowName: 'Current Flow' // TODO: Get from actual flow context
    // });
    
    console.log(`✅ Tracked usage: ${targetKey} in block ${props.selectedBlock.id} field ${fieldName}`);
  } catch (error) {
    console.error('Failed to track target usage:', error);
    // Non-blocking error - don't prevent user from continuing
  }
}

/**
 * Remove target usage tracking
 */
async function untrackTargetUsage(targetKey: string, fieldName: string) {
  try {
    // Find the target by targetKey
    const target = availableTargets.value.find(t => t.targetKey === targetKey);
    if (!target) {
      console.warn(`Target not found for untracking: ${targetKey}`);
      return;
    }
    
    // DEACTIVATED: Target Registry System - Phase 1D
    // Untrack usage
    // await targetRegistryApi.untrackUsage(target._id, props.selectedBlock.id, fieldName);
    
    console.log(`🗑️ Untracked usage: ${targetKey} from block ${props.selectedBlock.id} field ${fieldName}`);
  } catch (error) {
    console.error('Failed to untrack target usage:', error);
    // Non-blocking error - don't prevent user from continuing
  }
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
 * Gets field label with target indicator
 */
function getFieldLabel(param: BlockParameter): string {
  const hasTarget = hasActiveTarget(param.id);
  return hasTarget ? `🧩 ${param.label}` : param.label;
}

/**
 * Gets field hint with target info
 */
function getFieldHint(param: BlockParameter): string {
  const hasTarget = hasActiveTarget(param.id);
  if (hasTarget) {
    const targetKey = param.id + '_target';
    const targetValue = props.selectedBlock?.parameters[targetKey];
    const targetComment = props.selectedBlock?.parameters[targetKey + '_comment'];
    let hint = `Ще се използва: ${targetValue}`;
    if (targetComment) {
      hint += ` (${targetComment})`;
    }
    return hint;
  }
  
  // Default hints
  if (param.id === 'duration') {
    return `Продължителност (0 = безкрайно, макс: ${param.validation?.max || 86400}сек)`;
  }
  if (param.id === 'dose') {
    return `Брой дози (макс: ${param.validation?.max || 999})`;
  }
  return param.description || '';
}

// 🔧 Parameter Management Functions

/**
 * Updates a parameter value for the selected block
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  console.log(`[ActuatorParameters] Updating parameter: ${paramId} = ${value}`);
  
  // Special validation for actuator parameters
  if (paramId === 'duration' && value < 0) {
    console.warn(`[ActuatorParameters] Duration cannot be negative: ${value}, setting to 0`);
    value = 0;
  }
  
  if (paramId === 'duration' && value > 86400) {
    console.warn(`[ActuatorParameters] Duration too high: ${value}s, setting to 86400s (24h)`);
    value = 86400;
  }
  
  if (paramId === 'dose' && value < 0) {
    console.warn(`[ActuatorParameters] Dose cannot be negative: ${value}, setting to 0`);
    value = 0;
  }
  
  if (paramId === 'dose' && value > 999) {
    console.warn(`[ActuatorParameters] Dose too high: ${value}, setting to 999`);
    value = 999;
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
    // Special formatting for actuator values
    if (param.id === 'duration') {
      if (value === 0) return 'Безкрайно';
      if (value >= 3600) return `${(value / 3600).toFixed(1)}ч`;
      if (value >= 60) return `${(value / 60).toFixed(1)}мин`;
      return `${value}сек`;
    }
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
 * Gets action type options based on device type
 */
function getActionTypeOptions(): Array<{label: string, value: string}> {
  const deviceType = props.selectedBlock?.parameters?.deviceType;
  
  // PWM devices - вентилатори, осветление
  if (['fan', 'light'].includes(deviceType)) {
    return [
      { label: 'Включи/Изключи (с време)', value: 'on_off_timed' },
      { label: 'Изключи/Включи (с време)', value: 'off_on_timed' },
      { label: 'Включи', value: 'on' },
      { label: 'Изключи', value: 'off' },
      { label: 'Задай мощност %', value: 'set_power' },
      { label: 'Плавно нарастване', value: 'fade_up' },
      { label: 'Плавно намаляване', value: 'fade_down' }
    ];
  }
  
  // Default relay devices - помпи, клапани, нагреватели, миксери
  return [
    { label: 'Включи/Изключи (с време)', value: 'on_off_timed' },
    { label: 'Изключи/Включи (с време)', value: 'off_on_timed' },
    { label: 'Включи', value: 'on' },
    { label: 'Изключи', value: 'off' }
  ];
}

/**
 * Show duration field for timed actions
 */
function showDurationField(): boolean {
  const actionType = props.selectedBlock?.parameters?.actionType;
  return ['on_off_timed', 'off_on_timed', 'fade_up', 'fade_down'].includes(actionType);
}

/**
 * Show power level field for set_power action
 */
function showPowerField(): boolean {
  const actionType = props.selectedBlock?.parameters?.actionType;
  return actionType === 'set_power';
}

/**
 * Show power range fields for fade actions
 */
function showPowerRangeFields(): boolean {
  const actionType = props.selectedBlock?.parameters?.actionType;
  return ['fade_up', 'fade_down'].includes(actionType);
}

/**
 * Determine if a parameter should be shown based on current action type
 */
function shouldShowParameter(paramId: string): boolean {
  // Always show these core parameters
  if (['deviceType', 'deviceId', 'actionType'].includes(paramId)) {
    return true;
  }
  
  // Conditional parameters based on action type
  const actionType = props.selectedBlock?.parameters?.actionType;
  
  switch (paramId) {
    case 'duration':
      return showDurationField();
    case 'powerLevel':
      return showPowerField();
    case 'powerFrom':
    case 'powerTo':
      return showPowerRangeFields();
    case 'useGlobalVariable':
    case 'selectedGlobalVariable':
      return false; // These are handled inside duration parameter-item, don't show separately
    default:
      return true; // Show unknown parameters by default
  }
}
</script>

<style scoped>
/* Actuator Parameters Specific Styles - ОРАНЖЕВ КАНТ */

.actuator-parameters {
  border: 2px solid #ff9800;
  border-radius: 8px;
  margin-bottom: 16px;
}

.actuator-parameters .expansion-header {
  background: rgba(255, 152, 0, 0.1);
  color: #e65100;
  font-weight: 600;
}

/* Actuator Status Display */
.actuator-status-display {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ff9800;
  background: rgba(255, 152, 0, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  color: #e65100;
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

/* Special Actuator Input Styling */
.device-type-select {
  border-left: 3px solid #795548;
}

.action-select {
  border-left: 3px solid #ff9800;
}

.control-mode-select {
  border-left: 3px solid #673AB7;
}

.duration-input {
  border-left: 3px solid #009688;
}

.dose-input {
  border-left: 3px solid #3F51B5;
}

.time-input {
  border-left: 3px solid #009688;
}

.universal-value-input {
  border-left: 3px solid #009688;
}

/* Duration Field */
.duration-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.global-variable-checkbox {
  margin-bottom: 8px;
}

/* Stop On Disconnect Checkbox */
.stop-on-disconnect-checkbox {
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid #f44336;
  border-radius: 6px;
  background: rgba(244, 67, 54, 0.05);
}

/* Global Variable Checkbox and Select Styling */
.global-variable-checkbox-separate {
  margin-bottom: 8px;
}

.global-variable-select {
  border-left: 3px solid #FF9800;
  background: rgba(255, 152, 0, 0.05);
}

.actuator-toggle {
  padding: 8px 0;
}

/* DEACTIVATED: Executor Mode System - Phase 3A */
/* Target Controls Styling */
/*
.target-controls {
  margin-top: 12px;
  padding: 12px;
  border: 1px dashed #9C27B0;
  border-radius: 6px;
  background: rgba(156, 39, 176, 0.05);
}

.target-selection {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.target-select-btn {
  flex: 1;
  text-transform: none;
  justify-content: flex-start;
}

.target-clear-btn {
  min-width: auto;
  width: 32px;
  height: 32px;
}

.target-comment {
  border-left: 2px solid #607D8B;
}

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

/* DEACTIVATED: Executor Mode System - Phase 3A */
/* Target Selection Dialog */
/*
.target-list {
  max-height: 400px;
  overflow-y: auto;
}

.target-item {
  border-radius: 6px;
  margin: 2px 0;
}

.target-item:hover {
  background: rgba(156, 39, 176, 0.05);
}

.target-item .q-item__section--avatar {
  min-width: 50px;
}

.target-item .q-item__label {
  line-height: 1.2;
}

.target-item .q-item__label--caption {
  margin-top: 2px;
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
  .block-comment-field {
    padding: 8px;
    margin-bottom: 12px;
  }
  .actuator-status-display {
    padding: 8px;
    margin-bottom: 12px;
  }
  
  .status-text {
    font-size: 12px;
  }
  
  .expansion-content {
    padding: 12px;
  }
  
  /* Target dialog responsive */
  .target-selection {
    flex-direction: column;
    gap: 4px;
  }
  
  .target-select-btn {
    width: 100%;
  }
}
</style>