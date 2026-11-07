<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import RideList from '@/components/RideList.vue'
import RideSortControls from '@/components/RideSortControls.vue'
import { useRideSortQuery } from '@/composables/useRideSortQuery'
import { sortRides } from '@/models/rideSort'
import { useRidesStore } from '@/stores/rides'

const ridesStore = useRidesStore()

// storeToRefs keeps state and getters reactive when destructured.
// Actions (functions) are taken from the store object itself.
const { rides, rideCount, loadStatus, loadError } = storeToRefs(ridesStore)

// The sort lives in the URL; sorting itself is a pure model function.
const sort = useRideSortQuery()
const sortedRides = computed(() => sortRides(rides.value, sort.value))

const isLoading = computed(() => loadStatus.value === 'idle' || loadStatus.value === 'loading')
const rideCountLabel = computed(
  () => `${rideCount.value} ${rideCount.value === 1 ? 'ride' : 'rides'}`,
)

onMounted(() => {
  void ridesStore.loadRides() // never rejects: failures are recorded in loadError
})
</script>

<template>
  <section aria-labelledby="rides-heading">
    <div class="flex items-center justify-between gap-4">
      <h1 id="rides-heading" class="text-2xl font-bold">Rides</h1>
      <RouterLink
        :to="{ name: 'add-ride' }"
        class="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      >
        Add ride
      </RouterLink>
    </div>

    <p v-if="isLoading" role="status" class="mt-4 text-slate-600 dark:text-slate-400">
      Loading rides…
    </p>

    <div
      v-else-if="loadStatus === 'error'"
      role="alert"
      class="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    >
      <p class="font-semibold">Your rides couldn't be loaded.</p>
      <p class="mt-1 text-sm">{{ loadError }}</p>
    </div>

    <p v-else-if="rideCount === 0" class="mt-4 text-slate-600 dark:text-slate-400">
      No rides recorded yet.
      <RouterLink
        :to="{ name: 'add-ride' }"
        class="font-medium text-sky-700 underline hover:text-sky-800 dark:text-sky-400"
      >
        Add your first ride
      </RouterLink>
    </p>

    <template v-else>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">{{ rideCountLabel }}</p>
      <RideSortControls v-model="sort" class="mt-4" />
      <RideList class="mt-4" :rides="sortedRides" />
    </template>
  </section>
</template>
