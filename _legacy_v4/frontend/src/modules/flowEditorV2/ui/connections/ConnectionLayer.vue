<!--
/**
 * 📦 FlowEditor v3 - Connection Layer
 * ✅ Част от основната редакторна система
 * SVG слой за връзки между блокове
 * Последна проверка: 2025-01-26
 */
-->
<template>
  <div class="connection-layer">
    <!-- SVG Layer for connections - inherits transform from parent canvas -->
      <svg
        class="connections-svg"
      >
      <!-- Existing connections -->
      <g class="existing-connections">
        <path
          v-for="connection in visibleConnections"
          :key="connection.id"
          :d="getConnectionPath(connection)"
          :class="[
            'connection-path',
            `connection-${getConnectionStatus(connection)}`,
            { 'connection-hovered': hoveredConnectionId === connection.id }
          ]"
          :stroke="getConnectionColor(connection)"
          :stroke-width="hoveredConnectionId === connection.id ? 3 : 2"
          fill="none"
          stroke-linecap="round"
          @mouseenter="handleConnectionHover(connection.id)"
          @mouseleave="handleConnectionLeave"
          @click="handleConnectionClick(connection)"
        />
        
        <!-- Connection hover indicators -->
        <g v-if="hoveredConnectionId" class="connection-controls">
          <circle
            :cx="hoveredConnectionCenter.x"
            :cy="hoveredConnectionCenter.y"
            r="8"
            class="connection-delete-bg"
            @click="handleConnectionDelete(hoveredConnectionId)"
          />
          <text
            :x="hoveredConnectionCenter.x"
            :y="hoveredConnectionCenter.y + 2"
            class="connection-delete-icon"
            text-anchor="middle"
            @click="handleConnectionDelete(hoveredConnectionId)"
          >✕</text>
        </g>
      </g>
      
      
      
      <!-- Success animation -->
      <g v-if="connectionFeedback.showSuccess" class="connection-success">
        <path
          :d="connectionFeedback.successPath"
          class="connection-success-path"
          stroke="#4CAF50"
          stroke-width="4"
          fill="none"
          stroke-linecap="round"
        />
        <circle
          :cx="connectionFeedback.animationPosition.x"
          :cy="connectionFeedback.animationPosition.y"
          r="8"
          fill="#4CAF50"
          class="connection-success-indicator"
        />
      </g>
      
      <!-- Error animation -->
      <g v-if="connectionFeedback.showError" class="connection-error">
        <circle
          :cx="connectionFeedback.animationPosition.x"
          :cy="connectionFeedback.animationPosition.y"
          r="12"
          fill="none"
          stroke="#F44336"
          stroke-width="3"
          class="connection-error-indicator"
        />
        <text
          :x="connectionFeedback.animationPosition.x"
          :y="connectionFeedback.animationPosition.y + 4"
          class="connection-error-icon"
          text-anchor="middle"
          fill="#F44336"
        >✕</text>
      </g>
      </svg>
      
    
    <!-- Connection validation tooltip -->
    <div
      v-if="validationTooltip.show"
      class="validation-tooltip"
      :style="{
        top: validationTooltip.position.y + 'px'
      }"
    >
      <div class="tooltip-content">
        {{ validationTooltip.message }}
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, nextTick } from 'vue';
import type { 
  BlockInstance, 
  BlockConnection, 
  Position 
} from '../../types/BlockConcept';
import { ConnectionValidator } from '../../core/connections/ConnectionValidator';
import { getPortTypeColor, arePortsCompatible } from '../../core/ports/PortManager';
// ❌ Legacy import removed - using adapter now
// import { BlockFactory } from '../../core/blocks/legacy-BlockFactory';
import { getBlockDefinition as getAdapterBlockDefinition } from '../../ui/adapters/BlockFactoryAdapter';
import { StableCoordinateTransform } from '../../utils/StableCoordinateTransform';
import { getStablePortPosition } from '../../utils/StablePortPositioning';
import { PortPositionManager } from '../../utils/PortPositionManager';
import type { PortType, PortDirection } from '../../types/PortPosition';

// Props
interface Props {
  canvasContainer?: HTMLElement | null;
  filteredConnections?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  canvasContainer: null
});

// Events
const emit = defineEmits<{
  connectionCreated: [connection: BlockConnection];
  connectionDeleted: [connectionId: string];
  
  
  // 🎯 NEW SIMPLIFIED PORT INTERACTION EVENTS
  portConnectionStarted: [outputBlockId: string, outputPortId: string];
  portConnectionCancelled: [];
}>();

