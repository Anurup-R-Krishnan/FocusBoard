// Activity API Service – talks to FocusBoard-backend /api/activities
import { API_BASE_URL } from './apiBase';
import { authHeaders } from './authApi';
const API_BASE = API_BASE_URL;

export interface BackendActivity {
    _id?: string;
    app_name: string;
    window_title?: string;
    url?: string;
    start_time: string; // ISO
    end_time?: string | null; // ISO
    category_id?: string | null;
    color?: string;
    idle?: number;
    createdAt?: string;
}

export async function handleResponse(res: Response, context: string = 'API Error'): Promise<any> {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || context);
    return json;
}

export async function createActivity(payload: BackendActivity): Promise<BackendActivity> {
    const res = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const json = await handleResponse(res, 'Failed to create activity');
    return json.data ?? json;
}

export async function getActivityById(id: string): Promise<BackendActivity> {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
        headers: authHeaders(),
    });
    const json = await handleResponse(res, 'Activity not found');
    return json.data ?? json;
}

export async function updateActivity(id: string, payload: Partial<BackendActivity>): Promise<BackendActivity> {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const json = await handleResponse(res, 'Failed to update activity');
    return json.data ?? json;
}

export async function deleteActivity(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    await handleResponse(res, 'Failed to delete activity');
}

export async function fetchActivities(startDate?: Date, endDate?: Date, page = 1, limit = 100): Promise<{ data: BackendActivity[]; total: number }> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());
    params.set('page', String(page));
    params.set('limit', String(limit));

    const res = await fetch(`${API_BASE}/activities?${params}`, {
        headers: authHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || 'Failed to fetch activities');
    return { data: json.data || [], total: json.total || 0 };
}

export async function fetchRecentActivities(limit = 15): Promise<BackendActivity[]> {
    const res = await fetch(`${API_BASE}/activities/recent?limit=${limit}`, {
        headers: authHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || 'Failed to fetch recent activities');
    return json.data || [];
}

export async function createActivitiesBatch(activities: BackendActivity[]): Promise<BackendActivity[]> {
    const res = await fetch(`${API_BASE}/activities/batch`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(activities),
    });
    const json = await handleResponse(res, 'Failed to create batch activities');
    return json.data || [];
}

export async function importActivities(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('focusboard_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/activities/import`, {
        method: 'POST',
        headers,
        body: formData,
    });
    const json = await handleResponse(res, 'Failed to import activities');
    return json.data || { imported: 0, errors: [] };
}

export async function exportActivities(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const res = await fetch(`${API_BASE}/activities/export?format=${format}`, {
        headers: authHeaders(),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as any).message || 'Failed to export activities');
    }
    return await res.blob();
}

export async function bulkDeleteActivities(ids: string[]): Promise<{ deletedCount: number }> {
    const res = await fetch(`${API_BASE}/activities`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({ ids }),
    });
    const json = await handleResponse(res, 'Failed to bulk delete activities');
    return json.data || { deletedCount: 0 };
}
