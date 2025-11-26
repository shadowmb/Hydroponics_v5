<!--
/**
 * 📦 FlowEditor v3 - Flow Canvas Component
 * ✅ Част от основната редакторна система
 * Главно canvas за рисуване на блокове и връзки
 * Последна проверка: 2025-01-26
 */
-->
<template>
  <q-page class="flow-editor-page">
    <div class="flow-canvas-container">
    
    <!-- Main Toolbar -->
    <div v-if="!props.readonly" class="main-toolbar">
      <!-- File operations with labels -->
      <div class="toolbar-section file-operations">
        <q-btn
          flat
          icon="post_add"
          label="Нов поток"
          @click="createNewFlow"
          color="green"
          class="toolbar-btn-with-label"
        />
        
        <q-btn
          flat
          icon="clear"
          label="Изчисти"
          @click="clearOrphanedBlocks"
          color="orange"
          class="toolbar-btn-with-label"
        >
          <q-tooltip>Премахва блокове без връзки</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          icon="save"
          label="Запази"
          @click="saveFlow"
          color="primary"
          class="toolbar-btn-with-label"
        >
          <q-tooltip>Запазва flow-то със validation и metadata</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          icon="upload"
          label="Импорт"
          @click="importFlow"
          color="blue"
          class="toolbar-btn-with-label"
        />
        
        <q-btn
          flat
          icon="download"
          label="Export"
          @click="exportFlowToFile"
          color="indigo"
          class="toolbar-btn-with-label"
        >
          <q-tooltip>Експорт на flow с FlowExporter</q-tooltip>
        </q-btn>
      </div>
      
      <q-separator vertical />
      
      <!-- Edit operations -->
      <div class="toolbar-section">
        <!-- TODO: IMPLEMENT_LATER - History undo/redo -->
        <q-btn
          flat
          dense
          round
          icon="undo"
          @click="undoAction"
          :disable="true"
          color="grey"
        >
          <q-tooltip>Undo (скоро)</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          dense
          round
          icon="redo"
          @click="redoAction"
          :disable="true"
          color="grey"
        >
          <q-tooltip>Redo (скоро)</q-tooltip>
        </q-btn>
      </div>
      
      <q-separator vertical />
      
      <!-- View operations -->
      <div class="toolbar-section">
        <q-btn
          flat
          dense
          round
          icon="zoom_out"
          @click="zoomOut"
          :disable="canvasState.zoom <= 0.1"
        >
          <q-tooltip>Намаляване</q-tooltip>
        </q-btn>
        
        <span class="zoom-display">{{ Math.round(canvasState.zoom * 100) }}%</span>
        
        <q-btn
          flat
          dense
          round
          icon="zoom_in"
          @click="zoomIn"
          :disable="canvasState.zoom >= 3"
        >
          <q-tooltip>Увеличение</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          dense
          round
          :icon="showGrid ? 'grid_on' : 'grid_off'"
          @click="toggleGrid"
          :color="showGrid ? 'primary' : 'grey'"
        >
          <q-tooltip>{{ showGrid ? 'Скрий решетката' : 'Покажи решетката' }}</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          dense
          round
          icon="center_focus_strong"
          @click="resetView"
        >
          <q-tooltip>Нулиране на изгледа</q-tooltip>
        </q-btn>
      </div>
      
      <q-separator vertical />
      
      <!-- Container operations -->
      <div class="toolbar-section container-operations">
        <q-btn
          flat
          dense
          round
          icon="widgets"
          @click="createContainerFromSelection"
          :disable="!hasSelectedBlocks"
          color="purple"
        >
          <q-tooltip>Създай контейнер от селекцията</q-tooltip>
        </q-btn>
      </div>
      
      <q-separator vertical />
      
      <!-- Tools -->
      <div class="toolbar-section">
        <!-- 🎯 NEW: Refresh connections button -->
        <q-btn
          flat
          dense
          round
          icon="refresh"
          @click="refreshConnections"
          color="primary"
        >
          <q-tooltip>Обнови линиите</q-tooltip>
        </q-btn>
        
        <!-- 🔍 NEW: Flow diagnostics button -->
        <q-btn
          flat
          dense
          round
          icon="bug_report"
          @click="diagnoseFlowProblems"
          color="purple"
        >
          <q-tooltip>Диагностика на flow проблемите</q-tooltip>
        </q-btn>
        
        <!-- 🔧 NEW: Block system diagnostics button -->
        <q-btn
          flat
          dense
          round
          icon="engineering"
          @click="diagnoseBlockSystem"
          color="indigo"
        >
          <q-tooltip>Диагностика на блоковата система</q-tooltip>
        </q-btn>
        
        <!-- TODO: IMPLEMENT_LATER - Drag mode toggle -->
        <q-btn
          flat
          dense
          round
          icon="pan_tool"
          @click="toggleDragMode"
          :disable="true"
          color="grey"
        >
          <q-tooltip>Drag режим (скоро)</q-tooltip>
        </q-btn>
      </div>
      
      <q-separator vertical />
      
      
      <!-- Flow status -->
      <div class="toolbar-status">
        <q-chip
          v-if="exportImportState.lastValidation"
          :color="flowStatusChipColor"
          text-color="white"
          size="sm"
          :icon="flowStatusIcon"
        >
          {{ flowStatusText }}
        </q-chip>
      </div>
    </div>
    

    <!-- Canvas wrapper -->
    <div
      ref="canvasRef"
      class="flow-canvas"
      :class="{
        'canvas-dragging': isDragging,
        'canvas-panning': isPanning,
      }"
      :style="canvasStyle"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
      @wheel="handleWheel"
      @click="handleCanvasClick"
      @contextmenu.prevent
    >
      <!-- Grid background -->
      <div
        v-if="showGrid"
        class="canvas-grid"
        :style="gridStyle"
      ></div>

      <!-- Render блокове -->
      <BlockRenderer
        v-for="block in blocks"
        :key="block.id"
        :block="block"
        :is-selected="isBlockSelected(block.id)"
        :is-hovered="canvasState.hoveredBlock === block.id"
        :is-dragging="dragState.draggedBlocks.includes(block.id)"
        @mousedown="handleBlockMouseDown"
        @click="handleBlockClick"
        @mouseenter="handleBlockMouseEnter"
        @mouseleave="handleBlockMouseLeave"
        @port-drag-end="handlePortDragEnd"
        @portClick="handlePortClick"
        @output-port-click="handleOutputPortClick"
        @input-port-click="handleInputPortClick"
        @delete-block="handleBlockDelete"
        @enter-container="handleContainerEntered"
      />

      <!-- Connection Layer -->
      <ConnectionLayer
        ref="connectionLayerRef"
        :canvas-container="canvasRef"
        :filtered-connections="connections"
        @connection-created="handleConnectionCreated"
        @connection-deleted="handleConnectionDeleted"
        @port-drag-end="handlePortDragEnd"
        @ports-in-magnetic-range="handlePortsInMagneticRange"
        @port-connection-started="handlePortConnectionStarted"
        @port-connection-cancelled="handlePortConnectionCancelled"
      />

      <!-- Debug Overlay for Magnetic Zones -->
      <MagneticZoneDebugOverlay
        v-if="debugState.showMagneticZones"
        :blocks="blocks"
        :enabled="debugState.showMagneticZones"
        :zoom="canvasState.zoom"
        :pan-offset="canvasState.pan"
      />

      <!-- Selection box -->
      <div
        v-if="selectionBox"
        class="selection-box"
        :style="selectionBoxStyle"
      ></div>
    </div>

    <!-- Old canvas controls removed - moved to main toolbar -->

    </div> <!-- Close flow-canvas-container -->
    
    <!-- Flow Save Dialog -->
    <FlowSaveDialog
      v-model="showSaveDialog"
      :flow-data="getCurrentFlowData()"
      :validation-result="exportImportState.lastValidation"
      :current-name="currentFlow?.meta?.name"
      :current-description="currentFlow?.meta?.description"
      :is-edit-mode="!!props.editFlowId"
      @save="handleSave"
      @cancel="handleSaveCancel"
    />
    <!-- DEBUG: currentFlow.meta = {{ currentFlow?.meta }} -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, inject, provide } from 'vue';
import { useQuasar } from 'quasar';
// import { useBlockEditor } from '../../composables/useBlockEditor'; // Заменено с inject
import BlockRenderer from '../blocks/BlockRenderer.vue';
import ConnectionLayer from '../connections/ConnectionLayer.vue';
import MagneticZoneDebugOverlay from '../debug/MagneticZoneDebugOverlay.vue';
import type { Position } from '../../types/BlockConcept';
import { FlowExporter } from '../../core/flow/FlowExporter';
import { UniversalValidationService } from '../../../../services/UniversalValidationService';
import { FlowValidator } from '../../core/flow/FlowValidator';
import { ConnectionValidator } from '../../core/connections/ConnectionValidator';
import { PositionValidationTests } from '../../utils/PositionValidationTests';
import FlowSaveDialog from '../../components/FlowSaveDialog.vue';
// ❌ Legacy import removed - using adapter now
// import { BlockFactory } from '../../core/blocks/legacy-BlockFactory';
import { getBlockDefinition as getAdapterBlockDefinition } from '../../ui/adapters/BlockFactoryAdapter';
import { PortManager } from '../../core/ports/PortManager';
import { API_BASE_URL } from '../../../../config/ports';


// Props
interface Props {
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  filteredBlocks?: any[]; // Optional filtered blocks for container mode
  filteredConnections?: any[]; // Optional filtered connections for container mode
  allBlocks?: any[]; // Raw unfiltered blocks for export functionality
  readonly?: boolean;
  editFlowId?: string; // NEW: MongoDB _id for edit mode
}

const props = withDefaults(defineProps<Props>(), {
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  readonly: false,
});

