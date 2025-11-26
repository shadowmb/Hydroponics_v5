<!--
/**
 * 📦 SimpleBlockPalette - Modern Block Selector
 * ✅ Clean replacement for BlockSelector.vue
 * 🎯 Modern async/await architecture with preserved UI design
 * Last update: 2025-08-04
 */
-->
<template>
  <div class="block-selector">
    <q-card class="full-height">
      <!-- Header -->
      <q-card-section class="q-pb-none">
        <div class="selector-header">
          <div class="header-title">
            <q-icon name="extension" size="sm" class="q-mr-xs" />
            <span class="text-weight-bold">Блокове за автоматизация</span>
          </div>
          <q-btn
            flat
            dense
            size="sm"
            :icon="allExpanded ? 'unfold_less' : 'unfold_more'"
            :title="allExpanded ? 'Скрий всички категории' : 'Покажи всички категории'"
            @click="toggleAllCategories"
            class="expand-toggle-btn"
          />
        </div>
        
        <!-- Quick Stats -->
        <div class="quick-stats q-mt-sm">
          <q-chip
            size="sm"
            color="primary"
            text-color="white"
            :label="`${totalBlocks} блока`"
          />
          <q-chip
            size="sm"
            color="grey-6"
            text-color="white"
            :label="`${Object.keys(categorizedBlocks).length} категории`"
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state q-pa-lg">
        <q-spinner color="primary" size="md" />
        <div class="text-caption text-grey-6 q-mt-sm">
          Зареждане на блокове...
        </div>
      </div>

      <!-- Categories -->
      <q-card-section v-else class="q-pa-0 categories-section">
        <div
          v-for="(categoryBlocks, categoryName) in categorizedBlocks"
          :key="categoryName"
          class="category-container"
        >
          <q-expansion-item
            :model-value="expandedCategories[categoryName]"
            @update:model-value="(val) => updateCategoryExpansion(categoryName, val)"
            class="category-expansion"
          >
            <template v-slot:header>
              <div class="category-header-custom">
                <div class="category-icon-wrapper">
                  <q-icon 
                    :name="getCategoryIcon(categoryName)" 
                    size="sm" 
                    color="white"
                  />
                </div>
                <div class="category-title">{{ categoryName }}</div>
                <div class="category-badge">
                  <q-badge 
                    :label="categoryBlocks.length" 
                    color="blue-grey-8" 
                    rounded 
                  />
                </div>
              </div>
            </template>
            <div class="blocks-grid q-pa-sm">
              <div
                v-for="block in categoryBlocks"
                :key="block.id"
                class="block-card-minimal"
                :class="{ 'readonly-mode': props.readonly }"
                @click="addBlockToCanvas(block)"
              >
                <div class="block-content">
                  <!-- Block Info -->
                  <div class="block-info">
                    <div class="block-name">{{ block.name }}</div>
                    <div class="block-description">{{ block.description }}</div>
                    
                    <!-- Usage Counter -->
                    <div v-if="getBlockUsageCount(block.id) > 0" class="block-usage">
                      <span class="usage-text">{{ getBlockUsageCount(block.id) }}×</span>
                    </div>
                  </div>

                  <!-- Central Add Button (shows on hover) -->
                  <div v-if="!props.readonly" class="block-add-center">
                    <q-btn
                      round
                      size="sm"
                      icon="add"
                      color="primary"
                      class="add-btn-hover"
                      @click.stop="addBlockToCanvas(block)"
                    />
                  </div>
                </div>
              </div>
              
              <!-- Empty Category State -->
              <div v-if="categoryBlocks.length === 0" class="empty-category">
                <q-icon name="info" size="md" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-sm">
                  Няма налични блокове в тази категория
                </div>
              </div>
            </div>
          </q-expansion-item>
        </div>

        <!-- No Blocks State -->
        <div v-if="totalBlocks === 0 && !isLoading" class="no-blocks-state q-pa-lg">
          <q-icon name="extension_off" size="xl" color="grey-5" />
          <div class="text-h6 text-grey-6 q-mt-md">Няма налични блокове</div>
          <div class="text-caption text-grey-5">
            Проверете дали BlockFactory е правилно конфигуриран
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import { getAllBlockDefinitions, getBlockCategories, simpleBlockAdapterInstance } from '../ui/adapters/BlockFactoryAdapter';
import type { BlockDefinition } from '../types/BlockConcept';

