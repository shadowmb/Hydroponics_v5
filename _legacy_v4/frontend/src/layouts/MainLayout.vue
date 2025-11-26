<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-hydro-green text-white">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="text-weight-bold">
          <q-icon name="eco" size="sm" class="q-mr-sm" />
          Хидропонна Система
        </q-toolbar-title>

        <div class="q-gutter-sm row items-center no-wrap">
          <!-- System Status Indicator -->
          <q-chip
            :color="systemStatus.color"
            text-color="white"
            size="sm"
            :icon="systemStatus.icon"
            clickable
            @click="showIssuesModal = true"
          >
            {{ systemStatus.text }}
            <q-tooltip v-if="systemStatus.details">
              {{ systemStatus.details }}
            </q-tooltip>
          </q-chip>

          <!-- Tutorial Button -->
          <q-btn
            flat
            round
            dense
            icon="school"
            @click="showTutorialDashboard"
            :color="isTutorialActive ? 'yellow-4' : 'white'"
          >
            <q-tooltip>Ръководства и обучения</q-tooltip>
            <q-badge v-if="isTutorialActive" color="primary" floating>
              {{ currentTutorialStep }}
            </q-badge>
          </q-btn>

          <!-- Backup Flow Editor Menu -->
          <q-btn flat round dense icon="menu" @click="showFlowMenu = true">
            <q-menu v-model="showFlowMenu" anchor="bottom right" self="top right">
              <q-list style="min-width: 200px">
                <q-item-label header>Flow Редактор</q-item-label>
                
                <q-item clickable v-close-popup @click="createNewFlow">
                  <q-item-section avatar>
                    <q-icon name="add" />
                  </q-item-section>
                  <q-item-section>Нов поток</q-item-section>
                </q-item>
                
                <q-item clickable v-close-popup @click="saveCurrentFlow">
                  <q-item-section avatar>
                    <q-icon name="save" />
                  </q-item-section>
                  <q-item-section>Запази поток</q-item-section>
                </q-item>
                
                <q-item clickable v-close-popup @click="exportCurrentFlow">
                  <q-item-section avatar>
                    <q-icon name="download" />
                  </q-item-section>
                  <q-item-section>Експорт поток</q-item-section>
                </q-item>
                
                <q-separator />
                
                <q-item clickable v-close-popup @click="toggleToolbarVisibility">
                  <q-item-section avatar>
                    <q-icon name="visibility" />
                  </q-item-section>
                  <q-item-section>Покажи/скрий toolbar</q-item-section>
                </q-item>
                
                <q-item clickable v-close-popup @click="resetFlowEditor">
                  <q-item-section avatar>
                    <q-icon name="refresh" />
                  </q-item-section>
                  <q-item-section>Рестартирай редактор</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <!-- Settings -->
          <q-btn flat round dense icon="settings" @click="$router.push('/settings')" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
      :width="250"
    >
      <div class="column full-height">
        <!-- User Info Section -->
        <div class="q-pa-md bg-hydro-blue text-white">
          <div class="text-h6 text-weight-bold">Контролен Панел</div>
          <div class="text-caption">Хидропоника v4.0</div>
        </div>

        <!-- Navigation Menu -->
        <q-list>
          <template v-for="(item, index) in navigationItems" :key="index">
            <!-- Regular menu items -->
            <q-item
              v-if="!item.children"
              clickable
              v-ripple
              :to="item.to"
              exact-active-class="text-hydro-green bg-grey-2"
              class="q-my-xs"
              :data-test="getMenuItemTestId(item)"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <!-- Expandable menu sections -->
            <q-expansion-item
              v-else
              :icon="item.icon"
              :label="item.label"
              class="q-my-xs"
              header-class="text-weight-medium"
            >
              <q-item
                v-for="(child, childIndex) in item.children"
                :key="childIndex"
                clickable
                v-ripple
                :to="child.to"
                exact-active-class="text-hydro-green bg-grey-2"
                class="q-ml-md q-my-xs"
                :data-test="getMenuItemTestId(child)"
              >
                <q-item-section avatar>
                  <q-icon :name="child.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ child.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-expansion-item>
          </template>
        </q-list>

        <q-space />

        <!-- Footer Info -->
        <div class="q-pa-md text-center text-grey-6">
          <div class="text-caption">Последна Актуализация</div>
          <div class="text-body2">{{ lastUpdateTime }}</div>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      
      <!-- Loading Overlay -->
      <q-inner-loading :showing="isLoading" color="hydro-green">
        <q-spinner-gears size="50px" />
        <div class="q-mt-md">{{ loadingMessage || 'Зареждане...' }}</div>
      </q-inner-loading>

      <!-- Page Content -->
      <router-view />

      <!-- Tutorial Components -->
      <tutorial-dashboard
        v-model="showTutorialModal"
        @tutorial-started="onTutorialStarted"
      />

      <tutorial-overlay />

      <tutorial-progress-indicator
        v-if="isTutorialActive"
        mode="compact"
        position="bottom-right"
        @tutorial-completed="onTutorialCompleted"
        @tutorial-exited="onTutorialExited"
      />

      <!-- System Issues Modal -->
      <system-issues-modal
        v-model="showIssuesModal"
        :issues="systemIssues"
      />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMainStore } from '../stores/main'
