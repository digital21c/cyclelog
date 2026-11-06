import { compareIsoDates } from '@/utils/isoDate'

import type { Ride } from './ride'

/**
 * How a list of rides can be ordered. The `as const` arrays are the single
 * source of truth: the types are derived from them, and they double as the
 * list of valid values when parsing untrusted input such as a URL.
 */
export const RIDE_SORT_FIELDS = ['date', 'distance', 'elevation'] as const
export type RideSortField = (typeof RIDE_SORT_FIELDS)[number]

export const SORT_DIRECTIONS = ['asc', 'desc'] as const
export type SortDirection = (typeof SORT_DIRECTIONS)[number]

export interface RideSort {
  field: RideSortField
  direction: SortDirection
}

export const DEFAULT_RIDE_SORT: Readonly<RideSort> = { field: 'date', direction: 'desc' }

/**
 * Returns a new, sorted array; the input is never modified.
 * Ties (same distance, same climb) are broken newest first, so the order is
 * always predictable. Same-day rides are ordered by when they were recorded.
 */
export function sortRides(rides: readonly Ride[], sort: RideSort): Ride[] {
  const sign = sort.direction === 'asc' ? 1 : -1

  return [...rides].sort((a, b) => {
    if (sort.field === 'date') {
      return sign * compareChronologically(a, b)
    }
    return sign * compareMeasure(a, b, sort.field) || -compareChronologically(a, b)
  })
}

function compareMeasure(a: Ride, b: Ride, field: 'distance' | 'elevation'): number {
  return field === 'distance' ? a.distanceKm - b.distanceKm : a.elevationM - b.elevationM
}

/** Oldest first: by ride date, then by when the ride was recorded. */
function compareChronologically(a: Ride, b: Ride): number {
  return compareIsoDates(a.date, b.date) || compareStrings(a.createdAt, b.createdAt)
}

/** ISO-8601 UTC timestamps in the same format sort correctly as strings. */
function compareStrings(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
