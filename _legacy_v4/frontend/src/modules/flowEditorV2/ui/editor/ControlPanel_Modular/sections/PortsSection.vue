<!--
/**
 * 📦 PortsSection - Input/Output Ports Management
 * ✅ Modular component extracted from ControlPanel.vue
 * Displays input and output ports with connection counts and types
 */
-->
<template>
  <div v-if="selectedBlock && blockDefinition" class="ports-container">
    
    <!-- Input Ports (Collapsible) -->
    <q-expansion-item
      v-if="blockDefinition.inputs.length > 0"
      icon="input"
      :label="`Входове (${blockDefinition.inputs.length})`"
      header-class="expansion-header"
      class="expansion-section"
    >
      <div class="expansion-content">
        <div class="ports-list">
          <div 
            v-for="port in blockDefinition.inputs"
            :key="port.id"
            class="port-item"
            :class="{ 'port-required': port.required }"
          >
            <div 
              class="port-dot"
              :style="{ backgroundColor: getPortColor(port.type) }"
            ></div>
            <div class="port-info">
              <span class="port-name">
                {{ port.label }}
                <span v-if="port.required" class="required-indicator">*</span>
                <span v-if="Array.isArray(port.type)" class="composite-indicator">⚡</span>
              </span>
              <small class="port-type">{{ formatPortType(port.type) }}</small>
              <div class="port-connections">
                {{ getConnectionCount(port.id, 'input') }} връзки
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-expansion-item>

    <!-- Output Ports (Collapsible) -->
    <q-expansion-item
      v-if="blockDefinition.outputs.length > 0"
      icon="output"
      :label="`Изходи (${blockDefinition.outputs.length})`"
      header-class="expansion-header"
      class="expansion-section"
    >
      <div class="expansion-content">
        <div class="ports-list">
          <div 
            v-for="port in blockDefinition.outputs"
            :key="port.id"
            class="port-item"
            :class="{ 'port-required': port.required }"
          >
            <div 
              class="port-dot"
              :style="{ backgroundColor: getPortColor(port.type) }"
            ></div>
            <div class="port-info">
              <span class="port-name">
                {{ port.label }}
                <span v-if="port.required" class="required-indicator">*</span>
                <span v-if="Array.isArray(port.type)" class="composite-indicator">⚡</span>
              </span>
              <small class="port-type">{{ formatPortType(port.type) }}</small>
              <div class="port-connections">
                {{ getConnectionCount(port.id, 'output') }} връзки
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
// 🔍 CRITICAL: Correct import paths for ControlPanel_Modular location
import type { 
  BlockInstance, 
  BlockDefinition, 
  CompositePortType 
} from '../../../../types/BlockConcept';
import { getPortTypeColor } from '../../../../core/ports/PortManager';

// Props
interface Props {
  selectedBlock?: BlockInstance;
  blockDefinition?: BlockDefinition;
}

const props = defineProps<Props>();

// Methods

/**
 * Gets the color for a specific port type
 * @param portType - The port type (single or composite)
 * @returns Color string for the port
 */
function getPortColor(portType: CompositePortType): string {
  const type = Array.isArray(portType) ? portType[0] : portType;
  return getPortTypeColor(type);
}

/**
 * Formats port type for display
 * @param portType - The port type (single or composite)
 * @returns Formatted port type string
 */
function formatPortType(portType: CompositePortType): string {
  if (Array.isArray(portType)) {
    return portType.join(' | ');
  }
  return portType;
}

/**
 * Gets the connection count for a specific port
 * @param portId - ID of the port
 * @param direction - Direction of the port (input/output)
 * @returns Number of connections for this port
 */
function getConnectionCount(portId: string, direction: 'input' | 'output'): number {
  if (!props.selectedBlock) return 0;
  
  const connections = direction === 'input' 
    ? props.selectedBlock.connections.inputs[portId]
    : props.selectedBlock.connections.outputs[portId];
    
  return connections?.length || 0;
}
</script>

<style scoped>
/* Ports Styles - Extracted from ControlPanel.vue */

.ports-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Expansion sections */
.expansion-section {
  margin-bottom: 16px;
}

.expansion-section .expansion-header {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
}

.expansion-content {
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

/* Ports */
.ports-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.port-item.port-required {
  background: rgba(244, 67, 54, 0.05);
  padding: 6px;
  border-radius: 4px;
  border-left: 2px solid #f44336;
}

.port-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
}

.port-info {
  flex: 1;
}

.port-name {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 2px;
}

.port-type {
  font-size: 10px;
  color: #666;
  display: block;
  margin-bottom: 2px;
}

.port-connections {
  font-size: 10px;
  color: #999;
}

/* Common indicators */
.required-indicator {
  color: #f44336;
  font-weight: 700;
  margin-left: 2px;
}

.composite-indicator {
  color: #ff9800;
  margin-left: 2px;
}
</style>