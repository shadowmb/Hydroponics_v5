<template>
  <div class="programs-tab">
    <!-- Header Section -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h6 text-weight-bold">Всички програми</div>
        <div class="text-caption text-grey-6">Управление на хидропонните програми</div>
      </div>
      <q-btn
        label="Създай програма"
        icon="add"
        color="hydro-green"
        to="/programs/create"
        unelevated
        class="text-weight-medium"
      />
    </div>

    <!-- Programs Table -->
    <q-card flat bordered>
      <q-table
        :rows="programs"
        :columns="columns"
        row-key="id"
        flat
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="Няма създадени програми"
        :loading="loading"
        class="programs-table"
      >
        <template v-slot:body-cell-expand="props">
          <q-td :props="props">
            <q-btn
              :icon="isExpanded(props.row.id) ? 'remove' : 'add'"
              color="primary"
              flat
              dense
              round
              size="sm"
              @click="toggleExpanded(props.row.id)"
            >
              <q-tooltip>{{ isExpanded(props.row.id) ? 'Свий' : 'Разгъни' }} цикли</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template v-slot:body-cell-cycles="props">
          <q-td :props="props">
            <q-chip
              :color="props.row.cycles && props.row.cycles.length > 0 ? 'hydro-green' : 'grey-5'"
              text-color="white"
              size="sm"
              :label="props.row.cycles ? props.row.cycles.length : 0"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip
              v-if="props.value"
              :color="getStatusColor(props.value)"
              text-color="white"
              size="sm"
              :label="props.value"
            />
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="row q-gutter-sm">
              <q-btn
                icon="play_arrow"
                color="positive"
                flat
                dense
                round
                size="sm"
                :disable="canActivateProgram"
                @click="activateProgram(props.row.id)"
              >
                <q-tooltip>{{ canActivateProgram ? 'Има активна програма' : 'Активирай' }}</q-tooltip>
              </q-btn>
              <q-btn
                icon="edit"
                color="primary"
                flat
                dense
                round
                size="sm"
                @click="editProgram(props.row.id)"
              >
                <q-tooltip>Редактирай</q-tooltip>
              </q-btn>
              <q-btn
                icon="delete"
                color="negative"
                flat
                dense
                round
                size="sm"
                @click="deleteProgram(props.row.id)"
              >
                <q-tooltip>Изтрий</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              <template v-if="col.name === 'expand'">
                <q-btn
                  :icon="isExpanded(props.row.id) ? 'remove' : 'add'"
                  color="primary"
                  flat
                  dense
                  round
                  size="sm"
                  @click="toggleExpanded(props.row.id)"
                >
                  <q-tooltip>{{ isExpanded(props.row.id) ? 'Свий' : 'Разгъни' }} цикли</q-tooltip>
                </q-btn>
              </template>
              <template v-else-if="col.name === 'cycles'">
                <q-chip
                  :color="props.row.cycles && props.row.cycles.length > 0 ? 'hydro-green' : 'grey-5'"
                  text-color="white"
                  size="sm"
                  :label="props.row.cycles ? props.row.cycles.length : 0"
                />
              </template>
              <template v-else-if="col.name === 'status'">
                <q-chip
                  v-if="col.value"
                  :color="getStatusColor(col.value)"
                  text-color="white"
                  size="sm"
                  :label="col.value"
                />
                <span v-else class="text-grey-6">—</span>
              </template>
              <template v-else-if="col.name === 'actions'">
                <div class="row q-gutter-sm">
                  <q-btn
                    icon="play_arrow"
                    color="positive"
                    flat
                    dense
                    round
                    size="sm"
                    :disable="canActivateProgram"
                    @click="activateProgram(props.row.id)"
                  >
                    <q-tooltip>{{ canActivateProgram ? 'Има активна програма' : 'Активирай' }}</q-tooltip>
                  </q-btn>
                  <q-btn
                    icon="edit"
                    color="primary"
                    flat
                    dense
                    round
                    size="sm"
                    @click="editProgram(props.row.id)"
                  >
                    <q-tooltip>Редактирай</q-tooltip>
                  </q-btn>
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    dense
                    round
                    size="sm"
                    @click="deleteProgram(props.row.id)"
                  >
                    <q-tooltip>Изтрий</q-tooltip>
                  </q-btn>
                </div>
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </q-td>
          </q-tr>
          
          <!-- Expanded Cycles Row -->
          <q-tr v-if="isExpanded(props.row.id)" :props="props">
            <q-td colspan="100%" class="q-pa-none">
              <div class="bg-grey-1 q-pa-md">
                <div class="text-subtitle2 q-mb-sm text-weight-medium">
                  <q-icon name="schedule" class="q-mr-xs" />
                  Цикли на програма "{{ props.row.name }}"
                </div>
                
                <q-table
                  :rows="props.row.cycles || []"
                  :columns="cycleColumns"
                  row-key="id"
                  flat
                  dense
                  hide-bottom
                  no-data-label="Няма дефинирани цикли"
                  class="cycles-subtable"
                >
                  <template v-slot:body-cell-actions="cycleProps">
                    <q-td :props="cycleProps">
                      <div v-if="cycleProps.row.actions && cycleProps.row.actions.length > 0" class="row q-gutter-xs">
                        <q-chip
                          v-for="(action, index) in cycleProps.row.actions"
                          :key="index"
                          color="primary"
                          outline
                          size="sm"
                          class="q-ma-xs"
                        >
                          <div class="row items-center no-wrap q-gutter-xs">
                            <div class="text-caption">{{ getActionIcon(action) }}</div>
                            <div class="text-caption text-weight-medium">{{ getActionName(action) }}</div>
                            <div v-if="getActionPreview(action)" class="text-caption text-grey-6">
                              ({{ getActionPreview(action) }})
                            </div>
                          </div>
                          <q-tooltip class="bg-dark text-white" anchor="top middle" self="bottom middle">
                            <div class="q-pa-sm" style="max-width: 300px;">
                              <div class="text-weight-bold q-mb-sm">{{ getActionName(action) }}</div>
                              <div v-if="action.actionTemplateId?.description" class="text-caption text-italic text-grey-4 q-mb-sm">
                                {{ action.actionTemplateId.description }}
                              </div>
                              <div class="text-caption">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                              <div v-if="getActionParameters(action).length > 0" class="q-mt-sm">
                                <div v-for="param in getActionParameters(action)" :key="param.name" class="text-caption">
                                  • {{ param.displayName }}: {{ param.value }}{{ param.unit ? ' ' + param.unit : '' }}
                                </div>
                              </div>
                              <div v-else class="text-caption text-grey-5 q-mt-sm">
                                Няма параметри за показване
                              </div>
                            </div>
                          </q-tooltip>
                        </q-chip>
                      </div>
                      <div v-else class="text-caption text-grey-5">
                        Няма действия
                      </div>
                    </q-td>
                  </template>
                </q-table>
                
                <div class="text-caption text-grey-6 q-mt-sm">
                  <q-icon name="info" class="q-mr-xs" />
                  За редактиране на цикли и действия използвайте бутона "Редактирай" на програмата
                </div>
              </div>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <!-- Empty State -->
    <div v-if="programs.length === 0 && !loading" class="text-center q-pa-xl">
      <q-icon name="science" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">Няма създадени програми</div>
      <div class="text-body2 text-grey-5 q-mb-md">
        Започнете с създаването на нова програма за хидропонната система
      </div>
      <q-btn
        label="Създай първата програма"
        icon="add"
        color="hydro-green"
        to="/programs/create"
        unelevated
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useActiveProgramStore } from '../../../stores/activeProgram'
import { API_BASE_URL } from '../../../config/ports'

