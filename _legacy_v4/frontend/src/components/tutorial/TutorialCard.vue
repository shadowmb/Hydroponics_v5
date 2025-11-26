<template>
  <q-card class="tutorial-card" :class="cardClasses">
    <!-- Tutorial Image/Icon -->
    <div class="tutorial-header" :class="headerClasses">
      <q-icon :name="categoryIcon" size="3rem" class="text-white" />
      <div class="tutorial-overlay">
        <q-chip
          :color="difficultyColor"
          text-color="white"
          size="sm"
          :icon="difficultyIcon"
        >
          {{ difficultyLabel }}
        </q-chip>
      </div>
    </div>

    <!-- Card Content -->
    <q-card-section>
      <div class="text-h6 text-weight-bold q-mb-sm">{{ tutorial.title }}</div>
      <div class="text-body2 text-grey-6 q-mb-md line-clamp-3">
        {{ tutorial.description }}
      </div>

      <!-- Tutorial Info -->
      <div class="tutorial-info q-mb-md">
        <div class="row items-center q-gutter-sm">
          <q-icon name="schedule" size="sm" class="text-grey-5" />
          <span class="text-caption text-grey-6">
            {{ tutorial.estimatedMinutes }} мин
          </span>
          <q-space />
          <q-icon name="quiz" size="sm" class="text-grey-5" />
          <span class="text-caption text-grey-6">
            {{ tutorial.steps?.length || 0 }} стъпки
          </span>
        </div>
      </div>

      <!-- Progress Bar (if in progress) -->
      <div v-if="progress && progress.status === 'in_progress'" class="q-mb-md">
        <div class="row items-center q-mb-xs">
          <span class="text-caption text-grey-6">Прогрес</span>
          <q-space />
          <span class="text-caption text-grey-6">
            {{ progress.completedSteps?.length || 0 }} / {{ tutorial.steps?.length || 0 }}
          </span>
        </div>
        <q-linear-progress
          :value="progressValue"
          color="primary"
          track-color="grey-3"
          size="8px"
          rounded
        />
      </div>

      <!-- Tags -->
      <div v-if="tutorial.tags && tutorial.tags.length > 0" class="q-mb-md">
        <q-chip
          v-for="tag in tutorial.tags.slice(0, 3)"
          :key="tag"
          size="sm"
          color="grey-2"
          text-color="grey-7"
          class="q-mr-xs"
        >
          {{ tag }}
        </q-chip>
      </div>

      <!-- Prerequisites Warning -->
      <div v-if="hasUnmetPrerequisites" class="q-mb-md">
        <q-banner inline-actions class="text-orange bg-orange-1 rounded-borders">
          <template v-slot:avatar>
            <q-icon name="info" color="orange" />
          </template>
          Изисква завършване на други ръководства
        </q-banner>
      </div>
    </q-card-section>

    <!-- Action Buttons -->
    <q-card-actions class="q-px-md q-pb-md">
      <!-- Not Started -->
      <template v-if="!progress || progress.status === 'not_started'">
        <q-btn
          color="primary"
          :label="hasUnmetPrerequisites ? 'Недостъпно' : 'Започни'"
          icon="play_arrow"
          :disable="hasUnmetPrerequisites"
          @click="$emit('start', tutorial)"
          class="full-width"
        />
      </template>

      <!-- In Progress -->
      <template v-else-if="progress.status === 'in_progress'">
        <q-btn
          color="primary"
          label="Продължи"
          icon="play_arrow"
          @click="$emit('continue', tutorial)"
          class="col"
        />
        <q-btn
          flat
          color="grey-6"
          icon="refresh"
          @click="$emit('restart', tutorial)"
          class="q-ml-sm"
        >
          <q-tooltip>Рестартирай</q-tooltip>
        </q-btn>
      </template>

      <!-- Completed -->
      <template v-else-if="progress.status === 'completed'">
        <div class="row items-center full-width">
          <q-icon name="check_circle" color="positive" size="sm" />
          <span class="q-ml-sm text-positive text-weight-medium">Завършено</span>
          <q-space />
          <q-btn
            flat
            color="grey-6"
            icon="refresh"
            size="sm"
            @click="$emit('restart', tutorial)"
          >
            <q-tooltip>Рестартирай</q-tooltip>
          </q-btn>
        </div>
      </template>

      <!-- Skipped -->
      <template v-else-if="progress.status === 'skipped'">
        <q-btn
          outline
          color="grey-6"
          label="Прескочено"
          icon="skip_next"
          @click="$emit('start', tutorial)"
          class="col"
        />
        <q-btn
          flat
          color="grey-6"
          icon="refresh"
          @click="$emit('restart', tutorial)"
          class="q-ml-sm"
        >
          <q-tooltip>Рестартирай</q-tooltip>
        </q-btn>
      </template>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tutorial, TutorialProgress } from '../../services/tutorial-service'

