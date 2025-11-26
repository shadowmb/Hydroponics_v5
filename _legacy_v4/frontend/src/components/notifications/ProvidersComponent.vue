<template>
  <div>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6">Доставчици на Известия</div>
      <q-btn 
        color="primary" 
        icon="add" 
        label="Нов доставчик" 
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Providers List -->
    <q-card v-if="!loading && providers.length > 0" class="q-mb-md">
      <q-list separator>
        <q-item v-for="provider in providers" :key="provider._id">
          <q-item-section avatar>
            <q-avatar :color="provider.isActive ? 'positive' : 'grey'" text-color="white">
              <q-icon :name="getProviderIcon(provider.type)" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">{{ provider.name }}</q-item-label>
            <q-item-label caption>
              <q-chip size="xs" :color="getProviderTypeColor(provider.type)" text-color="white" class="q-mr-xs">
                {{ getProviderTypeLabel(provider.type) }}
              </q-chip>
              {{ formatProviderInfo(provider) }}
            </q-item-label>
            <q-item-label caption v-if="!provider.isActive" class="text-negative">
              Неактивен
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn 
                icon="send" 
                size="sm" 
                color="info" 
                round 
                flat 
                @click="testProvider(provider._id)"
                :loading="testingId === provider._id"
                :disable="!provider.isActive"
              >
                <q-tooltip>Тест съобщение</q-tooltip>
              </q-btn>
              <q-btn 
                icon="edit" 
                size="sm" 
                color="primary" 
                round 
                flat 
                @click="editProvider(provider)"
              >
                <q-tooltip>Редактирай</q-tooltip>
              </q-btn>
              <q-btn 
                icon="delete" 
                size="sm" 
                color="negative" 
                round 
                flat 
                @click="deleteProvider(provider._id, provider.name)"
              >
                <q-tooltip>Изтрий</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Empty State -->
    <q-card v-else-if="!loading && providers.length === 0">
      <q-card-section class="text-center q-pa-lg">
        <q-icon name="email" size="64px" color="grey-5" />
        <div class="text-h6 q-mt-md text-grey-6">Няма настроени доставчици</div>
        <div class="text-body2 text-grey-5 q-mb-md">Настройте първия си доставчик за изпращане на известия</div>
        <q-btn color="primary" icon="add" label="Добави доставчик" @click="showCreateDialog = true" />
      </q-card-section>
    </q-card>

    <!-- Loading State -->
    <q-card v-if="loading">
      <q-card-section class="text-center q-pa-lg">
        <q-spinner-gears size="50px" color="primary" />
        <div class="q-mt-md">Зареждане на доставчици...</div>
      </q-card-section>
    </q-card>

    <!-- Create/Edit Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 600px">
        <q-card-section class="row items-center">
          <q-icon name="email" class="q-mr-sm" />
          <span class="text-h6">{{ editingProvider ? 'Редактиране на доставчик' : 'Нов доставчик' }}</span>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeDialog" />
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md">
            <!-- Provider Type -->
            <q-select
              v-model="formData.type"
              label="Тип доставчик *"
              :options="providerTypeOptions"
              outlined
              emit-value
              map-options
              @update:model-value="resetConfigFields"
              :disable="!!editingProvider"
            />

            <!-- Name -->
            <q-input
              v-model="formData.name"
              label="Име на доставчик *"
              outlined
              :rules="[val => val && val.length > 0 || 'Името е задължително']"
            />

            <!-- Email Configuration -->
            <div v-if="formData.type === 'email'" class="q-gutter-md">
              <div class="text-subtitle2 text-primary q-mb-sm">Email настройки</div>
              
              <div class="row q-gutter-md">
                <q-input
                  v-model="formData.config.host"
                  label="SMTP Host *"
                  outlined
                  style="flex: 1"
                  :rules="[val => val && val.length > 0 || 'SMTP host е задължителен']"
                />
                <q-input
                  v-model.number="formData.config.port"
                  label="Port *"
                  type="number"
                  outlined
                  style="flex: 0 0 120px"
                  :rules="[val => val > 0 || 'Портът трябва да бъде положително число']"
                />
              </div>

              <div class="row q-gutter-md">
                <q-input
                  v-model="formData.config.user"
                  label="Username *"
                  outlined
                  style="flex: 1"
                  :rules="[val => val && val.length > 0 || 'Username е задължителен']"
                />
                <q-input
                  v-model="formData.config.password"
                  label="Password *"
                  type="password"
                  outlined
                  style="flex: 1"
                  :rules="[val => val && val.length > 0 || 'Password е задължителна']"
                />
              </div>

              <q-input
                v-model="formData.config.from"
                label="От (email адрес)"
                outlined
                type="email"
              />

              <q-input
                v-model="formData.config.to"
                label="До (email адрес) *"
                outlined
                type="email"
                :rules="[val => val && val.length > 0 || 'Получател е задължителен']"
              />

              <q-toggle
                v-model="formData.config.secure"
                label="SSL/TLS връзка"
                color="positive"
              />
            </div>

            <!-- Telegram Configuration -->
            <div v-if="formData.type === 'telegram'" class="q-gutter-md">
              <div class="text-subtitle2 text-primary q-mb-sm">Telegram настройки</div>
              
              <q-input
                v-model="formData.config.botToken"
                label="Bot Token *"
                outlined
                type="password"
                :rules="[val => val && val.length > 0 || 'Bot Token е задължителен']"
              >
                <template v-slot:hint>
                  Получете Bot Token от @BotFather в Telegram
                </template>
              </q-input>

              <q-input
                v-model="formData.config.chatId"
                label="Chat ID *"
                outlined
                :rules="[val => val && val.length > 0 || 'Chat ID е задължителен']"
              >
                <template v-slot:hint>
                  ID на чата или канала където ще се изпращат съобщенията
                </template>
              </q-input>
            </div>

            <!-- Viber Configuration -->
            <div v-if="formData.type === 'viber'" class="q-gutter-md">
              <div class="text-subtitle2 text-primary q-mb-sm">Viber настройки</div>
              
              <q-input
                v-model="formData.config.authToken"
                label="Auth Token *"
                outlined
                type="password"
                :rules="[val => val && val.length > 0 || 'Auth Token е задължителен']"
              >
                <template v-slot:hint>
                  Получете Auth Token от Viber for Business
                </template>
              </q-input>

              <q-input
                v-model="formData.config.chatId"
                label="Chat ID *"
                outlined
                :rules="[val => val && val.length > 0 || 'Chat ID е задължителен']"
              >
                <template v-slot:hint>
                  ID на чата където ще се изпращат съобщенията
                </template>
              </q-input>
            </div>

            <!-- Active Status -->
            <q-toggle
              v-model="formData.isActive"
              label="Активен"
              color="positive"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отказ" @click="closeDialog" />
          <q-btn 
            color="primary" 
            :label="editingProvider ? 'Обнови' : 'Създай'" 
            @click="saveProvider"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import type {
  NotificationProvider,
  NotificationProviderFormData,
  NotificationProviderConfig
} from '../../types'

