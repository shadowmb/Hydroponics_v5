<template>
  <div class="design-settings">
    <div class="text-h6 q-mb-md">Дизайн, оформление и мерни единици</div>
    
    <div class="row q-gutter-lg">
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Обновяване на данни</div>
            
            <div class="q-mb-md">
              <q-checkbox 
                :model-value="localSettings.layout.autoRefresh" 
                @update:model-value="updateLayoutSetting('autoRefresh', $event)"
                label="Автоматично обновяване"
              />
            </div>
            
            <div v-if="localSettings.layout.autoRefresh" class="q-mb-md">
              <q-select
                :model-value="localSettings.layout.refreshInterval"
                @update:model-value="updateLayoutSetting('refreshInterval', $event)"
                :options="refreshIntervalOptions"
                label="Интервал на обновяване"
                emit-value
                map-options
              />
            </div>

            <div class="text-subtitle1 q-mb-sm q-mt-md">Визуални настройки</div>
            <q-checkbox 
              :model-value="localSettings.layout.enableAnimations" 
              @update:model-value="updateLayoutSetting('enableAnimations', $event)"
              label="Разреши анимации"
              class="q-mb-sm"
            />
            <q-checkbox 
              :model-value="localSettings.layout.compactMode" 
              @update:model-value="updateLayoutSetting('compactMode', $event)"
              label="Компактен режим"
            />
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Предварителен преглед</div>
            <div class="layout-preview">
              <div class="preview-section sensors">Сензори</div>
              <div class="preview-section system">Система</div>
              <div class="preview-section program">Програма</div>
              <div class="preview-section alerts">Известия</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-separator class="q-my-lg" />

    <!-- Layout Designer Section -->
    <div class="text-h6 q-mb-md">Избор на дизайн на таблото</div>
    
    <div class="layout-selector q-mb-lg">
      <div class="row q-gutter-lg">
        <!-- Compact Layout -->
        <q-card 
          class="layout-option col" 
          :class="{ 'layout-option--selected': localSettings.layout.layoutSettings.layoutType === 'compact' }"
          @click="selectLayout('compact')"
        >
          <q-card-section class="text-center">
            <div class="layout-preview compact-preview">
              <div class="preview-grid">
                <div class="grid-cell sensors">S</div>
                <div class="grid-cell system">Sys</div>
                <div class="grid-cell program">P</div>
                <div class="grid-cell alerts">A</div>
              </div>
            </div>
            <div class="text-subtitle2 q-mt-sm">Компактен (2×2)</div>
            <div class="text-caption text-grey-6">Балансирано разпределение на секциите</div>
          </q-card-section>
        </q-card>

        <!-- Stacked Layout -->
        <q-card 
          class="layout-option col" 
          :class="{ 'layout-option--selected': localSettings.layout.layoutSettings.layoutType === 'stacked' }"
          @click="selectLayout('stacked')"
        >
          <q-card-section class="text-center">
            <div class="layout-preview stacked-preview">
              <div class="preview-stack">
                <div class="stack-cell sensors">Сензори</div>
                <div class="stack-cell system">Система</div>
                <div class="stack-cell program">Програма</div>
                <div class="stack-cell alerts">Известия</div>
              </div>
            </div>
            <div class="text-subtitle2 q-mt-sm">Подредени (4×1)</div>
            <div class="text-caption text-grey-6">Вертикално подреждане</div>
          </q-card-section>
        </q-card>

        <!-- Priority Layout -->
        <q-card 
          class="layout-option col" 
          :class="{ 'layout-option--selected': localSettings.layout.layoutSettings.layoutType === 'priority' }"
          @click="selectLayout('priority')"
        >
          <q-card-section class="text-center">
            <div class="layout-preview priority-preview">
              <div class="preview-priority">
                <div class="priority-large sensors">Сензори</div>
                <div class="priority-small system">Sys</div>
                <div class="priority-small program">Prog</div>
                <div class="priority-small alerts">Alert</div>
              </div>
            </div>
            <div class="text-subtitle2 q-mt-sm">Приоритет</div>
            <div class="text-caption text-grey-6">Фокус върху сензорите</div>
          </q-card-section>
        </q-card>

        <!-- Tiles Layout -->
        <q-card 
          class="layout-option col" 
          :class="{ 'layout-option--selected': localSettings.layout.layoutSettings.layoutType === 'tiles' }"
          @click="selectLayout('tiles')"
        >
          <q-card-section class="text-center">
            <div class="layout-preview tiles-preview">
              <div class="preview-tiles">
                <div class="tile-cell sensors">S</div>
                <div class="tile-cell system">Sys</div>
                <div class="tile-cell program">P</div>
                <div class="tile-cell alerts">A</div>
              </div>
            </div>
            <div class="text-subtitle2 q-mt-sm">Плочки (1×4)</div>
            <div class="text-caption text-grey-6">Хоризонтален компактен преглед</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Layout Options -->
    <div class="row q-gutter-lg">
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Настройки на дизайна</div>
            
            <div class="q-mb-md">
              <q-select
                :model-value="localSettings.layout.layoutSettings.moduleSize"
                @update:model-value="updateLayoutSettingSetting('moduleSize', $event)"
                :options="moduleSizeOptions"
                label="Размер на модулите"
                emit-value
                map-options
              />
            </div>

            <div class="q-mb-md">
              <q-select
                :model-value="localSettings.layout.layoutSettings.spacing"
                @update:model-value="updateLayoutSettingSetting('spacing', $event)"
                :options="spacingOptions"
                label="Разстояние между секциите"
                emit-value
                map-options
              />
            </div>

            <q-checkbox 
              :model-value="localSettings.layout.layoutSettings.showSectionBorders" 
              @update:model-value="updateLayoutSettingSetting('showSectionBorders', $event)"
              label="Покажи рамки на секциите"
              class="q-mb-sm"
            />
            <q-checkbox 
              :model-value="localSettings.layout.layoutSettings.enableLayoutTransitions" 
              @update:model-value="updateLayoutSettingSetting('enableLayoutTransitions', $event)"
              label="Плавни преходи между дизайните"
            />
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Текущи настройки</div>
            <div class="settings-summary">
              <div class="summary-item">
                <strong>Дизайн:</strong> {{ getLayoutLabel(localSettings.layout.layoutSettings.layoutType) }}
              </div>
              <div class="summary-item">
                <strong>Размер:</strong> {{ getModuleSizeLabel(localSettings.layout.layoutSettings.moduleSize) }}
              </div>
              <div class="summary-item">
                <strong>Разстояние:</strong> {{ getSpacingLabel(localSettings.layout.layoutSettings.spacing) }}
              </div>
              <div class="summary-item">
                <strong>Рамки:</strong> {{ localSettings.layout.layoutSettings.showSectionBorders ? 'Да' : 'Не' }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-separator class="q-my-lg" />

    <!-- Measurement Units Section -->
    <div class="text-h6 q-mb-md">Глобални мерни единици</div>
    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle2 q-mb-md">Настройки за мерни единици (влияят на всички модули)</div>
        
        <div class="row q-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              :model-value="localSettings.units?.ec || 'us-cm'"
              @update:model-value="updateUnitSetting('ec', $event)"
              :options="ecUnitOptions"
              label="Електропроводимост (EC)"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
          
          <div class="col-12 col-md-6">
            <q-select
              :model-value="localSettings.units?.temperature || 'celsius'"
              @update:model-value="updateUnitSetting('temperature', $event)"
              :options="temperatureUnitOptions"
              label="Температура"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
          
          <div class="col-12 col-md-6">
            <q-select
              :model-value="localSettings.units?.light || 'lux'"
              @update:model-value="updateUnitSetting('light', $event)"
              :options="lightUnitOptions"
              label="Светлина"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
          
          <div class="col-12 col-md-6">
            <q-select
              :model-value="localSettings.units?.volume || 'liters'"
              @update:model-value="updateUnitSetting('volume', $event)"
              :options="volumeUnitOptions"
              label="Обем"
              outlined
              dense
              emit-value
              map-options
            />
          </div>
        </div>
        
        <q-banner class="bg-blue-1 q-mt-md">
          <template v-slot:avatar>
            <q-icon name="info" color="primary" />
          </template>
          Промяната на мерните единици ще повлияе на всички съществуващи и нови модули. Стойностите ще бъдат автоматично преизчислени.
        </q-banner>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore, type DashboardSettings, type LayoutType } from '../../../stores/dashboard'

