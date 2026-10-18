import { vi } from "vitest";

type MockResponseInit = {
    status?: number;
    body?: unknown;
    headers?: Record<string, string>;
};

export function createMockFetch(response: MockResponseInit = {}) {
    const { status = 200, body, headers = { "Content-Type": "application/json" } } = response;
    const isNoContentStatus = status === 204 || status === 205 || status === 304;
    const responseBody =
        body === undefined
            ? isNoContentStatus
                ? null
                : ""
            : typeof body === "string"
              ? body
              : JSON.stringify(body);

    const mockFetch = vi.fn().mockResolvedValue(
        new Response(isNoContentStatus ? null : responseBody, {
            status,
            headers,
            statusText: status >= 400 ? "Error" : "OK",
        }),
    );

    return mockFetch;
}

export function createMockFetchError(status: number, body?: unknown) {
    return createMockFetch({ status, body });
}
