import { describe, it, expect } from 'vitest'

import {
  compareIsoDates,
  isoDateToLocalDate,
  isValidIsoDate,
  toIsoDate,
  todayIsoDate,
} from './isoDate'

describe('isValidIsoDate', () => {
  it.each(['2026-11-06', '2024-02-29', '2026-12-31', '2026-01-01'])('accepts %s', (value) => {
    expect(isValidIsoDate(value)).toBe(true)
  })

  it.each([
    ['impossible day', '2026-02-30'],
    ['non-leap 29 Feb', '2025-02-29'],
    ['month 13', '2026-13-01'],
    ['day 0', '2026-11-00'],
    ['missing zero padding', '2026-1-6'],
    ['UK order', '06/11/2026'],
    ['includes a time', '2026-11-06T10:00:00Z'],
    ['empty string', ''],
  ])('rejects %s (%s)', (_label, value) => {
    expect(isValidIsoDate(value)).toBe(false)
  })
})

describe('toIsoDate / todayIsoDate', () => {
  it('uses the local calendar day, even late in the evening', () => {
    // Built with local-time arguments, so this is 23:30 on 6 Nov wherever the test runs.
    // toISOString() would give 7 Nov for anyone east of UTC; we must not.
    const lateEvening = new Date(2026, 10, 6, 23, 30)
    expect(toIsoDate(lateEvening)).toBe('2026-11-06')
    expect(todayIsoDate(lateEvening)).toBe('2026-11-06')
  })

  it('zero-pads month and day', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('compareIsoDates', () => {
  it('orders dates chronologically', () => {
    expect(compareIsoDates('2026-01-31', '2026-02-01')).toBeLessThan(0)
    expect(compareIsoDates('2026-02-01', '2026-01-31')).toBeGreaterThan(0)
    expect(compareIsoDates('2026-02-01', '2026-02-01')).toBe(0)
  })

  it('works as a sort comparator', () => {
    const dates = ['2026-03-01', '2025-12-31', '2026-01-15']
    expect([...dates].sort(compareIsoDates)).toEqual(['2025-12-31', '2026-01-15', '2026-03-01'])
  })
})

describe('isoDateToLocalDate', () => {
  it('gives local midnight on the same calendar day', () => {
    const date = isoDateToLocalDate('2026-11-06')
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 10, 6, 0,
    ])
  })

  it('round-trips with toIsoDate', () => {
    expect(toIsoDate(isoDateToLocalDate('2024-02-29'))).toBe('2024-02-29')
  })

  it('throws for an invalid date', () => {
    expect(() => isoDateToLocalDate('2026-02-30')).toThrow('Not a valid ISO date')
  })
})
