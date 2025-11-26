<template>
  <div class="program-settings">
    <div class="text-h6 q-mb-md">Настройки на програмната секция</div>
    
    <q-list separator>
      <q-item tag="label" v-ripple>
        <q-item-section side>
          <q-checkbox 
            :model-value="localSettings.program.showCurrentCycle"
            @update:model-value="updateSetting('showCurrentCycle', $event)"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Информация за текущия цикъл</q-item-label>
          <q-item-label caption>Показва детайли за изпълняващия се цикъл</q-item-label>
        </q-item-section>
      </q-item>
      
      <q-item tag="label" v-ripple>
        <q-item-section side>
          <q-checkbox 
            :model-value="localSettings.program.showTimeline"
            @update:model-value="updateSetting('showTimeline', $event)"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>График на изпълнението</q-item-label>
          <q-item-label caption>Показва времевата линия на програмата</q-item-label>
        </q-item-section>
      </q-item>
      
      <q-item tag="label" v-ripple>
        <q-item-section side>
          <q-checkbox 
            :model-value="localSettings.program.showParameters"
            @update:model-value="updateSetting('showParameters', $event)"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Параметри на програмата</q-item-label>
          <q-item-label caption>Показва ключовите настройки на програмата</q-item-label>
        </q-item-section>
      </q-item>

      <q-item tag="label" v-ripple>
        <q-item-section side>
          <q-checkbox 
            :model-value="localSettings.program.showExecutionStats"
            @update:model-value="updateSetting('showExecutionStats', $event)"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Статистики за изпълнението</q-item-label>
          <q-item-label caption>Време за изпълнение, завършени цикли</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardSettings } from '../../../stores/dashboard'

// Props & Emits
const props = defineProps<{
  modelValue: DashboardSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DashboardSettings]
}>()

// Computed local settings for two-way binding
const localSettings = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Methods
function updateSetting(key: keyof DashboardSettings['program'], value: any) {
  const newSettings = { ...props.modelValue }
  newSettings.program = { ...newSettings.program, [key]: value }
  emit('update:modelValue', newSettings)
}
</script>

<style lang="scss" scoped>
.program-settings {
  .q-list {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: white;
  }
}
</style>