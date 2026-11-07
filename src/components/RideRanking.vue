<script setup lang="ts">
import { useId } from 'vue'

import type { Ride } from '@/models/ride'
import { formatDistanceKm, formatElevationM, formatRideDate } from '@/utils/formatting'

/**
 * A short numbered list of rides ranked by one measure, e.g. "Longest rides".
 * Ride names link to the ride, so it can be opened from here.
 */
const props = defineProps<{
  title: string
  /** Already ranked, best first. */
  rides: readonly Ride[]
  measure: 'distance' | 'elevation'
}>()

const headingId = useId()

function valueOf(ride: Ride): string {
  return props.measure === 'distance'
    ? formatDistanceKm(ride.distanceKm)
    : formatElevationM(ride.elevationM)
}
</script>

<template>
  <section :aria-labelledby="headingId">
    <h3 :id="headingId" class="text-sm font-semibold">{{ title }}</h3>

    <!-- list-decimal + marker:* style the browser's own numbering (1. 2. 3.). -->
    <ol
      v-if="rides.length > 0"
      class="mt-2 list-decimal space-y-2 pl-5 text-sm marker:text-slate-500 dark:marker:text-slate-400"
    >
      <li v-for="ride in rides" :key="ride.id">
        <div class="flex items-baseline justify-between gap-3">
          <RouterLink
            :to="{ name: 'edit-ride', params: { id: ride.id } }"
            class="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
          >
            {{ ride.name }}
          </RouterLink>
          <span class="shrink-0 font-semibold tabular-nums">{{ valueOf(ride) }}</span>
        </div>
        <time :datetime="ride.date" class="text-xs text-slate-600 dark:text-slate-400">
          {{ formatRideDate(ride.date) }}
        </time>
      </li>
    </ol>
    <p v-else class="mt-2 text-sm text-slate-600 dark:text-slate-400">No rides in this period.</p>
  </section>
</template>