const router = useRouter()
const $q = useQuasar()
const activeProgramStore = useActiveProgramStore()

// Expanded rows state
const expandedRows = ref([])

// Programs data
const programs = ref([])
const loading = ref(false)

// Computed properties for active program logic
const canActivateProgram = computed(() => {
  return activeProgramStore.hasActiveProgram
})

// Get program status based on active program store
function getProgramStatus(programId: string): string {
  const activeProgram = activeProgramStore.activeProgram
  
  // Only the loaded program has status, all others show no status
  if (!activeProgram || activeProgram.programId._id !== programId) {
    return '' // No status for inactive programs
  }
  
  // Any program that is loaded shows status based on its current state
  switch (activeProgram.status) {
    case 'loaded':
    case 'stopped':
      return 'Заредена' // Loaded or stopped = "Заредена"
    case 'running':
      return 'Активна'
    case 'paused':
      return 'Пауза'
    case 'scheduled':
      return 'Отложена'
    default:
      return 'Заредена' // Default to "Заредена" for any loaded program
  }
}

// Table columns configuration
const columns = [
  {
    name: 'expand',
    label: '',
    align: 'left',
    field: 'expand',
    sortable: false,
    style: 'width: 40px'
  },
  {
    name: 'name',
    required: true,
    label: 'Име на програмата',
    align: 'left',
    field: 'name',
    sortable: true
  },
  {
    name: 'plantType',
    label: 'Вид растение',
    align: 'left',
    field: 'plantType',
    sortable: true
  },
  {
    name: 'cycles',
    label: 'Цикли',
    align: 'center',
    field: row => row.cycles ? row.cycles.length : 0,
    sortable: true,
    style: 'width: 80px'
  },
  {
    name: 'createdAt',
    label: 'Създадена на',
    align: 'left',
    field: 'createdAt',
    sortable: true
  },
  {
    name: 'status',
    label: 'Статус',
    align: 'center',
    field: 'status',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Действия',
    align: 'center',
    field: 'actions',
    sortable: false
  }
]

