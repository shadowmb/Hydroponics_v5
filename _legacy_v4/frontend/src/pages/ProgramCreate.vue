<template>
  <q-page class="q-pa-md">
    <!-- Header Section -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">
          {{ isEditing ? 'Редактиране на програма' : 'Създаване на програма' }}
        </div>
        <div class="text-caption text-grey-6">
          {{ isEditing ? `Промяна на "${programForm.name}"` : 'Конфигуриране на нова хидропонна програма' }}
        </div>
      </div>
    </div>

    <!-- Main Form -->
    <div class="row q-gutter-lg">
      <!-- Program Basic Info -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Основна информация</div>
            
            <q-form>
              <q-input
                v-model="programForm.name"
                label="Име на програмата"
                outlined
                :rules="[val => !!val || 'Полето е задължително']"
                class="q-mb-md"
              />
              
              <q-select
                v-model="programForm.plantType"
                :options="plantTypeOptions"
                label="Вид растение"
                outlined
                clearable
                hint="(опционално)"
                class="q-mb-md"
              />
              
              <q-input
                v-model="programForm.description"
                label="Описание"
                type="textarea"
                outlined
                rows="3"
                class="q-mb-md"
              />
              
              <q-input
                v-model.number="programForm.maxExecutionTime"
                label="Максимално време за изпълнение на цикъл (минути)"
                type="number"
                outlined
                min="1"
                max="1440"
                :rules="[val => val >= 1 && val <= 1440 || 'Времето трябва да е между 1 и 1440 минути']"
                hint="Защитен механизъм - ако цикъл не завърши за това време, ще бъде прекратен"
                class="q-mb-md"
              >
                <template v-slot:append>
                  <q-icon name="timer" />
                </template>
              </q-input>

              <q-input
                v-model.number="minCycleInterval"
                label="Минимален интервал между цикли (минути)"
                type="number"
                outlined
                min="60"
                max="240"
                :rules="[val => val >= 60 && val <= 240 || 'Интервалът трябва да е между 60 и 240 минути']"
                hint="Минималното време между два последователни цикъла"
                class="q-mb-md"
                @update:model-value="checkMinIntervalChange"
              >
                <template v-slot:append>
                  <q-icon name="schedule" />
                </template>
              </q-input>

              <!-- TODO: IMPLEMENT_LATER - Продължителността се задава при активиране на програмата -->
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Cycles Configuration -->
      <div class="col">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Цикли на програмата</div>
            
            <!-- Cycles Table -->
            <q-table
              :rows="programForm.cycles"
              :columns="cycleColumns"
              row-key="id"
              flat
              :pagination="{ rowsPerPage: 0 }"
              no-data-label="Няма дефинирани цикли"
              class="cycles-table"
            >
              <template v-slot:body-cell-time="props">
                <q-td :props="props">
                  <q-input
                    v-model="props.row.time"
                    dense
                    outlined
                    readonly
                    mask="##:##"
                    placeholder="00:00"
                    @click="openTimePicker(props.rowIndex)"
                  >
                    <template v-slot:append>
                      <q-icon name="schedule" class="cursor-pointer" @click="openTimePicker(props.rowIndex)" />
                    </template>
                  </q-input>
                </q-td>
              </template>

              <!-- Actions Display Column -->
              <template v-slot:body-cell-cycleActions="props">
                <q-td :props="props">
                  <div v-if="!props.row.actions || props.row.actions.length === 0" class="text-grey-6 text-italic q-mb-sm">
                    Няма добавени действия
                  </div>
                  <div v-else class="column q-gutter-xs q-mb-sm">
                    <div 
                      v-for="(action, index) in props.row.actions"
                      :key="index"
                      class="action-item-card"
                    >
                      <div class="row items-center no-wrap">
                        <!-- Action Info -->
                        <div class="col">
                          <q-chip
                            color="primary"
                            outline
                            dense
                            clickable
                            @click="editCycleAction(props.row, index)"
                            class="full-width"
                            style="justify-content: flex-start;"
                          >
                            <div class="text-h6 q-mr-sm">{{ getActionIcon(action) }}</div>
                            <div>{{ getActionDisplayText(action) }}</div>
                            <q-tooltip>
                              Клик за редактиране на параметри
                            </q-tooltip>
                          </q-chip>
                        </div>
                        
                        <!-- Reorder Controls -->
                        <div class="col-auto q-ml-sm">
                          <div class="column q-gutter-none">
                            <q-btn
                              flat
                              dense
                              round
                              size="xs"
                              icon="keyboard_arrow_up"
                              :disable="index === 0"
                              @click="moveAction(props.row, index, 'up')"
                              class="action-reorder-btn"
                            >
                              <q-tooltip>Премести нагоре</q-tooltip>
                            </q-btn>
                            <q-btn
                              flat
                              dense
                              round
                              size="xs"
                              icon="keyboard_arrow_down"
                              :disable="index === props.row.actions.length - 1"
                              @click="moveAction(props.row, index, 'down')"
                              class="action-reorder-btn"
                            >
                              <q-tooltip>Премести надолу</q-tooltip>
                            </q-btn>
                          </div>
                        </div>
                        
                        <!-- Remove Action -->
                        <div class="col-auto q-ml-xs">
                          <q-btn
                            flat
                            dense
                            round
                            size="xs"
                            icon="close"
                            color="negative"
                            @click="confirmRemoveAction(props.row, index)"
                            class="action-remove-btn"
                          >
                            <q-tooltip>Премахни действие</q-tooltip>
                          </q-btn>
                        </div>
                      </div>
                      
                      <!-- Order Number -->
                      <div class="action-order-number">
                        {{ index + 1 }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Add Action Button -->
                  <q-btn
                    flat
                    dense
                    icon="add"
                    label="Добави действие"
                    color="primary"
                    size="sm"
                    @click="showAddActionDialog(props.row)"
                    class="full-width"
                    style="border: 2px dashed #1976d2; border-radius: 8px;"
                  />
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <!-- Move Up button -->
                  <q-btn
                    icon="arrow_upward"
                    color="grey-7"
                    flat
                    dense
                    round
                    size="sm"
                    :disable="props.rowIndex === 0"
                    @click="moveCycleUp(props.rowIndex)"
                    class="q-mr-xs"
                  >
                    <q-tooltip>Премести нагоре</q-tooltip>
                  </q-btn>

                  <!-- Move Down button -->
                  <q-btn
                    icon="arrow_downward"
                    color="grey-7"
                    flat
                    dense
                    round
                    size="sm"
                    :disable="props.rowIndex === programForm.cycles.length - 1"
                    @click="moveCycleDown(props.rowIndex)"
                    class="q-mr-xs"
                  >
                    <q-tooltip>Премести надолу</q-tooltip>
                  </q-btn>

                  <!-- Duplicate button -->
                  <q-btn
                    icon="content_copy"
                    color="primary"
                    flat
                    dense
                    round
                    size="sm"
                    @click="showDuplicateCycleDialog(props.row)"
                    class="q-mr-xs"
                  >
                    <q-tooltip>Дублирай цикъл</q-tooltip>
                  </q-btn>

                  <!-- Delete button -->
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    dense
                    round
                    size="sm"
                    @click="deleteCycle(props.row.id)"
                  >
                    <q-tooltip>Изтрий</q-tooltip>
                  </q-btn>
                </q-td>
              </template>
            </q-table>

            <!-- Add New Cycle Row -->
            <div class="q-mt-md">
              <q-card flat bordered class="add-cycle-card">
                <q-card-section class="q-py-sm">
                  <div class="row items-center q-gutter-sm">
                    <q-btn
                      icon="add"
                      color="hydro-green"
                      flat
                      dense
                      round
                      size="sm"
                      @click="addCycle"
                    />
                    <q-input
                      v-model="newCycleTemplate.time"
                      dense
                      outlined
                      readonly
                      placeholder="Час (напр. 08:30)"
                      style="width: 150px"
                      mask="##:##"
                      @click="openTimePickerForNewCycle"
                    >
                      <template v-slot:append>
                        <q-icon name="schedule" class="cursor-pointer" @click="openTimePickerForNewCycle" />
                      </template>
                    </q-input>
                    <div class="text-caption text-grey-6 q-ml-md">
                      Действията се дефинират чрез Action Templates
                    </div>
                    <q-btn
                      icon="add"
                      color="hydro-green"
                      flat
                      dense
                      @click="addCycle"
                      class="q-ml-sm"
                    >
                      <q-tooltip>Добави цикъл</q-tooltip>
                    </q-btn>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Cycle Validation Status -->
            <div class="q-mt-md">
              <div class="row items-center q-gutter-sm">
                <q-icon
                  :name="cycleValidation.isValid ? 'check_circle' : 'warning'"
                  :color="cycleValidation.isValid ? 'positive' : 'warning'"
                />
                <span class="text-caption">
                  {{ cycleValidation.isValid ? 'Проверка: ' : 'Внимание: ' }}
                  {{ cycleValidation.isValid ? 'OK' : cycleValidation.warnings.join(', ') }}
                </span>
              </div>
              
              <!-- TODO: IMPLEMENT_LATER - Advanced validation warnings -->
              <div class="text-caption text-grey-6 q-mt-sm">
                <q-icon name="info" class="q-mr-xs" />
                Мин. интервал: 2ч | Макс. цикли: 12 | Текущо: {{ programForm.cycles.length }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="row justify-end q-gutter-sm q-mt-lg">
      <q-btn
        label="Отказ"
        color="grey-6"
        flat
        @click="cancelCreation"
        class="text-weight-medium"
      />
      <q-btn
        :label="isEditing ? 'Запази промени' : 'Създай програма'"
        color="hydro-green"
        unelevated
        :loading="loading"
        @click="isEditing ? updateProgram() : createProgram()"
        class="text-weight-medium"
      />
    </div>

    <!-- Action Template Selection Dialog -->
    <q-dialog v-model="showActionTemplateDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">
            {{ editingActionIndex >= 0 ? 'Редактиране на действие' : 'Добавяне на действие' }}
          </div>
          <div class="text-caption text-grey-6">
            Избери Action Template и задай параметри за цикъла
          </div>
        </q-card-section>

        <q-card-section>
          <!-- Debug Info -->
          <div v-if="availableActionTemplates.length === 0" class="q-mb-md">
            <q-banner type="info" class="q-mb-sm">
              <template v-slot:avatar>
                <q-icon name="info" />
              </template>
              Няма намерени Action Templates. 
              <div class="text-caption">
                Общо templates: {{ availableActionTemplates.length }}
              </div>
            </q-banner>
            <q-btn 
              color="primary" 
              label="Обнови списъка" 
              @click="loadActionTemplates" 
              class="q-mb-md"
            />
          </div>

          <!-- Action Template Selection -->
          <div class="q-mb-lg">
            <div class="text-subtitle2 q-mb-sm">Избери Action Template ({{ availableActionTemplates.length }} налични):</div>
            <div class="row q-gutter-md">
              <q-card
                v-for="template in availableActionTemplates"
                :key="template._id"
                flat
                bordered
                clickable
                class="action-template-card"
                :class="{ 'selected': selectedActionTemplate?._id === template._id }"
                @click="selectedActionTemplate = template"
                style="width: 200px; min-height: 120px"
              >
                <q-card-section class="text-center">
                  <div class="text-h4 q-mb-sm">{{ template.icon }}</div>
                  <div class="text-weight-medium">{{ template.name }}</div>
                  <div v-if="template.description" class="text-caption text-grey-6 q-mt-xs">
                    {{ template.description }}
                  </div>
                  <q-badge
                    v-if="!template.isActive"
                    color="negative"
                    label="Неактивен"
                    class="q-mt-sm"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Global Variables Override -->
          <div v-if="selectedActionTemplate && selectedActionTemplate.globalVariablesMetadata">
            <div class="text-subtitle2 q-mb-sm">Глобални променливи за цикъла:</div>
            <div class="text-caption text-grey-6 q-mb-md">
              Можеш да промениш стойностите на глобалните променливи за този конкретен цикъл
            </div>
            
            <q-list bordered separator class="rounded-borders">
              <q-item
                v-for="globalVar in selectedActionTemplate.globalVariablesMetadata"
                :key="globalVar.variableName"
                class="q-py-md"
              >
                <q-item-section avatar>
                  <q-icon 
                    :name="globalVar.showInPreview ? 'visibility' : 'visibility_off'" 
                    :color="globalVar.showInPreview ? 'primary' : 'grey'" 
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ globalVar.displayName }}</q-item-label>
                  <q-item-label caption>{{ globalVar.variableName }}</q-item-label>
                  <q-item-label caption v-if="globalVar.comment" class="text-blue-grey">{{ globalVar.comment }}</q-item-label>
                </q-item-section>
                <q-item-section side style="min-width: 140px">
                  <q-input
                    :model-value="getGlobalVariableValue(globalVar)"
                    @update:model-value="updateGlobalVariableValue(globalVar.variableName, $event)"
                    type="number"
                    step="0.1"
                    outlined
                    dense
                    :suffix="globalVar.unit || ''"
                    style="max-width: 120px"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <!-- Flow File Info -->
            <div v-if="selectedActionTemplate.flowFile" class="q-mt-md">
              <div class="text-caption text-grey-7">
                <q-icon name="description" class="q-mr-xs" />
                Flow файл: {{ selectedActionTemplate.flowFile }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" @click="cancelActionDialog" />
          <q-btn
            color="primary"
            :label="editingActionIndex >= 0 ? 'Запази промени' : 'Добави действие'"
            :disable="!selectedActionTemplate"
            @click="confirmActionSelection"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Duplicate Cycle Dialog -->
    <q-dialog v-model="showDuplicateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Дубликиране на цикъл</div>
          <div class="text-caption text-grey-6">
            Ще се копират всички действия и параметри от цикъл {{ cycleBeingDuplicated?.number }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="duplicateTime"
            label="Час на стартиране за новия цикъл"
            outlined
            readonly
            mask="##:##"
            placeholder="00:00"
            :rules="[val => !!val || 'Моля въведете час']"
          >
            <template v-slot:append>
              <q-icon name="schedule" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time
                    v-model="duplicateTime"
                    format24h
                    mask="HH:mm"
                    :options="getTimeOptions(programForm.cycles.length)"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Затвори" color="primary" flat />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" @click="cancelDuplicateDialog" />
          <q-btn
            color="primary"
            label="Дублирай"
            :disable="!duplicateTime"
            @click="confirmDuplicateCycle"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- New Time Picker Dialog with Hour/Minute Selects -->
    <q-dialog v-model="showTimePickerDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Избор на час за стартиране</div>
          <div class="text-caption text-grey-6" v-if="timePickerCycleIndex > 0">
            Минимално време: {{ getMinimumTimeForCycle(timePickerCycleIndex) }}
            ({{ minCycleInterval }} мин след Цикъл {{ timePickerCycleIndex }})
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-gutter-md">
            <!-- Hour Select -->
            <q-select
              v-model="tempHour"
              :options="validHourOptions"
              label="Час"
              outlined
              style="width: 120px"
              @update:model-value="onHourChange"
            />

            <div class="text-h4 text-grey-6">:</div>

            <!-- Minute Select -->
            <q-select
              v-model="tempMinute"
              :options="validMinuteOptions"
              label="Минути"
              outlined
              style="width: 120px"
              :disable="tempHour === null"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Затвори" @click="closeTimePicker" />
          <q-btn
            :color="hasUnsavedTimeChanges && canSaveTime ? 'negative' : 'positive'"
            label="Запис"
            icon="save"
            :disable="!canSaveTime"
            @click="saveTime"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from '../config/ports'

// Action Template interface matching backend model
interface IActionTemplate {
  _id: string
  name: string
  description?: string
  icon: string
  flowFile?: string
  linkedFlowId?: string
  linkedFlowVersion?: string
  linkedFlowVersionId?: string
  globalVariables?: Record<string, any>
  globalVariablesMetadata?: Array<{
    variableName: string
    displayName: string
    value: number
    unit?: string
    comment?: string
    showInPreview: boolean
  }>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Cycle action interface
interface ICycleAction {
  actionTemplateId: string | IActionTemplate
  order: number
  overrideParameters?: Record<string, any>
}

// Cycle interface for programForm
interface ICycle {
  id: number | string
  number: number
  time: string
  actions: ICycleAction[]
}

// Program form interface
interface IProgramForm {
  name: string
  plantType: { label: string; value: string } | null
  description: string
  maxExecutionTime: number
  cycles: ICycle[]
}

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

// Check if we're editing (has ID in route)
const isEditing = computed(() => !!route.params.id)
const programId = computed(() => route.params.id as string)

// Loading states
const loading = ref(false)

// Form data
const programForm = reactive<IProgramForm>({
  name: '',
  plantType: null,
  description: '',
  maxExecutionTime: 60,
  cycles: []
})

// Action Templates data
const availableActionTemplates = ref<IActionTemplate[]>([])
const selectedActionTemplate = ref<IActionTemplate | null>(null)
const showActionTemplateDialog = ref(false)
const selectedCycle = ref<any>(null)
const editingActionIndex = ref(-1)
const currentOverrideParameters = ref<Record<string, any>>({})

// Duplicate cycle data
const showDuplicateDialog = ref(false)
const cycleBeingDuplicated = ref<ICycle | null>(null)
const duplicateTime = ref('')

// Minimum cycle interval configuration
const minCycleInterval = ref(120)
const previousMinCycleInterval = ref(120)

// Track old cycle times for rollback on cancel
const oldCycleTimes = ref<Map<number, string>>(new Map())

// Track time picker view state (hours vs minutes) - OLD, will be removed
const isOnMinutesView = ref<Record<number, boolean>>({})
const isFirstUpdate = ref<Record<number, boolean>>({})

// New Time Picker Dialog state
const showTimePickerDialog = ref(false)
const timePickerCycleIndex = ref(-1)
const tempHour = ref<number | null>(null)
const tempMinute = ref<number | null>(null)
const savedHour = ref<number | null>(null)
const savedMinute = ref<number | null>(null)

// Plant type options - TODO: IMPLEMENT_LATER - Load from cropTypes[] store
const plantTypeOptions = [
  { label: 'Листни зеленчуци', value: 'leafy' },
  { label: 'Плодови зеленчуци', value: 'fruits' },
  { label: 'Билки', value: 'herbs' },
  { label: 'Корнеплодни зеленчуци', value: 'roots' },
  { label: 'Бобови растения', value: 'legumes' }
]

// Cycle table columns - Updated for Action Templates
const cycleColumns = [
  {
    name: 'number',
    required: true,
    label: '№',
    align: 'center' as const,
    field: 'number',
    sortable: false,
    style: 'width: 50px'
  },
  {
    name: 'time',
    label: 'Час на стартиране',
    align: 'center' as const,
    field: 'time',
    sortable: true,
    style: 'width: 140px'
  },
  {
    name: 'cycleActions',
    label: 'Действия',
    align: 'left' as const,
    field: 'actions',
    sortable: false,
    style: 'min-width: 300px'
  },
  {
    name: 'actions',
    label: 'Управление',
    align: 'center' as const,
    field: 'actions',
    sortable: false,
    style: 'width: 80px'
  }
]

// Initialize with empty cycles array
programForm.cycles = []

// New cycle template - simplified to only time field
const newCycleTemplate = reactive({
  time: ''
})

// Cycle validation
const cycleValidation = ref({
  isValid: true,
  warnings: [],
  errors: []
})

// TEST: Log to verify script is loaded
console.log('✅ ProgramCreate.vue script loaded successfully')
console.log('✅ isOnMinutesView initialized:', isOnMinutesView)
console.log('✅ isFirstUpdate initialized:', isFirstUpdate)

// Cycle management functions
function addCycle() {
  if (!newCycleTemplate.time) {
    $q.notify({
      message: 'Моля, въведете час за цикъла',
      color: 'warning',
      position: 'top'
    })
    return
  }

  const newCycle = {
    id: Date.now(),
    number: programForm.cycles.length + 1,
    time: newCycleTemplate.time,
    actions: []
  }

  programForm.cycles.push(newCycle)
  
  // Reset template
  newCycleTemplate.time = ''
  
  validateCycles()
}

// Load available Action Templates
const loadActionTemplates = async () => {
  try {
    console.log('Loading Action Templates...')
    const response = await fetch(`${API_BASE_URL}/action-templates`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('Action Templates response:', result)
    
    if (result.success) {
      availableActionTemplates.value = result.data
      console.log('Loaded templates:', availableActionTemplates.value)
      
      $q.notify({
        type: 'positive',
        message: `Заредени са ${result.data.length} Action Templates`
      })
    } else {
      throw new Error(result.error || 'Failed to load action templates')
    }
  } catch (error) {
    console.error('Error loading Action Templates:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на Action Templates: ' + error.message
    })
    availableActionTemplates.value = []
  }
}

// Show add action dialog
const showAddActionDialog = (cycle) => {
  console.log('Opening add action dialog for cycle:', cycle)
  console.log('Available templates when opening dialog:', availableActionTemplates.value)
  
  selectedCycle.value = cycle
  editingActionIndex.value = -1
  selectedActionTemplate.value = null
  currentOverrideParameters.value = {}
  showActionTemplateDialog.value = true
  
  // Reload templates to ensure we have the latest data
  if (availableActionTemplates.value.length === 0) {
    loadActionTemplates()
  }
}

// Edit existing action
const editCycleAction = (cycle, actionIndex) => {
  selectedCycle.value = cycle
  editingActionIndex.value = actionIndex
  const action = cycle.actions[actionIndex]
  selectedActionTemplate.value = availableActionTemplates.value.find(t => t._id === action.actionTemplateId)
  currentOverrideParameters.value = { ...action.overrideParameters } || {}
  showActionTemplateDialog.value = true
}

// Get global variable value (override or default)
const getGlobalVariableValue = (globalVar) => {
  return currentOverrideParameters.value[globalVar.variableName] ?? globalVar.value
}

// Update global variable value
const updateGlobalVariableValue = (variableName, value) => {
  const parsedValue = parseFloat(value) || 0
  currentOverrideParameters.value[variableName] = parsedValue
  console.log(`🔧 DEBUG: updateGlobalVariableValue called: ${variableName} = ${parsedValue}`)
  console.log('🔧 DEBUG: currentOverrideParameters after update:', currentOverrideParameters.value)
}

// Cancel action dialog
const cancelActionDialog = () => {
  showActionTemplateDialog.value = false
  selectedActionTemplate.value = null
  selectedCycle.value = null
  editingActionIndex.value = -1
  currentOverrideParameters.value = {}
}

// Confirm action selection
const confirmActionSelection = () => {
  console.log('🔧 DEBUG: confirmActionSelection called - START')
  
  if (!selectedActionTemplate.value) {
    console.log('🔧 DEBUG: No selectedActionTemplate - returning early')
    return
  }
  
  console.log('🔧 DEBUG: selectedActionTemplate:', selectedActionTemplate.value)
  console.log('🔧 DEBUG: currentOverrideParameters before save:', currentOverrideParameters.value)
  console.log('🔧 DEBUG: selectedCycle:', selectedCycle.value)
  
  saveActionToCurrentCycle(selectedActionTemplate.value, currentOverrideParameters.value)
  
  console.log('🔧 DEBUG: confirmActionSelection called - END')
}

// Get action display text
const getActionDisplayText = (action) => {
  // Handle populated actionTemplateId (object from backend)
  if (action.actionTemplateId && typeof action.actionTemplateId === 'object') {
    const template = action.actionTemplateId
    if (template.globalVariablesMetadata) {
      const previewGlobalVars = template.globalVariablesMetadata.filter(gv => gv.showInPreview)
        .map(gv => `${gv.displayName}: ${action.overrideParameters?.[gv.variableName] ?? gv.value}`)
        .join(', ') || ''
      return previewGlobalVars ? `${template.name} (${previewGlobalVars})` : template.name
    }
    return template.name
  }
  
  // Handle string ID (lookup in availableActionTemplates)
  const template = availableActionTemplates.value.find(t => t._id === action.actionTemplateId)
  if (!template) return 'Unknown Action'
  
  if (template.globalVariablesMetadata) {
    const previewGlobalVars = template.globalVariablesMetadata.filter(gv => gv.showInPreview)
      .map(gv => `${gv.displayName}: ${action.overrideParameters?.[gv.variableName] ?? gv.value}`)
      .join(', ') || ''
    return previewGlobalVars ? `${template.name} (${previewGlobalVars})` : template.name
  }
  
  return template.name
}

// Get action icon
const getActionIcon = (action) => {
  // Handle populated actionTemplateId (object from backend)
  if (action.actionTemplateId && typeof action.actionTemplateId === 'object') {
    return action.actionTemplateId.icon || '🔧'
  }

  // Handle string ID (lookup in availableActionTemplates)
  const template = availableActionTemplates.value.find(t => t._id === action.actionTemplateId)
  return template?.icon || '🔧'
}

// Helper functions for minimum cycle interval

// Calculate time difference in minutes between two times
function getTimeDifferenceInMinutes(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number)
  const [h2, m2] = time2.split(':').map(Number)
  const totalMinutes1 = h1 * 60 + m1
  const totalMinutes2 = h2 * 60 + m2
  return totalMinutes2 - totalMinutes1
}

// Add minutes to a time string and return new time
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMinutes = totalMinutes % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}

// Calculate minimum allowed time for a cycle based on previous cycle
function getMinimumTimeForCycle(cycleIndex: number): string {
  if (cycleIndex === 0) return '00:00' // First cycle has no restrictions
  const previousCycle = programForm.cycles[cycleIndex - 1]
  if (!previousCycle || !previousCycle.time) return '00:00'
  return addMinutesToTime(previousCycle.time, minCycleInterval.value)
}

// NEW TIME PICKER FUNCTIONS

// Get valid hour options for current cycle
const validHourOptions = computed(() => {
  if (timePickerCycleIndex.value === 0) {
    // First cycle - all hours valid
    return Array.from({ length: 24 }, (_, i) => i)
  }

  const minTime = getMinimumTimeForCycle(timePickerCycleIndex.value)
  const minHour = parseInt(minTime.split(':')[0])

  // Hours from minHour to 23
  return Array.from({ length: 24 - minHour }, (_, i) => minHour + i)
})

// Get valid minute options for selected hour
const validMinuteOptions = computed(() => {
  if (tempHour.value === null) return []

  const minuteSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  if (timePickerCycleIndex.value === 0) {
    // First cycle - all minutes valid
    return minuteSteps
  }

  const minTime = getMinimumTimeForCycle(timePickerCycleIndex.value)
  const [minHour, minMinute] = minTime.split(':').map(Number)

  if (tempHour.value > minHour) {
    // Selected hour is after minimum hour - all minutes valid
    return minuteSteps
  } else if (tempHour.value === minHour) {
    // Selected hour equals minimum hour - filter minutes >= minMinute
    return minuteSteps.filter(m => m >= minMinute)
  }

  return []
})

// Check if there are unsaved changes
const hasUnsavedTimeChanges = computed(() => {
  return tempHour.value !== savedHour.value || tempMinute.value !== savedMinute.value
})

// Check if we can save (both hour and minute selected, and has changes)
const canSaveTime = computed(() => {
  return tempHour.value !== null &&
         tempMinute.value !== null &&
         hasUnsavedTimeChanges.value
})

// Handle hour change - reset minutes
function onHourChange() {
  console.log(`Hour changed to: ${tempHour.value}`)
  // Reset minute when hour changes
  tempMinute.value = null
  console.log(`Minutes reset to null`)
}

// Open time picker dialog for a cycle
function openTimePicker(cycleIndex: number) {
  console.log(`Opening time picker for cycle ${cycleIndex + 1}`)
  timePickerCycleIndex.value = cycleIndex

  const currentTime = programForm.cycles[cycleIndex].time
  console.log(`Current time: "${currentTime}"`)

  if (currentTime && currentTime.includes(':')) {
    // Parse existing time
    const [h, m] = currentTime.split(':').map(Number)
    tempHour.value = h
    tempMinute.value = m
    savedHour.value = h
    savedMinute.value = m
  } else {
    // New cycle - no time
    tempHour.value = null
    tempMinute.value = null
    savedHour.value = null
    savedMinute.value = null
  }

  showTimePickerDialog.value = true
}

// Open time picker for adding a NEW cycle (not editing existing)
function openTimePickerForNewCycle() {
  console.log(`Opening time picker for NEW cycle`)

  // Create temporary cycle to calculate minimum time
  const tempCycleIndex = programForm.cycles.length
  timePickerCycleIndex.value = tempCycleIndex

  // Check if newCycleTemplate has time already
  const currentTime = newCycleTemplate.time
  console.log(`Current newCycleTemplate time: "${currentTime}"`)

  if (currentTime && currentTime.includes(':')) {
    // Parse existing time
    const [h, m] = currentTime.split(':').map(Number)
    tempHour.value = h
    tempMinute.value = m
    savedHour.value = h
    savedMinute.value = m
  } else {
    // New cycle - no time
    tempHour.value = null
    tempMinute.value = null
    savedHour.value = null
    savedMinute.value = null
  }

  showTimePickerDialog.value = true
}

// Save time (with cascading check)
async function saveTime() {
  if (!canSaveTime.value) return

  const newTime = `${String(tempHour.value).padStart(2, '0')}:${String(tempMinute.value).padStart(2, '0')}`
  console.log(`Saving time: ${newTime} for cycle index ${timePickerCycleIndex.value}`)

  // Check if this is for a NEW cycle (not yet in cycles array)
  const isNewCycle = timePickerCycleIndex.value >= programForm.cycles.length

  if (isNewCycle) {
    // Save to newCycleTemplate instead
    console.log(`Saving to newCycleTemplate (new cycle)`)
    newCycleTemplate.time = newTime

    // Mark as saved
    savedHour.value = tempHour.value
    savedMinute.value = tempMinute.value

    $q.notify({
      type: 'positive',
      message: `Час ${newTime} записан`
    })

    // Dialog stays open
    return
  }

  // Editing existing cycle - calculate cascading changes
  const changes = calculateCascadingChanges(
    timePickerCycleIndex.value,
    newTime,
    minCycleInterval.value
  )

  if (changes.length > 0) {
    // Show confirmation
    const confirmed = await showCascadingConfirmation(
      changes,
      `Промяната на Цикъл ${timePickerCycleIndex.value + 1}`
    )

    if (!confirmed) {
      // User cancelled - keep dialog open
      console.log(`User cancelled cascading changes`)
      return
    }

    // Apply cascading changes
    programForm.cycles[timePickerCycleIndex.value].time = newTime
    applyCascadingChanges(changes)
  } else {
    // No cascading - just save
    programForm.cycles[timePickerCycleIndex.value].time = newTime
    validateCycles()
  }

  // Mark as saved
  savedHour.value = tempHour.value
  savedMinute.value = tempMinute.value

  $q.notify({
    type: 'positive',
    message: `Час ${newTime} записан за Цикъл ${timePickerCycleIndex.value + 1}`
  })

  // Dialog stays open
}

// Close time picker dialog (with unsaved changes check)
async function closeTimePicker() {
  const isNewCycle = timePickerCycleIndex.value >= programForm.cycles.length

  // Check for unsaved changes
  if (hasUnsavedTimeChanges.value && (tempHour.value !== null || tempMinute.value !== null)) {
    // User has made changes but hasn't saved
    const confirmed = await new Promise<boolean>((resolve) => {
      $q.dialog({
        title: 'Незаписани промени',
        message: 'Имате незаписани промени. Сигурни ли сте, че искате да затворите?',
        cancel: {
          label: 'Не',
          flat: true
        },
        ok: {
          label: 'Да',
          color: 'negative'
        },
        persistent: true
      }).onOk(() => resolve(true)).onCancel(() => resolve(false))
    })

    if (!confirmed) {
      // User wants to stay
      return
    }

    // User confirmed - revert to saved values
    if (isNewCycle) {
      // Revert newCycleTemplate
      if (savedHour.value !== null && savedMinute.value !== null) {
        newCycleTemplate.time = `${String(savedHour.value).padStart(2, '0')}:${String(savedMinute.value).padStart(2, '0')}`
      } else {
        newCycleTemplate.time = ''
      }
    } else {
      // Revert existing cycle
      if (savedHour.value !== null && savedMinute.value !== null) {
        programForm.cycles[timePickerCycleIndex.value].time = `${String(savedHour.value).padStart(2, '0')}:${String(savedMinute.value).padStart(2, '0')}`
      }
    }
  }

  // Close dialog
  showTimePickerDialog.value = false
  timePickerCycleIndex.value = -1
  tempHour.value = null
  tempMinute.value = null
  savedHour.value = null
  savedMinute.value = null
}

// Returns function for q-time options prop to disable invalid times
function getTimeOptions(cycleIndex: number) {
  return (hour: number, minute: number) => {
    if (cycleIndex === 0) return true // First cycle has no restrictions

    const previousCycle = programForm.cycles[cycleIndex - 1]
    if (!previousCycle || !previousCycle.time) return true

    const minTime = getMinimumTimeForCycle(cycleIndex)
    const [minHour, minMinute] = minTime.split(':').map(Number)

    // Compare times
    if (hour < minHour) return false
    if (hour === minHour && minute < minMinute) return false

    return true
  }
}

// Calculate which cycles need to be adjusted when a cycle time changes
function calculateCascadingChanges(
  changedCycleIndex: number,
  newTime: string,
  minInterval: number
): Array<{ cycleIndex: number, oldTime: string, newTime: string }> {
  const changes: Array<{ cycleIndex: number, oldTime: string, newTime: string }> = []
  let currentTime = newTime

  for (let i = changedCycleIndex + 1; i < programForm.cycles.length; i++) {
    const cycle = programForm.cycles[i]
    const difference = getTimeDifferenceInMinutes(currentTime, cycle.time)

    if (difference < minInterval) {
      const newCycleTime = addMinutesToTime(currentTime, minInterval)
      changes.push({
        cycleIndex: i,
        oldTime: cycle.time,
        newTime: newCycleTime
      })
      currentTime = newCycleTime
    } else {
      break // Cascade stops here
    }
  }

  return changes
}

// Apply cascading time changes to cycles
function applyCascadingChanges(
  changes: Array<{ cycleIndex: number, oldTime: string, newTime: string }>
): void {
  changes.forEach(change => {
    programForm.cycles[change.cycleIndex].time = change.newTime
  })
  validateCycles()
}

// Show confirmation dialog for cascading changes
function showCascadingConfirmation(
  changes: Array<{ cycleIndex: number, oldTime: string, newTime: string }>,
  reason: string
): Promise<boolean> {
  if (changes.length === 0) return Promise.resolve(true)

  const changesList = changes.map(c =>
    `• Цикъл ${c.cycleIndex + 1}: ${c.oldTime} → ${c.newTime}`
  ).join('\n')

  return new Promise((resolve) => {
    $q.dialog({
      title: 'Потвърждение за промяна',
      message: `${reason} ще наложи автоматична корекция на времената:\n\n${changesList}\n\nЖелаете ли да продължите?`,
      cancel: {
        label: 'Отказ',
        flat: true
      },
      ok: {
        label: 'Потвърди',
        color: 'primary'
      },
      persistent: true
    }).onOk(() => {
      resolve(true)
    }).onCancel(() => {
      resolve(false)
    })
  })
}

// Save cycle time before editing (called when time picker opens)
function onBeforeShowTimePicker(cycleIndex: number): void {
  const currentTime = programForm.cycles[cycleIndex].time
  const isEmpty = !currentTime || currentTime === ''
  console.log(`🚀 Time picker opened for Cycle ${cycleIndex + 1}`)
  console.log(`   Current time: "${currentTime}"`)
  console.log(`   isEmpty: ${isEmpty}`)
  console.log(`   Scenario: ${isEmpty ? 'NEW CYCLE (no time)' : 'EDITING EXISTING (has time)'}`)

  oldCycleTimes.value.set(cycleIndex, currentTime)
  // Reset view tracking flags - start on hours view
  isOnMinutesView.value[cycleIndex] = false
  isFirstUpdate.value[cycleIndex] = true
  console.log(`   Flags reset: isOnMinutesView=false, isFirstUpdate=true`)
}

// Handle cycle time change with cascading logic (called on each time picker update)
async function onTimePickerUpdate(cycleIndex: number, newTime: string, details?: any): Promise<void> {
  console.log(`🔍 Cycle ${cycleIndex + 1}: onTimePickerUpdate called`)
  console.log(`   newTime: "${newTime}"`)
  console.log(`   details:`, details)

  if (details) {
    console.log(`   details keys:`, Object.keys(details))
    console.log(`   details full:`, JSON.stringify(details, null, 2))
  }

  // Track if this is the first update (hour selected, transitioning to minutes)
  if (isFirstUpdate.value[cycleIndex]) {
    isFirstUpdate.value[cycleIndex] = false
    isOnMinutesView.value[cycleIndex] = true
    console.log(`🕐 Cycle ${cycleIndex + 1}: First update - transitioned to minutes view`)
    console.log(`   isOnMinutesView[${cycleIndex}] = true`)
    return // Don't process cascading yet, just tracking view change
  }

  console.log(`   Not first update, proceeding with cascading check...`)

  const oldTime = oldCycleTimes.value.get(cycleIndex)
  if (!oldTime || oldTime === newTime) {
    // No change, just validate
    validateCycles()
    return
  }

  // Calculate cascading changes
  const changes = calculateCascadingChanges(cycleIndex, newTime, minCycleInterval.value)

  if (changes.length > 0) {
    // Show confirmation
    const confirmed = await showCascadingConfirmation(
      changes,
      `Промяната на Цикъл ${cycleIndex + 1}`
    )

    if (!confirmed) {
      // Revert to old time
      programForm.cycles[cycleIndex].time = oldTime
      return
    }

    // Apply cascading changes (newTime already set by v-model)
    applyCascadingChanges(changes)
  } else {
    // No cascading needed, just validate
    validateCycles()
  }
}

// Check if changing minimum interval will require cascading changes
async function checkMinIntervalChange(newInterval: number): Promise<void> {
  // Save old value for potential rollback
  const oldInterval = minCycleInterval.value
  previousMinCycleInterval.value = oldInterval

  // Check if any cycles violate the new interval
  const allChanges: Array<{ cycleIndex: number, oldTime: string, newTime: string }> = []
  let currentTime = programForm.cycles[0]?.time

  if (!currentTime) {
    minCycleInterval.value = newInterval
    return
  }

  for (let i = 1; i < programForm.cycles.length; i++) {
    const cycle = programForm.cycles[i]
    const difference = getTimeDifferenceInMinutes(currentTime, cycle.time)

    if (difference < newInterval) {
      const newTime = addMinutesToTime(currentTime, newInterval)
      allChanges.push({
        cycleIndex: i,
        oldTime: cycle.time,
        newTime: newTime
      })
      currentTime = newTime
    } else {
      currentTime = cycle.time
    }
  }

  if (allChanges.length > 0) {
    // Show confirmation
    const confirmed = await showCascadingConfirmation(
      allChanges,
      'Промяната на минималния интервал'
    )

    if (!confirmed) {
      // Rollback
      minCycleInterval.value = oldInterval
      return
    }

    // Apply changes
    minCycleInterval.value = newInterval
    applyCascadingChanges(allChanges)
  } else {
    // No cascading needed
    minCycleInterval.value = newInterval
  }
}

// Add or update action in cycle
const saveActionToCurrentCycle = (actionTemplate, overrideParams = {}) => {
  if (!selectedCycle.value) return
  
  console.log('🔧 DEBUG: saveActionToCurrentCycle called')
  console.log('🔧 DEBUG: actionTemplate:', actionTemplate)
  console.log('🔧 DEBUG: overrideParams received:', overrideParams)
  
  // Ensure actions array exists
  if (!selectedCycle.value.actions) {
    selectedCycle.value.actions = []
  }
  
  // Create full overrideParameters with all globalVariables
  const fullOverrideParameters = {}
  if (actionTemplate.globalVariablesMetadata) {
    console.log('🔧 DEBUG: globalVariablesMetadata:', actionTemplate.globalVariablesMetadata)
    actionTemplate.globalVariablesMetadata.forEach(globalVar => {
      // Use override value if exists, otherwise use default value
      const finalValue = overrideParams[globalVar.variableName] ?? globalVar.value
      fullOverrideParameters[globalVar.variableName] = finalValue
      console.log(`🔧 DEBUG: ${globalVar.variableName}: override=${overrideParams[globalVar.variableName]} default=${globalVar.value} final=${finalValue}`)
    })
  }
  
  console.log('🔧 DEBUG: fullOverrideParameters created:', fullOverrideParameters)
  
  const cycleAction = {
    actionTemplateId: actionTemplate._id,
    order: editingActionIndex.value >= 0 ? selectedCycle.value.actions[editingActionIndex.value].order : selectedCycle.value.actions.length,
    overrideParameters: fullOverrideParameters
  }
  
  console.log('🔧 DEBUG: cycleAction created:', cycleAction)
  
  if (editingActionIndex.value >= 0) {
    // Update existing action
    selectedCycle.value.actions[editingActionIndex.value] = cycleAction
  } else {
    // Add new action
    selectedCycle.value.actions.push(cycleAction)
  }
  
  // Sort by order
  selectedCycle.value.actions.sort((a, b) => a.order - b.order)
  
  // Close dialog and reset state
  showActionTemplateDialog.value = false
  selectedCycle.value = null
  selectedActionTemplate.value = null
  editingActionIndex.value = -1
  currentOverrideParameters.value = {}

  // Revalidate cycles after adding action
  validateCycles()

  // Show success message
  $q.notify({
    type: 'positive',
    message: `Действието "${actionTemplate.name}" е добавено към цикъла`
  })
}

// Remove action from cycle
const removeActionFromCycle = (cycle, actionIndex) => {
  cycle.actions.splice(actionIndex, 1)
  // Reorder actions
  cycle.actions.forEach((action, index) => {
    action.order = index
  })
}

// Move action up/down in cycle
const moveAction = (cycle, actionIndex, direction) => {
  const actions = cycle.actions
  if (direction === 'up' && actionIndex > 0) {
    // Swap with previous
    [actions[actionIndex], actions[actionIndex - 1]] = [actions[actionIndex - 1], actions[actionIndex]]
  } else if (direction === 'down' && actionIndex < actions.length - 1) {
    // Swap with next  
    [actions[actionIndex], actions[actionIndex + 1]] = [actions[actionIndex + 1], actions[actionIndex]]
  }
  
  // Update order numbers
  actions.forEach((action, index) => {
    action.order = index
  })
}

// Confirm remove action with dialog
const confirmRemoveAction = (cycle, actionIndex) => {
  const action = cycle.actions[actionIndex]
  const template = availableActionTemplates.value.find(t => t._id === action.actionTemplateId)
  const actionName = template?.name || 'Unknown Action'
  
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да премахнете "${actionName}" от този цикъл?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    removeActionFromCycle(cycle, actionIndex)
    validateCycles()
    $q.notify({
      type: 'positive',
      message: `Действието "${actionName}" е премахнато от цикъла`
    })
  })
}

