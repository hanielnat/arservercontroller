<script setup lang="ts">
import { ServersInSchema } from "~/types/schemas.zod"
import type { ServersIn, ServerConfig } from "~/types"

const query = ref("")
const { data } = await useAsyncData<ServersIn>("servers", () => $fetch("/servers/").then(raw => ServersInSchema.parse(raw)))

const _typedServerList: Ref<ServersIn | null> = data as ServersIn[]

const filteredServers = computed(() => data.value?.data.filter((server: ServerConfig) =>
    server.name.search(new RegExp(query.value, "i")) !== -1
))
</script>

<template>
    <div>
        <UHeader />
        <UPageCard
            title="Servers"
            variant="ghost"
            class="flex-1 p-6 overflow-y-auto"
        >
            <template #header>
                <UInput
                    v-model="query"
                    icon="i-lucide-search"
                    placeholder="Search servers"
                    autofocus
                    class="w-full"
                />
            </template>
            <ServersList :servers="filteredServers" />
        </UPageCard>
    </div>
</template>
