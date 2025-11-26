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

      <!-- Module Content -->
      <div class="module-content">
        <slot>
          <!-- Default content based on visualization type -->
          <div v-if="module.visualizationType === 'number'" class="number-display">
            <div class="row items-center justify-center q-gutter-xs">
              <div class="display-value text-h5 text-weight-bold" :class="valueClass">
                {{ formatValue(currentValue) }}
              </div>
              <div v-if="trendInfo" class="trend-indicator" :class="`text-${trendInfo.color}`">
                {{ trendInfo.icon }}
              </div>
            </div>
          </div>

          <div v-else-if="module.visualizationType === 'gauge'" class="gauge-display">
            <!-- Current value display at top -->
            <div class="text-center gauge-header">
              <div class="row items-center justify-center q-gutter-xs">
                <div class="display-value text-h5" :class="valueClass">
                  {{ formatValue(currentValue) }}
                </div>
                <div v-if="trendInfo" class="trend-indicator" :class="`text-${trendInfo.color}`">
                  {{ trendInfo.icon }}
                </div>
              </div>
              <div class="display-unit text-caption text-grey-6">
                {{ currentUnit }}
              </div>
            </div>
            
            <div class="custom-gauge-container">
              <svg viewBox="0 0 160 110" class="custom-gauge">
                <!-- Background arc -->
                <path 
                  d="M 30 85 A 50 50 0 1 1 130 85" 
                  fill="none" 
                  stroke="#e0e0e0" 
                  stroke-width="20"
                  stroke-linecap="butt"
                />
                
                <!-- Fixed range sectors -->
                <!-- Critical range left (red) - 20% -->
                <path 
                  :d="getFixedSectorPath(0, 20)"
                  fill="none" 
                  stroke="#f44336" 
                  stroke-width="20"
                  stroke-linecap="butt"
                />
                
                <!-- Warning range 1 (orange) - 20% -->
                <path 
                  :d="getFixedSectorPath(20, 40)"
                  fill="none" 
                  stroke="#ff9800" 
                  stroke-width="20"
                  stroke-linecap="butt"
                />
                
                <!-- Optimal range (green) - 40% -->
                <path 
                  :d="getFixedSectorPath(40, 80)"
                  fill="none" 
                  stroke="#4caf50" 
                  stroke-width="20"
                  stroke-linecap="butt"
                />
                
                <!-- Warning range 2 (orange) - 20% -->
                <path 
                  :d="getFixedSectorPath(80, 100)"
                  fill="none" 
                  stroke="#ff9800" 
                  stroke-width="20"
                  stroke-linecap="butt"
                />
                
                <!-- Critical range right (red) - 20% -->
                <path 
                  :d="getFixedSectorPath(100, 120)"
                  fill="none" 
                  stroke="#f44336" 
                  stroke-width="20"
                  stroke-linecap="butt"
                />

                <!-- Dynamic range labels based on user settings -->
                <template v-if="module.ranges?.enabled">
                  <!-- Левия край - критичен минимум -->
                  <text :x="getFixedLabelPosition(0).x" 
                        :y="getFixedLabelPosition(0).y" 
                        text-anchor="middle" 
                        class="gauge-label-text"
                        fill="#f44336">
                    {{ getCriticalMin().toFixed(1) }}
                  </text>
                  
                  <!-- Ляво оранжево-червено граница (warning min) -->
                  <text :x="getFixedLabelPosition(20).x" 
                        :y="getFixedLabelPosition(20).y" 
                        text-anchor="middle" 
                        class="gauge-label-text"
                        fill="#ff9800">
                    {{ getWarningMin().toFixed(1) }}
                  </text>
                  
                  <!-- Ляво оранжево-зелено - оптимален минимум -->
                  <text :x="getFixedLabelPosition(40).x" 
                        :y="getFixedLabelPosition(40).y" 
                        text-anchor="middle" 
                        class="gauge-label-text"
                        fill="#4caf50">
                    {{ module.ranges.optimal.min }}
                  </text>
                  
                  <!-- Център - средна стойност на оптималния диапазон -->
                  <text x="80" y="20" 
                        text-anchor="middle" 
                        class="gauge-label-text"
                        fill="#4caf50">
                    {{ ((module.ranges.optimal.min + module.ranges.optimal.max) / 2).toFixed(1) }}
                  </text>
                  
                  <!-- Дясно зелено-оранжево - оптимален максимум -->
                  <text :x="getFixedLabelPosition(80).x" 
                        :y="getFixedLabelPosition(80).y" 
                        text-anchor="middle" 
                        class="gauge-label-text"
                        fill="#4caf50">
                    {{ module.ranges.optimal.max }}
                  </text>
                  
                  <!-- Дясно оранжево-червено граница (warning max) -->
                  <text :x="getFixedLabelPosition(100).x" 
                        :y="getFixedLabelPosition(100).y" 
                        text-anchor="middle" 
                        class="gauge-label-text"
                        fill="#ff9800">
                    {{ getWarningMax().toFixed(1) }}
                  </text>
                  
                  <!-- Десният край - критичен максимум -->
                  <text :x="getFixedLabelPosition(120).x" 
                        :y="getFixedLabelPosition(120).y" 
                        text-anchor="middle" 
                        class="gauge-label-text"
                        fill="#f44336">
                    {{ getCriticalMax().toFixed(1) }}
                  </text>
                </template>
                
                <!-- Current value indicator (colored dot) -->
                <circle 
                  :cx="getValuePosition(currentValue).x" 
                  :cy="getValuePosition(currentValue).y" 
                  r="4" 
                  fill="white"
                  stroke="#333"
                  stroke-width="2"
                />
                
              </svg>
            </div>
            
            <!-- Trend indicator at bottom -->
            <div v-if="trendInfo" class="text-center gauge-trend">
              <div class="row items-center justify-center q-gutter-xs">
                <div class="trend-indicator text-caption" :class="`text-${trendInfo.color}`">
                  {{ trendInfo.icon }}
                </div>
                <div class="trend-change text-caption" :class="`text-${trendInfo.color}`">
                  {{ trendInfo.changeText }}
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="module.visualizationType === 'gauge-advanced'" class="gauge-advanced-display">
            <!-- Value display -->
            <div class="advanced-gauge-container">
              <svg viewBox="0 0 200 120" class="advanced-gauge">
                <!-- Background arc -->
                <path 
                  d="M 40 100 A 60 60 0 1 1 160 100" 
                  fill="none" 
                  stroke="#f0f0f0" 
                  stroke-width="26"
                  stroke-linecap="butt"
                />
                
                <!-- Dynamic color zones based on optimal range and tolerances -->
                <template v-if="true">
                  <!-- Red zone (critical low) -->
                  <path 
                    :d="getDynamicZonePath('critical-low')"
                    fill="none" 
                    stroke="#e74c3c" 
                    stroke-width="26"
                    stroke-linecap="butt"
                  />
                  
                  <!-- Yellow zone (warning low) -->
                  <path 
                    :d="getDynamicZonePath('warning-low')"
                    fill="none" 
                    stroke="#f39c12" 
                    stroke-width="26"
                    stroke-linecap="butt"
                  />
                  
                  <!-- Green zone (optimal) -->
                  <path 
                    :d="getDynamicZonePath('optimal')"
                    fill="none" 
                    stroke="#27ae60" 
                    stroke-width="26"
                    stroke-linecap="butt"
                  />
                  
                  <!-- Yellow zone (warning high) -->
                  <path 
                    :d="getDynamicZonePath('warning-high')"
                    fill="none" 
                    stroke="#f39c12" 
                    stroke-width="26"
                    stroke-linecap="butt"
                  />
                  
                  <!-- Red zone (critical high) -->
                  <path 
                    :d="getDynamicZonePath('critical-high')"
                    fill="none" 
                    stroke="#e74c3c" 
                    stroke-width="26"
                    stroke-linecap="butt"
                  />
                </template>

                <!-- Scale numbers removed - now shown in zone indicators below -->

                <!-- Dynamic scale ticks -->
                <g stroke="#6d6b6bff" stroke-width="1">
                  <line v-for="tick in generateTicks()" 
                        :key="tick"
                        :x1="getTickPosition(tick).x1" 
                        :y1="getTickPosition(tick).y1"
                        :x2="getTickPosition(tick).x2" 
                        :y2="getTickPosition(tick).y2" />
                </g>

                <!-- Needle -->
                <g v-if="currentValue !== undefined">
                  <line 
                    :x1="100" 
                    :y1="100" 
                    :x2="getNeedleEndX()" 
                    :y2="getNeedleEndY()" 
                    stroke="#2c3e50" 
                    stroke-width="3"
                    stroke-linecap="butt"
                  />
                  <!-- Needle center dot -->
                  <circle cx="100" cy="100" r="4" fill="#2c3e50" />
                </g>
              </svg>
              
              <!-- Current value above gauge -->
              <div class="gauge-center-value">
                <div class="row items-center justify-center q-gutter-xs">
                  <div class="gauge-value">{{ formatValue(currentValue) }}</div>
                  <div v-if="trendInfo" class="trend-indicator" :class="`text-${trendInfo.color}`">
                    {{ trendInfo.icon }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Zone indicators -->
            <div class="zone-indicators">
              <span class="zone-cell critical">
                {{ props.module.customRange?.min ?? 0 }}
              </span>
              <span class="zone-cell warning">
                {{ ((props.module.ranges?.optimal?.min ?? 5.5) - (props.module.ranges?.warningTolerance ?? 0.5)).toFixed(1) }}
              </span>
              <span class="zone-cell optimal">
                {{ (props.module.ranges?.optimal?.min ?? 5.5).toFixed(1) }}-{{ (props.module.ranges?.optimal?.max ?? 6.5).toFixed(1) }}
              </span>
              <span class="zone-cell warning">
                {{ ((props.module.ranges?.optimal?.max ?? 6.5) + (props.module.ranges?.warningTolerance ?? 0.5)).toFixed(1) }}
              </span>
              <span class="zone-cell critical">
                {{ props.module.customRange?.max ?? 14 }}
              </span>
            </div>
          </div>

          <div v-else-if="module.visualizationType === 'status'" class="status-display">
            <div class="row items-center justify-center q-gutter-sm">
              <q-icon 
                :name="getStatusIcon(computedStatus)" 
                :color="getStatusColor(computedStatus)"
                size="md"
              />
              <div class="text-center">
                <div class="row items-center justify-center q-gutter-xs">
                  <div class="text-body2 text-weight-medium">
                    {{ `${formatValue(currentValue)} ${currentUnit}`.trim() }}
                  </div>
                  <div v-if="trendInfo" class="trend-indicator" :class="`text-${trendInfo.color}`">
                    {{ trendInfo.icon }}
                  </div>
                </div>
                <div class="text-caption text-grey-6">{{ getStatusText(computedStatus) }}</div>
              </div>
            </div>
          </div>

          <div v-else-if="module.visualizationType === 'chart'" class="chart-display">
            <div class="mini-chart-placeholder">
              <div class="chart-line"></div>
              <div class="text-caption text-center text-grey-6 q-mt-xs">
                <div class="row items-center justify-center q-gutter-xs">
                  <span>{{ formatValue(currentValue) }} {{ currentUnit.value }}</span>
                  <div v-if="trendInfo" class="trend-indicator" :class="`text-${trendInfo.color}`">
                    {{ trendInfo.icon }}
                  </div>
                </div>
                <div v-if="trendInfo" class="trend-change" :class="`text-${trendInfo.color}`">
                  {{ trendInfo.changeText }}
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="module.visualizationType === 'bar'" class="bar-display">
            <!-- Current value display at top -->
            <div class="text-center bar-header">
              <div class="row items-center justify-center q-gutter-xs">
                <div class="display-value text-h5" :class="valueClass">
                  {{ formatValue(currentValue) }}
                </div>
                <div v-if="trendInfo" class="trend-indicator" :class="`text-${trendInfo.color}`">
                  {{ trendInfo.icon }}
                </div>
              </div>
              <div class="display-unit text-caption text-grey-6">
                {{ currentUnit }}
              </div>
            </div>
            
            <!-- Bar chart fills middle space -->
            <div class="bar-chart-container">
              <div class="bars-wrapper">
                <div 
                  v-for="(dataPoint, index) in getBarData()" 
                  :key="index"
                  class="bar"
                  :style="{ 
                    height: getBarHeight(dataPoint) + '%',
                    width: getBarWidth() + '%'
                  }"
                  :title="formatBarTooltip(dataPoint)"
                  @mouseenter="showBarTooltip = { index, dataPoint }"
                  @mouseleave="showBarTooltip = null"
                >
                </div>
              </div>
            </div>
            
          </div>

          <div v-else-if="module.visualizationType === 'line'" class="line-display">
            <!-- Current value display at top -->
            <div class="text-center line-header">
              <div class="row items-center justify-center q-gutter-xs">
                <div class="display-value text-h5" :class="valueClass">
                  {{ formatValue(currentValue) }}
                </div>
                <div v-if="trendInfo" class="trend-indicator" :class="`text-${trendInfo.color}`">
                  {{ trendInfo.icon }}
                </div>
              </div>
              <div class="display-unit text-caption text-grey-6">
                {{ currentUnit }}
              </div>
            </div>
            
            <!-- Line chart fills middle space -->
            <div class="line-chart-container">
              <svg class="line-chart-svg" viewBox="0 0 200 80" width="100%" height="100%">
                  <!-- Background grid (optional) -->
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#ff5722;stop-opacity:0.3" />
                      <stop offset="100%" style="stop-color:#ff5722;stop-opacity:0.0" />
                    </linearGradient>
                  </defs>
                  
                  <!-- Area under the line -->
                  <path 
                    :d="getLineAreaPath()"
                    fill="url(#lineGradient)"
                    stroke="none"
                  />
                  
                  <!-- Main line -->
                  <path 
                    :d="getLinePath()"
                    fill="none" 
                    stroke="#ff5722" 
                    stroke-width="2"
                    stroke-linecap="butt"
                    stroke-linejoin="round"
                  />
                  
                  <!-- Data points -->
                  <circle
                    v-for="(point, index) in getLinePoints()"
                    :key="index"
                    :cx="point.x"
                    :cy="point.y"
                    r="3"
                    fill="#ff5722"
                    stroke="white"
                    stroke-width="1"
                    :title="formatLineTooltip({ value: point.value, timestamp: point.timestamp })"
                    class="line-point"
                  >
                    <title>{{ formatLineTooltip({ value: point.value, timestamp: point.timestamp }) }}</title>
                  </circle>
                </svg>
              </div>
            
          </div>
        </slot>
      </div>
    </q-card-section>

    <!-- Module Status Indicator -->
    <div 
      class="module-status-indicator" 
      :class="`status--${computedStatus}`"
    ></div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface ModuleData {
  id: string
  name: string
  sectionId: string
  visualizationType: 'number' | 'gauge' | 'gauge-advanced' | 'status' | 'chart' | 'bar' | 'line'
  monitoringData?: {
    tagId: string
    value: number
    timestamp: string
    unit?: string
  }
  // Mock data removed - sensors now use only real monitoringData
  ranges?: {
    enabled: boolean
    optimal: { min: number, max: number }
    warningTolerance?: number
    criticalTolerance?: number
    // Legacy support for old structure
    warning?: { min1: number, max1: number, min2: number, max2: number }
    critical?: { min: number, max: number }
  }
  trend?: {
    enabled: boolean
    toleranceType: 'auto' | 'manual'
    toleranceTagId?: string
    manualTolerance?: number
    previousValue?: number
    currentValue?: number
  }
  barChart?: {
    barCount: 5 | 10 | 15 | 20
    historicalData?: Array<{
      value: number
      timestamp: string | Date
    }>
  }
  lineChart?: {
    pointCount: 5 | 10 | 15 | 20
    historicalData?: Array<{
      value: number
      timestamp: string | Date
    }>
  }
  customRange?: {
    min: number
    max: number
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

// Bar tooltip state
const showBarTooltip = ref<{ index: number, dataPoint: any } | null>(null)

const moduleClass = computed(() => {
  return [
    `module--${props.module.sectionId}`,
    `module--${props.module.visualizationType}`,
    {
      'module--hidden': !props.module.isVisible
    }
  ]
})

// Real data computed properties (priority over mock data)
// Debug logging for gauge troubleshooting
const debugInfo = computed(() => {
  // console.log(`🔍 [DEBUG] Gauge data for module "${props.module.name}":`)
  // console.log('  - monitoringData:', props.module.monitoringData)
  // console.log('  - ranges:', props.module.ranges)
  // console.log('  - ranges.enabled:', props.module.ranges?.enabled)
  // console.log('  - currentValue will be:', props.module.monitoringData?.value ?? 0)
  return true
})

const currentValue = computed(() => {
  debugInfo.value // Trigger debug logging
  return props.module.monitoringData?.value ?? 0
})

const currentUnit = computed(() => {
  // Get unit from monitoring data or determine from tag name
  if (props.module.monitoringData?.unit) {
    return props.module.monitoringData.unit
  }
  
  // Fallback unit determination based on module name
  const moduleName = props.module.name.toLowerCase()
  if (moduleName.includes('ph')) return 'pH'
  if (moduleName.includes('ес') || moduleName.includes('ec')) return 'µS/cm'
  if (moduleName.includes('ниво') || moduleName.includes('level')) return 'cm'
  if (moduleName.includes('влага') || moduleName.includes('moisture')) return '%'
  if (moduleName.includes('temp')) return '°C'
  
  return ''
})

const dataStatus = computed(() => {
  // If no monitoring data, show offline
  if (!props.module.monitoringData?.value && props.module.monitoringData !== undefined) {
    return 'offline'
  }
  return 'normal'
})

const computedStatus = computed(() => {
  // Check data availability first
  if (!currentValue.value || currentValue.value === 0) {
    return dataStatus.value
  }

  // If no ranges enabled, use data status
  if (!props.module.ranges?.enabled) {
    return dataStatus.value
  }

  const value = currentValue.value
  const ranges = props.module.ranges

  // Check if offline or no data
  if (value === null || value === undefined) {
    return 'offline'
  }

  // New simplified logic with tolerance-based ranges
  if (ranges.warningTolerance !== undefined && ranges.criticalTolerance !== undefined) {
    const optMin = ranges.optimal.min
    const optMax = ranges.optimal.max
    const warnTol = ranges.warningTolerance
    const critTol = ranges.criticalTolerance

    // Check critical range (most restrictive)
    if (value < (optMin - critTol) || value > (optMax + critTol)) {
      return 'error'
    }

    // Check optimal range
    if (value >= optMin && value <= optMax) {
      return 'normal'
    }

    // Check warning ranges (between optimal and critical)
    if ((value >= (optMin - warnTol) && value < optMin) || 
        (value > optMax && value <= (optMax + warnTol))) {
      return 'warning'
    }

    // If not in any defined range, consider it warning
    return 'warning'
  }
  
  // Legacy support for old structure
  if (ranges.critical && ranges.warning) {
    // Check critical range (most restrictive)
    if (value < ranges.critical.min || value > ranges.critical.max) {
      return 'error'
    }

    // Check optimal range
    if (value >= ranges.optimal.min && value <= ranges.optimal.max) {
      return 'normal'
    }

    // Check warning ranges
    if ((value >= ranges.warning.min1 && value <= ranges.warning.max1) ||
        (value >= ranges.warning.min2 && value <= ranges.warning.max2)) {
      return 'warning'
    }
  }

  return 'warning'
})

const trendInfo = computed(() => {
  // Skip if trend is not enabled
  if (!props.module.trend?.enabled) {
    return null
  }

  // Use monitoring data as current value, and trend data as previous (if available)
  const current = props.module.monitoringData?.value
  const previous = props.module.trend?.previousValue

  // Debug: console.log(`🔍 [TREND] ${props.module.name}: current=${current}, previous=${previous}`)
  
  // If no current data, don't show trend
  if (!current && current !== 0) {
    return null
  }
  
  // If no previous data, show neutral trend
  if (!previous && previous !== 0) {
    return {
      direction: 'stable',
      icon: '=',
      color: 'grey-6',
      change: 0,
      changeText: 'Няма история'
    }
  }

  const diff = current - previous

  // Get tolerance value
  let tolerance = 0
  if (props.module.trend.toleranceType === 'manual' && props.module.trend.manualTolerance) {
    tolerance = props.module.trend.manualTolerance
  } else if (props.module.trend.toleranceType === 'auto') {
    // Use warning tolerance from ranges if available, otherwise default
    if (props.module.ranges?.warningTolerance !== undefined) {
      tolerance = props.module.ranges.warningTolerance
    } else {
      tolerance = 0.5 // Default fallback
    }
  }

  // Determine trend
  if (Math.abs(diff) <= tolerance) {
    return {
      direction: 'stable',
      icon: '=',
      color: 'grey-6',
      change: 0,
      changeText: '±0'
    }
  } else if (diff > 0) {
    return {
      direction: 'up',
      icon: '↗',
      color: 'positive',
      change: diff,
      changeText: `+${diff.toFixed(2)}`
    }
  } else {
    return {
      direction: 'down',
      icon: '↘',
      color: 'negative',
      change: diff,
      changeText: diff.toFixed(2)
    }
  }
})

const valueClass = computed(() => {
  const status = computedStatus.value
  return {
    'text-positive': status === 'normal',
    'text-warning': status === 'warning', 
    'text-negative': status === 'error',
    'text-grey-5': status === 'offline'
  }
})

function formatValue(value: any): string {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value || '---')
}

function formatTimestamp(timestamp: string | Date): string {
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    // Format: час:минута ден.месец.година (16:35 10.02.25)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2) // Last 2 digits
    
    return `${hours}:${minutes} ${day}.${month}.${year}`
  } catch (error) {
    return 'Invalid Date'
  }
}

