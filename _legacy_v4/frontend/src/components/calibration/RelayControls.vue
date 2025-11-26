<template>
  <q-card class="q-mt-md">
    <q-card-section>
      <div class="text-h6 q-mb-md">
        <q-icon :name="isPumpDevice ? 'water_pump' : 'electrical_services'" class="q-mr-sm" color="blue" />
        {{ isPumpDevice ? 'Помпа Тестване и Настройки' : 'Relay Тестване и Настройки' }}
      </div>

      <!-- Quick Test Section -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="bg-blue-1">
          <div class="text-subtitle2 q-mb-sm">
            <q-icon name="play_circle" class="q-mr-xs" />
            Ръчно тестване
          </div>
          
          <div class="row q-gutter-md items-center">
            <div class="col-auto">
              <div class="text-h4">
                <q-chip
                  :color="getStatusColor(currentState)"
                  :icon="getStatusIcon(currentState)"
                  text-color="white"
                  size="lg"
                  class="status-chip"
                >
                  {{ getStatusText(currentState) }}
                </q-chip>
              </div>
              <div class="text-caption text-grey-6">
                Port: {{ portName || '--' }} | Arduino State: {{ currentState || '--' }}
              </div>
              <div class="text-caption text-grey-6">
                Logic: {{ currentLogicText }}
              </div>
            </div>
            
            <div class="col-auto" v-if="isTimedTest">
              <q-circular-progress
                :value="timedTestProgress"
                size="60px"
                :thickness="0.2"
                color="orange"
                track-color="grey-3"
              >
                {{ timedTestCountdown }}s
              </q-circular-progress>
              <div class="text-caption text-center q-mt-xs">
                Auto Test Running
              </div>
            </div>
            
            <div class="col">
              <div class="q-gutter-sm">
                <q-btn
                  :loading="isTesting"
                  :disable="isTesting || isTimedTest"
                  :color="currentState === 'LOW' ? 'negative' : 'positive'"
                  :icon="currentState === 'LOW' ? 'power_off' : 'power'"
                  :label="currentState === 'LOW' ? 'Turn OFF' : 'Turn ON'"
                  @click="toggleRelay"
                />
                <q-btn
                  v-if="!isTimedTest"
                  color="orange"
                  icon="timer"
                  label="Timed Test"
                  @click="startTimedTest"
                  :disable="isTesting"
                />
                <q-btn
                  v-else
                  color="negative"
                  icon="stop"
                  label="Stop Test"
                  @click="stopTimedTest"
                />
              </div>
            </div>
          </div>

          <!-- Test History -->
          <div v-if="testHistory.length > 0" class="q-mt-sm">
            <div class="text-caption text-grey-6 q-mb-xs">
              Test History (last 5):
            </div>
            <div class="row q-gutter-xs">
              <q-chip
                v-for="(test, index) in testHistory.slice(0, 5)"
                :key="index"
                size="sm"
                :color="test.action === 'ON' ? 'positive' : 'negative'"
                text-color="white"
              >
                {{ test.action }} ({{ test.duration }}ms)
                <q-tooltip>{{ test.timestamp }}</q-tooltip>
              </q-chip>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Settings Section -->
      <q-card flat bordered>
        <q-card-section class="bg-green-1">
          <div class="text-subtitle2 q-mb-sm">
            <q-icon name="settings" class="q-mr-xs" />
            Relay Settings
          </div>

          <div class="row q-gutter-lg">
            <div class="col-md-3 col-sm-6 col-xs-12">
              <q-select
                v-model="settings.defaultState"
                :options="defaultStateOptions"
                label="Default ON State"
                emit-value
                map-options
                outlined
                dense
              />
              <div class="text-caption text-grey-6">
                Arduino state when relay is ON
              </div>
            </div>


            <div class="col-md-3 col-sm-6 col-xs-12">
              <q-input
                v-model.number="settings.safetyTimeout"
                label="Safety Timeout (seconds)"
                type="number"
                :min="1"
                :max="300"
                step="1"
                outlined
                dense
              />
              <div class="text-caption text-grey-6">
                Max time relay stays ON (1-300s)
              </div>
            </div>

            <div class="col-md-3 col-sm-6 col-xs-12">
              <q-input
                v-model.number="settings.timedTestDuration"
                label="Test Duration (seconds)"
                type="number"
                :min="1"
                :max="60"
                step="1"
                outlined
                dense
              />
              <div class="text-caption text-grey-6">
                Duration for timed tests (1-60s)
              </div>
            </div>

            <div class="col-md-3 col-sm-6 col-xs-12" v-if="isPumpDevice">
              <q-input
                v-model.number="settings.flowRate"
                label="Flow Rate (л/мин)"
                type="number"
                :min="0.1"
                :max="1000"
                step="0.1"
                outlined
                dense
              />
              <div class="text-caption text-grey-6">
                Pump flow rate for volume calculations
              </div>
            </div>
          </div>

          <!-- Volume Calculator for Pumps -->
          <div v-if="isPumpDevice && settings.flowRate > 0" class="q-mt-md">
            <q-separator />
            <div class="text-subtitle2 q-mt-md q-mb-sm">
              <q-icon name="calculate" class="q-mr-xs" />
              Volume Calculator
            </div>
            <div class="row q-gutter-md items-center">
              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-input
                  v-model.number="volumeCalculator.targetVolume"
                  label="Target Volume (л)"
                  type="number"
                  :min="0.1"
                  :max="1000"
                  step="0.1"
                  outlined
                  dense
                  @update:model-value="calculateRuntime"
                />
              </div>
              <div class="col-auto">
                <q-icon name="arrow_forward" size="md" class="text-grey-5" />
              </div>
              <div class="col-auto">
                <div class="text-h6 text-primary">
                  {{ volumeCalculator.calculatedTime }}
                </div>
                <div class="text-caption text-grey-6">
                  Runtime needed
                </div>
              </div>
            </div>
          </div>

          <!-- FlowRate Calculator for Pumps -->
          <div v-if="isPumpDevice" class="q-mt-md">
            <q-separator />
            <div class="text-subtitle2 q-mt-md q-mb-sm">
              <q-icon name="science" class="q-mr-xs" />
              FlowRate Calculator (от измерено количество)
            </div>
            <div class="row q-gutter-md items-center">
              <div class="col-md-3 col-sm-6 col-xs-12">
                <q-input
                  v-model.number="flowRateCalculator.measuredVolume"
                  label="Измерено количество (л)"
                  type="number"
                  :min="0.1"
                  :max="1000"
                  step="0.1"
                  outlined
                  dense
                  @update:model-value="calculateFlowRate"
                />
                <div class="text-caption text-grey-6">
                  Колко литра се получиха за {{ settings.timedTestDuration }}s
                </div>
              </div>
              <div class="col-auto">
                <q-icon name="arrow_forward" size="md" class="text-grey-5" />
              </div>
              <div class="col-auto">
                <div class="text-h6 text-secondary">
                  {{ flowRateCalculator.calculatedFlowRate }} л/мин
                </div>
                <div class="text-caption text-grey-6">
                  Calculated FlowRate
                </div>
              </div>
              <div class="col-auto">
                <q-btn
                  color="primary"
                  icon="save"
                  label="Използвай този FlowRate"
                  size="sm"
                  @click="useCalculatedFlowRate"
                  :disable="!flowRateCalculator.calculatedFlowRate || flowRateCalculator.calculatedFlowRate === '0.0'"
                />
              </div>
            </div>
          </div>

          <div class="q-mt-lg">
            <q-btn
              color="primary"
              icon="save"
              label="Save Settings"
              @click="saveSettings"
              :loading="isSavingSettings"
            />
            <q-btn
              flat
              color="grey"
              icon="refresh"
              label="Reset to Defaults"
              @click="resetToDefaults"
              class="q-ml-sm"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from '../../config/ports'

