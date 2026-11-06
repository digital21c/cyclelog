import { compareIsoDates, toIsoDate, type IsoDate } from '@/utils/isoDate'

import { validateRideInput, type ValidationResult } from './rideValidation'

/** The fields a person enters for a ride. */
export interface RideInput {
  /** Local calendar day the ride took place. */
  date: IsoDate
  name: string
  distanceKm: number
  elevationM: number
}

/**
 * A recorded training ride: the core entity.
 * Plain data (no methods) so it serialises cleanly and works with Vue reactivity.
 * New optional fields can be added here later without breaking existing rides.
 */
export interface Ride extends Readonly<RideInput> {
  readonly id: string
  /** Full ISO-8601 UTC timestamp. */
  readonly createdAt: string
  /** Full ISO-8601 UTC timestamp. */
  readonly updatedAt: string
}

/** Things a factory needs from the outside world, injectable for tests. */
export interface RideFactoryDependencies {
  now?: Date
  generateId?: () => string
}

/**
 * The sanctioned way to create a Ride: validates the input, then assigns
 * an id and timestamps. Returns field errors instead of throwing.
 */
export function createRide(
  input: RideInput,
  { now = new Date(), generateId = () => crypto.randomUUID() }: RideFactoryDependencies = {},
): ValidationResult<Ride> {
  const result = validateRideInput(input, { today: toIsoDate(now) })
  if (!result.valid) return result

  const timestamp = now.toISOString()
  return {
    valid: true,
    value: { ...result.value, id: generateId(), createdAt: timestamp, updatedAt: timestamp },
  }
}

/**
 * Returns a new Ride with the edited fields applied. The original is not modified.
 * Keeps `id` and `createdAt`; refreshes `updatedAt`.
 */
export function updateRide(
  ride: Ride,
  input: RideInput,
  { now = new Date() }: Pick<RideFactoryDependencies, 'now'> = {},
): ValidationResult<Ride> {
  const result = validateRideInput(input, { today: toIsoDate(now) })
  if (!result.valid) return result

  return {
    valid: true,
    value: {
      ...result.value,
      id: ride.id,
      createdAt: ride.createdAt,
      updatedAt: now.toISOString(),
    },
  }
}

/**
 * Sort comparator: most recent ride date first. Rides on the same day are
 * ordered by when they were recorded, newest first, so the order is stable.
 */
export function compareRidesNewestFirst(a: Ride, b: Ride): number {
  return compareIsoDates(b.date, a.date) || compareTimestamps(b.createdAt, a.createdAt)
}

/** ISO-8601 UTC timestamps in the same format sort correctly as strings. */
function compareTimestamps(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
