import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, useTemplateRef } from 'vue'

import { useElementWidth } from './useElementWidth'

/**
 * jsdom has no layout engine and no ResizeObserver, so these tests supply a
 * fake one whose callback they can call, as the browser would on a resize.
 */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  observed: Element[] = []
  disconnected = false

  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this)
  }

  observe(element: Element): void {
    this.observed.push(element)
  }

  unobserve(): void {}

  disconnect(): void {
    this.disconnected = true
  }

  /** Simulates the browser reporting a new size. */
  resize(width: number): void {
    const entry = { contentRect: { width } } as ResizeObserverEntry
    this.callback([entry], this as unknown as ResizeObserver)
  }
}

/** A minimal component that measures its own root element. */
const Measured = defineComponent({
  setup(_, { expose }) {
    const box = useTemplateRef<HTMLElement>('box')
    const width = useElementWidth(box, 600)
    expose({ width })
    return () => h('div', { ref: 'box' }, `${width.value}`)
  },
})

afterEach(() => {
  vi.unstubAllGlobals()
  FakeResizeObserver.instances = []
})

describe('useElementWidth', () => {
  it('uses the fallback width where ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    expect(mount(Measured).text()).toBe('600')
  })

  it('observes the element once mounted', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const wrapper = mount(Measured)
    expect(FakeResizeObserver.instances[0]?.observed).toEqual([wrapper.element])
  })

  it('follows the element as it is resized, e.g. when a phone is rotated', async () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const wrapper = mount(Measured)
    const observer = FakeResizeObserver.instances[0]

    observer?.resize(343.4)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('343')

    observer?.resize(812)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('812')
  })

  it('ignores a zero width, e.g. while the element is hidden', async () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const wrapper = mount(Measured)

    FakeResizeObserver.instances[0]?.resize(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('600')
  })

  it("starts from the element's current width when it has one", async () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const clientWidth = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(420)
    const wrapper = mount(Measured)
    await wrapper.vm.$nextTick() // measured in onMounted; shown after the next update
    expect(wrapper.text()).toBe('420')
    clientWidth.mockRestore()
  })

  it('stops observing when the component is removed, so nothing leaks', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const wrapper = mount(Measured)
    wrapper.unmount()
    expect(FakeResizeObserver.instances[0]?.disconnected).toBe(true)
  })
})
