import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import type { Ride } from '@/models/ride'

import RideList from './RideList.vue'

function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: 'ride-1',
    date: '2026-11-01',
    name: 'Uriarra Loop',
    distanceKm: 67.25,
    elevationM: 1234,
    createdAt: '2026-11-01T07:00:00.000Z',
    updatedAt: '2026-11-01T07:00:00.000Z',
    ...overrides,
  }
}

describe('RideList', () => {
  it('renders one list item per ride, in the order given', () => {
    const wrapper = mount(RideList, {
      props: {
        rides: [
          makeRide({ id: 'a', name: 'Uriarra Loop' }),
          makeRide({ id: 'b', name: 'Black Mountain Climb' }),
        ],
      },
    })

    const names = wrapper.findAll('li h2').map((heading) => heading.text())
    expect(names).toEqual(['Uriarra Loop', 'Black Mountain Climb'])
  })

  it('shows formatted date, distance and climb for each ride', () => {
    const wrapper = mount(RideList, { props: { rides: [makeRide()] } })
    const item = wrapper.get('li')

    expect(item.get('time').text()).toBe('Sun, 1 Nov 2026')
    expect(item.get('time').attributes('datetime')).toBe('2026-11-01')
    expect(item.text()).toContain('67.3 km')
    expect(item.text()).toContain('1,234 m')
  })

  it('renders an empty list when there are no rides', () => {
    const wrapper = mount(RideList, { props: { rides: [] } })
    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})