// Inject shared block editor data
const blockEditor = inject('blockEditor') as ReturnType<typeof import('../../composables/useBlockEditor').useBlockEditor>;
if (!blockEditor) {
  throw new Error('ConnectionLayer must be used within FlowEditor that provides blockEditor');
}

const {
  blocks,
  connections,
  canvasState,
  addConnection,
  removeConnection
} = blockEditor;


// 🎯 NEW SIMPLIFIED CONNECTION STATE - Only track active output
const activeOutputPort = ref<{
  blockId: string;
  portId: string;
} | null>(null);

const connectionFeedback = ref({
  animationPosition: { x: 0, y: 0 }
});

const hoveredConnectionId = ref<string | null>(null);
const validationTooltip = ref({
  position: { x: 0, y: 0 }
});


// Computed properties
const visibleConnections = computed(() => {
  // Use filtered connections if provided, otherwise use all connections
  const connectionsToUse = props.filteredConnections || connections.value;
  
  // Force reactivity by accessing block positions
  const blockPositions = blocks.value.map(b => ({ id: b.id, x: b.position.x, y: b.position.y }));
  
  return connectionsToUse.filter(connection => {
    const sourceBlock = blocks.value.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.value.find(b => b.id === connection.targetBlockId);
    return sourceBlock && targetBlock;
  });
});

const hoveredConnectionCenter = computed(() => {
  if (!hoveredConnectionId.value) return { x: 0, y: 0 };
  
  const connection = connections.value.find(c => c.id === hoveredConnectionId.value);
  if (!connection) return { x: 0, y: 0 };
  
  // Force reactivity by accessing block positions
  const sourceBlock = blocks.value.find(b => b.id === connection.sourceBlockId);
  const targetBlock = blocks.value.find(b => b.id === connection.targetBlockId);
  if (!sourceBlock || !targetBlock) return { x: 0, y: 0 };
  
  const sourcePos = getPortPosition(connection.sourceBlockId, connection.sourcePortId, 'output');
  const targetPos = getPortPosition(connection.targetBlockId, connection.targetPortId, 'input');
  
  return {
    x: (sourcePos.x + targetPos.x) / 2,
    y: (sourcePos.y + targetPos.y) / 2
  };
});


// Helper function to determine port position type
function getPortPositionType(index: number, portId: string, direction: 'input' | 'output', portType?: string): string {
  // Same logic as in BlockRenderer
  if (direction === 'input') {
    // Check for "flow" type ports or common input IDs (Вход) - горен ляв ъгъл
    if (portType === 'flow' || portId === 'trigger' || portId === 'input') {
      return 'top-left';
    }
    // Check for setVar type ports (Променлива) - долен ляв ъгъл, зелен цвят
    if (portType === 'setVar') {
      return 'bottom-left';
    }
    // Check for sensor/data type ports (Сензор) - долен ляв ъгъл
    if (portType === 'sensor' || portType === 'data' || portId === 'data') {
      return 'bottom-left';
    }
    // Default: първия input горе, втория долу
    return index === 0 ? 'top-left' : 'bottom-left';
  } else {
    // Check for success/output ports (Изход) - горен десен ъгъл
    if (portType === 'flow' || portId === 'result' || portId === 'status' || portId === 'measurement') {
      return 'top-right';
    }
    // Check for error ports (При грешка) - долен десен ъгъл
    if (portType === 'error' || portId === 'error' || portId === 'onError') {
      return 'bottom-right';
    }
    // Default: първия output горе, втория долу
    return index === 0 ? 'top-right' : 'bottom-right';
  }
}

// Connection path generation
function getConnectionPath(connection: BlockConnection): string {
  const sourcePos = getPortPosition(connection.sourceBlockId, connection.sourcePortId, 'output');
  const targetPos = getPortPosition(connection.targetBlockId, connection.targetPortId, 'input');
  
  // Create smooth curve path (Bezier curve)
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  
  // Control point offset for smooth curves
  const controlOffset = Math.max(50, Math.abs(dx) * 0.5);
  
  const cp1x = sourcePos.x + controlOffset;
  const cp1y = sourcePos.y;
  const cp2x = targetPos.x - controlOffset;
  const cp2y = targetPos.y;
  
  return `M ${sourcePos.x} ${sourcePos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetPos.x} ${targetPos.y}`;
}