function deleteCycle(id: number) {
  const index = programForm.cycles.findIndex(cycle => cycle.id === id)
  if (index > -1) {
    programForm.cycles.splice(index, 1)
    // Renumber cycles
    programForm.cycles.forEach((cycle, idx) => {
      cycle.number = idx + 1
    })
    validateCycles()
  }
}

// Show duplicate cycle dialog
function showDuplicateCycleDialog(cycle: ICycle) {
  // Check if there are valid hours for duplication
  if (programForm.cycles.length > 0) {
    const lastCycle = programForm.cycles[programForm.cycles.length - 1]
    const minTime = addMinutesToTime(lastCycle.time, minCycleInterval.value)
    const [minHour, minMinute] = minTime.split(':').map(Number)

    // If minimum time exceeds 23:59, no valid hours
    if (minHour >= 24 || (minHour === 23 && minMinute >= 60)) {
      $q.notify({
        type: 'warning',
        message: 'Няма валидни часове за дубликиране. Последният цикъл е твърде късно.'
      })
      return
    }
  }

  cycleBeingDuplicated.value = cycle
  duplicateTime.value = ''
  showDuplicateDialog.value = true
}

// Cancel duplicate dialog
function cancelDuplicateDialog() {
  showDuplicateDialog.value = false
  cycleBeingDuplicated.value = null
  duplicateTime.value = ''
}

