// ABOUTME: Debug tool dialog for sending raw commands to controllers
// ABOUTME: Allows testing controller commands with dynamic parameter inputs based on command schema
<template>
  <q-card style="min-width: 700px; max-width: 900px">
    <q-card-section class="row items-center">
      <div class="text-h6">
        <q-icon name="bug_report" class="q-mr-sm" color="primary" />
        Debug Commands
      </div>
      <q-space />
      <q-btn icon="close" flat round dense @click="$emit('close')" />
    </q-card-section>

    <q-separator />

    <q-card-section>
      <!-- Controller Selection -->
      <div class="q-mb-md">
        <q-select
          v-model="selectedController"
          :options="controllers"
          option-label="name"
          label="Избери контролер"
          outlined
          dense
          :loading="controllersLoading"
          @update:model-value="onControllerChange"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.name }}</q-item-label>
                <q-item-label caption>
                  {{ scope.opt.type }} - {{ scope.opt.status }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  :color="scope.opt.status === 'online' ? 'positive' : 'negative'"
                  :label="scope.opt.status"
                />
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- Command Selection -->
      <div class="q-mb-md" v-if="selectedController">
        <q-select
          v-model="selectedCommand"
          :options="availableCommands"
          option-label="displayName"
          label="Избери команда"
          outlined
          dense
          @update:model-value="onCommandChange"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.displayName }}</q-item-label>
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- Dynamic Parameter Inputs -->
      <div v-if="selectedCommand && selectedCommand.parameters && selectedCommand.parameters.length > 0" class="q-mb-md">
        <div class="text-subtitle2 q-mb-sm">Параметри:</div>
        <div
          v-for="param in selectedCommand.parameters"
          :key="param.name"
          class="q-mb-sm"
        >
          <!-- String input -->
          <q-input
            v-if="param.type === 'string'"
            v-model="commandParams[param.name]"
            :label="param.description || param.name"
            :hint="param.validation ? `Format: ${param.validation}` : ''"
            outlined
            dense
            :rules="param.required ? [val => !!val || 'Required'] : []"
          />

          <!-- Number input -->
          <q-input
            v-else-if="param.type === 'number'"
            v-model.number="commandParams[param.name]"
            :label="param.description || param.name"
            :hint="`${param.min !== undefined ? 'Min: ' + param.min : ''} ${param.max !== undefined ? 'Max: ' + param.max : ''}`"
            type="number"
            :min="param.min"
            :max="param.max"
            outlined
            dense
            :rules="param.required ? [val => val !== null && val !== '' || 'Required'] : []"
          />

          <!-- Boolean input -->
          <q-checkbox
            v-else-if="param.type === 'boolean'"
            v-model="commandParams[param.name]"
            :label="param.description || param.name"
          />

          <!-- Array input (JSON) -->
          <q-input
            v-else-if="param.type === 'array'"
            v-model="commandParams[param.name]"
            :label="param.description || param.name"
            hint="Въведи JSON масив"
            type="textarea"
            outlined
            dense
            rows="3"
            :rules="param.required ? [val => !!val || 'Required'] : []"
          />
        </div>
      </div>

      <!-- No parameters message -->
      <div v-else-if="selectedCommand && (!selectedCommand.parameters || selectedCommand.parameters.length === 0)" class="q-mb-md">
        <q-banner class="bg-blue-1 text-blue-9">
          <template v-slot:avatar>
            <q-icon name="info" />
          </template>
          Тази команда не изисква параметри
        </q-banner>
      </div>

      <!-- Send Command Button -->
      <div class="q-mb-md" v-if="selectedCommand">
        <q-btn
          color="primary"
          icon="send"
          label="Изпрати команда"
          :loading="sending"
          :disable="!canSendCommand"
          @click="sendCommand"
        />
      </div>

      <!-- Response Display -->
      <div v-if="lastResponse !== null">
        <q-separator class="q-my-md" />
        <div class="text-subtitle2 q-mb-sm">Отговор от контролера:</div>
        <q-card flat bordered :class="lastResponse.ok === 1 ? 'bg-green-1' : 'bg-red-1'">
          <q-card-section>
            <pre class="q-ma-none" style="white-space: pre-wrap; word-wrap: break-word;">{{ JSON.stringify(lastResponse, null, 2) }}</pre>
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat label="Затвори" color="primary" @click="$emit('close')" />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import generatorConfig from '../../../Arduino/generator-config.json'
import { API_BASE_URL } from '../config/ports'

const emit = defineEmits<{
  close: []
}>()

// State
const controllers = ref<any[]>([])
const controllersLoading = ref(false)
const selectedController = ref<any>(null)
const selectedCommand = ref<any>(null)
const commandParams = ref<Record<string, any>>({})
const sending = ref(false)
const lastResponse = ref<any>(null)

// Computed
const availableCommands = computed(() => {
  if (!selectedController.value || !selectedController.value.capabilities) {
    return []
  }

  // Filter commands from generator-config.json based on controller capabilities
  return generatorConfig.commands
    .filter((cmd: any) => selectedController.value.capabilities.includes(cmd.name))
    .map((cmd: any) => ({
      ...cmd,
      displayName: cmd.displayName || cmd.name
    }))
})

const canSendCommand = computed(() => {
  if (!selectedController.value || !selectedCommand.value) return false
  if (selectedController.value.status !== 'online') return false

  // Check required parameters
  if (selectedCommand.value.parameters) {
    for (const param of selectedCommand.value.parameters) {
      if (param.required && !commandParams.value[param.name]) {
        return false
      }
    }
  }

  return true
})

// Methods
const loadControllers = async () => {
  controllersLoading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/controllers`)
    controllers.value = await response.json()
  } catch (error) {
    console.error('Error loading controllers:', error)
  } finally {
    controllersLoading.value = false
  }
}

const onControllerChange = () => {
  selectedCommand.value = null
  commandParams.value = {}
  lastResponse.value = null
}

const onCommandChange = () => {
  // Reset params and set defaults
  commandParams.value = {}
  lastResponse.value = null

  if (selectedCommand.value && selectedCommand.value.parameters) {
    for (const param of selectedCommand.value.parameters) {
      if (param.default !== undefined) {
        commandParams.value[param.name] = param.default
      }
    }
  }
}

const sendCommand = async () => {
  if (!selectedController.value || !selectedCommand.value) return

  sending.value = true
  lastResponse.value = null

  try {
    // Build command object
    const command: Record<string, any> = {
      cmd: selectedCommand.value.name
    }

    // Add parameters
    if (selectedCommand.value.parameters) {
      for (const param of selectedCommand.value.parameters) {
        const value = commandParams.value[param.name]
        if (value !== undefined && value !== null && value !== '') {
          // Parse JSON for array types
          if (param.type === 'array' && typeof value === 'string') {
            try {
              command[param.name] = JSON.parse(value)
            } catch {
              command[param.name] = value
            }
          } else {
            command[param.name] = value
          }
        }
      }
    }

    // Send command
    const response = await fetch(`${API_BASE_URL}/controllers/${selectedController.value._id}/raw-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command)
    })

    lastResponse.value = await response.json()
  } catch (error) {
    console.error('Error sending command:', error)
    lastResponse.value = {
      ok: 0,
      error: `Failed to send command: ${(error as Error).message}`
    }
  } finally {
    sending.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadControllers()
})
</script>

<style scoped>
pre {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>
