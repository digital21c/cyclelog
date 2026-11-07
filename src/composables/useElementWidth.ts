import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * The current width of an element, in CSS pixels, kept up to date as the
 * layout changes (window resized, phone rotated) via ResizeObserver.
 *
 * `fallback` is used until the element is measured, and wherever
 * ResizeObserver isn't available (e.g. in jsdom tests).
 */
export function useElementWidth(
  target: Readonly<Ref<HTMLElement | null>>,
  fallback = 600,
): Ref<number> {
  const width = ref(fallback)
  let observer: ResizeObserver | undefined

  onMounted(() => {
    const element = target.value
    if (!element) return
    if (element.clientWidth > 0) width.value = element.clientWidth
    if (typeof ResizeObserver === 'undefined') return

    observer = new ResizeObserver(([entry]) => {
      const measured = Math.round(entry?.contentRect.width ?? 0)
      if (measured > 0) width.value = measured
    })
    observer.observe(element)
  })

  // Stop observing when the component goes away, or the observer leaks.
  onBeforeUnmount(() => observer?.disconnect())

  return width
}