// Events
const emit = defineEmits<{
  blockSelected: [blockId: string, multiSelect: boolean];
  blockMoved: [blockId: string, position: Position];
  canvasPanned: [pan: Position];
  canvasZoomed: [zoom: number];
  containerEntered: [containerId: string];
}>();

// Quasar instance
const $q = useQuasar();

// Canvas ref
const canvasRef = ref<HTMLElement | null>(null);
const connectionLayerRef = ref<InstanceType<typeof ConnectionLayer> | null>(null);

// Inject shared block editor data
const blockEditor = inject('blockEditor') as ReturnType<typeof import('../../composables/useBlockEditor').useBlockEditor>;
if (!blockEditor) {
  throw new Error('FlowCanvas must be used within FlowEditor that provides blockEditor');
}

// Inject container navigation for export functionality
const containerNavigation = inject('containerNavigation') as ReturnType<typeof import('../../composables/useContainerNavigation').useContainerNavigation> | null;

const {
  currentFlow,
  blocks: allBlocks,
  connections: allConnections,
  canvasState,
  selectedBlockCount,
  addBlock,
  selectBlock,
  clearSelection,
  isBlockSelected,
  updateBlockPosition,
  setZoom,
  setPan,
  addSensorReadBlock,
  createContainer,
  getAllContainers,
} = blockEditor;

// Use filtered blocks if provided, otherwise use all blocks
const blocks = computed(() => {
  const result = props.filteredBlocks || allBlocks.value;
 // console.log('🔥 DEBUG FlowCanvas: blocks computed, filteredBlocks:', props.filteredBlocks, 'allBlocks:', allBlocks.value, 'result:', result);
  return result;
});

// Use filtered connections if provided, otherwise use all connections
const connections = computed(() => {
  const result = props.filteredConnections || allConnections.value;
  //console.log('🔥 DEBUG FlowCanvas: connections computed, filteredConnections:', props.filteredConnections, 'allConnections:', allConnections.value.length, 'result:', result.length);
  return result;
});

// Drag state
const dragState = reactive({
  isDragging: false,
  draggedBlocks: [] as string[],
  lastMousePos: { x: 0, y: 0 },
  startPos: { x: 0, y: 0 },
});

// Pan state
const panState = reactive({
  isPanning: false,
  startPan: { x: 0, y: 0 },
  startMouse: { x: 0, y: 0 },
});

// Connection drag state - reactive state for block transparency during connection drag
const isConnectionDragging = ref(false);

// Simplified port drag state - single source of truth
const draggedPort = ref<{
  blockId: string;
  portId: string;
  portType: string;
} | null>(null);

// Provide connection dragging state to child components (BlockRenderer)
provide('isConnectionDragging', isConnectionDragging);

// Provide dragged port state for highlighting
provide('draggedPort', draggedPort);

// Selection box
const selectionBox = ref<{
  start: Position;
  end: Position;
  active: boolean;
} | null>(null);

// Export/Import state
const exportImportState = reactive({
  isExporting: false,
  isImporting: false,
  isValidating: false,
  lastValidation: null as any,
  showExportDialog: false,
  showImportDialog: false,
  exportResult: null as any,
  importResult: null as any,
});

// Save dialog state
const showSaveDialog = ref(false);

// Debug state for development and testing
const debugState = reactive({
  showMagneticZones: false,
  showPositionLabels: false,
  enablePositionLogging: true,
  testResults: null as any,
});

// File input for import
const fileInput = ref<HTMLInputElement | null>(null);

// Computed properties
const isDragging = computed(() => dragState.isDragging);
const isPanning = computed(() => panState.isPanning);

// Container-specific computed properties
const hasSelectedBlocks = computed(() => canvasState.selectedBlocks.length > 0);
const containers = computed(() => getAllContainers());

const canvasStyle = computed(() => {
  try {
    // UNIFIED CANVAS STYLE: включва pan + scale за всички детски компоненти
    const zoom = canvasState?.zoom || 1;
    const panX = canvasState?.pan?.x || 0;
    const panY = canvasState?.pan?.y || 0;
    
    return {
      transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
      transformOrigin: 'top left', // КРИТИЧНО - консистентно за всички
    };
  } catch (error) {
    return {
      transform: 'translate(0px, 0px) scale(1)',
      transformOrigin: 'top left',
    };
  }
});

