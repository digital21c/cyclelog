import { describe, it, expect } from 'vitest'

import type { Ride } from '@/models/ride'

import { BackupFileError, createBackup, planImport, readBackup } from './rideBackup'

function makeRide(id: string, overrides: Partial<Ride> = {}): Ride {
  return {
    id,
    date: '2026-11-01',
    name: 'Uriarra Loop',
    distanceKm: 67.25,
    elevationM: 790,
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
    ...overrides,
  }
}

// Local-time constructor: 7 Nov 2026, 23:30 wherever the test runs.
const LATE_EVENING = new Date(2026, 10, 7, 23, 30)

describe('createBackup', () => {
  it('names the file after the local date', () => {
    expect(createBackup([], LATE_EVENING).fileName).toBe('cyclelog-backup-2026-11-07.json')
  })

  it('writes the versioned format with app name and export time', () => {
    const { contents } = createBackup([makeRide('a')], LATE_EVENING)
    expect(JSON.parse(contents)).toEqual({
      version: 1,
      app: 'CycleLog',
      exportedAt: LATE_EVENING.toISOString(),
      rides: [makeRide('a')],
    })
  })

  it('puts the identifying fields before the ride list', () => {
    const { contents } = createBackup([makeRide('a')], LATE_EVENING)
    expect(Object.keys(JSON.parse(contents))).toEqual(['app', 'version', 'exportedAt', 'rides'])
  })

  it('is indented, so it stays readable in a text editor', () => {
    expect(createBackup([makeRide('a')], LATE_EVENING).contents).toContain('\n  "rides": [')
  })
})

describe('readBackup', () => {
  it('round-trips a backup unchanged', () => {
    const rides = [makeRide('a'), makeRide('b', { name: 'Cotter Loop' })]
    expect(readBackup(createBackup(rides, LATE_EVENING).contents)).toEqual(rides)
  })

  it('ignores the informational fields', () => {
    const backup = { version: 1, app: 'CycleLog', exportedAt: 'whenever', rides: [makeRide('a')] }
    expect(readBackup(JSON.stringify(backup))).toEqual([makeRide('a')])
  })

  it.each([
    ['text that is not JSON', 'hello', /isn't valid JSON/],
    ['JSON that is not an object', '[1, 2, 3]', /isn't a CycleLog backup/],
    ["another app's file", JSON.stringify({ version: 1, rides: [] }), /isn't a CycleLog backup/],
    [
      'a backup from a newer CycleLog',
      JSON.stringify({ version: 99, app: 'CycleLog', rides: [] }),
      /newer version of CycleLog/,
    ],
    [
      'a damaged ride',
      JSON.stringify({ version: 1, app: 'CycleLog', rides: [{ id: 'x' }] }),
      /position 0 is malformed/,
    ],
    [
      'the same ride twice',
      JSON.stringify({ version: 1, app: 'CycleLog', rides: [makeRide('a'), makeRide('a')] }),
      /same ride twice/,
    ],
  ])('rejects %s with an explanation', (_label, text, message) => {
    expect(() => readBackup(text)).toThrow(BackupFileError)
    expect(() => readBackup(text)).toThrow(message)
  })

  it('accepts an empty backup', () => {
    expect(readBackup(createBackup([], LATE_EVENING).contents)).toEqual([])
  })
})

describe('planImport', () => {
  it('adds only rides that are not already present, matched by id', () => {
    const existing = [makeRide('a'), makeRide('b')]
    const incoming = [makeRide('b', { name: 'Edited in backup' }), makeRide('c'), makeRide('d')]

    const plan = planImport(existing, incoming)

    expect(plan.newRides.map((ride) => ride.id)).toEqual(['c', 'd'])
    expect(plan.alreadyPresentCount).toBe(1)
  })

  it('imports everything into an empty CycleLog', () => {
    const plan = planImport([], [makeRide('a'), makeRide('b')])
    expect(plan).toEqual({ newRides: [makeRide('a'), makeRide('b')], alreadyPresentCount: 0 })
  })

  it('imports nothing when every ride is already present', () => {
    const rides = [makeRide('a')]
    expect(planImport(rides, rides)).toEqual({ newRides: [], alreadyPresentCount: 1 })
  })
})
