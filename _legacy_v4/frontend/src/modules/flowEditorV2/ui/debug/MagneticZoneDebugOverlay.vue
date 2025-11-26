<!--
/**
 * 📦 FlowEditor v3 - Magnetic Zone Debug Overlay
 * ✅ Част от основната редакторна система
 * Debug overlay за magnetic zones
 * Последна проверка: 2025-01-26
 */
-->
<template>
  <div v-if="enabled" class="magnetic-zone-debug-overlay">
    <!-- Visual debug overlay for each block's magnetic zones -->
    <div
      v-for="block in blocks"
      :key="`debug-${block.id}`"
      class="block-debug-zones"
    >
      <!-- Input port magnetic zones -->
      <div
        v-for="inputPort in getInputPorts(block)"
        :key="`zone-input-${block.id}-${inputPort.id}`"
        class="magnetic-zone magnetic-zone-input"
        :style="getMagneticZoneStyle(block, inputPort.id, 'input')"
        :title="`Input Zone: ${inputPort.id}`"
      >
        <div class="zone-label">{{ inputPort.id }}</div>
      </div>
      
      <!-- Output port magnetic zones -->
      <div
        v-for="outputPort in getOutputPorts(block)"
        :key="`zone-output-${block.id}-${outputPort.id}`"
        class="magnetic-zone magnetic-zone-output"
        :style="getMagneticZoneStyle(block, outputPort.id, 'output')"
        :title="`Output Zone: ${outputPort.id}`"
      >
        <div class="zone-label">{{ outputPort.id }}</div>
      </div>
    </div>
    
    <!-- Debug controls -->
    <div class="debug-controls">
      <button @click="toggleZoneVisibility" class="debug-btn">
        {{ showZones ? 'Hide Zones' : 'Show Zones' }}
      </button>
      <button @click="logPositionComparison" class="debug-btn">
        Log Positions
      </button>
      <button @click="testZoomLevels" class="debug-btn">
        Test Zoom Levels
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BlockInstance } from '../../types/BlockConcept';
// ❌ Legacy import removed - using adapter now
// import { BlockFactory } from '../../core/blocks/legacy-BlockFactory';
import { StablePortPositioning } from '../../utils/StablePortPositioning';
import { PortPositionManager } from '../../utils/PortPositionManager';
import type { PortType, PortDirection } from '../../types/PortPosition';

interface Props {
  blocks: BlockInstance[];
  enabled?: boolean;
  zoom?: number;
  panOffset?: { x: number; y: number };
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false,
  zoom: 1.0,
  panOffset: () => ({ x: 0, y: 0 })
});

const showZones = ref(true);

// Get input ports for a block
function getInputPorts(block: BlockInstance) {
  const definition = BlockFactory.getDefinition(block.definitionId);
  return definition?.inputs || [];
}

// Get output ports for a block
function getOutputPorts(block: BlockInstance) {
  const definition = BlockFactory.getDefinition(block.definitionId);
  return definition?.outputs || [];
}

// Calculate magnetic zone style for visual overlay
function getMagneticZoneStyle(block: BlockInstance, portId: string, type: 'input' | 'output') {
  // ✅ CENTRALIZED: Get port type from block definition for accurate positioning
  const definition = BlockFactory.getDefinition(block.definitionId);
  const portDefs = type === 'input' ? definition?.inputs : definition?.outputs;
  const portDef = portDefs?.find(p => p.id === portId);
  const portType = portDef ? (Array.isArray(portDef.type) ? portDef.type[0] : portDef.type) : 'logic';
  
  // ✅ CENTRALIZED: Use PortPositionManager for coordinate calculation
  const position = PortPositionManager.calculateCanvasCoordinates(
    block.position,
    portType,
    type as PortDirection,
    portId
  );
  
  
  const zoneSize = 30; // Magnetic zone radius
  
  // Apply zoom and pan transformation
  const x = (position.x + props.panOffset.x) * props.zoom;
  const y = (position.y + props.panOffset.y) * props.zoom;
  
  return {
    position: 'absolute',
    left: `${x - zoneSize/2}px`,
    top: `${y - zoneSize/2}px`,
    width: `${zoneSize}px`,
    height: `${zoneSize}px`,
    transform: 'none', // No additional transform needed
    display: showZones.value ? 'block' : 'none'
  };
}

// Toggle zone visibility
function toggleZoneVisibility() {
  showZones.value = !showZones.value;
}

// Log position comparison for all blocks
function logPositionComparison() {
  
  props.blocks.forEach(block => {
    
    // Check input ports
    getInputPorts(block).forEach(port => {
      // ✅ CENTRALIZED: Get port type and use PortPositionManager
      const portType = Array.isArray(port.type) ? port.type[0] : port.type || 'logic';
      const position = PortPositionManager.calculateCanvasCoordinates(
        block.position,
        portType,
        'input',
        port.id
      );
      const positionType = PortPositionManager.getPositionType(portType, 'input', port.id);
      const cssClass = PortPositionManager.getCSSClass(portType, 'input', port.id);
      
    });
    
    // Check output ports
    getOutputPorts(block).forEach(port => {
      // ✅ CENTRALIZED: Get port type and use PortPositionManager
      const portType = Array.isArray(port.type) ? port.type[0] : port.type || 'logic';
      const position = PortPositionManager.calculateCanvasCoordinates(
        block.position,
        portType,
        'output',
        port.id
      );
      const positionType = PortPositionManager.getPositionType(portType, 'output', port.id);
      const cssClass = PortPositionManager.getCSSClass(portType, 'output', port.id);
      
    });
  });
}

// Test position validation at different zoom levels
function testZoomLevels() {
  
  const testZooms = [0.5, 0.75, 1.0, 1.5, 2.0];
  
  testZooms.forEach(zoom => {
    
    props.blocks.slice(0, 1).forEach(block => { // Test first block only
      getInputPorts(block).slice(0, 1).forEach(port => { // Test first input only
        // ✅ CENTRALIZED: Use PortPositionManager for coordinate calculation
        const portType = Array.isArray(port.type) ? port.type[0] : port.type || 'logic';
        const position = PortPositionManager.calculateCanvasCoordinates(
          block.position,
          portType,
          'input',
          port.id
        );
        const positionType = PortPositionManager.getPositionType(portType, 'input', port.id);
        
        // Simulate what the coordinates would be at this zoom
        const screenX = (position.x + props.panOffset.x) * zoom;
        const screenY = (position.y + props.panOffset.y) * zoom;
        
      });
    });
  });
}
</script>

<style scoped>
.magnetic-zone-debug-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.block-debug-zones {
  position: relative;
}

.magnetic-zone {
  border: 2px dashed;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1001;
}

.magnetic-zone-input {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.magnetic-zone-output {
  border-color: #FF9800;
  background: rgba(255, 152, 0, 0.2);
}

.zone-label {
  font-size: 8px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

.debug-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: all;
  z-index: 1100;
}

.debug-btn {
  padding: 8px 12px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background-color 0.2s;
}

.debug-btn:hover {
  background: #1976D2;
}

.debug-btn:active {
  background: #1565C0;
}
</style>