function getStatusColor(status: string | undefined): string {
  switch (status) {
    case 'normal': return 'positive'
    case 'warning': return 'warning' 
    case 'error': return 'negative'
    case 'offline': return 'grey-5'
    default: return 'primary'
  }
}

function getStatusIcon(status: string | undefined): string {
  switch (status) {
    case 'normal': return 'check_circle'
    case 'warning': return 'warning'
    case 'error': return 'error'
    case 'offline': return 'offline_bolt'
    default: return 'help'
  }
}

function getStatusText(status: string | undefined): string {
  switch (status) {
    case 'normal': return 'Нормално'
    case 'warning': return 'Внимание'
    case 'error': return 'Грешка'
    case 'offline': return 'Офлайн'
    default: return 'Неизвестно'
  }
}

function getStatusColorHex(status: string | undefined): string {
  switch (status) {
    case 'normal': return '#4CAF50'
    case 'warning': return '#FF9800' 
    case 'error': return '#F44336'
    case 'offline': return '#9E9E9E'
    default: return '#2196F3'
  }
}

function getFixedSectorPath(startPercent: number, endPercent: number): string {
  // Fixed sectors based on percentage of semicircle (0-180 degrees)
  const startAngle = (startPercent / 120) * 180 // 120% total to handle overlap
  const endAngle = (endPercent / 120) * 180
  
  // Convert angles to radians
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180
  
  // Larger gauge coordinates
  const centerX = 80
  const centerY = 85
  const radius = 50
  
  const x1 = centerX - radius * Math.cos(startRad)
  const y1 = centerY - radius * Math.sin(startRad)
  const x2 = centerX - radius * Math.cos(endRad)
  const y2 = centerY - radius * Math.sin(endRad)
  
  const largeArc = (endAngle - startAngle) > 90 ? 1 : 0
  
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
}