import { useTutorialStore } from '../stores/tutorial'
import { NavigationItem } from '../types'
import TutorialDashboard from '../components/tutorial/TutorialDashboard.vue'
import TutorialOverlay from '../components/tutorial/TutorialOverlay.vue'
import TutorialProgressIndicator from '../components/tutorial/TutorialProgressIndicator.vue'
import SystemIssuesModal from '../components/SystemIssuesModal.vue'
import { useHealthService } from '../services/healthService'

// Import debug system (development only)
if (process.env.NODE_ENV === 'development') {
  import('../utils/debugSystem').then((module) => {
    const debugSystem = module.default
    //debugSystem.logDebug('MainLayout', 'Layout initialized', { route: window.location.pathname })
  })
}

const route = useRoute()
const mainStore = useMainStore()
const tutorialStore = useTutorialStore()
const { systemStatus, systemIssues, startHealthPolling, stopHealthPolling } = useHealthService()

// Reactive state
const lastUpdateTime = ref(new Date().toLocaleTimeString())
const showFlowMenu = ref(false)
const showTutorialModal = ref(false)
const showIssuesModal = ref(false)

// Computed properties from store
const leftDrawerOpen = computed({
  get: () => mainStore.isLeftDrawerOpen,
  set: (val: boolean) => mainStore.setLeftDrawer(val)
})

const isLoading = computed(() => mainStore.isLoading)
const loadingMessage = computed(() => mainStore.loadingState.message || 'Loading...')

// Tutorial computed properties
const isTutorialActive = computed(() => tutorialStore.isActive)
const currentTutorialStep = computed(() => {
  if (!tutorialStore.isActive) return ''
  return `${tutorialStore.currentStepIndex + 1}/${tutorialStore.totalSteps}`
})

// Note: systemStatus now comes from useHealthService() - see import above

// Navigation configuration
const navigationItems: NavigationItem[] = [
  {
    label: 'Табло',
    icon: 'dashboard',
    to: '/dashboard'
  },
  {
    label: 'Управление на програми',
    icon: 'auto_awesome',
    to: '',
    children: [
      {
        label: 'Активни програми',
        icon: 'play_circle',
        to: '/active-programs'
      },
      {
        label: 'Програми',
        icon: 'science',
        to: '/programs'
      },
      {
        label: 'Action Templates',
        icon: 'inventory_2',
        to: '/action-templates'
      },
      {
        label: 'Управление на потоци',
        icon: 'account_tree',
        to: '/flow-management'
      },
      {
        label: 'Flow Editor',
        icon: 'edit',
        to: '/flow-editor'
      }
    ]
  },
  // DEACTIVATED: Target Registry System - Phase 1B
  // {
  //   label: 'Target Registry',
  //   icon: 'key',
  //   to: '/target-registry'
  // },
  {
    label: 'Мониторинг Контрол',
    icon: 'analytics',
    to: '/monitoring'
  },
  {
    label: 'Управление на устройства',
    icon: 'devices',
    to: '/devices'
  },
  {
    label: 'Известия',
    icon: 'notifications',
    to: '/notifications'
  },
  {
    label: 'System Logs',
    icon: 'assignment',
    to: '/logs'
  },
  {
    label: 'Настройки',
    icon: 'settings',
    to: '/settings'
  }
]

