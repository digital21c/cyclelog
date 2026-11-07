import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { NOTICE_DISPLAY_MS, useNotificationsStore } from '@/stores/notifications'

import NotificationToast from './NotificationToast.vue'

beforeEach(() => {
  vi.useFakeTimers() // control the auto-dismiss countdown
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.useRealTimers()
})

function mountToast() {
  const store = useNotificationsStore()
  const wrapper = mount(NotificationToast)
  return { wrapper, store }
}

function shownText(wrapper: ReturnType<typeof mountToast>['wrapper']): string {
  return wrapper.get('[role="status"]').text()
}

describe('NotificationToast', () => {
  it('keeps an empty live region until there is a message', () => {
    const { wrapper } = mountToast()
    expect(wrapper.get('[role="status"]').text()).toBe('')
  })

  it('shows the current message', async () => {
    const { wrapper, store } = mountToast()
    store.notify('Ride added: Uriarra Loop.')
    await wrapper.vm.$nextTick()
    expect(shownText(wrapper)).toContain('Ride added: Uriarra Loop.')
  })

  it('disappears after the display time', async () => {
    const { wrapper, store } = mountToast()
    store.notify('Ride added: Uriarra Loop.')
    await wrapper.vm.$nextTick()

    vi.advanceTimersByTime(NOTICE_DISPLAY_MS - 1)
    expect(store.current).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(store.current).toBeNull()
  })

  it('gives a newer message the full display time', async () => {
    const { wrapper, store } = mountToast()
    store.notify('First')
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(NOTICE_DISPLAY_MS - 1000)

    store.notify('Second')
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(NOTICE_DISPLAY_MS - 1)
    expect(store.current?.message).toBe('Second')
  })

  it('replaces the text in place, never showing two messages at once', async () => {
    const { wrapper, store } = mountToast()
    store.notify('Changes saved: Cotter Loop.')
    await wrapper.vm.$nextTick()
    store.notify('Ride deleted: Cotter Loop.')
    await wrapper.vm.$nextTick()

    const messages = wrapper.findAll('[role="status"] p')
    expect(messages.map((message) => message.text())).toEqual(['Ride deleted: Cotter Loop.'])
  })

  it('waits while the pointer is over it, then resumes', async () => {
    const { wrapper, store } = mountToast()
    store.notify('Ride deleted: Red Hill Climb.')
    await wrapper.vm.$nextTick()
    const toast = wrapper.get('[role="status"] div')

    await toast.trigger('mouseenter')
    vi.advanceTimersByTime(NOTICE_DISPLAY_MS * 3)
    expect(store.current).not.toBeNull()

    await toast.trigger('mouseleave')
    vi.advanceTimersByTime(NOTICE_DISPLAY_MS)
    expect(store.current).toBeNull()
  })

  it('waits while it has keyboard focus', async () => {
    const { wrapper, store } = mountToast()
    store.notify('Changes saved: Cotter Loop.')
    await wrapper.vm.$nextTick()

    await wrapper.get('[role="status"] div').trigger('focusin')
    vi.advanceTimersByTime(NOTICE_DISPLAY_MS * 3)
    expect(store.current).not.toBeNull()
  })

  it('can be dismissed straight away', async () => {
    const { wrapper, store } = mountToast()
    store.notify('Ride added: Uriarra Loop.')
    await wrapper.vm.$nextTick()

    const dismiss = wrapper.get('button')
    expect(dismiss.attributes('aria-label')).toBe('Dismiss message')
    await dismiss.trigger('click')
    expect(store.current).toBeNull()
  })
})
