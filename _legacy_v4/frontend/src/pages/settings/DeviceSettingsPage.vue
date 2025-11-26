<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h4 class="q-ma-none text-weight-bold">Управление на устройства</h4>
          <p class="text-grey-6 q-mb-none">Управление на устройства и контролери</p>
        </div>
        <div class="row q-gutter-sm">
          <!-- Hardware Health Settings Button -->
          <q-btn
            color="positive"
            icon="health_and_safety"
            label="Health Settings"
            @click="showHealthSettingsDialog = true"
            outline
          />
          <!-- Manual Health Check Button -->
          <q-btn
            color="secondary"
            icon="refresh"
            label="Manual Check"
            @click="runManualHealthCheck"
            outline
          />
          <!-- Debug Commands Button -->
          <q-btn
            color="info"
            icon="bug_report"
            label="Debug Commands"
            @click="showDebugDialog = true"
            outline
          />
          <!-- Generate Firmware Button -->
          <q-btn
            color="deep-purple"
            icon="code"
            label="Генерирай Firmware"
            @click="showGeneratorDialog = true"
            outline
          />
          <template v-if="activeTab === 'devices'">
            <q-btn
              color="primary"
              icon="add"
              label="Добави устройство"
              @click="showDeviceDialog = true"
              data-test="add-device-btn"
            />
          </template>
          <template v-if="activeTab === 'relays'">
            <q-btn
              color="primary"
              icon="add"
              label="Добави реле"
              @click="showRelayDialog = true"
              data-test="add-relay-btn"
            />
          </template>
          <template v-if="activeTab === 'controllers'">
            <q-btn
              color="secondary"
              icon="router"
              label="Добави контролер"
              @click="showControllerDialog = true"
              data-test="add-controller-btn"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Tabs Structure -->
    <q-card>
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="devices" label="📱 Устройства" data-test="devices-tab" />
        <q-tab name="relays" label="⚡ Релета" data-test="relays-tab" />
        <q-tab name="controllers" label="🎛️ Контролери" data-test="controllers-tab" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <!-- Devices Tab -->
        <q-tab-panel name="devices">
          <!-- Device Filters -->
          <div class="row q-gutter-md q-mb-md">
            <q-select
              v-model="deviceFilters.type"
              :options="deviceTypeFilterOptions"
              label="Филтър по тип"
              clearable
              outlined
              dense
              style="min-width: 200px"
              emit-value
              map-options
            />
            <q-select
              v-model="deviceFilters.controllerId"
              :options="controllerFilterOptions"
              label="Филтър по контролер"
              clearable
              outlined
              dense
              style="min-width: 200px"
              emit-value
              map-options
            />
            <q-select
              v-model="deviceFilters.status"
              :options="statusFilterOptions"
              label="Филтър по статус"
              clearable
              outlined
              dense
              style="min-width: 180px"
              emit-value
              map-options
            />
            <q-btn
              flat
              icon="clear"
              label="Изчисти филтри"
              @click="clearDeviceFilters"
              color="grey"
            />
          </div>
          
          <q-table
          :rows="filteredDevices"
          :columns="deviceColumns"
          row-key="_id"
          :loading="devicesLoading"
          :rows-per-page-options="[10, 25, 50]"
          class="devices-table"
          :pagination="{ sortBy: 'name', descending: false, page: 1, rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div>
                <span class="text-weight-medium">{{ props.value }}</span>
                <div v-if="props.row.description" class="text-caption text-grey-6 q-mt-xs">
                  {{ truncateText(props.row.description, 50) }}
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-type="props">
            <q-td :props="props">
              <q-chip color="primary" text-color="white" size="sm">
                {{ getDeviceTypeLabel(props.row) }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-controller="props">
            <q-td :props="props">
              <div v-if="props.row.controllerId">
                <div class="text-weight-medium">{{ props.row.controllerId.name }}</div>
                <div class="text-caption text-grey-6">{{ props.row.controllerId.type }}</div>
              </div>
              <q-chip v-else color="grey" text-color="white" size="sm">Няма</q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-port="props">
            <q-td :props="props">
              <div class="row q-gutter-xs">
                <template v-for="chip in getDevicePortChips(props.row)" :key="chip.id">
                  <q-chip
                    :color="chip.color"
                    text-color="white"
                    size="sm"
                    :title="getDevicePortTooltip(props.row)"
                  >
                    {{ chip.text }}
                  </q-chip>
                </template>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-health="props">
            <q-td :props="props">
              <q-chip 
                :color="getHealthStatusColor(props.value)"
                text-color="white"
                size="sm"
                :title="getHealthStatusTooltip(props.value)"
              >
                {{ getHealthStatusLabel(props.value) }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-checking="props">
            <q-td :props="props" class="text-center">
              <span v-if="props.row.category === 'actuator'"
                style="color: #666; fontSize: 18px"
                title="Устройствата за управление (помпи, релета) не се проверяват"
              >
                🚫
              </span>
              <span v-else
                :style="{ color: props.value ? 'green' : 'orange', fontSize: '18px' }"
                :title="props.value ? 'Активна проверка' : 'Спряна проверка'"
              >
                {{ props.value ? '▶️' : '⏸️' }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip 
                :color="props.value ? 'green' : 'grey'"
                text-color="white"
                size="sm"
              >
                {{ props.value ? 'Активно' : 'Деактивирано' }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="primary"
                icon="edit"
                size="sm"
                @click="editDevice(props.row)"
              >
                <q-tooltip>Редактиране</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="purple"
                icon="tune"
                size="sm"
                :disable="!props.row.isActive"
                @click="openCalibrationDialog(props.row)"
              >
                <q-tooltip>
                  {{ props.row.isActive ? 'Калибриране' : 'Само активни устройства могат да бъдат калибрирани' }}
                </q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="confirmDeleteDevice(props.row)"
              >
                <q-tooltip>Изтриване</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
        </q-tab-panel>

        <!-- Relays Tab -->
        <q-tab-panel name="relays">
          <!-- Relay Filters -->
          <div class="row q-gutter-md q-mb-md">
            <q-select
              v-model="relayFilters.controllerId"
              :options="controllerFilterOptions"
              label="Филтър по контролер"
              clearable
              outlined
              dense
              style="min-width: 200px"
              emit-value
              map-options
            />
            <q-select
              v-model="relayFilters.relayType"
              :options="relayTypeFilterOptions"
              label="Филтър по тип реле"
              clearable
              outlined
              dense
              style="min-width: 180px"
              emit-value
              map-options
            />
            <q-select
              v-model="relayFilters.status"
              :options="statusFilterOptions"
              label="Филтър по статус"
              clearable
              outlined
              dense
              style="min-width: 180px"
              emit-value
              map-options
            />
            <q-btn
              flat
              icon="clear"
              label="Изчисти филтри"
              @click="clearRelayFilters"
              color="grey"
            />
          </div>
          
          <q-table
            :rows="filteredRelays"
            :columns="relayColumns"
            row-key="_id"
            :loading="relaysLoading"
            :rows-per-page-options="[10, 25, 50]"
            class="relays-table"
            :pagination="{ sortBy: 'name', descending: false, page: 1, rowsPerPage: 10 }"
          >
            <template v-slot:body-cell-name="props">
              <q-td :props="props">
                <div>
                  <span class="text-weight-medium">{{ props.value }}</span>
                  <div v-if="props.row.description" class="text-caption text-grey-6 q-mt-xs">
                    {{ truncateText(props.row.description, 50) }}
                  </div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-relayType="props">
              <q-td :props="props">
                <q-chip color="primary" text-color="white" size="sm">
                  {{ getRelayTypeLabel(props.value) }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-number="props">
              <q-td :props="props">
                <q-chip color="blue" text-color="white" size="sm">
                  Р{{ props.row.sequenceNumber }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-controller="props">
              <q-td :props="props">
                <div v-if="props.row.controllerId">
                  <div class="text-weight-medium">{{ getControllerName(props.row.controllerId) }}</div>
                  <div class="text-caption text-grey-6">ID: {{ props.row.controllerId }}</div>
                </div>
                <q-chip v-else color="grey" text-color="white" size="sm">Няма</q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-ports="props">
              <q-td :props="props">
                <div class="row q-gutter-xs">
                  <q-chip 
                    v-for="port in props.row.ports" 
                    :key="port.portNumber"
                    :color="getPortColor(port)"
                    text-color="white" 
                    size="sm"
                    :title="getPortTitle(port)"
                  >
                    {{ port.portNumber }}
                  </q-chip>
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  {{ getAvailablePortsCount(props.row) }} / {{ props.row.ports.length }} свободни
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip 
                  :color="props.value ? 'green' : 'grey'"
                  text-color="white"
                  size="sm"
                >
                  {{ props.value ? 'Активно' : 'Деактивирано' }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  color="primary"
                  icon="edit"
                  size="sm"
                  @click="editRelay(props.row)"
                >
                  <q-tooltip>Редактиране</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  size="sm"
                  @click="confirmDeleteRelay(props.row)"
                >
                  <q-tooltip>Изтриване</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Controllers Tab -->
        <q-tab-panel name="controllers">
          <!-- Controller Filters -->
          <div class="row q-gutter-md q-mb-md">
            <q-select
              v-model="controllerFilters.type"
              :options="controllerTypeFilterOptions"
              label="Филтър по тип"
              clearable
              outlined
              dense
              style="min-width: 200px"
              emit-value
              map-options
            />
            <q-select
              v-model="controllerFilters.status"
              :options="controllerStatusFilterOptions"
              label="Филтър по статус"
              clearable
              outlined
              dense
              style="min-width: 180px"
              emit-value
              map-options
            />
            <q-btn
              flat
              icon="clear"
              label="Изчисти филтри"
              @click="clearControllerFilters"
              color="grey"
            />
          </div>
          
          <q-table
            :rows="filteredControllers"
            :columns="controllerColumns"
            row-key="_id"
            :loading="controllersLoading"
            :rows-per-page-options="[10, 25, 50]"
            class="controllers-table"
            :pagination="{ sortBy: 'name', descending: false, page: 1, rowsPerPage: 10 }"
          >
            <template v-slot:body-cell-name="props">
              <q-td :props="props">
                <div>
                  <span class="text-weight-medium">{{ props.value }}</span>
                  <div v-if="props.row.description" class="text-caption text-grey-6 q-mt-xs">
                    {{ truncateText(props.row.description, 50) }}
                  </div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-type="props">
              <q-td :props="props">
                <q-chip color="secondary" text-color="white" size="sm">
                  {{ props.value }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-connection="props">
              <q-td :props="props">
                <div>
                  <div class="text-weight-medium">{{ props.row.connectionType }}</div>
                  <div class="text-caption text-grey-6">{{ props.row.address }}</div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-health="props">
              <q-td :props="props">
                <q-chip 
                  :color="getHealthStatusColor(props.row.healthStatus)"
                  text-color="white"
                  size="sm"
                  :title="getHealthStatusTooltip(props.row.healthStatus)"
                >
                  {{ getHealthStatusLabel(props.row.healthStatus) }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip 
                  :color="getControllerStatusColor(props.value)"
                  text-color="white"
                  size="sm"
                >
                  {{ getControllerStatusLabel(props.value) }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-heartbeat="props">
              <q-td :props="props">
                <div v-if="props.row.lastHeartbeat" class="text-caption">
                  {{ formatDate(props.row.lastHeartbeat) }}
                </div>
                <div v-else class="text-grey-6 text-caption">Няма данни</div>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  color="primary"
                  icon="edit"
                  size="sm"
                  @click="editController(props.row)"
                >
                  <q-tooltip>Редактиране</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  size="sm"
                  @click="confirmDeleteController(props.row)"
                >
                  <q-tooltip>Изтриване</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

      </q-tab-panels>
    </q-card>

    <!-- Device Form Dialog -->
    <q-dialog v-model="showDeviceDialog" persistent>
      <DeviceForm
        :device="selectedDevice"
        :controllers="controllers"
        :device-types="deviceTypes"
        @save="handleDeviceSave"
        @cancel="closeDeviceDialog"
      />
    </q-dialog>

    <!-- Calibration Dialog -->
    <CalibrationDialog
      v-model="showCalibrationDialog"
      :device="selectedDeviceForCalibration"
      @calibration-updated="handleCalibrationUpdate"
      @settings-updated="handleSettingsUpdate"
    />

    <!-- Controller Form Dialog -->
    <q-dialog v-model="showControllerDialog" persistent>
      <ControllerForm
        :controller="selectedController"
        :connection-types="[]"
        @save="handleControllerSave"
        @cancel="closeControllerDialog"
      />
    </q-dialog>

    <!-- Relay Form Dialog -->
    <q-dialog v-model="showRelayDialog" persistent>
      <RelayForm
        :relay="selectedRelay"
        :controllers="controllers"
        @save="handleRelaySave"
        @cancel="closeRelayDialog"
      />
    </q-dialog>

    <!-- Arduino Generator Dialog -->
    <q-dialog v-model="showGeneratorDialog" persistent>
      <ArduinoGeneratorDialog
        @close="showGeneratorDialog = false"
        @generated="handleFirmwareGenerated"
      />
    </q-dialog>

    <!-- Debug Commands Dialog -->
    <q-dialog v-model="showDebugDialog" persistent>
      <DebugCommandsDialog
        @close="showDebugDialog = false"
      />
    </q-dialog>

    <!-- Health Settings Dialog -->
    <q-dialog v-model="showHealthSettingsDialog" persistent>
      <q-card style="min-width: 700px; max-width: 900px">
        <q-card-section>
          <div class="text-h6">Hardware Health & Network Settings</div>
          <div class="text-subtitle2 text-grey-6">Настройки за мониториране и мрежова комуникация</div>
        </q-card-section>

        <q-separator />

        <!-- Tabs for Health and Network Settings -->
        <q-tabs
          v-model="healthDialogTab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="health" label="🩺 Health Monitoring" />
          <q-tab name="network" label="🌐 Network Discovery" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="healthDialogTab" animated style="max-height: 500px; overflow-y: auto;">
                  <!-- Health Settings Panel -->
        <q-tab-panel name="health">
          <q-card-section>
            <div class="q-gutter-md">
              <!-- Enable/Disable Health Monitoring -->
              <q-toggle
                v-model="healthSettings.enabled"
                label="Активирай health monitoring"
                color="primary"
                :disable="healthSettingsLoading"
                @update:model-value="updateEnabled"
              />

              <!-- Check Controllers Toggle -->
              <q-toggle
                v-model="healthSettings.checkControllers"
                label="Проверка на контролери"
                color="primary"
                :disable="healthSettingsLoading"
                @update:model-value="updateCheckControllers"
              />

              <!-- Check Sensors Toggle -->
              <q-toggle
                v-model="healthSettings.checkSensors"
                label="Проверка на сензори/устройства"
                color="primary"
                :disable="healthSettingsLoading"
                @update:model-value="updateCheckSensors"
              />

              <!-- Check Interval -->
              <div class="row items-center q-gutter-md">
                <q-input
                  v-model.number="healthSettings.checkInterval"
                  type="number"
                  label="Интервал за проверки (минути)"
                  style="min-width: 200px"
                  :min="1"
                  :max="60"
                  :disable="!healthSettings.enabled || healthSettingsLoading"
                  outlined
                  dense
                  @update:model-value="updateCheckInterval"
                />
                <div class="text-caption text-grey-6">
                  По подразбиране: 5 минути
                </div>
              </div>

            
              <!-- Failure Threshold -->
              <div class="row items-center q-gutter-md">
                <q-input
                  v-model.number="healthSettings.failureThreshold"
                  type="number"
                  label="Брой неуспешни опити преди алармa"
                  style="min-width: 200px"
                  :min="1"
                  :max="10"
                  :disable="!healthSettings.enabled || healthSettingsLoading"
                  outlined
                  dense
                  @update:model-value="updateFailureThreshold"
                />
                <div class="text-caption text-grey-6">
                  По подразбиране: 3 опита
                </div>
              </div>

              <!-- Timeout - COMMENTED OUT: Legacy field not actively used -->
              <!-- 
              <div class="row items-center q-gutter-md">
                <q-input
                  v-model.number="healthSettings.timeoutMs"
                  type="number"
                  label="Timeout за проверка (милисекунди)"
                  style="min-width: 200px"
                  :min="1000"
                  :max="30000"
                  :step="1000"
                  :disable="!healthSettings.enabled || healthSettingsLoading"
                  outlined
                  dense
                  @update:model-value="() => {}"
                />
                <div class="text-caption text-grey-6">
                  По подразбиране: 5000ms (5 сек)
                </div>
              </div>
              -->
            
              <q-separator class="q-my-md" />
            
              <!-- Info Section -->
              <div class="bg-blue-1 q-pa-md rounded-borders">
                <div class="text-subtitle2 text-primary q-mb-xs">
                  <q-icon name="info" class="q-mr-xs" />
                  Как работи health monitoring:
                </div>
                <div class="text-body2 text-grey-8">
                  • Периодични ping заявки към всички контролери<br/>
                  • Предварителна проверка преди стартиране на flow<br/>
                  • Автоматично блокиране на критични устройства при грешки<br/>
                  • Real-time статус updates в UI
                </div>
              </div>
            </div> <!-- затваря q-gutter-md -->
          </q-card-section> <!-- ✅ това липсваше -->
        </q-tab-panel>
        
        <!-- Network Discovery Settings Panel -->
        <q-tab-panel name="network">
          <NetworkDiscoverySettings :inline="true" />
        </q-tab-panel>

      </q-tab-panels>
      
        <q-separator />

        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn 
            label="Затвори" 
            color="primary" 
            @click="showHealthSettingsDialog = false"
            icon="close"
          />
          <div class="text-caption text-grey-6">
            Настройките се записват автоматично
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
    
  </q-page>
  
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { api, deviceApi, controllerApi } from '../../services/api'
import { useQuasar } from 'quasar'
import DeviceForm from 'src/components/DeviceForm.vue'
import ControllerForm from 'src/components/ControllerForm.vue'
import RelayForm from 'src/components/RelayForm.vue'
import CalibrationDialog from 'src/components/CalibrationDialog.vue'
import NetworkDiscoverySettings from 'src/components/NetworkDiscoverySettings.vue'
import ArduinoGeneratorDialog from 'src/components/ArduinoGeneratorDialog.vue'
import DebugCommandsDialog from 'src/components/DebugCommandsDialog.vue'
import { useTutorialStore } from 'src/stores/tutorial'

const $q = useQuasar()
const tutorialStore = useTutorialStore()

// Data
const devices = ref([])
const deviceTypes = ref([])
const deviceTemplates = ref([])
const relays = ref([])
const controllers = ref([])
const healthStatus = ref({
  isHealthy: true,
  lastCheck: null,
  issues: [],
  deviceCount: 0,
  healthyDeviceCount: 0
})

// Loading states
const devicesLoading = ref(false)
const controllersLoading = ref(false)
const relaysLoading = ref(false)

// Dialog states
const showDeviceDialog = ref(false)
const showControllerDialog = ref(false)
const showRelayDialog = ref(false)
const showCalibrationDialog = ref(false)
const showHealthSettingsDialog = ref(false)
const showGeneratorDialog = ref(false)
const showDebugDialog = ref(false)
const healthDialogTab = ref('health') // Tab within health dialog
const activeTab = ref('devices')

// Health settings data
const healthSettings = ref({
  enabled: true,
  checkControllers: true,
  checkSensors: false,
  checkInterval: 5, // minutes
  failureThreshold: 3,
  timeoutMs: 5000
})
const healthSettingsLoading = ref(false)

// Selected items
const selectedDevice = ref(null)
const selectedController = ref(null)
const selectedRelay = ref(null)
const selectedDeviceForCalibration = ref(null)

// Filters
const deviceFilters = ref({
  type: null,
  controllerId: null,
  status: null
})

const controllerFilters = ref({
  type: null,
  status: null
})

const relayFilters = ref({
  controllerId: null,
  relayType: null,
  status: null
})

// Table columns
const deviceColumns = [
  { name: 'name', label: 'Име на устройството', field: 'name', align: 'left', sortable: true },
  { name: 'type', label: 'Тип', field: 'type', align: 'center', sortable: true },
  { name: 'controller', label: 'Контролер', field: 'controllerId', align: 'left', sortable: true, sort: (a, b) => (a?.name || '').localeCompare(b?.name || '') },
  { name: 'port', label: 'Порт', field: 'port', align: 'center', sortable: true },
  { name: 'health', label: 'Здраве', field: 'healthStatus', align: 'center', sortable: true },
  { name: 'checking', label: 'Проверка', field: 'checkingEnabled', align: 'center', sortable: true },
  { name: 'status', label: 'Статус', field: 'isActive', align: 'center', sortable: true },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'center' }
]

const controllerColumns = [
  { name: 'name', label: 'Име на контролера', field: 'name', align: 'left', sortable: true },
  { name: 'type', label: 'Тип', field: 'type', align: 'center', sortable: true },
  { name: 'connection', label: 'Връзка', field: 'connectionType', align: 'left', sortable: true },
  { name: 'health', label: 'Здраве', field: 'healthStatus', align: 'center', sortable: true },
  { name: 'status', label: 'Статус', field: 'status', align: 'center', sortable: true },
  { name: 'heartbeat', label: 'Последна връзка', field: 'lastHeartbeat', align: 'center', sortable: true },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'center' }
]

const relayColumns = [
  { name: 'number', label: 'Номер', field: 'sequenceNumber', align: 'center', sortable: true },
  { name: 'name', label: 'Име на релето', field: 'name', align: 'left', sortable: true },
  { name: 'relayType', label: 'Тип', field: 'relayType', align: 'center', sortable: true },
  { name: 'controller', label: 'Контролер', field: 'controllerId', align: 'left', sortable: true },
  { name: 'ports', label: 'Портове', field: 'ports', align: 'center' },
  { name: 'status', label: 'Статус', field: 'isActive', align: 'center', sortable: true },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'center' }
]

// Methods
async function loadDevices() {
  devicesLoading.value = true
  try {
    const response = await deviceApi.getAll()
    devices.value = response

    // Load device templates for category mapping
    await loadDeviceTemplates()

    // Load health status for devices
    await loadDevicesHealthStatus()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на устройствата'
    })
  } finally {
    devicesLoading.value = false
  }
}

async function loadDeviceTemplates() {
  try {
    const response = await api.getClient().get('/device-templates')
    deviceTemplates.value = response.data.data || []
  } catch (error) {
    console.error('Error loading device templates:', error)
  }
}

// Load health status for individual devices
async function loadDevicesHealthStatus() {
  try {
    const deviceHealthPromises = devices.value.map(async (device) => {
      try {
        const healthResponse = await api.getClient().get(`/devices/${device._id}/health`)
        device.healthStatus = healthResponse.data.data?.deviceHealthStatus || 'unknown'
        device.lastHealthCheck = healthResponse.data.data?.deviceLastHealthCheck
        return device
      } catch (error) {
        console.error(`Error loading health for device ${device._id}:`, error)
        device.healthStatus = 'unknown'
        return device
      }
    })
    
    await Promise.allSettled(deviceHealthPromises)
  } catch (error) {
    console.error('Error loading devices health status:', error)
  }
}

// Load health status for a single device
async function loadSingleDeviceHealth(device) {
  try {
    const healthResponse = await api.getClient().get(`/devices/${device._id}/health`)
    device.healthStatus = healthResponse.data.data?.deviceHealthStatus || 'unknown'
    device.lastHealthCheck = healthResponse.data.data?.deviceLastHealthCheck
    return device
  } catch (error) {
    console.error(`Error loading health for device ${device._id}:`, error)
    device.healthStatus = 'unknown'
    return device
  }
}

async function loadControllers() {
  controllersLoading.value = true
  try {
    const response = await controllerApi.getAll()
    controllers.value = response

    // Load health status for controllers
    await loadControllersHealthStatus()
  } catch (error) {
    console.error('Error loading controllers:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на контролерите'
    })
  } finally {
    controllersLoading.value = false
  }
}

// Load health status for controllers
async function loadControllersHealthStatus() {
  try {
    controllers.value.forEach(controller => {
      // Set healthStatus based on existing status if not already set
      if (!controller.healthStatus) {
        switch (controller.status) {
          case 'online':
            controller.healthStatus = 'healthy'
            break
          case 'offline':
          case 'error':
            controller.healthStatus = 'unhealthy'
            break
          case 'maintenance':
            controller.healthStatus = 'warning'
            break
          default:
            controller.healthStatus = 'unknown'
        }
      }
    })
  } catch (error) {
    console.error('Error loading controllers health status:', error)
  }
}

async function loadSettings() {
  try {
    const deviceTypesRes = await api.getClient().get('/settings/device-types')
    deviceTypes.value = deviceTypesRes.data
  } catch (error) {
    console.error('Error loading device types:', error)
  }
}

async function loadRelays() {
  relaysLoading.value = true
  try {
    const response = await api.getClient().get('/relays')
    relays.value = response.data.data || []
  } catch (error) {
    console.error('Error loading relays:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на релетата'
    })
  } finally {
    relaysLoading.value = false
  }
}

function getDeviceTypeLabel(device: any) {
  // Try to get category from device template
  const template = deviceTemplates.value.find(t => t.type === device.type)
  if (template && template.uiConfig?.category) {
    return template.uiConfig.category
  }
  // Fallback to physicalType if no template found
  return device.physicalType || device.type
}

function editController(controller) {
  selectedController.value = { ...controller }
  showControllerDialog.value = true
}

function confirmDeleteController(controller) {
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете контролера "${controller.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deleteController(controller._id)
  })
}

async function deleteController(controllerId: string) {
  try {
    await api.getClient().delete(`/controllers/${controllerId}`)
    $q.notify({
      type: 'positive',
      message: 'Контролерът е изтрит успешно'
    })
    await loadControllers()
    await loadDevices() // Reload devices since controller might be referenced
  } catch (error: any) {
    console.error('Delete controller error:', error.response?.data)
    
    const errorMessage = error.response?.data?.error || 'Грешка при изтриване на контролера'
    const connectedDevices = error.response?.data?.connectedDevices || 0
    
    $q.notify({
      type: 'negative', 
      message: errorMessage,
      timeout: 6000, // Longer timeout for detailed message
      multiLine: true,
      position: 'top'
    })
    
    // Optional: Show dialog with device list for better UX
    if (connectedDevices > 0) {
      $q.dialog({
        title: 'Не може да се изтрие контролера',
        message: errorMessage,
        ok: {
          label: 'Разбрах',
          color: 'primary'
        }
      })
    }
  }
}

function getControllerStatusColor(status: string) {
  switch (status) {
    case 'online': return 'green'
    case 'offline': return 'grey'
    case 'error': return 'red'
    case 'maintenance': return 'orange'
    default: return 'grey'
  }
}

function getControllerStatusLabel(status: string) {
  switch (status) {
    case 'online': return 'Online'
    case 'offline': return 'Offline'
    case 'error': return 'Грешка'
    case 'maintenance': return 'Поддръжка'
    default: return status
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('bg-BG')
}

function getHealthStatusColor(status: string) {
  switch (status) {
    case 'healthy': return 'green'
    case 'unhealthy': 
    case 'error': return 'red' 
    case 'warning': return 'orange'
    case 'unknown':
    default: return 'grey'
  }
}

function getHealthStatusLabel(status: string) {
  switch (status) {
    case 'healthy': return '🟢 Здрав'
    case 'unhealthy': 
    case 'error': return '🔴 Болен'
    case 'warning': return '🟡 Внимание'
    case 'unknown':
    default: return '⚪ Неизвестно'
  }
}

function getHealthStatusTooltip(status: string) {
  switch (status) {
    case 'healthy': return 'Устройството работи нормално'
    case 'unhealthy': return 'Устройството има проблеми с връзката'
    case 'error': return 'Устройството има проблеми със сензорните данни'
    case 'warning': return 'Устройството има предупреждения'
    case 'unknown':
    default: return 'Състоянието на устройството е неизвестно'
  }
}


function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getRelayTypeLabel(relayType: string) {
  const typeMap = {
    '1-port': '1-портово реле',
    '2-port': '2-портово реле',
    '4-port': '4-портово реле',
    '6-port': '6-портово реле',
    '8-port': '8-портово реле'
  }
  return typeMap[relayType] || relayType
}

function getControllerName(controllerId: string) {
  const controller = controllers.value.find(c => c._id === controllerId)
  return controller ? controller.name : 'Неизвестен контролер'
}

function getAvailablePortsCount(relay: any) {
  return relay.ports.filter(port => !port.isOccupied).length
}

function getPortColor(port: any) {
  // Check if port is unconfigured (no controlPin)
  if (!port.controlPin || port.controlPin.trim() === '') {
    return 'grey'
  }
  // Check if port is occupied
  return port.isOccupied ? 'red' : 'green'
}

function getPortTitle(port: any) {
  // Check if port is unconfigured (no controlPin)
  if (!port.controlPin || port.controlPin.trim() === '') {
    return 'Неконфигуриран порт'
  }
  // Check if port is occupied
  return port.isOccupied ? `Заето от устройство ${port.occupiedBy}` : 'Свободен порт'
}

function getDevicePortChips(device: any) {
  const chips = []
  
  if (device.connectionMethod === 'relay') {
    // Find relay by ID
    const relay = relays.value.find(r => r._id === device.relayId)
    if (relay) {
      // Add relay chip [Р1]
      chips.push({
        id: 'relay',
        text: `Р${relay.sequenceNumber}`,
        color: 'blue'
      })
      
      if (device.relayPort !== null && device.relayPort !== undefined) {
        // Find the relay port to get controlPin
        const relayPort = relay.ports.find(p => p.portNumber === device.relayPort)
        
        // Add arrow
        chips.push({
          id: 'arrow1',
          text: '→',
          color: 'grey'
        })
        
        // Add relay port chip [2]
        chips.push({
          id: 'relay-port',
          text: device.relayPort.toString(),
          color: 'orange'
        })
        
        // Add arrow
        chips.push({
          id: 'arrow2',
          text: '→',
          color: 'grey'
        })
        
        // Add controller port chip [D5]
        chips.push({
          id: 'controller-port',
          text: relayPort?.controlPin || 'N/A',
          color: 'green'
        })
      } else {
        // No relay port configured - show "Празен"
        chips.push({
          id: 'empty-port',
          text: 'Празен',
          color: 'grey'
        })
      }
    }
  } else {
    // Direct connection - show controller ports
    if (device.ports && device.ports.length > 0) {
      device.ports.forEach((port, index) => {
        chips.push({
          id: `port-${index}`,
          text: port,
          color: 'green'
        })
      })
    } else {
      chips.push({
        id: 'no-ports',
        text: 'N/A',
        color: 'grey'
      })
    }
  }
  
  return chips
}

function getDevicePortTooltip(device: any) {
  if (device.connectionMethod === 'relay') {
    const relay = relays.value.find(r => r._id === device.relayId)
    if (device.relayPort !== null && device.relayPort !== undefined) {
      const relayPort = relay?.ports.find(p => p.portNumber === device.relayPort)
      return `Чрез реле '${relay?.name || 'Неизвестно'}' (Р${relay?.sequenceNumber}), порт ${device.relayPort}, към контролер порт ${relayPort?.controlPin || 'N/A'}`
    } else {
      return `Чрез реле '${relay?.name || 'Неизвестно'}' (Р${relay?.sequenceNumber}) - порт не е конфигуриран`
    }
  } else {
    const portsList = device.ports?.join(', ') || 'няма'
    return `Директно към контролер - портове ${portsList}`
  }
}

// Computed - Filtered data
const filteredDevices = computed(() => {
  let filtered = [...devices.value]

  if (deviceFilters.value.type) {
    filtered = filtered.filter(device => {
      // Get device category from template
      const template = deviceTemplates.value.find(t => t.type === device.type)
      const deviceCategory = template?.uiConfig?.category || device.physicalType || device.type
      return deviceCategory === deviceFilters.value.type
    })
  }

  if (deviceFilters.value.controllerId) {
    filtered = filtered.filter(device =>
      device.controllerId?._id === deviceFilters.value.controllerId ||
      device.controllerId === deviceFilters.value.controllerId
    )
  }

  if (deviceFilters.value.status !== null) {
    filtered = filtered.filter(device => device.isActive === deviceFilters.value.status)
  }

  return filtered
})

const filteredControllers = computed(() => {
  let filtered = [...controllers.value]
  
  if (controllerFilters.value.type) {
    filtered = filtered.filter(controller => controller.type === controllerFilters.value.type)
  }
  
  if (controllerFilters.value.status) {
    filtered = filtered.filter(controller => controller.status === controllerFilters.value.status)
  }
  
  return filtered
})

// Filter Options
const deviceTypeFilterOptions = computed(() => {
  // Get unique categories from device templates
  const uniqueCategories = [...new Set(deviceTemplates.value.map(t => t.uiConfig?.category || t.physicalType))].filter(Boolean)
  return uniqueCategories.map(category => ({
    label: category,
    value: category
  }))
})

const controllerFilterOptions = computed(() => {
  return controllers.value.map(controller => ({
    label: controller.name,
    value: controller._id
  }))
})

const statusFilterOptions = [
  { label: 'Активно', value: true },
  { label: 'Деактивирано', value: false }
]

const controllerTypeFilterOptions = computed(() => {
  const uniqueTypes = [...new Set(controllers.value.map(c => c.type))].filter(Boolean)
  return uniqueTypes.map(type => ({ label: type, value: type }))
})

const controllerStatusFilterOptions = [
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Грешка', value: 'error' },
  { label: 'Поддръжка', value: 'maintenance' }
]

const filteredRelays = computed(() => {
  let filtered = [...relays.value]
  
  if (relayFilters.value.controllerId) {
    filtered = filtered.filter(relay => relay.controllerId === relayFilters.value.controllerId)
  }
  
  if (relayFilters.value.relayType) {
    filtered = filtered.filter(relay => relay.relayType === relayFilters.value.relayType)
  }
  
  if (relayFilters.value.status !== null) {
    filtered = filtered.filter(relay => relay.isActive === relayFilters.value.status)
  }
  
  return filtered
})

const relayTypeFilterOptions = [
  { label: '1-портово реле', value: '1-port' },
  { label: '2-портово реле', value: '2-port' },
  { label: '4-портово реле', value: '4-port' },
  { label: '6-портово реле', value: '6-port' },
  { label: '8-портово реле', value: '8-port' }
]

// Filter Methods
function clearDeviceFilters() {
  deviceFilters.value = {
    type: null,
    controllerId: null,
    status: null
  }
}

function clearControllerFilters() {
  controllerFilters.value = {
    type: null,
    status: null
  }
}

function clearRelayFilters() {
  relayFilters.value = {
    controllerId: null,
    relayType: null,
    status: null
  }
}

function editDevice(device) {
  selectedDevice.value = { ...device }
  showDeviceDialog.value = true
}

function openCalibrationDialog(device) {
  if (!device.isActive) {
    $q.notify({
      type: 'warning',
      message: 'Само активни устройства могат да бъдат калибрирани',
      position: 'top-right'
    })
    return
  }
  
  selectedDeviceForCalibration.value = { ...device }
  showCalibrationDialog.value = true
}

function confirmDeleteDevice(device) {
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете устройството "${device.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deleteDevice(device._id)
  })
}

