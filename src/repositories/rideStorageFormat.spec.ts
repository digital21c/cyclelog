import { describe, it, expect } from 'vitest'

import type { Ride } from '@/models/ride'

import {
  CURRENT_STORAGE_VERSION,
  deserializeRides,
  migrateToVersion,
  RideStorageError,
  serializeRides,
  type Migration,
} from './rideStorageFormat'

function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: 'ride-1',
    date: '2026-11-01',
    name: 'Box Hill loop',
    distanceKm: 42.13,
    elevationM: 610,
    createdAt: '2026-11-06T09:00:00.000Z',
    updatedAt: '2026-11-06T09:00:00.000Z',
    ...overrides,
  }
}

/** Serialises arbitrary data, so tests can store shapes the app would never write. */
function json(data: unknown): string {
  return JSON.stringify(data)
}

describe('serializeRides / deserializeRides', () => {
  it('round-trips rides unchanged', () => {
    const rides = [makeRide(), makeRide({ id: 'ride-2', name: 'Commute', elevationM: 0 })]
    expect(deserializeRides(serializeRides(rides))).toEqual(rides)
  })

  it('treats missing data (null) as no rides', () => {
    expect(deserializeRides(null)).toEqual([])
  })

  it('writes the documented version 1 format', () => {
    // This is a contract test: if it fails, you have changed the stored format
    // and need a new version plus a migration.
    expect(JSON.parse(serializeRides([makeRide()]))).toEqual({
      version: 1,
      rides: [
        {
          id: 'ride-1',
          date: '2026-11-01',
          name: 'Box Hill loop',
          distanceKm: 42.13,
          elevationM: 610,
          createdAt: '2026-11-06T09:00:00.000Z',
          updatedAt: '2026-11-06T09:00:00.000Z',
        },
      ],
    })
  })

  it('drops unknown stored properties', () => {
    const stored = json({ version: 1, rides: [{ ...makeRide(), surprise: true }] })
    expect(deserializeRides(stored)).toEqual([makeRide()])
  })

  it('loads rides that break current business rules but are structurally valid', () => {
    const longName = 'a'.repeat(500)
    const stored = json({ version: 1, rides: [makeRide({ name: longName })] })
    expect(deserializeRides(stored)[0]?.name).toBe(longName)
  })

  describe('rejects unreadable data with RideStorageError', () => {
    it.each([
      ['invalid JSON', '{not json'],
      ['a non-object', json([1, 2, 3])],
      ['no version', json({ rides: [] })],
      ['a non-integer version', json({ version: '1', rides: [] })],
      ['version 0', json({ version: 0, rides: [] })],
      ['rides that is not an array', json({ version: 1, rides: {} })],
      ['a ride missing a field', json({ version: 1, rides: [{ id: 'x' }] })],
      [
        'a ride with an invalid date',
        json({ version: 1, rides: [makeRide({ date: '06/11/2026' })] }),
      ],
    ])('%s', (_label, stored) => {
      expect(() => deserializeRides(stored)).toThrow(RideStorageError)
    })

    it('identifies which ride is malformed', () => {
      const stored = json({ version: 1, rides: [makeRide(), { ...makeRide(), distanceKm: 'far' }] })
      expect(() => deserializeRides(stored)).toThrow(/position 1/)
    })

    it('refuses data from a newer app version rather than misreading it', () => {
      const stored = json({ version: CURRENT_STORAGE_VERSION + 1, rides: [] })
      expect(() => deserializeRides(stored)).toThrow(/newer version/)
    })
  })
})

describe('migrateToVersion', () => {
  // Fake migrations, to prove the runner works before any real ones exist.
  const steps: Record<number, Migration> = {
    1: (data) => ({ ...(data as object), version: 2, addedInV2: true }),
    2: (data) => ({ ...(data as object), version: 3, addedInV3: true }),
  }

  it('applies each step in order', () => {
    expect(migrateToVersion({ version: 1 }, 1, 3, steps)).toEqual({
      version: 3,
      addedInV2: true,
      addedInV3: true,
    })
  })

  it('starts from the stored version, skipping earlier steps', () => {
    expect(migrateToVersion({ version: 2 }, 2, 3, steps)).toEqual({
      version: 3,
      addedInV3: true,
    })
  })

  it('returns data unchanged when already current', () => {
    const data = { version: 3 }
    expect(migrateToVersion(data, 3, 3, steps)).toBe(data)
  })

  it('throws if a step is missing', () => {
    expect(() => migrateToVersion({ version: 1 }, 1, 4, steps)).toThrow(/from storage version 3/)
  })
})
