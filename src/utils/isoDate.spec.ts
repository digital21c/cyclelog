import { describe, it, expect } from 'vitest'

import {
  addDays,
  addMonths,
  compareIsoDates,
  isoDateToLocalDate,
  isValidIsoDate,
  startOfIsoWeek,
  startOfMonth,
  startOfYear,
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

describe('addDays', () => {
  it.each([
    ['2026-11-06', 1, '2026-11-07'],
    ['2026-11-30', 1, '2026-12-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2024-02-28', 1, '2024-02-29'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2026-11-06', -84, '2026-08-14'],
  ])('%s %+d days → %s', (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected)
  })

  it('is unaffected by daylight-saving changes', () => {
    // Sydney's clocks change on 5 Oct 2026 and 5 Apr 2026; Europe's on 29 Mar / 25 Oct.
    expect(addDays('2026-10-04', 1)).toBe('2026-10-05')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
  })
})

describe('addMonths', () => {
  it.each([
    ['2026-11-01', 1, '2026-12-01'],
    ['2026-12-01', 1, '2027-01-01'],
    ['2026-11-01', -11, '2025-12-01'],
    ['2026-01-31', 1, '2026-02-28'],
    ['2024-01-31', 1, '2024-02-29'],
    ['2026-03-31', -1, '2026-02-28'],
  ])('%s %+d months → %s', (date, months, expected) => {
    expect(addMonths(date, months)).toBe(expected)
  })
})

describe('startOfIsoWeek', () => {
  it.each([
    ['2026-11-02', '2026-11-02'], // Monday
    ['2026-11-07', '2026-11-02'], // Saturday
    ['2026-11-08', '2026-11-02'], // Sunday belongs to the week that began on Monday
    ['2026-01-01', '2025-12-29'], // Thursday: the week starts in the previous year
    ['2026-03-01', '2026-02-23'], // across a month boundary
  ])('%s → %s', (date, expected) => {
    expect(startOfIsoWeek(date)).toBe(expected)
  })
})

describe('startOfMonth / startOfYear', () => {
  it('finds the first day of the month and year', () => {
    expect(startOfMonth('2026-11-07')).toBe('2026-11-01')
    expect(startOfYear('2026-11-07')).toBe('2026-01-01')
  })

  it('rejects invalid dates', () => {
    expect(() => startOfMonth('2026-02-30')).toThrow('Not a valid ISO date')
    expect(() => startOfYear('nope')).toThrow('Not a valid ISO date')
  })
})
