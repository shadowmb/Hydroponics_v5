/**
 * 📦 FlowEditor v4 - Block Editor Composable (Clean Version)
 * ✅ Modern clean composable for block editor logic and state
 * 🎯 Uses only new BlockFactory architecture - no hybrid/legacy code
 * Created: 2025-08-04
 */

import { ref, reactive, computed, inject } from 'vue';
import type { 
  BlockInstance, 
  BlockConnection, 
  Position 
} from '../types/BlockConcept';
import type { 
  FlowDefinition, 
  CanvasSettings
} from '../core/flow/FlowDefinition';
import { 
  DEFAULT_CANVAS_SETTINGS, 
  DEFAULT_FLOW_META 
} from '../core/flow/FlowDefinition';
import { BlockFactory } from '../blocks/BlockFactory';
import { ConnectionValidator } from '../core/connections/ConnectionValidator';
import { ContainerManager } from '../core/containers/ContainerManager';
import type { ContainerMetadata } from '../types/ContainerTypes';
import { VariableManager } from '../services/VariableManager';
import { 
  generateFlowId, 
  generateVersionId, 
  getDefaultFlowVersion, 
  incrementVersion,
  hasVersionInfo,
  isValidVersion
} from '../utils/versionUtils';

/**
 * Modern Block Editor Composable
 * Clean implementation using only new BlockFactory system
 */