// Methods
function toggleLeftDrawer() {
  mainStore.toggleLeftDrawer()
}

// Tutorial methods
function showTutorialDashboard() {
  showTutorialModal.value = true
}

function onTutorialStarted(tutorialId: string) {
  console.log('Tutorial started:', tutorialId)
  showTutorialModal.value = false
}

function onTutorialCompleted() {
  console.log('Tutorial completed')
  // Could show completion celebration or redirect
}

function onTutorialExited() {
  console.log('Tutorial exited')
  // Could show save confirmation or cleanup
}

// Helper: Generate data-test ID for menu items
function getMenuItemTestId(item: NavigationItem): string {
  if (!item.to) return ''

  // Map routes to test IDs
  const routeToTestId: Record<string, string> = {
    '/devices': 'sidebar-devices',
    '/dashboard': 'sidebar-dashboard',
    '/programs': 'sidebar-programs',
    '/active-programs': 'sidebar-active-programs',
    '/monitoring': 'sidebar-monitoring',
    '/notifications': 'sidebar-notifications',
    '/logs': 'sidebar-logs',
    '/settings': 'sidebar-settings',
    '/flow-management': 'sidebar-flow-management',
    '/flow-editor': 'sidebar-flow-editor',
    '/action-templates': 'sidebar-action-templates'
  }

  return routeToTestId[item.to] || ''
}

// Flow Editor Backup Menu Functions
function createNewFlow() {
  // Try to access FlowEditor instance and create new flow
  try {
    // If we're on flow editor page, trigger new flow
    if (route.path.includes('flow-editor') || route.path.includes('programs')) {
      // Emit event to FlowEditor component
      window.dispatchEvent(new CustomEvent('flow-editor:new-flow'))
      console.log('Creating new flow...')
    } else {
      // Navigate to flow editor
      window.location.href = '/programs'
    }
  } catch (error) {
    console.error('Failed to create new flow:', error)
  }
}

function saveCurrentFlow() {
  try {
    // Emit event to FlowEditor component
    window.dispatchEvent(new CustomEvent('flow-editor:save-flow'))
    console.log('Saving current flow...')
  } catch (error) {
    console.error('Failed to save flow:', error)
  }
}

function exportCurrentFlow() {
  try {
    // Emit event to FlowEditor component
    window.dispatchEvent(new CustomEvent('flow-editor:export-flow'))
    console.log('Exporting current flow...')
  } catch (error) {
    console.error('Failed to export flow:', error)
  }
}

function toggleToolbarVisibility() {
  try {
    // Emit event to show/hide toolbar
    window.dispatchEvent(new CustomEvent('flow-editor:toggle-toolbar'))
    console.log('Toggling toolbar visibility...')
  } catch (error) {
    console.error('Failed to toggle toolbar:', error)
  }
}

function resetFlowEditor() {
  try {
    // Emit event to reset FlowEditor
    window.dispatchEvent(new CustomEvent('flow-editor:reset'))
    console.log('Resetting flow editor...')
  } catch (error) {
    console.error('Failed to reset flow editor:', error)
  }
}

// Lifecycle
onMounted(() => {
  // Update time every minute
  setInterval(() => {
    lastUpdateTime.value = new Date().toLocaleTimeString()
  }, 60000)

  // Start health polling
  startHealthPolling()
})

onUnmounted(() => {
  // Stop health polling when component unmounts
  stopHealthPolling()
})
</script>

<style lang="scss" scoped>
.q-toolbar {
  min-height: 64px;
}

.q-drawer {
  .q-item {
    border-radius: 8px;
    margin: 2px 8px;
    
    &.q-router-link--exact-active {
      font-weight: 600;
    }
  }
}

.q-expansion-item {
  .q-item {
    margin: 1px 4px;
  }
}
</style>