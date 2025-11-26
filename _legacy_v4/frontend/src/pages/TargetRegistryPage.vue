<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="page-header q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h4 class="q-ma-none text-weight-bold">Target Registry</h4>
          <p class="text-grey-6 q-mb-none">Централизирано управление на target стойности</p>
        </div>
        <q-btn
          color="primary"
          icon="refresh"
          label="Презареди"
          class="text-weight-medium"
          @click="loadTargetItems"
          :loading="loading"
        />
      </div>
    </div>

    <!-- 📊 Analytics Section -->
    <q-card class="q-mb-lg analytics-section">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-medium">
            📈 Runtime Analytics & Usage Statistics
          </div>
          <q-btn
            flat
            round
            icon="refresh"
            color="primary"
            @click="loadAnalytics"
            :loading="analyticsLoading"
            size="sm"
          >
            <q-tooltip>Обнови статистиките</q-tooltip>
          </q-btn>
        </div>

        <div class="row q-gutter-md">
          <!-- Statistics Cards -->
          <div class="col-12 col-md-6">
            <div class="row q-gutter-sm">
              <div class="col">
                <q-card class="stat-card total-targets">
                  <q-card-section class="text-center">
                    <div class="stat-number">{{ analytics.totalTargets }}</div>
                    <div class="stat-label">Общо targets</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col">
                <q-card class="stat-card active-targets">
                  <q-card-section class="text-center">
                    <div class="stat-number">{{ analytics.activeTargets }}</div>
                    <div class="stat-label">Активни</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
            <div class="row q-gutter-sm q-mt-sm">
              <div class="col">
                <q-card class="stat-card unused-targets">
                  <q-card-section class="text-center">
                    <div class="stat-number">{{ analytics.unusedTargets }}</div>
                    <div class="stat-label">Неизползвани</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col">
                <q-card class="stat-card usage-rate">
                  <q-card-section class="text-center">
                    <div class="stat-number">{{ analytics.usageRate }}%</div>
                    <div class="stat-label">Процент използване</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Top Used Targets -->
          <div class="col-12 col-md-6">
            <q-card class="top-targets-card">
              <q-card-section>
                <div class="text-subtitle1 text-weight-medium q-mb-md">
                  🏆 Най-използвани targets
                </div>
                <div v-if="analyticsLoading" class="text-center q-py-md">
                  <q-spinner size="2em" color="primary" />
                </div>
                <div v-else-if="topUsedTargets.length === 0" class="text-center text-grey q-py-md">
                  Няма данни за използване
                </div>
                <q-list v-else separator dense>
                  <q-item v-for="(target, index) in topUsedTargets.slice(0, 5)" :key="target._id">
                    <q-item-section avatar>
                      <q-avatar 
                        :color="index === 0 ? 'amber' : index === 1 ? 'grey-5' : index === 2 ? 'orange' : 'blue-grey'"
                        text-color="white" 
                        size="sm"
                      >
                        {{ index + 1 }}
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">{{ target.visualName }}</q-item-label>
                      <q-item-label caption>{{ target.targetKey }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row items-center q-gutter-xs">
                        <q-chip 
                          :color="target.isActive ? 'positive' : 'grey-5'" 
                          text-color="white" 
                          size="sm" 
                          :icon="target.isActive ? 'check_circle' : 'radio_button_unchecked'"
                        >
                          {{ target.usageCount || 0 }} 
                        </q-chip>
                        <q-tooltip>
                          {{ target.isActive ? 'Активен' : 'Неактивен' }} • {{ target.usageCount || 0 }} използвания
                        </q-tooltip>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Control Parameters Section -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-medium">
            📊 Контролни параметри
          </div>
          <q-btn
            color="primary"
            icon="add"
            label="Добави параметър"
            size="sm"
            @click="openAddControlDialog"
          />
        </div>
        
        <q-table
          :rows="controlParameters"
          :columns="controlColumns"
          row-key="_id"
          flat
          separator="horizontal"
          :loading="loading"
          no-data-label="Няма добавени контролни параметри"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-targetKey="props">
            <q-td :props="props">
              <q-chip
                color="primary"
                text-color="white"
                icon="key"
                :label="props.value"
                size="sm"
              />
            </q-td>
          </template>
          
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                dense
                round
                icon="edit"
                color="primary"
                size="sm"
                @click="editControlParameter(props.row)"
              >
                <q-tooltip>Редактирай</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                icon="delete"
                color="negative"
                size="sm"
                @click="deleteParameter(props.row)"
                class="q-ml-xs"
              >
                <q-tooltip>Изтрий</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Device Parameters Section -->
    <q-card>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-medium">
            ⚙️ Устройства и цели
          </div>
          <q-btn
            color="secondary"
            icon="sync"
            label="Синхронизирай устройства"
            size="sm"
            @click="syncDevices"
            :loading="syncLoading"
          />
        </div>
        
        <q-table
          :rows="deviceParameters"
          :columns="deviceColumns"
          row-key="_id"
          flat
          separator="horizontal"
          :loading="loading"
          no-data-label="Няма регистрирани устройства"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-deviceType="props">
            <q-td :props="props">
              <q-chip
                :color="getDeviceTypeColor(props.value)"
                text-color="white"
                :label="getDeviceTypeLabel(props.value)"
                size="sm"
              />
            </q-td>
          </template>
          
          <template v-slot:body-cell-targetKey="props">
            <q-td :props="props">
              <q-input
                v-model="props.row.targetKey"
                outlined
                dense
                prefix="target."
                @blur="updateDeviceParameter(props.row)"
                @keyup.enter="updateDeviceParameter(props.row)"
                class="q-ma-none"
                style="min-width: 150px"
              />
            </q-td>
          </template>
          
          <template v-slot:body-cell-description="props">
            <q-td :props="props">
              <q-input
                v-model="props.row.description"
                outlined
                dense
                placeholder="Бележка..."
                @blur="updateDeviceParameter(props.row)"
                @keyup.enter="updateDeviceParameter(props.row)"
                class="q-ma-none"
                style="min-width: 120px"
              />
            </q-td>
          </template>
        </q-table>
        
        <div class="q-mt-sm text-caption text-grey-6">
          📌 Забележка: Устройствата се зареждат автоматично от системата. Target ключовете се въвеждат ръчно.
        </div>
      </q-card-section>
    </q-card>

    <!-- Add/Edit Control Parameter Dialog -->
    <q-dialog v-model="showControlDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingControl ? 'Редактиране' : 'Добавяне' }} на контролен параметър</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="controlForm.visualName"
            label="Визуално име"
            outlined
            dense
            class="q-mb-md"
            :rules="[val => val && val.length > 0 || 'Полето е задължително']"
          />
          
          <div class="q-mb-md">
            <q-input
              v-model="controlForm.targetKeySuffix"
              label="Target ключ"
              outlined
              dense
              prefix="target."
              :rules="[
                val => val && val.length > 0 || 'Полето е задължително',
                val => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(val) || 'Само букви, цифри и подчертавки'
              ]"
            />
          </div>
          
          <q-input
            v-model="controlForm.description"
            label="Описание"
            outlined
            dense
            type="textarea"
            rows="2"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" color="grey" @click="closeControlDialog" />
          <q-btn 
            label="Запази" 
            color="primary" 
            @click="saveControlParameter"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { targetRegistryApi } from '../services/api'
