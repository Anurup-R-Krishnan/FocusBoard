
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import TrendAnalysisChart from '../../dashboard/TrendChart';
import TagBreakdown from '../TagBreakdown';
import { useWeeklyReport } from '../../../hooks/useWeeklyReport';
import Skeleton from '../../shared/Skeleton';

const WeeklyReport = () => {
    const reportDate = useMemo(() => new Date(), []);
    const { data, loading } = useWeeklyReport(reportDate);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 sm:p-8 h-80 sm:h-96">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 sm:p-8 h-80 sm:h-96">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 h-72">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 h-72">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 sm:p-8 h-80 sm:h-96 relative overflow-hidden group">
                     <div className="absolute top-6 right-6 z-10 flex gap-2">
                         <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-white/5">
                             <div className="w-1.5 h-1.5 bg-accent-green rounded-full" /> This Week
                         </span>
                         <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-white/5">
                             <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" /> Last Week
                         </span>
                     </div>
                     <TrendAnalysisChart 
                        data={data.trendData}
                        lastWeekData={data.lastWeekData}
                        title="Deep Work Hours"
                        color="bg-accent-green"
                     />
                </div>

                {/* Goal Widget */}
                <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />
                    <div>
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">Weekly Goal</h3>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-bold text-white tracking-tighter">{data.goalProgress.current}h</span>
                            <span className="text-2xl text-neutral-500 font-medium">/{data.goalProgress.target}h</span>
                        </div>
                        <p className="text-sm text-neutral-400">{data.goalProgress.percentage}% completed with 2 days left.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-white uppercase tracking-wider">
                            <span>Progress</span>
                            <span>{data.goalProgress.percentage}%</span>
                        </div>
                        <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${data.goalProgress.percentage}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Top Categories</h3>
                        <button className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"><Filter size={14}/></button>
                    </div>
                    <div className="h-64">
                        <TagBreakdown />
                    </div>
                </div>
                
                <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Project Distribution</h3>
                        <button className="text-xs font-bold text-neutral-500 hover:text-white uppercase tracking-wide">View All</button>
                    </div>
                    <div className="space-y-6">
                        {data.projectData.length === 0 ? (
                            <div className="text-center py-10 text-neutral-500">No project data available</div>
                        ) : (
                            data.projectData.map((p, i) => (
                                <div key={p.label}>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-white font-bold flex items-center gap-2 truncate min-w-0">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${p.color}`} />
                                            <span className="truncate">{p.label}</span>
                                        </span>
                                        <span className="text-neutral-400 font-mono shrink-0 ml-2">{p.time}</span>
                                    </div>
                                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${p.value}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                            className={`h-full ${p.color}`} 
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyReport;
