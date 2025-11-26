<template>
  <q-card style="min-width: 500px; max-width: 600px" data-test="controller-form-dialog">
    <q-card-section class="row items-center">
      <div class="text-h6">
        {{ controller ? 'Редактиране на контролер' : 'Добавяне на контролер' }}
      </div>
      <q-space />
      <q-btn icon="close" flat round dense @click="$emit('cancel')" />
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pt-md">
      <q-form @submit="handleSave" class="q-gutter-md">
        <!-- Controller Name -->
        <q-input
          v-model="formData.name"
          label="Име на контролер *"
          :rules="[(val) => (val && val.length > 0) || 'Името е задължително']"
          outlined
          data-test="controller-name-input"
        />

        <!-- Controller Type -->
        <q-select
          v-model="formData.type"
          :options="controllerTypeOptions"
          label="Тип контролер *"
          :rules="[(val) => !!val || 'Типът е задължителен']"
          outlined
          emit-value
          map-options
          data-test="controller-type-select"
          :max-height="200"
          :virtual-scroll-item-size="48"
        />

        <!-- Communication By -->
        <q-select
          v-model="formData.communicationBy"
          :options="communicationByOptions"
          label="Физическа връзка *"
          :rules="[(val) => !!val || 'Физическата връзка е задължителна']"
          outlined
          emit-value
          map-options
          data-test="communication-by-select"
          @update:model-value="onCommunicationByChange"
          :max-height="200"
          :virtual-scroll-item-size="48"
        />

        <!-- Communication Type -->
        <q-select
          v-model="formData.communicationType"
          :options="communicationTypeOptions"
          label="Протокол *"
          :rules="[(val) => !!val || 'Протоколът е задължителен']"
          outlined
          emit-value
          map-options
          data-test="communication-type-select"
          :disable="!formData.communicationBy"
          @update:model-value="onCommunicationTypeChange"
          :max-height="200"
          :virtual-scroll-item-size="48"
        />

        <!-- Dynamic Configuration Fields -->
        <div v-for="field in dynamicFields" :key="field.name" class="dynamic-field">
          <!-- Text Input -->
          <q-input
            v-if="field.type === 'text'"
            v-model="formData.communicationConfig[field.name]"
            :label="field.label + (field.required ? ' *' : '')"
            :placeholder="field.placeholder"
            :hint="field.hint"
            :rules="field.required ? [(val) => (val && val.length > 0) || field.label + ' е задължителен'] : []"
            outlined
            :data-test="field.name === 'ipAddress' || field.name === 'address' ? 'controller-address-input' : undefined"
          />
          
          <!-- Number Input -->
          <q-input
            v-else-if="field.type === 'number'"
            v-model.number="formData.communicationConfig[field.name]"
            type="number"
            :label="field.label + (field.required ? ' *' : '')"
            :hint="field.hint"
            :min="field.min"
            :max="field.max"
            :rules="field.required ? [(val) => val !== undefined && val !== null || field.label + ' е задължителен'] : []"
            outlined
          />
          
          <!-- Password Input -->
          <q-input
            v-else-if="field.type === 'password'"
            v-model="formData.communicationConfig[field.name]"
            type="password"
            :label="field.label + (field.required ? ' *' : '')"
            :hint="field.hint"
            :rules="field.required ? [(val) => (val && val.length > 0) || field.label + ' е задължителен'] : []"
            outlined
          />
          
          <!-- Select Input -->
          <q-select
            v-else-if="field.type === 'select'"
            v-model="formData.communicationConfig[field.name]"
            :options="field.options"
            :label="field.label + (field.required ? ' *' : '')"
            :hint="field.hint"
            :rules="field.required ? [(val) => !!val || field.label + ' е задължителен'] : []"
            outlined
            emit-value
            map-options
          />
        </div>

        <!-- Description -->
        <q-input
          v-model="formData.description"
          label="Описание / Коментар"
          type="textarea"
          rows="3"
          outlined
        />

        <!-- Status -->
        <q-select
          v-model="formData.status"
          :options="statusOptions"
          label="Статус"
          outlined
          emit-value
          map-options
        />

        <!-- Capabilities Section -->
        <q-expansion-item
          label="Команди (Capabilities)"
          icon="code"
          header-class="text-primary"
        >
          <q-card flat bordered class="q-pa-md">
            <!-- Detect Button -->
            <div class="row q-mb-md">
              <q-btn
                color="primary"
                icon="refresh"
                label="Detect Capabilities"
                :disable="formData.status !== 'online'"
                :loading="detectingCapabilities"
                @click="detectCapabilities"
              >
                <q-tooltip v-if="formData.status !== 'online'">
                  Контролерът трябва да е online
                </q-tooltip>
              </q-btn>
            </div>

            <!-- Command Checkboxes -->
            <div class="row q-col-gutter-sm">
              <div
                v-for="cmd in availableCommands"
                :key="cmd.name"
                class="col-12 col-md-6"
              >
                <q-checkbox
                  v-model="formData.capabilities"
                  :val="cmd.name"
                  :label="cmd.displayName"
                >
                  <q-tooltip>
                    {{ cmd.description }}
                    <div v-if="cmd.requiredByDevices.length > 0" class="q-mt-xs">
                      <strong>Изисква се за:</strong> {{ cmd.requiredByDevices.join(', ') }}
                    </div>
                  </q-tooltip>
                </q-checkbox>
              </div>
            </div>
          </q-card>
        </q-expansion-item>

        <!-- Available Ports -->
        <q-expansion-item
          v-if="formData.type"
          label="Налични портове"
          icon="settings_input_component"
          default-opened
          header-class="text-primary"
        >
          <div class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">
              Налични портове за {{ getControllerLabel() }}
              <q-btn
                flat
                dense
                icon="refresh"
                size="sm"
                @click="loadPortsFromTemplate"
                class="q-ml-sm"
              >
                <q-tooltip>Зареди портове от шаблон</q-tooltip>
              </q-btn>
            </div>

            <!-- Port Management Grid -->
            <div class="port-grid">
              <div
                v-for="(port, index) in formData.availablePorts"
                :key="port.key || index"
                class="port-item"
                :class="{ 'port-disabled': !port.isActive, 'port-reserved': isPortReserved(port.key) }"
              >
                <div class="port-header">
                  <span class="port-id">{{ port.key }}</span>
                  <q-toggle
                    v-model="port.isActive"
                    color="positive"
                    size="sm"
                    :disable="isPortReserved(port.key)"
                  />
                </div>
                <div class="port-label">
                  {{ port.label }}
                </div>
                <div class="port-info">
                  <q-chip
                    v-if="getPortType(port.key)"
                    size="xs"
                    :color="getPortType(port.key) === 'analog' ? 'orange' : 'blue'"
                    text-color="white"
                  >
                    {{ getPortType(port.key) }}
                  </q-chip>
                  <q-chip
                    v-if="isPortPWM(port.key)"
                    size="xs"
                    color="purple"
                    text-color="white"
                  >
                    PWM
                  </q-chip>
                  <q-chip
                    v-if="getPortType(port.key) === 'digital' && port.currentState"
                    size="xs"
                    :color="port.currentState === 'HIGH' ? 'orange' : 'green'"
                    text-color="white"
                  >
                    {{ port.currentState }}
                  </q-chip>
                  <q-chip
                    v-if="isPortReserved(port.key)"
                    size="xs"
                    color="grey"
                    text-color="white"
                  >
                    Reserved
                  </q-chip>
                </div>
              </div>
            </div>
          </div>
        </q-expansion-item>

        <!-- Active Toggle -->
        <q-toggle
          v-model="formData.isActive"
          label="Активен контролер"
          color="positive"
        />
      </q-form>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right" class="q-pa-md">
      <q-btn
        flat
        label="Отказ"
        color="grey"
        @click="$emit('cancel')"
      />
      <q-btn
        label="💾 Запази"
        color="primary"
        @click="handleSave"
        :loading="saving"
        data-test="save-controller-btn"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
