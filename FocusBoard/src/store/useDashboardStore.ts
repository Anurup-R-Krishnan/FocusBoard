import { create } from 'zustand';
import { metricsApi, DashboardMetrics } from '../services/metricsApi';
import { taskApi } from '../services/taskApi';
import { teamApi } from '../services/teamApi';
import { socketService } from '../services/socketService';
import { fetchRecentActivities, BackendActivity } from '../services/activityApi';
import { SquadMember } from '../types';

let socketsInitialized = false;
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let unsubscribeHandlers: Array<() => void> = [];

const normalizeTaskStatusForApi = (status: string) => {
    if (status === 'in-progress') return 'IN_PROGRESS';
    if (status === 'todo') return 'TODO';
    if (status === 'done') return 'DONE';
    return status;
};

const getTaskPrimaryId = (task: any) => task?._id || task?.id;

interface DashboardState {
    metrics: any;
    timeline: any[];
    tasks: any[];
    squad: SquadMember[];
    liveActivities: BackendActivity[];
    isLoading: boolean;
    error: string | null;
    rawMetrics: DashboardMetrics | null;

    // Actions
    fetchAll: () => Promise<void>;
    initSockets: () => void;
    stopSockets: () => void;
    addLiveActivity: (activity: BackendActivity) => void;

    // Task Controls
    createTask: (task: any) => Promise<void>;
    updateTask: (id: string, task: any) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    // Misc controls from useRealDashboardData
    triggerNudge: (id: string) => Promise<void>;
    setActiveTask: (id: string) => void;
    moveTask: (id: string, status: string) => void;
    toggleTaskBillable: (id: string) => void;
    toggleTaskArchived: (id: string) => void;
    renameProject: (oldName: string, newName: string) => void;
    renameClient: (oldName: string, newName: string) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    metrics: {
        deepWorkMinutes: 0, contextSwitches: 0, score: 0, focusScore: 0, meetingsCount: 0,
        weeklyTrend: [], lastWeekTrend: [], deepWorkTrend: [], contextSwitchesTrend: []
    },
    timeline: [],
    tasks: [],
    squad: [],
    liveActivities: [],
    isLoading: true,
    error: null,
    rawMetrics: null,

