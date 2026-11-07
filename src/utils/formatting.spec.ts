import { describe, it, expect } from 'vitest'

import { formatDistanceKm, formatElevationM, formatRideCount, formatRideDate } from './formatting'

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
