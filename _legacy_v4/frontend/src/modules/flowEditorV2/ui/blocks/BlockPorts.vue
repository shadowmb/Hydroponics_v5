<template>
  <div ref="blockContainer" class="block-ports-container">
    <!-- Regular Block Ports (corner positioned) -->
    <template v-if="!isCompact">
      <!-- Input ports - Corner positioned -->
      <div
        v-for="(inputPort, index) in inputPortsWithInfo"
        :key="`corner-input-${inputPort.id}`"
        class="simple-port simple-input port-input"
        :title="inputPort.tooltip"
        :style="getPortPositionStyle(inputPort.id, 'input', Array.isArray(inputPort.type) ? inputPort.type[0] : inputPort.type)"
      >
        <div 
          class="port-dot corner-port-dot port-square-input"
          :class="getPortCssClasses(inputPort.id, ['port-dot', 'corner-port-dot', 'port-square-input'], true)"
          :ref="`port-${block.id}-${inputPort.id}`"
          :data-port-id="`port-${block.id}-${inputPort.id}`"
          :data-block-id="block.id"
          :data-port-name="inputPort.id"
          :style="getPortStyle(inputPort.type, inputPort.color, inputPort.id)"
          @click.stop="onInputPortClick(inputPort.id, $event)"
          @mousedown.stop="onPortMouseDown($event, inputPort, true)"
          @mouseenter="onPortMouseEnter(inputPort)"
          @mouseleave="onPortMouseLeave(inputPort)"
          style="pointer-events: all !important; z-index: 9999 !important; position: relative !important;"
        >
          <div class="port-input-circle-icon">●</div>
        </div>
      </div>

      <!-- Output ports - Corner positioned -->
      <div
        v-for="(outputPort, index) in outputPortsWithInfo"
        :key="`corner-output-${outputPort.id}`"
        class="simple-port simple-output port-output"
        :title="outputPort.tooltip"
        :style="getPortPositionStyle(outputPort.id, 'output', Array.isArray(outputPort.type) ? outputPort.type[0] : outputPort.type)"
      >
        <div 
          class="port-dot corner-port-dot port-circle-output"
          :class="getPortCssClasses(outputPort.id, ['port-dot', 'corner-port-dot', 'port-circle-output'], false)"
          :ref="`port-${block.id}-${outputPort.id}`"
          :data-port-id="`port-${block.id}-${outputPort.id}`"
          :data-block-id="block.id"
          :data-port-name="outputPort.id"
          :style="getPortStyle(outputPort.type, outputPort.color, outputPort.id)"
          @click.stop="onOutputPortClick(outputPort.id, $event)"
          @mousedown.stop="onPortMouseDown($event, outputPort, false)"
          @mouseenter="onPortMouseEnter(outputPort)"
          @mouseleave="onPortMouseLeave(outputPort)"
          style="pointer-events: all !important; z-index: 100 !important;"
        >
        </div>
        <div v-if="outputPort.connectionCount > 0" class="connection-count corner-connection-count">
          {{ outputPort.connectionCount }}
        </div>
      </div>
    </template>

    <!-- Compact Block Ports (inline with header) -->
    <template v-if="isCompact">
      <!-- Input ports in header -->
      <div
        v-for="(inputPort, index) in inputPortsWithInfo"
        :key="`compact-input-${inputPort.id}`"
        class="compact-port compact-input"
        :title="inputPort.tooltip"
      >
        <div 
          class="port-dot compact-port-dot port-square-input"
          :class="getPortCssClasses(inputPort.id, ['port-dot', 'compact-port-dot', 'port-square-input'], true)"
          :ref="`port-${block.id}-${inputPort.id}`"
          :data-port-id="`port-${block.id}-${inputPort.id}`"
          :data-block-id="block.id"
          :data-port-name="inputPort.id"
          :style="getPortStyle(inputPort.type, inputPort.color, inputPort.id)"
          @click.stop="onInputPortClick(inputPort.id, $event)"
          @mousedown.stop="onPortMouseDown($event, inputPort, true)"
          @mouseenter="onPortMouseEnter(inputPort)"
          @mouseleave="onPortMouseLeave(inputPort)"
        >
          <div class="port-input-circle-icon">●</div>
        </div>
      </div>

      <!-- Output ports in header -->
      <div
        v-for="(outputPort, index) in outputPortsWithInfo"
        :key="`compact-output-${outputPort.id}`"
        class="compact-port compact-output"
        :title="outputPort.tooltip"
      >
        <div 
          class="port-dot compact-port-dot port-circle-output"
          :class="getPortCssClasses(outputPort.id, ['port-dot', 'compact-port-dot', 'port-circle-output'], false)"
          :ref="`port-${block.id}-${outputPort.id}`"
          :data-port-id="`port-${block.id}-${outputPort.id}`"
          :data-block-id="block.id"
          :data-port-name="outputPort.id"
          :style="getPortStyle(outputPort.type, outputPort.color, outputPort.id)"
          @click.stop="onOutputPortClick(outputPort.id, $event)"
          @mousedown.stop="onPortMouseDown($event, outputPort, false)"
          @mouseenter="onPortMouseEnter(outputPort)"
          @mouseleave="onPortMouseLeave(outputPort)"
          style="pointer-events: all !important; z-index: 100 !important;"
        >
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, type Ref } from 'vue'
import { getPortTypeColor, PortManager } from '../../core/ports/PortManager'
import { getBlockDefinition as getAdapterBlockDefinition } from '../../ui/adapters/BlockFactoryAdapter'
import type { BlockInstance } from '../../types/BlockConcept'
import type { 
  BlockDefinition, 
  PortDefinition, 
  CompositePortType
} from '../../types/BlockConcept'

