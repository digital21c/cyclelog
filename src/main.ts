import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { LocalStorageRideRepository } from './repositories/localStorageRideRepository'
import { rideRepositoryKey } from './stores/injectionKeys'

const app = createApp(App)

// Composition root: the one place that chooses concrete implementations.
// To move to IndexedDB or a REST API, change this line.
app.provide(rideRepositoryKey, new LocalStorageRideRepository())

app.use(createPinia())
app.use(router)

app.mount('#app')
