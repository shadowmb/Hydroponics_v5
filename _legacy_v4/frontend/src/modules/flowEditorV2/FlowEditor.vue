<!--
/**
 * 📦 FlowEditor v3 - Main Editor Component
 * ✅ Част от основната редакторна система
 * Основен entry point за визуалния flow редактор
 * Последна проверка: 2025-01-26
 */
-->
<template>
  <div class="flow-editor">
    <!-- 📊 Monitoring Mode Indicator -->
    <div v-if="editorSettings.isMonitoring" class="monitoring-mode-indicator">
      <q-icon name="analytics" size="sm" color="white" />
      <span>МОНИТОРИНГ РЕЖИМ</span>
      <q-chip size="sm" color="white" text-color="secondary">
        {{ editorSettings.monitoringInterval }} мин
      </q-chip>
    </div>
    
    <!-- Main Flow Mode -->
    <div v-if="!isInContainer" class="editor-layout">
      <!-- Block selector -->
      <div class="block-selector-area">
        <BlockSelector
          :readonly="readonly"
          @block-added="handleBlockAdded"
          @category-toggled="handleCategoryToggled"
        />
      </div>

      <!-- Main canvas area -->
      <div class="canvas-area">
        <FlowCanvas
          :show-grid="editorSettings.showGrid"
          :show-debug="editorSettings.showDebug"
          :snap-to-grid="editorSettings.snapToGrid"
          :grid-size="editorSettings.gridSize"
          :filtered-blocks="mainBlocks"
          :all-blocks="blocks"
          :filtered-connections="mainConnections"
          :readonly="readonly"
          :editFlowId="editFlowId"
          @block-selected="handleBlockSelected"
          @block-moved="handleBlockMoved"
          @canvas-panned="handleCanvasPanned"
          @canvas-zoomed="handleCanvasZoomed"
          @container-entered="handleContainerEntered"
        />
      </div>

      <!-- Control panel -->
      <div class="control-panel-area">
        <!-- DEACTIVATED: Executor Mode System - Phase 2B - showTargetConfig always false -->
        <ControlPanel 
          :selectedBlock="selectedBlock"
          :currentFlow="currentFlow"
          :workspaceBlocks="blocks"
          :blockDefinitions="blockDefinitions"
          :readonly="readonly"
          :showTargetConfig="false"
          :editorSettings="editorSettings"
          @blockUpdated="handleBlockUpdated"
          @deselectBlock="handleDeselectBlock"
          @targetConfigUpdated="handleTargetConfigUpdated"
          @configurationExported="handleConfigurationExported"
        />
      </div>
    </div>

    <!-- Container Mode - Same UI with different data -->
    <div v-else class="editor-layout">
      <!-- Same layout as main mode -->
      <!-- Block selector -->
      <div class="block-selector-area">
        <BlockSelector
          :readonly="readonly"
          @block-added="handleBlockAdded"
          @category-toggled="handleCategoryToggled"
        />
      </div>

      <!-- Container canvas area -->
      <div class="canvas-area" style="position: relative;">
        <!-- Compact breadcrumb in top-left corner -->
        <div class="container-breadcrumb" style="position: absolute; top: 70px; left: 15px; z-index: 9999; background: rgba(25, 118, 210, 0.9); color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
          <span @click="handleNavigateToMain" class="breadcrumb-link" style="color: white; text-decoration: underline; cursor: pointer;">Основен Поток</span>
          <span class="breadcrumb-sep" style="color: white; margin: 0 6px;"> → </span>
          <span class="breadcrumb-current" style="color: white; font-weight: 600;">{{ containerModeInfo.currentContainerName || 'Контейнер' }}</span>
        </div>
        
        <FlowCanvas
          :show-grid="editorSettings.showGrid"
          :show-debug="editorSettings.showDebug"
          :snap-to-grid="editorSettings.snapToGrid"
          :grid-size="editorSettings.gridSize"
          :filtered-blocks="containerBlocks"
          :all-blocks="blocks"
          :filtered-connections="containerConnections"
          :readonly="readonly"
          :editFlowId="editFlowId"
          @block-selected="handleBlockSelected"
          @block-moved="handleBlockMoved"
          @canvas-panned="handleCanvasPanned"
          @canvas-zoomed="handleCanvasZoomed"
          @container-entered="handleContainerEntered"
        />
      </div>

      <!-- Control panel -->
      <div class="control-panel-area">
        <!-- DEACTIVATED: Executor Mode System - Phase 2B - showTargetConfig always false -->
        <ControlPanel 
          :selectedBlock="selectedBlock"
          :currentFlow="currentFlow"
          :workspaceBlocks="blocks"
          :blockDefinitions="blockDefinitions"
          :readonly="readonly"
          :showTargetConfig="false"
          :editorSettings="editorSettings"
          @blockUpdated="handleBlockUpdated"
          @deselectBlock="handleDeselectBlock"
          @targetConfigUpdated="handleTargetConfigUpdated"
          @configurationExported="handleConfigurationExported"
        />
      </div>
    </div>

    <!-- Settings panel (collapsible) -->
    <div v-if="showSettings" class="settings-panel">
      <q-card>
        <q-card-section>
          <div class="text-h6">Настройки на редактора</div>
        </q-card-section>
        
        <q-card-section>
          <div class="settings-group">
            <q-toggle
              v-model="editorSettings.showGrid"
              label="Показвай решетка"
            />
            <q-toggle
              v-model="editorSettings.snapToGrid"
              label="Прикачване към решетка"
            />
            <q-toggle
              v-model="editorSettings.showDebug"
              label="Debug информация"
            />
            <q-separator spaced />
            <q-toggle
              v-model="editorSettings.isMonitoring"
              label="📊 Мониторинг режим"
              color="secondary"
            />
          </div>
          
          <div class="settings-group">
            <q-slider
              v-model="editorSettings.gridSize"
              :min="10"
              :max="50"
              :step="5"
              label
              label-always
              label-text-color="primary"
              color="primary"
            >
              <template v-slot:label="{ value }">
                Размер на решетката: {{ value }}px
              </template>
            </q-slider>
            
            <!-- Monitoring interval slider (показва се само в monitoring режим) -->
            <q-slider
              v-if="editorSettings.isMonitoring"
              v-model="editorSettings.monitoringInterval"
              :min="1"
              :max="60"
              :step="1"
              label
              label-always
              label-text-color="secondary"
              color="secondary"
            >
              <template v-slot:label="{ value }">
                📊 Интервал за мониторинг: {{ value }} мин
              </template>
            </q-slider>
          </div>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn
            flat
            label="Затвори"
            @click="showSettings = false"
          />
        </q-card-actions>
      </q-card>
    </div>

    <!-- Main toolbar moved to top of canvas area -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import FlowCanvas from './ui/editor/FlowCanvas.vue';
