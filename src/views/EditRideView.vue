<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

import AlertMessage from '@/components/AlertMessage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import RideForm from '@/components/RideForm.vue'
import { useReturnToList } from '@/composables/useReturnToList'
import { useRideSave } from '@/composables/useRideSave'
import { rideToDraft } from '@/models/rideDraft'
import { useNotificationsStore } from '@/stores/notifications'
import { useRidesStore } from '@/stores/rides'
import { formatRideDate } from '@/utils/formatting'
import { todayIsoDate } from '@/utils/isoDate'

/** The ride's id, passed in from the URL by the router (`props: true`). */
const props = defineProps<{
  id: string
}>()

const ridesStore = useRidesStore()
const notifications = useNotificationsStore()
const { loadStatus, loadError } = storeToRefs(ridesStore)
const returnToList = useReturnToList()

const today = todayIsoDate()

// Reactive: re-evaluates when rides finish loading, or if the id changes.
const ride = computed(() => ridesStore.findRide(props.id))
const isLoading = computed(() => loadStatus.value === 'idle' || loadStatus.value === 'loading')

const { fieldErrors, saveError, submitting, submit } = useRideSave(
  (input) => ridesStore.updateRide(props.id, input),
  {
    onSaved: (ride) => {
      notifications.notify(`Changes saved: ${ride.name}.`)
      returnToList()
    },
  },
)

// --- Delete ------------------------------------------------------------------

const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
// Set once deleted, so the page shows "Ride deleted." while navigating away,
// rather than briefly flashing "That ride couldn't be found."
const deleted = ref(false)

function askToDelete(): void {
  deleteError.value = null
  confirmingDelete.value = true
}

async function deleteRide(): Promise<void> {
  deleting.value = true
  deleteError.value = null
  // Read the name now: once deleted, the ride is gone from the store.
  const name = ride.value?.name
  try {
    await ridesStore.deleteRide(props.id)
    notifications.notify(name ? `Ride deleted: ${name}.` : 'Ride deleted.')
    deleted.value = true
    confirmingDelete.value = false
    returnToList()
  } catch (error) {
    // Storage failed: the ride is still there. Keep the dialog open with the reason.
    deleteError.value = error instanceof Error ? error.message : String(error)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section aria-labelledby="edit-ride-heading" class="max-w-md">
    <h1 id="edit-ride-heading" class="text-2xl font-bold">Edit ride</h1>

    <p v-if="isLoading" role="status" class="mt-4 text-slate-600 dark:text-slate-400">
      Loading ride…
    </p>

    <AlertMessage
      v-else-if="loadStatus === 'error'"
      class="mt-4"
      title="Your rides couldn't be loaded."
      :message="loadError"
    />

    <p v-else-if="deleted" role="status" class="mt-4 text-slate-600 dark:text-slate-400">
      Ride deleted.
    </p>

    <div v-else-if="!ride" class="mt-4 space-y-2 text-slate-600 dark:text-slate-400">
      <p>That ride couldn't be found. It may have been deleted.</p>
      <RouterLink
        :to="{ name: 'home' }"
        class="font-medium text-sky-700 underline hover:text-sky-800 dark:text-sky-400"
      >
        Back to your rides
      </RouterLink>
    </div>

    <template v-else>
      <AlertMessage
        v-if="saveError"
        class="mt-4"
        title="Your changes couldn't be saved."
        :message="saveError"
      />

      <!-- :key re-creates the form (and its local draft) if a different ride is shown. -->
      <RideForm
        :key="ride.id"
        class="mt-6"
        :initial-draft="rideToDraft(ride)"
        :max-date="today"
        :errors="fieldErrors"
        :submitting="submitting"
        submit-label="Save changes"
        @submit="submit"
        @cancel="returnToList"
      />

      <!-- Kept apart from Save/Cancel so it isn't pressed by mistake. -->
      <div class="mt-10 border-t border-slate-200 pt-6 dark:border-slate-700">
        <button
          type="button"
          class="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          @click="askToDelete"
        >
          Delete ride
        </button>
      </div>

      <ConfirmDialog
        v-model:open="confirmingDelete"
        title="Delete this ride?"
        confirm-label="Delete ride"
        busy-label="Deleting…"
        :busy="deleting"
        :error="deleteError"
        @confirm="deleteRide"
      >
        <p>
          <strong class="font-semibold">{{ ride.name }}</strong> on
          {{ formatRideDate(ride.date) }} will be permanently deleted. This can't be undone.
        </p>
      </ConfirmDialog>
    </template>
  </section>
</template>
