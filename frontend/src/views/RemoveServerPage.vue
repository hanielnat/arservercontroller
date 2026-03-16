<template>
  <div class="p-6">
    <header class="mb-6">
      <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">Remove a Server</h2>
      <p class="text-gray-600 dark:text-gray-400">Select a server to remove from your dashboard.</p>
    </header>

    <ul class="space-y-4">
      <li v-for="server in servers" :key="server.id" class="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ server.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ server.status }}</p>
          </div>
          <button @click="removeServer(server.id)" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Remove</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from "vue";

const servers = ref([
  { id: 1, name: "Server 1", status: "Online" },
  { id: 2, name: "Server 2", status: "Offline" },
]);

function removeServer(id) 
{
  servers.value = servers.value.filter(server => server.id !== id);
}
</script>

<style scoped>
/* Add any additional styles here */
</style>