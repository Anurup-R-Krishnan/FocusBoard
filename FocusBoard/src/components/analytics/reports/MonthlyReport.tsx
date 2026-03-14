
import React, { useMemo } from 'react';
import { CalendarDays, Clock, Zap, Layers } from 'lucide-react';
import ActivityHeatmap from '../ActivityHeatmap';
import StatCard from '../shared/StatCard';
import { useMonthlyReport } from '../../../hooks/useMonthlyReport';
import Skeleton from '../../shared/Skeleton';

const MonthlyReport = () => {
    const reportDate = useMemo(() => new Date(), []);
    const { data, loading } = useMonthlyReport(reportDate);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 h-96">
                    <Skeleton className="h-full w-full" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-4 h-24">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-4 h-24">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-4 h-24">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-4 h-24">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 h-96 relative">
                <div className="absolute top-6 right-6 z-10 hidden sm:block">
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium bg-neutral-900/80 backdrop-blur-sm p-1.5 rounded-lg border border-white/5">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-[2px] bg-neutral-800" />
                            <div className="w-2 h-2 rounded-[2px] bg-accent-blue/20" />
                            <div className="w-2 h-2 rounded-[2px] bg-accent-blue/50" />
                            <div className="w-2 h-2 rounded-[2px] bg-accent-blue" />
                        </div>
                        <span>More</span>
                    </div>
                </div>
                <ActivityHeatmap heatmapData={data.heatmapData} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Month Total" value={`${data.totalHours}h`} icon={CalendarDays} />
                <StatCard label="Daily Avg" value={`${data.dailyAvg}h`} icon={Clock} />
                <StatCard label="Best Day" value={data.bestDay} sub={`${data.bestDayHours.toFixed(1)}h`} icon={Zap} color="text-yellow-400" />
                <StatCard label="Projects" value={data.projectCount.toString()} icon={Layers} />
            </div>
        </div>
    );
};

export default MonthlyReport;
