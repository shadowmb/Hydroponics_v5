<template>
  <component 
    :is="getSectionComponent" 
    :module="module"
    :show-drag-handle="showDragHandle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SensorModuleContainer from './sections/SensorModuleContainer.vue'
import SystemStatusContainer from './sections/SystemStatusContainer.vue'
import ProgramStatusContainer from './sections/ProgramStatusContainer.vue'
import AlertContainer from './sections/AlertContainer.vue'

interface ModuleData {
  id: string
  name: string
  sectionId: string
  visualizationType?: 'number' | 'gauge' | 'status' | 'chart' | 'bar' | 'line'
  mockData?: {
    value?: number | string
    unit?: string
    status?: 'normal' | 'warning' | 'error' | 'offline'
    label?: string
    message?: string
    count?: number
    timestamp?: string
    progress?: number
    online?: number
    offline?: number
  }
  ranges?: {
    enabled: boolean
    optimal: { min: number, max: number }
    warningTolerance?: number
    criticalTolerance?: number
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

const getSectionComponent = computed(() => {
  const sectionId = props.module.sectionId?.toLowerCase()
  
  switch (sectionId) {
    case 'sensors':
    case 'sensor':
      return SensorModuleContainer
      
    case 'system':
    case 'systems':
      return SystemStatusContainer
      
    case 'program':
    case 'programs':
      return ProgramStatusContainer
      
    case 'alerts':
    case 'alert':
    case 'notifications':
      return AlertContainer
      
    default:
      // Fallback - ако не разпознаем секцията, използваме sensor контейнера като default
      console.warn(`Unknown section ID: ${sectionId}, falling back to SensorModuleContainer`)
      return SensorModuleContainer
  }
})
</script>

<style lang="scss" scoped>
// No styles needed - all styling is handled by the individual section components
</style>