<script setup lang="ts">
import { useFetch, useWebSocket } from "@vueuse/core";
import { Button, ScrollPanel } from "primevue";
import { onMounted, onUnmounted, ref } from "vue";
import { useApi } from "../composables/useApi";

const props = defineProps<{
    serverId: string
}>()

interface Log {
    time: string
    phase: string
    message: string
}

const logs = ref<Log[]>([])
const isCreating = ref(true)

const { apiUrl, wsUrl } = useApi()

const ws = useWebSocket(
    wsUrl(`/servers/ws/${props.serverId}/creation`),
    {
        autoReconnect: true,
        onConnected: () =>
        {
            console.log(
                `Connected to creation logs for server ${props.serverId}`,
            )
        },
        onMessage: (_, event) =>
        {
            console.log(`onMessage(_: ${_}, event: ${event})`)
            try
            {
                const msg = JSON.parse(event.data)
                logs.value.push({
                    time: new Date().toLocaleTimeString(),
                    phase: msg.phase || "info",
                    message: msg.message || JSON.stringify(msg),
                })

                if (msg.final === true)
                {
                    isCreating.value = false
                }
            }
            catch (e)
            {
                console.error("Failed to parse log message", e)
            }
        },
        onDisconnected: () =>
        {
            isCreating.value = false
        },
    },
)

const getPhaseColor = (phase: string): string =>
{
    if (phase === "error" || phase === "fail")
    {
        return "text-red-500"
    }

    if (phase === "success")
    {
        return "text-green-500"
    }

    if (phase === "container")
    {
        return "text-blue-500"
    }

    return "text-primary"
}

const handleCancel = async () =>
{
    const { error, isFetching } = await useFetch(apiUrl(`/servers/${props.serverId}/cancel`)).post()
    if ( error.value )
    {
        console.error("Failed to cancel creation:", error.value)
    }
}

onMounted(() =>
{
})

onUnmounted(() =>
{
    ws.close()
})
</script>

<style scoped>
.font-mono {
    font-family: ui-monospace, monospace;
}
</style>

<template>
    <div class="flex flex-col h-full">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium">Server Creation Logs</h2>

            <Button
                v-if="ws.status.value === 'OPEN'"
                label="Close ws connection"
                @click="ws.close()"
            />

            <Button
                v-if="isCreating"
                label="Cancel Creation"
                severity="danger"
                size="small"
                icon="pi pi-times"
                @click="handleCancel"
            />
        </div>

        <ScrollPanel
            class="flex-1 border rounded p-3 bg-surface-50 dark:bg-surface-900 overflow-auto font-mono text-sm"
        >
            <div
                v-for="(log, index) in logs"
                :key="index"
                class="mb-1 whitespace-pre-wrap"
            >
                <span class="text-muted-color">{{ log.time }}</span>

                <span
                    :class="getPhaseColor(log.phase)"
                    class="ml-3 font-medium"
                >
                    [{{ log.phase }}]
                </span>

                <span class="ml-3">{{ log.message }}</span>
            </div>

            <div
                v-if="logs.length === 0"
                class="text-muted-color italic py-8 text-center"
            >
                Waiting for creation to start...
            </div>
        </ScrollPanel>
    </div>
</template>
