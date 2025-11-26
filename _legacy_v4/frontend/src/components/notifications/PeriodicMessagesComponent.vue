<template>
  <div>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6">Периодични Съобщения</div>
      <q-btn 
        color="primary" 
        icon="add" 
        label="Ново съобщение" 
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Messages List -->
    <q-card v-if="!loading && messages.length > 0" class="q-mb-md">
      <q-list separator>
        <q-item v-for="message in messages" :key="message._id">
          <q-item-section avatar>
            <q-avatar :color="message.isActive ? 'positive' : 'grey'" text-color="white">
              <q-icon name="message" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">{{ message.name }}</q-item-label>
            <q-item-label caption v-if="message.description">{{ message.description }}</q-item-label>
            <q-item-label caption>
              <q-chip size="xs" :color="getScheduleTypeColor(message.schedule.type)" text-color="white" class="q-mr-xs">
                {{ getScheduleTypeLabel(message.schedule.type) }}
              </q-chip>
              {{ formatScheduleText(message.schedule) }}
            </q-item-label>
            <q-item-label caption>
              Тагове: {{ message.tags.join(', ') || 'Няма' }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn 
                icon="send" 
                size="sm" 
                color="positive" 
                round 
                flat 
                @click="triggerMessage(message._id)"
                :loading="triggeringId === message._id"
              >
                <q-tooltip>Изпрати сега</q-tooltip>
              </q-btn>
              <q-btn 
                :icon="message.isActive ? 'pause' : 'play_arrow'"
                size="sm" 
                :color="message.isActive ? 'orange' : 'grey'"
                round 
                flat 
                @click="toggleMessageActive(message._id, !message.isActive)"
                :loading="togglingId === message._id"
              >
                <q-tooltip>{{ message.isActive ? 'Деактивирай' : 'Активирай' }}</q-tooltip>
              </q-btn>
              <q-btn 
                icon="edit" 
                size="sm" 
                color="primary" 
                round 
                flat 
                @click="editMessage(message)"
              >
                <q-tooltip>Редактирай</q-tooltip>
              </q-btn>
              <q-btn 
                icon="delete" 
                size="sm" 
                color="negative" 
                round 
                flat 
                @click="deleteMessage(message._id, message.name)"
              >
                <q-tooltip>Изтрий</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Empty State -->
    <q-card v-else-if="!loading && messages.length === 0">
      <q-card-section class="text-center q-pa-lg">
        <q-icon name="message" size="64px" color="grey-5" />
        <div class="text-h6 q-mt-md text-grey-6">Няма създадени съобщения</div>
        <div class="text-body2 text-grey-5 q-mb-md">Започнете като създадете първото си периодично съобщение</div>
        <q-btn color="primary" icon="add" label="Създай съобщение" @click="showCreateDialog = true" />
      </q-card-section>
    </q-card>

    <!-- Loading State -->
    <q-card v-if="loading">
      <q-card-section class="text-center q-pa-lg">
        <q-spinner-gears size="50px" color="primary" />
        <div class="q-mt-md">Зареждане на съобщения...</div>
      </q-card-section>
    </q-card>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center">
          <q-icon name="message" class="q-mr-sm" />
          <span class="text-h6">{{ editingMessage ? 'Редактиране на съобщение' : 'Ново съобщение' }}</span>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeDialog" />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <!-- Name -->
            <q-input
              v-model="formData.name"
              label="Име на съобщение *"
              outlined
              :rules="[val => val && val.length > 0 || 'Името е задължително']"
            />

            <!-- Description -->
            <q-input
              v-model="formData.description"
              label="Описание"
              type="textarea"
              outlined
              rows="3"
            />

            <!-- Schedule Type -->
            <q-select
              v-model="formData.schedule.type"
              label="Тип планиране *"
              :options="scheduleTypeOptions"
              outlined
              emit-value
              map-options
              @update:model-value="resetScheduleFields"
            />

            <!-- Interval Schedule -->
            <div v-if="formData.schedule.type === 'interval'" class="row q-gutter-md">
              <q-input
                v-model.number="formData.schedule.interval"
                label="Интервал (минути) *"
                type="number"
                outlined
                style="flex: 1"
                :rules="[val => val > 0 || 'Интервалът трябва да бъде положително число']"
              />
            </div>

            <!-- Fixed Time Schedule -->
            <div v-if="formData.schedule.type === 'fixed_time'" class="q-gutter-md">
              <q-input
                v-model="formData.schedule.time"
                label="Време *"
                outlined
                mask="time"
                :rules="['time']"
              >
                <template v-slot:append>
                  <q-icon name="access_time" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="formData.schedule.time" format24h>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <q-select
                v-model="formData.schedule.days"
                label="Дни *"
                :options="dayOptions"
                outlined
                multiple
                emit-value
                map-options
                use-chips
              />
            </div>

            <!-- Tags Selection -->
            <q-select
              v-model="formData.tags"
              label="Мониторинг тагове"
              :options="monitoringTags"
              option-value="name"
              option-label="name"
              outlined
              multiple
              emit-value
              map-options
              use-chips
              clearable
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Няма налични тагове
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Delivery Methods -->
            <q-select
              v-model="formData.deliveryMethods"
              label="Методи за доставка *"
              :options="availableDeliveryMethods"
              outlined
              multiple
              use-chips
              emit-value
              map-options
              :rules="[val => val && val.length > 0 || 'Изберете поне един метод за доставка']"
            />

            <!-- Active Status -->
            <q-toggle
              v-model="formData.isActive"
              label="Активно"
              color="positive"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" @click="closeDialog" />
          <q-btn 
            v-if="editingMessage"
            color="positive" 
            icon="send"
            label="Тест" 
            @click="testMessage"
            :loading="testing"
            class="q-mr-sm"
          />
          <q-btn 
            color="primary" 
            :label="editingMessage ? 'Обнови' : 'Създай'" 
            @click="saveMessage"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import type {
  NotificationMessage,
  NotificationProvider,
  MonitoringTag,
  NotificationMessageFormData,
  NotificationSchedule
} from '../../types'

// Props
interface Props {
  messages: NotificationMessage[]
  monitoringTags: MonitoringTag[]
  providers: NotificationProvider[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'create', data: NotificationMessageFormData): void
  (e: 'update', id: string, data: Partial<NotificationMessageFormData>): void
  (e: 'delete', id: string): void
  (e: 'trigger', id: string): void
}

const emit = defineEmits<Emits>()

const $q = useQuasar()

// State
const showCreateDialog = ref(false)
const editingMessage = ref<NotificationMessage | null>(null)
const saving = ref(false)
const testing = ref(false)
const triggeringId = ref<string | null>(null)
const togglingId = ref<string | null>(null)

// Form data
const defaultFormData = (): NotificationMessageFormData => ({
  name: '',
  description: '',
  schedule: {
    type: 'interval',
    interval: 60
  },
  tags: [],
  deliveryMethods: [],
  isActive: true
})

const formData = ref<NotificationMessageFormData>(defaultFormData())

// Options
const scheduleTypeOptions = [
  { label: 'Интервал', value: 'interval' },
  { label: 'Фиксирано време', value: 'fixed_time' }
]

const dayOptions = [
  { label: 'Всеки ден', value: 'daily' },
  { label: 'Понedelник', value: 'monday' },
  { label: 'Вторник', value: 'tuesday' },
  { label: 'Сряда', value: 'wednesday' },
  { label: 'Четвъртък', value: 'thursday' },
  { label: 'Петък', value: 'friday' },
  { label: 'Събота', value: 'saturday' },
  { label: 'Неделя', value: 'sunday' }
]

// Computed
const availableDeliveryMethods = computed(() => {
  const methods = new Set(props.providers.filter(p => p.isActive).map(p => p.type))
  return Array.from(methods).map(method => ({
    label: method === 'email' ? 'Email' : method.charAt(0).toUpperCase() + method.slice(1),
    value: method
  }))
})

// Methods
function resetScheduleFields() {
  if (formData.value.schedule.type === 'interval') {
    formData.value.schedule = {
      type: 'interval',
      interval: 60
    }
  } else {
    formData.value.schedule = {
      type: 'fixed_time',
      time: '12:00',
      days: ['daily']
    }
  }
}

function editMessage(message: NotificationMessage) {
  editingMessage.value = message
  formData.value = {
    name: message.name,
    description: message.description || '',
    schedule: { ...message.schedule },
    tags: [...message.tags],
    deliveryMethods: [...message.deliveryMethods],
    isActive: message.isActive
  }
  showCreateDialog.value = true
}

function closeDialog() {
  showCreateDialog.value = false
  editingMessage.value = null
  formData.value = defaultFormData()
}

async function saveMessage() {
  try {
    saving.value = true
    
    if (editingMessage.value) {
      emit('update', editingMessage.value._id, formData.value)
    } else {
      emit('create', formData.value)
    }
    
    closeDialog()
  } catch (error) {
    // Error handling is done in parent component
  } finally {
    saving.value = false
  }
}

async function testMessage() {
  if (!editingMessage.value) return
  
  try {
    testing.value = true
    emit('trigger', editingMessage.value._id)
    
    $q.notify({
      type: 'positive',
      message: 'Тест съобщението беше изпратено успешно',
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при изпращане на тест съобщението',
      position: 'top'
    })
  } finally {
    testing.value = false
  }
}

function deleteMessage(id: string, name: string) {
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете съобщението "${name}"?`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(() => {
    emit('delete', id)
  })
}

async function triggerMessage(id: string) {
  try {
    triggeringId.value = id
    emit('trigger', id)
  } finally {
    triggeringId.value = null
  }
}

async function toggleMessageActive(id: string, isActive: boolean) {
  try {
    togglingId.value = id
    emit('update', id, { isActive })
  } finally {
    togglingId.value = null
  }
}

// Helper functions
function getScheduleTypeColor(type: string): string {
  return type === 'interval' ? 'primary' : 'secondary'
}

function getScheduleTypeLabel(type: string): string {
  return type === 'interval' ? 'Интервал' : 'Фиксирано време'
}

function formatScheduleText(schedule: NotificationSchedule): string {
  if (schedule.type === 'interval') {
    return `На всеки ${schedule.interval} минути`
  } else {
    const daysText = schedule.days?.includes('daily') 
      ? 'всеки ден' 
      : schedule.days?.join(', ') || ''
    return `В ${schedule.time} ${daysText}`
  }
}

// Watchers
watch(() => props.providers, () => {
  // Update delivery methods if providers change
  const availableMethods = availableDeliveryMethods.value.map(m => m.value)
  formData.value.deliveryMethods = formData.value.deliveryMethods.filter(method => 
    availableMethods.includes(method)
  )
}, { deep: true })
</script>

<style lang="scss" scoped>
.q-item {
  .q-item-section--side {
    padding-left: 16px;
  }
}
</style>