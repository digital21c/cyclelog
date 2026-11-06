import { computed, type WritableComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { RideSort } from '@/models/rideSort'

import { parseRideSortQuery, withRideSortQuery } from './rideSortQuery'

/**
 * The ride list's sort order, stored in the URL query string.
 *
 * Returns a writable computed: reading it parses the current URL, and
 * assigning to it updates the URL, which in turn updates the value. The URL
 * is the single source of truth, so the sort survives navigation and reloads.
 *
 * `router.replace` (not `push`) is used so that changing the sort doesn't add
 * browser history entries; Back leaves the list rather than undoing sorts.
 */
export function useRideSortQuery(): WritableComputedRef<RideSort> {
  const route = useRoute()
  const router = useRouter()

  return computed({
    get: () => parseRideSortQuery(route.query),
    set: (sort) => {
      void router.replace({ query: withRideSortQuery(route.query, sort) })
    },
  })
}