function getValuePosition(value: number | undefined): { x: number, y: number } {
  // console.log(`🔍 [DEBUG] getValuePosition called for module "${props.module.name}":`)
  // console.log('  - Input value:', value)
  // console.log('  - module.ranges:', props.module.ranges)
  // console.log('  - ranges.enabled:', props.module.ranges?.enabled)
  
  if (!value || !props.module.ranges?.enabled) {
    //console.log('  - Returning default center position (no value or ranges disabled)')
    return { x: 80, y: 85 } // Default center position
  }
  
  const ranges = props.module.ranges
  let min: number, max: number
  
  // Use new tolerance-based structure if available
  if (ranges.criticalTolerance !== undefined) {
    min = ranges.optimal.min - ranges.criticalTolerance
    max = ranges.optimal.max + ranges.criticalTolerance
   // console.log('  - Using tolerance-based structure')
  }
  // Fall back to legacy structure
  else if (ranges.critical) {
    min = ranges.critical.min
    max = ranges.critical.max
    //console.log('  - Using legacy critical structure')
  }
  // Default fallback
  else {
    min = ranges.optimal.min - 2
    max = ranges.optimal.max + 2
    //console.log('  - Using default fallback (+/-2)')
  }
  
 // console.log(`  - Calculated min: ${min}, max: ${max}`)
  
  const range = max - min
  
  // Clamp value within range
  const clampedValue = Math.max(min, Math.min(max, value))
 // console.log(`  - Clamped value: ${clampedValue} (original: ${value})`)
  
  // Convert value to angle (0-180 degrees for semicircle, left to right)
  const angle = ((clampedValue - min) / range) * 180
  const rad = (angle * Math.PI) / 180
  
  //console.log(`  - Angle: ${angle}°, Radians: ${rad}`)
  
  const centerX = 80
  const centerY = 85
  const radius = 50 // On the arc itself
  
  const result = {
    x: centerX - radius * Math.cos(rad),
    y: centerY - radius * Math.sin(rad)
  }
  
  //console.log(`  - Final position: x=${result.x}, y=${result.y}`)
  
  return result
}

