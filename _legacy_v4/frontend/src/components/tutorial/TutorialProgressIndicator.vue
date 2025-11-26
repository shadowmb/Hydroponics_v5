<template>
  <div v-if="isVisible" class="tutorial-progress-indicator" :class="indicatorClasses">
    <!-- Compact Mode (floating indicator) -->
    <div v-if="mode === 'compact'" class="progress-compact" @click="toggleExpanded">
      <div class="progress-compact-content">
        <q-circular-progress
          :value="progressValue"
          size="40px"
          :thickness="0.15"
          color="primary"
          track-color="grey-3"
          class="q-mr-sm"
        >
          <div class="progress-step-count">
            {{ currentStepIndex + 1 }}<br>
            <small>{{ totalSteps }}</small>
          </div>
        </q-circular-progress>

        <div class="progress-info">
          <div class="progress-title">{{ tutorialTitle }}</div>
          <div class="progress-subtitle">
            Стъпка {{ currentStepIndex + 1 }} от {{ totalSteps }}
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="more_vert"
          size="sm"
          @click.stop="showMenu"
          class="progress-menu-btn"
        >
          <q-menu>
            <q-list>
              <q-item clickable @click="showOverlay">
                <q-item-section avatar>
                  <q-icon name="visibility" />
                </q-item-section>
                <q-item-section>Покажи стъпката</q-item-section>
              </q-item>

              <q-item clickable @click="pauseTutorial">
                <q-item-section avatar>
                  <q-icon name="pause" />
                </q-item-section>
                <q-item-section>Пауза</q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable @click="exitTutorial">
                <q-item-section avatar>
                  <q-icon name="close" />
                </q-item-section>
                <q-item-section>Изход</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>

    <!-- Expanded Mode -->
    <div v-else-if="mode === 'expanded'" class="progress-expanded">
      <!-- Header -->
      <div class="progress-header">
        <div class="row items-center">
          <q-icon name="school" class="q-mr-sm" />
          <div class="col">
            <div class="progress-title">{{ tutorialTitle }}</div>
            <div class="progress-subtitle">Интерактивно ръководство</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="minimize"
            @click="toggleExpanded"
            size="sm"
          />
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-section">
        <div class="row items-center q-mb-sm">
          <span class="text-caption">Прогрес</span>
          <q-space />
          <span class="text-caption">{{ Math.round(progressValue * 100) }}%</span>
        </div>
        <q-linear-progress
          :value="progressValue"
          color="primary"
          track-color="grey-3"
          size="8px"
          rounded
        />
      </div>

      <!-- Steps List -->
      <div class="progress-steps">
        <div class="text-caption q-mb-sm text-weight-medium">Стъпки:</div>
        <div class="steps-list">
          <div
            v-for="(step, index) in stepsList"
            :key="index"
            class="step-item"
            :class="getStepClasses(index)"
            @click="goToStep(index)"
          >
            <div class="step-marker">
              <q-icon
                v-if="isStepCompleted(index)"
                name="check"
                size="sm"
                class="text-positive"
              />
              <q-icon
                v-else-if="index === currentStepIndex"
                name="play_arrow"
                size="sm"
                class="text-primary"
              />
              <span v-else class="step-number">{{ index + 1 }}</span>
            </div>
            <div class="step-title">{{ step.title }}</div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="progress-controls">
        <q-btn
          v-if="canGoPrevious"
          flat
          icon="arrow_back"
          label="Назад"
          @click="previousStep"
          size="sm"
          class="q-mr-sm"
        />

        <q-space />

        <q-btn
          v-if="!isLastStep"
          color="primary"
          icon-right="arrow_forward"
          label="Напред"
          @click="nextStep"
          size="sm"
        />

        <q-btn
          v-else
          color="positive"
          icon-right="check"
          label="Завърши"
          @click="completeTutorial"
          size="sm"
        />
      </div>
    </div>

    <!-- Inline Mode (for embedding in pages) -->
    <div v-else-if="mode === 'inline'" class="progress-inline">
      <q-card flat bordered>
        <q-card-section class="q-pb-sm">
          <div class="row items-center">
            <q-icon name="school" color="primary" class="q-mr-sm" />
            <div class="col">
              <div class="text-subtitle2 text-weight-medium">{{ tutorialTitle }}</div>
              <div class="text-caption text-grey-6">
                Стъпка {{ currentStepIndex + 1 }} от {{ totalSteps }}
              </div>
            </div>
            <q-circular-progress
              :value="progressValue"
              size="32px"
              :thickness="0.2"
              color="primary"
              track-color="grey-3"
            />
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-linear-progress
            :value="progressValue"
            color="primary"
            track-color="grey-3"
            size="6px"
            rounded
            class="q-mb-md"
          />

          <div class="row q-gutter-sm">
            <q-btn
              v-if="canGoPrevious"
              outline
              icon="arrow_back"
              label="Назад"
              @click="previousStep"
              size="sm"
            />

            <q-space />

            <q-btn
              flat
              icon="pause"
              label="Пауза"
              @click="pauseTutorial"
              size="sm"
            />

            <q-btn
              v-if="!isLastStep"
              color="primary"
              icon-right="arrow_forward"
              label="Напред"
              @click="nextStep"
              size="sm"
            />

            <q-btn
              v-else
              color="positive"
              icon-right="check"
              label="Завърши"
              @click="completeTutorial"
              size="sm"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTutorialStore } from '../../stores/tutorial'
