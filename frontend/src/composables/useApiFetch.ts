import { useApi } from "@/composables/useApi";

export const useApiFetch = () => {
    const { apiUrl } = useApi();

    async function apiFetch<T>(
        path: string,
        options: RequestInit = {},
        token?: string | null,
    ): Promise<T | null> {
        const url = apiUrl(path);
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...((options.headers as Record<string, string>) || {}),
        };

        if (token && typeof token === "string" && token.length > 0) {
            // console.debug("apiFetch: adding Authorization header");
            headers["Authorization"] = `Bearer ${token}`;
        } else if (token !== undefined && token !== null) {
            console.warn("apiFetch: token provided but invalid type or empty:", typeof token, token);
        }

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            let errorMessage = `Error: ${response.status} ${response.statusText}`;

            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch {
                // ignore json parse error
            }

            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return null;
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    return {
        apiFetch,
    };
};