const gridStyle = computed(() => {
  try {
    const size = (props.gridSize || 20) * (canvasState?.zoom || 1);
    return {
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${(canvasState?.pan?.x || 0) % size}px ${(canvasState?.pan?.y || 0) % size}px`,
    };
  } catch (error) {
    return {
      backgroundSize: '20px 20px',
      backgroundPosition: '0px 0px',
    };
  }
});


const selectionBoxStyle = computed(() => {
  if (!selectionBox.value || !canvasState) return {};
  
  const { start, end } = selectionBox.value;
  
  try {
    // Transform canvas coordinates to screen coordinates
    const zoom = canvasState.zoom || 1;
    const panX = canvasState.pan?.x || 0;
    const panY = canvasState.pan?.y || 0;
    
    const startX = start.x * zoom + panX;
    const startY = start.y * zoom + panY;
    const endX = end.x * zoom + panX;
    const endY = end.y * zoom + panY;
    
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  } catch (error) {
    return {};
  }
});

// Flow validation computed
const flowValidationColor = computed(() => {
  if (!exportImportState.lastValidation) return 'grey';
  
  if (exportImportState.lastValidation.isValid) {
    return exportImportState.lastValidation.warnings.length > 0 ? 'orange' : 'positive';
  } else {
    return 'negative';
  }
});

// Flow status chip color (for the status display)
const flowStatusChipColor = computed(() => {
  if (!exportImportState.lastValidation) return 'grey';
  
  if (exportImportState.lastValidation.isValid) {
    return exportImportState.lastValidation.warnings.length > 0 ? 'orange' : 'green';
  } else {
    return 'red';
  }
});

const flowStatusIcon = computed(() => {
  if (!exportImportState.lastValidation) return 'help';
  return exportImportState.lastValidation.isValid ? 'check_circle' : 'error';
});

const flowStatusText = computed(() => {
  if (!exportImportState.lastValidation) return 'Непроверен';
  if (exportImportState.lastValidation.isValid) {
    const warningCount = exportImportState.lastValidation.warnings.length;
    return warningCount > 0 ? `Валиден (${warningCount} предупреждения)` : 'Валиден';
  }
  const errorCount = exportImportState.lastValidation.errors.length;
  return `Невалиден (${errorCount} грешки)`;
});

// Canvas event handlers
function handleCanvasMouseDown(event: MouseEvent) {
  if (props.readonly) return;
  // ТОЧНА LEGACY КООРДИНАТНА ФОРМУЛА
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  // LEGACY COORDINATE FORMULA: (clientX - rect.left) / zoom
  const canvasX = (event.clientX - rect.left) / canvasState.zoom;
  const canvasY = (event.clientY - rect.top) / canvasState.zoom;

  // Right click - context menu or panning
  if (event.button === 2) {
    startPanning(event);
    return;
  }

  // Middle click - panning
  if (event.button === 1) {
    startPanning(event);
    return;
  }

  // Left click на празно място
  if (event.button === 0) {
    // Изчистваме селекцията ако не е Ctrl/Cmd
    if (!event.ctrlKey && !event.metaKey) {
      clearSelection();
    }

    // Започваме selection box
    startSelectionBox({ x: canvasX, y: canvasY });
  }
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (isPanning.value) {
    updatePanning(event);
  } else if (selectionBox.value?.active) {
    updateSelectionBox(event);
  } else if (isDragging.value) {
    updateBlockDrag(event);
  }
}

function handleCanvasMouseUp(event: MouseEvent) {
  if (isPanning.value) {
    stopPanning();
  } else if (selectionBox.value?.active) {
    completeSelectionBox();
  } else if (isDragging.value) {
    stopBlockDrag();
  }
}

// Block event handlers
function handleBlockMouseDown(event: MouseEvent, blockId: string) {
  event.stopPropagation();
  
  // Skip drag in readonly mode
  if (props.readonly) {
    return;
  }
  
  // Започваме drag на блок
  startBlockDrag(event, blockId);
}

function handleBlockClick(event: MouseEvent, blockId: string) {
  event.stopPropagation();
  
  const multiSelect = event.ctrlKey || event.metaKey;
  selectBlock(blockId, multiSelect);
  emit('blockSelected', blockId, multiSelect);
}

function handleBlockMouseEnter(blockId: string) {
  canvasState.hoveredBlock = blockId;
}

function handleBlockMouseLeave(blockId: string) {
  if (canvasState.hoveredBlock === blockId) {
    canvasState.hoveredBlock = null;
  }
}

function handleBlockDelete(blockId: string) {
  if (props.readonly) return;
  // Check if this is a system block before asking for confirmation
  const block = allBlocks.value.find(b => b.id === blockId);
  if (block && (block.definitionId === 'system.start' || block.definitionId === 'system.end')) {
    alert('Системните блокове (Start/End) не могат да се изтриват!');
    return;
  }
  
  const confirmed = confirm('Сигурни ли сте, че искате да изтриете този блок?');
  if (confirmed) {
    blockEditor.removeBlock(blockId);
  }
}

// Connection event handlers
// 🔄 OLD DRAG-BASED HANDLER - COMMENTED FOR BACKUP
// TODO: Remove after click-to-click system is fully tested
/*
function handlePortDragStart(blockId: string, portId: string, isOutput: boolean, position: { x: number; y: number }) {
  
  // Set connection dragging state to make blocks transparent
  isConnectionDragging.value = true;
  
  // Safe guard for position object
  if (!position || position.x == null || position.y == null) {
    isConnectionDragging.value = false;
    return;
  }
  
  if (connectionLayerRef.value && isOutput) {
    
    // STRATEGY 2: Position is already in canvas coordinates from BlockRenderer
    // No screen→canvas transformation needed - eliminates double transformation issue
    
    if (typeof connectionLayerRef.value.startDragging === 'function') {
      connectionLayerRef.value.startDragging(blockId, portId, position);
    } else {
      isConnectionDragging.value = false;
    }
  }
}
*/

// 🔄 OLD COMPLEX CLICK-TO-CLICK HANDLERS - COMMENTED FOR BACKUP  
// TODO: Remove after new simplified system is fully tested
/*
function handleOutputPortClick(blockId: string, portId: string, position: { x: number; y: number }) {
  isConnectionDragging.value = true;
  
  if (!position || position.x == null || position.y == null) {
    isConnectionDragging.value = false;
    return;
  }
  
  if (connectionLayerRef.value) {
    if (typeof connectionLayerRef.value.startPendingConnection === 'function') {
      connectionLayerRef.value.startPendingConnection(blockId, portId, position);
    } else {
      isConnectionDragging.value = false;
    }
  }
}

function handleInputPortClick(blockId: string, portId: string, position: { x: number; y: number }) {
  if (!position || position.x == null || position.y == null) {
    return;
  }
  
  if (connectionLayerRef.value) {
    if (typeof connectionLayerRef.value.completePendingConnection === 'function') {
      connectionLayerRef.value.completePendingConnection(blockId, portId, position);
      isConnectionDragging.value = false;
    }
  }
}
*/

// 🎯 NEW SIMPLIFIED PORT HANDLERS - Direct port interaction
function handleOutputPortClick(blockId: string, portId: string) {
  // Skip connections in readonly mode
  if (props.readonly) {
    return;
  }
  
  //console.log('🟡 FlowCanvas: Output port clicked:', { blockId, portId });
  
  // 🔥 CRITICAL FIX: Start port highlighting for visual indicators
  startPortDragHighlighting(blockId, portId);
  
  if (connectionLayerRef.value) {
    if (typeof connectionLayerRef.value.startPortConnection === 'function') {
      // 🎯 NEW: Handle boolean return from startPortConnection
      const connectionStarted = connectionLayerRef.value.startPortConnection(blockId, portId);
      
      // Only set connection mode if connection was actually started
      isConnectionDragging.value = connectionStarted;
    } else {
     // console.log('❌ FlowCanvas: startPortConnection not available');
      isConnectionDragging.value = false;
    }
  }
}

function handleInputPortClick(blockId: string, portId: string) {
  // Skip connections in readonly mode
  if (props.readonly) {
    return;
  }
  
  //console.log('🟢 FlowCanvas: Input port clicked:', { blockId, portId });
  
  if (connectionLayerRef.value) {
    // Check if we're in connection mode
    if (isConnectionDragging.value && typeof connectionLayerRef.value.completePortConnection === 'function') {
      // Complete pending connection
      const success = connectionLayerRef.value.completePortConnection(blockId, portId);
      if (success) {
        // Connection completed successfully - exit connection mode
        isConnectionDragging.value = false;
      }
    } else if (typeof connectionLayerRef.value.handleInputPortDirectClick === 'function') {
      // 🎯 NEW: Handle direct input port click for disconnect
      const disconnected = connectionLayerRef.value.handleInputPortDirectClick(blockId, portId);
      if (disconnected) {
        //console.log('✅ FlowCanvas: Input port disconnected');
      }
    } else {
      //console.log('❌ FlowCanvas: input port handlers not available');
    }
  }
}

function handlePortDragEnd() {
  
  // Clear connection dragging state to restore block interactions
  isConnectionDragging.value = false;
  
  // NOTE: Removed automatic port highlighting clearing for better UX
  // Port highlighting now persists until user clicks another port or presses ESC
  
  // REMOVED: connectionLayerRef.value.stopDragging() to prevent recursion
  // Click-to-click system doesn't need old drag cleanup
}

function handlePortClick(blockId: string, portId: string, isOutput: boolean, event: MouseEvent) {
  // Alt+click for context menu (TODO: implement later)
  if (event.altKey) {
    return;
  }
  
  // Always clear previous highlighting first
  clearPortDragHighlighting();
  
  // Start new highlighting for output ports
  if (isOutput) {
    startPortDragHighlighting(blockId, portId);
  }
  // Input ports just clear highlighting (already done above)
}

function startPortDragHighlighting(blockId: string, portId: string) {
  // V2.1 Performance: Optimized port type detection for new 4-type system
  const sourceBlock = blocks.value.find(b => b.id === blockId);
  if (!sourceBlock) {
    console.warn('❌ Block not found for highlighting:', blockId);
    return;
  }
  
  const blockDefinition = getAdapterBlockDefinition(sourceBlock.definitionId) || BlockFactory.getDefinition(sourceBlock.definitionId);
  if (!blockDefinition) {
    console.warn('❌ Block definition not found for highlighting');
    return;
  }
  
  const outputPort = blockDefinition.outputs.find(p => p.id === portId);
  if (!outputPort) {
    console.warn('❌ Output port not found for highlighting:', portId);
    return;
  }
  
  const portType = Array.isArray(outputPort.type) ? outputPort.type[0] : outputPort.type;
  
  // V2.1 Enhancement: Set the dragged port with improved logging for new 4-type system
  draggedPort.value = {
    blockId,
    portId,
    portType
  };
  
  // console.log('✅ Port highlighting activated:', { 
  //   portType, 
  //   shape: getPortShapeForType(portType),
  //   compatibleTargets: PortManager.getCompatibleTargets(portType).length 
  // });
}

// V2.1 Helper: Get port shape for logging/debugging
function getPortShapeForType(portType: string): string {
  switch (portType) {
    case 'flowIn':
    case 'flowOut':
      return 'circle';
    case 'setVarNameIn':
    case 'setVarNameOut':
      return 'square';
    case 'setVarDataIn':
    case 'setVarDataOut':
      return 'star';
    case 'onErrorIn':
    case 'onErrorOut':
      return 'triangle';
    default:
      return 'circle';
  }
}

function clearPortDragHighlighting() {
  draggedPort.value = null;
}

function handlePortsInMagneticRange(magneticPorts: Array<{blockId: string, portId: string, distance: number}>) {
  // TODO: IMPLEMENT_LATER - Magnetic port highlighting can be added back if needed
  // For now, this is handled by the simplified drag highlighting system
}

// 🎯 NEW PORT CONNECTION EVENT HANDLERS
function handlePortConnectionStarted(outputBlockId: string, outputPortId: string) {
  //console.log('🟡 FlowCanvas: Port connection started:', { outputBlockId, outputPortId });
  
  // Apply CSS classes to all ports based on compatibility
  applyPortVisualStates(outputBlockId, outputPortId);
}

function handlePortConnectionCancelled() {
  //console.log('🔴 FlowCanvas: Port connection cancelled');
  
  // Remove all port visual states
  clearPortVisualStates();
}

function applyPortVisualStates(activeOutputBlockId: string, activeOutputPortId: string) {
  //console.log('🎨 Applying visual states to ports');
  
  // Add connection-mode class to canvas for cursor feedback
  const canvasElement = document.querySelector('.flow-canvas');
  if (canvasElement) {
    canvasElement.classList.add('connection-mode');
    //console.log('✅ DEBUG: Added connection-mode class to canvas');
  } else {
    //console.log('❌ DEBUG: Canvas element not found');
  }
  
  // Add active-output class to the clicked output port
  const activeOutputElement = document.querySelector(
    `[data-block-id="${activeOutputBlockId}"][data-port-name="${activeOutputPortId}"]`
  );
  if (activeOutputElement) {
    activeOutputElement.classList.add('port-active-output');
  }
  
  // Find all input ports and apply compatibility classes
  blocks.value.forEach(block => {
    if (block.id === activeOutputBlockId) return; // Skip source block
    
    const blockDef = getAdapterBlockDefinition(block.definitionId) || BlockFactory.getDefinition(block.definitionId);
    if (!blockDef) return;
    
    blockDef.inputs.forEach(inputPort => {
      const inputElement = document.querySelector(
        `[data-block-id="${block.id}"][data-port-name="${inputPort.id}"]`
      );
      
      // console.log('🔍 DEBUG: Looking for input port:', {
      //   selector: `[data-block-id="${block.id}"][data-port-name="${inputPort.id}"]`,
      //   found: !!inputElement,
      //   element: inputElement
      // });
      
      if (inputElement) {
        // Check compatibility using ConnectionLayer's function
        if (connectionLayerRef.value && typeof connectionLayerRef.value.checkPortCompatibility === 'function') {
          const isCompatible = connectionLayerRef.value.checkPortCompatibility(
            activeOutputBlockId,
            activeOutputPortId,
            block.id,
            inputPort.id
          );
          
          // console.log('🔍 DEBUG: Port compatibility:', {
          //   blockId: block.id,
          //   portId: inputPort.id,
          //   isCompatible,
          //   willAddClass: isCompatible ? 'port-compatible-input' : 'port-incompatible-input'
          // });
          
          if (isCompatible) {
            inputElement.classList.add('port-compatible-input');
            //console.log('✅ DEBUG: Added port-compatible-input class');
          } else {
            inputElement.classList.add('port-incompatible-input');
            //console.log('⚠️ DEBUG: Added port-incompatible-input class');
          }
        }
      } else {
        //console.log('❌ DEBUG: Input port element not found');
      }
    });
  });
}

function clearPortVisualStates() {
  //console.log('🧹 Clearing all port visual states');
  
  // Remove connection-mode class from canvas
  const canvasElement = document.querySelector('.flow-canvas');
  if (canvasElement) {
    canvasElement.classList.remove('connection-mode');
  }
  
  // Remove all port interaction classes from all ports
  const allPorts = document.querySelectorAll('[data-port-name]');
  allPorts.forEach(port => {
    port.classList.remove('port-active-output', 'port-compatible-input', 'port-incompatible-input');
  });
}

function handleConnectionCreated(connection: any) {
  // Connection is already added by the ConnectionLayer via useBlockEditor
  
  // Clear port visual states after successful connection
  clearPortVisualStates();
  
  // 🔄 OLD: Clear drag highlighting - COMMENTED FOR BACKUP
  // clearPortDragHighlighting();
}

function handleConnectionDeleted(connectionId: string) {
  // Connection is already removed by the ConnectionLayer via useBlockEditor
}

// Drag functionality
function startBlockDrag(event: MouseEvent, blockId: string) {
  dragState.isDragging = true;
  
  // Ако блокът не е селектиран, селектираме само него
  if (!isBlockSelected(blockId)) {
    clearSelection();
    selectBlock(blockId);
  }
  
  dragState.draggedBlocks = canvasState.selectedBlocks.slice();
  dragState.lastMousePos = { x: event.clientX, y: event.clientY };
  dragState.startPos = { x: event.clientX, y: event.clientY };
  
  document.addEventListener('mousemove', handleDocumentMouseMove);
  document.addEventListener('mouseup', handleDocumentMouseUp);
}

function updateBlockDrag(event: MouseEvent) {
  if (!isDragging.value) return;
  
  const deltaX = (event.clientX - dragState.lastMousePos.x) / canvasState.zoom;
  const deltaY = (event.clientY - dragState.lastMousePos.y) / canvasState.zoom;
  
  // Преместваме всички селектирани блокове
  dragState.draggedBlocks.forEach(blockId => {
    const block = blocks.value.find(b => b.id === blockId);
    if (block) {
      const newPos = {
        x: block.position.x + deltaX,
        y: block.position.y + deltaY,
      };
      
      // Snap to grid ако е включено
      if (props.snapToGrid) {
        newPos.x = Math.round(newPos.x / props.gridSize) * props.gridSize;
        newPos.y = Math.round(newPos.y / props.gridSize) * props.gridSize;
      }
      
      updateBlockPosition(blockId, newPos);
      emit('blockMoved', blockId, newPos);
    }
  });
  
  dragState.lastMousePos = { x: event.clientX, y: event.clientY };
}

function stopBlockDrag() {
  dragState.isDragging = false;
  dragState.draggedBlocks = [];
  
  document.removeEventListener('mousemove', handleDocumentMouseMove);
  document.removeEventListener('mouseup', handleDocumentMouseUp);
}

// Panning functionality
function startPanning(event: MouseEvent) {
  panState.isPanning = true;
  panState.startPan = { ...canvasState.pan };
  panState.startMouse = { x: event.clientX, y: event.clientY };
}

function updatePanning(event: MouseEvent) {
  if (!isPanning.value) return;
  
  const deltaX = event.clientX - panState.startMouse.x;
  const deltaY = event.clientY - panState.startMouse.y;
  
  const newPan = {
    x: panState.startPan.x + deltaX,
    y: panState.startPan.y + deltaY,
  };
  
  setPan(newPan.x, newPan.y);
  emit('canvasPanned', newPan);
}

function stopPanning() {
  panState.isPanning = false;
}

// Selection box functionality
function startSelectionBox(position: Position) {
  selectionBox.value = {
    start: position,
    end: position,
    active: true,
  };
}

function updateSelectionBox(event: MouseEvent) {
  if (!selectionBox.value?.active) return;
  
  // ТОЧНА LEGACY КООРДИНАТНА ФОРМУЛА
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  
  // LEGACY COORDINATE FORMULA: (clientX - rect.left) / zoom
  const canvasPosition = {
    x: (event.clientX - rect.left) / canvasState.zoom,
    y: (event.clientY - rect.top) / canvasState.zoom
  };
  
  selectionBox.value.end = canvasPosition;
}

function completeSelectionBox() {
  // TODO: Implement block selection within box
  selectionBox.value = null;
}

// Zoom functionality
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.1, Math.min(3, canvasState.zoom * zoomFactor));
  
  setZoom(newZoom);
  emit('canvasZoomed', newZoom);
}

function zoomIn() {
  const newZoom = Math.min(3, canvasState.zoom * 1.2);
  setZoom(newZoom);
  emit('canvasZoomed', newZoom);
}

function zoomOut() {
  const newZoom = Math.max(0.1, canvasState.zoom * 0.8);
  setZoom(newZoom);
  emit('canvasZoomed', newZoom);
}

// Smart Import Function
function smartImportFlow(importedData: any) {
 // console.log('🔥 DEBUG smartImportFlow: starting import');
  
  const isInContainer = containerNavigation?.isInContainer.value || false;
  const currentContainerId = containerNavigation?.containerModeInfo.value.currentContainerId;
  
 // console.log('🔥 DEBUG smartImportFlow: isInContainer:', isInContainer);
 // console.log('🔥 DEBUG smartImportFlow: currentContainerId:', currentContainerId);
  
  // Проверка за контейнери в импорта
  const hasContainers = importedData.blocks.some((block: any) => block.definitionId === 'container');
  
  if (isInContainer && hasContainers) {
    // БЛОКИРАНЕ: Импорт на контейнери в контейнер
    console.warn('🚫 Cannot import containers into container');
    
    $q.notify({
      type: 'negative',
      message: 'Не може да се импортират контейнери в контейнер',
      caption: 'Моля, импортирайте в основния поток',
      position: 'top-right',
      timeout: 4000,
      actions: [{ icon: 'close', color: 'white' }]
    });
    
    throw new Error('Cannot import containers into container');
  }
  
  if (isInContainer && currentContainerId) {
    // ИМПОРТ В КОНТЕЙНЕР
   // console.log('🔥 DEBUG smartImportFlow: importing to container');
    
    // Премахни съществуващите START/END от контейнера
    currentFlow.value.blocks = currentFlow.value.blocks.filter(block => 
      !(block.containerId === currentContainerId && 
        (block.definitionId === 'system.start' || block.definitionId === 'system.end'))
    );
    
    // Зареди всички блокове от файла в контейнера
    importedData.blocks.forEach((block: any) => {
      block.containerId = currentContainerId;
      if (block.definitionId === 'system.start' || block.definitionId === 'system.end') {
        block.containerSystem = true;
      }
      currentFlow.value.blocks.push(block);
    });
    
  } else {
    // ИМПОРТ В ГЛАВЕН ПОТОК
   // console.log('🔥 DEBUG smartImportFlow: importing to main flow');
    
    // Премахни съществуващите START/END от главния поток
    currentFlow.value.blocks = currentFlow.value.blocks.filter(block => 
      !((!block.containerId || !block.containerSystem) && 
        (block.definitionId === 'system.start' || block.definitionId === 'system.end'))
    );
    
    // Зареди всички блокове от файла
    importedData.blocks.forEach((block: any) => {
      // Контейнерите запазват оригиналното си ID за да работят връзките
      if (block.definitionId === 'container') {
        //console.log('🔥 DEBUG smartImportFlow: preserving container ID:', block.id);
      }
      currentFlow.value.blocks.push(block);
    });
  }
  
  // Добавяме връзките
  importedData.connections.forEach((connection: any) => {
    currentFlow.value.connections.push(connection);
  });
  
 // console.log('🔥 DEBUG smartImportFlow: import completed');
 // console.log('🔥 DEBUG smartImportFlow: total blocks now:', currentFlow.value.blocks.length);
  //console.log('🔥 DEBUG smartImportFlow: total connections now:', currentFlow.value.connections.length);
}

function resetView() {
  setZoom(1);
  setPan(0, 0);
  emit('canvasZoomed', 1);
  emit('canvasPanned', { x: 0, y: 0 });
}

// Grid toggle
function toggleGrid() {
  // Emit за родителя да управлява grid state
  emit('canvasPanned', { x: 0, y: 0 }); // Hack за да trigger update
}

// Enhanced topological sort following flow logic: START → connected blocks → END
function topologicalSortBlocks(blocksToSort: any[], connectionsToSort: any[]): any[] {
  // console.log('🔍 Topological Sort Debug:', {
  //   'Total blocks': blocksToSort.length,
  //   'Total connections': connectionsToSort.length,
  //   'Block IDs': blocksToSort.map(b => `${b.id}(${b.definitionId})`),
  //   'Connections': connectionsToSort.map(c => `${c.sourceBlockId}->${c.targetBlockId}`)
  // });

  // Create adjacency map
  const adjacencyMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const visited = new Set<string>();
  
  // Initialize all blocks
  blocksToSort.forEach(block => {
    adjacencyMap.set(block.id, []);
    inDegree.set(block.id, 0);
  });
  
  // Build adjacency map from connections
  connectionsToSort.forEach(conn => {
    const source = conn.sourceBlockId;
    const target = conn.targetBlockId;
    
    if (adjacencyMap.has(source) && adjacencyMap.has(target)) {
      adjacencyMap.get(source)!.push(target);
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
    }
  });
  
  // Find START blocks (system.start has priority)
  const startBlocks = blocksToSort.filter(block => 
    block.definitionId === 'system.start'
  );
  
  // If no START blocks, use blocks with no incoming connections
  if (startBlocks.length === 0) {
    startBlocks.push(...blocksToSort.filter(block => 
      inDegree.get(block.id) === 0
    ));
  }
  
 // console.log('🚀 Starting traversal from:', startBlocks.map(b => b.id));
  
  // DFS traversal from START blocks to collect all reachable blocks
  const sortedIds: string[] = [];
  
  function dfsTraversal(blockId: string) {
    if (visited.has(blockId)) return;
    
    visited.add(blockId);
    sortedIds.push(blockId);
    
    // Visit all connected blocks
    const neighbors = adjacencyMap.get(blockId) || [];
    neighbors.forEach(neighborId => {
      dfsTraversal(neighborId);
    });
  }
  
  // Start DFS from all START blocks
  startBlocks.forEach(startBlock => {
    dfsTraversal(startBlock.id);
  });
  
  // Include any remaining unvisited blocks (isolated components)
  blocksToSort.forEach(block => {
    if (!visited.has(block.id)) {
      console.log('⚠️ Including isolated block:', block.id, block.definitionId);
      sortedIds.push(block.id);
    }
  });
  
//  console.log('✅ Final sorted order:', sortedIds.length, 'blocks');
  
  // Return blocks in traversal order
  const blockMap = new Map(blocksToSort.map(block => [block.id, block]));
  return sortedIds.map(id => blockMap.get(id)).filter(Boolean);
}

// Save Functions
function getCurrentFlowData() {
  // Return current flow data based on mode (container vs main)
  let blocksToReturn;
  let connectionsToReturn;
  
  if (containerNavigation && containerNavigation.isInContainer.value) {
    // Container mode: return filtered data
    blocksToReturn = blocks.value;
    connectionsToReturn = connections.value;
  } else {
    // Main mode: return all blocks
    blocksToReturn = props.allBlocks || blocks.value;
    connectionsToReturn = connections.value;
  }

  // Transform IF/LOOP blocks from old format to new format
  const transformedBlocks = FlowExporter.transformIfLoopBlocks(blocksToReturn);

  return {
    id: currentFlow.value?.id || `flow_${Date.now()}`,
    meta: {
      version: "1.0",
      name: currentFlow.value?.meta?.name || '',
      description: currentFlow.value?.meta?.description || '',
      createdAt: currentFlow.value?.meta?.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      exportType: "main",
      exportedAt: new Date().toISOString(),
      exportedBy: "FlowEditor v3 Canvas",
      flowEditorVersion: "3.0.0",
      formatVersion: "3.0.0",
      isMonitoringFlow: currentFlow.value?.meta?.isMonitoringFlow || false
    },
    blocks: transformedBlocks,
    connections: connectionsToReturn,
    canvas: {
      zoom: canvasState.zoom,
      pan: { x: canvasState.pan?.x || 0, y: canvasState.pan?.y || 0 },
      grid: {
        enabled: true,
        size: 20
      }
    },
    exportStats: {
      totalBlocks: transformedBlocks.length,
      totalConnections: connectionsToReturn.length,
      blockTypes: {},
      categories: {}
    }
  };
}

async function handleSave(saveOptions: any) {
  try {
    console.log('🐛 DEBUG: handleSave called with:', saveOptions);
    
    // Update currentFlow meta with new data from dialog
    if (currentFlow.value) {
      currentFlow.value.meta.name = saveOptions.name;
      currentFlow.value.meta.description = saveOptions.description;
      console.log('🐛 DEBUG: Updated currentFlow.meta before save:', currentFlow.value.meta.name, currentFlow.value.meta.description);
    }
    
    // Get current flow data
    const flowData = getCurrentFlowData();
    console.log('🐛 DEBUG: flowData.meta:', flowData.meta);
    
    // Perform validation to determine status
    const validation = FlowValidator.validateFlow(currentFlow.value);
    const validationStatus = validation.isValid ? 'ready' : 'draft';
    console.log('🔍 Flow validation status:', validationStatus, 'errors:', validation.errors.length);

    // Add validation summary to flowData for consistency with Export
    flowData.validationSummary = {
      isValid: validation.isValid,
      lastValidatedAt: new Date().toISOString(),
      criticalErrors: validation.errors.length,
      warnings: validation.warnings.length,
      canExecute: validation.isValid
    };
    
    // Show warning if flow has errors
    if (!validation.isValid) {
      const confirmed = await new Promise((resolve) => {
        $q.dialog({
          title: 'Потокът има грешки',
          message: `Потокът има ${validation.errors.length} критични грешки и ще е невалиден. Искате ли да продължите?`,
          cancel: true,
          persistent: true
        }).onOk(() => resolve(true)).onCancel(() => resolve(false));
      });

      if (!confirmed) {
        return; // User cancelled save
      }
    }

    // Determine URL and method based on edit mode
    const isEditMode = !!props.editFlowId;
    const url = isEditMode
      ? `${API_BASE_URL}/flow-templates/${props.editFlowId}`
      : `${API_BASE_URL}/flow-templates/save`;
    const method = isEditMode ? 'PUT' : 'POST';

    // Call backend save endpoint
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        flowData,
        metadata: {
          name: saveOptions.name,
          description: saveOptions.description,
          version: saveOptions.versionType === 'major' ? undefined : undefined, // Let backend auto-increment
          forceNewVersion: false,
          validationStatus: validationStatus
        },
        saveOptions: {
          isMonitoringFlow: saveOptions.isMonitoringFlow || false
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: `Flow "${saveOptions.name}" запазен успешно`,
        caption: `Версия ${result.data.version} запазена успешно`,
        position: 'top-right',
        timeout: 3000
      });
      
      // Clear temp files if requested
      if (saveOptions.clearTempFiles) {
        // TODO: IMPLEMENT_LATER - Clear temp files via AutoSaveService
        console.log('🧹 Clearing temp files requested');
      }
      
      // Close dialog
      showSaveDialog.value = false;
      
    } else {
      throw new Error(result.error || 'Save failed');
    }
    
  } catch (error: any) {
    console.error('💥 Save error:', error);
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване',
      caption: error.message,
      position: 'top-right',
      timeout: 5000
    });
  }
}

function handleSaveCancel() {
  showSaveDialog.value = false;
}

// Export/Import/Validation functions
async function exportFlow() {
  exportImportState.isExporting = true;
  
  try {
    let blocksToExport;
    let connectionsToExport;
    let fileName;
    
   // console.log('🔥 DEBUG FlowCanvas Export: containerNavigation:', containerNavigation);
   // console.log('🔥 DEBUG FlowCanvas Export: isInContainer:', containerNavigation?.isInContainer.value);
    
    if (containerNavigation && containerNavigation.isInContainer.value) {
      // Container mode: export only current container using filtered data
      const containerName = containerNavigation.containerModeInfo.value.currentContainerName || 'Container';
      //console.log('🔥 DEBUG FlowCanvas Export Container: blocks count:', blocks.value.length);
     // console.log('🔥 DEBUG FlowCanvas Export Container: connections count:', connections.value.length);
      
      // Use filtered data from props (already processed by FlowEditor computed functions)
      blocksToExport = blocks.value;
      connectionsToExport = connections.value;
      fileName = `container-${containerName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    } else {
      // Main mode: export entire flow using raw unfiltered blocks
      blocksToExport = props.allBlocks || blocks.value;
      connectionsToExport = connections.value;
      fileName = `flow-${currentFlow.value.meta.name?.replace(/\s+/g, '-') || 'export'}-${new Date().toISOString().slice(0, 10)}.json`;
      
      // 🔍 DEBUG: Analyze block data sources
      // console.log('🔍 Export Debug - Block Data Sources:', {
      //   'props.allBlocks length': props.allBlocks?.length || 0,
      //   'blocks.value length': blocks.value?.length || 0,
      //   'connectionsToExport length': connectionsToExport?.length || 0,
      //   'Using data source': props.allBlocks ? 'props.allBlocks' : 'blocks.value',
      //   'allBlocks IDs': props.allBlocks?.map(b => `${b.id}(${b.definitionId})`) || [],
      //   'filtered IDs': blocks.value?.map(b => `${b.id}(${b.definitionId})`) || [],
      //   'connection targets': connectionsToExport?.map(c => `${c.sourceBlockId}->${c.targetBlockId}`) || []
      // });
    }
    
    // ✨ NEW: Validate export consistency before proceeding
    const consistencyCheck = ConnectionValidator.validateExportConsistency(
      blocksToExport,
      connectionsToExport
    );
    
   // console.log('🔍 FlowCanvas Export Consistency Check:', consistencyCheck);
    
    if (!consistencyCheck.isValid) {
      console.warn('⚠️ FlowCanvas Export consistency issues detected:', consistencyCheck.errors);
      
      // Use only valid connections for export
      connectionsToExport = consistencyCheck.validConnections;
      
      // Show warning to user
      $q.notify({
        type: 'warning',
        message: `Открити проблеми в експорта: ${consistencyCheck.errors.length} орфани връзки`,
        caption: 'Експортът ще включи само валидни връзки',
        position: 'top-right',
        timeout: 5000,
        actions: [{ icon: 'close', color: 'white' }]
      });
    }
    
    // Apply topological sort to final blocks
    const sortedBlocks = topologicalSortBlocks(blocksToExport, connectionsToExport);
   // console.log('🔥 DEBUG FlowCanvas Export: Original order:', blocksToExport.map(b => `${b.definitionId}(${b.id.slice(-2)})`));
    //console.log('🔥 DEBUG FlowCanvas Export: Sorted order:', sortedBlocks.map(b => `${b.definitionId}(${b.id.slice(-2)})`));

    const dataToExport = {
      ...currentFlow.value,
      meta: {
        ...currentFlow.value.meta,
        name: containerNavigation && containerNavigation.isInContainer.value 
          ? `${containerNavigation.containerModeInfo.value.currentContainerName || 'Container'}` 
          : currentFlow.value.meta.name,
        exportType: containerNavigation && containerNavigation.isInContainer.value ? 'container' : 'main',
        containerId: containerNavigation && containerNavigation.isInContainer.value 
          ? containerNavigation.containerModeInfo.value.currentContainerId 
          : undefined
      },
      blocks: sortedBlocks, // Using topologically sorted blocks
      connections: connectionsToExport // Using validated connections
    };

    const result = FlowExporter.exportFlow(dataToExport, { 
      pretty: true,
      includeValidation: true,
      exportedBy: 'FlowEditor v3 Canvas',
    });
    
    if (result.success && result.data) {
      // Създаваме downloadable файл
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      exportImportState.exportResult = result;
      
      // Show success notification with consistency info
      const baseMessage = containerNavigation && containerNavigation.isInContainer.value
        ? `Контейнер експортиран успешно`
        : 'Поток експортиран успешно';
      
      const summaryMessage = consistencyCheck.isValid 
        ? baseMessage
        : `${baseMessage} (${connectionsToExport.length}/${consistencyCheck.validConnections.length + consistencyCheck.orphanedConnections.length} връзки)`;
      
      $q.notify({
        type: 'positive',
        message: summaryMessage,
        position: 'top-right',
        timeout: 3000
      });
      
      if (result.warnings && result.warnings.length > 0) {
        console.warn('⚠️ Export warnings:', result.warnings);
        $q.notify({
          type: 'warning',
          message: `Предупреждения: ${result.warnings.join(', ')}`,
          position: 'top-right',
          timeout: 4000
        });
      }
    } else {
      exportImportState.exportResult = result;
      $q.notify({
        type: 'negative',
        message: `Грешка при експорт: ${result.error}`,
        position: 'top-right',
        timeout: 5000
      });
    }
  } catch (error) {
    console.error('🚨 FlowCanvas Export error:', error);
    $q.notify({
      type: 'negative',
      message: 'Неочаквана грешка при експорт',
      position: 'top-right',
      timeout: 5000
    });
  } finally {
    exportImportState.isExporting = false;
  }
}

// Export flow to file using FlowExporter
function exportFlowToFile() {
  try {
    // Get current flow data
    const flowData = getCurrentFlowData();
    
    // Use FlowExporter to export with validation
    const exportResult = FlowExporter.exportFlow(flowData, {
      pretty: true,
      includeValidation: true,
      exportedBy: 'FlowCanvas Export Test'
    });
    
    if (exportResult.success && exportResult.data) {
      // Create download link
      const blob = new Blob([exportResult.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flow_export_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      $q.notify({
        type: 'positive',
        message: 'Flow експортиран успешно',
        caption: 'Файлът е запазен',
        position: 'top-right',
        timeout: 3000
      });
      
      // Log export stats for analysis
      console.log('🔥 FlowExporter Export Result:', exportResult);
      if (exportResult.warnings?.length) {
        console.log('⚠️ Export warnings:', exportResult.warnings);
      }
    } else {
      throw new Error(exportResult.error || 'Export failed');
    }
  } catch (error) {
    console.error('❌ Export error:', error);
    $q.notify({
      type: 'negative',
      message: 'Грешка при експорт',
      caption: error.message || 'Unknown error',
      position: 'top-right',
      timeout: 5000
    });
  }
}

function importFlow() {
  if (props.readonly) return;
  // Създаваме temporен file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    exportImportState.isImporting = true;
    
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
     // console.log('🔥 DEBUG Import: imported data:', importedData);
      //console.log('🔥 DEBUG Import: containerNavigation:', containerNavigation);
     // console.log('🔥 DEBUG Import: isInContainer:', containerNavigation?.isInContainer.value);
      
      // Smart Import Logic
      smartImportFlow(importedData);
      
      exportImportState.importResult = { success: true };
      
      // Reset canvas view
      resetView();
      
      // Show success notification
      $q.notify({
        type: 'positive',
        message: 'Потокът е импортиран успешно',
        position: 'top-right',
        timeout: 2000
      });
      
    } catch (error) {
      console.error('Import error:', error);
      exportImportState.importResult = { success: false, error: error.message };
      
      $q.notify({
        type: 'negative',
        message: 'Грешка при импорт на потока',
        position: 'top-right',
        timeout: 3000
      });
    } finally {
      exportImportState.isImporting = false;
      document.body.removeChild(input);
    }
  };
  
  document.body.appendChild(input);
  input.click();
}

async function validateFlow() {
  exportImportState.isValidating = true;
  
  try {
    // TEMPORARY FIX: Use simple FlowValidator instead of UniversalValidationService
    // to prevent hanging/recursion during save
    const validation = FlowValidator.validateFlow(currentFlow.value);
    exportImportState.lastValidation = {
      isValid: validation.isValid,
      errors: validation.errors.map(e => ({
        code: e.code,
        message: e.message, 
        severity: e.severity || 'error',
        blockId: e.blockId,
        connectionId: e.connectionId,
        context: e.context
      })),
      warnings: validation.warnings.map(w => ({
        code: w.code,
        message: w.message,
        severity: w.severity || 'warning', 
        blockId: w.blockId,
        connectionId: w.connectionId,
        context: w.context
      })),
      canUseInActionTemplate: validation.isValid,
      summary: {
        totalChecks: validation.errors.length + validation.warnings.length,
        passedChecks: validation.warnings.length,
        failedChecks: validation.errors.length,
        structureScore: validation.isValid ? 100 : 0,
        logicScore: validation.isValid ? 100 : 0,
        targetScore: 100
      }
    };
    // const validation = await UniversalValidationService.validateFlow(currentFlow.value, { mode: 'full' });
    exportImportState.lastValidation = validation;
    
    // Log validation results
    if (validation.isValid) {
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning, index) => {
        });
      }
    } else {
      validation.errors.forEach((error, index) => {
      });
      
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning, index) => {
        });
      }
    }
    
    // Log summary
    if (validation.summary.orphanedBlocks > 0) {
    }
    
  } catch (error) {
  } finally {
    exportImportState.isValidating = false;
  }
}

