<template>
  <q-banner class="q-mt-md bg-grey-2">
    <template v-slot:avatar>
      <q-icon name="engineering" color="primary" />
    </template>
    <div class="text-h6 q-mb-sm">Задачи</div>
    <div class="text-body2">
      TODO: Съдържанието ще бъде имплементирано в следващите фази
    </div>
    <div class="text-caption text-grey-6 q-mt-sm">
      Тук ще се управляват задачите (EC, pH, обем, поливане), създаване на нови задачи и дефиниране на действия.
    </div>
  </q-banner>
</template>

<script setup lang="ts">
// TODO: Implement TasksTab logic
// - Task structure and action sequences
// - Device selection and action types
// - Task execution behavior and retry logic
// - CRUD operations for tasks
</script>

<style scoped>
.q-banner {
  border-radius: 8px;
}
</style>