import { describe, it, expect } from 'vitest'

import { parseStatsPeriod, withStatsPeriod } from './useStatsPeriodQuery'

describe('parseStatsPeriod', () => {
  it('defaults to weekly', () => {
    expect(parseStatsPeriod({})).toBe('week')
  })

  it.each(['week', 'month', 'year'] as const)('reads %s', (period) => {
    expect(parseStatsPeriod({ period })).toBe(period)
  })

  it.each(['fortnight', 'MONTH', null])('ignores %s', (period) => {
    expect(parseStatsPeriod({ period })).toBe('week')
  })
})

describe('withStatsPeriod', () => {
  it('leaves the default out of the URL', () => {
    expect(withStatsPeriod({ period: 'year' }, 'week')).toEqual({})
  })

  it('writes other periods and keeps unrelated parameters', () => {
    expect(withStatsPeriod({ other: 'x' }, 'month')).toEqual({ other: 'x', period: 'month' })
  })
})
