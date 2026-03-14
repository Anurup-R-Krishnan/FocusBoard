import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDailyReport } from './useDailyReport';

// Mock the analytics service
vi.mock('../services/analyticsService', () => ({
  fetchDailyStats: vi.fn()
}));

import { fetchDailyStats } from '../services/analyticsService';

describe('useDailyReport', () => {
  const mockActivities = [
    {
      id: '1',
      app_name: 'VS Code',
      window_title: 'coding project',
      start_time: new Date('2024-01-15T09:00:00').toISOString(),
      end_time: new Date('2024-01-15T09:30:00').toISOString(),
      category_id: { name: 'Work' },
      idle: false
    },
    {
      id: '2',
      app_name: 'Chrome',
      window_title: 'documentation',
      start_time: new Date('2024-01-15T10:00:00').toISOString(),
      end_time: new Date('2024-01-15T10:45:00').toISOString(),
      category_id: { name: 'Research' },
      idle: false
    },
    {
      id: '3',
      app_name: 'Slack',
      window_title: 'team chat',
      start_time: new Date('2024-01-15T11:00:00').toISOString(),
      end_time: new Date('2024-01-15T11:15:00').toISOString(),
      category_id: { name: 'Communication' },
      idle: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading state', async () => {
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    
    const { result } = renderHook(() => useDailyReport());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.sessions).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetches and transforms activities into sessions', async () => {
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockActivities);
    
    const { result } = renderHook(() => useDailyReport(new Date('2024-01-15')));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.sessions).toHaveLength(3);
    expect(result.current.sessions[0].title).toBe('coding project');
    expect(result.current.sessions[0].type).toBe('FOCUS');
    expect(result.current.sessions[0].tag).toBe('Work');
  });

  it('calculates total focus time correctly', async () => {
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockActivities);
    
    const { result } = renderHook(() => useDailyReport(new Date('2024-01-15')));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Total: 30min + 45min + 15min = 90min = 1h 30m
    expect(result.current.metrics.focusTime).toBe('1h 30m');
  });

  it('filters out idle activities', async () => {
    const activitiesWithIdle = [
      ...mockActivities,
      {
        id: '4',
        app_name: 'Idle',
        window_title: 'idle',
        start_time: new Date('2024-01-15T12:00:00').toISOString(),
        end_time: new Date('2024-01-15T12:30:00').toISOString(),
        category_id: null,
        idle: true
      }
    ];
    
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(activitiesWithIdle);
    
    const { result } = renderHook(() => useDailyReport());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Idle activity should be filtered out
    expect(result.current.sessions).toHaveLength(3);
  });

  it('handles API errors gracefully', async () => {
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useDailyReport());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Should not throw, just log error and keep default state
    expect(result.current.sessions).toEqual([]);
    expect(result.current.metrics.focusTime).toBe('0h 0m');
  });

  it('calculates efficiency based on 8-hour workday', async () => {
    // 4 hours of activity = 50% efficiency
    const fourHoursActivity = [
      {
        id: '1',
        app_name: 'VS Code',
        window_title: 'coding',
        start_time: new Date('2024-01-15T09:00:00').toISOString(),
        end_time: new Date('2024-01-15T13:00:00').toISOString(),
        category_id: { name: 'Work' },
        idle: false
      }
    ];
    
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(fourHoursActivity);
    
    const { result } = renderHook(() => useDailyReport());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // 240min / 480min * 100 = 50%
    expect(result.current.metrics.efficiency).toBe(50);
  });

  it('caps efficiency at 100%', async () => {
    // 10 hours of activity should still show 100%
    const tenHoursActivity = [
      {
        id: '1',
        app_name: 'VS Code',
        window_title: 'coding',
        start_time: new Date('2024-01-15T08:00:00').toISOString(),
        end_time: new Date('2024-01-15T18:00:00').toISOString(),
        category_id: { name: 'Work' },
        idle: false
      }
    ];
    
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(tenHoursActivity);
    
    const { result } = renderHook(() => useDailyReport());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.metrics.efficiency).toBe(100);
  });

  it('counts sessions correctly', async () => {
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockActivities);
    
    const { result } = renderHook(() => useDailyReport());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.metrics.sessions).toBe(3);
  });

  it('uses current date when no date provided', async () => {
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    
    const { result } = renderHook(() => useDailyReport());

    await waitFor(() => {
      expect(fetchDailyStats).toHaveBeenCalledWith(expect.any(Date));
      expect(result.current.loading).toBe(false);
    });
  });

  it('formats session time correctly', async () => {
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockActivities);
    
    const { result } = renderHook(() => useDailyReport(new Date('2024-01-15')));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Check time formatting (09:00, 10:00, 11:00)
    expect(result.current.sessions[0].time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('formats session duration correctly', async () => {
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockActivities);
    
    const { result } = renderHook(() => useDailyReport());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // First session: 30min = 0h 30m
    expect(result.current.sessions[0].duration).toBe('0h 30m');
    // Second session: 45min = 0h 45m
    expect(result.current.sessions[1].duration).toBe('0h 45m');
  });

  it('uses app_name when window_title is empty', async () => {
    const activityWithoutTitle = [
      {
        id: '1',
        app_name: 'Terminal',
        window_title: '',
        start_time: new Date('2024-01-15T09:00:00').toISOString(),
        end_time: new Date('2024-01-15T09:30:00').toISOString(),
        category_id: { name: 'DevOps' },
        idle: false
      }
    ];
    
    (fetchDailyStats as ReturnType<typeof vi.fn>).mockResolvedValue(activityWithoutTitle);
    
    const { result } = renderHook(() => useDailyReport());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.sessions[0].title).toBe('Terminal');
  });
});
