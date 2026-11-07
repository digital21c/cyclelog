import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { Ride } from '@/models/ride'
import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import type { RideRepository } from '@/repositories/rideRepository'
import { rideRepositoryKey } from '@/stores/injectionKeys'
import { useRidesStore } from '@/stores/rides'
import { routes } from '@/router'

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

const threeRides = [
  makeRide({
    id: 'a',
    name: 'Red Hill Climb',
    date: '2026-10-01',
    distanceKm: 12,
    elevationM: 180,
  }),
  makeRide({
    id: 'b',
    name: 'Corin Dam Climb',
    date: '2026-10-15',
    distanceKm: 130,
    elevationM: 1450,
  }),
  makeRide({
    id: 'c',
    name: 'Lake Burley Griffin Loop',
    date: '2026-11-01',
    distanceKm: 28,
    elevationM: 90,
  }),
]

async function repositoryWith(rides: Ride[]): Promise<RideRepository> {
  const repository = new LocalStorageRideRepository(new InMemoryKeyValueStore())
  for (const ride of rides) await repository.save(ride)
  return repository
}

/**
 * Mounts HomeView as the app would: fresh Pinia, the given repository, and a
 * router (in-memory history, so tests don't touch the browser URL).
 */
async function mountHomeView(repository: RideRepository, url = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  await router.push(url)

  const pinia = createPinia()
  const wrapper = mount(HomeView, {
    global: {
      plugins: [router, pinia],
      provide: { [rideRepositoryKey]: repository },
    },
  })
  // In the app, App.vue starts loading at startup; do the same here.
  void useRidesStore(pinia).loadRides()
  return { wrapper, router }
}

function rideNames(wrapper: Awaited<ReturnType<typeof mountHomeView>>['wrapper']): string[] {
  return wrapper.findAll('li h2').map((heading) => heading.text())
}

describe('HomeView', () => {
  it('shows a loading message until rides have loaded', async () => {
    const { wrapper } = await mountHomeView(await repositoryWith([]))
    expect(wrapper.get('[role="status"]').text()).toContain('Loading')

    await flushPromises() // let loadRides() finish
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('shows an empty-state message, and no sort controls, when there are no rides', async () => {
    const { wrapper } = await mountHomeView(await repositoryWith([]))
    await flushPromises()
    expect(wrapper.text()).toContain('No rides recorded yet.')
    expect(wrapper.find('fieldset').exists()).toBe(false)
  })

  it('lists rides newest first by default, with a count', async () => {
    const { wrapper } = await mountHomeView(await repositoryWith(threeRides))
    await flushPromises()

    expect(wrapper.text()).toContain('3 rides')
    expect(rideNames(wrapper)).toEqual([
      'Lake Burley Griffin Loop',
      'Corin Dam Climb',
      'Red Hill Climb',
    ])
  })

  it('uses the singular for one ride', async () => {
    const { wrapper } = await mountHomeView(await repositoryWith([makeRide()]))
    await flushPromises()
    expect(wrapper.text()).toContain('1 ride')
    expect(wrapper.text()).not.toContain('1 rides')
  })

  it('applies a sort given in the URL', async () => {
    const { wrapper } = await mountHomeView(
      await repositoryWith(threeRides),
      '/?sort=distance&order=asc',
    )
    await flushPromises()

    expect(rideNames(wrapper)).toEqual([
      'Red Hill Climb',
      'Lake Burley Griffin Loop',
      'Corin Dam Climb',
    ])
    expect(wrapper.get('button').text()).toContain('Shortest first')
  })

  it('re-sorts the list and updates the URL when the controls change', async () => {
    const { wrapper, router } = await mountHomeView(await repositoryWith(threeRides))
    await flushPromises()

    await wrapper.get('input[value="elevation"]').setValue(true)
    await flushPromises() // let the router finish updating the URL

    expect(router.currentRoute.value.query).toEqual({ sort: 'elevation' })
    expect(rideNames(wrapper)).toEqual([
      'Corin Dam Climb',
      'Red Hill Climb',
      'Lake Burley Griffin Loop',
    ])

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ sort: 'elevation', order: 'asc' })
    expect(rideNames(wrapper)[0]).toBe('Lake Burley Griffin Loop')
  })

  it('shows an error if rides cannot be loaded', async () => {
    const failing: RideRepository = {
      getAll: () => Promise.reject(new Error('Stored ride data is not valid JSON.')),
      getById: () => Promise.reject(new Error('unused')),
      save: () => Promise.reject(new Error('unused')),
      delete: () => Promise.reject(new Error('unused')),
    }
    const { wrapper } = await mountHomeView(failing)
    await flushPromises()

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain("couldn't be loaded")
    expect(alert.text()).toContain('Stored ride data is not valid JSON.')
  })
})

describe('HomeView navigation', () => {
  it('links to the add-ride page from the header and the empty state', async () => {
    const { wrapper } = await mountHomeView(await repositoryWith([]))
    await flushPromises()

    const links = wrapper.findAll('a').map((link) => [link.text(), link.attributes('href')])
    expect(links).toEqual([
      ['Add ride', '/rides/new'],
      ['Add your first ride', '/rides/new'],
    ])
  })
})
