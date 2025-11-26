<!--
/**
 * 🔍 Sensor Block Parameters Component
 * ✅ Dedicated component for Sensor block parameter rendering
 * Modular approach for better maintainability
 */
-->
<template>
  <!-- Sensor Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="sensors"
    label="Sensor Параметри"
    header-class="expansion-header"
    class="expansion-section sensor-parameters"
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
            
            <!-- 🔌 Sensor Device Selection (critical parameter) -->
            <q-select
              v-if="param.id === 'deviceId'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="availableSensors"
              :loading="loadingSensors"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select device-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="sensors" size="xs" color="primary" />
              </template>
              <template v-slot:hint>
                Избери сензор от базата данни (само сензори)
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      <q-chip size="xs" color="info" text-color="white">
                        {{ getSensorTypeLabel(scope.opt.type) }}
                      </q-chip>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    {{ loadingSensors ? 'Зареждане на сензори...' : 'Няма налични сензори' }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            
            <!-- 📊 Monitoring Tag Selection (новия параметър) -->
            <q-select
              v-else-if="param.id === 'monitoringTagId'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="availableMonitoringTags"
              :loading="loadingMonitoringTags"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              clearable
              class="param-select monitoring-tag-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="analytics" size="xs" color="secondary" />
              </template>
              <template v-slot:hint>
                Избери таг за автоматично записване в мониторинг система (опционално)
              </template>
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>
                      <q-chip 
                        size="xs" 
                        :color="scope.opt.isActive ? 'positive' : 'negative'" 
                        text-color="white"
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
                    {{ loadingMonitoringTags ? 'Зареждане на тагове...' : 'Няма налични тагове' }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            
            
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
import { useQuasar } from 'quasar';
import { api } from '../../../../../../../services/api';
import { monitoringService } from '../../../../../../../services/monitoringService';
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

// Quasar
const $q = useQuasar();

// Data
const availableSensors = ref<Array<{label: string, value: string, type: string}>>([]);
const loadingSensors = ref(false);

// Monitoring Tags Data
const availableMonitoringTags = ref<Array<{label: string, value: string, isActive: boolean}>>([]);
const loadingMonitoringTags = ref(false);

// Device validation is now handled automatically in loadAvailableSensors()

// 🔧 Parameter Management Functions

/**
 * Updates a parameter value for the selected block
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  console.log(`[SensorParameters] Updating parameter: ${paramId} = ${value}`);
  
  // Special validation for sensor parameters
  if (paramId === 'readingInterval' && value < 100) {
    console.warn(`[SensorParameters] Reading interval too low: ${value}ms, setting to 100ms`);
    value = 100;
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
    if (param.id === 'deviceId' && availableSensors.value.length > 0) {
      const sensor = availableSensors.value.find(opt => opt.value === value);
      return sensor?.label || String(value);
    }
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

/**
 * Load available sensors from database using Device.category filtering
 */
async function loadAvailableSensors() {
  loadingSensors.value = true;
  try {
    // Get all devices and filter by category field
    const response = await api.getClient().get('/devices');
    const devices = response.data;
    
    // Filter devices by Device.category field for sensors
    const sensors = devices.filter((device: any) => 
      device.category === 'sensor' && device.isActive
    );
    
    console.log(`[SensorParameters] Found ${sensors.length} active sensor devices by category filtering`);
    
    availableSensors.value = sensors.map((sensor: any) => ({
      label: `${sensor.name} (${Array.isArray(sensor.ports) ? sensor.ports.join(',') : sensor.port || 'N/A'})`,
      value: sensor._id,
      type: sensor.type,
      port: Array.isArray(sensor.ports) ? sensor.ports.join(',') : sensor.port,
      controllerId: sensor.controllerId
    }));
    
    console.log(`[SensorParameters] Loaded ${availableSensors.value.length} sensors from database (Device.category filtered)`);

    // Check if current deviceId exists in loaded sensors
    const currentDeviceId = props.selectedBlock?.parameters.deviceId;
    if (currentDeviceId && typeof currentDeviceId === 'string') {
      const deviceExists = availableSensors.value.some(sensor => sensor.value === currentDeviceId);

      if (!deviceExists) {
        console.warn(`[SensorParameters] Current deviceId ${currentDeviceId} not found in available sensors. Clearing...`);

        // Clear the invalid deviceId
        updateParameterValue('deviceId', '');

        // Show notification to user
        $q.notify({
          type: 'warning',
          message: 'Избраният сензор не съществува или е деактивиран',
          caption: 'Полето е изчистено. Моля изберете нов сензор.',
          timeout: 5000,
          actions: [
            { icon: 'close', color: 'white', round: true }
          ]
        });
      }
    }

  } catch (error) {
    console.error('[SensorParameters] Error loading sensors:', error);
    availableSensors.value = [];
  } finally {
    loadingSensors.value = false;
  }
}

/**
 * Get human-readable sensor type label for device types
 */
function getSensorTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    // Legacy sensor types (for backward compatibility)
    'temp_sensor': 'Температура',
    'humidity_sensor': 'Влажност', 
    'ph_sensor': 'pH',
    'ec_sensor': 'EC',
    'level_sensor': 'Ниво',
    'flow_sensor': 'Поток',
    
    // DeviceTemplate sensor types
    'HC-SR04': 'Разстояние (Ултразвук)',
    'DHT22': 'Температура & Влажност',
    'analog_sensor': 'Аналогов сензор'
  };
  return typeLabels[type] || type;
}

/**
 * Load available monitoring tags from database
 */
async function loadAvailableMonitoringTags() {
  loadingMonitoringTags.value = true;
  try {
    const tags = await monitoringService.getMonitoringTags(true); // Only active monitoring tags
    
    availableMonitoringTags.value = tags.map((tag) => ({
      label: tag.name,
      value: tag._id,
      isActive: tag.isActive
    }));
    
    console.log(`[SensorParameters] Loaded ${availableMonitoringTags.value.length} monitoring tags`);
    
  } catch (error) {
    console.error('[SensorParameters] Error loading monitoring tags:', error);
    availableMonitoringTags.value = [];
  } finally {
    loadingMonitoringTags.value = false;
  }
}

// Load data on component mount
onMounted(() => {
  loadAvailableSensors();
  loadAvailableMonitoringTags();
});
</script>

<style scoped>
/* Sensor Parameters Specific Styles - ЛИЛАВ КАНТ */

.sensor-parameters {
  border: 2px solid #9c27b0;
  border-radius: 8px;
  margin-bottom: 16px;
}

.sensor-parameters .expansion-header {
  background: rgba(156, 39, 176, 0.1);
  color: #7b1fa2;
  font-weight: 600;
}

/* Sensor Status Display */
.sensor-status-display {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #2196f3;
  background: rgba(33, 150, 243, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  color: #1976d2;
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

/* Special Sensor Input Styling */
.device-select {
  border-left: 3px solid #2196f3;
}

.monitoring-tag-select {
  border-left: 3px solid #9c27b0;
}

.interval-input {
  border-left: 3px solid #ff9800;
}

.sensor-type-select {
  border-left: 3px solid #4caf50;
}

.calibration-input {
  border-left: 3px solid #ff5722;
}

.sensor-toggle {
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
  .block-comment-field {
    padding: 8px;
    margin-bottom: 12px;
  }
  .sensor-status-display {
    padding: 8px;
    margin-bottom: 12px;
  }
  
  .status-text {
    font-size: 12px;
  }
  
  .expansion-content {
    padding: 12px;
  }
}
</style>