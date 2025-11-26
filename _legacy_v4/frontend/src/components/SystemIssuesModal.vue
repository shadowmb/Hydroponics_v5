<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 500px; max-width: 600px">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon :name="headerIcon" :color="headerColor" size="sm" class="q-mr-sm" />
          {{ headerTitle }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeModal" />
      </q-card-section>

      <!-- Issues List -->
      <q-card-section class="q-pt-md">
        <div v-if="issues.length === 0" class="text-center text-grey-6 q-py-md">
          <q-icon name="check_circle" size="md" color="positive" />
          <div class="q-mt-sm">Няма активни проблеми</div>
        </div>

        <div v-else class="q-gutter-md">
          <q-card
            v-for="(issue, index) in issues"
            :key="index"
            flat
            bordered
            :class="`issue-card issue-${issue.severity}`"
          >
            <q-card-section>
              <div class="row items-start q-gutter-sm">
                <!-- Icon -->
                <q-icon
                  :name="issue.icon"
                  :color="issue.color"
                  size="sm"
                />

                <!-- Content -->
                <div class="col">
                  <div class="text-weight-medium">{{ issue.title }}</div>
                  <div class="text-caption text-grey-7 q-mt-xs">
                    {{ issue.message }}
                  </div>

                  <!-- Additional details -->
                  <div v-if="issue.details" class="q-mt-sm">
                    <q-expansion-item
                      dense
                      label="Детайли"
                      icon="info"
                      header-class="text-caption"
                    >
                      <q-card flat bordered class="q-mt-xs bg-grey-1">
                        <q-card-section class="text-caption">
                          <pre class="q-ma-none" style="white-space: pre-wrap">{{ issue.details }}</pre>
                        </q-card-section>
                      </q-card>
                    </q-expansion-item>
                  </div>

                  <!-- Timestamp -->
                  <div v-if="issue.timestamp" class="text-caption text-grey-5 q-mt-xs">
                    {{ formatTimestamp(issue.timestamp) }}
                  </div>

                  <!-- Action Button -->
                  <div v-if="issue.actionButton" class="q-mt-sm">
                    <q-btn
                      :label="issue.actionButton.label"
                      :icon="issue.actionButton.icon"
                      color="primary"
                      size="sm"
                      @click="issue.actionButton.handler"
                      :loading="actionLoading"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>

      <!-- Footer -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Затвори" color="primary" @click="closeModal" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const actionLoading = ref(false)

export interface SystemIssue {
  severity: 'critical' | 'warning' | 'info'
  icon: string
  color: string
  title: string
  message: string
  details?: string
  timestamp?: Date
  actionButton?: {
    label: string
    icon?: string
    handler: () => Promise<void>
  }
}

interface Props {
  modelValue: boolean
  issues: SystemIssue[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const headerIcon = computed(() => {
  if (props.issues.length === 0) return 'check_circle'

  const hasCritical = props.issues.some(i => i.severity === 'critical')
  if (hasCritical) return 'error'

  const hasWarning = props.issues.some(i => i.severity === 'warning')
  if (hasWarning) return 'warning'

  return 'info'
})

const headerColor = computed(() => {
  if (props.issues.length === 0) return 'positive'

  const hasCritical = props.issues.some(i => i.severity === 'critical')
  if (hasCritical) return 'negative'

  const hasWarning = props.issues.some(i => i.severity === 'warning')
  if (hasWarning) return 'warning'

  return 'info'
})

const headerTitle = computed(() => {
  if (props.issues.length === 0) {
    return 'Статус на системата'
  }

  const count = props.issues.length
  return `Системни проблеми (${count})`
})

function closeModal() {
  emit('update:modelValue', false)
}

function formatTimestamp(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'Току-що'
  if (minutes < 60) return `Преди ${minutes} мин`
  if (hours < 24) return `Преди ${hours} ч`

  return timestamp.toLocaleString('bg-BG')
}
</script>

<style lang="scss" scoped>
.issue-card {
  border-left: 4px solid transparent;

  &.issue-critical {
    border-left-color: #c10015;
    background-color: rgba(193, 0, 21, 0.05);
  }

  &.issue-warning {
    border-left-color: #f2c037;
    background-color: rgba(242, 192, 55, 0.05);
  }

  &.issue-info {
    border-left-color: #31ccec;
    background-color: rgba(49, 204, 236, 0.05);
  }
}

pre {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}
</style>