async function deleteDevice(deviceId: string) {
  try {
    await api.delete(`/devices/${deviceId}`)
    $q.notify({
      type: 'positive',
      message: 'Устройството е изтрито успешно'
    })
    await loadDevices()
    await loadControllers() // Refresh controllers to update available/occupied ports
    await loadRelays() // Refresh relays to update port occupation status
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при изтриване на устройството'
    })
  }
}

async function handleDeviceSave(deviceData) {
  try {
    let savedDevice = null
    const isNewDevice = !selectedDevice.value || !selectedDevice.value._id
    
    if (selectedDevice.value && selectedDevice.value._id) {
      // Update existing device - save device data AND calibration data
      console.log('[DeviceSettingsPage] Updating device with all data:', deviceData)
      
      // First update the basic device data
      savedDevice = await api.put(`/devices/${selectedDevice.value._id}`, deviceData)
      console.log('Updated device:', savedDevice)
      
      $q.notify({
        type: 'positive',
        message: 'Устройството е обновено успешно'
      })
    } else {
      // Create new device using raw API call
      const rawResponse = await api.getClient().post('/devices', deviceData)
      console.log('Device created successfully:', rawResponse.data)
      savedDevice = rawResponse.data  // Use the device data from successful response
      $q.notify({
        type: 'positive',
        message: 'Устройството е създадено успешно'
      })
    }
    
    // Store reference before closing dialog (which nulls selectedDevice)
    const deviceToUpdate = selectedDevice.value
    
    closeDeviceDialog()
    
    // Efficient update: only update the specific device instead of loading all devices
    if (deviceToUpdate && deviceToUpdate._id) {
      // Update existing device - find and update in the devices array
      console.log('[DeviceSettingsPage] Updating existing device:', deviceToUpdate._id)
      const deviceIndex = devices.value.findIndex(d => d._id === deviceToUpdate._id)
      if (deviceIndex !== -1) {
        // Get updated device data
        const updatedDevice = await api.getClient().get(`/devices/${deviceToUpdate._id}`)
        devices.value[deviceIndex] = updatedDevice.data
        
        // Load health status only for this device
        console.log('[DeviceSettingsPage] Loading health for existing device:', devices.value[deviceIndex]._id)
        await loadSingleDeviceHealth(devices.value[deviceIndex])
      }
    } else if (savedDevice) {
      // New device - add to the devices array
      console.log('[DeviceSettingsPage] Adding new device:', savedDevice)
      devices.value.unshift(savedDevice) // Add to beginning of array
      
      // Load health status only for this new device
      console.log('[DeviceSettingsPage] Loading health for new device:', savedDevice._id)
      await loadSingleDeviceHealth(savedDevice)
    } else {
      console.log('[DeviceSettingsPage] No device to update - falling back to full reload')
      await loadDevices()
    }
    
    await loadControllers() // Refresh controllers to update available/occupied ports
    await loadRelays() // Refresh relays to update port occupation status
    
    // Check if device has calibration config and show dialog for new devices
    if (isNewDevice && savedDevice && needsCalibration(deviceData.type)) {
      console.log('Showing calibration dialog for device:', savedDevice.name)
      showCalibrationConfirmDialog(savedDevice)
    }
    
  } catch (error) {
    console.error('Error saving device:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване на устройството'
    })
  }
}

