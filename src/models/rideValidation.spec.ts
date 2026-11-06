import { describe, it, expect } from 'vitest'

import type { RideInput } from './ride'
import { RIDE_NAME_MAX_LENGTH, validateRideInput } from './rideValidation'

const TODAY = '2026-11-06'

function validInput(overrides: Partial<RideInput> = {}): RideInput {
  return {
    date: '2026-11-01',
    name: 'Box Hill loop',
    distanceKm: 42.5,
    elevationM: 610,
    ...overrides,
  }
}

function errorsFor(overrides: Partial<RideInput>) {
  const result = validateRideInput(validInput(overrides), { today: TODAY })
  if (result.valid) throw new Error('Expected validation to fail')
  return result.errors
}

describe('validateRideInput', () => {
  it('accepts valid input unchanged', () => {
    expect(validateRideInput(validInput(), { today: TODAY })).toEqual({
      valid: true,
      value: validInput(),
    })
  })

  describe('normalisation', () => {
    it('trims the name', () => {
      const result = validateRideInput(validInput({ name: '  Box Hill loop  ' }), { today: TODAY })
      expect(result.valid && result.value.name).toBe('Box Hill loop')
    })

    it('rounds distance to 2 decimal places', () => {
      const result = validateRideInput(validInput({ distanceKm: 42.126 }), { today: TODAY })
      expect(result.valid && result.value.distanceKm).toBe(42.13)
    })
  })

  describe('date', () => {
    it('accepts today', () => {
      expect(validateRideInput(validInput({ date: TODAY }), { today: TODAY }).valid).toBe(true)
    })

    it('rejects a future date', () => {
      expect(errorsFor({ date: '2026-11-07' }).date).toMatch(/future/)
    })

    it('rejects an invalid date', () => {
      expect(errorsFor({ date: '2026-02-30' }).date).toBeDefined()
    })
  })

  describe('name', () => {
    it('rejects an empty or whitespace-only name', () => {
      expect(errorsFor({ name: '' }).name).toBeDefined()
      expect(errorsFor({ name: '   ' }).name).toBeDefined()
    })

    it('enforces the maximum length after trimming', () => {
      const atLimit = 'a'.repeat(RIDE_NAME_MAX_LENGTH)
      expect(validateRideInput(validInput({ name: ` ${atLimit} ` }), { today: TODAY }).valid).toBe(
        true,
      )
      expect(errorsFor({ name: atLimit + 'a' }).name).toBeDefined()
    })
  })

  describe('distanceKm', () => {
    it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s', (distanceKm) => {
      expect(errorsFor({ distanceKm }).distanceKm).toBeDefined()
    })

    it('rejects a distance that rounds to 0', () => {
      expect(errorsFor({ distanceKm: 0.004 }).distanceKm).toBeDefined()
    })
  })

  describe('elevationM', () => {
    it('accepts 0 (a flat ride)', () => {
      expect(validateRideInput(validInput({ elevationM: 0 }), { today: TODAY }).valid).toBe(true)
    })

    it.each([-1, 10.5, Number.NaN])('rejects %s', (elevationM) => {
      expect(errorsFor({ elevationM }).elevationM).toBeDefined()
    })
  })

  it('reports every invalid field at once', () => {
    const errors = errorsFor({ date: 'nope', name: '', distanceKm: 0, elevationM: -1 })
    expect(Object.keys(errors).sort()).toEqual(['date', 'distanceKm', 'elevationM', 'name'])
  })
})
