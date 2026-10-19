import { useQuery } from "@tanstack/react-query";

import { serversApi } from "@/api/servers";
import { serverKeys } from "@/api/servers.keys";
import { mockServer } from "@/features/dashboard/utils/servers";

export function useServers(offset = 0, limit = 10) {
    return useQuery({
        queryKey: serverKeys.list(offset, limit),
        queryFn: () => serversApi.list(offset, limit),
    });
}

export function useMockServers(offset = 0, limit = 10) {
    return useQuery({
        queryKey: serverKeys.list(offset, limit),
        queryFn: () => mockServer.list(limit),
    });
}

export function useServerStatus(id: string, enabled = true) {
    return useQuery({
        queryKey: serverKeys.status(id),
        queryFn: () => serversApi.status(id),
        enabled: Boolean(id) && enabled,
    });
}
