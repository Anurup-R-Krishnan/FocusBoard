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

export interface Invite {
    _id: string;
    workspace_id: string;
    inviter_id: string;
    invitee_email: string;
    token: string;
    status: string;
    role: string;
    workspace?: { _id: string; name: string };
}

export async function createInvite(workspaceId: string, inviteeEmail: string, role?: string): Promise<Invite> {
    const res = await authFetch(`${API_BASE}/invites`, {
        method: 'POST',
        body: JSON.stringify({ workspace_id: workspaceId, invitee_email: inviteeEmail, role }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create invite');
    return json.data;
}

export async function getPendingInvites(): Promise<Invite[]> {
    const res = await authFetch(`${API_BASE}/invites/pending`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch invites');
    return json.data || [];
}

export async function acceptInvite(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/invites/${id}/accept`, { method: 'PUT' });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to accept invite');
    }
}

export async function declineInvite(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/invites/${id}/decline`, { method: 'PUT' });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to decline invite');
    }
}

export async function revokeInvite(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE}/invites/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to revoke invite');
    }
}
