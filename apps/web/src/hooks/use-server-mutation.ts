import { useMutation, useQueryClient } from "@tanstack/react-query";

import { serversApi } from "@/api/servers";
import { serverKeys } from "@/api/servers.keys";
import { mockServer } from "@/features/dashboard/utils/servers";
import type { ServerConfigCreate, ServerConfigUpdate } from "@/types/server";

export function useAddServer() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: ServerConfigCreate) => serversApi.add(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
    });
}

export function useMockAddServer() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: ServerConfigCreate) => mockServer.add(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
    });
}

export function useUpdateServer() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ServerConfigUpdate }) =>
            serversApi.update(id, data),

        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: serverKeys.lists() });
            qc.invalidateQueries({ queryKey: serverKeys.detail(id) });
            qc.invalidateQueries({ queryKey: serverKeys.status(id) });
        },
    });
}

export function useMockUpdateServer() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ServerConfigUpdate }) =>
            mockServer.update(id, data),

        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: serverKeys.lists() });
            qc.invalidateQueries({ queryKey: serverKeys.detail(id) });
            qc.invalidateQueries({ queryKey: serverKeys.status(id) });
        },
    });
}

export function useRemoveServer() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ id, force = false }: { id: string; force?: boolean }) =>
            serversApi.remove(id, force),

        onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
    });
}

export function useMockRemoveServer() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ id, force = false }: { id: string; force?: boolean }) =>
            mockServer.remove(id),

        onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
    });
}

export function useServerAction() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            action,
        }: {
            id: string;
            action: "start" | "stop" | "restart" | "reloadConfig";
        }) => {
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

export function useMockServerAction() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            action,
        }: {
            id: string;
            action: "start" | "stop" | "restart" | "reloadConfig";
        }) => {
            return mockServer.action(id, action);
        },

        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: serverKeys.status(id) });
            qc.invalidateQueries({ queryKey: serverKeys.lists() });
        },
    });
}
