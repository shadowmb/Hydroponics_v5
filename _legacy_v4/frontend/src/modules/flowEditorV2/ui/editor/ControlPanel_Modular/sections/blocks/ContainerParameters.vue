<!--
/**
 * 📦 Container Block Parameters Component
 * ✅ Dedicated component for Container block parameter rendering
 * Specialized for block organization, visual grouping, and container styling
 * Modular approach for better maintainability
 */
-->
<template>
  <!-- Container Block Parameters Section -->
  <q-expansion-item
    default-opened
    icon="folder"
    label="Container Параметри"
    header-class="expansion-header"
    class="expansion-section container-parameters"
  >
    <div class="expansion-content">
      
      <!-- 💬 Block Comment Field -->
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
      
      <!-- 📦 Container Status Display -->
      <div class="container-status-display">
        <div class="status-indicator">
          <q-icon name="folder" color="blue-grey-7" size="sm" />
          <span class="status-text">
            Container блок - групира свързани блокове за по-добра организация
          </span>
        </div>
        <div class="container-info">
          <q-icon name="widgets" size="xs" color="blue-grey-6" />
          <span class="info-text">
            Visual Grouping | Collapsible | Custom Styling | Organization Tool
          </span>
        </div>
        <!-- Container Style Status -->
        <div class="container-style-status" :class="[`style-${getContainerStyleType()}`]">
          <q-icon 
            :name="getContainerStyleIcon()" 
            :color="getContainerStyleColor()" 
            size="xs" 
          />
          <span class="style-text">{{ getContainerStyleDescription() }}</span>
        </div>
      </div>
      
      <!-- Parameters List -->
      <div class="parameters-list">
        <div 
          v-for="param in blockDefinition.parameters"
          :key="param.id"
          class="parameter-item"
          :class="{ 'param-required': param.required, 'param-visual': isVisualParameter(param.id) }"
        >
          <div class="param-header">
            <span class="param-name">
              {{ param.label }}
              <span v-if="param.required" class="required-indicator">*</span>
              <span v-if="isVisualParameter(param.id)" class="visual-indicator">🎨</span>
            </span>
            <span class="param-type">{{ param.type }}</span>
          </div>
          
          <div class="param-input">
            
            <!-- 📝 Container Title Input (REQUIRED) -->
            <q-input
              v-if="param.id === 'containerTitle'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              outlined
              dense
              maxlength="100"
              counter
              class="param-input-field container-title-input"
              @update:model-value="(value) => updateParameterValue(param.id, String(value))"
            >
              <template v-slot:prepend>
                <q-icon name="title" size="xs" color="blue-grey-7" />
              </template>
              <template v-slot:hint>
                Заглавие на контейнера ({{ param.validation?.min || 1 }}-{{ param.validation?.max || 100 }} символа)
              </template>
            </q-input>
            
            <!-- 📄 Container Description Input -->
            <q-input
              v-else-if="param.id === 'containerDescription'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="textarea"
              outlined
              dense
              maxlength="500"
              counter
              rows="2"
              class="param-input-field container-description-input"
              @update:model-value="(value) => updateParameterValue(param.id, String(value))"
            >
              <template v-slot:prepend>
                <q-icon name="description" size="xs" color="blue-grey-6" />
              </template>
              <template v-slot:hint>
                Описание на функцията на контейнера (макс. {{ param.validation?.max || 500 }} символа)
              </template>
            </q-input>
            
            <!-- 🔄 Collapsible Toggle -->
            <q-toggle
              v-else-if="param.id === 'collapsible'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              class="param-toggle collapsible-toggle"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:default>
                <q-icon 
                  :name="selectedBlock?.parameters[param.id] ? 'unfold_more' : 'unfold_less'" 
                  :color="selectedBlock?.parameters[param.id] ? 'positive' : 'negative'"
                  size="xs" 
                />
              </template>
            </q-toggle>
            
            <!-- 📊 Start Collapsed Toggle -->
            <q-toggle
              v-else-if="param.id === 'startCollapsed'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              :disable="!selectedBlock?.parameters?.collapsible"
              class="param-toggle start-collapsed-toggle"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:default>
                <q-icon 
                  :name="selectedBlock?.parameters[param.id] ? 'expand_less' : 'expand_more'" 
                  :color="selectedBlock?.parameters[param.id] ? 'warning' : 'info'"
                  size="xs" 
                />
              </template>
            </q-toggle>
            
            <!-- 🎨 Container Color Selection -->
            <q-select
              v-else-if="param.id === 'containerColor'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select container-color-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="palette" size="xs" color="blue-grey-7" />
              </template>
              <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps" @click="toggleOption(opt)">
                  <q-item-section avatar>
                    <q-icon :name="getColorIcon(opt.value)" :color="getColorValue(opt.value)" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon v-if="selected" name="check" color="positive" />
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:hint>
                Цветова схема за визуално разграничаване
              </template>
            </q-select>
            
            <!-- 🖼️ Border Style Selection -->
            <q-select
              v-else-if="param.id === 'borderStyle'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select border-style-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="border_style" size="xs" color="blue-grey-6" />
              </template>
              <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-bind="itemProps" @click="toggleOption(opt)">
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                    <q-item-label caption>{{ getBorderStylePreview(opt.value) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon v-if="selected" name="check" color="positive" />
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:hint>
                Стил на рамката около контейнера
              </template>
            </q-select>
            
            <!-- 📏 Min Width Input -->
            <q-input
              v-else-if="param.id === 'minWidth'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="number"
              :min="param.validation?.min || 100"
              :max="param.validation?.max || 2000"
              outlined
              dense
              suffix="px"
              class="param-input-field min-width-input"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(String(value)) || 200)"
            >
              <template v-slot:prepend>
                <q-icon name="width" size="xs" color="blue-grey-6" />
              </template>
              <template v-slot:hint>
                Минимална ширина ({{ param.validation?.min || 100 }}-{{ param.validation?.max || 2000 }}px)
              </template>
            </q-input>
            
            <!-- 📐 Min Height Input -->
            <q-input
              v-else-if="param.id === 'minHeight'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="number"
              :min="param.validation?.min || 100"
              :max="param.validation?.max || 2000"
              outlined
              dense
              suffix="px"
              class="param-input-field min-height-input"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(String(value)) || 150)"
            >
              <template v-slot:prepend>
                <q-icon name="height" size="xs" color="blue-grey-6" />
              </template>
              <template v-slot:hint>
                Минимална височина ({{ param.validation?.min || 100 }}-{{ param.validation?.max || 2000 }}px)
              </template>
            </q-input>
            
            <!-- 🔄 Enable/Disable Toggle -->
            <q-toggle
              v-else-if="param.id === 'enabled' || param.id === 'isActive'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              class="param-toggle container-toggle"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:default>
                <q-icon 
                  :name="selectedBlock?.parameters[param.id] ? 'power' : 'power_off'" 
                  :color="selectedBlock?.parameters[param.id] ? 'positive' : 'negative'"
                  size="xs" 
                />
              </template>
            </q-toggle>
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: Select -->
            <q-select
              v-else-if="param.type === 'select'"
              :model-value="selectedBlock?.parameters[param.id]"
              :options="param.options || []"
              :label="param.label"
              outlined
              dense
              emit-value
              map-options
              class="param-select"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            >
              <template v-slot:prepend>
                <q-icon name="list" size="xs" />
              </template>
            </q-select>
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: Number -->
            <q-input
              v-else-if="param.type === 'number'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              type="number"
              outlined
              dense
              class="param-input-field"
              @update:model-value="(value) => updateParameterValue(param.id, parseFloat(String(value)) || 0)"
            >
              <template v-slot:prepend>
                <q-icon name="tag" size="xs" />
              </template>
            </q-input>
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: String -->
            <q-input
              v-else-if="param.type === 'string'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              outlined
              dense
              class="param-input-field"
              @update:model-value="(value) => updateParameterValue(param.id, String(value))"
            >
              <template v-slot:prepend>
                <q-icon name="text_fields" size="xs" />
              </template>
            </q-input>
            
            <!-- 📋 СТАНДАРТНИ ПАРАМЕТРИ: Boolean -->
            <q-toggle
              v-else-if="param.type === 'boolean'"
              :model-value="selectedBlock?.parameters[param.id]"
              :label="param.label"
              class="param-toggle"
              @update:model-value="(value) => updateParameterValue(param.id, value)"
            />
            
            <!-- 🔄 Fallback Display -->
            <div v-else class="param-value-display">
              <strong>{{ formatParameterValue(param) }}</strong>
              <small class="param-type-hint">({{ param.type }})</small>
            </div>
            
          </div>
        </div>
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
  
  console.log(`[ContainerParameters] Updating parameter: ${paramId} = ${value}`);
  
  // Special validation for container parameters
  if (paramId === 'containerTitle' && (typeof value === 'string' && value.trim().length === 0)) {
    console.warn(`[ContainerParameters] Empty title provided, using default`);
    value = 'Нов контейнер';
  }
  
  if (paramId === 'minWidth' && (value < 100 || value > 2000)) {
    const clampedValue = Math.max(100, Math.min(2000, value));
    console.warn(`[ContainerParameters] MinWidth out of range: ${value}, clamped to ${clampedValue}`);
    value = clampedValue;
  }
  
  if (paramId === 'minHeight' && (value < 100 || value > 2000)) {
    const clampedValue = Math.max(100, Math.min(2000, value));
    console.warn(`[ContainerParameters] MinHeight out of range: ${value}, clamped to ${clampedValue}`);
    value = clampedValue;
  }
  
  // If collapsible is disabled, also disable startCollapsed
  if (paramId === 'collapsible' && !value) {
    props.selectedBlock.parameters['startCollapsed'] = false;
    console.log(`[ContainerParameters] Disabled startCollapsed because collapsible is disabled`);
  }
  
  // Update the parameter value
  props.selectedBlock.parameters[paramId] = value;
  
  // Emit events to trigger reactivity in parent components
  emit('parameterUpdated', paramId, value);
  emit('blockUpdated', props.selectedBlock.id);
}

