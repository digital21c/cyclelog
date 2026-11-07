import { describe, it, expect } from 'vitest'

import type { Ride } from '@/models/ride'

import {
  MONTHS_SHOWN,
  nextPeriodStart,
  periodRange,
  ridesInRange,
  startOfPeriod,
  summariseByPeriod,
  summariseHighlights,
  TOP_RIDES_SHOWN,
  WEEKS_SHOWN,
} from './rideStatistics'

let nextId = 1
function ride(date: string, distanceKm = 10, elevationM = 100): Ride {
  const id = `ride-${nextId++}`
  return {
    id,
    date,
    name: id,
    distanceKm,
    elevationM,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  }
}

// Saturday 7 November 2026; its week began on Monday 2 November.
const TODAY = '2026-11-07'

describe('startOfPeriod / nextPeriodStart', () => {
  it.each([
    ['week', '2026-11-08', '2026-11-02', '2026-11-09'],
    ['month', '2026-11-30', '2026-11-01', '2026-12-01'],
    ['year', '2026-11-07', '2026-01-01', '2027-01-01'],
  ] as const)('%s containing %s starts %s; the next starts %s', (period, date, start, next) => {
    expect(startOfPeriod(date, period)).toBe(start)
    expect(nextPeriodStart(start, period)).toBe(next)
  })
})

describe('periodRange', () => {
  it(`covers the last ${WEEKS_SHOWN} weeks, ending with this week`, () => {
    expect(periodRange([], 'week', TODAY)).toEqual({ first: '2026-08-17', last: '2026-11-02' })
  })

  it(`covers the last ${MONTHS_SHOWN} months, ending with this month`, () => {
    expect(periodRange([], 'month', TODAY)).toEqual({ first: '2025-12-01', last: '2026-11-01' })
  })

  it("covers every year from the earliest ride's year to this year", () => {
    const rides = [ride('2025-06-01'), ride('2023-02-14'), ride('2026-01-01')]
    expect(periodRange(rides, 'year', TODAY)).toEqual({ first: '2023-01-01', last: '2026-01-01' })
  })

  it('covers just this year when there are no rides', () => {
    expect(periodRange([], 'year', TODAY)).toEqual({ first: '2026-01-01', last: '2026-01-01' })
  })
})

describe('summariseByPeriod', () => {
  it(`always has ${WEEKS_SHOWN} weekly and ${MONTHS_SHOWN} monthly rows, oldest first`, () => {
    const weeks = summariseByPeriod([], 'week', TODAY).rows
    expect(weeks).toHaveLength(WEEKS_SHOWN)
    expect(weeks[0]?.periodStart).toBe('2026-08-17')
    expect(weeks.at(-1)?.periodStart).toBe('2026-11-02')
    expect(summariseByPeriod([], 'month', TODAY).rows).toHaveLength(MONTHS_SHOWN)
  })

  it('puts Sunday rides in the week that began on the previous Monday', () => {
    const rides = [ride('2026-11-01', 50), ride('2026-11-02', 20), ride('2026-11-08', 999)]
    const rows = summariseByPeriod(rides, 'week', '2026-11-08').rows

    const weekOf26Oct = rows.find((row) => row.periodStart === '2026-10-26')
    const weekOf2Nov = rows.find((row) => row.periodStart === '2026-11-02')
    expect(weekOf26Oct).toMatchObject({ rideCount: 1, distanceKm: 50 })
    expect(weekOf2Nov).toMatchObject({ rideCount: 2, distanceKm: 1019 })
  })

  it('totals distance, climb and ride count per period', () => {
    const rides = [ride('2026-11-03', 42.5, 610), ride('2026-11-05', 12.25, 180)]
    const thisWeek = summariseByPeriod(rides, 'week', TODAY).rows.at(-1)
    expect(thisWeek).toEqual({
      periodStart: '2026-11-02',
      rideCount: 2,
      distanceKm: 54.75,
      elevationM: 790,
    })
  })

  it('shows periods without rides as zeros', () => {
    const rows = summariseByPeriod([ride('2026-11-03')], 'week', TODAY).rows
    expect(rows.filter((row) => row.rideCount === 0)).toHaveLength(WEEKS_SHOWN - 1)
    expect(rows[0]).toEqual({
      periodStart: '2026-08-17',
      rideCount: 0,
      distanceKm: 0,
      elevationM: 0,
    })
  })

  it('ignores rides before the range shown', () => {
    const summary = summariseByPeriod([ride('2026-01-15', 80)], 'week', TODAY)
    expect(summary.totals).toEqual({ rideCount: 0, distanceKm: 0, elevationM: 0 })
  })

  it('handles months of different lengths and the turn of the year', () => {
    const rides = [ride('2025-12-31', 30), ride('2026-01-01', 40), ride('2026-02-28', 5)]
    const rows = summariseByPeriod(rides, 'month', TODAY).rows
    const byStart = Object.fromEntries(rows.map((row) => [row.periodStart, row.distanceKm]))
    expect(byStart).toMatchObject({ '2025-12-01': 30, '2026-01-01': 40, '2026-02-01': 5 })
  })

  it('groups by year from the first ride to this year', () => {
    const rides = [
      ride('2024-05-01', 100, 1000),
      ride('2024-09-01', 50, 500),
      ride('2026-03-01', 25, 250),
    ]
    const summary = summariseByPeriod(rides, 'year', TODAY)
    expect(summary.rows).toEqual([
      { periodStart: '2024-01-01', rideCount: 2, distanceKm: 150, elevationM: 1500 },
      { periodStart: '2025-01-01', rideCount: 0, distanceKm: 0, elevationM: 0 },
      { periodStart: '2026-01-01', rideCount: 1, distanceKm: 25, elevationM: 250 },
    ])
  })

  it('totals the whole range', () => {
    const rides = [ride('2026-10-01', 10.1, 100), ride('2026-11-01', 20.2, 200)]
    expect(summariseByPeriod(rides, 'month', TODAY).totals).toEqual({
      rideCount: 2,
      distanceKm: 30.3,
      elevationM: 300,
    })
  })

  it('rounds sums once, avoiding floating-point noise', () => {
    const rides = [ride('2026-11-03', 0.1), ride('2026-11-04', 0.2)]
    const summary = summariseByPeriod(rides, 'week', TODAY)
    expect(summary.rows.at(-1)?.distanceKm).toBe(0.3)
    expect(summary.totals.distanceKm).toBe(0.3)
  })

  it('records which period it summarises', () => {
    expect(summariseByPeriod([], 'year', TODAY).period).toBe('year')
  })
})

