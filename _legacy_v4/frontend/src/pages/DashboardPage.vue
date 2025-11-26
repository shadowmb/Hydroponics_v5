<template>
  <q-page class="dashboard-page" :class="{ 'dashboard-page--fullscreen': isFullscreen }">
    <!-- Dashboard Header -->
    <div class="dashboard-header q-pa-md" v-if="!isFullscreen">
      <div class="row items-center justify-between">
        <div>
          <h4 class="q-ma-none text-weight-bold">Системно табло</h4>
          <div class="text-caption text-grey-6 q-mt-xs">
            Последно обновяване: {{ lastRefreshFormatted }}
            <q-icon 
              v-if="isLoading" 
              name="sync" 
              class="q-ml-sm animate-spin" 
              color="primary" 
            />
          </div>
        </div>
        
        <div class="row q-gutter-sm">
          <!-- Auto Refresh Indicator -->
          <q-chip 
            v-if="dashboardSettings?.layout?.autoRefresh"
            :color="isLoading ? 'primary' : 'positive'"
            text-color="white" 
            size="sm"
            :icon="isLoading ? 'sync' : 'check_circle'"
            :icon-class="isLoading ? 'animate-spin' : ''"
          >
            Авто-обновяване: {{ dashboardSettings?.layout?.refreshInterval }}s
          </q-chip>

          <!-- Manual Refresh -->
          <q-btn
            color="primary"
            icon="refresh"
            label="Обнови"
            outline
            :disable="isLoading"
            @click="refreshData"
          />

          <!-- Quick Layout Switcher -->
          <q-btn-dropdown
            color="info"
            icon="view_quilt"
            label="Дизайн"
            outline
            dropdown-icon="keyboard_arrow_down"
          >
            <q-list>
              <q-item 
                clickable 
                v-close-popup 
                @click="quickSwitchLayout('compact')"
                :class="{ 'bg-blue-1': dashboardSettings?.layout?.layoutSettings?.layoutType === 'compact' }"
              >
                <q-item-section avatar>
                  <q-icon name="grid_view" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Компактен (2×2)</q-item-label>
                  <q-item-label caption>Балансирано разпределение</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-item 
                clickable 
                v-close-popup 
                @click="quickSwitchLayout('stacked')"
                :class="{ 'bg-blue-1': dashboardSettings?.layout?.layoutSettings?.layoutType === 'stacked' }"
              >
                <q-item-section avatar>
                  <q-icon name="view_agenda" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Подредени (4×1)</q-item-label>
                  <q-item-label caption>Вертикално подреждане</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-item 
                clickable 
                v-close-popup 
                @click="quickSwitchLayout('priority')"
                :class="{ 'bg-blue-1': dashboardSettings?.layout?.layoutSettings?.layoutType === 'priority' }"
              >
                <q-item-section avatar>
                  <q-icon name="priority_high" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Приоритет</q-item-label>
                  <q-item-label caption>Фокус върху сензорите</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-item 
                clickable 
                v-close-popup 
                @click="quickSwitchLayout('tiles')"
                :class="{ 'bg-blue-1': dashboardSettings?.layout?.layoutSettings?.layoutType === 'tiles' }"
              >
                <q-item-section avatar>
                  <q-icon name="view_column" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Плочки (1×4)</q-item-label>
                  <q-item-label caption>Компактен хоризонтален</q-item-label>
                </q-item-section>
              </q-item>
              
              <q-separator />
              
              <q-item clickable v-close-popup @click="openLayoutDesigner">
                <q-item-section avatar>
                  <q-icon name="tune" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Персонализиране</q-item-label>
                  <q-item-label caption>Отвори дизайнера</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Settings -->
          <q-btn
            color="secondary"
            icon="tune"
            label="Настройки"
            outline
            @click="showSettingsDialog = true"
          />

          <!-- Fullscreen Toggle -->
          <FullscreenToggle ref="fullscreenComponent" />
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div 
      class="dashboard-content" 
      :class="contentClass"
      :data-layout="dashboardSettings?.layout?.layoutSettings?.layoutType"
    >
      <!-- Sensors Section -->
      <DashboardSection
        title="Сензорни данни"
        subtitle="Текущи стойности от сензорите"
        section-type="sensors"
        :modules="sensorModules"
        @refresh="refreshSensorData"
        @settings="openSectionSettings('sensors')"
      >
        <ModuleContainer
          v-for="module in sensorModules"
          :key="module.id"
          :module="module"
          :show-drag-handle="false"
        />
      </DashboardSection>

      <!-- System Section -->
      <DashboardSection
        title="Състояние на системата"
        subtitle="Контролери, устройства и мрежа"
        section-type="system"
        :modules="systemModules"
        @refresh="refreshSystemData"
        @settings="openSectionSettings('system')"
      >
        <ModuleContainer
          v-for="module in systemModules"
          :key="module.id"
          :module="module"
          :show-drag-handle="false"
        />
      </DashboardSection>

      <!-- Program Section -->
      <DashboardSection
        title="Активна програма"
        subtitle="Текуща програма и изпълнение"
        section-type="program"
        :modules="[]"
        @refresh="refreshProgramData"
        @settings="openSectionSettings('program')"
      >
        <ProgramDashboard />
      </DashboardSection>

      <!-- Alerts Section -->
      <DashboardSection
        title="Предупреждения и съобщения"
        subtitle="Системни грешки и известия"
        section-type="alerts"
        :modules="alertModules"
        @refresh="refreshAlertData"
        @settings="openSectionSettings('alerts')"
      >
        <AlertContainer
          v-if="alertModules.length > 0"
          :module="alertModules[0]"
          :show-drag-handle="false"
        />
      </DashboardSection>
    </div>

    <!-- Settings Dialog -->
    <DashboardSettings 
      v-model="showSettingsDialog"
      :initial-tab="activeSettingsTab"
      @module-updated="handleModuleUpdate"
      @settings-changed="handleSettingsChange"
    />

    <!-- Loading Overlay -->
    <q-inner-loading :showing="isLoading" color="primary">
      <q-spinner-gears size="50px" />
      <div class="q-mt-md">Обновяване на данните...</div>
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../stores/dashboard'
import DashboardSection from './dashboard/components/DashboardSection.vue'
import ModuleContainer from './dashboard/components/ModuleContainerV2.vue'
import FullscreenToggle from './dashboard/components/FullscreenToggle.vue'
import DashboardSettings from './dashboard/DashboardSettingsV2.vue'
import ProgramDashboard from './dashboard/components/sections/ProgramDashboard.vue'
import AlertContainer from './dashboard/components/sections/AlertContainer.vue'

