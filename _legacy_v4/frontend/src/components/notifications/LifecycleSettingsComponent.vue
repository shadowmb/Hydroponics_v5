<template>
  <div>
    <div class="text-h6 q-mb-md">Lifecycle Събития</div>

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
              v-model="formData.globalSettings.enabled"
              label="Активирай lifecycle събития глобално"
              color="positive"
              size="lg"
            />

            <q-separator v-if="formData.globalSettings.enabled" />

            <!-- Global settings when enabled -->
            <div v-if="formData.globalSettings.enabled" class="q-gutter-md">
              <!-- Global Delivery Methods -->
              <q-select
                v-model="formData.globalSettings.deliveryMethods"
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
                v-model.number="formData.globalSettings.rateLimitMinutes"
                label="Глобално ограничение на честота (минути)"
                type="number"
                outlined
                :rules="[val => val > 0 || 'Ограничението трябва да бъде положително число']"
              >
                <template v-slot:hint>
                  Минимално време между известия за едно и също lifecycle събитие
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Event Settings Card -->
      <q-card v-if="formData.globalSettings.enabled">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="timeline" class="q-mr-sm" />Настройки по Събития
          </div>

          <div class="text-body2 text-grey-6 q-mb-md">
            Конфигурирайте специфични настройки за различните lifecycle събития в системата.
          </div>

          <!-- Event Settings -->
          <div v-if="Object.keys(formData.eventSettings).length > 0" class="q-gutter-md">
            <q-expansion-item
              v-for="(eventSetting, eventType) in formData.eventSettings"
              :key="eventType"
              :icon="getEventIcon(eventType)"
              :label="getEventDisplayName(eventType)"
              header-class="text-weight-medium"
            >
              <q-card flat bordered>
                <q-card-section class="q-gutter-md">
                  <!-- Event Enable/Disable -->
                  <q-toggle
                    v-model="eventSetting.enabled"
                    :label="`Прати автоматично известие за ${getEventDisplayName(eventType).toLowerCase()}`"
                    color="positive"
                  />

                  <div v-if="eventSetting.enabled" class="q-gutter-md">
                    <!-- Message Template -->
                    <q-input
                      v-model="eventSetting.messageTemplate"
                      label="Шаблон за съобщение"
                      outlined
                      type="textarea"
                      rows="4"
                      :rules="[val => val && val.trim() || 'Шаблонът за съобщение е задължителен']"
                    >
                      <template v-slot:append>
                        <q-icon 
                          name="help_outline" 
                          color="primary" 
                          size="sm"
                          class="cursor-pointer"
                        >
                          <q-tooltip class="bg-indigo text-body2" :offset="[10, 10]" max-width="400px">
                            <div class="text-weight-bold q-mb-sm">📝 Налични заместители:</div>
                            <div class="q-mb-xs"><code>&#123;&#123;programName&#125;&#125;</code> - Име на програма</div>
                            <div class="q-mb-xs"><code>&#123;&#123;cycleId&#125;&#125;</code> - ID на цикъла</div>
                            <div class="q-mb-xs"><code>&#123;&#123;timestamp&#125;&#125;</code> - Време на събитието</div>
                            <div class="q-mb-xs"><code>&#123;&#123;startTime&#125;&#125;</code> - Начално време</div>
                            <div class="q-mb-xs"><code>&#123;&#123;completedTime&#125;&#125;</code> - Време на завършване</div>
                            <div class="q-mb-xs"><code>&#123;&#123;duration&#125;&#125;</code> - Продължителност</div>
                            <div class="q-mb-xs"><code>&#123;&#123;errorMessage&#125;&#125;</code> - Съобщение за грешка (само за failure събития)</div>
                            <div class="q-mb-xs"><code>&#123;&#123;deviceName&#125;&#125;</code> - Име на устройство (за connection събития)</div>
                            <div class="q-mb-sm"><code>&#123;&#123;deviceType&#125;&#125;</code> - Тип устройство (за connection събития)</div>
                            
                            <div class="text-weight-bold q-mb-sm">🎨 Форматиране:</div>
                            <div class="q-mb-xs"><code>\n</code> - нов ред</div>
                            <div class="q-mb-xs"><code>\t</code> - табулация</div>
                            <div class="q-mb-sm">Може да използвате символи: <code>- * + | = _</code></div>
                            
                            <div class="text-weight-bold q-mb-sm">📌 Пример:</div>
                            <code class="text-grey-3">🚀 Стартиран цикъл\n\nПрограма: &#123;&#123;programName&#125;&#125;\nЦикъл: &#123;&#123;cycleId&#125;&#125;\nВреме: &#123;&#123;startTime&#125;&#125;</code>
                          </q-tooltip>
                        </q-icon>
                      </template>
                      <template v-slot:hint>
                        Кликнете на <q-icon name="help_outline" size="xs" /> за помощ с шаблони
                      </template>
                    </q-input>

                    <!-- Event Delivery Methods -->
                    <q-select
                      v-model="eventSetting.deliveryMethods"
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

                    <!-- Event Rate Limit -->
                    <q-input
                      v-model.number="eventSetting.rateLimitMinutes"
                      label="Ограничение на честота (минути)"
                      type="number"
                      outlined
                      clearable
                    >
                      <template v-slot:hint>
                        Оставете празно за използване на глобалното ограничение
                      </template>
                    </q-input>

                    <!-- Additional Options -->
                    <div v-if="isEventTypeSupportsDetails(eventType)" class="q-gutter-sm">
                      <q-toggle
                        v-model="eventSetting.includeCycleDetails"
                        label="Включи подробности за цикъла"
                        color="positive"
                      />
                      <q-toggle
                        v-model="eventSetting.includeDeviceInfo"
                        label="Включи информация за устройствата"
                        color="positive"
                      />
                    </div>

                    <!-- Test Event Button -->
                    <div class="row justify-end">
                      <q-btn
                        color="accent"
                        icon="send"
                        label="Тестово Известие"
                        @click="testEvent(eventType)"
                        :loading="testingEvents[eventType]"
                        size="sm"
                        outline
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>

          <!-- No Event Settings (shouldn't happen with default data) -->
          <q-banner v-else class="bg-grey-2">
            <template v-slot:avatar>
              <q-icon name="info" color="info" />
            </template>
            <div class="text-body2">
              Няма налични lifecycle събития за конфигуриране.
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
        <div class="text-body2 text-grey-6 q-mb-md">Не могат да бъдат заредени настройките за lifecycle събития</div>
        <q-btn color="primary" icon="refresh" label="Опитай отново" @click="$emit('reload')" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import type {
  LifecycleNotificationSettings,
  NotificationProvider,
  LifecycleNotificationSettingsFormData,
  LifecycleEventSetting
} from '../../types'

// Props
interface Props {
  settings: LifecycleNotificationSettings | null
  providers: NotificationProvider[]
  loading: boolean
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'update', data: LifecycleNotificationSettingsFormData): void
  (e: 'test', eventType: string, context?: Record<string, any>): void
  (e: 'reload'): void
}

