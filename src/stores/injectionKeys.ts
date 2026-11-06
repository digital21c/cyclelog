import { inject, type InjectionKey } from 'vue'

import type { RideRepository } from '@/repositories/rideRepository'

/**
 * Typed key for supplying the RideRepository through Vue's provide/inject.
 *
 * main.ts decides which implementation the app uses (the "composition root");
 * stores only know the interface. Tests provide an in-memory one instead.
 * The `InjectionKey<T>` type makes `inject(rideRepositoryKey)` return
 * `RideRepository | undefined` rather than `unknown`.
 */
export const rideRepositoryKey: InjectionKey<RideRepository> = Symbol('RideRepository')

/**
 * Injects the RideRepository, failing loudly if none was provided.
 * Returning a definite `RideRepository` (never undefined) means callers
 * don't need null checks.
 */
export function injectRideRepository(): RideRepository {
  const repository = inject(rideRepositoryKey)
  if (!repository) {
    throw new Error(
      'No RideRepository provided. Call app.provide(rideRepositoryKey, …) in main.ts.',
    )
  }
  return repository
}
