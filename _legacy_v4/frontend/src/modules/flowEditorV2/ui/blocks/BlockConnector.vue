<!--
/**
 * 📦 FlowEditor v3 - Block Connector
 * ✅ Част от основната редакторна система
 * Компонент за port връзки между блокове
 * Последна проверка: 2025-01-26
 */
-->
<template>
  <div
    class="block-connector"
    :class="[
      `connector-${type}`,
      `port-type-${portType}`,
      `port-id-${port.id}`,
      {
        'connector-active': isActive,
        'connector-connected': isConnected,
        'connector-hover': isHover,
        'connector-dragging': isDragging,
        'connector-invalid': !isValid,
      }
    ]"
    :style="connectorStyle"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    :title="tooltip"
  >
    <!-- Port visual indicator -->
    <div class="port-visual">
      <div
        class="port-dot"
        :class="[
          portShapeClass,
          {
            'port-required': port.required,
            'port-composite': isComposite,
          }
        ]"
        :style="{ backgroundColor: portColor }"
      ></div>
      
      <!-- Composite indicator overlay -->
      <div
        v-if="isComposite"
        class="composite-overlay"
        title="Composite port - accepts multiple types"
      >⚡</div>
      
      <!-- Required indicator -->
      <div
        v-if="port.required"
        class="required-overlay"
        title="Required port"
      >*</div>
      
      <!-- Connection indicator -->
      <div
        v-if="isConnected"
        class="connection-indicator"
      >
        <div class="connection-count">{{ connectionCount }}</div>
      </div>
    </div>

    <!-- Port label (за debug/hover) -->
    <div
      v-if="showLabel"
      class="port-label"
      :class="{ 'label-right': type === 'output' }"
    >
      {{ port.label }}
    </div>

    <!-- Drag preview line -->
    <svg
      v-if="isDragging && dragPreview"
      class="drag-preview"
      :style="dragPreviewStyle"
    >
      <line
        :x1="dragPreview.startX"
        :y1="dragPreview.startY"
        :x2="dragPreview.endX"
        :y2="dragPreview.endY"
        stroke="currentColor"
        stroke-width="2"
        stroke-dasharray="5,3"
        opacity="0.6"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PortDefinition, CompositePortType, PortType } from '../../types/BlockConcept';
import { getPortTypeColor, getPortTypeDescription } from '../../core/ports/PortManager';

// Props
interface Props {
  port: PortDefinition;
  type: 'input' | 'output';
  blockId: string;
  position: { x: number; y: number };
  isConnected?: boolean;
  connectionCount?: number;
  isActive?: boolean;
  isHover?: boolean;
  isDragging?: boolean;
  isValid?: boolean;
  showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isConnected: false,
  connectionCount: 0,
  isActive: false,
  isHover: false,
  isDragging: false,
  isValid: true,
  showLabel: false,
});

// Drag preview data
interface DragPreview {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const dragPreview = ref<DragPreview | null>(null);

// Events
const emit = defineEmits<{
  startConnection: [blockId: string, portId: string, type: 'input' | 'output'];
  endConnection: [blockId: string, portId: string, type: 'input' | 'output'];
  cancelConnection: [];
  mouseenter: [blockId: string, portId: string, type: 'input' | 'output'];
  mouseleave: [blockId: string, portId: string, type: 'input' | 'output'];
  click: [blockId: string, portId: string, type: 'input' | 'output'];
}>();

// Computed properties
const portType = computed((): PortType => {
  if (Array.isArray(props.port.type)) {
    return props.port.type[0] || 'data';
  }
  return props.port.type as PortType;
});

const isComposite = computed((): boolean => {
  return Array.isArray(props.port.type) && props.port.type.length > 1;
});

const portColor = computed((): string => {
  return getPortTypeColor(portType.value);
});

const portDescription = computed((): string => {
  return getPortTypeDescription(portType.value);
});

const portShapeClass = computed((): string => {
  // Различни форми за различните типове портове
  switch (portType.value) {
    case 'flow':
      return 'port-circle';
    case 'data':
      return 'port-square';
    case 'error':
      return 'port-triangle';
    case 'setVar':
      return 'port-diamond';
    case 'sensor':
      return 'port-hexagon';
    case 'logic':
      return 'port-octagon';
    case 'actuator':
      return 'port-square';
    case 'notification':
      return 'port-circle';
    default:
      return 'port-circle';
  }
});

const connectorStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}));

const dragPreviewStyle = computed(() => {
  if (!dragPreview.value) return {};
  
  const preview = dragPreview.value;
  const minX = Math.min(preview.startX, preview.endX);
  const minY = Math.min(preview.startY, preview.endY);
  const width = Math.abs(preview.endX - preview.startX);
  const height = Math.abs(preview.endY - preview.startY);
  
  return {
    position: 'absolute',
    left: `${minX}px`,
    top: `${minY}px`,
    width: `${width}px`,
    height: `${height}px`,
    pointerEvents: 'none',
    zIndex: 1000,
  };
});

const tooltip = computed((): string => {
  const typeText = Array.isArray(props.port.type) 
    ? props.port.type.join(' | ')
    : props.port.type;
  
  const parts = [
    `${props.port.label} (${typeText})`,
    portDescription.value,
  ];
  
  if (props.port.description) {
    parts.push(`Custom: ${props.port.description}`);
  }
  
  if (props.port.required) {
    parts.push('⚠️ Задължителен port');
  }
  
  if (isComposite.value) {
    parts.push(`⚡ Composite: ${(props.port.type as PortType[]).join(', ')}`);
  }
  
  if (props.isConnected) {
    parts.push(`🔗 Connections: ${props.connectionCount}`);
  }
  
  if (!props.isValid) {
    parts.push('❌ Невалидна връзка');
  }
  
  return parts.join('\n');
});

