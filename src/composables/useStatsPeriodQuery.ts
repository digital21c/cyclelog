import { computed, type WritableComputedRef } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'

import { STATS_PERIODS, type StatsPeriod } from '@/services/rideStatistics'
import { readQueryOption } from '@/utils/queryOption'

export const DEFAULT_STATS_PERIOD: StatsPeriod = 'week'
const PERIOD_KEY = 'period'

/** Reads `?period=` from the URL; missing or unknown values mean weekly. */
export function parseStatsPeriod(query: LocationQuery): StatsPeriod {
  return readQueryOption(query[PERIOD_KEY], STATS_PERIODS, DEFAULT_STATS_PERIOD)
}

/** Writes the period into a query, keeping other parameters; the default is left out. */
export function withStatsPeriod(query: LocationQuery, period: StatsPeriod): LocationQueryRaw {
  const result: LocationQueryRaw = { ...query }
  delete result[PERIOD_KEY]
  if (period !== DEFAULT_STATS_PERIOD) result[PERIOD_KEY] = period
  return result
}

/**
 * The statistics period, held in the URL (e.g. `/stats?period=month`) so it
 * survives reloads and the Back button. Same pattern as useRideSortQuery.
 */
export function useStatsPeriodQuery(): WritableComputedRef<StatsPeriod> {
  const route = useRoute()
  const router = useRouter()

  return computed({
    get: () => parseStatsPeriod(route.query),
    set: (period) => {
      void router.replace({ query: withStatsPeriod(route.query, period) })
    },
  })
}
