<template>
  <div>
    <div class="text-h6 q-mb-md">Настройки за Грешки</div>

    <!-- Loading State -->
    <q-card v-if="loading">
      <q-card-section class="text-center q-pa-lg">
        <q-spinner-gears size="50px" color="primary" />
        <div class="q-mt-md">Зареждане на настройки...</div>
      </q-card-section>
    </q-card>

    <!-- Settings Form -->
    <div v-else-if="settings" class="q-gutter-md">
      <!-- Global Settings Card -->
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="settings" class="q-mr-sm" />Глобални Настройки
          </div>

          <div class="q-gutter-md">
            <!-- Global Enable/Disable -->
            <q-toggle
              v-model="formData.globalEnabled"
              label="Активирай известия за грешки глобално"
              color="positive"
              size="lg"
            />

            <q-separator v-if="formData.globalEnabled" />

            <!-- Global settings when enabled -->
            <div v-if="formData.globalEnabled" class="q-gutter-md">
              <!-- Global Delivery Methods -->
              <q-select
                v-model="formData.globalDeliveryMethods"
                label="Глобални методи за доставка"
                :options="availableDeliveryMethods"
                outlined
                multiple
                use-chips
                emit-value
                map-options
                :rules="[val => val && val.length > 0 || 'Изберете поне един метод за доставка']"
              />

              <!-- Global Rate Limit -->
              <q-input
                v-model.number="formData.rateLimitMinutes"
                label="Глобално ограничение на честота (минути)"
                type="number"
                outlined
                :rules="[val => val > 0 || 'Ограничението трябва да бъде положително число']"
              >
                <template v-slot:hint>
                  Минимално време между известия за една и съща грешка
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Block Type Settings Card -->
      <q-card v-if="formData.globalEnabled">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="widgets" class="q-mr-sm" />Настройки по Блокове
          </div>

          <div class="text-body2 text-grey-6 q-mb-md">
            Конфигурирайте специфични настройки за различни типове блокове в системата за изпълнение на потоци.
          </div>

          <!-- Add Block Type Settings -->
          <div class="row q-gutter-md q-mb-md items-end">
            <q-select
              v-model="selectedBlockType"
              label="Тип блок"
              :options="availableBlockTypes"
              outlined
              style="flex: 1"
              :loading="loadingBlockTypes"
              emit-value
              map-options
            />
            <q-btn 
              color="primary" 
              icon="add" 
              label="ДОБАВИ БЛОК" 
              @click="addBlockTypeSettings"
              :disable="!selectedBlockType || isBlockTypeAdded(selectedBlockType)"
            />
          </div>

          <!-- Existing Block Type Settings -->
          <div v-if="Object.keys(formData.blockTypeSettings).length > 0" class="q-gutter-md">
            <q-expansion-item
              v-for="(blockTypeSetting, blockType) in formData.blockTypeSettings"
              :key="blockType"
              :icon="getBlockIcon(blockType)"
              :label="getBlockDisplayName(blockType)"
              header-class="text-weight-medium"
            >
              <q-card flat bordered>
                <q-card-section class="q-gutter-md">
                  <!-- Block Type Enable/Disable -->
                  <q-toggle
                    v-model="blockTypeSetting.enabled"
                    :label="`Прати автоматично уведомление при грешка`"
                    color="positive"
                  />

                  <div v-if="blockTypeSetting.enabled" class="q-gutter-md">
                    <!-- Message Template -->
                    <q-input
                      v-model="blockTypeSetting.messageTemplate"
                      label="Шаблон за съобщение"
                      outlined
                      type="textarea"
                      rows="3"
                      :rules="[val => val && val.trim() || 'Шаблонът за съобщение е задължителен']"
                    >
                      <template v-slot:append>
                        <q-icon 
                          name="help_outline" 
                          color="primary" 
                          size="sm"
                          class="cursor-pointer"
                        >
                          <q-tooltip class="bg-indigo text-body2" :offset="[10, 10]" max-width="350px">
                            <div class="text-weight-bold q-mb-sm">📝 Налични заместители:</div>
                            <div class="q-mb-xs"><code>&#123;&#123;blockType&#125;&#125;</code> - Тип блок (sensor, actuator, loop...)</div>
                            <div class="q-mb-xs"><code>&#123;&#123;errorMessage&#125;&#125;</code> - Съобщението за грешка</div>
                            <div class="q-mb-xs"><code>&#123;&#123;timestamp&#125;&#125;</code> - Време на грешката</div>
                            <div class="q-mb-sm"><code>&#123;&#123;blockId&#125;&#125;</code> - Уникален ID на блока</div>
                            
                            <div class="text-weight-bold q-mb-sm">🎨 Форматиране:</div>
                            <div class="q-mb-xs"><code>\n</code> - нов ред</div>
                            <div class="q-mb-xs"><code>\t</code> - табулация</div>
                            <div class="q-mb-sm">Може да използвате символи: <code>- * + | = _</code></div>
                            
                            <div class="text-weight-bold q-mb-sm">📌 Пример:</div>
                            <code class="text-grey-3">🔴 Грешка в &#123;&#123;blockType&#125;&#125; блок\n\n&#123;&#123;errorMessage&#125;&#125;\n\nВреме: &#123;&#123;timestamp&#125;&#125;</code>
                          </q-tooltip>
                        </q-icon>
                      </template>
                      <template v-slot:hint>
                        Кликнете на <q-icon name="help_outline" size="xs" /> за помощ с шаблони
                      </template>
                    </q-input>

                    <!-- Block Type Delivery Methods -->
                    <q-select
                      v-model="blockTypeSetting.deliveryMethods"
                      label="Методи за доставка"
                      :options="availableDeliveryMethods"
                      outlined
                      multiple
                      use-chips
                      emit-value
                      map-options
                      clearable
                    >
                      <template v-slot:hint>
                        Оставете празно за използване на глобалните методи
                      </template>
                    </q-select>

                    <!-- Block Type Rate Limit -->
                    <q-input
                      v-model.number="blockTypeSetting.rateLimitMinutes"
                      label="Ограничение на честота (минути)"
                      type="number"
                      outlined
                      clearable
                    >
                      <template v-slot:hint>
                        Оставете празно за използване на глобалното ограничение
                      </template>
                    </q-input>
                  </div>

                  <!-- Remove Block Type Settings -->
                  <div class="row justify-end">
                    <q-btn 
                      color="negative" 
                      icon="delete" 
                      label="Премахни настройки за блок тип" 
                      flat
                      @click="removeBlockTypeSettings(blockType)"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>

          <!-- No Block Type Settings -->
          <q-banner v-else class="bg-grey-2">
            <template v-slot:avatar>
              <q-icon name="info" color="info" />
            </template>
            <div class="text-body2">
              Няма настроени специфични настройки за блокове. Всички блокове ще използват глобалните настройки.
            </div>
          </q-banner>
        </q-card-section>
      </q-card>

      <!-- Save Button -->
      <div class="row justify-end q-mt-lg">
        <q-btn 
          color="primary" 
          icon="save" 
          label="Запази настройки" 
          @click="saveSettings"
          :loading="saving"
          size="lg"
        />
      </div>
    </div>

    <!-- Error State -->
    <q-card v-else>
      <q-card-section class="text-center q-pa-lg">
        <q-icon name="error" size="64px" color="negative" />
        <div class="text-h6 q-mt-md text-negative">Грешка при зареждане</div>
        <div class="text-body2 text-grey-6 q-mb-md">Не могат да бъдат заредени настройките за грешки</div>
        <q-btn color="primary" icon="refresh" label="Опитай отново" @click="$emit('reload')" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { notificationService } from '../../services/notificationService'
