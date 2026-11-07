<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import { useRidesStore } from '@/stores/rides'

// Load rides once, at startup, so every page can read them from the store.
// Store actions keep state in step with storage afterwards, so no page needs
// to reload. loadRides never rejects: failures are recorded in loadError.
const ridesStore = useRidesStore()
void ridesStore.loadRides()
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <header class="border-b border-slate-200 dark:border-slate-700">
      <div class="mx-auto max-w-3xl px-4 py-3">
        <RouterLink
          :to="{ name: 'home' }"
          class="rounded text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          CycleLog
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