// Cycle table columns for expanded view
const cycleColumns = [
  {
    name: 'time',
    label: 'Време',
    align: 'left',
    field: 'time',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Действия (Action Templates)',
    align: 'left',
    field: 'actions',
    sortable: false
  }
]

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'Активна':
      return 'positive'
    case 'Заредена':
      return 'info'
    case 'Пауза':
      return 'warning'
    case 'Отложена':
      return 'secondary'
    case '': // No status
      return 'grey-5'
    default:
      return 'grey-6'
  }
}

// Expand/collapse functionality
function toggleExpanded(programId: number) {
  const index = expandedRows.value.indexOf(programId)
  if (index > -1) {
    expandedRows.value.splice(index, 1)
  } else {
    expandedRows.value.push(programId)
  }
}

function isExpanded(programId: number): boolean {
  return expandedRows.value.includes(programId)
}

// Action display functions
function getActionIcon(action: any): string {
  if (action.actionTemplateId && typeof action.actionTemplateId === 'object') {
    return action.actionTemplateId.icon || '🔧'
  }
  return '🔧'
}

function getActionName(action: any): string {
  if (action.actionTemplateId && typeof action.actionTemplateId === 'object') {
    return action.actionTemplateId.name || 'Unknown'
  }
  return 'Unknown'
}

function getActionPreview(action: any): string {
  if (action.actionTemplateId && typeof action.actionTemplateId === 'object') {
    const template = action.actionTemplateId
    const previewParams = template.parameters?.filter(p => p.showInPreview)
      .map(p => `${p.displayName}: ${action.overrideParameters?.[p.name] ?? p.value}`)
      .join(', ') || ''
    return previewParams
  }
  return ''
}

