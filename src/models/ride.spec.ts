import { describe, it, expect } from 'vitest'

import { compareRidesNewestFirst, createRide, updateRide, type Ride, type RideInput } from './ride'

// Local-time constructor: 6 Nov 2026, 09:00 wherever the test runs.
const NOW = new Date(2026, 10, 6, 9, 0)
const LATER = new Date(2026, 10, 6, 18, 0)

const input: RideInput = {
  date: '2026-11-01',
  name: '  Box Hill loop ',
  distanceKm: 42.126,
  elevationM: 610,
}

function createValidRide(): Ride {
  const result = createRide(input, { now: NOW, generateId: () => 'ride-1' })
  if (!result.valid) throw new Error('Expected a valid ride')
  return result.value
}

describe('createRide', () => {
  it('assigns an id and matching timestamps, and normalises the input', () => {
    expect(createValidRide()).toEqual({
      id: 'ride-1',
      date: '2026-11-01',
      name: 'Box Hill loop',
      distanceKm: 42.13,
      elevationM: 610,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    })
  })

  it('returns field errors instead of a ride when input is invalid', () => {
    const result = createRide({ ...input, name: '' }, { now: NOW, generateId: () => 'ride-1' })
    expect(result.valid).toBe(false)
    expect(!result.valid && result.errors.name).toBeTruthy()
  })

  it('rejects a date after the injected "now"', () => {
    const result = createRide({ ...input, date: '2026-11-07' }, { now: NOW })
    expect(!result.valid && result.errors.date).toBeTruthy()
  })

  it('uses crypto.randomUUID by default', () => {
    const result = createRide(input, { now: NOW })
    expect(result.valid && result.value.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })
})

describe('updateRide', () => {
  it('applies edits, keeps id and createdAt, and refreshes updatedAt', () => {
    const original = createValidRide()
    const result = updateRide(original, { ...input, name: 'Box Hill reps' }, { now: LATER })

    expect(result).toEqual({
      valid: true,
      value: {
        ...original,
        name: 'Box Hill reps',
        updatedAt: LATER.toISOString(),
      },
    })
  })

  it('does not modify the original ride', () => {
    const original = createValidRide()
    const snapshot = structuredClone(original)
    updateRide(original, { ...input, name: 'Changed' }, { now: LATER })
    expect(original).toEqual(snapshot)
  })

  it('returns errors and no ride when the edit is invalid', () => {
    const result = updateRide(createValidRide(), { ...input, distanceKm: 0 }, { now: LATER })
    expect(!result.valid && result.errors.distanceKm).toBeTruthy()
  })
})

describe('compareRidesNewestFirst', () => {
  const base = createValidRide()

  it('orders by ride date, newest first', () => {
    const older = { ...base, id: 'older', date: '2026-10-01' }
    const newer = { ...base, id: 'newer', date: '2026-11-01' }
    expect([older, newer].sort(compareRidesNewestFirst).map((ride) => ride.id)).toEqual([
      'newer',
      'older',
    ])
  })

  it('breaks same-day ties by most recently recorded', () => {
    const morning = { ...base, id: 'morning', createdAt: '2026-11-01T08:00:00.000Z' }
    const evening = { ...base, id: 'evening', createdAt: '2026-11-01T19:00:00.000Z' }
    expect([morning, evening].sort(compareRidesNewestFirst).map((ride) => ride.id)).toEqual([
      'evening',
      'morning',
    ])
  })
})
