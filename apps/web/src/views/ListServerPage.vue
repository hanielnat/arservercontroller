<script setup lang="ts">
import { useServersStore } from "@/stores/useServersStore";
import { useDateFormat } from "@vueuse/core";
import { Button, ButtonGroup, Card } from "primevue";
import { onMounted } from "vue";

const {
    servers,
    isLoading,
    fetchServers,
    startServer,
    stopServer,
    restartServer,
    deleteServer,
} = useServersStore();

function timestampToDatetime(ts: number): string {
    const date = new Date(ts);
    return useDateFormat(date, "MM-DD-YY HH:mm").value;
}

onMounted(async () => {
    if (servers.length > 0) {
        return;
    }

    await fetchServers();
});
</script>

<template>
    <div class="p-6">
        <header class="mb-6 w-full">
            <div class="flex gap-6">
                <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    List of Servers
                </h2>

                <Button
                    label="Reload"
                    icon="pi pi-refresh"
                    variant="text"
                    :loading="isLoading"
                    @click="fetchServers"
                />
            </div>

            <p class="relative text-gray-600 dark:text-gray-400">
                View all servers currently in your dashboard.
            </p>
        </header>

        <ul class="space-y-4">
            <li
                v-for="server in servers"
                :key="server.serverConfigData.id"
                class="p-4"
            >
                <Card v-model="server.serverConfigData">
                    <template #title>
                        <div class="flex flex-row justify-between">
                            <h1 class="text-[2em] my-auto">
                                {{ server.serverConfigData.name }}
                            </h1>

                            <div class="float-right flex flex-col justify-end">
                                <div
                                    class="flex flex-row justify-end align-middle text-sm"
                                >
                                    <p class="text-muted-color p-2">Status:</p>

                                    <code class="bg-surface-800 p-2">
                                        {{ server.serverConfigData.status }}
                                    </code>
                                </div>

                                <ButtonGroup class="mt-2">
                                    <Button
                                        severity="danger"
                                        icon="pi pi-trash"
                                        variant=""
                                        small
                                        @click="
                                            deleteServer(
                                                server.serverConfigData.id,
                                            )
                                        "
                                    />

                                    <Button
                                        severity="warn"
                                        icon="pi pi-stop"
                                        variant=""
                                        small
                                        @click="
                                            stopServer(
                                                server.serverConfigData.id,
                                            )
                                        "
                                    />

                                    <Button
                                        severity="info"
                                        icon="pi pi-refresh"
                                        variant=""
                                        small
                                        @click="
                                            restartServer(
                                                server.serverConfigData.id,
                                            )
                                        "
                                    />

                                    <Button
                                        label="Start"
                                        icon="pi pi-play"
                                        small
                                        @click="
                                            startServer(
                                                server.serverConfigData.id,
                                            )
                                        "
                                    />
                                </ButtonGroup>
                            </div>
                        </div>
                    </template>

                    <template #subtitle>
                        <div class="text-muted-color" ref="server-id">
                            {{ server.serverConfigData.id }}
                        </div>

                        <div class="flex justify-baseline text-muted-color">
                            <div class="">
                                Created at
                                {{ timestampToDatetime(server.createdAt) }}
                            </div>

                            <div class="pl-2">
                                Updated at
                                {{ timestampToDatetime(server.updatedAt) }}
                            </div>
                        </div>
                    </template>
                </Card>
            </li>
        </ul>
    </div>
</template>
