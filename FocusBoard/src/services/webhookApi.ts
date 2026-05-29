import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

const API_BASE = API_BASE_URL;

async function authFetch(url: string, options: RequestInit = {}) {
    const token = getToken();
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
}

export interface WebhookEndpoint {
    _id: string;
    name: string;
    url: string;
    events: string[];
    secret: string;
    active: boolean;
    lastDeliveryAt?: string;
    lastDeliveryStatus?: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function getEndpoints(): Promise<WebhookEndpoint[]> {
    const res = await authFetch(`${API_BASE}/webhooks`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch endpoints');
    return json.data || [];
}

export async function createEndpoint(payload: { name: string; url: string; events?: string[] }): Promise<WebhookEndpoint> {
    const res = await authFetch(`${API_BASE}/webhooks`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create endpoint');
    return json.data;
}

export async function updateEndpoint(id: string, payload: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> {
    const res = await authFetch(`${API_BASE}/webhooks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update endpoint');
    return json.data;
}

export async function deleteEndpoint(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/webhooks/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete endpoint');
    }
}

export async function rotateSecret(id: string): Promise<string> {
    const res = await authFetch(`${API_BASE}/webhooks/${id}/rotate-secret`, { method: 'PUT' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to rotate secret');
    return json.data.secret;
}
