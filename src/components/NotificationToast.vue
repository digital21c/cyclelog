<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { NOTICE_DISPLAY_MS, useNotificationsStore } from '@/stores/notifications'

/**
 * Shows the current confirmation ("Ride added: …") briefly at the bottom of
 * the screen. It never takes focus, and screen readers announce it politely.
 *
 * It disappears after NOTICE_DISPLAY_MS, but the countdown pauses while the
 * pointer is over it or it has keyboard focus, so there's always time to read it.
 */
const notifications = useNotificationsStore()
const { current } = storeToRefs(notifications)

let timer: ReturnType<typeof setTimeout> | undefined

function stopTimer(): void {
  clearTimeout(timer)
  timer = undefined
}

function startTimer(): void {
  stopTimer()
  const notice = current.value
  if (!notice) return
  timer = setTimeout(() => notifications.dismiss(notice.id), NOTICE_DISPLAY_MS)
}

// Each new message (new id) gets a full display time.
watch(() => current.value?.id, startTimer, { immediate: true })
onBeforeUnmount(stopTimer)
</script>

<template>
  <div role="status" class="w-full">
    <!-- Always in the page, so screen readers notice when a message appears.
         Animates only on appearing and disappearing: a replacement message
         just swaps the text in place, so two toasts never overlap. -->
    <Transition
      enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="current"
        class="pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        @mouseenter="stopTimer"
        @mouseleave="startTimer"
        @focusin="stopTimer"
        @focusout="startTimer"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          class="size-5 shrink-0 text-emerald-400 dark:text-emerald-600"
        >
          <path
            d="M4 10.5 8 14.5 16 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="grow">{{ current.message }}</p>
        <button
          type="button"
          class="rounded p-1 text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:text-slate-600 dark:hover:text-slate-900 dark:focus-visible:outline-sky-600"
          aria-label="Dismiss message"
          @click="notifications.dismiss(current.id)"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" class="size-4">
            <path
              d="M5 5l10 10M15 5 5 15"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>