// Props & Emits
const props = defineProps<{
  modelValue: DashboardSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardSettings]
}>()

// Store
const dashboardStore = useDashboardStore()

// Computed local settings for two-way binding
const localSettings = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Options
const refreshIntervalOptions = [
  { label: '5 секунди', value: 5 },
  { label: '10 секунди', value: 10 },
  { label: '30 секунди', value: 30 },
  { label: '1 минута', value: 60 },
  { label: '5 минути', value: 300 }
]

const moduleSizeOptions = [
  { label: 'Малки', value: 'small' },
  { label: 'Средни', value: 'medium' },
  { label: 'Големи', value: 'large' }
]

const spacingOptions = [
  { label: 'Плътно', value: 'tight' },
  { label: 'Нормално', value: 'normal' },
  { label: 'Просторно', value: 'spacious' }
]

// Unit options for global measurement settings
const ecUnitOptions = [
  { label: 'µS/cm (микросименс)', value: 'us-cm' },
  { label: 'mS/cm (милисименс)', value: 'ms-cm' },
  { label: 'ppm (500 factor)', value: 'ppm-500' },
  { label: 'ppm (700 factor)', value: 'ppm-700' }
]

const temperatureUnitOptions = [
  { label: '°C (Целзий)', value: 'celsius' },
  { label: '°F (Фаренхайт)', value: 'fahrenheit' },
  { label: 'K (Келвин)', value: 'kelvin' }
]

