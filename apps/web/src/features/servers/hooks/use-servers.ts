import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { serverKeys, mockServer } from "@/features/servers";
import { serversApi } from "@/features/servers/api/servers";
import { getStoredSettings, useSettings } from "@/hooks/providers/settings-provider";

const useMock = import.meta.env.DEV;

export function serversQueryOptions(offset = 0, limit?: number) {
    const max = limit ?? getStoredSettings().interface.maxServersShown;
    return queryOptions({
        queryKey: serverKeys.list(offset, max),
        queryFn: () => (useMock ? mockServer.list(max) : serversApi.list(offset, max)),
    });
}

export function useServersQueryOptions(offset = 0, limit?: number) {
    const settingsMax = useSettings().settings.interface.maxServersShown;
    return serversQueryOptions(offset, limit ?? settingsMax);
}

export function useServers(offset = 0, limit?: number) {
    return useQuery(useServersQueryOptions(offset, limit));
}

export function useSuspenseServers(offset = 0, limit?: number) {
    return useSuspenseQuery(useServersQueryOptions(offset, limit));
}

export function serverStatusQueryOptions(id: string, enabled = true) {
    return queryOptions({
        queryKey: serverKeys.status(id),
        queryFn: () => (useMock ? mockServer.status(id) : serversApi.status(id)),
        refetchInterval: 5000,
        enabled: Boolean(id) && enabled,
    });
}

export function useServerStatus(id: string, enabled = true) {
    return useQuery(serverStatusQueryOptions(id, enabled));
}