const $q = useQuasar()

const props = defineProps({
  device: {
    type: Object,
    required: true
  },
  template: {
    type: Object,
    required: true
  }
})

// Reactive data
const currentState = ref('HIGH')
const portName = ref('')
const isTesting = ref(false)
const isTimedTest = ref(false)
const timedTestInterval = ref(null)
const timedTestCountdown = ref(0)
const timedTestProgress = ref(0)
const testHistory = ref([])
const isSavingSettings = ref(false)

// Settings
const settings = ref({
  defaultState: 'LOW',
  safetyTimeout: 30,
  timedTestDuration: 5,
  flowRate: 10.0
})

// Volume Calculator (for pumps)
const volumeCalculator = ref({
  targetVolume: 1.0,
  calculatedTime: '0m 06s'
})

// FlowRate Calculator (for pumps)
const flowRateCalculator = ref({
  measuredVolume: 1.0,
  calculatedFlowRate: '0.0'
})

// Options
const defaultStateOptions = [
  { label: 'LOW (0V)', value: 'LOW' },
  { label: 'HIGH (5V)', value: 'HIGH' }
]


// Computed
const isPumpDevice = computed(() => {
  return props.device.type === 'water_pump' || 
         props.device.type === 'pump' || 
         props.device.name?.toLowerCase().includes('pump') ||
         props.device.name?.toLowerCase().includes('помпа')
})