// Props
interface Props {
  width?: number;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: 280,
  readonly: false,
});

// Events
const emit = defineEmits<{
  blockAdded: [blockId: string, position: { x: number; y: number }];
  categoryToggled: [categoryName: string, expanded: boolean];
}>();

// Inject shared block editor data
const blockEditor = inject('blockEditor') as ReturnType<typeof import('../composables/useBlockEditor').useBlockEditor>;
if (!blockEditor) {
  throw new Error('SimpleBlockPalette must be used within FlowEditor that provides blockEditor');
}

const {
  blocks,
  canvasState,
  addBlock,
} = blockEditor;

// State
const availableBlocks = ref<BlockDefinition[]>([]);
const expandedCategories = ref<Record<string, boolean>>({});
const allExpanded = ref(false);
const isLoading = ref(true);

// Computed properties
const categorizedBlocks = computed(() => {
  const categories: Record<string, BlockDefinition[]> = {};
  
  availableBlocks.value.forEach(block => {
    const category = block.category || 'Други';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(block);
  });
  
  // Sort blocks within each category by name
  Object.keys(categories).forEach(category => {
    categories[category].sort((a, b) => a.name.localeCompare(b.name, 'bg'));
  });
  
  // Sort categories by predefined order
  const categoryOrder = [
    'Основни',
    'Операции',
    'Сензори',
    'Логика', 
    'Управление',
    'Условия',
    'Таймери',
    'Уведомления', 
    'Променливи',
    'Поддържащи',
    'Поток'
  ];
  
  const sortedCategories: Record<string, BlockDefinition[]> = {};
  
  // Add categories in preferred order
  categoryOrder.forEach(category => {
    if (categories[category]) {
      sortedCategories[category] = categories[category];
    }
  });
  
  // Add any remaining categories
  Object.keys(categories).forEach(category => {
    if (!categoryOrder.includes(category)) {
      sortedCategories[category] = categories[category];
    }
  });
  
  return sortedCategories;
});

const totalBlocks = computed(() => availableBlocks.value.length);

// Methods
async function loadAvailableBlocks(): Promise<void> {
  try {
    isLoading.value = true;
    
    // Wait for adapter to be ready
    if (!simpleBlockAdapterInstance.isReady()) {
      await simpleBlockAdapterInstance.initialize();
    }
    
    // Get all block definitions from adapter
    const allBlocks = getAllBlockDefinitions();
    
    // Filter out deprecated and system blocks
    availableBlocks.value = allBlocks.filter(block => {
      const schema = block as any;
      // Filter out deprecated blocks
      if (schema.deprecated) return false;
      
      // Filter out system blocks (Start/End) - they are automatically created
      if (schema.meta?.system === true) return false;
      
      return true;
    });
    
    // Initialize expanded state for categories
    const categories = getBlockCategories();
    categories.forEach(category => {
      // Start with some categories expanded by default
      const defaultExpanded = ['Сензори', 'Управление', 'Логика'].includes(category);
      expandedCategories.value[category] = defaultExpanded;
    });
    
  } catch (error) {
    console.error('[SimpleBlockPalette] Failed to load blocks:', error);
  } finally {
    isLoading.value = false;
  }
}

function getCategoryIcon(categoryName: string): string {
  const iconMap: Record<string, string> = {
    'Основни': 'widgets',
    'Операции': 'settings',
    'Сензори': 'sensors',
    'Логика': 'psychology',
    'Управление': 'settings_remote',
    'Условия': 'rule',
    'Таймери': 'schedule',
    'Уведомления': 'notifications',
    'Променливи': 'data_object',
    'Поток': 'account_tree',
  };
  
  return iconMap[categoryName] || 'category';
}

function getBlockUsageCount(blockId: string): number {
  // Count how many times this block type is used in current flow
  return blocks.value.filter(block => block.definitionId === blockId).length;
}

