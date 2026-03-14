import { useState, useEffect, useMemo } from 'react';
import { fetchDailyStats, Activity } from '../services/analyticsService';

interface DailySession {
  time: string;
  title: string;
  duration: string;
  type: 'FOCUS' | 'MEETING' | 'BREAK';
  tag: string;
}

interface DailyMetrics {
  focusTime: string;
  efficiency: number;
  sessions: number;
  meetings: string;
}

export const useDailyReport = (date?: Date) => {
  // Stabilize the date to avoid infinite re-render loops when callers pass `new Date()` each render
  const dateKey = date ? date.toDateString() : new Date().toDateString();
  const stableDate = useMemo(() => date || new Date(), [dateKey]);

  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [metrics, setMetrics] = useState<DailyMetrics>({
    focusTime: '0h 0m',
    efficiency: 0,
    sessions: 0,
    meetings: '0m',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const activities = await fetchDailyStats(stableDate);

        const sessionList: DailySession[] = activities
          .filter(a => !a.idle)
          .map(a => {
            const start = new Date(a.start_time);
            const end = new Date(a.end_time);
            const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

            return {
              time: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              title: a.window_title || a.app_name,
              duration: `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
              type: 'FOCUS' as const,
              tag: a.category_id?.name || 'Uncategorized',
            };
          });

        const totalMin = activities.reduce((sum, a) => {
          const duration = new Date(a.end_time).getTime() - new Date(a.start_time).getTime();
          return sum + duration / 60000;
        }, 0);

        setSessions(sessionList);
        setMetrics({
          focusTime: `${Math.floor(totalMin / 60)}h ${Math.round(totalMin % 60)}m`,
          efficiency: Math.min(100, Math.round((totalMin / 480) * 100)),
          sessions: sessionList.length,
          meetings: '0m',
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load daily report');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateKey]);

  return { sessions, metrics, loading, error };
};
