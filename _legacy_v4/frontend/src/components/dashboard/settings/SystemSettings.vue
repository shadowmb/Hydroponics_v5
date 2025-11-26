<template>
  <div class="system-settings">
    <div class="text-h6 q-mb-md">Системна секция - Настройки</div>

    <div class="device-selection-container">
      <div class="text-subtitle1 q-mb-sm">Устройства за показване в Dashboard:</div>

      <!-- Device Type Radio Buttons -->
      <div class="q-mb-sm">
        <q-option-group
          v-model="selectedType"
          :options="deviceTypeOptions"
          color="primary"
          inline
        />
      </div>

      <!-- Device Selection Dropdown -->
      <div class="row q-gutter-sm q-mb-md items-end">
        <div class="col-8">
          <q-select
            v-model="selectedDevice"
            :options="availableDevicesList"
            outlined
            dense
            label="Избери устройство"
            option-label="name"
            option-value="_id"
            emit-value
            map-options
            :disable="!selectedType || availableDevicesList.length === 0"
          >
            <template v-slot:prepend>
              <q-icon :name="getTypeIcon(selectedType)" />
            </template>
          </q-select>
        </div>
        <div class="col">
          <q-btn
            @click="addDevice"
            color="primary"
            icon="add"
            label="Добави"
            :disable="!selectedDevice"
            dense
            style="height: 40px"
          />
        </div>
      </div>


      <!-- Selected Devices List -->
      <div class="selected-devices-section q-mt-md">
        <div class="row items-center q-mb-sm">
          <div class="text-subtitle2">Избрани устройства:</div>
          <q-space />
          <q-btn
            v-if="selectedDevicesDisplay.length > 0"
            @click="clearAllDevices"
            flat
            dense
            icon="delete"
            label="Изчисти всички"
            color="negative"
          />
        </div>

        <q-card flat bordered class="selected-devices-list">
          <div v-if="selectedDevicesDisplay.length === 0" class="q-pa-md text-grey-6 text-center">
            Няма избрани устройства
          </div>
          <div v-else>
            <div
              v-for="device in selectedDevicesDisplay"
              :key="device.id"
              class="device-item q-pa-sm"
            >
              <div class="row items-center no-wrap">
                <q-icon :name="device.icon" size="sm" class="q-mr-sm" />
                <div class="device-name ellipsis">{{ device.name }}</div>
                <q-space />
                <q-btn
                  @click="removeDevice(device.id, device.type)"
                  flat
                  dense
                  round
                  icon="close"
                  size="xs"
                  color="negative"
                />
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Display Limit Setting -->
      <div class="q-mt-md">
        <div class="text-subtitle2 q-mb-sm">Лимит за показване:</div>
        <q-select
          :model-value="localSettings.system.displayLimit"
          @update:model-value="updateDisplayLimit($event)"
          :options="[4, 6, 8, 10, 12,24,32]"
          outlined
          dense
          style="max-width: 120px"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DashboardSettings } from '../../../stores/dashboard'
import { useDashboardStore } from '../../../stores/dashboard'
import { API_BASE_URL } from '../../../config/ports'

// Props & Emits
const props = defineProps<{
  modelValue: DashboardSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardSettings]
}>()

const dashboardStore = useDashboardStore()

// Local state
const selectedType = ref('')
const selectedDevice = ref('')
const showDeviceList = ref(false)

// Device type options for radio buttons
const deviceTypeOptions = [
  { label: 'Контролери', value: 'controllers' },
  { label: 'Сензори', value: 'sensors' },
  { label: 'Устройства', value: 'actuators' }
]

// Computed local settings for two-way binding
const localSettings = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Available devices list based on selected radio button
const availableDevicesList = computed(() => {
  if (selectedType.value === 'controllers') {
    return dashboardStore.availableControllers.filter(c =>
      !localSettings.value.system.selectedDevices.controllers.includes(c._id)
    )
  } else if (selectedType.value === 'sensors') {
    return dashboardStore.availableDevices.filter(d =>
      d.category === 'sensor' && !localSettings.value.system.selectedDevices.devices.includes(d._id)
    )
  } else if (selectedType.value === 'actuators') {
    return dashboardStore.availableDevices.filter(d =>
      d.category === 'actuator' && !localSettings.value.system.selectedDevices.devices.includes(d._id)
    )
  }
  return []
})

