<script setup lang="ts">
import type { Ride } from '@/models/ride'

import RideListItem from './RideListItem.vue'

/** Presentational: shows rides in the order given. Sorting is the caller's job. */
defineProps<{
  rides: readonly Ride[]
}>()
</script>

<template>
  <ul class="space-y-3">
    <li v-for="ride in rides" :key="ride.id">
      <RideListItem :ride="ride" />
    </li>
  </ul>
</template>