// 🎨 UI Helper Functions

/**
 * Checks if a parameter is visual/styling related
 */
function isVisualParameter(paramId: string): boolean {
  const visualParams = ['containerColor', 'borderStyle', 'minWidth', 'minHeight'];
  return visualParams.includes(paramId);
}

/**
 * Gets the current container style type for status display
 */
function getContainerStyleType(): string {
  const color = props.selectedBlock?.parameters?.containerColor || 'default';
  const borderStyle = props.selectedBlock?.parameters?.borderStyle || 'solid';
  
  if (color === 'default' && borderStyle === 'solid') return 'basic';
  if (borderStyle === 'none') return 'minimal';
  return 'styled';
}

/**
 * Gets container style status icon
 */
function getContainerStyleIcon(): string {
  const type = getContainerStyleType();
  switch (type) {
    case 'basic': return 'folder';
    case 'minimal': return 'folder_open';
    case 'styled': return 'folder_special';
    default: return 'folder';
  }
}

/**
 * Gets container style status color
 */
function getContainerStyleColor(): string {
  const type = getContainerStyleType();
  switch (type) {
    case 'basic': return 'blue-grey-5';
    case 'minimal': return 'blue-grey-3';
    case 'styled': return 'blue-grey-7';
    default: return 'blue-grey-5';
  }
}

