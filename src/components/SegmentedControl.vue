<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'

/**
 * A row of joined buttons where exactly one is selected, e.g.
 * `[ Date | Distance | Climb ]`. Built from native radio buttons inside a
 * fieldset, so arrow keys, focus and screen-reader announcements come free.
 *
 * Generic: `T` is the union of option values, so `v-model` is typed,
 * e.g. `SegmentedControl<'week' | 'month' | 'year'>`.
 */
defineProps<{
  options: readonly { value: T; label: string }[]
  /** Accessible name for the group, e.g. "Sort rides by". */
  legend: string
  /** Optional visible text before the buttons, e.g. "Sort by". */
  label?: string
}>()

const selected = defineModel<T>({ required: true })

// Unique per instance, so two controls on one page never share a radio group.
const groupName = useId()
</script>

<template>
  <fieldset class="flex items-center gap-2">
    <legend class="sr-only">{{ legend }}</legend>
    <span v-if="label" aria-hidden="true" class="text-sm text-slate-600 dark:text-slate-400">
      {{ label }}
    </span>

    <div
      class="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800"
    >
      <label
        v-for="option in options"
        :key="option.value"
        class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 select-none hover:bg-slate-100 has-checked:bg-slate-900 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sky-600 dark:text-slate-200 dark:hover:bg-slate-700 dark:has-checked:bg-slate-100 dark:has-checked:text-slate-900"
      >
        <input
          type="radio"
          class="sr-only"
          :name="groupName"
          :value="option.value"
          :checked="selected === option.value"
          @change="selected = option.value"
        />
        {{ option.label }}
      </label>
    </div>
  </fieldset>
</template>
