<!--
/**
 * 🎯 Target Config Demo Page
 * ✅ Demo страница за тестване на Target Configuration режима
 * Phase 4: Testing page for TargetConfigSection functionality
 */
-->
<template>
  <!-- DEACTIVATED: Executor Mode System - Phase 2F -->
  <!-- Demo page deactivated -->
  <q-page class="target-config-demo-deactivated">
    <div class="text-center q-pa-xl">
      <q-banner class="bg-grey-2">
        <template v-slot:avatar>
          <q-icon name="info" color="primary" />
        </template>
        <div class="text-h6">Target Configuration Demo е деактивирана</div>
        <div class="text-body2 q-mt-sm">
          Executor Mode System е временно деактивиран в рамките на хирургическото премахване.
        </div>
      </q-banner>
    </div>

    <!-- Demo Controls -->
    <div class="demo-controls">
      <q-card flat class="controls-card">
        <q-card-section>
          <div class="row q-gutter-md items-center">
            <q-toggle
              v-model="targetConfigMode"
              label="Target Config Mode"
              color="purple"
              size="md"
            />
            <q-toggle
              v-model="readonlyMode"
              label="Readonly Mode"
              color="blue"
              size="md"
            />
            <q-btn
              label="Load Sample Flow"
              icon="upload"
              color="primary"
              outline
              @click="loadSampleFlow"
            />
            <q-btn
              label="Clear Flow"
              icon="clear"
              color="negative"
              outline
              @click="clearFlow"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- FlowEditor with Target Config -->
    <div class="demo-editor">
      <FlowEditor
        :readonly="readonlyMode"
        :targetConfigMode="targetConfigMode"
        :showToolbar="true"
        @targetConfigUpdated="handleTargetConfigUpdated"
        @configurationExported="handleConfigurationExported"
        @error="handleError"
      />
    </div>

    <!-- Debug Info -->
    <div v-if="debugMode" class="debug-panel">
      <q-card flat class="debug-card">
        <q-card-section>
          <div class="debug-header">
            <q-icon name="bug_report" size="sm" color="orange" />
            <span class="debug-title">Debug Information</span>
          </div>
          
          <div class="debug-content">
            <div class="debug-item">
              <strong>Target Config Updates:</strong>
              <div class="debug-list">
                <div v-for="(update, index) in targetUpdates" :key="index" class="debug-update">
                  <span class="update-field">{{ update.fieldId }}</span>
                  <span class="update-arrow">→</span>
                  <span class="update-target">{{ update.targetKey || 'null' }}</span>
                  <span v-if="update.comment" class="update-comment">({{ update.comment }})</span>
                </div>
              </div>
            </div>
            
            <div v-if="lastExport" class="debug-item">
              <strong>Last Export:</strong>
              <pre class="export-data">{{ JSON.stringify(lastExport, null, 2) }}</pre>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Floating Debug Toggle -->
    <q-btn
      fab
      icon="bug_report"
      color="orange"
      class="debug-fab"
      @click="debugMode = !debugMode"
    >
      <q-tooltip>Toggle Debug Info</q-tooltip>
    </q-btn>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import FlowEditor from '../modules/flowEditorV2/FlowEditor.vue';

// Page state
const targetConfigMode = ref(true);
const readonlyMode = ref(false);
const debugMode = ref(false); // Hidden by default

// Debug data
const targetUpdates = ref<Array<{fieldId: string, targetKey: string | null, comment?: string}>>([]);
const lastExport = ref<any>(null);

// Quasar
const $q = useQuasar();

// Event Handlers
function handleTargetConfigUpdated(fieldId: string, targetKey: string | null, comment?: string) {
  console.log('🎯 Target Config Updated:', { fieldId, targetKey, comment });
  
  // Add to debug log
  targetUpdates.value.unshift({
    fieldId,
    targetKey,
    comment
  });
  
  // Keep only last 10 updates
  if (targetUpdates.value.length > 10) {
    targetUpdates.value = targetUpdates.value.slice(0, 10);
  }
  
  // Show notification
  $q.notify({
    type: 'positive',
    message: `Target обновен: ${fieldId}`,
    caption: targetKey ? `Нов target: ${targetKey}` : 'Target изчистен',
    position: 'top-right',
    timeout: 2000
  });
}

function handleConfigurationExported(config: any) {
  console.log('📤 Configuration Exported:', config);
  
  lastExport.value = config;
  
  $q.notify({
    type: 'info',
    message: 'Конфигурация експортирана',
    caption: `${config.configuredFields}/${config.totalFields} полета`,
    position: 'top-right',
    timeout: 3000
  });
}

function handleError(message: string) {
  console.error('❌ FlowEditor Error:', message);
  
  $q.notify({
    type: 'negative',
    message: 'FlowEditor грешка',
    caption: message,
    position: 'top-right',
    timeout: 5000
  });
}

function loadSampleFlow() {
  // Create sample blocks programmatically
  const sampleEvent = new CustomEvent('flow-editor:load-sample', {
    detail: {
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
          }
        },
        {
          id: 'actuator-2', 
          definitionId: 'actuator',
          position: { x: 400, y: 150 },
          parameters: {
            deviceType: 'valve',
            action: 'open',
            controlMode: 'dose',
            dose: 5,
            enabled: true
          }
        }
      ]
    }
  });
  
  window.dispatchEvent(sampleEvent);
  
  $q.notify({
    type: 'positive',
    message: 'Sample Flow зареден успешно',
    caption: '2 Actuator блока създадени',
    position: 'top-right'
  });
}

function clearFlow() {
  targetUpdates.value = [];
  lastExport.value = null;
  
  $q.notify({
    type: 'warning',
    message: 'Debug данни изчистени',
    position: 'top-right'
  });
}

// Lifecycle
onMounted(() => {
  console.log('🎯 Target Config Demo Page loaded');
});
</script>

<style scoped>
.target-config-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* Demo Header */
.demo-header {
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-text {
  flex: 1;
}

.demo-title {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.demo-subtitle {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 14px;
}

/* Demo Controls */
.demo-controls {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.controls-card {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* Demo Editor */
.demo-editor {
  flex: 1;
  margin: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

/* Debug Panel */
.debug-panel {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 350px;
  max-height: 300px;
  z-index: 1000;
  pointer-events: auto; /* Allow interaction with debug panel */
}

.debug-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.debug-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.debug-title {
  font-weight: 600;
  color: #333;
}

.debug-content {
  max-height: 300px;
  overflow-y: auto;
}

.debug-item {
  margin-bottom: 16px;
}

.debug-list {
  margin-top: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.debug-update {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
}

.update-field {
  font-weight: 500;
  color: #1976d2;
  font-family: monospace;
}

.update-arrow {
  color: #666;
}

.update-target {
  font-weight: 500;
  color: #7b1fa2;
}

.update-comment {
  color: #666;
  font-style: italic;
}

.export-data {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  max-height: 150px;
  overflow: auto;
}

/* Debug FAB */
.debug-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1001;
}

/* Responsive */
@media (max-width: 768px) {
  .demo-header {
    padding: 16px;
  }
  
  .demo-controls {
    padding: 12px 16px;
  }
  
  .demo-editor {
    margin: 16px;
    border-radius: 8px;
  }
  
  .debug-panel {
    width: calc(100vw - 40px);
    right: 20px;
  }
}

/* Animations */
.debug-panel {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.debug-update {
  animation: fadeInScale 0.2s ease-out;
}

@keyframes fadeInScale {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>