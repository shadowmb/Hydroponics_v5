<template>
  <q-dialog 
    v-model="showDialog" 
    persistent 
    position="standard"
  >
    <q-card style="min-width: 500px">
      <q-card-section class="q-pb-none">
        <div class="text-h6">
          <q-icon name="save" class="q-mr-sm" />
          Запазване на поток
        </div>
      </q-card-section>

      <q-card-section>
        <!-- Flow Name (скрито при edit mode) -->
        <q-input
          v-if="!isEditMode"
          v-model="flowName"
          label="Име на потока"
          filled
          :rules="[
            val => !!val || 'Име е задължително',
            val => val.length >= 3 || 'Минимум 3 символа'
          ]"
          class="q-mb-md"
        />
        
        <!-- Existing name display за edit mode -->
        <div v-else class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Редактиране на поток:</div>
          <div class="text-h6 text-primary">{{ currentName || props.currentName || flowName }}</div>
        </div>

        <!-- Description -->
        <q-input
          v-model="description"
          type="textarea"
          label="Описание"
          filled
          rows="3"
          class="q-mb-md"
        />

        <!-- Version Control (Hidden - always patch for simplicity) -->
        <!-- Version type скрит за UI simplification, винаги patch -->

        <!-- Validation Status Display -->
        <div v-if="validationResult" class="q-mb-md">
          <q-banner 
            v-if="validationResult.status === 'invalid'" 
            class="bg-negative text-white"
            icon="error"
          >
            <div class="text-weight-medium">Потокът има грешки:</div>
            <ul class="q-ma-none q-pl-md">
              <li v-for="error in validationResult.errors" :key="error.code">
                {{ error.message }}
              </li>
            </ul>
            <div class="text-caption q-mt-sm">
              Може да се запази като draft, но не може да се използва в ActionTemplate
            </div>
          </q-banner>

          <q-banner 
            v-else-if="validationResult.status === 'validated'" 
            class="bg-warning text-white"
            icon="warning"
          >
            <div>Потокът е валиден, но липсват target assignments</div>
            <div class="text-caption q-mt-xs">
              Може да се използва в ActionTemplate след добавяне на targets
            </div>
          </q-banner>

          <q-banner 
            v-else-if="validationResult.status === 'ready'" 
            class="bg-positive text-white"
            icon="check_circle"
          >
            <div>Потокът е готов за използване в ActionTemplate</div>
          </q-banner>

          <q-banner 
            v-else-if="validationResult.status === 'draft'" 
            class="bg-info text-white"
            icon="edit"
          >
            <div>Потокът е в процес на разработка</div>
            <div class="text-caption q-mt-xs">
              Не може да се използва в ActionTemplate докато не е завършен
            </div>
          </q-banner>
        </div>

        <!-- Directory Selection (Auto-determined от validation) -->
        <div v-if="validationResult" class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Местоположение:</div>
          <q-banner 
            :class="targetDirectoryClass"
            :icon="targetDirectoryIcon"
            dense
          >
            <div class="text-body2">{{ targetDirectoryMessage }}</div>
          </q-banner>
        </div>

        <!-- Monitoring Flow Option -->
        <div class="q-mb-md">
          <q-checkbox 
            v-model="isMonitoringFlow"
            label="Използвай за мониторинг"
            class="q-mb-xs"
          />
          <div v-if="isMonitoringFlow" class="text-caption text-grey-7 q-ml-lg">
            Потокът ще се запази в monitoring папката и ще може да се използва за автоматичен мониторинг
          </div>
        </div>

        <!-- Save Options -->
        <div class="q-mb-sm">
          <q-checkbox 
            v-model="createBackup"
            label="Създай backup преди запазване"
            class="q-mb-xs"
          />
          <q-checkbox 
            v-model="clearTempFiles"
            label="Изчисти временни файлове след запазване"
            :disable="!hasTempFiles"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none">
        <q-btn 
          label="Отказ" 
          flat
          @click="cancel"
          :disable="saving"
        />
        
        <q-btn 
          label="Запази" 
          color="primary" 
          @click="save"
          :loading="saving"
          :disable="!canSave"
          icon="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { AutoSaveService } from '../services/AutoSaveService'
import type { ValidationResult } from '../../../services/UniversalValidationService'
import type { FlowDefinition } from '../types/FlowDefinition'

