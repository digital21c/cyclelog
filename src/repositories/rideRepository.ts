import type { Ride } from '@/models/ride'

/**
 * Persistence contract for rides. Stores depend on this interface, never on a
 * concrete implementation, so localStorage can later be swapped for IndexedDB
 * or a REST API without changing callers.
 *
 * Every method is async even though localStorage is synchronous: real
 * back-ends are async, and changing a sync API to async later would ripple
 * through every caller.
 */
export interface RideRepository {
  /** All stored rides, in no guaranteed order. Sorting is the caller's concern. */
  getAll(): Promise<Ride[]>

  /** The ride with this id, or `undefined` if there is none. */
  getById(id: string): Promise<Ride | undefined>

  /**
   * Inserts the ride, or replaces the existing ride with the same id.
   * Expects a valid Ride, i.e. one produced by `createRide` / `updateRide`.
   */
  save(ride: Ride): Promise<void>

  /**
   * Saves several rides as one all-or-nothing operation: either every ride is
   * saved, or (on failure) none is. Same insert-or-replace rule as `save`.
   */
  saveMany(rides: readonly Ride[]): Promise<void>

  /** Removes the ride with this id. Does nothing if it doesn't exist. */
  delete(id: string): Promise<void>
}
