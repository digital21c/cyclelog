import type { Ride } from '@/models/ride'
import { sortRides } from '@/models/rideSort'
import {
  addDays,
  addMonths,
  compareIsoDates,
  startOfIsoWeek,
  startOfMonth,
  startOfYear,
  type IsoDate,
} from '@/utils/isoDate'

/**
 * Totals of distance and climb per week, month or year.
 * Pure functions: rides in, numbers out. Always calculated from rides,
 * never stored.
 */

export const STATS_PERIODS = ['week', 'month', 'year'] as const
export type StatsPeriod = (typeof STATS_PERIODS)[number]

/** How many weeks/months are shown. Years show every year that has rides. */
export const WEEKS_SHOWN = 12
export const MONTHS_SHOWN = 12

/** How many rides each "top" list shows. */
export const TOP_RIDES_SHOWN = 3

export interface Totals {
  rideCount: number
  distanceKm: number
  elevationM: number
}

export interface PeriodTotals extends Totals {
  /** First day of the period: a Monday, the 1st of a month, or 1 January. */
  periodStart: IsoDate
}

export interface PeriodSummary {
  period: StatsPeriod
  /** One row per period, oldest first, including periods with no rides. */
  rows: PeriodTotals[]
  /** Totals across every row. */
  totals: Totals
}

/** The first day of the week, month or year containing `date`. */
export function startOfPeriod(date: IsoDate, period: StatsPeriod): IsoDate {
  switch (period) {
    case 'week':
      return startOfIsoWeek(date)
    case 'month':
      return startOfMonth(date)
    case 'year':
      return startOfYear(date)
  }
}

/** The start of the period after the one beginning on `periodStart`. */
export function nextPeriodStart(periodStart: IsoDate, period: StatsPeriod): IsoDate {
  switch (period) {
    case 'week':
      return addDays(periodStart, 7)
    case 'month':
      return addMonths(periodStart, 1)
    case 'year':
      return addMonths(periodStart, 12)
  }
}

/**
 * The first and last period shown:
 * - weeks/months: the last 12, ending with the current one;
 * - years: from the earliest ride's year to this year.
 */
export function periodRange(
  rides: readonly Ride[],
  period: StatsPeriod,
  today: IsoDate,
): { first: IsoDate; last: IsoDate } {
  const last = startOfPeriod(today, period)
  switch (period) {
    case 'week':
      return { first: addDays(last, -7 * (WEEKS_SHOWN - 1)), last }
    case 'month':
      return { first: addMonths(last, -(MONTHS_SHOWN - 1)), last }
    case 'year': {
      const earliest = rides.reduce<IsoDate>(
        (min, ride) => (compareIsoDates(ride.date, min) < 0 ? ride.date : min),
        today,
      )
      return { first: startOfYear(earliest), last }
    }
  }
}

/** Groups rides into periods and totals them. Rides outside the range are ignored. */
export function summariseByPeriod(
  rides: readonly Ride[],
  period: StatsPeriod,
  today: IsoDate,
): PeriodSummary {
  const { first, last } = periodRange(rides, period, today)

  // One empty row per period in the range, so gaps show as zeros.
  const rowsByStart = new Map<IsoDate, PeriodTotals>()
  for (
    let start = first;
    compareIsoDates(start, last) <= 0;
    start = nextPeriodStart(start, period)
  ) {
    rowsByStart.set(start, { periodStart: start, rideCount: 0, distanceKm: 0, elevationM: 0 })
  }

  for (const ride of rides) {
    const row = rowsByStart.get(startOfPeriod(ride.date, period))
    if (!row) continue // outside the range shown
    row.rideCount += 1
    row.distanceKm += ride.distanceKm
    row.elevationM += ride.elevationM
  }

  const rows = [...rowsByStart.values()].map((row) => ({
    ...row,
    distanceKm: roundToTwoDecimals(row.distanceKm),
  }))

  return { period, rows, totals: sumTotals(rows) }
}

/** The rides that fall within the timeframe shown for `period` (see periodRange). */
export function ridesInRange(rides: readonly Ride[], period: StatsPeriod, today: IsoDate): Ride[] {
  const { first, last } = periodRange(rides, period, today)
  const end = nextPeriodStart(last, period) // exclusive
  return rides.filter(
    (ride) => compareIsoDates(ride.date, first) >= 0 && compareIsoDates(ride.date, end) < 0,
  )
}

export interface Highlights {
  period: StatsPeriod
  /** Periods in the timeframe, including the current, unfinished one. */
  periodCount: number
  /** Periods with at least one ride. */
  activePeriodCount: number
  rideCount: number
  /** Average rides per period, e.g. per week. */
  ridesPerPeriod: number
  /** Per ride; null when there are no rides (rather than a misleading 0). */
  averageDistanceKm: number | null
  averageElevationM: number | null
  /** Up to TOP_RIDES_SHOWN rides; ties go to the newest ride. */
  longestRides: Ride[]
  greatestClimbs: Ride[]
}

/**
 * Highlights for the same timeframe as `summariseByPeriod`, so the two can
 * never disagree about which rides count.
 */
export function summariseHighlights(
  rides: readonly Ride[],
  period: StatsPeriod,
  today: IsoDate,
): Highlights {
  const summary = summariseByPeriod(rides, period, today)
  const inRange = ridesInRange(rides, period, today)
  const { rideCount, distanceKm, elevationM } = summary.totals
  const periodCount = summary.rows.length

  return {
    period,
    periodCount,
    activePeriodCount: summary.rows.filter((row) => row.rideCount > 0).length,
    rideCount,
    ridesPerPeriod: rideCount / periodCount,
    averageDistanceKm: rideCount > 0 ? distanceKm / rideCount : null,
    averageElevationM: rideCount > 0 ? elevationM / rideCount : null,
    longestRides: sortRides(inRange, { field: 'distance', direction: 'desc' }).slice(
      0,
      TOP_RIDES_SHOWN,
    ),
    greatestClimbs: sortRides(inRange, { field: 'elevation', direction: 'desc' }).slice(
      0,
      TOP_RIDES_SHOWN,
    ),
  }
}

function sumTotals(rows: readonly Totals[]): Totals {
  const totals = rows.reduce(
    (sum, row) => ({
      rideCount: sum.rideCount + row.rideCount,
      distanceKm: sum.distanceKm + row.distanceKm,
      elevationM: sum.elevationM + row.elevationM,
    }),
    { rideCount: 0, distanceKm: 0, elevationM: 0 },
  )
  return { ...totals, distanceKm: roundToTwoDecimals(totals.distanceKm) }
}

/** Sums are rounded once, at the end: 0.1 + 0.2 is 0.30000000000000004 in floating point. */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}