// Props
interface Props {
  block: BlockInstance
  blockDefinition?: BlockDefinition
  isCompact: boolean
}

const props = defineProps<Props>()

// Inject dragged port state from parent FlowCanvas - same as old file
const draggedPort = inject<Ref<{blockId: string, portId: string, portType: string} | null>>('draggedPort')
const isConnectionDragging = inject('isConnectionDragging', ref(false))

// Injection status check completed

// Emits
const emit = defineEmits<{
  outputPortClick: [portId: string]
  inputPortClick: [portId: string]
  portMouseDown: [event: MouseEvent, port: any, block: BlockInstance]
  portMouseEnter: [port: any, block: BlockInstance]
  portMouseLeave: [port: any, block: BlockInstance]
}>()

// Computed
const inputPortsWithInfo = computed(() => {
  if (!props.blockDefinition || !props.blockDefinition.inputs) return []
  
  return props.blockDefinition.inputs.map(port => ({
    ...port,
    color: getPortTypeColor(Array.isArray(port.type) ? port.type[0] : port.type),
    isComposite: Array.isArray(port.type),
    connectionCount: props.block.connections?.inputs?.[port.id]?.length || 0,
    tooltip: createPortTooltip(port, 'input'),
  }))
})

const outputPortsWithInfo = computed(() => {
  if (!props.blockDefinition || !props.blockDefinition.outputs) return []
  
  return props.blockDefinition.outputs.map(port => ({
    ...port,
    color: getPortTypeColor(Array.isArray(port.type) ? port.type[0] : port.type),
    isComposite: Array.isArray(port.type),
    connectionCount: props.block.connections?.outputs?.[port.id]?.length || 0,
    tooltip: createPortTooltip(port, 'output'),
  }))
})

// Methods
function createPortTooltip(port: PortDefinition, direction: 'input' | 'output'): string {
  const parts = [
    `${port.label} (${direction})`,
    `Type: ${Array.isArray(port.type) ? port.type.join(' | ') : port.type}`,
  ]
  
  if (port.description) {
    parts.push(`Description: ${port.description}`)
  }
  
  if (port.required) {
    parts.push('Required: Yes')
  }
  
  const connectionCount = direction === 'input' 
    ? props.block.connections.inputs[port.id]?.length || 0
    : props.block.connections.outputs[port.id]?.length || 0
  
  if (connectionCount > 0) {
    parts.push(`Connections: ${connectionCount}`)
  }
  
  return parts.join('\n')
}

// Block container reference for real size calculations
const blockContainer = ref<HTMLElement>()

