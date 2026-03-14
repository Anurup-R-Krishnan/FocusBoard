import { useState, useEffect } from 'react';
import { fetchMonthlyStats } from '../services/analyticsService';

interface MonthlyData {
  heatmapData: number[][];
  totalHours: number;
  dailyAvg: number;
  bestDay: string;
  bestDayHours: number;
  projectCount: number;
}

export const useMonthlyReport = (month: Date) => {
  const [data, setData] = useState<MonthlyData>({
    heatmapData: [],
    totalHours: 0,
    dailyAvg: 0,
    bestDay: '',
    bestDayHours: 0,
    projectCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const activities = await fetchMonthlyStats(month);
        
        // Calculate daily hours
        const dailyMap = new Map<string, number>();
        activities.forEach(a => {
          const day = new Date(a.start_time).toISOString().split('T')[0];
          const duration = (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 3600000;
          dailyMap.set(day, (dailyMap.get(day) || 0) + duration);
        });

        const totalHours = Array.from(dailyMap.values()).reduce((sum, h) => sum + h, 0);
        const daysWithData = dailyMap.size;
        
        // Find best day
        let bestDay = '';
        let bestDayHours = 0;
        dailyMap.forEach((hours, day) => {
          if (hours > bestDayHours) {
            bestDayHours = hours;
            bestDay = day;
          }
        });

        const heatmapData = Array(5).fill(0).map(() => Array(10).fill(0));
        activities.forEach((activity) => {
          const start = new Date(activity.start_time);
          const end = activity.end_time ? new Date(activity.end_time) : start;
          const durationHours = Math.max(0, (end.getTime() - start.getTime()) / 3600000);

          const day = start.getDay();
          if (day === 0 || day === 6) return;

          const hour = start.getHours();
          if (hour < 9 || hour > 18) return;

          const row = day - 1;
          const col = hour - 9;
          const bucket = durationHours >= 1.2 ? 3 : durationHours >= 0.6 ? 2 : durationHours > 0 ? 1 : 0;

          heatmapData[row][col] = Math.max(heatmapData[row][col], bucket);
        });
        
        setData({
          heatmapData,
          totalHours: Math.round(totalHours),
          dailyAvg: daysWithData > 0 ? parseFloat((totalHours / daysWithData).toFixed(1)) : 0,
          bestDay: bestDay ? new Date(bestDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          bestDayHours,
          projectCount: 0,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load monthly report');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [month]);

  return { data, loading, error };
};
