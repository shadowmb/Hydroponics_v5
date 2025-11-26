<template>
  <div class="alert-settings">
    <div class="text-h6 q-mb-md">Настройки за известия и предупреждения</div>

    <div class="row q-gutter-lg">
      <!-- Alert Types -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">📢 Типове съобщения</div>
            <q-checkbox
              :model-value="localSettings.alerts.showExecutionErrors"
              @update:model-value="updateShowExecutionErrors"
              label="🔄 Грешки при изпълнение на програми"
              class="q-mb-sm"
            />
            <q-checkbox
              :model-value="localSettings.alerts.showSensorAlerts"
              @update:model-value="updateShowSensorAlerts"
              label="🌡️ Валидация на сензори"
              class="q-mb-sm"
            />
            <q-checkbox
              :model-value="localSettings.alerts.showHardwareIssues"
              @update:model-value="updateShowHardwareIssues"
              label="🔌 Хардуерни проблеми"
              class="q-mb-sm"
            />
            <q-checkbox
              :model-value="localSettings.alerts.showSystemAlerts"
              @update:model-value="updateShowSystemAlerts"
              label="⚡ Системна производителност"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Severity & Display -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">🎯 Филтри и показване</div>

            <!-- Severity Filter -->
            <q-option-group
              :model-value="localSettings.alerts.severityFilter"
              @update:model-value="updateSeverityFilter"
              :options="severityOptions"
              color="primary"
              class="q-mb-md"
            />

            <!-- Display Count -->
            <q-input
              :model-value="localSettings.alerts.maxDisplayCount"
              @blur="updateMaxDisplayCount(Number($event.target.value))"
              type="number"
              min="3"
              max="50"
              label="Максимален брой съобщения"
              class="q-mb-md"
            />

            <!-- Time Window -->
            <q-select
              :model-value="localSettings.alerts.timeWindow"
              @update:model-value="updateTimeWindow"
              :options="timeWindowOptions"
              label="Времеви прозорец"
              emit-value
              map-options
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore, type DashboardSettings } from '../../../stores/dashboard'

// Props & Emits
const props = defineProps<{
  modelValue: DashboardSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardSettings]
}>()

// Dashboard store for partial updates
const dashboardStore = useDashboardStore()

// Computed local settings for two-way binding
const localSettings = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Options
const severityOptions = [
  { label: 'Всички съобщения', value: 'all' },
  { label: 'Критични и предупреждения', value: 'critical' },
  { label: 'Само критични', value: 'warning' }
]

const timeWindowOptions = [
  { label: 'Последните 1 час', value: '1h' },
  { label: 'Последните 6 часа', value: '6h' },
  { label: 'Последните 24 часа', value: '24h' },
  { label: 'Последните 7 дни', value: '7d' }
]

// Partial update methods following Newtasks.md pattern
async function updateShowExecutionErrors(value: boolean) {
  const success = await dashboardStore.updateShowExecutionErrors(value)
  if (success) {
    const newSettings = { ...props.modelValue }
    newSettings.alerts = { ...newSettings.alerts, showExecutionErrors: value }
    emit('update:modelValue', newSettings)
  }
}

async function updateShowSensorAlerts(value: boolean) {
  const success = await dashboardStore.updateShowSensorAlerts(value)
  if (success) {
    const newSettings = { ...props.modelValue }
    newSettings.alerts = { ...newSettings.alerts, showSensorAlerts: value }
    emit('update:modelValue', newSettings)
  }
}

async function updateShowHardwareIssues(value: boolean) {
  const success = await dashboardStore.updateShowHardwareIssues(value)
  if (success) {
    const newSettings = { ...props.modelValue }
    newSettings.alerts = { ...newSettings.alerts, showHardwareIssues: value }
    emit('update:modelValue', newSettings)
  }
}

async function updateShowSystemAlerts(value: boolean) {
  const success = await dashboardStore.updateShowSystemAlerts(value)
  if (success) {
    const newSettings = { ...props.modelValue }
    newSettings.alerts = { ...newSettings.alerts, showSystemAlerts: value }
    emit('update:modelValue', newSettings)
  }
}

async function updateSeverityFilter(value: string) {
  const success = await dashboardStore.updateSeverityFilter(value)
  if (success) {
    const newSettings = { ...props.modelValue }
    newSettings.alerts = { ...newSettings.alerts, severityFilter: value }
    emit('update:modelValue', newSettings)
  }
}

async function updateMaxDisplayCount(value: number) {
  const success = await dashboardStore.updateMaxDisplayCount(value)
  if (success) {
    const newSettings = { ...props.modelValue }
    newSettings.alerts = { ...newSettings.alerts, maxDisplayCount: value }
    emit('update:modelValue', newSettings)
  }
}

async function updateTimeWindow(value: string) {
  const success = await dashboardStore.updateTimeWindow(value)
  if (success) {
    const newSettings = { ...props.modelValue }
    newSettings.alerts = { ...newSettings.alerts, timeWindow: value }
    emit('update:modelValue', newSettings)
  }
}
</script>

<style lang="scss" scoped>
.alert-settings {
  .q-card {
    min-height: 250px;
  }
}
</style>