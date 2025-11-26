<template>
  <q-card
    class="program-dashboard-container"
    flat
    bordered
  >
    <q-card-section class="q-pa-md">
      <!-- Program Overview Section -->
      <div class="program-overview q-mb-md">
        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="text-h6 text-weight-medium text-grey-8">
            {{ programName }}
          </div>
          <div class="program-actions">
            <q-btn
              v-if="canPause"
              icon="pause"
              label="Пауза"
              color="warning"
              size="sm"
              outline
              :loading="isPausing"
              @click="pauseProgram"
            />
            <q-btn
              v-if="canResume"
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

        <div class="program-meta row items-center q-gutter-md">
          <div class="program-status">
            <q-icon
              :name="getStatusIcon()"
              :color="getStatusColor()"
              size="sm"
            />
            <span class="q-ml-xs">{{ getStatusText() }}</span>
          </div>
          <div class="program-executions text-grey-6">
            Изпълнения: {{ totalExecutions }}
          </div>
          <div v-if="hasError" class="program-warning text-warning">
            <q-icon name="warning" size="sm" />
            <span class="q-ml-xs">Hardware предупреждение</span>
            <q-tooltip>{{ errorMessage }}</q-tooltip>
          </div>
        </div>
      </div>

      <!-- Cycles Overview Section -->
      <div class="cycles-overview q-mb-md">
        <div class="text-subtitle2 text-weight-medium text-grey-8 q-mb-sm">
          Цикли днес ({{ completedToday }}/{{ totalCycles }})
        </div>

        <div v-if="hasCycles" class="cycles-list">
          <div
            v-for="cycle in cycles"
            :key="cycle.cycleId"
            class="cycle-card"
            :class="getCycleClasses(cycle)"
          >
            <!-- Cycle Header -->
            <div class="cycle-header" @click="toggleCycleExpansion(cycle.cycleId)">
              <div class="cycle-time-status">
                <q-icon
                  :name="getCycleIcon(cycle.status)"
                  :color="getCycleColor(cycle.status)"
                  size="sm"
                  class="q-mr-xs"
                />
                <span class="cycle-time">{{ formatCycleTime(cycle) }}</span>
                <q-icon
                  :name="cycle.status === 'completed' ? 'check_circle' : cycle.status === 'running' ? 'pause' : 'radio_button_unchecked'"
                  :color="getCycleColor(cycle.status)"
                  size="sm"
                  class="q-ml-xs"
                />
                <span class="cycle-id q-ml-sm">{{ cycle.cycleId }}</span>
                <span class="cycle-status-text q-ml-sm">({{ getCycleDisplayStatus(cycle) }})</span>
                <span v-if="getCycleDurationDisplay(cycle)" class="cycle-duration-text q-ml-sm">({{ getCycleDurationDisplay(cycle) }})</span>
              </div>
              <div class="cycle-expand-icon">
                <q-icon
                  :name="isCycleExpanded(cycle.cycleId) ? 'expand_less' : 'expand_more'"
                  size="sm"
                  color="grey-6"
                />
              </div>
            </div>

            <!-- Cycle Details (Collapsible) -->
            <q-slide-transition>
              <div v-show="isCycleExpanded(cycle.cycleId)" class="cycle-details">
                <div class="action-templates-section q-mt-sm">
                  <div class="text-caption text-grey-7 q-mb-xs">
                    📋 ActionTemplates:
                  </div>
                  <div v-if="getFlowsForCycle(cycle).length > 0" class="action-templates-list">
                    <!-- Flow names as ActionTemplates -->
                    <div
                      v-for="actionTemplate in getFlowsForCycle(cycle)"
                      :key="actionTemplate.actionTemplateId"
                      class="action-template-item"
                    >
                      <q-icon name="science" size="xs" color="primary" class="q-mr-xs" />
                      <span>
                        {{ actionTemplate.actionTemplateName }}
                        <span v-if="actionTemplate.status === 'running'" class="text-caption text-grey-6">
                          {{ getCurrentBlockInfo() }}
                        </span>
                        <span v-else-if="actionTemplate.status === 'completed' && actionTemplate.duration" class="text-caption text-grey-6">
                          ({{ Math.round(actionTemplate.duration) }}s)
                        </span>
                      </span>
                      <q-icon
                        :name="actionTemplate.status === 'completed' ? 'check_circle' : actionTemplate.status === 'running' ? 'sync' : 'radio_button_unchecked'"
                        :color="actionTemplate.status === 'completed' ? 'positive' : actionTemplate.status === 'running' ? 'orange' : 'grey-4'"
                        size="xs"
                        class="q-ml-auto"
                      />
                    </div>
                  </div>
                  <div v-else class="text-caption text-grey-6">
                    Няма ActionTemplates
                  </div>

                  <!-- Duration Info -->
                  <div v-if="formatCycleDuration(cycle)" class="cycle-duration q-mt-xs">
                    <q-icon name="schedule" size="xs" color="grey-6" class="q-mr-xs" />
                    <span class="text-caption text-grey-6">{{ formatCycleDuration(cycle) }}</span>
                  </div>
                </div>
              </div>
            </q-slide-transition>
          </div>
        </div>

        <div v-else class="text-grey-6 text-center q-py-md">
          Няма планирани цикли за днес
        </div>
      </div>

    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '../../../../stores/dashboard'