    // Main fetcher
    fetchAll: async () => {
        set({ isLoading: true });
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const [m, t, ts, sq] = await Promise.all([
                metricsApi.getDashboardMetrics(),
                metricsApi.getTimeline(today.toISOString(), tomorrow.toISOString()),
                taskApi.getTasks(),
                teamApi.getSquad()
            ]);

            const mappedTasks = ts.map((task: any) => ({ ...task, id: task._id }));
            const mappedTimeline = t.map((block: any) => {
                const startDate = new Date(block.startTime);
                const endDate = new Date(block.endTime);
                const normalizedType = block.type === 'focus' ? 'FOCUS' : 'DISTRACTED';
                return {
                    ...block,
                    start: startDate.getHours() * 60 + startDate.getMinutes(),
                    end: endDate.getHours() * 60 + endDate.getMinutes(),
                    type: normalizedType,
                    userTitle: block.title || block.app_name || block.window_title || normalizedType,
                    tags: block.category ? [block.category] : [],
                };
            });

            const formattedMetrics = m ? {
                deepWorkMinutes: m.deepWorkMinutes,
                contextSwitches: Math.floor(m.distractedMinutes / 5),
                score: m.focusScore,
                focusScore: m.focusScore,
                meetingsCount: 0,
                weeklyTrend: [60, 75, 40, 80, m.focusScore, 0, 0],
                lastWeekTrend: [50, 60, 55, 70, 65, 40, 30],
                deepWorkTrend: [120, 150, 90, 180, m.deepWorkMinutes, 0, 0],
                contextSwitchesTrend: [10, 8, 15, 6, Math.floor(m.distractedMinutes / 5), 0, 0]
            } : get().metrics;

            set({
                rawMetrics: m,
                metrics: formattedMetrics,
                timeline: mappedTimeline,
                tasks: mappedTasks,
                squad: sq,
                error: null,
            });
        } catch (err: any) {
            set({ error: err.message || 'Failed to fetch dashboard data' });
        } finally {
            set({ isLoading: false });
        }
    },

    addLiveActivity: (activity: BackendActivity) => {
        set(state => ({
            liveActivities: [activity, ...state.liveActivities].slice(0, 30),
        }));
    },

    // Socket Initialization
    initSockets: () => {
        if (socketsInitialized) return;

        socketsInitialized = true;
        socketService.connect();
        get().fetchAll();

        // Seed live activity feed with recent activities
        fetchRecentActivities(15).then(activities => {
            set({ liveActivities: activities });
        }).catch((error: any) => {
            set({ error: error?.message || 'Failed to fetch recent activities' });
        });

        unsubscribeHandlers = [
            socketService.subscribe('tasks', () => {
                get().fetchAll();
            }),
            socketService.subscribe('projects', () => {
                get().fetchAll();
            }),
            socketService.subscribe('activity', (activity: BackendActivity) => {
                get().addLiveActivity(activity);
            }),
        ];

        // Polling loop as a fallback
        pollingInterval = setInterval(() => {
            get().fetchAll();
        }, 30000);
    },
    stopSockets: () => {
        if (!socketsInitialized) return;

        socketsInitialized = false;
        unsubscribeHandlers.forEach((unsubscribe) => unsubscribe());
        unsubscribeHandlers = [];

        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }

        socketService.disconnect();
    },

    // Task Controls
    createTask: async (task: any) => {
        await taskApi.createTask(task);
        await get().fetchAll();
    },
    updateTask: async (id: string, task: any) => {
        await taskApi.updateTask(id, task);
        await get().fetchAll();
    },
    deleteTask: async (id: string) => {
        await taskApi.deleteTask(id);
        await get().fetchAll();
    },

    // Other Controls
    triggerNudge: async (id: string) => {
        await teamApi.nudgeMember(id);
    },
    setActiveTask: (id: string) => {
        const previousTasks = get().tasks;
        const nextTasks = previousTasks.map((task: any) => ({
            ...task,
            isActive: (task.id || task._id) === id,
        }));

        set({ tasks: nextTasks });

        const targetTask = nextTasks.find((task: any) => (task.id || task._id) === id);
        const targetTaskId = getTaskPrimaryId(targetTask);
        if (!targetTaskId) {
            return;
        }

        Promise.resolve(taskApi.updateTask(targetTaskId, { isActive: true } as any)).catch((error: any) => {
            set({
                tasks: previousTasks,
                error: error?.message || 'Failed to set active task',
            });
        });
    },
    moveTask: (id: string, status: string) => {
        const previousTasks = get().tasks;
        const nextTasks = previousTasks.map((task: any) => (
            (task.id || task._id) === id
                ? { ...task, status }
                : task
        ));

        set({ tasks: nextTasks });

        const targetTask = nextTasks.find((task: any) => (task.id || task._id) === id);
        const targetTaskId = getTaskPrimaryId(targetTask);
        if (!targetTaskId) {
            return;
        }

        Promise.resolve(taskApi.updateTask(targetTaskId, {
            status: normalizeTaskStatusForApi(status),
        } as any)).catch((error: any) => {
            set({
                tasks: previousTasks,
                error: error?.message || 'Failed to move task',
            });
        });
    },
    toggleTaskBillable: (id: string) => {
        const previousTasks = get().tasks;
        const nextTasks = previousTasks.map((task: any) => (
            (task.id || task._id) === id
                ? { ...task, billable: !task.billable }
                : task
        ));

        set({ tasks: nextTasks });

        const targetTask = nextTasks.find((task: any) => (task.id || task._id) === id);
        const targetTaskId = getTaskPrimaryId(targetTask);
        if (!targetTaskId) {
            return;
        }

        Promise.resolve(taskApi.updateTask(targetTaskId, {
            billable: Boolean(targetTask.billable),
        })).catch((error: any) => {
            set({
                tasks: previousTasks,
                error: error?.message || 'Failed to update billable state',
            });
        });
    },
    toggleTaskArchived: (id: string) => {
        const previousTasks = get().tasks;
        const nextTasks = previousTasks.map((task: any) => (
            (task.id || task._id) === id
                ? { ...task, archived: !task.archived }
                : task
        ));

        set({ tasks: nextTasks });

        const targetTask = nextTasks.find((task: any) => (task.id || task._id) === id);
        const targetTaskId = getTaskPrimaryId(targetTask);
        if (!targetTaskId) {
            return;
        }

        Promise.resolve(taskApi.updateTask(targetTaskId, {
            archived: Boolean(targetTask.archived),
        })).catch((error: any) => {
            set({
                tasks: previousTasks,
                error: error?.message || 'Failed to update archived state',
            });
        });
    },
    renameProject: (oldName: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed || oldName === trimmed) {
            return;
        }

        const previousTasks = get().tasks;
        const nextTasks = previousTasks.map((task: any) => (
            task.project === oldName
                ? { ...task, project: trimmed }
                : task
        ));

        set({ tasks: nextTasks });

        const updatedTasks = nextTasks.filter((task: any) => task.project === trimmed && previousTasks.some((prev: any) => (prev.id || prev._id) === (task.id || task._id) && prev.project === oldName));

        Promise.all(
            updatedTasks
                .map((task: any) => {
                    const taskId = getTaskPrimaryId(task);
                    if (!taskId) return Promise.resolve();
                    return taskApi.updateTask(taskId, { project: trimmed });
                })
        ).catch((error: any) => {
            set({
                tasks: previousTasks,
                error: error?.message || 'Failed to rename project',
            });
        });
    },
    renameClient: (oldName: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed || oldName === trimmed) {
            return;
        }

        const previousTasks = get().tasks;
        const nextTasks = previousTasks.map((task: any) => (
            task.client === oldName
                ? { ...task, client: trimmed }
                : task
        ));

        set({ tasks: nextTasks });

        const updatedTasks = nextTasks.filter((task: any) => task.client === trimmed && previousTasks.some((prev: any) => (prev.id || prev._id) === (task.id || task._id) && prev.client === oldName));

        Promise.all(
            updatedTasks
                .map((task: any) => {
                    const taskId = getTaskPrimaryId(task);
                    if (!taskId) return Promise.resolve();
                    return taskApi.updateTask(taskId, { client: trimmed });
                })
        ).catch((error: any) => {
            set({
                tasks: previousTasks,
                error: error?.message || 'Failed to rename client',
            });
        });
    }
}));