// 🧪 TESTING: Using modular ControlPanel for Phase 1 testing
import ControlPanel from './ui/editor/ControlPanel_Modular/ControlPanel.vue';
import BlockSelector from './components/BlockSelector.vue';
import ContainerWorkspace from './ui/editor/ContainerWorkspace.vue';
import { useBlockEditor } from './composables/useBlockEditor';
import { useContainerNavigation } from './composables/useContainerNavigation';
import { ContainerManager } from './core/containers/ContainerManager';
import { FlowValidator } from './core/flow/FlowValidator';
import { FlowExporter } from './core/flow/FlowExporter';
import { ConnectionValidator } from './core/connections/ConnectionValidator';
import { validateBlocks } from './validation/BlockValidator';
import { BlockFactory } from './blocks/BlockFactory';
// ❌ Test imports removed - tests are not part of production code
// import ConnectionSystemTest from './tests/legacy-ConnectionSystemTest';
// import BlockSelectionTest from './tests/BlockSelectionTest';
// import './tests/PortPositionCentralization.test';
import type { Position, BlockDefinition } from './types/BlockConcept';
import type { ContainerMetadata } from './types/ContainerTypes';
import type { BreadcrumbItem } from './types/ContainerNavigation';
import { API_BASE_URL } from '../../config/ports';

// Props
interface Props {
  initialFlowId?: string;
  editFlowId?: string;  // NEW: MongoDB _id for edit mode
  readonly?: boolean;
  showToolbar?: boolean;
  // DEACTIVATED: Executor Mode System - Phase 2B
  // targetConfigMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showToolbar: true,
  // DEACTIVATED: Executor Mode System - Phase 2B
  // targetConfigMode: false,
});

// Events
const emit = defineEmits<{
  flowChanged: [flowId: string];
  flowSaved: [flowId: string];
  flowValidated: [isValid: boolean];
  blockSelected: [blockId: string | null];
  error: [message: string];
  targetConfigUpdated: [fieldId: string, targetKey: string | null, comment?: string];
  configurationExported: [config: any];
}>();

// Quasar
const $q = useQuasar();

// Router
const route = useRoute();

// Edit mode detection
const isEdit = computed(() => !!route.params.id);
const editFlowId = computed(() => route.params.id as string || props.editFlowId);

// Container navigation composable - create FIRST
const containerNavigation = useContainerNavigation();
const {
  isInContainer,
  canGoBack,
  currentContainerName,
  breadcrumbItems,
  containerModeInfo,
  enterContainer,
  exitContainer,
  navigateToMain,
  navigateToContainer,
  goBack
} = containerNavigation;

// Provide container navigation BEFORE useBlockEditor
provide('containerNavigation', containerNavigation);

// Composables - централизирана инстанция за всички деца
// Create emit function to handle validateBlocks events from useBlockEditor
const handleBlockEditorEmit = (event: 'validateBlocks', blockIds: string[]) => {
  if (event === 'validateBlocks') {
    validateSpecificBlocks(blockIds);
  }
};

const blockEditorData = useBlockEditor(handleBlockEditorEmit);
const {
  currentFlow,
  canvasState,
  blocks,
  connections,
  hasBlocks,
  selectedBlockCount,
  createNewFlow,
  loadFlow,
  updateModifiedTime,
  removeBlock,
  addBlock
} = blockEditorData;

// Provide block editor data за всички деца
provide('blockEditor', blockEditorData);

// Provide validation context for useBlockData
provide('currentConnections', connections);
provide('currentBlocks', blocks);

// Debounced validation state
const validationResults = ref<Map<string, any>>(new Map());
const validationDebounceTimer = ref<number | null>(null);
const VALIDATION_DEBOUNCE_DELAY = 500; // 500ms debounce

// Smart validation cache
const validationCache = ref<Map<string, { hash: string, result: any }>>(new Map());

// Generate hash for block+connections to detect changes
function generateValidationHash(block: any, connections: any[]): string {
  const blockHash = JSON.stringify({
    id: block.id,
    definitionId: block.definitionId,
    parameters: block.parameters,
    position: block.position
  });
  const connectionHash = JSON.stringify(
    connections.filter(conn =>
      conn.sourceBlockId === block.id || conn.targetBlockId === block.id
    ).sort((a, b) => a.id.localeCompare(b.id))
  );
  return btoa(blockHash + connectionHash).substring(0, 16);
}

// Debounced validation function
function performDebouncedValidation() {
  if (validationDebounceTimer.value) {
    clearTimeout(validationDebounceTimer.value);
  }

  validationDebounceTimer.value = window.setTimeout(() => {
    try {
      // Flow-level validation with smart caching
      const newResults = new Map();
      const currentBlocks = blocks.value;
      const currentConnections = connections.value;

      // Validate each block with caching
      currentBlocks.forEach(block => {
        const validationHash = generateValidationHash(block, currentConnections);
        const cached = validationCache.value.get(block.id);

        if (cached && cached.hash === validationHash) {
          // Use cached result
          newResults.set(block.id, cached.result);
        } else {
          // Perform new validation
          const result = validateBlocks([block], currentConnections).get(block.id);
          newResults.set(block.id, result);

          // Cache the result
          validationCache.value.set(block.id, {
            hash: validationHash,
            result
          });
        }
      });

      validationResults.value = newResults;

      // Emit flow validation status
      const hasErrors = Array.from(newResults.values()).some(result => !result?.isValid);
      emit('flowValidated', !hasErrors);

      console.log('🔍 [FlowEditor] Debounced validation completed:', {
        blocksValidated: currentBlocks.length,
        cacheHits: Array.from(validationCache.value.values()).length,
        hasErrors
      });
    } catch (error) {
      console.warn('🔍 [FlowEditor] Validation error:', error);
    }

    validationDebounceTimer.value = null;
  }, VALIDATION_DEBOUNCE_DELAY);
}

// Targeted validation function for specific blocks
function validateSpecificBlocks(blockIds: string[]) {
  try {
    if (!blockIds || blockIds.length === 0) {
      console.warn('🔍 [FlowEditor] validateSpecificBlocks called with empty blockIds');
      return;
    }

    const currentBlocks = blocks.value;
    const currentConnections = connections.value;

    // Filter blocks to only those specified in blockIds
    const blocksToValidate = currentBlocks.filter(block => blockIds.includes(block.id));

    if (blocksToValidate.length === 0) {
      console.warn('🔍 [FlowEditor] No blocks found for validation with IDs:', blockIds);
      return;
    }

    // Validate only the specified blocks with caching
    blocksToValidate.forEach(block => {
      const validationHash = generateValidationHash(block, currentConnections);
      const cached = validationCache.value.get(block.id);

      if (cached && cached.hash === validationHash) {
        // Use cached result - no need to update validationResults as it's already current
        console.log('🔍 [FlowEditor] Using cached validation result for block:', block.id);
      } else {
        // Perform new validation
        const result = validateBlocks([block], currentConnections).get(block.id);

        // Update validationResults map only for this block
        validationResults.value.set(block.id, result);

        // Cache the result
        validationCache.value.set(block.id, {
          hash: validationHash,
          result
        });

        console.log('🔍 [FlowEditor] Validated specific block:', block.id, 'isValid:', result?.isValid);
      }
    });

    console.log('🔍 [FlowEditor] Targeted validation completed for blocks:', blockIds);
  } catch (error) {
    console.warn('🔍 [FlowEditor] Targeted validation error:', error);
  }
}


