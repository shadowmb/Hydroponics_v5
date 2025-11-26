<template>
  <q-dialog 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card style="min-width: 900px; max-width: 1200px; max-height: 90vh" class="dashboard-settings">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Настройки на табло</div>
        <div class="text-subtitle2 text-grey-6 q-ml-sm">
          Конфигуриране на секции, модули и визуализации
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-separator />

      <!-- Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="sensors" icon="sensors" label="Сензори" />
        <q-tab name="system" icon="computer" label="Система" />
        <q-tab name="program" icon="play_circle" label="Програма" />
        <q-tab name="alerts" icon="notifications" label="Известия" />
        <q-tab name="design" icon="dashboard" label="Дизайн и единици" />
      </q-tabs>

      <q-separator />

      <!-- Tab Panels -->
      <q-card-section class="q-pa-none" style="flex: 1; overflow: hidden;">
        <q-tab-panels v-model="activeTab" animated style="height: 100%;">
          
          <!-- Sensors Tab -->
          <q-tab-panel name="sensors" class="q-pa-md">
            <SensorSettings 
              :model-value="localSettings"
              @module-updated="onModuleUpdated"
            />
          </q-tab-panel>

          <!-- System Tab -->
          <q-tab-panel name="system" class="q-pa-md">
            <SystemSettings 
              :model-value="localSettings"
              @update:model-value="localSettings = $event"
            />
          </q-tab-panel>

          <!-- Program Tab -->
          <q-tab-panel name="program" class="q-pa-md">
            <ProgramSettings 
              :model-value="localSettings"
              @update:model-value="localSettings = $event"
            />
          </q-tab-panel>

          <!-- Alerts Tab -->
          <q-tab-panel name="alerts" class="q-pa-md">
            <AlertSettings 
              :model-value="localSettings"
              @update:model-value="localSettings = $event"
            />
          </q-tab-panel>

          <!-- Design and Units Tab -->
          <q-tab-panel name="design" class="q-pa-md">
            <DesignSettings 
              :model-value="localSettings"
              @update:model-value="localSettings = $event"
            />
          </q-tab-panel>

        </q-tab-panels>
      </q-card-section>

      <q-separator />

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Отказ" @click="cancelChanges" />
        <q-btn flat label="Възстанови по подразбиране" @click="resetToDefaults" />
        <q-btn color="primary" label="Запази" @click="saveChanges" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDashboardStore, type DashboardSettings } from '../../stores/dashboard'
import { UnitConverter, type ECUnit, type TemperatureUnit, type LightUnit, type VolumeUnit } from '../../utils/unitConverter'

// Import child components
import SensorSettings from '../../components/dashboard/settings/SensorSettings.vue'
import SystemSettings from '../../components/dashboard/settings/SystemSettings.vue'
import ProgramSettings from '../../components/dashboard/settings/ProgramSettings.vue'
import AlertSettings from '../../components/dashboard/settings/AlertSettings.vue'
import DesignSettings from '../../components/dashboard/settings/DesignSettings.vue'

interface Props {
  modelValue: boolean
  initialTab?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'sensors'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'module-updated': [moduleId: string, updates: any]
  'settings-changed': [settings: DashboardSettings]
}>()

// Store and reactive state
const dashboardStore = useDashboardStore()
const activeTab = ref(props.initialTab)

// Local copy of settings for editing with units support
const localSettings = ref<DashboardSettings>({ 
  ...dashboardStore.settings,
  units: dashboardStore.settings.units || {
    ec: 'us-cm',
    temperature: 'celsius', 
    light: 'lux',
    volume: 'liters'
  }
})

// Methods
function closeDialog() {
  emit('update:modelValue', false)
}

function onModuleUpdated(moduleId: string, updates: any) {
  emit('module-updated', moduleId, updates)
}

async function saveChanges() {
  // Update general settings
  dashboardStore.updateSettings(localSettings.value)

  // Update alerts settings with database persistence
  await dashboardStore.updateAlertsSettings(localSettings.value.alerts)

  emit('settings-changed', localSettings.value)
  emit('update:modelValue', false)
}

function cancelChanges() {
  // Reset local settings to store values
  localSettings.value = { ...dashboardStore.settings }
  emit('update:modelValue', false)
}

function resetToDefaults() {
  // Reset to default settings
  localSettings.value = {
    sensors: {
      maxVisible: 8,
      showDataLabels: true,
      compactMode: false
    },
    system: {
      selectedDevices: {
        controllers: [],
        devices: []
      },
      displayLimit: 6
    },
    program: {
      showCurrentCycle: true,
      showTimeline: true,
      showParameters: false,
      showExecutionStats: true
    },
    alerts: {
      errorLevels: ['error', 'warning'],
      maxErrors: 5,
      showSystemMessages: true,
      showHardwareAlerts: true,
      showExecutionErrors: true
    },
    layout: {
      refreshInterval: 10,
      enableAnimations: true,
      compactMode: false,
      autoRefresh: true,
      layoutSettings: dashboardStore.getLayoutPreset('compact')
    },
    units: {
      ec: 'us-cm',
      temperature: 'celsius',
      light: 'lux',
      volume: 'liters'
    }
  }
}

// Watch for prop changes
watch(() => props.initialTab, (newTab) => {
  if (newTab) {
    activeTab.value = newTab
  }
})

// Watch for settings changes from store
watch(() => dashboardStore.settings, (newSettings) => {
  localSettings.value = { 
    ...newSettings,
    units: newSettings.units || {
      ec: 'us-cm',
      temperature: 'celsius',
      light: 'lux',
      volume: 'liters'
    }
  }
}, { deep: true })

