import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from './useDashboardStore';

// Mock the API services
vi.mock('../services/metricsApi', () => ({
  metricsApi: {
    getDashboardMetrics: vi.fn(),
    getTimeline: vi.fn()
  }
}));

vi.mock('../services/taskApi', () => ({
  taskApi: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn()
  }
}));

vi.mock('../services/teamApi', () => ({
  teamApi: {
    getSquad: vi.fn(),
    triggerNudge: vi.fn()
  }
}));

vi.mock('../services/activityApi', () => ({
  fetchRecentActivities: vi.fn()
}));

vi.mock('../services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(() => vi.fn()),
    emit: vi.fn()
  }
}));

describe('useDashboardStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useDashboardStore.setState({
      metrics: {
        deepWorkMinutes: 0,
        contextSwitches: 0,
        score: 0,
        focusScore: 0,
        meetingsCount: 0,
        weeklyTrend: [],
        lastWeekTrend: [],
        deepWorkTrend: [],
        contextSwitchesTrend: []
      },
      timeline: [],
      tasks: [],
      squad: [],
      liveActivities: [],
      isLoading: false,
      error: null,
      rawMetrics: null
    });
  });

  it('has correct initial state', () => {
    const state = useDashboardStore.getState();
    
    expect(state.metrics.deepWorkMinutes).toBe(0);
    expect(state.metrics.score).toBe(0);
    expect(state.timeline).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('addLiveActivity adds activity to liveActivities array', () => {
    const activity = {
      id: '1',
      app_name: 'VS Code',
      window_title: 'coding',
      start_time: new Date().toISOString()
    };
    
    useDashboardStore.getState().addLiveActivity(activity as any);
    
    const state = useDashboardStore.getState();
    expect(state.liveActivities).toHaveLength(1);
    expect(state.liveActivities[0].app_name).toBe('VS Code');
  });

  it('setActiveTask updates active task', () => {
    useDashboardStore.setState({
      tasks: [
        { id: '1', title: 'Task 1', isActive: false },
        { id: '2', title: 'Task 2', isActive: false }
      ]
    });
    
    useDashboardStore.getState().setActiveTask('1');
    
    const state = useDashboardStore.getState();
    expect(state.tasks[0].isActive).toBe(true);
    expect(state.tasks[1].isActive).toBe(false);
  });

  it('moveTask changes task status', () => {
    useDashboardStore.setState({
      tasks: [{ id: '1', title: 'Task 1', status: 'todo' }]
    });
    
    useDashboardStore.getState().moveTask('1', 'in-progress');
    
    const state = useDashboardStore.getState();
    expect(state.tasks[0].status).toBe('in-progress');
  });

  it('toggleTaskBillable toggles billable flag', () => {
    useDashboardStore.setState({
      tasks: [{ id: '1', title: 'Task 1', billable: false }]
    });
    
    useDashboardStore.getState().toggleTaskBillable('1');
    
    const state = useDashboardStore.getState();
    expect(state.tasks[0].billable).toBe(true);
    
    // Toggle again
    useDashboardStore.getState().toggleTaskBillable('1');
    expect(useDashboardStore.getState().tasks[0].billable).toBe(false);
  });

  it('toggleTaskArchived toggles archived flag', () => {
    useDashboardStore.setState({
      tasks: [{ id: '1', title: 'Task 1', archived: false }]
    });
    
    useDashboardStore.getState().toggleTaskArchived('1');
    
    const state = useDashboardStore.getState();
    expect(state.tasks[0].archived).toBe(true);
  });

  it('renameProject updates project names in tasks', () => {
    useDashboardStore.setState({
      tasks: [
        { id: '1', title: 'Task 1', project: 'OldProject' },
        { id: '2', title: 'Task 2', project: 'OldProject' },
        { id: '3', title: 'Task 3', project: 'OtherProject' }
      ]
    });
    
    useDashboardStore.getState().renameProject('OldProject', 'NewProject');
    
    const state = useDashboardStore.getState();
    expect(state.tasks[0].project).toBe('NewProject');
    expect(state.tasks[1].project).toBe('NewProject');
    expect(state.tasks[2].project).toBe('OtherProject');
  });

  it('renameClient updates client names in tasks', () => {
    useDashboardStore.setState({
      tasks: [
        { id: '1', title: 'Task 1', client: 'OldClient' },
        { id: '2', title: 'Task 2', client: 'OldClient' }
      ]
    });
    
    useDashboardStore.getState().renameClient('OldClient', 'NewClient');
    
    const state = useDashboardStore.getState();
    expect(state.tasks[0].client).toBe('NewClient');
    expect(state.tasks[1].client).toBe('NewClient');
  });
});
