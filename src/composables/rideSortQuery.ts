import type { LocationQuery, LocationQueryRaw } from 'vue-router'

import {
  DEFAULT_RIDE_SORT,
  RIDE_SORT_FIELDS,
  SORT_DIRECTIONS,
  type RideSort,
} from '@/models/rideSort'
import { readQueryOption } from '@/utils/queryOption'

/**
 * Pure conversion between a RideSort and URL query parameters, e.g.
 * `/?sort=distance&order=asc`. Kept separate from the composable so it can be
 * tested without a router.
 */

export const SORT_QUERY_KEYS = { field: 'sort', direction: 'order' } as const

/** Reads the sort from the URL. Missing or unrecognised values fall back to the default. */
export function parseRideSortQuery(query: LocationQuery): RideSort {
  return {
    field: readQueryOption(query[SORT_QUERY_KEYS.field], RIDE_SORT_FIELDS, DEFAULT_RIDE_SORT.field),
    direction: readQueryOption(
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