// Special port styling configuration - универсална система за двуцветни портове
const SPECIAL_PORT_STYLES: Record<string, Record<string, {
  background: string;
  hoverBackground?: string;
  dragBackground?: string;
}>> = {
  'if': {
    'flowOutTrue': {
      background: 'linear-gradient(to bottom, #2196f3 50%, #4caf50 50%)',
      hoverBackground: 'linear-gradient(to bottom, #2196f3 50%, #4caf50 50%)',
      dragBackground: 'linear-gradient(to bottom, #2196f3 50%, #4caf50 50%)'
    },
    'flowOutFalse': {
      background: 'linear-gradient(to bottom, #2196f3 50%, #f44336 50%)',
      hoverBackground: 'linear-gradient(to bottom, #2196f3 50%, #f44336 50%)',
      dragBackground: 'linear-gradient(to bottom, #2196f3 50%, #f44336 50%)'
    }
  }
  // 'loop': {
  //   'loopOut': {
  //     background: 'linear-gradient(to bottom, #2196f3 50%, #4caf50 50%)',
  //     hoverBackground: 'linear-gradient(to bottom, #2196f3 50%, #4caf50 50%)',
  //     dragBackground: 'linear-gradient(to bottom, #2196f3 50%, #4caf50 50%)'
  //   }
  // }
}

// Simple port positioning system
const PORT_BASE_POSITIONS: Record<string, { side: 'top' | 'bottom' | 'left' | 'right', position: 'start' | 'center' | 'end' }> = {
  'flowIn': { side: 'top', position: 'center' },
  'flowOut': { side: 'bottom', position: 'center' },
  'setVarNameIn': { side: 'left', position: 'start' },
  'setVarNameOut': { side: 'top', position: 'end' },
  'setVarDataIn': { side: 'left', position: 'center' },
  'setVarDataOut': { side: 'bottom', position: 'end' },
  'onErrorIn': { side: 'left', position: 'end' },
  'onErrorOut': { side: 'right', position: 'center' },
  'loopOut': { side: 'right', position: 'center' }
}

/**
 * Simple port positioning - groups ports by type and calculates positions
 */
function getPortGroups(direction: 'input' | 'output'): Map<string, {
  portIds: string[];
  basePosition: { side: 'top' | 'bottom' | 'left' | 'right', position: 'start' | 'center' | 'end' };
  spacing: number;
}> {
  const ports = direction === 'input' ? inputPortsWithInfo.value : outputPortsWithInfo.value;
  
  // Group ports by type
  const groups = new Map<string, string[]>()
  
  ports.forEach(port => {
    const portType = Array.isArray(port.type) ? port.type[0] : port.type
    if (!groups.has(portType)) {
      groups.set(portType, [])
    }
    groups.get(portType)!.push(port.id)
  })
  
  // Create group info with base positions
  const groupInfo = new Map<string, {
    portIds: string[];
    basePosition: { side: 'top' | 'bottom' | 'left' | 'right', position: 'start' | 'center' | 'end' };
    spacing: number;
  }>()
  
  groups.forEach((portIds, portType) => {
    const basePosition = PORT_BASE_POSITIONS[portType] || { side: 'left', position: 'center' }
    
    groupInfo.set(portType, {
      portIds,
      basePosition,
      spacing: 40 // Simple 40px spacing between ports of same type
    })
  })
  
  return groupInfo
}

/**
 * Calculate direct port position style with debug logging
 */
