import { describe, expect, expectTypeOf, it } from "vitest";

import { serversApi } from "@/api/servers";
import { ApiError } from "@/lib/client";
import type { ServerConfig, ServersOut, ServerStatusOut } from "@/types/server";

import { mockServer, mockServerCreatedSchema } from "./fixtures/server";
import { createMockFetch, createMockFetchError } from "./mock-fetch";

describe("serversApi", () => {
    const serverId = "11111111-1111-4123-812a-4d2c6d7a2d8d";
    const createdServerId = "22222222-2222-4123-812a-4d2c6d7a2d8d";

    // -------------------------------------------------------------------------------
    it("list returns typed list when response is ok", async () => {
        const sv = mockServer(serverId);

        const body: ServersOut = {
            count: 1,
            data: [sv],
        };

        const result = await serversApi.list(0, 10, {
            customFetch: createMockFetch({ body }),
        });

        expect(result.count).toBe(1);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].serverConfigData.id).toBe(serverId);
        expectTypeOf(result).toEqualTypeOf<ServersOut>();
    });

    it("list rejects payload that fails schema check", async () => {
        await expect(
            serversApi.list(0, 10, {
                customFetch: createMockFetch({
                    body: { count: "not-a-number", data: null },
                }),
            }),
        ).rejects.toBeInstanceOf(ApiError);
    });

    // -------------------------------------------------------------------------------
    it("add returns created server", async () => {
        const created = mockServerCreatedSchema();
        const response: ServerConfig = {
            ...created,
            id: createdServerId,
        };

        const result = await serversApi.add(created, {
            customFetch: createMockFetch({ status: 201, body: response }),
        });

        expect(result.id).toBe(response.id);
        expectTypeOf(result).toEqualTypeOf<ServerConfig>();
    });

    // -------------------------------------------------------------------------------
    it("remove resolves and removes a server", async () => {
        await expect(
            serversApi.remove("a", false, {
                customFetch: createMockFetch({ status: 204 }),
            }),
        ).resolves.toBeUndefined();
    });

    it("remove propagates 404 from backend", async () => {
        await expect(
            serversApi.remove("missing", false, {
                customFetch: createMockFetchError(404, {
                    detail: "Server not found",
                }),
            }),
        ).rejects.toMatchObject({
            status: 404,
            detail: "Server not found",
        });
    });

    // -------------------------------------------------------------------------------
    it("status returns typed state", async () => {
        const body: ServerStatusOut = {
            container: "running",
            agent: "running",
            reforger: {
                pid: 1,
                status: "running",
            },
        };

        const result = await serversApi.status("a", {
            customFetch: createMockFetch({ body }),
        });

        expect(result).toEqual(body);
        expectTypeOf(result).toEqualTypeOf<ServerStatusOut>();
    });

    // -------------------------------------------------------------------------------
    it("start resolves when backend accepts", async () => {
        await expect(
            serversApi.start("a", {
                customFetch: createMockFetch({ status: 204 }),
            }),
        ).resolves.toBeUndefined();
    });

    it("start fails with message from backend", async () => {
        await expect(
            serversApi.start("a", {
                customFetch: createMockFetchError(500, {
                    detail: "Cannot start server",
                }),
            }),
        ).rejects.toMatchObject({
            status: 500,
            detail: "Cannot start server",
        });
    });
});
