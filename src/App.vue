<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import UpdatePrompt from '@/components/UpdatePrompt.vue'
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
      <div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <RouterLink
          :to="{ name: 'home' }"
          class="rounded text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          CycleLog
        </RouterLink>

        <nav aria-label="Main">
          <!-- RouterLink sets aria-current="page" on the link for the current page. -->
          <RouterLink
            :to="{ name: 'backup' }"
            class="rounded px-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 aria-[current=page]:text-sky-700 aria-[current=page]:underline dark:text-slate-400 dark:hover:text-slate-100 dark:aria-[current=page]:text-sky-400"
          >
            Backup
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-6">
      <RouterView />
    </main>

    <UpdatePrompt />
  </div>
</template>