export function useBlockEditor(emit?: (event: 'validateBlocks', blockIds: string[]) => void) {
  // === CORE STATE ===
  
  const currentFlow = ref<FlowDefinition>({
    id: `flow_${Date.now()}`,
    meta: {
      ...DEFAULT_FLOW_META,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    },
    blocks: [],
    connections: [],
    canvas: { ...DEFAULT_CANVAS_SETTINGS },
  });

  // Canvas state for UI interactions
  const canvasState = reactive({
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    isDragging: false,
    isConnecting: false,
    selectedBlocks: [] as string[],
    activeConnection: null as { blockId: string; portId: string; isOutput: boolean } | null,
  });

  // Container management
  const containerManager = ContainerManager.getInstance();
  
  // Inject container navigation from parent (FlowEditor)
  const containerNavigation = inject('containerNavigation', null) as ReturnType<typeof import('./useContainerNavigation').useContainerNavigation> | null;

  // === COMPUTED PROPERTIES ===

  const blocks = computed(() => currentFlow.value.blocks);
  const connections = computed(() => currentFlow.value.connections);
  const selectedBlocksData = computed(() =>
    blocks.value.filter(block => canvasState.selectedBlocks.includes(block.id))
  );
  const hasBlocks = computed(() => blocks.value.length > 0);
  const selectedBlockCount = computed(() => canvasState.selectedBlocks.length);

  // === BLOCK MANAGEMENT ===

  /**
   * Add new block to the editor
   * Respects container context when available
   */
  async function addBlock(
    definitionId: string, 
    position: Position, 
    params?: Record<string, any>
  ): Promise<BlockInstance> {
    // Debug logs removed - block restoration issue fixed
    
    try {
      const blockFactory = BlockFactory.getInstance();
      
      const block = await blockFactory.createInstance(definitionId, {
        position: position,
        parameters: params
      });

      //console.log('🔥 DEBUG useBlockEditor: Block created:', block.id, 'definitionId:', block.definitionId);

      // If we're in a container context, mark the block accordingly
      if (containerNavigation?.isInContainer?.value && containerNavigation?.containerModeInfo?.value?.currentContainerId) {
        block.meta = {
          ...block.meta,
          containerId: containerNavigation.containerModeInfo.value.currentContainerId
        };
       // console.log('🔥 DEBUG useBlockEditor: Block tagged with containerId:', containerNavigation.containerModeInfo.value.currentContainerId);
      } else {
        //console.log('🔥 DEBUG useBlockEditor: Block NOT tagged - no container context');
      }
      
      currentFlow.value.blocks.push(block);
      updateModifiedTime();
      
     // console.log('🔥 DEBUG useBlockEditor: Block added to flow. Total blocks:', currentFlow.value.blocks.length);
      
      return block;
    } catch (error) {
      console.error('[useBlockEditor] Failed to add block:', error);
      throw error;
    }
  }

  /**
   * Remove block and all its connections
   */
  function removeBlock(blockId: string): boolean {
    const index = currentFlow.value.blocks.findIndex(b => b.id === blockId);
    if (index === -1) return false;

    const block = currentFlow.value.blocks[index];
    if (!block) return false;

    // Prevent deletion of system blocks
    if (block.definitionId === 'system.start' || 
        block.definitionId === 'system.end') {
      console.warn('[useBlockEditor] Cannot delete system blocks');
      return false;
    }

    // Remove all connections involving this block
    currentFlow.value.connections = currentFlow.value.connections.filter(conn => 
      conn.sourceBlockId !== blockId && conn.targetBlockId !== blockId
    );

    // Remove block
    currentFlow.value.blocks.splice(index, 1);
    
    // Remove from selection if selected
    const selectionIndex = canvasState.selectedBlocks.indexOf(blockId);
    if (selectionIndex !== -1) {
      canvasState.selectedBlocks.splice(selectionIndex, 1);
    }

    updateModifiedTime();
    return true;
  }

  /**
   * Update block position
   */
  function updateBlockPosition(blockId: string, position: Position): void {
    const block = currentFlow.value.blocks.find(b => b.id === blockId);
    if (block) {
      block.position = { ...position };
      updateModifiedTime();
    }
  }

  /**
   * Update block parameters
   */
  function updateBlockParameters(blockId: string, parameters: Record<string, any>): void {
    const block = currentFlow.value.blocks.find(b => b.id === blockId);
    if (block) {
      block.parameters = { ...block.parameters, ...parameters };
      updateModifiedTime();

      // Emit validation event for the updated block
      if (emit) {
        emit('validateBlocks', [blockId]);
      }
    }
  }

  /**
   * Get block by ID
   */
  function getBlock(blockId: string): BlockInstance | undefined {
    return currentFlow.value.blocks.find(b => b.id === blockId);
  }

  // === CONNECTION MANAGEMENT ===

  /**
   * Add connection between blocks
   */
  function addConnection(
    sourceBlockId: string,
    sourcePortId: string,
    targetBlockId: string,
    targetPortId: string
  ): boolean {
    try {
      // Get blocks first
      const sourceBlock = getBlock(sourceBlockId);
      const targetBlock = getBlock(targetBlockId);

      if (!sourceBlock || !targetBlock) {
        console.warn('[useBlockEditor] Source or target block not found');
        return false;
      }

      // Validate connection
      const validation = ConnectionValidator.validateConnection(
        sourceBlock,
        sourcePortId,
        targetBlock,
        targetPortId
      );

      if (!validation.isValid) {
        console.warn('[useBlockEditor] Invalid connection:', validation.error);
        return false;
      }

      const connection: BlockConnection = {
        id: `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceBlockId,
        sourcePortId,
        targetBlockId,
        targetPortId
      };

      currentFlow.value.connections.push(connection);

      // Update block connection references (reuse already fetched blocks)
      if (sourceBlock && sourceBlock.connections && sourceBlock.connections.outputs &&
          targetBlock && targetBlock.connections && targetBlock.connections.inputs) {
        if (!sourceBlock.connections.outputs[sourcePortId]) {
          sourceBlock.connections.outputs[sourcePortId] = [];
        }
        if (!targetBlock.connections.inputs[targetPortId]) {
          targetBlock.connections.inputs[targetPortId] = [];
        }

        sourceBlock.connections.outputs[sourcePortId].push(connection.id);
        targetBlock.connections.inputs[targetPortId].push(connection.id);
      }

      updateModifiedTime();

      // Emit validation event for connected blocks
      if (emit) {
        emit('validateBlocks', [sourceBlockId, targetBlockId]);
      }

      return true;
    } catch (error) {
      console.error('[useBlockEditor] Failed to add connection:', error);
      return false;
    }
  }

  /**
   * Remove connection
   */
  function removeConnection(connectionId: string): boolean {
    const connectionIndex = currentFlow.value.connections.findIndex(c => c.id === connectionId);
    if (connectionIndex === -1) return false;

    const connection = currentFlow.value.connections[connectionIndex];
    if (!connection) return false;
    
    // Remove from block references
    const sourceBlock = getBlock(connection.sourceBlockId);
    const targetBlock = getBlock(connection.targetBlockId);

    if (sourceBlock && sourceBlock.connections && sourceBlock.connections.outputs) {
      const outputs = sourceBlock.connections.outputs[connection.sourcePortId];
      if (outputs) {
        const index = outputs.indexOf(connectionId);
        if (index !== -1) outputs.splice(index, 1);
      }
    }

    if (targetBlock && targetBlock.connections && targetBlock.connections.inputs) {
      const inputs = targetBlock.connections.inputs[connection.targetPortId];
      if (inputs) {
        const index = inputs.indexOf(connectionId);
        if (index !== -1) inputs.splice(index, 1);
      }
    }

    // Remove connection
    currentFlow.value.connections.splice(connectionIndex, 1);
    updateModifiedTime();

    // Emit validation event for affected blocks
    if (emit) {
      emit('validateBlocks', [connection.sourceBlockId, connection.targetBlockId]);
    }

    return true;
  }

  // === SELECTION MANAGEMENT ===

  function selectBlock(blockId: string): void {
    if (!canvasState.selectedBlocks.includes(blockId)) {
      canvasState.selectedBlocks.push(blockId);
    }
  }

  function deselectBlock(blockId: string): void {
    const index = canvasState.selectedBlocks.indexOf(blockId);
    if (index !== -1) {
      canvasState.selectedBlocks.splice(index, 1);
    }
  }

  function selectMultipleBlocks(blockIds: string[]): void {
    canvasState.selectedBlocks = [...blockIds];
  }

  function clearSelection(): void {
    canvasState.selectedBlocks = [];
  }

  function toggleBlockSelection(blockId: string): void {
    if (canvasState.selectedBlocks.includes(blockId)) {
      deselectBlock(blockId);
    } else {
      selectBlock(blockId);
    }
  }

  function isBlockSelected(blockId: string): boolean {
    return canvasState.selectedBlocks.includes(blockId);
  }

  // === CANVAS MANAGEMENT ===

  function updateCanvasZoom(zoom: number): void {
    canvasState.zoom = Math.max(0.1, Math.min(3.0, zoom));
  }

  function updateCanvasPan(pan: Position): void {
    canvasState.pan = { ...pan };
  }

  /**
   * Legacy alias for updateCanvasPan - needed for FlowCanvas compatibility
   */
  function setPan(x: number, y: number): void {
    updateCanvasPan({ x, y });
  }

  /**
   * Legacy alias for updateCanvasZoom - needed for FlowCanvas compatibility
   */
  function setZoom(zoom: number): void {
    updateCanvasZoom(zoom);
  }

  function resetCanvasView(): void {
    canvasState.zoom = 1.0;
    canvasState.pan = { x: 0, y: 0 };
  }

  function centerCanvas(): void {
    if (blocks.value.length === 0) {
      resetCanvasView();
      return;
    }

    // Calculate bounds of all blocks
    const positions = blocks.value.map(b => b.position);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    // Center the view
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    canvasState.pan = { x: -centerX, y: -centerY };
  }

  // === FLOW MANAGEMENT ===

  function updateModifiedTime(): void {
    currentFlow.value.meta.modifiedAt = new Date().toISOString();
  }

  /**
   * Creates a new flow with the given name
   */
  function createNewFlow(name?: string, templateId?: string): void {
    // Clear existing data first with splice to maintain reactivity
    currentFlow.value.blocks.splice(0);
    currentFlow.value.connections.splice(0);
    
    // Update flow metadata with version support
    const timestamp = new Date().toISOString();
    currentFlow.value.id = `flow_${Date.now()}`;
    currentFlow.value.meta = {
      ...DEFAULT_FLOW_META,
      name: name || 'Нов Flow',
      description: '',
      version: '3.0.0', // FlowEditor format version
      createdAt: timestamp,
      modifiedAt: timestamp,
    };
    
    // Reset canvas settings
    currentFlow.value.canvas = { ...DEFAULT_CANVAS_SETTINGS };

    // Initialize versioning info
    initializeVersionInfo(name, templateId);

    clearSelection();
    resetCanvasView();
    VariableManager.clearAll();
    
    // Initialize system blocks
    initializeSystemBlocks();
  }

  function clearFlow(): void {
    // Use splice to maintain reactivity instead of direct assignment
    currentFlow.value.blocks.splice(0);
    currentFlow.value.connections.splice(0);
    
    clearSelection();
    resetCanvasView();
    VariableManager.clearAll();
    
    // Re-initialize system blocks
    initializeSystemBlocks();
    updateModifiedTime();
  }

  async function loadFlow(flowData: FlowDefinition): Promise<void> {
    // Clear existing blocks and connections instead of replacing currentFlow entirely
    currentFlow.value.blocks.length = 0;
    currentFlow.value.connections.length = 0;
    
    // Update flow metadata
    currentFlow.value.id = flowData.id;
    currentFlow.value.meta = { ...flowData.meta };
    currentFlow.value.canvas = { ...flowData.canvas };
    
    // Add blocks one by one to preserve reactivity
    flowData.blocks.forEach(block => {
      currentFlow.value.blocks.push(block);
    });
    
    // Add connections one by one to preserve reactivity
    flowData.connections.forEach(connection => {
      currentFlow.value.connections.push(connection);
    });
    
    // Ensure loaded flow has proper version info
    if (!hasVersionInfo(currentFlow.value.meta)) {
      initializeVersionInfo(currentFlow.value.meta.name);
    }
    
    clearSelection();
    resetCanvasView();
    updateModifiedTime();
  }

  function exportFlow(): FlowDefinition {
    return JSON.parse(JSON.stringify(currentFlow.value));
  }

  /**
   * Initialize system blocks (Start and End) for new flows
   */
  async function initializeSystemBlocks(): Promise<void> {
    // Check if system blocks already exist
    const hasStartBlock = currentFlow.value.blocks.some(
      block => block.definitionId === 'system.start'
    );
    const hasEndBlock = currentFlow.value.blocks.some(
      block => block.definitionId === 'system.end'
    );

    const blockFactory = BlockFactory.getInstance();

    // Create Start block if missing
    if (!hasStartBlock) {
      try {
        const startBlock = await blockFactory.createInstance('system.start', {
          position: { x: 100, y: 200 },
          meta: { system: true }
        });
        currentFlow.value.blocks.push(startBlock);
      } catch (error) {
        console.error('[useBlockEditor] Failed to create system.start block:', error);
      }
    }

    // Create End block if missing
    if (!hasEndBlock) {
      try {
        const endBlock = await blockFactory.createInstance('system.end', {
          position: { x: 600, y: 200 },
          meta: { system: true }
        });
        currentFlow.value.blocks.push(endBlock);
      } catch (error) {
        console.error('[useBlockEditor] Failed to create system.end block:', error);
      }
    }
  }

  // === CONTAINER SUPPORT ===

  function createContainer(
    name: string,
    selectedBlocks: string[],
    position?: Position
  ): ContainerMetadata | null {
    try {
      const container = containerManager.createContainer({
        name,
        selectedBlocks,
        position: position || { x: 200, y: 200 }
      });
      return container;
    } catch (error) {
      console.error('[useBlockEditor] Failed to create container:', error);
      return null;
    }
  }

  // === FLOW VERSIONING ===
  
  /**
   * Initialize version info for new flows
   */
  function initializeVersionInfo(name?: string, templateId?: string): void {
    const flowId = generateFlowId(name);
    const version = getDefaultFlowVersion();
    
    currentFlow.value.meta = {
      ...currentFlow.value.meta,
      flowId,
      flowVersion: version,
      versionId: generateVersionId(flowId, version),
      templateId,
      flowEditorVersion: '3.0.0',
      formatVersion: '3.0.0'
    };
  }

  /**
   * Save flow with automatic versioning
   */
  async function saveFlowVersion(
    incrementType: 'major' | 'minor' | 'patch' = 'patch',
    saveToBackend = true
  ): Promise<{ success: boolean; versionId?: string; error?: string }> {
    try {
      // Ensure flow has version info
      if (!hasVersionInfo(currentFlow.value.meta)) {
        initializeVersionInfo(currentFlow.value.meta.name);
      }

      const currentVersion = currentFlow.value.meta.flowVersion!;
      const newVersion = incrementVersion(currentVersion, incrementType);
      const flowId = currentFlow.value.meta.flowId!;
      const newVersionId = generateVersionId(flowId, newVersion);

      // Update version info
      currentFlow.value.meta = {
        ...currentFlow.value.meta,
        flowVersion: newVersion,
        versionId: newVersionId,
        modifiedAt: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
        exportedBy: 'FlowEditor v3 Canvas'
      };

      // TODO: IMPLEMENT_LATER - Save to backend FlowTemplate
      if (saveToBackend) {
        console.log('🔄 TODO: Save flow version to backend:', {
          flowId,
          version: newVersion,
          versionId: newVersionId,
          flowData: exportFlow()
        });
      }

      return { success: true, versionId: newVersionId };
    } catch (error) {
      console.error('[useBlockEditor] Failed to save flow version:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create new version from current flow
   */
  function createNewVersion(
    incrementType: 'major' | 'minor' | 'patch' = 'patch'
  ): void {
    if (!hasVersionInfo(currentFlow.value.meta)) {
      console.warn('[useBlockEditor] Cannot create version - flow has no version info');
      return;
    }

    const currentVersion = currentFlow.value.meta.flowVersion!;
    const newVersion = incrementVersion(currentVersion, incrementType);
    const flowId = currentFlow.value.meta.flowId!;
    
    currentFlow.value.meta = {
      ...currentFlow.value.meta,
      flowVersion: newVersion,
      versionId: generateVersionId(flowId, newVersion),
      modifiedAt: new Date().toISOString()
    };
    
    updateModifiedTime();
  }

  /**
   * Check if current flow has unsaved changes
   */
  function hasUnsavedChanges(): boolean {
    const meta = currentFlow.value.meta;
    return meta.modifiedAt !== meta.exportedAt;
  }

  /**
   * Get version info for current flow
   */
  function getVersionInfo(): {
    flowId?: string;
    version?: string;
    versionId?: string;
    hasVersionInfo: boolean;
  } {
    const meta = currentFlow.value.meta;
    return {
      flowId: meta.flowId,
      version: meta.flowVersion,
      versionId: meta.versionId,
      hasVersionInfo: hasVersionInfo(meta)
    };
  }

  // === VALIDATION ===

  function validateFlow(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for system blocks
    const hasStart = blocks.value.some(b => b.definitionId === 'system.start');
    const hasEnd = blocks.value.some(b => b.definitionId === 'system.end');

    if (!hasStart) errors.push('Flow missing START block');
    if (!hasEnd) errors.push('Flow missing END block');

    // Check for isolated blocks
    const connectedBlocks = new Set<string>();
    connections.value.forEach(conn => {
      connectedBlocks.add(conn.sourceBlockId);
      connectedBlocks.add(conn.targetBlockId);
    });

    blocks.value.forEach(block => {
      if (!connectedBlocks.has(block.id) && 
          block.definitionId !== 'system.start' && 
          block.definitionId !== 'system.end') {
        warnings.push(`Block ${block.id} is not connected`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Initialize system blocks on creation
  initializeSystemBlocks();

  // === RETURN API ===
  return {
    // State
    currentFlow,
    canvasState,
    blocks,
    connections,
    selectedBlocksData,
    hasBlocks,
    selectedBlockCount,

    // Block Management
    addBlock,
    removeBlock,
    updateBlockPosition,
    updateBlockParameters,
    getBlock,

    // Connection Management
    addConnection,
    removeConnection,

    // Selection Management
    selectBlock,
    deselectBlock,
    selectMultipleBlocks,
    clearSelection,
    toggleBlockSelection,
    isBlockSelected,

    // Canvas Management
    updateCanvasZoom,
    updateCanvasPan,
    setPan,
    setZoom,
    resetCanvasView,
    centerCanvas,

    // Flow Management
    createNewFlow,
    clearFlow,
    loadFlow,
    exportFlow,
    initializeSystemBlocks,

    // Container Support
    createContainer,

    // Validation
    validateFlow,

    // Utilities
    updateModifiedTime,
    
    // Flow Versioning
    initializeVersionInfo,
    saveFlowVersion,
    createNewVersion,
    hasUnsavedChanges,
    getVersionInfo,
  };
}