// Store and refs
const dashboardStore = useDashboardStore()
const showSettingsDialog = ref(false)
const activeSettingsTab = ref('sensors')
const fullscreenComponent = ref()
const refreshTimer = ref<NodeJS.Timeout>()

// Computed properties from store - use storeToRefs for reactivity
const {
  sensorModules,
  systemModules,
  programModules,
  alertModules,
  settings: dashboardSettings,
  isLoading,
  lastRefresh
} = storeToRefs(dashboardStore)

// Computed
const isFullscreen = computed(() => fullscreenComponent.value?.isFullscreen || false)

const lastRefreshFormatted = computed(() => {
  return lastRefresh.value?.toLocaleTimeString('bg-BG') || ''
})

const contentClass = computed(() => ({
  'dashboard-content--fullscreen': isFullscreen.value,
  'dashboard-content--compact': dashboardSettings.value?.layout?.compactMode
}))

// Methods
function refreshData() {
  dashboardStore.refreshData()
}

function refreshSensorData() {
  console.log('Refreshing sensor data...')
  refreshData()
}

function refreshSystemData() {
  console.log('Refreshing system data...')
  dashboardStore.loadSystemData()
}

function refreshProgramData() {
  console.log('Refreshing program data...')
  dashboardStore.loadProgramData()
}

function refreshAlertData() {
  console.log('Refreshing alert data...')
  refreshData()
}

function openSectionSettings(sectionId: string) {
  activeSettingsTab.value = sectionId
  showSettingsDialog.value = true
}

function handleModuleUpdate(moduleId: string, updates: any) {
  console.log('Module updated:', moduleId, updates)
  // Handle module updates from settings dialog
}

function handleSettingsChange(newSettings: any) {
  dashboardStore.updateSettings(newSettings)
  setupAutoRefresh()
}

function quickSwitchLayout(layoutType: 'compact' | 'stacked' | 'priority' | 'tiles') {
  dashboardStore.switchLayout(layoutType)
}

function openLayoutDesigner() {
  activeSettingsTab.value = 'layout-designer'
  showSettingsDialog.value = true
}

function setupAutoRefresh() {
  // Clear existing timer
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }

  // Setup new timer if auto-refresh is enabled
  if (dashboardSettings.value?.layout?.autoRefresh && dashboardSettings.value?.layout?.refreshInterval > 0) {
    refreshTimer.value = setInterval(() => {
      if (!showSettingsDialog.value) { // Don't refresh while settings are open
        refreshData()
      }
    }, dashboardSettings.value.layout.refreshInterval * 1000)
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize mock data for non-system modules
  dashboardStore.initializeMockData()

  // Load sensor modules from database
  await dashboardStore.loadSensorModulesFromDB()

  // Load available devices first (needed for system filtering)
  await dashboardStore.loadAvailableDevices()

  // Load system settings from database
  await dashboardStore.loadSystemSettingsFromDB()

  // Load alerts settings from database
  await dashboardStore.loadAlertsSettingsFromDB()

  // Load system modules from real APIs
  await dashboardStore.loadSystemData()

  // Load program data
  await dashboardStore.loadProgramData()

  // Debug: Check if modules are loaded
  console.log('Sensor modules:', sensorModules.value)
  console.log('System modules:', systemModules.value)
  console.log('Program modules:', programModules.value)
  console.log('Alert modules:', alertModules.value)

  // Initial data refresh for sensors
  refreshData()

  // Setup auto-refresh
  setupAutoRefresh()
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})

