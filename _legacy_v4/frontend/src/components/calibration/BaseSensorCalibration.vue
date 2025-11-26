<!-- ABOUTME: Unified base template for sensor calibration using UltraSonic pattern -->
<!-- ABOUTME: Supports all sensor types with parameterized configuration and automatic correction method selection -->

<template>
  <div class="calibration-container">
    <!-- Physics Formula Banner -->
    <q-banner 
      v-if="sensorConfig.physicsFormula" 
      class="bg-info text-white q-mb-md rounded-borders"
      dense
    >
      <div class="text-center">
        <q-icon name="functions" size="sm" class="q-mr-sm" />
        <strong>Physics Formula:</strong> {{ sensorConfig.physicsFormula }}
      </div>
    </q-banner>

    <!-- Sensor Test Section -->
    <q-card class="q-mb-md" flat bordered>
      <q-card-section class="bg-blue-1 q-py-sm">
        <div class="text-subtitle2 q-mb-sm">
          <q-icon name="sensors" class="q-mr-sm" />
          📡 Sensor Test - {{ props.device.name }}
        </div>

        <div class="row q-gutter-md items-center">
          <!-- Readings Display -->
          <div class="col">
            <div class="row q-gutter-sm">
              <div class="col-auto">
                <div class="text-caption text-grey-6">Current Reading:</div>
                <div :class="sensorConfig.readingClass" class="text-h6">
                  {{ formatTestReading() }}
                </div>
              </div>
              <div class="col-auto">
                <div class="text-caption text-grey-6">Raw Value:</div>
                <div class="text-h6 text-grey-8">
                  {{ formatRawValue() }}
                </div>
              </div>
            </div>
            
            <!-- Status -->
            <div class="row q-gutter-xs items-center q-mt-sm">
              <q-icon 
                :name="sensorStatus.icon" 
                :color="sensorStatus.color" 
                size="sm" 
              />
              <span class="text-body2" :class="`text-${sensorStatus.color}`">
                {{ sensorStatus.text }}
              </span>
              <span v-if="lastTestTime" class="text-caption text-grey-6 q-ml-sm">
                Last: {{ lastTestTime }}
              </span>
            </div>
          </div>

          <!-- Test Button -->
          <div class="col-auto">
            <q-btn
              color="primary"
              icon="refresh"
              label="🔄 Test Reading"
              @click="testSensorReading"
              :loading="testing"
              :disable="testing"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-gutter-md">
      <!-- Left Column: Add Calibration Point -->
      <div class="col-12 col-md-5">
        <q-card class="full-height">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="add_circle" class="q-mr-sm" />
              Добави точка
            </div>

            <!-- Current Reading Display -->
            <div class="current-reading q-mb-md">
              <q-item class="q-pa-none">
                <q-item-section>
                  <q-item-label class="text-weight-medium">Current Reading:</q-item-label>
                  <q-item-label 
                    :class="sensorConfig.readingClass" 
                    class="text-h6"
                  >
                    {{ formatCurrentReading() }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    round
                    color="primary"
                    icon="refresh"
                    size="sm"
                    @click="refreshReading"
                    :loading="refreshing"
                    dense
                  />
                </q-item-section>
              </q-item>
            </div>

            <!-- Entry Mode Selection -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">
                <q-icon name="settings" class="q-mr-sm" />
                Mode:
              </div>
              <q-option-group
                v-model="entryMode"
                :options="[
                  {label: 'Live Reading', value: 'live'},
                  {label: 'Manual Entry', value: 'manual'}
                ]"
                color="primary"
                inline
              />
            </div>

            <!-- Voltage Selection (not needed for digital sensors - they measure time/digital, not voltage) -->
            <div v-if="!isDigitalSensor" class="q-mb-md row items-center q-gutter-sm">
              <div class="text-subtitle2">
                <q-icon name="bolt" class="q-mr-sm" />
                Voltage:
              </div>
              <q-option-group
                v-model="referenceVoltage"
                :options="[
                  {label: '3.3V', value: 3.3},
                  {label: '5.0V', value: 5.0}
                ]"
                color="primary"
                inline
              />
            </div>

            <!-- Target Value Input -->
            <div class="q-mb-md">
              <q-input
                v-model.number="newPoint.targetValue"
                label="Целева стойност"
                type="number"
                :step="sensorConfig.step"
                :suffix="displayUnit"
                filled
                :rules="sensorConfig.rules"
              />
            </div>

            <!-- Manual ADC Input (Manual Entry Mode Only) -->
            <div v-if="entryMode === 'manual'" class="q-mb-md">
              <q-input
                v-model.number="newPoint.measuredValue"
                label="Measured ADC"
                type="number"
                step="1"
                suffix="ADC"
                filled
                :rules="[
                  val => val !== null && val !== '' || 'ADC полето е задължително',
                  val => val >= 0 && val <= 1023 || 'ADC стойността трябва да е между 0 и 1023'
                ]"
              />
            </div>

            <!-- Add Point Button -->
            <q-btn
              color="primary"
              label="Добави точка"
              icon="add_circle"
              @click="addCalibrationPoint"
              :disable="!canAddPoint"
              class="full-width"
            />

            <!-- Unit Selection (EC sensors only) -->
            <div v-if="sensorConfig.supportedUnits" class="q-mt-md">
              <q-separator class="q-mb-md" />
              <div class="text-subtitle2 q-mb-sm">
                <q-icon name="straighten" class="q-mr-sm" />
                Единица за показване
              </div>
              
              <q-option-group
                v-model="selectedUnit"
                :options="unitOptions"
                color="primary"
                @update:model-value="onUnitChange"
              />
              
              <div class="text-caption text-grey-6 q-mt-xs">
                <q-icon name="info" size="xs" class="q-mr-xs" />
                Калибрацията се прави в {{ sensorConfig.unit }}, конвертира се за показване
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Correction Method & Calibration Points -->
      <div class="col-12 col-md-6">
        <q-card class="full-height">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="tune" class="q-mr-sm" />
              Correction Method
            </div>

            <!-- Automatic Correction Method Display -->
            <div class="q-mb-md">
              <q-banner class="bg-grey-2 text-dark" dense>
                <div class="text-center">
                  <q-icon name="auto_awesome" size="sm" class="q-mr-sm" />
                  <strong>Automatic Selection:</strong> {{ getCorrectionMethodName() }}
                </div>
              </q-banner>
            </div>

            <!-- Correction Method Options (Disabled for display) -->
            <div class="q-mb-md">
              <q-option-group
                :options="correctionMethodOptions"
                v-model="correctionMethod"
                color="primary"
                :disable="true"
              />
              <div class="text-caption text-grey-7 q-mt-xs">
                <q-icon name="info" size="xs" class="q-mr-xs" />
                Method automatically selected based on calibration points
              </div>
            </div>

            <!-- Current Calibration Points -->
            <div class="text-subtitle2 q-mb-sm">
              Калибрационни точки
              <q-badge v-if="calibrationPoints.length > 0" :label="calibrationPoints.length" color="primary" />
            </div>

            <!-- Points List with Fixed Height and Scroll -->
            <div class="calibration-points-container">
              <div v-if="calibrationPoints.length === 0" class="text-center q-pa-md text-grey-6 empty-state">
                <q-icon name="info" size="md" class="q-mb-sm" />
                <div>Няма добавени калибрационни точки</div>
                <div class="text-caption">Добавете калибрационни точки за по-точни отчети</div>
              </div>

              <q-list v-else separator class="scrollable-points-list">
                <q-item
                  v-for="(point, index) in calibrationPoints"
                  :key="index"
                  class="q-py-sm"
                >
                  <q-item-section>
                    <q-item-label>
                      {{ formatPointLabel(point) }}
                    </q-item-label>
                    <q-item-label caption>
                      Точка {{ index + 1 }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      color="negative"
                      icon="delete"
                      size="sm"
                      @click="removeCalibrationPoint(index)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
              
              <!-- Scroll indicator when there are many points -->
              <div v-if="calibrationPoints.length > 3" class="text-center q-pt-xs">
                <q-icon name="keyboard_arrow_down" size="xs" class="text-grey-5" />
                <span class="text-caption text-grey-5 q-ml-xs">
                  Повече точки ({{ calibrationPoints.length }} общо)
                </span>
              </div>
            </div>

          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from '../../config/ports'

// Props
interface Props {
  device: any
  template?: any
}

const props = withDefaults(defineProps<Props>(), {
  device: null,
  template: null
})

// Determine sensor type from device
const sensorType = computed(() => {
  if (!props.device) return 'ph'

  const type = props.device.type || props.device.physicalType

  // Map device types to sensor types
  switch (type) {
    case 'dfrobot_ph_sensor':
    case 'ph':
      return 'ph'
    case 'dfrobot_ec_sensor':
    case 'ec':
      return 'ec'
    case 'HC-SR04':
    case 'ultrasonic':
      return 'ultrasonic'
    case 'SEN0311':
    case 'distance':
      return 'distance'
    case 'SEN0641':
    case 'light':
      return 'light'
    case 'capacitive_soil_moisture':
    case 'moisture':
      return 'moisture'
    case 'DHT22':
    case 'DS18B20':
    case 'temperature_humidity':
      return 'temperature_humidity'
    default:
      return 'ph' // fallback
  }
})

// Composables
const $q = useQuasar()

// Reactive state
const manualMode = ref(false)
const entryMode = ref('live')
const referenceVoltage = ref(5.0)
const refreshing = ref(false)
const testing = ref(false)
const currentReading = ref<any>(null)
const testReading = ref<any>(null)
const rawValue = ref<any>(null)
const lastTestTime = ref<string>('')
const selectedUnit = ref<string>('')
const calibrationPoints = ref<any[]>([])
const newPoint = ref({
  targetValue: undefined as number | undefined,
  measuredValue: undefined as number | undefined
})

// Simplified Sensor Configuration
const sensorConfigs = {
  ph: {
    physicsFormula: null,
    unit: 'pH',
    rawUnit: 'ADC',
    readingClass: 'text-blue',
    supportsManualInput: false,
    step: '0.01',
    rules: [(val: any) => (val !== null && val >= 0 && val <= 14) || 'pH трябва да е между 0-14']
  },
  ec: {
    physicsFormula: null,
    unit: 'µS/cm',
    rawUnit: 'ADC',
    readingClass: 'text-orange',
    supportsManualInput: false,
    step: '1',
    rules: [(val: any) => (val !== null && val >= 0 && val <= 20000) || 'EC трябва да е между 0-20000 µS/cm'],
    supportedUnits: ['µS/cm', 'mS/cm', 'ppm'],
    defaultUnit: 'µS/cm'
  },
  ultrasonic: {
    physicsFormula: null,
    unit: 'cm',
    rawUnit: 'µs',
    readingClass: 'text-purple',
    supportsManualInput: false,
    step: '0.1',
    rules: [(val: any) => (val !== null && val >= 0 && val <= 400) || 'Разстоянието трябва да е между 0-400 cm']
  },
  distance: {
    physicsFormula: null,
    unit: 'cm',
    rawUnit: 'mm',
    readingClass: 'text-purple',
    supportsManualInput: false,
    step: '0.1',
    rules: [(val: any) => (val !== null && val >= 0 && val <= 500) || 'Разстоянието трябва да е между 0-500 cm']
  },
  light: {
    physicsFormula: null,
    unit: 'µmol/m²·s',
    rawUnit: 'raw',
    readingClass: 'text-amber',
    supportsManualInput: false,
    step: '1',
    rules: [(val: any) => (val !== null && val >= 0 && val <= 4000) || 'PAR стойността трябва да е между 0-4000 µmol/m²·s']
  },
  moisture: {
    physicsFormula: null,
    unit: '%',
    rawUnit: 'ADC',
    readingClass: 'text-green',
    supportsManualInput: false,
    step: '0.1',
    rules: [(val: any) => (val !== null && val >= 0 && val <= 100) || 'Влажността трябва да е между 0-100%']
  },
  temperature_humidity: {
    physicsFormula: null,
    unit: '°C/%RH',
    rawUnit: 'µs',
    readingClass: 'text-teal',
    supportsManualInput: false,
    step: '0.1',
    rules: [
      (val: any) => {
        if (val === null || val === undefined) return 'Стойността е задължителна'
        // For dual values, validate both temperature and humidity
        if (typeof val === 'object' && val.temperature !== undefined && val.humidity !== undefined) {
          const temp = Number(val.temperature)
          const humidity = Number(val.humidity)
          if (temp < -40 || temp > 80) return 'Температурата трябва да е между -40°C и +80°C'
          if (humidity < 0 || humidity > 100) return 'Влажността трябва да е между 0% и 100% RH'
          return true
        }
        // For single value input (calibration)
        const numVal = Number(val)
        if (numVal >= -40 && numVal <= 80) return true // Temperature range
        if (numVal >= 0 && numVal <= 100) return true  // Humidity range
        return 'Стойността трябва да е в обхвата на температура (-40 до +80°C) или влажност (0-100% RH)'
      }
    ]
  }
}

const sensorConfig = computed(() => {
  const config = sensorConfigs[sensorType.value as keyof typeof sensorConfigs]
  if (!config) {
    console.error(`[BaseSensorCalibration] No sensor config found for type: ${sensorType.value}`)
    console.error(`[BaseSensorCalibration] Available configs:`, Object.keys(sensorConfigs))
    // Fallback to pH config to prevent crashes
    return sensorConfigs.ph
  }
  return config
})

// Digital sensors don't need voltage selection (they measure time/digital values, not analog voltage)
const isDigitalSensor = computed(() => {
  const digitalSensorTypes = ['ultrasonic', 'distance', 'temperature_humidity', 'light']
  return digitalSensorTypes.includes(sensorType.value)
})

// Correction method options
const correctionMethodOptions = [
  { label: 'Offset (1 point)', value: 'offset' },
  { label: 'Linear (2 points)', value: 'linear' },
  { label: 'Interpolated (3+ points)', value: 'interpolated' }
]

const correctionMethod = computed(() => {
  const pointCount = calibrationPoints.value.length
  if (pointCount === 0) return 'none'
  if (pointCount === 1) return 'offset'
  if (pointCount === 2) return 'linear'
  return 'interpolated'
})

// Computed properties
const canAddPoint = computed(() => {
  const hasTargetValue = newPoint.value.targetValue !== undefined && newPoint.value.targetValue !== null
  const hasValidMeasuredValue = !sensorConfig.value.supportsManualInput || 
    !manualMode.value || 
    (newPoint.value.measuredValue !== undefined && newPoint.value.measuredValue !== null)
  
  return hasTargetValue && hasValidMeasuredValue
})

// Sensor test computed properties
const sensorStatus = computed(() => {
  if (testing.value) {
    return { icon: 'sync', color: 'blue', text: 'Testing...' }
  }
  
  if (!testReading.value) {
    return { icon: 'help', color: 'grey', text: 'Not tested' }
  }
  
  if (testReading.value.error) {
    return { icon: 'error', color: 'negative', text: 'Error' }
  }
  
  return { icon: 'check_circle', color: 'positive', text: 'Connected' }
})

// Unit selection computed properties
const unitOptions = computed(() => {
  if (!sensorConfig.value.supportedUnits) return []
  
  return sensorConfig.value.supportedUnits.map((unit: string) => ({
    label: unit,
    value: unit
  }))
})

const displayUnit = computed(() => {
  return selectedUnit.value || sensorConfig.value.unit
})

// Methods
const formatCurrentReading = () => {
  if (!currentReading.value) return 'No data'

  const rawValue = currentReading.value.rawValue || currentReading.value.adc || 0
  const convertedValue = currentReading.value.value || 0
  let unit = selectedUnit.value || sensorConfig.value.unit

  // Convert value if needed (for EC sensors)
  let displayValue = convertedValue
  if (sensorConfig.value.supportedUnits && selectedUnit.value !== sensorConfig.value.unit) {
    displayValue = convertEcValue(convertedValue, selectedUnit.value)
  }

  return `${rawValue} ${sensorConfig.value.rawUnit} (${displayValue.toFixed(2)} ${unit})`
}

const formatTestReading = () => {
  if (!testReading.value) return 'No data'
  
  if (testReading.value.error) {
    return 'Error'
  }
  
  // Debug DHT22 data
  if (props.device.physicalType === 'temperature_humidity') {
    console.log('[DHT22 DEBUG] testReading.value:', JSON.stringify(testReading.value, null, 2))
  }
  
  // Special handling for temperature/humidity sensors
  if (props.device.physicalType === 'temperature_humidity') {
    // Check for dual-value sensors like DHT22 (with humidity data)
    const humidityData = testReading.value.rawResponse?.data?.humidity
    if (humidityData !== undefined) {
      const temp = testReading.value.value || 0
      const humidity = humidityData || 0
      return `${temp.toFixed(1)}°C / ${humidity.toFixed(1)}%`
    }
    // Single-value temperature sensors like DS18B20
    else {
      const temp = testReading.value.value || 0
      return `${temp.toFixed(1)}°C`
    }
  }
  
  let value = testReading.value.value || 0
  let unit = selectedUnit.value || sensorConfig.value.unit
  
  // Convert value if needed (for EC sensors)
  if (sensorConfig.value.supportedUnits && selectedUnit.value !== sensorConfig.value.unit) {
    value = convertEcValue(value, selectedUnit.value)
  }
  
  return `${value.toFixed(2)} ${unit}`
}

const formatRawValue = () => {
  if (!testReading.value) return '--'
  
  if (testReading.value.error) {
    return 'Error'
  }
  
  // Use rawValue first, then adc, then voltage for different sensor types
  let raw = testReading.value.rawValue || testReading.value.adc || 0

  // For ultrasonic sensors, use different property
  if (sensorType.value === 'ultrasonic') {
    raw = testReading.value.duration || raw
  }
  // For distance sensors (SEN0311), use rawValue as mm
  else if (sensorType.value === 'distance') {
    raw = testReading.value.rawValue || raw
  }
  // For light sensors (SEN0641), use rawValue
  else if (sensorType.value === 'light') {
    raw = testReading.value.rawValue || raw
  }
  // For soil moisture, prefer voltage
  else if (sensorType.value === 'soil_moisture') {
    raw = testReading.value.voltage || raw
  }

  return `${raw} ${sensorConfig.value.rawUnit}`
}

const getCorrectionMethodName = () => {
  const method = correctionMethod.value
  const option = correctionMethodOptions.find(opt => opt.value === method)
  return option?.label || 'No correction'
}

const formatPointLabel = (point: any): string => {
  const unit = displayUnit.value
  if (sensorConfig.value.physicsFormula) {
    // For physics-based sensors (ultrasonic, soil_moisture)
    return `Цел: ${point.targetValue} ${unit} → Физика: ${point.physicsValue?.toFixed(1) || 'N/A'} ${unit}`
  } else {
    // For calibration-based sensors (pH, EC, moisture, ultrasonic)
    // For EC sensors: always show target values in µS/cm (reference standard)  
    // For moisture sensors: always show target values in % (reference standard)
    // For ultrasonic sensors: always show target values in cm (reference standard)
    // Determine appropriate units based on sensor type and device
    let targetUnit: string
    let rawUnit: string
    
    if (sensorType.value === 'ec') {
      targetUnit = 'µS/cm'
      rawUnit = 'ADC'
    } else if (sensorType.value === 'moisture') {
      targetUnit = '%'
      rawUnit = 'ADC'
    } else if (sensorType.value === 'ultrasonic') {
      targetUnit = 'cm'
      rawUnit = 'µs'
    } else if (sensorType.value === 'distance') {
      targetUnit = 'cm'
      rawUnit = 'mm'
    } else if (sensorType.value === 'light') {
      targetUnit = 'µmol/m²·s'
      rawUnit = 'raw'
    } else if (sensorType.value === 'temperature_humidity') {
      // Check if this is a temperature-only sensor (DS18B20) or dual-value (DHT22)
      const isTemperatureOnly = props.device.type === 'DS18B20'
      targetUnit = isTemperatureOnly ? '°C' : '°C/%RH'
      rawUnit = 'µs'
    } else {
      targetUnit = unit
      rawUnit = 'ADC'
    }
    
    return `Цел: ${point.targetValue} ${targetUnit} → Измерено: ${point.measuredValue || 'N/A'} ${rawUnit}`
  }
}

// Unit conversion methods (for EC sensors)
const convertEcValue = (value: number, targetUnit: string): number => {
  switch (targetUnit.toLowerCase()) {
    case 'µs/cm':
    case 'us/cm':
      return value // Already in µS/cm
    
    case 'ms/cm':
      return value / 1000 // Convert µS/cm to mS/cm
    
    case 'ppm':
      // TDS conversion: ppm ≈ EC(µS/cm) * 0.5 (approximate for NaCl solutions)
      return Math.round(value * 0.5)
    
    default:
      return value
  }
}

const onUnitChange = (newUnit: string) => {
  selectedUnit.value = newUnit
  $q.notify({
    type: 'info',
    message: `Display unit changed to ${newUnit}`,
    timeout: 1500
  })
}

const testSensorReading = async () => {
  testing.value = true
  // Clear current reading at start of test
  currentReading.value = null
  try {
    const response = await fetch(`${API_BASE_URL}/devices/${props.device._id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testType: 'quick_reading' })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    if (data.success && data.data.result) {
      testReading.value = data.data.result
    } else {
      testReading.value = { error: data.error || data.message || 'Unknown error' }
    }
    lastTestTime.value = new Date().toLocaleTimeString()
    
    $q.notify({
      type: testReading.value.error ? 'negative' : 'positive',
      message: testReading.value.error ? 'Sensor test failed' : 'Sensor test successful',
      timeout: 2000
    })
  } catch (error) {
    console.error('Error testing sensor:', error)
    testReading.value = { error: error.message }
    $q.notify({
      type: 'negative',
      message: 'Failed to connect to sensor'
    })
  } finally {
    testing.value = false
  }
}

const refreshReading = async () => {
  refreshing.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/devices/${props.device._id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testType: 'quick_reading' })
    })
    
    if (!response.ok) {
      throw new Error('Failed to refresh reading')
    }
    
    const data = await response.json()
    if (data.success && data.data.result) {
      // Update current reading display with fresh data
      currentReading.value = data.data.result
      
      // Auto-populate measured value if not in manual mode
      if (!manualMode.value && sensorConfig.value.supportsManualInput) {
        newPoint.value.measuredValue = currentReading.value.rawValue || currentReading.value.adc || 0
      }
    }
  } catch (error) {
    console.error('Error refreshing reading:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh reading'
    })
  } finally {
    refreshing.value = false
  }
}

const addCalibrationPoint = async () => {
  if (!canAddPoint.value) return

  try {
    let measuredValue = newPoint.value.measuredValue
    
    console.log('[BaseSensorCalibration] Adding point - entryMode:', entryMode.value)
    console.log('[BaseSensorCalibration] Adding point - initial measuredValue:', measuredValue)
    
    // For live reading mode, use current sensor reading
    if (entryMode.value === 'live') {
      measuredValue = currentReading.value?.rawValue || currentReading.value?.adc || 0
      console.log('[BaseSensorCalibration] Live mode - currentReading:', currentReading.value)
      console.log('[BaseSensorCalibration] Live mode - final measuredValue:', measuredValue)
    }
    // For manual entry mode, use user input (already in measuredValue)

    const point = {
      id: Date.now().toString(),
      targetValue: Number(newPoint.value.targetValue!),
      measuredValue: Number(measuredValue),
      timestamp: new Date().toISOString(),
      ...(sensorConfig.value.physicsFormula && {
        physicsValue: currentReading.value?.value || 0
      })
    }

    calibrationPoints.value.push(point)
    
    // Auto-save to database
    await saveToDatabase()
    
    // Clear current reading and reset form
    currentReading.value = null
    newPoint.value = {
      targetValue: undefined,
      measuredValue: undefined
    }
    
    $q.notify({
      type: 'positive',
      message: 'Калибрационна точка добавена и запазена'
    })
  } catch (error) {
    console.error('Error adding calibration point:', error)
    $q.notify({
      type: 'negative',
      message: 'Неуспешно добавяне на калибрационна точка'
    })
  }
}

const removeCalibrationPoint = async (index: number) => {
  try {
    // Remove from local array
    const removedPoint = calibrationPoints.value.splice(index, 1)[0]
    
    // Immediately save to database
    await saveToDatabase()
    
    $q.notify({
      type: 'info',
      message: 'Калибрационна точка премахната'
    })
  } catch (error) {
    // Restore the point if save failed
    calibrationPoints.value.splice(index, 0, removedPoint)
    console.error('Error removing calibration point:', error)
    $q.notify({
      type: 'negative',
      message: 'Неуспешно премахване на калибрационна точка'
    })
  }
}


const saveToDatabase = async () => {
  try {
    const payload = {
      calibrationType: 'dynamic',
      points: calibrationPoints.value,
      method: correctionMethod.value,
      // Don't include referenceVoltage for digital sensors (they measure time/digital, not voltage)
      ...(!isDigitalSensor.value && { referenceVoltage: referenceVoltage.value })
    }
    
    console.log('Auto-saving calibration:', JSON.stringify(payload, null, 2))

    const response = await fetch(`${API_BASE_URL}/devices/${props.device._id}/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error('Failed to save calibration')
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to save calibration')
    }
  } catch (error: any) {
    console.error('Error auto-saving calibration:', error)
    throw error // Re-throw to handle in caller
  }
}

const loadExistingCalibration = async () => {
  console.log(`[BaseSensorCalibration] Loading existing calibration for ${props.device.name}:`, props.device.settings?.calibration)
  try {
    const calibrationData = props.device.settings?.calibration
    
    // Load referenceVoltage from DB
    if (calibrationData?.referenceVoltage) {
      referenceVoltage.value = calibrationData.referenceVoltage
      console.log(`Loaded referenceVoltage: ${calibrationData.referenceVoltage}V`)
    }
    
    // Load calibration points and convert to universal format
    if (calibrationData?.points) {
      const existingPoints = calibrationData.points.map((point: any) => {
        // Points are now stored in universal format
        return {
          id: point.id || Date.now().toString(),
          targetValue: point.targetValue ?? 0,
          measuredValue: point.measuredValue ?? 0,
          timestamp: point.timestamp || new Date().toISOString()
        }
      })
      
      calibrationPoints.value = existingPoints
      console.log(`Loaded ${existingPoints.length} existing calibration points for ${sensorConfig.value.physicalType} sensor`)
    }
  } catch (error) {
    console.error('Error loading calibration:', error)
  }
}

// Watchers
watch(manualMode, (newMode) => {
  if (!newMode && sensorConfig.value.supportsManualInput) {
    // Switch to automatic - use raw ADC value
    newPoint.value.measuredValue = currentReading.value?.rawValue || currentReading.value?.adc || 0
  } else if (newMode) {
    // Switch to manual - clear measured value for manual input
    newPoint.value.measuredValue = undefined
  }
})

// Auto-save voltage changes (skip for digital sensors)
watch(referenceVoltage, (newVoltage) => {
  // Don't save voltage for digital sensors (they measure time/digital, not voltage)
  if (isDigitalSensor.value) return
  
  // Use async function with proper error handling to avoid unhandled promises
  const saveVoltage = async () => {
    try {
      const payload = {
        calibrationType: 'dynamic',
        points: calibrationPoints.value,
        method: correctionMethod.value,
        referenceVoltage: newVoltage
      }
      
      const response = await fetch(`${API_BASE_URL}/devices/${props.device._id}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save voltage setting')
      }
      
      $q.notify({
        type: 'info',
        message: `Reference voltage updated to ${newVoltage}V`,
        timeout: 1500
      })
    } catch (error: any) {
      console.error('Error saving voltage setting:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to save voltage setting'
      })
    }
  }
  
  // Call async function and handle any unhandled promise rejection
  saveVoltage().catch(error => {
    console.error('[BaseSensorCalibration] Unhandled voltage save error:', error)
  })
})

// Lifecycle
onMounted(() => {
  // Initialize selected unit
  if (sensorConfig.value.supportedUnits) {
    selectedUnit.value = sensorConfig.value.defaultUnit || sensorConfig.value.unit
  }
  
  // Load existing calibration data including referenceVoltage (with error handling)
  loadExistingCalibration().catch(error => {
    console.error('[BaseSensorCalibration] Failed to load existing calibration:', error)
    // Don't show user notification for this as it's not critical
  })
})
</script>

<style scoped>
.calibration-container {
  max-width: 1200px;
  margin: 0 auto;
}

.current-reading {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 12px;
}

.full-height {
  height: 100%;
}

/* Fixed Height Calibration Points Container */
.calibration-points-container {
  min-height: 120px; /* Minimum space for empty state */
  max-height: 240px; /* Maximum height - about 4 points */
}

.scrollable-points-list {
  max-height: 200px;
  overflow-y: auto;
  border-radius: 4px;
}

.empty-state {
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* Scrollbar styling for webkit browsers */
.scrollable-points-list::-webkit-scrollbar {
  width: 4px;
}

.scrollable-points-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.scrollable-points-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

.scrollable-points-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* Smooth scrolling */
.scrollable-points-list {
  scroll-behavior: smooth;
}

/* Hover effect for list items */
.scrollable-points-list .q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

@media (max-width: 768px) {
  .row {
    flex-direction: column;
  }
  
  /* Slightly smaller on mobile */
  .calibration-points-container {
    max-height: 200px;
  }
  
  .scrollable-points-list {
    max-height: 160px;
  }
}
</style>