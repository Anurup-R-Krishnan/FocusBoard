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
