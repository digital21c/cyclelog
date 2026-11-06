import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import type { Ride } from '@/models/ride'
import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import type { RideRepository } from '@/repositories/rideRepository'
import { rideRepositoryKey } from '@/stores/injectionKeys'

import HomeView from './HomeView.vue'

function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: 'ride-1',
    date: '2026-11-01',
    name: 'Cotter Loop',
    distanceKm: 52,
    elevationM: 540,
    createdAt: '2026-11-01T07:00:00.000Z',
    updatedAt: '2026-11-01T07:00:00.000Z',
    ...overrides,
  }
}

async function repositoryWith(rides: Ride[]): Promise<RideRepository> {
  const repository = new LocalStorageRideRepository(new InMemoryKeyValueStore())
  for (const ride of rides) await repository.save(ride)
  return repository
}

/** Mounts HomeView with a fresh Pinia and the given repository, as main.ts would. */
function mountHomeView(repository: RideRepository) {
  return mount(HomeView, {
    global: {
      plugins: [createPinia()],
      provide: { [rideRepositoryKey]: repository },
    },
  })
}

describe('HomeView', () => {
  it('shows a loading message until rides have loaded', async () => {
    const wrapper = mountHomeView(await repositoryWith([]))
    expect(wrapper.get('[role="status"]').text()).toContain('Loading')

    await flushPromises() // let loadRides() finish
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('shows an empty-state message when there are no rides', async () => {
    const wrapper = mountHomeView(await repositoryWith([]))
    await flushPromises()
    expect(wrapper.text()).toContain('No rides recorded yet.')
  })

  it('lists rides newest first, with a count', async () => {
    const wrapper = mountHomeView(
      await repositoryWith([
        makeRide({ id: 'old', name: 'Red Hill Climb', date: '2026-10-01' }),
        makeRide({ id: 'new', name: 'Cotter Loop', date: '2026-11-01' }),
      ]),
    )
    await flushPromises()

    expect(wrapper.text()).toContain('2 rides')
    expect(wrapper.findAll('li h2').map((heading) => heading.text())).toEqual([
      'Cotter Loop',
      'Red Hill Climb',
    ])
  })

  it('uses the singular for one ride', async () => {
    const wrapper = mountHomeView(await repositoryWith([makeRide()]))
    await flushPromises()
    expect(wrapper.text()).toContain('1 ride')
    expect(wrapper.text()).not.toContain('1 rides')
  })

  it('shows an error if rides cannot be loaded', async () => {
    const failing: RideRepository = {
      getAll: () => Promise.reject(new Error('Stored ride data is not valid JSON.')),
      getById: () => Promise.reject(new Error('unused')),
      save: () => Promise.reject(new Error('unused')),
      delete: () => Promise.reject(new Error('unused')),
    }
    const wrapper = mountHomeView(failing)
    await flushPromises()

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain("couldn't be loaded")
    expect(alert.text()).toContain('Stored ride data is not valid JSON.')
  })
})
