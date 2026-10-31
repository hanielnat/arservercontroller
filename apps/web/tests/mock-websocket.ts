type WsMessage = string | ArrayBuffer | Blob;

interface MockWsOptions {
    onopen?: (event: Event) => void;
    onmessage?: (event: MessageEvent) => void;
    onclose?: (event: CloseEvent) => void;
    onerror?: (event: Event) => void;
}

export class MockWebSocket extends EventTarget {
    static readonly CONNECTING = 0 as const;
    static readonly OPEN = 1 as const;
    static readonly CLOSING = 2 as const;
    static readonly CLOSED = 3 as const;

    readonly CONNECTING = 0 as const;
    readonly OPEN = 1 as const;
    readonly CLOSING = 2 as const;
    readonly CLOSED = 3 as const;

    readonly url: string;
    readonly protocol: string;
    readonly protocols: string;
    readonly bufferedAmount = 0;
    readonly extensions = "";
    readonly binaryType: "blob" | "arraybuffer" = "blob";

    onopen: ((this: MockWebSocket, ev: Event) => any) | null = null;
    onmessage: ((this: MockWebSocket, ev: MessageEvent) => any) | null = null;
    onclose: ((this: MockWebSocket, ev: CloseEvent) => any) | null = null;
    onerror: ((this: MockWebSocket, ev: Event) => any) | null = null;

    private _readyState: number = MockWebSocket.CONNECTING;

    constructor(url: string, protocols?: string | string[], opts: MockWsOptions = {}) {
        super();
        this.url = url;
        this.protocol = "";
        this.protocols = protocols
            ? Array.isArray(protocols)
                ? protocols.join(",")
                : protocols
            : "";
        if (opts.onopen) this.onopen = opts.onopen;
        if (opts.onmessage) this.onmessage = opts.onmessage;
        if (opts.onclose) this.onclose = opts.onclose;
        if (opts.onerror) this.onerror = opts.onerror;
    }

    get readyState(): number {
        return this._readyState;
    }

    open(): void {
        this._readyState = MockWebSocket.OPEN;
        const event = new Event("open");
        this.onopen?.(event);
        this.dispatchEvent(event);
    }

    send(data: WsMessage): void {
        const event = new MessageEvent("message", { data });
        this.onmessage?.(event);
        this.dispatchEvent(event);
    }

    close(code = 1000, reason?: string): void {
        if (this._readyState === MockWebSocket.CLOSED) return;
        this._readyState = MockWebSocket.CLOSING;
        const event = new CloseEvent("close", { code, reason });
        this.onclose?.(event);
        this.dispatchEvent(event);
        this._readyState = MockWebSocket.CLOSED;
    }

    error(): void {
        const event = new Event("error");
        this.onerror?.(event);
        this.dispatchEvent(event);
    }
}

export function createMockWebSocket(opts: MockWsOptions = {}): MockWebSocket {
    return new MockWebSocket("ws://mock", undefined, opts);
}
