<template>
  <q-dialog 
    v-model="showDialog" 
    persistent 
    no-escape-key
    position="top"
  >
    <q-card style="min-width: 450px">
      <q-card-section class="row items-center q-pb-none">
        <q-icon 
          name="restore" 
          size="md" 
          color="warning" 
          class="q-mr-md" 
        />
        <div class="text-h6">Възстановяване на работа</div>
      </q-card-section>

      <q-card-section>
        <div class="text-body1 q-mb-md">
          Намерен е автоматично запазен файл от {{ formattedTime }}.
        </div>
        
        <div class="text-body2 text-grey-7">
          <div v-if="tempInfo?.flowId" class="q-mb-sm">
            <strong>Flow ID:</strong> {{ tempInfo.flowId }}
          </div>
          
          <div>
            Искате ли да възстановите последната работа или да започнете наново?
          </div>
        </div>

        <div class="q-mt-md">
          <q-banner 
            inline-actions 
            class="text-white bg-info"
          >
            <template v-slot:avatar>
              <q-icon name="info" />
            </template>
            
            <div class="text-caption">
              Auto-save се запазва автоматично на всяка минута за защита от загуба на данни.
            </div>
          </q-banner>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none">
        <q-btn 
          label="Започни наново" 
          flat
          color="grey-7"
          @click="clearAndStart"
          :loading="clearing"
        />
        
        <q-btn 
          label="Възстанови" 
          color="primary" 
          @click="restore"
          :loading="restoring"
          icon="restore"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AutoSaveService, type TempFileData } from '../services/AutoSaveService'
import type { FlowDefinition } from '../types/FlowDefinition'

// Props & Emits
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'restore', tempData: TempFileData): void
  (e: 'clearAndStart'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const tempInfo = ref<{ savedAt: string; flowId: string | null } | null>(null)
const restoring = ref(false)
const clearing = ref(false)

// Computed
const formattedTime = computed(() => {
  if (!tempInfo.value?.savedAt) return 'неизвестно време'
  return AutoSaveService.formatSaveTime(tempInfo.value.savedAt)
})

// Methods
const restore = async () => {
  try {
    restoring.value = true
    
    const tempData = AutoSaveService.loadFromTemp()
    if (tempData) {
      emit('restore', tempData)
      showDialog.value = false
    } else {
      console.error('❌ Няма temp файл за възстановяване')
      clearAndStart()
    }
    
  } catch (error) {
    console.error('❌ Грешка при възстановяване:', error)
    clearAndStart()
  } finally {
    restoring.value = false
  }
}

const clearAndStart = async () => {
  try {
    clearing.value = true
    
    // Изтриваме temp файла
    AutoSaveService.clearTemp()
    
    emit('clearAndStart')
    showDialog.value = false
    
  } finally {
    clearing.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Зареждаме информация за temp файла
  tempInfo.value = AutoSaveService.getTempFileInfo()
})
</script>

<style scoped>
.q-dialog .q-card {
  border-radius: 12px;
}

.q-banner {
  border-radius: 8px;
}

.text-h6 {
  font-weight: 600;
}
</style>