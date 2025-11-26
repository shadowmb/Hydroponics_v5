<!--
/**
 * 🚨 ErrorHandler Block Parameters Component
 * ✅ Dedicated component for ErrorHandler block parameter rendering
 * Specialized for error handling, recovery strategies, and system resilience
 * Modular approach for better maintainability
 */
-->
<template>
  <!-- ErrorHandler Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="error_outline"
    label="ErrorHandler Параметри"
    header-class="expansion-header"
    class="expansion-section errorhandler-parameters"
  >
    <div class="expansion-content">
      
      <!-- 💬 Block Comment Field -->
      
      <!-- 🔁 Поведение при грешка -->
      <div class="config-section error-behavior">
        <div class="section-header">
          <q-icon name="refresh" size="sm" color="red" />
          <span class="section-title">Поведение при грешка</span>
        </div>
        
        <div class="section-content">
          <!-- Основна стратегия -->
          <div class="config-field">
            <q-select
              :model-value="selectedBlock?.parameters['fallbackStrategy']"
              :options="getFallbackStrategyOptions()"
              label="При грешка в блока направи"
              outlined
              dense
              emit-value
              map-options
              class="fallback-strategy-select"
              @update:model-value="(value) => updateParameterValue('fallbackStrategy', value)"
            >
              <template v-slot:prepend>
                <q-icon name="settings_backup_restore" size="xs" color="red" />
              </template>
            </q-select>
          </div>

          <!-- Enable Retry Toggle -->
          <div class="config-field">
            <q-toggle
              :model-value="selectedBlock?.parameters['enableRetry']"
              label="Пробвай отново преди да се приложи стратегията"
              class="retry-toggle"
              @update:model-value="(value) => updateParameterValue('enableRetry', value)"
            >
              <template v-slot:default>
                <div class="toggle-content">
                  <q-icon name="repeat" size="xs" color="orange" class="toggle-icon" />
                  <span>Пробвай отново преди да се приложи стратегията</span>
                </div>
              </template>
            </q-toggle>
          </div>

          <!-- Retry Settings (само ако е enable retry) -->
          <div v-if="selectedBlock?.parameters['enableRetry']" class="retry-settings">
            <!-- Брой опити -->
            <div class="config-field">
              <q-input
                :model-value="selectedBlock?.parameters['maxRetries']"
                label="Брой повторни опити"
                type="number"
                outlined
                dense
                class="max-retries-input"
                @update:model-value="(value) => updateParameterValue('maxRetries', parseFloat(String(value)) || 3)"
              >
                <template v-slot:prepend>
                  <q-icon name="repeat" size="xs" color="orange" />
                </template>
              </q-input>
            </div>

            <!-- Delay между опитите -->
            <div class="config-field">
              <q-input
                :model-value="selectedBlock?.parameters['retryDelay']"
                label="Изчакване между опитите (сек)"
                type="number"
                outlined
                dense
                class="retry-delay-input"
                @update:model-value="(value) => updateParameterValue('retryDelay', parseFloat(String(value)) || 5)"
              >
                <template v-slot:prepend>
                  <q-icon name="timer" size="xs" color="amber" />
                </template>
              </q-input>
            </div>
          </div>

          <!-- Pause Timeout (само при pause стратегия) -->
          <div v-if="selectedBlock?.parameters['fallbackStrategy'] === 'pause'" class="config-field">
            <q-input
              :model-value="selectedBlock?.parameters['pauseTimeout']"
              label="Време за пауза (сек)"
              type="number"
              outlined
              dense
              class="pause-timeout-input"
              @update:model-value="(value) => updateParameterValue('pauseTimeout', parseFloat(String(value)) || 600)"
            >
              <template v-slot:prepend>
                <q-icon name="pause_circle_outline" size="xs" color="blue" />
              </template>
              <template v-slot:hint>
                След това време програмата ще се спре автоматично
              </template>
            </q-input>
          </div>
        </div>
      </div>

      <!-- 📢 Известяване -->
      <div class="config-section notification">
        <div class="section-header">
          <q-icon name="notifications" size="sm" color="blue" />
          <span class="section-title">Известяване</span>
          <q-icon name="help_outline" size="xs" color="grey" class="help-icon">
            <q-tooltip>По избор - за уведомяване на потребителя</q-tooltip>
          </q-icon>
        </div>
        
        <div class="section-content">
          <!-- Enable Notification Toggle -->
          <div class="config-field">
            <q-toggle
              :model-value="selectedBlock?.parameters['enableNotification']"
              label="Прати уведомление при грешка"
              class="notify-toggle"
              @update:model-value="(value) => updateParameterValue('enableNotification', value)"
            >
              <template v-slot:default>
                <div class="toggle-content">
                  <q-icon name="notifications" size="xs" color="blue" class="toggle-icon" />
                  <span>Прати уведомление при грешка</span>
                </div>
              </template>
            </q-toggle>
          </div>

          <!-- Notification Settings (само ако е enable notification) -->
          <div v-if="selectedBlock?.parameters['enableNotification']" class="notification-settings">
            <!-- Include Context Data Toggle -->
            <div class="config-field">
              <q-toggle
                :model-value="selectedBlock?.parameters['includeContextData']"
                label="Включи данни от блока"
                class="context-toggle"
                @update:model-value="(value) => updateParameterValue('includeContextData', value)"
              >
                <template v-slot:default>
                  <div class="toggle-content">
                    <q-icon name="info" size="xs" color="orange" class="toggle-icon" />
                    <span>Включи данни от блока</span>
                  </div>
                </template>
              </q-toggle>
              <div class="hint-text">
                Device ID, sensor стойности или actuator статус
              </div>
            </div>

            <!-- Съобщение към потребителя -->
            <div class="config-field">
              <q-input
                :model-value="selectedBlock?.parameters['userMessage']"
                label="Съобщение към потребителя"
                placeholder="Съобщение което да се покаже при грешка (по избор)"
                outlined
                dense
                maxlength="200"
                class="user-message-input"
                @update:model-value="(value) => updateParameterValue('userMessage', String(value))"
              >
                <template v-slot:prepend>
                  <q-icon name="message" size="xs" color="green" />
                </template>
                <template v-slot:hint>
                  {{ selectedBlock?.parameters['userMessage']?.length || 0 }}/200 символа
                </template>
              </q-input>
            </div>
          </div>
        </div>
      </div>
      <div class="block-comment-field">
        <q-input
          :model-value="selectedBlock?.parameters['comment'] || ''"
          label="💬 Коментар за блока"
          outlined
          dense
          maxlength="200"
          counter
          type="textarea"
          :readonly="props.readonly"
          class="comment-input"
          @update:model-value="(value) => updateParameterValue('comment', value)"
        >
          <template v-slot:prepend>
            <q-icon name="comment" size="xs" color="blue-grey" />
          </template>
          <template v-slot:hint>
            Описание на блока (до 200 символа)
          </template>
        </q-input>
      </div>
      
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { 
  BlockInstance, 
  BlockDefinition, 
  BlockParameter,
  BlockConnection
} from '../../../../../types/BlockConcept';

