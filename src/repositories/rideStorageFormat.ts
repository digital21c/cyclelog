import type { Ride } from '@/models/ride'
import { isValidIsoDate } from '@/utils/isoDate'

/**
 * The on-disk format for rides, kept separate from the domain `Ride` type so
 * the model and the persisted shape can evolve independently. Today they are
 * identical; when they diverge, only the mapping functions here change.
 *
 * Changing this format requires:
 *   1. a new `RideStoreVn` type and bumping `CURRENT_STORAGE_VERSION`,
 *   2. a migration from the previous version in `migrations`,
 *   3. tests for that migration.
 */

export const RIDES_STORAGE_KEY = 'cyclelog.rides'
export const CURRENT_STORAGE_VERSION = 1

export interface StoredRideV1 {
  id: string
  date: string
  name: string
  distanceKm: number
  elevationM: number
  createdAt: string
  updatedAt: string
}

export interface RideStoreV1 {
  version: 1
  rides: StoredRideV1[]
}

/** Thrown when stored data can't be read safely. Data is never wiped automatically. */
export class RideStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RideStorageError'
  }
}

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

/** Upgrades data by exactly one version. Input and output are untyped JSON. */
export type Migration = (data: unknown) => unknown

/**
 * Key `n` upgrades data from version `n` to `n + 1`, and must set the new
 * `version` number on its output. Empty while only version 1 exists.
 * Example for the future:  `1: (data) => ({ ...data, version: 2, ... })`
 */
export const migrations: Readonly<Record<number, Migration>> = {}

/** Applies migrations one step at a time, from `fromVersion` up to `toVersion`. */
export function migrateToVersion(
  data: unknown,
  fromVersion: number,
  toVersion: number = CURRENT_STORAGE_VERSION,
  steps: Readonly<Record<number, Migration>> = migrations,
): unknown {
  let current = data
  for (let version = fromVersion; version < toVersion; version++) {
    const step = steps[version]
    if (!step) {
      throw new RideStorageError(`No migration from storage version ${version} to ${version + 1}.`)
    }
    current = step(current)
  }
  return current
}

// ---------------------------------------------------------------------------
// Reading and writing
// ---------------------------------------------------------------------------

/**
 * Turns the stored JSON string into rides. `null` (nothing stored yet) gives
 * an empty list. Anything unreadable throws `RideStorageError` rather than
 * being discarded, so a bug or a corrupted value can't silently lose rides.
 */
export function deserializeRides(json: string | null): Ride[] {
  if (json === null) return []

  let data: unknown
  try {
    data = JSON.parse(json)
  } catch (cause) {
    throw new RideStorageError('Ride data is not valid JSON.', { cause })
  }

  const version = readVersion(data)
  if (version > CURRENT_STORAGE_VERSION) {
    throw new RideStorageError(
      `Ride data is version ${version}, but this app only understands up to ` +
        `version ${CURRENT_STORAGE_VERSION}. It was probably saved by a newer version of CycleLog.`,
    )
  }

  const migrated = migrateToVersion(data, version)
  return parseCurrentStore(migrated).rides.map(fromStoredRide)
}

/** Turns rides into the JSON string to store, always at the current version. */
export function serializeRides(rides: readonly Ride[]): string {
  return JSON.stringify(toRideStore(rides))
}

/** Rides as the current versioned document, before turning it into JSON. */
export function toRideStore(rides: readonly Ride[]): RideStoreV1 {
  return {
    version: CURRENT_STORAGE_VERSION,
    rides: rides.map(toStoredRide),
  }
}

// ---------------------------------------------------------------------------
// Shape checks and mapping
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readVersion(data: unknown): number {
  const version = isRecord(data) ? data.version : undefined
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new RideStorageError('Ride data has no valid version number.')
  }
  return version
}

function parseCurrentStore(data: unknown): RideStoreV1 {
  if (!isRecord(data) || data.version !== CURRENT_STORAGE_VERSION || !Array.isArray(data.rides)) {
    throw new RideStorageError(
      `Ride data does not match the version ${CURRENT_STORAGE_VERSION} format.`,
    )
  }

  const badIndex = data.rides.findIndex((ride) => !isStoredRideV1(ride))
  if (badIndex !== -1) {
    throw new RideStorageError(`Ride at position ${badIndex} is malformed.`)
  }

  // Every field has been checked above, so this assertion is safe.
  return data as unknown as RideStoreV1
}

/**
 * Checks structure only (types and date format), not business rules such as
 * the name length limit. Rules may tighten over time, and a stricter rule
 * must never make previously saved rides impossible to load.
 */
function isStoredRideV1(value: unknown): value is StoredRideV1 {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    isValidIsoDate(value.date) &&
    typeof value.name === 'string' &&
    Number.isFinite(value.distanceKm) &&
    Number.isFinite(value.elevationM) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

/** Copies known fields explicitly, so unknown stored properties never leak into the model. */
function fromStoredRide(stored: StoredRideV1): Ride {
  return {
    id: stored.id,
    date: stored.date,
    name: stored.name,
    distanceKm: stored.distanceKm,
    elevationM: stored.elevationM,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  }
}

function toStoredRide(ride: Ride): StoredRideV1 {
  return {
    id: ride.id,
    date: ride.date,
    name: ride.name,
    distanceKm: ride.distanceKm,
    elevationM: ride.elevationM,
    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  }
}
