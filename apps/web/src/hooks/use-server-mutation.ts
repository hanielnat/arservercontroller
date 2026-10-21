import { mutationOptions, QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { serversApi } from "@/api/servers";
import { serverKeys } from "@/api/servers.keys";
import { mockServer } from "@/features/dashboard/utils/servers";
import type { ServerConfigCreate, ServerConfigUpdate } from "@/types/server";

const useMock = import.meta.env.DEV;

export function addServerMutationOptions(qc: QueryClient) {
    return mutationOptions({
        mutationFn: (payload: ServerConfigCreate) =>
            useMock ? mockServer.add(payload) : serversApi.add(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
    });
}

export function useAddServer() {
    const qc = useQueryClient();

    return useMutation(addServerMutationOptions(qc));
}

export function updateServerMutationOptions(qc: QueryClient) {
    return mutationOptions({
        mutationFn: ({ id, data }: { id: string; data: ServerConfigUpdate }) =>
            useMock ? mockServer.update(id, data) : serversApi.update(id, data),

        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: serverKeys.lists() });
            qc.invalidateQueries({ queryKey: serverKeys.detail(id) });
            qc.invalidateQueries({ queryKey: serverKeys.status(id) });
        },
    });
}

export function useUpdateServer() {
    const qc = useQueryClient();
    return useMutation(updateServerMutationOptions(qc));
}

export function removeServerMutationOptions(qc: QueryClient) {
    return mutationOptions({
        mutationFn: ({ id, force = false }: { id: string; force?: boolean }) =>
            useMock ? mockServer.remove(id) : serversApi.remove(id, force),

        onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
    });
}

export function useRemoveServer() {
    const qc = useQueryClient();

    return useMutation(removeServerMutationOptions(qc));
}

export function serverActionMutationOptions(qc: QueryClient) {
    return mutationOptions({
        mutationFn: ({
            id,
            action,
        }: {
            id: string;
            action: "start" | "stop" | "restart" | "reloadConfig";
        }) => {
            if (useMock) {
                return mockServer.action(id, action);
            }

            switch (action) {
                case "start":
                    return serversApi.start(id);
                case "stop":
                    return serversApi.stop(id);
                case "restart":
                    return serversApi.restart(id);
                case "reloadConfig":
                    return serversApi.reloadConfig(id);
            }
        },

        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: serverKeys.status(id) });
            qc.invalidateQueries({ queryKey: serverKeys.lists() });
        },
    });
}

export function useServerAction() {
    const qc = useQueryClient();

    return useMutation(serverActionMutationOptions(qc));
}
