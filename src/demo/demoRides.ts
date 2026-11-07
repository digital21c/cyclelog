import { createRide, type Ride } from '@/models/ride'
import { toIsoDate } from '@/utils/isoDate'

import { createSeededRandom } from './seededRandom'

/**
 * Demonstration data: plausible Canberra rides for checking the UI.
 * Development-only; never written to real storage.
 */

export interface DemoRoute {
  name: string
  distanceKm: { min: number; max: number }
  elevationM: { min: number; max: number }
}

// Approximate figures for well-known Canberra rides, not measured routes.

const COMMUTE_ROUTE: DemoRoute = {
  name: 'Commute to Civic',
  distanceKm: { min: 1, max: 15 },
  elevationM: { min: 10, max: 80 },
}

/** Shorter rides that fit around a working day. */
export const WEEKDAY_ROUTES: readonly DemoRoute[] = [
  COMMUTE_ROUTE,
  {
    name: 'Black Mountain Climb',
    distanceKm: { min: 8, max: 14 },
    elevationM: { min: 180, max: 280 },
  },
  {
    name: 'Mount Ainslie Climb',
    distanceKm: { min: 10, max: 16 },
    elevationM: { min: 220, max: 320 },
  },
  { name: 'Red Hill Climb', distanceKm: { min: 9, max: 15 }, elevationM: { min: 140, max: 220 } },
  {
    name: 'Lake Burley Griffin Loop',
    distanceKm: { min: 25, max: 32 },
    elevationM: { min: 60, max: 140 },
  },
  {
    name: 'Mount Stromlo Loop',
    distanceKm: { min: 30, max: 40 },
    elevationM: { min: 300, max: 450 },
  },
]

/** Longer rides for Saturdays and Sundays. */
export const WEEKEND_ROUTES: readonly DemoRoute[] = [
  { name: 'Cotter Loop', distanceKm: { min: 45, max: 60 }, elevationM: { min: 450, max: 650 } },
  { name: 'Uriarra Loop', distanceKm: { min: 60, max: 75 }, elevationM: { min: 600, max: 850 } },
  {
    name: 'Bungendore Out-and-Back',
    distanceKm: { min: 70, max: 85 },
    elevationM: { min: 550, max: 750 },
  },
  {
    name: 'Murrumbateman Loop',
    distanceKm: { min: 80, max: 100 },
    elevationM: { min: 650, max: 900 },
  },
  {
    name: 'Tidbinbilla Loop',
    distanceKm: { min: 85, max: 105 },
    elevationM: { min: 900, max: 1200 },
  },
  {
    name: 'Corin Dam Climb',
    distanceKm: { min: 110, max: 150 },
    elevationM: { min: 1300, max: 1500 },
  },
]

export interface DemoRideOptions {
  /** Rides are generated for the `days` days before this date (not including it). */
  today?: Date
  days?: number
  seed?: number
  /** How many earlier calendar years get a sparse history (0 to 3). */
  historyYears?: number
}

/**
 * Rides in each earlier calendar year: one year ago, two years ago, three
 * years ago. Fewer further back, so the yearly chart shows a rising trend.
 */
const HISTORY_RIDES_PER_YEAR = [24, 16, 10] as const

// Chance of riding on a given day, and of an extra commute on a weekday.
const WEEKDAY_RIDE_CHANCE = 0.35
const WEEKEND_RIDE_CHANCE = 0.7
const EXTRA_COMMUTE_CHANCE = 0.15

/**
 * Generates demo rides: roughly 40 over the last 90 days (shorter rides on
 * weekdays, longer ones at weekends), plus a sparse history spread through
 * the previous three calendar years, so yearly statistics span several years.
 *
 * The same options always produce the same rides. The history uses its own
 * random sequence, so adding it didn't change the recent rides.
 * Every ride is built with `createRide`, so it passes normal validation.
 */
export function generateDemoRides({
  today = new Date(),
  days = 90,
  seed = 2026,
  historyYears = HISTORY_RIDES_PER_YEAR.length,
}: DemoRideOptions = {}): Ride[] {
  const rides: Ride[] = []
  const addRide = (day: Date, route: DemoRoute, index: number, random: () => number) => {
    rides.push(buildRide(day, route, index, `demo-${rides.length + 1}`, random))
  }

  // Recent rides: a ride on most weekends and some weekdays.
  const random = createSeededRandom(seed)
  for (let daysAgo = days; daysAgo >= 1; daysAgo--) {
    // Local-date arithmetic: the Date constructor rolls over months and years for us.
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo)
    chooseRoutesForDay(day, random).forEach((route, index) => addRide(day, route, index, random))
  }

  // History: a fixed number of rides on random days in each earlier year.
  const historyRandom = createSeededRandom(seed + 1)
  for (
    let yearsAgo = Math.min(historyYears, HISTORY_RIDES_PER_YEAR.length);
    yearsAgo >= 1;
    yearsAgo--
  ) {
    const year = today.getFullYear() - yearsAgo
    const count = HISTORY_RIDES_PER_YEAR[yearsAgo - 1] ?? 0
    for (const day of randomDaysInYear(year, count, historyRandom)) {
      const isWeekend = day.getDay() === 0 || day.getDay() === 6
      addRide(
        day,
        pick(isWeekend ? WEEKEND_ROUTES : WEEKDAY_ROUTES, historyRandom),
        0,
        historyRandom,
      )
    }
  }

  return rides
}

/** Creates one valid ride on `day`, recorded that evening (an hour later per extra ride). */
function buildRide(
  day: Date,
  route: DemoRoute,
  indexThatDay: number,
  id: string,
  random: () => number,
): Ride {
  const recordedAt = new Date(day)
  recordedAt.setHours(18 + indexThatDay, Math.floor(random() * 60))

  const result = createRide(
    {
      date: toIsoDate(day),
      name: route.name,
      distanceKm: randomBetween(route.distanceKm, random),
      elevationM: Math.round(randomBetween(route.elevationM, random)),
    },
    { now: recordedAt, generateId: () => id },
  )
  if (!result.valid) {
    throw new Error(`Generated an invalid demo ride: ${JSON.stringify(result.errors)}`)
  }
  return result.value
}

/** `count` different days in `year`, in date order. */
function randomDaysInYear(year: number, count: number, random: () => number): Date[] {
  const daysInYear = new Date(year, 1, 29).getDate() === 29 ? 366 : 365
  const dayNumbers = new Set<number>()
  while (dayNumbers.size < Math.min(count, daysInYear)) {
    dayNumbers.add(Math.floor(random() * daysInYear))
  }
  return [...dayNumbers].sort((a, b) => a - b).map((dayOfYear) => new Date(year, 0, 1 + dayOfYear))
}

function chooseRoutesForDay(day: Date, random: () => number): DemoRoute[] {
  const isWeekend = day.getDay() === 0 || day.getDay() === 6
  const routes: DemoRoute[] = []

  if (random() < (isWeekend ? WEEKEND_RIDE_CHANCE : WEEKDAY_RIDE_CHANCE)) {
    routes.push(pick(isWeekend ? WEEKEND_ROUTES : WEEKDAY_ROUTES, random))
  }
  if (!isWeekend && random() < EXTRA_COMMUTE_CHANCE) {
    routes.push(COMMUTE_ROUTE)
  }
  return routes
}

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)]
  if (item === undefined) throw new Error('Cannot pick from an empty list.')
  return item
}

function randomBetween(range: { min: number; max: number }, random: () => number): number {
  return range.min + random() * (range.max - range.min)
}
