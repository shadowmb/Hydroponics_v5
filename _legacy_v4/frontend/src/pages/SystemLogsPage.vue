<template>
  <q-page class="system-logs-page q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Header -->
      <div class="col-12">
        <div class="row items-center justify-between">
          <h4 class="q-ma-none">📝 System Logs</h4>
          <div class="row q-gutter-sm">
            <q-btn
              :color="isLive ? 'positive' : 'grey'"
              :icon="isLive ? 'play_circle' : 'pause_circle'"
              :label="isLive ? 'Live' : 'Paused'"
              size="sm"
              @click="toggleLive"
            />
            <q-btn
              color="negative"
              icon="clear_all"
              label="Clear Memory"
              size="sm"
              @click="clearMemoryLogs"
            />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="col-12">
        <q-card flat bordered class="q-pa-md">
          <!-- Primary Filters Row -->
          <div class="row q-col-gutter-md items-end q-mb-md">
            <div class="col-md-2 col-6">
              <q-select
                v-model="filters.level"
                :options="levelOptions"
                label="Level"
                multiple
                emit-value
                map-options
                use-chips
                clearable
                dense
              />
            </div>
            <div class="col-md-2 col-6">
              <q-select
                v-model="filters.category"
                :options="categoryOptions"
                label="Category"
                multiple
                emit-value
                map-options
                use-chips
                clearable
                dense
              />
            </div>
            <div class="col-md-2 col-6">
              <q-select
                v-model="filters.severity"
                :options="severityOptions"
                label="Severity"
                multiple
                emit-value
                map-options
                use-chips
                clearable
                dense
              />
            </div>
            <div class="col-md-2 col-6">
              <q-input
                v-model="filters.operation"
                label="Operation"
                clearable
                dense
                placeholder="Filter by operation..."
              />
            </div>
            <div class="col-md-2 col-6">
              <q-select
                v-model="filters.source"
                :options="sourceOptions"
                label="Source"
                emit-value
                map-options
                dense
              />
            </div>
            <div class="col-md-2 col-6">
              <q-input
                v-model.number="filters.limit"
                type="number"
                label="Limit"
                min="10"
                max="1000"
                dense
              />
            </div>
          </div>

          <!-- Secondary Filters Row -->
          <div class="row q-col-gutter-md items-end">
            <div class="col-md-2 col-6">
              <q-select
                v-model="filters.tag"
                :options="tagFilterOptions"
                label="Tag"
                clearable
                dense
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                @filter="filterTagOptions"
              />
            </div>
            <div class="col-md-2 col-6">
              <q-select
                v-model="filters.module"
                :options="moduleFilterOptions"
                label="Module"
                clearable
                dense
                use-input
                hide-selected
                fill-input
                input-debounce="0"
                @filter="filterModuleOptions"
              />
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                icon="refresh"
                label="Refresh"
                @click="loadLogs"
                :loading="isLoading"
                dense
              />
            </div>
            <div class="col-auto">
              <q-btn
                color="grey-7"
                icon="clear"
                label="Clear Filters"
                @click="clearAllFilters"
                dense
                flat
              />
            </div>
          </div>

          <!-- Quick Filter Buttons -->
          <div class="row q-col-gutter-sm q-mt-md">
            <div class="col-auto">
              <q-chip
                clickable
                color="blue"
                text-color="white"
                icon="device_hub"
                @click="setQuickFilter('device')"
                :outline="!quickFilters.device"
              >
                Device
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip
                clickable
                color="green"
                text-color="white"
                icon="sensors"
                @click="setQuickFilter('sensor')"
                :outline="!quickFilters.sensor"
              >
                Sensor
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip
                clickable
                color="purple"
                text-color="white"
                icon="account_tree"
                @click="setQuickFilter('flow')"
                :outline="!quickFilters.flow"
              >
                Flow
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip
                clickable
                color="orange"
                text-color="white"
                icon="settings"
                @click="setQuickFilter('system')"
                :outline="!quickFilters.system"
              >
                System
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip
                clickable
                color="teal"
                text-color="white"
                icon="control_camera"
                @click="setQuickFilter('controller')"
                :outline="!quickFilters.controller"
              >
                Controller
              </q-chip>
            </div>
            <div class="col-auto">
              <q-chip
                clickable
                color="red"
                text-color="white"
                icon="error"
                @click="setQuickFilter('error')"
                :outline="!quickFilters.error"
              >
                Errors Only
              </q-chip>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Stats -->
      <div class="col-12">
        <div class="row q-col-gutter-sm">
          <div class="col-3">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h6">{{ stats.memoryEntries || 0 }}</div>
              <div class="text-caption">Memory Entries</div>
            </q-card>
          </div>
          <div class="col-3">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h6">{{ stats.databaseEntries || 0 }}</div>
              <div class="text-caption">Database Entries</div>
            </q-card>
          </div>
          <div class="col-3">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h6">{{ filteredLogs.length }}</div>
              <div class="text-caption">Displayed</div>
            </q-card>
          </div>
          <div class="col-3">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h6">{{ stats.memoryUsage || 'N/A' }}</div>
              <div class="text-caption">Memory Usage</div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Log Viewer -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section class="q-pa-none">
            <div class="log-viewer" ref="logViewer">
              <div
                v-for="(log, index) in displayedLogs"
                :key="`${log.timestamp}-${index}`"
                :class="getLogClass(log)"
                class="log-entry q-pa-sm border-bottom"
              >
                <div class="row items-center q-gutter-sm">
                  <!-- Level Icon -->
                  <div class="col-auto">
                    <q-icon
                      :name="getLogIcon(log.level)"
                      :color="getLogColor(log.level)"
                      size="md"
                      :title="log.level.toUpperCase()"
                    />
                  </div>

                  <!-- Category Badge -->
                  <div class="col-auto" v-if="getLogCategory(log)">
                    <q-badge
                      :color="getCategoryColor(getLogCategory(log))"
                      :label="getLogCategory(log)"
                      rounded
                      class="text-caption"
                    />
                  </div>

                  <!-- Severity Indicator -->
                  <div class="col-auto" v-if="getLogSeverity(log)">
                    <q-icon
                      :name="getSeverityIcon(getLogSeverity(log))"
                      :color="getSeverityColor(getLogSeverity(log))"
                      size="sm"
                      :title="`Severity: ${getLogSeverity(log)}`"
                    />
                  </div>

                  <!-- Tag -->
                  <div class="col-auto">
                    <span class="log-tag text-body2 text-weight-medium">{{ log.tag }}</span>
                  </div>

                  <!-- Source Location -->
                  <div class="col-auto" v-if="getSourceLocation(log)">
                    <q-chip
                      dense
                      size="sm"
                      color="grey-3"
                      text-color="grey-8"
                      icon="code"
                      clickable
                      :label="getSourceLocation(log)"
                      class="source-location-chip"
                      @click="copyToClipboard(getSourceLocation(log) || '')"
                      :title="`Click to copy: ${getSourceLocation(log)}`"
                    />
                  </div>

                  <!-- Log Data -->
                  <div class="col">
                    <div class="log-data">
                      <pre v-if="typeof log.data === 'object'" class="q-ma-none">{{ JSON.stringify(log.data, null, 2) }}</pre>
                      <span v-else>{{ log.data }}</span>
                    </div>

                    <!-- Business Context Preview -->
                    <div v-if="log.context?.business" class="q-mt-xs">
                      <q-chip
                        dense
                        size="sm"
                        color="blue-grey-2"
                        text-color="blue-grey-8"
                        :label="log.context.business.operation"
                        icon="business"
                        class="business-context-chip"
                      />
                    </div>
                  </div>

                  <div class="col-auto">
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      :icon="expandedLogs.includes(index) ? 'expand_less' : 'expand_more'"
                      @click="toggleLogDetails(index)"
                      :title="expandedLogs.includes(index) ? 'Hide details' : 'Show details'"
                    />
                  </div>
                </div>
                
                <!-- Expandable details -->
                <div v-if="expandedLogs.includes(index)" class="q-mt-sm q-pl-md">
                  <q-separator class="q-mb-sm" />

                  <!-- Basic Metadata -->
                  <div class="row q-gutter-md q-mb-sm">
                    <div class="col-auto">
                      <div class="text-caption text-grey-7">Time:</div>
                      <div class="text-caption">{{ formatTimestamp(log.timestamp) }}</div>
                    </div>
                    <div class="col-auto">
                      <div class="text-caption text-grey-7">Level:</div>
                      <div class="text-caption">{{ log.level.toUpperCase() }}</div>
                    </div>
                    <div class="col-auto">
                      <div class="text-caption text-grey-7">Module:</div>
                      <div class="text-caption">{{ log.module }}</div>
                    </div>
                    <div class="col-auto">
                      <div class="text-caption text-grey-7">Storage:</div>
                      <div class="text-caption">{{ log.storage }}</div>
                    </div>
                  </div>

                  <!-- Source Location Details -->
                  <div v-if="log.context?.source" class="q-mb-sm">
                    <div class="text-caption text-grey-7 q-mb-xs">Source Location:</div>
                    <q-card flat bordered class="q-pa-sm bg-grey-1">
                      <div class="row q-gutter-sm">
                        <div class="col-auto">
                          <q-chip dense size="sm" color="blue" text-color="white" icon="description">
                            {{ log.context.source.file }}
                          </q-chip>
                        </div>
                        <div class="col-auto" v-if="log.context.source.method">
                          <q-chip dense size="sm" color="green" text-color="white" icon="function">
                            {{ log.context.source.method }}
                          </q-chip>
                        </div>
                        <div class="col-auto" v-if="log.context.source.line">
                          <q-chip dense size="sm" color="orange" text-color="white" icon="format_list_numbered">
                            Line {{ log.context.source.line }}
                          </q-chip>
                        </div>
                      </div>
                    </q-card>
                  </div>

                  <!-- Business Context Details -->
                  <div v-if="log.context?.business" class="q-mb-sm">
                    <div class="text-caption text-grey-7 q-mb-xs">Business Context:</div>
                    <q-card flat bordered class="q-pa-sm" :class="getBusinessContextClass(log.context.business.severity)">
                      <div class="row q-gutter-sm items-center">
                        <div class="col-auto">
                          <q-chip
                            dense
                            size="sm"
                            :color="getCategoryColor(log.context.business.category)"
                            text-color="white"
                            :icon="getCategoryIcon(log.context.business.category)"
                          >
                            {{ log.context.business.category }}
                          </q-chip>
                        </div>
                        <div class="col-auto">
                          <q-chip dense size="sm" color="blue-grey" text-color="white" icon="work">
                            {{ log.context.business.operation }}
                          </q-chip>
                        </div>
                        <div class="col-auto" v-if="log.context.business.severity">
                          <q-chip
                            dense
                            size="sm"
                            :color="getSeverityColor(log.context.business.severity)"
                            text-color="white"
                            :icon="getSeverityIcon(log.context.business.severity)"
                          >
                            {{ log.context.business.severity }}
                          </q-chip>
                        </div>
                      </div>
                    </q-card>
                  </div>

                  <!-- Additional Context -->
                  <div v-if="hasAdditionalContext(log)" class="q-mt-sm">
                    <div class="text-caption text-grey-7 q-mb-xs">Additional Context:</div>
                    <q-expansion-item dense icon="more_horiz" label="Show additional context data">
                      <q-card flat bordered class="q-pa-sm bg-grey-1">
                        <pre class="text-caption">{{ JSON.stringify(getAdditionalContext(log), null, 2) }}</pre>
                      </q-card>
                    </q-expansion-item>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="displayedLogs.length === 0" class="text-center q-pa-xl text-grey-6">
                <q-icon name="assignment" size="3rem" class="q-mb-md" />
                <div class="text-h6">No logs found</div>
                <div class="text-body2">Try adjusting your filters or check if logging is enabled</div>
              </div>

              <!-- Loading state -->
              <div v-if="isLoading" class="text-center q-pa-xl">
                <q-spinner size="2rem" color="primary" />
                <div class="q-mt-md">Loading logs...</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { loggingService, type LogEntry, type LogFilter, type StorageStats } from '../services/loggingService'