// Check if device type needs calibration
function needsCalibration(deviceType) {
  // Device types that have calibration config
  const calibratableTypes = ['dfrobot_ph_sensor', 'dfrobot_ec_sensor', 'capacitive_soil_moisture']
  return calibratableTypes.includes(deviceType)
}

// Show calibration confirmation dialog
function showCalibrationConfirmDialog(savedDevice) {
  $q.dialog({
    title: 'Калибрация на сензора',
    message: `Устройството "${savedDevice.name}" е създадено успешно. Искате ли да го калибрирате сега?`,
    cancel: {
      label: 'По-късно',
      color: 'grey',
      flat: true
    },
    ok: {
      label: 'Калибрирай сега',
      color: 'primary'
    },
    persistent: false
  }).onOk(() => {
    // Open device for editing to show calibration section
    openDeviceForCalibration(savedDevice)
  })
}

// Open device in calibration mode instead of settings
function openDeviceForCalibration(device) {
  selectedDeviceForCalibration.value = device
  showCalibrationDialog.value = true
}

async function handleControllerSave(controllerData) {
  try {
    // If tutorial is active, skip actual save to database and complete tutorial
    if (tutorialStore.isActive) {
      console.log('[Tutorial Mode] Skipping controller save to database')
      $q.notify({
        type: 'info',
        message: 'Туториал режим: Записът е симулиран (не се записва реално в базата данни)',
        timeout: 2000
      })
      closeControllerDialog()

      // Complete tutorial automatically when save is clicked
      console.log('[Tutorial Mode] Auto-completing tutorial after save click')
      await tutorialStore.completeTutorial()

      return
    }

    if (selectedController.value && selectedController.value._id) {
      await api.put(`/controllers/${selectedController.value._id}`, controllerData)
      $q.notify({
        type: 'positive',
        message: 'Контролерът е обновен успешно'
      })
    } else {
      await api.post('/controllers', controllerData)
      $q.notify({
        type: 'positive',
        message: 'Контролерът е създаден успешно'
      })
    }
    closeControllerDialog()
    await loadControllers()
    await loadDevices() // Reload devices to get updated controller info
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване на контролера'
    })
  }
}

