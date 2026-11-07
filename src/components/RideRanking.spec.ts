import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { Ride } from '@/models/ride'
import { routes } from '@/router'

import RideRanking from './RideRanking.vue'

// Ride names are RouterLinks, which need a router to build their hrefs.
const router = createRouter({ history: createMemoryHistory(), routes })

function makeRide(id: string, name: string, distanceKm: number, elevationM: number): Ride {
  return {
    id,
    date: '2026-10-03',
    name,
    distanceKm,
    elevationM,
    createdAt: '2026-10-03T08:00:00.000Z',
    updatedAt: '2026-10-03T08:00:00.000Z',
  }
}

const rides = [
  makeRide('a', 'Corin Dam Climb', 114, 1368),
  makeRide('b', 'Tidbinbilla Loop', 97.9, 941),
]

function mountRanking(measure: 'distance' | 'elevation', list: Ride[] = rides) {
  return mount(RideRanking, {
    props: {
      title: measure === 'distance' ? 'Longest rides' : 'Greatest climbs',
      rides: list,
      measure,
    },
    global: { plugins: [router] },
  })
}

describe('RideRanking', () => {
  it('is a section named by its heading', () => {
    const wrapper = mountRanking('distance')
    const headingId = wrapper.get('h3').attributes('id') ?? ''
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe(headingId)
    expect(wrapper.get('h3').text()).toBe('Longest rides')
  })

  it('lists the rides in the order given, as a numbered list', () => {
    const items = mountRanking('distance').findAll('ol > li')
    expect(items.map((item) => item.get('a').text())).toEqual([
      'Corin Dam Climb',
      'Tidbinbilla Loop',
    ])
  })

  it('shows the measure being ranked', () => {
    expect(mountRanking('distance').get('li').text()).toContain('114 km')
    expect(mountRanking('elevation').get('li').text()).toContain('1,368 m')
  })

  it("links each ride to its page and shows the ride's date", () => {
    const item = mountRanking('distance').get('li')
    expect(item.get('a').attributes('href')).toBe('/rides/a/edit')
    expect(item.get('time').attributes('datetime')).toBe('2026-10-03')
    expect(item.get('time').text()).toBe('Sat, 3 Oct 2026')
  })

  it('says so when there are no rides', () => {
    const wrapper = mountRanking('distance', [])
    expect(wrapper.find('ol').exists()).toBe(false)
    expect(wrapper.text()).toContain('No rides in this period.')
  })
})
