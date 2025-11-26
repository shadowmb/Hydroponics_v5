<template>
  <q-page class="q-pa-md">
    <div class="row justify-between items-center q-mb-lg">
      <div>
        <h4 class="text-h4 q-my-none">Мониторинг Контрол</h4>
        <p class="text-body2 text-grey-6 q-mt-sm">
          Управление на тагове за мониторинг и преглед на данни
        </p>
      </div>
      <q-btn
        color="primary"
        icon="add"
        label="Нов Таг"
        @click="showCreateDialog = true"
        :loading="loading"
      />
    </div>

    <!-- 📊 Monitoring Programs Section -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="schedule" class="q-mr-sm" />
              Мониторинг Програми
            </div>
            
            <div class="row q-gutter-md q-mb-md">
              <!-- Schedule Existing Program -->
              <div class="col-12">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle1 q-mb-sm">
                      <q-icon name="schedule" color="secondary" />
                      Активирай Flow
                    </div>
                    <div class="q-gutter-md">
                      <q-select
                        v-model="selectedFlow"
                        :options="availableFlows"
                        label="Избери поток с мониторинг тагове"
                        option-label="name"
                        option-value="_id"
                        emit-value
                        map-options
                        clearable
                        :loading="loadingFlows"
                        style="max-width: 400px"
                      >
                        <template v-slot:option="scope">
                          <q-item v-bind="scope.itemProps">
                            <q-item-section>
                              <q-item-label>{{ scope.opt.name }}</q-item-label>
                              <q-item-label caption>
                                {{ scope.opt.monitoringBlocksCount }} мониторинг блока
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                      
                      <q-input
                        v-model.number="monitoringInterval"
                        type="number"
                        label="Интервал (минути)"
                        :min="1"
                        :max="1440"
                        suffix="мин"
                        style="max-width: 200px"
                      />
                      
                      <q-btn
                        color="secondary"
                        icon="play_arrow"
                        label="Създай Мониторинг Flow"
                        @click="activateMonitoringFlow"
                        :loading="loadingActivation"
                        :disable="!selectedFlow || !monitoringInterval"
                        push
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
            
            <!-- All Monitoring Flows -->
            <div class="text-subtitle1 q-mb-md">
              <q-icon name="analytics" color="positive" />
              Мониторинг Потоци
            </div>
            
            <q-table
              :rows="activeMonitoringFlows"
              :columns="flowColumns"
              row-key="_id"
              :loading="loadingFlows"
              no-data-label="Няма създадени мониторинг потоци"
              dense
            >
              <template v-slot:body-cell-name="props">
                <q-td :props="props">
                  <div>{{ props.row.name }}</div>
                  <div v-if="props.row.description" class="text-caption text-grey-6">
                    {{ props.row.description }}
                  </div>
                </q-td>
              </template>

              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-chip
                    :color="monitoringFlowService.getFlowStatusColor(props.row)"
                    text-color="white"
                    size="sm"
                    :icon="monitoringFlowService.getFlowStatusIcon(props.row)"
                  >
                    {{ monitoringFlowService.getFlowStatusText(props.row) }}
                  </q-chip>
                </q-td>
              </template>
              
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <!-- Start/Stop Button -->
                  <q-btn
                    v-if="props.row.isActive"
                    icon="stop"
                    color="orange"
                    size="sm"
                    flat
                    @click="deactivateMonitoringFlow(props.row._id)"
                    :loading="loadingDeactivation === props.row._id"
                  >
                    <q-tooltip>Спри</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-else
                    icon="play_arrow"
                    color="positive"
                    size="sm"
                    flat
                    @click="activateFlow(props.row._id)"
                    :loading="loadingDeactivation === props.row._id"
                  >
                    <q-tooltip>Стартирай</q-tooltip>
                  </q-btn>

                  <!-- Edit Button -->
                  <q-btn
                    icon="edit"
                    color="primary"
                    size="sm"
                    flat
                    @click="editMonitoringFlow(props.row._id)"
                    class="q-ml-xs"
                  >
                    <q-tooltip>Редактирай интервал</q-tooltip>
                  </q-btn>

                  <!-- Delete Button -->
                  <q-btn
                    icon="delete"
                    color="negative"
                    size="sm"
                    flat
                    @click="deleteMonitoringFlow(props.row._id)"
                    :loading="loadingDeactivation === props.row._id"
                    class="q-ml-xs"
                  >
                    <q-tooltip>Изтрий</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Tags Table -->
    <q-card>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <div class="text-h6">Мониторинг Тагове</div>
            <!-- Compact Stats -->
            <div class="text-body2 text-grey-7 q-mt-xs">
              <span class="q-mr-md">Общо: <span class="text-weight-medium text-dark">{{ totalTags }}</span></span>
              <span class="q-mr-md">Активни: <span class="text-weight-medium text-positive">{{ activeTags }}</span></span>
              <span>Неактивни: <span class="text-weight-medium text-negative">{{ inactiveTags }}</span></span>
            </div>
          </div>
          <q-btn
            icon="refresh"
            color="primary"
            flat
            round
            size="sm"
            @click="refreshLastValues"
            :loading="refreshingLastValues"
            title="Обнови последните стойности"
          >
            <q-tooltip>Обнови последните стойности</q-tooltip>
          </q-btn>
        </div>
        
        <!-- Filter Controls -->
        <div class="row q-gutter-md q-mb-md">
          <q-select
            v-model="statusFilter"
            :options="statusOptions"
            label="Филтър по статус"
            clearable
            style="min-width: 200px"
          />
          <q-select
            v-model="typeFilter"
            :options="typeFilterOptions"
            label="Филтър по тип"
            clearable
            style="min-width: 200px"
          />
          <q-input
            v-model="searchText"
            label="Търсене по име"
            debounce="300"
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <q-table
          :rows="filteredTags"
          :columns="tagColumns"
          row-key="_id"
          :loading="loading"
          no-data-label="Няма намерени тагове"
          loading-label="Зареждане..."
          rows-per-page-label="Редове на страница"
        >
          <template v-slot:body-cell-isActive="props">
            <q-td :props="props">
              <q-chip
                :color="props.value ? 'positive' : 'negative'"
                text-color="white"
                size="sm"
              >
                {{ props.value ? 'Активен' : 'Неактивен' }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-createdAt="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                icon="edit"
                color="primary"
                size="sm"
                flat
                round
                @click="editTag(props.row)"
              >
                <q-tooltip>Редактиране</q-tooltip>
              </q-btn>
              <q-btn
                icon="bar_chart"
                color="info"
                size="sm"
                flat
                round
                @click="viewStats(props.row)"
                class="q-ml-xs"
              >
                <q-tooltip>Статистики</q-tooltip>
              </q-btn>
              <q-btn
                icon="delete"
                color="negative"
                size="sm"
                flat
                round
                @click="confirmDelete(props.row)"
                class="q-ml-xs"
              >
                <q-tooltip>Изтриване</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingTag ? 'Редактиране на таг' : 'Създаване на нов таг' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveTag" class="q-gutter-md">
            <q-input
              v-model="tagForm.name"
              label="Име на тага *"
              :rules="[
                val => !!val || 'Името е задължително',
                val => val.length >= 1 || 'Името трябва да е поне 1 символ',
                val => val.length <= 12 || 'Името не може да надвишава 12 символа'
              ]"
              counter
              maxlength="12"
              hint="Минимум 1, максимум 12 символа"
              outlined
            />
            <q-input
              v-model="tagForm.description"
              label="Описание"
              type="textarea"
              rows="3"
            />
            <q-select
              v-model="tagForm.type"
              :options="tagTypeOptions"
              label="Тип таг"
              outlined
              emit-value
              map-options
            />
            <q-input
              v-if="tagForm.type === 'tolerance'"
              v-model.number="tagForm.tolerance"
              label="Толеранс (±) *"
              type="number"
              step="0.01"
              :rules="[
                val => val !== null && val !== undefined && val !== '' || 'Толерансът е задължителен за този тип таг',
                val => val >= 0 || 'Толерансът трябва да е положително число'
              ]"
              hint="Задължително за тип Толерантност"
              outlined
            />
            <q-toggle
              v-model="tagForm.isActive"
              label="Активен"
              color="primary"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" @click="cancelEdit" />
          <q-btn
            color="primary"
            label="Запис"
            @click="saveTag"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Stats Dialog -->
    <q-dialog v-model="showStatsDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6 q-mb-md">Статистики за: {{ selectedTag?.name }}</div>
          
          <!-- Period Selection -->
          <div class="row items-center q-mb-md">
            <div class="text-subtitle2 q-mr-md">Период:</div>
            <q-select
              v-model="selectedStatsPeriod"
              :options="statsPeriodOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              style="min-width: 120px"
              @update:model-value="loadStatsForPeriod"
              :loading="loadingStats"
            />
          </div>
        </q-card-section>

        <q-card-section v-if="tagStats">
          <div class="row q-gutter-md">
            <div class="col-5">
              <q-item>
                <q-item-section>
                  <q-item-label caption>Записи</q-item-label>
                  <q-item-label>{{ tagStats.count }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
            <div class="col-5">
              <q-item>
                <q-item-section>
                  <q-item-label caption>Средна стойност</q-item-label>
                  <q-item-label>{{ tagStats.avgValue?.toFixed(2) }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
          </div>
          <div class="row q-gutter-md">
            <div class="col-5">
              <q-item>
                <q-item-section>
                  <q-item-label caption>Минимална стойност</q-item-label>
                  <q-item-label>{{ tagStats.minValue }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
            <div class="col-5">
              <q-item>
                <q-item-section>
                  <q-item-label caption>Максимална стойност</q-item-label>
                  <q-item-label>{{ tagStats.maxValue }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
          </div>
          <div class="row q-gutter-md">
            <div class="col-5">
              <q-item>
                <q-item-section>
                  <q-item-label caption>Последна стойност</q-item-label>
                  <q-item-label>{{ tagStats.lastValue ?? 'Няма данни' }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
            <div class="col-5">
              <q-item>
                <q-item-section>
                  <q-item-label caption>Последно записване</q-item-label>
                  <q-item-label>{{ formatDate(tagStats.lastTimestamp) }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
          </div>
          <div class="q-mt-md">
            <q-item>
              <q-item-section>
                <q-item-label caption>Времеви период</q-item-label>
                <q-item-label>{{ tagStats.timeRange }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Затвори" @click="showStatsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { monitoringService, type MonitoringTag, type MonitoringDataStats } from '../services/monitoringService'
import { monitoringFlowService, type MonitoringFlow, type AvailableFlow } from '../services/monitoringFlowService'

const $q = useQuasar()
const router = useRouter()

// State
const tags = ref<MonitoringTag[]>([])
const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)
const showStatsDialog = ref(false)
const editingTag = ref<MonitoringTag | null>(null)
const selectedTag = ref<MonitoringTag | null>(null)
const tagStats = ref<MonitoringDataStats | null>(null)
const statusFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)
const searchText = ref('')
const refreshingLastValues = ref(false)
const selectedStatsPeriod = ref<number>(24)
const loadingStats = ref(false)

// 📊 Monitoring Flows State
const availableFlows = ref<AvailableFlow[]>([])
const activeMonitoringFlows = ref<MonitoringFlow[]>([])
const selectedFlow = ref<string | null>(null)
const monitoringInterval = ref<number>(5)
const loadingFlows = ref(false)
const loadingActivation = ref(false)
const loadingDeactivation = ref<string | null>(null)

// Form data
const tagForm = ref({
  name: '',
  description: '',
  isActive: true,
  type: 'monitoring' as 'monitoring' | 'tolerance',
  tolerance: undefined as number | undefined
})

// Table columns
const tagColumns = [
  {
    name: 'name',
    label: 'Име',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'description',
    label: 'Описание',
    field: 'description',
    align: 'left'
  },
  {
    name: 'isActive',
    label: 'Статус',
    field: 'isActive',
    align: 'center'
  },
  {
    name: 'lastValue',
    label: 'Последна стойност',
    field: 'lastValue',
    align: 'center',
    format: (val: any, row: any) => {
      const tag = row as any
      if (tag.type === 'tolerance') {
        // За tolerance тагове показва толеранс стойността
        return tag.tolerance ? `±${tag.tolerance}` : 'Няма толеранс'
      } else {
        // За monitoring тагове показва последната стойност
        return val ? `${val.value} (${formatTimestamp(val.timestamp)})` : 'Няма данни'
      }
    }
  },
  {
    name: 'type',
    label: 'Тип',
    field: (row: any) => row.type === 'tolerance' ? 'Толеранс' : 'Мониторинг',
    align: 'center',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Действия',
    field: 'actions',
    align: 'center'
  }
]

// 📊 Monitoring Flow Table Columns
const flowColumns = [
  {
    name: 'name',
    label: 'Име',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'flowTemplate',
    label: 'Flow Template',
    field: (row: MonitoringFlow) => row.flowTemplateId.name,
    align: 'left'
  },
  {
    name: 'monitoringInterval',
    label: 'Интервал',
    field: 'monitoringInterval',
    align: 'center',
    format: (val: number) => monitoringFlowService.formatIntervalText(val)
  },
  {
    name: 'status',
    label: 'Статус',
    field: 'status',
    align: 'center'
  },
  {
    name: 'nextExecution',
    label: 'Следващо изпълнение',
    field: 'nextExecution',
    align: 'center',
    format: (val: Date) => monitoringFlowService.formatNextExecution(val)
  },
  {
    name: 'actions',
    label: 'Действия',
    field: 'actions',
    align: 'center'
  }
]

const statusOptions = [
  { label: 'Активни', value: 'active' },
  { label: 'Неактивни', value: 'inactive' }
]

const typeFilterOptions = [
  { label: 'Мониторинг', value: 'monitoring' },
  { label: 'Толеранс', value: 'tolerance' }
]

const statsPeriodOptions = [
  { label: '1 час', value: 1 },
  { label: '12 часа', value: 12 },
  { label: '24 часа', value: 24 },
  { label: '1 седмица', value: 168 }, // 7 * 24
  { label: '1 месец', value: 720 }  // 30 * 24
]

const tagTypeOptions = [
  { label: 'Мониторинг', value: 'monitoring' },
  { label: 'Толерантност', value: 'tolerance' }
]

// Computed
const totalTags = computed(() => tags.value.length)
const activeTags = computed(() => tags.value.filter(tag => tag.isActive).length)
const inactiveTags = computed(() => tags.value.filter(tag => !tag.isActive).length)

const filteredTags = computed(() => {
  console.log('=== FILTER DEBUG START ===')
  console.log('📊 All tags:', tags.value)
  console.log('🔍 Status filter:', statusFilter.value)
  console.log('🏷️ Type filter:', typeFilter.value)
  console.log('🔤 Search text:', searchText.value)
  
  let result = tags.value
  console.log('📝 Initial result count:', result.length)

  // Filter by status
  if (statusFilter.value) {
    const isActive = statusFilter.value.value === 'active'
    console.log('🚦 Filtering by status. Looking for isActive =', isActive)
    
    const beforeCount = result.length
    result = result.filter(tag => {
      console.log(`   Tag "${tag.name}": isActive=${tag.isActive} (type: ${typeof tag.isActive})`)
      return tag.isActive === isActive
    })
    console.log(`   Status filter: ${beforeCount} → ${result.length} tags`)
  }

  // Filter by type
  if (typeFilter.value) {
    console.log('🏷️ Filtering by type. Looking for type =', typeFilter.value)
    
    const beforeCount = result.length
    result = result.filter(tag => {
      const tagType = (tag as any).type || 'monitoring' // default to monitoring if type not set
      console.log(`   Tag "${tag.name}": type="${tagType}" (expected: "${typeFilter.value.value}")`)
      const matches = tagType === typeFilter.value.value
      console.log(`   → Match: ${matches}`)
      return matches
    })
    console.log(`   Type filter: ${beforeCount} → ${result.length} tags`)
  }

  // Filter by search text
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    console.log('🔤 Filtering by search:', search)
    
    const beforeCount = result.length
    result = result.filter(tag => 
      tag.name.toLowerCase().includes(search) ||
      (tag.description && tag.description.toLowerCase().includes(search))
    )
    console.log(`   Search filter: ${beforeCount} → ${result.length} tags`)
  }

  // Sort alphabetically
  result.sort((a, b) => a.name.localeCompare(b.name, 'bg-BG'))
  
  console.log('✅ Final result count:', result.length)
  console.log('📋 Final tags:', result.map(t => ({ name: t.name, type: (t as any).type, isActive: t.isActive })))
  console.log('=== FILTER DEBUG END ===')

  return result
})

// Methods
async function loadTags() {
  loading.value = true
  try {
    tags.value = await monitoringService.getTags()
    
    console.log('🔄 LOADED TAGS DEBUG:')
    console.log('📊 Raw tags from API:', tags.value)
    console.log('📈 Tags count:', tags.value.length)
    tags.value.forEach((tag, index) => {
      console.log(`   [${index}] "${tag.name}": type="${(tag as any).type}", isActive=${tag.isActive}`)
    })
    
    // Load last values for each tag
    await loadLastValues()
  } catch (error) {
    console.error('Error loading tags:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на таговете'
    })
  } finally {
    loading.value = false
  }
}

// Load last values for all tags
async function loadLastValues() {
  try {
    const promises = tags.value.map(async (tag) => {
      try {
        const lastData = await monitoringService.getLatestData(tag._id)
        // Add lastValue to tag object
        ;(tag as any).lastValue = {
          value: lastData.value,
          timestamp: lastData.timestamp
        }
      } catch (error) {
        // If no data exists for tag, set null
        ;(tag as any).lastValue = null
      }
    })
    
    await Promise.all(promises)
  } catch (error) {
    console.error('Error loading last values:', error)
  }
}

// Refresh only last values for existing tags
async function refreshLastValues() {
  refreshingLastValues.value = true
  try {
    await loadLastValues()
    $q.notify({
      type: 'positive',
      message: 'Последните стойности са обновени',
      timeout: 2000
    })
  } catch (error) {
    console.error('Error refreshing last values:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при обновяване на последните стойности'
    })
  } finally {
    refreshingLastValues.value = false
  }
}

function editTag(tag: MonitoringTag) {
  editingTag.value = tag
  tagForm.value = {
    name: tag.name,
    description: tag.description || '',
    isActive: tag.isActive,
    type: (tag as any).type || 'monitoring',
    tolerance: (tag as any).tolerance
  }
  showCreateDialog.value = true
}

function cancelEdit() {
  showCreateDialog.value = false
  editingTag.value = null
  tagForm.value = {
    name: '',
    description: '',
    isActive: true,
    type: 'monitoring',
    tolerance: undefined
  }
}

async function saveTag() {
  saving.value = true
  try {
    if (editingTag.value) {
      // Update existing tag
      await monitoringService.updateTag(editingTag.value._id, tagForm.value)
      $q.notify({
        type: 'positive',
        message: 'Тагът е обновен успешно'
      })
    } else {
      // Create new tag
      await monitoringService.createTag(tagForm.value)
      $q.notify({
        type: 'positive',
        message: 'Тагът е създаден успешно'
      })
    }
    
    await loadTags()
    cancelEdit()
  } catch (error: any) {
    console.error('Error saving tag:', error)

    let errorMessage = 'Грешка при запис на тага'

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.response?.data?.details) {
      const details = error.response.data.details
      if (Array.isArray(details)) {
        errorMessage = details.join(', ')
      } else if (typeof details === 'string') {
        errorMessage = details
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    $q.notify({
      type: 'negative',
      message: errorMessage,
      timeout: 3000
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(tag: MonitoringTag) {
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете тага "${tag.name}"?`,
    cancel: {
      label: 'Отказ',
      flat: true
    },
    ok: {
      label: 'Изтрий',
      color: 'negative'
    },
    persistent: true
  }).onOk(async () => {
    try {
      await monitoringService.deleteTag(tag._id)
      $q.notify({
        type: 'positive',
        message: 'Тагът е изтрит успешно'
      })
      await loadTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      $q.notify({
        type: 'negative',
        message: 'Грешка при изтриване на тага'
      })
    }
  })
}

async function viewStats(tag: MonitoringTag) {
  selectedTag.value = tag
  selectedStatsPeriod.value = 24 // Reset to default
  await loadStatsForCurrentTag()
  showStatsDialog.value = true
}

async function loadStatsForCurrentTag() {
  if (!selectedTag.value) return
  
  loadingStats.value = true
  try {
    tagStats.value = await monitoringService.getDataStats(selectedTag.value._id, selectedStatsPeriod.value)
  } catch (error) {
    console.error('Error loading stats:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на статистиките'
    })
  } finally {
    loadingStats.value = false
  }
}

async function loadStatsForPeriod() {
  await loadStatsForCurrentTag()
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('bg-BG')
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) {
    return 'току що'
  } else if (diffMinutes < 60) {
    return `преди ${diffMinutes} мин`
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60)
    return `преди ${hours} ч`
  } else {
    return date.toLocaleDateString('bg-BG')
  }
}

// 📊 Monitoring Programs Methods


/**
 * Load available flows with monitoring tags
 */
async function loadAvailableFlows() {
  loadingFlows.value = true
  try {
    availableFlows.value = await monitoringFlowService.getAvailableFlows()
  } catch (error) {
    console.error('Error loading available flows:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на достъпните потоци'
    })
  } finally {
    loadingFlows.value = false
  }
}

/**
 * Load all monitoring flows (active and inactive)
 */
async function loadActiveMonitoringFlows() {
  loadingFlows.value = true
  try {
    activeMonitoringFlows.value = await monitoringFlowService.getAllMonitoringFlows()
  } catch (error) {
    console.error('Error loading monitoring flows:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на мониторинг потоците'
    })
  } finally {
    loadingFlows.value = false
  }
}

/**
 * Activate monitoring for selected flow
 */
async function activateMonitoringFlow() {
  if (!selectedFlow.value || !monitoringInterval.value) {
    $q.notify({
      type: 'negative',
      message: 'Моля, изберете поток и въведете интервал'
    })
    return
  }

  loadingActivation.value = true
  try {
    // Find selected flow details
    const selectedFlowData = availableFlows.value.find(f => f._id === selectedFlow.value)
    if (!selectedFlowData) {
      throw new Error('Не е намерен избраният поток')
    }

    // Create monitoring flow
    await monitoringFlowService.createMonitoringFlow({
      flowTemplateId: selectedFlow.value,
      name: `Мониторинг: ${selectedFlowData.name}`,
      description: `Автоматичен мониторинг на ${selectedFlowData.name}`,
      monitoringInterval: monitoringInterval.value
    })

    $q.notify({
      type: 'positive',
      message: 'Мониторинг потокът е създаден успешно'
    })

    // Clear selection and reload data
    selectedFlow.value = null
    monitoringInterval.value = 5
    await loadAvailableFlows()
    await loadActiveMonitoringFlows()

  } catch (error) {
    console.error('Error creating monitoring flow:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при създаване на мониторинг поток'
    })
  } finally {
    loadingActivation.value = false
  }
}

/**
 * Activate monitoring flow
 */
async function activateFlow(flowId: string) {
  loadingDeactivation.value = flowId
  try {
    await monitoringFlowService.activateMonitoringFlow(flowId)

    $q.notify({
      type: 'positive',
      message: 'Мониторинг потокът е активиран успешно'
    })

    // Reload data
    await loadAvailableFlows()
    await loadActiveMonitoringFlows()

  } catch (error) {
    console.error('Error activating monitoring flow:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при активиране на мониторинг потока'
    })
  } finally {
    loadingDeactivation.value = null
  }
}

/**
 * Deactivate monitoring flow (stop)
 */
async function deactivateMonitoringFlow(flowId: string) {
  loadingDeactivation.value = flowId
  try {
    await monitoringFlowService.deactivateMonitoringFlow(flowId)

    $q.notify({
      type: 'positive',
      message: 'Мониторинг потокът е спрян успешно'
    })

    // Reload data
    await loadAvailableFlows()
    await loadActiveMonitoringFlows()

  } catch (error) {
    console.error('Error deactivating monitoring flow:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при спиране на мониторинг потока'
    })
  } finally {
    loadingDeactivation.value = null
  }
}

/**
 * Delete monitoring flow completely
 */
async function deleteMonitoringFlow(flowId: string) {
  const flow = activeMonitoringFlows.value.find(f => f._id === flowId)
  if (!flow) return

  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете мониторинг потока "${flow.name}"?`,
    cancel: {
      label: 'Отказ',
      flat: true
    },
    ok: {
      label: 'Изтрий',
      color: 'negative'
    },
    persistent: true
  }).onOk(async () => {
    loadingDeactivation.value = flowId
    try {
      await monitoringFlowService.deleteMonitoringFlow(flowId)

      $q.notify({
        type: 'positive',
        message: 'Мониторинг потокът е изтрит успешно'
      })

      // Reload data
      await loadAvailableFlows()
      await loadActiveMonitoringFlows()

    } catch (error) {
      console.error('Error deleting monitoring flow:', error)
      $q.notify({
        type: 'negative',
        message: 'Грешка при изтриване на мониторинг потока'
      })
    } finally {
      loadingDeactivation.value = null
    }
  })
}

/**
 * Edit monitoring flow interval
 */
function editMonitoringFlow(flowId: string) {
  const flow = activeMonitoringFlows.value.find(f => f._id === flowId)
  if (!flow) return

  $q.dialog({
    title: 'Редактиране на интервал',
    message: `Мониторинг поток: ${flow.name}`,
    prompt: {
      model: flow.monitoringInterval?.toString() || '5',
      type: 'number',
      label: 'Интервал (минути)',
      min: 1,
      max: 1440
    },
    cancel: true,
    persistent: true
  }).onOk(async (newInterval: string) => {
    const interval = parseInt(newInterval)
    if (isNaN(interval) || interval < 1 || interval > 1440) {
      $q.notify({
        type: 'negative',
        message: 'Невалиден интервал (1-1440 минути)'
      })
      return
    }

    try {
      await monitoringFlowService.updateMonitoringInterval(flowId, interval)

      $q.notify({
        type: 'positive',
        message: 'Интервалът е обновен успешно'
      })

      await loadActiveMonitoringFlows()

    } catch (error) {
      console.error('Error updating monitoring interval:', error)
      $q.notify({
        type: 'negative',
        message: 'Грешка при обновяване на интервала'
      })
    }
  })
}

// Lifecycle
onMounted(() => {
  loadTags()
  loadAvailableFlows()
  loadActiveMonitoringFlows()
})
</script>