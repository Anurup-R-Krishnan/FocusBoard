// Activity Mapping API Service – talks to FocusBoard-backend /api/activity-mappings

import { API_BASE_URL } from './apiBase';
import { authHeaders } from './authApi';
const API_BASE = API_BASE_URL;

export interface ActivityMapping {
    _id: string;
    activityId: string | { _id: string; app_name: string; start_time: string; end_time?: string };
    categoryId: string | { _id: string; name: string; color?: string; icon?: string };
    isManualOverride?: boolean;
    overrideReason?: string;
    confidenceScore?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ActivityMappingPayload {
    activityId: string;
    categoryId: string;
    isManualOverride?: boolean;
    overrideReason?: string;
    confidenceScore?: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || `HTTP ${res.status}`);
    return (json as any).data as T;
}

export async function createMapping(payload: ActivityMappingPayload): Promise<ActivityMapping> {
    const res = await fetch(`${API_BASE}/activity-mappings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse<ActivityMapping>(res);
}

export async function getAllMappings(page = 1, limit = 100): Promise<{ data: ActivityMapping[]; total: number }> {
    const res = await fetch(`${API_BASE}/activity-mappings?page=${page}&limit=${limit}`, {
        headers: authHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || 'Failed to fetch mappings');
    return { data: json.data || [], total: json.total || 0 };
}

export async function getMappingById(id: string): Promise<ActivityMapping> {
    const res = await fetch(`${API_BASE}/activity-mappings/${id}`, {
        headers: authHeaders(),
    });
    return handleResponse<ActivityMapping>(res);
}

export async function updateMapping(id: string, payload: Partial<ActivityMappingPayload>): Promise<ActivityMapping> {
    const res = await fetch(`${API_BASE}/activity-mappings/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse<ActivityMapping>(res);
}

export async function deleteMapping(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/activity-mappings/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as any).message || 'Failed to delete mapping');
    }
}
