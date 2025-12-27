<script setup lang="ts">
import {
  Badge,
  // Menubar,
  Button,
  Menu,
  Toast,
  // OverlayBadge,
  useToast,
} from "primevue";
import { ref } from "vue";

const isDark = ref(false)

const items = ref([
  {
    separator: true
  },
  {
    label: "Servers",
    items: [
      {
        label: "Metrics",
        icon: "pi pi-chart-line",
        shortcut: "CTRL+M"
      },
      {
        label: "New",
        icon: "pi pi-plus",
        shortcut: "Ctrl+C"
      },
      {
        label: "Search",
        icon: "pi pi-search"
      }
    ]
  },
  {
    label: "Profile",
    items: [
      {
        label: "Settings",
        icon: "pi pi-cog"
      },
      {
        label: "Logout",
        icon: "pi pi-sign-out"
      }
    ]
  },
  {
    separator: true
  },
]);

const toggleTheme = () => 
{
  isDark.value = !isDark.value
  // eslint-disable-next-line no-undef
  document.documentElement.classList.toggle("dark")
}

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
</script>

<template>
  <div class="transition-colors duration-300">
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

    <div class="flex gap-4">
      <Menu :model="items" class="m-3 w-full md:w-60">

        <template #start>
          <Button class="rounded-b-none tracking-wide text-sm text-primary font-semibold" fluid text>
            <i class="pi pi-users" style="font-size: 1em;" />
            Groups
            <i class="pi pi-chevron-down" style="font-size: 1em;" />
          </Button>

        </template>

        <template #item="{ item, props }">
          <a v-ripple class="flex items-center" v-bind="props.action">
            <span :class="item.icon" />
            <p>{{ item.label }}</p>
            <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
            <span v-if="item.shortcut"
              class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">
              {{ item.shortcut }}
            </span>
          </a>
        </template>
      </Menu>

      <div class="h-screen w-screen">
        <router-view />
      </div>

    </div>
  </div>
</template>