// Global event handlers
function handleDocumentMouseMove(event: MouseEvent) {
  handleCanvasMouseMove(event);
}

function handleDocumentMouseUp(event: MouseEvent) {
  handleCanvasMouseUp(event);
}

// 🎯 NEW: Refresh connections function
function refreshConnections() {
  //console.log('🔄 FlowCanvas: Refreshing connections...');
  
  if (connectionLayerRef.value && typeof connectionLayerRef.value.refreshConnections === 'function') {
    connectionLayerRef.value.refreshConnections();
  } else {
   // console.log('❌ FlowCanvas: refreshConnections not available');
  }
}

// New toolbar functions
function createNewFlow() {
  if (props.readonly) return;
  // Use the proper createNewFlow from useBlockEditor - this will create system blocks
  const { createNewFlow: editorCreateNewFlow } = blockEditor;
  editorCreateNewFlow('Нов Flow');
  
  // Reset UI state
  canvasState.selectedBlocks = [];
  canvasState.hoveredBlock = null;
  
  // Reset view
  resetView();
  
  // Clear validation
  exportImportState.lastValidation = null;
}

function clearOrphanedBlocks() {
  if (props.readonly) return;
  // Remove blocks that have no connections, but NEVER remove system blocks
  const connectedBlockIds = new Set<string>();
  
  // Collect all connected block IDs from connections
  allConnections.value.forEach(connection => {
    connectedBlockIds.add(connection.sourceBlockId);
    connectedBlockIds.add(connection.targetBlockId);
  });
  
  // Find orphaned blocks (blocks with no connections) - use allBlocks directly
  // EXCLUDE system blocks from deletion (system.start, system.end)
  const orphanedBlocks = allBlocks.value.filter(block => 
    !connectedBlockIds.has(block.id) && 
    block.definitionId !== 'system.start' && 
    block.definitionId !== 'system.end'
  );
  
  if (orphanedBlocks.length === 0) {
    return;
  }
  
  // Remove orphaned blocks - modify allBlocks.value directly (which is currentFlow.value.blocks)
  orphanedBlocks.forEach(block => {
    const index = allBlocks.value.findIndex(b => b.id === block.id);
    if (index !== -1) {
      allBlocks.value.splice(index, 1);
    }
  });
  
  // Clear selection if any selected blocks were removed
  canvasState.selectedBlocks = canvasState.selectedBlocks.filter(blockId => 
    !orphanedBlocks.some(block => block.id === blockId)
  );
}

