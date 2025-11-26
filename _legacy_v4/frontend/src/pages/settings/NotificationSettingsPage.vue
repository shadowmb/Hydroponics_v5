<template>
  <div class="q-pa-md">
    <div class="text-h4 q-mb-lg text-hydro-green">
      <q-icon name="notifications" class="q-mr-sm" />Управление на Известия
    </div>

    <!-- Scheduler Status Card -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="schedule" class="q-mr-sm" />Статус на Планировчик
        </div>
        
        <div class="row q-gutter-md items-center">
          <q-chip 
            :color="schedulerStatus?.isRunning ? 'positive' : 'negative'" 
            text-color="white" 
            :icon="schedulerStatus?.isRunning ? 'check_circle' : 'error'"
          >
            {{ schedulerStatus?.isRunning ? 'Активен' : 'Неактивен' }}
          </q-chip>
          
          <span class="text-body2">
            Планирани известия: {{ schedulerStatus?.scheduledCount || 0 }}
          </span>
          
          <q-space />
          
          <q-btn 
            color="primary" 
            icon="refresh" 
            label="Презареди" 
            @click="reloadScheduler" 
            :loading="reloadingScheduler"
            size="sm"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Main Content Tabs -->
    <q-tabs v-model="activeTab" class="q-mb-md" align="left">
      <q-tab name="messages" icon="message" label="Периодични Съобщения" />
      <q-tab name="providers" icon="email" label="Доставчици" />
      <q-tab name="errors-settings" icon="error" label="Настройки за Грешки" />
      <q-tab name="lifecycle-settings" icon="timeline" label="Lifecycle Събития" />
    </q-tabs>

    <q-tab-panels v-model="activeTab">
      <!-- Periodic Messages Tab -->
      <q-tab-panel name="messages">
        <periodic-messages-component
          :messages="messages"
          :monitoring-tags="monitoringTags"
          :providers="providers"
          :loading="loadingMessages"
          @create="handleCreateMessage"
          @update="handleUpdateMessage"
          @delete="handleDeleteMessage"
          @trigger="handleTriggerMessage"
        />
      </q-tab-panel>

      <!-- Providers Tab -->
      <q-tab-panel name="providers">
        <providers-component
          :providers="providers"
          :loading="loadingProviders"
          @create="handleCreateProvider"
          @update="handleUpdateProvider"
          @delete="handleDeleteProvider"
          @test="handleTestProvider"
        />
      </q-tab-panel>

      <!-- Error Settings Tab -->
      <q-tab-panel name="errors-settings">
        <error-settings-component
          :settings="errorSettings"
          :providers="providers"
          :loading="loadingErrorSettings"
          @update="handleUpdateErrorSettings"
        />
      </q-tab-panel>

      <!-- Lifecycle Settings Tab -->
      <q-tab-panel name="lifecycle-settings">
        <lifecycle-settings-component
          :settings="lifecycleSettings"
          :providers="providers"
          :loading="loadingLifecycleSettings"
          @update="handleUpdateLifecycleSettings"
          @test="handleTestLifecycleNotification"
        />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { notificationService } from '../../services/notificationService'
import type {
  NotificationMessage,
  NotificationProvider,
  ErrorNotificationSettings,
  LifecycleNotificationSettings,
  MonitoringTag,
  NotificationMessageFormData,
  NotificationProviderFormData,
  ErrorNotificationSettingsFormData,
  LifecycleNotificationSettingsFormData
} from '../../types'

// Import stub components (will be implemented next)
import PeriodicMessagesComponent from '../../components/notifications/PeriodicMessagesComponent.vue'
import ProvidersComponent from '../../components/notifications/ProvidersComponent.vue'
import ErrorSettingsComponent from '../../components/notifications/ErrorSettingsComponent.vue'
import LifecycleSettingsComponent from '../../components/notifications/LifecycleSettingsComponent.vue'

const $q = useQuasar()

// Reactive state
const activeTab = ref('messages')
const messages = ref<NotificationMessage[]>([])
const providers = ref<NotificationProvider[]>([])
const errorSettings = ref<ErrorNotificationSettings | null>(null)
const lifecycleSettings = ref<LifecycleNotificationSettings | null>(null)
const monitoringTags = ref<MonitoringTag[]>([])
const schedulerStatus = ref<any>(null)

// Loading states
const loadingMessages = ref(false)
const loadingProviders = ref(false)
const loadingErrorSettings = ref(false)
const loadingLifecycleSettings = ref(false)
const reloadingScheduler = ref(false)

// Data loading functions
async function loadMessages() {
  try {
    loadingMessages.value = true
    messages.value = await notificationService.getMessages()
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при зареждане на съобщенията: ${error.message}`,
      position: 'top'
    })
  } finally {
    loadingMessages.value = false
  }
}

async function loadProviders() {
  try {
    loadingProviders.value = true
    providers.value = await notificationService.getProviders()
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при зареждане на доставчиците: ${error.message}`,
      position: 'top'
    })
  } finally {
    loadingProviders.value = false
  }
}

async function loadErrorSettings() {
  try {
    loadingErrorSettings.value = true
    errorSettings.value = await notificationService.getErrorSettings()
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при зареждане на настройките за грешки: ${error.message}`,
      position: 'top'
    })
  } finally {
    loadingErrorSettings.value = false
  }
}

async function loadLifecycleSettings() {
  try {
    loadingLifecycleSettings.value = true
    lifecycleSettings.value = await notificationService.getLifecycleSettings()
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при зареждане на настройките за lifecycle събития: ${error.message}`,
      position: 'top'
    })
  } finally {
    loadingLifecycleSettings.value = false
  }
}

async function loadMonitoringTags() {
  try {
    monitoringTags.value = await notificationService.getMonitoringTags()
  } catch (error: any) {
    console.warn('Failed to load monitoring tags:', error.message)
  }
}

