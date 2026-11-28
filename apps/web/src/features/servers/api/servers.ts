import * as z from "zod";

import {
    mockServer,
    USE_MOCK as useMock,
    ServerConfigSchema,
    ServerOutSchema,
    ServersOutSchema,
    ServerStatusOutSchema,
} from "@/features/servers";
import type {
    ServerConfig,
    ServerConfigCreate,
    ServerConfigUpdate,
    ServerOut,
    ServersOut,
    ServerStatusOut,
} from "@/features/servers";
import { apiClient, buildUrl, type ApiClientOptions } from "@/lib/client";
import type { EventSourceLike, WebSocketLike } from "@/types";

export const serversApi = {
    list: async (offset: number, limit: number, options?: ApiClientOptions) =>
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

    remove: async (id: string, force: boolean, options?: ApiClientOptions) =>
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

    reloadConfig: async (id: string, config: Record<string, unknown>, options?: ApiClientOptions) =>
        await apiClient("POST", `/servers/${id}/config`, {
            body: config,
            ...options,
        }),

    cancelAdd: async (id: string, options?: ApiClientOptions) =>
        await apiClient<Record<string, boolean>>(
            "POST",
            `/servers/${id}/cancel`,
            z.record(z.string(), z.boolean()),
            options,
        ),

    logStream: (id: string, limit: number, follow: boolean): EventSourceLike =>
        useMock
            ? mockServer.logStream(id, limit, follow)
            : new EventSource(buildUrl(`/servers/${id}/logs/stream`, { limit, follow })),

    containerLogStream: (
        id: string,
        tail: number,
        follow: boolean,
        showTimeStamp: boolean,
    ): EventSourceLike =>
        useMock
            ? mockServer.containerLogStream(id, tail, follow, showTimeStamp)
            : new EventSource(
                  buildUrl(`/servers/${id}/container/logs/stream`, {
                      tail,
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
