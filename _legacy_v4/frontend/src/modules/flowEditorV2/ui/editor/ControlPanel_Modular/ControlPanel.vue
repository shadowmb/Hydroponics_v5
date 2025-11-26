<!--
/**
 * 📦 FlowEditor v3 - Clean Modular Control Panel (Phase 3.2)
 * ✅ Modular coordinator - integrates FlowSection, BlockInfoSection, ParametersSection
 * Clean version with only necessary coordinator code
 */
-->
<template>
  <div class="control-panel" :class="{ 'panel-collapsed': collapsed }">
    <!-- Panel Header -->
    <div class="panel-header">
      <q-btn
        flat
        dense
        :icon="collapsed ? 'chevron_left' : 'chevron_right'"
        @click="toggleCollapse"
        class="collapse-btn"
      />
      <span v-if="!collapsed" class="panel-title">
        {{ getPanelTitle() }}
      </span>
    </div>

    <!-- Panel Content -->
    <div v-if="!collapsed" class="panel-content">
      
      <!-- 🆕 MODULAR: Flow Section Component -->
      <FlowSection 
        :flow-validation-result="flowValidationResult"
        :show-flow-validation="showFlowValidation"
        :editor-settings="props.editorSettings"
      />

      <!-- 🆕 MODULAR: Block Info Section Component -->
      <BlockInfoSection
        v-if="selectedBlock"
        :selected-block="selectedBlock"
        :block-definition="blockDefinition"
        :show-advanced="showAdvanced"
        :readonly="props.readonly"
        @parameter-updated="handleParameterUpdated"
        @block-name-updated="handleBlockNameUpdated"
      />

      <!-- 🆕 MODULAR: Parameters Section Component -->
      <ParametersSection
        v-if="selectedBlock"
        :selected-block="selectedBlock"
        :block-definition="blockDefinition"
        :workspace-blocks="workspaceBlocks"
        :connections="connections"
        :show-advanced="showAdvanced"
        :readonly="props.readonly"
        @parameter-updated="handleParameterUpdated"
        @block-updated="handleBlockUpdated"
      />

      <!-- 🆕 MODULAR: Color Section Component -->
      <ColorSection
        v-if="selectedBlock"
        :selected-block="selectedBlock"
        :block-definition="blockDefinition"
        :readonly="props.readonly"
        @color-updated="handleColorUpdated"
      />

      <!-- 🆕 MODULAR: Ports Section Component -->
      <PortsSection
        v-if="selectedBlock"
        :selected-block="selectedBlock"
        :block-definition="blockDefinition"
      />

      <!-- 🆕 MODULAR: Validation Section Component -->
      <ValidationSection
        v-if="selectedBlock"
        :selected-block="selectedBlock"
      />

      <!-- 🆕 MODULAR: Actions Section Component -->
      <ActionsSection
        v-if="selectedBlock && !props.readonly"
        :selected-block="selectedBlock"
        :show-advanced="showAdvanced"
        @delete-block="deleteBlock"
        @duplicate-block="duplicateBlock"
        @toggle-advanced="toggleAdvanced"
      />

      <!-- 🎯 MODULAR: Target Configuration Section Component -->
      <!-- DEACTIVATED: Executor Mode System - Phase 2C -->
      <!-- <TargetConfigSection
        v-if="props.showTargetConfig && !selectedBlock"
        :workspace-blocks="workspaceBlocks"
        :block-definitions="blockDefinitions"
        @target-config-updated="handleTargetConfigUpdated"
        @configuration-exported="handleConfigurationExported"
      /> -->

      <!-- 🎯 Target Config Mode - Deselect Button (when block is selected) -->
      <!-- DEACTIVATED: Executor Mode System - Phase 2C -->
      <!-- <div v-if="props.showTargetConfig && selectedBlock" class="target-config-deselect"> -->
      <div v-if="false" class="target-config-deselect">
        <q-btn
          label="← Назад към Target Конфигурация"
          icon="target"
          color="purple"
          outline
          dense
          @click="deselectBlock"
          class="deselect-btn"
        />
      </div>

      <!-- No selection message -->
      <!-- DEACTIVATED: Executor Mode System - Phase 2C -->
      <!-- <div v-if="!selectedBlock && !props.showTargetConfig && (!showFlowValidation || !flowValidationResult)" class="no-selection"> -->
      <div v-if="!selectedBlock && (!showFlowValidation || !flowValidationResult)" class="no-selection">
        <q-icon name="info" size="md" color="grey-5" />
        <p class="text-grey-6">Кликни върху блок за да видиш неговите свойства</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 🆕 MODULAR: Import modular section components
