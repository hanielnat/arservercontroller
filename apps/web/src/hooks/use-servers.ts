import { queryOptions, useQuery } from "@tanstack/react-query";

import { serversApi } from "@/api/servers";
import { serverKeys } from "@/api/servers.keys";
import { mockServer } from "@/features/dashboard/utils/servers";

const useMock = import.meta.env.DEV;

export function serversQueryOptions(offset = 0, limit = 10) {
    return queryOptions({
        queryKey: serverKeys.list(offset, limit),
        queryFn: () => (useMock ? mockServer.list(limit) : serversApi.list(offset, limit)),
    });
}

export function useServers(offset = 0, limit = 10) {
    return useQuery(serversQueryOptions(offset, limit));
}

export function serverStatusQueryOptions(id: string, enabled = true) {
    return queryOptions({
        queryKey: serverKeys.status(id),
        queryFn: () => (useMock ? mockServer.status(id) : serversApi.status(id)),
        enabled: Boolean(id) && enabled,
    });
}

export function useServerStatus(id: string, enabled = true) {
    return useQuery(serverStatusQueryOptions(id, enabled));
}
