import { describe, it, expect } from 'vitest'

import { draftToRideInput, emptyRideDraft, rideToDraft, type RideDraft } from './rideDraft'

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

describe('rideToDraft', () => {
  it('turns numbers into the text shown in the form', () => {
    expect(
      rideToDraft({ date: '2026-11-06', name: 'Cotter Loop', distanceKm: 52.4, elevationM: 540 }),
    ).toEqual({ date: '2026-11-06', name: 'Cotter Loop', distanceKm: '52.4', elevationM: '540' })
  })

  it.each([
    { date: '2026-11-06', name: 'Commute', distanceKm: 1, elevationM: 0 },
    { date: '2026-01-31', name: 'Corin Dam Climb', distanceKm: 142.05, elevationM: 1500 },
    { date: '2025-12-25', name: 'Christmas spin', distanceKm: 0.5, elevationM: 10 },
  ])('round-trips $name unchanged through the form', (input) => {
    expect(draftToRideInput(rideToDraft(input))).toEqual(input)
  })
})
