import { API_BASE_URL } from './apiBase';
import { getToken } from './authApi';

const API_BASE = API_BASE_URL;

export interface Workspace {
    _id: string;
    name: string;
    owner_id: string;
    member_ids: string[];
    seat_limit: number;
    billing_plan: string;
    createdAt?: string;
}

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

export async function getWorkspaces(): Promise<Workspace[]> {
    const res = await authFetch(`${API_BASE}/workspaces`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch workspaces');
    return json.data || [];
}

export async function createWorkspace(name: string): Promise<Workspace> {
    const res = await authFetch(`${API_BASE}/workspaces`, {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create workspace');
    return json.data;
}

export async function deleteWorkspace(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/workspaces/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete workspace');
    }
}
