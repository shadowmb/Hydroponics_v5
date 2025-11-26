<!--
/**
 * 📦 Container Block Component
 * ✅ Прост container блок за Flow Editor
 * Последна проверка: 2025-07-30
 */
-->
<template>
  <div 
    class="container-block"
    :class="{
      'container-block--valid': container.status === 'valid',
      'container-block--error': container.status === 'error', 
      'container-block--warning': container.status === 'warning',
      'container-block--selected': isSelected
    }"
    @click="handleClick"
    @dblclick="handleDoubleClick"
  >
    <!-- Header -->
    <div class="container-block__header">
      <div class="container-block__icon">
        <q-icon name="widgets" />
      </div>
      <div class="container-block__title">
        {{ container.name }}
      </div>
      <div class="container-block__status">
        <q-icon 
          v-if="container.status === 'error'"
          name="error"
          color="negative"
        />
        <q-icon 
          v-else-if="container.status === 'warning'"
          name="warning"
          color="warning"
        />
        <q-icon 
          v-else
          name="check_circle"
          color="positive"
        />
      </div>
    </div>

    <!-- Body -->
    <div class="container-block__body">
      <div class="container-block__info">
        <span class="container-block__count">
          {{ container.containedBlocks.length }} блока
        </span>
      </div>

      <!-- Enter Button -->
      <div class="container-block__actions">
        <q-btn
          flat
          dense
          round
          icon="login"
          size="sm"
          color="primary"
          @click.stop="handleEnterContainer"
          class="container-block__enter-btn"
        >
          <q-tooltip>Влез в контейнера</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Ports -->
    <div class="container-block__ports">
      <!-- Flow In Port -->
      <div 
        class="container-block__port container-block__port--in"
        @mousedown="handlePortMouseDown('flowIn', $event)"
        @mouseup="handlePortMouseUp('flowIn', $event)"
      >
        <div class="container-block__port-dot"></div>
      </div>

      <!-- Flow Out Port -->
      <div 
        class="container-block__port container-block__port--out"
        @mousedown="handlePortMouseDown('flowOut', $event)"
        @mouseup="handlePortMouseUp('flowOut', $event)"
      >
        <div class="container-block__port-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContainerMetadata } from '../../types/ContainerTypes'

// Props
interface Props {
  container: ContainerMetadata
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
})

// Emits
interface Emits {
  click: [container: ContainerMetadata]
  doubleClick: [container: ContainerMetadata]
  enterContainer: [containerId: string]
  portMouseDown: [portId: string, event: MouseEvent, containerId: string]
  portMouseUp: [portId: string, event: MouseEvent, containerId: string]
}

const emit = defineEmits<Emits>()

// Computed
const containerClass = computed(() => {
  return `container-block--${props.container.status}`
})

// Methods
function handleClick() {
  emit('click', props.container)
}

function handleDoubleClick() {
  emit('doubleClick', props.container)
}

function handleEnterContainer() {
  emit('enterContainer', props.container.id)
}

function handlePortMouseDown(portId: string, event: MouseEvent) {
  event.stopPropagation()
  emit('portMouseDown', portId, event, props.container.id)
}

function handlePortMouseUp(portId: string, event: MouseEvent) {
  event.stopPropagation()
  emit('portMouseUp', portId, event, props.container.id)
}
</script>

<style scoped lang="scss">
.container-block {
  position: relative;
  width: 200px;
  min-height: 120px;
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: #4A90E2;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
  }

  &--selected {
    border-color: #4A90E2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3);
  }

  &--valid {
    border-left: 4px solid #4CAF50;
  }

  &--warning {
    border-left: 4px solid #FF9800;
  }

  &--error {
    border-left: 4px solid #F44336;
  }
}

.container-block__header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid #e0e0e0;
}

.container-block__icon {
  margin-right: 8px;
  color: #4A90E2;
}

.container-block__title {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.container-block__status {
  margin-left: 8px;
}

.container-block__body {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.container-block__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.container-block__count {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.container-block__actions {
  display: flex;
  gap: 4px;
}

.container-block__enter-btn {
  &:hover {
    background-color: rgba(74, 144, 226, 0.1);
  }
}

.container-block__ports {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;  
  bottom: 0;
  pointer-events: none;
}

.container-block__port {
  position: absolute;
  width: 16px;
  height: 16px;
  pointer-events: all;
  cursor: crosshair;

  &--in {
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
  }

  &--out {
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
  }
}

.container-block__port-dot {
  width: 12px;
  height: 12px;
  background: #4A90E2;
  border: 2px solid #ffffff;
  border-radius: 50%;
  margin: 2px;
  transition: all 0.2s ease;

  .container-block__port:hover & {
    background: #2171b5;
    transform: scale(1.2);
  }
}
</style>