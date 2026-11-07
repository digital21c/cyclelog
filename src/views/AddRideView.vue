<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import RideForm from '@/components/RideForm.vue'
import type { RideInput } from '@/models/ride'
import { emptyRideDraft } from '@/models/rideDraft'
import type { RideInputErrors } from '@/models/rideValidation'
import { useRidesStore } from '@/stores/rides'
import { todayIsoDate } from '@/utils/isoDate'

const ridesStore = useRidesStore()
const router = useRouter()

const today = todayIsoDate()
const initialDraft = emptyRideDraft(today)

const fieldErrors = ref<RideInputErrors>({})
const saveError = ref<string | null>(null)
const submitting = ref(false)

async function saveRide(input: RideInput): Promise<void> {
  submitting.value = true
  saveError.value = null
  try {
    const result = await ridesStore.addRide(input)
    if (result.valid) {
      returnToList()
    } else {
      fieldErrors.value = result.errors
    }
  } catch (error) {
    // Storage failed (e.g. full or unreadable). Keep the form so nothing typed is lost.
    saveError.value = error instanceof Error ? error.message : String(error)
  } finally {
    submitting.value = false
  }
}

/**
 * Go back to wherever the user came from (normally the list, with its sort
 * preserved in the URL). If they opened this page directly, go to the list.
 */
function returnToList(): void {
  if (router.options.history.state.back) {
    router.back()
  } else {
    void router.push({ name: 'home' })
  }
}
</script>

<template>
  <section aria-labelledby="add-ride-heading" class="max-w-md">
    <h1 id="add-ride-heading" class="text-2xl font-bold">Add ride</h1>

    <div
      v-if="saveError"
      role="alert"
      class="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      <p class="font-semibold">The ride couldn't be saved.</p>
      <p class="mt-1 text-sm">{{ saveError }}</p>
    </div>

    <RideForm
      class="mt-6"
      :initial-draft="initialDraft"
      :max-date="today"
      :errors="fieldErrors"
      :submitting="submitting"
      @submit="saveRide"
      @cancel="returnToList"
    />
  </section>
</template>
