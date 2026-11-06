import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { LocalStorageRideRepository } from './repositories/localStorageRideRepository'
import type { RideRepository } from './repositories/rideRepository'
import { rideRepositoryKey } from './stores/injectionKeys'

/**
 * Composition root: the one place that chooses concrete implementations.
 * To move to IndexedDB or a REST API, change this function.
 */
async function createRideRepository(): Promise<RideRepository> {
  if (import.meta.env.VITE_DEMO_DATA === 'true') {
    // Dynamic import: demo code is only downloaded in demo mode, and Vite
    // leaves it out of production builds because the condition is false there.
    const { createDemoRideRepository } = await import('./demo/demoRepository')
    console.info('CycleLog is running in demo mode: rides are in memory only.')
    return createDemoRideRepository()
  }
  return new LocalStorageRideRepository()
}

const app = createApp(App)

app.provide(rideRepositoryKey, await createRideRepository())

app.use(createPinia())
app.use(router)

app.mount('#app')
