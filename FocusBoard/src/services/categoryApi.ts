// Category API Service – talks to FocusBoard-backend /api/categories

import { API_BASE_URL } from './apiBase';
import { authHeaders } from './authApi';
const API_BASE = API_BASE_URL;

export interface Category {
    _id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    productivityScore?: number;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CategoryPayload {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    productivityScore?: number;
    isDefault?: boolean;
}

async function handleResponse<T>(res: Response): Promise<T> {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || `HTTP ${res.status}`);
    return (json as any).data as T;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse<Category>(res);
}

export async function getAllCategories(page = 1, limit = 100): Promise<{ data: Category[]; total: number }> {
    const res = await fetch(`${API_BASE}/categories?page=${page}&limit=${limit}`, {
        headers: authHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as any).message || 'Failed to fetch categories');
    return { data: json.data || [], total: json.total || 0 };
}

export async function updateCategory(id: string, payload: Partial<CategoryPayload>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse<Category>(res);
}

export async function deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as any).message || 'Failed to delete category');
    }
}
