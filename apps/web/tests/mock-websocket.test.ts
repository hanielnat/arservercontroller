import { afterEach, describe, expect, it, vi } from "vitest";

import { mockServer as mockServerApi } from "@/features/dashboard/utils/servers";

import { MockWebSocket, createMockWebSocket } from "./mock-websocket";

afterEach(() => vi.useRealTimers());

describe("MockWebSocket", () => {
    it("sends and receives messages", () => {
        const onmessage = vi.fn();
        const ws = createMockWebSocket({ onmessage });

        ws.open();
        ws.send(JSON.stringify({ phase: "manager", message: "hello" }));

        expect(onmessage).toHaveBeenCalledTimes(1);
        expect(onmessage.mock.calls[0][0].data).toBe(
            JSON.stringify({ phase: "manager", message: "hello" }),
        );
    });

    it("tracks readyState transitions", () => {
        const ws = createMockWebSocket();
        expect(ws.readyState).toBe(MockWebSocket.CONNECTING);

        ws.open();
        expect(ws.readyState).toBe(MockWebSocket.OPEN);

        ws.close();
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    });
});

describe("MockWebSocket lifecycle", () => {
    it("simulates open, messages, and close", () => {
        const onopen = vi.fn();
        const onmessage = vi.fn();
        const onclose = vi.fn();
        const ws = createMockWebSocket({ onopen, onmessage, onclose });

        expect(ws.readyState).toBe(MockWebSocket.CONNECTING);

        ws.open();
        expect(ws.readyState).toBe(MockWebSocket.OPEN);
        expect(onopen).toHaveBeenCalledTimes(1);

        ws.send(JSON.stringify({ phase: "manager", message: "Starting" }));
        ws.send(JSON.stringify({ phase: "docker", message: "Creating" }));
        ws.send(JSON.stringify({ phase: "manager", message: "Done", final: true }));
        expect(onmessage).toHaveBeenCalledTimes(3);

        ws.close();
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
        expect(onclose).toHaveBeenCalledTimes(1);
    });
});

describe("mock creation logs", () => {
    it("does not open or emit logs after closing before the delayed open", () => {
        vi.useFakeTimers();
        const ws = mockServerApi.creationLogs("server-id");
        const onmessage = vi.fn();
        ws.onmessage = onmessage;

        ws.close();
        vi.advanceTimersByTime(10_000);

        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
        expect(onmessage).not.toHaveBeenCalled();
    });

    it("stops emitting logs after closing between messages", () => {
        vi.useFakeTimers();
        const ws = mockServerApi.creationLogs("server-id");
        const onmessage = vi.fn();
        ws.onmessage = onmessage;

        vi.advanceTimersByTime(100);
        expect(onmessage).toHaveBeenCalledTimes(1);

        ws.close();
        vi.advanceTimersByTime(10_000);

        expect(onmessage).toHaveBeenCalledTimes(1);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    });
});