const lightUnitOptions = [
  { label: 'lux (люкс)', value: 'lux' },
  { label: 'µmol/m²/s (PPFD)', value: 'umol-m2-s' },
  { label: 'W/m² (мощност)', value: 'w-m2' }
]

const volumeUnitOptions = [
  { label: 'L (литри)', value: 'liters' },
  { label: 'mL (милилитри)', value: 'milliliters' },
  { label: 'gal (галони)', value: 'gallons' },
  { label: 'qt (кварти)', value: 'quarts' }
]

// Methods
function updateLayoutSetting(key: keyof DashboardSettings['layout'], value: any) {
  const newSettings = { ...props.modelValue }
  newSettings.layout = { ...newSettings.layout, [key]: value }
  emit('update:modelValue', newSettings)
}

function updateLayoutSettingSetting(key: string, value: any) {
  const newSettings = { ...props.modelValue }
  newSettings.layout.layoutSettings = { ...newSettings.layout.layoutSettings, [key]: value }
  emit('update:modelValue', newSettings)
}

function updateUnitSetting(key: string, value: any) {
  const newSettings = { ...props.modelValue }
  if (!newSettings.units) {
    newSettings.units = {
      ec: 'us-cm',
      temperature: 'celsius',
      light: 'lux',
      volume: 'liters'
    }
  }
  newSettings.units = { ...newSettings.units, [key]: value }
  emit('update:modelValue', newSettings)
}

function selectLayout(layoutType: LayoutType) {
  const preset = dashboardStore.getLayoutPreset(layoutType)
  const newSettings = { ...props.modelValue }
  newSettings.layout.layoutSettings = preset
  emit('update:modelValue', newSettings)
}

