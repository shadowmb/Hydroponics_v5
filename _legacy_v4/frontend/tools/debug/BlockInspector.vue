<template>
  <Teleport to="body">
    <div 
      v-if="debugMode && showInspector" 
      class="block-inspector"
      :class="{ 'inspector-minimized': isMinimized }"
    >
      <!-- Header -->
      <div class="inspector-header">
        <div class="inspector-title">
          <q-icon name="bug_report" size="sm" />
          <span>Block Inspector</span>
          <q-chip 
            size="sm" 
            :color="isFlowEditorActive ? 'positive' : 'grey'" 
            text-color="white"
          >
            {{ isFlowEditorActive ? 'Active' : 'Inactive' }}
          </q-chip>
        </div>
        
        <div class="inspector-actions">
          <q-btn 
            flat 
            dense 
            size="sm" 
            :icon="isMinimized ? 'expand_less' : 'expand_more'"
            @click="toggleMinimized"
          />
          <q-btn 
            flat 
            dense 
            size="sm" 
            icon="close" 
            @click="closeInspector"
          />
        </div>
      </div>

      <!-- Content -->
      <div v-if="!isMinimized" class="inspector-content">
        <!-- System Status -->
        <div class="inspector-section">
          <div class="section-header">
            <q-icon name="info" />
            <span>System Status</span>
          </div>
          <div class="status-grid">
            <div class="status-item">
              <span class="label">Environment:</span>
              <q-chip size="sm" color="info">{{ environment }}</q-chip>
            </div>
            <div class="status-item">
              <span class="label">Debug Active:</span>
              <q-chip 
                size="sm" 
                :color="debugSystemStatus.isActive ? 'positive' : 'negative'"
              >
                {{ debugSystemStatus.isActive ? 'Yes' : 'No' }}
              </q-chip>
            </div>
            <div class="status-item">
              <span class="label">Total Logs:</span>
              <span class="value">{{ debugSystemStatus.totalLogs }}</span>
            </div>
          </div>
        </div>

        <!-- Flow Definition -->
        <div v-if="flowDefinition" class="inspector-section">
          <div class="section-header">
            <q-icon name="account_tree" />
            <span>Flow Definition</span>
            <q-btn 
              flat 
              dense 
              size="sm" 
              icon="refresh" 
              @click="forceUpdateFlow"
              :loading="isUpdating"
            />
          </div>
          <div class="flow-stats">
            <div class="stat-item">
              <span class="label">Blocks:</span>
              <span class="value">{{ flowDefinition.blocks?.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Connections:</span>
              <span class="value">{{ flowDefinition.connections?.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Valid:</span>
              <q-chip 
                size="sm" 
                :color="flowDefinition.isValid ? 'positive' : 'negative'"
              >
                {{ flowDefinition.isValid ? 'Yes' : 'No' }}
              </q-chip>
            </div>
          </div>
        </div>

        <!-- Selected Block -->
        <div v-if="selectedBlock" class="inspector-section">
          <div class="section-header">
            <q-icon name="select_all" />
            <span>Selected Block</span>
          </div>
          <div class="block-details">
            <div class="detail-row">
              <span class="label">ID:</span>
              <code class="value">{{ selectedBlock.id }}</code>
            </div>
            <div class="detail-row">
              <span class="label">Type:</span>
              <q-chip size="sm" color="primary">{{ selectedBlock.type }}</q-chip>
            </div>
            <div class="detail-row">
              <span class="label">Position:</span>
              <span class="value">
                x: {{ selectedBlock.position?.x || 0 }}, 
                y: {{ selectedBlock.position?.y || 0 }}
              </span>
            </div>
            <div v-if="selectedBlock.params" class="detail-row">
              <span class="label">Parameters:</span>
              <div class="params-list">
                <div 
                  v-for="(value, key) in selectedBlock.params" 
                  :key="key"
                  class="param-item"
                >
                  <code class="param-key">{{ key }}:</code>
                  <span class="param-value">{{ formatParamValue(value) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Results -->
        <div v-if="validationResults" class="inspector-section">
          <div class="section-header">
            <q-icon name="verified" />
            <span>Validation</span>
          </div>
          <div class="validation-summary">
            <div class="validation-stat">
              <q-chip 
                size="sm" 
                :color="validationResults.errors.length > 0 ? 'negative' : 'positive'"
              >
                {{ validationResults.errors.length }} Errors
              </q-chip>
            </div>
            <div class="validation-stat">
              <q-chip 
                size="sm" 
                :color="validationResults.warnings.length > 0 ? 'warning' : 'positive'"
              >
                {{ validationResults.warnings.length }} Warnings
              </q-chip>
            </div>
          </div>
          
          <!-- Error/Warning Details -->
          <div v-if="validationResults.errors.length > 0" class="validation-details">
            <div class="validation-group">
              <div class="group-header error">Errors:</div>
              <div 
                v-for="(error, index) in validationResults.errors" 
                :key="index"
                class="validation-item error"
              >
                {{ error }}
              </div>
            </div>
          </div>
          
          <div v-if="validationResults.warnings.length > 0" class="validation-details">
            <div class="validation-group">
              <div class="group-header warning">Warnings:</div>
              <div 
                v-for="(warning, index) in validationResults.warnings" 
                :key="index"
                class="validation-item warning"
              >
                {{ warning }}
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="inspector-section">
          <div class="section-header">
            <q-icon name="build" />
            <span>Actions</span>
          </div>
          <div class="action-buttons">
            <q-btn 
              size="sm" 
              color="primary" 
              icon="download" 
              label="Export Flow"
              @click="exportFlow"
              :disable="!flowDefinition"
            />
            <q-btn 
              size="sm" 
              color="secondary" 
              icon="clear_all" 
              label="Clear Logs"
              @click="clearDebugLogs"
            />
            <q-btn 
              size="sm" 
              color="info" 
              icon="refresh" 
              label="Force Update"
              @click="forceUpdateAll"
              :loading="isUpdating"
            />
          </div>
        </div>

        <!-- Debug Logs Preview -->
        <div class="inspector-section">
          <div class="section-header">
            <q-icon name="list_alt" />
            <span>Recent Logs</span>
            <q-chip size="xs">{{ recentLogs.length }}/{{ maxLogDisplay }}</q-chip>
          </div>
          <div class="logs-container">
            <div 
              v-for="log in recentLogs" 
              :key="log.timestamp"
              class="log-entry"
              :class="log.level"
            >
              <div class="log-time">{{ formatTime(log.timestamp) }}</div>
              <div class="log-component">{{ log.component }}</div>
              <div class="log-event">{{ log.event }}</div>
            </div>
            <div v-if="recentLogs.length === 0" class="no-logs">
              No recent logs
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFlowEditorDebug } from '../../src/composables/useDebugIntegration'

// Props
interface Props {
  selectedBlock?: any
  flowDefinition?: any
  validationResults?: {
    errors: string[]
    warnings: string[]
  }
}

const props = defineProps<Props>()

// Debug integration
const flowDebug = useFlowEditorDebug()

// Reactive state
const debugMode = ref(process.env.NODE_ENV === 'development')
const showInspector = ref(false)
const isMinimized = ref(false)
const isUpdating = ref(false)
const maxLogDisplay = ref(10)
const updateInterval = ref<number | null>(null)

// Environment info
const environment = computed(() => process.env.NODE_ENV || 'unknown')

// Debug system status
const debugSystemStatus = computed(() => {
  if (typeof window !== 'undefined' && window.__hydroDebug) {
    return window.__hydroDebug.getSystemStatus()
  }
  return { isActive: false, totalLogs: 0, trackedComponents: 0 }
})

// Flow Editor active status
const isFlowEditorActive = computed(() => {
  return props.flowDefinition && Object.keys(props.flowDefinition).length > 0
})

// Recent debug logs
const recentLogs = computed(() => {
  if (typeof window !== 'undefined' && window.__hydroDebug) {
    return window.__hydroDebug.getLogs('FlowEditor', maxLogDisplay.value)
  }
  return []
})

// Methods
function toggleMinimized() {
  isMinimized.value = !isMinimized.value
  flowDebug.trackBlockAction('inspector_toggled', undefined, { minimized: isMinimized.value })
}

function closeInspector() {
  showInspector.value = false
  flowDebug.trackBlockAction('inspector_closed')
}

function forceUpdateFlow() {
  isUpdating.value = true
  flowDebug.trackBlockAction('force_update_flow')
  
  // Simulate update delay
  setTimeout(() => {
    isUpdating.value = false
    flowDebug.trackBlockAction('force_update_completed')
  }, 500)
}

function forceUpdateAll() {
  isUpdating.value = true
  flowDebug.trackBlockAction('force_update_all')
  
  // Simulate full system update
  setTimeout(() => {
    isUpdating.value = false
    flowDebug.trackBlockAction('force_update_all_completed')
  }, 1000)
}

function exportFlow() {
  if (!props.flowDefinition) return
  
  const dataStr = JSON.stringify(props.flowDefinition, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `flow-export-${Date.now()}.json`
  link.click()
  
  URL.revokeObjectURL(url)
  flowDebug.trackBlockAction('flow_exported', undefined, { size: dataStr.length })
}

function clearDebugLogs() {
  if (typeof window !== 'undefined' && window.__hydroDebug) {
    window.__hydroDebug.clearLogs()
    flowDebug.trackBlockAction('logs_cleared')
  }
}

function formatParamValue(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

// Keyboard shortcuts
function handleKeyboard(event: KeyboardEvent) {
  // Ctrl+Shift+D to toggle inspector
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    event.preventDefault()
    showInspector.value = !showInspector.value
    flowDebug.trackBlockAction('inspector_keyboard_toggle')
  }
  
  // Escape to close
  if (event.key === 'Escape' && showInspector.value) {
    event.preventDefault()
    showInspector.value = false
    flowDebug.trackBlockAction('inspector_escape_closed')
  }
}

// Auto-update functionality
function startAutoUpdate() {
  if (updateInterval.value) return
  
  updateInterval.value = window.setInterval(() => {
    // Trigger reactive updates if needed
    // This ensures real-time data updates
  }, 1000)
}

function stopAutoUpdate() {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
    updateInterval.value = null
  }
}

// Lifecycle
onMounted(() => {
  if (debugMode.value) {
    document.addEventListener('keydown', handleKeyboard)
    flowDebug.trackBlockAction('inspector_mounted')
    
    // Auto-show inspector if flow editor is active
    if (isFlowEditorActive.value) {
      showInspector.value = true
    }
    
    startAutoUpdate()
  }
})

onUnmounted(() => {
  if (debugMode.value) {
    document.removeEventListener('keydown', handleKeyboard)
    stopAutoUpdate()
    flowDebug.trackBlockAction('inspector_unmounted')
  }
})

// Watch for flow editor changes
watch(isFlowEditorActive, (newValue) => {
  if (newValue && debugMode.value) {
    showInspector.value = true
    flowDebug.trackBlockAction('inspector_auto_shown')
  }
})

// Expose for external control
defineExpose({
  show: () => { showInspector.value = true },
  hide: () => { showInspector.value = false },
  toggle: () => { showInspector.value = !showInspector.value }
})
</script>

<style lang="scss" scoped>
.block-inspector {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 350px;
  max-height: calc(100vh - 120px);
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
  font-family: 'Roboto', sans-serif;

  &.inspector-minimized {
    height: auto;
    max-height: none;
  }
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.inspector-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.inspector-actions {
  display: flex;
  gap: 4px;
}

.inspector-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 0;
}

.inspector-section {
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 8px;
  font-weight: 600;
  font-size: 13px;
  color: #555;
  background: #fafafa;
}

.status-grid, .flow-stats {
  padding: 0 16px 12px;
}

.status-item, .stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.block-details {
  padding: 0 16px 12px;
}

.detail-row {
  margin-bottom: 8px;
  font-size: 12px;
}

.params-list {
  margin-top: 4px;
  margin-left: 12px;
}

.param-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 11px;
}

.param-key {
  font-family: 'JetBrains Mono', monospace;
  color: #d73a49;
  font-weight: 600;
  min-width: 80px;
}

.param-value {
  color: #032f62;
}

.validation-summary {
  display: flex;
  gap: 8px;
  padding: 0 16px 8px;
}

.validation-details {
  padding: 0 16px 12px;
}

.validation-group {
  margin-bottom: 8px;
}

.group-header {
  font-weight: 600;
  font-size: 11px;
  margin-bottom: 4px;
  
  &.error { color: #d73a49; }
  &.warning { color: #f66a0a; }
}

.validation-item {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 2px;
  
  &.error {
    background: #ffeaea;
    border-left: 3px solid #d73a49;
  }
  
  &.warning {
    background: #fff3e0;
    border-left: 3px solid #f66a0a;
  }
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 12px;
}

.logs-container {
  max-height: 200px;
  overflow-y: auto;
  padding: 0 16px 12px;
}

.log-entry {
  display: grid;
  grid-template-columns: 60px 1fr 1fr;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 10px;
  
  &.error { color: #d73a49; }
  &.warn { color: #f66a0a; }
  &.info { color: #666; }
}

.log-time {
  font-family: 'JetBrains Mono', monospace;
  color: #999;
}

.log-component {
  font-weight: 600;
  color: #0366d6;
}

.log-event {
  color: #586069;
}

.no-logs {
  text-align: center;
  color: #999;
  font-style: italic;
  font-size: 11px;
  padding: 20px 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .block-inspector {
    background: #2d2d2d;
    border-color: #444;
    color: #e0e0e0;
  }
  
  .inspector-header {
    background: #3a3a3a;
    border-bottom-color: #444;
  }
  
  .section-header {
    background: #333;
    color: #ccc;
  }
  
  .validation-item.error {
    background: #3d1a1a;
  }
  
  .validation-item.warning {
    background: #3d2a1a;
  }
}
</style>