// Cleanup validation cache when blocks are removed
watch(blocks, (newBlocks, oldBlocks) => {
  if (oldBlocks && newBlocks.length < oldBlocks.length) {
    const newBlockIds = new Set(newBlocks.map(b => b.id));
    oldBlocks.forEach(oldBlock => {
      if (!newBlockIds.has(oldBlock.id)) {
        validationCache.value.delete(oldBlock.id);
      }
    });
  }
}, { deep: false });

// Local state
const showSettings = ref(false);

// Container state - mock data for now (в реалността ще идва от ContainerManager)
const containers = ref<ContainerMetadata[]>([]);
const activeContainer = computed(() => {
  if (!containerModeInfo.value.currentContainerId) return null;
  return containers.value.find(c => c.id === containerModeInfo.value.currentContainerId);
});

// Computed properties
const selectedBlock = computed(() => {
  if (canvasState.selectedBlocks.length === 0) return undefined;
  const selectedBlockId = canvasState.selectedBlocks[0]; // Get first selected block
  return blocks.value.find(block => block.id === selectedBlockId);
});

// Readonly mode - combine prop and URL parameter
const readonly = computed(() => {
  return props.readonly || readonlyFromUrl;
});

// DEACTIVATED: Executor Mode System - Phase 2B
// Target config mode - combine prop and URL parameter
// const targetConfigMode = computed(() => {
//   return props.targetConfigMode || targetConfigFromUrl;
// });
const targetConfigMode = computed(() => false); // Always disabled

// Block definitions for TargetConfigSection
const blockDefinitions = ref<BlockDefinition[]>([]);

// Block filtering for different modes
const mainBlocks = computed(() => {
  // In main mode, show all blocks that are not inside containers
  return blocks.value.filter(block => !block.containerId);
});

const containerBlocks = computed(() => {
  // Enhanced container blocks collection - includes referenced blocks
  if (!containerModeInfo.value.currentContainerId) return [];
  
  const containerId = containerModeInfo.value.currentContainerId;
  
  // Step 1: Get direct container blocks (blocks with matching containerId)
  const directContainerBlocks = blocks.value.filter(block => 
    block.containerId === containerId
  );
  
  // Step 2: Get all connections involving these direct blocks
  const directBlockIds = new Set(directContainerBlocks.map(block => block.id));
  const relevantConnections = connections.value.filter(conn => 
    directBlockIds.has(conn.sourceBlockId) || directBlockIds.has(conn.targetBlockId)
  );
  
  // Step 3: Collect all referenced block IDs from connections
  const allReferencedBlockIds = new Set();
  directContainerBlocks.forEach(block => allReferencedBlockIds.add(block.id));
  relevantConnections.forEach(conn => {
    allReferencedBlockIds.add(conn.sourceBlockId);
    allReferencedBlockIds.add(conn.targetBlockId);
  });
  
  // Step 4: Get all blocks that are referenced (direct + connected)
  const allRelevantBlocks = blocks.value.filter(block => 
    allReferencedBlockIds.has(block.id)
  );
  
  // console.log('📦 DEBUG containerBlocks:', {
  //   containerId,
  //   directBlocks: directContainerBlocks.length,
  //   relevantConnections: relevantConnections.length,
  //   totalRelevantBlocks: allRelevantBlocks.length,
  //   referencedIds: Array.from(allReferencedBlockIds)
  // });
  
  return allRelevantBlocks;
});

// Connection filtering for different modes
const mainConnections = computed(() => {
  // In main mode, show connections between blocks that are not in containers
  const mainBlockIds = new Set(mainBlocks.value.map(block => block.id));
  return connections.value.filter(conn => 
    mainBlockIds.has(conn.sourceBlockId) && mainBlockIds.has(conn.targetBlockId)
  );
});

const containerConnections = computed(() => {
  // Enhanced container connections filtering
  if (!containerModeInfo.value.currentContainerId) return [];
  
  const containerId = containerModeInfo.value.currentContainerId;
  
  // Step 1: Get direct container blocks (blocks with matching containerId)
  const directContainerBlocks = blocks.value.filter(block => 
    block.containerId === containerId
  );
  const directBlockIds = new Set(directContainerBlocks.map(block => block.id));
  
  // Step 2: Find all connections that involve container blocks
  const relevantConnections = connections.value.filter(conn => 
    directBlockIds.has(conn.sourceBlockId) || directBlockIds.has(conn.targetBlockId)
  );
  
  // Step 3: Collect all referenced block IDs from these connections
  const allReferencedBlockIds = new Set();
  relevantConnections.forEach(conn => {
    allReferencedBlockIds.add(conn.sourceBlockId);
    allReferencedBlockIds.add(conn.targetBlockId);
  });
  
  // Step 4: Filter connections to include only those where BOTH blocks exist
  const validConnections = relevantConnections.filter(conn => {
    const sourceExists = blocks.value.some(block => block.id === conn.sourceBlockId);
    const targetExists = blocks.value.some(block => block.id === conn.targetBlockId);
    return sourceExists && targetExists;
  });
  
  // console.log('🔗 DEBUG containerConnections:', {
  //   containerId,
  //   directBlocks: directContainerBlocks.length,
  //   relevantConnections: relevantConnections.length,
  //   validConnections: validConnections.length,
  //   allReferenced: allReferencedBlockIds.size
  // });
  
  return validConnections;
});

// Check URL parameters for debug mode, readonly mode, target config mode, templateId, and flowId
const urlParams = new URLSearchParams(window.location.search);
const debugFromUrl = urlParams.get('debug') === 'true';
const readonlyFromUrl = urlParams.get('readonly') === 'true';
// DEACTIVATED: Executor Mode System - Phase 2B
// const targetConfigFromUrl = urlParams.get('targetConfigMode') === 'true';
const targetConfigFromUrl = false; // Always disabled
const templateIdFromUrl = urlParams.get('templateId');
const flowIdFromUrl = urlParams.get('flowId');
const idFromUrl = urlParams.get('id'); // MongoDB _id from FlowManagementPage
// 📊 Monitoring mode parameters
const isMonitoringFromUrl = urlParams.get('isMonitoring') === 'true';
const monitoringIntervalFromUrl = urlParams.get('monitoringInterval');

