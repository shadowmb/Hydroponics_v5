<template>
  <q-card>
    <q-card-section class="bg-primary text-white">
      <div class="text-h6">
        <q-icon name="upload" class="q-mr-sm" />
        Зареди програма
      </div>
      <div class="text-caption">Изберете програма за активиране</div>
    </q-card-section>

    <q-card-section>
      <div class="q-gutter-md">
        <!-- Program Selection -->
        <q-select
          v-model="selectedProgram"
          :options="programOptions"
          label="Изберете програма"
          option-value="_id"
          option-label="name"
          emit-value
          map-options
          outlined
          :loading="isLoadingPrograms"
          @filter="filterPrograms"
          use-input
          fill-input
          hide-selected
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                Няма налични програми
              </q-item-section>
            </q-item>
          </template>

          <template v-slot:option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section avatar>
                <q-icon name="science" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.name }}</q-item-label>
                <q-item-label caption>{{ opt.description || 'Няма описание' }}</q-item-label>
                <q-item-label caption>
                  Цикли: {{ opt.cycles?.length || 0 }} | 
                  Действия: {{ getTotalActions(opt) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Controller Selection - LEGACY: Not used by FlowExecutor, devices have their own controllerId -->
        <!-- TODO: IMPLEMENT_LATER - Remove controller selection entirely -->
        <q-select
          v-model="selectedController"
          :options="controllerOptions"
          label="Изберете контролер"
          option-value="_id"
          option-label="name"
          emit-value
          map-options
          outlined
          :loading="isLoadingControllers"
          :disable="!selectedProgram"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                Няма налични контролери
              </q-item-section>
            </q-item>
          </template>

          <template v-slot:option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section avatar>
                <q-icon name="memory" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.name }}</q-item-label>
                <q-item-label caption>{{ opt.description || 'Няма описание' }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Selected Program Preview -->
        <div v-if="selectedProgramDetails" class="q-mt-md">
          <q-separator class="q-mb-md" />
          <div class="text-h6 q-mb-sm">Преглед на програмата</div>
          
          <q-list dense bordered class="rounded-borders">
            <q-item>
              <q-item-section>
                <q-item-label caption>Програма</q-item-label>
                <q-item-label>{{ selectedProgramDetails.name }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>Описание</q-item-label>
                <q-item-label>{{ selectedProgramDetails.description || 'Няма описание' }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>Цикли</q-item-label>
                <q-item-label>{{ selectedProgramDetails.cycles?.length || 0 }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>Общо действия</q-item-label>
                <q-item-label>{{ getTotalActions(selectedProgramDetails) }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>Общо параметри</q-item-label>
                <q-item-label>{{ getTotalParameters(selectedProgramDetails) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right" class="q-pa-md">
      <q-btn
        @click="handleLoadProgram"
        color="primary"
        icon="play_circle"
        label="Зареди програма"
        :loading="isLoading"
        :disable="!selectedProgram || !selectedController"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useActiveProgramStore } from '../../stores/activeProgram'
import { useProgramStore } from '../../stores/program'

interface IProgram {
  _id: string
  name: string
  description?: string
  cycles: any[]
}

interface IController {
  _id: string
  name: string
  description?: string
}

// Define emits
const emit = defineEmits<{
  'program-loaded': []
}>()

const activeProgramStore = useActiveProgramStore()
const programStore = useProgramStore()

// Local state
const selectedProgram = ref<string>('')
const selectedController = ref<string>('') // Will be set with real ObjectId
const isLoadingPrograms = ref(false)
const isLoadingControllers = ref(false)
const allPrograms = ref<IProgram[]>([])
const allControllers = ref<IController[]>([])

// Generate a mock ObjectId for default controller
const mockControllerId = '507f1f77bcf86cd799439011' // Valid ObjectId format

// Computed
const isLoading = computed(() => activeProgramStore.isLoading)

const programOptions = computed(() => {
  return allPrograms.value.filter(program => 
    program.cycles && program.cycles.length > 0
  )
})

const controllerOptions = computed(() => {
  // Return mock controller if no real controllers loaded
  if (allControllers.value.length === 0) {
    return [{
      _id: mockControllerId,
      name: 'Основен контролер',
      description: 'Основен хидропонен контролер'
    }]
  }
  return allControllers.value
})

const selectedProgramDetails = computed(() => {
  return allPrograms.value.find(program => program._id === selectedProgram.value) || null
})

// Methods
function getTotalActions(program: IProgram): number {
  if (!program.cycles) return 0
  return program.cycles.reduce((total, cycle) => {
    return total + (cycle.actions?.length || 0)
  }, 0)
}

function getTotalParameters(program: IProgram): number {
  if (!program.cycles) return 0
  return program.cycles.reduce((total, cycle) => {
    return total + (cycle.actions?.reduce((actionTotal: number, action: any) => {
      return actionTotal + (action.actionTemplateId?.parameters?.length || 0)
    }, 0) || 0)
  }, 0)
}

async function loadPrograms(): Promise<void> {
  try {
    isLoadingPrograms.value = true
    
    // Use program store to load programs
    await programStore.fetchPrograms()
    allPrograms.value = programStore.programs as IProgram[]
    
  } catch (error) {
    console.error('Failed to load programs:', error)
  } finally {
    isLoadingPrograms.value = false
  }
}

function filterPrograms(val: string, update: Function) {
  update(() => {
    if (val === '') {
      return
    }
    
    const needle = val.toLowerCase()
    allPrograms.value = allPrograms.value.filter(program => 
      program.name.toLowerCase().indexOf(needle) > -1
    )
  })
}

async function handleLoadProgram(): Promise<void> {
  if (!selectedProgram.value || !selectedController.value) return
  
  try {
    await activeProgramStore.loadProgram(selectedProgram.value, {
      controllerId: selectedController.value
    })
    
    emit('program-loaded')
    
    // Reset selections
    selectedProgram.value = ''
    selectedController.value = mockControllerId
    
  } catch (error) {
    console.error('Failed to load program:', error)
  }
}

// Lifecycle
onMounted(() => {
  selectedController.value = mockControllerId // Set default controller
  loadPrograms()
})
</script>

<style scoped>
.q-card {
  min-height: 200px;
}
</style>