// Connection color based on port type
function getConnectionColor(connection: BlockConnection): string {
  const sourceBlock = blocks.value.find(b => b.id === connection.sourceBlockId);
  if (!sourceBlock) return '#9e9e9e';
  
  const blockDef = getAdapterBlockDefinition(sourceBlock.definitionId);
  if (!blockDef) return '#9e9e9e';
  
  const sourcePort = blockDef.outputs.find(p => p.id === connection.sourcePortId);
  if (!sourcePort) return '#9e9e9e';
  
  return getPortTypeColor(Array.isArray(sourcePort.type) ? sourcePort.type[0] : sourcePort.type);
}

// Methods - Refactored to use centralized coordinate system
function getPortPosition(blockId: string, portId: string, type: 'input' | 'output'): Position {
  const block = blocks.value.find(b => b.id === blockId);
  if (!block) return { x: 0, y: 0 };
  
  // Try to get real DOM position first
  const portSelector = `[data-block-id="${blockId}"][data-port-name="${portId}"]`;
  const portElement = document.querySelector(portSelector);
  
  // console.log('🔍 getPortPosition DEBUG:', {
  //   blockId,
  //   portId, 
  //   type,
  //   portSelector,
  //   foundElement: !!portElement,
  //   elementRect: portElement ? portElement.getBoundingClientRect() : null
  // });
  
  if (portElement) {
    const rect = portElement.getBoundingClientRect();
    const canvasContainer = document.querySelector('.flow-canvas') || document.querySelector('.flow-canvas-container');
    
    if (canvasContainer) {
      const canvasRect = canvasContainer.getBoundingClientRect();
      const currentZoom = (document.querySelector('.flow-canvas') as any)?.__vue__?.canvasState?.zoom || 1.0;
      
      const domPosition = {
        x: (rect.left + rect.width / 2 - canvasRect.left) / currentZoom,
        y: (rect.top + rect.height / 2 - canvasRect.top) / currentZoom
      };
      
      // console.log('🟢 DOM Position Calculation:', {
      //   portRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      //   canvasRect: { left: canvasRect.left, top: canvasRect.top },
      //   zoom: currentZoom,
      //   centerOffset: { x: rect.width / 2, y: rect.height / 2 },
      //   finalPosition: domPosition
      // });
      
      return domPosition;
    }
  } else {
    //console.log('🔴 DOM element not found, using fallback');
  }
  
  // Fallback to PortPositionManager for calculated positioning
  const definition = getAdapterBlockDefinition(block.definitionId);
  if (!definition) {
    return { x: block.position.x + 90, y: block.position.y + 30 }; // Default fallback position
  }
  
  // Use PortPositionManager for calculated positioning
  return PortPositionManager.calculateCanvasCoordinates(
    block.position,
    type === 'input' ? 'data' : 'flow', // Default port type
    type,
    portId
  );
}


function getConnectionStatus(connection: BlockConnection): 'valid' | 'invalid' | 'warning' {
  const validation = ConnectionValidator.validateExistingConnection(connection, blocks.value);
  
  if (!validation.isValid) return 'invalid';
  if (validation.warning) return 'warning';
  return 'valid';
}

// 🔄 OLD DRAG EVENT HANDLERS - COMMENTED FOR BACKUP
// TODO: Remove after click-to-click system is fully tested
/*
function handleMouseMove(event: MouseEvent) {
  if (!dragState.value.isDragging) {
    return;
  }
  
  
  // STABLE COORDINATE TRANSFORMATION using centralized utility
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
  if (!rect) {
    return;
  }
  
  // Use StableCoordinateTransform.screenToCanvas for consistent transformation
  const screenPos = { x: event.clientX, y: event.clientY };
  const newPosition = StableCoordinateTransform.screenToCanvas(screenPos, rect, canvasState.zoom);
  
  
  dragState.value.currentPosition = newPosition;
  
  // Check for valid drop targets
  updateValidDropTarget(newPosition);
  
}
*/

