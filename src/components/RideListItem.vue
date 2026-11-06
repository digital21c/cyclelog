<script setup lang="ts">
import type { Ride } from '@/models/ride'
import { formatDistanceKm, formatElevationM, formatRideDate } from '@/utils/formatting'

defineProps<{
  ride: Ride
}>()
</script>

<template>
  <article
    class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
  >
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="font-semibold">{{ ride.name }}</h2>
      <time :datetime="ride.date" class="shrink-0 text-sm text-slate-600 dark:text-slate-400">
        {{ formatRideDate(ride.date) }}
      </time>
    </div>

    <dl class="mt-2 flex gap-6 text-sm">
      <div>
        <dt class="text-slate-600 dark:text-slate-400">Distance</dt>
        <dd class="font-medium tabular-nums">{{ formatDistanceKm(ride.distanceKm) }}</dd>
      </div>
      <div>
        <dt class="text-slate-600 dark:text-slate-400">Climb</dt>
        <dd class="font-medium tabular-nums">{{ formatElevationM(ride.elevationM) }}</dd>
      </div>
    </dl>
  </article>
</template>
