<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="tutorial-dashboard">
      <!-- Header -->
      <q-card-section class="bg-hydro-green text-white">
        <div class="row items-center">
          <q-icon name="school" size="md" class="q-mr-md" />
          <div class="col">
            <div class="text-h5 text-weight-bold">Ръководства и Обучения</div>
            <div class="text-subtitle2">Научете как да използвате системата ефективно</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
            @click="closeDialog"
          />
        </div>
      </q-card-section>

      <!-- Loading State -->
      <q-inner-loading :showing="isLoading" color="hydro-green">
        <q-spinner-gears size="50px" />
        <div class="q-mt-md">Зареждане на ръководства...</div>
      </q-inner-loading>

      <!-- Error State -->
      <q-card-section v-if="errorMessage && !isLoading" class="text-center">
        <q-icon name="error" size="4rem" color="negative" />
        <div class="text-h6 q-mt-md">Грешка при зареждане</div>
        <div class="text-body2 text-grey-6 q-mb-md">{{ errorMessage }}</div>
        <q-btn color="primary" @click="retryLoad">Опитайте отново</q-btn>
      </q-card-section>

      <!-- Main Content -->
      <div v-if="!isLoading && !errorMessage" class="tutorial-content">
        <!-- Stats Overview -->
        <q-card-section class="q-pb-none">
          <div class="row q-gutter-md">
            <div class="col-md-3 col-sm-6 col-xs-12">
              <q-card flat bordered class="stat-card">
                <q-card-section class="text-center">
                  <q-icon name="library_books" size="2rem" color="primary" />
                  <div class="text-h6 q-mt-sm">{{ tutorialStats.total }}</div>
                  <div class="text-caption text-grey-6">Общо ръководства</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-md-3 col-sm-6 col-xs-12">
              <q-card flat bordered class="stat-card">
                <q-card-section class="text-center">
                  <q-icon name="check_circle" size="2rem" color="positive" />
                  <div class="text-h6 q-mt-sm">{{ tutorialStats.completed }}</div>
                  <div class="text-caption text-grey-6">Завършени</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-md-3 col-sm-6 col-xs-12">
              <q-card flat bordered class="stat-card">
                <q-card-section class="text-center">
                  <q-icon name="play_circle" size="2rem" color="warning" />
                  <div class="text-h6 q-mt-sm">{{ tutorialStats.inProgress }}</div>
                  <div class="text-caption text-grey-6">В прогрес</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-md-3 col-sm-6 col-xs-12">
              <q-card flat bordered class="stat-card">
                <q-card-section class="text-center">
                  <q-icon name="schedule" size="2rem" color="info" />
                  <div class="text-h6 q-mt-sm">{{ tutorialStats.available }}</div>
                  <div class="text-caption text-grey-6">Достъпни</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <!-- Category Tabs -->
        <q-card-section>
          <q-tabs
            v-model="activeCategory"
            dense
            class="text-grey-6"
            active-color="hydro-green"
            indicator-color="hydro-green"
            align="justify"
          >
            <q-tab name="all" label="Всички" icon="grid_view" />
            <q-tab name="devices" label="Устройства" icon="devices" />
            <q-tab name="flow-editor" label="Flow Editor" icon="account_tree" />
            <q-tab name="dashboard" label="Табло" icon="dashboard" />
            <q-tab name="programs" label="Програми" icon="science" />
            <q-tab name="monitoring" label="Мониторинг" icon="analytics" />
          </q-tabs>

          <q-separator class="q-mt-md" />
        </q-card-section>

        <!-- Tutorial Cards -->
        <q-card-section class="q-pt-none">
          <q-tab-panels v-model="activeCategory" animated>
            <!-- All Tutorials -->
            <q-tab-panel name="all" class="q-pa-none">
              <div class="row q-gutter-md">
                <div
                  v-for="tutorial in availableTutorials"
                  :key="tutorial._id"
                  class="col-lg-4 col-md-6 col-sm-12"
                >
                  <tutorial-card
                    :tutorial="tutorial"
                    :progress="getTutorialProgress(tutorial.id)"
                    @start="startTutorial"
                    @continue="continueTutorial"
                    @restart="restartTutorial"
                  />
                </div>
              </div>
            </q-tab-panel>

            <!-- Category-specific panels -->
            <q-tab-panel
              v-for="category in categories"
              :key="category"
              :name="category"
              class="q-pa-none"
            >
              <div class="row q-gutter-md">
                <div
                  v-for="tutorial in tutorialsByCategory(category)"
                  :key="tutorial._id"
                  class="col-lg-4 col-md-6 col-sm-12"
                >
                  <tutorial-card
                    :tutorial="tutorial"
                    :progress="getTutorialProgress(tutorial.id)"
                    @start="startTutorial"
                    @continue="continueTutorial"
                    @restart="restartTutorial"
                  />
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="tutorialsByCategory(category).length === 0" class="text-center q-pa-xl">
                <q-icon name="inbox" size="4rem" color="grey-4" />
                <div class="text-h6 q-mt-md text-grey-6">Няма ръководства</div>
                <div class="text-body2 text-grey-5">
                  В тази категория все още няма налични ръководства
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </div>

      <!-- Footer Actions -->
      <q-card-section class="q-pt-none">
        <q-separator class="q-mb-md" />
        <div class="row items-center">
          <div class="col">
            <q-btn
              flat
              color="negative"
              icon="refresh"
              label="Нулиране на прогрес"
              @click="confirmReset"
              :disable="tutorialStats.completed === 0"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              icon="help"
              label="Помощ"
              @click="showHelp"
              class="q-mr-sm"
            />
            <q-btn
              color="hydro-green"
              icon="close"
              label="Затвори"
              v-close-popup
              @click="closeDialog"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTutorialStore } from '../../stores/tutorial'
