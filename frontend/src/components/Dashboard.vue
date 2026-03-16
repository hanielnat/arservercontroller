<script setup lang="ts">
import { Badge, Button, Menu } from "primevue";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
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
        command: () => 
{
          router.push("/server/add");
        },
        shortcut: "Ctrl+C"
      },
      {
        label: "Remove",
        icon: "pi pi-trash",
        command: () => 
{
          router.push("/server/remove");
        },
        shortcut: "Ctrl+R"
      },
      {
        label: "List",
        icon: "pi pi-list",
        command: () => 
{
          router.push("/server/list");
        },
        shortcut: "Ctrl+L"
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
  }
]);
</script>

<template>
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
          <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.router" custom>
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
          <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
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
      <slot />
    </div>
  </div>
</template>
