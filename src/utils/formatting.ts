import { isoDateToLocalDate, type IsoDate } from './isoDate'

/**
 * Display formatting, kept separate from storage formats. Uses the built-in
 * Intl APIs with the en-GB locale. Formatters are created once and reused,
 * because constructing them is relatively expensive.
 */

const LOCALE = 'en-GB'

const rideDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const distanceFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'unit',
  unit: 'kilometer',
  maximumFractionDigits: 1,
})

const elevationFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'unit',
  unit: 'meter',
  maximumFractionDigits: 0,
})

/** "2026-11-01" → "Sun, 1 Nov 2026" */
export function formatRideDate(date: IsoDate): string {
  return rideDateFormatter.format(isoDateToLocalDate(date))
}

/** 42.13 → "42.1 km" */
export function formatDistanceKm(distanceKm: number): string {
  return distanceFormatter.format(distanceKm)
}

/** 1234 → "1,234 m" */
export function formatElevationM(elevationM: number): string {
  return elevationFormatter.format(elevationM)
}

/** 1 → "1 ride", 40 → "40 rides" */
export function formatRideCount(count: number): string {
  return `${count} ${count === 1 ? 'ride' : 'rides'}`
}

// --- Statistics periods ------------------------------------------------------------

const monthYearFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
const shortMonthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'short' })
const dayMonthFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const dayMonthYearFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** The kinds of period statistics are grouped by (mirrors StatsPeriod in services). */
type Period = 'week' | 'month' | 'year'

/**
 * Full label for a period, given its first day:
 * week "2 Nov 2026" (its Monday), month "November 2026", year "2026".
 */
export function formatPeriodLabel(periodStart: IsoDate, period: Period): string {
  switch (period) {
    case 'week':
      // No weekday: weeks always start on Monday, and it keeps tables narrow.
      return dayMonthYearFormatter.format(isoDateToLocalDate(periodStart))
    case 'month':
      return monthYearFormatter.format(isoDateToLocalDate(periodStart))
    case 'year':
      return periodStart.slice(0, 4)
  }
}

/** Compact label for chart axes: "2 Nov", "Nov", "2026". */
export function formatPeriodShortLabel(periodStart: IsoDate, period: Period): string {
  const date = isoDateToLocalDate(periodStart)
  switch (period) {
    case 'week':
      return dayMonthFormatter.format(date)
    case 'month':
      return shortMonthFormatter.format(date)
    case 'year':
      return periodStart.slice(0, 4)
  }
}

/** 1 → "1 week", 12 → "12 months", 3 → "3 years". */
export function formatPeriodCount(count: number, period: Period): string {
  return `${count} ${period}${count === 1 ? '' : 's'}`
}
