/**
 * Workspace composable за Scratch-подобен визуален редактор
 * Управлява състоянието на блокове, връзки, zoom/pan и drag & drop операции
 */

import { ref, computed, reactive, nextTick, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import type {
  BlockDefinition,
  BlockInstance,
  BlockConnection,
  WorkspaceState,
  DragState,
  ConnectorDefinition,
  WorkspaceSnapshot
} from 'src/types/scratch/BlockDefinition'
import { 
  createBlockInstance, 
  createConnection, 
  DEFAULT_GRID_SIZE, 
  DEFAULT_ZOOM, 
  MIN_ZOOM, 
  MAX_ZOOM 
} from 'src/types/scratch/BlockDefinition'

export interface UseWorkspaceOptions {
  gridSize?: number
  enableGrid?: boolean
  enableSnap?: boolean
  maxUndoStack?: number
  autoSave?: boolean
  autoSaveInterval?: number
}

export function useWorkspace(options: UseWorkspaceOptions = {}) {
  const $q = useQuasar()
  
  const {
    gridSize = DEFAULT_GRID_SIZE,
    enableGrid = true,
    enableSnap = true,
    maxUndoStack = 50,
    autoSave = false,
    autoSaveInterval = 30000
  } = options

  // Core state
  const blocks = ref<BlockInstance[]>([])
  const connections = ref<BlockConnection[]>([])
  const selectedBlocks = ref<string[]>([])
  
  // View state
  const zoom = ref(DEFAULT_ZOOM)
  const panX = ref(100)  // Start with some offset so content is visible
  const panY = ref(100)
  const gridEnabled = ref(enableGrid)
  const snapEnabled = ref(enableSnap)
  
  // Drag state
  const dragState = reactive<DragState>({
    isDragging: false,
    dragType: 'block',
    validDropZones: [],
    hoveredDropZone: undefined
  })
  
  // Undo/Redo stacks
  const undoStack = ref<WorkspaceSnapshot[]>([])
  const redoStack = ref<WorkspaceSnapshot[]>([])
  
  // Connection in progress
  const connectionInProgress = ref<{
    fromBlockId: string
    fromConnectorId: string
    mouseX: number
    mouseY: number
    type: 'input' | 'output'
  } | null>(null)

  // Computed properties
  const workspaceState = computed<WorkspaceState>(() => ({
    blocks: blocks.value,
    connections: connections.value,
    selectedBlocks: selectedBlocks.value,
    zoom: zoom.value,
    panX: panX.value,
    panY: panY.value,
    gridEnabled: gridEnabled.value,
    snapToGrid: snapEnabled.value,
    gridSize
  }))

  const hasSelection = computed(() => selectedBlocks.value.length > 0)
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  // Helper functions
  function snapToGrid(x: number, y: number): { x: number; y: number } {
    if (!snapEnabled.value) return { x, y }
    
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    }
  }

  function screenToWorkspace(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - panX.value) / zoom.value,
      y: (screenY - panY.value) / zoom.value
    }
  }

  function workspaceToScreen(workspaceX: number, workspaceY: number): { x: number; y: number } {
    return {
      x: workspaceX * zoom.value + panX.value,
      y: workspaceY * zoom.value + panY.value
    }
  }

  function getBlockById(blockId: string): BlockInstance | undefined {
    return blocks.value.find(block => block.instanceId === blockId)
  }

  function getConnectionById(connectionId: string): BlockConnection | undefined {
    return connections.value.find(conn => conn.id === connectionId)
  }

  function getBlocksInArea(x: number, y: number, width: number, height: number): BlockInstance[] {
    return blocks.value.filter(block => {
      return block.position.x >= x && 
             block.position.x <= x + width &&
             block.position.y >= y &&
             block.position.y <= y + height
    })
  }

  // Block operations
  function addBlock(
    definition: BlockDefinition, 
    position: { x: number; y: number }, 
    parameterValues: Record<string, any> = {}
  ): BlockInstance {
    const snappedPosition = snapToGrid(position.x, position.y)
    const instance = createBlockInstance(definition, snappedPosition, parameterValues)
    
    saveSnapshot('Block added')
    blocks.value.push(instance)
    
    return instance
  }

  function removeBlock(blockId: string): boolean {
    const blockIndex = blocks.value.findIndex(b => b.instanceId === blockId)
    if (blockIndex === -1) return false
    
    saveSnapshot('Block removed')
    
    // Remove all connections involving this block
    connections.value = connections.value.filter(
      conn => conn.fromBlockId !== blockId && conn.toBlockId !== blockId
    )
    
    // Remove from selection
    selectedBlocks.value = selectedBlocks.value.filter(id => id !== blockId)
    
    // Remove block
    blocks.value.splice(blockIndex, 1)
    
    return true
  }

  function moveBlock(blockId: string, newPosition: { x: number; y: number }): boolean {
    const block = getBlockById(blockId)
    if (!block) return false
    
    const snappedPosition = snapToGrid(newPosition.x, newPosition.y)
    block.position = snappedPosition
    block.updatedAt = new Date()
    
    return true
  }

  function duplicateBlock(blockId: string): BlockInstance | null {
    const originalBlock = getBlockById(blockId)
    if (!originalBlock) return null
    
    const newPosition = {
      x: originalBlock.position.x + gridSize * 2,
      y: originalBlock.position.y + gridSize * 2
    }
    
    return addBlock(originalBlock.definition, newPosition, originalBlock.parameterValues)
  }

  function updateBlockParameters(blockId: string, parameters: Record<string, any>): boolean {
    const block = getBlockById(blockId)
    if (!block) return false
    
    block.parameterValues = { ...block.parameterValues, ...parameters }
    block.updatedAt = new Date()
    
    return true
  }

  // Selection operations
  function selectBlock(blockId: string, addToSelection = false): void {
    if (!addToSelection) {
      selectedBlocks.value = [blockId]
    } else if (!selectedBlocks.value.includes(blockId)) {
      selectedBlocks.value.push(blockId)
    }
  }

  function deselectBlock(blockId: string): void {
    selectedBlocks.value = selectedBlocks.value.filter(id => id !== blockId)
  }

  function clearSelection(): void {
    selectedBlocks.value = []
  }

  function selectAll(): void {
    selectedBlocks.value = blocks.value.map(block => block.instanceId)
  }

  function deleteSelected(): void {
    if (selectedBlocks.value.length === 0) return
    
    saveSnapshot('Blocks deleted')
    selectedBlocks.value.forEach(blockId => removeBlock(blockId))
    clearSelection()
  }

  // Connection operations
  function canConnect(
    fromBlockId: string, 
    fromConnectorId: string, 
    toBlockId: string, 
    toConnectorId: string
  ): { valid: boolean; reason?: string } {
    if (fromBlockId === toBlockId) {
      return { valid: false, reason: 'Не може да свързваш блок със себе си' }
    }

    const fromBlock = getBlockById(fromBlockId)
    const toBlock = getBlockById(toBlockId)
    
    if (!fromBlock || !toBlock) {
      return { valid: false, reason: 'Блок не е намерен' }
    }

    const fromConnector = fromBlock.definition.outputs?.find(c => c.id === fromConnectorId)
    const toConnector = toBlock.definition.inputs?.find(c => c.id === toConnectorId)
    
    if (!fromConnector || !toConnector) {
      return { valid: false, reason: 'Connector не е намерен' }
    }

    // Check data type compatibility
    if (fromConnector.dataType !== 'any' && 
        toConnector.dataType !== 'any' && 
        fromConnector.dataType !== toConnector.dataType) {
      return { 
        valid: false, 
        reason: `Несъвместими типове: ${fromConnector.dataType} → ${toConnector.dataType}` 
      }
    }

    // Check if connection already exists
    const existingConnection = connections.value.find(
      conn => conn.fromBlockId === fromBlockId && 
              conn.fromConnectorId === fromConnectorId &&
              conn.toBlockId === toBlockId && 
              conn.toConnectorId === toConnectorId
    )
    
    if (existingConnection) {
      return { valid: false, reason: 'Връзката вече съществува' }
    }

    // Check if target input is already connected (unless it supports multiple)
    if (!toConnector.multiple) {
      const existingInputConnection = connections.value.find(
        conn => conn.toBlockId === toBlockId && conn.toConnectorId === toConnectorId
      )
      
      if (existingInputConnection) {
        return { valid: false, reason: 'Input-ът вече е свързан' }
      }
    }

    return { valid: true }
  }

  function connectBlocks(
    fromBlockId: string, 
    fromConnectorId: string, 
    toBlockId: string, 
    toConnectorId: string
  ): BlockConnection | null {
    const validation = canConnect(fromBlockId, fromConnectorId, toBlockId, toConnectorId)
    
    if (!validation.valid) {
      $q.notify({
        message: validation.reason,
        type: 'negative',
        position: 'top'
      })
      return null
    }

    saveSnapshot('Connection created')
    
    const connection = createConnection(fromBlockId, fromConnectorId, toBlockId, toConnectorId)
    connection.isValid = true
    
    connections.value.push(connection)
    
    return connection
  }

  function removeConnection(connectionId: string): boolean {
    const connectionIndex = connections.value.findIndex(c => c.id === connectionId)
    if (connectionIndex === -1) return false
    
    saveSnapshot('Connection removed')
    connections.value.splice(connectionIndex, 1)
    
    return true
  }

  function removeConnectionBetween(fromBlockId: string, toBlockId: string): boolean {
    const connectionIndex = connections.value.findIndex(
      c => c.fromBlockId === fromBlockId && c.toBlockId === toBlockId
    )
    
    if (connectionIndex === -1) return false
    
    saveSnapshot('Connection removed')
    connections.value.splice(connectionIndex, 1)
    
    return true
  }

  // View operations
  function setZoom(newZoom: number): void {
    zoom.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))
  }

  function zoomIn(factor = 1.2): void {
    setZoom(zoom.value * factor)
  }

  function zoomOut(factor = 1.2): void {
    setZoom(zoom.value / factor)
  }

  function resetZoom(): void {
    zoom.value = DEFAULT_ZOOM
  }

  function setPan(x: number, y: number): void {
    panX.value = x
    panY.value = y
  }

  function pan(deltaX: number, deltaY: number): void {
    panX.value += deltaX
    panY.value += deltaY
  }

  function fitToContent(): void {
    if (blocks.value.length === 0) {
      resetZoom()
      setPan(0, 0)
      return
    }

    const bounds = blocks.value.reduce((acc, block) => {
      return {
        minX: Math.min(acc.minX, block.position.x),
        minY: Math.min(acc.minY, block.position.y),
        maxX: Math.max(acc.maxX, block.position.x + 200), // Estimate block width
        maxY: Math.max(acc.maxY, block.position.y + 100)  // Estimate block height
      }
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })

    const contentWidth = bounds.maxX - bounds.minX
    const contentHeight = bounds.maxY - bounds.minY
    
    // Assume workspace is 800x600 for now
    const workspaceWidth = 800
    const workspaceHeight = 600
    
    const scaleX = workspaceWidth / contentWidth
    const scaleY = workspaceHeight / contentHeight
    const scale = Math.min(scaleX, scaleY, MAX_ZOOM) * 0.9 // 90% to add padding
    
    setZoom(scale)
    
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    
    setPan(
      workspaceWidth / 2 - centerX * scale,
      workspaceHeight / 2 - centerY * scale
    )
  }

  // Undo/Redo operations
  function saveSnapshot(description: string): void {
    const snapshot: WorkspaceSnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: new Date(),
      description,
      state: {
        blocks: JSON.parse(JSON.stringify(blocks.value)),
        connections: JSON.parse(JSON.stringify(connections.value)),
        selectedBlocks: [...selectedBlocks.value],
        zoom: zoom.value,
        panX: panX.value,
        panY: panY.value,
        gridEnabled: gridEnabled.value,
        snapToGrid: snapEnabled.value,
        gridSize
      }
    }
    
    undoStack.value.push(snapshot)
    
    // Limit undo stack size
    if (undoStack.value.length > maxUndoStack) {
      undoStack.value.shift()
    }
    
    // Clear redo stack when new action is performed
    redoStack.value = []
  }

  function undo(): boolean {
    const snapshot = undoStack.value.pop()
    if (!snapshot) return false
    
    // Save current state to redo stack
    redoStack.value.push({
      id: `redo_${Date.now()}`,
      timestamp: new Date(),
      description: 'Current state',
      state: { ...workspaceState.value }
    })
    
    // Restore snapshot
    restoreSnapshot(snapshot)
    
    return true
  }

  function redo(): boolean {
    const snapshot = redoStack.value.pop()
    if (!snapshot) return false
    
    // Save current state to undo stack
    undoStack.value.push({
      id: `undo_${Date.now()}`,
      timestamp: new Date(),
      description: 'Current state',
      state: { ...workspaceState.value }
    })
    
    // Restore snapshot
    restoreSnapshot(snapshot)
    
    return true
  }

  function restoreSnapshot(snapshot: WorkspaceSnapshot): void {
    blocks.value = snapshot.state.blocks
    connections.value = snapshot.state.connections
    selectedBlocks.value = snapshot.state.selectedBlocks
    zoom.value = snapshot.state.zoom
    panX.value = snapshot.state.panX
    panY.value = snapshot.state.panY
    gridEnabled.value = snapshot.state.gridEnabled
    snapEnabled.value = snapshot.state.snapToGrid
  }

  // Clear workspace
  function clearWorkspace(): void {
    saveSnapshot('Workspace cleared')
    blocks.value = []
    connections.value = []
    selectedBlocks.value = []
    resetZoom()
    setPan(0, 0)
  }

  // Validation
  function validateWorkspace(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check for disconnected blocks
    const connectedBlockIds = new Set<string>()
    connections.value.forEach(conn => {
      connectedBlockIds.add(conn.fromBlockId)
      connectedBlockIds.add(conn.toBlockId)
    })
    
    const disconnectedBlocks = blocks.value.filter(
      block => !connectedBlockIds.has(block.instanceId) && 
               !block.definition.isEntryPoint && 
               !block.definition.isExitPoint
    )
    
    if (disconnectedBlocks.length > 0) {
      errors.push(`${disconnectedBlocks.length} блока не са свързани`)
    }
    
    // Check for invalid connections
    const invalidConnections = connections.value.filter(conn => {
      const validation = canConnect(conn.fromBlockId, conn.fromConnectorId, conn.toBlockId, conn.toConnectorId)
      return !validation.valid
    })
    
    if (invalidConnections.length > 0) {
      errors.push(`${invalidConnections.length} невалидни връзки`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Keyboard shortcuts
  function setupKeyboardShortcuts(): void {
    function handleKeyDown(event: KeyboardEvent) {
      // Prevent shortcuts when typing in inputs
      if ((event.target as HTMLElement)?.tagName?.toLowerCase() === 'input') {
        return
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault()
            if (event.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'a':
            event.preventDefault()
            selectAll()
            break
          case 'd':
            event.preventDefault()
            if (selectedBlocks.value.length === 1) {
              duplicateBlock(selectedBlocks.value[0])
            }
            break
          case '0':
            event.preventDefault()
            fitToContent()
            break
          case '=':
          case '+':
            event.preventDefault()
            zoomIn()
            break
          case '-':
            event.preventDefault()
            zoomOut()
            break
        }
      } else {
        switch (event.key) {
          case 'Delete':
          case 'Backspace':
            event.preventDefault()
            deleteSelected()
            break
          case 'Escape':
            clearSelection()
            connectionInProgress.value = null
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
    })
  }

  // Auto-save
  let autoSaveTimer: number | undefined
  function setupAutoSave(): void {
    if (!autoSave) return
    
    autoSaveTimer = window.setInterval(() => {
      // Emit auto-save event or save to localStorage
      console.log('Auto-saving workspace...')
    }, autoSaveInterval)
    
    onUnmounted(() => {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
      }
    })
  }

  // Initialize
  onMounted(() => {
    setupKeyboardShortcuts()
    setupAutoSave()
  })

  return {
    // State
    blocks,
    connections,
    selectedBlocks,
    zoom,
    panX,
    panY,
    gridEnabled,
    snapEnabled,
    dragState,
    connectionInProgress,
    
    // Computed
    workspaceState,
    hasSelection,
    canUndo,
    canRedo,
    
    // Block operations
    addBlock,
    removeBlock,
    moveBlock,
    duplicateBlock,
    updateBlockParameters,
    getBlockById,
    
    // Selection operations
    selectBlock,
    deselectBlock,
    clearSelection,
    selectAll,
    deleteSelected,
    
    // Connection operations
    canConnect,
    connectBlocks,
    removeConnection,
    removeConnectionBetween,
    getConnectionById,
    
    // View operations
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setPan,
    pan,
    fitToContent,
    screenToWorkspace,
    workspaceToScreen,
    
    // Grid operations
    snapToGrid,
    
    // Undo/Redo
    saveSnapshot,
    undo,
    redo,
    
    // Utility
    clearWorkspace,
    validateWorkspace,
    getBlocksInArea
  }
}