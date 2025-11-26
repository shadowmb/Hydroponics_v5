<template>
  <div v-if="inline">
    <!-- Inline mode - no expansion item wrapper -->
    <div class="q-pa-md">
        <div class="text-h6 q-mb-md">Network Discovery Configuration</div>
        
        <!-- Primary Discovery Mode Selection -->
        <div class="q-mb-lg">
          <div class="text-subtitle2 q-mb-sm">Discovery Mode</div>
          <q-option-group
            v-model="settings.discoveryMode"
            :options="primaryDiscoveryModes"
            color="primary"
            @update:model-value="updateDiscoveryMode"
          />
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ primaryDiscoveryModes.find(m => m.value === settings.discoveryMode)?.description }}
          </div>
        </div>

        <!-- UDP Discovery Method Selection -->
        <div class="q-mt-md" v-if="settings.discoveryMode === 'udp'">
          <div class="text-subtitle2 q-mb-sm">UDP Discovery Method</div>
          <q-option-group
            v-model="settings.discoveryMethod"
            :options="discoveryMethods"
            color="primary"
            @update:model-value="updateDiscoveryMethod"
          />
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ discoveryMethods.find(m => m.value === settings.discoveryMethod)?.description }}
          </div>
        </div>

        <!-- UDP Discovery Settings -->
        <div v-if="settings.discoveryMode === 'udp'">
          <div class="row q-gutter-md q-mt-md">
            <q-input
              v-model="settings.broadcastAddress"
              :label="settings.discoveryMethod === 'network_scan' ? 'Network Address' : 'Broadcast Address'"
              :placeholder="settings.discoveryMethod === 'network_scan' ? '192.168.0.0' : '192.168.0.255'"
              class="col-md-6"
              :rules="[validateIP]"
              @blur="updateBroadcastAddress"
            />
            
            <q-input
              v-model.number="settings.udpPort"
              label="UDP Port"
              type="number"
              placeholder="8888"
              class="col-md-3"
              :rules="[validatePort]"
              @blur="updateUdpPort"
            />
          </div>

          <div class="row q-gutter-md q-mt-md">
            <q-input
              v-model.number="settings.responseTimeout"
              label="Response Timeout (ms)"
              type="number"
              placeholder="2000"
              class="col-md-6"
              :rules="[validateTimeout]"
              @blur="updateResponseTimeout"
            />
            
            <q-input
              v-model.number="settings.retryAttempts"
              label="Retry Attempts"
              type="number"
              placeholder="3"
              class="col-md-6"
              :rules="[validateRetries]"
              @blur="updateRetryAttempts"
            />
          </div>
        </div>


        <div class="row q-gutter-sm q-mt-md">
          <q-btn
            label="Reset to Defaults"
            color="secondary"
            icon="restore"
            outline
            @click="resetToDefaults"
          />
        </div>
    </div>
  </div>
    <div v-else>
      <!-- Expansion item mode - original wrapper -->
      <q-expansion-item
        label="Network Discovery Settings"
        icon="wifi"
        :default-opened="false"
        class="q-mb-md"
      >
        <q-card flat class="q-pa-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Network Discovery Configuration</div>
            
            <!-- Primary Discovery Mode Selection -->
            <div class="q-mb-lg">
              <div class="text-subtitle2 q-mb-sm">Discovery Mode</div>
              <q-option-group
                v-model="settings.discoveryMode"
                :options="primaryDiscoveryModes"
                color="primary"
                @update:model-value="updateDiscoveryMode"
              />
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ primaryDiscoveryModes.find(m => m.value === settings.discoveryMode)?.description }}
              </div>
            </div>

            <!-- UDP Discovery Method Selection -->
            <div class="q-mt-md" v-if="settings.discoveryMode === 'udp'">
              <div class="text-subtitle2 q-mb-sm">UDP Discovery Method</div>
              <q-option-group
                v-model="settings.discoveryMethod"
                :options="discoveryMethods"
                color="primary"
                @update:model-value="updateDiscoveryMethod"
              />
              <div class="text-caption text-grey-6 q-mt-xs">
                {{ discoveryMethods.find(m => m.value === settings.discoveryMethod)?.description }}
              </div>
            </div>

            <!-- UDP Discovery Settings -->
            <div v-if="settings.discoveryMode === 'udp'">
              <div class="row q-gutter-md q-mt-md">
                <q-input
                  v-model="settings.broadcastAddress"
                  :label="settings.discoveryMethod === 'network_scan' ? 'Network Address' : 'Broadcast Address'"
                  :placeholder="settings.discoveryMethod === 'network_scan' ? '192.168.0.0' : '192.168.0.255'"
                  class="col-md-6"
                  :rules="[validateIP]"
                  @blur="updateBroadcastAddress"
                />
                
                <q-input
                  v-model.number="settings.udpPort"
                  label="UDP Port"
                  type="number"
                  placeholder="8888"
                  class="col-md-3"
                  :rules="[validatePort]"
                  @blur="updateUdpPort"
                />
              </div>

              <div class="row q-gutter-md q-mt-md">
                <q-input
                  v-model.number="settings.responseTimeout"
                  label="Response Timeout (ms)"
                  type="number"
                  placeholder="2000"
                  class="col-md-6"
                  :rules="[validateTimeout]"
                  @blur="updateResponseTimeout"
                />
                
                <q-input
                  v-model.number="settings.retryAttempts"
                  label="Retry Attempts"
                  type="number"
                  placeholder="3"
                  class="col-md-6"
                  :rules="[validateRetries]"
                  @blur="updateRetryAttempts"
                />
              </div>
            </div>

            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                label="Reset to Defaults"
                color="secondary"
                icon="restore"
                outline
                @click="resetToDefaults"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>
  </template>

