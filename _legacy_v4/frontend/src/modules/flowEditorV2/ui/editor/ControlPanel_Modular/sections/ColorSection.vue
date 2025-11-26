<!--
/**
 * 📦 ColorSection - Block Header Color Management
 * ✅ Modular component extracted from ControlPanel.vue
 * Handles custom colors, presets, and category color fallback
 */
-->
<template>
  <!-- Color Section -->
  <div v-if="selectedBlock" class="color-section">
    <div class="info-section-header">
      <q-icon name="palette" size="xs" />
      Цвят на хедъра
    </div>
    
    <!-- Цветова визуализация -->
    <div class="color-preview-container">
      <div 
        class="color-preview"
        :style="{ backgroundColor: getCurrentBlockColor() }"
      >
        <span class="color-value">{{ getCurrentBlockColor() }}</span>
      </div>
    </div>
    
    <!-- Потребителски цвят -->
    <div v-if="!props.readonly" class="custom-color-input">
      <q-input
        :model-value="selectedBlock?.parameters?.customHeaderColor || ''"
        @update:model-value="updateCustomColor"
        label="Потребителски цвят"
        placeholder="#FF0000 или red"
        dense
        outlined
      >
        <template #append>
          <q-icon 
            name="colorize" 
            class="cursor-pointer color-picker-icon"
            @click="showColorPicker = !showColorPicker"
          >
            <q-popup-proxy 
              v-model="showColorPicker"
              anchor="bottom right"
              self="top right"
              :offset="[0, 8]"
            >
              <q-color
                :model-value="selectedBlock?.parameters?.customHeaderColor || ''"
                @update:model-value="updateCustomColor"
                no-header
                no-footer
                class="color-picker-popup"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
    
    <!-- Предварително зададени цветове -->
    <div v-if="!props.readonly" class="color-presets">
      <div class="color-presets-label">Предварителни цветове:</div>
      <div class="color-presets-grid">
        <div
          v-for="color in colorPresets"
          :key="color"
          class="color-preset"
          :style="{ backgroundColor: color }"
          @click="updateCustomColor(color)"
          :title="color"
        ></div>
      </div>
    </div>
    
    <!-- Бутони за управление -->
    <div v-if="!props.readonly" class="color-actions">
      <q-btn
        flat
        dense
        size="sm"
        icon="refresh"
        label="Върни категория цвят"
        @click="resetToCategory"
        color="grey"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// 🔍 CRITICAL: Correct import paths for ControlPanel_Modular location
import type { 
  BlockInstance, 
  BlockDefinition 
} from '../../../../types/BlockConcept';

// Props
interface Props {
  selectedBlock?: BlockInstance;
  blockDefinition?: BlockDefinition;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

// Events
const emit = defineEmits<{
  colorUpdated: [blockId: string];
}>();

// Local state
const showColorPicker = ref(false);

// Color presets for quick selection
const colorPresets = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
  '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000'
];

// Methods

/**
 * Updates custom color for the selected block
 * @param color - New color value
 */
function updateCustomColor(color: string) {
  if (!props.selectedBlock || props.readonly) return;
  
  // Clean the color value
  const cleanColor = color.trim();
  
  // Validate color format - allow hex colors, named colors, or empty string
  const isValidColor = /^#[0-9A-F]{3,6}$/i.test(cleanColor) || 
                      /^[a-z]+$/i.test(cleanColor) || 
                      cleanColor === '';
  
  if (!isValidColor) {
    return; // Invalid color format
  }
  
  // Update block parameters
  if (cleanColor === '') {
    delete props.selectedBlock.parameters.customHeaderColor;
  } else {
    props.selectedBlock.parameters.customHeaderColor = cleanColor;
  }
  
  // Close color picker after selection
  showColorPicker.value = false;
  
  // Emit color updated event
  emit('colorUpdated', props.selectedBlock.id);
}

/**
 * Resets block color to category default
 */
function resetToCategory() {
  if (!props.selectedBlock || props.readonly) return;
  
  // Remove custom color to fall back to category color
  delete props.selectedBlock.parameters.customHeaderColor;
  
  // Emit color updated event
  emit('colorUpdated', props.selectedBlock.id);
}

/**
 * Gets the current effective color for the block
 * @returns Current block color as hex string
 */
function getCurrentBlockColor(): string {
  if (!props.selectedBlock || !props.blockDefinition) return '#2196F3';
  
  // Priority 1: Custom user-selected color (highest priority)
  const customColor = props.selectedBlock.parameters.customHeaderColor;
  if (customColor && typeof customColor === 'string' && customColor.trim()) {
    return customColor;
  }
  
  // Priority 2: Block definition color (from .block.ts file)
  if (props.blockDefinition.color && typeof props.blockDefinition.color === 'string' && props.blockDefinition.color.trim()) {
    return props.blockDefinition.color;
  }
  
  // Priority 3: Category-based color (fallback)
  const categoryColors: Record<string, string> = {
    'Сензори': '#2196F3',      // Blue
    'Актуатори': '#FF9800',     // Orange  
    'Логика': '#9C27B0',       // Purple
    'Управление': '#4CAF50',    // Green
    'Условия': '#00BCD4',      // Cyan
    'Таймери': '#795548',      // Brown
    'Уведомления': '#F44336',  // Red
    'Променливи': '#607D8B',   // Blue Grey
    'Поток': '#9E9E9E',        // Grey
    'Поддържащи': '#F44336',   // Red for error handling
    'Основни': '#2196F3',      // Blue for core blocks
  };
  
  const categoryColor = categoryColors[props.blockDefinition.category];
  if (categoryColor) {
    return categoryColor;
  }
  
  // Priority 4: Default fallback
  return '#2196F3';
}
</script>

<style scoped>
/* Color Section Styles - Extracted from ControlPanel.vue */

.color-section {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
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

.color-preview-container {
  margin-bottom: 12px;
}

.color-preview {
  width: 100%;
  height: 40px;
  border-radius: 6px;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.color-value {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.custom-color-input {
  margin-bottom: 12px;
}

.color-picker-icon {
  padding: 4px;
  margin-right: 4px;
}

.color-picker-popup {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-presets {
  margin-bottom: 12px;
}

.color-presets-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.color-presets-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  padding: 4px;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid #ddd;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-self: center;
}

.color-preset:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  border-color: #333;
  z-index: 1;
}

.color-preset:active {
  transform: scale(0.95);
}

.color-actions {
  display: flex;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
  .color-presets-grid {
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }
  
  .color-preset {
    width: 20px;
    height: 20px;
  }
  
  .color-preview {
    height: 32px;
  }
  
  .color-value {
    font-size: 10px;
    padding: 1px 6px;
  }
}
</style>