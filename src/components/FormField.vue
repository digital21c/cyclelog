<script setup lang="ts">
import { computed, useId } from 'vue'

/**
 * A labelled form field with an optional hint and error message.
 *
 * The input itself is supplied through a *scoped slot*: FormField hands the
 * slot the id and ARIA values it needs, so every field is wired up the same
 * way without FormField having to know what kind of input it contains:
 *
 *   <FormField label="Name" :error="errors.name" v-slot="{ id, describedBy, invalid }">
 *     <input :id="id" :aria-describedby="describedBy" :aria-invalid="invalid" />
 *   </FormField>
 */
const props = defineProps<{
  label: string
  hint?: string
  error?: string
}>()

defineSlots<{
  default(props: { id: string; describedBy: string | undefined; invalid: boolean }): unknown
}>()

const inputId = useId()
const hintId = `${inputId}-hint`
const errorId = `${inputId}-error`

const slotProps = computed(() => ({
  id: inputId,
  // Screen readers read these, in order, after the label.
  describedBy:
    [props.hint ? hintId : null, props.error ? errorId : null].filter(Boolean).join(' ') ||
    undefined,
  invalid: Boolean(props.error),
}))
</script>

<template>
  <div>
    <label :for="inputId" class="block text-sm font-medium">{{ label }}</label>
    <p v-if="hint" :id="hintId" class="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
      {{ hint }}
    </p>
    <div class="mt-1">
      <slot v-bind="slotProps" />
    </div>
    <p v-if="error" :id="errorId" class="mt-1 text-sm text-red-700 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>
