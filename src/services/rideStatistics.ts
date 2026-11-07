import type { Ride } from '@/models/ride'
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
