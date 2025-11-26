<template>
  <div
    class="block-renderer"
    :class="[
      `block-type-${blockDefinition?.type}`,
      {
        'block-selected': isSelected,
        'block-hovered': isHovered,
        'block-dragging': isDragging,
        'block-error': hasErrors,
        'block-warning': hasWarnings,
        'block-compact': isCompactBlock,
        'connection-dragging': isConnectionDragging,
      }
    ]"
    :style="{
      transform: `translate(${block.position.x}px, ${block.position.y}px)`,
    }"
    @mousedown.stop="onMouseDown"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="onClick"
  >
    <!-- Block Header Component -->
    <BlockHeader
      :block="block"
      :block-definition="blockDefinition"
      :block-schema="blockSchema"
      :category-color="categoryColor"
      :category-icon="categoryIcon"
      :is-compact="isCompactBlock"
      :has-errors="hasErrors"
      :has-warnings="hasWarnings"
      :validation-result="validationResult"
      :validation-tooltip="validationTooltip"
      @delete-block="$emit('deleteBlock', block.id)"
    />

    <!-- Block Body Component -->
    <BlockBody
      :block="block"
      :block-definition="blockDefinition"
      :is-compact="isCompactBlock"
      :validation-result="validationResult"
      @update-parameter="onUpdateParameter"
      @variable-name-change="onVariableNameChange"
      @enter-container="onEnterContainer"
    />

    <!-- Block Ports Component -->
    <BlockPorts
      :block="block"
      :block-definition="blockDefinition"
      :is-compact="isCompactBlock"
      @output-port-click="onOutputPortClick"
      @input-port-click="onInputPortClick"
      @port-mouse-down="onPortMouseDown"
      @port-mouse-enter="onPortMouseEnter"
      @port-mouse-leave="onPortMouseLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useBlockData } from '../../composables/useBlockData'
import { useBlockInteractions } from '../../composables/useBlockInteractions'
import BlockHeader from './BlockHeader.vue'
import BlockBody from './BlockBody.vue'
import BlockPorts from './BlockPorts.vue'
import type { BlockInstance } from '../../types/BlockConcept'

// Props
interface Props {
  block: BlockInstance
  isSelected?: boolean
  renderTrigger?: number
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  renderTrigger: 0
})

// Inject connection dragging state for CSS classes
const isConnectionDragging = inject('isConnectionDragging', ref(false))

// Emits
const emit = defineEmits<{
  deleteBlock: [blockId: string]
  updateParameter: [blockId: string, paramName: string, value: any]
  variableNameChange: [blockId: string, oldName: string, newName: string]
  mousedown: [event: MouseEvent, blockId: string]
  click: [event: MouseEvent, blockId: string]
  outputPortClick: [blockId: string, portId: string]
  inputPortClick: [blockId: string, portId: string]
  portMouseDown: [event: MouseEvent, port: any, block: BlockInstance]
  portMouseEnter: [port: any, block: BlockInstance]
  portMouseLeave: [port: any, block: BlockInstance]
  enterContainer: [containerId: string]
}>()

// Data Management Composable
const {
  blockDefinition,
  blockSchema,
  categoryColor,
  categoryIcon,
  validationResult,
  hasErrors,
  hasWarnings,
  validationTooltip,
  isCompactBlock
} = useBlockData(props.block)

// Interaction Management Composable  
const {
  isHovered,
  isDragging,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onClick
} = useBlockInteractions(props.block, emit)

// Event Handlers
function onUpdateParameter(paramName: string, value: any) {
  emit('updateParameter', props.block.id, paramName, value)
}

function onVariableNameChange(oldName: string, newName: string) {
  emit('variableNameChange', props.block.id, oldName, newName)
}

function onEnterContainer(containerId: string) {
  emit('enterContainer', containerId)
}

// Port click handlers for connections
function onOutputPortClick(portId: string) {
  emit('outputPortClick', props.block.id, portId)
}

function onInputPortClick(portId: string) {
  emit('inputPortClick', props.block.id, portId)
}

// Override port handlers to match BlockPorts emissions
function onPortMouseDown(event: MouseEvent, port: any, block: BlockInstance) {
  emit('portMouseDown', event, port, block)
}

function onPortMouseEnter(port: any, block: BlockInstance) {
  emit('portMouseEnter', port, block)
}

function onPortMouseLeave(port: any, block: BlockInstance) {
  emit('portMouseLeave', port, block)
}
</script>

<style scoped>
.block-renderer {
  position: absolute;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  cursor: move;
  user-select: none;
  z-index: 10;
  transition: all 0.15s ease;
}

.block-renderer:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #ccc;
}

.block-renderer.block-selected {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.block-renderer.block-dragging {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.block-renderer.block-error {
  border-color: #f44336;
  background: #ffebee;
}

.block-renderer.block-warning {
  border-color: #ff9800;
  background: #fff8e1;
}

.block-renderer.block-compact {
  min-width: 120px;
  border-radius: 6px;
}

.block-renderer.connection-dragging {
  z-index: 5;
}
</style>