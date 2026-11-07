import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { InMemoryKeyValueStore } from '@/repositories/keyValueStore'
import { LocalStorageRideRepository } from '@/repositories/localStorageRideRepository'
import type { RideRepository } from '@/repositories/rideRepository'
import { routes } from '@/router'
import { rideRepositoryKey } from '@/stores/injectionKeys'

import AddRideView from './AddRideView.vue'

function inMemoryRepository(): RideRepository {
  return new LocalStorageRideRepository(new InMemoryKeyValueStore())
}

/**
 * Mounts the page as if the user had navigated to it from `cameFrom`
 * (or opened it directly when `cameFrom` is undefined).
 *
 * Uses web history (jsdom's real History API) rather than memory history,
 * because only web history records the previous page that `router.back()`
 * and the "came from the list?" check depend on.
 */
async function openAddRide(repository: RideRepository, cameFrom?: string) {
  window.history.replaceState(null, '', '/') // a fresh "tab" for each test
  const router = createRouter({ history: createWebHistory(), routes })
  await router.replace(cameFrom ?? '/rides/new')
  if (cameFrom) await router.push('/rides/new')

  const wrapper = mount(AddRideView, {
    global: {
      plugins: [router, createPinia()],
      provide: { [rideRepositoryKey]: repository },
    },
  })
  return { wrapper, router }
}

function inputLabelled(wrapper: VueWrapper, labelText: string) {
  const label = wrapper.findAll('label').find((candidate) => candidate.text() === labelText)
  if (!label) throw new Error(`No label "${labelText}"`)
  return wrapper.get(`#${CSS.escape(label.attributes('for') ?? '')}`)
}

async function fillValidRide(wrapper: VueWrapper) {
  await inputLabelled(wrapper, 'Ride name').setValue('Black Mountain Climb')
  await inputLabelled(wrapper, 'Distance (km)').setValue('11.4')
  await inputLabelled(wrapper, 'Climb (m)').setValue('230')
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises() // let the save and navigation finish
}

describe('AddRideView', () => {
  it('saves a valid ride and goes back to the list, keeping its sort', async () => {
    const repository = inMemoryRepository()
    const { wrapper, router } = await openAddRide(repository, '/?sort=distance')

    await fillValidRide(wrapper)
    await submit(wrapper)

    const saved = await repository.getAll()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      name: 'Black Mountain Climb',
      distanceKm: 11.4,
      elevationM: 230,
    })
    // router.back() completes asynchronously, via the browser's popstate event.
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/?sort=distance'))
  })

  it('goes to the list after saving when the page was opened directly', async () => {
    const { wrapper, router } = await openAddRide(inMemoryRepository())

    await fillValidRide(wrapper)
    await submit(wrapper)

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('shows field errors, saves nothing and stays on the page for invalid input', async () => {
    const repository = inMemoryRepository()
    const { wrapper, router } = await openAddRide(repository, '/')

    await inputLabelled(wrapper, 'Distance (km)').setValue('abc')
    await submit(wrapper)

    expect(wrapper.text()).toContain('Enter a ride name.')
    expect(wrapper.text()).toContain('Distance must be greater than 0 km.')
    expect(wrapper.text()).toContain('Climb must be a whole number of metres')
    expect(await repository.getAll()).toEqual([])
    expect(router.currentRoute.value.name).toBe('add-ride')
  })

  it('shows an alert and keeps the input when storage fails', async () => {
    const failing: RideRepository = {
      getAll: () => Promise.resolve([]),
      getById: () => Promise.resolve(undefined),
      save: () => Promise.reject(new Error('The quota has been exceeded.')),
      saveMany: () => Promise.reject(new Error('The quota has been exceeded.')),
      delete: () => Promise.resolve(),
    }
    const { wrapper, router } = await openAddRide(failing, '/')

    await fillValidRide(wrapper)
    await submit(wrapper)

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain("couldn't be saved")
    expect(alert.text()).toContain('The quota has been exceeded.')
    expect((inputLabelled(wrapper, 'Ride name').element as HTMLInputElement).value).toBe(
      'Black Mountain Climb',
    )
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    expect(router.currentRoute.value.name).toBe('add-ride')
  })

  it('goes back without saving on cancel', async () => {
    const repository = inMemoryRepository()
    const { wrapper, router } = await openAddRide(repository, '/?sort=elevation')

    await fillValidRide(wrapper)
    await wrapper.get('button[type="button"]').trigger('click')
    await flushPromises()

    // router.back() completes asynchronously, via the browser's popstate event.
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/?sort=elevation'))
    expect(await repository.getAll()).toEqual([])
  })
})
