import type { LocationQuery, LocationQueryRaw } from 'vue-router'

import {
  DEFAULT_RIDE_SORT,
  RIDE_SORT_FIELDS,
  SORT_DIRECTIONS,
  type RideSort,
  type RideSortField,
  type SortDirection,
} from '@/models/rideSort'

/**
 * Pure conversion between a RideSort and URL query parameters, e.g.
 * `/?sort=distance&order=asc`. Kept separate from the composable so it can be
 * tested without a router.
 */

export const SORT_QUERY_KEYS = { field: 'sort', direction: 'order' } as const

/** Reads the sort from the URL. Missing or unrecognised values fall back to the default. */
export function parseRideSortQuery(query: LocationQuery): RideSort {
  return {
    field: readOption(query[SORT_QUERY_KEYS.field], RIDE_SORT_FIELDS, DEFAULT_RIDE_SORT.field),
    direction: readOption(
      query[SORT_QUERY_KEYS.direction],
      SORT_DIRECTIONS,
      DEFAULT_RIDE_SORT.direction,
    ),
  }
}

/**
 * Writes the sort into a query, keeping any unrelated parameters.
 * Default values are left out, so the default view is a clean `/`.
 */
export function withRideSortQuery(query: LocationQuery, sort: RideSort): LocationQueryRaw {
  const result: LocationQueryRaw = { ...query }
  delete result[SORT_QUERY_KEYS.field]
  delete result[SORT_QUERY_KEYS.direction]

  if (sort.field !== DEFAULT_RIDE_SORT.field) result[SORT_QUERY_KEYS.field] = sort.field
  if (sort.direction !== DEFAULT_RIDE_SORT.direction) {
    result[SORT_QUERY_KEYS.direction] = sort.direction
  }
  return result
}

/**
 * A query value can be a string, null, or an array (for `?a=1&a=2`).
 * Returns it if it's one of the allowed options, otherwise the fallback.
 */
function readOption<T extends RideSortField | SortDirection>(
  value: LocationQuery[string] | undefined,
  options: readonly T[],
  fallback: T,
): T {
  const candidate = Array.isArray(value) ? value[0] : value
  return options.find((option) => option === candidate) ?? fallback
}
