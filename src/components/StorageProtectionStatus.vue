<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  getStorageProtection,
  requestStorageProtection,
  type PersistenceApi,
  type StorageProtection,
} from '@/utils/storageProtection'

/** Shows whether the browser will keep the rides, and offers to ask it to. */
const props = defineProps<{
  /** For tests; defaults to the browser's navigator.storage. */
  api?: PersistenceApi
}>()

const protection = ref<StorageProtection | 'checking'>('checking')
const requesting = ref(false)
const declined = ref(false)

onMounted(async () => {
  protection.value = await getStorageProtection(props.api)
})

async function askForProtection(): Promise<void> {
  requesting.value = true
  protection.value = await requestStorageProtection(props.api)
  declined.value = protection.value === 'not-persistent'
  requesting.value = false
}
</script>

<template>
  <div
    class="rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-800"
  >
    <p v-if="protection === 'checking'" class="text-slate-600 dark:text-slate-400">
      Checking storage…
    </p>

    <p v-else-if="protection === 'persistent'">
      <span class="font-semibold text-green-700 dark:text-green-400">Storage is protected.</span>
      This browser has agreed not to clear your rides when the device runs low on space.
    </p>

    <template v-else-if="protection === 'not-persistent'">
      <p>
        <span class="font-semibold text-amber-700 dark:text-amber-400">
          Storage isn't protected.
        </span>
        This browser may clear your rides if the device runs low on space.
      </p>
      <p v-if="declined" class="mt-2 text-slate-600 dark:text-slate-400">
        The browser declined. Installing CycleLog (“Install app”, or “Add to Home Screen” on an
        iPhone) usually helps. Until then, keep regular backups.
      </p>
      <button
        v-else
        type="button"
        :disabled="requesting"
        class="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700"
        @click="askForProtection"
      >
        Ask the browser to protect it
      </button>
    </template>

    <p v-else class="text-slate-600 dark:text-slate-400">
      This browser doesn't say whether it will keep your rides, so keep regular backups.
    </p>
  </div>
</template>
