<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h4 class="q-ma-none text-weight-bold">Action Templates</h4>
          <p class="text-grey-6 q-mb-none">Управление на шаблони за действия</p>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Създай Action Template"
          class="text-weight-medium"
          @click="$router.push('/action-templates/create')"
        />
      </div>
    </div>

    <!-- Search and Filter Section -->
    <div class="row q-gutter-md q-mb-lg">
      <div class="col-md-6 col-sm-12">
        <q-input
          v-model="searchQuery"
          outlined
          placeholder="Търсене по име"
          dense
          clearable
          @input="debouncedSearch"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-md-3 col-sm-6">
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          outlined
          dense
          label="Филтър по статус"
          emit-value
          map-options
          @update:model-value="fetchActionTemplates"
        />
      </div>
      <div class="col-md-3 col-sm-6">
        <q-btn
          color="primary"
          icon="verified"
          label="Валидирай всички"
          dense
          @click="validateAllTemplates"
          :loading="validatingAll"
        />
      </div>
    </div>

    <!-- Action Templates List -->
    <div v-if="loading" class="text-center q-py-lg">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-grey-6 q-mt-sm">Зареждане на action templates...</div>
    </div>

    <div v-else-if="!actionTemplates.length" class="text-center q-py-xl">
      <q-icon name="inventory_2" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-md">Няма създадени Action Templates</div>
      <div class="text-grey-5 q-mb-md">Създайте първия си Action Template за да започнете</div>
      <q-btn
        color="primary"
        icon="add"
        label="Създай Action Template"
        @click="$router.push('/action-templates/create')"
      />
    </div>

    <div v-else>
      <!-- Action Templates Table -->
      <q-table
        :rows="filteredActionTemplates"
        :columns="columns as any"
        row-key="_id"
        :rows-per-page-options="[10, 25, 50]"
        :pagination="pagination"
        @request="onRequest"
        class="action-templates-table"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <template v-if="col.name === 'icon'">
                <div class="text-h5">{{ col.value }}</div>
              </template>
              <template v-else-if="col.name === 'name'">
                <div class="text-weight-medium">{{ col.value }}</div>
              </template>
              <template v-else-if="col.name === 'description'">
                <div class="text-caption">
                  {{ (col.value || 'Няма коментар').length > 50
                      ? (col.value || 'Няма коментар').substring(0, 50) + '...'
                      : (col.value || 'Няма коментар') }}
                </div>
              </template>
              <template v-else-if="col.name === 'isActive'">
                <q-badge
                  :color="col.value ? 'positive' : 'negative'"
                  :label="col.value ? 'Активен' : 'Неактивен'"
                />
              </template>
              <template v-else-if="col.name === 'usedInPrograms'">
                <div class="row q-gutter-xs items-center justify-center">
                  <q-chip
                    v-if="isUsedInPrograms(props.row)"
                    :label="`Да (${getUsedProgramsCount(props.row)})`"
                    color="positive"
                    text-color="white"
                    size="sm"
                    icon="check"
                    clickable
                    @click="showUsedPrograms(props.row)"
                  />
                  <q-chip
                    v-else
                    label="Не"
                    color="grey-5"
                    text-color="white"
                    size="sm"
                    icon="close"
                  />
                </div>
              </template>
              <template v-else-if="col.name === 'updatedAt'">
                {{ new Date(col.value).toLocaleDateString() }}
              </template>
              <template v-else-if="col.name === 'actions'">
                <div class="row q-gutter-xs">
                  <q-btn
                    size="sm"
                    color="blue"
                    icon="info"
                    round
                    dense
                    @click="viewActionTemplate(props.row)"
                  >
                    <q-tooltip>Преглед</q-tooltip>
                  </q-btn>
                  <q-btn
                    size="sm"
                    color="orange"
                    icon="edit"
                    round
                    dense
                    @click="editActionTemplate(props.row)"
                  >
                    <q-tooltip>Редактиране</q-tooltip>
                  </q-btn>
                  <q-btn
                    size="sm"
                    :color="props.row.runStatus ? 'negative' : 'positive'"
                    :icon="props.row.runStatus ? 'stop' : 'play_arrow'"
                    round
                    dense
                    @click="props.row.runStatus ? stopActionTemplate(props.row) : startActionTemplate(props.row)"
                  >
                    <q-tooltip>
                      {{ props.row.runStatus ? 'Спри ActionTemplate' : 'Стартирай ActionTemplate' }}
                    </q-tooltip>
                  </q-btn>
                  <q-btn
                    size="sm"
                    color="purple"
                    icon="account_tree"
                    round
                    dense
                    @click="editFlowTemplate(props.row)"
                    :disable="!props.row.linkedFlowId && !props.row.usedFlowIds?.length"
                  >
                    <q-tooltip>
                      {{ (props.row.linkedFlowId || props.row.usedFlowIds?.length)
                         ? 'Редакция на поток'
                         : 'Няма свързан flow за редакция'
                      }}
                    </q-tooltip>
                  </q-btn>
                  <q-btn
                    size="sm"
                    color="red"
                    icon="delete"
                    round
                    dense
                    @click="confirmDelete(props.row)"
                  >
                    <q-tooltip>Изтриване</q-tooltip>
                  </q-btn>
                </div>
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </q-td>
          </q-tr>

          <q-tr v-if="expandedTemplates.has(props.row._id)" :props="props">
            <q-td colspan="100%">
              <div class="execution-monitor q-pa-md bg-grey-1">
                <div class="row items-center justify-between q-mb-md">
                  <div class="text-subtitle1 text-weight-medium row items-center">
                    Изпълнение на "{{ props.row.name }}"
                    <span v-if="getFlowStatus(props.row._id)" :class="getFlowStatusClass(props.row._id)">
                      - {{ getFlowStatusText(props.row._id) }}
                    </span>
                    <q-btn
                      v-if="getFlowStatus(props.row._id) === 'paused'"
                      flat
                      round
                      dense
                      icon="play_arrow"
                      color="positive"
                      size="sm"
                      class="q-ml-sm"
                      @click="resumeActionTemplate()"
                    >
                      <q-tooltip>Възобнови</q-tooltip>
                    </q-btn>
                  </div>
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    size="sm"
                    @click="expandedTemplates.delete(props.row._id)"
                  />
                </div>

                <div class="blocks-scroll-container" v-if="wsStore.actionHistory.length > 0">
                  <q-list bordered separator>
                    <q-item
                      v-for="block in wsStore.actionHistory"
                      :key="block.blockId"
                    >
                      <q-item-section avatar>
                        <q-icon
                          :name="getBlockIcon(block)"
                          :color="getBlockColor(block)"
                          :class="{ 'rotating': block.isStarted }"
                        />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>{{ block.text }}</q-item-label>
                        <q-item-label caption>
                          {{ formatBlockDuration(block) }}
                        </q-item-label>
                        <q-item-label caption v-if="getBlockDetails(block)" :class="block.success === false ? 'text-negative' : 'text-primary'">
                          {{ getBlockDetails(block) }}
                        </q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <q-badge
                          :color="getStatusColor(block)"
                        >
                          {{ getStatusText(block) }}
                        </q-badge>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <div
                  v-else
                  class="text-center q-py-lg text-grey-6"
                >
                  <q-icon name="hourglass_empty" size="md" class="q-mb-sm" />
                  <div>Чака се да се стартира блок...</div>
                </div>
              </div>
            </q-td>
          </q-tr>

        </template>
      </q-table>

      <!-- Pagination info -->
      <div class="row justify-between items-center q-mt-md text-grey-6">
        <div>
          Показани {{ filteredActionTemplates.length }} от {{ actionTemplates.length }} записа
        </div>
        <div v-if="lastUpdated">
          Последно обновление: {{ lastUpdated.toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- View Action Template Dialog -->
    <q-dialog v-model="viewDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ selectedTemplate?.name }}</div>
          <div class="text-subtitle2 text-grey-6">{{ selectedTemplate?.description }}</div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="text-h4 q-mr-md">{{ selectedTemplate?.icon }}</div>
            <div>
              <div class="text-weight-medium">Иконка и статус</div>
              <q-badge
                :color="selectedTemplate?.isActive ? 'positive' : 'negative'"
                :label="selectedTemplate?.isActive ? 'Активен' : 'Неактивен'"
              />
            </div>
          </div>

          <div v-if="selectedTemplate?.flowFile" class="q-mb-md">
            <div class="text-weight-medium">Flow файл:</div>
            <div class="text-grey-7">{{ selectedTemplate.flowFile }}</div>
          </div>

          <div v-if="selectedTemplate?.globalVariablesMetadata?.some((v: any) => v.showInPreview)" class="q-mb-md">
            <div class="text-weight-medium q-mb-sm">Глобални променливи:</div>
            <q-list bordered separator>
              <q-item
                v-for="variable in selectedTemplate.globalVariablesMetadata.filter((v: any) => v.showInPreview)"
                :key="variable.variableName"
              >
                <q-item-section>
                  <q-item-label>{{ variable.displayName }}</q-item-label>
                  <q-item-label caption>{{ variable.comment }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="text-weight-medium">{{ variable.value }}</div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-if="selectedTemplate?.usedInPrograms?.length" class="q-mb-md">
            <div class="text-weight-medium q-mb-sm">Използва се в:</div>
            <q-list bordered separator>
              <q-item
                v-for="program in selectedTemplate.usedInPrograms"
                :key="program.programId"
              >
                <q-item-section>
                  <q-item-label>{{ program.programName }}</q-item-label>
                  <q-item-label caption>
                    Добавен на: {{ new Date(program.dateAdded).toLocaleDateString('bg-BG') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Затвори" @click="viewDialog = false" />
          <q-btn
            color="primary"
            label="Редактиране"
            @click="editFromView"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Used Programs Modal -->
    <q-dialog v-model="showProgramsModal" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Програми, използващи {{ selectedProgramsTemplate?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="selectedProgramsTemplate?.usedInPrograms?.length">
            <q-list separator>
              <q-item
                v-for="program in selectedProgramsTemplate.usedInPrograms"
                :key="program.programId"
              >
                <q-item-section>
                  <q-item-label>{{ program.programName }}</q-item-label>
                  <q-item-label caption>
                    Добавен на: {{ new Date(program.dateAdded).toLocaleDateString('bg-BG') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div v-else class="text-grey-6 text-center q-pa-md">
            Няма програми, използващи този ActionTemplate
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Затвори" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
// @ts-ignore
import { useWebSocketStore } from 'src/stores/websocket'
import { flowTemplateApi } from '../services/api'
import { API_BASE_URL } from '../config/ports'


const router = useRouter()
const $q = useQuasar()
const wsStore = useWebSocketStore() as any

// Data
const actionTemplates = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const lastUpdated = ref<Date | null>(null)
const viewDialog = ref(false)
const selectedTemplate = ref<any>(null)
const validatingAll = ref(false)
const expandedTemplates = ref<Set<string>>(new Set())

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

// Options
const statusOptions = [
  { label: 'Всички', value: 'all' },
  { label: 'Активни', value: 'active' },
  { label: 'Неактивни', value: 'inactive' }
]

// Table columns
const columns = [
  {
    name: 'icon',
    label: '',
    field: 'icon',
    align: 'center',
    style: 'width: 60px'
  },
  {
    name: 'name',
    label: 'Име',
    field: 'name',
    align: 'left',
    sortable: true
  },
  {
    name: 'description',
    label: 'Коментар',
    field: 'description',
    align: 'left'
  },
  {
    name: 'isActive',
    label: 'Статус',
    field: 'isActive',
    align: 'center',
    sortable: true
  },

  {
    name: 'usedInPrograms',
    label: 'Използва се',
    field: 'usedInPrograms',
    align: 'center',
    sortable: true
  },
  {
    name: 'updatedAt',
    label: 'Обновен',
    field: 'updatedAt',
    align: 'center',
    sortable: true,
    format: (val: string) => new Date(val).toLocaleDateString()
  },
  {
    name: 'actions',
    label: 'Действия',
    align: 'center',
    style: 'width: 200px'
  }
]

// Computed
const filteredActionTemplates = computed(() => {
  let filtered = actionTemplates.value

  // Status filter
  if (statusFilter.value === 'active') {
    filtered = filtered.filter(template => template.isActive)
  } else if (statusFilter.value === 'inactive') {
    filtered = filtered.filter(template => !template.isActive)
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(query) ||
      (template.description && template.description.toLowerCase().includes(query))
    )
  }

  return filtered
})

// Methods
const fetchActionTemplates = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/action-templates`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      // Validate each template's flow
      for (const template of result.data) {
        await validateTemplateFlow(template)
      }
      
      actionTemplates.value = result.data
      lastUpdated.value = new Date()
    } else {
      throw new Error(result.error || 'Failed to fetch action templates')
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на action templates: ' + error.message
    })
  } finally {
    loading.value = false
  }
}

const validateTemplateFlow = async (template: any) => {
  try {
    if (!template.flowFile) {
      template.flowValidationStatus = 'invalid'
      return
    }

    // Check if FlowTemplate exists in DB
    const response = await fetch(`${API_BASE_URL}/flow-templates/flows`)
    if (!response.ok) {
      template.flowValidationStatus = 'invalid'
      return
    }

    const result = await response.json()
    if (result.success) {
      const flowExists = result.data.some((flow: any) => 
        flow.name === template.flowFile.replace('.json', '') ||
        template.flowFile.includes(flow.flowId)
      )
      template.flowValidationStatus = flowExists ? 'validated' : 'invalid'
    } else {
      template.flowValidationStatus = 'invalid'
    }
  } catch (error) {
    template.flowValidationStatus = 'invalid'
  }
}

const viewActionTemplate = (template: any) => {
  selectedTemplate.value = template
  viewDialog.value = true
}

const editActionTemplate = (templateOrId: any) => {
  // Handle both direct ID and template object
  let template: any
  let id: string
  if (typeof templateOrId === 'string') {
    id = templateOrId
    template = actionTemplates.value.find(t => t._id === id)
  } else {
    template = templateOrId
    id = template._id
  }
  
  // Check if used in programs
  if (template && isUsedInPrograms(template)) {
    $q.dialog({
      title: 'Предупреждение',
      message: `ActionTemplate "${template.name}" се използва в ${getUsedProgramsCount(template)} програм(и). Редакцията може да повлияе на тяхното функциониране. Искате ли да продължите?`,
      cancel: 'Отказ',
      ok: 'Продължи',
      color: 'warning'
    }).onOk(() => {
      router.push(`/action-templates/${id}/edit`)
    })
    return
  }
  
  router.push(`/action-templates/${id}/edit`)
}

const editFromView = () => {
  viewDialog.value = false
  if (selectedTemplate.value) {
    editActionTemplate(selectedTemplate.value)
  }
}

const confirmDelete = (template: any) => {
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете "${template.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    deleteActionTemplate(template._id)
  })
}

const deleteActionTemplate = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/action-templates/${id}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    
    if (response.status === 400 && result.usedInPrograms) {
      $q.notify({
        type: 'negative',
        message: result.error,
        timeout: 5000,
        multiLine: true
      })
      return
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Action Template е изтрит успешно'
      })
      await fetchActionTemplates()
    } else {
      throw new Error(result.error || 'Failed to delete action template')
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при изтриване: ' + error.message
    })
  }
}

const validateAllTemplates = async () => {
  validatingAll.value = true
  try {
    let validCount = 0
    let invalidCount = 0
    
    for (const template of actionTemplates.value) {
      await validateTemplateFlow(template)
      if (template.flowValidationStatus === 'validated') {
        validCount++
      } else {
        invalidCount++
      }
    }

    $q.notify({
      type: validCount > invalidCount ? 'positive' : 'warning',
      message: 'Валидация завършена',
      caption: `${validCount} валидни, ${invalidCount} невалидни`,
      timeout: 3000
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при валидация: ' + error.message
    })
  } finally {
    validatingAll.value = false
  }
}

const onRequest = (props: any) => {
  pagination.value = props.pagination
}

// Simple debounce function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

const debouncedSearch = debounce(() => {
  // Search is handled by computed property
}, 300)

/**
 * Edit Flow Template - Opens FlowEditor for flow editing
 */
const editFlowTemplate = async (template: any) => {
  // Get flowId from linkedFlowId or usedFlowIds
  let flowId = template.linkedFlowId

  if (!flowId && template.usedFlowIds?.length > 0) {
    flowId = template.usedFlowIds[0]
  }

  if (!flowId) {
    $q.notify({
      type: 'warning',
      message: 'Този Action Template няма свързан flow',
      caption: 'Редактирайте template за да добавите flow'
    })
    return
  }

  try {
    // Fetch FlowTemplate by flowId to get MongoDB _id
    const flowTemplate = await flowTemplateApi.getLatestVersion(flowId) as any

    if (!flowTemplate || !flowTemplate._id) {
      throw new Error('Flow template не е намерен')
    }

    // Navigate to FlowEditor for editing
    const editFlowUrl = `/flow-editor/${flowTemplate._id}/edit`
    router.push(editFlowUrl)

    $q.notify({
      type: 'info',
      message: 'Отваря редактор на поток',
      caption: `За ${template.name}`,
      timeout: 2000
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при отваряне на поток: ' + error.message
    })
  }
}

const getFlowStatusColor = (status: string): string => {
  switch(status) {
    case 'validated': return 'positive'
    case 'invalid': return 'negative'    
    default: return 'grey-5'
  }
}

const getFlowStatusIcon = (status: string): string => {
  switch(status) {
    case 'validated': return 'check_circle'
    case 'invalid': return 'error'
    default: return 'help'
  }
}

const getFlowStatusLabel = (status: string): string => {
  switch(status) {
    case 'validated': return 'Валиден'
    case 'invalid': return 'Невалиден'
    default: return 'Неизвестен'
  }
}

const getFlowStatusTooltip = (status: string): string => {
  switch(status) {
    case 'validated': return 'Flow съществува в базата данни и е валиден'
    case 'invalid': return 'Flow не съществува в базата данни или е невалиден'
    default: return 'Flow статус не е проверен'
  }
}

// OLD SYNC STATUS HELPERS - COMMENTED OUT
/*
const getSyncStatusColor = (status: string): string => {
  switch (status) {
    case 'synced': return 'positive'
    case 'outdated': return 'warning' 
    case 'broken': return 'negative'
    default: return 'grey-6'
  }
}

const getSyncStatusLabel = (status: string): string => {
  switch (status) {
    case 'synced': return 'Синхронизиран'
    case 'outdated': return 'Остарял'
    case 'broken': return 'Счупен'
    default: return 'Неизвестен'
  }
}

const getSyncStatusIcon = (status: string): string => {
  switch (status) {
    case 'synced': return 'check_circle'
    case 'outdated': return 'update' 
    case 'broken': return 'error'
    default: return 'help_outline'
  }
}

const getSyncStatusTooltip = (status: string): string => {
  switch (status) {
    case 'synced': return 'Flow файлът е синхронизиран с template'
    case 'outdated': return 'Flow файлът има по-нова версия от template'
    case 'broken': return 'Проблем с flow файла или target mappings'
    default: return 'Статусът на синхронизация не е проверен'
  }
}
*/

// OLD VALIDATION FUNCTION - COMMENTED OUT
/*
const validateActionTemplate = async (template: any) => {
  try {
    template._validating = true
    
    // Call backend validation endpoint
    const response = await fetch(`${API_BASE_URL}/flows/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        flowData: template.flowData || { blocks: [], meta: { name: template.name } },
        options: { mode: 'full', checkActionTemplateCompatibility: true }
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      // Update template flow validation status
      template.flowValidationStatus = result.data.status
      template.lastFlowCheck = new Date().toISOString()
      
      $q.notify({
        type: result.data.status === 'ready' ? 'positive' : 'warning',
        message: `Flow валидация за "${template.name}"`,
        caption: `Статус: ${getFlowStatusLabel(result.data.status)}`,
        position: 'top-right',
        timeout: 3000
      })
    } else {
      throw new Error(result.error || 'Validation failed')
    }
    
  } catch (error: any) {
    console.error('❌ Flow validation error:', error)
    template.flowValidationStatus = 'invalid'
    
    $q.notify({
      type: 'negative',
      message: `Грешка при валидация на "${template.name}"`,
      caption: error.message,
      position: 'top-right'
    })
  } finally {
    template._validating = false
  }
}
*/

// OLD VALIDATION FUNCTIONS - COMMENTED OUT
/*
const validateTemplateSync = async (template: any) => {
  try {
    // TODO: IMPLEMENT_LATER - Load flow data and validate
    console.log('🔄 Validating template sync:', template.name)
    
    // For now, return current syncStatus or 'unknown'
    return template.syncStatus || 'unknown'
  } catch (error) {
    console.error('Validation error:', error)
    return 'broken'
  }
}

const runValidationCheck = async () => {
  try {
    console.log('🔄 Running ActionTemplate validation check...')
    
    const response = await fetch(`${API_BASE_URL}/action-templates/validate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      const { summary } = result.data
      console.log('✅ Validation completed:', summary)
      
      // Show notification with results
      if (summary.brokenCount > 0 || summary.outdatedCount > 0) {
        $q.notify({
          type: summary.brokenCount > 0 ? 'negative' : 'warning',
          message: `Validation завършена`,
          caption: `${summary.syncedCount} синхронизирани, ${summary.outdatedCount} остарели, ${summary.brokenCount} счупени`,
          timeout: 5000,
          actions: [
            { label: 'Обнови', color: 'white', handler: () => fetchActionTemplates() }
          ]
        })
      } else {
        $q.notify({
          type: 'positive',
          message: `Всички ${summary.totalValidated} ActionTemplates са синхронизирани`,
          timeout: 3000
        })
      }
      
      // Refresh the list to show updated sync statuses
      await fetchActionTemplates()
    } else {
      throw new Error(result.error || 'Validation failed')
    }
  } catch (error: any) {
    console.error('Validation check error:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при validation проверка: ' + error.message,
      timeout: 5000
    })
  }
}
*/

// Used In Programs logic
const isUsedInPrograms = (template: any): boolean => {
  return template.usedInPrograms && template.usedInPrograms.length > 0
}

const getUsedProgramsCount = (template: any): number => {
  return template.usedInPrograms ? template.usedInPrograms.length : 0
}

const selectedProgramsTemplate = ref<any>(null)
const showProgramsModal = ref(false)

const showUsedPrograms = (template: any) => {
  selectedProgramsTemplate.value = template
  showProgramsModal.value = true
}

// Start/Stop ActionTemplate methods
const startActionTemplate = async (template: any) => {
  try {
    // First validate execution prerequisites
    const validationResult = await validateExecutionPrerequisites()
    if (!validationResult.valid) {
      $q.dialog({
        title: 'Невалидни условия за изпълнение',
        message: validationResult.message,
        ok: 'Разбрах'
      })
      return
    }

    // Show confirmation dialog
    $q.dialog({
      title: 'Потвърждение',
      message: `Искате ли да стартирате ActionTemplate "${template.name}"?`,
      cancel: 'Отказ',
      ok: 'Стартирай'
    }).onOk(async () => {
      try {
        // Mock API call for now
        const response = await fetch(`${API_BASE_URL}/action-templates/${template._id}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.success) {
          // Clear old action history
          wsStore.clearActions()

          // Close all other expanded templates
          expandedTemplates.value.clear()

          // Update the template's runStatus and expand only this one
          template.runStatus = true
          expandedTemplates.value.add(template._id)

          // Set initial flow status to active
          wsStore.setFlowStatus('active', template._id)

          $q.notify({
            type: 'positive',
            message: `ActionTemplate "${template.name}" е стартиран успешно`
          })
        } else {
          throw new Error(result.message || 'Failed to start ActionTemplate')
        }
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: 'Грешка при стартиране: ' + error.message
        })
      }
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при стартиране: ' + error.message
    })
  }
}

const stopActionTemplate = async (template: any) => {
  try {
    // Show confirmation dialog
    $q.dialog({
      title: 'Потвърждение',
      message: `Искате ли да спрете ActionTemplate "${template.name}"?`,
      cancel: 'Отказ',
      ok: 'Спри'
    }).onOk(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/action-templates/${template._id}/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.success) {
          template.runStatus = false

          $q.notify({
            type: 'positive',
            message: `ActionTemplate "${template.name}" е спрян успешно`
          })
        } else {
          throw new Error(result.message || 'Failed to stop ActionTemplate')
        }
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: 'Грешка при спиране: ' + error.message
        })
      }
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при спиране: ' + error.message
    })
  }
}

const resumeActionTemplate = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/action-templates/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Изпълнението е възобновено успешно'
      })
    } else {
      throw new Error(result.message || 'Failed to resume')
    }
  } catch (error: any) {
    console.error('Error resuming ActionTemplate:', error)
    $q.notify({
      type: 'negative',
      message: `Грешка при възобновяване: ${error.message}`
    })
  }
}

const validateExecutionPrerequisites = async (): Promise<{valid: boolean, message: string}> => {
  try {
    // ПЪРВА ПРОВЕРКА - ExecutionSession
    const executionSessionResponse = await fetch(`${API_BASE_URL}/execution-sessions/current`)
    if (!executionSessionResponse.ok) {
      return {
        valid: false,
        message: 'Не може да се провери статуса на текущата ExecutionSession'
      }
    }

    const executionSessionResult = await executionSessionResponse.json()
    const currentSession = executionSessionResult.data

    if (currentSession && currentSession.programStatus === 'running') {
      return {
        valid: false,
        message: 'Има активно изпълнение на поток. Изчакайте да приключи преди да стартирате ActionTemplate.'
      }
    }

    // ВТОРА ПРОВЕРКА - ActivePrograms
    const activeProgramsResponse = await fetch(`${API_BASE_URL}/active-programs`)
    if (!activeProgramsResponse.ok) {
      return {
        valid: false,
        message: 'Не може да се провери статуса на активните програми'
      }
    }

    const activeProgramsResult = await activeProgramsResponse.json()
    const activePrograms = activeProgramsResult.data || activeProgramsResult || []

    // Ensure activePrograms is an array
    const programsArray = Array.isArray(activePrograms) ? activePrograms : (activePrograms ? [activePrograms] : [])

    const runningProgram = programsArray.find((program: any) => program.status === 'running')
    if (runningProgram) {
      return {
        valid: false,
        message: 'Активната програма трябва да бъде спряна или поставена на пауза преди да стартирате ActionTemplate.'
      }
    }

    return {
      valid: true,
      message: 'Всички условия за изпълнение са изпълнени'
    }
  } catch (error: any) {
    return {
      valid: false,
      message: 'Грешка при проверка на условията за изпълнение: ' + error.message
    }
  }
}

// Helper functions for execution monitor
const getBlockIcon = (block: any): string => {
  const icons: Record<string, string> = {
    sensor: 'sensors',
    actuator: 'settings_input_component',
    if: 'call_split',
    loop: 'loop',
    completion: 'check_circle'
  }

  if (block.isStarted) return 'sync'
  if (block.success === false) return 'error'
  if (block.success === true) return 'check_circle'

  return icons[block.type] || 'radio_button_unchecked'
}

const getBlockColor = (block: any): string => {
  if (block.isStarted) return 'orange'
  if (block.success === false) return 'negative'
  if (block.success === true) return 'positive'
  return 'grey'
}

const getStatusColor = (block: any): string => {
  if (block.isStarted) return 'orange'
  if (block.success) return 'positive'
  if (block.success === false) return 'negative'
  return 'grey'
}

const getStatusText = (block: any): string => {
  if (block.isStarted) return 'Running'
  if (block.success) return 'Done'
  if (block.success === false) return 'Failed'
  return 'Pending'
}

// Timer for live updates
const currentTime = ref(Date.now())
let timerInterval: NodeJS.Timeout | null = null

onMounted(() => {
  timerInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

const formatBlockDuration = (block: any): string => {
  let duration: number

  // Check if block is completed (not running)
  if (!block.isStarted && block.endTime && block.startTime) {
    // Block completed - use final fixed duration
    const startTime = new Date(block.startTime).getTime()
    const endTime = new Date(block.endTime).getTime()
    duration = Math.floor((endTime - startTime) / 1000)
  } else if (block.isStarted && (block.startTime || block.timestamp)) {
    // Block is currently running - count up
    const startTime = new Date(block.startTime || block.timestamp).getTime()
    duration = Math.floor((currentTime.value - startTime) / 1000)
  } else {
    // No timing info available
    duration = 0
  }

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getBlockDetails = (block: any): string => {
  if (!block.blockData) return ''

  const data = block.blockData

  // Convert operator name to symbol
  const operatorToSymbol = (operator: string): string => {
    const map: Record<string, string> = {
      'greater_than': '>',
      'less_than': '<',
      'greater_equal': '≥',
      'less_equal': '≤',
      'equals': '=',
      'not_equals': '≠'
    }
    return map[operator] || operator
  }

  // Show error message if block failed
  if (block.success === false) {
    return data.displayText || 'Грешка'
  }

  if (block.type === 'sensor') {
    const result = data.result
    console.log('[ActionTemplatesPage] Sensor result:', result)
    if (result && result.value !== undefined) {
      const unit = result.unit || ''
      console.log('[ActionTemplatesPage] Unit value:', unit)
      return `Стойност: ${result.value}${unit}`
    }
  }

  if (block.type === 'actuator') {
    const result = data.result
    const params = data.parameters

    // During execution - show parameters
    if (params && !result) {
      const deviceName = data.deviceName || 'Устройство'
      const actionType = params.actionType
      let duration = params.duration || 0

      // If using global variable, get value from ActionTemplate
      if (params.useGlobalVariable && params.selectedGlobalVariable) {
        const actionTemplateId = (wsStore as any).flowStatusActionTemplateId
        const actionTemplate = actionTemplates.value.find(t => t._id === actionTemplateId)
        if (actionTemplate?.globalVariables) {
          const globalValue = actionTemplate.globalVariables[params.selectedGlobalVariable]
          if (globalValue !== undefined) {
            duration = Number(globalValue)
          }
        }
      }

      const actionMap: Record<string, string> = {
        'on': 'Вкл.',
        'off': 'Изкл.',
        'on_off_timed': 'Вкл. → Изкл.',
        'off_on_timed': 'Изкл. → Вкл.',
        'toggle': 'Превключване'
      }
      const action = actionMap[actionType] || actionType

      let details = `${deviceName}: ${action}`

      if (duration > 0) {
        details += ` (${duration}s)`
      }

      if (params.powerLevel > 0 && params.powerLevel !== 100) {
        details += ` PWM: ${params.powerLevel}%`
      }

      return details
    }

    // After execution - show result with actual execution time
    if (result) {
      const deviceName = result.deviceName || data.deviceName || 'Устройство'
      return `${deviceName}: Завършено`
    }
  }

  if (block.type === 'if') {
    const result = data.result
    if (result) {
      const leftValue = result.leftValue !== undefined ? result.leftValue : ''
      const operator = operatorToSymbol(result.operator || result.comparison || '>')
      const rightValue = result.rightValue !== undefined ? result.rightValue : ''
      const conditionResult = result.conditionResult ? 'True' : 'False'
      return `${leftValue} ${operator} ${rightValue} = ${conditionResult}`
    }
  }

  if (block.type === 'loop') {
    const result = data.result
    console.log('[ActionTemplatesPage] Loop result:', result)
    if (result) {
      const iteration = result.iteration !== undefined ? result.iteration : (result.currentIteration !== undefined ? result.currentIteration : result.iterations)
      const maxIter = result.maxIterations !== undefined ? result.maxIterations : '∞'

      if (result.conditionDetails && result.conditionDetails.result !== undefined) {
        const leftValue = result.conditionDetails.leftValue !== undefined ? result.conditionDetails.leftValue : ''
        const operator = operatorToSymbol(result.conditionDetails.operator || '>')
        const rightValue = result.conditionDetails.rightValue !== undefined ? result.conditionDetails.rightValue : ''
        const condResult = result.conditionDetails.result ? 'True' : 'False'
        return `Итерация ${iteration}/${maxIter}: ${leftValue} ${operator} ${rightValue} = ${condResult}`
      } else {
        return `Итерация ${iteration}/${maxIter}`
      }
    }
  }

  return ''
}

const getFlowStatus = (actionTemplateId: string): string | null => {
  if ((wsStore as any).flowStatusActionTemplateId === actionTemplateId) {
    return (wsStore as any).flowStatus
  }
  return null
}

const getFlowStatusText = (actionTemplateId: string): string => {
  const status = getFlowStatus(actionTemplateId)
  if (status === 'paused') return 'Пауза'
  if (status === 'stopped') return 'Спрян'
  if (status === 'active') return 'Активен'
  return 'Активен'
}

const getFlowStatusClass = (actionTemplateId: string): string => {
  const status = getFlowStatus(actionTemplateId)
  if (status === 'paused') return 'text-orange'
  if (status === 'stopped') return 'text-grey'
  if (status === 'active') return 'text-positive'
  return 'text-positive'
}

// Watch for ActionTemplate completion events
watch(
  () => wsStore.actionTemplateCompletedEvent,
  (event) => {
    if (event && event.actionTemplateId) {
      const template = actionTemplates.value.find(t => t._id === event.actionTemplateId)
      if (template) {
        template.runStatus = false
      }
    }
  }
)

// Lifecycle
onMounted(async () => {
  await fetchActionTemplates()

  // Auto-expand row if ActionTemplate is currently executing
  if (wsStore.flowStatusActionTemplateId) {
    expandedTemplates.value.add(wsStore.flowStatusActionTemplateId)
  }
})
</script>

<style lang="scss" scoped>
.page-header {
  h4 {
    color: #1976d2;
  }
}

.action-templates-table {
  .q-table__top {
    padding: 12px 0;
  }

  .q-chip {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .q-td {
    vertical-align: top;
  }
}

.execution-monitor {
  border-radius: 8px;

  .rotating {
    animation: rotation 2s infinite linear;
  }

  .blocks-scroll-container {
    height: 200px;
    overflow-y: auto;
  }
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>