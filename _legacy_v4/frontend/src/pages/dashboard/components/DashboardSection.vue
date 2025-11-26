<template>
  <div class="dashboard-section" :class="[sectionClass, `dashboard-section--${sectionType}`]">
    <div class="section-header q-mb-md">
      <div class="row items-center justify-between">
        <div>
          <h6 class="q-ma-none text-weight-bold">{{ title }}</h6>
          <div class="text-caption text-grey-6">{{ subtitle }}</div>
        </div>
        <div class="row q-gutter-xs">
          <q-btn
            v-if="showRefresh"
            flat
            round
            dense
            icon="refresh"
            size="sm"
            @click="$emit('refresh')"
            class="text-grey-7"
          >
            <q-tooltip>Обнови секция</q-tooltip>
          </q-btn>
          <q-btn
            v-if="showSettings"
            flat
            round
            dense
            icon="tune"
            size="sm"
            @click="$emit('settings')"
            class="text-grey-7"
          >
            <q-tooltip>Настройки на секция</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Module Grid -->
    <div class="modules-grid" :class="gridClass">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  subtitle?: string
  sectionType: 'sensors' | 'system' | 'program' | 'alerts'
  modules?: any[]
  showRefresh?: boolean
  showSettings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  modules: () => [],
  showRefresh: true,
  showSettings: true
})

defineEmits<{
  refresh: []
  settings: []
}>()

const sectionClass = computed(() => {
  return `dashboard-section--${props.sectionType}`
})

const gridClass = computed(() => {
  const moduleCount = props.modules?.length || 0
  
  switch (props.sectionType) {
    case 'sensors':
      if (moduleCount <= 1) return 'modules-grid--1x1'
      if (moduleCount <= 2) return 'modules-grid--2x1' 
      if (moduleCount <= 3) return 'modules-grid--3x1'
      if (moduleCount <= 4) return 'modules-grid--4x1'
      return 'modules-grid--4x2' // За много модули (5-8)
      
    case 'system':
      if (moduleCount <= 1) return 'modules-grid--1x1'
      if (moduleCount <= 2) return 'modules-grid--2x1'
      return 'modules-grid--2x2' // 3-4 модула
      
    case 'program':
      if (moduleCount <= 1) return 'modules-grid--1x1'
      if (moduleCount <= 2) return 'modules-grid--2x1'
      return 'modules-grid--2x2' // 3-4 модула
      
    case 'alerts':
      if (moduleCount <= 1) return 'modules-grid--1x1'
      return 'modules-grid--2x1' // 2+ модула
      
    default:
      return 'modules-grid--default'
  }
})
</script>

<style lang="scss" scoped>
.dashboard-section {
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 16px;

  &--sensors {
    border-left: 4px solid #4CAF50;
  }

  &--system {
    border-left: 4px solid #2196F3;
  }

  &--program {
    border-left: 4px solid #FF9800;
  }

  &--alerts {
    border-left: 4px solid #F44336;
  }
}

.section-header {
  h6 {
    font-size: 1.1rem;
  }
}

.modules-grid {
  display: grid;
  gap: 12px;

  // Динамични grid конфигурации
  &--1x1 {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    min-height: 120px;
  }

  &--2x1 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 1fr;
    min-height: 120px;
  }

  &--3x1 {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 1fr;
    min-height: 120px;
  }

  &--4x1 {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: 1fr;
    min-height: 120px;
  }

  &--2x2 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    min-height: 250px;
  }

  &--3x2 {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    min-height: 250px;
  }

  &--4x2 {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    min-height: 300px;
  }

  // Legacy стилове за обратна съвместимост (ако някъде се използват)
  &--sensors {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    min-height: 300px;
  }

  &--system {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    min-height: 250px;
  }

  &--program {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    min-height: 250px;
  }

  &--alerts {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 1fr;
    min-height: 120px;
  }

  &--default {
    grid-template-columns: repeat(4, 1fr);
    min-height: 200px;
  }
}
</style>