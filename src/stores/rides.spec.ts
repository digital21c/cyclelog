import { describe, it, expect } from 'vitest'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import type { Ride, RideInput } from '@/models/ride'
import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import type { RideRepository } from '@/repositories/rideRepository'

import { rideRepositoryKey } from './injectionKeys'
import { useRidesStore } from './rides'

/**
 * Creates a fresh store backed by the given repository (in-memory by default).
 * The store gets its repository via inject(), so it needs an app to provide it,
 * just as main.ts does. Pinia runs store setup inside that app's context.
 */
function setUpStore(repository: RideRepository = inMemoryRepository()) {
  const app = createApp({})
  const pinia = createPinia()
  app.provide(rideRepositoryKey, repository)
  app.use(pinia)
  setActivePinia(pinia)
  return { store: useRidesStore(), repository }
}

function inMemoryRepository(): RideRepository {
  return new LocalStorageRideRepository(new InMemoryKeyValueStore())
}

/** A repository whose every operation fails, as with corrupted data or a full disk. */
function failingRepository(): RideRepository {
  const fail = () => Promise.reject(new Error('Storage is broken'))
  return { getAll: fail, getById: fail, save: fail, delete: fail }
}

function validInput(overrides: Partial<RideInput> = {}): RideInput {
  return {
    date: '2025-06-01',
    name: 'Box Hill loop',
    distanceKm: 42.5,
    elevationM: 610,
    ...overrides,
  }
}

async function addValidRide(
  store: ReturnType<typeof useRidesStore>,
  overrides: Partial<RideInput> = {},
): Promise<Ride> {
  const result = await store.addRide(validInput(overrides))
  if (!result.valid) throw new Error('Expected a valid ride')
  return result.value
}

describe('useRidesStore', () => {
  it('throws a clear error if no repository was provided', () => {
    setActivePinia(createPinia())
    expect(() => useRidesStore()).toThrow(/No RideRepository provided/)
  })

  describe('loadRides', () => {
    it('loads stored rides and reports success', async () => {
      const repository = inMemoryRepository()
      const first = setUpStore(repository).store
      await addValidRide(first)

      const { store } = setUpStore(repository) // a fresh store, like after a reload
      expect(store.loadStatus).toBe('idle')

      const loading = store.loadRides()
      expect(store.loadStatus).toBe('loading')
      await loading

      expect(store.loadStatus).toBe('loaded')
      expect(store.rideCount).toBe(1)
    })

    it('records a failure instead of throwing', async () => {
      const { store } = setUpStore(failingRepository())
      await store.loadRides()

      expect(store.loadStatus).toBe('error')
      expect(store.loadError).toBe('Storage is broken')
      expect(store.rides).toEqual([])
    })
  })

  describe('addRide', () => {
    it('saves a valid ride to the repository and to state', async () => {
      const { store, repository } = setUpStore()
      const ride = await addValidRide(store)

      expect(store.rides).toEqual([ride])
      expect(await repository.getAll()).toEqual([ride])
    })

    it('returns field errors and saves nothing for invalid input', async () => {
      const { store, repository } = setUpStore()
      const result = await store.addRide(validInput({ name: '' }))

      expect(!result.valid && result.errors.name).toBeTruthy()
      expect(store.rides).toEqual([])
      expect(await repository.getAll()).toEqual([])
    })

    it('rejects and leaves state unchanged if storage fails', async () => {
      const { store } = setUpStore(failingRepository())
      await expect(store.addRide(validInput())).rejects.toThrow('Storage is broken')
      expect(store.rides).toEqual([])
    })
  })

  describe('updateRide', () => {
    it('saves edits to the repository and to state', async () => {
      const { store, repository } = setUpStore()
      const ride = await addValidRide(store)

      const result = await store.updateRide(ride.id, validInput({ name: 'Box Hill reps' }))

      expect(result.valid).toBe(true)
      expect(store.findRide(ride.id)?.name).toBe('Box Hill reps')
      expect((await repository.getById(ride.id))?.name).toBe('Box Hill reps')
    })

    it('returns field errors and changes nothing for invalid input', async () => {
      const { store } = setUpStore()
      const ride = await addValidRide(store)

      const result = await store.updateRide(ride.id, validInput({ distanceKm: 0 }))

      expect(!result.valid && result.errors.distanceKm).toBeTruthy()
      expect(store.findRide(ride.id)).toEqual(ride)
    })

    it('throws for an unknown ride id', async () => {
      const { store } = setUpStore()
      await expect(store.updateRide('missing', validInput())).rejects.toThrow(/does not exist/)
    })
  })

  describe('deleteRide', () => {
    it('removes the ride from the repository and from state', async () => {
      const { store, repository } = setUpStore()
      const keep = await addValidRide(store, { name: 'Keep' })
      const remove = await addValidRide(store, { name: 'Remove' })

      await store.deleteRide(remove.id)

      expect(store.rides).toEqual([keep])
      expect(await repository.getAll()).toEqual([keep])
    })
  })

  describe('sortedRides', () => {
    it('lists rides newest first without reordering the underlying state', async () => {
      const { store } = setUpStore()
      await addValidRide(store, { name: 'June', date: '2025-06-01' })
      await addValidRide(store, { name: 'August', date: '2025-08-01' })
      await addValidRide(store, { name: 'July', date: '2025-07-01' })

      expect(store.sortedRides.map((ride) => ride.name)).toEqual(['August', 'July', 'June'])
      expect(store.rides.map((ride) => ride.name)).toEqual(['June', 'August', 'July'])
    })
  })
})
