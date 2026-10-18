import * as z from "zod";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8000";
const API_PREFIX = process.env.NEXT_PUBLIC_API_V1_STR ?? "/api/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiClientOptions = Omit<RequestInit, "method" | "body"> & {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined | null>;
    customFetch?: typeof fetch;
};

export class ApiError extends Error {
    public status: number;
    public data?: unknown;
    public detail?: unknown;

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
        this.detail =
            typeof data === "object" && data !== null && "detail" in data
                ? (data as { detail: unknown }).detail
                : undefined;
    }
}

export function buildUrl(endpoint: string, params?: ApiClientOptions["params"]) {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${API_PREFIX}${path}`, BASE_URL);

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null) {
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
    schema: z.ZodType<T>,
    options?: ApiClientOptions,
): Promise<T>;

export async function apiClient(
    method: HttpMethod,
    endpoint: string,
    options?: ApiClientOptions,
): Promise<unknown>;

export async function apiClient<T>(
    method: HttpMethod,
    endpoint: string,
    schemaOrOptions?: z.ZodType<T> | ApiClientOptions,
    maybeOptions?: ApiClientOptions,
): Promise<T | unknown> {
    const schema = schemaOrOptions && "parse" in schemaOrOptions ? schemaOrOptions : undefined;

    const options: ApiClientOptions = schema
        ? (maybeOptions ?? {})
        : ((schemaOrOptions as ApiClientOptions | undefined) ?? {});

    const { body, params, headers, ...rest } = options;

    const fetchFn = options.customFetch ?? window.fetch;
    const res = await fetchFn(buildUrl(endpoint, params), {
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
    let data: unknown;

    try {
        data = text ? JSON.parse(text) : undefined;
    } catch {
        if (!res.ok) {
            throw new ApiError(res.statusText || "Request failed", res.status, text);
        }

        throw new ApiError("Response is not a valid JSON", res.status, text);
    }

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

    try {
        return !schema ? (undefined as T) : schema.parse(data);
    } catch (err) {
        if (err instanceof z.ZodError) {
            throw new ApiError("Response from server differs from expected schema", res.status, {
                issues: err.issues,
                raw: data,
            });
        }

        throw err;
    }
}