// Props & Emits
interface Props {
  modelValue: boolean
  flowData?: FlowDefinition
  validationResult?: ValidationResult
  currentName?: string
  currentDescription?: string
  isEditMode?: boolean  // Нов prop за edit mode detection
}

interface SaveOptions {
  name: string
  description: string
  versionType: 'patch' | 'minor' | 'major'
  isEditMode: boolean  // true = edit existing, false = create new
  createBackup: boolean
  clearTempFiles: boolean
  isMonitoringFlow: boolean  // true = save in monitoring folder
  // TODO: IMPLEMENT_LATER - Version bumping logic в parent component:
  // isEditMode: true → 1.0.0 → 1.0.1 (patch increment)  
  // isEditMode: false → new flow starts at 1.0
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', options: SaveOptions): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  currentName: '',
  currentDescription: '',
  isEditMode: false
})

const emit = defineEmits<Emits>()

// Reactive state
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const flowName = ref('')
const description = ref('')
const versionType = ref<'patch' | 'minor' | 'major'>('patch') // Fixed to patch for simplicity
const createBackup = ref(true)
const clearTempFiles = ref(true)
const isMonitoringFlow = ref(false)
const saving = ref(false)
const hasTempFiles = ref(false)

// Computed
const isEditMode = computed(() => props.isEditMode)

const canSave = computed(() => {
  if (isEditMode.value) {
    // Edit mode: не трябва име, само description
    return !saving.value
  } else {
    // Create mode: трябва име
    return flowName.value.length >= 3 && !saving.value
  }
})

// Directory management computed properties
const targetDirectory = computed(() => {
  if (!props.validationResult) return '/drafts/'
  
  const status = props.validationResult.status
  if (status === 'draft' || status === 'invalid') {
    return '/drafts/'
  } else {
    return '/flows/'
  }
})

const targetDirectoryClass = computed(() => {
  const dir = targetDirectory.value
  if (dir.includes('/flows/')) {
    return 'bg-positive text-white'
  } else {
    return 'bg-warning text-white'
  }
})

const targetDirectoryIcon = computed(() => {
  const dir = targetDirectory.value
  return dir.includes('/flows/') ? 'check_circle' : 'edit'
})

const targetDirectoryMessage = computed(() => {
  const dir = targetDirectory.value
  if (dir.includes('/flows/')) {
    return 'Потокът ще се запази във /flows/ (готов за ActionTemplate)'
  } else {
    return 'Потокът ще се запази във /drafts/ (в процес на разработка)'
  }
})

// Methods
const save = async () => {
  if (!canSave.value) return
  
  try {
    saving.value = true
    
    const saveOptions: SaveOptions = {
      name: isEditMode.value ? (props.currentName || flowName.value) : flowName.value,
      description: description.value,
      versionType: versionType.value,
      isEditMode: isEditMode.value,
      createBackup: createBackup.value,
      clearTempFiles: clearTempFiles.value,
      isMonitoringFlow: isMonitoringFlow.value
    }
    
    emit('save', saveOptions)
    
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  emit('cancel')
  showDialog.value = false
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Reset form when dialog opens
    flowName.value = props.currentName || props.flowData?.meta?.name || ''
    description.value = props.currentDescription || props.flowData?.meta?.description || ''
    console.log('🐛 DEBUG: Dialog opened - currentName:', props.currentName, 'currentDescription:', props.currentDescription);
    console.log('🐛 DEBUG: Dialog opened - flowData.meta:', props.flowData?.meta);
    console.log('🐛 DEBUG: Dialog opened - final values:', flowName.value, description.value);
    versionType.value = 'patch'
    createBackup.value = true
    clearTempFiles.value = true
    // Set monitoring flow checkbox from existing flow data
    isMonitoringFlow.value = props.flowData?.meta?.isMonitoringFlow || false
    
    // Check for temp files
    hasTempFiles.value = AutoSaveService.hasTempFile()
  }
})

// Lifecycle
onMounted(() => {
  hasTempFiles.value = AutoSaveService.hasTempFile()
})
</script>

<style scoped>
.q-banner ul {
  margin: 8px 0;
  padding-left: 16px;
}

.q-banner ul li {
  margin-bottom: 4px;
}

.text-subtitle2 {
  font-weight: 600;
  color: #1976d2;
}

.q-radio {
  display: block;
}
</style>