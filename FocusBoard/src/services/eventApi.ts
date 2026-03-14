// Event API Service – talks to FocusBoard-backend /api/events

import { API_BASE_URL } from './apiBase';
import { enqueueEvent } from './eventQueue';
const API_BASE = API_BASE_URL;

// Default user id used for all events (no auth flow yet)
const DEFAULT_USER_ID = 'focusboard-user-1';

// ---------- Types ----------

/** Shape returned / accepted by the backend */
export interface BackendEvent {
    _id: string;
    title: string;
    category_id?: string | null;
    start_time: string;            // ISO string
    end_time?: string | null;      // ISO string
    priority: 1 | 2 | 3;
    event_type: 'FOCUS' | 'MEETING' | 'PERSONAL' | 'DEADLINE';
    is_recurring: boolean;
    label_color: string;
    description?: string | null;
    location?: string | null;
    attendees?: string[];
    calendar?: 'google' | 'icloud' | 'outlook';
    user_id: string;
    createdAt?: string;
    updatedAt?: string;
}

/** Frontend-friendly shape used by CalendarView */
export interface CalendarEventFE {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'FOCUS' | 'MEETING' | 'DEADLINE' | 'PERSONAL';
    event_type: 'FOCUS' | 'MEETING' | 'PERSONAL' | 'DEADLINE';
    priority: 1 | 2 | 3;
    is_recurring: boolean;
    label_color: string;
    category_id?: string | null;
    description?: string | null;
    location?: string | null;
    attendees?: string[];
    calendar?: 'google' | 'icloud' | 'outlook';
    user_id: string;
    platform?: 'google' | 'outlook' | 'apple';
}

/** Payload for creating a new event */
export interface CreateEventPayload {
    title: string;
    start_time: string;   // ISO
    end_time?: string;     // ISO
    priority?: 1 | 2 | 3;
    event_type?: 'FOCUS' | 'MEETING' | 'PERSONAL' | 'DEADLINE';
    is_recurring?: boolean;
    label_color?: string;
    category_id?: string | null;
    description?: string | null;
    location?: string | null;
    attendees?: string[];
    calendar?: 'google' | 'icloud' | 'outlook';
}

/** Payload for updating an event */
export interface UpdateEventPayload {
    title?: string;
    start_time?: string;
    end_time?: string;
    priority?: 1 | 2 | 3;
    event_type?: 'FOCUS' | 'MEETING' | 'PERSONAL' | 'DEADLINE';
    is_recurring?: boolean;
    label_color?: string;
    category_id?: string | null;
    description?: string | null;
    location?: string | null;
    attendees?: string[];
    calendar?: 'google' | 'icloud' | 'outlook';
}

// ---------- Helpers ----------

/** Convert backend event to frontend shape */
const toFrontend = (evt: BackendEvent): CalendarEventFE => {
    const start = new Date(evt.start_time);
    const end = evt.end_time ? new Date(evt.end_time) : new Date(start.getTime() + 60 * 60 * 1000);

    // Use event_type directly, fallback to mapping from priority for older events
    let type: CalendarEventFE['type'] = evt.event_type || 'FOCUS';
    if (!evt.event_type) {
        if (evt.priority === 1) type = 'DEADLINE';
        else if (evt.priority === 2) type = 'MEETING';
    }

    // Map calendar field to platform for UI theme colors
    const calendarToPlatform: Record<string, 'google' | 'outlook' | 'apple'> = {
        google: 'google',
        outlook: 'outlook',
        icloud: 'apple',
    };

    return {
        id: evt._id,
        title: evt.title,
        start,
        end,
        type,
        event_type: evt.event_type || 'FOCUS',
        priority: evt.priority,
        is_recurring: evt.is_recurring,
        label_color: evt.label_color,
        category_id: evt.category_id,
        description: evt.description,
        location: evt.location,
        attendees: evt.attendees || [],
        calendar: evt.calendar || 'google',
        user_id: evt.user_id,
        platform: calendarToPlatform[evt.calendar || 'google'] || 'google',
    };
};

// ---------- API Calls ----------

export async function fetchEvents(startDate?: Date, endDate?: Date): Promise<CalendarEventFE[]> {
    const params = new URLSearchParams({ user_id: DEFAULT_USER_ID, limit: '200' });
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());

    const res = await fetch(`${API_BASE}/events?${params}`);
    if (!res.ok) throw new Error('Failed to fetch events');
    const json = await res.json();
    return (json.data as BackendEvent[]).map(toFrontend);
}

export async function createEvent(payload: CreateEventPayload): Promise<CalendarEventFE> {
    const eventId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `evt-${Math.random().toString(36).slice(2,10)}${Date.now().toString(36)}`;
    const body = { ...payload, user_id: DEFAULT_USER_ID, event_id: eventId };

    try {
        const res = await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as any).message || 'Failed to create event');
        }
        const json = await res.json();
        return toFrontend(json.data);
    } catch (e) {
        // enqueue for later delivery and return optimistic local event
        try {
            enqueueEvent(body);
        } catch (err) {
            console.error('Failed to enqueue event', err);
        }

        const start = new Date(payload.start_time);
        const end = payload.end_time ? new Date(payload.end_time) : new Date(start.getTime() + 60 * 60 * 1000);
        return {
            id: eventId,
            title: payload.title,
            start,
            end,
            type: payload.event_type || 'FOCUS',
            event_type: payload.event_type || 'FOCUS',
            priority: payload.priority || 3,
            is_recurring: payload.is_recurring || false,
            label_color: payload.label_color || '#93c5fd',
            category_id: payload.category_id,
            description: payload.description,
            location: payload.location,
            attendees: payload.attendees || [],
            calendar: payload.calendar || 'google',
            user_id: DEFAULT_USER_ID,
            platform: 'google',
        };
    }
}

export async function updateEvent(id: string, payload: UpdateEventPayload): Promise<CalendarEventFE> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || 'Failed to update event');
    }
    const json = await res.json();
    return toFrontend(json.data);
}

export async function deleteEvent(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || 'Failed to delete event');
    }
}
