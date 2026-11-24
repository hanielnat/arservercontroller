import type { MockEventSource } from "../../tests/mock-eventsource";
import type { MockWebSocket } from "../../tests/mock-websocket";

export type WebSocketLike = WebSocket | MockWebSocket;
export type EventSourceLike = EventSource | MockEventSource;

export * from "./dashboard";
export * from "./nav-types";
