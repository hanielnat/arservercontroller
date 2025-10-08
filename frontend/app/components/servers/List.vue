<script setup lang="ts">
import type {
    ServerStatus,
    ServerConfig
} from "~/types"
import type { ServerConfigSchema } from "~/types/schemas.zod"

const { servers } = defineProps<{ servers?: ServerConfig[] }>()

const refServers = ref(Array.from(servers || []))

const serversToast = useToast()

const _getServer = (serverId: string) =>
{
    const _servers = refServers.value
        .find(server_ => server_.id === serverId)

    return refServers.value.find(server => server.id === serverId)
}

const _getServerStatusLocal = (serverId: string): ServerStatus =>
{
    return servers?.find(server => server.id === serverId)?.status || "dead"
}

const setServerStatusLocal = async (_serverId: string, _newStatus: ServerStatus): Promise<void> =>
{
    const _server = servers?.find(server => server.id === _serverId)
    if (!_server)
        return

    _server.status = _newStatus
}

const startServer = async (serverId: string) =>
{
    const response = await $fetch("/api/servers", { method: "POST", body: { id: serverId, status: "running" } })
    if (response)
    {
        setServerStatusLocal(serverId, response.status)
        serversToast.add(
            {
                title: "Server started.",
                description: `Server '${serverId}' has been started.`,
                color: "success"
            }
        )
    }
}

const stopServer = async (serverId: string) =>
{
    const response = await $fetch("/api/servers", { method: "POST", body: { id: serverId, status: "exited" } })
    if (response)
    {
        setServerStatusLocal(serverId, response.status)
        serversToast.add(
            {
                title: "Server stopped.",
                description: `Server '${serverId}' has been stopped.`,
                color: "success"
            }
        )
    }
}
</script>

<template>
    <div class="h-screen">
        <ul
            role="list"
            class="divide-y divide-default"
        >
            <li
                v-for="server in servers"
                :key="server.id"
                class="h-[80px] mb-4"
            >
                <div class="flex items-center justify-between">
                    <p class="text-highlighted">
                        {{ server.name || "Unknown server name" }}
                    </p>
                    <p :class="server.status === 'created' ? 'text-secondary' : server.status === 'running' ? 'text-primary' : 'text-error'">
                        {{ server.status }}
                    </p>
                </div>
                <p class="text-sm text-muted text-mono">
                    {{ server.id.toUpperCase() }}
                </p>
                <UButton
                    label="Start"
                    class="m-2"
                    @click="startServer(server.id)"
                />
                <UButton
                    label="Stop"
                    class="m-2"
                    @click="stopServer(server.id)"
                />
            </li>
        </ul>
    </div>
</template>
