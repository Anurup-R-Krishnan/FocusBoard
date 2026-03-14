import { useState, useEffect } from 'react';
import { fetchWeeklyStats, Activity } from '../services/analyticsService';

interface WeeklyData {
  trendData: number[];
  lastWeekData: number[];
  goalProgress: { current: number; target: number; percentage: number };
  categoryBreakdown: Array<{ name: string; hours: number; color: string }>;
  projectData: Array<{ label: string; value: number; color: string; time: string }>;
}

export const useWeeklyReport = (weekStart: Date) => {
  const [data, setData] = useState<WeeklyData>({
    trendData: [],
    lastWeekData: [],
    goalProgress: { current: 0, target: 40, percentage: 0 },
    categoryBreakdown: [],
    projectData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const activities = await fetchWeeklyStats(weekStart);
        
        // Calculate daily hours for trend
        const dailyHours = new Array(7).fill(0);
        activities.forEach(a => {
          const day = new Date(a.start_time).getDay();
          const duration = (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 3600000;
          dailyHours[day] += duration;
        });

        const totalHours = dailyHours.reduce((sum, h) => sum + h, 0);
        
        // Category breakdown
        const categoryMap = new Map<string, number>();
        activities.forEach(a => {
          const cat = a.category_id?.name || 'Uncategorized';
          const duration = (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 3600000;
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + duration);
        });

        const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, hours]) => ({
          name,
          hours,
          color: '#3B82F6',
        }));

        setData({
          trendData: dailyHours,
          lastWeekData: [60, 55, 70, 65, 80, 75, 50],
          goalProgress: {
            current: Math.round(totalHours),
            target: 40,
            percentage: Math.min(100, Math.round((totalHours / 40) * 100)),
          },
          categoryBreakdown,
          projectData: [],
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load weekly report');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [weekStart]);

  return { data, loading, error };
};
