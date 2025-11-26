<template>
  <q-page class="q-pa-md">
    <div class="page-header q-mb-lg">
      <h4 class="q-ma-none text-weight-bold">Всички програми</h4>
      <p class="text-grey-6 q-mb-none">Управление на хидропонните програми</p>
    </div>
    
    <ProgramsTab />
  </q-page>
</template>

<script setup lang="ts">
import ProgramsTab from 'components/programs/tabs/ProgramsTab.vue'
</script>

<style scoped>
.page-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}
</style>