// Confirm duplicate cycle
function confirmDuplicateCycle() {
  if (!cycleBeingDuplicated.value || !duplicateTime.value) return

  const originalCycleNumber = cycleBeingDuplicated.value.number

  // Deep copy the cycle with all actions
  const duplicatedCycle: ICycle = {
    id: Date.now(),
    number: programForm.cycles.length + 1,
    time: duplicateTime.value,
    actions: cycleBeingDuplicated.value.actions.map(action => ({
      actionTemplateId: action.actionTemplateId,
      order: action.order,
      overrideParameters: { ...action.overrideParameters }
    }))
  }

  programForm.cycles.push(duplicatedCycle)

  // Renumber all cycles
  programForm.cycles.forEach((cycle, idx) => {
    cycle.number = idx + 1
  })

  validateCycles()

  // Close dialog
  showDuplicateDialog.value = false
  cycleBeingDuplicated.value = null
  duplicateTime.value = ''

  $q.notify({
    type: 'positive',
    message: `Цикъл ${originalCycleNumber} е дублиран успешно с час ${duplicateTime.value}`
  })
}

// Move cycle up (swap positions and times with previous cycle)
function moveCycleUp(cycleIndex: number) {
  if (cycleIndex === 0) return // Can't move first cycle up

  const cycle = programForm.cycles[cycleIndex]
  const previousCycle = programForm.cycles[cycleIndex - 1]

  // Swap times (times stay in their positions)
  const tempTime = cycle.time
  cycle.time = previousCycle.time
  previousCycle.time = tempTime

  // Swap positions in array (cycle objects move)
  programForm.cycles[cycleIndex] = previousCycle
  programForm.cycles[cycleIndex - 1] = cycle

  // Renumber cycles
  programForm.cycles.forEach((c, idx) => {
    c.number = idx + 1
  })

  validateCycles()
}

