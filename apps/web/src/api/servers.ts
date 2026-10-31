import * as z from "zod";

import { mockServer } from "@/features/dashboard/utils/servers";
import { apiClient, buildUrl, type ApiClientOptions } from "@/lib/client";
import type { WebSocketLike } from "@/types/dashboard";
import type {
    ServerConfig,
    ServerConfigCreate,
    ServerConfigUpdate,
    ServerOut,
    ServersOut,
    ServerStatusOut,
} from "@/types/server";
import {
    ServerConfigSchema,
    ServerOutSchema,
    ServersOutSchema,
    ServerStatusOutSchema,
} from "@/types/server.schema";

const useMock = import.meta.env.DEV;

export const serversApi = {
    list: async (offset = 0, limit = 10, options?: ApiClientOptions) =>
        await apiClient<ServersOut>("GET", "/servers", ServersOutSchema, {
            params: { offset, limit },
            ...options,
        }),

    add: async (server: ServerConfigCreate, options?: ApiClientOptions) =>
        await apiClient<ServerConfig>("POST", "/servers", ServerConfigSchema, {
            body: server,
            ...options,
        }),

    update: async (id: string, updated: ServerConfigUpdate, options?: ApiClientOptions) =>
        await apiClient<ServerOut>("PATCH", `/servers/${id}`, ServerOutSchema, {
            body: updated,
            ...options,
        }),

    remove: async (id: string, force = false, options?: ApiClientOptions) =>
        await apiClient("DELETE", `/servers/${id}`, {
            params: { force },
            ...options,
        }),

    status: async (id: string, options?: ApiClientOptions) =>
        await apiClient<ServerStatusOut>("GET", "/servers/status/", ServerStatusOutSchema, {
            params: { server_id: id },
            ...options,
        }),

    start: async (id: string, options?: ApiClientOptions) =>
        await apiClient("POST", `/servers/${id}/start`, options),

    stop: async (id: string, options?: ApiClientOptions) =>
        await apiClient("POST", `/servers/${id}/stop`, options),

    restart: async (id: string, options?: ApiClientOptions) =>
        await apiClient("POST", `/servers/${id}/restart`, options),

    reloadConfig: async (id: string, options?: ApiClientOptions) =>
        await apiClient("POST", `/servers/${id}/config`, options),

    cancelAdd: async (id: string, options?: ApiClientOptions) =>
        await apiClient<Record<string, boolean>>(
            "POST",
            `/servers/${id}/cancel`,
            z.record(z.string(), z.boolean()),
            options,
        ),

    logStream: (id: string, limit: number, follow: boolean): EventSource =>
        new EventSource(buildUrl(`/servers/${id}/logs/stream`, { limit, follow })),

    containerLogStream: (
        id: string,
        limit: number,
        follow: boolean,
        showTimeStamp: boolean,
    ): EventSource =>
        new EventSource(
            buildUrl(`/servers/${id}/container/logs/stream`, {
                limit,
                follow,
                show_timestamp: showTimeStamp,
            }),
        ),

    creationLogsWs: (
        id: string,
        options?: { wsFactory?: (url: string) => WebSocketLike },
    ): WebSocketLike => {
        const wsFactory = options?.wsFactory
            ? options?.wsFactory
            : useMock
              ? () => mockServer.creationLogs(id)
              : (url: string) => new WebSocket(url);

        return wsFactory(buildUrl(`/servers/ws/${id}/creation`));
    },
};