/*
// Update valid drop target based on mouse position
function updateValidDropTarget(mousePosition: Position) {
  
  // Reset target state
  dragState.value.validTarget = false;
  dragState.value.targetBlockId = '';
  dragState.value.targetPortId = '';
  
  // Enhanced drop zone configuration - adaptive to zoom level
  const baseDropRange = 40;
  const baseMagneticRange = 60;
  const dropRange = baseDropRange / canvasState.zoom; // Adaptive to zoom
  const magneticRange = baseMagneticRange / canvasState.zoom; // Adaptive to zoom
  let closestPort: { blockId: string; portId: string; distance: number } | null = null;
  let magneticPorts: Array<{ blockId: string; portId: string; distance: number }> = [];
  
  availableTargetPorts.value.forEach(port => {
    const distance = Math.sqrt(
      Math.pow(port.position.x - mousePosition.x, 2) + 
      Math.pow(port.position.y - mousePosition.y, 2)
    );
    
    
    // Track magnetic ports for highlighting
    if (distance <= magneticRange && port.compatible) {
      magneticPorts.push({
        blockId: port.blockId,
        portId: port.portId,
        distance
      });
    }
    
    // Find closest port for actual connection
    if (distance <= dropRange && port.compatible) {
      if (!closestPort || distance < closestPort.distance) {
        closestPort = {
          blockId: port.blockId,
          portId: port.portId,
          distance
        };
      }
    }
  });
  
  // Emit magnetic attraction events for port highlighting
  emit('portsInMagneticRange', magneticPorts);
  
  if (closestPort) {
    
    dragState.value.validTarget = true;
    dragState.value.targetBlockId = closestPort.blockId;
    dragState.value.targetPortId = closestPort.portId;
  } else {
  }
}

function handleMouseUp(event: MouseEvent) {
  if (!dragState.value.isDragging) {
    return;
  }
  
  // Safe guard for event
  if (!event) {
    stopDragging();
    return;
  }
  
  // Check if dropped on valid target
  if (dragState.value.validTarget && dragState.value.targetBlockId && dragState.value.targetPortId) {
    createConnection();
  } else {
    showValidationTooltip(event, 'Drop на валиден порт за създаване на връзка');
  }
  
  stopDragging();
}

function handleMouseLeave() {
  if (dragState.value.isDragging) {
    stopDragging();
  }
}
*/

function handleConnectionHover(connectionId: string) {
  hoveredConnectionId.value = connectionId;
}

function handleConnectionLeave() {
  hoveredConnectionId.value = null;
}

function handleConnectionClick(connection: BlockConnection) {
  // Could emit event for connection selection
}

function handleConnectionDelete(connectionId: string) {
  removeConnection(connectionId);
  hoveredConnectionId.value = null;
  emit('connectionDeleted', connectionId);
}

/*
function handlePortDropEnter(port: any) {
  if (!dragState.value.isDragging) return;
  
  dragState.value.validTarget = port.compatible;
  dragState.value.targetBlockId = port.blockId;
  dragState.value.targetPortId = port.portId;
}

function handlePortDropLeave() {
  if (!dragState.value.isDragging) return;
  
  dragState.value.validTarget = false;
  dragState.value.targetBlockId = '';
  dragState.value.targetPortId = '';
}

function handlePortDrop(port: any) {
  if (!dragState.value.isDragging || !port.compatible) return;
  
  dragState.value.validTarget = true;
  dragState.value.targetBlockId = port.blockId;
  dragState.value.targetPortId = port.portId;
  
  createConnection();
  stopDragging();
}
*/

// Public methods (exposed to parent)
// 🔄 OLD DRAG FUNCTION - COMMENTED FOR BACKUP
// TODO: Remove after click-to-click system is fully tested
/*
function startDragging(blockId: string, portId: string, position: Position) {
  
  // ✅ FIXED: FlowCanvas always sends canvas coordinates after Strategy 2
  // No need for additional transformation - use position directly
  const finalCanvasPosition = position;
  
  dragState.value = {
    isDragging: true,
    sourceBlockId: blockId,
    sourcePortId: portId,
    sourcePosition: finalCanvasPosition, // ИЗПОЛЗВА CANVAS КООРДИНАТИ
    currentPosition: finalCanvasPosition, // ЗАПОЧВА ОТ СЪЩИТЕ КООРДИНАТИ
    validTarget: false,
    targetBlockId: '',
    targetPortId: ''
  };
  
  emit('portDragStart', blockId, portId, finalCanvasPosition); // ЕМИТВА CANVAS КООРДИНАТИ
  
}
*/

