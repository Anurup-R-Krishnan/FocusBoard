import { API_BASE_URL } from './apiBase';

const API_BASE = API_BASE_URL;
const QUEUE_KEY = 'focusboard_event_queue_v2';
const CONSENT_KEY = 'focusboard_tracking_consent';
const MAX_ATTEMPTS = 5;
const BASE_RETRY_MS = 5000;
const MAX_RETRY_MS = 5 * 60 * 1000;

type QueuedEvent = Record<string, any> & {
  queued_at: string;
  attempts: number;
  next_retry_at?: string;
};

function hasQueueConsent(): boolean {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (value === null) return true;
    return value === 'true';
  } catch (e) {
    return true;
  }
}

export function setQueueConsent(enabled: boolean) {
  try {
    localStorage.setItem(CONSENT_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to persist queue consent', e);
  }
}

function loadQueue(): QueuedEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load event queue', e);
    return [];
  }
}

function saveQueue(q: QueuedEvent[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch (e) {
    console.error('Failed to save event queue', e);
  }
}

function generateId(): string {
  try {
    // modern browsers / Tauri should support crypto.randomUUID
    return (crypto as any).randomUUID();
  } catch (e) {
    return 'evt-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
}

export function enqueueEvent(evt: QueuedEvent) {
  if (!hasQueueConsent()) {
    console.warn('Queueing disabled by consent');
    return;
  }
  const q = loadQueue();
  q.push({
    ...evt,
    queued_at: new Date().toISOString(),
    attempts: Number.isFinite((evt as any).attempts) ? (evt as any).attempts : 0,
  });
  saveQueue(q);
  // Try flushing immediately
  void flushQueue();
}

export async function flushQueue() {
  if (typeof window !== 'undefined' && (window as any).navigator && !(window as any).navigator.onLine) {
    // offline — nothing to do
    return;
  }
  if (!hasQueueConsent()) {
    return;
  }
  const queue = loadQueue();
  if (!queue || queue.length === 0) return;
  const remaining: QueuedEvent[] = [];

  for (const evt of queue) {
    if (evt.next_retry_at && new Date(evt.next_retry_at).getTime() > Date.now()) {
      remaining.push(evt);
      continue;
    }
    try {
      const res = await fetch(`${API_BASE}/events/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt),
      });
      if (res.ok) {
        // success — drop
        continue;
      }
      // Client error -> drop, Server error -> keep
      if (res.status >= 400 && res.status < 500) {
        console.warn('Dropping event due to client error', res.status);
        continue;
      }
      const attempts = (evt.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        console.warn('Dropping event after max attempts');
        continue;
      }
      const backoff = Math.min(BASE_RETRY_MS * Math.pow(2, attempts - 1), MAX_RETRY_MS);
      const jitter = backoff * (0.8 + Math.random() * 0.4);
      remaining.push({
        ...evt,
        attempts,
        next_retry_at: new Date(Date.now() + jitter).toISOString(),
      });
    } catch (e) {
      // network error — keep for retry
      const attempts = (evt.attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        console.warn('Dropping event after max attempts');
        continue;
      }
      const backoff = Math.min(BASE_RETRY_MS * Math.pow(2, attempts - 1), MAX_RETRY_MS);
      const jitter = backoff * (0.8 + Math.random() * 0.4);
      remaining.push({
        ...evt,
        attempts,
        next_retry_at: new Date(Date.now() + jitter).toISOString(),
      });
    }
  }

  saveQueue(remaining);
}

export function startQueue(intervalMs = 15_000) {
  // periodic flush
  setInterval(() => {
    void flushQueue();
  }, intervalMs);

  if (typeof window !== 'undefined' && (window as any).addEventListener) {
    window.addEventListener('online', () => {
      void flushQueue();
    });
  }
}

// autostart when module loads
startQueue();