// ABOUTME: Controller form component for creating and editing hardware controllers
// ABOUTME: Handles dynamic field generation based on communication type and controller templates
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import controllerTemplates from '../pages/assets/data/controller-templates.json'
import communicationConfig from '../pages/assets/data/communication-config.json'
import api from '../services/api'

// Type Definitions
interface Port {
  key: string
  label: string
  type: string
  isActive: boolean
  isOccupied: boolean
  currentState?: string | null
}

interface ConfigField {
  name: string
  label: string
  type: string
  required?: boolean
  default?: any
  options?: any[]
  placeholder?: string
  hint?: string
  min?: number
  max?: number
  validation?: string
}

interface CommunicationByConfig {
  label: string
  icon: string
  description: string
  fields?: ConfigField[]
}

interface CommunicationTypeConfig {
  label: string
  icon: string
  description: string
  compatible_by: string[]
  fields?: ConfigField[]
}

interface ControllerTemplate {
  label: string
  communication_by: string[]
  communication_type: string[]
  ports: Array<{
    id: string
    label: string
    type: string
    reserved?: boolean
    pwm?: boolean
  }>
}

type ControllerTemplates = Record<string, ControllerTemplate>
type CommunicationByConfigs = Record<string, CommunicationByConfig>
type CommunicationTypeConfigs = Record<string, CommunicationTypeConfig>

// Props
interface Props {
  controller?: any
  connectionTypes: any[]
}

const props = withDefaults(defineProps<Props>(), {
  controller: null,
  connectionTypes: () => []
})

// Emits
const emit = defineEmits(['save', 'cancel'])

