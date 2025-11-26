<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-md">
      <!-- Header -->
      <div class="col-12">
        <div class="text-h4 text-weight-bold q-mb-md">
          <q-icon name="play_circle" class="q-mr-sm text-primary" />
          Активни програми
        </div>
      </div>

      <!-- Status Overview Card -->
      <div class="col-12">
        <q-card class="q-mb-md status-overview-card" flat bordered>
          <q-card-section class="bg-gradient-to-r from-primary to-secondary text-white">
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-light">
                <q-icon name="science" class="q-mr-sm" />
                {{ hasActiveProgram ? activeProgram?.name || 'Активна програма' : 'Няма заредена програма' }}
              </div>
              <div class="text-caption opacity-80">
                {{ hasActiveProgram && activeProgram ? formatDateTime(activeProgram.startedAt) : formatDateTime(new Date()) }}
              </div>
            </div>
          </q-card-section>
          <q-card-section class="q-pa-lg">
            <div class="row items-center justify-between">
              <!-- Main Status -->
              <div class="col-auto">
                <div class="status-indicator-wrapper">
                  <q-chip 
                    v-if="statusInfo"
                    :color="getEnhancedStatusColor(statusInfo.color)"
                    text-color="white"
                    size="xl"
                    :icon="statusInfo.icon"
                    class="status-chip elevation-4"
                  >
                    <div class="text-weight-medium">
                      {{ statusInfo.displayText }}
                    </div>
                  </q-chip>
                  <q-chip v-else color="grey-6" text-color="white" size="xl" icon="help" class="status-chip elevation-4">
                    <div class="text-weight-medium">Няма активна програма</div>
                  </q-chip>
                </div>
              </div>

              <!-- Min Cycle Interval and Max Execution Time Settings -->
              <div v-if="hasActiveProgram && activeProgram" class="col-auto">
                <div class="row q-gutter-sm">
                  <!-- Min Cycle Interval Button -->
                  <q-btn
                    color="blue-grey-6"
                    size="md"
                    class="control-button"
                    no-caps
                  >
                    <div class="row items-center q-gutter-xs">
                      <q-icon name="schedule" size="sm" />
                      <div class="column items-start" style="line-height: 1.2">
                        <div class="text-caption">Мин. интервал</div>
                        <div class="text-weight-bold">{{ activeProgram.minCycleInterval || 120 }} мин</div>
                      </div>
                    </div>
                    <q-popup-edit
                      v-model.number="editMinCycleInterval"
                      @before-show="editMinCycleInterval = activeProgram.minCycleInterval || 120"
                      @save="saveMinCycleInterval"
                      v-slot="scope"
                      buttons
                      label-set="Запази"
                      label-cancel="Отказ"
                    >
                      <q-input
                        v-model.number="scope.value"
                        type="number"
                        dense
                        autofocus
                        hint="60-240 минути (стъпка 5)"
                        suffix="мин"
                        :step="5"
                        :rules="[
                          val => val >= 60 || 'Минимум 60 минути',
                          val => val <= 240 || 'Максимум 240 минути'
                        ]"
                        @keyup.enter="scope.set"
                      />
                    </q-popup-edit>
                    <q-tooltip>Минимален интервал между циклите (закръглен на 5 мин)</q-tooltip>
                  </q-btn>

                  <!-- Max Execution Time Button -->
                  <q-btn
                    color="orange-6"
                    size="md"
                    class="control-button"
                    no-caps
                  >
                    <div class="row items-center q-gutter-xs">
                      <q-icon name="timer" size="sm" />
                      <div class="column items-start" style="line-height: 1.2">
                        <div class="text-caption">Макс. време</div>
                        <div class="text-weight-bold">{{ activeProgram.maxExecutionTime || 60 }} мин</div>
                      </div>
                    </div>
                    <q-popup-edit
                      v-model.number="editMaxExecutionTime"
                      @before-show="editMaxExecutionTime = activeProgram.maxExecutionTime || 60"
                      @save="saveMaxExecutionTime"
                      v-slot="scope"
                      buttons
                      label-set="Запази"
                      label-cancel="Отказ"
                    >
                      <q-input
                        v-model.number="scope.value"
                        type="number"
                        dense
                        autofocus
                        hint="1-1440 минути"
                        suffix="мин"
                        :rules="[
                          val => val >= 1 || 'Минимум 1 минута',
                          val => val <= 1440 || 'Максимум 1440 минути'
                        ]"
                        @keyup.enter="scope.set"
                      />
                    </q-popup-edit>
                    <q-tooltip>Максимално време за изпълнение на цикъл (safety timeout)</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <!-- Countdown for scheduled programs -->
              <div v-if="statusInfo && statusInfo.timeRemaining" class="col-auto">
                <q-card flat class="countdown-card bg-orange-1 text-orange-9 q-pa-md" style="border-left: 4px solid #ff9800;">
                  <div class="row items-center q-gutter-sm">
                    <q-icon name="schedule" size="sm" />
                    <div>
                      <div class="text-caption text-weight-medium">Остава време</div>
                      <div class="text-h5 text-weight-bold">
                        {{ getTimeRemainingString(statusInfo.timeRemaining) }}
                      </div>
                    </div>
                  </div>
                </q-card>
              </div>

              <!-- Control Buttons -->
              <div class="col-auto">
                <div class="row q-gutter-sm">
                  <!-- Start buttons (when program is loaded or scheduled, but not paused) -->
                  <q-btn
                    v-if="canStart && !isPaused"
                    @click="handleStartProgram"
                    color="positive"
                    icon="play_arrow"
                    label="Старт"
                    :loading="isLoading"
                    size="md"
                    class="control-button"
                    no-caps
                  />
                  
                  <q-btn
                    v-if="canStart && !isPaused"
                    @click="showDelayStartDialog = true"
                    color="orange"
                    icon="schedule"
                    label="Отложен старт"
                    :loading="isLoading"
                    size="md"
                    class="control-button"
                    no-caps
                  />
                  
                  <!-- Pause/Resume button (when program is running) -->
                  <q-btn
                    v-if="canPause"
                    @click="handlePauseProgram"
                    color="orange"
                    icon="pause"
                    label="Пауза"
                    :loading="isLoading"
                    size="md"
                    class="control-button"
                    no-caps
                  />
                  
                  <q-btn
                    v-if="isPaused && hasActiveProgram"
                    @click="handleResumeProgram"
                    color="positive"
                    icon="play_arrow"
                    label="Възобнови"
                    :loading="isLoading"
                    size="md"
                    class="control-button"
                    no-caps
                  />
                  
                  <!-- Stop button (when program is running or paused) -->
                  <q-btn
                    v-if="canStop"
                    @click="handleStopProgram"
                    color="negative"
                    icon="stop"
                    label="Стоп"
                    :loading="isLoading"
                    size="md"
                    class="control-button"
                    no-caps
                  />
                  
                  <!-- Remove button (when program is loaded or stopped) -->
                  <q-btn
                    v-if="(isLoaded || isStopped) && hasActiveProgram"
                    @click="handleRemoveProgram"
                    color="negative"
                    icon="delete_forever"
                    label="Премахни"
                    :loading="isLoading"
                    size="md"
                    outline
                    class="control-button"
                    no-caps
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Load Program Section -->
      <div v-if="!hasActiveProgram" class="col-12">
        <load-program-card @program-loaded="handleProgramLoaded" />
      </div>

      

      <!-- Active Cycles -->
      <div v-if="hasActiveProgram && activeProgram" class="col-12">
        <active-cycles-card 
          :active-cycles="activeProgram.activeCycles"
          :skipped-cycles="activeProgram.skippedCycles"
          @skip-cycle="handleSkipCycle"
        />
      </div>

    </div>

    <!-- Start/Schedule Dialog -->
    <q-dialog v-model="showDelayStartDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Стартиране на програма</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model.number="delayDays"
            type="number"
            label="Брой дни за отлагане"
            min="1"
            max="365"
            :rules="[val => val >= 1 && val <= 365 || 'Въведете число от 1 до 365']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" color="primary" v-close-popup />
          <q-btn
            @click="handleDelayedStart"
            color="orange"
            label="Планирай старт"
            :loading="isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useActiveProgramStore } from '../stores/activeProgram'