function getPortPositionStyle(portId: string, direction: 'input' | 'output', portType: string): Record<string, string> {
  const groups = getPortGroups(direction)
  const groupInfo = groups.get(portType)
  
  // DEBUG: Log block dimensions - get parent block element
  if (blockContainer.value && blockContainer.value.parentElement) {
    const blockElement = blockContainer.value.parentElement // This should be the .block-renderer
    const rect = blockElement.getBoundingClientRect()
    // console.log(`🔧 Block dimensions for ${props.block.id}:`, {
    //   width: rect.width,
    //   height: rect.height,
    //   left: rect.left,
    //   top: rect.top,
    //   element: blockElement.className
    // })
  }
  
  if (!groupInfo) {
    // Fallback position
    const fallbackStyle = {
      left: direction === 'input' ? '-20px' : 'calc(100% + 20px)',
      top: '50%',
      transform: 'translateY(-50%)'
    }
   // console.log(`🔧 FALLBACK position for ${portId}:`, fallbackStyle)
    return fallbackStyle
  }
  
  const { basePosition, portIds, spacing } = groupInfo
  const portIndex = portIds.indexOf(portId)
  const totalPorts = portIds.length
  
  // console.log(`🔧 Port ${portId} (${portType}):`, {
  //   basePosition,
  //   portIndex,
  //   totalPorts,
  //   spacing
  // })
  
  // Calculate base position
  let left: string, top: string, transform: string = ''
  
  switch (basePosition.side) {
    case 'top':
      top = '-20px'
      if (basePosition.position === 'center') {
        if (totalPorts === 1) {
          left = '50%'
          transform = 'translateX(-50%)'
        } else {
          // Multiple ports: spread around center
          const offset = (portIndex - (totalPorts - 1) / 2) * spacing
          left = `calc(50% + ${offset}px)`
          transform = 'translateX(-50%)'
        }
      } else if (basePosition.position === 'start') {
        left = `${20 + portIndex * spacing}px`
      } else { // end
        left = `calc(100% - ${20 + (totalPorts - 1 - portIndex) * spacing}px)`
      }
      break
      
    case 'bottom':
      top = 'calc(100%)'
      if (basePosition.position === 'center') {
        if (totalPorts === 1) {
          left = '50%'
          transform = 'translateX(-50%)'
        } else {
          const offset = (portIndex - (totalPorts - 1) / 2) * spacing
          left = `calc(50% + ${offset}px)`
          transform = 'translateX(-50%)'
        }
      } else if (basePosition.position === 'start') {
        left = `${20 + portIndex * spacing}px`
      } else { // end
        left = `calc(100% - ${20 + (totalPorts - 1 - portIndex) * spacing}px)`
      }
      break
      
    case 'left':
      left = '-20px'
      if (basePosition.position === 'center') {
        if (totalPorts === 1) {
          top = '50%'
          transform = 'translateY(-50%)'
        } else {
          const offset = (portIndex - (totalPorts - 1) / 2) * spacing
          top = `calc(50% + ${offset}px)`
          transform = 'translateY(-50%)'
        }
      } else if (basePosition.position === 'start') {
        top = `${portIndex * spacing}px`
      } else { // end
        top = `calc(100% - ${20 + (totalPorts - 1 - portIndex) * spacing}px)`
      }
      break
      
    case 'right':
      left = 'calc(100%)'
      if (basePosition.position === 'center') {
        if (totalPorts === 1) {
          top = '50%'
          transform = 'translateY(-50%)'
        } else {
          const offset = (portIndex - (totalPorts - 1) / 2) * spacing
          top = `calc(50% + ${offset}px)`
          transform = 'translateY(-50%)'
        }
      } else if (basePosition.position === 'start') {
        top = `${portIndex * spacing}px`
      } else { // end
        top = `calc(100% - ${20 + (totalPorts - 1 - portIndex) * spacing}px)`
      }
      break
  }
  
  const finalStyle = { left, top, transform }
  //console.log(`🎯 Final position for ${portId}:`, finalStyle)
  
  return finalStyle
}

function getPortCompatibilityState(portId: string, isInputPort: boolean): 'source' | 'compatible' | 'incompatible' | 'normal' {
  if (!draggedPort?.value) return 'normal'
  
  // If this is the source port being dragged
  if (draggedPort.value.blockId === props.block.id && draggedPort.value.portId === portId) {
    return 'source'
  }
  
  // Only check compatibility for input ports
  if (!isInputPort) return 'normal'
  
  // Get the current port type
  const currentBlockDef = getAdapterBlockDefinition(props.block.definitionId)
  if (!currentBlockDef) return 'normal'
  
  const portDefinition = currentBlockDef.inputs.find(p => p.id === portId)
  if (!portDefinition) return 'normal'
  
  const targetPortType = Array.isArray(portDefinition.type) ? portDefinition.type[0] : portDefinition.type
  
  // Use PortManager to check compatibility
  const isCompatible = PortManager.arePortsCompatible(draggedPort.value.portType, targetPortType)
  
  return isCompatible ? 'compatible' : 'incompatible'
}

function getPortCssClasses(portId: string, baseClasses: string[], isInputPort: boolean = true): string[] {
  const classes = [...baseClasses]
  
  // Add port-specific classes for selective styling
  classes.push(`port-id-${portId}`)
  
  // Add block-type class for selective styling by block type
  if (props.blockDefinition?.type) {
    classes.push(`block-type-${props.blockDefinition.type}`)
  }
  
  // Add drag state classes based on compatibility
  const state = getPortCompatibilityState(portId, isInputPort)
  
  switch (state) {
    case 'source':
      classes.push('port-drag-source')
      break
    case 'compatible':
      classes.push('port-drag-compatible')
      break
    case 'incompatible':
      classes.push('port-drag-incompatible')
      break
    // 'normal' - no additional classes
  }
  
  return classes
}