import { useWebSocketStore } from '../../../../stores/websocket'
import { useBlockExecutionInfo } from '../../../../composables/useBlockExecutionInfo'

const dashboardStore = useDashboardStore()
const isPausing = ref(false)

// Cycles expanded state for collapsible interface
const cyclesExpanded = ref({})

// Global WebSocket execution monitoring
const webSocketStore = useWebSocketStore()
const {
  actionHistory,
  isLoadingInitial,
  wsConnected,
  wsReconnecting,
  connectionStatus
} = webSocketStore

// Block execution info composable
const actionTemplates = computed(() => []) // TODO: Add actionTemplates store
const { formatBlockDuration, getBlockDetails } = useBlockExecutionInfo({
  actionTemplates,
  wsStore: webSocketStore
})

// Computed properties based on program data
const programData = computed(() => dashboardStore.programData)

const programName = computed(() =>
  programData.value?.programOverview.name || 'Няма активна програма'
)

const totalExecutions = computed(() =>
  programData.value?.programOverview.totalExecutions || 0
)

const hasError = computed(() =>
  programData.value?.programOverview.hasError || false
)

const errorMessage = computed(() =>
  programData.value?.programOverview.errorMessage || ''
)

const totalCycles = computed(() =>
  programData.value?.cyclesStatus.totalCycles || 0
)

const completedToday = computed(() =>
  programData.value?.cyclesStatus.completedToday || 0
)

const cycles = computed(() =>
  programData.value?.cyclesStatus.cycles || []
)

const hasCycles = computed(() => cycles.value.length > 0)

const currentExecution = computed(() =>
  programData.value?.currentExecution
)

const programStatus = computed(() =>
  programData.value?.programOverview.status || 'idle'
)

const canPause = computed(() =>
  programStatus.value === 'running' || programStatus.value === 'loaded'
)

const canResume = computed(() =>
  programStatus.value === 'paused'
)

// Status helpers
function getStatusIcon() {
  switch (programStatus.value) {
    case 'running': return 'play_circle'
    case 'paused': return 'pause_circle'
    case 'stopped': return 'stop_circle'
    default: return 'schedule'
  }
}

function getStatusColor() {
  switch (programStatus.value) {
    case 'running': return 'positive'
    case 'paused': return 'warning'
    case 'stopped': return 'negative'
    case 'loaded': return 'primary'
    default: return 'grey-5'
  }
}

function getStatusText() {
  switch (programStatus.value) {
    case 'running': return 'Активна'
    case 'paused': return 'На пауза'
    case 'stopped': return 'Спряна'
    case 'loaded': return 'Готова'
    default: return 'Готова'
  }
}

// Cycle helpers
function getCycleIcon(status: string) {
  switch (status) {
    case 'completed': return 'check_circle'
    case 'running': return 'play_circle'
    case 'failed': return 'error'
    default: return 'radio_button_unchecked'
  }
}