function editRelay(relay) {
  selectedRelay.value = { ...relay }
  showRelayDialog.value = true
}

function confirmDeleteRelay(relay) {
  const occupiedPorts = relay.ports.filter(port => port.isOccupied)
  
  if (occupiedPorts.length > 0) {
    $q.dialog({
      title: 'Не може да се изтрие релето',
      message: `Релето "${relay.name}" има ${occupiedPorts.length} заети порта. Моля първо отделете свързаните устройства.`,
      ok: {
        label: 'Разбрах',
        color: 'primary'
      }
    })
    return
  }

  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете релето "${relay.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deleteRelay(relay._id)
  })
}

async function deleteRelay(relayId: string) {
  try {
    await api.getClient().delete(`/relays/${relayId}`)
    $q.notify({
      type: 'positive',
      message: 'Релето е изтрито успешно'
    })
    await loadRelays()
  } catch (error: any) {
    console.error('Delete relay error:', error.response?.data)
    
    const errorMessage = error.response?.data?.message || 'Грешка при изтриване на релето'
    const occupiedPorts = error.response?.data?.occupiedPorts || []
    
    $q.notify({
      type: 'negative', 
      message: errorMessage,
      timeout: 6000,
      multiLine: true,
      position: 'top'
    })
    
    if (occupiedPorts.length > 0) {
      $q.dialog({
        title: 'Не може да се изтрие релето',
        message: errorMessage,
        ok: {
          label: 'Разбрах',
          color: 'primary'
        }
      })
    }
  }
}

