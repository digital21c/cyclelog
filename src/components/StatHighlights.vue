<script setup lang="ts">
import { computed } from 'vue'

import type { Highlights } from '@/services/rideStatistics'
import {
  formatActivePeriods,
  formatAverageCount,
  formatDistanceKm,
  formatElevationM,
} from '@/utils/formatting'

/** Headline figures for the selected timeframe, as label/value tiles. */
const props = defineProps<{
  highlights: Highlights
}>()

interface Tile {
  label: string
  /** null means "no value": shown as a dash, read out as "No rides". */
  value: string | null
  detail?: string
}

const tiles = computed<Tile[]>(() => {
  const h = props.highlights
  return [
    { label: 'Rides', value: String(h.rideCount) },
    {
      label: `Rides per ${h.period}`,
      value: formatAverageCount(h.ridesPerPeriod),
      detail: `${formatActivePeriods(h.activePeriodCount, h.periodCount, h.period)}, counting this ${h.period}`,
    },
    {
      label: 'Average distance',
      value: h.averageDistanceKm === null ? null : formatDistanceKm(h.averageDistanceKm),
      detail: 'per ride',
    },
    {
      label: 'Average climb',
      value: h.averageElevationM === null ? null : formatElevationM(h.averageElevationM),
      detail: 'per ride',
    },
  ]
})
</script>

<template>
  <!-- A description list: each tile is a term (label) and its description (value). -->
  <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <div
      v-for="tile in tiles"
      :key="tile.label"
      class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
    >
      <dt class="text-xs font-medium text-slate-600 dark:text-slate-400">{{ tile.label }}</dt>
      <dd class="mt-1 text-2xl font-semibold tabular-nums">
        <template v-if="tile.value !== null">{{ tile.value }}</template>
        <template v-else>
          <span aria-hidden="true">—</span>
          <span class="sr-only">No rides</span>
        </template>
      </dd>
      <dd v-if="tile.detail" class="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
        {{ tile.detail }}
      </dd>
    </div>
  </dl>
</template>
