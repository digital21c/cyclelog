<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <header class="border-b border-slate-200 dark:border-slate-700">
      <div class="mx-auto max-w-3xl px-4 py-3">
        <p class="text-lg font-semibold">CycleLog</p>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