import FlowSection from './sections/FlowSection.vue';
import BlockInfoSection from './sections/BlockInfoSection.vue';
import ParametersSection from './sections/ParametersSection.vue';
import ColorSection from './sections/ColorSection.vue';
import PortsSection from './sections/PortsSection.vue';
import ValidationSection from './sections/ValidationSection.vue';
import ActionsSection from './sections/ActionsSection.vue';
import TargetConfigSection from './sections/TargetConfigSection.vue';

// Rest of imports
import { computed, ref, watch } from 'vue';
import type { 
  BlockInstance, 
  BlockDefinition, 
  CompositePortType 
} from '../../../types/BlockConcept';
import type { FlowDefinition } from '../../../core/flow/FlowDefinition';
// ❌ Legacy import removed - using adapter now
// import { BlockFactory } from '../../../core/blocks/legacy-BlockFactory';
import { getBlockDefinition as getAdapterBlockDefinition, getBlockSchema as getAdapterBlockSchema } from '../../../ui/adapters/BlockFactoryAdapter';
import { BlockValidator } from '../../../core/blocks/BlockValidator';
import { FlowValidator, type FlowValidationResult } from '../../../core/flow/FlowValidator';
import { getPortTypeColor } from '../../../core/ports/PortManager';

// Props (same as original)
interface Props {
  selectedBlock?: BlockInstance;
  currentFlow?: FlowDefinition;
  showFlowValidation?: boolean;
  workspaceBlocks?: BlockInstance[];
  blockDefinitions?: BlockDefinition[];
  readonly?: boolean;
  // DEACTIVATED: Executor Mode System - Phase 2C
  // showTargetConfig?: boolean;
  editorSettings?: {
    showGrid: boolean;
    snapToGrid: boolean;
    showDebug: boolean;
    gridSize: number;
    isMonitoring: boolean;
    monitoringInterval: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  showFlowValidation: true,
  workspaceBlocks: () => [],
  blockDefinitions: () => [],
  readonly: false,
  // DEACTIVATED: Executor Mode System - Phase 2C
  // showTargetConfig: false,
});

// Events (same as original)  
const emit = defineEmits<{
  deleteBlock: [blockId: string];
  duplicateBlock: [blockId: string];
  deselectBlock: [];
  blockUpdated: [blockId: string];
  targetConfigUpdated: [fieldId: string, targetKey: string | null, comment?: string];
  configurationExported: [config: any];
}>();

// Local state
const collapsed = ref(false);
const showAdvanced = ref(false);

// Block custom name management
const blockCustomName = ref('');

// Watch selected block changes to update custom name
watch(
  () => props.selectedBlock,
  (newBlock) => {
    if (newBlock) {
      // Use custom name if exists, otherwise empty for placeholder
      blockCustomName.value = newBlock.parameters?.customName || '';
    } else {
      blockCustomName.value = '';
    }
  },
  { immediate: true }
);

// Color presets removed - now in ColorSection.vue

// Computed properties
const blockDefinition = computed((): BlockDefinition | undefined => {
  if (!props.selectedBlock) return undefined;
  return getAdapterBlockDefinition(props.selectedBlock.definitionId) || BlockFactory.getDefinition(props.selectedBlock.definitionId);
});

const blockSchema = computed(() => {
  if (!props.selectedBlock) return undefined;
  return getAdapterBlockSchema(props.selectedBlock.definitionId) || BlockFactory.getBlockSchema(props.selectedBlock.definitionId);
});

// validationResult computed moved to ValidationSection.vue

const flowValidationResult = computed(() => {
  if (!props.currentFlow) return undefined;
  return FlowValidator.validateFlow(props.currentFlow);
});

const connections = computed(() => {
  return props.currentFlow?.connections || [];
});

// Methods
function toggleCollapse() {
  collapsed.value = !collapsed.value;
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value;
}

function getBlockColor(): string {
  return blockDefinition.value?.color?.replace('#', '') || 'primary';
}

// Port methods moved to PortsSection.vue

// Action methods moved to ActionsSection.vue

function deleteBlock(blockId: string) {
  emit('deleteBlock', blockId);
}

function duplicateBlock(blockId: string) {
  emit('duplicateBlock', blockId);
}

