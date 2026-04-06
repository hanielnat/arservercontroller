<script setup lang="ts">
import DashboardSidebar from "@/components/DashboardSidebar.vue";
import { Toast } from "primevue";
import { ref } from "vue";

const isDark = ref(true)
const toggleTheme = () =>
{
  isDark.value = !isDark.value
  document.documentElement.classList.toggle("dark")
}
</script>

<template>
  <div class="flex">
    <Toast group="br" position="bottom-right" />

    <aside>
        <DashboardSidebar :is-dark="isDark" @theme-toggler="toggleTheme" />
    </aside>

    <main class="h-full w-full p-4">
      <router-view />
    </main>
  </div>
</template>
