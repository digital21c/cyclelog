<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import AlertMessage from '@/components/AlertMessage.vue'
import StorageProtectionStatus from '@/components/StorageProtectionStatus.vue'
import { useRideImport } from '@/composables/useRideImport'
import { createBackup } from '@/services/rideBackup'
import { useRidesStore } from '@/stores/rides'
import { downloadTextFile } from '@/utils/download'
import { formatRideCount } from '@/utils/formatting'

const ridesStore = useRidesStore()
const { rides, rideCount, loadStatus, loadError } = storeToRefs(ridesStore)

const isLoading = computed(() => loadStatus.value === 'idle' || loadStatus.value === 'loading')

function downloadBackup(): void {
  const { fileName, contents } = createBackup(rides.value)
  downloadTextFile(fileName, contents)
}

const { state: importState, chooseFile, confirmImport } = useRideImport()

function handleFileChosen(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Clear the input so choosing the same file again still triggers `change`.
  input.value = ''
  if (file) void chooseFile(file)
}

const buttonClass =
  'rounded-lg bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'
</script>

<template>
  <section aria-labelledby="backup-heading" class="max-w-xl">
    <h1 id="backup-heading" class="text-2xl font-bold">Backup</h1>
    <p class="mt-2 text-slate-600 dark:text-slate-400">
      Your rides are stored only in this browser, which can clear them (for example when site data
      is cleared). Download a backup regularly and keep it somewhere safe.
    </p>

    <StorageProtectionStatus class="mt-4" />

    <p v-if="isLoading" role="status" class="mt-6 text-slate-600 dark:text-slate-400">
      Loading rides…
    </p>

    <AlertMessage
      v-else-if="loadStatus === 'error'"
      class="mt-6"
      title="Your rides couldn't be loaded, so backup and import are unavailable."
      :message="loadError"
    />

    <template v-else>
      <section aria-labelledby="export-heading" class="mt-8">
        <h2 id="export-heading" class="text-lg font-semibold">Export</h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Saves all {{ formatRideCount(rideCount) }} to a JSON file on this device.
        </p>
        <button
          type="button"
          class="mt-3"
          :class="buttonClass"
          :disabled="rideCount === 0"
          @click="downloadBackup"
        >
          Download backup
        </button>
      </section>

      <section aria-labelledby="import-heading" class="mt-10">
        <h2 id="import-heading" class="text-lg font-semibold">Import</h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Adds rides from a CycleLog backup file. Rides you already have are never changed or
          removed.
        </p>

        <label for="backup-file" class="mt-3 block text-sm font-medium">Backup file</label>
        <input
          id="backup-file"
          type="file"
          accept=".json,application/json"
          class="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:font-medium file:text-slate-900 hover:file:bg-slate-300 dark:text-slate-300 dark:file:bg-slate-700 dark:file:text-slate-100 dark:hover:file:bg-slate-600"
          @change="handleFileChosen"
        />

        <div class="mt-4">
          <p
            v-if="importState.step === 'reading'"
            role="status"
            class="text-slate-600 dark:text-slate-400"
          >
            Reading {{ importState.fileName }}…
          </p>

          <AlertMessage
            v-else-if="importState.step === 'invalid'"
            :title="`${importState.fileName} can't be imported.`"
            :message="importState.message"
          />

          <div
            v-else-if="importState.step === 'preview'"
            class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
          >
            <p role="status">
              <span class="font-medium">{{ importState.fileName }}</span> contains
              {{ formatRideCount(importState.rides.length) }}:
              {{ importState.plan.newRides.length }} new,
              {{ importState.plan.alreadyPresentCount }} already in CycleLog.
            </p>

            <AlertMessage
              v-if="importState.error"
              class="mt-3"
              title="The rides couldn't be imported."
              :message="importState.error"
            />

            <button
              v-if="importState.plan.newRides.length > 0"
              type="button"
              class="mt-3"
              :class="buttonClass"
              :disabled="importState.importing"
              @click="confirmImport"
            >
              {{
                importState.importing
                  ? 'Importing…'
                  : `Import ${formatRideCount(importState.plan.newRides.length)}`
              }}
            </button>
            <p v-else class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Nothing to import: you already have every ride in this backup.
            </p>
          </div>

          <p v-else-if="importState.step === 'done'" role="status">
            Imported {{ formatRideCount(importState.importedCount) }}.
            <RouterLink
              :to="{ name: 'home' }"
              class="font-medium text-sky-700 underline hover:text-sky-800 dark:text-sky-400"
            >
              View your rides
            </RouterLink>
          </p>
        </div>
      </section>
    </template>
  </section>
</template>