// Props
interface Props {
  tutorial: Tutorial
  progress?: TutorialProgress | null
}

// Emits
interface Emits {
  (e: 'start', tutorial: Tutorial): void
  (e: 'continue', tutorial: Tutorial): void
  (e: 'restart', tutorial: Tutorial): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Computed properties
const cardClasses = computed(() => ({
  'tutorial-card--completed': props.progress?.status === 'completed',
  'tutorial-card--in-progress': props.progress?.status === 'in_progress',
  'tutorial-card--disabled': hasUnmetPrerequisites.value
}))

const headerClasses = computed(() => {
  const baseClass = 'tutorial-header--'
  switch (props.tutorial.category) {
    case 'basics': return baseClass + 'basics'
    case 'advanced': return baseClass + 'advanced'
    case 'troubleshooting': return baseClass + 'troubleshooting'
    case 'maintenance': return baseClass + 'maintenance'
    default: return baseClass + 'default'
  }
})

const categoryIcon = computed(() => {
  switch (props.tutorial.category) {
    case 'basics': return 'school'
    case 'advanced': return 'psychology'
    case 'troubleshooting': return 'build'
    case 'maintenance': return 'settings'
    default: return 'help'
  }
})

const difficultyColor = computed(() => {
  switch (props.tutorial.category) {
    case 'basics': return 'positive'
    case 'advanced': return 'negative'
    case 'troubleshooting': return 'warning'
    case 'maintenance': return 'info'
    default: return 'grey'
  }
})

const difficultyIcon = computed(() => {
  switch (props.tutorial.category) {
    case 'basics': return 'trending_up'
    case 'advanced': return 'trending_down'
    case 'troubleshooting': return 'build'
    case 'maintenance': return 'settings'
    default: return 'help'
  }
})

const difficultyLabel = computed(() => {
  switch (props.tutorial.category) {
    case 'basics': return 'Основни'
    case 'advanced': return 'Напреднали'
    case 'troubleshooting': return 'Отстраняване'
    case 'maintenance': return 'Поддръжка'
    default: return 'Неизвестно'
  }
})

const progressValue = computed(() => {
  if (!props.progress || !props.progress.completedSteps || !props.tutorial.steps?.length) return 0
  return props.progress.completedSteps.length / props.tutorial.steps.length
})

const hasUnmetPrerequisites = computed(() => {
  // TODO: Implement proper prerequisite checking
  // For now, assume all prerequisites are met
  return false
})
</script>

<style lang="scss" scoped>
.tutorial-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  &--completed {
    border-left: 4px solid #21ba45;
  }

  &--in-progress {
    border-left: 4px solid #1976d2;
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

.tutorial-header {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &--basics {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  &--advanced {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }

  &--troubleshooting {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &--maintenance {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  .tutorial-overlay {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}

.tutorial-info {
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 0;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  max-height: calc(1.4em * 3);
}

.q-card-section {
  flex: 1;
}

.q-card-actions {
  margin-top: auto;
}
</style>