import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

import SegmentedControl from './SegmentedControl.vue'

const options = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
] as const

function mountControl(modelValue: 'week' | 'month' | 'year', label?: string) {
  const wrapper = mount(SegmentedControl, {
    props: {
      options,
      legend: 'Show totals per',
      label,
      modelValue,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
  })
  return wrapper
}

describe('SegmentedControl', () => {
  it('renders one radio button per option, checking the selected one', () => {
    const wrapper = mountControl('month')
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios.map((radio) => radio.attributes('value'))).toEqual(['week', 'month', 'year'])
    expect(radios.map((radio) => (radio.element as HTMLInputElement).checked)).toEqual([
      false,
      true,
      false,
    ])
  })

  it('emits the chosen value', async () => {
    const wrapper = mountControl('week')
    await wrapper.get('input[value="year"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['year']])
  })

  it('names the group with a legend, and shows the visible label only when given', () => {
    expect(mountControl('week').get('legend').text()).toBe('Show totals per')
    expect(mountControl('week').find('[aria-hidden="true"]').exists()).toBe(false)
    expect(mountControl('week', 'Show').get('[aria-hidden="true"]').text()).toBe('Show')
  })

  it('keeps radio groups separate between instances in one app', () => {
    const wrapper = mount({
      render: () => [
        h(SegmentedControl, { options, legend: 'A', modelValue: 'week' }),
        h(SegmentedControl, { options, legend: 'B', modelValue: 'week' }),
      ],
    })
    const names = new Set(wrapper.findAll('input').map((input) => input.attributes('name')))
    expect(names.size).toBe(2)
  })
})