const $q = useQuasar()

// Data
const saving = ref(false)
const detectingCapabilities = ref(false)
const availableCommands = ref<any[]>([])
const formData = ref({
  name: '',
  type: 'Arduino_Uno' as keyof ControllerTemplates,
  communicationBy: '',
  communicationType: '',
  communicationConfig: {} as Record<string, any>,
  description: '',
  status: 'offline',
  isActive: true,
  availablePorts: [] as Port[],
  capabilities: []
})

// Type assertions for JSON imports
const typedControllerTemplates = controllerTemplates as ControllerTemplates
const typedCommunicationConfig = communicationConfig as {
  communication_by: CommunicationByConfigs
  communication_type: CommunicationTypeConfigs
}

// Computed
const communicationByOptions = computed(() => {
  if (!formData.value.type) return []
  const template = typedControllerTemplates[formData.value.type]
  if (!template?.communication_by) return []
  
  return template.communication_by.map(method => ({
    label: typedCommunicationConfig.communication_by[method]?.label || method,
    value: method
  }))
})

const communicationTypeOptions = computed(() => {
  if (!formData.value.communicationBy) return []
  
  return Object.keys(typedCommunicationConfig.communication_type)
    .filter(type => {
      const typeConfig = typedCommunicationConfig.communication_type[type]
      return typeConfig.compatible_by.includes(formData.value.communicationBy)
    })
    .map(type => ({
      label: typedCommunicationConfig.communication_type[type].label,
      value: type
    }))
})

const dynamicFields = computed((): ConfigField[] => {
  const fields: ConfigField[] = []
  
  // Communication By fields
  if (formData.value.communicationBy) {
    const byConfig = typedCommunicationConfig.communication_by[formData.value.communicationBy]
    if (byConfig?.fields) {
      fields.push(...byConfig.fields)
    }
  }
  
  // Communication Type fields
  if (formData.value.communicationType) {
    const typeConfig = typedCommunicationConfig.communication_type[formData.value.communicationType]
    if (typeConfig?.fields) {
      fields.push(...typeConfig.fields)
    }
  }
  
  return fields
})

const controllerTypeOptions = computed(() => {
  return Object.keys(typedControllerTemplates).map(key => ({
    label: typedControllerTemplates[key as keyof ControllerTemplates].label,
    value: key
  }))
})

// Port table columns
const portColumns = [
  { name: 'key', label: 'Порт', field: 'key' },
  { name: 'label', label: 'Име', field: 'label' },
  { name: 'isActive', label: 'Активен', field: 'isActive' },
  { name: 'actions', label: '', field: 'actions' }
]

const statusOptions = [
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Error', value: 'error' },
  { label: 'Maintenance', value: 'maintenance' }
]

// Methods
function onCommunicationByChange() {
  formData.value.communicationType = ''
  formData.value.communicationConfig = {}
  setDefaultValues()
}

function onCommunicationTypeChange() {
  setDefaultValues()
}

function setDefaultValues(): void {
  dynamicFields.value.forEach((field: ConfigField) => {
    if (field.default !== undefined && !formData.value.communicationConfig[field.name]) {
      formData.value.communicationConfig[field.name] = field.default
    }
  })
}

function getControllerLabel(): string {
  const template = typedControllerTemplates[formData.value.type]
  return template?.label || formData.value.type
}

function loadPortsFromTemplate(): void {
  formData.value.availablePorts = generateDefaultPorts()
}

function getPortTemplate(portId: string) {
  const template = typedControllerTemplates[formData.value.type]
  return template?.ports?.find(p => p.id === portId)
}

function isPortReserved(portId: string): boolean {
  const portTemplate = getPortTemplate(portId)
  return portTemplate?.reserved || false
}

function getPortType(portId: string): string {
  const portTemplate = getPortTemplate(portId)
  return portTemplate?.type || ''
}

function isPortPWM(portId: string): boolean {
  const portTemplate = getPortTemplate(portId)
  return portTemplate?.pwm || false
}

function generateDefaultPorts(): Port[] {
  const type = formData.value.type
  const template = typedControllerTemplates[type]
  if (!template?.ports) return []
  
  return template.ports.map(port => ({
    key: port.id,
    label: port.label,
    type: port.type,
    isActive: !port.reserved,
    isOccupied: false,
    currentState: port.type === 'digital' ? 'HIGH' : null
  }))
}