// 🔄 OLD COMPLEX POSITIONING LOGIC - COMMENTED FOR BACKUP
// TODO: Remove after new simplified system is fully tested
/*
async function startPendingConnection(blockId: string, portId: string, position: Position) {
  // Find source block and port info for compatibility checking
  const sourceBlock = blocks.value.find(b => b.id === blockId);
  if (!sourceBlock) return;
  
  const blockDef = getAdapterBlockDefinition(sourceBlock.definitionId);
  if (!blockDef) return;
  
  const sourcePort = blockDef.outputs.find(p => p.id === portId);
  if (!sourcePort) return;
  
  // Wait for Vue to complete DOM updates before reading port positions
  await nextTick();
  
  // Find all compatible input ports
  const compatibleInputs: Array<{
    blockId: string;
    portId: string;
    compatible: boolean;
    position: { x: number; y: number };
  }> = [];
  
  // Check all blocks for compatible input ports
  blocks.value.forEach(block => {
    if (block.id === blockId) return; // Skip source block
    
    const targetBlockDef = getAdapterBlockDefinition(block.definitionId);
    if (!targetBlockDef) return;
    
    targetBlockDef.inputs.forEach(inputPort => {
      const isCompatible = arePortsCompatible(
        Array.isArray(sourcePort.type) ? sourcePort.type[0] : sourcePort.type,
        Array.isArray(inputPort.type) ? inputPort.type[0] : inputPort.type
      );
      
      // Get input port position (reuse existing position calculation)
      const portPosition = getPortPosition(block.id, inputPort.id, 'input');
      
      compatibleInputs.push({
        blockId: block.id,
        portId: inputPort.id,
        compatible: isCompatible,
        position: portPosition
      });
    });
  });
  
  console.log('🟠 ConnectionLayer: Compatible inputs found', {
    total: compatibleInputs.length,
    compatible: compatibleInputs.filter(i => i.compatible).length,
    incompatible: compatibleInputs.filter(i => !i.compatible).length,
    list: compatibleInputs
  });

  // Set pending connection state
  pendingConnectionState.value = {
    isActive: true,
    sourceBlockId: blockId,
    sourcePortId: portId,
    sourcePosition: position,
    compatibleInputs
  };
  
  emit('portDragStart', blockId, portId, position); // Keep for compatibility
}
*/

// 🎯 NEW SIMPLIFIED PORT INTERACTION SYSTEM
function startPortConnection(outputBlockId: string, outputPortId: string): boolean {
  //console.log('🟡 Starting port connection:', { outputBlockId, outputPortId });
  
  // 🎯 NEW: Check if output port is already connected
  if (isPortConnected(outputBlockId, outputPortId, 'output')) {
    const shouldDisconnect = showDisconnectConfirmation('output');
    
    if (shouldDisconnect) {
      disconnectPort(outputBlockId, outputPortId, 'output');
      // Don't start new connection, just disconnect
      return false;
    } else {
      // Cancel operation
      return false;
    }
  }
  
  // Set active output port
  activeOutputPort.value = {
    blockId: outputBlockId,
    portId: outputPortId
  };
  
  // Emit event to trigger CSS class updates on all ports
  emit('portConnectionStarted', outputBlockId, outputPortId);
  return true;
}

function completePortConnection(inputBlockId: string, inputPortId: string): boolean {
  if (!activeOutputPort.value) {
    //console.log('❌ No active output port');
    return false;
  }
  
  // console.log('🟢 Attempting to complete connection:', {
  //   from: activeOutputPort.value,
  //   to: { inputBlockId, inputPortId }
  // });
  
  // 🎯 NEW: Check if input port is already connected
  if (isPortConnected(inputBlockId, inputPortId, 'input')) {
    const shouldDisconnect = showDisconnectConfirmation('input');
    
    if (shouldDisconnect) {
      disconnectPort(inputBlockId, inputPortId, 'input');
      // Cancel connection mode after disconnect
      cancelPortConnection();
      return false;
    } else {
      // Cancel operation
      cancelPortConnection();
      return false;
    }
  }
  
  // Check compatibility
  const isCompatible = checkPortCompatibility(
    activeOutputPort.value.blockId,
    activeOutputPort.value.portId,
    inputBlockId,
    inputPortId
  );
  
  if (!isCompatible) {
    //console.log('❌ Ports not compatible');
    cancelPortConnection();
    return false;
  }
  
  // Create connection
  const newConnection = addConnection(
    activeOutputPort.value.blockId,
    activeOutputPort.value.portId,
    inputBlockId,
    inputPortId
  );
  
  if (newConnection) {
    //console.log('✅ Connection created successfully');
    emit('connectionCreated', newConnection);
    cancelPortConnection();
    return true;
  } else {
    //console.log('❌ Failed to create connection');
    cancelPortConnection();
    return false;
  }
}

function cancelPortConnection() {
  //console.log('🔴 Cancelling port connection');
  activeOutputPort.value = null;
  emit('portConnectionCancelled');
}

