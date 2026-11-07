import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

/** Exported so tests can build a router with in-memory history from the same routes. */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/rides/new',
    name: 'add-ride',
    // Lazy-loaded: this page's code is fetched the first time it's visited.
    component: () => import('@/views/AddRideView.vue'),
  },
  {
    path: '/rides/:id/edit',
    name: 'edit-ride',
    component: () => import('@/views/EditRideView.vue'),
    // Pass route params (here, `id`) to the view as props.
    props: true,
  },
  {
    path: '/backup',
    name: 'backup',
    component: () => import('@/views/BackupView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
