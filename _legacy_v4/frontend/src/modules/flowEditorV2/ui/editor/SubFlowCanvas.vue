<!--
/**
 * 📦 Sub-Flow Canvas Component
 * ✅ Изолирана canvas за container editing
 * Последна проверка: 2025-07-30
 */
-->
<template>
  <div class="sub-flow-canvas" ref="canvasContainer">
    <!-- Container Mode Header -->
    <div class="sub-flow-canvas__header">
      <div class="sub-flow-canvas__container-info">
        <q-icon name="widgets" color="primary" />
        <span class="sub-flow-canvas__container-name">{{ containerName }}</span>
        <q-chip 
          size="sm" 
          color="primary" 
          text-color="white"
          :label="`${blocks.length} блока`"
        />
      </div>

      <div class="sub-flow-canvas__mode-indicator">
        <q-badge color="orange" floating>
          Контейнер режим
        </q-badge>
      </div>
    </div>

    <!-- Canvas Area -->
    <div 
      class="sub-flow-canvas__workspace"
      :style="canvasStyle"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @wheel="handleCanvasWheel"
    >
      <!-- Grid Background -->
      <div 
        v-if="showGrid"
        class="sub-flow-canvas__grid"
        :style="gridStyle"
      ></div>

      <!-- Start Block (Always present) -->
      <div
        v-if="startBlock"
        class="sub-flow-canvas__start-block"
        :style="getBlockStyle(startBlock)"
      >
        <div class="sub-flow-canvas__marker-block">
          <q-icon name="play_arrow" color="positive" size="md" />
          <span>Начало</span>
        </div>
      </div>

      <!-- Container Blocks -->
      <div
        v-for="block in containerBlocks"
        :key="block.id"
        class="sub-flow-canvas__block"
        :class="{
          'sub-flow-canvas__block--selected': selectedBlockId === block.id,
          'sub-flow-canvas__block--dragging': draggingBlockId === block.id
        }"
        :style="getBlockStyle(block)"
        @mousedown.stop="handleBlockMouseDown(block, $event)"
        @click="handleBlockClick(block)"
      >
        <!-- Block content goes here -->
        <div class="sub-flow-canvas__block-content">
          <div class="sub-flow-canvas__block-header">
            <q-icon :name="getBlockIcon(block)" size="sm" />
            <span>{{ getBlockName(block) }}</span>
          </div>
        </div>
      </div>

      <!-- End Block (Always present) -->
      <div
        v-if="endBlock"
        class="sub-flow-canvas__end-block"
        :style="getBlockStyle(endBlock)"
      >
        <div class="sub-flow-canvas__marker-block">
          <q-icon name="stop" color="negative" size="md" />
          <span>Край</span>
        </div>
      </div>

      <!-- Connections -->
      <svg 
        class="sub-flow-canvas__connections"
        :style="{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }"
      >
        <line
          v-for="connection in connections"
          :key="connection.id"
          :x1="connection.startX"
          :y1="connection.startY"
          :x2="connection.endX"
          :y2="connection.endY"
          stroke="#4A90E2"
          stroke-width="2"
          marker-end="url(#arrowhead)"
        />
        
        <!-- Arrow marker definition -->
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#4A90E2" />
          </marker>
        </defs>
      </svg>
    </div>

    <!-- Canvas Controls -->
    <div class="sub-flow-canvas__controls">
      <q-btn-group flat>
        <q-btn 
          flat 
          icon="zoom_in" 
          size="sm"
          @click="zoomIn"
        >
          <q-tooltip>Увеличи</q-tooltip>
        </q-btn>
        <q-btn 
          flat 
          icon="zoom_out" 
          size="sm"
          @click="zoomOut"
        >
          <q-tooltip>Намали</q-tooltip>
        </q-btn>
        <q-btn 
          flat 
          icon="center_focus_strong" 
          size="sm"
          @click="resetView"
        >
          <q-tooltip>Центрирай</q-tooltip>
        </q-btn>
        <q-btn 
          flat 
          icon="grid_3x3" 
          size="sm"
          :color="showGrid ? 'primary' : 'grey'"
          @click="toggleGrid"
        >
          <q-tooltip>Решетка</q-tooltip>
        </q-btn>
      </q-btn-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import type { BlockInstance } from '../../types/BlockConcept'
import type { ContainerMetadata } from '../../types/ContainerTypes'

// Props
interface Props {
  containerId: string
  containerName: string
  blocks: BlockInstance[]
  startBlock?: BlockInstance
  endBlock?: BlockInstance
  showGrid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showGrid: true
})

// Emits
interface Emits {
  blockSelected: [block: BlockInstance]
  blockMoved: [blockId: string, position: { x: number; y: number }]
  blockConnected: [fromBlockId: string, toBlockId: string]
  canvasPanned: [offset: { x: number; y: number }]
  canvasZoomed: [zoom: number]
}

const emit = defineEmits<Emits>()