async function handleRelaySave(relayData) {
  try {
    if (selectedRelay.value && selectedRelay.value._id) {
      // Update existing relay
      await api.getClient().put(`/relays/${selectedRelay.value._id}`, relayData)
      $q.notify({
        type: 'positive',
        message: 'Релето е обновено успешно'
      })
    } else {
      // Create new relay
      await api.getClient().post('/relays', relayData)
      $q.notify({
        type: 'positive',
        message: 'Релето е създадено успешно'
      })
    }
    
    closeRelayDialog()
    await loadRelays()
    await loadControllers() // Refresh controllers to update available/occupied ports
  } catch (error) {
    console.error('Error saving relay:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване на релето'
    })
  }
}


function closeDeviceDialog() {
  showDeviceDialog.value = false
  selectedDevice.value = null
}

function closeControllerDialog() {
  showControllerDialog.value = false
  selectedController.value = null
}

function closeRelayDialog() {
  showRelayDialog.value = false
  selectedRelay.value = null
}

// Health Settings Functions
async function saveHealthSettings() {
  healthSettingsLoading.value = true
  try {
    // Real API call to save health settings
    const configData = {
      enabled: healthSettings.value.enabled,
      checkControllers: healthSettings.value.checkControllers,
      checkSensors: healthSettings.value.checkSensors,
      checkIntervalMinutes: healthSettings.value.checkInterval,
      failureThreshold: healthSettings.value.failureThreshold,
      timeoutMs: healthSettings.value.timeoutMs
    }
    
    await api.getClient().put('/devices/health/configure', configData)
    
    $q.notify({
      type: 'positive',
      message: 'Health settings запазени успешно'
    })
    
    showHealthSettingsDialog.value = false
  } catch (error) {
    console.error('Error saving health settings:', error)
    $q.notify({
      type: 'negative', 
      message: 'Грешка при запазване на health settings'
    })
  } finally {
    healthSettingsLoading.value = false
  }
}

