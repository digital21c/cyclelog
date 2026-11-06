import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import * as rideModel from '@/models/ride'
import type { Ride, RideInput } from '@/models/ride'
import type { ValidationResult } from '@/models/rideValidation'

import { injectRideRepository } from './injectionKeys'

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Application state for rides. Coordinates the model (validation, factories)
 * and the repository (persistence); holds no business rules of its own.
 *
 * Writes are pessimistic: the repository is updated first and state changes
 * only once that succeeds, so what's on screen always matches what's stored.
 *
 * Convention: change `rides` only through these actions, never directly from
 * a component, even though Pinia would allow it.
 */
export const useRidesStore = defineStore('rides', () => {
  const repository = injectRideRepository()

  // --- State -----------------------------------------------------------------

  const rides = ref<Ride[]>([])
  const loadStatus = ref<LoadStatus>('idle')
  const loadError = ref<string | null>(null)

  // --- Getters ---------------------------------------------------------------

  const sortedRides = computed(() => [...rides.value].sort(rideModel.compareRidesNewestFirst))
  const rideCount = computed(() => rides.value.length)

  function findRide(id: string): Ride | undefined {
    return rides.value.find((ride) => ride.id === id)
  }

  // --- Actions ---------------------------------------------------------------

  /** Loads all rides from storage. Failures are recorded in `loadError`, not thrown. */
  async function loadRides(): Promise<void> {
    if (loadStatus.value === 'loading') return

    loadStatus.value = 'loading'
    loadError.value = null
    try {
      rides.value = await repository.getAll()
      loadStatus.value = 'loaded'
    } catch (error) {
      loadError.value = describeError(error)
      loadStatus.value = 'error'
    }
  }

  /**
   * Validates and saves a new ride. Returns field errors for invalid input.
   * Rejects (throws) if storage fails, e.g. quota exceeded or corrupted data.
   */
  async function addRide(input: RideInput): Promise<ValidationResult<Ride>> {
    const result = rideModel.createRide(input)
    if (!result.valid) return result

    await repository.save(result.value)
    rides.value = [...rides.value, result.value]
    return result
  }

  /** Validates and saves edits to an existing ride. Same error behaviour as `addRide`. */
  async function updateRide(id: string, input: RideInput): Promise<ValidationResult<Ride>> {
    const existing = findRide(id)
    if (!existing) {
      throw new Error(`Cannot update ride ${id}: it does not exist.`)
    }

    const result = rideModel.updateRide(existing, input)
    if (!result.valid) return result

    const updated = result.value
    await repository.save(updated)
    rides.value = rides.value.map((ride) => (ride.id === id ? updated : ride))
    return result
  }

  /** Deletes a ride. Rejects if storage fails, leaving state unchanged. */
  async function deleteRide(id: string): Promise<void> {
    await repository.delete(id)
    rides.value = rides.value.filter((ride) => ride.id !== id)
  }

  return {
    rides,
    loadStatus,
    loadError,
    sortedRides,
    rideCount,
    findRide,
    loadRides,
    addRide,
    updateRide,
    deleteRide,
  }
})

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
