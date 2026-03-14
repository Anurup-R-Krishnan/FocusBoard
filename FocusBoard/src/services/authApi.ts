// Auth API Service – talks to FocusBoard-backend /api/auth

import { API_BASE_URL } from './apiBase';
const API_BASE = API_BASE_URL;
const TOKEN_KEY = 'focusboard_token';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserData {
    id: string;
    firstName: string;
    lastName: string;
    email_id: string;
    timezone: string;
    phone: string;
    bio: string;
}

export interface UpdateUserPayload {
    firstName?: string;
    lastName?: string;
    email_id?: string;
    timezone?: string;
    phone?: string;
    bio?: string;
}

// ── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function authHeaders(): Record<string, string> {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function registerUser(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
): Promise<UserData> {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || firstName || lastName;
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email_id: email, password }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed.');

    setToken(json.data.token);
    return json.data.user as UserData;
}

export async function loginUser(email: string, password: string): Promise<UserData> {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_id: email, password }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed.');

    setToken(json.data.token);
    return json.data.user as UserData;
}

export async function fetchCurrentUser(): Promise<UserData> {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: authHeaders(),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch user.');
    return json.data as UserData;
}

export async function updateCurrentUser(data: UpdateUserPayload): Promise<UserData> {
    const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update profile.');
    return json.data as UserData;
}

export function logoutUser(): void {
    localStorage.removeItem(TOKEN_KEY);
}