// Auto-save function for Health Settings
// Individual field update functions for partial updates
async function updateEnabled() {
  if (healthSettingsLoading.value) return
  try {
    await api.getClient().put('/devices/health/configure/enabled', {
      enabled: healthSettings.value.enabled
    })
  } catch (error) {
    console.error('Error updating enabled status:', error)
    $q.notify({ type: 'negative', message: 'Грешка при запазване на статус' })
  }
}

async function updateCheckControllers() {
  if (healthSettingsLoading.value) return
  try {
    await api.getClient().put('/devices/health/configure/check-controllers', {
      checkControllers: healthSettings.value.checkControllers
    })
  } catch (error) {
    console.error('Error updating check controllers:', error)
    $q.notify({ type: 'negative', message: 'Грешка при запазване на проверка на контролери' })
  }
}

async function updateCheckSensors() {
  if (healthSettingsLoading.value) return
  try {
    await api.getClient().put('/devices/health/configure/check-sensors', {
      checkSensors: healthSettings.value.checkSensors
    })
  } catch (error) {
    console.error('Error updating check sensors:', error)
    $q.notify({ type: 'negative', message: 'Грешка при запазване на проверка на сензори' })
  }
}

async function updateCheckInterval() {
  if (healthSettingsLoading.value) return
  try {
    await api.getClient().put('/devices/health/configure/check-interval', {
      checkIntervalMinutes: healthSettings.value.checkInterval
    })
  } catch (error) {
    console.error('Error updating check interval:', error)
    $q.notify({ type: 'negative', message: 'Грешка при запазване на интервал' })
  }
}

