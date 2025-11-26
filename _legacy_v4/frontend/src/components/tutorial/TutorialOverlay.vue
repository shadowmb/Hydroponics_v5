<template>
  <!-- Main Tutorial Overlay -->
  <div
    v-if="isVisible && currentStep"
    class="tutorial-overlay"
    :class="{ 'tutorial-overlay--active': isVisible }"
  >
    <!-- Backdrop - 4 sections around highlighted element -->
    <template v-if="highlightedElement">
      <!-- Top backdrop -->
      <div class="tutorial-backdrop tutorial-backdrop--top" :style="backdropTopStyle" />
      <!-- Right backdrop -->
      <div class="tutorial-backdrop tutorial-backdrop--right" :style="backdropRightStyle" />
      <!-- Bottom backdrop -->
      <div class="tutorial-backdrop tutorial-backdrop--bottom" :style="backdropBottomStyle" />
      <!-- Left backdrop -->
      <div class="tutorial-backdrop tutorial-backdrop--left" :style="backdropLeftStyle" />
    </template>

    <!-- Full backdrop when no element highlighted -->
    <div v-else class="tutorial-backdrop" @click="handleBackdropClick" />

    <!-- Highlighted Element Outline -->
    <div
      v-if="highlightedElement"
      class="tutorial-highlight"
      :style="highlightStyle"
    />

    <!-- Tutorial Step Card -->
    <div
      ref="stepCard"
      class="tutorial-step-card"
      :style="stepCardStyle"
      :class="stepCardClasses"
    >
      <!-- Step Header - Draggable -->
      <div
        class="tutorial-step-header"
        @mousedown="startDrag"
        style="cursor: move;"
      >
        <div class="row items-center">
          <div class="col">
            <div class="tutorial-step-number">
              Стъпка {{ currentStepIndex + 1 }} от {{ totalSteps }}
            </div>
            <div class="tutorial-step-title">{{ currentStep.title }}</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="exitTutorial"
            class="text-white"
          />
        </div>
      </div>

      <!-- Step Content -->
      <div class="tutorial-step-content">
        <div class="tutorial-step-description">
          {{ currentStep.description }}
        </div>

        <!-- Action Instructions -->
        <div v-if="currentStep.action" class="tutorial-action-hint q-mt-md">
          <q-icon :name="actionIcon" class="q-mr-sm" />
          <span>{{ actionText }}</span>
        </div>

        <!-- Additional Information -->
        <div v-if="currentStep.actionData?.info" class="tutorial-extra-info q-mt-md">
          <q-expansion-item
            icon="info"
            label="Допълнителна информация"
            class="tutorial-expansion"
          >
            <div class="q-pa-md">
              {{ currentStep.actionData.info }}
            </div>
          </q-expansion-item>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="tutorial-progress q-mt-md">
        <q-linear-progress
          :value="progressValue"
          color="white"
          track-color="rgba(255,255,255,0.3)"
          size="4px"
          rounded
        />
        <div class="tutorial-progress-text q-mt-xs">
          {{ Math.round(progressValue * 100) }}% завършено
        </div>
      </div>

      <!-- Navigation Controls -->
      <div class="tutorial-controls q-mt-lg">
        <div class="row q-gutter-sm">
          <!-- Previous Button -->
          <q-btn
            v-if="canGoPrevious"
            outline
            color="white"
            :label="currentStep.prevButtonText || 'Назад'"
            icon="arrow_back"
            @click="previousStep"
            class="col-auto"
          />

          <!-- Skip Button (if optional) -->
          <q-btn
            v-if="currentStep.skipable"
            flat
            color="white"
            label="Прескочи"
            @click="skipStep"
            class="col-auto"
          />

          <q-space />

          <!-- Next/Complete Button -->
          <q-btn
            v-if="!isLastStep"
            color="white"
            text-color="primary"
            :label="currentStep.nextButtonText || 'Напред'"
            icon-right="arrow_forward"
            @click="nextStep"
            :disable="!canProceed"
            class="col-auto"
          />

          <q-btn
            v-else
            color="white"
            text-color="positive"
            label="Завърши"
            icon-right="check"
            @click="completeTutorial"
            :disable="!canProceed"
            class="col-auto"
          />
        </div>
      </div>
    </div>

    <!-- Demo Mode Indicator -->
    <div v-if="isDemoMode" class="demo-mode-indicator">
      <q-chip color="orange" text-color="white" icon="science">
        Демо режим активен
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useTutorialStore } from '../../stores/tutorial'
import { useQuasar } from 'quasar'
import { tutorialEngine } from '../../services/tutorial-engine'
import { validationEngine } from '../../services/tutorial-validation-engine'

