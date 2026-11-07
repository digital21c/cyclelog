import { describe, it, expect } from 'vitest'

import {
  formatActivePeriods,
  formatAverageCount,
  formatDistanceKm,
  formatElevationM,
  formatPeriodCount,
  formatPeriodLabel,
  formatPeriodShortLabel,
  formatRideCount,
  formatRideDate,
} from './formatting'

describe('formatRideDate', () => {
  it('formats as short weekday, day, short month and year', () => {
    expect(formatRideDate('2026-11-01')).toBe('Sun, 1 Nov 2026')
  })

  it('shows the stored calendar day, not the day before', () => {
    expect(formatRideDate('2026-01-01')).toBe('Thu, 1 Jan 2026')
  })
})

describe('formatDistanceKm', () => {
  it.each([
    [42.13, '42.1 km'],
    [42, '42 km'],
    [1.05, '1.1 km'],
    [150, '150 km'],
  ])('%s → %s', (value, expected) => {
    expect(formatDistanceKm(value)).toBe(expected)
  })
})

describe('formatElevationM', () => {
  it.each([
    [610, '610 m'],
    [0, '0 m'],
    [1234, '1,234 m'],
  ])('%s → %s', (value, expected) => {
    expect(formatElevationM(value)).toBe(expected)
  })
})

describe('formatRideCount', () => {
  it.each([
    [0, '0 rides'],
    [1, '1 ride'],
    [2, '2 rides'],
    [40, '40 rides'],
  ])('%s → %s', (count, expected) => {
    expect(formatRideCount(count)).toBe(expected)
  })
})

describe('period labels', () => {
  it.each([
    ['week', '2026-11-02', '2 Nov 2026', '2 Nov'],
    ['month', '2026-11-01', 'November 2026', 'Nov'],
    ['month', '2026-09-01', 'September 2026', 'Sept'],
    ['year', '2026-01-01', '2026', '2026'],
  ] as const)('%s starting %s → "%s" / "%s"', (period, start, full, short) => {
    expect(formatPeriodLabel(start, period)).toBe(full)
    expect(formatPeriodShortLabel(start, period)).toBe(short)
  })

  it.each([
    [1, 'week', '1 week'],
    [12, 'week', '12 weeks'],
    [12, 'month', '12 months'],
    [3, 'year', '3 years'],
  ] as const)('counts %s %s as "%s"', (count, period, expected) => {
    expect(formatPeriodCount(count, period)).toBe(expected)
  })
})

describe('highlight formatting', () => {
  it.each([
    [2.75, '2.8'],
    [3, '3'],
    [0, '0'],
    [12.04, '12'],
  ])('formats the average count %s as "%s"', (value, expected) => {
    expect(formatAverageCount(value)).toBe(expected)
  })

  it('describes how many periods had a ride', () => {
    expect(formatActivePeriods(10, 12, 'week')).toBe('Ridden in 10 of 12 weeks')
    expect(formatActivePeriods(1, 1, 'year')).toBe('Ridden in 1 of 1 year')
  })
})