async function updateFailureThreshold() {
  if (healthSettingsLoading.value) return
  try {
    await api.getClient().put('/devices/health/configure/failure-threshold', {
      failureThreshold: healthSettings.value.failureThreshold
    })
  } catch (error) {
    console.error('Error updating failure threshold:', error)
    $q.notify({ type: 'negative', message: 'Грешка при запазване на праг за грешки' })
  }
}


async function cancelHealthSettings() {
  // Reset to original values from API
  await loadHealthSettings()
  showHealthSettingsDialog.value = false
}


// Watch for tab changes
watch(activeTab, (newTab, oldTab) => {
  // Refresh relays when switching to relays tab
  if (newTab === 'relays' && oldTab !== 'relays') {
    console.log('[DeviceSettingsPage] Switching to relays tab - refreshing data')
    loadRelays()
  }
  // Optionally refresh other tabs too
  else if (newTab === 'devices' && oldTab !== 'devices') {
    console.log('[DeviceSettingsPage] Switching to devices tab - refreshing data')
    loadDevices()
  }
})

// Watch for Health Settings dialog opening
watch(showHealthSettingsDialog, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    // Dialog opened - load fresh health settings
    console.log('[DeviceSettingsPage] Health Settings dialog opened - loading settings')
    loadHealthSettings()
  }
})