// Display list of selected devices with icons
const selectedDevicesDisplay = computed(() => {
  const result = []

  // Add selected controllers
  for (const controllerId of localSettings.value.system.selectedDevices.controllers) {
    const controller = dashboardStore.availableControllers.find(c => c._id === controllerId)
    if (controller) {
      result.push({
        id: controllerId,
        name: controller.name,
        type: 'controller',
        icon: 'computer'
      })
    }
  }

  // Add selected devices
  for (const deviceId of localSettings.value.system.selectedDevices.devices) {
    const device = dashboardStore.availableDevices.find(d => d._id === deviceId)
    if (device) {
      result.push({
        id: deviceId,
        name: device.name,
        type: 'device',
        icon: device.icon || 'device_hub'
      })
    }
  }

  return result
})

// Methods
function getTypeIcon(type: string): string {
  switch (type) {
    case 'controllers': return 'computer'
    case 'sensors': return 'sensors'
    case 'actuators': return 'settings_input_component'
    default: return 'help_outline'
  }
}


async function addDevice() {
  if (!selectedDevice.value) return

  try {
    if (selectedType.value === 'controllers') {
      // Partial update for controllers
      const newControllers = [...localSettings.value.system.selectedDevices.controllers, selectedDevice.value]
      await updateSelectedControllers(newControllers)
    } else {
      // Partial update for devices
      const newDevices = [...localSettings.value.system.selectedDevices.devices, selectedDevice.value]
      await updateSelectedDevices(newDevices)
    }

    // Reset selection
    selectedDevice.value = ''
  } catch (error) {
    console.error('Failed to add device:', error)
  }
}

async function removeDevice(deviceId: string, deviceType: string) {
  try {
    if (deviceType === 'controller') {
      const newControllers = localSettings.value.system.selectedDevices.controllers.filter(id => id !== deviceId)
      await updateSelectedControllers(newControllers)
    } else {
      const newDevices = localSettings.value.system.selectedDevices.devices.filter(id => id !== deviceId)
      await updateSelectedDevices(newDevices)
    }
  } catch (error) {
    console.error('Failed to remove device:', error)
  }
}

async function clearAllDevices() {
  try {
    await Promise.all([
      updateSelectedControllers([]),
      updateSelectedDevices([])
    ])
  } catch (error) {
    console.error('Failed to clear devices:', error)
  }
}

async function updateDisplayLimit(newLimit: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/sections/system/display-limit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayLimit: newLimit })
    })

    if (response.ok) {
      const newSettings = { ...props.modelValue }
      newSettings.system.displayLimit = newLimit
      emit('update:modelValue', newSettings)
    }
  } catch (error) {
    console.error('Failed to update display limit:', error)
  }
}

// Partial update functions
async function updateSelectedControllers(controllers: string[]) {
  const response = await fetch(`${API_BASE_URL}/dashboard/sections/system/selected-controllers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ controllers })
  })

  if (response.ok) {
    const newSettings = { ...props.modelValue }
    newSettings.system.selectedDevices.controllers = controllers
    emit('update:modelValue', newSettings)
  } else {
    throw new Error('Failed to update controllers')
  }
}

async function updateSelectedDevices(devices: string[]) {
  const response = await fetch(`${API_BASE_URL}/dashboard/sections/system/selected-devices`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devices })
  })

  if (response.ok) {
    const newSettings = { ...props.modelValue }
    newSettings.system.selectedDevices.devices = devices
    emit('update:modelValue', newSettings)
  } else {
    throw new Error('Failed to update devices')
  }
}

// Load available devices on mount
onMounted(() => {
  dashboardStore.loadAvailableDevices()
})
</script>

<style lang="scss" scoped>
.system-settings {
  .device-selection-container {
    max-width: 600px;
  }

  .selected-devices-list {
    min-height: 120px;
    max-height: 300px;
    overflow-y: auto;
  }

  .device-item {
    border-bottom: 1px solid #e0e0e0;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f5f5f5;
    }
  }

  .device-name {
    max-width: 200px;
  }
}
</style>