function getFixedLabelPosition(percent: number): { x: number, y: number } {
  // Fixed label positions based on percentage
  const angle = (percent / 120) * 180 // 120% total for proper distribution
  const rad = (angle * Math.PI) / 180
  
  const centerX = 80
  const centerY = 85
  const radius = 72 // Labels positioned further outside the arc
  
  return {
    x: centerX - radius * Math.cos(rad),
    y: centerY - radius * Math.sin(rad) + 4 // Slight offset for better positioning
  }
}

function getCriticalMin(): number {
  const ranges = props.module.ranges
  if (!ranges) return 0
  
  if (ranges.criticalTolerance !== undefined) {
    return ranges.optimal.min - ranges.criticalTolerance
  } else if (ranges.critical) {
    return ranges.critical.min
  }
  return ranges.optimal.min - 2
}

function getCriticalMax(): number {
  const ranges = props.module.ranges
  if (!ranges) return 100
  
  if (ranges.criticalTolerance !== undefined) {
    return ranges.optimal.max + ranges.criticalTolerance
  } else if (ranges.critical) {
    return ranges.critical.max
  }
  return ranges.optimal.max + 2
}

function getWarningMin(): number {
  const ranges = props.module.ranges
  if (!ranges) return 0
  
  if (ranges.warningTolerance !== undefined) {
    return ranges.optimal.min - ranges.warningTolerance
  }
  return ranges.optimal.min - 0.5
}