// TODO: IMPLEMENT_LATER - History management
function undoAction() {
}

function redoAction() {
}

async function saveFlow() {
  if (props.readonly) return
  
  try {
    // Validate flow before showing save dialog
    await validateFlow()
    
    // Show save dialog
    showSaveDialog.value = true
    
  } catch (error) {
    console.error('❌ Save flow error:', error)
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване',
      position: 'top-right',
      timeout: 3000
    })
  }
}

// TODO: IMPLEMENT_LATER - Drag mode toggle
function toggleDragMode() {
}

// Demo functions за добавяне на блокове
function addDemoBlock() {
  const centerX = (-canvasState.pan.x + 400) / canvasState.zoom;
  const centerY = (-canvasState.pan.y + 300) / canvasState.zoom;
  
  addSensorReadBlock({ x: centerX, y: centerY });
}

function addDemoBlocks() {
  // Използваме фиксирани координати за тестване
  const startX = 100;
  const startY = 100;
  
  
  // Добавяме sensor блок
  addSensorReadBlock({ x: startX, y: startY });
  
  // TODO: IMPLEMENT_LATER - Add more real blocks when available
  
}

// Debug functions
function diagnoseFlowProblems() {
  console.log('🔍 === FLOW DIAGNOSTICS START ===');
  
  // 1. Current flow overview
  console.log('📊 Flow Overview:');
  console.log('  - Total blocks:', allBlocks.value.length);
  console.log('  - Total connections:', allConnections.value.length);
  console.log('  - Flow meta:', currentFlow.value.meta);
  
  // 2. setVarName blocks analysis
  console.log('\n🔤 setVarName Blocks Analysis:');
  const setVarNameBlocks = allBlocks.value.filter(block => 
    block.definitionId === 'setVarName' || block.definitionId === 'support.setVarName'
  );
  console.log('  - Found setVarName blocks:', setVarNameBlocks.length);
  
  setVarNameBlocks.forEach((block, index) => {
    console.log(`  [${index + 1}] Block ID: ${block.id}`);
    console.log(`      Definition ID: ${block.definitionId}`);
    console.log(`      Variable Name: ${block.parameters?.internalVar || 'UNDEFINED'}`);
    console.log(`      Parameters:`, block.parameters);
  });
  
  // 3. setVarData blocks analysis
  console.log('\n📊 setVarData Blocks Analysis:');
  const setVarDataBlocks = allBlocks.value.filter(block => 
    block.definitionId === 'setVarData' || block.definitionId === 'support.setVarData'
  );
  console.log('  - Found setVarData blocks:', setVarDataBlocks.length);
  
  setVarDataBlocks.forEach((block, index) => {
    console.log(`  [${index + 1}] Block ID: ${block.id}`);
    console.log(`      Definition ID: ${block.definitionId}`);
    console.log(`      Source Variable: ${block.parameters?.sourceVariable || 'UNDEFINED'}`);
    console.log(`      Parameters:`, block.parameters);
  });
  
  // 4. Variables mapping
  console.log('\n🔗 Variables Mapping:');
  const definedVars = new Set();
  const referencedVars = new Set();
  
  setVarNameBlocks.forEach(block => {
    const varName = block.parameters?.internalVar;
    if (varName) definedVars.add(varName);
  });
  
  setVarDataBlocks.forEach(block => {
    const varName = block.parameters?.sourceVariable;
    if (varName) referencedVars.add(varName);
  });
  
  console.log('  - Defined variables:', Array.from(definedVars));
  console.log('  - Referenced variables:', Array.from(referencedVars));
  console.log('  - Missing variables:', Array.from(referencedVars).filter(v => !definedVars.has(v)));
  
  // 5. Connections analysis for cycles
  console.log('\n🔄 Connections Analysis:');
  console.log('  - Total connections:', allConnections.value.length);
  
  // Build adjacency map to show connections
  const adjacencyMap = new Map();
  allConnections.value.forEach(conn => {
    const source = conn.sourceBlockId;
    const target = conn.targetBlockId;
    if (!adjacencyMap.has(source)) adjacencyMap.set(source, []);
    adjacencyMap.get(source).push(target);
    console.log(`    ${source} → ${target} (${conn.sourcePortId} → ${conn.targetPortId})`);
  });
  
  // 6. Look for potential cycles
  console.log('\n🌀 Potential Cycle Analysis:');
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];
  
  const findCycles = (blockId, path) => {
    if (recursionStack.has(blockId)) {
      const cycleStart = path.indexOf(blockId);
      const cycle = path.slice(cycleStart);
      cycles.push(cycle);
      console.log(`    Found cycle: ${cycle.join(' → ')}`);
      return;
    }
    
    if (visited.has(blockId)) return;
    
    visited.add(blockId);
    recursionStack.add(blockId);
    
    const neighbors = adjacencyMap.get(blockId) || [];
    neighbors.forEach(neighbor => {
      findCycles(neighbor, [...path, neighbor]);
    });
    
    recursionStack.delete(blockId);
  };
  
  allBlocks.value.forEach(block => {
    if (!visited.has(block.id)) {
      findCycles(block.id, [block.id]);
    }
  });
  
  console.log('  - Total cycles found:', cycles.length);
  
  // 7. Legacy vs New system blocks
  console.log('\n🔄 Legacy vs New System Analysis:');
  const legacyBlocks = allBlocks.value.filter(block => !block.definitionId.includes('.'));
  const newBlocks = allBlocks.value.filter(block => block.definitionId.includes('.'));
  
  console.log('  - Legacy blocks (old system):', legacyBlocks.length);
  legacyBlocks.forEach(block => {
    console.log(`    ${block.id}: ${block.definitionId}`);
  });
  
  console.log('  - New blocks (new system):', newBlocks.length);
  newBlocks.forEach(block => {
    console.log(`    ${block.id}: ${block.definitionId}`);
  });
  
  console.log('\n🔍 === FLOW DIAGNOSTICS END ===');
}

