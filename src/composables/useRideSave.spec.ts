import { describe, it, expect, vi } from 'vitest'

import type { Ride, RideInput } from '@/models/ride'
import type { ValidationResult } from '@/models/rideValidation'

import { useRideSave } from './useRideSave'

// useRideSave only uses ref(), so it can be called directly, outside a component.

const input: RideInput = {
  date: '2026-11-01',
  name: 'Cotter Loop',
  distanceKm: 52,
  elevationM: 540,
}

const ride: Ride = {
  ...input,
  id: 'ride-1',
  createdAt: '2026-11-01T07:00:00.000Z',
  updatedAt: '2026-11-01T07:00:00.000Z',
}

/** A save function whose result the test controls, to observe the in-between state. */
function deferredSave() {
  let resolve: (result: ValidationResult<Ride>) => void = () => {}
  const save = vi.fn<() => Promise<ValidationResult<Ride>>>(
    () =>
      new Promise<ValidationResult<Ride>>((settle) => {
        resolve = settle
      }),
  )
  return { save, resolve: (result: ValidationResult<Ride>) => resolve(result) }
}

describe('useRideSave', () => {
  it('calls onSaved with the saved ride on success', async () => {
    const onSaved = vi.fn<(saved: Ride) => void>()
    const { submit, fieldErrors, saveError } = useRideSave(
      () => Promise.resolve({ valid: true, value: ride }),
      { onSaved },
    )

    await submit(input)

    expect(onSaved).toHaveBeenCalledWith(ride)
    expect(fieldErrors.value).toEqual({})
    expect(saveError.value).toBeNull()
  })

  it('exposes field errors and does not call onSaved for invalid input', async () => {
    const onSaved = vi.fn<(saved: Ride) => void>()
    const { submit, fieldErrors } = useRideSave(
      () => Promise.resolve({ valid: false, errors: { name: 'Enter a ride name.' } }),
      { onSaved },
    )

    await submit(input)

    expect(fieldErrors.value).toEqual({ name: 'Enter a ride name.' })
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('records a storage failure and is ready to try again', async () => {
    const { submit, saveError, submitting } = useRideSave(
      () => Promise.reject(new Error('The quota has been exceeded.')),
      { onSaved: vi.fn<(saved: Ride) => void>() },
    )

    await submit(input)

    expect(saveError.value).toBe('The quota has been exceeded.')
    expect(submitting.value).toBe(false)
  })

  it('clears a previous storage error when trying again', async () => {
    const save = vi
      .fn<() => Promise<ValidationResult<Ride>>>()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce({ valid: true, value: ride })
    const { submit, saveError } = useRideSave(save, { onSaved: vi.fn<(saved: Ride) => void>() })

    await submit(input)
    expect(saveError.value).toBe('Temporary failure')

    await submit(input)
    expect(saveError.value).toBeNull()
  })

  it('is submitting only while the save is in progress', async () => {
    const { save, resolve } = deferredSave()
    const { submit, submitting } = useRideSave(save, { onSaved: vi.fn<(saved: Ride) => void>() })

    const saving = submit(input)
    expect(submitting.value).toBe(true)

    resolve({ valid: true, value: ride })
    await saving
    expect(submitting.value).toBe(false)
  })

  it('ignores a second submit while the first is still saving', async () => {
    const { save, resolve } = deferredSave()
    const onSaved = vi.fn<(saved: Ride) => void>()
    const { submit } = useRideSave(save, { onSaved })

    const first = submit(input)
    await submit(input) // e.g. a double-click; returns immediately
    resolve({ valid: true, value: ride })
    await first

    expect(save).toHaveBeenCalledTimes(1)
    expect(onSaved).toHaveBeenCalledTimes(1)
  })
})