import { useQuasar } from 'quasar'

// Props
interface Props {
  mode?: 'compact' | 'expanded' | 'inline'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  collapsible?: boolean
}

// Emits
interface Emits {
  (e: 'step-changed', stepIndex: number): void
  (e: 'tutorial-paused'): void
  (e: 'tutorial-completed'): void
  (e: 'tutorial-exited'): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'compact',
  position: 'bottom-right',
  collapsible: true
})

const emit = defineEmits<Emits>()

// Composables
const $q = useQuasar()
const tutorialStore = useTutorialStore()

// Local state
const isExpanded = ref(false)

// Computed properties
const isVisible = computed(() => tutorialStore.isActive && !tutorialStore.isOverlayVisible)
const currentStepIndex = computed(() => tutorialStore.currentStepIndex)
const totalSteps = computed(() => tutorialStore.totalSteps)
const canGoPrevious = computed(() => tutorialStore.canGoPrevious)
const isLastStep = computed(() => tutorialStore.isLastStep)
const tutorialTitle = computed(() => tutorialStore.currentTutorial?.title || 'Ръководство')
const stepsList = computed(() => tutorialStore.currentTutorial?.steps || [])
const completedSteps = computed(() => tutorialStore.completedSteps)

const progressValue = computed(() => {
  return totalSteps.value > 0 ? (currentStepIndex.value + 1) / totalSteps.value : 0
})

const indicatorClasses = computed(() => ({
  [`progress-indicator--${props.position}`]: props.mode === 'compact',
  'progress-indicator--expanded': isExpanded.value && props.mode === 'compact'
}))

// Methods
function toggleExpanded(): void {
  if (!props.collapsible) return
  isExpanded.value = !isExpanded.value
}

function showMenu(): void {
  // Menu is handled by q-menu in template
}

function showOverlay(): void {
  tutorialStore.showOverlay()
}

function pauseTutorial(): void {
  tutorialStore.hideOverlay()
  emit('tutorial-paused')

  $q.notify({
    type: 'info',
    message: 'Ръководството е на пауза',
    icon: 'pause'
  })
}

function exitTutorial(): void {
  $q.dialog({
    title: 'Изход от ръководството',
    message: 'Сигурни ли сте, че искате да излезете? Прогресът ще бъде запазен.',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await tutorialStore.exitTutorial()
    emit('tutorial-exited')
  })
}

async function nextStep(): Promise<void> {
  try {
    await tutorialStore.nextStep()
    emit('step-changed', tutorialStore.currentStepIndex)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при преминаване към следващата стъпка',
      icon: 'error'
    })
  }
}

async function previousStep(): Promise<void> {
  try {
    await tutorialStore.previousStep()
    emit('step-changed', tutorialStore.currentStepIndex)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при връщане към предишната стъпка',
      icon: 'error'
    })
  }
}

