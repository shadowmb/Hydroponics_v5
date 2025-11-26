<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="page-header q-mb-lg">
      <div class="header-content">
        <div>
          <h4 class="text-h4 q-mb-xs">Управление на потоци</h4>
          <p class="text-subtitle1 text-grey-7">
            Централно място за управление, валидация и организация на всички flow дефиниции
          </p>
        </div>
        
        <div class="header-actions">
          <q-btn
            color="primary"
            icon="add"
            label="Създай нов поток"
            @click="createNewFlow"
          />
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-row q-mb-lg">
      <q-card flat bordered class="stat-card">
        <q-card-section>
          <div class="text-h6 text-primary">{{ totalFlows }}</div>
          <div class="text-caption text-grey-7">Общо потоци</div>
        </q-card-section>
      </q-card>
      
      <q-card flat bordered class="stat-card">
        <q-card-section>
          <div class="text-h6 text-positive">{{ readyFlows }}</div>
          <div class="text-caption text-grey-7">Готови</div>
        </q-card-section>
      </q-card>
      
      <q-card flat bordered class="stat-card">
        <q-card-section>
          <div class="text-h6 text-warning">{{ validatedFlows }}</div>
          <div class="text-caption text-grey-7">Валидни</div>
        </q-card-section>
      </q-card>
      
      <q-card flat bordered class="stat-card">
        <q-card-section>
          <div class="text-h6 text-negative">{{ invalidFlows }}</div>
          <div class="text-caption text-grey-7">Невалидни</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Flows Table -->
    <q-card flat bordered>
      <q-card-section class="q-pa-none">
        <q-table
          :rows="flows"
          :columns="flowColumns"
          row-key="_id"
          :loading="loading"
          :pagination="{ rowsPerPage: 10 }"
          binary-state-sort
          class="flows-table"
        >
          <!-- Status Column Template -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip 
                :color="getStatusColor(props.row.validationStatus)"
                :icon="getStatusIcon(props.row.validationStatus)"
                :label="getStatusLabel(props.row.validationStatus)"
                text-color="white"
                size="sm"
              />
            </q-td>
          </template>
          
          <!-- Last Updated Column Template -->
          <template v-slot:body-cell-lastUpdated="props">
            <q-td :props="props">
              <div class="text-body2">{{ formatDate(props.row.updatedAt) }}</div>
            </q-td>
          </template>

          <!-- Used Column Template -->
          <template v-slot:body-cell-used="props">
            <q-td :props="props">
              <div class="row q-gutter-xs items-center justify-center">
                <q-chip 
                  v-if="props.row.linkedActionTemplates > 0"
                  :label="`Да (${props.row.linkedActionTemplates})`"
                  color="positive"
                  text-color="white"
                  size="sm"
                  icon="check"
                  clickable
                  @click="showLinkedTemplates(props.row)"
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
            </q-td>
          </template>

          <!-- Type Column Template -->
          <template v-slot:body-cell-type="props">
            <q-td :props="props">
              <div class="row q-gutter-xs items-center justify-center">
                <q-chip 
                  v-if="props.row.isMonitoringFlow"
                  label="Мониторинг"
                  color="secondary"
                  text-color="white"
                  size="sm"
                  icon="monitor"
                />
                <span v-if="!props.row.isMonitoringFlow" class="text-grey-5">—</span>
              </div>
            </q-td>
          </template>
          
          <!-- Actions Column Template -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn 
                icon="edit" 
                size="sm" 
                flat 
                round
                color="primary"
                @click="editFlow(props.row)"
              >
                <q-tooltip>Редактирай</q-tooltip>
              </q-btn>
              
              <q-btn 
                icon="visibility" 
                size="sm" 
                flat 
                round
                color="info"
                @click="viewFlow(props.row)"
              >
                <q-tooltip>Преглед</q-tooltip>
              </q-btn>
              
              <q-btn 
                icon="more_vert" 
                size="sm" 
                flat 
                round
              >
                <q-menu>
                  <q-list dense>
                    <q-item clickable @click="duplicateFlow(props.row)">
                      <q-item-section avatar>
                        <q-icon name="file_copy" />
                      </q-item-section>
                      <q-item-section>Дублирай</q-item-section>
                    </q-item>
                    
                    <q-item clickable @click="exportFlow(props.row)">
                      <q-item-section avatar>
                        <q-icon name="download" />
                      </q-item-section>
                      <q-item-section>Експортирай</q-item-section>
                    </q-item>
                    
                    <q-separator />
                    
                    <q-item 
                      clickable 
                      @click="deleteFlow(props.row)" 
                      class="text-negative"
                      :disable="props.row.linkedActionTemplates > 0"
                    >
                      <q-item-section avatar>
                        <q-icon name="delete" />
                      </q-item-section>
                      <q-item-section>
                        {{ props.row.linkedActionTemplates > 0 ? 'Използва се в ActionTemplates' : 'Изтрий' }}
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
                <q-tooltip>Още опции</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- No data template -->
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-7 q-gutter-sm">
              <q-icon size="2em" name="search_off" />
              <span class="text-subtitle1">Няма намерени потоци</span>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Linked ActionTemplates Dialog -->
    <q-dialog v-model="showLinkedDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Използва се в ActionTemplates</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle2 q-mb-md">
            Поток: <strong>{{ selectedFlow?.name }}</strong>
          </div>
          
          <q-list dense bordered separator>
            <q-item v-for="template in linkedTemplates" :key="template._id">
              <q-item-section avatar>
                <q-icon name="assignment" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ template.name }}</q-item-label>
                <q-item-label caption>{{ template.description || 'Няма описание' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="info" :label="`v${template.version}`" />
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="linkedTemplates.length === 0" class="text-center text-grey-7 q-pa-md">
            Няма свързани ActionTemplates
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { flowTemplateApi, actionTemplateApi } from '../services/api'

// Router & Quasar
const $q = useQuasar()
const router = useRouter()

// Reactive state
const loading = ref(true)
const flows = ref<FlowItem[]>([])
const showLinkedDialog = ref(false)
const selectedFlow = ref<FlowItem | null>(null)
const linkedTemplates = ref<any[]>([])

// Flow Item interface
interface FlowItem {
  _id: string
  name: string
  version: string
  validationStatus: 'draft' | 'invalid' | 'validated' | 'ready'
  updatedAt: string
  linkedActionTemplates: number
  isMonitoringFlow: boolean
  flowId: string
  versionId: string
  filePath: string
  jsonFileName: string
}

// Table columns definition
const flowColumns = [
  {
    name: 'name',
    label: 'Име на потока',
    field: 'name',
    sortable: true,
    align: 'left' as const
  },
  {
    name: 'used',
    label: 'Използва',
    field: 'linkedActionTemplates',
    sortable: true,
    align: 'center' as const
  },
  {
    name: 'status',
    label: 'Статус',
    field: 'validationStatus',
    sortable: true,
    align: 'center' as const
  },
  {
    name: 'lastUpdated',
    label: 'Последна промяна',
    field: 'updatedAt',
    sortable: true,
    align: 'center' as const
  },
  {
    name: 'type',
    label: 'Вид',
    field: 'isMonitoringFlow',
    align: 'center' as const
  },
  {
    name: 'actions',
    label: 'Действия',
    align: 'center' as const
  }
]

// Computed statistics
const totalFlows = computed(() => flows.value.length)
const readyFlows = computed(() => flows.value.filter(f => f.validationStatus === 'ready').length)
const validatedFlows = computed(() => flows.value.filter(f => f.validationStatus === 'validated').length)
const invalidFlows = computed(() => flows.value.filter(f => f.validationStatus === 'invalid').length)

// Status helper functions
const getStatusColor = (status: string) => {
  switch(status) {
    case 'ready': return 'positive'
    case 'validated': return 'warning'
    case 'invalid': return 'negative'
    case 'draft': return 'grey'
    default: return 'grey-5'
  }
}

const getStatusIcon = (status: string) => {
  switch(status) {
    case 'ready': return 'check_circle'
    case 'validated': return 'warning'
    case 'invalid': return 'error'
    case 'draft': return 'edit'
    default: return 'help'
  }
}

const getStatusLabel = (status: string) => {
  switch(status) {
    case 'ready': return 'Готов'
    case 'validated': return 'Валидиран'
    case 'invalid': return 'Невалиден'
    case 'draft': return 'Draft'
    default: return 'Неизвестен'
  }
}

const formatDate = (isoString: string) => {
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString('bg-BG') + ' ' + date.toLocaleTimeString('bg-BG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } catch (error) {
    return 'Невалидна дата'
  }
}

// Load flows data
const loadFlows = async () => {
  try {
    loading.value = true
    
    // Load flows using new API с latest-only filter za UI simplification
    const data = await flowTemplateApi.getAll({ 
      isActive: true,
      latestOnly: true 
    })
    
    // For each flow, check how many ActionTemplates use it using DB lookup
    const flowsWithCounts = await Promise.all(
      data.map(async (template: any) => {
        let linkedActionTemplates = 0
        
        if (template.flowId) {
          try {
            const usageData = await flowTemplateApi.getUsageCount(template.flowId)
            linkedActionTemplates = usageData.count
          } catch (error) {
            console.warn(`Could not check ActionTemplate usage for flowId: ${template.flowId}`)
          }
        }
        
        return {
          _id: template._id,
          name: template.name,
          version: template.version,
          validationStatus: template.validationStatus || 'draft',
          updatedAt: template.updatedAt,
          linkedActionTemplates,
          isMonitoringFlow: template.isMonitoringFlow || false,
          flowId: template.flowId,
          versionId: template.versionId,
          filePath: template.filePath,
          jsonFileName: template.jsonFileName || '',
          description: template.description,
          isActive: template.isActive
        }
      })
    )
    
    flows.value = flowsWithCounts
    
  } catch (error) {
    console.error('❌ Error loading flows:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на потоците',
      position: 'top-right'
    })
  } finally {
    loading.value = false
  }
}

// Action handlers
const createNewFlow = () => {
  router.push('/flow-editor')
}

const editFlow = async (flow: FlowItem) => {
  // Проверка за използване в ActionTemplates
  if (flow.linkedActionTemplates > 0) {
    $q.dialog({
      title: 'Предупреждение',
      message: `Потокът "${flow.name}" се използва в ${flow.linkedActionTemplates} ActionTemplate(s). Редакцията може да повлияе на тяхното функциониране. Искате ли да продължите?`,
      cancel: 'Отказ',
      ok: 'Продължи',
      color: 'warning'
    }).onOk(() => {
      router.push(`/flow-editor/${flow._id}/edit`)
    })
    return
  }
  
  router.push(`/flow-editor/${flow._id}/edit`)
}

const viewFlow = (flow: FlowItem) => {
  router.push(`/flow-editor?id=${flow._id}&readonly=true`)
}

const duplicateFlow = (flow: FlowItem) => {
  $q.dialog({
    title: 'Дублиране на поток',
    message: 'Въведете име за новия поток:',
    prompt: {
      model: `${flow.name} (копие)`,
      type: 'text',
      isValid: (val: string) => !!(val && val.trim().length > 0)
    },
    cancel: 'Отказ',
    ok: 'Дублирай',
    color: 'primary'
  }).onOk(async (newName: string) => {
    try {
      await flowTemplateApi.duplicate(flow._id, newName)

      // Reload flows list
      await loadFlows()

      $q.notify({
        type: 'positive',
        message: `Потокът "${newName}" е дублиран успешно`,
        position: 'top-right'
      })
    } catch (error: any) {
      // Handle 409 conflict (duplicate name)
      if (error.status === 409) {
        $q.notify({
          type: 'warning',
          message: 'Поток с това име вече съществува',
          position: 'top-right'
        })
      } else {
        $q.notify({
          type: 'negative',
          message: `Грешка при дублиране: ${error.message || 'Неизвестна грешка'}`,
          position: 'top-right'
        })
      }
    }
  })
}

const exportFlow = (flow: FlowItem) => {
  // TODO: IMPLEMENT_LATER - Export single flow
  $q.notify({
    type: 'info',
    message: 'Експорт на поток - в процес на разработка',
    position: 'top-right'
  })
}

const showLinkedTemplates = async (flow: FlowItem) => {
  try {
    selectedFlow.value = flow
    
    // Fetch actual ActionTemplates by flowId
    const templates = await actionTemplateApi.getByFlowId(flow.flowId)
    linkedTemplates.value = templates
    
    showLinkedDialog.value = true
    
  } catch (error) {
    console.error('❌ Error loading linked templates:', error)
    
    // Fallback to mock data if API fails
    linkedTemplates.value = [
      {
        _id: 'mock1',
        name: 'ActionTemplate ' + flow.linkedActionTemplates,
        description: 'Mock данни - API недостъпен',
        version: '1.0'
      }
    ]
    
    showLinkedDialog.value = true
    
    $q.notify({
      type: 'warning',
      message: 'Не може да се свържа с API - показвам примерни данни',
      position: 'top-right'
    })
  }
}

const deleteFlow = async (flow: FlowItem) => {
  // Проверка дали се използва в ActionTemplates
  if (flow.linkedActionTemplates > 0) {
    $q.notify({
      type: 'warning',
      message: `Потокът "${flow.name}" се използва в ${flow.linkedActionTemplates} ActionTemplate(s) и не може да се изтрие`,
      position: 'top-right',
      timeout: 3000
    })
    return
  }

  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете потока "${flow.name}"?`,
    cancel: 'Отказ',
    ok: 'Изтрий',
    color: 'negative'
  }).onOk(async () => {
    try {
      await flowTemplateApi.delete(flow._id)
      
      // Remove from local list
      flows.value = flows.value.filter(f => f._id !== flow._id)
      
      $q.notify({
        type: 'positive',
        message: `Потокът "${flow.name}" е изтрит успешно`,
        position: 'top-right'
      })
      
    } catch (error: any) {
      $q.notify({
        type: 'negative',
        message: `Грешка при изтриване: ${error.message}`,
        position: 'top-right'
      })
    }
  })
}

// Lifecycle
onMounted(() => {
  loadFlows()
})
</script>

<style scoped>
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.header-actions {
  display: flex;
  align-items: center;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  text-align: center;
}

.flows-table {
  border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
}
</style>