async function loadSchedulerStatus() {
  try {
    schedulerStatus.value = await notificationService.getSchedulerStatus()
  } catch (error: any) {
    console.warn('Failed to load scheduler status:', error.message)
  }
}

// Event handlers for messages
async function handleCreateMessage(data: NotificationMessageFormData) {
  try {
    const newMessage = await notificationService.createMessage(data)
    messages.value.push(newMessage)
    
    $q.notify({
      type: 'positive',
      message: 'Съобщението беше създадено успешно',
      position: 'top'
    })
    
    // Reload scheduler status
    await loadSchedulerStatus()
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при създаване на съобщението: ${error.message}`,
      position: 'top'
    })
  }
}

async function handleUpdateMessage(id: string, data: Partial<NotificationMessageFormData>) {
  try {
    const updatedMessage = await notificationService.updateMessage(id, data)
    const index = messages.value.findIndex(m => m._id === id)
    if (index >= 0) {
      messages.value[index] = updatedMessage
    }
    
    $q.notify({
      type: 'positive',
      message: 'Съобщението беше обновено успешно',
      position: 'top'
    })
    
    // Reload scheduler status
    await loadSchedulerStatus()
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при обновяване на съобщението: ${error.message}`,
      position: 'top'
    })
  }
}

async function handleDeleteMessage(id: string) {
  try {
    await notificationService.deleteMessage(id)
    messages.value = messages.value.filter(m => m._id !== id)
    
    $q.notify({
      type: 'positive',
      message: 'Съобщението беше изтрито успешно',
      position: 'top'
    })
    
    // Reload scheduler status
    await loadSchedulerStatus()
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при изтриване на съобщението: ${error.message}`,
      position: 'top'
    })
  }
}

async function handleTriggerMessage(id: string) {
  try {
    await notificationService.triggerMessage(id)
    
    $q.notify({
      type: 'positive',
      message: 'Съобщението беше изпратено успешно',
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при изпращане на съобщението: ${error.message}`,
      position: 'top'
    })
  }
}

// Event handlers for providers
async function handleCreateProvider(data: NotificationProviderFormData) {
  try {
    const newProvider = await notificationService.createProvider(data)
    providers.value.push(newProvider)
    
    $q.notify({
      type: 'positive',
      message: 'Доставчикът беше създаден успешно',
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при създаване на доставчика: ${error.message}`,
      position: 'top'
    })
  }
}

async function handleUpdateProvider(id: string, data: Partial<NotificationProviderFormData>) {
  try {
    const updatedProvider = await notificationService.updateProvider(id, data)
    const index = providers.value.findIndex(p => p._id === id)
    if (index >= 0) {
      providers.value[index] = updatedProvider
    }
    
    $q.notify({
      type: 'positive',
      message: 'Доставчикът беше обновен успешно',
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при обновяване на доставчика: ${error.message}`,
      position: 'top'
    })
  }
}

async function handleDeleteProvider(id: string) {
  try {
    await notificationService.deleteProvider(id)
    providers.value = providers.value.filter(p => p._id !== id)
    
    $q.notify({
      type: 'positive',
      message: 'Доставчикът беше изтрит успешно',
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при изтриване на доставчика: ${error.message}`,
      position: 'top'
    })
  }
}

async function handleTestProvider(id: string) {
  try {
    const result = await notificationService.testProvider(id)
    
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Тестът на доставчика премина успешно!',
        position: 'top'
      })
    } else {
      $q.notify({
        type: 'negative',
        message: `Тестът на доставчика се провали: ${result.error}`,
        position: 'top'
      })
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при тестване на доставчика: ${error.message}`,
      position: 'top'
    })
  }
}

// Event handlers for error settings
async function handleUpdateErrorSettings(data: ErrorNotificationSettingsFormData) {
  try {
    errorSettings.value = await notificationService.updateErrorSettings(data)
    
    $q.notify({
      type: 'positive',
      message: 'Настройките за грешки бяха обновени успешно',
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при обновяване на настройките: ${error.message}`,
      position: 'top'
    })
  }
}

// Event handlers for lifecycle settings
async function handleUpdateLifecycleSettings(data: LifecycleNotificationSettingsFormData) {
  try {
    lifecycleSettings.value = await notificationService.updateLifecycleSettings(data)
    
    $q.notify({
      type: 'positive',
      message: 'Настройките за lifecycle събития бяха обновени успешно',
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при обновяване на настройките: ${error.message}`,
      position: 'top'
    })
  }
}

async function handleTestLifecycleNotification(eventType: string, context?: Record<string, any>) {
  try {
    const result = await notificationService.testLifecycleNotification(eventType, context)
    
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Тестовото известие беше изпратено успешно!',
        position: 'top'
      })
    } else {
      $q.notify({
        type: 'negative',
        message: `Грешка при изпращане на тестово известие: ${result.message}`,
        position: 'top'
      })
    }
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при тестване на lifecycle известие: ${error.message}`,
      position: 'top'
    })
  }
}

// Scheduler functions
async function reloadScheduler() {
  try {
    reloadingScheduler.value = true
    await notificationService.reloadScheduler()
    await loadSchedulerStatus()
    
    $q.notify({
      type: 'positive',
      message: 'Планировчикът беше презареден успешно',
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Грешка при презареждане на планировчика: ${error.message}`,
      position: 'top'
    })
  } finally {
    reloadingScheduler.value = false
  }
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    loadMessages(),
    loadProviders(),
    loadErrorSettings(),
    loadLifecycleSettings(),
    loadMonitoringTags(),
    loadSchedulerStatus()
  ])
})
</script>

<style lang="scss" scoped>
.text-hydro-green {
  color: #4CAF50;
}
</style>