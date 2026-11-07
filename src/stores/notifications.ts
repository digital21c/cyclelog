import { ref } from 'vue'
import { defineStore } from 'pinia'

/** How long a message stays on screen (the countdown pauses on hover/focus). */
export const NOTICE_DISPLAY_MS = 6000

export interface Notice {
  /** Changes for every message, so a repeated message still restarts its timer. */
  id: number
  message: string
}

/**
 * Short confirmations such as "Ride added: Uriarra Loop." shown by
 * NotificationToast. A store (rather than component state) because the
 * message must survive navigation: it's raised on the Add page and seen on
 * the list.
 *
 * One message at a time: a new one replaces whatever is showing.
 * How long it stays is a display concern, handled by the component.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const current = ref<Notice | null>(null)
  let nextId = 1 // scoped to this store instance, not module-global

  function notify(message: string): void {
    current.value = { id: nextId++, message }
  }

  /** Clears the message, or only the given one if it's still showing. */
  function dismiss(id?: number): void {
    if (id === undefined || current.value?.id === id) current.value = null
  }

  return { current, notify, dismiss }
})