import type { TargetRegistryItem } from '../types'

const $q = useQuasar()

// State
const loading = ref(false)
const syncLoading = ref(false)
const saving = ref(false)
const showControlDialog = ref(false)
const editingControl = ref<TargetRegistryItem | null>(null)
const targetItems = ref<TargetRegistryItem[]>([])

// Analytics state
const analyticsLoading = ref(false)
const analytics = ref({
  totalTargets: 0,
  activeTargets: 0,
  unusedTargets: 0,
  usageRate: '0.00'
})
const topUsedTargets = ref<TargetRegistryItem[]>([])

// Mock device data - TODO: IMPLEMENT_LATER - Load from real devices API
const mockDevices = [
  { _id: '1', name: 'Помпа 1 (Миксиране)', type: 'pump_mix', targetKey: 'target.MixTime_1', description: 'Време за бъркане 1' },
  { _id: '2', name: 'Помпа 2 (Поливане)', type: 'pump_irrigation', targetKey: 'target.Watering_2', description: 'Поливане зона 2' },
  { _id: '3', name: 'Клапан 1', type: 'valve', targetKey: 'target.Valve1Open', description: 'Клапан главен' }
]

// Control form
const controlForm = ref({
  visualName: '',
  targetKeySuffix: '',
  description: ''
})

// Computed
const controlParameters = computed(() => 
  targetItems.value.filter(item => item.type === 'control')
)

