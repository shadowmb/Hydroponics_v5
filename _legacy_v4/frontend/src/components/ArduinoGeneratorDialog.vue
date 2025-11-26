// ABOUTME: Dialog component for generating Arduino code with step-by-step wizard interface
// ABOUTME: Allows users to select controller, devices, review configuration, and download generated code
<template>
  <q-dialog v-model="isOpen" persistent no-backdrop-dismiss>
    <q-card style="min-width: 700px; max-width: 900px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          <q-icon name="code" class="q-mr-sm" color="primary" />
          Arduino Code Generator
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-separator />

      <q-stepper
        v-model="step"
        ref="stepper"
        color="primary"
        animated
        flat
        keep-alive
      >
        <!-- Step 1: Controller Type Selection -->
        <q-step
          :name="1"
          title="Избор на контролер"
          icon="router"
          :done="step > 1"
        >
          <q-card-section>
            <div class="q-gutter-md">
              <q-select
                v-model="selectedControllerId"
                :options="controllerTypes"
                option-value="id"
                option-label="displayName"
                label="Тип контролер"
                outlined
                dense
                :disable="loading"
                emit-value
                map-options
                @update:model-value="handleControllerChange"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.displayName }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.chipset }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </q-card-section>
        </q-step>

        <!-- Step 1.5: Communication Type Selection -->
        <q-step
          :name="1.5"
          title="Избор на комуникация"
          icon="cable"
          :done="step > 1.5"
        >
          <q-card-section>
            <div class="q-gutter-md">
              <q-select
                v-model="selectedCommunicationType"
                :options="availableCommunicationTypes"
                label="Тип комуникация"
                outlined
                dense
                :disable="loading"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt === 'serial' ? 'Serial (USB)' : 'WiFi' }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </q-card-section>
        </q-step>

        <!-- Step 2: Device Reference + Manual Commands -->
        <q-step
          :name="2"
          title="Избор на команди"
          icon="code"
          :done="step > 2"
        >
          <q-card-section>
            <div class="q-gutter-md">
              <!-- Device Templates Reference (info only) -->
              <div>
                <div class="text-h6 q-mb-sm">Справка за Device Templates</div>
                <div class="text-body2 text-grey-6 q-mb-md">
                  Изберете device template за да видите каква команда изисква (само информативно):
                </div>

                <q-select
                  v-model="selectedDeviceTemplate"
                  :options="deviceTemplates"
                  option-label="displayName"
                  label="Device Template (справка)"
                  outlined
                  dense
                  clearable
                  :disable="loading || deviceTemplates.length === 0"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.displayName }}</q-item-label>
                        <q-item-label caption>{{ scope.opt.technicalType }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <!-- Info card for selected template -->
                <q-card v-if="selectedDeviceTemplate" flat bordered class="q-mt-sm bg-blue-1">
                  <q-card-section>
                    <div class="text-subtitle2 text-primary q-mb-xs">
                      <q-icon name="info" class="q-mr-xs" />
                      Информация за избрания device template
                    </div>
                    <div class="text-body2">
                      <div><strong>Име:</strong> {{ selectedDeviceTemplate.displayName }}</div>
                      <div><strong>Тип:</strong> {{ selectedDeviceTemplate.technicalType }}</div>
                      <div v-if="selectedDeviceTemplate.description">
                        <strong>Описание:</strong> {{ selectedDeviceTemplate.description }}
                      </div>
                      <div v-if="selectedDeviceTemplate.requiredCommand">
                        <strong>Изисква команда:</strong>
                        <q-chip color="primary" text-color="white" size="sm" class="q-ml-xs">
                          {{ selectedDeviceTemplate.requiredCommand }}
                        </q-chip>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <q-separator class="q-my-md" />

              <!-- Manual Commands Section -->
              <div>
                <div class="text-h6 q-mb-sm">Ръчен избор на команди</div>
                <div class="text-body2 text-grey-6 q-mb-md">
                  Изберете команди за включване във firmware:
                </div>

                <div v-if="availableCommandsForManual.length === 0" class="text-center q-py-md">
                  <div class="text-body2 text-grey-6">
                    Първо изберете тип контролер
                  </div>
                </div>

                <div v-else class="row">
                  <div
                    v-for="cmd in availableCommandsForManual"
                    :key="cmd.name"
                    class="col-12 col-md-6 q-pa-xs"
                  >
                    <q-checkbox
                      v-model="selectedManualCommands"
                      :val="cmd.name"
                      :disable="loading || incompatibleCommandsSet.has(cmd.name)"
                      class="full-width"
                    >
                      <template v-slot:default>
                        <div class="q-ml-sm">
                          <div class="text-weight-medium">{{ cmd.name }}</div>
                          <div v-if="cmd.description" class="text-caption text-grey-6">
                            {{ cmd.description }}
                          </div>
                          <div v-if="incompatibleCommandsSet.has(cmd.name)" class="text-caption text-negative">
                            ⚠️ Несъвместимо с {{ selectedControllerLabel }}
                          </div>
                        </div>
                      </template>
                    </q-checkbox>
                  </div>
                </div>
              </div>

              <!-- Selected Commands Display -->
              <div v-if="requiredCommands.length > 0" class="bg-green-1 q-pa-md rounded-borders q-mt-md">
                <div class="text-subtitle2 text-green-9 q-mb-sm">
                  <q-icon name="check_circle" class="q-mr-xs" />
                  Избрани команди ({{ requiredCommands.length }}):
                </div>
                <div class="row q-gutter-xs">
                  <q-chip
                    v-for="cmd in requiredCommands"
                    :key="cmd"
                    color="green"
                    text-color="white"
                    size="sm"
                  >
                    {{ cmd }}
                  </q-chip>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-step>

        <!-- Step 3: Review and Generate -->
        <q-step
          :name="3"
          title="Преглед & Генериране"
          icon="fact_check"
        >
          <q-card-section>
            <div class="q-gutter-md">
              <div class="text-h6 q-mb-md">Обобщение на конфигурацията</div>

              <q-list bordered separator>
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="router" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Тип контролер</q-item-label>
                    <q-item-label caption>
                      {{ selectedControllerLabel }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="cable" color="secondary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Тип комуникация</q-item-label>
                    <q-item-label caption>
                      {{ selectedCommunicationType === 'serial' ? 'Serial (USB)' : 'WiFi' }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="code" color="accent" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Избрани команди</q-item-label>
                    <q-item-label caption>
                      <div class="row q-gutter-xs q-mt-xs">
                        <q-chip
                          v-for="cmd in requiredCommands"
                          :key="cmd"
                          color="accent"
                          text-color="white"
                          size="sm"
                        >
                          {{ cmd }}
                        </q-chip>
                      </div>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="q-mt-md text-center">
                <q-btn
                  color="primary"
                  icon="build"
                  label="Генерирай Arduino код"
                  @click="generateCode"
                  :loading="loading"
                  size="lg"
                />
              </div>
            </div>
          </q-card-section>
        </q-step>

        <!-- Step 4: Success & Download -->
        <q-step
          v-if="step === 4"
          :name="4"
          title="Success"
          icon="check_circle"
        >
          <q-card-section class="text-center">
            <q-icon name="check_circle" size="64px" color="positive" class="q-mb-md" />
            <div class="text-h6 text-positive q-mb-sm">Code Generated Successfully!</div>
            <div class="text-body2 text-grey-6 q-mb-lg">
              Your Arduino code is ready for download
            </div>

            <q-btn
              color="positive"
              icon="download"
              label="Download Arduino Code"
              @click="downloadCode"
              size="md"
            />

            <div v-if="generatedResult" class="q-mt-lg bg-grey-2 q-pa-md rounded-borders text-left">
              <div class="text-subtitle2 text-grey-8 q-mb-xs">Generation Details:</div>
              <div class="text-caption text-grey-7">
                <div>Controller: {{ generatedResult.controller || 'N/A' }}</div>
                <div>Devices: {{ generatedResult.deviceCount || 0 }}</div>
                <div>Commands: {{ generatedResult.commandCount || 0 }}</div>
              </div>
            </div>
          </q-card-section>
        </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation>
            <q-btn
              v-if="step < 3"
              @click="$refs.stepper.next()"
              color="primary"
              label="Continue"
              :disable="!canProceed"
            />
            <q-btn
              v-if="step > 1 && step < 4"
              flat
              color="grey"
              @click="$refs.stepper.previous()"
              label="Back"
              class="q-ml-sm"
            />
            <q-btn
              v-if="step === 4"
              flat
              color="primary"
              @click="close"
              label="Close"
            />
          </q-stepper-navigation>
        </template>
      </q-stepper>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { generatorApi, deviceTemplateApi } from '../services/api'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Emits
const emit = defineEmits<{
  close: []
  generated: [result: any]
}>()

// State
const isOpen = ref(true)
const step = ref(1)
const selectedControllerId = ref<string | null>(null)
const selectedCommunicationType = ref<string | null>(null)
const availableCommunicationTypes = ref<any[]>([])
const selectedDeviceTemplate = ref<any | null>(null)
const selectedManualCommands = ref<string[]>([])
const deviceTemplates = ref<any[]>([])
const generatedResult = ref<any>(null)
const loading = ref(false)
const controllerTypes = ref<any[]>([])
const availableCommandsForManual = ref<any[]>([])

// Computed
const requiredCommands = computed(() => {
  return selectedManualCommands.value
})

const selectedController = computed(() => {
  return controllerTypes.value.find(c => c.id === selectedControllerId.value)
})

const incompatibleCommandsSet = computed(() => {
  if (!selectedController.value) return new Set<string>()
  return new Set(selectedController.value.incompatibleCommands || [])
})

const canProceed = computed(() => {
  if (step.value === 1) return selectedControllerId.value !== null
  if (step.value === 1.5) return selectedCommunicationType.value !== null
  if (step.value === 2) return selectedManualCommands.value.length > 0
  return true
})

const selectedControllerLabel = computed(() => {
  return selectedController.value ? selectedController.value.displayName : selectedControllerId.value
})

// Methods
function close() {
  isOpen.value = false
  emit('close')
}

function handleControllerChange() {
  // Reset selections when controller changes
  selectedDeviceTemplate.value = null
  selectedManualCommands.value = []

  // Populate available communication types from selected controller
  const controller = controllerTypes.value.find(c => c.id === selectedControllerId.value)
  if (controller && controller.communicationTypes) {
    availableCommunicationTypes.value = controller.communicationTypes
    selectedCommunicationType.value = null // Reset selection
  }
}

async function generateCode() {
  loading.value = true

  try {
    console.log('[ArduinoGeneratorDialog] Generating code for:', {
      controllerId: selectedControllerId.value,
      communicationType: selectedCommunicationType.value,
      manualCommandNames: selectedManualCommands.value
    })

    // Call backend API to generate code
    const response = await generatorApi.generate(
      selectedControllerId.value!,
      selectedCommunicationType.value!,
      selectedManualCommands.value
    )

    generatedResult.value = {
      controller: selectedControllerLabel.value,
      deviceCount: 0,
      commandCount: response.data.commandsCount || requiredCommands.value.length,
      commands: response.data.commands || requiredCommands.value,
      filePath: response.data.filePath,
      filename: response.data.filePath.split('/').pop()
    }

    step.value = 4
    emit('generated', generatedResult.value)

  } catch (error: any) {
    console.error('[ArduinoGeneratorDialog] Error generating code:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.error || 'Грешка при генериране на код'
    })
  } finally {
    loading.value = false
  }
}

function downloadCode() {
  console.log('[ArduinoGeneratorDialog] Downloading code:', generatedResult.value)

  try {
    if (!generatedResult.value?.filePath) {
      throw new Error('No file path available')
    }

    generatorApi.downloadFirmware(generatedResult.value.filePath)

    $q.notify({
      type: 'positive',
      message: 'Firmware файлът се изтегля...'
    })
  } catch (error) {
    console.error('[ArduinoGeneratorDialog] Error downloading code:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при изтегляне на файла'
    })
  }
}

// Load configuration on mount
onMounted(async () => {
  loading.value = true
  try {
    // Load generator config (controllers + commands)
    const previewResponse = await generatorApi.preview()
    controllerTypes.value = previewResponse.data.controllers || []
    availableCommandsForManual.value = previewResponse.data.availableCommands || []
    deviceTemplates.value = previewResponse.data.deviceTemplates || []

    console.log('[ArduinoGeneratorDialog] Loaded config:', {
      controllers: controllerTypes.value,
      commands: availableCommandsForManual.value,
      templates: deviceTemplates.value
    })
  } catch (error: any) {
    console.error('[ArduinoGeneratorDialog] Error loading configuration:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на конфигурация'
    })
  } finally {
    loading.value = false
  }
})

// Watch for dialog close
watch(isOpen, (newValue) => {
  if (!newValue) {
    emit('close')
  }
})
</script>

<style scoped>
.q-stepper {
  box-shadow: none;
}
</style>