import { date } from 'quasar'
import type { IGlobalParameter, ISkipCycleRequest } from '../services/activeProgramService'

// Components
import LoadProgramCard from '../components/activeProgram/LoadProgramCard.vue'
import ActiveCyclesCard from '../components/activeProgram/ActiveCyclesCard.vue'
//import GlobalParametersCard from '../components/activeProgram/GlobalParametersCard.vue'

const activeProgramStore = useActiveProgramStore()

// Local state
const showDelayStartDialog = ref(false)
const delayDays = ref(1)
const editMinCycleInterval = ref(120)
const editMaxExecutionTime = ref(60)


// Computed from store
const hasActiveProgram = computed(() => activeProgramStore.hasActiveProgram)
const activeProgram = computed(() => activeProgramStore.activeProgram)
const isLoading = computed(() => activeProgramStore.isLoading)
const statusInfo = computed(() => activeProgramStore.statusInfo)
const canStart = computed(() => activeProgramStore.canStart)
const canPause = computed(() => activeProgramStore.canPause)
const canStop = computed(() => activeProgramStore.canStop)
const canRemove = computed(() => activeProgramStore.canRemove)
const isPaused = computed(() => activeProgramStore.isPaused)
const isStopped = computed(() => activeProgramStore.isStopped)
const isLoaded = computed(() => activeProgramStore.isLoaded)

