import { afterEach, describe, expect, it, vi } from "vitest";

import { mockServer as mockServerApi, serversApi } from "@/features/servers";
import { mockServerCreatedSchema } from "@/features/servers/tests/fixtures/server";

import { createMockEventSource, MockEventSource } from "./mock-eventsource";

let cleanupMockServer: (() => Promise<void>) | undefined;

afterEach(async () => {
    await cleanupMockServer?.();
    cleanupMockServer = undefined;
    vi.useRealTimers();
});

const createRunningMockServer = async (): Promise<string> => {
    const name = `Logs-${Math.random().toString(36).slice(2, 8)}`;
    const addPromise = mockServerApi.add(mockServerCreatedSchema(name));
    await vi.advanceTimersByTimeAsync(300);
    const server = await addPromise;

    cleanupMockServer = async () => {
        const removePromise = mockServerApi.remove(server.id);
        await vi.advanceTimersByTimeAsync(300);
        await removePromise;
    };

    const startPromise = mockServerApi.action(server.id, "start");
    await vi.advanceTimersByTimeAsync(2_000);
    await startPromise;

    return server.id;
};

describe("MockEventSource", () => {
    it("opens and emits messages", () => {
        const onopen = vi.fn();
        const onmessage = vi.fn();
        const source = createMockEventSource({ onopen, onmessage });

        expect(source.readyState).toBe(MockEventSource.CONNECTING);
        source.open();
        source.send("log entry");

        expect(source.readyState).toBe(MockEventSource.OPEN);
        expect(onopen).toHaveBeenCalledTimes(1);
        expect(onmessage).toHaveBeenCalledTimes(1);
        expect(onmessage.mock.calls[0][0].data).toBe("log entry");
    });

    it("dispatches standard events to EventTarget listeners", () => {
        const source = createMockEventSource();
        const onmessage = vi.fn();
        source.addEventListener("message", onmessage);

        source.send("log entry");

        expect(onmessage).toHaveBeenCalledTimes(1);
        expect((onmessage.mock.calls[0][0] as MessageEvent<string>).data).toBe("log entry");
    });

    it("tracks credentials and closed state", () => {
        const source = new MockEventSource("http://mock/logs", { withCredentials: true });

        expect(source.url).toBe("http://mock/logs");
        expect(source.withCredentials).toBe(true);
        expect(source.readyState).toBe(MockEventSource.CONNECTING);

        source.close();

        expect(source.readyState).toBe(MockEventSource.CLOSED);
    });
});

describe("mock server log streams", () => {
    it("uses mocked streams for both log endpoints in development", async () => {
        vi.useFakeTimers();
        const serverId = await createRunningMockServer();
        const agentStream = serversApi.logStream(serverId, 10, true);
        const containerStream = serversApi.containerLogStream(serverId, 10, true, false);

        expect(agentStream).toBeInstanceOf(MockEventSource);
        expect(containerStream).toBeInstanceOf(MockEventSource);

        agentStream.close();
        containerStream.close();
        vi.advanceTimersByTime(100);
    });

    it("emits the limited history and closes when follow is disabled", async () => {
        vi.useFakeTimers();
        const serverId = await createRunningMockServer();
        const source = mockServerApi.logStream(serverId, 2, false);
        const onmessage = vi.fn();
        source.onmessage = onmessage;

        vi.advanceTimersByTime(5_000);

        expect(onmessage).toHaveBeenCalledTimes(2);
        expect(onmessage.mock.calls[0][0].data).toBe(
            "Received heartbeat from the dedicated server",
        );
        expect(source.readyState).toBe(MockEventSource.CLOSED);
    });

    it("stops emitting followed log messages after close", () => {
        vi.useFakeTimers();
        const source = mockServerApi.containerLogStream("server-id", 2, true, true);
        const onmessage = vi.fn();
        source.onmessage = onmessage;

        vi.advanceTimersByTime(1_000);
        expect(onmessage).toHaveBeenCalled();
        expect(onmessage.mock.calls[0][0].data).toMatch(/^\d{4}-\d{2}-\d{2}T/);

        source.close();
        const messageCount = onmessage.mock.calls.length;
        vi.advanceTimersByTime(5_000);

        expect(onmessage).toHaveBeenCalledTimes(messageCount);
        expect(source.readyState).toBe(MockEventSource.CLOSED);
    });
});
