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
            {{ module.name }}
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

      <!-- Program Status Content -->
      <div class="module-content program-status-content">
        <div class="text-center">
          <div class="row items-center justify-center q-gutter-xs q-mb-sm">
            <q-icon 
              :name="getProgramIcon()" 
              :color="getProgramColor()"
              size="md"
            />
            <div class="text-h6 text-weight-medium">
              {{ getProgramValue() }}
            </div>
          </div>
          
          <!-- Progress indicator -->
          <div v-if="getProgress() !== null" class="progress-section">
            <q-linear-progress
              :value="getProgress() / 100"
              :color="getProgramColor()"
              size="6px"
              rounded
              class="q-mb-xs"
            />
            <div class="text-caption text-grey-6">
              {{ getProgress() }}% завършено
            </div>
          </div>
          
          <div class="text-caption text-grey-6">
            {{ getProgramStatus() }}
          </div>

          <!-- Quick Controls -->
          <div v-if="showQuickControls()" class="quick-controls q-mt-sm">
            <q-btn
              v-if="getComputedStatus() === 'normal'"
              icon="pause"
              label="Пауза"
              color="warning"
              size="sm"
              outline
              :loading="isPausing"
              @click="pauseProgram"
            />
            <q-btn
              v-else-if="getComputedStatus() === 'warning'"
              icon="play_arrow"
              label="Продължи"
              color="positive"
              size="sm"
              outline
              :loading="isPausing"
              @click="resumeProgram"
            />
          </div>
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
import { computed, ref } from 'vue'
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
    progress?: number
    online?: number
    offline?: number
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

// Store
const dashboardStore = useDashboardStore()
const isPausing = ref(false)

const moduleClass = computed(() => {
  return [
    `module--${props.module.sectionId}`,
    'module--program-status',
    {
      'module--hidden': !props.module.isVisible
    }
  ]
})

function getComputedStatus(): string {
  return props.module.mockData?.status || 'normal'
}

function getProgramIcon(): string {
  const status = getComputedStatus()
  switch (status) {
    case 'normal': return 'play_circle'
    case 'warning': return 'pause_circle'
    case 'error': return 'stop_circle'
    case 'offline': return 'offline_bolt'
    default: return 'schedule'
  }
}

function getProgramColor(): string {
  const status = getComputedStatus()
  switch (status) {
    case 'normal': return 'positive'
    case 'warning': return 'warning'
    case 'error': return 'negative'
    case 'offline': return 'grey-5'
    default: return 'primary'
  }
}

function getProgramValue(): string {
  return props.module.mockData?.label || 
         props.module.mockData?.value?.toString() || 
         'Програма'
}

function getProgress(): number | null {
  if (typeof props.module.mockData?.progress === 'number') {
    return props.module.mockData.progress
  }
  if (typeof props.module.mockData?.value === 'number') {
    return props.module.mockData.value
  }
  return null
}

function getProgramStatus(): string {
  const status = getComputedStatus()
  switch (status) {
    case 'normal': return 'Изпълнява се'
    case 'warning': return 'На пауза'
    case 'error': return 'Спряна'
    case 'offline': return 'Офлайн'
    default: return 'Готова за стартиране'
  }
}

function showQuickControls(): boolean {
  const status = getComputedStatus()
  return status === 'normal' || status === 'warning'
}

async function pauseProgram() {
  isPausing.value = true
  try {
    const success = await dashboardStore.pauseProgramFromDashboard()
    if (!success) {
      console.error('Failed to pause program')
    }
  } catch (error) {
    console.error('Error pausing program:', error)
  } finally {
    isPausing.value = false
  }
}

async function resumeProgram() {
  isPausing.value = true
  try {
    // Resume logic can be added here if needed
    console.log('Resume program functionality not implemented yet')
  } catch (error) {
    console.error('Error resuming program:', error)
  } finally {
    isPausing.value = false
  }
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

.program-status-content {
  min-height: 60px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.progress-section {
  width: 100%;
  margin: 8px 0;
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