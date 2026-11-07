<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import AlertMessage from '@/components/AlertMessage.vue'
import BarChart, { type Bar } from '@/components/BarChart.vue'
import SegmentedControl from '@/components/SegmentedControl.vue'
import StatisticsTable from '@/components/StatisticsTable.vue'
import { useStatsPeriodQuery } from '@/composables/useStatsPeriodQuery'
import { summariseByPeriod, type StatsPeriod } from '@/services/rideStatistics'
import { useRidesStore } from '@/stores/rides'
import {
  formatDistanceKm,
  formatElevationM,
  formatPeriodCount,
  formatPeriodLabel,
  formatPeriodShortLabel,
} from '@/utils/formatting'
import { todayIsoDate } from '@/utils/isoDate'

const ridesStore = useRidesStore()
const { rides, rideCount, loadStatus, loadError } = storeToRefs(ridesStore)
const isLoading = computed(() => loadStatus.value === 'idle' || loadStatus.value === 'loading')

const period = useStatsPeriodQuery()
const periodOptions: { value: StatsPeriod; label: string }[] = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
]

const today = todayIsoDate()

// All calculation happens in the service; the page only chooses what to show.
const summary = computed(() => summariseByPeriod(rides.value, period.value, today))

/** Chart bars, oldest to newest (left to right), one chart per measure. */
function barsFor(measure: 'distanceKm' | 'elevationM'): Bar[] {
  const format = measure === 'distanceKm' ? formatDistanceKm : formatElevationM
  return summary.value.rows.map((row) => ({
    key: row.periodStart,
    label: `${summary.value.period === 'week' ? 'Week of ' : ''}${formatPeriodLabel(
      row.periodStart,
      summary.value.period,
    )}`,
    shortLabel: formatPeriodShortLabel(row.periodStart, summary.value.period),
    value: row[measure],
    valueLabel: format(row[measure]),
  }))
}
const distanceBars = computed(() => barsFor('distanceKm'))
const climbBars = computed(() => barsFor('elevationM'))

/** e.g. "Weekly totals, last 12 weeks" or "Yearly totals, 2024 to 2026". */
const caption = computed(() => {
  const { period: shown, rows } = summary.value
  const label = periodOptions.find((option) => option.value === shown)?.label ?? ''
  if (shown === 'year') {
    const first = rows[0]?.periodStart.slice(0, 4)
    const last = rows.at(-1)?.periodStart.slice(0, 4)
    return `${label} totals, ${first === last ? first : `${first} to ${last}`}`
  }
  return `${label} totals, last ${formatPeriodCount(rows.length, shown)}`
})
</script>

<template>
  <section aria-labelledby="stats-heading">
    <h1 id="stats-heading" class="text-2xl font-bold">Statistics</h1>

    <p v-if="isLoading" role="status" class="mt-4 text-slate-600 dark:text-slate-400">
      Loading rides…
    </p>

    <AlertMessage
      v-else-if="loadStatus === 'error'"
      class="mt-4"
      title="Your rides couldn't be loaded."
      :message="loadError"
    />

    <p v-else-if="rideCount === 0" class="mt-4 text-slate-600 dark:text-slate-400">
      No rides recorded yet, so there's nothing to total.
      <RouterLink
        :to="{ name: 'add-ride' }"
        class="font-medium text-sky-700 underline hover:text-sky-800 dark:text-sky-400"
      >
        Add your first ride
      </RouterLink>
    </p>

    <template v-else>
      <SegmentedControl
        v-model="period"
        class="mt-4"
        :options="periodOptions"
        legend="Show totals per"
      />

      <h2 class="mt-6 text-lg font-semibold">{{ caption }}</h2>

      <div class="mt-3 grid gap-6">
        <figure>
          <figcaption class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Distance (km)
          </figcaption>
          <BarChart
            class="mt-1"
            :title="`Bar chart of distance: ${caption}`"
            :bars="distanceBars"
            bar-class="fill-sky-600 dark:fill-sky-400"
          />
        </figure>

        <figure>
          <figcaption class="text-sm font-medium text-slate-600 dark:text-slate-400">
            Climb (m)
          </figcaption>
          <BarChart
            class="mt-1"
            :title="`Bar chart of climb: ${caption}`"
            :bars="climbBars"
            bar-class="fill-emerald-600 dark:fill-emerald-400"
          />
        </figure>
      </div>

      <StatisticsTable class="mt-8" :summary="summary" :caption="caption" />
    </template>
  </section>
</template>
