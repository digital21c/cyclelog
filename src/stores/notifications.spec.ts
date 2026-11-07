import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useNotificationsStore } from './notifications'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useNotificationsStore', () => {
  it('starts with nothing to show', () => {
    expect(useNotificationsStore().current).toBeNull()
  })

  it('shows the latest message, replacing any earlier one', () => {
    const store = useNotificationsStore()
    store.notify('Ride added: Cotter Loop.')
    store.notify('Ride deleted: Red Hill Climb.')
    expect(store.current?.message).toBe('Ride deleted: Red Hill Climb.')
  })

  it('gives each message a new id, even when the text repeats', () => {
    const store = useNotificationsStore()
    store.notify('Changes saved: Cotter Loop.')
    const first = store.current?.id
    store.notify('Changes saved: Cotter Loop.')
    expect(store.current?.id).not.toBe(first)
  })

  it('dismisses the current message', () => {
    const store = useNotificationsStore()
    store.notify('Ride added: Cotter Loop.')
    store.dismiss()
    expect(store.current).toBeNull()
  })

  it("ignores a dismiss aimed at a message that's already been replaced", () => {
    const store = useNotificationsStore()
    store.notify('Old')
    const oldId = store.current?.id
    store.notify('New')
    store.dismiss(oldId)
    expect(store.current?.message).toBe('New')
  })
})
