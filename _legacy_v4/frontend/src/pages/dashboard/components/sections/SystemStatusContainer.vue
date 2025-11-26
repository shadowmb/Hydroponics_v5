<template>
  <q-card 
    class="module-container"
    :class="moduleClass"
    flat
    bordered
  >
    <q-card-section class="q-pa-sm">
      <!-- Module Header -->
      <div class="module-header q-mb-xs">
        <div class="row items-center justify-between no-wrap">
          <div class="text-subtitle2 text-weight-medium text-grey-8 ellipsis">
            {{ getTotalDevicesCount() }}
          </div>
          <div class="module-actions">
            <q-btn
              v-if="showDragHandle"
              flat
              round
              dense
              icon="drag_handle"
              size="xs"
              class="text-grey-5 cursor-move"
            >
              <q-tooltip>Премести модул</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- System Status Content - Mini Cards Grid -->
      <div class="module-content system-status-content">
        <!-- Mini Cards Grid -->
        <div class="mini-cards-grid">
          <div
            v-for="device in getFilteredDevices()"
            :key="device.id"
            class="mini-card"
            :class="`status--${device.status}`"
          >
            <!-- Status Indicator -->
            <div class="status-indicator" :class="`indicator--${device.status}`"></div>

            <!-- Device Icon -->
            <div class="device-icon">
              <q-icon :name="device.icon" size="md" />
            </div>

            <!-- Device Name -->
            <div class="device-name text-caption">{{ device.name }}</div>

            <!-- Status Details on Hover -->
            <q-tooltip>
              <div>
                <strong>{{ device.name }}</strong><br>
                Type: {{ device.type }}<br>
                Status: {{ device.statusText }}<br>
                <span v-if="device.lastSeen">Last seen: {{ device.lastSeen }}</span>
              </div>
            </q-tooltip>
          </div>
        </div>

        <!-- No devices message -->
        <div v-if="getFilteredDevices().length === 0" class="no-devices text-center text-grey-6 q-mt-md">
          <q-icon name="devices" size="md" class="q-mb-xs" />
          <div class="text-caption">Няма избрани устройства</div>
          <div class="text-caption">Конфигурирай от настройките</div>
        </div>
      </div>
    </q-card-section>

    <!-- Module Status Indicator -->
    <div 
      class="module-status-indicator" 
      :class="`status--${getComputedStatus()}`"
    ></div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '../../../../stores/dashboard'

interface ModuleData {
  id: string
  name: string
  sectionId: string
  visualizationType?: string
  mockData?: {
    value?: number | string
    status?: 'normal' | 'warning' | 'error' | 'offline'
    label?: string
    online?: number
    offline?: number
    total?: number
    details?: Array<{name: string, status: string, lastSeen: string}>
    breakdown?: {
      sensors?: {online: number, total: number}
      actuators?: {online: number, total: number}
    }
    criticalDevice?: string
  }
  isVisible: boolean
  displayOrder: number
}

interface Props {
  module: ModuleData
  showDragHandle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDragHandle: false
})

const dashboardStore = useDashboardStore()

const moduleClass = computed(() => {
  return [
    `module--${props.module.sectionId}`,
    'module--system-status',
    {
      'module--hidden': !props.module.isVisible
    }
  ]
})

function getComputedStatus(): string {
  return props.module.mockData?.status || 'normal'
}

function getSystemIcon(): string {
  const status = getComputedStatus()
  switch (status) {
    case 'normal': return 'check_circle'
    case 'warning': return 'warning'
    case 'error': return 'error'
    case 'offline': return 'offline_bolt'
    default: return 'computer'
  }
}

function getSystemColor(): string {
  const status = getComputedStatus()
  switch (status) {
    case 'normal': return 'positive'
    case 'warning': return 'warning'
    case 'error': return 'negative'
    case 'offline': return 'grey-5'
    default: return 'primary'
  }
}

function getSystemValue(): string {
  return props.module.mockData?.label || 
         props.module.mockData?.value?.toString() || 
         'Система'
}

function getSystemStatus(): string {
  const status = getComputedStatus()
  switch (status) {
    case 'normal': return 'Работи нормално'
    case 'warning': return 'Внимание'
    case 'error': return 'Грешка'
    case 'offline': return 'Офлайн'
    default: return 'Неизвестно състояние'
  }
}

// New helper functions for detailed information
function hasDetails(): boolean {
  return isControllersModule() || isDevicesModule()
}

function isControllersModule(): boolean {
  return props.module.id === 'system-controllers'
}

function isDevicesModule(): boolean {
  return props.module.id === 'system-devices'
}

