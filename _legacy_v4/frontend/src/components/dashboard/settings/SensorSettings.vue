<template>
  <div class="sensor-settings">
    <div class="text-h6 q-mb-md">Управление на сензорни модули</div>
    
    <div class="row justify-between items-center q-mb-md">
      <div class="text-subtitle1">
        Активни модули: {{ visibleSensorModules.length }} от {{ allSensorModules.length }}
      </div>
      <q-btn 
        color="primary" 
        icon="add" 
        label="Добави модул"
        @click="showAddModuleDialog"
      />
    </div>

    <!-- Sensor Modules Table -->
    <q-table
      :rows="allSensorModules"
      :columns="sensorColumns"
      row-key="id"
      class="dashboard-settings-table"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
    >
      <template #body-cell-order="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-xs">
            <q-icon name="drag_handle" class="cursor-move text-grey-6" />
            {{ props.row.displayOrder }}
          </div>
        </q-td>
      </template>

      <template #body-cell-visualization="props">
        <q-td :props="props">
          <q-chip 
            :color="getVisualizationColor(props.row.visualizationType)"
            text-color="white"
            size="sm"
          >
            {{ getVisualizationLabel(props.row.visualizationType) }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-toggle
            :model-value="props.row.isVisible"
            @update:model-value="updateModuleVisibility(props.row.id, $event)"
            color="positive"
          />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat icon="edit" size="sm" @click="editModule(props.row)" />
          <q-btn flat icon="delete" size="sm" @click="deleteModule(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <!-- Edit Module Dialog -->
    <q-dialog v-model="showEditModule" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Редактирай модул</div>
        </q-card-section>

        <q-card-section v-if="editingModule">
          <div class="q-gutter-md">
            <q-input
              v-model="editingModule.name"
              label="Име на модул"
              outlined
            />
            
            <q-select
              v-model="editingModule.visualizationType"
              :options="visualizationOptions"
              label="Тип визуализация"
              outlined
              emit-value
              map-options
            />

            <!-- Monitoring Tag Selection for Sensors -->
            <q-select
              v-model="editingModule.monitoringTagId"
              :options="monitoringTagOptions"
              :loading="loadingMonitoringTags"
              label="Monitoring Tag"
              outlined
              emit-value
              map-options
              clearable
              hint="Изберете monitoring tag за реални данни"
            />

            <q-separator class="q-my-md" />

            <div class="text-subtitle2 q-mb-md">Интелигентни граници (автоматичен статус)</div>
            
            <q-checkbox
              v-model="editingModule.ranges.enabled"
              label="Активирай граници за автоматичен статус"
              class="q-mb-md"
            />

            <div v-if="editingModule.ranges.enabled" class="q-gutter-md">
              <!-- Персонализиран диапазон за барометър -->
              <div v-if="editingModule.visualizationType === 'gauge-advanced'" class="q-mb-md">
                <div class="text-body2 q-mb-md">Персонализиран диапазон на скалата:</div>
                
                <div class="row q-gutter-md q-mb-md">
                  <div class="col">
                    <q-input
                      v-model.number="editingModule.customRange.min"
                      label="Минимум скала"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                      hint="Начална точка на барометъра"
                    />
                  </div>
                  <div class="col">
                    <q-input
                      v-model.number="editingModule.customRange.max"
                      label="Максимум скала"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                      hint="Крайна точка на барометъра"
                    />
                  </div>
                </div>
              </div>
              <!-- Оптимален диапазон -->
              <div class="range-section">
                <div class="text-subtitle2 text-positive q-mb-sm">🟢 Оптимален диапазон:</div>
                <div class="row q-gutter-md">
                  <div class="col">
                    <q-input
                      v-model.number="editingModule.ranges.optimal.min"
                      label="Минимум"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col">
                    <q-input
                      v-model.number="editingModule.ranges.optimal.max"
                      label="Максимум"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                    />
                  </div>
                </div>
                
                <!-- Показва текущата зелена зона -->
                <div class="range-preview q-mt-sm">
                  <div class="range-bar green">
                    {{ editingModule.ranges.optimal.min }} - {{ editingModule.ranges.optimal.max }}
                  </div>
                </div>
              </div>

              <!-- Толеранси -->
              <div class="tolerance-section">
                <div class="text-subtitle2 text-warning q-mb-sm">🟡 Внимание (± от оптималната зона):</div>
                <div class="row q-gutter-md">
                  <div class="col-6">
                    <q-input
                      v-model.number="editingModule.ranges.warningTolerance"
                      label="Толеранс"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                    />
                  </div>
                </div>
                
                <!-- Показва всички зони -->
                <div class="range-preview q-mt-sm" v-if="editingModule.ranges.warningTolerance">
                  <div class="range-bar red">
                    &lt; {{ (editingModule.ranges.optimal.min - editingModule.ranges.warningTolerance).toFixed(1) }}
                  </div>
                  <div class="range-bar orange">
                    {{ (editingModule.ranges.optimal.min - editingModule.ranges.warningTolerance).toFixed(1) }} - 
                    {{ editingModule.ranges.optimal.min }}
                  </div>
                  <div class="range-bar green">
                    {{ editingModule.ranges.optimal.min }} - {{ editingModule.ranges.optimal.max }}
                  </div>
                  <div class="range-bar orange">
                    {{ editingModule.ranges.optimal.max }} - 
                    {{ (editingModule.ranges.optimal.max + editingModule.ranges.warningTolerance).toFixed(1) }}
                  </div>
                  <div class="range-bar red">
                    &gt; {{ (editingModule.ranges.optimal.max + editingModule.ranges.warningTolerance).toFixed(1) }}
                  </div>
                </div>
              </div>


              <q-banner class="bg-blue-1 q-mt-md">
                <template v-slot:avatar>
                  <q-icon name="info" color="primary" />
                </template>
                Примери за pH: Оптимален: 5.5-6.5, Внимание: ±0.5
              </q-banner>
            </div>

            <q-separator class="q-my-md" />

            <div v-if="editingModule.visualizationType === 'bar'" class="text-subtitle2 q-mb-md">Настройки за бар графика</div>
            
            <div v-if="editingModule.visualizationType === 'bar'" class="q-mb-md">
              <q-select
                v-model="editingModule.barChart.barCount"
                :options="barCountOptions"
                label="Брой барове"
                outlined
                emit-value
                map-options
              />
              
              <q-banner class="bg-teal-1 q-mt-md">
                <template v-slot:avatar>
                  <q-icon name="bar_chart" color="teal" />
                </template>
                Бар графиката показва последните {{ editingModule.barChart.barCount }} исторически стойности. Всеки бар представлява една стойност, като височината се определя спрямо най-високата и най-ниската стойност.
              </q-banner>
            </div>

            <q-separator v-if="editingModule.visualizationType === 'bar'" class="q-my-md" />

            <div v-if="editingModule.visualizationType === 'line'" class="text-subtitle2 q-mb-md">Настройки за линия графика</div>
            
            <div v-if="editingModule.visualizationType === 'line'" class="q-mb-md">
              <q-select
                v-model="editingModule.lineChart.pointCount"
                :options="pointCountOptions"
                label="Брой точки"
                outlined
                emit-value
                map-options
              />
              
              <q-banner class="bg-deep-orange-1 q-mt-md">
                <template v-slot:avatar>
                  <q-icon name="show_chart" color="deep-orange" />
                </template>
                Линия графиката показва последните {{ editingModule.lineChart.pointCount }} исторически стойности като плавна крива. Всяка точка представлява една стойност, свързана с гладка линия.
              </q-banner>
            </div>

            <q-separator v-if="editingModule.visualizationType === 'line'" class="q-my-md" />


            <div class="text-subtitle2 q-mb-md">Тренд индикатор (сравнение с предишни данни)</div>
            
            <q-checkbox
              v-model="editingModule.trend.enabled"
              label="Покажи тренд индикатор"
              class="q-mb-md"
            />

            <div v-if="editingModule.trend.enabled" class="q-gutter-md">
              <div class="text-body2 q-mb-sm">Толеранс за определяне на промяна:</div>
              
              <q-radio 
                v-model="editingModule.trend.toleranceType" 
                val="auto" 
                label="Автоматичен (от tolerance tag)" 
              />
              <div v-if="editingModule.trend.toleranceType === 'auto'" class="q-ml-lg q-mb-md">
                <q-select
                  v-model="editingModule.trend.toleranceTagId"
                  :options="toleranceTagOptions"
                  label="Избери tolerance tag"
                  outlined
                  dense
                  emit-value
                  map-options
                />
              </div>

              <q-radio 
                v-model="editingModule.trend.toleranceType" 
                val="manual" 
                label="Ръчен" 
              />
              <div v-if="editingModule.trend.toleranceType === 'manual'" class="q-ml-lg q-mb-md">
                <div class="row q-gutter-md">
                  <div class="col">
                    <q-input
                      v-model.number="editingModule.trend.manualTolerance"
                      label="Толеранс"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col">
                    <q-input
                      :value="editingModule.mockData?.unit || ''"
                      label="Мерна единица"
                      readonly
                      outlined
                      dense
                    />
                  </div>
                </div>
              </div>

              <q-banner class="bg-orange-1 q-mt-md">
                <template v-slot:avatar>
                  <q-icon name="trending_up" color="warning" />
                </template>
                Тренд показва: ↗ (нагоре), ↘ (надолу), = (без значима промяна в рамките на толеранса)
              </q-banner>

              <div class="text-caption text-grey-6 q-mt-sm">
                <strong>Тест данни:</strong><br>
                Текуща стойност: {{ editingModule.trend.currentValue || editingModule.mockData?.value || 0 }}<br>
                Предишна стойност: {{ editingModule.trend.previousValue || (editingModule.mockData?.value ? editingModule.mockData.value - 0.5 : 0) }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" @click="cancelEditModule" />
          <q-btn color="primary" label="Запази" @click="saveEditModule" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Module Dialog -->
    <q-dialog v-model="showAddModule" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Добави модул</div>
        </q-card-section>

        <q-card-section v-if="addingModule">
          <div class="q-gutter-md">
            <q-input
              v-model="addingModule.name"
              label="Име на модул"
              outlined
            />
            
            <q-select
              v-model="addingModule.visualizationType"
              :options="visualizationOptions"
              label="Тип визуализация"
              outlined
              emit-value
              map-options
            />

            <div class="q-mb-sm text-subtitle2">Monitoring Tag:</div>
            
            <q-select
              v-model="addingModule.monitoringTagId"
              :options="monitoringTagOptions"
              label="Избери monitoring tag"
              outlined
              emit-value
              map-options
              :loading="loadingMonitoringTags"
              @popup-show="loadMonitoringTags"
            />

            <q-separator class="q-my-md" />

            <div class="text-subtitle2 q-mb-md">Интелигентни граници (автоматичен статус)</div>
            
            <q-checkbox
              v-model="addingModule.ranges.enabled"
              label="Активирай граници за автоматичен статус"
              class="q-mb-md"
            />

            <div v-if="addingModule.ranges.enabled" class="q-gutter-md">
              <!-- Персонализиран диапазон за барометър -->
              <div v-if="addingModule.visualizationType === 'gauge-advanced'" class="q-mb-md">
                <div class="text-body2 q-mb-md">Персонализиран диапазон на скалата:</div>
                
                <div class="row q-gutter-md q-mb-md">
                  <div class="col">
                    <q-input
                      v-model.number="addingModule.customRange.min"
                      label="Минимум скала"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                      hint="Начална точка на барометъра"
                    />
                  </div>
                  <div class="col">
                    <q-input
                      v-model.number="addingModule.customRange.max"
                      label="Максимум скала"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                      hint="Крайна точка на барометъра"
                    />
                  </div>
                </div>
              </div>
              <!-- Оптимален диапазон -->
              <div class="range-section">
                <div class="text-subtitle2 text-positive q-mb-sm">🟢 Оптимален диапазон:</div>
                <div class="row q-gutter-md">
                  <div class="col">
                    <q-input
                      v-model.number="addingModule.ranges.optimal.min"
                      label="Минимум"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col">
                    <q-input
                      v-model.number="addingModule.ranges.optimal.max"
                      label="Максимум"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                    />
                  </div>
                </div>
                
                <!-- Показва текущата зелена зона -->
                <div class="range-preview q-mt-sm">
                  <div class="range-bar green">
                    {{ addingModule.ranges.optimal.min }} - {{ addingModule.ranges.optimal.max }}
                  </div>
                </div>
              </div>

              <!-- Толеранси -->
              <div class="tolerance-section">
                <div class="text-subtitle2 text-warning q-mb-sm">🟡 Внимание (± от оптималната зона):</div>
                <div class="row q-gutter-md">
                  <div class="col-6">
                    <q-input
                      v-model.number="addingModule.ranges.warningTolerance"
                      label="Толеранс"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                    />
                  </div>
                </div>
                
                <!-- Показва всички зони -->
                <div class="range-preview q-mt-sm" v-if="addingModule.ranges.warningTolerance">
                  <div class="range-bar red">
                    &lt; {{ (addingModule.ranges.optimal.min - addingModule.ranges.warningTolerance).toFixed(1) }}
                  </div>
                  <div class="range-bar orange">
                    {{ (addingModule.ranges.optimal.min - addingModule.ranges.warningTolerance).toFixed(1) }} - 
                    {{ addingModule.ranges.optimal.min }}
                  </div>
                  <div class="range-bar green">
                    {{ addingModule.ranges.optimal.min }} - {{ addingModule.ranges.optimal.max }}
                  </div>
                  <div class="range-bar orange">
                    {{ addingModule.ranges.optimal.max }} - 
                    {{ (addingModule.ranges.optimal.max + addingModule.ranges.warningTolerance).toFixed(1) }}
                  </div>
                  <div class="range-bar red">
                    &gt; {{ (addingModule.ranges.optimal.max + addingModule.ranges.warningTolerance).toFixed(1) }}
                  </div>
                </div>
              </div>


              <q-banner class="bg-blue-1 q-mt-md">
                <template v-slot:avatar>
                  <q-icon name="info" color="primary" />
                </template>
                Примери за pH: Оптимален: 5.5-6.5, Внимание: ±0.5
              </q-banner>
            </div>

            <q-separator class="q-my-md" />

            <div v-if="addingModule.visualizationType === 'bar'" class="text-subtitle2 q-mb-md">Настройки за бар графика</div>
            
            <div v-if="addingModule.visualizationType === 'bar'" class="q-mb-md">
              <q-select
                v-model="addingModule.barChart.barCount"
                :options="barCountOptions"
                label="Брой барове"
                outlined
                emit-value
                map-options
              />
              
              <q-banner class="bg-teal-1 q-mt-md">
                <template v-slot:avatar>
                  <q-icon name="bar_chart" color="teal" />
                </template>
                Бар графиката показва последните {{ addingModule.barChart.barCount }} исторически стойности. Всеки бар представлява една стойност, като височината се определя спрямо най-високата и най-ниската стойност.
              </q-banner>
            </div>

            <q-separator v-if="addingModule.visualizationType === 'bar'" class="q-my-md" />

            <div v-if="addingModule.visualizationType === 'line'" class="text-subtitle2 q-mb-md">Настройки за линия графика</div>
            
            <div v-if="addingModule.visualizationType === 'line'" class="q-mb-md">
              <q-select
                v-model="addingModule.lineChart.pointCount"
                :options="pointCountOptions"
                label="Брой точки"
                outlined
                emit-value
                map-options
              />
              
              <q-banner class="bg-deep-orange-1 q-mt-md">
                <template v-slot:avatar>
                  <q-icon name="show_chart" color="deep-orange" />
                </template>
                Линия графиката показва последните {{ addingModule.lineChart.pointCount }} исторически стойности като плавна крива. Всяка точка представлява една стойност, свързана с гладка линия.
              </q-banner>
            </div>

            <q-separator v-if="addingModule.visualizationType === 'line'" class="q-my-md" />


            <div class="text-subtitle2 q-mb-md">Тренд индикатор (сравнение с предишни данни)</div>
            
            <q-checkbox
              v-model="addingModule.trend.enabled"
              label="Покажи тренд индикатор"
              class="q-mb-md"
            />

            <div v-if="addingModule.trend.enabled" class="q-gutter-md">
              <div class="text-body2 q-mb-sm">Толеранс за определяне на промяна:</div>
              
              <q-radio 
                v-model="addingModule.trend.toleranceType" 
                val="auto" 
                label="Автоматичен (от tolerance tag)" 
              />
              <div v-if="addingModule.trend.toleranceType === 'auto'" class="q-ml-lg q-mb-md">
                <q-select
                  v-model="addingModule.trend.toleranceTagId"
                  :options="toleranceTagOptions"
                  label="Избери tolerance tag"
                  outlined
                  dense
                  emit-value
                  map-options
                />
              </div>

              <q-radio 
                v-model="addingModule.trend.toleranceType" 
                val="manual" 
                label="Ръчен" 
              />
              <div v-if="addingModule.trend.toleranceType === 'manual'" class="q-ml-lg q-mb-md">
                <div class="row q-gutter-md">
                  <div class="col">
                    <q-input
                      v-model.number="addingModule.trend.manualTolerance"
                      label="Толеранс"
                      type="number"
                      step="0.1"
                      outlined
                      dense
                    />
                  </div>
                  <div class="col">
                    <q-input
                      value=""
                      label="Мерна единица"
                      placeholder="Ще се попълни автоматично"
                      readonly
                      outlined
                      dense
                    />
                  </div>
                </div>
              </div>

              <q-banner class="bg-orange-1 q-mt-md">
                <template v-slot:avatar>
                  <q-icon name="trending_up" color="warning" />
                </template>
                Тренд показва: ↗ (нагоре), ↘ (надолу), = (без значима промяна в рамките на толеранса)
              </q-banner>

              <div class="text-caption text-grey-6 q-mt-sm">
                <strong>Тест данни:</strong><br>
                Текуща стойност: {{ addingModule.trend.currentValue || 0 }}<br>
                Предишна стойност: {{ addingModule.trend.previousValue || 0 }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" @click="cancelAddModule" />
          <q-btn color="primary" label="Добави" @click="saveAddModule" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDashboardStore } from '../../../stores/dashboard'
import { api } from '../../../services/api'

// Props & Emits
const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  'module-updated': [moduleId: string, updates: any]
}>()

// Store and reactive state
const dashboardStore = useDashboardStore()

// Edit module dialog
const showEditModule = ref(false)
const editingModule = ref<any>(null)

// Add module dialog
const showAddModule = ref(false)
const addingModule = ref<any>(null)
const loadingMonitoringTags = ref(false)
const monitoringTagOptions = ref<Array<{label: string, value: string}>>([])

// Computed
const allSensorModules = computed(() => dashboardStore.getModulesBySection('sensors'))
const visibleSensorModules = computed(() => allSensorModules.value.filter(m => m.isVisible))

const sensorColumns = [
  { name: 'order', label: 'Ред', field: 'displayOrder', align: 'center' },
  { name: 'name', label: 'Име', field: 'name', align: 'left' },
  { name: 'visualization', label: 'Визуализация', field: 'visualizationType', align: 'center' },
  { name: 'status', label: 'Активен', field: 'isVisible', align: 'center' },
  { name: 'actions', label: 'Действия', align: 'center' }
]

const visualizationOptions = [
  { label: 'Число', value: 'number' },
  { label: 'Кръгов индикатор', value: 'gauge' },
  { label: 'Барометър (персонализиран)', value: 'gauge-advanced' },
  { label: 'Бар графика', value: 'bar' },
  { label: 'Линия графика', value: 'line' }
]

// Mock tolerance tag options
const toleranceTagOptions = [
  { label: 'pH Толеранс (±0.2)', value: 'ph-tolerance' },
  { label: 'EC Толеранс (±50)', value: 'ec-tolerance' },
  { label: 'Температура Толеранс (±1.0)', value: 'temp-tolerance' },
  { label: 'Влажност Толеранс (±5)', value: 'humidity-tolerance' }
]

const barCountOptions = [
  { label: '5 бара', value: 5 },
  { label: '10 бара', value: 10 },
  { label: '15 бара', value: 15 },
  { label: '20 бара', value: 20 }
]

const pointCountOptions = [
  { label: '5 точки', value: 5 },
  { label: '10 точки', value: 10 },
  { label: '15 точки', value: 15 },
  { label: '20 точки', value: 20 }
]

// Methods
function updateModuleVisibility(moduleId: string, isVisible: boolean) {
  dashboardStore.updateModuleVisibility(moduleId, isVisible)
}

async function editModule(module: any) {
  //console.log('🔍 [DEBUG] editModule - original module:', module)
  //console.log('🔍 [DEBUG] editModule - customRange:', module.customRange)
  
  // Create a copy of the module for editing
  editingModule.value = { 
    ...module, 
    mockData: { ...module.mockData },
    ranges: {
      enabled: module.ranges?.enabled || false,
      optimal: { 
        min: module.ranges?.optimal?.min || 5.5, 
        max: module.ranges?.optimal?.max || 6.5
      },
      warningTolerance: module.ranges?.warningTolerance || 0.5,
      criticalTolerance: module.ranges?.criticalTolerance || 2.0
    },
    trend: {
      enabled: module.trend?.enabled || false,
      toleranceType: module.trend?.toleranceType || 'manual',
      toleranceTagId: module.trend?.toleranceTagId || '',
      manualTolerance: module.trend?.manualTolerance || 0.1,
      currentValue: module.mockData?.value,
      previousValue: module.mockData?.value ? module.mockData.value - 0.5 : 0
    },
    barChart: module.barChart || {
      barCount: 10,
      historicalData: []
    },
    lineChart: module.lineChart || {
      pointCount: 10,
      historicalData: []
    },
    customRange: module.customRange || {
      min: null,
      max: null
    }
  }
  
  await loadMonitoringTags()
  showEditModule.value = true
}

async function deleteModule(moduleId: string) {
  try {
    const module = dashboardStore.modules.find(m => m.id === moduleId)
    if (!module) {
      console.warn('Module not found in store:', moduleId)
      return
    }

    if (module.sectionId === 'sensors' && moduleId.startsWith('sensor-')) {
      const dbId = moduleId.replace('sensor-', '')
      
      console.log('🔍 [DEBUG] Deleting sensor module from database:', { 
        frontendId: moduleId, 
        extractedDbId: dbId, 
        sectionId: 'sensors',
        moduleName: module.name 
      })
      
      if (!dbId || dbId === 'undefined' || dbId.length !== 24) {
        console.log('⚠️ Skipping database delete - module has invalid database ID')
      } else {
        try {
          await api.getClient().delete(`/dashboard/sections/sensors/modules/${dbId}`)
          console.log('✅ Module successfully deleted from database')
        } catch (error) {
          console.error('❌ Failed to delete module from database:', error)
        }
      }
    }
    
    dashboardStore.removeModule(moduleId)
    
  } catch (error) {
    console.error('Error deleting module:', error)
    dashboardStore.removeModule(moduleId)
  }
}

async function showAddModuleDialog() {
  console.log('Add module to sensor section')
  
  addingModule.value = {
    name: '',
    visualizationType: 'number',
    monitoringTagId: '',
    isVisible: true,
    displayOrder: allSensorModules.value.length + 1,
    ranges: {
      enabled: false,
      optimal: { min: 5.5, max: 6.5 },
      warningTolerance: 0.5,
      criticalTolerance: 2.0
    },
    trend: {
      enabled: false,
      toleranceType: 'manual',
      toleranceTagId: '',
      manualTolerance: 0.1,
      currentValue: 0,
      previousValue: 0
    },
    barChart: {
      barCount: 10,
      historicalData: []
    },
    lineChart: {
      pointCount: 10,
      historicalData: []
    },
    customRange: {
      min: null,
      max: null
    }
  }
  
  await loadMonitoringTags()
  showAddModule.value = true
}

async function loadMonitoringTags() {
  loadingMonitoringTags.value = true
  try {
    const response = await api.getClient().get('/monitoring/tags')
    const result = response.data
    const allTags = result.data || result

    const monitoringTags = allTags.filter((tag: any) => tag.type === 'monitoring')

    monitoringTagOptions.value = monitoringTags.map((tag: any) => ({
      label: `${tag.name} - ${tag.description || 'Monitoring tag'}`,
      value: tag._id
    }))

    //console.log('Loaded monitoring tags:', monitoringTags.length, 'out of', allTags.length, 'total tags')
    loadingMonitoringTags.value = false
  } catch (error) {
    console.error('Error loading monitoring tags:', error)
    loadingMonitoringTags.value = false
    monitoringTagOptions.value = []
  }
}

async function loadMonitoringDataForTag(tagId: string) {
  try {
    const response = await api.getClient().get(`/monitoring/data/latest/${tagId}`)
    const result = response.data
    console.log(`Successfully loaded monitoring data for tag ${tagId}:`, result)
    return result.data || result
  } catch (error) {
    console.error(`Error loading monitoring data for tag ${tagId}:`, error)
    return null
  }
}

function cancelAddModule() {
  showAddModule.value = false
  addingModule.value = null
}

async function saveAddModule() {
  if (!addingModule.value.name || !addingModule.value.monitoringTagId) {
    console.warn('Name and monitoring tag are required')
    return
  }

  try {
    const moduleData = {
      name: addingModule.value.name,
      visualizationType: addingModule.value.visualizationType,
      monitoringTagId: addingModule.value.monitoringTagId,
      isVisible: true,
      smartBoundaries: {
        enabled: addingModule.value.ranges?.enabled || false,
        optimal: {
          min: addingModule.value.ranges?.optimal?.min || 0,
          max: addingModule.value.ranges?.optimal?.max || 100
        },
        warningTolerance: addingModule.value.ranges?.warningTolerance || 5,
        dangerTolerance: addingModule.value.ranges?.criticalTolerance || 10
      },
      trendIndicator: {
        enabled: addingModule.value.trend?.enabled || false,
        toleranceType: addingModule.value.trend?.toleranceType || 'manual',
        toleranceTagId: addingModule.value.trend?.toleranceTagId || null,
        manualTolerance: addingModule.value.trend?.manualTolerance || 0.1
      },
      barChart: addingModule.value.visualizationType === 'bar' ? {
        barCount: addingModule.value.barChart?.barCount || 10
      } : undefined,
      lineChart: addingModule.value.visualizationType === 'line' ? {
        pointCount: addingModule.value.lineChart?.pointCount || 10
      } : undefined,
      customRange: addingModule.value.visualizationType === 'gauge-advanced' && 
                   addingModule.value.customRange && 
                   addingModule.value.customRange.min !== null && 
                   addingModule.value.customRange.max !== null ? {
        min: addingModule.value.customRange.min,
        max: addingModule.value.customRange.max
      } : undefined
    }

    console.log('🔍 [DEBUG] Saving module to database:', moduleData)

    const response = await api.getClient().post('/dashboard/sections/sensors/modules', moduleData)
    const result = response.data
    const savedModule = result.data

    console.log('Module successfully saved to database:', savedModule)

    const monitoringData = await loadMonitoringDataForTag(savedModule.monitoringTagId)

    const newModule = {
      id: `sensor-${savedModule._id}`,
      name: savedModule.name,
      sectionId: 'sensors',
      visualizationType: savedModule.visualizationType,
      monitoringTagId: savedModule.monitoringTagId,
      isVisible: savedModule.isVisible,
      displayOrder: savedModule.displayOrder,
      ranges: savedModule.smartBoundaries ? {
        enabled: savedModule.smartBoundaries.enabled,
        optimal: savedModule.smartBoundaries.optimal,
        warningTolerance: savedModule.smartBoundaries.warningTolerance,
        criticalTolerance: savedModule.smartBoundaries.dangerTolerance
      } : undefined,
      trend: savedModule.trendIndicator ? {
        enabled: savedModule.trendIndicator.enabled,
        toleranceType: savedModule.trendIndicator.toleranceType || 'manual',
        toleranceTagId: savedModule.trendIndicator.toleranceTagId || null,
        manualTolerance: savedModule.trendIndicator.manualTolerance || 0.1
      } : undefined,
      barChart: savedModule.barChart || undefined,
      lineChart: savedModule.lineChart || undefined,
      customRange: savedModule.customRange || undefined,
      optimalRange: savedModule.optimalRange || undefined,
      warningTolerance: savedModule.warningTolerance || undefined,
      criticalTolerance: savedModule.criticalTolerance || undefined,
      monitoringData: monitoringData || null
    }

    dashboardStore.addModule(newModule)

    console.log('New sensor module added to store with real data:', newModule)
    
    showAddModule.value = false
    addingModule.value = null
    
  } catch (error) {
    console.error('Error saving new module:', error)
    alert('Грешка при записване на модула. Моля, опитайте отново.')
  }
}

function getVisualizationColor(type: string): string {
  switch (type) {
    case 'number': return 'blue'
    case 'gauge': return 'green'
    case 'gauge-advanced': return 'purple'
    case 'bar': return 'teal'
    case 'line': return 'deep-orange'
    case 'status': return 'purple'
    default: return 'grey'
  }
}

function getVisualizationLabel(type: string): string {
  switch (type) {
    case 'number': return 'Число'
    case 'gauge': return 'Измервател'
    case 'gauge-advanced': return 'Барометър'
    case 'bar': return 'Бар графика'
    case 'line': return 'Линия графика'
    case 'status': return 'Статус'
    default: return 'Неизвестно'
  }
}

function cancelEditModule() {
  showEditModule.value = false
  editingModule.value = null
}

async function saveEditModule() {
  if (!editingModule.value) return
  
  const moduleToSave = { ...editingModule.value }
  //console.log('💾 [DEBUG] Saving module:', moduleToSave)
  
  try {
    const dbId = moduleToSave.id.replace('sensor-', '')
    
    if (!dbId || dbId === 'undefined' || dbId.length !== 24) {
      console.warn('⚠️ Cannot save module with invalid database ID:', moduleToSave.id)
      showEditModule.value = false
      editingModule.value = null
      return
    }
    
    const updateData = {
      name: moduleToSave.name,
      visualizationType: moduleToSave.visualizationType,
      monitoringTagId: moduleToSave.monitoringTagId,
      isVisible: moduleToSave.isVisible,
      displayOrder: moduleToSave.displayOrder,
      smartBoundaries: {
        enabled: moduleToSave.ranges?.enabled || false,
        optimal: {
          min: moduleToSave.ranges?.optimal?.min || 0,
          max: moduleToSave.ranges?.optimal?.max || 100
        },
        warningTolerance: moduleToSave.ranges?.warningTolerance || 5,
        dangerTolerance: moduleToSave.ranges?.criticalTolerance || 10
      },
      trendIndicator: {
        enabled: moduleToSave.trend?.enabled || false,
        toleranceType: moduleToSave.trend?.toleranceType || 'manual',
        toleranceTagId: moduleToSave.trend?.toleranceTagId || null,
        manualTolerance: moduleToSave.trend?.manualTolerance || 0.1
      },
      barChart: moduleToSave.visualizationType === 'bar' ? {
        barCount: moduleToSave.barChart?.barCount || 10
      } : undefined,
      lineChart: moduleToSave.visualizationType === 'line' ? {
        pointCount: moduleToSave.lineChart?.pointCount || 10
      } : undefined,
      customRange: moduleToSave.visualizationType === 'gauge-advanced' && 
                   moduleToSave.customRange && 
                   moduleToSave.customRange.min !== null && 
                   moduleToSave.customRange.max !== null ? {
        min: moduleToSave.customRange.min,
        max: moduleToSave.customRange.max
      } : undefined
    }
    
    console.log('🔍 [DEBUG] Update data being sent to API:', updateData)

    const response = await api.getClient().put(`/dashboard/sections/sensors/modules/${dbId}`, updateData)
    const result = response.data
    console.log('✅ Module updated successfully in database:', result.data)

    const moduleIndex = dashboardStore.modules.findIndex(m => m.id === moduleToSave.id)
    if (moduleIndex >= 0) {
      dashboardStore.modules[moduleIndex] = {
        id: `sensor-${result.data._id}`,
        name: result.data.name,
        sectionId: 'sensors',
        visualizationType: result.data.visualizationType,
        monitoringTagId: result.data.monitoringTagId,
        isVisible: result.data.isVisible,
        displayOrder: result.data.displayOrder,
        ranges: result.data.smartBoundaries ? {
          enabled: result.data.smartBoundaries.enabled,
          optimal: result.data.smartBoundaries.optimal,
          warningTolerance: result.data.smartBoundaries.warningTolerance,
          criticalTolerance: result.data.smartBoundaries.dangerTolerance
        } : undefined,
        trend: result.data.trendIndicator ? {
          enabled: result.data.trendIndicator.enabled,
          toleranceType: result.data.trendIndicator.toleranceType || 'manual',
          toleranceTagId: result.data.trendIndicator.toleranceTagId || null,
          manualTolerance: result.data.trendIndicator.manualTolerance || 0.1
        } : undefined,
        barChart: result.data.barChart || undefined,
        lineChart: result.data.lineChart || undefined,
        customRange: result.data.customRange || undefined,
        optimalRange: result.data.optimalRange || undefined,
        warningTolerance: result.data.warningTolerance || undefined,
        criticalTolerance: result.data.criticalTolerance || undefined,
        monitoringData: dashboardStore.modules[moduleIndex].monitoringData
      }
    }

    emit('module-updated', moduleToSave.id, dashboardStore.modules[moduleIndex])

    showEditModule.value = false
    editingModule.value = null
    
  } catch (error) {
    console.error('❌ Error saving module:', error)
  }
}
</script>

<style lang="scss" scoped>
.range-section, .tolerance-section {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.range-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.range-bar {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  min-width: 80px;
  
  &.green {
    background: #c8e6c9;
    color: #2e7d32;
    border: 1px solid #4caf50;
  }
  
  &.orange {
    background: #ffe0b2;
    color: #f57900;
    border: 1px solid #ff9800;
  }
  
  &.red {
    background: #ffcdd2;
    color: #c62828;
    border: 1px solid #f44336;
  }
}

.dashboard-settings-table {
  .q-table__top,
  .q-table__bottom {
    display: none;
  }
}
</style>