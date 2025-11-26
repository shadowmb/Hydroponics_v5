<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">
        {{ isEdit ? 'Редактиране на реле' : 'Ново реле' }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-form @submit="handleSave" class="q-gutter-md">
        <!-- Basic Info -->
        <q-input
          v-model="formData.name"
          label="Име на релето *"
          outlined
          :rules="[val => !!val || 'Името е задължително']"
        />

        <q-select
          v-model="formData.controllerId"
          :options="controllerOptions"
          label="Контролер *"
          option-value="value"
          option-label="label"
          outlined
          emit-value
          map-options
          @update:model-value="onControllerChange"
          :rules="[val => !!val || 'Контролерът е задължителен']"
        />

        <q-select
          v-model="formData.relayType"
          :options="relayTypeOptions"
          label="Тип реле *"
          outlined
          emit-value
          map-options
          @update:model-value="onRelayTypeChange"
          :rules="[val => !!val || 'Типът е задължителен']"
        />

        <!-- Technical Specs -->
        <div class="row q-gutter-md">
          <div class="col">
            <q-input
              v-model="formData.manufacturer"
              label="Производител"
              outlined
            />
          </div>
          <div class="col">
            <q-input
              v-model="formData.modelNumber"
              label="Модел"
              outlined
            />
          </div>
        </div>

        <div class="row q-gutter-md">
          <div class="col">
            <q-input
              v-model.number="formData.maxVoltage"
              label="Макс. напрежение (V)"
              type="number"
              outlined
              min="0"
            />
          </div>
          <div class="col">
            <q-input
              v-model.number="formData.maxCurrent"
              label="Макс. ток (A)"
              type="number"
              outlined
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <q-select
          v-model="formData.activationType"
          :options="activationTypeOptions"
          label="Тип активация"
          outlined
          emit-value
          map-options
        />

        <!-- Port Configuration -->
        <div v-if="formData.relayType">
          <div class="text-subtitle2 q-mb-md">
            Конфигурация на портовете ({{ getPortCount() }} порта)
          </div>
          
          <div 
            v-for="port in formData.ports" 
            :key="port.portNumber"
            class="q-pa-md q-mb-sm bg-grey-1 rounded-borders"
          >
            <div class="row q-gutter-md items-center">
              <div class="col-auto">
                <q-badge color="primary" :label="`Порт ${port.portNumber}`" />
              </div>
              
              <div class="col">
                <q-select
                  v-model="port.controlPin"
                  :options="getPortOptionsForRelay()"
                  label="Control Pin"
                  outlined
                  dense
                  emit-value
                  map-options
                  option-disable="disable"
                  :rules="[]"
                >
                  <!-- Custom option template with chips -->
                  <template v-slot:option="{ itemProps, opt }">
                    <q-item v-bind="itemProps" :disable="opt.disable">
                      <q-item-section>
                        <div class="row items-center q-gutter-xs">
                          <q-chip :color="opt.portType === 'empty' ? 'grey-5' : 'blue-6'" text-color="white" size="sm" dense>
                            {{ opt.portKey }}
                          </q-chip>
                          <q-chip v-if="opt.portType !== 'empty'" color="green-6" text-color="white" size="sm" dense>
                            {{ opt.portType }}
                          </q-chip>
                          <q-chip v-if="opt.currentState" :color="opt.stateColor" text-color="white" size="sm" dense>
                            {{ opt.currentState }}
                          </q-chip>
                          <span class="text-caption text-grey-6">{{ opt.description }}</span>
                        </div>
                      </q-item-section>
                    </q-item>
                  </template>
                  
                  <!-- Custom selected value template -->
                  <template v-slot:selected-item="{ opt }">
                    <div class="row items-center q-gutter-xs">
                      <q-chip :color="opt.portType === 'empty' ? 'grey-5' : 'blue-6'" text-color="white" size="sm" dense>
                        {{ opt.portKey }}
                      </q-chip>
                      <q-chip v-if="opt.portType !== 'empty'" color="green-6" text-color="white" size="sm" dense>
                        {{ opt.portType }}
                      </q-chip>
                      <q-chip v-if="opt.currentState" :color="opt.stateColor" text-color="white" size="sm" dense>
                        {{ opt.currentState }}
                      </q-chip>
                    </div>
                  </template>
                </q-select>
              </div>
              
              <div class="col-auto">
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="clear"
                  size="sm"
                  :disable="!port.controlPin"
                  @click="clearPortPin(port)"
                  title="Изчисти порт"
                />
              </div>
              
              <div class="col">
                <q-input
                  v-model="port.label"
                  label="Етикет (по избор)"
                  outlined
                  dense
                />
              </div>
            </div>
          </div>
        </div>

        <q-input
          v-model="formData.description"
          label="Описание"
          type="textarea"
          rows="3"
          outlined
        />

        <q-toggle
          v-model="formData.isActive"
          label="Активно реле"
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
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
// ABOUTME: RelayForm component manages relay device configuration with port mappings and control pin assignments
// ABOUTME: Supports multi-port relays with automatic port generation and controller pin selection
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '../services/api'

const $q = useQuasar()

// Props
interface Props {
  relay?: any
  controllers: any[]
}

const props = withDefaults(defineProps<Props>(), {
  relay: null,
  controllers: () => []
})

// Emits
const emit = defineEmits(['save', 'cancel'])

// Data
const saving = ref(false)

const formData = ref({
  name: '',
  controllerId: '',
  relayType: '',
  manufacturer: '',
  modelNumber: '',
  description: '',
  maxVoltage: 5,
  maxCurrent: 10,
  activationType: 'active_high',
  ports: [] as any[],
  isActive: true
})

// Computed
const isEdit = computed(() => !!props.relay)

const controllerOptions = computed(() =>
  props.controllers.map(controller => ({
    label: controller.name,
    value: controller._id
  }))
)

const relayTypeOptions = [
  { label: '1-портово реле', value: '1-port' },
  { label: '2-портово реле', value: '2-port' },
  { label: '4-портово реле', value: '4-port' },
  { label: '6-портово реле', value: '6-port' },
  { label: '8-портово реле', value: '8-port' }
]

const activationTypeOptions = [
  { label: 'Active High (нормално)', value: 'active_high' },
  { label: 'Active Low (инвертирано)', value: 'active_low' }
]

// Methods
const getPortCount = () => {
  if (!formData.value.relayType) return 0
  const parts = formData.value.relayType.split('-')
  return parseInt(parts[0] || '0')
}

const generatePorts = (portCount: number) => {
  const ports = []
  for (let i = 1; i <= portCount; i++) {
    ports.push({
      portNumber: i,
      controlPin: '', // Empty - user must select from dropdown
      isOccupied: false,
      label: `Порт ${i}`
    })
  }
  return ports
}

// Handle controller change - reset port selections (copied from DeviceForm logic)
const onControllerChange = (controllerId: string) => {
  // Reset all port control pins when controller changes
  formData.value.ports.forEach(port => {
    port.controlPin = ''
  })
  
  console.log('[RelayForm] Controller changed, port pins reset')
}

const onRelayTypeChange = (newType: string) => {
  if (newType) {
    const portCount = getPortCount()
    
    // Preserve existing port data if possible
    const existingPorts = formData.value.ports || []
    const newPorts = generatePorts(portCount)
    
    // Merge existing data, but reset control pins to use available controller ports
    for (let i = 0; i < Math.min(existingPorts.length, newPorts.length); i++) {
      newPorts[i] = {
        ...newPorts[i],
        ...existingPorts[i],
        portNumber: i + 1, // Ensure correct port numbering
        controlPin: '' // Reset control pin to force re-selection from dropdown
      }
    }
    
    formData.value.ports = newPorts
  }
}

// Get port options for relay control pins (copied from DeviceForm)
const getPortOptionsForRelay = () => {
  const selectedController = props.controllers.find(c => c._id === formData.value.controllerId)
  if (!selectedController) return []
  
  // Debug: log what we're working with
  console.log(`[RelayForm] Looking for digital ports`)
  console.log('[RelayForm] Available ports:', selectedController.availablePorts)
  
  // Start with "Празен" option
  const options = [{
    label: 'Празен',
    value: '',
    portKey: 'Празен',
    portType: 'empty',
    currentState: '',
    stateColor: 'grey-5',
    description: 'Неконфигуриран порт',
    disable: false
  }]
  
  // Add available digital ports
  const digitalPorts = selectedController.availablePorts
    .filter((port: any) => port.type === 'digital')
    .map((port: any) => {
      const isDisabled = !port.isActive || port.isOccupied
      
      // Determine state color based on HIGH/LOW
      let stateColor = 'orange-6'
      if (port.currentState === 'HIGH') {
        stateColor = 'red-6'
      } else if (port.currentState === 'LOW') {
        stateColor = 'grey-7'
      }
      
      return {
        label: port.key,
        value: port.key,
        portKey: port.key,
        portType: port.type,
        currentState: port.currentState,
        stateColor: stateColor,
        description: port.label || port.description || '',
        disable: isDisabled
      }
    })
    
  return [...options, ...digitalPorts]
}

const clearPortPin = (port: any) => {
  port.controlPin = ''
}

const handleSave = async () => {
  saving.value = true
  
  try {
    // Validate required fields
    if (!formData.value.name || !formData.value.controllerId || !formData.value.relayType) {
      $q.notify({
        type: 'negative',
        message: 'Моля попълнете всички задължителни полета'
      })
      return
    }
    
    // Note: Control pins are no longer required - some ports may be unused
    
    // Validate for duplicate control pins
    const controlPins = formData.value.ports
      .map(port => port.controlPin)
      .filter(pin => pin && pin.trim() !== '') // Filter out empty pins
    
    const duplicates = controlPins.filter((pin, index) => controlPins.indexOf(pin) !== index)
    
    if (duplicates.length > 0) {
      $q.notify({
        type: 'negative',
        message: 'Грешка: Дублирани контролни пинове за портове',
        timeout: 3000
      })
      return
    }
    
    const relayData = { ...formData.value }
    
    console.log('[RelayForm] Saving relay data:', JSON.stringify(relayData, null, 2))
    
    emit('save', relayData)
  } catch (error) {
    console.error('[RelayForm] Error in handleSave:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване'
    })
  } finally {
    saving.value = false
  }
}

// Watch for relay changes (edit mode)
watch(() => props.relay, (newRelay) => {
  if (newRelay) {
    formData.value = {
      name: newRelay.name || '',
      controllerId: newRelay.controllerId || '',
      relayType: newRelay.relayType || '',
      manufacturer: newRelay.manufacturer || '',
      modelNumber: newRelay.modelNumber || '',
      description: newRelay.description || '',
      maxVoltage: newRelay.maxVoltage || 5,
      maxCurrent: newRelay.maxCurrent || 10,
      activationType: newRelay.activationType || 'active_high',
      ports: newRelay.ports || [],
      isActive: newRelay.isActive !== undefined ? newRelay.isActive : true
    }
  } else {
    // Reset form for new relay
    formData.value = {
      name: '',
      controllerId: '',
      relayType: '',
      manufacturer: '',
      modelNumber: '',
      description: '',
      maxVoltage: 5,
      maxCurrent: 10,
      activationType: 'active_high',
      ports: [],
      isActive: true
    }
  }
}, { immediate: true })

onMounted(() => {
  // Initialize form if needed
})
</script>