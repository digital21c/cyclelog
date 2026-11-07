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
import { useNotificationsStore } from '@/stores/notifications'
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
  return { wrapper, router, store, notifications: useNotificationsStore(pinia) }
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

describe('EditRideView when rides cannot be loaded', () => {
  it('shows the load error instead of the form', async () => {
    const repository = await repositoryWith([ride])
    vi.spyOn(repository, 'getAll').mockRejectedValue(
      new Error('Stored ride data is not valid JSON.'),
    )
    const { wrapper, store } = await openEditRide(repository, { loadRides: false })

    await store.loadRides()
    await flushPromises()

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain("Your rides couldn't be loaded.")
    expect(alert.text()).toContain('Stored ride data is not valid JSON.')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).not.toContain("couldn't be found")
  })
})

describe('EditRideView delete', () => {
  function buttonNamed(wrapper: VueWrapper, text: string) {
    const found = wrapper.findAll('button').find((candidate) => candidate.text() === text)
    if (!found) throw new Error(`No button "${text}"`)
    return found
  }

  function dialogIsOpen(wrapper: VueWrapper): boolean {
    return (wrapper.get('dialog').element as HTMLDialogElement).open
  }

  it('asks for confirmation, naming the ride and its date', async () => {
    const { wrapper } = await openEditRide(await repositoryWith([ride]))
    expect(dialogIsOpen(wrapper)).toBe(false)

    await buttonNamed(wrapper, 'Delete ride').trigger('click')

    expect(dialogIsOpen(wrapper)).toBe(true)
    expect(wrapper.get('dialog').text()).toContain('Uriarra Loop on Sun, 25 Oct 2026')
    expect(wrapper.get('dialog').text()).toContain("can't be undone")
  })

  it('keeps the ride when the confirmation is cancelled', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper, router } = await openEditRide(repository)

    await buttonNamed(wrapper, 'Delete ride').trigger('click')
    await wrapper.get('dialog').findAll('button')[0]?.trigger('click') // Cancel

    expect(dialogIsOpen(wrapper)).toBe(false)
    expect(await repository.getAll()).toEqual([ride])
    expect(router.currentRoute.value.name).toBe('edit-ride')
  })

  it('deletes the ride and returns to the sorted list once confirmed', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper, router, store } = await openEditRide(repository, {
      cameFrom: '/?sort=distance',
    })

    await buttonNamed(wrapper, 'Delete ride').trigger('click')
    await wrapper.get('dialog').findAll('button')[1]?.trigger('click') // confirm
    await flushPromises()

    expect(await repository.getAll()).toEqual([])
    expect(store.rides).toEqual([])
    expect(wrapper.text()).toContain('Ride deleted.')
    expect(wrapper.text()).not.toContain("couldn't be found")
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/?sort=distance'))
  })

  it('keeps the ride and explains why if deleting fails', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper, router } = await openEditRide(repository)
    vi.spyOn(repository, 'delete').mockRejectedValue(
      new Error('Stored ride data is not valid JSON.'),
    )

    await buttonNamed(wrapper, 'Delete ride').trigger('click')
    await wrapper.get('dialog').findAll('button')[1]?.trigger('click')
    await flushPromises()

    expect(dialogIsOpen(wrapper)).toBe(true)
    expect(wrapper.get('dialog [role="alert"]').text()).toContain(
      'Stored ride data is not valid JSON.',
    )
    expect(await repository.getAll()).toEqual([ride])
    expect(router.currentRoute.value.name).toBe('edit-ride')
  })

  it('clears an old error when the confirmation is opened again', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper } = await openEditRide(repository)
    vi.spyOn(repository, 'delete').mockRejectedValueOnce(new Error('Temporary failure'))

    await buttonNamed(wrapper, 'Delete ride').trigger('click')
    await wrapper.get('dialog').findAll('button')[1]?.trigger('click')
    await flushPromises()
    await wrapper.get('dialog').findAll('button')[0]?.trigger('click') // Cancel

    await buttonNamed(wrapper, 'Delete ride').trigger('click')
    expect(wrapper.find('dialog [role="alert"]').exists()).toBe(false)
  })
})

describe('EditRideView confirmations', () => {
  it('confirms saved changes, using the new name', async () => {
    const { wrapper, notifications } = await openEditRide(await repositoryWith([ride]))
    await inputLabelled(wrapper, 'Ride name').setValue('Uriarra Loop (windy)')
    await submit(wrapper)
    expect(notifications.current?.message).toBe('Changes saved: Uriarra Loop (windy).')
  })

  it('confirms a deletion, naming the ride that was deleted', async () => {
    const { wrapper, notifications } = await openEditRide(await repositoryWith([ride]))
    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete ride')
    await deleteButton?.trigger('click')
    await wrapper.get('dialog').findAll('button')[1]?.trigger('click')
    await flushPromises()
    expect(notifications.current?.message).toBe('Ride deleted: Uriarra Loop.')
  })

  it('confirms nothing when deleting fails', async () => {
    const repository = await repositoryWith([ride])
    const { wrapper, notifications } = await openEditRide(repository)
    vi.spyOn(repository, 'delete').mockRejectedValue(new Error('Storage is broken'))
    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete ride')
    await deleteButton?.trigger('click')
    await wrapper.get('dialog').findAll('button')[1]?.trigger('click')
    await flushPromises()
    expect(notifications.current).toBeNull()
  })
})