// Props
interface Props {
  selectedBlock: BlockInstance;
  blockDefinition: BlockDefinition;
  workspaceBlocks?: BlockInstance[];
  connections?: BlockConnection[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  workspaceBlocks: () => [],
  connections: () => [],
  readonly: false
});

// Events
const emit = defineEmits<{
  parameterUpdated: [paramId: string, value: any];
  blockUpdated: [blockId: string];
}>();

// 🔧 Parameter Management Functions

/**
 * Updates a parameter value for the selected block
 */
function updateParameterValue(paramId: string, value: any) {
  if (!props.selectedBlock) return;
  
  console.log(`[ErrorHandlerParameters] Updating parameter: ${paramId} = ${value}`);
  
  // Special validation for error handler parameters
  if (paramId === 'maxRetries' && (value < 1 || value > 10)) {
    const clampedValue = Math.max(1, Math.min(10, value));
    console.warn(`[ErrorHandlerParameters] MaxRetries out of range: ${value}, clamped to ${clampedValue}`);
    value = clampedValue;
  }
  
  if (paramId === 'retryDelay' && (value < 0.1 || value > 300)) {
    const clampedValue = Math.max(0.1, Math.min(300, value));
    console.warn(`[ErrorHandlerParameters] RetryDelay out of range: ${value}, clamped to ${clampedValue}`);
    value = clampedValue;
  }
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Emit events to trigger reactivity in parent components
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

// 🎨 UI Helper Functions

/**
 * Checks if a parameter is critical for error handling
 */
function isCriticalParameter(paramId: string): boolean {
  const criticalParams = ['errorStrategy', 'maxRetries', 'criticalErrors'];
  return criticalParams.includes(paramId);
}

/**
 * Gets the current error strategy type for styling
 */
function getStrategyType(): string {
  const strategy = props.selectedBlock?.parameters?.errorStrategy || 'log_continue';
  if (strategy.includes('stop') || strategy.includes('ignore')) return 'dangerous';
  if (strategy.includes('retry') || strategy.includes('redirect')) return 'recovery';
  return 'safe';
}

/**
 * Gets strategy status icon
 */
function getStrategyIcon(): string {
  const strategy = props.selectedBlock?.parameters?.errorStrategy || 'log_continue';
  switch (strategy) {
    case 'log_continue': return 'play_arrow';
    case 'log_stop': return 'stop';
    case 'retry': return 'refresh';
    case 'redirect': return 'call_split';
    case 'ignore': return 'visibility_off';
    default: return 'help';
  }
}

/**
 * Gets strategy status color
 */
function getStrategyColor(): string {
  const type = getStrategyType();
  switch (type) {
    case 'dangerous': return 'negative';
    case 'recovery': return 'warning';
    case 'safe': return 'positive';
    default: return 'info';
  }
}

/**
 * Gets strategy description text
 */
function getStrategyDescription(): string {
  const strategy = props.selectedBlock?.parameters?.errorStrategy || 'log_continue';
  switch (strategy) {
    case 'log_continue': return 'Безопасна стратегия - продължава изпълнението';
    case 'log_stop': return 'Консервативна стратегия - спира при грешка';
    case 'retry': return 'Recovery стратегия - повторни опити';
    case 'redirect': return 'Flexible стратегия - пренасочване';
    case 'ignore': return 'Рискована стратегия - игнорира грешки';
    default: return 'Неизвестна стратегия';
  }
}

/**
 * Gets fallback strategy options from block definition
 */
function getFallbackStrategyOptions(): Array<{label: string, value: string}> {
  const param = props.blockDefinition?.parameters?.find(p => p.id === 'fallbackStrategy');
  return param?.options || [
    { label: 'Продължи със следващия блок', value: 'continue' },
    { label: 'Спри програмата', value: 'stop' },
    { label: 'Постави програмата на пауза', value: 'pause' }
  ];
}

/**
 * Formats parameter value for display
 */
function formatParameterValue(param: BlockParameter): string {
  const value = props.selectedBlock?.parameters[param.id];
  
  if (value === undefined || value === null) {
    return param.required ? '[Required]' : param.defaultValue || '—';
  }
  
  if (param.type === 'select') {
    if (param.options) {
      const option = param.options.find(opt => opt.value === value);
      return option?.label || String(value);
    }
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Включено' : 'Изключено';
  }
  
  if (typeof value === 'number') {
    // Special formatting for error handler values
    if (param.id === 'maxRetries') {
      return `${value} ${value === 1 ? 'опит' : 'опита'}`;
    }
    if (param.id === 'retryDelay') {
      return `${value}сек`;
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  
  // Special formatting for criticalErrors
  if (param.id === 'criticalErrors' && typeof value === 'string') {
    const errors = value.split(',').map(e => e.trim()).filter(e => e);
    return errors.length > 0 ? `${errors.length} критични грешки` : 'Няма критични грешки';
  }
  
  return String(value);
}
</script>

<style scoped>
/* ErrorHandler Parameters Specific Styles - ЧЕРВЕН КАНТ */

.errorhandler-parameters {
  border: 2px solid #F44336;
  border-radius: 8px;
  margin-bottom: 16px;
}

.errorhandler-parameters .expansion-header {
  background: rgba(244, 67, 54, 0.1);
  color: #C62828;
  font-weight: 600;
}

/* Config Sections */
.config-section {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.error-behavior {
  border: 1px solid #F44336;
  background: rgba(244, 67, 54, 0.02);
}

.critical-states {
  border: 1px solid #FF5722;
  background: rgba(255, 87, 34, 0.02);
}

.notification {
  border: 1px solid #2196F3;
  background: rgba(33, 150, 243, 0.02);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
}

.error-behavior .section-header {
  background: rgba(244, 67, 54, 0.1);
  color: #C62828;
}

.critical-states .section-header {
  background: rgba(255, 87, 34, 0.1);
  color: #E64A19;
}

.notification .section-header {
  background: rgba(33, 150, 243, 0.1);
  color: #1976D2;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
}

.help-icon {
  margin-left: auto;
  cursor: help;
}

.section-content {
  padding: 16px;
}

.config-field {
  margin-bottom: 12px;
}

.config-field:last-child {
  margin-bottom: 0;
}

/* Error Handling Status Display */
.error-status-display {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #F44336;
  background: rgba(244, 67, 54, 0.05);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-text {
  font-size: 13px;
  font-weight: 500;
  color: #C62828;
}

.error-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}

.info-text {
  font-size: 11px;
  color: #D32F2F;
  font-weight: 500;
}

/* Strategy Status Indicator */
.strategy-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.strategy-status.strategy-safe {
  background: rgba(76, 175, 80, 0.1);
  color: #388E3C;
}

.strategy-status.strategy-recovery {
  background: rgba(255, 193, 7, 0.1);
  color: #F57C00;
}

.strategy-status.strategy-dangerous {
  background: rgba(244, 67, 54, 0.1);
  color: #D32F2F;
}

/* Parameters List */
.parameters-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.parameter-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px;
}

.parameter-item.param-required {
  border-left-color: #f44336;
  border-left-width: 3px;
}

.parameter-item.param-critical {
  border: 1px solid #FF5722;
  background: rgba(255, 87, 34, 0.02);
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.param-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.param-type {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.param-input {
  margin-top: 8px;
}

/* Special ErrorHandler Input Styling */
.error-strategy-select {
  border-left: 3px solid #F44336;
}

.retries-input {
  border-left: 3px solid #FF9800;
}

.delay-input {
  border-left: 3px solid #FFC107;
}

.log-level-select {
  border-left: 3px solid #2196F3;
}

.message-input {
  border-left: 3px solid #9C27B0;
}

.critical-errors-input {
  border-left: 3px solid #FF5722;
}

.critical-errors-select {
  border-left: 3px solid #FF5722;
}

.recovery-actions-select {
  border-left: 3px solid #009688;
}

.max-retries-input {
  border-left: 3px solid #FF9800;
}

.retry-delay-input {
  border-left: 3px solid #FFC107;
}

.fallback-strategy-select {
  border-left: 3px solid #F44336;
}

.retry-toggle {
  padding: 8px 0;
}

.toggle-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-settings {
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid #FF9800;
  background: rgba(255, 152, 0, 0.05);
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
}

.pause-timeout-input {
  border-left: 3px solid #2196F3;
}

.user-message-input {
  border-left: 3px solid #4CAF50;
}

.notify-toggle, .errorhandler-toggle, .context-toggle {
  padding: 8px 0;
}

.notification-settings {
  margin-left: 16px;
  padding-left: 16px;
  border-left: 2px solid #2196F3;
  background: rgba(33, 150, 243, 0.05);
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
}

.hint-text {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  margin-left: 32px;
}

/* Common indicators */
.required-indicator {
  color: #f44336;
  font-weight: 700;
  margin-left: 2px;
}

.critical-indicator {
  margin-left: 4px;
  font-size: 12px;
}

.param-value-display {
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-top: 4px;
}

.param-type-hint {
  color: #999;
  font-style: italic;
  margin-left: 8px;
}

/* Expansion section common */
.expansion-section {
  margin-bottom: 16px;
}

.expansion-content {
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

/* Block Comment Field */
.block-comment-field {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #607D8B;
  border-radius: 6px;
  background: rgba(96, 125, 139, 0.05);
}

.comment-input {
  border-left: 3px solid #607D8B;
}

/* Responsive */
@media (max-width: 768px) {
  .error-status-display {
    padding: 8px;
    margin-bottom: 12px;
  }
  
  .status-text {
    font-size: 12px;
  }
  
  .info-text {
    font-size: 10px;
  }
  
  .expansion-content {
    padding: 12px;
  }
  
  .block-comment-field {
    padding: 8px;
    margin-bottom: 12px;
  }
}
</style>