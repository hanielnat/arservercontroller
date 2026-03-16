<template>
  <aside class="w-64 bg-gray-800 text-white h-full flex flex-col">
    <div class="p-4 text-2xl font-bold border-b border-gray-700">Dashboard</div>
    <nav class="flex-1 overflow-y-auto">
      <ul class="space-y-2 p-4">
        <li>
          <a href="#" class="block px-4 py-2 rounded hover:bg-gray-700">Home</a>
        </li>
        <li>
          <a href="#" class="block px-4 py-2 rounded hover:bg-gray-700">Servers</a>
        </li>
        <li>
          <a href="#" class="block px-4 py-2 rounded hover:bg-gray-700">Settings</a>
        </li>
      </ul>
    </nav>
    <div class="p-4 border-t border-gray-700">
      <button class="w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700">Logout</button>
    </div>
  </aside>
</template>

<script setup>
// Add any necessary props or logic here
</script>

<style scoped>
/* Add any additional styles here */
</style>