const emit = defineEmits<Emits>()

const $q = useQuasar()

// State
const saving = ref(false)
const testingEvents = ref<Record<string, boolean>>({})

// Form data
const defaultEventSetting = (): LifecycleEventSetting => ({
  enabled: false,
  messageTemplate: '',
  deliveryMethods: undefined,
  rateLimitMinutes: undefined,
  includeCycleDetails: false,
  includeDeviceInfo: false
})

const defaultFormData = (): LifecycleNotificationSettingsFormData => ({
  globalSettings: {
    enabled: false,
    rateLimitMinutes: 5,
    deliveryMethods: []
  },
  eventSettings: {
    cycle_start: {
      ...defaultEventSetting(),
      messageTemplate: '🚀 Стартиран цикъл\n\nПрограма: {{programName}}\nЦикъл: {{cycleId}}\nВреме: {{startTime}}'
    },
    cycle_success: {
      ...defaultEventSetting(),
      messageTemplate: '✅ Завършен цикъл успешно\n\nПрограма: {{programName}}\nЦикъл: {{cycleId}}\nПродължителност: {{duration}}'
    },
    cycle_failure: {
      ...defaultEventSetting(),
      messageTemplate: '❌ Цикъл завърши с грешка\n\nПрограма: {{programName}}\nЦикъл: {{cycleId}}\nГрешка: {{errorMessage}}\nВреме: {{failureTime}}'
    },
    controller_disconnect: {
      ...defaultEventSetting(),
      messageTemplate: '🔌 Загубена връзка с контролер\n\nУстройство: {{deviceName}}\nВреме: {{timestamp}}'
    },
    controller_reconnect: {
      ...defaultEventSetting(),
      messageTemplate: '🔗 Възстановена връзка с контролер\n\nУстройство: {{deviceName}}\nВреме: {{timestamp}}'
    },
    sensor_disconnect: {
      ...defaultEventSetting(),
      messageTemplate: '📡 Загубена връзка със сензор\n\nСензор: {{deviceName}}\nТип: {{deviceType}}\nВреме: {{timestamp}}'
    },
    sensor_reconnect: {
      ...defaultEventSetting(),
      messageTemplate: '📡 Възстановена връзка със сензор\n\nСензор: {{deviceName}}\nТип: {{deviceType}}\nВреме: {{timestamp}}'
    }
  }
})

const formData = ref<LifecycleNotificationSettingsFormData>(defaultFormData())

// Computed
const availableDeliveryMethods = computed(() => {
  const methods = new Set(props.providers.filter(p => p.isActive).map(p => p.type))
  return Array.from(methods).map(method => ({
    label: method === 'email' ? 'Email' : method.charAt(0).toUpperCase() + method.slice(1),
    value: method
  }))
})