function diagnoseBlockSystem() {
  console.log('🔧 === BLOCK SYSTEM DIAGNOSTICS START ===');
  
  // 1. Block loading system analysis
  console.log('\n📦 Block Loading System Analysis:');
  
  // Check what block factory/loader is being used
  console.log('  - getAdapterBlockDefinition function:', typeof getAdapterBlockDefinition);
  
  // Test a few blocks to see their definitions
  const testBlocks = ['sensor', 'actuator', 'setVarName', 'setVarData', 'system.start', 'system.end'];
  
  testBlocks.forEach(blockId => {
    const definition = getAdapterBlockDefinition(blockId);
    console.log(`  - Block "${blockId}":`, {
      found: !!definition,
      id: definition?.id,
      type: definition?.type,
      blockType: definition?.blockType,
      category: definition?.category
    });
  });
  
  // 2. Analyze current blocks in flow
  console.log('\n🎯 Current Flow Blocks Analysis:');
  allBlocks.value.forEach((block, index) => {
    const definition = getAdapterBlockDefinition(block.definitionId);
    console.log(`  [${index + 1}] Block: ${block.id}`);
    console.log(`      definitionId: ${block.definitionId}`);
    console.log(`      Definition found: ${!!definition}`);
    console.log(`      Expected new format: ${block.definitionId.includes('.')}`);
    
    if (definition) {
      console.log(`      Definition ID: ${definition.id}`);
      console.log(`      Definition type: ${definition.type}`);
      console.log(`      Block type: ${definition.blockType}`);
    } else {
      console.log(`      ❌ No definition found for ${block.definitionId}`);
    }
  });
  
  // 3. Block creation system analysis
  console.log('\n🏗️ Block Creation System:');
  
  // Check if there are any legacy block creation methods still active
  const blockCreationSources = [];
  
  // Check if legacy BlockFactory exists
  if (typeof window !== 'undefined' && (window as any).BlockFactory) {
    blockCreationSources.push('Legacy BlockFactory (window.BlockFactory)');
  }
  
  // Check if new system components are loaded
  try {
    const hasNewSystem = !!getAdapterBlockDefinition;
    blockCreationSources.push(`New Adapter System: ${hasNewSystem}`);
  } catch (e) {
    blockCreationSources.push(`New Adapter System: Error - ${e.message}`);
  }
  
  console.log('  - Active block creation sources:');
  blockCreationSources.forEach((source, index) => {
    console.log(`    [${index + 1}] ${source}`);
  });
  
  // 4. Definition ID format analysis
  console.log('\n🔍 Definition ID Format Analysis:');
  
  const definitionIdStats = {
    withDots: 0,
    withoutDots: 0,
    systemBlocks: 0,
    coreBlocks: 0,
    supportBlocks: 0,
    unknownFormat: 0
  };
  
  allBlocks.value.forEach(block => {
    const id = block.definitionId;
    
    if (id.includes('.')) {
      definitionIdStats.withDots++;
      if (id.startsWith('system.')) definitionIdStats.systemBlocks++;
      else if (id.startsWith('core.')) definitionIdStats.coreBlocks++;
      else if (id.startsWith('support.')) definitionIdStats.supportBlocks++;
    } else {
      definitionIdStats.withoutDots++;
    }
  });
  
  console.log('  - Statistics:');
  console.log(`    Blocks with dots (new format): ${definitionIdStats.withDots}`);
  console.log(`    Blocks without dots (legacy format): ${definitionIdStats.withoutDots}`);
  console.log(`    System blocks (system.*): ${definitionIdStats.systemBlocks}`);
  console.log(`    Core blocks (core.*): ${definitionIdStats.coreBlocks}`);
  console.log(`    Support blocks (support.*): ${definitionIdStats.supportBlocks}`);
  
  // 5. Migration status analysis
  console.log('\n🚀 Migration Status Analysis:');
  
  const migrationStatus = {
    fullyMigrated: definitionIdStats.withoutDots === 0,
    partiallyMigrated: definitionIdStats.withDots > 0 && definitionIdStats.withoutDots > 0,
    notMigrated: definitionIdStats.withDots === 0,
    systemBlocksMigrated: definitionIdStats.systemBlocks > 0,
    coreBlocksNotMigrated: definitionIdStats.coreBlocks === 0 && allBlocks.value.some(b => 
      ['sensor', 'actuator', 'if', 'loop', 'merge'].includes(b.definitionId)
    ),
    supportBlocksNotMigrated: definitionIdStats.supportBlocks === 0 && allBlocks.value.some(b => 
      ['setVarName', 'setVarData', 'errorHandler'].includes(b.definitionId)
    )
  };
  
  console.log('  - Migration assessment:');
  console.log(`    Fully migrated: ${migrationStatus.fullyMigrated}`);
  console.log(`    Partially migrated: ${migrationStatus.partiallyMigrated}`);
  console.log(`    Not migrated: ${migrationStatus.notMigrated}`);
  console.log(`    System blocks migrated: ${migrationStatus.systemBlocksMigrated}`);
  console.log(`    Core blocks need migration: ${migrationStatus.coreBlocksNotMigrated}`);
  console.log(`    Support blocks need migration: ${migrationStatus.supportBlocksNotMigrated}`);
  
  // 6. Recommendations
  console.log('\n💡 Recommendations:');
  
  if (migrationStatus.fullyMigrated) {
    console.log('  ✅ All blocks are using the new system format');
  } else if (migrationStatus.partiallyMigrated) {
    console.log('  ⚠️ Mixed system detected - some blocks need migration');
    
    if (migrationStatus.coreBlocksNotMigrated) {
      console.log('  🔧 Core blocks (sensor, actuator, if, etc.) need ID format migration');
    }
    
    if (migrationStatus.supportBlocksNotMigrated) {
      console.log('  🔧 Support blocks (setVarName, setVarData, etc.) need ID format migration');
    }
  } else {
    console.log('  ❌ No blocks are using the new system format');
  }
  
  console.log('\n🔧 === BLOCK SYSTEM DIAGNOSTICS END ===');
}

