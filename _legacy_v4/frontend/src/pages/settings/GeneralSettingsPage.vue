<template>
  <div>
    <q-card-section>
      <div class="text-h6 text-weight-bold q-mb-md">
        <q-icon name="tune" class="q-mr-sm" />
        Общи Настройки
      </div>
      <p class="text-grey-6">Конфигуриране на основни системни предпочитания и поведение</p>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-lg">
      <q-form @submit="saveSettings" class="q-gutter-md">
        <!-- System Configuration -->
        <div class="text-h6 q-mb-md">Системна Конфигурация</div>
        
        <div class="row q-gutter-md">
          <q-select
            v-model="localSettings.timezone"
            :options="timezoneOptions"
            label="Часова Зона"
            outlined
            class="col-12 col-sm-6"
            :loading="isLoading"
          />

          <q-select
            v-model="localSettings.language"
            :options="languageOptions"
            label="Език"
            outlined
            class="col-12 col-sm-6"
            :loading="isLoading"
          />
        </div>

        <div class="row q-gutter-md">
          <q-select
            v-model="localSettings.units"
            :options="unitsOptions"
            label="Мерни Единици"
            outlined
            class="col-12 col-sm-6"
            :loading="isLoading"
          />

          <q-select
            v-model="localSettings.logLevel"
            :options="logLevelOptions"
            label="Ниво на Логове"
            outlined
            class="col-12 col-sm-6"
            :loading="isLoading"
          />
        </div>

        <!-- Behavior Settings -->
        <div class="text-h6 q-mb-md q-mt-lg">Настройки на Поведение</div>
        
        <q-toggle
          v-model="localSettings.autoStart"
          label="Автоматично стартиране на програми при зареждане на системата"
          color="hydro-green"
          :loading="isLoading"
        />

        <q-input
          v-model.number="localSettings.maxLogEntries"
          label="Максимален Брой Записи в Лога"
          type="number"
          outlined
          :min="100"
          :max="10000"
          class="col-12 col-sm-6"
          :loading="isLoading"
          hint="Брой записи в лога за съхранение в паметта"
        />

        <!-- Action Buttons -->
        <div class="row q-gutter-md q-mt-lg">
          <q-btn
            type="submit"
            color="hydro-green"
            icon="save"
            label="Запази Настройки"
            :loading="isLoading"
            unelevated
          />
          
          <q-btn
            color="grey-6"
            icon="refresh"
            label="Върни по Подразбиране"
            @click="resetToDefaults"
            :loading="isLoading"
            outline
          />
        </div>
      </q-form>
    </q-card-section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useSettingsStore } from 'stores/settings'
import { useMainStore } from 'stores/main'

const $q = useQuasar()
const settingsStore = useSettingsStore()
const mainStore = useMainStore()

// Local reactive state
const localSettings = ref({
  timezone: 'UTC',
  language: 'en',
  units: 'metric',
  autoStart: false,
  logLevel: 'info',
  maxLogEntries: 1000
})

// Computed properties
const isLoading = computed(() => mainStore.isLoading)

// Options for dropdowns
const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'Europe/Sofia', value: 'Europe/Sofia' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'Europe/Berlin', value: 'Europe/Berlin' },
  { label: 'America/New_York', value: 'America/New_York' },
  { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
  { label: 'Asia/Tokyo', value: 'Asia/Tokyo' }
]

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Български', value: 'bg' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Français', value: 'fr' },
  { label: 'Español', value: 'es' }
]

const unitsOptions = [
  { label: 'Метрични', value: 'metric' },
  { label: 'Имперски', value: 'imperial' }
]

const logLevelOptions = [
  { label: 'Отладка', value: 'debug' },
  { label: 'Информация', value: 'info' },
  { label: 'Предупреждение', value: 'warn' },
  { label: 'Грешка', value: 'error' }
]

// Methods
async function saveSettings() {
  try {
    await settingsStore.updateSystemSettings(localSettings.value)
    
    $q.notify({
      type: 'positive',
      message: 'Settings saved successfully',
      icon: 'check_circle'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: `Failed to save settings: ${error.message}`,
      icon: 'error'
    })
  }
}

function resetToDefaults() {
  $q.dialog({
    title: 'Reset to Defaults',
    message: 'Are you sure you want to reset all general settings to their default values?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    localSettings.value = {
      timezone: 'UTC',
      language: 'en',
      units: 'metric',
      autoStart: false,
      logLevel: 'info',
      maxLogEntries: 1000
    }

    $q.notify({
      type: 'info',
      message: 'Settings reset to defaults (not saved yet)',
      icon: 'info'
    })
  })
}

function loadSettings() {
  const settings = settingsStore.systemSettings
  if (settings) {
    localSettings.value = {
      timezone: settings.timezone,
      language: settings.language,
      units: settings.units,
      autoStart: settings.autoStart,
      logLevel: settings.logLevel,
      maxLogEntries: settings.maxLogEntries
    }
  }
}

// Watchers
watch(() => settingsStore.systemSettings, () => {
  loadSettings()
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
.q-form {
  max-width: 800px;
}
</style>