/**
 * Chooses a chart axis from 0 to a "nice" maximum, with evenly spaced ticks
 * at round numbers: for a largest value of 473, ticks 0, 100, 200 … 500
 * rather than 0, 94.6, 189.2 …
 *
 * Steps are 1, 2, 2.5 or 5 times a power of ten, the sizes people read easily.
 */
export interface NiceScale {
  /** Top of the axis: the last tick, at or above the largest value. */
  max: number
  /** Tick values from 0 to `max`, inclusive. */
  ticks: number[]
}

const NICE_STEPS = [1, 2, 2.5, 5, 10]

export function niceScale(largestValue: number, targetTickCount = 5): NiceScale {
  // An all-zero (or empty) chart still needs an axis to draw.
  if (!(largestValue > 0)) return { max: 1, ticks: [0, 1] }

  const roughStep = largestValue / targetTickCount
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const residual = roughStep / magnitude
  const niceMultiplier = NICE_STEPS.find((step) => residual <= step) ?? 10
  const step = niceMultiplier * magnitude

  const tickCount = Math.ceil(largestValue / step)
  // Round away floating-point noise such as 0.30000000000000004.
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Number((i * step).toPrecision(12)))
  return { max: ticks.at(-1) ?? step, ticks }
}
