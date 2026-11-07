import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import type { Highlights } from '@/services/rideStatistics'

import StatHighlights from './StatHighlights.vue'

function highlights(overrides: Partial<Highlights> = {}): Highlights {
  return {
    period: 'week',
    periodCount: 12,
    activePeriodCount: 10,
    rideCount: 34,
    ridesPerPeriod: 34 / 12,
    averageDistanceKm: 29.012,
    averageElevationM: 311.47,
    longestRides: [],
    greatestClimbs: [],
    ...overrides,
  }
}

/** Each tile as "label: value (detail)", the way a screen reader pairs them. */
function tiles(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('dl > div').map((tile) => {
    const [value, detail] = tile.findAll('dd').map((dd) => dd.text())
    return `${tile.get('dt').text()}: ${value}${detail ? ` (${detail})` : ''}`
  })
}

describe('StatHighlights', () => {
  it('shows count, frequency and per-ride averages for the timeframe', () => {
    expect(tiles(mount(StatHighlights, { props: { highlights: highlights() } }))).toEqual([
      'Rides: 34',
      'Rides per week: 2.8 (Ridden in 10 of 12 weeks, counting this week)',
      'Average distance: 29 km (per ride)',
      'Average climb: 311 m (per ride)',
    ])
  })

  it('names frequency after the selected period', () => {
    const wrapper = mount(StatHighlights, {
      props: {
        highlights: highlights({ period: 'month', ridesPerPeriod: 11.25, activePeriodCount: 12 }),
      },
    })
    expect(tiles(wrapper)[1]).toBe(
      'Rides per month: 11.3 (Ridden in 12 of 12 months, counting this month)',
    )
  })

  it('shows a dash, read out as "No rides", when there are no averages', () => {
    const wrapper = mount(StatHighlights, {
      props: {
        highlights: highlights({ rideCount: 0, averageDistanceKm: null, averageElevationM: null }),
      },
    })
    const averageDistance = wrapper.findAll('dl > div')[2]
    expect(averageDistance?.get('[aria-hidden="true"]').text()).toBe('—')
    expect(averageDistance?.get('.sr-only').text()).toBe('No rides')
  })
})
