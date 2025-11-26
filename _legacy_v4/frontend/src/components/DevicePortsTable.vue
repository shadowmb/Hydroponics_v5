<template>
  <div class="device-ports-table">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="text-h6">Портове / Пинове</div>
      <q-space />
      
      <!-- Add Port Section -->
      <div class="row items-center q-gutter-sm">
        <q-select
          v-model="selectedPortToAdd"
          :options="availablePortOptions"
          :loading="loadingPorts"
          :disable="!controllerId || loadingPorts"
          label="Избери порт"
          outlined
          dense
          style="min-width: 150px"
          emit-value
          map-options
        />
        <q-btn
          icon="add"
          color="primary"
          round
          dense
          :disable="!selectedPortToAdd"
          @click="addPort"
        >
          <q-tooltip>Добави порт</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Ports Table -->
    <q-card flat bordered v-if="selectedPorts.length > 0">
      <q-card-section class="q-pa-none">
        <q-table
          :rows="portsTableData"
          :columns="columns"
          row-key="port"
          flat
          hide-header
          :pagination="{ rowsPerPage: 0 }"
          class="ports-table"
        >
          <template v-slot:body-cell-port="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.value }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.value)"
                :icon="getStatusIcon(props.value)"
                text-color="white"
                clickable
                @click="togglePortState(props.row.port)"
                class="status-chip"
              >
                {{ props.value }}
                <q-tooltip>Натисни за смяна на състоянието</q-tooltip>
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                icon="delete"
                color="negative"
                flat
                round
                dense
                @click="removePort(props.row.port)"
              >
                <q-tooltip>Премахни порт</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Empty State -->
    <q-card flat bordered v-else class="text-center q-pa-lg">
      <q-icon name="electrical_services" size="3rem" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">Няма избрани портове</div>
      <div class="text-body2 text-grey-5">Добавете порт от падащото меню по-горе</div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
// ABOUTME: DevicePortsTable component manages port selection and display for device configuration
// ABOUTME: Provides interface to add/remove ports and shows port status with toggle functionality
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '../services/api'

// TypeScript Interfaces
interface Port {
  key: string
  label: string
  type: string
  isActive: boolean
  isOccupied: boolean
  currentState?: string | null
}

// Props
interface Props {
  controllerId?: string
  modelValue: string[]  // Selected ports
  controllers: any[]
}

const props = withDefaults(defineProps<Props>(), {
  controllerId: '',
  modelValue: () => [],
  controllers: () => []
})

// Emits
const emit = defineEmits(['update:modelValue', 'portToggle'])

const $q = useQuasar()

// Data
const selectedPortToAdd = ref('')
const loadingPorts = ref(false)
const availablePorts = ref<Port[]>([])
const portStates = ref<Record<string, 'HIGH' | 'LOW'>>({})

// Computed
const selectedPorts = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const availablePortOptions = computed(() => {
  if (!availablePorts.value) return []
  
  return availablePorts.value
    .filter((port: Port) => !port.isOccupied && !selectedPorts.value.includes(port.key))
    .map((port: Port) => ({
      label: `${port.key} - ${port.label}`,
      value: port.key
    }))
})

const portsTableData = computed(() => {
  return selectedPorts.value.map(port => {
    const portInfo = availablePorts.value.find((p: Port) => p.key === port)
    const currentState = portStates.value[port] || portInfo?.currentState || 'HIGH'
    
    return {
      port,
      status: currentState,
      type: portInfo?.type || 'digital'
    }
  })
})

const columns = [
  {
    name: 'port',
    label: 'Порт',
    field: 'port',
    align: 'left' as const,
    style: 'width: 100px'
  },
  {
    name: 'status',
    label: 'Статус',
    field: 'status',
    align: 'left' as const,
    style: 'width: 120px'
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right' as const,
    style: 'width: 60px'
  }
]

// Methods
function getStatusColor(status: string): string {
  switch (status) {
    case 'HIGH': return 'orange'
    case 'LOW': return 'green'
    default: return 'grey'
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'HIGH': return 'toggle_off'
    case 'LOW': return 'toggle_on'  // LOW = relay ON (inverted logic)
    default: return 'help'
  }
}

async function loadAvailablePorts() {
  if (!props.controllerId) return

  loadingPorts.value = true
  try {
    const response = await api.getClient().get(`/controllers/${props.controllerId}`)
    availablePorts.value = response.data.availablePorts || []
    
    // Initialize port states from DB
    const states: Record<string, 'HIGH' | 'LOW'> = {}
    for (const port of availablePorts.value) {
      if (port.currentState) {
        states[port.key] = port.currentState as 'HIGH' | 'LOW'
      }
    }
    portStates.value = states
    
  } catch (error) {
    console.error('Error loading ports:', error)
    availablePorts.value = []
  } finally {
    loadingPorts.value = false
  }
}

function addPort() {
  if (!selectedPortToAdd.value) return
  
  const newPorts = [...selectedPorts.value, selectedPortToAdd.value]
  selectedPorts.value = newPorts
  selectedPortToAdd.value = ''
}

function removePort(port: string) {
  const newPorts = selectedPorts.value.filter(p => p !== port)
  selectedPorts.value = newPorts
  
  // Remove port state
  const newStates = { ...portStates.value }
  delete newStates[port]
  portStates.value = newStates
}

async function togglePortState(port: string) {
  if (!props.controllerId) return
  
  try {
    // Call the test device API to toggle the port
    const response = await api.getClient().post(`/controllers/${props.controllerId}/test-device`, {
      port,
      testType: 'relay'
    })
    
    if (response.data.success) {
      // Update local state
      const newState = response.data.data?.current_state
      if (newState) {
        portStates.value = {
          ...portStates.value,
          [port]: newState
        }
      }
      
      // Emit toggle event for parent components
      emit('portToggle', { port, newState })
      
      $q.notify({
        type: 'positive',
        message: `Порт ${port} променен на ${newState}`,
        timeout: 2000
      })
    } else {
      $q.notify({
        type: 'negative',
        message: response.data.message || 'Грешка при промяна на порта'
      })
    }
  } catch (error) {
    console.error('Port toggle error:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при комуникация с контролера'
    })
  }
}

// Watch for controller changes
watch(() => props.controllerId, async (newControllerId) => {
  if (newControllerId) {
    await loadAvailablePorts()
  } else {
    availablePorts.value = []
    portStates.value = {}
    selectedPorts.value = []
  }
})

// Load ports on mount if controller is already selected
onMounted(async () => {
  if (props.controllerId) {
    await loadAvailablePorts()
  }
})
</script>

<style scoped>
.device-ports-table {
  width: 100%;
}

.ports-table {
  border-radius: 8px;
}

.status-chip {
  font-weight: 500;
  transition: all 0.2s ease;
}

.status-chip:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

:deep(.q-table tbody td) {
  padding: 12px 16px;
}

:deep(.q-table tbody tr:hover) {
  background-color: rgba(0,0,0,0.03);
}
</style>