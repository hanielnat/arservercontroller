<template>
  <div class="p-6">
    <header class="mb-6">
      <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">List of Servers</h2>
      <p class="text-gray-600 dark:text-gray-400">View all servers currently in your dashboard.</p>
    </header>

    <ul class="space-y-4">
      <li v-for="server in servers" :key="server.id" class="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ server.name }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Status: {{ server.status }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getServers } from "../services/serverService";


const totalServers = ref(2)
// TODO fazer reativo
const servers = ref([
  { id: 1, name: "Server 1", status: "Online" },
  { id: 2, name: "Server 2", status: "Offline" },
]);

const isErrored = ref(false)

onMounted()
{
    getServers()
    .then(serversData => {
        totalServers.value = serversData.count
        servers.value = serversData.data
    })
    .catch(error => {
        isErrored.value = true
        console.log("Error retrieving servers")
    });
}
</script>

<style scoped>
/* Add any additional styles here */
</style>