// Composables
const $q = useQuasar()
const tutorialStore = useTutorialStore()

// Local state
const highlightedElement = ref<HTMLElement | null>(null)
const elementPosition = ref({ top: 0, left: 0, width: 0, height: 0 })
const canProceed = ref(true)
const isValidating = ref(false)
const stepCard = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const cardPosition = ref({ x: 0, y: 0 })

// Computed properties
const isVisible = computed(() => tutorialStore.isOverlayVisible)
const currentStep = computed(() => tutorialStore.currentStep)
const currentStepIndex = computed(() => tutorialStore.currentStepIndex)
const totalSteps = computed(() => tutorialStore.totalSteps)
const canGoPrevious = computed(() => tutorialStore.canGoPrevious)
const isLastStep = computed(() => tutorialStore.isLastStep)
const isDemoMode = computed(() => tutorialStore.isDemoMode)

const progressValue = computed(() => {
  return (currentStepIndex.value + 1) / totalSteps.value
})

const actionIcon = computed(() => {
  if (!currentStep.value?.action) return 'help'

  switch (currentStep.value.action) {
    case 'click': return 'touch_app'
    case 'hover': return 'mouse'
    case 'input': return 'keyboard'
    case 'navigate': return 'navigation'
    case 'wait': return 'schedule'
    default: return 'help'
  }
})

const actionText = computed(() => {
  if (!currentStep.value?.action) return ''

  switch (currentStep.value.action) {
    case 'click': return 'Кликнете на обозначения елемент'
    case 'hover': return 'Задръжте мишката над елемента'
    case 'input': return 'Въведете информация в полето'
    case 'navigate': return 'Отидете на указаната страница'
    case 'wait': return 'Изчакайте да се извърши действието'
    default: return 'Следвайте инструкциите'
  }
})

const highlightStyle = computed(() => {
  if (!highlightedElement.value) return {}

  const padding = 8
  return {
    top: `${elementPosition.value.top - padding}px`,
    left: `${elementPosition.value.left - padding}px`,
    width: `${elementPosition.value.width + padding * 2}px`,
    height: `${elementPosition.value.height + padding * 2}px`
  }
})

// Backdrop sections (4-piece backdrop around highlighted element)
const backdropTopStyle = computed(() => {
  const padding = 8
  const y = elementPosition.value.top - padding
  return {
    top: '0',
    left: '0',
    right: '0',
    height: `${y}px`
  }
})

const backdropRightStyle = computed(() => {
  const padding = 8
  const x = elementPosition.value.left - padding
  const y = elementPosition.value.top - padding
  const width = elementPosition.value.width + padding * 2
  const height = elementPosition.value.height + padding * 2
  return {
    top: `${y}px`,
    left: `${x + width}px`,
    right: '0',
    height: `${height}px`
  }
})

const backdropBottomStyle = computed(() => {
  const padding = 8
  const y = elementPosition.value.top - padding
  const height = elementPosition.value.height + padding * 2
  return {
    top: `${y + height}px`,
    left: '0',
    right: '0',
    bottom: '0'
  }
})

const backdropLeftStyle = computed(() => {
  const padding = 8
  const x = elementPosition.value.left - padding
  const y = elementPosition.value.top - padding
  const height = elementPosition.value.height + padding * 2
  return {
    top: `${y}px`,
    left: '0',
    width: `${x}px`,
    height: `${height}px`
  }
})