function getWarningMax(): number {
  const ranges = props.module.ranges
  if (!ranges) return 100
  
  if (ranges.warningTolerance !== undefined) {
    return ranges.optimal.max + ranges.warningTolerance
  }
  return ranges.optimal.max + 0.5
}

// Bar chart functions
function getBarData(): Array<{value: number, timestamp: string}> {
  const barCount = props.module.barChart?.barCount || 10
  const historicalData = props.module.barChart?.historicalData || []
  const current = currentValue.value || 0
  
  // If no historical data, generate mock data for demo
  if (historicalData.length === 0) {
    const mockData = generateMockHistoricalData(barCount, current)
    return mockData
  }
  
  // Use last N values from historical data, pad with current value if needed
  const data = [...historicalData]
  while (data.length < barCount) {
    data.push({
      value: current,
      timestamp: new Date().toISOString()
    })
  }
  
  return data.slice(-barCount) // Get last N values
}

function generateMockHistoricalData(count: number, currentValue: number): Array<{value: number, timestamp: string}> {
  const data: Array<{value: number, timestamp: string}> = []
  const baseValue = currentValue
  const variation = baseValue * 0.5 // 50% variation for VERY visible differences
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    const randomVariation = (Math.random() - 0.5) * 2 * variation
    const trendEffect = Math.sin(i / count * Math.PI) * variation * 0.5 // Add trend wave
    const value = Math.max(0, baseValue + randomVariation + trendEffect)
    
    // Generate timestamp going backwards (older data first)
    const minutesBack = (count - i - 1) * 5 // Every 5 minutes back
    const timestamp = new Date(now.getTime() - minutesBack * 60 * 1000)
    
    data.push({
      value: Math.round(value * 100) / 100,
      timestamp: timestamp.toISOString()
    })
  }
  
  // Make sure the last value is the current value with current timestamp
  data[data.length - 1] = {
    value: currentValue,
    timestamp: now.toISOString()
  }
  
  return data
}

