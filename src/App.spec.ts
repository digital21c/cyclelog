import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from './App.vue'
import type { Ride } from './models/ride'
import { InMemoryKeyValueStore } from './repositories/keyValueStore'
import { LocalStorageRideRepository } from './repositories/localStorageRideRepository'
import { routes } from './router'
import { rideRepositoryKey } from './stores/injectionKeys'

const ride: Ride = {
  id: 'ride-1',
  date: '2026-11-01',
  name: 'Tidbinbilla Loop',
  distanceKm: 96,
  elevationM: 1050,
  createdAt: '2026-11-01T07:00:00.000Z',
  updatedAt: '2026-11-01T07:00:00.000Z',
}

async function mountApp(url = '/') {
  const repository = new LocalStorageRideRepository(new InMemoryKeyValueStore())
  await repository.save(ride)

  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(url)

  const wrapper = mount(App, {
    global: {
      plugins: [router, createPinia()],
      provide: { [rideRepositoryKey]: repository },
    },
  })
  await flushPromises()
  return wrapper
}

describe('App', () => {
  it('renders the app shell and the home view', async () => {
    const wrapper = await mountApp()
    expect(wrapper.get('header a').text()).toBe('CycleLog')
    expect(wrapper.get('h1').text()).toBe('Rides')
  })

  it('loads rides at startup, so the list shows them', async () => {
    const wrapper = await mountApp()
    expect(wrapper.text()).toContain('Tidbinbilla Loop')
  })

  it('loads rides at startup even when opening the edit page directly', async () => {
    const wrapper = await mountApp('/rides/ride-1/edit')
    const name = wrapper.findAll('input').find((input) => {
      return (input.element as HTMLInputElement).value === 'Tidbinbilla Loop'
    })
    expect(name).toBeDefined()
  })

  it('confirms a newly added ride on the list it returns to', async () => {
    const wrapper = await mountApp('/rides/new')
    const inputLabelled = (text: string) => {
      const label = wrapper.findAll('label').find((candidate) => candidate.text() === text)
      return wrapper.get(`#${CSS.escape(label?.attributes('for') ?? '')}`)
    }

    await inputLabelled('Ride name').setValue('Mount Majura Climb')
    await inputLabelled('Distance (km)').setValue('18.2')
    await inputLabelled('Climb (m)').setValue('340')
    await wrapper.get('form').trigger('submit')
    await flushPromises() // save, navigate back to the list, render it

    expect(wrapper.get('h1').text()).toBe('Rides')
    expect(wrapper.text()).toContain('Mount Majura Climb')
    const confirmation = wrapper
      .findAll('[role="status"]')
      .map((region) => region.text())
      .find((text) => text.includes('Ride added'))
    expect(confirmation).toContain('Ride added: Mount Majura Climb.')
  })
})