const editorSettings = ref({
  showGrid: true,
  snapToGrid: true,
  showDebug: true, // 🔍 DEBUG: Temporarily enabled for diagnostic purposes
  gridSize: 20,
  isMonitoring: isMonitoringFromUrl, // 📊 Monitoring mode for flow creation
  monitoringInterval: monitoringIntervalFromUrl ? parseInt(monitoringIntervalFromUrl) : 5, // Default monitoring interval in minutes
});

// History management (TODO: implement proper undo/redo)
const history = ref<any[]>([]);
const historyIndex = ref(-1);
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

// Flow status
const flowValidationResult = ref<any>(null);

// Block update handler
function handleBlockUpdated(blockId: string) {
  // Force reactivity update by updating the modified time
  updateModifiedTime();
  
  // Optionally emit to parent that block was updated
  emit('blockSelected', blockId);
}

// Deselect block handler
function handleDeselectBlock() {
  // Clear all selected blocks
  canvasState.selectedBlocks.splice(0);
  
  // Emit event
  emit('blockSelected', null);
}

const flowStatusColor = computed(() => {
  if (!flowValidationResult.value) return 'grey';
  if (flowValidationResult.value.isValid) {
    return flowValidationResult.value.warnings.length > 0 ? 'orange' : 'green';
  }
  return 'red';
});

const flowStatusIcon = computed(() => {
  if (!flowValidationResult.value) return 'help';
  return flowValidationResult.value.isValid ? 'check_circle' : 'error';
});

const flowStatusText = computed(() => {
  if (!flowValidationResult.value) return 'Непроверен';
  if (flowValidationResult.value.isValid) {
    const warningCount = flowValidationResult.value.warnings.length;
    return warningCount > 0 ? `Валиден (${warningCount} предупреждения)` : 'Валиден';
  }
  const errorCount = flowValidationResult.value.errors.length;
  return `Невалиден (${errorCount} грешки)`;
});

// Event handlers
function handleBlockSelected(blockId: string, multiSelect: boolean) {
  emit('blockSelected', blockId);
  // Auto-validate when selecting blocks
  validateFlow();
}

function handleBlockMoved(blockId: string, position: Position) {
  if (props.readonly) return;
  updateModifiedTime();
  // TODO: Add to history
}

function handleCanvasPanned(pan: Position) {
  // Optional: save pan state
}

function handleCanvasZoomed(zoom: number) {
  // Optional: save zoom state
}

function handleBlockAdded(blockId: string, position: Position) {
  if (props.readonly) return;
  // console.log('🔥 DEBUG FlowEditor.handleBlockAdded() called:', {
  //   blockId,
  //   position,
  //   isInContainer: isInContainer.value,
  //   currentContainerId: containerModeInfo.value.currentContainerId
  // });
  
  // If we're in container mode, assign the new block to the current container
  if (isInContainer.value && containerModeInfo.value.currentContainerId) {
    const newBlock = blocks.value.find(block => block.id === blockId);
   // console.log('🔥 DEBUG FlowEditor: Found new block:', newBlock ? newBlock.id : 'NOT FOUND');
    
    if (newBlock) {
      newBlock.containerId = containerModeInfo.value.currentContainerId;
      console.log('🔥 DEBUG FlowEditor: Block assigned to container:', blockId, 'containerId:', containerModeInfo.value.currentContainerId);
    }
  } else {
    //console.log('🔥 DEBUG FlowEditor: Block NOT assigned to container - not in container mode');
  }
  
  updateModifiedTime();
  
  $q.notify({
    type: 'positive',
    message: 'Блок добавен успешно',
    position: 'top-right',
    timeout: 2000
  });
  
  // Auto-validate after adding block
  setTimeout(() => {
    validateFlow();
  }, 100);
}

function handleCategoryToggled(categoryName: string, expanded: boolean) {
  // Optional: save category preferences
}

// === CONTAINER EVENT HANDLERS ===

function handleContainerEntered(containerId: string) {
  console.log('🔥 DEBUG FlowEditor: handleContainerEntered called with:', containerId);
  
  // Намираме контейнера (mock data за сега)
  let container = containers.value.find(c => c.id === containerId);
  console.log('🔥 DEBUG FlowEditor: found container:', container);
  
  if (container) {
    console.log('🔥 DEBUG FlowEditor: entering container:', containerId, container.name);
    enterContainer(containerId, container.name);
  } else {
    console.log('🔥 DEBUG FlowEditor: Container not found! Creating container in ContainerManager');
    
    // Създаваме контейнера в ContainerManager
    const containerManager = ContainerManager.getInstance();
    container = containerManager.createContainer({
      name: 'Test Container',
      id: containerId
    });
    
    // Добавяме към локалния списък
    containers.value.push(container);
    
    //console.log('🔥 DEBUG FlowEditor: Created container:', container);
    enterContainer(containerId, container.name);
  }
  
  // 🏗️ Проверяваме и създаваме системните блокове за контейнера
  createSystemBlocksForContainer(containerId);
}

// 🏗️ Създава системни START/END блокове за контейнер ако не съществуват
function createSystemBlocksForContainer(containerId: string) {
  if (props.readonly) return;
 // console.log('🏗️ Checking system blocks for container:', containerId);
  
  // Проверяваме дали вече има START блок за този контейнер
  const hasStartBlock = currentFlow.value.blocks.some(block => 
    block.containerId === containerId && 
    block.definitionId === 'system.start' && 
    block.containerSystem === true
  );
  
  // Проверяваме дали вече има END блок за този контейнер
  const hasEndBlock = currentFlow.value.blocks.some(block => 
    block.containerId === containerId && 
    block.definitionId === 'system.end' && 
    block.containerSystem === true
  );
  
 // console.log('🏗️ Has START block:', hasStartBlock, 'Has END block:', hasEndBlock);
  
  if (!hasStartBlock || !hasEndBlock) {
    //console.log('🏗️ Missing system blocks, creating needed ones...');
    
    try {
      // Използваме ContainerManager за създаване на системните блокове
      const containerManager = ContainerManager.getInstance();
      const { startBlock, endBlock } = containerManager.createContainerSystemBlocks(containerId);
      
      // Добавяме само липсващите блокове
      if (!hasStartBlock) {
        currentFlow.value.blocks.push(startBlock);
       // console.log('🏗️ Created START block:', startBlock.id);
      }
      
      if (!hasEndBlock) {
        currentFlow.value.blocks.push(endBlock);
       // console.log('🏗️ Created END block:', endBlock.id);
      }
      
      updateModifiedTime();
      
      const createdBlocks = [];
      if (!hasStartBlock) createdBlocks.push('START');
      if (!hasEndBlock) createdBlocks.push('END');
      
     // console.log('🏗️ Successfully created system blocks:', createdBlocks.join(', '));
      
      if (createdBlocks.length > 0) {
        $q.notify({
          type: 'positive',
          message: `Създадени системни блокове: ${createdBlocks.join(', ')}`,
          position: 'top',
          timeout: 2000
        });
      }
      
    } catch (error) {
      console.error('🚨 Error creating system blocks:', error);
      $q.notify({
        type: 'negative',
        message: 'Грешка при създаване на системни блокове',
        position: 'top'
      });
    }
  } else {
   // console.log('🏗️ System blocks already exist for container');
  }
}

