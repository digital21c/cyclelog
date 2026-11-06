import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import type { RideRepository } from '@/repositories/rideRepository'
import { RIDES_STORAGE_KEY, serializeRides } from '@/repositories/rideStorageFormat'

import { generateDemoRides, type DemoRideOptions } from './demoRides'

/**
 * A RideRepository pre-loaded with demo rides, held only in memory.
 * Reuses the real repository and storage format, so demo mode exercises
 * the same code paths as the app; only the storage provider differs.
 * Changes are lost on reload, and real localStorage is never touched.
 */
export function createDemoRideRepository(options: DemoRideOptions = {}): RideRepository {
  const storage = new InMemoryKeyValueStore()
  storage.setItem(RIDES_STORAGE_KEY, serializeRides(generateDemoRides(options)))
  return new LocalStorageRideRepository(storage)
}