function getLayoutLabel(layoutType: LayoutType): string {
  switch (layoutType) {
    case 'compact': return 'Компактен (2×2)'
    case 'stacked': return 'Подредени (4×1)'
    case 'priority': return 'Приоритет (сензори)'
    case 'tiles': return 'Плочки (1×4)'
    default: return 'Неизвестен'
  }
}

function getModuleSizeLabel(size: string): string {
  switch (size) {
    case 'small': return 'Малки'
    case 'medium': return 'Средни'
    case 'large': return 'Големи'
    default: return 'Неизвестен'
  }
}

function getSpacingLabel(spacing: string): string {
  switch (spacing) {
    case 'tight': return 'Плътно'
    case 'normal': return 'Нормално'
    case 'spacious': return 'Просторно'
    default: return 'Неизвестно'
  }
}
</script>

<style lang="scss" scoped>
.design-settings {
  .layout-preview {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 4px;
    height: 100px;
    
    .preview-section {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      
      &.sensors {
        grid-column: 1 / -1;
        background: #e8f5e8;
        border-color: #4CAF50;
      }
      
      &.system {
        background: #e3f2fd;
        border-color: #2196F3;
      }
      
      &.program {
        background: #fff3e0;
        border-color: #FF9800;
      }
      
      &.alerts {
        grid-column: 1 / -1;
        background: #ffebee;
        border-color: #F44336;
      }
    }
  }
}

// Layout selector styles
.layout-selector {
  .layout-option {
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;

    &:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    &--selected {
      border-color: #1976d2;
      background: #f3f8ff;
    }
  }
}

// Layout previews
.layout-preview {
  height: 80px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  background: #fafafa;
}

.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  height: 100%;
  gap: 2px;
  padding: 4px;

  .grid-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    border-radius: 2px;
    
    &.sensors {
      background: #e8f5e8;
      color: #2e7d32;
    }
    
    &.system {
      background: #e3f2fd;
      color: #1565c0;
    }
    
    &.program {
      background: #fff3e0;
      color: #ef6c00;
    }
    
    &.alerts {
      background: #ffebee;
      color: #c62828;
    }
  }
}

.preview-stack {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1px;
  padding: 2px;

  .stack-cell {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
    border-radius: 2px;
    
    &.sensors { background: #e8f5e8; color: #2e7d32; }
    &.system { background: #e3f2fd; color: #1565c0; }
    &.program { background: #fff3e0; color: #ef6c00; }
    &.alerts { background: #ffebee; color: #c62828; }
  }
}

.preview-priority {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 2fr 1fr;
  grid-template-areas: 
    "sensors sensors sensors"
    "system program alerts";
  height: 100%;
  gap: 2px;
  padding: 4px;

  .priority-large {
    grid-area: sensors;
    background: #e8f5e8;
    color: #2e7d32;
  }

  .priority-small {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
    border-radius: 2px;
    
    &.system { 
      grid-area: system;
      background: #e3f2fd; 
      color: #1565c0; 
    }
    &.program { 
      grid-area: program;
      background: #fff3e0; 
      color: #ef6c00; 
    }
    &.alerts { 
      grid-area: alerts;
      background: #ffebee; 
      color: #c62828; 
    }
  }

  .priority-large {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    border-radius: 2px;
  }
}

.preview-tiles {
  display: flex;
  height: 100%;
  gap: 2px;
  padding: 4px;

  .tile-cell {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    border-radius: 2px;
    
    &.sensors { background: #e8f5e8; color: #2e7d32; }
    &.system { background: #e3f2fd; color: #1565c0; }
    &.program { background: #fff3e0; color: #ef6c00; }
    &.alerts { background: #ffebee; color: #c62828; }
  }
}

.settings-summary {
  .summary-item {
    margin-bottom: 8px;
    padding: 4px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
}
</style>