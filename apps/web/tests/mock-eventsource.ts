interface MockEventSourceOptions {
    onopen?: (event: Event) => void;
    onmessage?: (event: MessageEvent<string>) => void;
    onerror?: (event: Event) => void;
}

export class MockEventSource extends EventTarget {
    static readonly CONNECTING = 0 as const;
    static readonly OPEN = 1 as const;
    static readonly CLOSED = 2 as const;

    readonly CONNECTING = 0 as const;
    readonly OPEN = 1 as const;
    readonly CLOSED = 2 as const;

    readonly url: string;
    readonly withCredentials: boolean;

    onopen: ((this: MockEventSource, ev: Event) => any) | null = null;
    onmessage: ((this: MockEventSource, ev: MessageEvent<string>) => any) | null = null;
    onerror: ((this: MockEventSource, ev: Event) => any) | null = null;

    private _readyState: number = MockEventSource.CONNECTING;

    constructor(url: string, init: EventSourceInit = {}, opts: MockEventSourceOptions = {}) {
        super();
        this.url = url;
        this.withCredentials = init.withCredentials ?? false;
        if (opts.onopen) this.onopen = opts.onopen;
        if (opts.onmessage) this.onmessage = opts.onmessage;
        if (opts.onerror) this.onerror = opts.onerror;
    }

    get readyState(): number {
        return this._readyState;
    }

    open(): void {
        this._readyState = MockEventSource.OPEN;
        const event = new Event("open");
        this.onopen?.(event);
        this.dispatchEvent(event);
    }

    send(data: string): void {
        const event = new MessageEvent<string>("message", { data });
        this.onmessage?.(event);
        this.dispatchEvent(event);
    }

    error(): void {
        const event = new Event("error");
        this.onerror?.(event);
        this.dispatchEvent(event);
    }

    close(): void {
        this._readyState = MockEventSource.CLOSED;
    }
}

export function createMockEventSource(opts: MockEventSourceOptions = {}): MockEventSource {
    return new MockEventSource("http://mock", undefined, opts);
}