const stepCardStyle = computed(() => {
  // If dragging, use custom position
  if (isDragging.value || (cardPosition.value.x !== 0 || cardPosition.value.y !== 0)) {
    return {
      top: `${cardPosition.value.y}px`,
      left: `${cardPosition.value.x}px`,
      transform: 'none'
    }
  }

  if (!highlightedElement.value || !currentStep.value) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const cardWidth = 420
  const cardHeight = 350
  const padding = 30 // More padding for manual guidance mode
  const position = currentStep.value.position

  let top = 0
  let left = 0

  switch (position) {
    case 'top':
      top = elementPosition.value.top - cardHeight - padding
      left = elementPosition.value.left + elementPosition.value.width / 2 - cardWidth / 2
      break
    case 'bottom':
      top = elementPosition.value.top + elementPosition.value.height + padding
      left = elementPosition.value.left + elementPosition.value.width / 2 - cardWidth / 2
      break
    case 'left':
      top = elementPosition.value.top + elementPosition.value.height / 2 - cardHeight / 2
      left = elementPosition.value.left - cardWidth - padding
      break
    case 'right':
      // Position card to the right of dialog, not element
      // This keeps card outside dialog for manual guidance
      top = Math.max(100, elementPosition.value.top)
      left = elementPosition.value.left + elementPosition.value.width + padding
      break
    case 'center':
    default:
      top = window.innerHeight / 2 - cardHeight / 2
      left = window.innerWidth / 2 - cardWidth / 2
      break
  }

  // Ensure card stays within viewport with more margin
  const topMargin = 20
  const bottomMargin = 20
  const sideMargin = 20

  top = Math.max(topMargin, Math.min(top, window.innerHeight - cardHeight - bottomMargin))
  left = Math.max(sideMargin, Math.min(left, window.innerWidth - cardWidth - sideMargin))

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: 'none'
  }
})

const stepCardClasses = computed(() => ({
  [`tutorial-step-card--${currentStep.value?.position || 'center'}`]: true
}))

