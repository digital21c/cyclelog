import { describe, it, expect } from 'vitest'

import { niceScale } from './niceScale'

describe('niceScale', () => {
  it.each([
    [473, 500, [0, 100, 200, 300, 400, 500]],
    [100, 100, [0, 20, 40, 60, 80, 100]],
    [112.4, 125, [0, 25, 50, 75, 100, 125]],
    [1240, 1250, [0, 250, 500, 750, 1000, 1250]],
    [9, 10, [0, 2, 4, 6, 8, 10]],
    [0.3, 0.3, [0, 0.1, 0.2, 0.3]],
    [14210, 15000, [0, 5000, 10000, 15000]],
  ])('largest value %s → axis to %s', (largest, max, ticks) => {
    expect(niceScale(largest)).toEqual({ max, ticks })
  })

  it('always reaches at least the largest value', () => {
    for (const largest of [1, 3.7, 49, 51, 99.9, 101, 777, 1499, 25000]) {
      expect(niceScale(largest).max).toBeGreaterThanOrEqual(largest)
    }
  })

  it('keeps the number of ticks readable', () => {
    for (const largest of [1, 3.7, 49, 51, 99.9, 101, 777, 1499, 25000]) {
      const count = niceScale(largest).ticks.length
      expect(count).toBeGreaterThanOrEqual(3)
      expect(count).toBeLessThanOrEqual(8)
    }
  })

  it('gives an all-zero chart a simple axis', () => {
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] })
    expect(niceScale(Number.NaN)).toEqual({ max: 1, ticks: [0, 1] })
  })
})