// Reactive data
const logs = ref<LogEntry[]>([])
const stats = ref<StorageStats>({
  memoryEntries: 0,
  databaseEntries: 0,
  memoryUsage: '0 B'
})

const isLoading = ref(false)
const isLive = ref(false)
const expandedLogs = ref<number[]>([])
const logViewer = ref<HTMLElement>()

// Filters
const filters = ref<LogFilter & { source: string }>({
  level: [],
  tag: '',
  module: '',
  source: 'all',
  limit: 100,
  category: [],
  severity: [],
  operation: ''
})

// Quick filters state
const quickFilters = ref({
  device: false,
  sensor: false,
  flow: false,
  system: false,
  controller: false,
  error: false
})

// Options
const levelOptions = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Analytics', value: 'analytics' }
]

const categoryOptions = [
  { label: 'Device', value: 'device' },
  { label: 'Sensor', value: 'sensor' },
  { label: 'Flow', value: 'flow' },
  { label: 'System', value: 'system' },
  { label: 'Controller', value: 'controller' },
  { label: 'Network', value: 'network' }
]

const severityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]

const sourceOptions = [
  { label: 'All Sources', value: 'all' },
  { label: 'Memory Only', value: 'memory' },
  { label: 'Database Only', value: 'database' }
]

// Computed
const availableTags = computed(() => {
  const tags = Array.from(new Set(logs.value.map(log => log.tag)))
  return [
    { label: 'All Tags', value: '' },
    ...tags.map(tag => ({ label: tag, value: tag }))
  ].sort((a, b) => a.label.localeCompare(b.label))
})

