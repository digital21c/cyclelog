import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import type { Ride } from '@/models/ride'
import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import type { RideRepository } from '@/repositories/rideRepository'
import { routes } from '@/router'
import { rideRepositoryKey } from '@/stores/injectionKeys'
import { useRidesStore } from '@/stores/rides'

import EditRideView from './EditRideView.vue'

const ride: Ride = {
  id: 'ride-1',
  date: '2026-10-25',
  name: 'Uriarra Loop',
  distanceKm: 67.25,
  elevationM: 790,
  createdAt: '2026-10-25T08:00:00.000Z',
  updatedAt: '2026-10-25T08:00:00.000Z',
}

async function repositoryWith(rides: Ride[]): Promise<RideRepository> {
  const repository = new LocalStorageRideRepository(new InMemoryKeyValueStore())
  for (const existing of rides) await repository.save(existing)
  return repository
}

/**
 * Mounts the edit page for `id`, as if navigated to from `cameFrom`.
 * Web history (jsdom's real History API) is used because `router.back()`
 * relies on it. Rides start loading straight after mounting, as App.vue does,
 * unless `loadRides` is false.
 */
async function openEditRide(
  repository: RideRepository,
  { id = 'ride-1', cameFrom = '/', loadRides = true } = {},
) {
  window.history.replaceState(null, '', '/') // a fresh "tab" for each test
  const router = createRouter({ history: createWebHistory(), routes })
  await router.replace(cameFrom)
  await router.push(`/rides/${id}/edit`)

  const pinia = createPinia()
  const wrapper = mount(EditRideView, {
    props: { id },
    global: {
      plugins: [router, pinia],
      provide: { [rideRepositoryKey]: repository },
    },
  })
  const store = useRidesStore(pinia)
  if (loadRides) {
    await store.loadRides()
    await flushPromises()
  }
  return { wrapper, router, store }
}

function inputLabelled(wrapper: VueWrapper, labelText: string) {
  const label = wrapper.findAll('label').find((candidate) => candidate.text() === labelText)
  if (!label) throw new Error(`No label "${labelText}"`)
  return wrapper.get(`#${CSS.escape(label.attributes('for') ?? '')}`)
}

function valueOf(wrapper: VueWrapper, labelText: string): string {
  return (inputLabelled(wrapper, labelText).element as HTMLInputElement).value
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('EditRideView', () => {
  it("fills the form with the ride's current values", async () => {
    const { wrapper } = await openEditRide(await repositoryWith([ride]))

    expect(valueOf(wrapper, 'Date')).toBe('2026-10-25')
    expect(valueOf(wrapper, 'Ride name')).toBe('Uriarra Loop')
    expect(valueOf(wrapper, 'Distance (km)')).toBe('67.25')
    expect(valueOf(wrapper, 'Climb (m)')).toBe('790')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Save changes')
  })

  it('saves changes, keeps the id and creation time, and returns to the sorted list', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper, router } = await openEditRide(repository, { cameFrom: '/?sort=distance' })

    await inputLabelled(wrapper, 'Ride name').setValue('Uriarra Loop (windy)')
    await inputLabelled(wrapper, 'Climb (m)').setValue('810')
    await submit(wrapper)

    const saved = await repository.getAll()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      id: 'ride-1',
      name: 'Uriarra Loop (windy)',
      elevationM: 810,
      createdAt: ride.createdAt,
    })
    expect(saved[0]?.updatedAt).not.toBe(ride.updatedAt)
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/?sort=distance'))
  })

  it('shows field errors and changes nothing for invalid input', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper, router } = await openEditRide(repository)

    await inputLabelled(wrapper, 'Distance (km)').setValue('')
    await submit(wrapper)

    expect(wrapper.text()).toContain('Distance must be greater than 0 km.')
    expect(await repository.getAll()).toEqual([ride])
    expect(router.currentRoute.value.name).toBe('edit-ride')
  })

  it('shows "not found" for an unknown ride id', async () => {
    const { wrapper } = await openEditRide(await repositoryWith([ride]), { id: 'missing' })

    expect(wrapper.text()).toContain("That ride couldn't be found.")
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe('/')
  })

  it('shows a loading message until rides arrive, then the form', async () => {
    const { wrapper, store } = await openEditRide(await repositoryWith([ride]), {
      loadRides: false,
    })
    expect(wrapper.get('[role="status"]').text()).toContain('Loading')
    expect(wrapper.find('form').exists()).toBe(false)

    await store.loadRides()
    await flushPromises()

    expect(valueOf(wrapper, 'Ride name')).toBe('Uriarra Loop')
  })

  it('shows an alert and keeps the edits when storage fails', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper } = await openEditRide(repository)
    vi.spyOn(repository, 'save').mockRejectedValue(new Error('The quota has been exceeded.'))

    await inputLabelled(wrapper, 'Ride name').setValue('Changed name')
    await submit(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toContain('The quota has been exceeded.')
    expect(valueOf(wrapper, 'Ride name')).toBe('Changed name')
  })

  it('goes back without saving on cancel', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper, router } = await openEditRide(repository, { cameFrom: '/?sort=elevation' })

    await inputLabelled(wrapper, 'Ride name').setValue('Not saved')
    await wrapper.get('button[type="button"]').trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/?sort=elevation'))
    expect(await repository.getAll()).toEqual([ride])
  })
})