function toggleMagneticZones() {
  debugState.showMagneticZones = !debugState.showMagneticZones;
}

async function runPositionTests() {
  
  if (blocks.value.length === 0) {
    return;
  }
  
  try {
    const reports = await PositionValidationTests.runFullValidationSuite(blocks.value);
    debugState.testResults = reports;
  } catch (error) {
    // TODO: IMPLEMENT_LATER - Add error handling for position validation tests
  }
}

function logCurrentPositions() {
  // TODO: IMPLEMENT_LATER - Add position logging functionality
  const canvasInfo = {
    zoom: canvasState.zoom,
    pan: canvasState.pan,
    selectedBlocks: canvasState.selectedBlocks.length
  };
  
  // TODO: IMPLEMENT_LATER - Add magnetic ports and active ports logging
}

// 🎯 ESC key handler for canceling active port connections
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    //console.log('🔴 FlowCanvas: ESC key pressed - canceling connection');
    
    // Cancel active port connection
    if (connectionLayerRef.value && typeof connectionLayerRef.value.cancelPortConnection === 'function') {
      connectionLayerRef.value.cancelPortConnection();
      isConnectionDragging.value = false;
    }
    
    // 🔄 OLD: Clear port highlighting - COMMENTED FOR BACKUP
    // clearPortDragHighlighting();
  }
}