// Move cycle down (swap positions and times with next cycle)
function moveCycleDown(cycleIndex: number) {
  if (cycleIndex === programForm.cycles.length - 1) return // Can't move last cycle down

  const cycle = programForm.cycles[cycleIndex]
  const nextCycle = programForm.cycles[cycleIndex + 1]

  // Swap times (times stay in their positions)
  const tempTime = cycle.time
  cycle.time = nextCycle.time
  nextCycle.time = tempTime

  // Swap positions in array (cycle objects move)
  programForm.cycles[cycleIndex] = nextCycle
  programForm.cycles[cycleIndex + 1] = cycle

  // Renumber cycles
  programForm.cycles.forEach((c, idx) => {
    c.number = idx + 1
  })

  validateCycles()
}

// Advanced cycle validation for Action Templates
function validateCycles() {
  const cycles = programForm.cycles
  const warnings = []
  
  if (cycles.length === 0) {
    cycleValidation.value.isValid = false
    cycleValidation.value.warnings = ['Няма дефинирани цикли']
    return
  }
  
  if (cycles.length > 12) {
    warnings.push('Повече от 12 цикъла')
  }
  
  // Check that each cycle has at least one action
  cycles.forEach((cycle, index) => {
    if (!cycle.actions || cycle.actions.length === 0) {
      warnings.push(`Цикъл ${index + 1} няма добавени действия`)
    }
  })

  // Check minimum interval between consecutive cycles
  for (let i = 0; i < cycles.length - 1; i++) {
    const currentCycle = cycles[i]
    const nextCycle = cycles[i + 1]

    if (currentCycle.time && nextCycle.time) {
      const difference = getTimeDifferenceInMinutes(currentCycle.time, nextCycle.time)
      const minIntervalHours = Math.floor(minCycleInterval.value / 60)
      const minIntervalMinutes = minCycleInterval.value % 60
      const minIntervalText = minIntervalHours > 0
        ? `${minIntervalHours}ч ${minIntervalMinutes}мин`
        : `${minIntervalMinutes} минути`

      if (difference < minCycleInterval.value) {
        const actualHours = Math.floor(difference / 60)
        const actualMinutes = difference % 60
        const actualText = actualHours > 0
          ? `${actualHours}ч ${actualMinutes}мин`
          : `${actualMinutes} минути`

        warnings.push(
          `Цикъл ${i + 2} (${nextCycle.time}) е само ${actualText} след Цикъл ${i + 1} (${currentCycle.time}). Минимум ${minIntervalText}.`
        )
      }
    }
  }
  
  cycleValidation.value.isValid = warnings.length === 0
  cycleValidation.value.warnings = warnings
}

