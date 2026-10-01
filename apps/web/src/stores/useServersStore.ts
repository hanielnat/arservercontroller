import { useApiFetch } from "@/composables/useApiFetch";
import {
    GetServersReponse,
    Server,
    ServerConfig,
    ServerConfigCreate,
} from "@/lib/types";
import { defineStore } from "pinia";
import { useToast } from "primevue";
import { ref } from "vue";
import { useAuthStore } from "./useAuthStore";

export const useServersStore = defineStore("servers", () => {
    const error = ref<string | null>(null);
    const servers = ref<Server[]>([]);

    const isLoading = ref(false);

    const toast = useToast();
    const authStore = useAuthStore();
    const { apiFetch: baseApiFetch } = useApiFetch();

    async function apiFetch<T>(
        path: string,
        options: RequestInit = {},
    ): Promise<T | null> {
        return baseApiFetch<T>(path, options, authStore.token);
    }

    async function fetchServers() {
        isLoading.value = true;

        try {
            const data = await apiFetch<GetServersReponse>("/servers");
            servers.value = data?.data ?? [];
            error.value = null;
        } catch (err) {
            console.error("Error fetching servers:", err);

            toast.add({
                severity: "error",
                summary: "Error getting servers list",
                detail: err instanceof Error ? err.message : "Unknown error",
                group: "br",
            });
        } finally {
            isLoading.value = false;
        }
    }

    async function startServer(id: string) {
        isLoading.value = true;

        try {
            await apiFetch(`/servers/${id}/start`, { method: "POST" });

            toast.add({
                severity: "success",
                summary: "Server started",
                group: "br",
            });

            await fetchServers();
        } catch (err) {
            console.error("Error starting server:", err);

            toast.add({
                severity: "error",
                summary: `Failed to start server ${id}`,
                detail: err instanceof Error ? err.message : "Unknown error",
                group: "br",
            });
        } finally {
            isLoading.value = false;
        }
    }

    async function stopServer(id: string) {
        isLoading.value = true;

        try {
            await apiFetch(`/servers/${id}/stop`, { method: "POST" });

            toast.add({
                severity: "success",
                summary: "Server stopped",
                group: "br",
            });

            await fetchServers();
        } catch (err) {
            console.error("Error stopping server:", err);

            toast.add({
                severity: "error",
                summary: `Failed to stop server ${id}`,
                detail: err instanceof Error ? err.message : "Unknown error",
                group: "br",
            });
        } finally {
            isLoading.value = false;
        }
    }

    async function restartServer(id: string) {
        isLoading.value = true;

        try {
            await apiFetch(`/servers/${id}/restart`, { method: "POST" });

            toast.add({
                severity: "success",
                summary: "Server restarted",
                group: "br",
            });

            await fetchServers();
        } catch (err) {
            console.error("Error restarting server:", err);

            toast.add({
                severity: "error",
                summary: `Failed to restart server ${id}`,
                detail: err instanceof Error ? err.message : "Unknown error",
                group: "br",
            });
        } finally {
            isLoading.value = false;
        }
    }

    async function createServer(config: ServerConfigCreate) {
        isLoading.value = true;

        try {
            const data = await apiFetch<ServerConfig>("/servers", {
                method: "POST",
                body: JSON.stringify(config),
            });

            toast.add({
                severity: "success",
                summary: "Server creation started",
                group: "br",
            });

            await fetchServers();
            return data;
        } catch (err) {
            console.error("Error creating server:", err);

            toast.add({
                severity: "error",
                summary: "Failed to create server",
                detail: err instanceof Error ? err.message : "Unknown error",
                group: "br",
            });

            return null;
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteServer(id: string) {
        isLoading.value = true;

        try {
            await apiFetch(`/servers/${id}`, { method: "DELETE" });

            toast.add({
                severity: "success",
                summary: "Server deleted",
                group: "br",
            });

            await fetchServers();
        } catch (err) {
            console.error("Error deleting server:", err);

            toast.add({
                severity: "error",
                summary: `Failed to delete server ${id}`,
                detail: err instanceof Error ? err.message : "Unknown error",
                group: "br",
            });
        } finally {
            isLoading.value = false;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function connectServerCreationLogs(id: string) {
        throw new Error("Not implemented");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function cancelServerCreation(id: string) {
        throw new Error("Not implemented");
    }

    return {
        servers,
        isLoading,
        error,

        fetchServers,
        startServer,
        stopServer,
        restartServer,
        createServer,
        deleteServer,
        connectServerCreationLogs,
        cancelServerCreation,
    };
});
