import { compareIsoDates, isValidIsoDate, todayIsoDate, type IsoDate } from '@/utils/isoDate'

import type { RideInput } from './ride'

export const RIDE_NAME_MAX_LENGTH = 100

/** One error message per invalid field. Fields that passed are absent. */
export type RideInputErrors = Partial<Record<keyof RideInput, string>>

/**
 * Either the (normalised) value, or the reasons it was rejected.
 * Checking `result.valid` lets TypeScript narrow to the right shape.
 */
export type ValidationResult<T> =
  { valid: true; value: T } | { valid: false; errors: RideInputErrors }

export interface ValidationOptions {
  /** The latest allowed ride date. Defaults to today in local time. */
  today?: IsoDate
}

/**
 * Validates and normalises ride input.
 *
 * Normalises harmless differences: trims the name, rounds distance to 2 dp.
 * Rejects anything actually wrong, reporting every invalid field at once
 * so a form can show all messages together.
 */
export function validateRideInput(
  input: RideInput,
  options: ValidationOptions = {},
): ValidationResult<RideInput> {
  const today = options.today ?? todayIsoDate()
  const errors: RideInputErrors = {}

  const name = input.name.trim()
  const distanceKm = roundToTwoDecimals(input.distanceKm)
  const { date, elevationM } = input

  if (!isValidIsoDate(date)) {
    errors.date = 'Enter a valid date.'
  } else if (compareIsoDates(date, today) > 0) {
    errors.date = 'Ride date cannot be in the future.'
  }

  if (name.length === 0) {
    errors.name = 'Enter a ride name.'
  } else if (name.length > RIDE_NAME_MAX_LENGTH) {
    errors.name = `Ride name must be ${RIDE_NAME_MAX_LENGTH} characters or fewer.`
  }

  // Number.isFinite rejects NaN and Infinity, which is what an empty or
  // garbled numeric form field typically produces.
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    errors.distanceKm = 'Distance must be greater than 0 km.'
  }

  if (!Number.isInteger(elevationM) || elevationM < 0) {
    errors.elevationM = 'Climb must be a whole number of metres, 0 or more.'
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }
  return { valid: true, value: { date, name, distanceKm, elevationM } }
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}