function getBarHeight(d: {value:number,timestamp:string}): number {
  const data = getBarData();
  const vals = data.map(x => x.value).filter(v => Number.isFinite(v));
  if (!vals.length) return 20;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) return 50;

  const ratio = (d.value - min) / (max - min);
  const pct = ratio * 80 + 20;                    // 20–100%
  return Math.round(Math.max(20, Math.min(100, pct))); // <-- clamp
}

function getBarWidth(): number {
  const barCount = props.module.barChart?.barCount || 10
  // Leave some space between bars (90% of available space divided by bar count)
  return (90 / barCount)
}

function formatBarTooltip(dataPoint: {value: number, timestamp: string}): string {
  const unit = currentUnit.value || ''
  const valueText = `${formatValue(dataPoint.value)} ${unit}`.trim()
  const timeText = formatTimestamp(dataPoint.timestamp)
  return `${valueText}\n${timeText}`
}

// Line chart functions
function getLineData(): Array<{value: number, timestamp: string}> {
  const pointCount = props.module.lineChart?.pointCount || 10
  const historicalData = props.module.lineChart?.historicalData || []
  const current = currentValue.value || 0
  
  // If no historical data, generate mock data for demo
  if (historicalData.length === 0) {
    const mockData = generateMockLineData(pointCount, current)
    return mockData
  }
  
  // Use last N values from historical data, pad with current value if needed
  const data = [...historicalData]
  while (data.length < pointCount) {
    data.push({
      value: current,
      timestamp: new Date().toISOString()
    })
  }
  
  return data.slice(-pointCount) // Get last N values
}

function generateMockLineData(count: number, currentValue: number): Array<{value: number, timestamp: string}> {
  const data: Array<{value: number, timestamp: string}> = []
  const baseValue = currentValue
  const variation = baseValue * 0.15 // 15% variation for more realistic curves
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    // Create more natural curve progression
    const progress = i / (count - 1)
    const waveEffect = Math.sin(progress * Math.PI * 2) * 0.5
    const randomVariation = (Math.random() - 0.5) * 2 * variation * 0.3
    const trendEffect = (Math.random() - 0.5) * variation * 0.5
    
    const value = Math.max(0, baseValue + (waveEffect + randomVariation + trendEffect) * variation)
    
    // Generate timestamp going backwards (older data first)
    const minutesBack = (count - i - 1) * 5 // Every 5 minutes back
    const timestamp = new Date(now.getTime() - minutesBack * 60 * 1000)
    
    data.push({
      value: Math.round(value * 100) / 100,
      timestamp: timestamp.toISOString()
    })
  }
  
  // Make sure the last value is the current value with current timestamp
  data[data.length - 1] = {
    value: currentValue,
    timestamp: now.toISOString()
  }
  
  return data
}

function getLinePoints(): Array<{x: number, y: number, value: number, timestamp: string}> {
  const lineData = getLineData()
  const values = lineData.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const points: Array<{x: number, y: number, value: number, timestamp: string}> = []
  
  const svgWidth = 200
  const svgHeight = 80
  const padding = 10
  const chartWidth = svgWidth - (padding * 2)
  const chartHeight = svgHeight - (padding * 2)
  
  lineData.forEach((dataPoint, index) => {
    const x = padding + (index / (lineData.length - 1)) * chartWidth
    
    // If all values are the same, center them vertically
    let y
    if (min === max) {
      y = svgHeight / 2
    } else {
      // Invert Y coordinate (SVG Y grows downward, we want higher values at top)
      y = padding + chartHeight - ((dataPoint.value - min) / (max - min)) * chartHeight
    }
    
    points.push({ x, y, value: dataPoint.value, timestamp: dataPoint.timestamp })
  })
  
  return points
}

function getLinePath(): string {
  const points = getLinePoints()
  if (points.length === 0) return ''
  
  let path = `M ${points[0].x} ${points[0].y}`
  
  // Create smooth curve using quadratic bezier curves
  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1]
    const currentPoint = points[i]
    
    if (i === 1) {
      // First curve segment
      const controlX = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5
      const controlY = prevPoint.y
      path += ` Q ${controlX} ${controlY} ${currentPoint.x} ${currentPoint.y}`
    } else {
      // Smooth curve using the previous point as control
      const controlX = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5
      const controlY = prevPoint.y + (currentPoint.y - prevPoint.y) * 0.5
      path += ` Q ${controlX} ${controlY} ${currentPoint.x} ${currentPoint.y}`
    }
  }
  
  return path
}

function getLineAreaPath(): string {
  const points = getLinePoints()
  if (points.length === 0) return ''
  
  const svgHeight = 80
  const padding = 10
  
  // Start from bottom-left
  let path = `M ${points[0].x} ${svgHeight - padding}`
  
  // Go up to first point
  path += ` L ${points[0].x} ${points[0].y}`
  
  // Follow the line path
  const linePath = getLinePath().replace('M ', '').replace(/M \d+\.?\d* \d+\.?\d* /, '')
  path += ` ${linePath}`
  
  // Go down from last point and close
  const lastPoint = points[points.length - 1]
  path += ` L ${lastPoint.x} ${svgHeight - padding} Z`
  
  return path
}