/**
 * Gets container style description text
 */
function getContainerStyleDescription(): string {
  const type = getContainerStyleType();
  switch (type) {
    case 'basic': return 'Основен стил - стандартна визия';
    case 'minimal': return 'Минимален стил - без рамка';
    case 'styled': return 'Персонализиран стил - цветове и рамки';
    default: return 'Неопределен стил';
  }
}

/**
 * Gets color icon for color selection options
 */
function getColorIcon(colorValue: string): string {
  switch (colorValue) {
    case 'default': return 'circle';
    case 'blue': return 'circle';
    case 'green': return 'circle';
    case 'yellow': return 'circle';
    case 'red': return 'circle';
    case 'purple': return 'circle';
    case 'gray': return 'circle';
    default: return 'circle';
  }
}

/**
 * Gets actual color value for display in options
 */
function getColorValue(colorValue: string): string {
  switch (colorValue) {
    case 'default': return 'blue-grey-5';
    case 'blue': return 'blue';
    case 'green': return 'green';
    case 'yellow': return 'yellow';
    case 'red': return 'red';
    case 'purple': return 'purple';
    case 'gray': return 'grey';
    default: return 'blue-grey-5';
  }
}

/**
 * Gets border style preview text
 */
function getBorderStylePreview(borderValue: string): string {
  switch (borderValue) {
    case 'solid': return '────────';
    case 'dashed': return '─ ─ ─ ─';
    case 'dotted': return '• • • • •';
    case 'none': return '(без рамка)';
    default: return '────────';
  }
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
    // Special formatting for container dimensions
    if (param.id === 'minWidth' || param.id === 'minHeight') {
      return `${value}px`;
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  
  // Special formatting for containerTitle and containerDescription
  if (param.id === 'containerTitle' && typeof value === 'string') {
    return value.trim() || 'Нов контейнер';
  }
  
  if (param.id === 'containerDescription' && typeof value === 'string') {
    const desc = value.trim();
    return desc.length > 50 ? `${desc.substring(0, 50)}...` : desc || 'Няма описание';
  }
  
  return String(value);
}
</script>

<style scoped>
/* Container Parameters Specific Styles - ТЪМНОСИВ КАНТ */

.container-parameters {
  border: 2px solid #607D8B;
  border-radius: 8px;
  margin-bottom: 16px;
}

.container-parameters .expansion-header {
  background: rgba(96, 125, 139, 0.1);
  color: #455A64;
  font-weight: 600;
}

/* Container Status Display */
.container-status-display {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #607D8B;
  background: rgba(96, 125, 139, 0.05);
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
  color: #455A64;
}

.container-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(96, 125, 139, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}

.info-text {
  font-size: 11px;
  color: #546E7A;
  font-weight: 500;
}

/* Container Style Status Indicator */
.container-style-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.container-style-status.style-basic {
  background: rgba(96, 125, 139, 0.1);
  color: #607D8B;
}

.container-style-status.style-minimal {
  background: rgba(176, 190, 197, 0.1);
  color: #78909C;
}

.container-style-status.style-styled {
  background: rgba(55, 71, 79, 0.1);
  color: #37474F;
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

.parameter-item.param-visual {
  border: 1px solid #607D8B;
  background: rgba(96, 125, 139, 0.02);
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

/* Special Container Input Styling */
.container-title-input {
  border-left: 3px solid #607D8B;
}

.container-description-input {
  border-left: 3px solid #78909C;
}

.container-color-select {
  border-left: 3px solid #607D8B;
}

.border-style-select {
  border-left: 3px solid #90A4AE;
}

.min-width-input {
  border-left: 3px solid #B0BEC5;
}

.min-height-input {
  border-left: 3px solid #B0BEC5;
}

.collapsible-toggle, .start-collapsed-toggle, .container-toggle {
  padding: 8px 0;
}

/* Common indicators */
.required-indicator {
  color: #f44336;
  font-weight: 700;
  margin-left: 2px;
}

.visual-indicator {
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
  .container-status-display {
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