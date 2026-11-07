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
