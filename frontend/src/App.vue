<script setup lang="ts">
import {
  Button,
  Toast,
  useToast
} from "primevue";
import { ref } from "vue";
import Dashboard from "./components/Dashboard.vue";

const isDark = ref(false)
const testToast = useToast()

const showToast = () =>
{
  testToast.add(
    {
      detail: "Test toast shown.",
      group: "br",
      severity: "info",
      summary: "Test toast summary."
    }
  )
}

const toggleTheme = () =>
{
  isDark.value = !isDark.value
  // eslint-disable-next-line no-undef
  document.documentElement.classList.toggle("dark")
}
</script>

<template>
  <div class="flex-1 transition-colors duration-300">
      <Toast group="br" position="bottom-right" />

      <div class="flex justify-between p-2 rounded-none bg-surface-100 dark:bg-surface-900">
        <Button class="uppercase tracking-wide text-sm text-primary font-semibold" @click="$router.push('/')" text>
          <i class="pi pi-server" style="font-size: 2em;" />
          AR Server Controller
        </Button>

        <div class="flex flex-row-reverse gap-3">
          <Button @click="toggleTheme" :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="p-button-text p-button-rounded"
            v-tooltip="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'" />

          <Button type="button" label="Notifications" icon="pi pi-bell" badge="" badgeSeverity="contrast"
            variant="outlined" @click="showToast" />
        </div>
      </div>

      <Dashboard class="max-y-full">
        <router-view />
      </Dashboard>
    </div>
</template>