function handleNavigateToMain() {
  navigateToMain();
}

function handleNavigateToItem(item: BreadcrumbItem, index: number) {
  navigateToContainer(item.id, containers.value);
}

function handleGoBack() {
  goBack();
}

function handleExportContainer(containerId: string) {
  // TODO: IMPLEMENT_LATER - Export container logic
  $q.notify({
    type: 'info',
    message: 'Експорт на контейнер ще бъде добавен скоро',
    position: 'top'
  });
}

function handleImportToContainer(containerId: string, file: File) {
  // TODO: IMPLEMENT_LATER - Import to container logic
  $q.notify({
    type: 'info',
    message: 'Импорт в контейнер ще бъде добавен скоро',
    position: 'top'
  });
}

function handleContainerUpdated(containerId: string, updates: Partial<ContainerMetadata>) {
  if (props.readonly) return;
  const container = containers.value.find(c => c.id === containerId);
  if (container) {
    Object.assign(container, updates);
    updateModifiedTime();
  }
}

function handleContainerBlockAdded(containerId: string, blockType: any) {
  if (props.readonly) return;
  // Add block to container context
  const position: Position = { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 };
  handleBlockAdded(blockType.id, position);
}

// File operations
function openFlow() {
  // TODO: IMPLEMENT_LATER - Show file dialog to open flow
  $q.notify({
    type: 'info',
    message: 'Функцията за отваряне на файлове ще бъде добавена скоро',
    position: 'top'
  });
}

function saveFlow() {
  if (props.readonly) return;
  try {
    // TODO: IMPLEMENT_LATER - Save flow to backend or local storage
    updateModifiedTime();
    emit('flowSaved', currentFlow.value.id);
    
    $q.notify({
      type: 'positive',
      message: 'Flow запазен успешно',
      position: 'top'
    });
  } catch (error) {
    emit('error', 'Грешка при запазване на flow');
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване',
      position: 'top'
    });
  }
}