function formatLineTooltip(dataPoint: {value: number, timestamp: string}): string {
  const unit = currentUnit.value || ''
  const valueText = `${formatValue(dataPoint.value)} ${unit}`.trim()
  const timeText = formatTimestamp(dataPoint.timestamp)
  return `${valueText}\n${timeText}`
}

// New Advanced Gauge Functions
function getColorZonePath(startPercent: number, endPercent: number): string {
  // Convert percentages to angles (0-180 degrees for semicircle)
  const startAngle = (startPercent / 100) * 180
  const endAngle = (endPercent / 100) * 180
  
  // Convert angles to radians  
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180
  
  const centerX = 100
  const centerY = 100
  const radius = 60
  
  const x1 = centerX - radius * Math.cos(startRad)
  const y1 = centerY - radius * Math.sin(startRad)
  const x2 = centerX - radius * Math.cos(endRad)
  const y2 = centerY - radius * Math.sin(endRad)
  
  // For semicircle gauge (0-180°), never use large arc
  // Large arc is only needed for arcs > 180°, which we never have
  const largeArc = 0
  
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
}

function getNeedleEndX(): number {
  if (currentValue.value === undefined) {
    return 100 // Default center
  }
  
  // Use customRange or default fallback
  const min = props.module.customRange?.min ?? 0
  const max = props.module.customRange?.max ?? 14
  const clampedValue = Math.max(min, Math.min(max, currentValue.value))
  
  // Convert value to angle (0-180 degrees)
  const angle = ((clampedValue - min) / (max - min)) * 180
  const rad = (angle * Math.PI) / 180
  
  const centerX = 100
  const needleLength = 75
  
  return centerX - needleLength * Math.cos(rad)
}

function getNeedleEndY(): number {
  if (currentValue.value === undefined) {
    return 55 // Default center
  }
  
  // Use customRange or default fallback
  const min = props.module.customRange?.min ?? 0
  const max = props.module.customRange?.max ?? 14
  const clampedValue = Math.max(min, Math.min(max, currentValue.value))
  
  // Convert value to angle (0-180 degrees) 
  const angle = ((clampedValue - min) / (max - min)) * 180
  const rad = (angle * Math.PI) / 180
  
  const centerY = 100
  const needleLength = 70
  
  return centerY - needleLength * Math.sin(rad)
}

function getDynamicZonePath(zoneType: string): string {
  // Get ranges with fallbacks
  const scaleMin = props.module.customRange?.min ?? 0
  const scaleMax = props.module.customRange?.max ?? 14
  const optimalMin = props.module.ranges?.optimal?.min ?? 5.5
  const optimalMax = props.module.ranges?.optimal?.max ?? 6.5
  const warningTol = props.module.ranges?.warningTolerance ?? 0.5
  const criticalTol = props.module.ranges?.criticalTolerance ?? 2.0

  // Calculate zone boundaries
  const criticalLowEnd = Math.max(scaleMin, optimalMin - criticalTol)
  const warningLowEnd = Math.max(scaleMin, optimalMin - warningTol)
  const warningHighStart = Math.min(scaleMax, optimalMax + warningTol)
  const criticalHighStart = Math.min(scaleMax, optimalMax + criticalTol)

  let startValue: number, endValue: number

  switch (zoneType) {
    case 'critical-low':
      startValue = scaleMin
      endValue = optimalMin - warningTol
      break
    case 'warning-low':
      startValue = optimalMin - warningTol
      endValue = optimalMin
      break
    case 'optimal':
      startValue = optimalMin
      endValue = optimalMax
      break
    case 'warning-high':
      startValue = optimalMax
      endValue = optimalMax + warningTol
      break
    case 'critical-high':
      startValue = optimalMax + warningTol
      endValue = scaleMax
      break
    default:
      return ''
  }

  // Skip if zone has no width
  if (startValue >= endValue) {
    return ''
  }

  // Convert to percentages on the scale
  const startPercent = ((startValue - scaleMin) / (scaleMax - scaleMin)) * 100
  const endPercent = ((endValue - scaleMin) / (scaleMax - scaleMin)) * 100

  // Use existing color zone path function
  return getColorZonePath(startPercent, endPercent)
}

function getTickInterval(min: number, max: number): number {
  const range = max - min
  const intervals = [0.1, 0.2, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000]
  
  for (let interval of intervals) {
    if (range / interval <= 12) return interval
  }
  return intervals[intervals.length - 1]
}

function generateTicks(): number[] {
  const min = props.module.customRange?.min ?? 0
  const max = props.module.customRange?.max ?? 14
  const interval = getTickInterval(min, max)
  
  const ticks = []
  for (let value = min; value <= max; value += interval) {
    ticks.push(parseFloat(value.toFixed(2)))
  }
  return ticks
}

function getTickPosition(value: number): { x1: number, y1: number, x2: number, y2: number } {
  const min = props.module.customRange?.min ?? 0
  const max = props.module.customRange?.max ?? 14
  
  // Convert value to angle (0-180 degrees)
  const angle = ((value - min) / (max - min)) * 180
  const rad = (angle * Math.PI) / 180
  
  const centerX = 100
  const centerY = 100
  const innerRadius = 78  // Just inside the arc
  const outerRadius = 48 // Just outside the arc
  
  return {
    x1: centerX - innerRadius * Math.cos(rad),
    y1: centerY - innerRadius * Math.sin(rad),
    x2: centerX - outerRadius * Math.cos(rad), 
    y2: centerY - outerRadius * Math.sin(rad)
  }
}