const currentLogicText = computed(() => {
  return settings.value.defaultState === 'LOW' ? 'Inverted (LOW=ON)' : 'Normal (HIGH=ON)'
})

// Methods
const getStatusColor = (state) => {
  const isOn = (settings.value.defaultState === 'LOW' && state === 'LOW') ||
               (settings.value.defaultState === 'HIGH' && state === 'HIGH')
  return isOn ? 'positive' : 'negative'
}

const getStatusIcon = (state) => {
  const isOn = (settings.value.defaultState === 'LOW' && state === 'LOW') ||
               (settings.value.defaultState === 'HIGH' && state === 'HIGH')
  return isOn ? 'power' : 'power_off'
}

const getStatusText = (state) => {
  const isOn = (settings.value.defaultState === 'LOW' && state === 'LOW') ||
               (settings.value.defaultState === 'HIGH' && state === 'HIGH')
  
  if (isPumpDevice.value) {
    return isOn ? 'PUMPING' : 'IDLE'
  } else {
    return isOn ? 'ON' : 'OFF'
  }
}

const toggleRelay = async () => {
  const controllerId = props.device.controllerId?._id || props.device.controllerId
  if (!controllerId) return
  
  isTesting.value = true
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${API_BASE_URL}/controllers/${controllerId}/test-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        port: props.device.ports[0],
        testType: 'relay'
      })
    })
    
    const data = await response.json()
    if (data.success) {
      const newState = data.data?.current_state
      if (newState) {
        currentState.value = newState
      }
      
      const duration = Date.now() - startTime
      const action = getStatusText(newState)
      
      // Add to test history
      testHistory.value.unshift({
        action,
        duration,
        timestamp: new Date().toLocaleTimeString(),
        state: newState
      })
      
      $q.notify({
        type: 'positive',
        message: `Relay ${action} - State: ${newState}`,
        timeout: 2000
      })
    } else {
      throw new Error(data.message || 'Test failed')
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Relay test failed: ${error.message}`,
      timeout: 3000
    })
  } finally {
    isTesting.value = false
  }
}

const startTimedTest = async () => {
  isTimedTest.value = true
  timedTestCountdown.value = settings.value.timedTestDuration
  timedTestProgress.value = 100
  
  try {
    // Turn ON
    await toggleRelay()
    
    // Start countdown
    timedTestInterval.value = setInterval(() => {
      timedTestCountdown.value--
      timedTestProgress.value = (timedTestCountdown.value / settings.value.timedTestDuration) * 100
      
      if (timedTestCountdown.value <= 0) {
        stopTimedTest()
      }
    }, 1000)
  } catch (error) {
    stopTimedTest()
  }
}

const stopTimedTest = async () => {
  if (timedTestInterval.value) {
    clearInterval(timedTestInterval.value)
    timedTestInterval.value = null
  }
  
  isTimedTest.value = false
  timedTestCountdown.value = 0
  timedTestProgress.value = 0
  
  // Turn OFF - check if relay is currently ON based on defaultState logic
  const isCurrentlyOn = (settings.value.defaultState === 'LOW' && currentState.value === 'LOW') ||
                        (settings.value.defaultState === 'HIGH' && currentState.value === 'HIGH')
  
  if (isCurrentlyOn) {
    await toggleRelay()
  }
}

const saveSettings = async () => {
  isSavingSettings.value = true
  try {
    const deviceId = props.device._id
    const payload = {
      flowRate: settings.value.flowRate,
      defaultState: settings.value.defaultState,
      safetyTimeout: settings.value.safetyTimeout
    }
    
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/relay-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    
    if (data.success) {
      $q.notify({
        type: 'positive', 
        message: 'Relay settings saved successfully!',
        timeout: 2000
      })
      
      console.log('[RelayControls] Settings saved:', data.data)
    } else {
      throw new Error(data.error || 'Failed to save settings')
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Failed to save settings: ${error.message}`,
      timeout: 3000
    })
  } finally {
    isSavingSettings.value = false
  }
}