// 🎯 Canvas click handler for canceling active port connections
function handleCanvasClick(event: MouseEvent) {
  // console.log('🔍 DEBUG CANVAS CLICK:', {
  //   target: event.target,
  //   currentTarget: event.currentTarget,
  //   targetClasses: (event.target as Element)?.classList,
  //   targetTagName: (event.target as Element)?.tagName,
  //   hasPortClickFlag: !!(event.target as any)?._isPortClick,
  //   closestPortElement: (event.target as Element)?.closest('.port-input, .port-output'),
  //   isInConnectionMode: !!connectionLayerRef.value?.isConnectionActive
  // });
  
  // 🛡️ CRITICAL FIX: Multiple checks to prevent port click interference
  
  // Check 1: Port click flag
  if ((event.target as any)?._isPortClick) {
    //console.log('🛡️ FlowCanvas: Ignoring canvas click - port click flag detected');
    return;
  }
  
  // Check 2: Event target is port element
  if (event.target && (event.target as Element).closest('.port-input, .port-output')) {
    //console.log('🛡️ FlowCanvas: Ignoring canvas click from port interaction');
    return;
  }
  
  // Check 3: Event target has port classes
  if (event.target && (event.target as Element).classList?.contains('port-input-circle-icon')) {
    //console.log('🛡️ FlowCanvas: Ignoring canvas click from input port icon');
    return;
  }
  
  //console.log('🔴 FlowCanvas: Canvas clicked - canceling connection');
  
  // Cancel active port connection
  if (connectionLayerRef.value && typeof connectionLayerRef.value.cancelPortConnection === 'function') {
    connectionLayerRef.value.cancelPortConnection();
    isConnectionDragging.value = false;
  }
  
  // 🔄 OLD: Clear port highlighting - COMMENTED FOR BACKUP
  // clearPortDragHighlighting();
  // OLD: cancelPendingConnection call - now handled above
}

// Simple fix: Clear highlighting on mouse up anywhere
function handleMouseUp() {
  clearPortDragHighlighting();
}

// Lifecycle
onMounted(() => {
  // Add ESC key listener for clearing port highlighting
  document.addEventListener('keydown', handleKeyDown);
  
  // Simple fix: Add global mouse up listener to clear highlighting
  document.addEventListener('mouseup', handleMouseUp);
  
  // TODO: IMPLEMENT_LATER - добави demo блокове при нужда
  // addDemoBlocks(); // Временно изключено за чист canvas
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDocumentMouseMove);
  document.removeEventListener('mouseup', handleDocumentMouseUp);
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('mouseup', handleMouseUp);
});

// === CONTAINER FUNCTIONS ===

/**
 * Създава контейнер от селектираните блокове
 */
function createContainerFromSelection() {
  if (props.readonly) return;
  const selectedBlocks = canvasState.selectedBlocks;
  
  if (selectedBlocks.length === 0) {
    return;
  }

  // Prompt за име на контейнера
  const containerName = prompt('Въведете име за контейнера:', 'Нов Контейнер');
  if (!containerName) {
    return;
  }

  // Изчисляваме позиция в центъра на селектираните блокове
  const positions = selectedBlocks.map(blockId => {
    const block = blocks.value.find(b => b.id === blockId);
    return block ? block.position : { x: 0, y: 0 };
  });

  const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
  const centerY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;

  // Създаваме контейнера
  const container = createContainer(containerName, selectedBlocks, { x: centerX, y: centerY });
  
  if (container) {
    // Изчистваме селекцията
    clearSelection();
    
    // Уведомяваме за успех
    //console.log('Container created successfully:', container);
  }
}

/**
 * Обработва double-click на container block за влизане в контейнера
 */
function handleContainerDoubleClick(containerId: string) {
  emit('containerEntered', containerId);
}

function handleContainerEntered(containerId: string) {
  //console.log('🔥 DEBUG FlowCanvas: handleContainerEntered called with:', containerId);
 // console.log('🔥 DEBUG FlowCanvas: About to emit containerEntered');
  emit('containerEntered', containerId);
 // console.log('🔥 DEBUG FlowCanvas: containerEntered emitted');
}

// Expose methods for parent components
defineExpose({
  addDemoBlock,
  addDemoBlocks,
  resetView,
  zoomIn,
  zoomOut,
  exportFlow,
  importFlow,
  validateFlow,
  createNewFlow,
  clearOrphanedBlocks,
  saveFlow,
  exportImportState,
  // Container methods
  createContainerFromSelection,
  handleContainerDoubleClick,
  // Debug methods
  toggleMagneticZones,
  runPositionTests,
  logCurrentPositions,
  diagnoseFlowProblems,
  diagnoseBlockSystem,
  debugState,
});
</script>

<style scoped>
.flow-editor-page {
  padding: 0;
  height: 100%;
}

/* 🎯 CONNECTION MODE CURSOR FEEDBACK */
:deep(.flow-canvas.connection-mode) {
  cursor: crosshair !important;
}

.coordinates-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 200px;
}

.coord-item {
  margin-bottom: 2px;
  white-space: nowrap;
}

.coord-item:last-child {
  margin-bottom: 0;
}

.flow-canvas-container {
  position: relative;
  width: 200%; /* Увеличаваме container-а и хоризонтално */
  height: 200%; /* Значително увеличаваме container-а вертикално */
  min-height: 1200px; /* Значително увеличаваме min-height също */
  min-width: 1200px; /* Добавяме min-width за хоризонталното разширение */
  overflow: auto; /* Позволяваме scroll за да се види новата област */
  background: #acacacff;;
  user-select: none;
  display: flex;
  flex-direction: column;
}

.flow-canvas {
  position: relative;
  width: 100%;
  height: 100%; /* Връщаме обратно, container-ът го контролира */
  flex: 1; /* Take remaining space after toolbar */
  cursor: grab;
  transition: transform 0.1s ease-out;
}

.canvas-panning {
  cursor: grabbing !important;
}

.canvas-dragging {
  cursor: grabbing !important;
}

/* Grid background */
.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

/* Connection layer */
.connection-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* Selection box */
.selection-box {
  border: 2px dashed #1976d2;
  background: rgba(25, 118, 210, 0.1);
  pointer-events: none;
  z-index: 100;
}

/* Main Toolbar */
.main-toolbar {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-height: 56px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-section.file-operations {
  gap: 8px;
}

.toolbar-btn-with-label {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toolbar-btn-with-label:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toolbar-status {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.zoom-display {
  min-width: 45px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  padding: 0 8px;
}

/* Debug tools */
.debug-tools {
  background: rgba(156, 39, 176, 0.1);
  border: 1px solid rgba(156, 39, 176, 0.2);
  border-radius: 6px;
  padding: 4px 8px;
  margin: 0 4px;
}

.debug-tools .q-btn {
  margin: 0 2px;
}

/* Debug info */
.canvas-debug {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-family: monospace;
  line-height: 1.4;
  z-index: 1000;
}

.canvas-debug > div {
  margin-bottom: 2px;
}

.canvas-debug > div:last-child {
  margin-bottom: 0;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .main-toolbar {
    padding: 6px 12px;
    gap: 6px;
  }
  
  .toolbar-section {
    gap: 3px;
  }
  
  .toolbar-section.file-operations {
    gap: 6px;
  }
  
  .toolbar-btn-with-label {
    padding: 6px 10px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .main-toolbar {
    flex-wrap: wrap;
    min-height: auto;
    padding: 8px;
    gap: 4px;
  }
  
  .toolbar-section {
    gap: 2px;
  }
  
  .toolbar-section.file-operations {
    gap: 4px;
    width: 100%;
    justify-content: flex-start;
    order: -1;
  }
  
  .toolbar-btn-with-label {
    padding: 6px 8px;
    font-size: 11px;
  }
  
  .zoom-display {
    min-width: 40px;
    font-size: 11px;
    padding: 0 4px;
  }
  
  .toolbar-status {
    width: 100%;
    margin-left: 0;
    margin-top: 4px;
    justify-content: center;
  }
  
  .canvas-debug {
    top: 80px; /* Account for taller toolbar with labels */
    left: 8px;
    padding: 6px 10px;
    font-size: 10px;
  }
}
</style>