// Watch for unit changes and convert all module values
watch(() => localSettings.value.units?.ec, (newECUnit, oldECUnit) => {
  console.log('EC unit watch triggered:', { oldECUnit, newECUnit })
  if (oldECUnit && newECUnit && oldECUnit !== newECUnit) {
    console.log('Converting EC units from', oldECUnit, 'to', newECUnit)
    convertAllModuleValues('ec', oldECUnit as ECUnit, newECUnit as ECUnit)
  } else {
    console.log('EC conversion skipped - same units or missing values')
  }
})

watch(() => localSettings.value.units?.temperature, (newTempUnit, oldTempUnit) => {
  if (oldTempUnit && newTempUnit && oldTempUnit !== newTempUnit) {
    convertAllModuleValues('temperature', oldTempUnit as TemperatureUnit, newTempUnit as TemperatureUnit)
  }
})

watch(() => localSettings.value.units?.light, (newLightUnit, oldLightUnit) => {
  if (oldLightUnit && newLightUnit && oldLightUnit !== newLightUnit) {
    convertAllModuleValues('light', oldLightUnit as LightUnit, newLightUnit as LightUnit)
  }
})

watch(() => localSettings.value.units?.volume, (newVolumeUnit, oldVolumeUnit) => {
  if (oldVolumeUnit && newVolumeUnit && oldVolumeUnit !== newVolumeUnit) {
    convertAllModuleValues('volume', oldVolumeUnit as VolumeUnit, newVolumeUnit as VolumeUnit)
  }
})

// Function to convert all module values when units change
function convertAllModuleValues(unitType: string, oldUnit: any, newUnit: any) {
  console.log(`Converting ${unitType} values from ${oldUnit} to ${newUnit}`)
  
  // Get all modules from store
  const allModules = dashboardStore.modules || []
  console.log('Found modules in store:', allModules.length)
  
  if (allModules.length > 0) {
    allModules.forEach((module, index) => {
      console.log(`Module ${index} (${module.name}):`, module)
      
      // Only convert modules that match the unit type
      const shouldConvert = shouldConvertModuleForUnitType(module, unitType)
      console.log(`Module ${module.name} should convert for ${unitType}:`, shouldConvert)
      
      if (shouldConvert) {
        // Convert module value
        if (module.sensorData?.value !== undefined) {
          const convertedValue = convertValueByType(module.sensorData.value, unitType, oldUnit, newUnit)
          if (convertedValue !== null) {
            const oldValue = module.sensorData.value
            module.sensorData.value = convertedValue
            console.log(`Module ${module.name}: ${oldValue} -> ${convertedValue}`)
          }
        }
        
        // Convert mockData value too (for testing)
        if (module.mockData?.value !== undefined) {
          const convertedValue = convertValueByType(module.mockData.value, unitType, oldUnit, newUnit)
          if (convertedValue !== null) {
            const oldValue = module.mockData.value
            module.mockData.value = convertedValue
            console.log(`Module ${module.name} mockData: ${oldValue} -> ${convertedValue}`)
          }
        }
      }
      
      // Convert ranges if they exist
      if (module.ranges?.optimal) {
        const convertedMin = convertValueByType(module.ranges.optimal.min, unitType, oldUnit, newUnit)
        const convertedMax = convertValueByType(module.ranges.optimal.max, unitType, oldUnit, newUnit)
        if (convertedMin !== null && convertedMax !== null) {
          console.log(`Module ${module.name} range: ${module.ranges.optimal.min}-${module.ranges.optimal.max} -> ${convertedMin}-${convertedMax}`)
          module.ranges.optimal.min = convertedMin
          module.ranges.optimal.max = convertedMax
        }
      }
      
      // Convert tolerances
      if (module.ranges?.warningTolerance !== undefined) {
        const convertedTolerance = convertValueByType(module.ranges.warningTolerance, unitType, oldUnit, newUnit)
        if (convertedTolerance !== null) {
          module.ranges.warningTolerance = convertedTolerance
        }
      }
      
      if (module.ranges?.criticalTolerance !== undefined) {
        const convertedTolerance = convertValueByType(module.ranges.criticalTolerance, unitType, oldUnit, newUnit)
        if (convertedTolerance !== null) {
          module.ranges.criticalTolerance = convertedTolerance
        }
      }
    })
  } else {
    console.log('No modules found in store')
  }
  
  // Update store with new settings (units change)
  dashboardStore.updateSettings(localSettings.value)
}

// Helper function to determine if module should be converted for given unit type
function shouldConvertModuleForUnitType(module: any, unitType: string): boolean {
  const moduleName = module.name.toLowerCase()
  
  switch (unitType) {
    case 'ec':
      return moduleName.includes('ec') || moduleName.includes('електропроводимост')
    case 'temperature':
      return moduleName.includes('температура') || moduleName.includes('temp')
    case 'light':
      return moduleName.includes('осветеност') || moduleName.includes('light') || moduleName.includes('lux')
    case 'volume':
      return moduleName.includes('обем') || moduleName.includes('ниво') || moduleName.includes('volume') || moduleName.includes('water')
    default:
      return false
  }
}

// Helper function to convert values by type
function convertValueByType(value: number, unitType: string, oldUnit: any, newUnit: any): number | null {
  try {
    switch (unitType) {
      case 'ec':
        return UnitConverter.convertEC(value, oldUnit, newUnit)
      case 'temperature':
        return UnitConverter.convertTemperature(value, oldUnit, newUnit)
      case 'light':
        return UnitConverter.convertLight(value, oldUnit, newUnit)
      case 'volume':
        return UnitConverter.convertVolume(value, oldUnit, newUnit)
      default:
        return null
    }
  } catch (error) {
    console.error(`Error converting ${unitType} value:`, error)
    return null
  }
}
</script>

<style lang="scss" scoped>
.dashboard-settings {
  display: flex;
  flex-direction: column;
}
</style>