const calculateRuntime = () => {
  if (settings.value.flowRate > 0 && volumeCalculator.value.targetVolume > 0) {
    const timeInMinutes = volumeCalculator.value.targetVolume / settings.value.flowRate
    const minutes = Math.floor(timeInMinutes)
    const seconds = Math.floor((timeInMinutes - minutes) * 60)
    
    if (minutes > 0) {
      volumeCalculator.value.calculatedTime = `${minutes}m ${seconds.toString().padStart(2, '0')}s`
    } else {
      volumeCalculator.value.calculatedTime = `${Math.ceil(timeInMinutes * 60)}s`
    }
  } else {
    volumeCalculator.value.calculatedTime = '--'
  }
}

const calculateFlowRate = () => {
  if (flowRateCalculator.value.measuredVolume > 0 && settings.value.timedTestDuration > 0) {
    // Convert test duration from seconds to minutes
    const timeInMinutes = settings.value.timedTestDuration / 60
    const flowRate = flowRateCalculator.value.measuredVolume / timeInMinutes
    
    flowRateCalculator.value.calculatedFlowRate = flowRate.toFixed(1)
  } else {
    flowRateCalculator.value.calculatedFlowRate = '0.0'
  }
}

const useCalculatedFlowRate = () => {
  const calculatedRate = parseFloat(flowRateCalculator.value.calculatedFlowRate)
  if (calculatedRate > 0) {
    settings.value.flowRate = calculatedRate
    calculateRuntime() // Update the runtime calculator
    
    $q.notify({
      type: 'positive',
      message: `FlowRate обновен на ${calculatedRate} л/мин`,
      timeout: 2000
    })
  }
}

const resetToDefaults = () => {
  settings.value = {
    defaultState: 'LOW',
    safetyTimeout: 30,
    timedTestDuration: 5,
    flowRate: 10.0
  }
  calculateRuntime()
}

// Lifecycle
onMounted(() => {
  // Get port name from device
  if (props.device.ports && props.device.ports.length > 0) {
    portName.value = props.device.ports[0]
  }
  
  // Load existing settings from device properties
  if (props.device.flowRate !== undefined) {
    settings.value.flowRate = props.device.flowRate
  }
  if (props.device.relayLogic) {
    // Map relayLogic to defaultState
    settings.value.defaultState = props.device.relayLogic === 'active_low' ? 'LOW' : 'HIGH'
  }
  if (props.device.safetyTimeout !== undefined) {
    settings.value.safetyTimeout = props.device.safetyTimeout
  }
  
  // Initialize calculators
  calculateRuntime()
  calculateFlowRate()
})

// Watchers
watch(() => settings.value.timedTestDuration, () => {
  calculateFlowRate()  // Recalculate flow rate when test duration changes
})

onUnmounted(() => {
  if (timedTestInterval.value) {
    clearInterval(timedTestInterval.value)
  }
})
</script>

<style scoped>
.status-chip {
  font-weight: 500;
  transition: all 0.2s ease;
}

.status-chip:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
</style>