import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { Ride } from '@/models/ride'
import { routes } from '@/router'

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

// Items contain RouterLinks, which need a router to build their hrefs.
const router = createRouter({ history: createMemoryHistory(), routes })
const withRouter = { plugins: [router] }

describe('RideList', () => {
  it('renders one list item per ride, in the order given', () => {
    const wrapper = mount(RideList, {
      global: withRouter,
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
    const wrapper = mount(RideList, {
      global: withRouter,
      props: { rides: [makeRide()] },
    })
    const item = wrapper.get('li')

    expect(item.get('time').text()).toBe('Sun, 1 Nov 2026')
    expect(item.get('time').attributes('datetime')).toBe('2026-11-01')
    expect(item.text()).toContain('67.3 km')
    expect(item.text()).toContain('1,234 m')
  })

  it('renders an empty list when there are no rides', () => {
    const wrapper = mount(RideList, {
      global: withRouter,
      props: { rides: [] },
    })
    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})

describe('RideList edit links', () => {
  it('links each ride to its edit page, named so screen-reader users know which ride', () => {
    const wrapper = mount(RideList, {
      global: withRouter,
      props: { rides: [makeRide({ id: 'abc-123', name: 'Uriarra Loop', date: '2026-11-01' })] },
    })
    const link = wrapper.get('li a')

    expect(link.attributes('href')).toBe('/rides/abc-123/edit')
    expect(link.text()).toBe('Edit')
    // The accessible name starts with the visible text, so voice-control users
    // can still say "click Edit".
    expect(link.attributes('aria-label')).toBe('Edit Uriarra Loop, Sun, 1 Nov 2026')
  })
})
