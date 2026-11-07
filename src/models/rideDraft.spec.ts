import { describe, it, expect } from 'vitest'

import { draftToRideInput, emptyRideDraft, type RideDraft } from './rideDraft'

function draft(overrides: Partial<RideDraft> = {}): RideDraft {
  return {
    date: '2026-11-06',
    name: 'Cotter Loop',
    distanceKm: '52.4',
    elevationM: '540',
    ...overrides,
  }
}

describe('emptyRideDraft', () => {
  it('is dated today with every other field blank', () => {
    expect(emptyRideDraft('2026-11-07')).toEqual({
      date: '2026-11-07',
      name: '',
      distanceKm: '',
      elevationM: '',
    })
  })
})

describe('draftToRideInput', () => {
  it('converts numeric text to numbers', () => {
    expect(draftToRideInput(draft())).toEqual({
      date: '2026-11-06',
      name: 'Cotter Loop',
      distanceKm: 52.4,
      elevationM: 540,
    })
  })

  it('leaves the name untrimmed (validation normalises it)', () => {
    expect(draftToRideInput(draft({ name: '  Cotter Loop ' })).name).toBe('  Cotter Loop ')
  })

  it.each(['42', '42.5', '42.', '.5', ' 42 ', '0'])('accepts the number "%s"', (text) => {
    expect(draftToRideInput(draft({ distanceKm: text })).distanceKm).toBe(Number(text.trim()))
  })

  it.each(['', '   ', 'abc', '-5', '+5', '1e3', '0x10', 'Infinity', '1,234', '4 2', '42km'])(
    'turns "%s" into NaN',
    (text) => {
      expect(draftToRideInput(draft({ distanceKm: text, elevationM: text }))).toMatchObject({
        distanceKm: Number.NaN,
        elevationM: Number.NaN,
      })
    },
  )
})
