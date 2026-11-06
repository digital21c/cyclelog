import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { InMemoryKeyValueStore } from './repositories/keyValueStore'
import { LocalStorageRideRepository } from './repositories/localStorageRideRepository'
import { rideRepositoryKey } from './stores/injectionKeys'

describe('App', () => {
  it('renders the app shell and the home view', async () => {
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
        provide: {
          [rideRepositoryKey]: new LocalStorageRideRepository(new InMemoryKeyValueStore()),
        },
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('CycleLog')
    expect(wrapper.text()).toContain('Rides')
  })
})
