<template>
  <q-form @submit="onSubmit" class="q-mt-md">
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="settings" color="primary" class="q-mr-sm" />
          Основни настройки
        </div>
        
        <div class="row q-col-gutter-md">
          <!-- EC Units -->
          <div class="col-12 col-md-6">
            <q-select
              v-model="formData.ecUnit"
              :options="ecUnitOptions"
              label="Единици за EC"
              outlined
              dense
              option-value="value"
              option-label="label"
              emit-value
              map-options
              class="q-mb-md"
            />
          </div>
          
          <!-- Volume Units -->
          <div class="col-12 col-md-6">
            <q-select
              v-model="formData.volumeUnit"
              :options="volumeUnitOptions"
              label="Единици за обем"
              outlined
              dense
              option-value="value"
              option-label="label"
              emit-value
              map-options
              class="q-mb-md"
            />
          </div>
          
          <!-- Time Format -->
          <div class="col-12 col-md-6">
            <q-select
              v-model="formData.timeFormat"
              :options="timeFormatOptions"
              label="Формат на времето"
              outlined
              dense
              option-value="value"
              option-label="label"
              emit-value
              map-options
              class="q-mb-md"
            />
          </div>
          
          <!-- Language -->
          <div class="col-12 col-md-6">
            <q-select
              v-model="formData.language"
              :options="languageOptions"
              label="Език"
              outlined
              dense
              option-value="value"
              option-label="label"
              emit-value
              map-options
              class="q-mb-md"
            />
          </div>
          
          <!-- Theme -->
          <div class="col-12 col-md-6">
            <q-select
              v-model="formData.theme"
              :options="themeOptions"
              label="Тема"
              outlined
              dense
              option-value="value"
              option-label="label"
              emit-value
              map-options
              class="q-mb-md"
              @update:model-value="onThemeChange"
            />
          </div>
        </div>
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn 
          type="submit"
          label="Запази"
          color="primary"
          :loading="saving"
          :disable="!hasChanges"
        />
      </q-card-actions>
    </q-card>
  </q-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const settingsStore = useSettingsStore()

const saving = ref(false)

const formData = reactive({
  ecUnit: 'mS/cm',
  volumeUnit: 'L',
  timeFormat: '24h',
  language: 'bg',
  theme: 'auto'
})

const originalData = reactive({
  ecUnit: 'mS/cm',
  volumeUnit: 'L',
  timeFormat: '24h',
  language: 'bg',
  theme: 'auto'
})

const ecUnitOptions = [
  { label: 'mS/cm', value: 'mS/cm' },
  { label: 'PPM 500', value: 'ppm500' },
  { label: 'PPM 700', value: 'ppm700' },
  { label: 'μS/cm', value: 'μS/cm' }
]

const volumeUnitOptions = [
  { label: 'Литри (L)', value: 'L' },
  { label: 'Милилитри (ml)', value: 'ml' },
  { label: 'Галони (gal)', value: 'gal' },
  { label: 'Унции (oz)', value: 'oz' }
]

const timeFormatOptions = [
  { label: '24 часа', value: '24h' },
  { label: 'AM/PM', value: 'ampm' }
]

const languageOptions = [
  { label: 'Български', value: 'bg' },
  { label: 'English', value: 'en' }
]

const themeOptions = [
  { label: 'Светла', value: 'light' },
  { label: 'Тъмна', value: 'dark' },
  { label: 'Системна', value: 'auto' }
]

const hasChanges = computed(() => {
  return (
    formData.ecUnit !== originalData.ecUnit ||
    formData.volumeUnit !== originalData.volumeUnit ||
    formData.timeFormat !== originalData.timeFormat ||
    formData.language !== originalData.language ||
    formData.theme !== originalData.theme
  )
})

const loadSettings = async () => {
  try {
    const settings = await settingsStore.getGeneralSettings()
    
    formData.ecUnit = settings.ecUnit || 'mS/cm'
    formData.volumeUnit = settings.volumeUnit || 'L'
    formData.timeFormat = settings.timeFormat || '24h'
    formData.language = settings.language || 'bg'
    formData.theme = settings.theme || 'auto'
    
    originalData.ecUnit = formData.ecUnit
    originalData.volumeUnit = formData.volumeUnit
    originalData.timeFormat = formData.timeFormat
    originalData.language = formData.language
    originalData.theme = formData.theme
    
    // Apply theme
    applyTheme(formData.theme)
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const applyTheme = (theme: string) => {
  if (theme === 'auto') {
    $q.dark.set('auto')
  } else if (theme === 'dark') {
    $q.dark.set(true)
  } else {
    $q.dark.set(false)
  }
}

const onThemeChange = (newTheme: string) => {
  applyTheme(newTheme)
}

const onSubmit = async () => {
  if (!hasChanges.value) return
  
  saving.value = true
  
  try {
    await settingsStore.saveGeneralSettings({
      ecUnit: formData.ecUnit,
      volumeUnit: formData.volumeUnit,
      timeFormat: formData.timeFormat,
      language: formData.language,
      theme: formData.theme
    })
    
    originalData.ecUnit = formData.ecUnit
    originalData.volumeUnit = formData.volumeUnit
    originalData.timeFormat = formData.timeFormat
    originalData.language = formData.language
    originalData.theme = formData.theme
    
    $q.notify({
      type: 'positive',
      message: 'Настройките са запазени успешно',
      timeout: 2000
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване на настройките',
      timeout: 3000
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})

// TODO: IMPLEMENT_LATER - синхронизация с backend и прилагане при стартиране
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>