function getActionParameters(action: any): any[] {
  console.log('DEBUG: getActionParameters called with:', action)
  console.log('DEBUG: action.actionTemplateId type:', typeof action.actionTemplateId)
  console.log('DEBUG: action.actionTemplateId value:', action.actionTemplateId)
  console.log('DEBUG: action.overrideParameters:', action.overrideParameters)
  
  if (action.actionTemplateId && typeof action.actionTemplateId === 'object') {
    const template = action.actionTemplateId
    console.log('DEBUG: template object:', template)
    console.log('DEBUG: template.globalVariablesMetadata:', template.globalVariablesMetadata)
    
    // Use globalVariablesMetadata instead of old parameters
    if (template.globalVariablesMetadata && template.globalVariablesMetadata.length > 0) {
      console.log('DEBUG: Found globalVariablesMetadata with length:', template.globalVariablesMetadata.length)
      
      const result = template.globalVariablesMetadata.map(globalVar => {
        console.log('DEBUG: Processing globalVar:', globalVar)
        const paramObj = {
          name: globalVar.name,
          displayName: globalVar.displayName || globalVar.variableName,
          value: action.overrideParameters?.[globalVar.variableName] ?? globalVar.value,
          unit: globalVar.unit || ''
        }
        console.log('DEBUG: Created param object:', paramObj)
        return paramObj
      })
      
      console.log('DEBUG: Final result array:', result)
      return result
    } else {
      console.log('DEBUG: No globalVariablesMetadata found or empty')
    }
  } else {
    console.log('DEBUG: actionTemplateId is not an object or is null/undefined')
  }
  
  console.log('DEBUG: Returning empty array')
  return []
}

// Action handlers (placeholder implementations)
function editProgram(id: number) {
  // TODO: Navigate to edit page
  console.log('Edit program:', id)
  router.push(`/programs/${id}/edit`)
}

async function activateProgram(id: number) {
  try {
    const programId = id.toString()
    const mockControllerId = '507f1f77bcf86cd799439011' // Same as LoadProgramCard.vue
    
    await activeProgramStore.loadProgram(programId, {
      controllerId: mockControllerId // LEGACY parameter, not used by FlowExecutor
    })
    
    $q.notify({
      type: 'positive',
      message: 'Програмата е активирана успешно'
    })
    
    // Reload programs to update status display
    await loadPrograms()
    
  } catch (error) {
    console.error('Error activating program:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при активиране на програмата'
    })
  }
}

// Duplicate function removed as requested

// Load programs from API
const loadPrograms = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/programs`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('DEBUG: Full programs data:', result.data)
    if (result.success) {
      programs.value = result.data.map(program => ({
        id: program._id,
        name: program.name,
        plantType: program.plantType || 'Неопределен',
        createdAt: new Date(program.createdAt).toLocaleDateString('bg-BG'),
        status: getProgramStatus(program._id),
        cycles: program.cycles?.map(cycle => ({
          id: cycle._id || Math.random(),
          time: cycle.startTime,
          actions: cycle.actions || []
        })) || []
      }))
    } else {
      throw new Error(result.error || 'Failed to load programs')
    }
  } catch (error: any) {
    console.error('Error loading programs:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на програмите: ' + error.message
    })
  } finally {
    loading.value = false
  }
}

function deleteProgram(id: number) {
  $q.dialog({
    title: 'Потвърждение',
    message: 'Сигурни ли сте, че искате да изтриете тази програма?',
    cancel: true,
    persistent: true,
    ok: {
      label: 'Изтрий',
      color: 'negative'
    },
    cancel: {
      label: 'Отказ',
      color: 'grey-6',
      flat: true
    }
  }).onOk(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/programs/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        programs.value = programs.value.filter(p => p.id !== id)
        $q.notify({
          type: 'positive',
          message: 'Програмата е изтрита успешно'
        })
      } else {
        throw new Error(result.error || 'Failed to delete program')
      }
    } catch (error: any) {
      console.error('Error deleting program:', error)
      $q.notify({
        type: 'negative',
        message: 'Грешка при изтриване на програмата: ' + error.message
      })
    }
  })
}

// Load programs on component mount and fetch active program status
onMounted(async () => {
  await Promise.all([
    loadPrograms(),
    activeProgramStore.fetchActiveProgram() // Load current active program status
  ])
})
</script>

<style scoped>
.programs-tab {
  min-height: 400px;
}

.programs-table {
  border-radius: 8px;
}

.programs-table .q-table__top {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.programs-table .q-table__bottom {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.q-btn {
  border-radius: 6px;
}

.q-chip {
  font-weight: 500;
}

.cycles-subtable {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.cycles-subtable .q-table__top {
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.cycles-subtable .q-table__bottom {
  display: none;
}

.cycles-subtable .q-td {
  padding: 8px 12px;
}

.cycles-subtable .q-chip {
  font-size: 0.75rem;
}
</style>