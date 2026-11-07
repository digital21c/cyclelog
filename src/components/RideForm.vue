<script setup lang="ts">
import { nextTick, reactive, ref, useTemplateRef, watch } from 'vue'

import type { RideInput } from '@/models/ride'
import { draftToRideInput, type RideDraft } from '@/models/rideDraft'
import { RIDE_NAME_MAX_LENGTH, type RideInputErrors } from '@/models/rideValidation'
import type { IsoDate } from '@/utils/isoDate'

import FormField from './FormField.vue'

/**
 * The ride form, used for adding (and later editing) a ride.
 * Presentational: it knows nothing about stores or saving. It emits a typed
 * RideInput on submit and shows whatever errors the parent passes back.
 */
const props = withDefaults(
  defineProps<{
    initialDraft: RideDraft
    /** Latest selectable date, normally today. */
    maxDate: IsoDate
    errors?: RideInputErrors
    submitting?: boolean
    submitLabel?: string
  }>(),
  { errors: () => ({}), submitting: false, submitLabel: 'Save ride' },
)

const emit = defineEmits<{
  submit: [input: RideInput]
  cancel: []
}>()

// A local copy: the form edits its own draft, never the parent's object.
const draft = reactive<RideDraft>({ ...props.initialDraft })

// Fields edited since the current errors arrived; their errors are hidden.
const editedSinceErrors = ref(new Set<keyof RideDraft>())

const form = useTemplateRef('form')

function errorFor(field: keyof RideDraft): string | undefined {
  return editedSinceErrors.value.has(field) ? undefined : props.errors[field]
}

function markEdited(field: keyof RideDraft): void {
  editedSinceErrors.value.add(field)
}

function submit(): void {
  emit('submit', draftToRideInput(draft))
}

// When a new set of errors arrives, show them all and move keyboard focus
// to the first invalid field. nextTick waits until Vue has updated the DOM.
watch(
  () => props.errors,
  async () => {
    editedSinceErrors.value = new Set()
    await nextTick()
    form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  },
)

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base ' +
  'focus:border-sky-600 focus:ring-2 focus:ring-sky-600/30 focus:outline-none ' +
  'aria-[invalid=true]:border-red-600 aria-[invalid=true]:focus:ring-red-600/30 ' +
  'dark:border-slate-600 dark:bg-slate-800 dark:aria-[invalid=true]:border-red-400'
</script>

<template>
  <form ref="form" novalidate class="space-y-5" @submit.prevent="submit">
    <FormField v-slot="{ id, describedBy, invalid }" label="Date" :error="errorFor('date')">
      <input
        :id="id"
        v-model="draft.date"
        type="date"
        :max="maxDate"
        required
        :aria-invalid="invalid"
        :aria-describedby="describedBy"
        :class="inputClass"
        @input="markEdited('date')"
      />
    </FormField>

    <FormField v-slot="{ id, describedBy, invalid }" label="Ride name" :error="errorFor('name')">
      <input
        :id="id"
        v-model="draft.name"
        type="text"
        :maxlength="RIDE_NAME_MAX_LENGTH"
        autocomplete="off"
        required
        :aria-invalid="invalid"
        :aria-describedby="describedBy"
        :class="inputClass"
        @input="markEdited('name')"
      />
    </FormField>

    <div class="grid grid-cols-2 gap-4">
      <FormField
        v-slot="{ id, describedBy, invalid }"
        label="Distance (km)"
        :error="errorFor('distanceKm')"
      >
        <input
          :id="id"
          v-model="draft.distanceKm"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          required
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
          :class="inputClass"
          @input="markEdited('distanceKm')"
        />
      </FormField>

      <FormField
        v-slot="{ id, describedBy, invalid }"
        label="Climb (m)"
        :error="errorFor('elevationM')"
      >
        <input
          :id="id"
          v-model="draft.elevationM"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          required
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
          :class="inputClass"
          @input="markEdited('elevationM')"
        />
      </FormField>
    </div>

    <div class="flex flex-wrap gap-3 pt-2">
      <button
        type="submit"
        :disabled="submitting"
        class="rounded-lg bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ submitting ? 'Saving…' : submitLabel }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>
