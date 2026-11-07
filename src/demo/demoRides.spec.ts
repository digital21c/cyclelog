import { describe, it, expect } from 'vitest'

import { compareIsoDates, isoDateToLocalDate, toIsoDate } from '@/utils/isoDate'

import { generateDemoRides, WEEKDAY_ROUTES, WEEKEND_ROUTES } from './demoRides'
import { createSeededRandom } from './seededRandom'

// Local-time constructor: 6 Nov 2026 wherever the test runs.
const TODAY = new Date(2026, 10, 6, 12, 0)
const ALL_ROUTES = [...WEEKDAY_ROUTES, ...WEEKEND_ROUTES]

describe('createSeededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createSeededRandom(42)
    const b = createSeededRandom(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('produces numbers in [0, 1)', () => {
    const random = createSeededRandom(1)
    for (let i = 0; i < 1000; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('generateDemoRides', () => {
  const rides = generateDemoRides({ today: TODAY })

  it('is deterministic for the same options', () => {
    expect(generateDemoRides({ today: TODAY })).toEqual(rides)
  })

  it('varies with the seed', () => {
    expect(generateDemoRides({ today: TODAY, seed: 7 })).not.toEqual(rides)
  })

  // TODAY is 6 Nov 2026: recent rides fall from 8 Aug to 5 Nov 2026, history in 2023-2025.
  const recentStart = toIsoDate(new Date(2026, 10, 6 - 90))
  const recent = rides.filter((ride) => compareIsoDates(ride.date, recentStart) >= 0)
  const history = rides.filter((ride) => compareIsoDates(ride.date, recentStart) < 0)

  it('generates roughly 40 recent rides in the last 90 days, excluding today', () => {
    expect(recent.length).toBeGreaterThanOrEqual(30)
    expect(recent.length).toBeLessThanOrEqual(55)
    for (const ride of recent) {
      expect(compareIsoDates(ride.date, '2026-11-05')).toBeLessThanOrEqual(0)
    }
  })

  it('adds a history in each of the three previous years, fewer further back', () => {
    const perYear = new Map<string, number>()
    for (const ride of history) {
      const year = ride.date.slice(0, 4)
      perYear.set(year, (perYear.get(year) ?? 0) + 1)
    }
    expect(Object.fromEntries(perYear)).toEqual({ '2025': 24, '2024': 16, '2023': 10 })
  })

  it('puts history rides on different days', () => {
    expect(new Set(history.map((ride) => ride.date)).size).toBe(history.length)
  })

  it('leaves the recent rides unchanged by the history', () => {
    expect(generateDemoRides({ today: TODAY, historyYears: 0 })).toEqual(recent)
  })

  it('can generate fewer years of history', () => {
    const oneYear = generateDemoRides({ today: TODAY, historyYears: 1 })
    expect(new Set(oneYear.map((ride) => ride.date.slice(0, 4)))).toEqual(new Set(['2025', '2026']))
  })

  it("keeps each ride within its route's ranges and the overall bounds", () => {
    for (const ride of rides) {
      const route = ALL_ROUTES.find((candidate) => candidate.name === ride.name)
      if (!route) throw new Error(`Unknown demo route: ${ride.name}`)

      expect(ride.distanceKm).toBeGreaterThanOrEqual(route.distanceKm.min)
      expect(ride.distanceKm).toBeLessThanOrEqual(route.distanceKm.max)
      expect(ride.elevationM).toBeGreaterThanOrEqual(route.elevationM.min)
      expect(ride.elevationM).toBeLessThanOrEqual(route.elevationM.max)

      expect(ride.distanceKm).toBeGreaterThanOrEqual(1)
      expect(ride.distanceKm).toBeLessThanOrEqual(150)
      expect(ride.elevationM).toBeGreaterThanOrEqual(10)
      expect(ride.elevationM).toBeLessThanOrEqual(1500)
    }
  })

  it('puts long routes at weekends and short routes on weekdays', () => {
    const weekendNames = new Set(WEEKEND_ROUTES.map((route) => route.name))
    for (const ride of rides) {
      const weekday = isoDateToLocalDate(ride.date).getDay()
      const isWeekend = weekday === 0 || weekday === 6
      expect({ ride: ride.name, isWeekendRoute: weekendNames.has(ride.name) }).toEqual({
        ride: ride.name,
        isWeekendRoute: isWeekend,
      })
    }
  })

  it('gives every ride a unique id', () => {
    expect(new Set(rides.map((ride) => ride.id)).size).toBe(rides.length)
  })
})
