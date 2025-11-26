<!--
/**
 * 📦 ValidationSection - Block Validation Status
 * ✅ Modular component extracted from ControlPanel.vue
 * Displays validation errors, warnings, and success status for blocks
 */
-->
<template>
  <!-- Validation Status -->
  <div v-if="validationResult" class="validation-status">
    <div class="info-section-header">
      <q-icon 
        :name="validationResult.isValid ? 'check_circle' : 'error'"
        :color="validationResult.isValid ? 'positive' : 'negative'" 
        size="xs"
      />
      Състояние на валидация
    </div>
    
    <!-- Errors -->
    <div v-if="validationResult.errors.length > 0" class="validation-errors">
      <div 
        v-for="error in validationResult.errors.slice(0, 3)"
        :key="error.message"
        class="validation-item error"
      >
        <q-icon name="error" size="xs" />
        <span>{{ error.message }}</span>
      </div>
      <div v-if="validationResult.errors.length > 3" class="more-items">
        +{{ validationResult.errors.length - 3 }} още грешки
      </div>
    </div>
    
    <!-- Warnings -->
    <div v-if="validationResult.warnings.length > 0" class="validation-warnings">
      <div 
        v-for="warning in validationResult.warnings.slice(0, 2)"
        :key="warning.message"
        class="validation-item warning"
      >
        <q-icon name="warning" size="xs" />
        <span>{{ warning.message }}</span>
      </div>
      <div v-if="validationResult.warnings.length > 2" class="more-items">
        +{{ validationResult.warnings.length - 2 }} още предупреждения
      </div>
    </div>

    <!-- Success -->
    <div v-if="validationResult.isValid && validationResult.warnings.length === 0" class="validation-success">
      <q-icon name="check_circle" size="xs" />
      <span>Блокът е валиден</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
// 🔍 CRITICAL: Correct import paths for ControlPanel_Modular location
import type { BlockInstance } from '../../../../types/BlockConcept';
import { validateBlock } from '../../../../validation/BlockValidator';

// Props
interface Props {
  selectedBlock?: BlockInstance;
}

const props = defineProps<Props>();

// Get validation context from parent (inject must be at top level)
const connections = inject('currentConnections', ref([]));
const allBlocks = inject('currentBlocks', ref([]));

// Real validation using new BlockValidator system
const validationResult = computed(() => {
  if (!props.selectedBlock) return undefined;

  try {
    // Perform real validation
    const result = validateBlock(
      props.selectedBlock,
      connections.value,
      allBlocks.value
    );

    console.log('📋 [ValidationSection] Validation result:', {
      blockId: props.selectedBlock.id,
      blockType: props.selectedBlock.definitionId,
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      errors: result.errors,
      warnings: result.warnings
    });

    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      status: result.status,
      summary: result.summary
    };
  } catch (error) {
    console.error('❌ [ValidationSection] Validation error:', error);
    // Fallback validation
    return {
      isValid: true,
      errors: [],
      warnings: [],
      status: 'valid' as const,
      summary: {
        totalIssues: 0,
        criticalErrors: 0,
        regularErrors: 0,
        warnings: 0
      }
    };
  }
});
</script>

<style scoped>
/* Validation Styles - Extracted from ControlPanel.vue */

.validation-status {
  border-left: 3px solid #e0e0e0;
  padding-left: 12px;
  margin-bottom: 16px;
}

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

.validation-errors {
  margin-bottom: 8px;
}

.validation-warnings {
  margin-bottom: 8px;
}

.validation-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 4px;
  line-height: 1.3;
}

.validation-item.error {
  color: #f44336;
}

.validation-item.warning {
  color: #ff9800;
}

.validation-success {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4caf50;
  font-weight: 500;
}

.more-items {
  font-size: 11px;
  color: #999;
  font-style: italic;
  margin-top: 4px;
}
</style>