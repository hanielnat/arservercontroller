import type { MockEventSource } from "../../tests/mock-eventsource";
import type { MockWebSocket } from "../../tests/mock-websocket";

export interface Crumb {
    label: string;
    to?: string;
}

export type WebSocketLike = WebSocket | MockWebSocket;
export type EventSourceLike = EventSource | MockEventSource;