/**
 * Универсална функция за специални портове - проверява дали порта има специален стил
 */
function getSpecialPortStyle(portId: string, state: 'normal' | 'hover' | 'drag' = 'normal'): Record<string, string> | null {
  if (!props.blockDefinition?.type) return null
  
  const blockType = props.blockDefinition.type
  const specialStyles = SPECIAL_PORT_STYLES[blockType]
  
  // DEBUG: Log the check for special ports
 // console.log(`🎨 Checking special port: blockType="${blockType}", portId="${portId}", hasSpecialStyles=${!!specialStyles}, hasPortConfig=${!!(specialStyles && specialStyles[portId])}`)
  
  if (!specialStyles || !specialStyles[portId]) return null
  
  const portConfig = specialStyles[portId]
  let background = portConfig.background
  
  // Избира правилния background според състоянието
  if (state === 'hover' && portConfig.hoverBackground) {
    background = portConfig.hoverBackground
  } else if (state === 'drag' && portConfig.dragBackground) {
    background = portConfig.dragBackground
  }
  
  return {
    background: background,
    border: '3px solid white' // Запазваме белата граница
  }
}

function getPortStyle(portType: CompositePortType, color: string, portId?: string): Record<string, string> {
  // Първо проверяваме за специален стил
  if (portId) {
    const specialStyle = getSpecialPortStyle(portId, 'normal')
    if (specialStyle) {
      return {
        ...specialStyle,
        color: color,
        '--port-color': color
      }
    }
  }
  
  // Стандартен стил ако няма специален
  return {
    color: color,
    backgroundColor: color,
    '--port-color': color
  }
}

// Event Handlers
function onOutputPortClick(portId: string, event: MouseEvent) {
  // Gentle event stopping - only stop propagation to prevent canvas click
  event.stopPropagation()
  
  // Set flag to prevent canvas click
  ;(event.target as any)._isPortClick = true
  
  emit('outputPortClick', portId)
}

function onInputPortClick(portId: string, event: MouseEvent) {
  // Gentle event stopping - input ports just complete connections
  event.stopPropagation()
  
  // Set flag to prevent canvas click
  ;(event.target as any)._isPortClick = true
  
  emit('inputPortClick', portId)
}

function onPortMouseDown(event: MouseEvent, port: any, isInput: boolean) {
  // Only stop propagation for output ports (which can start connections)
  // Input ports don't need aggressive event stopping
  if (!isInput) {
    event.stopPropagation()
    event.stopImmediatePropagation()
    event.preventDefault()
  }
  
  // Set flag to prevent canvas click
  ;(event.target as any)._isPortClick = true
  
  emit('portMouseDown', event, { ...port, isInput }, props.block)
}

function onPortMouseEnter(port: any) {
  emit('portMouseEnter', port, props.block)
}

function onPortMouseLeave(port: any) {
  emit('portMouseLeave', port, props.block)
}
</script>

<style scoped>
.block-ports-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allow clicks to pass through to block */
}

/* Simple port positioning system */
.simple-port {
  position: absolute !important;
  width: 20px !important;
  height: 20px !important;
  z-index: 100 !important;
  padding: 0 !important;
  margin: 0 !important;
  pointer-events: all !important; /* Restore pointer events for ports */
}

.corner-top-left {
  left: -20px !important;
  top: -20px !important;
}

.corner-bottom-left {
  left: -20px !important;
  bottom: -20px !important;
}

.corner-top-right {
  right: -20px !important;
  top: -20px !important;
}

.corner-bottom-right {
  right: -20px !important;
  bottom: -20px !important;
}

