<script setup lang="ts">
/** An error panel, announced immediately by screen readers (role="alert"). */
defineProps<{
  title: string
  message?: string | null
}>()
</script>

<template>
  <div
    role="alert"
    class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
  >
    <p class="font-semibold">{{ title }}</p>
    <p v-if="message" class="mt-1 text-sm">{{ message }}</p>
  </div>
</template>