function getControllerDetails(): Array<{name: string, status: string, lastSeen: string}> {
  if (!isControllersModule() || !props.module.mockData?.details) {
    return []
  }
  return props.module.mockData.details.slice(0, 3) // Limit to 3 controllers
}

function getDeviceBreakdown(): {sensors?: {online: number, total: number}, actuators?: {online: number, total: number}} {
  if (!isDevicesModule() || !props.module.mockData?.breakdown) {
    return {}
  }
  return props.module.mockData.breakdown
}

function getCriticalDevice(): string | null {
  if (!isDevicesModule()) {
    return null
  }
  return props.module.mockData?.criticalDevice || null
}

// New functions for mini-cards grid - showing total counts from DB
function getTotalDevicesCount(): string {
  const allControllers = dashboardStore.availableControllers
  const allDevices = dashboardStore.availableDevices

  const totalControllers = allControllers.length
  const sensors = allDevices.filter(d => d.category === 'sensor')
  const actuators = allDevices.filter(d => d.category === 'actuator')
  const totalSensors = sensors.length
  const totalActuators = actuators.length
  const total = totalControllers + totalSensors + totalActuators

  return `${total} устройства (${totalControllers} контролера, ${totalSensors} сензори, ${totalActuators} актуатори)`
}

function getFilteredDevices(): Array<any> {
  const filteredData = dashboardStore.getFilteredSystemData()
  const devices = []

  // Add controllers
  for (const controller of filteredData.controllers) {
    devices.push({
      id: controller._id,
      name: controller.name,
      type: 'Controller',
      status: controller.status === 'online' ? 'online' : 'offline',
      statusText: controller.status === 'online' ? 'Online' : 'Offline',
      icon: 'computer',
      lastSeen: controller.lastHeartbeat ? formatHeartbeat(controller.lastHeartbeat) : null
    })
  }

  // Add devices
  for (const device of filteredData.devices) {
    // Determine device status based on both isActive and healthStatus
    let status = 'offline'
    let statusText = 'Inactive'

    if (device.isActive) {
      // Device is active, check health status
      switch (device.healthStatus) {
        case 'error':
          status = 'sick'
          statusText = 'Болен'
          break
        case 'warning':
          status = 'warning'
          statusText = 'Предупреждение'
          break
        case 'healthy':
          status = 'online'
          statusText = 'Здрав'
          break
        default:
          status = 'online'
          statusText = 'Активен'
      }
    } else {
      status = 'offline'
      statusText = 'Неактивен'
    }

    devices.push({
      id: device._id,
      name: device.name,
      type: device.type || 'Device',
      status: status,
      statusText: statusText,
      icon: device.icon || 'device_hub',
      lastSeen: device.lastReading ? 'Active' : null
    })
  }

  return devices.slice(0, dashboardStore.settings.system.displayLimit)
}


function formatHeartbeat(lastHeartbeat: string | Date | null): string {
  if (!lastHeartbeat) return 'никога'

  const now = new Date()
  const heartbeat = new Date(lastHeartbeat)
  const diffMs = now.getTime() - heartbeat.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 60) return `${diffSeconds}s`
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`
  return `${Math.floor(diffSeconds / 3600)}h`
}
</script>

<style lang="scss" scoped>
.module-container {
  position: relative;
  height: 100%;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  &--hidden {
    opacity: 0.5;
  }
}

.module-header {
  min-height: 20px;
}

.system-status-content {
  min-height: 120px;
  height: 100%;
  padding: 8px;
}

.system-header {
  text-align: center;
  margin-bottom: 12px;
}

.mini-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  width: 100%;
}

.mini-card {
  position: relative;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transform: translateY(-1px);
  }

  &.status--online {
    border-color: #4CAF50;
  }

  &.status--offline {
    border-color: #f44336;
    opacity: 0.7;
  }

  &.status--sick {
    border-color: #e91e63;
    background-color: #fce4ec;
  }

  &.status--warning {
    border-color: #ff9800;
    background-color: #fff3e0;
  }
}

.status-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.indicator--online {
    background: #4CAF50;
  }

  &.indicator--offline {
    background: #f44336;
  }

  &.indicator--sick {
    background: #e91e63;
  }

  &.indicator--warning {
    background: #ff9800;
  }
}

.device-icon {
  margin-bottom: 4px;

  .q-icon {
    color: #666;
  }
}

.device-name {
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-devices {
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.module-status-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.status--normal {
    background: #4CAF50;
  }

  &.status--warning {
    background: #FF9800;
  }

  &.status--error {
    background: #F44336;
  }

  &.status--offline {
    background: #9E9E9E;
  }
}

.module-actions {
  .q-btn {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
}

.module-container:hover .module-actions .q-btn {
  opacity: 1;
}
</style>