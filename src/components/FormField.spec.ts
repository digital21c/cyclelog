import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

import FormField from './FormField.vue'

/**
 * Mounts FormField with a plain input in its scoped slot, wired up the way
 * RideForm does it, so the test sees what a screen reader would.
 */
function mountField(props: { label: string; hint?: string; error?: string }) {
  return mount(FormField, {
    props,
    slots: {
      default: (slot: { id: string; describedBy: string | undefined; invalid: boolean }) =>
        h('input', {
          id: slot.id,
          'aria-describedby': slot.describedBy,
          'aria-invalid': slot.invalid,
        }),
    },
  })
}

/** The text of each element the input's aria-describedby points at, in order. */
function descriptions(wrapper: ReturnType<typeof mountField>): string[] {
  const ids = wrapper.get('input').attributes('aria-describedby')?.split(' ') ?? []
  return ids.map((id) => wrapper.get(`#${CSS.escape(id)}`).text())
}

describe('FormField', () => {
  it('labels the input', () => {
    const wrapper = mountField({ label: 'Climb (m)' })
    expect(wrapper.get('label').attributes('for')).toBe(wrapper.get('input').attributes('id'))
    expect(wrapper.get('label').text()).toBe('Climb (m)')
  })

  it('has no description and is valid with neither hint nor error', () => {
    const wrapper = mountField({ label: 'Climb (m)' })
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('false')
  })

  it('describes the input with its hint', () => {
    const wrapper = mountField({ label: 'Climb (m)', hint: 'Whole metres' })
    expect(descriptions(wrapper)).toEqual(['Whole metres'])
  })

  it('marks the input invalid and describes it with the error', () => {
    const wrapper = mountField({ label: 'Climb (m)', error: 'Climb must be a whole number.' })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(descriptions(wrapper)).toEqual(['Climb must be a whole number.'])
  })

  it('reads the hint before the error when there are both', () => {
    const wrapper = mountField({
      label: 'Climb (m)',
      hint: 'Whole metres',
      error: 'Climb must be a whole number.',
    })
    expect(descriptions(wrapper)).toEqual(['Whole metres', 'Climb must be a whole number.'])
  })

  it('gives each field in the same app its own ids', () => {
    // useId() is unique within one app, so both fields must share a parent.
    const input = (slot: { id: string }) => h('input', { id: slot.id })
    const wrapper = mount({
      render: () => [
        h(FormField, { label: 'A' }, { default: input }),
        h(FormField, { label: 'B' }, { default: input }),
      ],
    })
    const ids = wrapper.findAll('input').map((field) => field.attributes('id'))
    expect(new Set(ids).size).toBe(2)
  })
})
