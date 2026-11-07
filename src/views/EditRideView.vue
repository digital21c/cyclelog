<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import AlertMessage from '@/components/AlertMessage.vue'
import RideForm from '@/components/RideForm.vue'
import { useReturnToList } from '@/composables/useReturnToList'
import { useRideSave } from '@/composables/useRideSave'
import { rideToDraft } from '@/models/rideDraft'
import { useRidesStore } from '@/stores/rides'
import { todayIsoDate } from '@/utils/isoDate'

/** The ride's id, passed in from the URL by the router (`props: true`). */
const props = defineProps<{
  id: string
}>()

const ridesStore = useRidesStore()
const { loadStatus, loadError } = storeToRefs(ridesStore)
const returnToList = useReturnToList()

const today = todayIsoDate()

// Reactive: re-evaluates when rides finish loading, or if the id changes.
const ride = computed(() => ridesStore.findRide(props.id))
const isLoading = computed(() => loadStatus.value === 'idle' || loadStatus.value === 'loading')

const { fieldErrors, saveError, submitting, submit } = useRideSave(
  (input) => ridesStore.updateRide(props.id, input),
  { onSaved: returnToList },
)
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
    </template>
  </section>
</template>