// Load program data for editing
const loadProgramData = async () => {
  if (!isEditing.value) return
  
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/programs/${programId.value}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      const program = result.data
      
      // Populate form with existing data
      programForm.name = program.name
      programForm.description = program.description || ''
      programForm.plantType = program.plantType || null
      programForm.maxExecutionTime = program.maxExecutionTime || 60
      programForm.cycles = program.cycles.map((cycle, index) => ({
        id: cycle._id || Date.now(),
        number: index + 1,
        time: cycle.startTime,
        actions: cycle.actions || []
      }))
      
      validateCycles()
    } else {
      throw new Error(result.error || 'Failed to load program')
    }
  } catch (error: any) {
    console.error('Error loading program:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на програмата: ' + error.message
    })
    router.push({ path: '/programs', query: { tab: 'programs' } })
  } finally {
    loading.value = false
  }
}

// Update existing program
const updateProgram = async () => {
  // Same validation as createProgram
  if (!programForm.name || !programForm.name.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Името на програмата е задължително поле'
    })
    return
  }

  const activeCycles = programForm.cycles.filter(cycle => 
    cycle.time && cycle.actions && cycle.actions.length > 0
  )

  if (activeCycles.length === 0) {
    $q.notify({
      type: 'negative', 
      message: 'Трябва да има поне един цикъл с време и действия'
    })
    return
  }

  loading.value = true
  
  try {
    const programData = {
      name: programForm.name.trim(),
      description: programForm.description?.trim() || '',
      maxExecutionTime: programForm.maxExecutionTime || 60,
      cycles: activeCycles.map(cycle => ({
        startTime: cycle.time,
        actions: cycle.actions || [],
        isActive: true
      }))
    }

    const response = await fetch(`${API_BASE_URL}/programs/${programId.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(programData)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: `Програма "${programForm.name}" е обновена успешно`
      })
      
      router.push({ path: '/programs', query: { tab: 'programs' } })
    } else {
      throw new Error(result.error || 'Failed to update program')
    }
  } catch (error: any) {
    console.error('Error updating program:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при обновяване на програмата: ' + error.message
    })
  } finally {
    loading.value = false
  }
}

// Load action templates and program data on component mount
onMounted(async () => {
  await loadActionTemplates()
  if (isEditing.value) {
    await loadProgramData()
  }
})

// TODO: IMPLEMENT_LATER - часовият формат ще се зарежда от системните настройки
// Currently using 24-hour format as default

function cancelCreation() {
  // TODO: IMPLEMENT_LATER - при отказ връщане към последната страница 'Програми'
  router.push({ path: '/programs', query: { tab: 'programs' } })
}

async function createProgram() {
  console.log('🔧 DEBUG: createProgram() function called!')
  
  // Validation - Program name is required
  if (!programForm.name || !programForm.name.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Името на програмата е задължително поле'
    })
    return
  }

  // Validation - At least one active cycle is required
  const activeCycles = programForm.cycles.filter(cycle => 
    cycle.time && cycle.actions && cycle.actions.length > 0
  )

  if (activeCycles.length === 0) {
    $q.notify({
      type: 'negative', 
      message: 'Трябва да има поне един цикъл с време и действия'
    })
    return
  }

  try {
    const programData = {
      name: programForm.name.trim(),
      description: programForm.description?.trim() || '',
      maxExecutionTime: programForm.maxExecutionTime || 60,
      cycles: activeCycles.map(cycle => ({
        startTime: cycle.time,
        actions: cycle.actions || [],
        isActive: true
      }))
    }

    console.log('🔧 DEBUG: Sending programData to API:', JSON.stringify(programData, null, 2))
    console.log('🔧 DEBUG: Raw programForm.cycles:', JSON.stringify(programForm.cycles, null, 2))

    const response = await fetch(`${API_BASE_URL}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(programData)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: `Програма "${programForm.name}" е създадена успешно`
      })
      
      router.push({ path: '/programs', query: { tab: 'programs' } })
    } else {
      throw new Error(result.error || 'Failed to create program')
    }
  } catch (error: any) {
    console.error('Error creating program:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при създаване на програмата: ' + error.message
    })
  }
}
</script>

