// ABOUTME: Universal calibration dialog that loads appropriate calibration component based on device type
// ABOUTME: Dynamically imports and renders the correct calibration controls for sensors, relays, and actuators
<template>
  <q-dialog v-model="isOpen" persistent no-backdrop-dismiss>
    <q-card style="min-width: 700px; max-width: 900px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          <q-icon name="tune" class="q-mr-sm" color="purple" />
          🔧 {{ getDialogTitle() }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="!device" class="text-center q-py-lg">
        <q-icon name="error" size="48px" color="orange" class="q-mb-md" />
        <div class="text-h6 text-grey-8">Няма избрано устройство</div>
        <div class="text-body2 text-grey-6">Моля изберете устройство за калибриране</div>
      </q-card-section>

      <q-card-section v-else-if="!device.isActive" class="text-center q-py-lg">
        <q-icon name="power_off" size="48px" color="grey" class="q-mb-md" />
        <div class="text-h6 text-grey-8">Устройството е деактивирано</div>
        <div class="text-body2 text-grey-6">Само активни устройства могат да бъдат калибрирани</div>
      </q-card-section>

      <q-card-section v-else-if="loading" class="text-center q-py-lg">
        <q-circular-progress
          indeterminate
          size="50px"
          color="primary"
          class="q-mb-md"
        />
        <div class="text-body1">Зареждане на калибрационни контроли...</div>
      </q-card-section>

      <q-card-section v-else-if="error" class="text-center q-py-lg">
        <q-icon name="error" size="48px" color="negative" class="q-mb-md" />
        <div class="text-h6 text-negative">Грешка при зареждане</div>
        <div class="text-body2 text-grey-6">{{ error }}</div>
        <q-btn
          color="primary"
          label="Опитай отново"
          @click="loadCalibrationComponent"
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-section v-else style="max-height: 600px; overflow-y: auto;">
        <!-- Dynamic Calibration Component -->
        <component
          v-if="calibrationComponent && freshDeviceData"
          :is="calibrationComponent"
          :device="freshDeviceData"
          :template="deviceTemplate"
          @calibration-updated="handleCalibrationUpdate"
          @settings-updated="handleSettingsUpdate"
        />

        <!-- Fallback for unsupported devices -->
        <q-card v-else flat bordered class="text-center q-py-lg">
          <q-card-section>
            <q-icon name="construction" size="48px" color="orange" class="q-mb-md" />
            <div class="text-h6 text-grey-8">Неподдържан тип устройство</div>
            <div class="text-body2 text-grey-6">
              Няма налични калибрационни контроли за тип "{{ freshDeviceData?.type || device.type }}"
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          label="Затвори"
          color="grey"
          @click="close"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, markRaw, shallowRef } from 'vue'
import { useQuasar } from 'quasar'
import deviceTemplateApi from '../services/device-template-api'
import { deviceApi } from '../services/api'

// Props
interface Props {
  modelValue: boolean
  device: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  device: null
})

// Emits
const emit = defineEmits(['update:modelValue', 'calibration-updated', 'settings-updated'])

const $q = useQuasar()

// Data
const loading = ref(false)
const error = ref('')
const calibrationComponent = shallowRef<any>(null)
const deviceTemplate = ref<any>(null)
const freshDeviceData = ref<any>(null)

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Component mapping based on device type
const componentMap = {
  // pH Sensors - TESTING: Using BaseSensorCalibration
  'dfrobot_ph_sensor': () => import('./calibration/BaseSensorCalibration.vue'),
  
  // EC Sensors
  'dfrobot_ec_sensor': () => import('./calibration/BaseSensorCalibration.vue'),
  
  // Ultrasonic Sensors
  'HC-SR04': () => import('./calibration/BaseSensorCalibration.vue'),
  'SEN0311': () => import('./calibration/BaseSensorCalibration.vue'),
  'ultrasonic': () => import('./calibration/BaseSensorCalibration.vue'),

  // Soil Moisture Sensors
  'capacitive_soil_moisture': () => import('./calibration/BaseSensorCalibration.vue'),
  'moisture': () => import('./calibration/BaseSensorCalibration.vue'),
  
  // Temperature & Humidity Sensors
  'DHT22': () => import('./calibration/BaseSensorCalibration.vue'),
  'DS18B20': () => import('./calibration/BaseSensorCalibration.vue'),

  // Flow Sensors
  'SEN0550': () => import('./calibration/BaseSensorCalibration.vue'),
  'SEN0551': () => import('./calibration/BaseSensorCalibration.vue'),

  // Light/PAR Sensors
  'SEN0641': () => import('./calibration/BaseSensorCalibration.vue'),

  // Relays and Actuators
  'relay': () => import('./calibration/RelayControls.vue'),
  'pumps': () => import('./calibration/RelayControls.vue'),
  'solenoid_valve': () => import('./calibration/RelayControls.vue'),
}

// Methods
const getDialogTitle = () => {
  if (!props.device) return 'Калибриране на устройство'
  
  const typeLabel = getPhysicalTypeLabel(props.device.physicalType)
  return `Калибриране на ${typeLabel} - ${props.device.name}`
}