// 🎯 NEW: Direct input port disconnect when clicked without active connection
function handleInputPortDirectClick(inputBlockId: string, inputPortId: string): boolean {
  //console.log('🔵 Direct input port click:', { inputBlockId, inputPortId });
  
  // Check if input port is connected
  if (isPortConnected(inputBlockId, inputPortId, 'input')) {
    // Show custom confirmation dialog
    const shouldDisconnect = showDisconnectConfirmation('input');
    
    if (shouldDisconnect) {
      disconnectPort(inputBlockId, inputPortId, 'input');
      return true;
    }
  }
  
  return false;
}

// 🎯 NEW: Enhanced confirmation dialog with better UI
function showDisconnectConfirmation(portType: 'input' | 'output'): boolean {
  const portTypeText = portType === 'input' ? 'входен' : 'изходен';
  const icon = portType === 'input' ? '🔵' : '🔴';
  
  const message = `${icon} Прекъсване на връзка\n\nТози ${portTypeText} порт вече е свързан.\nИскате ли да прекъснете съществуващата връзка?\n\n⚠️ Това действие не може да бъде отменено.`;
  
  return confirm(message);
}

// 🎯 NEW: Refresh all connections by forcing re-render
function refreshConnections() {
  console.log('🔄 Refreshing all connections...');
  
  // Force re-calculation of all connection paths by clearing and re-triggering reactivity
  const connectionsSnapshot = [...connections.value];
  connections.value.splice(0); // Clear all connections
  
  // Use nextTick to ensure DOM updates, then restore connections
  nextTick(() => {
    connections.value.push(...connectionsSnapshot);
    console.log('✅ Connections refreshed:', connections.value.length);
  });
}

function checkPortCompatibility(
  sourceBlockId: string,
  sourcePortId: string,
  targetBlockId: string,
  targetPortId: string
): boolean {
  const sourceBlock = blocks.value.find(b => b.id === sourceBlockId);
  const targetBlock = blocks.value.find(b => b.id === targetBlockId);
  
  if (!sourceBlock || !targetBlock) return false;
  
  const sourceBlockDef = getAdapterBlockDefinition(sourceBlock.definitionId);
  const targetBlockDef = getAdapterBlockDefinition(targetBlock.definitionId);
  
  if (!sourceBlockDef || !targetBlockDef) return false;
  
  const sourcePort = sourceBlockDef.outputs.find(p => p.id === sourcePortId);
  const targetPort = targetBlockDef.inputs.find(p => p.id === targetPortId);
  
  if (!sourcePort || !targetPort) return false;
  
  return arePortsCompatible(
    Array.isArray(sourcePort.type) ? sourcePort.type[0] : sourcePort.type,
    Array.isArray(targetPort.type) ? targetPort.type[0] : targetPort.type
  );
}

// 🎯 NEW: Helper functions for disconnect functionality
function isPortConnected(blockId: string, portId: string, portType: 'input' | 'output'): boolean {
  return connections.value.some(connection => {
    if (portType === 'output') {
      return connection.sourceBlockId === blockId && connection.sourcePortId === portId;
    } else {
      return connection.targetBlockId === blockId && connection.targetPortId === portId;
    }
  });
}

function getPortConnections(blockId: string, portId: string, portType: 'input' | 'output'): BlockConnection[] {
  return connections.value.filter(connection => {
    if (portType === 'output') {
      return connection.sourceBlockId === blockId && connection.sourcePortId === portId;
    } else {
      return connection.targetBlockId === blockId && connection.targetPortId === portId;
    }
  });
}

function disconnectPort(blockId: string, portId: string, portType: 'input' | 'output'): boolean {
  const connectionsToRemove = getPortConnections(blockId, portId, portType);
  
  if (connectionsToRemove.length === 0) return false;
  
  connectionsToRemove.forEach(connection => {
    removeConnection(connection.id);
    emit('connectionDeleted', connection.id);
  });
  
  return true;
}

function completePendingConnection(targetBlockId: string, targetPortId: string, targetPosition: Position) {
  if (!pendingConnectionState.value.isActive) return;
  
  // Check if target is compatible
  const targetInput = pendingConnectionState.value.compatibleInputs.find(
    input => input.blockId === targetBlockId && input.portId === targetPortId
  );
  
  if (!targetInput || !targetInput.compatible) {
    showConnectionError('Несъвместими портове');
    cancelPendingConnection();
    return;
  }
  
  // Create connection using existing logic
  const newConnection = addConnection(
    pendingConnectionState.value.sourceBlockId,
    pendingConnectionState.value.sourcePortId,
    targetBlockId,
    targetPortId
  );
  
  if (newConnection) {
    showConnectionSuccess(newConnection);
    emit('connectionCreated', newConnection);
  } else {
    showConnectionError('Неуспешно създаване на връзка');
  }
  
  cancelPendingConnection();
}

