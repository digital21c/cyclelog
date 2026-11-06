<script setup lang="ts">
import { computed, useId } from 'vue'

import type { RideSort, RideSortField, SortDirection } from '@/models/rideSort'

/**
 * Two-way bound sort selection: `<RideSortControls v-model="sort" />`.
 * Emits a new RideSort object on every change; never mutates the one given.
 */
const sort = defineModel<RideSort>({ required: true })

const fieldOptions: { value: RideSortField; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'distance', label: 'Distance' },
  { value: 'elevation', label: 'Climb' },
]

const directionLabels: Record<RideSortField, Record<SortDirection, string>> = {
  date: { desc: 'Newest first', asc: 'Oldest first' },
  distance: { desc: 'Longest first', asc: 'Shortest first' },
  elevation: { desc: 'Most climbing first', asc: 'Least climbing first' },
}

const directionLabel = computed(() => directionLabels[sort.value.field][sort.value.direction])

// Unique per component instance, so two sort controls on one page wouldn't clash.
const radioGroupName = useId()

function selectField(field: RideSortField): void {
  sort.value = { ...sort.value, field }
}

function reverseDirection(): void {
  sort.value = { ...sort.value, direction: sort.value.direction === 'asc' ? 'desc' : 'asc' }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <fieldset class="flex items-center gap-2">
      <legend class="sr-only">Sort rides by</legend>
      <span aria-hidden="true" class="text-sm text-slate-600 dark:text-slate-400">Sort by</span>

      <div
        class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800"
      >
        <label
          v-for="option in fieldOptions"
          :key="option.value"
          class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 select-none hover:bg-slate-100 has-checked:bg-slate-900 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sky-600 dark:text-slate-200 dark:hover:bg-slate-700 dark:has-checked:bg-slate-100 dark:has-checked:text-slate-900"
        >
          <input
            type="radio"
            class="sr-only"
            :name="radioGroupName"
            :value="option.value"
            :checked="sort.field === option.value"
            @change="selectField(option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </fieldset>

    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      @click="reverseDirection"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        class="size-4 transition-transform"
        :class="{ 'rotate-180': sort.direction === 'asc' }"
      >
        <path
          d="M10 3v14m0 0-5-5m5 5 5-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="sr-only">Order:</span>
      {{ directionLabel }}
    </button>
  </div>
</template>
