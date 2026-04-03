<script setup lang="ts">
import { Badge, Button, Menu, useToast } from "primevue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "../composables/useTheme";
import { useAuthStore } from "../stores/useAuthStore";

const { mode, isDark, toggleTheme } = useTheme()
const authStore = useAuthStore()
const router = useRouter()

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

const items = ref([
  {
    label: "Servers",
    items: [
      {
        label: "New",
        icon: "pi pi-plus",
        route: "/server/add",
        shortcut: "Ctrl+C"
      },
      {
        label: "Remove",
        icon: "pi pi-trash",
        route: "/server/remove",
        shortcut: "Ctrl+R"
      },
      {
        label: "List",
        icon: "pi pi-list",
        route: "/servers",
        shortcut: "Ctrl+L"
      },
      {
        label: "Configs",
        icon: "pi pi-cog",
        route: "/server-configs"
      }
    ]
  },
  {
    label: "Profile",
    items: [
      {
        label: "Notifications",
        icon: "pi pi-bell",
        command: showToast
      },
      {
        label: "Settings",
        icon: "pi pi-cog"
      },
      {
        label: "Logout",
        icon: "pi pi-sign-out",
        command: async () => authStore.logout
      }
    ]
  },
  {
    label: "About",
    icon: "pi pi-info",
    route: "/about"
  }
])
</script>

<template>
  <Menu :model="items" class="!rounded-none !border-t-0 !border-l-0 !border-b-0 !min-w-2xs shadow-md min-h-[calc(100vh)] md:w-60"
    pt:list:class="!pl-5 !pr-5"
  >

    <template #start>
      <Button class="!rounded-none rounded-b-none tracking-wide text-sm text-primary font-semibold" fluid text @click="() => router.push('/')">
        <i class="pi pi-server text-primary" style="font-size: 2rem;" />
        <h1 style="font-size: large;">ARServerController</h1>
      </Button>
    </template>

    <template #item="{ item, props }">
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a v-ripple :href="href" class="flex items-center" v-bind="props.action" @click="navigate">
            <span :class="item.icon" />
            <p>{{ item.label }}</p>
            <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
            <span v-if="item.shortcut"
              class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">
              {{ item.shortcut }}
            </span>
          </a>
        </router-link>

        <a v-else v-ripple class="flex items-center" v-bind="props.action">
          <span :class="item.icon" />
          <p>{{ item.label }}</p>
          <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
          <span v-if="item.shortcut"
            class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">
            {{ item.shortcut }}
          </span>
        </a>
    </template>

    <template #end>
      <div class="sidebar-footer mt-auto p-3 border-t rounded-t-none border-surface-200 dark:border-surface-600">
        <Button
            text
            class="w-full justify-center gap-2 "
            @click="toggleTheme"
          >
            <i class="pi" :class="isDark ? 'pi-sun' : 'pi-moon'" style="font-size: 1.25rem;" />
            <span class="text-sm text-muted-color">
              {{
                mode === "system"
                  ? "System"
                  : mode === "dark"
                    ? "Dark"
                    : "Light"
              }}
            </span>
          </Button>
      </div>
    </template>
  </Menu>
</template>