function cancelPendingConnection() {
  pendingConnectionState.value = {
    isActive: false,
    sourceBlockId: '',
    sourcePortId: '',
    sourcePosition: { x: 0, y: 0 },
    compatibleInputs: []
  };
  
  // REMOVED: emit('portDragEnd') to prevent infinite recursion
  // FlowCanvas will handle isConnectionDragging separately
}

function handleCompatibilityIndicatorClick(input: {
  blockId: string;
  portId: string;
  compatible: boolean;
  position: { x: number; y: number };
}) {
  //console.log('🟡 ConnectionLayer: Compatibility indicator clicked', input);
  
  if (!input.compatible) {
    showConnectionError('Несъвместими портове');
    return;
  }
  
  // Redirect to complete connection
  completePendingConnection(input.blockId, input.portId, input.position);
}

/*
function stopDragging() {
  // TODO: IMPLEMENT_LATER - ensure drag-end logic does not re-trigger recursively
  // Guard against recursive calls: only proceed if actually dragging
  if (!dragState.value.isDragging) {
    return;
  }

  dragState.value.isDragging = false;
  dragState.value.validTarget = false;
  validationTooltip.value.show = false;
  
  emit('portDragEnd');
}

function createConnection() {
  if (!dragState.value.validTarget) {
    showConnectionError('Няма валиден порт за свързване');
    return;
  }
  
  const newConnection = addConnection(
    dragState.value.sourceBlockId,
    dragState.value.sourcePortId,
    dragState.value.targetBlockId,
    dragState.value.targetPortId
  );
  
  if (newConnection) {
    showConnectionSuccess(newConnection);
    emit('connectionCreated', newConnection);
  } else {
    showConnectionError('Неуспешно създаване на връзка');
  }
}
*/

function showConnectionSuccess(connection: BlockConnection) {
  const sourcePos = getPortPosition(connection.sourceBlockId, connection.sourcePortId, 'output');
  const targetPos = getPortPosition(connection.targetBlockId, connection.targetPortId, 'input');
  
  connectionFeedback.value = {
    showSuccess: true,
    showError: false,
    successPath: getConnectionPath(connection),
    animationPosition: targetPos
  };
  
  // Hide success animation after 1 second
  setTimeout(() => {
    connectionFeedback.value.showSuccess = false;
  }, 1000);
}

function showConnectionError(message: string) {
  connectionFeedback.value = {
    showSuccess: false,
    showError: true,
    successPath: '',
    animationPosition: { x: 0, y: 0 } // Use default position for click-to-click
  };
  
  // Hide error animation after 1.5 seconds
  setTimeout(() => {
    connectionFeedback.value.showError = false;
  }, 1500);
}

function showValidationTooltip(event: MouseEvent, message: string) {
  validationTooltip.value = {
    show: true,
    message,
    position: {
      x: event.clientX - 10,
      y: event.clientY - 10
    }
  };
  
  setTimeout(() => {
    validationTooltip.value.show = false;
  }, 2000);
}


// Expose methods for parent component
defineExpose({
  // 🔄 OLD COMPLEX SYSTEM - COMMENTED FOR BACKUP
  // TODO: Remove after new simplified system is fully tested
  /*
  startDragging: startPendingConnection, // Redirect to new system
  stopDragging: cancelPendingConnection, // Redirect to new system
  startPendingConnection,
  completePendingConnection,
  cancelPendingConnection
  */
  
  // 🎯 NEW SIMPLIFIED PORT INTERACTION SYSTEM
  startPortConnection,
  completePortConnection,
  cancelPortConnection,
  checkPortCompatibility,
  
  // 🎯 NEW DISCONNECT FUNCTIONALITY
  isPortConnected,
  getPortConnections,
  disconnectPort,
  handleInputPortDirectClick,
  refreshConnections,
  
  // Computed properties for external access
  isConnectionActive: computed(() => activeOutputPort.value !== null),
  activeOutput: computed(() => activeOutputPort.value)
});
</script>

<style scoped>
.connection-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 500; /* Below block ports but above canvas */
}


.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 🎯 KEY FIX: Let ports receive clicks */
  overflow: visible;
}

