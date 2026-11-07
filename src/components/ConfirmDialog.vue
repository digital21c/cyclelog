<script setup lang="ts">
import { onMounted, useId, useTemplateRef, watch } from 'vue'

import AlertMessage from './AlertMessage.vue'

/**
 * A modal confirmation built on the native <dialog> element, which gives us
 * for free: a backdrop, focus kept inside the dialog, Escape to close, and
 * focus returned to the opening button afterwards.
 *
 *   <ConfirmDialog v-model:open="confirming" title="Delete ride?" confirm-label="Delete"
 *                  @confirm="deleteRide">Explanation…</ConfirmDialog>
 */
const open = defineModel<boolean>('open', { required: true })

const props = withDefaults(
  defineProps<{
    title: string
    confirmLabel: string
    /** Shown on the confirm button while `busy`. */
    busyLabel?: string
    /** True while the confirmed action runs: buttons and Escape are disabled. */
    busy?: boolean
    /** An error from the last attempt, shown inside the dialog. */
    error?: string | null
  }>(),
  { busyLabel: 'Working…', busy: false, error: null },
)

const emit = defineEmits<{
  confirm: []
}>()

const dialog = useTemplateRef('dialog')
const titleId = useId()

/** Keeps the <dialog> element's own open state in step with the `open` model. */
function syncDialog(isOpen: boolean): void {
  const element = dialog.value
  if (!element) return
  if (isOpen && !element.open) element.showModal()
  if (!isOpen && element.open) element.close()
}

onMounted(() => syncDialog(open.value))
watch(open, syncDialog, { flush: 'post' })

// The dialog closed itself (Escape, or close() above): reflect that in the model.
function handleClose(): void {
  open.value = false
}

// Escape fires `cancel` first; ignore it while the action is still running.
function handleCancel(event: Event): void {
  if (props.busy) event.preventDefault()
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/60 dark:bg-slate-800 dark:text-slate-100"
    @close="handleClose"
    @cancel="handleCancel"
  >
    <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>

    <div class="mt-2 text-sm text-slate-700 dark:text-slate-300">
      <slot />
    </div>

    <AlertMessage v-if="error" class="mt-4" title="That didn't work." :message="error" />

    <div class="mt-6 flex flex-wrap justify-end gap-3">
      <!-- autofocus: the safe choice gets focus first, so Enter doesn't destroy anything. -->
      <button
        type="button"
        autofocus
        :disabled="busy"
        class="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        @click="open = false"
      >
        Cancel
      </button>
      <button
        type="button"
        :disabled="busy"
        class="rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        @click="emit('confirm')"
      >
        {{ busy ? busyLabel : confirmLabel }}
      </button>
    </div>
  </dialog>
</template>