describe('ridesInRange', () => {
  it('keeps only rides in the timeframe shown, including this week', () => {
    const rides = [ride('2026-08-16'), ride('2026-08-17'), ride('2026-11-07')]
    expect(ridesInRange(rides, 'week', TODAY).map((r) => r.date)).toEqual([
      '2026-08-17',
      '2026-11-07',
    ])
  })

  it('keeps every ride for the yearly timeframe', () => {
    const rides = [ride('2021-03-01'), ride('2026-11-01')]
    expect(ridesInRange(rides, 'year', TODAY)).toHaveLength(2)
  })
})

describe('summariseHighlights', () => {
  it('averages distance and climb per ride across the timeframe', () => {
    const rides = [
      ride('2026-11-03', 40, 400),
      ride('2026-11-04', 20, 100),
      ride('2026-11-05', 30, 250),
    ]
    const highlights = summariseHighlights(rides, 'week', TODAY)
    expect(highlights.rideCount).toBe(3)
    expect(highlights.averageDistanceKm).toBe(30)
    expect(highlights.averageElevationM).toBeCloseTo(250)
  })

  it('reports no averages (not zero) when there are no rides', () => {
    const highlights = summariseHighlights([ride('2020-01-01')], 'week', TODAY)
    expect(highlights).toMatchObject({
      rideCount: 0,
      averageDistanceKm: null,
      averageElevationM: null,
      longestRides: [],
      greatestClimbs: [],
    })
  })

  it('counts rides per period over every period shown, including this unfinished one', () => {
    // 6 rides over the 12 weeks shown, in 4 different weeks.
    const rides = [
      ride('2026-11-02'),
      ride('2026-11-03'),
      ride('2026-10-20'),
      ride('2026-09-01'),
      ride('2026-09-02'),
      ride('2026-08-20'),
    ]
    const highlights = summariseHighlights(rides, 'week', TODAY)
    expect(highlights.periodCount).toBe(WEEKS_SHOWN)
    expect(highlights.ridesPerPeriod).toBe(6 / 12)
    expect(highlights.activePeriodCount).toBe(4)
  })

  it(`lists the ${TOP_RIDES_SHOWN} longest rides and greatest climbs in the timeframe`, () => {
    const rides = [
      ride('2026-11-01', 50, 900),
      ride('2026-11-02', 120, 300),
      ride('2026-11-03', 80, 1400),
      ride('2026-11-04', 10, 50),
      ride('2026-01-01', 999, 9999), // outside the 12 weeks
    ]
    const highlights = summariseHighlights(rides, 'week', TODAY)
    expect(highlights.longestRides.map((r) => r.distanceKm)).toEqual([120, 80, 50])
    expect(highlights.greatestClimbs.map((r) => r.elevationM)).toEqual([1400, 900, 300])
  })

  it('breaks ties in favour of the newest ride', () => {
    const older = ride('2026-10-01', 60, 600)
    const newer = ride('2026-10-15', 60, 600)
    const highlights = summariseHighlights([older, newer], 'month', TODAY)
    expect(highlights.longestRides.map((r) => r.date)).toEqual(['2026-10-15', '2026-10-01'])
  })

  it('shows shorter lists when there are fewer rides', () => {
    const highlights = summariseHighlights([ride('2026-11-03')], 'week', TODAY)
    expect(highlights.longestRides).toHaveLength(1)
  })

  it('agrees with the period summary about which rides count', () => {
    const rides = [ride('2026-08-16', 70), ride('2026-08-17', 30), ride('2026-11-06', 20)]
    for (const period of ['week', 'month', 'year'] as const) {
      const highlights = summariseHighlights(rides, period, TODAY)
      const summary = summariseByPeriod(rides, period, TODAY)
      expect(highlights.rideCount).toBe(summary.totals.rideCount)
    }
  })
})
