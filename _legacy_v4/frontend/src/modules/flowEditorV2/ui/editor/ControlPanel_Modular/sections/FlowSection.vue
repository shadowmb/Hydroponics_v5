<!--
/**
 * 📦 FlowSection - Flow Properties & Validation
 * ✅ Modular component extracted from ControlPanel.vue
 * Displays flow validation status, stats, errors and warnings
 */
-->
<template>
  <!-- Flow Properties Section -->
  <q-expansion-item
    :default-opened="false"
    v-if="showFlowValidation && flowValidationResult"
    default-opened
    icon="account_tree"
    label="Свойства на потока"
    header-class="expansion-header"
    class="expansion-section"
  >
    <div class="expansion-content">
      <!-- Flow Validation Status -->
      <div class="flow-validation-status">
        <div class="info-section-header">
          <q-icon 
            :name="flowValidationResult.isValid ? 'verified' : 'error'"
            :color="flowValidationResult.isValid ? 'positive' : 'negative'" 
            size="xs"
          />
          Състояние на Flow
        </div>
        
        <!-- Flow Summary -->
        <div class="flow-summary">
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">Блокове:</span>
              <span class="stat-value">{{ flowValidationResult.summary.validBlocks }}/{{ flowValidationResult.summary.totalBlocks }}</span>
              <q-icon 
                v-if="flowValidationResult.summary.invalidBlocks > 0"
                name="warning" 
                color="negative" 
                size="xs" 
              />
            </div>
            <div class="stat-item">
              <span class="stat-label">Връзки:</span>
              <span class="stat-value">{{ flowValidationResult.summary.validConnections }}/{{ flowValidationResult.summary.totalConnections }}</span>
              <q-icon 
                v-if="flowValidationResult.summary.invalidConnections > 0"
                name="warning" 
                color="negative" 
                size="xs" 
              />
            </div>
            <div class="stat-item">
              <span class="stat-label">Стартов блок:</span>
              <q-icon 
                :name="flowValidationResult.summary.hasStartBlock ? 'check' : 'close'"
                :color="flowValidationResult.summary.hasStartBlock ? 'positive' : 'negative'" 
                size="xs" 
              />
            </div>
            <div class="stat-item">
              <span class="stat-label">Крайни точки:</span>
              <q-icon 
                :name="flowValidationResult.summary.hasEndPoints ? 'check' : 'close'"
                :color="flowValidationResult.summary.hasEndPoints ? 'positive' : 'warning'" 
                size="xs" 
              />
            </div>
          </div>
        </div>
        
        <!-- Flow Errors -->
        <div v-if="flowValidationResult.errors.length > 0" class="flow-validation-errors">
          <div class="flow-errors-header">
            <q-icon name="error" size="xs" />
            Грешки във Flow ({{ flowValidationResult.errors.length }})
          </div>
          <div 
            v-for="error in flowValidationResult.errors.slice(0, 3)"
            :key="error.code"
            class="validation-item error"
          >
            <q-icon name="error" size="xs" />
            <span>{{ error.message }}</span>
          </div>
          <div v-if="flowValidationResult.errors.length > 3" class="more-items">
            +{{ flowValidationResult.errors.length - 3 }} още грешки
          </div>
        </div>
        
        <!-- Flow Warnings -->
        <div v-if="flowValidationResult.warnings.length > 0" class="flow-validation-warnings">
          <div class="flow-warnings-header">
            <q-icon name="warning" size="xs" />
            Предупреждения във Flow ({{ flowValidationResult.warnings.length }})
          </div>
          <div 
            v-for="warning in flowValidationResult.warnings.slice(0, 2)"
            :key="warning.code"
            class="validation-item warning"
          >
            <q-icon name="warning" size="xs" />
            <span>{{ warning.message }}</span>
          </div>
          <div v-if="flowValidationResult.warnings.length > 2" class="more-items">
            +{{ flowValidationResult.warnings.length - 2 }} още предупреждения
          </div>
        </div>

        <!-- Flow Success -->
        <div v-if="flowValidationResult.isValid && flowValidationResult.warnings.length === 0" class="flow-validation-success">
          <q-icon name="check_circle" size="xs" />
          <span>Flow-то е валидно и готово за изпълнение</span>
        </div>
      </div>
    </div>
  </q-expansion-item>
  
  <!-- 📊 Monitoring Mode Section -->
  <q-expansion-item
    v-if="editorSettings?.isMonitoring"
    :default-opened="true"
    icon="analytics"
    label="Мониторинг настройки"
    header-class="expansion-header monitoring-header"
    class="expansion-section monitoring-section"
  >
    <div class="expansion-content">
      <div class="monitoring-info">
        <div class="info-section-header">
          <q-icon name="analytics" color="secondary" size="xs" />
          Мониторинг режим активен
        </div>
        
        <div class="monitoring-details">
          <div class="monitoring-item">
            <q-icon name="schedule" size="xs" color="secondary" />
            <span class="monitoring-label">Интервал:</span>
            <span class="monitoring-value">{{ editorSettings.monitoringInterval }} минути</span>
          </div>
          
          <div class="monitoring-item">
            <q-icon name="sensors" size="xs" color="secondary" />
            <span class="monitoring-label">Тип:</span>
            <span class="monitoring-value">Автоматично събиране на данни</span>
          </div>
          
          <div class="monitoring-item">
            <q-icon name="storage" size="xs" color="secondary" />
            <span class="monitoring-label">Съхранение:</span>
            <span class="monitoring-value">90 дни (автоматично изтриване)</span>
          </div>
        </div>
        
        <div class="monitoring-notice">
          <q-icon name="info" size="xs" color="info" />
          <span>Този flow ще се изпълнява автоматично от SchedulerService на всеки {{ editorSettings.monitoringInterval }} минути</span>
        </div>
      </div>
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import type { FlowValidationResult } from '../../../core/flow/FlowValidator';

// Props
interface Props {
  flowValidationResult?: FlowValidationResult;
  showFlowValidation?: boolean;
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
  showFlowValidation: true
});
</script>

<style scoped>
/* Flow Validation Styles - Extracted from ControlPanel.vue */

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

.flow-validation-status {
  border-left: 3px solid #e0e0e0;
  padding-left: 12px;
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

.flow-summary {
  margin-bottom: 12px;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  gap: 8px;
}

.stat-label {
  color: #666;
  flex: 1;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.flow-errors-header,
.flow-warnings-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.flow-validation-errors {
  margin-bottom: 12px;
}

.flow-validation-warnings {
  margin-bottom: 12px;
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

.flow-validation-success {
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

/* 📊 Monitoring Mode Styles */
.monitoring-section {
  border: 2px solid #9c27b0;
  border-radius: 8px;
}

.monitoring-section .monitoring-header {
  background: rgba(156, 39, 176, 0.1);
  color: #7b1fa2;
  font-weight: 600;
}

.monitoring-info {
  border-left: 3px solid #9c27b0;
  padding-left: 12px;
}

.monitoring-details {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.monitoring-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.monitoring-label {
  color: #666;
  font-weight: 500;
  min-width: 70px;
}

.monitoring-value {
  color: #7b1fa2;
  font-weight: 600;
}

.monitoring-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: #1976d2;
  background: rgba(33, 150, 243, 0.05);
  padding: 8px;
  border-radius: 4px;
  margin-top: 12px;
  line-height: 1.4;
}
</style>