/* Connection paths - Allow pointer events for interaction */
.connection-path {
  pointer-events: all; /* 🎯 Allow clicks on actual connections */
  cursor: pointer;
  transition: stroke-width 0.2s ease;
}

/* Connection controls - Allow pointer events for delete buttons */
.connection-controls {
  pointer-events: all; /* 🎯 Allow clicks on delete buttons */
}

.connection-delete-bg,
.connection-delete-icon {
  pointer-events: all; /* 🎯 Allow clicks on delete controls */
  cursor: pointer;
}

.connection-path:hover {
  stroke-width: 3 !important;
}

.connection-valid {
  opacity: 1;
}

.connection-invalid {
  opacity: 0.7;
  stroke-dasharray: 3,3;
}

.connection-warning {
  opacity: 0.8;
}

.connection-hovered {
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
}

.connection-preview {
  opacity: 0.8;
  animation: dash 1s linear infinite;
}

.connection-preview.connection-valid {
  opacity: 1;
}

.connection-preview.connection-invalid {
  opacity: 0.6;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

/* Input port highlights - highest z-index */
.input-port-highlight {
  z-index: 2000 !important;
  pointer-events: all !important;
}

.input-port-highlight.compatible {
  filter: drop-shadow(0 0 4px #4CAF50);
}

.input-port-highlight.incompatible {
  filter: drop-shadow(0 0 4px #F44336);
}

/* Connection controls */
.connection-delete-bg {
  fill: #f44336;
  cursor: pointer;
  opacity: 0.9;
}

.connection-delete-bg:hover {
  opacity: 1;
  r: 10;
}

.connection-delete-icon {
  fill: white;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  pointer-events: none;
}

/* Drag endpoint */
.drag-endpoint {
  opacity: 0.8;
  animation: pulse 1s ease-in-out infinite alternate;
}

/* Enhanced drag target indicator */
.drag-target-indicator {
  opacity: 0.6;
  animation: target-pulse 0.8s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    opacity: 0.4;
    r: 3;
  }
  to {
    opacity: 1;
    r: 5;
  }
}

@keyframes target-pulse {
  from {
    opacity: 0.3;
    r: 10;
  }
  to {
    opacity: 0.8;
    r: 15;
  }
}

/* Connection success animations */
.connection-success-path {
  opacity: 1;
  animation: success-path-draw 0.8s ease-out;
}

.connection-success-indicator {
  opacity: 1;
  animation: success-bounce 0.6s ease-out;
}

@keyframes success-path-draw {
  from {
    stroke-dasharray: 200;
    stroke-dashoffset: 200;
    opacity: 0;
  }
  to {
    stroke-dasharray: 200;
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

@keyframes success-bounce {
  0%, 100% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
  80% {
    transform: scale(0.9);
    opacity: 1;
  }
}

/* Connection error animations */
.connection-error-indicator {
  opacity: 1;
  animation: error-shake 0.6s ease-out;
}

.connection-error-icon {
  font-size: 8px;
  font-weight: bold;
  animation: error-fade 0.6s ease-out;
}

@keyframes error-shake {
  0%, 100% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  25% {
    transform: scale(1.2) rotate(-5deg);
    opacity: 1;
  }
  50% {
    transform: scale(1) rotate(5deg);
    opacity: 1;
  }
  75% {
    transform: scale(1.1) rotate(-3deg);
    opacity: 1;
  }
}

@keyframes error-fade {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Port drop zones */
.port-drop-zones {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* Inherits transform from parent canvas - no wrapper needed */
}

.port-drop-zone {
  position: absolute;
  border-radius: 50%;
  pointer-events: all;
  transition: all 0.2s ease;
  opacity: 0;
  /* Simplified positioning - inherits parent transform */
}

.port-drop-zone.drop-zone-valid {
  background: rgba(33, 150, 243, 0.3);
  border: 2px solid #2196f3;
  opacity: 1;
}

.port-drop-zone.drop-zone-invalid {
  background: rgba(244, 67, 54, 0.2);
  border: 2px solid #f44336;
  opacity: 0.5;
}

.port-drop-zone:hover {
  transform: scale(1.2);
}

/* Validation tooltip */
.validation-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tooltip-content::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}


/* Debug coordinate indicators on canvas */
.debug-coordinate-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* Inherits transform from parent canvas - no wrapper needed */
}

.debug-coordinate-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #ff00ff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 1500;
  pointer-events: none;
  box-shadow: 0 0 4px currentColor;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

</style>