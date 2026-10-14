const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8000";
const API_PREFIX = process.env.NEXT_PUBLIC_API_V1_STR ?? "/api/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiClientOptions = Omit<RequestInit, "method" | "body"> & {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined | null>;
};

export class ApiError extends Error {
    public status: number;
    public data?: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

function buildUrl(endpoint: string, params?: ApiClientOptions["params"]) {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${API_PREFIX}${path}`, BASE_URL);

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined && value === null) {
                continue;
            }

            url.searchParams.set(key, String(value));
        }
    }

    return url.toString();
}

export async function apiClient<T>(
    method: HttpMethod,
    endpoint: string,
    options: ApiClientOptions = {},
): Promise<T> {
    const { body, params, headers, ...rest } = options;

    const res = await fetch(buildUrl(endpoint, params), {
        method,
        headers: {
            Accept: "application/json",
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...rest,
    });

    const text = await res.text();
    const data = text ? safeJsonParse(text) : undefined;

    if (!res.ok) {
        const message =
            typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
                ? (data as { message: string }).message
                : res.statusText || "Request failed";

        throw new ApiError(message, res.status, data);
    }

    return data as T;
}

function safeJsonParse(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}
