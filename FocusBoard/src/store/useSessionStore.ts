import { create } from 'zustand';
import { createActivity, updateActivity } from '../services/activityApi';
import { TauriActivity, SessionState } from '../types';

interface StartSessionPayload {
    label: string;
    plannedMinutes: number;
    categoryId?: string | null;
}

interface SessionStateStore {
    sessionState: SessionState;
    sessionLabel: string;
    plannedMinutes: number;
    startedAt: string | null;
    endsAt: string | null;
    elapsedSeconds: number;
    activeActivityId: string | null;
    currentActivity: TauriActivity | null;
    contextSwitches: number;
    lastActivitySignature: string | null;
    activeCategoryId: string | null;

    startSession: (payload: StartSessionPayload) => Promise<void>;
    pauseSession: () => Promise<void>;
    resumeSession: () => Promise<void>;
    stopSession: () => Promise<void>;
    setCurrentActivity: (event: TauriActivity) => void;
}

let timer: ReturnType<typeof setInterval> | null = null;

const clearTimer = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
};

const startTimer = (tick: () => void) => {
    clearTimer();
    timer = setInterval(tick, 1000);
};

export const useSessionStore = create<SessionStateStore>((set, get) => ({
    sessionState: 'IDLE',
    sessionLabel: '',
    plannedMinutes: 0,
    startedAt: null,
    endsAt: null,
    elapsedSeconds: 0,
    activeActivityId: null,
    currentActivity: null,
    contextSwitches: 0,
    lastActivitySignature: null,
    activeCategoryId: null,

    startSession: async ({ label, plannedMinutes, categoryId }) => {
        const now = new Date();
        let created: any = null;
        try {
            created = await createActivity({
                app_name: 'Manual Focus',
                window_title: label,
                start_time: now.toISOString(),
                end_time: null,
                category_id: categoryId ?? null,
            });
        } catch (error) {
            console.error('Failed to create focus activity:', error);
        }

        const plannedSeconds = Math.max(1, Math.floor(plannedMinutes * 60));
        const endsAt = new Date(now.getTime() + plannedSeconds * 1000).toISOString();

        set({
            sessionState: 'FOCUS',
            sessionLabel: label,
            plannedMinutes,
            startedAt: now.toISOString(),
            endsAt,
            elapsedSeconds: 0,
            activeActivityId: created?._id || null,
            contextSwitches: 0,
            activeCategoryId: categoryId ?? null,
        });

        startTimer(() => {
            const state = get();
            if (state.sessionState !== 'FOCUS') {
                clearTimer();
                return;
            }
            const nextElapsed = state.elapsedSeconds + 1;
            const totalSeconds = Math.max(1, Math.floor(state.plannedMinutes * 60));
            if (nextElapsed >= totalSeconds) {
                get().stopSession().catch((error) => {
                    console.error('Failed to stop session at timer end:', error);
                });
                return;
            }
            set({ elapsedSeconds: nextElapsed });
        });
    },

    pauseSession: async () => {
        const { activeActivityId } = get();
        if (activeActivityId) {
            try {
                await updateActivity(activeActivityId, { end_time: new Date().toISOString() });
            } catch (error) {
                console.error('Failed to update activity on pause:', error);
            }
        }
        clearTimer();
        set({
            sessionState: 'BREAK',
            activeActivityId: null,
            endsAt: null,
        });
    },

    resumeSession: async () => {
        const state = get();
        const remainingSeconds = Math.max(0, Math.floor(state.plannedMinutes * 60) - state.elapsedSeconds);
        if (remainingSeconds <= 0) {
            await state.stopSession();
            return;
        }

        const now = new Date();
        let created: any = null;
        try {
            created = await createActivity({
                app_name: 'Manual Focus',
                window_title: state.sessionLabel || 'Focus Session',
                start_time: now.toISOString(),
                end_time: null,
                category_id: state.activeCategoryId ?? null,
            });
        } catch (error) {
            console.error('Failed to create focus activity on resume:', error);
        }

        const endsAt = new Date(now.getTime() + remainingSeconds * 1000).toISOString();

        set({
            sessionState: 'FOCUS',
            startedAt: now.toISOString(),
            endsAt,
            activeActivityId: created?._id || null,
        });

        startTimer(() => {
            const current = get();
            if (current.sessionState !== 'FOCUS') {
                clearTimer();
                return;
            }
            const nextElapsed = current.elapsedSeconds + 1;
            if (nextElapsed >= Math.floor(current.plannedMinutes * 60)) {
                current.stopSession().catch((error) => {
                    console.error('Failed to stop resumed session at timer end:', error);
                });
                return;
            }
            set({ elapsedSeconds: nextElapsed });
        });
    },

    stopSession: async () => {
        const { activeActivityId } = get();
        if (activeActivityId) {
            try {
                await updateActivity(activeActivityId, { end_time: new Date().toISOString() });
            } catch (error) {
                console.error('Failed to update activity on stop:', error);
            }
        }
        clearTimer();
        set({
            sessionState: 'IDLE',
            sessionLabel: '',
            plannedMinutes: 0,
            startedAt: null,
            endsAt: null,
            elapsedSeconds: 0,
            activeActivityId: null,
            contextSwitches: 0,
            lastActivitySignature: null,
            activeCategoryId: null,
        });
    },

    setCurrentActivity: (event: TauriActivity) => {
        const state = get();
        const signature = `${event.app_name}::${event.window_title}`;
        const isIdle = event.app_name === 'Idle' || event.window_title === 'System Idle';
        let nextContextSwitches = state.contextSwitches;

        if (state.sessionState === 'FOCUS' && !isIdle) {
            if (state.lastActivitySignature && state.lastActivitySignature !== signature) {
                nextContextSwitches += 1;
            }
        }

        set({
            currentActivity: event,
            lastActivitySignature: signature,
            contextSwitches: nextContextSwitches,
        });
    },
}));