async function addBlockToCanvas(blockDefinition: BlockDefinition) {
  // Skip if in readonly mode
  if (props.readonly) {
    return;
  }
  
  //console.log('🔥 DEBUG BlockSelector.addBlockToCanvas() called:', blockDefinition.id);
  
  try {
    // Calculate position for new block
    const canvasCenter = {
      x: (-canvasState.pan.x + 400) / canvasState.zoom,
      y: (-canvasState.pan.y + 300) / canvasState.zoom,
    };
    
    // Add some randomness to avoid overlapping
    const offset = Math.random() * 100 - 50;
    const position = {
      x: canvasCenter.x + offset,
      y: canvasCenter.y + offset,
    };
    
   // console.log('🔥 DEBUG BlockSelector: Calling addBlock with position:', position);
    
    // Create and add the block - FIXED: await the promise
    const newBlock = await addBlock(blockDefinition.id, position);
    
   // console.log('🔥 DEBUG BlockSelector: Block created, emitting blockAdded:', newBlock.id);
    
    // Emit event
    emit('blockAdded', newBlock.id, position);
    
  } catch (error) {
    console.error('[SimpleBlockPalette] Failed to add block:', error);
  }
}

function updateCategoryExpansion(categoryName: string, expanded: boolean) {
  expandedCategories.value[categoryName] = expanded;
  emit('categoryToggled', categoryName, expanded);
}

function toggleAllCategories() {
  allExpanded.value = !allExpanded.value;
  
  Object.keys(categorizedBlocks.value).forEach(category => {
    expandedCategories.value[category] = allExpanded.value;
  });
}

// Lifecycle
onMounted(async () => {
  await loadAvailableBlocks();
});

// Expose for parent components
defineExpose({
  loadAvailableBlocks,
  expandedCategories,
  totalBlocks,
});
</script>

<style scoped>
.block-selector {
  width: v-bind(props.width + 'px');
  height: 100%;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.expand-toggle-btn {
  min-width: auto;
  padding: 4px;
}

.quick-stats {
  display: flex;
  gap: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
}

.categories-section {
  height: calc(100% - 120px);
  overflow-y: auto;
}

.category-container {
  border-bottom: 1px solid #e0e0e0;
}

.category-container:last-child {
  border-bottom: none;
}

.category-expansion {
  background: white;
}

/* Custom category header styling - Blue background */
.category-header-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  font-weight: 600;
  font-size: 14px;
  border-radius: 4px;
  margin: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-header-custom:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.3);
}

.category-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.category-title {
  flex: 1;
  margin-left: 12px;
  font-weight: 600;
}

.category-badge {
  margin-left: 8px;
}

.blocks-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  background: #fafafa;
  padding: 8px;
}

/* Minimal block cards */
.block-card-minimal {
  position: relative;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.block-card-minimal:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
  transform: translateY(-1px);
}

.block-card-minimal:hover .block-add-center {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

/* Readonly mode styling */
.block-card-minimal.readonly-mode {
  cursor: default;
  opacity: 0.7;
}

.block-card-minimal.readonly-mode:hover {
  border-color: #e5e5e5;
  box-shadow: none;
  transform: none;
}

.block-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.block-info {
  flex: 1;
  min-width: 0;
}

.block-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  margin-bottom: 2px;
  line-height: 1.2;
}

.block-description {
  font-size: 11px;
  color: #666;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.block-usage {
  margin-top: 4px;
}

.usage-text {
  font-size: 10px;
  color: #999;
  font-weight: 500;
}

/* Central add button (shows on hover) */
.block-add-center {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%) scale(0.8);
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 2;
}

.add-btn-hover {
  background: #1976d2 !important;
  color: white !important;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.4);
}

.add-btn-hover:hover {
  background: #1565c0 !important;
  transform: scale(1.1);
}

.empty-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-blocks-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 300px;
}

/* Override Quasar expansion item styles for custom header */
.category-expansion :deep(.q-expansion-item__container) {
  border: none;
  box-shadow: none;
}

.category-expansion :deep(.q-expansion-item__header) {
  padding: 0;
  min-height: auto;
}

.category-expansion :deep(.q-expansion-item__content) {
  padding: 0;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .block-selector {
    width: 260px;
  }
}

@media (max-width: 768px) {
  .block-selector {
    width: 240px;
  }
  
  .category-header-custom {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .block-card-minimal {
    padding: 8px;
  }
  
  .block-name {
    font-size: 12px;
  }
  
  .block-description {
    font-size: 10px;
  }
}

/* Scrollbar styling */
.categories-section::-webkit-scrollbar {
  width: 6px;
}

.categories-section::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.categories-section::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.categories-section::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>