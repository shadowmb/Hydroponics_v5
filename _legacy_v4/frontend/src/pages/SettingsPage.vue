<template>
  <q-page class="q-pa-md">
    <div class="page-header q-mb-lg">
      <h4 class="q-ma-none text-weight-bold">Настройки на системата</h4>
      <p class="text-grey-6 q-mb-none">Конфигурация и настройки на хидропонната система</p>
    </div>
    
    <q-tabs 
      v-model="activeTab" 
      class="bg-grey-1 text-grey-8 shadow-1 rounded-borders q-mb-md"
      active-color="hydro-green"
      indicator-color="hydro-green"
      align="justify"
      dense
    >
      <q-tab 
        name="general" 
        label="Основни" 
        icon="settings"
        class="text-weight-medium"
      />
      <q-tab 
        name="programs" 
        label="Програми" 
        icon="science"
        class="text-weight-medium"
      />
      <q-tab 
        name="devices" 
        label="Устройства" 
        icon="devices"
        class="text-weight-medium"
      />
      <q-tab 
        name="alerts" 
        label="Аларми" 
        icon="notifications"
        class="text-weight-medium"
      />
    </q-tabs>

    <q-tab-panels 
      v-model="activeTab" 
      animated 
      transition-prev="jump-down" 
      transition-next="jump-up"
      keep-alive
      class="bg-transparent"
    >
      <q-tab-panel name="general" class="q-pa-none">
        <SettingsTabGeneral />
      </q-tab-panel>
      
      <q-tab-panel name="programs" class="q-pa-none">
        <SettingsTabPrograms />
      </q-tab-panel>
      
      <q-tab-panel name="devices" class="q-pa-none">
        <SettingsTabDevices />
      </q-tab-panel>
      
      <q-tab-panel name="alerts" class="q-pa-none">
        <SettingsTabAlerts />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsTabGeneral from 'components/settings/SettingsTabGeneral.vue'
import SettingsTabPrograms from 'components/settings/SettingsTabPrograms.vue'
import SettingsTabDevices from 'components/settings/SettingsTabDevices.vue'
import SettingsTabAlerts from 'components/settings/SettingsTabAlerts.vue'

const route = useRoute()
const router = useRouter()

// Active tab state - initialized from query parameter or default to 'general'
const activeTab = ref(route.query.tab as string || 'general')

// Watch for activeTab changes and update URL query
watch(activeTab, (newTab) => {
  if (newTab !== route.query.tab) {
    router.push({ path: '/settings', query: { tab: newTab } })
  }
})

// Watch for route changes and update activeTab
watch(() => route.query.tab, (newTab) => {
  if (newTab && newTab !== activeTab.value) {
    activeTab.value = newTab as string
  }
})

// TODO: IMPLEMENT_LATER - Add logic for tab state management
// TODO: IMPLEMENT_LATER - Integrate with Pinia stores when tab content is implemented
// TODO: IMPLEMENT_LATER - Add loading states and error handling
</script>

<style scoped>
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}

.q-tabs {
  border-radius: 8px;
}

.q-tab-panels {
  min-height: 400px;
}

/* Custom styling for hydro-green color */
:deep(.q-tab--active) {
  color: var(--q-hydro-green) !important;
}

:deep(.q-tabs__indicator) {
  background-color: var(--q-hydro-green) !important;
}
</style>