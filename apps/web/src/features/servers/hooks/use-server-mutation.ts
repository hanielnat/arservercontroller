import {
    mutationOptions,
    QueryClient,
    useIsMutating,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import { serverKeys, serversApi, mockServer, USE_MOCK as useMock } from "@/features/servers";
import type { ServerAction, ServerConfigCreate, ServerConfigUpdate } from "@/features/servers";

export function addServerMutationOptions(qc: QueryClient) {
    return mutationOptions({
        mutationFn: (payload: ServerConfigCreate) =>
            useMock ? mockServer.add(payload) : serversApi.add(payload),

        mutationKey: ["server-operation", "add"],

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

        mutationKey: ["server-operation", "update"],

        onSuccess: async (updatedServer, { id }) => {
            qc.setQueryData(serverKeys.detail(id), updatedServer);

            await Promise.all([
                qc.invalidateQueries({ queryKey: serverKeys.lists() }),
                qc.invalidateQueries({ queryKey: serverKeys.status(id) }),
            ]);
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

        mutationKey: ["server-operation", "remove"],

        onSuccess: () => qc.invalidateQueries({ queryKey: serverKeys.lists() }),
    });
}

export function useRemoveServer() {
    const qc = useQueryClient();

    return useMutation(removeServerMutationOptions(qc));
}

export function reloadServerConfigMutationOptions(qc: QueryClient) {
    return mutationOptions({
        mutationFn: async ({ id, config }: { id: string; config: Record<string, unknown> }) => {
            if (useMock) {
                await mockServer.reloadConfig(id, config);
                return;
            }

            await serversApi.reloadConfig(id, config);
        },

        mutationKey: ["server-operation", "action"],

        onSuccess: (_data, { id }) => {
            Promise.all([
                qc.invalidateQueries({ queryKey: serverKeys.status(id) }),
                qc.invalidateQueries({ queryKey: serverKeys.lists() }),
            ]);
        },
    });
}

export function useReloadServerConfig() {
    const qc = useQueryClient();

    return useMutation(reloadServerConfigMutationOptions(qc));
}

export function serverActionMutationOptions(qc: QueryClient) {
    return mutationOptions({
        mutationFn: async ({ id, action }: { id: string; action: ServerAction }) => {
            if (useMock) {
                await mockServer.action(id, action);
                return;
            }

            switch (action) {
                case "start":
                    await serversApi.start(id);
                    break;

                case "stop":
                    await serversApi.stop(id);
                    break;

                case "restart":
                    await serversApi.restart(id);
                    break;
            }
        },

        mutationKey: ["server-operation", "action"],

        onSuccess: (_data, { id }) =>
            Promise.all([
                qc.invalidateQueries({ queryKey: serverKeys.status(id) }),
                qc.invalidateQueries({ queryKey: serverKeys.lists() }),
            ]),
    });
}

export function useServerAction() {
    const qc = useQueryClient();

    return useMutation(serverActionMutationOptions(qc));
}

export function useIsServerActionPending(id: string, action?: ServerAction) {
    return (
        useIsMutating({
            exact: true,
            mutationKey: ["server-operation", "action"],

            predicate: (mutation) => {
                const variables = mutation.state.variables as
                    | { id: string; action: ServerAction }
                    | undefined;

                return (
                    variables?.id === id && (action === undefined || variables.action === action)
                );
            },
        }) > 0
    );
}
