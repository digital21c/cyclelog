import { describe, it, expect, beforeEach, vi } from 'vitest'

import type { Ride } from '@/models/ride'

import { InMemoryKeyValueStore } from './keyValueStore'
import { LocalStorageRideRepository } from './localStorageRideRepository'
import { RIDES_STORAGE_KEY, RideStorageError } from './rideStorageFormat'

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

describe('LocalStorageRideRepository', () => {
  let storage: InMemoryKeyValueStore
  let repository: LocalStorageRideRepository

  beforeEach(() => {
    storage = new InMemoryKeyValueStore()
    repository = new LocalStorageRideRepository(storage)
  })

  it('starts empty', async () => {
    expect(await repository.getAll()).toEqual([])
  })

  it('saves a new ride and reads it back', async () => {
    await repository.save(makeRide())
    expect(await repository.getAll()).toEqual([makeRide()])
  })

  it('replaces an existing ride with the same id', async () => {
    await repository.save(makeRide())
    await repository.save(makeRide({ id: 'ride-2' }))
    await repository.save(makeRide({ name: 'Renamed' }))

    const rides = await repository.getAll()
    expect(rides).toHaveLength(2)
    expect(rides.find((ride) => ride.id === 'ride-1')?.name).toBe('Renamed')
  })

  it('finds a ride by id, or returns undefined', async () => {
    await repository.save(makeRide())
    expect(await repository.getById('ride-1')).toEqual(makeRide())
    expect(await repository.getById('missing')).toBeUndefined()
  })

  it('deletes a ride', async () => {
    await repository.save(makeRide())
    await repository.save(makeRide({ id: 'ride-2' }))
    await repository.delete('ride-1')
    expect((await repository.getAll()).map((ride) => ride.id)).toEqual(['ride-2'])
  })

  it('treats deleting an unknown id as a no-op', async () => {
    await repository.save(makeRide())
    await repository.delete('missing')
    expect(await repository.getAll()).toEqual([makeRide()])
  })

  it('persists across repository instances (like a page reload)', async () => {
    await repository.save(makeRide())
    const afterReload = new LocalStorageRideRepository(storage)
    expect(await afterReload.getAll()).toEqual([makeRide()])
  })

  it('stores data under the cyclelog.rides key in the versioned format', async () => {
    await repository.save(makeRide())
    expect(JSON.parse(storage.getItem(RIDES_STORAGE_KEY) ?? 'null')).toMatchObject({ version: 1 })
  })

  describe('saveMany', () => {
    it('inserts new rides and replaces existing ones, in one write', async () => {
      await repository.save(makeRide({ id: 'a', name: 'Original' }))
      const setItem = vi.spyOn(storage, 'setItem')

      await repository.saveMany([
        makeRide({ id: 'a', name: 'Replaced' }),
        makeRide({ id: 'b' }),
        makeRide({ id: 'c' }),
      ])

      expect(setItem).toHaveBeenCalledTimes(1)
      const rides = await repository.getAll()
      expect(rides.map((ride) => ride.id)).toEqual(['a', 'b', 'c'])
      expect(rides[0]?.name).toBe('Replaced')
    })

    it('does nothing harmful with an empty batch', async () => {
      await repository.save(makeRide())
      await repository.saveMany([])
      expect(await repository.getAll()).toEqual([makeRide()])
    })

    it('saves nothing if the write fails', async () => {
      await repository.save(makeRide({ id: 'existing' }))
      vi.spyOn(storage, 'setItem').mockImplementation(() => {
        throw new Error('The quota has been exceeded.')
      })

      await expect(
        repository.saveMany([makeRide({ id: 'x' }), makeRide({ id: 'y' })]),
      ).rejects.toThrow('quota')
      vi.restoreAllMocks()

      expect((await repository.getAll()).map((ride) => ride.id)).toEqual(['existing'])
    })
  })

  describe('with corrupted stored data', () => {
    const corrupted = '{not json'

    beforeEach(() => {
      storage.setItem(RIDES_STORAGE_KEY, corrupted)
    })

    it('rejects reads with RideStorageError', async () => {
      await expect(repository.getAll()).rejects.toThrow(RideStorageError)
    })

    it('refuses to save, leaving the stored data untouched', async () => {
      await expect(repository.save(makeRide())).rejects.toThrow(RideStorageError)
      expect(storage.getItem(RIDES_STORAGE_KEY)).toBe(corrupted)
    })

    it('refuses to save a batch, leaving the stored data untouched', async () => {
      await expect(repository.saveMany([makeRide()])).rejects.toThrow(RideStorageError)
      expect(storage.getItem(RIDES_STORAGE_KEY)).toBe(corrupted)
    })

    it('refuses to delete, leaving the stored data untouched', async () => {
      await expect(repository.delete('ride-1')).rejects.toThrow(RideStorageError)
      expect(storage.getItem(RIDES_STORAGE_KEY)).toBe(corrupted)
    })
  })

  it('uses window.localStorage by default', async () => {
    localStorage.clear()
    await new LocalStorageRideRepository().save(makeRide())
    expect(localStorage.getItem(RIDES_STORAGE_KEY)).not.toBeNull()
    localStorage.clear()
  })
})