//Не се използва:  FlowCanvas има своя собствена exportFlow функция която не е същата като тази във FlowEditor. Export бутонът в toolbar-а на FlowCanvas извиква функцията от FlowCanvas, не от FlowEditor.
function exportFlow() {
  try {
    let blocksToExport;
    let connectionsToExport;
    let fileName;
    
   // console.log('🔥 DEBUG Export: isInContainer.value:', isInContainer.value);
    //console.log('🔥 DEBUG Export: containerModeInfo.value:', containerModeInfo.value);
    
    if (isInContainer.value) {
      // Container mode: export only current container
      const containerName = containerModeInfo.value.currentContainerName || 'Container';
      //console.log('🔥 DEBUG Export Container: containerBlocks:', containerBlocks.value.length);
      //console.log('🔥 DEBUG Export Container: containerConnections:', containerConnections.value.length);
      
      blocksToExport = containerBlocks.value;
      connectionsToExport = containerConnections.value;
      fileName = `container-${containerName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    } else {
      // Main mode: export entire flow
      blocksToExport = blocks.value;
      connectionsToExport = connections.value;
      const flowType = editorSettings.value.isMonitoring ? 'monitoring' : 'flow';
      fileName = `${flowType}-${currentFlow.value.meta.name?.replace(/\s+/g, '-') || 'export'}-${new Date().toISOString().slice(0, 10)}.json`;
    }
    
    // ✨ NEW: Validate export consistency before proceeding
    const consistencyCheck = ConnectionValidator.validateExportConsistency(
      blocksToExport,
      connectionsToExport
    );
    
   // console.log('🔍 Export Consistency Check:', consistencyCheck);
    
    if (!consistencyCheck.isValid) {
      console.warn('⚠️ Export consistency issues detected:', consistencyCheck.errors);
      
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
    
    // Prepare export data
    const dataToExport = {
      ...currentFlow.value,
      meta: {
        ...currentFlow.value.meta,
        name: isInContainer.value 
          ? `${containerModeInfo.value.currentContainerName || 'Container'}` 
          : currentFlow.value.meta.name,
        exportType: isInContainer.value ? 'container' : 'main',
        containerId: isInContainer.value ? containerModeInfo.value.currentContainerId : undefined,
        // 📊 Monitoring metadata
        isMonitoring: editorSettings.value.isMonitoring,
        monitoringInterval: editorSettings.value.isMonitoring ? editorSettings.value.monitoringInterval : undefined
      },
      blocks: blocksToExport,
      connections: connectionsToExport
    };

    const result = FlowExporter.exportFlow(dataToExport, {
      pretty: true,
      includeValidation: true,
      exportedBy: 'FlowEditor v3'
    });

    if (result.success && result.data) {
      // Create downloadable file
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const message = isInContainer.value 
        ? `Контейнер "${containerModeInfo.value.currentContainerName}" експортиран успешно`
        : 'Flow експортиран успешно';
      
      const summaryMessage = consistencyCheck.isValid 
        ? message
        : `${message} (${connectionsToExport.length}/${consistencyCheck.validConnections.length + consistencyCheck.orphanedConnections.length} връзки)`;

      $q.notify({
        type: 'positive',
        message: summaryMessage,
        position: 'top'
      });
    } else {
      throw new Error(result.error || 'Export failed');
    }
  } catch (error) {
    console.error('🚨 Export error:', error);
    emit('error', 'Грешка при експорт на flow');
    $q.notify({
      type: 'negative',
      message: 'Грешка при експорт',
      position: 'top'
    });
  }
}

// Edit operations
function undo() {
  if (props.readonly) return;
  // TODO: IMPLEMENT_LATER - Implement undo functionality
  $q.notify({
    type: 'info',
    message: 'Undo функцията ще бъде добавена скоро',
    position: 'top'
  });
}

function redo() {
  if (props.readonly) return;
  // TODO: IMPLEMENT_LATER - Implement redo functionality  
  $q.notify({
    type: 'info',
    message: 'Redo функцията ще бъде добавена скоро',
    position: 'top'
  });
}

// View operations
function zoomIn() {
  const newZoom = Math.min(3, canvasState.zoom * 1.2);
  canvasState.zoom = newZoom;
}

function zoomOut() {
  const newZoom = Math.max(0.1, canvasState.zoom * 0.8);
  canvasState.zoom = newZoom;
}

function resetView() {
  canvasState.zoom = 1;
  canvasState.pan = { x: 0, y: 0 };
}

// Validation
function validateFlow() {
  try {
    flowValidationResult.value = FlowValidator.validateFlow(currentFlow.value);
    emit('flowValidated', flowValidationResult.value.isValid);
  } catch (error) {
    emit('error', 'Грешка при валидация на flow');
  }
}

// Help
function showHelp() {
  $q.dialog({
    title: 'FlowEditor v3 Помощ',
    message: `
      <div style="text-align: left;">
        <h6>Основни функции:</h6>
        <ul>
          <li><strong>Добавяне на блокове:</strong> Използвай бутоните в toolbar-а на canvas</li>
          <li><strong>Селектиране:</strong> Кликни върху блок за селектиране</li>
          <li><strong>Преместване:</strong> Влачи селектираните блокове</li>
          <li><strong>Zoom:</strong> Колелце на мишката или бутоните за zoom</li>
          <li><strong>Pan:</strong> Средно копче или десен клик + влачене</li>
        </ul>
        
        <h6>Контролен панел:</h6>
        <ul>
          <li><strong>Flow таб:</strong> Настройки на целия поток</li>
          <li><strong>Блок таб:</strong> Свойства на избрания блок</li>
        </ul>
        
        <h6>Клавишни комбинации:</h6>
        <ul>
          <li><strong>Ctrl/Cmd + S:</strong> Запазване</li>
          <li><strong>Delete:</strong> Изтриване на селектирани блокове (или използвайте delete иконата в блока)</li>
          <li><strong>Ctrl/Cmd + A:</strong> Селектиране на всички</li>
        </ul>
      </div>
    `,
    html: true,
    ok: 'Затвори'
  });
}

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (props.readonly) return;
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;

  if (isCtrlOrCmd) {
    switch (event.key.toLowerCase()) {
      case 's':
        event.preventDefault();
        saveFlow();
        break;
      case 'z':
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        break;
      case 'a':
        event.preventDefault();
        // TODO: Select all blocks
        break;
    }
  } else {
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        // Check if user is typing in an input field (control panel editing)
        const target = event.target as HTMLElement;
        const isInputField = target && (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.contentEditable === 'true' ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('[contenteditable="true"]')
        );
        
        // Only delete blocks if NOT typing in input field
        if (!isInputField && canvasState.selectedBlocks.length > 0) {
          // Check if any selected blocks are system blocks
          const systemBlocks = canvasState.selectedBlocks.filter(blockId => {
            const block = blocks.value.find(b => b.id === blockId);
            return block && (block.definitionId === 'system.start' || block.definitionId === 'system.end');
          });
          
          if (systemBlocks.length > 0) {
            alert('Системните блокове (Start/End) не могат да се изтриват!');
            return;
          }
          
          const blockCount = canvasState.selectedBlocks.length;
          const message = blockCount === 1 
            ? 'Сигурни ли сте, че искате да изтриете избрания блок?'
            : `Сигурни ли сте, че искате да изтриете ${blockCount} блока?`;
          
          const confirmed = confirm(message);
          if (confirmed) {
            canvasState.selectedBlocks.forEach(blockId => removeBlock(blockId));
          }
        }
        break;
      case 'Escape':
        // Clear selection or close dialogs
        canvasState.selectedBlocks = [];
        showSettings.value = false;
        break;
    }
  }
}

/**
 * 🎯 Phase 6: Load flow from ActionTemplate with real FlowTemplate integration
 * @param templateId ActionTemplate ID to load flow from
 */
async function loadActionTemplateFlow(templateId: string) {
  try {
    // Fetch ActionTemplate data
    const response = await fetch(`${API_BASE_URL}/action-templates/${templateId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ActionTemplate: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to load ActionTemplate');
    }
    
    const template = result.data;
    
    // Check if template has flow data
    if (!template.linkedFlowId && !template.flowFile) {
      $q.notify({
        type: 'warning',
        message: 'Action Template няма свързан flow файл',
        caption: 'Няма flow данни за зареждане'
      });
      return;
    }
    
    let flowData = null;
    
    // Try to load from FlowTemplate first (new approach)
    if (template.linkedFlowId) {
      try {
        const flowResponse = await fetch(`${API_BASE_URL}/flow-templates/flow/${template.linkedFlowId}/latest`);
        if (flowResponse.ok) {
          const flowResult = await flowResponse.json();
          if (flowResult.success && flowResult.data) {
            flowData = flowResult.data.flowData;
            console.log('✅ Flow loaded from FlowTemplate:', template.linkedFlowId);
          }
        }
      } catch (error) {
        console.warn('Failed to load from FlowTemplate, trying legacy flowFile:', error);
      }
    }
    
    // Fallback to flow file endpoint for real file loading
    if (!flowData) {
      try {
        const flowResponse = await fetch(`${API_BASE_URL}/action-templates/${templateId}/flow`);
        if (flowResponse.ok) {
          const flowResult = await flowResponse.json();
          if (flowResult.success && flowResult.data && flowResult.data.flowData) {
            flowData = flowResult.data.flowData;
            console.log('✅ Flow loaded from file system:', flowResult.data.flowSource);
          }
        }
      } catch (error) {
        console.warn('Failed to load flow from file system:', error);
      }
    }
    
    // Final fallback to sample data if nothing else works
    if (!flowData) {
      console.log('⚠️ No flow data found, creating sample flow');
      if (template.flowFile) {
        flowData = createSampleFlowFromFileName(template.flowFile);
      } else {
        flowData = createBasicSampleFlow();
      }
    }
    
    // Transform and load the flow data
    if (flowData && flowData.blocks) {
      const flowDefinition = {
        id: `template_${templateId}_${Date.now()}`,
        meta: {
          name: `Flow от ${template.name}`,
          description: template.description || '',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          templateId: templateId,
          linkedFlowId: template.linkedFlowId
        },
        blocks: flowData.blocks || [],
        connections: flowData.connections || [],
        canvas: flowData.canvas || {
          zoom: 1.0,
          pan: { x: 0, y: 0 },
          grid: { size: 20, visible: true, snap: true }
        }
      };
      
      await loadFlow(flowDefinition);
      
      const blockCount = flowDefinition.blocks.length;
      const connectionCount = flowDefinition.connections.length;
      
      $q.notify({
        type: 'positive',
        message: `Flow зареден от ${template.name}`,
        caption: `${blockCount} блока, ${connectionCount} връзки`,
        timeout: 3000
      });
      
      // Validate the loaded flow
      validateFlow();
    } else {
      throw new Error('Няма валидни flow данни за зареждане');
    }
  } catch (error: any) {
    console.error('Failed to load ActionTemplate flow:', error);
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на flow',
      caption: error.message,
      timeout: 5000
    });
  }
}

