import { useState, useEffect } from 'react';
import { fetchActivities } from '../services/analyticsService';

interface ComparisonData {
  periodA: { focusScore: number; deepWorkHours: number; label: string };
  periodB: { focusScore: number; deepWorkHours: number; label: string };
  focusScoreChange: number;
  deepWorkChange: number;
}

export const useComparisonData = (periodA: { start: Date; end: Date; label: string }, periodB: { start: Date; end: Date; label: string }) => {
  const [data, setData] = useState<ComparisonData>({
    periodA: { focusScore: 0, deepWorkHours: 0, label: periodA.label },
    periodB: { focusScore: 0, deepWorkHours: 0, label: periodB.label },
    focusScoreChange: 0,
    deepWorkChange: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [activitiesA, activitiesB] = await Promise.all([
          fetchActivities(periodA.start, periodA.end),
          fetchActivities(periodB.start, periodB.end),
        ]);

        const calcMetrics = (activities: any[]) => {
          const totalHours = activities.reduce((sum, a) => {
            const duration = (new Date(a.end_time).getTime() - new Date(a.start_time).getTime()) / 3600000;
            return sum + duration;
          }, 0);
          const focusScore = Math.min(100, Math.round(totalHours * 3.5));
          return { focusScore, deepWorkHours: Math.round(totalHours) };
        };

        const metricsA = calcMetrics(activitiesA);
        const metricsB = calcMetrics(activitiesB);

        setData({
          periodA: { ...metricsA, label: periodA.label },
          periodB: { ...metricsB, label: periodB.label },
          focusScoreChange: metricsB.focusScore > 0 ? Math.round(((metricsA.focusScore - metricsB.focusScore) / metricsB.focusScore) * 100) : 0,
          deepWorkChange: metricsB.deepWorkHours > 0 ? Math.round(((metricsA.deepWorkHours - metricsB.deepWorkHours) / metricsB.deepWorkHours) * 100) : 0,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [periodA.start, periodA.end, periodA.label, periodB.start, periodB.end, periodB.label]);

  return { data, loading, error };
};