// Watch settings changes for auto-refresh updates
watch(
  () => [dashboardSettings.value?.layout?.autoRefresh, dashboardSettings.value?.layout?.refreshInterval],
  () => {
    setupAutoRefresh()
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: 100vh;
  background-color: #f5f5f5;

  &--fullscreen {
    .dashboard-header {
      display: none;
    }
  }
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  margin: -16px -16px 0 -16px;
  
  h4 {
    color: #1976d2;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '';
      width: 4px;
      height: 24px;
      background: linear-gradient(45deg, #4CAF50, #2196F3);
      border-radius: 2px;
    }
  }
}

.dashboard-content {
  padding: 16px;
  gap: 16px;
  display: grid;
  transition: all 0.3s ease;
  
  // Default Compact Layout (2x2 Grid)
  &[data-layout="compact"] {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    grid-template-areas: 
      "sensors system"
      "program alerts";
    
    .dashboard-section--sensors {
      grid-area: sensors;
    }
    
    .dashboard-section--system {
      grid-area: system;
    }
    
    .dashboard-section--program {
      grid-area: program;
    }
    
    .dashboard-section--alerts {
      grid-area: alerts;
    }
  }
  
  // Stacked Layout (4x1 Vertical)
  &[data-layout="stacked"] {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
    grid-template-areas: 
      "sensors"
      "system"
      "program"
      "alerts";
    
    .dashboard-section--sensors {
      grid-area: sensors;
    }
    
    .dashboard-section--system {
      grid-area: system;
    }
    
    .dashboard-section--program {
      grid-area: program;
    }
    
    .dashboard-section--alerts {
      grid-area: alerts;
    }
  }
  
  // Priority Layout (Sensors Focus)
  &[data-layout="priority"] {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto;
    grid-template-areas: 
      "sensors sensors sensors"
      "system program alerts";
    
    .dashboard-section--sensors {
      grid-area: sensors;
    }
    
    .dashboard-section--system {
      grid-area: system;
    }
    
    .dashboard-section--program {
      grid-area: program;
    }
    
    .dashboard-section--alerts {
      grid-area: alerts;
    }
  }
  
  // Tiles Layout (4x1 Horizontal Compact)
  &[data-layout="tiles"] {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: auto;
    grid-template-areas: "sensors system program alerts";
    
    .dashboard-section--sensors {
      grid-area: sensors;
    }
    
    .dashboard-section--system {
      grid-area: system;
    }
    
    .dashboard-section--program {
      grid-area: program;
    }
    
    .dashboard-section--alerts {
      grid-area: alerts;
    }
  }
  
  &--fullscreen {
    padding: 8px;
    gap: 8px;
  }

  &--compact {
    padding: 8px;
    gap: 8px;
    
    :deep(.dashboard-section) {
      padding: 8px;
      margin-bottom: 8px;
    }
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Responsive design
@media (max-width: 1200px) {
  .dashboard-content {
    // Compact layout adjustments
    &[data-layout="compact"] {
      grid-template-columns: 1fr;
      grid-template-areas: 
        "sensors"
        "system"
        "program" 
        "alerts";
    }
    
    // Priority layout adjustments
    &[data-layout="priority"] {
      grid-template-columns: 1fr;
      grid-template-areas: 
        "sensors"
        "system"
        "program"
        "alerts";
    }
    
    // Tiles layout adjustments
    &[data-layout="tiles"] {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      grid-template-areas: 
        "sensors system"
        "program alerts";
    }
    
    :deep(.modules-grid--sensors) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 8px;
    gap: 8px;
    
    // All layouts become stacked on mobile
    &[data-layout="compact"],
    &[data-layout="priority"], 
    &[data-layout="tiles"] {
      grid-template-columns: 1fr;
      grid-template-areas: 
        "sensors"
        "system"
        "program"
        "alerts";
    }
    
    :deep(.modules-grid--sensors) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    :deep(.modules-grid--system),
    :deep(.modules-grid--program) {
      grid-template-columns: repeat(1, 1fr);
    }
    
    :deep(.dashboard-section) {
      padding: 12px;
      margin-bottom: 8px;
    }
  }

  .dashboard-header {
    padding: 12px;
    
    .row {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    h4 {
      font-size: 1.3rem;
    }
  }
}

@media (max-width: 480px) {
  .dashboard-content {
    padding: 4px;
    gap: 4px;
    
    :deep(.modules-grid--sensors),
    :deep(.modules-grid--system),
    :deep(.modules-grid--program) {
      grid-template-columns: 1fr;
      gap: 4px;
    }
    
    :deep(.dashboard-section) {
      padding: 8px;
    }
    
    :deep(.module-container) {
      min-height: 80px;
      
      .module-content {
        min-height: 40px;
      }
      
      .number-display .display-value {
        font-size: 1.2rem;
      }
    }
  }
  
  .dashboard-header {
    padding: 8px;
    
    h4 {
      font-size: 1.1rem;
    }
    
    .q-chip {
      font-size: 0.7rem;
    }
    
    .q-btn {
      font-size: 0.8rem;
      min-height: 32px;
      
      .q-btn__content {
        padding: 0 8px;
      }
    }
  }
}
</style>