/**
 * Creates sample flow based on flowFile name for legacy support
 */
function createSampleFlowFromFileName(flowFile: string): any {
  const fileName = flowFile.toLowerCase();
  
  // Create different sample flows based on file name patterns
  if (fileName.includes('pump') || fileName.includes('irrigation')) {
    return {
      blocks: [
        {
          id: 'actuator-pump-1',
          definitionId: 'actuator',
          position: { x: 200, y: 150 },
          parameters: {
            deviceType: 'pump',
            action: 'turn_on',
            controlMode: 'duration',
            duration: 30,
            enabled: true
          },
          connections: { inputs: {}, outputs: {} }
        },
        {
          id: 'sensor-moisture-1',
          definitionId: 'sensor',
          position: { x: 400, y: 150 },
          parameters: {
            sensorType: 'moisture',
            threshold: 45,
            enabled: true
          },
          connections: { inputs: {}, outputs: {} }
        }
      ],
      connections: []
    };
  } else if (fileName.includes('light') || fileName.includes('led')) {
    return {
      blocks: [
        {
          id: 'actuator-light-1',
          definitionId: 'actuator',
          position: { x: 200, y: 150 },
          parameters: {
            deviceType: 'led',
            action: 'turn_on',
            controlMode: 'schedule',
            schedule: '08:00-20:00',
            enabled: true
          },
          connections: { inputs: {}, outputs: {} }
        }
      ],
      connections: []
    };
  } else {
    return createBasicSampleFlow();
  }
}

/**
 * Creates basic sample flow for testing
 */
function createBasicSampleFlow(): any {
  return {
    blocks: [
      {
        id: 'actuator-1',
        definitionId: 'actuator',
        position: { x: 200, y: 150 },
        parameters: {
          deviceType: 'pump',
          action: 'turn_on',
          controlMode: 'duration',
          duration: 10,
          enabled: true
        },
        connections: { inputs: {}, outputs: {} }
      }
    ],
    connections: []
  };
}

/**
 * 🎯 Phase 6: Load flow directly from FlowTemplate
 * @param flowId Flow ID to load latest version from
 */
// Load FlowTemplate by MongoDB _id (from FlowManagementPage)
async function loadFlowTemplateById(templateId: string) {
  try {
    // Fetch FlowTemplate by MongoDB _id
    const response = await fetch(`${API_BASE_URL}/flow-templates/${templateId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch FlowTemplate: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to load FlowTemplate');
    }
    
    // result.data is the FlowTemplate record with flowData field
    const flowTemplate = result.data;
    
    // Extract flowData from FlowTemplate structure
    const flowData = flowTemplate.flowData;
    
    // FlowData structure validated by backend - guaranteed to have proper format
    
    // Validate flow data
    if (!flowData || !flowData.blocks) {
      throw new Error('FlowTemplate няма валидни flow данни');
    }
    
    // Load directly using loadFlow function - no transformation needed
    await loadFlow(flowData);
    
    // Update currentFlow meta with DB data AFTER loadFlow
    if (currentFlow.value) {
      currentFlow.value.meta.name = flowTemplate.name;
      currentFlow.value.meta.description = flowTemplate.description;
      // Set monitoring flow status from database
      currentFlow.value.meta.isMonitoringFlow = flowTemplate.isMonitoringFlow || false;
    }
    
    // Validate the loaded flow
    validateFlow();
    
    $q.notify({
      type: 'positive',
      message: `Flow зареден успешно`,
      position: 'top-right',
      timeout: 2000
    });
    
  } catch (error: any) {
    console.error('❌ Error loading FlowTemplate by ID:', error);
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на flow',
      caption: error.message,
      position: 'top-right',
      timeout: 5000
    });
  }
}

async function loadFlowTemplate(flowId: string) {
  try {
    // Fetch latest version of the flow
    const response = await fetch(`${API_BASE_URL}/flow-templates/flow/${flowId}/latest`);
    if (!response.ok) {
      throw new Error(`Failed to fetch FlowTemplate: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to load FlowTemplate');
    }
    
    const flowTemplate = result.data;
    
    // Validate flow data
    if (!flowTemplate.flowData || !flowTemplate.flowData.blocks) {
      throw new Error('FlowTemplate няма валидни flow данни');
    }
    
    // Transform and load the flow data
    const flowDefinition = {
      id: `flowtemplate_${flowId}_${Date.now()}`,
      meta: {
        name: flowTemplate.name,
        description: flowTemplate.description || '',
        version: flowTemplate.version,
        createdAt: flowTemplate.createdAt,
        modifiedAt: new Date().toISOString(),
        flowId: flowTemplate.flowId,
        versionId: flowTemplate.versionId
      },
      blocks: flowTemplate.flowData.blocks || [],
      connections: flowTemplate.flowData.connections || [],
      canvas: flowTemplate.flowData.canvas || {
        zoom: 1.0,
        pan: { x: 0, y: 0 },
        grid: { size: 20, visible: true, snap: true }
      }
    };
    
    await loadFlow(flowDefinition);
    
    const blockCount = flowDefinition.blocks.length;
    const connectionCount = flowDefinition.connections.length;
    
    $q.notify({
      type: 'positive',
      message: `FlowTemplate зареден: ${flowTemplate.name}`,
      caption: `v${flowTemplate.version} • ${blockCount} блока, ${connectionCount} връзки`,
      timeout: 3000
    });
    
    // Validate the loaded flow
    validateFlow();
    
  } catch (error: any) {
    console.error('Failed to load FlowTemplate:', error);
    $q.notify({
      type: 'negative',
      message: 'Грешка при зареждане на FlowTemplate',
      caption: error.message,
      timeout: 5000
    });
  }
}

