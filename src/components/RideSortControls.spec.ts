import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import type { RideSort } from '@/models/rideSort'

import RideSortControls from './RideSortControls.vue'

/**
 * Mounts the controls as `v-model` would use them: `modelValue` in, and
 * `update:modelValue` out, which we feed back in to mimic the parent.
 */
function mountControls(initial: RideSort) {
  const wrapper = mount(RideSortControls, {
    props: {
      modelValue: initial,
      'onUpdate:modelValue': (value: RideSort) => wrapper.setProps({ modelValue: value }),
    },
  })
  return wrapper
}

function emittedSorts(wrapper: ReturnType<typeof mountControls>): RideSort[] {
  return (wrapper.emitted('update:modelValue') ?? []).map(([value]) => value as RideSort)
}

describe('RideSortControls', () => {
  it('checks the radio button for the current field', () => {
    const wrapper = mountControls({ field: 'distance', direction: 'desc' })
    const checked = wrapper.findAll('input[type="radio"]').filter((input) => {
      return (input.element as HTMLInputElement).checked
    })
    expect(checked.map((input) => input.attributes('value'))).toEqual(['distance'])
  })

  it('emits a new field, keeping the direction', async () => {
    const wrapper = mountControls({ field: 'date', direction: 'asc' })
    await wrapper.get('input[value="elevation"]').setValue(true)
    expect(emittedSorts(wrapper)).toEqual([{ field: 'elevation', direction: 'asc' }])
  })

  it('reverses the direction when the order button is clicked', async () => {
    const wrapper = mountControls({ field: 'date', direction: 'desc' })
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    expect(emittedSorts(wrapper)).toEqual([
      { field: 'date', direction: 'asc' },
      { field: 'date', direction: 'desc' },
    ])
  })

  it.each<[RideSort, string]>([
    [{ field: 'date', direction: 'desc' }, 'Newest first'],
    [{ field: 'date', direction: 'asc' }, 'Oldest first'],
    [{ field: 'distance', direction: 'desc' }, 'Longest first'],
    [{ field: 'distance', direction: 'asc' }, 'Shortest first'],
    [{ field: 'elevation', direction: 'desc' }, 'Most climbing first'],
    [{ field: 'elevation', direction: 'asc' }, 'Least climbing first'],
  ])('labels %o as "%s"', (sort, label) => {
    expect(mountControls(sort).get('button').text()).toContain(label)
  })

  it('groups the field options under an accessible legend', () => {
    const wrapper = mountControls({ field: 'date', direction: 'desc' })
    expect(wrapper.get('fieldset legend').text()).toBe('Sort rides by')
  })
})
