import { describe, it, expect } from 'vitest'

import { DEFAULT_RIDE_SORT } from '@/models/rideSort'

import { parseRideSortQuery, withRideSortQuery } from './rideSortQuery'

describe('parseRideSortQuery', () => {
  it('uses the default when the query is empty', () => {
    expect(parseRideSortQuery({})).toEqual(DEFAULT_RIDE_SORT)
  })

  it('reads a valid field and direction', () => {
    expect(parseRideSortQuery({ sort: 'distance', order: 'asc' })).toEqual({
      field: 'distance',
      direction: 'asc',
    })
  })

  it('reads each parameter independently', () => {
    expect(parseRideSortQuery({ order: 'asc' })).toEqual({ field: 'date', direction: 'asc' })
    expect(parseRideSortQuery({ sort: 'elevation' })).toEqual({
      field: 'elevation',
      direction: 'desc',
    })
  })

  it.each([
    ['an unknown field', { sort: 'banana' }],
    ['an unknown direction', { order: 'sideways' }],
    ['wrong case', { sort: 'Distance', order: 'ASC' }],
    ['an empty value', { sort: null, order: null }],
  ])('ignores %s', (_label, query) => {
    expect(parseRideSortQuery(query)).toEqual(DEFAULT_RIDE_SORT)
  })

  it('uses the first value when a parameter is repeated', () => {
    expect(parseRideSortQuery({ sort: ['elevation', 'distance'] }).field).toBe('elevation')
  })
})

describe('withRideSortQuery', () => {
  it('omits default values, giving a clean URL', () => {
    expect(withRideSortQuery({ sort: 'distance', order: 'asc' }, DEFAULT_RIDE_SORT)).toEqual({})
  })

  it('writes non-default values', () => {
    expect(withRideSortQuery({}, { field: 'elevation', direction: 'asc' })).toEqual({
      sort: 'elevation',
      order: 'asc',
    })
  })

  it('keeps unrelated query parameters', () => {
    expect(withRideSortQuery({ page: '2' }, { field: 'distance', direction: 'desc' })).toEqual({
      page: '2',
      sort: 'distance',
    })
  })

  it('round-trips with parseRideSortQuery', () => {
    const sort = { field: 'distance', direction: 'asc' } as const
    const query = withRideSortQuery({}, sort) as Record<string, string>
    expect(parseRideSortQuery(query)).toEqual(sort)
  })
})
