<script setup lang="ts">
import { Card } from "primevue";
</script>

<template>
  <div class="flex-1 p-6">
    <header class="mb-8">
      <h1 class="text-4xl font-extrabold ">Dashboard Overview</h1>
      <p class="text-lg ">Welcome back! Here's a quick glance at your data.</p>
    </header>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      <Card class="w-full max-w-full overflow-hidden shadow-lg rounded-lg">
        <template #title>
          <span class="text-primary font-semibold">Server Status</span>
        </template>

        <template #content>
          <div class="">All systems operational</div>
        </template>
      </Card>
      <Card class="w-full max-w-full overflow-hidden shadow-lg rounded-lg">
        <template #title>
          <span class="text-primary font-semibold">Active Users</span>
        </template>

        <template #content>
          <div class="">1,245 online</div>
        </template>
      </Card>
      <Card class="w-full max-w-full overflow-hidden shadow-lg rounded-lg">
        <template #title>
          <span class="text-primary font-semibold">New Messages</span>
        </template>

        <template #content>
          <div class="">23 unread</div>
        </template>
      </Card>
    </div>
  </div>
</template>
