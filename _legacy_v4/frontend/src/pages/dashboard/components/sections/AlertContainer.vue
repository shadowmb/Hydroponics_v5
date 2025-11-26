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
          <div class="column">
            <div class="text-subtitle2 text-weight-medium text-grey-8 ellipsis">
              Предупреждения и съобщения
            </div>
            <div class="text-caption text-grey-6">
              Системни грешки и известия
            </div>
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
            <q-btn
              flat
              round
              dense
              icon="refresh"
              size="xs"
              class="text-grey-5"
              @click="refreshAlerts"
              :loading="isLoading"
            >
              <q-tooltip>Обнови системни алерти</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Alert Summary -->
      <div class="alert-summary q-mb-sm">
        <div class="text-caption text-grey-6">
          {{ getAlertSummary() }}
        </div>
      </div>

      <!-- Single Expandable Alerts List -->
      <div class="module-content alert-content">
        <div v-if="alerts.length === 0" class="text-center text-grey-5 q-py-md">
          <q-icon name="check_circle" size="sm" class="q-mb-xs" />
          <div class="text-body2">Няма активни предупреждения</div>
          <div class="text-caption">Всички системи работят нормално</div>
        </div>

        <q-list v-else dense separator class="alerts-list">
          <q-expansion-item
            v-for="alert in alerts"
            :key="alert.id"
            :icon="getAlertIcon(alert)"
            :header-style="getAlertHeaderStyle(alert)"
            class="alert-item"
            dense
            switch-toggle-side
          >
            <!-- Alert Header -->
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon
                  :name="getAlertIcon(alert)"
                  :color="getAlertColor(alert)"
                  size="sm"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium text-body2">
                  {{ alert.title }}
                </q-item-label>
                <q-item-label caption lines="1" class="text-grey-7">
                  {{ alert.message }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="column items-end">
                  <q-badge
                    :color="getAlertColor(alert)"
                    :label="getSeverityLabel(alert.severity)"
                    rounded
                    class="q-mb-xs"
                  />
                  <div class="text-caption text-grey-6">
                    {{ formatRelativeTime(alert.timestamp) }}
                  </div>
                </div>
              </q-item-section>
            </template>

            <!-- Alert Details (Expandable) -->
            <q-card flat class="alert-details">
              <q-card-section class="q-pt-none">
                <div class="q-gutter-sm">
                  <!-- Device Information -->
                  <div v-if="alert.deviceName" class="row">
                    <div class="col-4 text-grey-6">Устройство:</div>
                    <div class="col-8 text-weight-medium">{{ alert.deviceName }}</div>
                  </div>

                  <div v-if="alert.deviceId" class="row">
                    <div class="col-4 text-grey-6">Device ID:</div>
                    <div class="col-8">{{ alert.deviceId }}</div>
                  </div>

                  <!-- Execution-specific fields -->
                  <template v-if="alert.type === 'execution'">
                    <div v-if="alert.metadata?.blockId" class="row">
                      <div class="col-4 text-grey-6">Блок ID:</div>
                      <div class="col-8 text-weight-medium">{{ alert.metadata.blockId }}</div>
                    </div>

                    <div v-if="alert.metadata?.blockType" class="row">
                      <div class="col-4 text-grey-6">Тип блок:</div>
                      <div class="col-8">{{ getBlockTypeLabel(alert.metadata.blockType) }}</div>
                    </div>

                    <div v-if="alert.metadata?.programId" class="row">
                      <div class="col-4 text-grey-6">Програма:</div>
                      <div class="col-8">{{ alert.metadata.programId }}</div>
                    </div>
                  </template>

                  <!-- Sensor-specific fields -->
                  <template v-if="alert.type === 'sensor'">
                    <div v-if="alert.metadata?.value !== undefined" class="row">
                      <div class="col-4 text-grey-6">Стойност:</div>
                      <div class="col-8">
                        {{ alert.metadata.value }}°C
                        <span v-if="alert.metadata.expectedRange" class="text-grey-6">
                          (норма: {{ alert.metadata.expectedRange[0] }}°C - {{ alert.metadata.expectedRange[1] }}°C)
                        </span>
                      </div>
                    </div>
                  </template>

                  <!-- Hardware-specific fields -->
                  <template v-if="alert.type === 'hardware'">
                    <div v-if="alert.metadata?.responseTime !== undefined" class="row">
                      <div class="col-4 text-grey-6">Отговор:</div>
                      <div class="col-8">
                        {{ alert.metadata.responseTime }}ms
                        <span v-if="alert.metadata.responseTime > 3000" class="text-negative">
                          (твърде бавно)
                        </span>
                      </div>
                    </div>
                  </template>

                  <!-- System-specific fields -->
                  <template v-if="alert.type === 'system'">
                    <div v-if="alert.metadata?.value !== undefined" class="row">
                      <div class="col-4 text-grey-6">Използване:</div>
                      <div class="col-8">{{ alert.metadata.value }}%</div>
                    </div>
                  </template>

                  <!-- Common fields -->
                  <div class="row">
                    <div class="col-4 text-grey-6">Време:</div>
                    <div class="col-8">{{ formatFullTimestamp(alert.timestamp) }}</div>
                  </div>

                  <div v-if="alert.duration" class="row">
                    <div class="col-4 text-grey-6">Продължителност:</div>
                    <div class="col-8">{{ alert.duration }}</div>
                  </div>

                  <div class="row">
                    <div class="col-4 text-grey-6">Модул:</div>
                    <div class="col-8">{{ alert.metadata?.module || 'System' }}</div>
                  </div>

                  <div class="row">
                    <div class="col-4 text-grey-6">Категория:</div>
                    <div class="col-8">{{ getAlertTypeLabel(alert.type) }}</div>
                  </div>

                  <!-- Actions -->
                  <div class="row q-mt-sm">
                    <q-btn
                      flat
                      dense
                      color="primary"
                      size="sm"
                      label="Маркирай като прочетено"
                      @click="markAsRead(alert)"
                      class="q-mr-sm"
                    />
                    <q-btn
                      flat
                      dense
                      color="negative"
                      size="sm"
                      label="Изтрий"
                      @click="dismissAlert(alert)"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>
    </q-card-section>

    <!-- Module Status Indicator -->
    <div
      class="module-status-indicator"
      :class="`status--${getOverallStatus()}`"
    ></div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '../../../../stores/dashboard'
import { alertService } from '../../../../services/alertService'
import type { DashboardAlert } from '../../../../types/alerts'

interface ModuleData {
  id: string
  name: string
  sectionId: string
  visualizationType?: string
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

// State
const dashboardStore = useDashboardStore()
const alerts = ref<DashboardAlert[]>([])
const isLoading = ref(false)
let refreshInterval: number | null = null

// Computed
const moduleClass = computed(() => {
  return [
    `module--${props.module.sectionId}`,
    'module--alert',
    {
      'module--hidden': !props.module.isVisible
    }
  ]
})

const alertSettings = computed(() => dashboardStore.settings.alerts)

// Methods
async function refreshAlerts() {
  isLoading.value = true
  try {
    console.log('🔄 [AlertContainer] Loading real alerts from ULS...')

    // Use real alertService to fetch data from UnifiedLoggingService
    const realAlerts = await alertService.fetchAlerts(alertSettings.value)

    alerts.value = realAlerts
    console.log(`📊 [AlertContainer] Loaded ${realAlerts.length} real alerts from ULS`)

    // If no real alerts, show a minimal test alert to verify UI
    if (realAlerts.length === 0) {
      console.log('ℹ️ [AlertContainer] No real alerts found, showing test data')
      alerts.value = [
        {
          id: 'test-ui-001',
          type: 'system',
          severity: 'info',
          status: 'new',
          title: 'Тест на UI',
          message: 'Няма реални alerts в момента - това е тестов alert',
          timestamp: new Date().toISOString(),
          metadata: {
            module: 'AlertContainer'
          }
        }
      ]
    }

  } catch (error) {
    console.error('❌ [AlertContainer] Failed to load real alerts:', error)
    alerts.value = []
  } finally {
    isLoading.value = false
  }
}

function getAlertIcon(alert: DashboardAlert): string {
  const iconMap = {
    execution: 'play_circle_outline',
    sensor: 'sensors',
    hardware: 'hardware',
    system: 'memory'
  }
  return iconMap[alert.type] || 'notifications'
}

function getAlertColor(alert: DashboardAlert): string {
  const colorMap = {
    critical: 'negative',
    warning: 'warning',
    info: 'info'
  }
  return colorMap[alert.severity] || 'primary'
}

function getAlertHeaderStyle(alert: DashboardAlert) {
  const colorMap = {
    critical: 'border-left: 3px solid #F44336;',
    warning: 'border-left: 3px solid #FF9800;',
    info: 'border-left: 3px solid #2196F3;'
  }
  return colorMap[alert.severity] || ''
}

function getSeverityLabel(severity: DashboardAlert['severity']): string {
  const labelMap = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵'
  }
  return labelMap[severity] || '⚪'
}

function getAlertTypeLabel(type: DashboardAlert['type']): string {
  const typeMap = {
    execution: '🔄 Изпълнение на програми',
    sensor: '🌡️ Валидация на сензори',
    hardware: '🔌 Хардуерни проблеми',
    system: '⚡ Системна производителност'
  }
  return typeMap[type] || 'Неизвестен тип'
}

function getBlockTypeLabel(blockType: string): string {
  const typeMap: Record<string, string> = {
    'sensor': '🌡️ Сензор',
    'actuator': '⚡ Актуатор',
    'logic': '🧠 Логика',
    'delay': '⏱️ Забавяне',
    'condition': '🔀 Условие'
  }
  return typeMap[blockType] || `📦 ${blockType}`
}

function getOverallStatus(): string {
  if (alerts.value.length === 0) return 'normal'

  const hasCritical = alerts.value.some(a => a.severity === 'critical')
  const hasWarning = alerts.value.some(a => a.severity === 'warning')

  if (hasCritical) return 'error'
  if (hasWarning) return 'warning'
  return 'normal'
}

function getAlertSummary(): string {
  if (alerts.value.length === 0) return 'Няма активни предупреждения'

  const criticalCount = alerts.value.filter(a => a.severity === 'critical').length
  const warningCount = alerts.value.filter(a => a.severity === 'warning').length
  const infoCount = alerts.value.filter(a => a.severity === 'info').length

  const parts = []
  if (criticalCount > 0) parts.push(`${criticalCount} критични`)
  if (warningCount > 0) parts.push(`${warningCount} предупреждения`)
  if (infoCount > 0) parts.push(`${infoCount} информативни`)

  return parts.join(', ')
}

function formatRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Неизвестно време'
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)

    if (diffMinutes < 1) return 'Сега'
    if (diffMinutes < 60) return `${diffMinutes} мин`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} ч`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} дни`
  } catch (error) {
    return 'Неизвестно време'
  }
}

function formatFullTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Неизвестно време'
    }
    return date.toLocaleString('bg-BG')
  } catch (error) {
    return 'Неизвестно време'
  }
}

function markAsRead(alert: DashboardAlert) {
  // TODO: Implement mark as read functionality with backend
  console.log('Marking alert as read:', alert.id)
  alert.status = 'acknowledged'
}

function dismissAlert(alert: DashboardAlert) {
  // TODO: Implement dismiss functionality with backend
  console.log('Dismissing alert:', alert.id)
  const index = alerts.value.findIndex(a => a.id === alert.id)
  if (index > -1) {
    alerts.value.splice(index, 1)
  }
}

// Lifecycle
onMounted(async () => {
  // Load alerts settings from database first
  await dashboardStore.loadAlertsSettingsFromDB()

  await refreshAlerts()

  // Set up 30-second refresh interval
  refreshInterval = window.setInterval(refreshAlerts, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
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

.alert-summary {
  font-size: 11px;
  text-align: center;
}

.alert-content {
  min-height: 120px;
  height: 100%;
  overflow-y: auto;
  max-height: 300px;
}

.alerts-list {
  .alert-item {
    border-radius: 4px;
    margin-bottom: 2px;

    &:hover {
      background-color: rgba(0,0,0,0.02);
    }
  }
}

.alert-details {
  background-color: rgba(0,0,0,0.02);
  margin: 0 -16px;

  .row {
    margin-bottom: 4px;
  }
}

.module-status-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.status--normal {
    background: #2196F3;
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

:deep(.q-expansion-item__toggle) {
  order: -1;
}

:deep(.q-item) {
  min-height: 40px;
}
</style>