function getCycleColor(status: string) {
  switch (status) {
    case 'completed': return 'positive'
    case 'running': return 'primary'
    case 'failed': return 'negative'
    default: return 'grey-4'
  }
}

function getCycleStatusText(status: string) {
  switch (status) {
    case 'completed': return 'Завършен'
    case 'running': return 'Изпълнява се'
    case 'failed': return 'Неуспешен'
    default: return 'Предстоящ'
  }
}

function getCycleClasses(cycle: any) {
  return [
    'cycle-item',
    `cycle--${cycle.status}`,
    { 'cycle--current': cycle.isCurrentlyExecuting }
  ]
}

// Real-time execution helpers
function getActionIcon(action: any) {
  if (action.success === null) {
    // In progress
    return action.type === 'sensor' ? 'sensors' :
           action.type === 'actuator' ? 'settings_input_component' :
           action.type === 'if' ? 'help' :
           'play_circle'
  } else if (action.success) {
    return 'check_circle'
  } else {
    return 'error'
  }
}

function getActionColor(action: any) {
  if (action.success === null) {
    return 'orange' // In progress
  } else if (action.success) {
    return 'positive'
  } else {
    return 'negative'
  }
}

function getActionItemClasses(action: any) {
  return {
    'action-item--in-progress': action.success === null,
    'action-item--success': action.success === true,
    'action-item--error': action.success === false
  }
}

function formatActionTime(timestamp: Date | string) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDuration(duration: number) {
  if (!duration) return ''
  const seconds = Math.floor(duration / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Cycles management methods
function toggleCycleExpansion(cycleId: string) {
  cyclesExpanded.value[cycleId] = !cyclesExpanded.value[cycleId]
}

function isCycleExpanded(cycleId: string): boolean {
  return cyclesExpanded.value[cycleId] || false
}

function getCycleDisplayStatus(cycle: any): string {
  switch (cycle.status) {
    case 'completed': return 'завършен'
    case 'running': return 'в изпълнение'
    case 'failed': return 'неуспешен'
    default: return 'чакащ'
  }
}

function getCycleDurationDisplay(cycle: any): string {
  if (!cycle.totalDurationMs) return ''

  const totalSeconds = Math.round(cycle.totalDurationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `0:${seconds.toString().padStart(2, '0')}`
  }
}

function getActionTemplateStatus(cycle: any): string {
  if (cycle.status === 'completed') {
    return 'Всички ActionTemplates завършени успешно'
  } else if (cycle.status === 'running') {
    return 'ActionTemplates се изпълняват...'
  } else if (cycle.status === 'failed') {
    return 'Грешка при изпълнение на ActionTemplates'
  }
  return 'ActionTemplates в чакане'
}

function formatCycleDuration(cycle: any): string {
  if (cycle.lastDuration) {
    return formatDuration(cycle.lastDuration)
  } else if (cycle.estimatedDuration) {
    return `~${formatDuration(cycle.estimatedDuration)}`
  }
  return ''
}

function formatCycleTime(cycle: any): string {
  if (cycle.status === 'completed' && cycle.lastDuration) {
    const startTime = cycle.startTime
    const endTime = new Date(new Date(`2000-01-01T${startTime}`).getTime() + cycle.lastDuration)
    return `${startTime}-${endTime.toTimeString().substr(0, 5)}`
  }
  return cycle.startTime
}

// Get ActionTemplates from cycle data
function getFlowsForCycle(cycle: any): any[] {
  return cycle.cycleGlobalParameters || []
}

// Get current block execution info
function getCurrentBlockInfo(): string {
  // Use direct store access instead of destructured
  const history = webSocketStore.actionHistory

  if (!history || history.length === 0) {
    return ''
  }

  const lastBlock = history[0]
  const blockName = lastBlock.text || lastBlock.type || 'Block'
  const details = getBlockDetails(lastBlock)

  console.log('[ProgramDashboard] blockName:', blockName)
  console.log('[ProgramDashboard] details:', details)

  // Combine block name with details
  if (details) {
    return `${blockName}: ${details}`
  }

  return blockName
}

// Actions
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
.program-dashboard-container {
  height: 100%;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
}

.program-overview {
  .program-meta {
    font-size: 0.875rem;
  }

  .program-status {
    display: flex;
    align-items: center;
  }
}

.cycles-overview {
  .cycles-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cycle-card {
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 8px;
    background: rgba(0,0,0,0.02);
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0,0,0,0.05);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    &.cycle--current {
      background: rgba(25, 118, 210, 0.1);
      border-color: #1976d2;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
    }

    &.cycle--completed {
      background: rgba(76, 175, 80, 0.05);
      border-color: #4caf50;
    }

    &.cycle--failed {
      background: rgba(244, 67, 54, 0.05);
      border-color: #f44336;
    }
  }

  .cycle-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: rgba(0,0,0,0.03);
    }
  }

  .cycle-time-status {
    display: flex;
    align-items: center;
    font-weight: 500;
  }

  .cycle-time {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--q-primary);
  }

  .cycle-id {
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
  }

  .cycle-status-text {
    font-size: 0.8rem;
    color: #666;
  }

  .cycle-duration-text {
    font-size: 0.8rem;
    color: #4caf50;
    font-weight: 600;
  }

  .cycle-expand-icon {
    transition: transform 0.2s ease;
  }

  .cycle-details {
    padding: 0 16px 12px 16px;
    border-top: 1px solid rgba(0,0,0,0.05);
  }

  .action-templates-section {
    background: rgba(0,0,0,0.02);
    padding: 8px 12px;
    border-radius: 6px;
  }

  .action-templates-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .action-template-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    background: rgba(255,255,255,0.8);
    border-radius: 4px;
    font-size: 0.8rem;

    span {
      flex: 1;
      margin-left: 4px;
    }
  }

  .cycle-duration {
    display: flex;
    align-items: center;
    margin-top: 4px;
  }
}