// Manual health check function
async function runManualHealthCheck() {
  try {
    $q.loading.show({
      message: 'Стартиране на ръчна health проверка...'
    })
    
    console.log('🔍 Starting manual health check...')
    
    $q.loading.show({
      message: 'Проверка на контролери и устройства...'
    })
    
    const response = await api.getClient().post('/devices/health/check', { fullCheck: true }, { timeout: 60000 })
    console.log('✅ Manual health check completed:', response.data)
    
    $q.loading.show({
      message: 'Обновяване на данните...'
    })
    
    // Refresh device data
    await Promise.all([
      loadDevices(),
      loadControllers()
    ])
    
    $q.notify({
      type: 'positive',
      message: `Health проверка завърши. ${response.data.summary || ''}`
    })
    
  } catch (error) {
    console.error('❌ Manual health check failed:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при ръчната health проверка'
    })
  } finally {
    $q.loading.hide()
  }
}


// Calibration event handlers
function handleCalibrationUpdate(calibrationData) {
  console.log('[DeviceSettingsPage] Calibration updated:', calibrationData)
  
  $q.notify({
    type: 'positive',
    message: 'Калибрацията е обновена успешно',
    position: 'top-right',
    timeout: 3000
  })
  
  // No need to reload all devices - calibration is handled independently
}

function handleSettingsUpdate(settings) {
  console.log('[DeviceSettingsPage] Settings updated:', settings)

  $q.notify({
    type: 'positive',
    message: 'Настройките са обновени успешно',
    position: 'top-right',
    timeout: 3000
  })
}

function handleFirmwareGenerated(result) {
  console.log('[DeviceSettingsPage] Firmware generated:', result)
  $q.notify({
    type: 'positive',
    message: 'Firmware генериран успешно!',
    position: 'top-right'
  })
}

// Lifecycle
onMounted(async () => {
  // Set callback to close controller dialog when tutorial completes
  tutorialStore.setCompletionCallback(() => {
    showControllerDialog.value = false
  })

  await Promise.all([
    loadDevices(),
    loadControllers(),
    loadRelays(),
    loadSettings(),
    loadHealthSettings()
  ])
})

onUnmounted(() => {
  // Clean up tutorial callback
  tutorialStore.setCompletionCallback(null)
})

// Load health settings from API
async function loadHealthSettings() {
  try {
    const response = await api.getClient().get('/devices/health/status')
    console.log('[DeviceSettingsPage] Full API response:', response.data)
    console.log('[DeviceSettingsPage] Data.data:', response.data.data)
    
    const config = response.data.data?.configuration || {}
    console.log('[DeviceSettingsPage] Loaded health config from API:', config)
    
    healthSettings.value = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      checkControllers: config.checkControllers !== undefined ? config.checkControllers : true,
      checkSensors: config.checkSensors !== undefined ? config.checkSensors : false,
      checkInterval: config.checkIntervalMinutes || 5,
      failureThreshold: config.failureThreshold || 3,
      timeoutMs: config.timeoutMs || 5000
    }
  } catch (error) {
    console.error('Error loading health settings:', error)
    // Fallback to defaults on API error
    healthSettings.value = {
      enabled: true,
      checkControllers: true,
      checkSensors: false,
      checkInterval: 5,
      failureThreshold: 3,
      timeoutMs: 5000
    }
  }
}
</script>

<style scoped>
.devices-table {
  border-radius: 8px;
}

.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}
</style>