import type {
  ErrorNotificationSettings,
  NotificationProvider,
  ErrorNotificationSettingsFormData
} from '../../types'

// Props
interface Props {
  settings: ErrorNotificationSettings | null
  providers: NotificationProvider[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'update', data: ErrorNotificationSettingsFormData): void
  (e: 'reload'): void
}

const emit = defineEmits<Emits>()

const $q = useQuasar()

// State
const saving = ref(false)
const selectedBlockType = ref('')
const loadingBlockTypes = ref(false)
const availableBlockTypes = ref<Array<{label: string, value: string}>>([])

// Form data
const defaultFormData = (): ErrorNotificationSettingsFormData => ({
  globalEnabled: false,
  globalDeliveryMethods: [],
  rateLimitMinutes: 5,
  blockSettings: {},
  blockTypeSettings: {}
})

const formData = ref<ErrorNotificationSettingsFormData>(defaultFormData())

// Computed
const availableDeliveryMethods = computed(() => {
  const methods = new Set(props.providers.filter(p => p.isActive).map(p => p.type))
  return Array.from(methods).map(method => ({
    label: method === 'email' ? 'Email' : method.charAt(0).toUpperCase() + method.slice(1),
    value: method
  }))
})

// Methods
async function loadBlockTypes() {
  try {
    loadingBlockTypes.value = true
    // Use notificationService instead of direct fetch
    const response = await notificationService.getBlockTypes()
    console.log('Block types response:', response) // Debug log
    
    if (Array.isArray(response)) {
      availableBlockTypes.value = response.map((blockType: any) => ({
        label: blockType.name,
        value: blockType.type
      }))
    } else {
      console.error('Expected array but got:', typeof response, response)
    }
  } catch (error) {
    console.error('Error loading block types:', error)
  } finally {
    loadingBlockTypes.value = false
  }
}