.current-execution {
  .execution-details {
    background: rgba(76, 175, 80, 0.05);
    border-left: 4px solid #4caf50;
    padding: 12px;
    border-radius: 4px;
  }

  .current-block {
    padding: 6px 0;
  }

  .progress-section {
    margin-top: 8px;
  }
}

.no-execution {
  opacity: 0.7;
}

// Current execution styles
.current-execution-section {
  .websocket-status {
    .q-chip {
      transition: all 0.3s ease;

      // Rotating animation for sync icon
      i.q-icon[aria-hidden="true"] {
        &.q-icon--name-sync {
          animation: spin 1s linear infinite;
        }
      }
    }
  }

  .current-blocks, .history-timeline {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .action-item {
    display: flex;
    align-items: flex-start;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(0,0,0,0.02);
    border-left: 4px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0,0,0,0.05);
    }

    &.action-item--current {
      border-left-color: #ff9800;
      background: rgba(255, 152, 0, 0.05);

      .action-status {
        animation: pulse 2s infinite;
      }
    }

    &.action-item--history {
      border-left-color: #9e9e9e;
      background: rgba(158, 158, 158, 0.03);
      opacity: 0.8;
    }

    &.action-item--success {
      border-left-color: #4caf50;
      background: rgba(76, 175, 80, 0.05);
    }

    &.action-item--error {
      border-left-color: #f44336;
      background: rgba(244, 67, 54, 0.05);
    }

    .action-status {
      margin-right: 12px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .action-content {
      flex: 1;
      min-width: 0;

      .action-text {
        font-weight: 500;
        line-height: 1.3;
      }

      .action-meta {
        margin-top: 2px;
        opacity: 0.8;
      }
    }
  }

  .history-section {
    border-top: 1px solid rgba(0,0,0,0.1);
    padding-top: 12px;

    .history-content {
      border-left: 2px solid rgba(158, 158, 158, 0.2);
      padding-left: 12px;
      margin-top: 8px;
    }
  }

  .no-current-execution {
    opacity: 0.7;
    padding: 16px 0;
  }
}

.loading-execution {
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>