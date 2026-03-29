import axios, { AxiosResponse } from "axios";

const BASE_URL = "http://127.0.0.1:8000"
const API_BASE_URL = "/api/v1/servers";

export async function getServers(offset = 0, limit = 10): Promise<Record<string, any>> 
{
    const response: AxiosResponse = await axios.get(`${BASE_URL}${API_BASE_URL}/`, {
        params: { offset, limit },
    });
    return response.data;
}

export async function addServer(serverConfig: Record<string, any>) 
{
    const response = await axios.post(`${BASE_URL}${API_BASE_URL}/`, serverConfig);
    return response.data;
}

export async function updateServer(serverId: string, newConfig: Record<string, any>) 
{
    const response = await axios.patch(`${API_BASE_URL}/${serverId}`, newConfig);
    return response.data;
}