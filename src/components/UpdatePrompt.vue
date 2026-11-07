<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

/**
 * Registers the service worker and tells the user about it:
 * - once installed: "ready to work offline";
 * - when a new version has downloaded: offers to reload into it.
 * Nothing is reloaded without the user's say-so.
 */

// An installed app can stay open for days; look for a new version hourly.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    setInterval(() => {
      // Offline, there's nothing to fetch; the check simply waits for next time.
      if (navigator.onLine) registration.update().catch(() => {})
    }, UPDATE_CHECK_INTERVAL_MS)
  },
})

function dismiss(): void {
  offlineReady.value = false
  needRefresh.value = false
}

function reloadIntoNewVersion(): void {
  void updateServiceWorker(true) // activates the new version, then reloads the page
}
</script>

<template>
  <!-- The live region stays in the page so screen readers announce new messages. -->
  <div role="status" class="pointer-events-none fixed inset-x-4 bottom-4 z-10">
    <div
      v-if="needRefresh || offlineReady"
      class="pointer-events-auto mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      <p class="grow">
        {{
          needRefresh
            ? 'A new version of CycleLog is available.'
            : 'CycleLog is ready to work offline.'
        }}
      </p>

      <div class="flex gap-2">
        <button
          v-if="needRefresh"
          type="button"
          class="rounded-lg bg-sky-700 px-3 py-1.5 font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          @click="reloadIntoNewVersion"
        >
          Reload
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-slate-600 dark:hover:bg-slate-700"
          @click="dismiss"
        >
          {{ needRefresh ? 'Later' : 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>