async function goToStep(stepIndex: number): Promise<void> {
  if (stepIndex === currentStepIndex.value) return

  try {
    await tutorialStore.goToStep(stepIndex)
    emit('step-changed', stepIndex)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при преминаване към стъпката',
      icon: 'error'
    })
  }
}

async function completeTutorial(): Promise<void> {
  try {
    const success = await tutorialStore.completeTutorial()
    if (success) {
      emit('tutorial-completed')
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при завършване на ръководството',
      icon: 'error'
    })
  }
}

function isStepCompleted(stepIndex: number): boolean {
  return completedSteps.value.includes(stepIndex)
}

function getStepClasses(stepIndex: number): string[] {
  const classes = []

  if (stepIndex === currentStepIndex.value) {
    classes.push('step-item--current')
  }

  if (isStepCompleted(stepIndex)) {
    classes.push('step-item--completed')
  }

  if (stepIndex < currentStepIndex.value) {
    classes.push('step-item--past')
  }

  if (stepIndex > currentStepIndex.value) {
    classes.push('step-item--future')
  }

  return classes
}
</script>

<style lang="scss" scoped>
.tutorial-progress-indicator {
  position: fixed;
  z-index: 9998;
  transition: all 0.3s ease;

  &--top-left {
    top: 20px;
    left: 20px;
  }

  &--top-right {
    top: 20px;
    right: 20px;
  }

  &--bottom-left {
    bottom: 20px;
    left: 20px;
  }

  &--bottom-right {
    bottom: 20px;
    right: 20px;
  }

  &--expanded {
    .progress-compact {
      transform: scale(1.05);
    }
  }
}

.progress-compact {
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 300px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .progress-compact-content {
    display: flex;
    align-items: center;
  }

  .progress-step-count {
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    line-height: 1;

    small {
      font-size: 8px;
      opacity: 0.7;
    }
  }

  .progress-info {
    flex: 1;
    min-width: 0;

    .progress-title {
      font-size: 14px;
      font-weight: 600;
      color: #424242;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .progress-subtitle {
      font-size: 12px;
      color: #757575;
      margin-top: 2px;
    }
  }

  .progress-menu-btn {
    margin-left: 8px;
  }
}

.progress-expanded {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 350px;
  max-height: 500px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .progress-header {
    margin-bottom: 16px;

    .progress-title {
      font-size: 16px;
      font-weight: 600;
      color: #424242;
    }

    .progress-subtitle {
      font-size: 12px;
      color: #757575;
      margin-top: 2px;
    }
  }

  .progress-bar-section {
    margin-bottom: 16px;
  }

  .progress-steps {
    flex: 1;
    min-height: 0;
    margin-bottom: 16px;

    .steps-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .step-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }

      &--current {
        background-color: rgba(#1976d2, 0.1);

        .step-title {
          font-weight: 600;
          color: #1976d2;
        }
      }

      &--completed {
        .step-title {
          color: #21ba45;
        }
      }

      &--past {
        opacity: 0.7;
      }

      &--future {
        opacity: 0.5;
      }

      .step-marker {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        background-color: #e0e0e0;
        flex-shrink: 0;

        .step-number {
          font-size: 12px;
          font-weight: 600;
          color: #757575;
        }
      }

      .step-title {
        font-size: 13px;
        line-height: 1.3;
        flex: 1;
        min-width: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .progress-controls {
    display: flex;
    align-items: center;
    border-top: 1px solid #e0e0e0;
    padding-top: 12px;
  }
}

.progress-inline {
  width: 100%;
}

// Responsive adjustments
@media (max-width: 600px) {
  .tutorial-progress-indicator {
    &--top-left,
    &--top-right {
      top: 10px;
      left: 10px;
      right: 10px;
    }

    &--bottom-left,
    &--bottom-right {
      bottom: 10px;
      left: 10px;
      right: 10px;
    }
  }

  .progress-compact {
    max-width: none;
  }

  .progress-expanded {
    width: calc(100vw - 20px);
    max-width: none;
  }
}
</style>