const deviceParameters = computed(() => {
  // For now, return mock devices with proper structure
  // TODO: IMPLEMENT_LATER - Merge with real device data from API
  return mockDevices.map(device => ({
    _id: device._id,
    visualName: device.name,
    targetKey: device.targetKey,
    description: device.description,
    type: 'device' as const,
    deviceName: device.name,
    deviceType: device.type,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
})

// Table columns
const controlColumns = [
  {
    name: 'visualName',
    label: 'Визуално име',
    align: 'left' as const,
    field: 'visualName',
    sortable: true
  },
  {
    name: 'targetKey',
    label: 'Target ключ',
    align: 'left' as const,
    field: 'targetKey',
    sortable: true
  },
  {
    name: 'description',
    label: 'Описание',
    align: 'left' as const,
    field: 'description'
  },
  {
    name: 'actions',
    label: 'Действия',
    align: 'center' as const,
    field: 'actions'
  }
]

const deviceColumns = [
  {
    name: 'deviceName',
    label: 'Устройство',
    align: 'left' as const,
    field: 'deviceName',
    sortable: true
  },
  {
    name: 'deviceType',
    label: 'Тип устройство',
    align: 'center' as const,
    field: 'deviceType'
  },
  {
    name: 'targetKey',
    label: 'Target ключ',
    align: 'left' as const,
    field: 'targetKey'
  },
  {
    name: 'description',
    label: 'Описание',
    align: 'left' as const,
    field: 'description'
  }
]

// Methods
const loadTargetItems = async () => {
  loading.value = true
  try {
    const data = await targetRegistryApi.getAll() as TargetRegistryItem[]
    targetItems.value = data
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Грешка при зареждане на target стойности',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadAnalytics = async () => {
  analyticsLoading.value = true
  try {
    // TODO: IMPLEMENT_LATER - Analytics ще показва runtime данни от FlowExecutor
    // В момента показва design-time tracking, но трябва да се обновят със stati runtime
    const response = await targetRegistryApi.getAnalytics({ sortBy: 'usageCount', limit: 10 })
    analytics.value = response.analytics
    topUsedTargets.value = response.targets
  } catch (error) {
    console.error('Failed to load analytics:', error)
    // Don't show error to user - analytics are optional
  } finally {
    analyticsLoading.value = false
  }
}

const openAddControlDialog = () => {
  editingControl.value = null
  controlForm.value = {
    visualName: '',
    targetKeySuffix: '',
    description: ''
  }
  showControlDialog.value = true
}

const editControlParameter = (item: TargetRegistryItem) => {
  editingControl.value = item
  controlForm.value = {
    visualName: item.visualName,
    targetKeySuffix: item.targetKey.replace('target.', ''),
    description: item.description || ''
  }
  showControlDialog.value = true
}

const closeControlDialog = () => {
  showControlDialog.value = false
  editingControl.value = null
}

const saveControlParameter = async () => {
  if (!controlForm.value.visualName || !controlForm.value.targetKeySuffix) {
    $q.notify({
      color: 'warning',
      message: 'Моля попълнете всички задължителни полета',
      icon: 'warning'
    })
    return
  }

  saving.value = true
  try {
    const data = {
      visualName: controlForm.value.visualName,
      targetKey: `target.${controlForm.value.targetKeySuffix}`,
      description: controlForm.value.description,
      type: 'control'
    }

    if (editingControl.value) {
      await targetRegistryApi.update(editingControl.value._id, data)
      $q.notify({
        color: 'positive',
        message: 'Контролният параметър е обновен успешно',
        icon: 'check'
      })
    } else {
      await targetRegistryApi.create(data)
      $q.notify({
        color: 'positive',
        message: 'Контролният параметър е създаден успешно',
        icon: 'check'
      })
    }

    closeControlDialog()
    await loadTargetItems()
  } catch (error: any) {
    $q.notify({
      color: 'negative',
      message: error.message || 'Грешка при запазване',
      icon: 'error'
    })
  } finally {
    saving.value = false
  }
}

const deleteParameter = async (item: TargetRegistryItem) => {
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете "${item.visualName}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await targetRegistryApi.delete(item._id)
      $q.notify({
        color: 'positive',
        message: 'Параметърът е изтрит успешно',
        icon: 'check'
      })
      await loadTargetItems()
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: 'Грешка при изтриване',
        icon: 'error'
      })
    }
  })
}

const updateDeviceParameter = async (item: any) => {
  // TODO: IMPLEMENT_LATER - Update device parameter via API
  console.log('Updating device parameter:', item)
  $q.notify({
    color: 'info',
    message: 'Device parameter update - Not implemented yet',
    icon: 'info'
  })
}

const syncDevices = async () => {
  syncLoading.value = true
  // TODO: IMPLEMENT_LATER - Sync with real devices from API
  setTimeout(() => {
    syncLoading.value = false
    $q.notify({
      color: 'positive',
      message: 'Устройствата са синхронизирани (mock)',
      icon: 'sync'
    })
  }, 1000)
}

const getDeviceTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    pump_mix: 'blue',
    pump_irrigation: 'green',
    valve: 'orange',
    sensor: 'purple',
    light: 'amber'
  }
  return colors[type] || 'grey'
}

const getDeviceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    pump_mix: 'Помпа миксиране',
    pump_irrigation: 'Помпа поливане',
    valve: 'Клапан',
    sensor: 'Сензор',
    light: 'Осветление'
  }
  return labels[type] || type
}

// Lifecycle
onMounted(() => {
  loadTargetItems()
  loadAnalytics()
})
</script>

<style scoped>
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}

.q-table {
  box-shadow: none;
}

.q-chip {
  font-weight: 500;
}

/* Analytics Section Styles */
.analytics-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.analytics-section .text-h6 {
  color: white;
}

.stat-card {
  min-height: 80px;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-top: 4px;
}

.total-targets {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.active-targets {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
  color: white;
}

.unused-targets {
  background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
  color: white;
}

.usage-rate {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
}

.top-targets-card {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.top-targets-card .text-subtitle1 {
  color: #333;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
}
</style>