<style scoped>
.cycles-table {
  border-radius: 8px;
}

.cycles-table .q-table__top {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.cycles-table .q-table__bottom {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.q-btn {
  border-radius: 6px;
}

.q-card {
  border-radius: 8px;
}

.q-chip {
  font-weight: 500;
}

.add-cycle-card {
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
}

.add-cycle-card:hover {
  border-color: var(--q-hydro-green);
  background-color: #f0f8f0;
}

.cycles-table .q-td {
  padding: 8px 4px;
}

.cycles-table .q-input {
  font-size: 0.875rem;
}

/* Action Template Selection Dialog */
.action-template-card {
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.action-template-card:hover {
  border-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-template-card.selected {
  border-color: #1976d2;
  background-color: #e3f2fd;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.action-template-card.selected:hover {
  transform: none;
}

/* Action Items in Cycle */
.action-item-card {
  position: relative;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: white;
  transition: all 0.2s ease;
}

.action-item-card:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-order-number {
  position: absolute;
  top: -8px;
  left: -8px;
  background: #1976d2;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 1;
}

.action-reorder-btn {
  width: 20px;
  height: 16px;
  min-height: 16px;
  color: #666;
}

.action-reorder-btn:hover {
  color: #1976d2;
  background: rgba(25, 118, 210, 0.1);
}

.action-reorder-btn[disabled] {
  opacity: 0.3;
}

.action-remove-btn {
  width: 20px;
  height: 20px;
  min-height: 20px;
}

.action-remove-btn:hover {
  background: rgba(244, 67, 54, 0.1);
}

.q-chip.full-width {
  width: 100%;
  max-width: none;
}
</style>