.corner-left-center {
  left: -20px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.corner-right-center {
  right: -20px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.corner-center-top {
  left: 50% !important;
  top: -60px !important;
  transform: translateX(-50%) !important;
}

.corner-center-bottom {
  left: 50% !important;
  bottom: -20px !important;
  transform: translateX(-50%) !important;
}

/* Port grouping offsets - Center anchors */
.corner-center-top.port-index-0.port-total-2 { transform: translateX(calc(-50% - 15px)) !important; }
.corner-center-top.port-index-1.port-total-2 { transform: translateX(calc(-50% + 15px)) !important; }
.corner-center-top.port-index-0.port-total-3 { transform: translateX(calc(-50% - 30px)) !important; }
.corner-center-top.port-index-1.port-total-3 { transform: translateX(-50%) !important; }
.corner-center-top.port-index-2.port-total-3 { transform: translateX(calc(-50% + 30px)) !important; }

.corner-center-bottom.port-index-0.port-total-2 { transform: translateX(calc(-50% - 15px)) !important; }
.corner-center-bottom.port-index-1.port-total-2 { transform: translateX(calc(-50% + 15px)) !important; }
.corner-center-bottom.port-index-0.port-total-3 { transform: translateX(calc(-50% - 30px)) !important; }
.corner-center-bottom.port-index-1.port-total-3 { transform: translateX(-50%) !important; }
.corner-center-bottom.port-index-2.port-total-3 { transform: translateX(calc(-50% + 30px)) !important; }

/* Side anchors */
.corner-left-center.port-index-0.port-total-2 { transform: translateY(-50%) !important; }
.corner-left-center.port-index-1.port-total-2 { transform: translateY(calc(-50% + 30px)) !important; }
.corner-left-center.port-index-0.port-total-3 { transform: translateY(-50%) !important; }
.corner-left-center.port-index-1.port-total-3 { transform: translateY(calc(-50% + 30px)) !important; }
.corner-left-center.port-index-2.port-total-3 { transform: translateY(calc(-50% + 60px)) !important; }

.corner-right-center.port-index-0.port-total-2 { transform: translateY(-50%) !important; }
.corner-right-center.port-index-1.port-total-2 { transform: translateY(calc(-50% + 30px)) !important; }
.corner-right-center.port-index-0.port-total-3 { transform: translateY(-50%) !important; }
.corner-right-center.port-index-1.port-total-3 { transform: translateY(calc(-50% + 30px)) !important; }
.corner-right-center.port-index-2.port-total-3 { transform: translateY(calc(-50% + 60px)) !important; }

/* Corner anchors */
.corner-top-left.port-index-0.port-total-2 { transform: translateY(0px) !important; }
.corner-top-left.port-index-1.port-total-2 { transform: translateY(30px) !important; }
.corner-top-left.port-index-0.port-total-3 { transform: translateY(0px) !important; }
.corner-top-left.port-index-1.port-total-3 { transform: translateY(30px) !important; }
.corner-top-left.port-index-2.port-total-3 { transform: translateY(60px) !important; }

.corner-bottom-left.port-index-0.port-total-2 { transform: translateY(0px) !important; }
.corner-bottom-left.port-index-1.port-total-2 { transform: translateY(-30px) !important; }
.corner-bottom-left.port-index-0.port-total-3 { transform: translateY(0px) !important; }
.corner-bottom-left.port-index-1.port-total-3 { transform: translateY(-30px) !important; }
.corner-bottom-left.port-index-2.port-total-3 { transform: translateY(-60px) !important; }

.corner-top-right.port-index-0.port-total-2 { transform: translateY(0px) !important; }
.corner-top-right.port-index-1.port-total-2 { transform: translateY(30px) !important; }
.corner-top-right.port-index-0.port-total-3 { transform: translateY(0px) !important; }
.corner-top-right.port-index-1.port-total-3 { transform: translateY(30px) !important; }
.corner-top-right.port-index-2.port-total-3 { transform: translateY(60px) !important; }

.corner-bottom-right.port-index-0.port-total-2 { transform: translateY(0px) !important; }
.corner-bottom-right.port-index-1.port-total-2 { transform: translateY(-30px) !important; }
.corner-bottom-right.port-index-0.port-total-3 { transform: translateY(0px) !important; }
.corner-bottom-right.port-index-1.port-total-3 { transform: translateY(-30px) !important; }
.corner-bottom-right.port-index-2.port-total-3 { transform: translateY(-60px) !important; }

.corner-port-dot {
  width: 20px !important;
  height: 20px !important;
  position: relative !important;
  left: 0 !important;
  top: 0 !important;
  transform: none !important;
}

.corner-connection-count {
  position: absolute !important;
  top: -6px;
  right: -6px;
  background: #2196f3;
  color: white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 110;
}

.port-dot {
  width: 20px;
  height: 20px;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  opacity: 0.9;
  transition: transform 0.2s ease, opacity 0.2s ease;
  cursor: pointer;
  position: relative;
  z-index: 100;
  border-radius: 50%;
}

.port-square-input {
  border-radius: 3px !important;
}

.port-circle-output {
  border-radius: 50% !important;
}

.port-input-circle-icon {
  font-size: 10px;
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  line-height: 1;
}

.port:hover .port-dot {
  opacity: 1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.port:hover .port-square-input {
  transform: scale(1.3);
}

.port:hover .port-circle-output {
  transform: scale(1.3);
}

/* Port drag states - Enhanced visual feedback */
.port-dot.port-drag-source {
  border-color: #FF9800 !important;
  box-shadow: 
    0 0 30px rgba(255, 152, 0, 0.9), 
    0 0 60px rgba(255, 152, 0, 0.6), 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(255, 152, 0, 0.3) !important;
  transform: scale(1.4) !important;
  animation: port-source-pulse 1.5s ease-in-out infinite;
  z-index: 200 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.port-dot.port-drag-compatible {
  border-color: #4CAF50 !important;
  box-shadow: 
    0 0 25px rgba(76, 175, 80, 0.8), 
    0 0 50px rgba(76, 175, 80, 0.5), 
    0 2px 8px rgba(0, 0, 0, 0.15),
    inset 0 0 8px rgba(76, 175, 80, 0.2) !important;
  transform: scale(1.3) !important;
  animation: port-compatible-glow 2s ease-in-out infinite;
  z-index: 150 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.port-dot.port-drag-incompatible {
  border-color: #F44336 !important;
  box-shadow: 
    0 0 20px rgba(244, 67, 54, 0.6), 
    0 0 40px rgba(244, 67, 54, 0.3),
    inset 0 0 6px rgba(244, 67, 54, 0.1) !important;
  opacity: 0.3 !important;
  filter: grayscale(0.7) blur(0.5px) !important;
  cursor: not-allowed !important;
  transform: scale(0.9) !important;
  transition: all 0.3s ease-in-out !important;
}

/* Enhanced animations */
@keyframes port-source-pulse {
  0% { 
    transform: scale(1.4); 
    box-shadow: 
      0 0 25px rgba(255, 152, 0, 0.8), 
      0 0 50px rgba(255, 152, 0, 0.5),
      inset 0 0 8px rgba(255, 152, 0, 0.2);
  }
  50% { 
    transform: scale(1.6); 
    box-shadow: 
      0 0 40px rgba(255, 152, 0, 1), 
      0 0 80px rgba(255, 152, 0, 0.7),
      inset 0 0 12px rgba(255, 152, 0, 0.4);
  }
  100% { 
    transform: scale(1.4); 
    box-shadow: 
      0 0 25px rgba(255, 152, 0, 0.8), 
      0 0 50px rgba(255, 152, 0, 0.5),
      inset 0 0 8px rgba(255, 152, 0, 0.2);
  }
}

@keyframes port-compatible-glow {
  0% { 
    transform: scale(1.3); 
    opacity: 0.9; 
    box-shadow: 
      0 0 20px rgba(76, 175, 80, 0.7), 
      0 0 40px rgba(76, 175, 80, 0.4),
      inset 0 0 6px rgba(76, 175, 80, 0.1);
  }
  50% { 
    transform: scale(1.5); 
    opacity: 1; 
    box-shadow: 
      0 0 35px rgba(76, 175, 80, 1), 
      0 0 70px rgba(76, 175, 80, 0.7),
      inset 0 0 10px rgba(76, 175, 80, 0.3);
  }
  100% { 
    transform: scale(1.3); 
    opacity: 0.9; 
    box-shadow: 
      0 0 20px rgba(76, 175, 80, 0.7), 
      0 0 40px rgba(76, 175, 80, 0.4),
      inset 0 0 6px rgba(76, 175, 80, 0.1);
  }
}

/* Smooth transition when entering/leaving drag states */
.port-dot {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.port-dot:not(.port-drag-source):not(.port-drag-compatible):not(.port-drag-incompatible) {
  transform: scale(1);
}

/* Compact port positioning */
.compact-port {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}

.compact-input {
  left: -8px;
}

.compact-output {
  right: -8px;
}

.compact-port-dot {
  width: 16px !important;
  height: 16px !important;
  border: 2px solid white;
}

.compact-port .port-input-circle-icon {
  font-size: 8px;
}

/* Special styling for condition blocks - REMOVED - now handled by getSpecialPortStyle() */

/* Global override for inline styles - removed because we use background property for gradients */
</style>