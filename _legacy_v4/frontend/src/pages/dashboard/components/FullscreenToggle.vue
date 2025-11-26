<template>
  <q-btn
    :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
    :label="isFullscreen ? 'Изход от пълен екран' : 'Пълен екран'"
    :color="isFullscreen ? 'warning' : 'primary'"
    outline
    @click="toggleFullscreen"
  >
    <q-tooltip>{{ isFullscreen ? 'Изход от пълен екран (ESC)' : 'Отвори в пълен екран (F11)' }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isFullscreen = ref(false)

// Fullscreen API methods
function enterFullscreen() {
  const element = document.documentElement
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if ((element as any).webkitRequestFullscreen) {
    ;(element as any).webkitRequestFullscreen()
  } else if ((element as any).msRequestFullscreen) {
    ;(element as any).msRequestFullscreen()
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if ((document as any).webkitExitFullscreen) {
    ;(document as any).webkitExitFullscreen()
  } else if ((document as any).msExitFullscreen) {
    ;(document as any).msExitFullscreen()
  }
}

function toggleFullscreen() {
  if (isFullscreen.value) {
    exitFullscreen()
  } else {
    enterFullscreen()
  }
}

// Handle fullscreen change events
function handleFullscreenChange() {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  )
}

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  // F11 for fullscreen
  if (event.key === 'F11') {
    event.preventDefault()
    toggleFullscreen()
  }
  // ESC to exit (handled by browser, but we track it)
  if (event.key === 'Escape' && isFullscreen.value) {
    // Browser will handle the exit, we just need to update our state
    // This will be caught by the fullscreenchange event
  }
}

onMounted(() => {
  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('msfullscreenchange', handleFullscreenChange)

  // Listen for keyboard shortcuts
  document.addEventListener('keydown', handleKeydown)

  // Initialize state
  handleFullscreenChange()
})

onUnmounted(() => {
  // Clean up event listeners
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('msfullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleKeydown)
})

// Expose reactive state for parent component
defineExpose({
  isFullscreen
})
</script>

<style lang="scss" scoped>
// Styles are handled by Quasar button component
</style>