<script setup lang="ts">
// ABOUTME: NetworkDiscoverySettings component manages configuration for controller discovery over network
// ABOUTME: Supports UDP broadcast, network scanning, and HTTP polling with WSL-aware discovery methods
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from '../config/ports'

// Props
defineProps<{
  inline?: boolean
}>()

const $q = useQuasar()

// Network settings (Phase 1 & 3 integration)
const settings = reactive({
  discoveryMode: 'http', // 'http' or 'udp'
  broadcastAddress: '192.168.0.255',
  udpPort: 8888,
  responseTimeout: 2000,
  retryAttempts: 3,
  discoveryMethod: 'network_scan' // WSL-friendly default for UDP
})

// Primary discovery mode options
const primaryDiscoveryModes = [
  { label: 'HTTP Direct', value: 'http', description: 'Direct HTTP ping to controller IPs from database' },
  { label: 'UDP Discovery', value: 'udp', description: 'Network discovery using UDP protocol' }
]

// UDP discovery method options
const discoveryMethods = [
  { label: 'Broadcast', value: 'broadcast', description: 'Standard UDP broadcast - may not work in WSL' },
  { label: 'Network Scan', value: 'network_scan', description: 'Scan network range for active devices - WSL friendly' }
]


// Validation functions
const validateIP = (val: string) => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  return ipRegex.test(val) || 'Invalid IP address format'
}

const validatePort = (val: number) => {
  return (val >= 1024 && val <= 65535) || 'Port must be between 1024 and 65535'
}

const validateTimeout = (val: number) => {
  return (val >= 500 && val <= 10000) || 'Timeout must be between 500ms and 10000ms'
}

const validateRetries = (val: number) => {
  return (val >= 1 && val <= 5) || 'Retry attempts must be between 1 and 5'
}

// API functions
const loadNetworkSettings = async () => {
  try {
    console.log(`🔍 NetworkDiscovery: Loading network settings from ${API_BASE_URL}/devices/network-settings`)
    const response = await fetch(`${API_BASE_URL}/devices/network-settings`)
    console.log('📡 NetworkDiscovery: Response status:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('📄 NetworkDiscovery: Response data:', data)
    
    if (data.success) {
      console.log('✅ NetworkDiscovery: Settings loaded successfully:', data.data)
      Object.assign(settings, data.data)
    } else {
      console.warn('⚠️ NetworkDiscovery: Response indicates failure:', data)
      $q.notify({
        type: 'negative',
        message: `Failed to load network settings: ${data.error || 'Unknown error'}`
      })
    }
  } catch (error) {
    console.error('❌ NetworkDiscovery: Error loading network settings:', error)
    const errorObj = error as Error
    console.error('❌ NetworkDiscovery: Error details:', {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack
    })
    $q.notify({
      type: 'negative',
      message: `Failed to load network settings: ${errorObj.message}`
    })
  }
}

// Individual field update functions for partial updates
async function updateDiscoveryMode() {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/network-settings/discovery-mode`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discoveryMode: settings.discoveryMode })
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.error)
  } catch (error: any) {
    $q.notify({ type: 'negative', message: `Failed to update discovery mode: ${error.message}` })
  }
}

async function updateBroadcastAddress() {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/network-settings/broadcast-address`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ broadcastAddress: settings.broadcastAddress })
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.error)
  } catch (error: any) {
    $q.notify({ type: 'negative', message: `Failed to update broadcast address: ${error.message}` })
  }
}

async function updateUdpPort() {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/network-settings/udp-port`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ udpPort: settings.udpPort })
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.error)
  } catch (error: any) {
    $q.notify({ type: 'negative', message: `Failed to update UDP port: ${error.message}` })
  }
}

async function updateResponseTimeout() {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/network-settings/response-timeout`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseTimeout: settings.responseTimeout })
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.error)
  } catch (error: any) {
    $q.notify({ type: 'negative', message: `Failed to update response timeout: ${error.message}` })
  }
}

async function updateRetryAttempts() {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/network-settings/retry-attempts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retryAttempts: settings.retryAttempts })
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.error)
  } catch (error: any) {
    $q.notify({ type: 'negative', message: `Failed to update retry attempts: ${error.message}` })
  }
}

async function updateDiscoveryMethod() {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/network-settings/discovery-method`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discoveryMethod: settings.discoveryMethod })
    })
    const data = await response.json()
    if (!data.success) throw new Error(data.error)
  } catch (error: any) {
    $q.notify({ type: 'negative', message: `Failed to update discovery method: ${error.message}` })
  }
}


const resetToDefaults = async () => {
  Object.assign(settings, {
    discoveryMode: 'http',
    broadcastAddress: '192.168.0.255',
    udpPort: 8888,
    responseTimeout: 2000,
    retryAttempts: 3,
    discoveryMethod: 'network_scan'
  })
  
  // Apply all default values through individual endpoints
  await Promise.all([
    updateDiscoveryMode(),
    updateBroadcastAddress(),
    updateUdpPort(),
    updateResponseTimeout(),
    updateRetryAttempts(),
    updateDiscoveryMethod()
  ])
}


// Initialize component
onMounted(async () => {
  console.log('🚀 NetworkDiscovery: Component mounting, initializing...')
  try {
    console.log('📋 NetworkDiscovery: Loading network settings...')
    await loadNetworkSettings()
    console.log('✅ NetworkDiscovery: Component initialization complete')
  } catch (error) {
    console.error('❌ NetworkDiscovery: Error during component initialization:', error)
  }
})
</script>

<style scoped>
.q-expansion-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
</style>