const availableModules = computed(() => {
  const modules = Array.from(new Set(logs.value.map(log => log.module)))
  return [
    { label: 'All Modules', value: '' },
    ...modules.map(module => ({ label: module, value: module }))
  ].sort((a, b) => a.label.localeCompare(b.label))
})

const filteredLogs = computed(() => {
  let filtered = [...logs.value]

  // Apply client-side filters for real-time logs
  if (filters.value.level && filters.value.level.length > 0) {
    filtered = filtered.filter(log => filters.value.level!.includes(log.level))
  }

  if (filters.value.tag) {
    const tagValue = typeof filters.value.tag === 'object' && 'value' in filters.value.tag ? filters.value.tag.value : filters.value.tag
    if (tagValue) {
      filtered = filtered.filter(log => log.tag === tagValue)
    }
  }

  if (filters.value.module) {
    const moduleValue = typeof filters.value.module === 'object' && 'value' in filters.value.module ? filters.value.module.value : filters.value.module
    if (moduleValue) {
      filtered = filtered.filter(log => log.module === moduleValue)
    }
  }

  // Category filtering
  if (filters.value.category && filters.value.category.length > 0) {
    filtered = filtered.filter(log => {
      const category = loggingService.parseTagCategory(log.tag) || log.context?.business?.category
      return category && filters.value.category!.includes(category)
    })
  }

  // Severity filtering
  if (filters.value.severity && filters.value.severity.length > 0) {
    filtered = filtered.filter(log => {
      const severity = log.context?.business?.severity
      return severity && filters.value.severity!.includes(severity)
    })
  }

  // Operation filtering
  if (filters.value.operation) {
    filtered = filtered.filter(log => {
      const operation = log.context?.business?.operation
      return operation && operation.toLowerCase().includes(filters.value.operation!.toLowerCase())
    })
  }

  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const displayedLogs = computed(() => {
  return filteredLogs.value.slice(0, filters.value.limit || 100)
})

// Methods
async function loadLogs(): Promise<void> {
  isLoading.value = true
  try {
    const result = await loggingService.getLogs({
      level: filters.value.level?.length ? filters.value.level : undefined,
      tag: (typeof filters.value.tag === 'object' && 'value' in filters.value.tag && filters.value.tag.value) || (typeof filters.value.tag === 'string' ? filters.value.tag : undefined),
      module: (typeof filters.value.module === 'object' && 'value' in filters.value.module && filters.value.module.value) || (typeof filters.value.module === 'string' ? filters.value.module : undefined),
      limit: filters.value.limit,
      source: filters.value.source,
      category: filters.value.category?.length ? filters.value.category : undefined,
      severity: filters.value.severity?.length ? filters.value.severity : undefined,
      operation: filters.value.operation || undefined
    })

    logs.value = result.logs
  } catch (error) {
    console.error('Failed to load logs:', error)
  } finally {
    isLoading.value = false
  }
}

async function loadStats(): Promise<void> {
  try {
    stats.value = await loggingService.getStats()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

async function clearMemoryLogs(): Promise<void> {
  try {
    await loggingService.clearMemoryLogs()
    await loadLogs()
    await loadStats()
  } catch (error) {
    console.error('Failed to clear memory logs:', error)
  }
}

function toggleLive(): void {
  isLive.value = !isLive.value
  
  if (isLive.value) {
    loggingService.subscribeToLiveLogs(handleNewLogEntry)
  } else {
    loggingService.unsubscribeFromLiveLogs()
  }
}

function handleNewLogEntry(logEntry: LogEntry): void {
  // Add new log entry to the beginning
  logs.value.unshift(logEntry)
  
  // Keep only the latest entries to prevent memory issues
  if (logs.value.length > (filters.value.limit || 100) * 2) {
    logs.value = logs.value.slice(0, filters.value.limit || 100)
  }
  
  // Auto-scroll to top if viewing live logs
  nextTick(() => {
    if (logViewer.value) {
      logViewer.value.scrollTop = 0
    }
  })
}

function toggleLogDetails(index: number): void {
  const expandedIndex = expandedLogs.value.indexOf(index)
  if (expandedIndex > -1) {
    expandedLogs.value.splice(expandedIndex, 1)
  } else {
    expandedLogs.value.push(index)
  }
}

// For tag filtering - need to maintain original list
const tagFilterOptions = ref(availableTags.value)
const moduleFilterOptions = ref(availableModules.value)

// Watch for changes in available tags and modules
watch(availableTags, (newTags) => {
  tagFilterOptions.value = newTags
}, { immediate: true })

watch(availableModules, (newModules) => {
  moduleFilterOptions.value = newModules
}, { immediate: true })

function filterTagOptions(val: string, update: (fn: () => void) => void): void {
  update(() => {
    if (val === '') {
      tagFilterOptions.value = availableTags.value
      return
    }
    
    const needle = val.toLowerCase()
    tagFilterOptions.value = availableTags.value.filter(
      option => option.label.toLowerCase().indexOf(needle) > -1
    )
  })
}

function filterModuleOptions(val: string, update: (fn: () => void) => void): void {
  update(() => {
    if (val === '') {
      moduleFilterOptions.value = availableModules.value
      return
    }
    
    const needle = val.toLowerCase()
    moduleFilterOptions.value = availableModules.value.filter(
      option => option.label.toLowerCase().indexOf(needle) > -1
    )
  })
}

function getLogIcon(level: string): string {
  switch (level) {
    case 'debug': return 'bug_report'
    case 'info': return 'info'
    case 'warn': return 'warning'
    case 'error': return 'error'
    case 'analytics': return 'analytics'
    default: return 'circle'
  }
}

function getLogColor(level: string): string {
  switch (level) {
    case 'debug': return 'blue-grey'
    case 'info': return 'blue'
    case 'warn': return 'orange'
    case 'error': return 'red'
    case 'analytics': return 'purple'
    default: return 'grey'
  }
}

function getLogClass(log: LogEntry): string {
  const baseClass = 'log-entry'
  const levelClass = `log-level-${log.level}`
  return `${baseClass} ${levelClass}`
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

function getLogCategory(log: LogEntry): string | null {
  return loggingService.parseTagCategory(log.tag) || log.context?.business?.category || null
}

function getLogSeverity(log: LogEntry): string | null {
  return log.context?.business?.severity || null
}

function getSourceLocation(log: LogEntry): string | null {
  return loggingService.getSourceLocation(log)
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'device': return 'blue'
    case 'sensor': return 'green'
    case 'flow': return 'purple'
    case 'system': return 'orange'
    case 'controller': return 'teal'
    case 'network': return 'indigo'
    case 'recovery': return 'red'
    default: return 'grey'
  }
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'device': return 'device_hub'
    case 'sensor': return 'sensors'
    case 'flow': return 'account_tree'
    case 'system': return 'settings'
    case 'controller': return 'control_camera'
    case 'network': return 'network_check'
    case 'recovery': return 'healing'
    default: return 'help'
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return 'green'
    case 'medium': return 'yellow'
    case 'high': return 'orange'
    case 'critical': return 'red'
    default: return 'grey'
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'low': return 'check_circle'
    case 'medium': return 'warning_amber'
    case 'high': return 'error'
    case 'critical': return 'dangerous'
    default: return 'help'
  }
}

function getBusinessContextClass(severity: string): string {
  switch (severity) {
    case 'low': return 'bg-green-1'
    case 'medium': return 'bg-yellow-1'
    case 'high': return 'bg-orange-1'
    case 'critical': return 'bg-red-1'
    default: return 'bg-grey-1'
  }
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    // Could show a toast notification here
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

function clearAllFilters(): void {
  filters.value = {
    level: [],
    tag: '',
    module: '',
    source: 'all',
    limit: 100,
    category: [],
    severity: [],
    operation: ''
  }

  // Clear quick filters
  Object.keys(quickFilters.value).forEach(key => {
    quickFilters.value[key as keyof typeof quickFilters.value] = false
  })
}

function setQuickFilter(type: string): void {
  const isCurrentlyActive = quickFilters.value[type as keyof typeof quickFilters.value]

  // Reset all quick filters
  Object.keys(quickFilters.value).forEach(key => {
    quickFilters.value[key as keyof typeof quickFilters.value] = false
  })

  // Toggle the selected filter
  quickFilters.value[type as keyof typeof quickFilters.value] = !isCurrentlyActive

  // Apply the filter based on type
  if (!isCurrentlyActive) {
    switch (type) {
      case 'device':
        filters.value.category = ['device']
        break
      case 'sensor':
        filters.value.category = ['sensor']
        break
      case 'flow':
        filters.value.category = ['flow']
        break
      case 'system':
        filters.value.category = ['system']
        break
      case 'controller':
        filters.value.category = ['controller']
        break
      case 'error':
        filters.value.level = ['error']
        filters.value.severity = ['high', 'critical']
        break
    }
  } else {
    // Clear filters when deactivating
    filters.value.category = []
    filters.value.level = []
    filters.value.severity = []
  }
}

function hasAdditionalContext(log: LogEntry): boolean {
  if (!log.context) return false

  // Check for any context beyond source and business
  const { source, business, ...additionalContext } = log.context
  return Object.keys(additionalContext).length > 0
}

function getAdditionalContext(log: LogEntry): any {
  if (!log.context) return {}

  const { source, business, ...additionalContext } = log.context
  return additionalContext
}

// Watchers
watch(() => filters.value, () => {
  if (!isLive.value) {
    loadLogs()
  }
}, { deep: true })

// Lifecycle
// Auto-refresh stats interval
let statsInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  await loadLogs()
  await loadStats()
  
  // Auto-refresh stats every 30 seconds
  statsInterval = setInterval(loadStats, 30000)
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
  loggingService.unsubscribeFromLiveLogs()
})
</script>

<style scoped>
.system-logs-page {
  max-width: 1400px;
  margin: 0 auto;
}

.log-viewer {
  max-height: 600px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-entry {
  transition: background-color 0.2s;
}

.log-entry:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.log-tag {
  font-family: 'Courier New', monospace;
  color: #424242;
}

.log-data {
  font-size: 11px;
}

.log-level-debug {
  border-left: 3px solid #607d8b;
}

.log-level-info {
  border-left: 3px solid #2196f3;
}

.log-level-warn {
  border-left: 3px solid #ff9800;
}

.log-level-error {
  border-left: 3px solid #f44336;
}

.log-level-analytics {
  border-left: 3px solid #9c27b0;
}

.log-timestamp {
  min-width: 80px;
  font-family: monospace;
}

.log-data {
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 11px;
  color: #333;
}

.source-location-chip {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.source-location-chip:hover {
  background-color: #e0e0e0 !important;
}

.business-context-chip {
  font-size: 10px;
  font-weight: 500;
}
</style>