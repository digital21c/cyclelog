import { describe, it, expect } from 'vitest'

import type { Ride } from './ride'
import { DEFAULT_RIDE_SORT, sortRides, type RideSort } from './rideSort'

function makeRide(id: string, overrides: Partial<Ride> = {}): Ride {
  return {
    id,
    date: '2026-10-01',
    name: id,
    distanceKm: 40,
    elevationM: 400,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  }
}

const short = makeRide('short', { date: '2026-10-03', distanceKm: 10, elevationM: 900 })
const medium = makeRide('medium', { date: '2026-10-01', distanceKm: 50, elevationM: 100 })
const long = makeRide('long', { date: '2026-10-02', distanceKm: 120, elevationM: 500 })
const rides = [medium, long, short]

function idsSortedBy(sort: RideSort, input: Ride[] = rides): string[] {
  return sortRides(input, sort).map((ride) => ride.id)
}

describe('sortRides', () => {
  it.each<[RideSort, string[]]>([
    [{ field: 'date', direction: 'desc' }, ['short', 'long', 'medium']],
    [{ field: 'date', direction: 'asc' }, ['medium', 'long', 'short']],
    [{ field: 'distance', direction: 'desc' }, ['long', 'medium', 'short']],
    [{ field: 'distance', direction: 'asc' }, ['short', 'medium', 'long']],
    [{ field: 'elevation', direction: 'desc' }, ['short', 'long', 'medium']],
    [{ field: 'elevation', direction: 'asc' }, ['medium', 'long', 'short']],
  ])('sorts by %o', (sort, expected) => {
    expect(idsSortedBy(sort)).toEqual(expected)
  })

  it('defaults to date, newest first', () => {
    expect(DEFAULT_RIDE_SORT).toEqual({ field: 'date', direction: 'desc' })
  })

  it('does not modify the input array', () => {
    const input = [...rides]
    sortRides(input, { field: 'distance', direction: 'asc' })
    expect(input).toEqual(rides)
  })

  describe('tie-breaking', () => {
    const morning = makeRide('morning', { createdAt: '2026-10-01T07:00:00.000Z' })
    const evening = makeRide('evening', { createdAt: '2026-10-01T19:00:00.000Z' })
    const earlierDay = makeRide('earlier-day', { date: '2026-09-30' })

    it('orders same-day rides by when they were recorded, following the direction', () => {
      const sameDay = [morning, evening]
      expect(idsSortedBy({ field: 'date', direction: 'desc' }, sameDay)).toEqual([
        'evening',
        'morning',
      ])
      expect(idsSortedBy({ field: 'date', direction: 'asc' }, sameDay)).toEqual([
        'morning',
        'evening',
      ])
    })

    it('breaks equal distances and climbs newest first, whatever the direction', () => {
      // All three share distance 40 km and climb 400 m.
      const equal = [earlierDay, morning, evening]
      for (const sort of [
        { field: 'distance', direction: 'asc' },
        { field: 'distance', direction: 'desc' },
        { field: 'elevation', direction: 'asc' },
        { field: 'elevation', direction: 'desc' },
      ] as const) {
        expect(idsSortedBy(sort, equal)).toEqual(['evening', 'morning', 'earlier-day'])
      }
    })
  })
})
