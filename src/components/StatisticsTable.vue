<script setup lang="ts">
import { computed } from 'vue'

import type { PeriodSummary } from '@/services/rideStatistics'
import {
  formatDistanceKm,
  formatElevationM,
  formatPeriodCount,
  formatPeriodLabel,
} from '@/utils/formatting'

/** Totals per period as an accessible table, newest period first, with a totals row. */
const props = defineProps<{
  summary: PeriodSummary
  caption: string
}>()

const periodHeading = computed(
  () => ({ week: 'Week of', month: 'Month', year: 'Year' })[props.summary.period],
)

// The summary is oldest first (for charts); tables read newest first, like the ride list.
const newestFirst = computed(() => [...props.summary.rows].reverse())
</script>

<template>
  <!-- On narrow screens the table scrolls inside this box rather than the whole page. -->
  <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
    <table class="w-full text-sm">
      <caption class="sr-only">
        {{
          caption
        }}
      </caption>
      <thead class="bg-slate-100 text-left dark:bg-slate-800">
        <tr>
          <th scope="col" class="px-2 py-2 sm:px-3 font-semibold">{{ periodHeading }}</th>
          <th scope="col" class="px-2 py-2 sm:px-3 text-right font-semibold">Rides</th>
          <th scope="col" class="px-2 py-2 sm:px-3 text-right font-semibold">Distance</th>
          <th scope="col" class="px-2 py-2 sm:px-3 text-right font-semibold">Climb</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
        <tr v-for="row in newestFirst" :key="row.periodStart">
          <th scope="row" class="px-2 py-2 sm:px-3 text-left font-normal whitespace-nowrap">
            <time :datetime="row.periodStart">
              {{ formatPeriodLabel(row.periodStart, summary.period) }}
            </time>
          </th>
          <td class="px-2 py-2 sm:px-3 text-right tabular-nums">{{ row.rideCount }}</td>
          <td class="px-2 py-2 sm:px-3 text-right whitespace-nowrap tabular-nums">
            {{ formatDistanceKm(row.distanceKm) }}
          </td>
          <td class="px-2 py-2 sm:px-3 text-right whitespace-nowrap tabular-nums">
            {{ formatElevationM(row.elevationM) }}
          </td>
        </tr>
      </tbody>
      <tfoot
        class="border-t-2 border-slate-300 bg-slate-50 font-semibold dark:border-slate-600 dark:bg-slate-800"
      >
        <tr>
          <th scope="row" class="px-2 py-2 sm:px-3 text-left">
            {{ formatPeriodCount(summary.rows.length, summary.period) }}
          </th>
          <td class="px-2 py-2 sm:px-3 text-right tabular-nums">{{ summary.totals.rideCount }}</td>
          <td class="px-2 py-2 sm:px-3 text-right whitespace-nowrap tabular-nums">
            {{ formatDistanceKm(summary.totals.distanceKm) }}
          </td>
          <td class="px-2 py-2 sm:px-3 text-right whitespace-nowrap tabular-nums">
            {{ formatElevationM(summary.totals.elevationM) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
