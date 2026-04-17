<script setup lang="ts">
import DashboardSidebar from "@/components/DashboardSidebar.vue";
import { Toast } from "primevue";
import { ref } from "vue";

const isDark = ref(true);
const toggleTheme = () => {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark");
};
</script>

<template>
    <div class="flex min-h-screen">
        <Toast group="br" position="bottom-right" />

        <aside class="">
            <DashboardSidebar
                class="fixed min-h-full"
                :is-dark="isDark"
                @theme-toggler="toggleTheme"
            />
        </aside>

        <main class="h-full w-full ml-72 p-4">
            <router-view />
        </main>
    </div>
</template>
