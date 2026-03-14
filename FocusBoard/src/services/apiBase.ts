const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const rawBase =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  (isTauri ? 'http://localhost:5000/api' : '/api');

export const API_BASE_URL = rawBase.endsWith('/api')
  ? rawBase
  : `${rawBase.replace(/\/$/, '')}/api`;

export const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