// Props
interface Props {
  providers: NotificationProvider[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'create', data: NotificationProviderFormData): void
  (e: 'update', id: string, data: Partial<NotificationProviderFormData>): void
  (e: 'delete', id: string): void
  (e: 'test', id: string): void
}

const emit = defineEmits<Emits>()

const $q = useQuasar()

// State
const showCreateDialog = ref(false)
const editingProvider = ref<NotificationProvider | null>(null)
const saving = ref(false)
const testingId = ref<string | null>(null)

// Form data
const defaultFormData = (): NotificationProviderFormData => ({
  type: 'email',
  name: '',
  config: {},
  isActive: true
})

const formData = ref<NotificationProviderFormData>(defaultFormData())

// Options
const providerTypeOptions = [
  { label: 'Email (SMTP)', value: 'email' },
  { label: 'Telegram', value: 'telegram' },
  { label: 'Viber', value: 'viber' }
]

// Methods
function resetConfigFields() {
  formData.value.config = {}
  
  // Set default values based on type
  if (formData.value.type === 'email') {
    formData.value.config = {
      port: 587,
      secure: false
    }
  }
}

function editProvider(provider: NotificationProvider) {
  editingProvider.value = provider
  formData.value = {
    type: provider.type,
    name: provider.name,
    config: { ...provider.config },
    isActive: provider.isActive
  }
  showCreateDialog.value = true
}

function closeDialog() {
  showCreateDialog.value = false
  editingProvider.value = null
  formData.value = defaultFormData()
}

async function saveProvider() {
  try {
    saving.value = true
    
    if (editingProvider.value) {
      emit('update', editingProvider.value._id, formData.value)
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

function deleteProvider(id: string, name: string) {
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да изтриете доставчика "${name}"?`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(() => {
    emit('delete', id)
  })
}

async function testProvider(id: string) {
  try {
    testingId.value = id
    emit('test', id)
  } finally {
    testingId.value = null
  }
}

// Helper functions
function getProviderIcon(type: string): string {
  const icons: Record<string, string> = {
    email: 'email',
    telegram: 'telegram',
    viber: 'chat'
  }
  return icons[type] || 'notifications'
}

function getProviderTypeColor(type: string): string {
  const colors: Record<string, string> = {
    email: 'primary',
    telegram: 'info',
    viber: 'purple'
  }
  return colors[type] || 'grey'
}

function getProviderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    email: 'Email',
    telegram: 'Telegram',
    viber: 'Viber'
  }
  return labels[type] || type
}

function formatProviderInfo(provider: NotificationProvider): string {
  switch (provider.type) {
    case 'email':
      return `${provider.config.host}:${provider.config.port} → ${provider.config.to}`
    case 'telegram':
      return `Chat ID: ${provider.config.chatId}`
    case 'viber':
      return `Chat ID: ${provider.config.chatId}`
    default:
      return 'Неконфигуриран'
  }
}
</script>

<style lang="scss" scoped>
.q-item {
  .q-item-section--side {
    padding-left: 16px;
  }
}

.q-dialog .q-card {
  max-height: 80vh;
}
</style>