// Event type display mappings
const eventTypeDisplayNames: Record<string, string> = {
  cycle_start: 'Стартиране на цикъл',
  cycle_success: 'Успешно завършване на цикъл', 
  cycle_failure: 'Неуспешно завършване на цикъл',
  controller_disconnect: 'Прекъсване на контролер',
  controller_reconnect: 'Възстановяване на контролер',
  sensor_disconnect: 'Прекъсване на сензор',
  sensor_reconnect: 'Възстановяване на сензор'
}

const eventTypeIcons: Record<string, string> = {
  cycle_start: 'play_circle',
  cycle_success: 'check_circle',
  cycle_failure: 'error',
  controller_disconnect: 'link_off',
  controller_reconnect: 'link',
  sensor_disconnect: 'sensors_off',
  sensor_reconnect: 'sensors'
}

// Methods
function getEventDisplayName(eventType: string): string {
  return eventTypeDisplayNames[eventType] || eventType.replace('_', ' ').toUpperCase()
}

function getEventIcon(eventType: string): string {
  return eventTypeIcons[eventType] || 'timeline'
}

function isEventTypeSupportsDetails(eventType: string): boolean {
  return ['cycle_start', 'cycle_success', 'cycle_failure'].includes(eventType)
}

async function testEvent(eventType: string) {
  try {
    testingEvents.value[eventType] = true
    
    // Create mock context based on event type
    let mockContext: Record<string, any> = {}
    
    switch (eventType) {
      case 'cycle_start':
        mockContext = {
          programName: 'Тест Програма',
          cycleId: 'cycle-test-' + Date.now(),
          startTime: new Date().toLocaleString('bg-BG'),
          expectedEndTime: new Date(Date.now() + 30*60*1000).toLocaleString('bg-BG')
        }
        break
      case 'cycle_success':
        mockContext = {
          programName: 'Тест Програма',
          cycleId: 'cycle-test-' + Date.now(),
          startTime: new Date(Date.now() - 15*60*1000).toLocaleString('bg-BG'),
          completedTime: new Date().toLocaleString('bg-BG'),
          duration: '15 мин'
        }
        break
      case 'cycle_failure':
        mockContext = {
          programName: 'Тест Програма',
          cycleId: 'cycle-test-' + Date.now(),
          startTime: new Date(Date.now() - 10*60*1000).toLocaleString('bg-BG'),
          failureTime: new Date().toLocaleString('bg-BG'),
          errorMessage: 'Тестова грешка за демонстрация'
        }
        break
      case 'controller_disconnect':
      case 'controller_reconnect':
        mockContext = {
          deviceName: 'Основен Контролер',
          deviceType: 'controller',
          timestamp: new Date().toLocaleString('bg-BG')
        }
        break
      case 'sensor_disconnect':
      case 'sensor_reconnect':
        mockContext = {
          deviceName: 'pH Сензор',
          deviceType: 'pH sensor',
          timestamp: new Date().toLocaleString('bg-BG')
        }
        break
    }
    
    emit('test', eventType, mockContext)
  } catch (error) {
    // Error handling is done in parent component
  } finally {
    testingEvents.value[eventType] = false
  }
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

// Watchers
watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    formData.value = {
      globalSettings: {
        enabled: newSettings.globalSettings.enabled,
        rateLimitMinutes: newSettings.globalSettings.rateLimitMinutes,
        deliveryMethods: [...newSettings.globalSettings.deliveryMethods]
      },
      eventSettings: {}
    }
    
    // Copy event settings with defaults for missing events
    const defaultData = defaultFormData()
    for (const eventType in defaultData.eventSettings) {
      if (newSettings.eventSettings[eventType]) {
        formData.value.eventSettings[eventType] = {
          ...defaultData.eventSettings[eventType],
          ...JSON.parse(JSON.stringify(newSettings.eventSettings[eventType]))
        }
      } else {
        formData.value.eventSettings[eventType] = { ...defaultData.eventSettings[eventType] }
      }
    }
  }
}, { immediate: true, deep: true })

// Update available delivery methods if providers change
watch(() => props.providers, () => {
  const availableMethods = availableDeliveryMethods.value.map(m => m.value)
  
  // Filter global delivery methods
  formData.value.globalSettings.deliveryMethods = formData.value.globalSettings.deliveryMethods.filter(method => 
    availableMethods.includes(method)
  )
  
  // Filter event-specific delivery methods
  for (const eventType in formData.value.eventSettings) {
    const eventSetting = formData.value.eventSettings[eventType]
    if (eventSetting.deliveryMethods) {
      eventSetting.deliveryMethods = eventSetting.deliveryMethods.filter(method => 
        availableMethods.includes(method)
      )
    }
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