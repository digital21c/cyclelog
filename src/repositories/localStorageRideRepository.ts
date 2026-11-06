import type { Ride } from '@/models/ride'

import type { KeyValueStore } from './keyValueStore'
import type { RideRepository } from './rideRepository'
import { deserializeRides, RIDES_STORAGE_KEY, serializeRides } from './rideStorageFormat'

/**
 * RideRepository backed by a KeyValueStore, normally the browser's localStorage.
 *
 * All rides live under one key as a single versioned JSON document. Each call
 * reads the whole document and each write replaces it. That is simple and
 * fast enough for thousands of rides; GPX data will need IndexedDB anyway.
 *
 * If the stored data is unreadable, every method rejects with RideStorageError.
 * Writes included: a save never overwrites data it couldn't read.
 *
 * This is a service (behaviour), not data, so a class is a good fit. Keep it
 * out of reactive state (ref/reactive), which would wrap it in a Proxy for no benefit.
 */
export class LocalStorageRideRepository implements RideRepository {
  private readonly storage: KeyValueStore
  private readonly key: string

  constructor(storage: KeyValueStore = globalThis.localStorage, key: string = RIDES_STORAGE_KEY) {
    this.storage = storage
    this.key = key
  }

  async getAll(): Promise<Ride[]> {
    return this.readRides()
  }

  async getById(id: string): Promise<Ride | undefined> {
    return this.readRides().find((ride) => ride.id === id)
  }

  async save(ride: Ride): Promise<void> {
    const rides = this.readRides()
    const index = rides.findIndex((existing) => existing.id === ride.id)
    if (index === -1) {
      rides.push(ride)
    } else {
      rides[index] = ride
    }
    this.writeRides(rides)
  }

  async delete(id: string): Promise<void> {
    const rides = this.readRides()
    const remaining = rides.filter((ride) => ride.id !== id)
    if (remaining.length !== rides.length) {
      this.writeRides(remaining)
    }
  }

  private readRides(): Ride[] {
    return deserializeRides(this.storage.getItem(this.key))
  }

  private writeRides(rides: readonly Ride[]): void {
    // May throw a QuotaExceededError if storage is full; it propagates to the caller.
    this.storage.setItem(this.key, serializeRides(rides))
  }
}
