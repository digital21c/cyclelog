<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import { useElementWidth } from '@/composables/useElementWidth'
import { niceScale } from '@/utils/niceScale'

export interface Bar {
  /** Unique and stable, e.g. the period's start date. */
  key: string
  /** Full label for the tooltip, e.g. "Mon, 2 Nov 2026". */
  label: string
  /** Compact axis label, e.g. "2 Nov". */
  shortLabel: string
  value: number
  /** Formatted value for the tooltip, e.g. "112.4 km". */
  valueLabel: string
}

/**
 * A simple, dependency-free SVG bar chart.
 *
 * It measures its container and draws in real pixels, so text stays a
 * readable size on a phone (a scaled-down viewBox would shrink the text too).
 * The exact values are in the table beside it; the chart is a visual summary.
 */
const props = withDefaults(
  defineProps<{
    /** Read by screen readers, e.g. "Bar chart of weekly distance". */
    title: string
    bars: readonly Bar[]
    /** Tailwind fill classes for the bars, e.g. "fill-sky-600 dark:fill-sky-400". */
    barClass: string
    height?: number
    formatTick?: (value: number) => string
  }>(),
  {
    height: 220,
    formatTick: (value: number) => new Intl.NumberFormat('en-GB').format(value),
  },
)

const container = useTemplateRef('container')
const width = useElementWidth(container)

// Space around the plotting area for the axis labels.
const MARGIN = { top: 12, right: 8, bottom: 28, left: 48 }
const MIN_LABEL_SPACING = 44 // px between x-axis labels, so they never overlap

const plot = computed(() => ({
  width: Math.max(0, width.value - MARGIN.left - MARGIN.right),
  height: props.height - MARGIN.top - MARGIN.bottom,
}))

const scale = computed(() => niceScale(Math.max(0, ...props.bars.map((bar) => bar.value))))

/** Distance down from the top of the chart for a value. */
function yFor(value: number): number {
  return MARGIN.top + plot.value.height * (1 - value / scale.value.max)
}

const layout = computed(() => {
  const count = props.bars.length
  const slot = count > 0 ? plot.value.width / count : 0
  const barWidth = Math.min(48, slot * 0.7)
  // With many bars, label every nth one, counting back from the newest.
  const labelEvery = Math.max(1, Math.ceil((count * MIN_LABEL_SPACING) / plot.value.width))

  return props.bars.map((bar, index) => {
    const centre = MARGIN.left + slot * index + slot / 2
    const top = yFor(bar.value)
    return {
      ...bar,
      x: centre - barWidth / 2,
      y: top,
      width: barWidth,
      height: MARGIN.top + plot.value.height - top,
      centre,
      showLabel: (count - 1 - index) % labelEvery === 0,
    }
  })
})

const ticks = computed(() =>
  scale.value.ticks.map((value) => ({ value, y: yFor(value), label: props.formatTick(value) })),
)
</script>

<template>
  <div ref="container" class="w-full">
    <svg
      role="img"
      :aria-label="title"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="block max-w-full"
    >
      <!-- Horizontal grid lines with value labels -->
      <g class="text-[11px]">
        <g v-for="tick in ticks" :key="tick.value">
          <line
            :x1="MARGIN.left"
            :x2="width - MARGIN.right"
            :y1="tick.y"
            :y2="tick.y"
            class="stroke-slate-200 dark:stroke-slate-700"
          />
          <text
            :x="MARGIN.left - 6"
            :y="tick.y"
            text-anchor="end"
            dominant-baseline="middle"
            class="fill-slate-500 tabular-nums dark:fill-slate-400"
          >
            {{ tick.label }}
          </text>
        </g>
      </g>

      <!-- Bars, each with a native tooltip (hover, or long-press on touch) -->
      <rect
        v-for="bar in layout"
        :key="bar.key"
        :x="bar.x"
        :y="bar.y"
        :width="bar.width"
        :height="bar.height"
        rx="2"
        :class="barClass"
      >
        <title>{{ bar.label }}: {{ bar.valueLabel }}</title>
      </rect>

      <!-- Period labels along the bottom -->
      <g class="text-[11px]">
        <template v-for="bar in layout" :key="bar.key">
          <text
            v-if="bar.showLabel"
            :x="bar.centre"
            :y="height - 8"
            text-anchor="middle"
            class="fill-slate-500 dark:fill-slate-400"
          >
            {{ bar.shortLabel }}
          </text>
        </template>
      </g>
    </svg>
  </div>
</template>