const getDeviceTypeLabel = (type: string): string => {
  // This should match the logic from DeviceForm or use a shared utility
  const typeLabels: Record<string, string> = {
    'dfrobot_ph_sensor': 'DFRobot pH Sensor',
    'dfrobot_ec_sensor': 'DFRobot EC Sensor',
    'HC-SR04': 'Ultrasonic Sensor',
    'SEN0311': 'DFRobot SEN0311 Ultrasonic Sensor',
    'SEN0641': 'DFRobot SEN0641 PAR Light Sensor',
    'capacitive_soil_moisture': 'Soil Moisture Sensor',
    'DHT22': 'DHT22 Temperature/Humidity Sensor',
    'DS18B20': 'DS18B20 Temperature Sensor',
    'relay': 'Relay Module',
    'pumps': 'Pump System',
    'solenoid_valve': 'Solenoid Valve'
  }
  return typeLabels[type] || type.toUpperCase()
}

const getPhysicalTypeLabel = (physicalType: string): string => {
  // Guard against undefined physicalType
  if (!physicalType) {
    console.error('[CalibrationDialog] physicalType is undefined - this should not happen!')
    return 'Unknown Sensor'
  }
  
  const typeLabels: Record<string, string> = {
    'ph': 'pH Сензор',
    'ec': 'EC Сензор',
    'moisture': 'Влажностен Сензор',
    'ultrasonic': 'Ултразвуков Сензор',
    'distance': 'Сензор за Разстояние',
    'relay': 'Реле',
    'temperature': 'Температурен Сензор',
    'temperature_humidity': 'Температура/Влажност Сензор',
    'flow': 'Дебитомер',
    'level': 'Сензор за Ниво',
    'light': 'Светлинен Сензор'
  }
  return typeLabels[physicalType] || physicalType.toUpperCase()
}

const getDeviceStatusColor = () => {
  return props.device?.isActive ? 'positive' : 'grey'
}

const loadCalibrationComponent = async () => {
  if (!props.device) return
  
  loading.value = true
  error.value = ''
  calibrationComponent.value = null
  freshDeviceData.value = null
  
  try {
    // Load fresh device data from DB
    console.log(`[CalibrationDialog] Loading fresh device data for: ${props.device.name}`)
    const deviceResponse = await deviceApi.getById(props.device._id)
    freshDeviceData.value = deviceResponse.data || deviceResponse
    console.log(`[CalibrationDialog] Fresh device data loaded:`, freshDeviceData.value)
    console.log(`[CalibrationDialog] Fresh device type:`, freshDeviceData.value?.type)
    console.log(`[CalibrationDialog] Original device type:`, props.device.type)
    
    // Load device template for additional context
    try {
      const templates = await deviceTemplateApi.getAll()
      deviceTemplate.value = templates.find((t: any) => t.type === props.device.type)
    } catch (templateError) {
      console.warn('[CalibrationDialog] Could not load device template:', templateError)
      // Continue without template - components should handle this gracefully
    }
    
    // Load the appropriate calibration component
    const componentLoader = componentMap[props.device.type as keyof typeof componentMap]
    
    if (componentLoader) {
      try {
        const componentModule = await componentLoader()
        calibrationComponent.value = markRaw(componentModule.default)
        console.log(`[CalibrationDialog] Loaded calibration component for device type: ${props.device.type}`)
      } catch (componentError) {
        console.error(`[CalibrationDialog] Failed to load component for ${props.device.type}:`, componentError)
        error.value = `Грешка при зареждане на компонента: ${componentError.message}`
      }
    } else {
      console.warn(`[CalibrationDialog] No calibration component found for device type: ${props.device.type}`)
      // calibrationComponent.value will remain null, showing the fallback message
    }
  } catch (err: any) {
    console.error('[CalibrationDialog] Error loading calibration component:', err)
    error.value = err.message || 'Неизвестна грешка при зареждане на компонента'
  } finally {
    loading.value = false
  }
}

const close = () => {
  isOpen.value = false
  // Reset state when closing
  calibrationComponent.value = null
  deviceTemplate.value = null
  freshDeviceData.value = null
  error.value = ''
}

const handleCalibrationUpdate = (calibrationData: any) => {
  console.log('[CalibrationDialog] Calibration updated:', calibrationData)
  emit('calibration-updated', calibrationData)
  
  $q.notify({
    type: 'positive',
    message: 'Калибрацията е обновена успешно',
    position: 'top-right'
  })
}

const handleSettingsUpdate = (settings: any) => {
  console.log('[CalibrationDialog] Settings updated:', settings)
  emit('settings-updated', settings)
  
  $q.notify({
    type: 'positive',
    message: 'Настройките са обновени успешно',
    position: 'top-right'
  })
}

// Watch for device changes
watch(() => props.device, (newDevice) => {
  if (newDevice && isOpen.value) {
    loadCalibrationComponent()
  }
}, { immediate: true })

// Watch for dialog open/close
watch(isOpen, (isOpening) => {
  if (isOpening && props.device) {
    loadCalibrationComponent()
  } else if (!isOpening) {
    // Clean up when closing
    calibrationComponent.value = null
    deviceTemplate.value = null
    freshDeviceData.value = null
  }
})
</script>

<style scoped>
.q-dialog__inner {
  padding: 16px;
}

/* Ensure the dialog content is properly scrollable */
.q-card__section {
  position: relative;
}

/* Add some spacing for the device info header */
.device-info-header {
  border-left: 4px solid var(--q-primary);
}
</style>