async function detectCapabilities() {
  if (!props.controller || !props.controller._id) {
    $q.notify({
      type: 'warning',
      message: 'Моля запазете контролера преди откриване на capabilities'
    })
    return
  }

  detectingCapabilities.value = true
  try {
    console.log('[ControllerForm] Detecting capabilities for controller:', props.controller._id)

    const response = await api.getClient().post(`/controllers/${props.controller._id}/detect-capabilities`)

    if (response.data.success) {
      // Update formData with detected capabilities
      formData.value.capabilities = response.data.data.capabilities || []

      $q.notify({
        type: 'positive',
        message: response.data.message || 'Capabilities успешно открити',
        caption: `Открити ${formData.value.capabilities.length} команди`
      })

      console.log('[ControllerForm] Detected capabilities:', formData.value.capabilities)
    } else {
      $q.notify({
        type: 'warning',
        message: response.data.message || 'Не успя откриването на capabilities',
        caption: response.data.error
      })
    }
  } catch (error: any) {
    console.error('[ControllerForm] Error detecting capabilities:', error)

    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Грешка при откриване на capabilities'

    $q.notify({
      type: 'negative',
      message: errorMessage,
      caption: error.response?.status === 400 ? 'Контролерът трябва да е online' : 'Моля проверете връзката'
    })
  } finally {
    detectingCapabilities.value = false
  }
}

function validateDynamicFields(): boolean {
  for (const field of dynamicFields.value) {
    if (field.required) {
      const value = formData.value.communicationConfig[field.name]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        $q.notify({
          type: 'negative',
          message: `${field.label} е задължително поле`
        })
        return false
      }

      // IP validation
      if (field.validation === 'ip' && value) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        if (!ipRegex.test(value)) {
          $q.notify({
            type: 'negative',
            message: `${field.label} трябва да е валиден IP адрес`
          })
          return false
        }
      }

      // MAC validation
      if (field.validation === 'mac' && value) {
        const macRegex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i
        if (!macRegex.test(value)) {
          $q.notify({
            type: 'negative',
            message: `${field.label} трябва да е валиден MAC адрес (формат: XX:XX:XX:XX:XX:XX)`
          })
          return false
        }
      }
    }
  }
  return true
}

async function handleSave() {
  saving.value = true
  try {
    // Validate basic required fields
    if (!formData.value.name || !formData.value.type || !formData.value.communicationBy || !formData.value.communicationType) {
      $q.notify({
        type: 'negative',
        message: 'Моля попълнете всички задължителни полета'
      })
      return
    }
    
    // Validate dynamic configuration fields
    if (!validateDynamicFields()) {
      return
    }

    // Add required backend fields based on communication setup
    const controllerPayload = {
      ...formData.value,
      // Set connectionType based on communicationType
      connectionType: formData.value.communicationType === 'raw_serial' ? 'serial' : 'network',
      // Add lastDiscoveryMethod ONLY for network controllers
      ...(formData.value.communicationType !== 'raw_serial' && {
        lastDiscoveryMethod: 'http'
      })
    }

    emit('save', controllerPayload)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване'
    })
  } finally {
    saving.value = false
  }
}

// Watch for controller changes
watch(() => props.controller, (newController) => {
  if (newController) {
    formData.value = {
      name: newController.name || '',
      type: newController.type || 'Arduino_Uno',
      communicationBy: newController.communicationBy || '',
      communicationType: newController.communicationType || '',
      communicationConfig: newController.communicationConfig || {},
      description: newController.description || '',
      status: newController.status || 'offline',
      isActive: newController.isActive !== undefined ? newController.isActive : true,
      availablePorts: newController.availablePorts || generateDefaultPorts(),
      capabilities: newController.capabilities || []
    }
  } else {
    // Reset form for new controller
    formData.value = {
      name: '',
      type: 'Arduino_Uno',
      communicationBy: '',
      communicationType: '',
      communicationConfig: {},
      description: '',
      status: 'offline',
      isActive: true,
      availablePorts: generateDefaultPorts(),
      capabilities: []
    }
  }
}, { immediate: true })

// Watch for controller type changes to update default ports
watch(() => formData.value.type, (newType) => {
  if (!props.controller) { // Only for new controllers
    formData.value.availablePorts = generateDefaultPorts()
  }
})

// Initialize default values on mount
onMounted(async () => {
  setDefaultValues()

  // Load available commands from generator config
  try {
    const commandsResponse = await api.getClient().get('/generator/preview')
    availableCommands.value = commandsResponse.data.data?.commands || []
    console.log('[ControllerForm] Loaded commands:', availableCommands.value)
  } catch (error) {
    console.error('[ControllerForm] Error loading commands:', error)
  }
})
</script>

<style scoped>
.dynamic-field {
  margin-bottom: 16px;
}

.port-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.port-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  background: white;
  transition: all 0.3s ease;
}

.port-item.port-disabled {
  opacity: 0.6;
  background: #f5f5f5;
}

.port-item.port-reserved {
  border-color: #ff9800;
  background: rgba(255, 152, 0, 0.05);
}

.port-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.port-id {
  font-weight: 600;
  font-size: 14px;
  color: #1976d2;
}

.port-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  min-height: 16px;
}

.port-info {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>