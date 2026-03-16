<script setup lang="ts">
import { Card } from "primevue";
</script>

<template>
  <div class="flex-1 p-6 bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-black">
    <header class="mb-8">
      <h1 class="text-4xl font-extrabold text-gray-800 dark:text-gray-100">Dashboard Overview</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">Welcome back! Here's a quick glance at your data.</p>
    </header>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      <Card class="w-full max-w-full overflow-hidden shadow-lg rounded-lg bg-white dark:bg-gray-800">
        <template #title>
          <span class="text-primary font-semibold">Server Status</span>
        </template>

        <template #content>
          <div class="text-gray-700 dark:text-gray-300">All systems operational</div>
        </template>
      </Card>
      <Card class="w-full max-w-full overflow-hidden shadow-lg rounded-lg bg-white dark:bg-gray-800">
        <template #title>
          <span class="text-primary font-semibold">Active Users</span>
        </template>

        <template #content>
          <div class="text-gray-700 dark:text-gray-300">1,245 online</div>
        </template>
      </Card>
      <Card class="w-full max-w-full overflow-hidden shadow-lg rounded-lg bg-white dark:bg-gray-800">
        <template #title>
          <span class="text-primary font-semibold">New Messages</span>
        </template>

        <template #content>
          <div class="text-gray-700 dark:text-gray-300">23 unread</div>
        </template>
      </Card>
    </div>
  </div>
</template>