// Color scale percentage functions
function getCriticalLowPercent(): number {
  const scaleMin = props.module.customRange?.min ?? 0
  const scaleMax = props.module.customRange?.max ?? 14
  const optimalMin = props.module.ranges?.optimal?.min ?? 5.5
  const warningTol = props.module.ranges?.warningTolerance ?? 0.5
  
  const zoneEnd = optimalMin - warningTol
  return ((zoneEnd - scaleMin) / (scaleMax - scaleMin)) * 100
}

function getWarningLowPercent(): number {
  const optimalMin = props.module.ranges?.optimal?.min ?? 5.5
  const warningTol = props.module.ranges?.warningTolerance ?? 0.5
  const scaleMin = props.module.customRange?.min ?? 0
  const scaleMax = props.module.customRange?.max ?? 14
  
  return (warningTol / (scaleMax - scaleMin)) * 100
}

function getOptimalPercent(): number {
  const optimalMin = props.module.ranges?.optimal?.min ?? 5.5
  const optimalMax = props.module.ranges?.optimal?.max ?? 6.5
  const scaleMin = props.module.customRange?.min ?? 0
  const scaleMax = props.module.customRange?.max ?? 14
  
  return ((optimalMax - optimalMin) / (scaleMax - scaleMin)) * 100
}

function getWarningHighPercent(): number {
  const warningTol = props.module.ranges?.warningTolerance ?? 0.5
  const scaleMin = props.module.customRange?.min ?? 0
  const scaleMax = props.module.customRange?.max ?? 14
  
  return (warningTol / (scaleMax - scaleMin)) * 100
}

function getCriticalHighPercent(): number {
  const scaleMin = props.module.customRange?.min ?? 0
  const scaleMax = props.module.customRange?.max ?? 14
  const optimalMax = props.module.ranges?.optimal?.max ?? 6.5
  const warningTol = props.module.ranges?.warningTolerance ?? 0.5
  
  const zoneStart = optimalMax + warningTol
  return ((scaleMax - zoneStart) / (scaleMax - scaleMin)) * 100
}

</script>

<style lang="scss" scoped>
.module-container {
  :deep(.q-card__section) {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
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

.module-content {
  min-height: 120px;
  max-height: 140px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
}

.number-display {
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .display-value {
    line-height: 1.2;
  }
}

.gauge-display {
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.gauge-header {
  flex-shrink: 0;
}

.gauge-trend {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 2px 0;
}

.status-display {
  width: 100%;
  height: 100%;
}

.chart-display {
  width: 100%;
  height: 100%;
}

.bar-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.bar-header {
  flex-shrink: 0;
}


.bar-trend {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 2px 0;
}

.line-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.line-header {
  flex-shrink: 0;
}

.line-trend {
  flex-shrink: 0;
  margin-top: 4px;
}

.mini-chart-placeholder {
  height: 40px;
  position: relative;
  background: linear-gradient(90deg, #f5f5f5 0%, #e0e0e0 50%, #f5f5f5 100%);
  border-radius: 4px;
  overflow: hidden;

  .chart-line {
    position: absolute;
    bottom: 8px;
    left: 8px;
    right: 8px;
    height: 2px;
    background: linear-gradient(90deg, #4CAF50 0%, #FF9800 50%, #4CAF50 100%);
    border-radius: 1px;

    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: -2px;
      width: 6px;
      height: 6px;
      background: #4CAF50;
      border-radius: 50%;
    }
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

.trend-indicator {
  font-weight: bold;
  font-size: 1.2em;
}

.trend-change {
  font-weight: 500;
}

.custom-gauge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
}

.custom-gauge {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: 80px;
}

.gauge-value-large {
  font-size: 18px;
  font-weight: bold;
  font-family: inherit;
}

.gauge-unit-text {
  font-size: 12px;
  font-weight: normal;
  font-family: inherit;
}

.gauge-label-text {
  font-size: 11px;
  font-weight: bold;
  font-family: inherit;
}

.bar-chart-container {
  height: 80px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 8px;
  flex-shrink: 0;
  overflow: hidden;
}

.bars-wrapper {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  gap: 2px;
}

.bar {
  max-height: 100%;
  transform-origin: bottom;
  background: linear-gradient(to top, #1976d2 0%, #42a5f5 100%);
  border-radius: 2px 2px 0 0;
  //transition: all 0.2s ease;
  transition: opacity 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  min-height: 4px;
  &:hover {
    opacity: 0.8;
    transform: scaleY(1.03);
  }
}

.line-chart-container {
  flex: 1;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin: 4px 0;
}

.line-chart-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.line-point {
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    r: 4;
    opacity: 0.8;
    filter: drop-shadow(0 2px 4px rgba(255, 87, 34, 0.3));
  }
}

// Advanced Gauge Styles
.gauge-advanced-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.advanced-gauge-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 200px;
}

.advanced-gauge {
  width: 100%;
  height: auto;
  max-width: 200px;
  max-height: 120px;
}

.gauge-center-value {
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
  
  .gauge-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    line-height: 1.2;
  }
  
  .gauge-unit {
    font-size: 0.8rem;
    color: #7f8c8d;
    margin-top: 2px;
  }
}

.gauge-scale-text {
  font-size: 10px;
  fill: #666;
  font-weight: 500;
  
  &.gauge-optimal-text {
    fill: #27ae60;
    font-weight: 600;
  }
}

.zone-indicators {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.zone-cell {
  display: inline-block;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 650;
  color: black;
  border-radius: 8px;
  
  &.critical {
    background-color: #e74c3c;
  }
  
  &.warning {
    background-color: #f39c12;
  }
  
  &.optimal {
    background-color: #27ae60;
  }
}
</style>