function isBlockTypeAdded(blockType: string): boolean {
  return blockType in formData.value.blockTypeSettings
}

function addBlockTypeSettings() {
  if (!selectedBlockType.value || isBlockTypeAdded(selectedBlockType.value)) return

  formData.value.blockTypeSettings[selectedBlockType.value] = {
    enabled: true,
    messageTemplate: 'Flow execution error in block {{blockType}}: {{errorMessage}}',
    deliveryMethods: undefined,
    rateLimitMinutes: undefined
  }

  selectedBlockType.value = ''
}

function removeBlockTypeSettings(blockType: string) {
  $q.dialog({
    title: 'Потвърждение',
    message: `Сигурни ли сте, че искате да премахнете настройките за блок тип "${getBlockDisplayName(blockType)}"?`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(() => {
    delete formData.value.blockTypeSettings[blockType]
  })
}

function getBlockDisplayName(blockType: string): string {
  const blockTypeInfo = availableBlockTypes.value.find(bt => bt.value === blockType)
  return blockTypeInfo ? blockTypeInfo.label : blockType.toUpperCase()
}

async function saveSettings() {
  try {
    saving.value = true
    emit('update', formData.value)
  } catch (error) {
    // Error handling is done in parent component
  } finally {
    saving.value = false
  }
}

function getBlockIcon(blockType: string): string {
  const iconMap: Record<string, string> = {
    sensor: 'sensors',
    actuator: 'settings_input_component',
    loop: 'loop',
    if: 'rule',
    delay: 'hourglass_empty',
    goto: 'arrow_forward',
    merge: 'merge_type',
    start: 'play_circle',
    end: 'stop_circle',
    errorHandler: 'error_outline',
    setGlobalVar: 'public',
    setVarData: 'data_object',
    setVarName: 'label',
    container: 'folder'
  }

  return iconMap[blockType] || 'widgets'
}

// Watchers
watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    formData.value = {
      globalEnabled: newSettings.globalEnabled,
      globalDeliveryMethods: [...newSettings.globalDeliveryMethods],
      rateLimitMinutes: newSettings.rateLimitMinutes,
      blockSettings: JSON.parse(JSON.stringify(newSettings.blockSettings)),
      blockTypeSettings: JSON.parse(JSON.stringify(newSettings.blockTypeSettings || {}))
    }
  }
}, { immediate: true, deep: true })

// Load block types on component mount
loadBlockTypes()

// Update block settings delivery methods when global changes
watch(() => formData.value.globalDeliveryMethods, (newMethods) => {
  // Update all block settings that don't have custom delivery methods
  for (const blockType in formData.value.blockSettings) {
    const blockSetting = formData.value.blockSettings[blockType]
    if (blockSetting.deliveryMethods.length === 0) {
      blockSetting.deliveryMethods = [...newMethods]
    }
  }
}, { deep: true })

// Update available delivery methods if providers change
watch(() => props.providers, () => {
  const availableMethods = availableDeliveryMethods.value.map(m => m.value)
  
  // Filter global delivery methods
  formData.value.globalDeliveryMethods = formData.value.globalDeliveryMethods.filter(method => 
    availableMethods.includes(method)
  )
  
  // Filter block-specific delivery methods
  for (const blockType in formData.value.blockSettings) {
    const blockSetting = formData.value.blockSettings[blockType]
    blockSetting.deliveryMethods = blockSetting.deliveryMethods.filter(method => 
      availableMethods.includes(method)
    )
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.q-expansion-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
}

.q-banner {
  border-radius: 8px;
}
</style>