// Refs
const canvasContainer = ref<HTMLElement>()

// State
const canvasState = reactive({
  zoom: 1,
  panX: 0,
  panY: 0,
  isDragging: false,
  isPanning: false
})

const selectedBlockId = ref<string>()
const draggingBlockId = ref<string>()
const showGrid = ref(props.showGrid)

// Computed
const containerBlocks = computed(() => {
  return props.blocks.filter(block => 
    block.id !== props.startBlock?.id && 
    block.id !== props.endBlock?.id
  )
})

const canvasStyle = computed(() => ({
  transform: `scale(${canvasState.zoom}) translate(${canvasState.panX}px, ${canvasState.panY}px)`,
  transformOrigin: '0 0'
}))

const gridStyle = computed(() => ({
  backgroundImage: `
    linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)
  `,
  backgroundSize: '20px 20px',
  opacity: 0.5
}))

const connections = computed(() => {
  // Simplified connections - в реалността ще идват от props
  return []
})

// Methods
function getBlockStyle(block: BlockInstance) {
  return {
    position: 'absolute',
    left: `${block.position.x}px`,
    top: `${block.position.y}px`,
    transform: 'translate(0, 0)'
  }
}

function getBlockIcon(block: BlockInstance): string {
  // Simplified - в реалността ще се вземе от block definition
  return 'widgets'
}

function getBlockName(block: BlockInstance): string {
  return block.definitionId || 'Блок'
}

function handleCanvasMouseDown(event: MouseEvent) {
  if (event.button === 0) { // Left click
    canvasState.isPanning = true
    selectedBlockId.value = undefined
  }
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (canvasState.isPanning) {
    canvasState.panX += event.movementX / canvasState.zoom
    canvasState.panY += event.movementY / canvasState.zoom
    emit('canvasPanned', { x: canvasState.panX, y: canvasState.panY })
  }
}

function handleCanvasMouseUp() {
  canvasState.isPanning = false
  draggingBlockId.value = undefined
}

function handleCanvasWheel(event: WheelEvent) {
  event.preventDefault()
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
  canvasState.zoom = Math.max(0.1, Math.min(3, canvasState.zoom * zoomFactor))
  emit('canvasZoomed', canvasState.zoom)
}

function handleBlockMouseDown(block: BlockInstance, event: MouseEvent) {
  event.stopPropagation()
  draggingBlockId.value = block.id
  selectedBlockId.value = block.id
}

function handleBlockClick(block: BlockInstance) {
  selectedBlockId.value = block.id
  emit('blockSelected', block)
}

function zoomIn() {
  canvasState.zoom = Math.min(3, canvasState.zoom * 1.2)
  emit('canvasZoomed', canvasState.zoom)
}

function zoomOut() {
  canvasState.zoom = Math.max(0.1, canvasState.zoom * 0.8)
  emit('canvasZoomed', canvasState.zoom)
}

function resetView() {
  canvasState.zoom = 1
  canvasState.panX = 0
  canvasState.panY = 0
}

function toggleGrid() {
  showGrid.value = !showGrid.value
}

// Lifecycle
onMounted(() => {
  document.addEventListener('mousemove', handleCanvasMouseMove)
  document.addEventListener('mouseup', handleCanvasMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleCanvasMouseMove)
  document.removeEventListener('mouseup', handleCanvasMouseUp)
})
</script>

<style scoped lang="scss">
.sub-flow-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.sub-flow-canvas__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.sub-flow-canvas__container-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-flow-canvas__container-name {
  font-weight: 600;
  color: #495057;
}

.sub-flow-canvas__mode-indicator {
  position: relative;
}

.sub-flow-canvas__workspace {
  position: relative;
  width: 100%;
  height: calc(100% - 50px);
  cursor: grab;
  
  &.dragging {
    cursor: grabbing;
  }
}

.sub-flow-canvas__grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sub-flow-canvas__start-block,
.sub-flow-canvas__end-block {
  position: absolute;
  z-index: 10;
}

.sub-flow-canvas__marker-block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #ffffff;
  border: 2px solid;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  .sub-flow-canvas__start-block & {
    border-color: #4CAF50;
    color: #4CAF50;
  }
  
  .sub-flow-canvas__end-block & {
    border-color: #F44336;
    color: #F44336;
  }
}

.sub-flow-canvas__block {
  position: absolute;
  cursor: pointer;
  z-index: 5;
  
  &--selected {
    z-index: 15;
  }
  
  &--dragging {
    z-index: 20;
    cursor: grabbing;
  }
}

.sub-flow-canvas__block-content {
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  min-width: 120px;
  min-height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  .sub-flow-canvas__block--selected & {
    border-color: #4A90E2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.3);
  }
  
  &:hover {
    border-color: #4A90E2;
  }
}

.sub-flow-canvas__block-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #495057;
}

.sub-flow-canvas__connections {
  position: absolute;
  z-index: 1;
}

.sub-flow-canvas__controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>