// Color management methods moved to ColorSection.vue

/**
 * Updates the custom name of the selected block
 * @param newName - New custom name for the block
 */
function updateBlockName(newName: string) {
  if (!props.selectedBlock) return;
  
  // Update the block's parameters with custom name
  if (newName.trim()) {
    props.selectedBlock.parameters.customName = newName.trim();
  } else {
    // Remove custom name if empty (use default)
    delete props.selectedBlock.parameters.customName;
  }
  
  // Emit event to trigger reactivity in parent components
  emit('blockUpdated', props.selectedBlock.id);
}

/**
 * 🆕 MODULAR: Event handler for BlockInfoSection parameter updates
 * @param paramId - ID of the parameter
 * @param value - New parameter value
 */
function handleParameterUpdated(paramId: string, value: any) {
  // Forward to parent component
  emit('blockUpdated', props.selectedBlock?.id || '');
}

/**
 * 🆕 MODULAR: Event handler for BlockInfoSection block name updates
 * @param newName - New block name
 */
function handleBlockNameUpdated(newName: string) {
  updateBlockName(newName);
}

/**
 * 🆕 MODULAR: Event handler for ParametersSection block updates
 * @param blockId - ID of the updated block
 */
function handleBlockUpdated(blockId: string) {
  // Force reactivity update
  emit('blockUpdated', blockId);
}

/**
 * 🆕 MODULAR: Event handler for ColorSection color updates
 * @param blockId - ID of the updated block
 */
function handleColorUpdated(blockId: string) {
  // Force reactivity update
  emit('blockUpdated', blockId);
}

/**
 * 🎯 MODULAR: Event handler for TargetConfigSection target updates
 * @param fieldId - Field identifier
 * @param targetKey - Target key or null to clear
 * @param comment - Optional comment
 */
function handleTargetConfigUpdated(fieldId: string, targetKey: string | null, comment?: string) {
  emit('targetConfigUpdated', fieldId, targetKey, comment);
}

/**
 * 🎯 MODULAR: Event handler for TargetConfigSection configuration export
 * @param config - Configuration data
 */
function handleConfigurationExported(config: any) {
  emit('configurationExported', config);
}

/**
 * Gets appropriate panel title based on current state
 */
function getPanelTitle(): string {
  // DEACTIVATED: Executor Mode System - Phase 2C
  // if (props.showTargetConfig && !props.selectedBlock) {
  //   return '🎯 Target Конфигурация';
  // }
  if (props.selectedBlock) {
    return 'Контрол Панел';
  }
  // DEACTIVATED: Executor Mode System - Phase 2C
  // if (props.showTargetConfig) {
  //   return 'Избери блок (Target Config Mode)';
  // }
  return 'Избери блок';
}

/**
 * 🎯 Deselects current block to return to Target Configuration
 */
function deselectBlock() {
  emit('deselectBlock');
}
</script>

<style scoped>
/* Original ControlPanel.vue styles - clean version */
.control-panel {
  width: 320px;
  height: 100%;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.panel-collapsed {
  width: 48px;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5f5f5;
}

.collapse-btn {
  min-width: auto;
  padding: 4px;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.panel-content {
  flex: 1;
  padding: 16px 16px 80px 16px; /* Add bottom padding for scrollable content */
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 60px); /* Ensure it doesn't exceed viewport */
}

/* No selection state */
.no-selection {
  text-align: center;
  padding: 40px 20px;
  margin: 16px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.no-selection p {
  margin-top: 16px;
  font-size: 14px;
}

/* All sections now modularized - no remaining sections */

/* Info sections */
.info-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Validation styles moved to ValidationSection.vue */

/* Port styles moved to PortsSection.vue */

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

/* Actions styles moved to ActionsSection.vue */

/* Target Config Deselect Button */
.target-config-deselect {
  margin: 16px 0;
  padding: 12px;
  border: 1px solid #9C27B0;
  border-radius: 6px;
  background: rgba(156, 39, 176, 0.05);
  text-align: center;
}

.deselect-btn {
  width: 100%;
  text-transform: none;
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

/* Color Section styles moved to ColorSection.vue */

/* Responsive */
@media (max-width: 768px) {
  .control-panel {
    width: 280px;
  }
  
  .panel-collapsed {
    width: 40px;
  }
  
  /* Color responsive styles moved to ColorSection.vue */
}
</style>