// Methods
async function updateElementPosition(retries = 3): Promise<void> {
  console.log('[TutorialOverlay] updateElementPosition called, retries:', retries)
  const selector = currentStep.value?.targetSelector || currentStep.value?.targetElement
  console.log('[TutorialOverlay] Selector:', selector)
  if (!selector) {
    console.log('[TutorialOverlay] No selector, setting highlightedElement to null')
    highlightedElement.value = null
    return
  }

  try {
    const element = tutorialEngine.findElement(selector)
    console.log('[TutorialOverlay] findElement returned:', element)
    if (element) {
      highlightedElement.value = element
      console.log('[TutorialOverlay] highlightedElement set to:', element)
      const position = tutorialEngine.getElementPosition(element)
      elementPosition.value = position
      console.log('[TutorialOverlay] Element position:', position)
      tutorialEngine.scrollToElement(element)
    } else {
      // Retry after delay if element not found (async rendering)
      if (retries > 0) {
        console.log(`[TutorialOverlay] Element not found, retrying... (${retries} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 300))
        await updateElementPosition(retries - 1)
      } else {
        console.warn(`Tutorial target element not found after retries: ${selector}`)
        highlightedElement.value = null
      }
    }
  } catch (error) {
    console.error('Error finding tutorial target element:', error)
    highlightedElement.value = null
  }
}

function handleBackdropClick(): void {
  // Don't close on backdrop click during tutorial
  // Users should use navigation controls or close button
}

// Auto-fill removed - tutorial now uses manual guidance mode
// Users fill fields manually following tutorial instructions

function startDrag(event: MouseEvent): void {
  // Don't drag if clicking on close button
  if ((event.target as HTMLElement).closest('.q-btn')) return

  isDragging.value = true
  const card = stepCard.value
  if (!card) return

  const rect = card.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  // If card position is not set yet, use current computed position
  if (cardPosition.value.x === 0 && cardPosition.value.y === 0) {
    cardPosition.value = {
      x: rect.left,
      y: rect.top
    }
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent): void {
  if (!isDragging.value) return

  cardPosition.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  }
}

function stopDrag(): void {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

async function nextStep(): Promise<void> {
  if (!canProceed.value) return

  try {
    await tutorialStore.nextStep()
    await nextTick()
    // Reset card position for new step
    cardPosition.value = { x: 0, y: 0 }
    updateElementPosition()
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
    await nextTick()
    updateElementPosition()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при връщане към предишната стъпка',
      icon: 'error'
    })
  }
}

async function skipStep(): Promise<void> {
  $q.dialog({
    title: 'Прескачане на стъпка',
    message: 'Сигурни ли сте, че искате да прескочите тази стъпка?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await nextStep()
  })
}

async function completeTutorial(): Promise<void> {
  try {
    const success = await tutorialStore.completeTutorial()
    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Поздравления! Завършихте ръководството успешно!',
        icon: 'celebration',
        timeout: 3000
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Грешка при завършване на ръководството',
      icon: 'error'
    })
  }
}

function exitTutorial(): void {
  // Force close any existing dialogs and clean up
  cleanupDialogs()

  // Temporarily lower tutorial overlay z-index so dialog appears on top
  const overlay = document.querySelector('.tutorial-overlay') as HTMLElement
  if (overlay) {
    overlay.style.zIndex = '1000'
  }

  $q.dialog({
    title: 'Изход от ръководството',
    message: 'Сигурни ли сте, че искате да излезете? Прогресът ще бъде запазен.',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await tutorialStore.exitTutorial()
  }).onCancel(() => {
    // Restore original z-index if user cancels
    if (overlay) {
      overlay.style.zIndex = '9999'
    }
  }).onDismiss(() => {
    // Restore original z-index when dialog is dismissed
    if (overlay) {
      overlay.style.zIndex = '9999'
    }
  })
}

function cleanupDialogs(): void {
  // Close all existing dialogs
  const dialogs = document.querySelectorAll('.q-dialog')
  dialogs.forEach(dialog => {
    const dialogElement = dialog as HTMLElement
    if (dialogElement && dialogElement.parentNode) {
      dialogElement.parentNode.removeChild(dialogElement)
    }
  })

  // Close all portals
  const portals = document.querySelectorAll('[id^="q-portal--dialog"]')
  portals.forEach(portal => {
    const portalElement = portal as HTMLElement
    if (portalElement && portalElement.parentNode) {
      portalElement.parentNode.removeChild(portalElement)
    }
  })
}

function handleResize(): void {
  updateElementPosition()
}

function handleScroll(): void {
  updateElementPosition()
}

function handleKeydown(event: KeyboardEvent): void {
  if (!isVisible.value) return

  switch (event.key) {
    case 'Escape':
      exitTutorial()
      break
    case 'ArrowLeft':
      if (canGoPrevious.value) {
        event.preventDefault()
        previousStep()
      }
      break
    case 'ArrowRight':
      if (canProceed.value) {
        event.preventDefault()
        if (isLastStep.value) {
          completeTutorial()
        } else {
          nextStep()
        }
      }
      break
  }
}

// Validation handler
async function validateCurrentStep(): Promise<void> {
  console.log('[TutorialOverlay] validateCurrentStep called')
  if (!currentStep.value) return

  const step = currentStep.value
  const selector = step.targetSelector || step.targetElement

  console.log('[TutorialOverlay] Step:', step.id, 'Selector:', selector, 'Action:', step.action)

  if (!selector || !step.action) {
    console.log('[TutorialOverlay] No validation needed - setting canProceed=true')
    canProceed.value = true
    return
  }

  isValidating.value = true

  try {
    const element = tutorialEngine.findElement(selector)
    console.log('[TutorialOverlay] findElement result:', element, 'for selector:', selector)

    if (!element) {
      console.log('[TutorialOverlay] Element not found - canProceed=false')
      canProceed.value = false
      return
    }

    console.log('[TutorialOverlay] Element found! Validating with engine...')
    const result = await validationEngine.validateStep({
      step,
      element,
      state: tutorialStore.$state
    })

    console.log('[TutorialOverlay] Validation result:', result)
    canProceed.value = result.success

    if (!result.success && result.hint) {
      $q.notify({
        type: 'info',
        message: result.hint,
        icon: 'lightbulb',
        timeout: 3000
      })
    }
  } catch (error) {
    console.error('[TutorialOverlay] Validation error:', error)
    canProceed.value = false
  } finally {
    isValidating.value = false
  }
}

// Watchers
watch(currentStep, async () => {
  if (currentStep.value) {
    await nextTick()

    // Deactivate previous step
    tutorialEngine.deactivateStep()

    // Update element position
    updateElementPosition()

    // Activate new step with engine
    const step = currentStep.value
    if (step.action && (step.targetSelector || step.targetElement)) {
      // Activate engine to attach event listeners
      tutorialEngine.activateStep(step as any)

      // Listen for action detected (user clicked element)
      tutorialEngine.on('action:detected', async (data) => {
        console.log('[TutorialOverlay] Action detected:', data)
        await validateCurrentStep()
      })

      // Manual guidance mode - no auto-fill
      // User can proceed when ready
      canProceed.value = true
    } else {
      // No validation needed for explanation steps
      canProceed.value = true
    }
  }
}, { immediate: true })

watch(isVisible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''

  // Cleanup tutorial engine
  tutorialEngine.cleanup()

  // Cleanup any leftover dialogs
  cleanupDialogs()
})
</script>

<style lang="scss" scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none; // Allow clicks through empty space to highlighted element
}

.tutorial-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3); // 30% opacity - lighter for manual guidance mode
  pointer-events: none; // Allow clicks through - manual guidance mode
  z-index: 10000; // Above page content, below highlight
}

.tutorial-highlight {
  position: absolute;
  border: 3px solid #1976d2;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.3);
  background: transparent;
  z-index: 10001;
  transition: all 0.3s ease;
  animation: tutorial-pulse 2s infinite;
  pointer-events: none; // Allow clicks through highlight to element below
}

@keyframes tutorial-pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(#1976d2, 0.3);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(#1976d2, 0.1);
  }
}

.tutorial-step-card {
  position: absolute;
  background: linear-gradient(135deg, #1976d2 0%, #0f4c81 100%);
  color: white;
  border-radius: 16px;
  padding: 24px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  z-index: 10002;
  transition: none; // Disable transition for smooth dragging
  pointer-events: all; // Enable interactions with step card
  user-select: none; // Prevent text selection while dragging

  &--top::before,
  &--bottom::before,
  &--left::before,
  &--right::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: 12px solid transparent;
  }

  &--top::before {
    bottom: -24px;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: #1976d2;
  }

  &--bottom::before {
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: #1976d2;
  }

  &--left::before {
    right: -24px;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: #1976d2;
  }

  &--right::before {
    left: -24px;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: #1976d2;
  }
}

.tutorial-step-header {
  margin-bottom: 16px;

  .tutorial-step-number {
    font-size: 12px;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .tutorial-step-title {
    font-size: 18px;
    font-weight: 600;
    margin-top: 4px;
  }
}

.tutorial-step-content {
  .tutorial-step-description {
    font-size: 14px;
    line-height: 1.5;
    opacity: 0.9;
  }
}

.tutorial-action-hint {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.tutorial-extra-info {
  .tutorial-expansion {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
}

.tutorial-progress {
  .tutorial-progress-text {
    font-size: 12px;
    text-align: center;
    opacity: 0.8;
  }
}

.tutorial-controls {
  .q-btn {
    border-color: rgba(255, 255, 255, 0.3);

    &:hover {
      border-color: rgba(255, 255, 255, 0.6);
    }
  }
}

.demo-mode-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10003;
}

// Responsive adjustments
@media (max-width: 600px) {
  .tutorial-step-card {
    min-width: calc(100vw - 40px);
    max-width: calc(100vw - 40px);
    left: 20px !important;
    right: 20px !important;
    transform: none !important;
  }

  .tutorial-controls {
    .row {
      flex-direction: column;

      .q-btn {
        width: 100%;
        margin: 4px 0 !important;
      }
    }
  }
}
</style>