import { Tutorial, TutorialProgress } from '../../services/tutorial-service'
import { useQuasar } from 'quasar'
import TutorialCard from './TutorialCard.vue'

// Props & Emits
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'tutorial-started', tutorialId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const $q = useQuasar()
const tutorialStore = useTutorialStore()

// Local state
const activeCategory = ref('all')
const tutorialProgressMap = ref<Map<string, TutorialProgress>>(new Map())
const tutorialStats = ref({
  total: 0,
  completed: 0,
  inProgress: 0,
  available: 0
})

// Categories for tabs
const categories = ['devices', 'flow-editor', 'dashboard', 'programs', 'monitoring']

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const isLoading = computed(() => tutorialStore.isLoading)
const errorMessage = computed(() => tutorialStore.errorMessage)
const availableTutorials = computed(() => tutorialStore.availableTutorials)

const tutorialsByCategory = computed(() => {
  return (category: string) => tutorialStore.tutorialsByCategory(category)
})

// Methods
async function loadTutorials(): Promise<void> {
  try {
    await tutorialStore.loadTutorials()
    await loadTutorialStats()
  } catch (error) {
    console.error('Failed to load tutorials:', error)
  }
}

async function loadTutorialStats(): Promise<void> {
  try {
    // TODO: Implement user ID management
    const { tutorialApi } = await import('../../services/tutorial-service')
    const stats = await tutorialApi.getStats()
    if (stats) {
      tutorialStats.value = stats
    }
  } catch (error) {
    console.error('Failed to load tutorial stats:', error)
    // Set default stats if API fails
    tutorialStats.value = {
      total: tutorialStore.tutorials.length,
      completed: 0,
      inProgress: 0,
      available: tutorialStore.tutorials.length
    }
  }
}

function getTutorialProgress(tutorialId: string): TutorialProgress | null {
  return tutorialProgressMap.value.get(tutorialId) || null
}

async function startTutorial(tutorial: Tutorial): Promise<void> {
  try {
    const success = await tutorialStore.startTutorial(tutorial.id)
    if (success) {
      emit('tutorial-started', tutorial.id)
      closeDialog()

      $q.notify({
        type: 'positive',
        message: `Започват ръководството "${tutorial.title}"`,
        icon: 'school'
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при стартиране на ръководството',
      icon: 'error'
    })
  }
}

async function continueTutorial(tutorial: Tutorial): Promise<void> {
  try {
    const progress = getTutorialProgress(tutorial.id)
    if (progress) {
      await tutorialStore.startTutorial(tutorial.id)
      emit('tutorial-started', tutorial.id)
      closeDialog()

      $q.notify({
        type: 'info',
        message: `Продължавате ръководството "${tutorial.title}"`,
        icon: 'play_arrow'
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при продължаване на ръководството',
      icon: 'error'
    })
  }
}

async function restartTutorial(tutorial: Tutorial): Promise<void> {
  $q.dialog({
    title: 'Рестартиране на ръководството',
    message: `Сигурни ли сте, че искате да рестартирате "${tutorial.title}"? Целият прогрес ще бъде изгубен.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      const success = await tutorialStore.startTutorial(tutorial.id, undefined, true)
      if (success) {
        emit('tutorial-started', tutorial.id)
        closeDialog()

        $q.notify({
          type: 'positive',
          message: `Рестартирахте ръководството "${tutorial.title}"`,
          icon: 'refresh'
        })
      }
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Грешка при рестартиране на ръководството',
        icon: 'error'
      })
    }
  })
}

function confirmReset(): void {
  $q.dialog({
    title: 'Нулиране на всички данни',
    message: 'Сигурни ли сте, че искате да нулирате целия прогрес за всички ръководства? Това действие е необратимо.',
    cancel: true,
    persistent: true,
    focus: 'cancel'
  }).onOk(async () => {
    try {
      await tutorialStore.resetAll()
      await loadTutorialStats()

      $q.notify({
        type: 'positive',
        message: 'Прогресът е нулиран успешно',
        icon: 'check'
      })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Грешка при нулиране на прогреса',
        icon: 'error'
      })
    }
  })
}

function showHelp(): void {
  $q.dialog({
    title: 'Помощ за ръководствата',
    message: `
      Ръководствата са интерактивни уроци, които ви показват как да използвате системата.

      • Кликнете "Започни" за да стартирате ново ръководство
      • Кликнете "Продължи" за да продължите започнато ръководство
      • Използвайте "Рестартирай" за да започнете отначало

      Всяко ръководство е с различна трудност и продължителност.
      Препоръчваме да започнете с ръководствата за начинаещи.
    `,
    html: true
  })
}

function retryLoad(): void {
  tutorialStore.clearError()
  loadTutorials()
}

function closeDialog(): void {
  emit('update:modelValue', false)
}

// Watch for dialog opening
watch(isOpen, (newVal) => {
  if (newVal) {
    loadTutorials()
  }
})

// Lifecycle
onMounted(() => {
  if (isOpen.value) {
    loadTutorials()
  }
})
</script>

<style lang="scss" scoped>
.tutorial-dashboard {
  .tutorial-content {
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  .stat-card {
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

.q-tab-panels {
  min-height: 400px;
}
</style>