// Lifecycle
onMounted(async () => {
  // Load block definitions for Target Config
  try {
    const factory = BlockFactory.getInstance();
    blockDefinitions.value = await factory.getAllDefinitions();
  } catch (error) {
    console.error('Failed to load block definitions:', error);
    blockDefinitions.value = [];
  }
  
  // 🎯 Phase 6: Load flow from URL parameters and route params
  if (templateIdFromUrl) {
    await loadActionTemplateFlow(templateIdFromUrl);
  } else if (isEdit.value && editFlowId.value) {
    // Edit mode: load flow by MongoDB _id from route
    await loadFlowTemplateById(editFlowId.value);
  } else if (idFromUrl) {
    await loadFlowTemplateById(idFromUrl); // MongoDB _id from URL params (legacy)
  } else if (flowIdFromUrl) {
    await loadFlowTemplate(flowIdFromUrl);
  }
  
  // Add keyboard listeners
  document.addEventListener('keydown', handleKeydown);
  
  // Add header backup menu event listeners
  window.addEventListener('flow-editor:new-flow', () => {
    if (!props.readonly) createNewFlow();
  });
  
  window.addEventListener('flow-editor:save-flow', () => {
    if (!props.readonly) saveFlow();
  });
  
  window.addEventListener('flow-editor:export-flow', () => {
    exportFlow();
  });
  
  window.addEventListener('flow-editor:toggle-toolbar', () => {
    // Toggle toolbar visibility - this would need to be implemented
    // For now, we'll show/hide the settings panel as a placeholder
    showSettings.value = !showSettings.value;
  });
  
  window.addEventListener('flow-editor:reset', () => {
    if (props.readonly) return;
    // Reset the editor to initial state
    const confirmed = confirm('Сигурни ли сте, че искате да рестартирате редактора? Всички незапазени промени ще бъдат загубени.');
    if (confirmed) {
      createNewFlow();
      canvasState.selectedBlocks = [];
      canvasState.zoom = 1;
      canvasState.pan = { x: 0, y: 0 };
    }
  });
  
  // Initialize connection system test
  
  // Auto-validate on changes
  const unwatchBlocks = computed(() => blocks.value.length);
  const unwatchConnections = computed(() => connections.value.length);
  
  // TODO: Add proper watchers for flow changes
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);

  // Clean up header backup menu event listeners
  window.removeEventListener('flow-editor:new-flow', createNewFlow);
  window.removeEventListener('flow-editor:save-flow', saveFlow);
  window.removeEventListener('flow-editor:export-flow', exportFlow);

  // Clean up validation debounce timer
  if (validationDebounceTimer.value) {
    clearTimeout(validationDebounceTimer.value);
    validationDebounceTimer.value = null;
  }

  // Clear validation cache
  validationCache.value.clear();
  validationResults.value.clear();
});

/**
 * 🎯 Phase 5: Save target mapping to ActionTemplate
 * @param fieldId Field identifier (e.g., "blockId.fieldName")
 * @param targetKey Target key or null to clear
 * @param comment Optional comment
 */
async function saveTargetMappingToActionTemplate(fieldId: string, targetKey: string | null, comment?: string) {
  try {
    // Parse field ID to get blockId and fieldName
    const [blockId, fieldName] = fieldId.split('.');
    if (!blockId || !fieldName) {
      console.warn('Invalid fieldId format:', fieldId);
      return;
    }
    
    // Prepare target mapping update
    const targetMappingUpdate = {
      blockId,
      fieldName,
      targetKey,
      comment,
      configuredAt: new Date(),
      configuredBy: 'FlowEditor'
    };
    
    // Update ActionTemplate via API
    const response = await fetch(`${API_BASE_URL}/action-templates/${templateIdFromUrl}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetMapping: targetMappingUpdate
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ActionTemplate: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to save target mapping');
    }
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: 'Target mapping запазен',
      caption: `${blockId}.${fieldName} → ${targetKey || 'cleared'}`,
      timeout: 2000
    });
    
  } catch (error: any) {
    console.error('Failed to save target mapping:', error);
    $q.notify({
      type: 'negative',
      message: 'Грешка при запазване на target mapping',
      caption: error.message,
      timeout: 3000
    });
  }
}

// 🎯 Target Configuration Event Handlers

/**
 * Handles target configuration updates from TargetConfigSection
 */
function handleTargetConfigUpdated(fieldId: string, targetKey: string | null, comment?: string) {
  // Forward to parent component for ActionTemplate integration
  emit('targetConfigUpdated', fieldId, targetKey, comment);
  
  // 🎯 Phase 5: Save target mappings to ActionTemplate if templateId is available
  if (templateIdFromUrl) {
    saveTargetMappingToActionTemplate(fieldId, targetKey, comment);
  }
  
  // Update modified time to track changes
  updateModifiedTime();
}

/**
 * Handles configuration export from TargetConfigSection
 */
function handleConfigurationExported(config: any) {
  // Forward to parent component
  emit('configurationExported', config);
  
  // Show success notification
  $q.notify({
    type: 'positive',
    message: `Експортирана конфигурация за ${config.totalFields} полета`,
    position: 'top'
  });
}

// Expose for parent components
defineExpose({
  validateFlow,
  saveFlow,
  exportFlow,
  resetView,
  currentFlow: computed(() => currentFlow.value),
  flowValidationResult: computed(() => flowValidationResult.value),
});
</script>

<style>
/* Global scroll prevention for FlowEditor page */
html, body {
  overflow: hidden !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Page container scroll prevention */
#app, .q-page {
  overflow: hidden !important;
  height: 100vh !important;
}
</style>

<style scoped>
.flow-editor {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden; /* Prevent page-level scrolling */
}

.editor-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.container-mode-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.container-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  padding: 40px;
  background: #f8f9fa;
  
  h3 {
    margin: 0;
    color: #495057;
  }
  
  p {
    margin: 0;
    color: #6c757d;
  }
}

.block-selector-area {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
  background: white;
}

.canvas-area {
  flex: 1;
  position: relative;
  min-width: 0; /* Allows flex shrinking */
}

.control-panel-area {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid #e0e0e0;
  background: white;
  overflow: hidden; /* Ensure no overflow from this container */
  position: relative;
}

/* Old toolbar styles removed - moved to FlowCanvas */

.settings-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
  min-width: 350px;
}

.settings-group {
  margin-bottom: 16px;
}

.settings-group .q-toggle {
  margin-bottom: 8px;
}

/* 📊 Monitoring Mode Indicator */
.monitoring-mode-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
  font-size: 13px;
  font-weight: 600;
  user-select: none;
  animation: monitoringPulse 2s ease-in-out infinite;
}

@keyframes monitoringPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(156, 39, 176, 0.5);
  }
}

/* Container breadcrumb overlay */
.container-breadcrumb {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  border: 2px solid #1976d2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.breadcrumb-link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.breadcrumb-link:hover {
  color: #1565c0;
}

.breadcrumb-sep {
  color: #666;
  margin: 0 4px;
}

.breadcrumb-current {
  color: #333;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .block-selector-area {
    width: 260px;
  }
  
  .control-panel-area {
    width: 280px;
  }
  
  .breadcrumb-area {
    padding: 10px 12px;
  }
  
  .breadcrumb-nav {
    font-size: 13px;
  }
  
  /* Toolbar responsive styles moved to FlowCanvas */
}

@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
  }
  
  .block-selector-area {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    order: -1; /* Move to top on mobile */
  }
  
  .control-panel-area {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #e0e0e0;
  }
  
  .canvas-area {
    flex: 1;
    min-height: 400px;
  }
  
  /* Toolbar mobile styles moved to FlowCanvas */
}
</style>