// Methods
function handleMouseDown(event: MouseEvent) {
  event.stopPropagation();
  emit('startConnection', props.blockId, props.port.id, props.type);
  
  // Инициализираме drag preview
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dragPreview.value = {
    startX: event.clientX - rect.left,
    startY: event.clientY - rect.top,
    endX: event.clientX - rect.left,
    endY: event.clientY - rect.top,
  };
  
  // Добавяме global mouse listeners за drag
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
}

function handleDragMove(event: MouseEvent) {
  if (!dragPreview.value) return;
  
  const rect = document.querySelector('.block-connector')?.getBoundingClientRect();
  if (!rect) return;
  
  dragPreview.value.endX = event.clientX - rect.left;
  dragPreview.value.endY = event.clientY - rect.top;
}

function handleDragEnd(event: MouseEvent) {
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  
  // Проверяваме дали сме над друг connector
  const elementUnder = document.elementFromPoint(event.clientX, event.clientY);
  const connectorUnder = elementUnder?.closest('.block-connector');
  
  if (connectorUnder) {
    // TODO: emit endConnection с данните от connectorUnder
    emit('endConnection', props.blockId, props.port.id, props.type);
  } else {
    emit('cancelConnection');
  }
  
  dragPreview.value = null;
}

function handleMouseEnter() {
  emit('mouseenter', props.blockId, props.port.id, props.type);
}

function handleMouseLeave() {
  emit('mouseleave', props.blockId, props.port.id, props.type);
}

function handleClick(event: MouseEvent) {
  event.stopPropagation();
  emit('click', props.blockId, props.port.id, props.type);
}

// Public methods for external drag preview updates
function updateDragPreview(endX: number, endY: number) {
  if (dragPreview.value) {
    dragPreview.value.endX = endX;
    dragPreview.value.endY = endY;
  }
}

defineExpose({
  updateDragPreview,
});
</script>

<style scoped>
.block-connector {
  position: absolute;
  z-index: 10;
  cursor: pointer;
  user-select: none;
}

.port-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Port dots/shapes */
.port-dot {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Basic shapes */
.port-circle {
  border-radius: 50%;
}

.port-square {
  border-radius: 2px;
}

.port-triangle {
  border-radius: 2px;
  transform: rotate(45deg);
}

.port-diamond {
  border-radius: 2px;
  transform: rotate(45deg);
  border-width: 1px;
}

/* Advanced shapes */
.port-hexagon {
  border-radius: 2px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border: none;
}

.port-octagon {
  border-radius: 2px;
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
  border: none;
}

/* Port states */
.port-required {
  border-color: #f44336 !important;
  border-width: 2px;
  box-shadow: 0 0 6px rgba(244, 67, 54, 0.4);
}

.port-composite {
  background: linear-gradient(45deg, currentColor 60%, #ff9800 60%) !important;
  border-color: #ff9800;
}

/* Port types colors */
.port-type-flow .port-dot {
  background: #2196f3;
  border-color: #1976d2;
}

/* Специални градиенти за условни блокове */
.port-id-flowOutTrue .port-dot {
  background: linear-gradient(to bottom, #2196f3 50%, #4caf50 50%);
  border-color: #1976d2;
}

.port-id-flowOutFalse .port-dot {
  background: linear-gradient(to bottom, #2196f3 50%, #f44336 50%);
  border-color: #1976d2;
}

.port-type-data .port-dot {
  background: #4caf50;
  border-color: #388e3c;
}

.port-type-error .port-dot {
  background: #f44336;
  border-color: #d32f2f;
}

.port-type-setvar .port-dot {
  background: #ff9800;
  border-color: #f57c00;
}

.port-type-sensor .port-dot {
  background: #9c27b0;
  border-color: #7b1fa2;
}

.port-type-logic .port-dot {
  background: #607d8b;
  border-color: #455a64;
}

.port-type-actuator .port-dot {
  background: #795548;
  border-color: #5d4037;
}

.port-type-notification .port-dot {
  background: #ffeb3b;
  border-color: #fbc02d;
}

/* States */
.connector-hover .port-dot {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.connector-active .port-dot {
  transform: scale(1.3);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
}

.connector-connected .port-dot {
  border-width: 3px;
  border-color: white;
}

.connector-dragging .port-dot {
  transform: scale(1.4);
  box-shadow: 0 0 16px rgba(255, 255, 255, 1);
}

.connector-invalid .port-dot {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.3);
}

/* Overlay indicators */
.composite-overlay {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(255, 152, 0, 0.9);
  color: white;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  z-index: 2;
}

.required-overlay {
  position: absolute;
  top: -4px;
  left: -4px;
  background: rgba(244, 67, 54, 0.9);
  color: white;
  border-radius: 50%;
  width: 10px;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  z-index: 2;
}

/* Connection indicator */
.connection-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 3;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.connection-count {
  font-size: 9px;
}

/* Port labels */
.port-label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  left: calc(100% + 8px);
  z-index: 100;
}

.label-right {
  right: calc(100% + 8px);
  left: auto;
}

.connector-hover .port-label {
  opacity: 1;
}

/* Input/Output positioning */
.connector-input {
  transform: translateX(-50%);
}

.connector-output {
  transform: translateX(50%);
}

/* Drag preview */
.drag-preview {
  pointer-events: none;
  color: currentColor;
}

.drag-preview line {
  stroke: currentColor;
}
</style>