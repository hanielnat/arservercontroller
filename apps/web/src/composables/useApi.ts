import config from "@/config";

export const useApi = () => {
    const apiUrl = (path: string) =>
        `${config.API_BASE_URL}${config.API_V1}${path}`;
    const wsUrl = (path: string) =>
        `${config.WS_BASE_URL}${config.API_V1}${path}`;

    return {
        apiUrl,
        wsUrl,
    };
};
