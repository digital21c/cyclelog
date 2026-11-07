<script setup lang="ts">
import { computed } from 'vue'

import type { RideSort, RideSortField, SortDirection } from '@/models/rideSort'

import SegmentedControl from './SegmentedControl.vue'

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

function selectField(field: RideSortField): void {
  sort.value = { ...sort.value, field }
}

function reverseDirection(): void {
  sort.value = { ...sort.value, direction: sort.value.direction === 'asc' ? 'desc' : 'asc' }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <SegmentedControl
      :model-value="sort.field"
      :options="fieldOptions"
      legend="Sort rides by"
      label="Sort by"
      @update:model-value="selectField"
    />

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
