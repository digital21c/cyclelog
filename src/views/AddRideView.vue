<script setup lang="ts">
import AlertMessage from '@/components/AlertMessage.vue'
import RideForm from '@/components/RideForm.vue'
import { useReturnToList } from '@/composables/useReturnToList'
import { useRideSave } from '@/composables/useRideSave'
import { emptyRideDraft } from '@/models/rideDraft'
import { useRidesStore } from '@/stores/rides'
import { todayIsoDate } from '@/utils/isoDate'

const ridesStore = useRidesStore()
const returnToList = useReturnToList()

const today = todayIsoDate()
const initialDraft = emptyRideDraft(today)

const { fieldErrors, saveError, submitting, submit } = useRideSave(
  (input) => ridesStore.addRide(input),
  { onSaved: returnToList },
)
</script>

<template>
  <section aria-labelledby="add-ride-heading" class="max-w-md">
    <h1 id="add-ride-heading" class="text-2xl font-bold">Add ride</h1>

    <AlertMessage
      v-if="saveError"
      class="mt-4"
      title="The ride couldn't be saved."
      :message="saveError"
    />

    <RideForm
      class="mt-6"
      :initial-draft="initialDraft"
      :max-date="today"
      :errors="fieldErrors"
      :submitting="submitting"
      @submit="submit"
      @cancel="returnToList"
    />
  </section>
</template>