// Methods
function formatDateTime(dateValue: Date | string): string {
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  return date.formatDate(d, 'DD.MM.YYYY HH:mm')
}

function getTimeRemainingString(timeRemaining: number): string {
  return activeProgramStore.getTimeRemainingString(timeRemaining)
}

function getEnhancedStatusColor(originalColor: string): string {
  const colorMap: Record<string, string> = {
    'red': 'deep-orange-6',
    'orange': 'amber-6', 
    'green': 'teal-6',
    'blue': 'indigo-6',
    'amber': 'orange-6',
    'grey': 'blue-grey-6'
  }
  return colorMap[originalColor] || originalColor
}

async function handleStartProgram(): Promise<void> {
  try {
    await activeProgramStore.startProgram()
  } catch (error) {
    console.error('Failed to start program:', error)
  }
}

async function handleDelayedStart(): Promise<void> {
  try {
    await activeProgramStore.scheduleProgram({ delayDays: delayDays.value })
    showDelayStartDialog.value = false
  } catch (error) {
    console.error('Failed to schedule program:', error)
  }
}

async function handleResumeProgram(): Promise<void> {
  try {
    await activeProgramStore.startProgram()
  } catch (error) {
    console.error('Failed to resume program:', error)
  }
}

async function handlePauseProgram(): Promise<void> {
  try {
    await activeProgramStore.pauseProgram()
  } catch (error) {
    console.error('Failed to pause program:', error)
  }
}

async function handleStopProgram(): Promise<void> {
  try {
    await activeProgramStore.stopProgram()
  } catch (error) {
    console.error('Failed to stop program:', error)
  }
}

async function handleRemoveProgram(): Promise<void> {
  try {
    await activeProgramStore.removeActiveProgram()
  } catch (error) {
    console.error('Failed to remove program:', error)
  }
}

function handleProgramLoaded(): void {
  // Refresh the active program data
  activeProgramStore.fetchActiveProgram()
}


async function handleSkipCycle(data: ISkipCycleRequest): Promise<void> {
  try {
    await activeProgramStore.skipCycle(data)
  } catch (error) {
    console.error('Failed to skip cycle:', error)
  }
}

async function saveMinCycleInterval(value: number): Promise<void> {
  try {
    await activeProgramStore.updateMinCycleInterval(value)
  } catch (error) {
    console.error('Failed to update min cycle interval:', error)
  }
}

async function saveMaxExecutionTime(value: number): Promise<void> {
  try {
    await activeProgramStore.updateMaxExecutionTime(value)
  } catch (error) {
    console.error('Failed to update max execution time:', error)
  }
}

// Lifecycle
onMounted(() => {
  activeProgramStore.fetchActiveProgram()
  activeProgramStore.startAutoRefresh()
})

onUnmounted(() => {
  activeProgramStore.stopAutoRefresh()
})
</script>

<style scoped>
/* Status Overview Enhancements */
.status-overview-card {
  border-radius: 16px;
  overflow: hidden;
}

.bg-gradient-to-r {
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
}

.status-indicator-wrapper {
  position: relative;
}

.status-chip {
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.countdown-card, .next-execution-card, .health-card {
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.countdown-card:hover, .next-execution-card:hover, .health-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

/* Program Details Enhancements */
.program-details-card {
  border-radius: 16px;
  overflow: hidden;
}

.program-header {
  position: relative;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #64b5f6 100%);
}

.header-action-btn {
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.header-action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255,255,255,0.3);
}

.remove-action-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.remove-action-btn:hover {
  opacity: 1;
}

/* Info List Styling */
.info-list {
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
}

.info-item {
  border-radius: 8px;
  margin: 4px;
  background: white;
  transition: all 0.2s ease;
}

.info-item:hover {
  background: #f5f5f5;
  transform: translateX(4px);
}

/* Action Buttons */
.action-button {
  border-radius: 12px;
  padding: 12px 24px;
  text-transform: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
}

.control-button {
  border-radius: 8px;
  padding: 8px 16px;
  text-transform: none;
  font-weight: 600;
  transition: all 0.2s ease;
  min-width: 100px;
}

.control-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.danger-button {
  border-radius: 8px;
  border: 2px dashed #f44336;
  background: #ffebee;
  transition: all 0.2s ease;
}

.danger-button:hover {
  background: #ffcdd2;
  border-style: solid;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .countdown-card, .next-execution-card, .health-card {
    margin-bottom: 8px;
  }
  
  .program-header .row {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-action-btn {
    margin: 2px;
  }
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.status-chip[class*="running"] {
  animation: pulse 2s infinite;
}
</style>