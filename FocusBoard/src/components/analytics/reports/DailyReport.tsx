
import React from 'react';
import { Clock, Zap, Layers, CalendarDays, TrendingUp } from 'lucide-react';
import TagBreakdown from '../TagBreakdown';
import StatCard from '../shared/StatCard';
import { useDailyReport } from '../../../hooks/useDailyReport';
import Skeleton from '../../shared/Skeleton';

const TimelineNode = ({ time, title, duration, type, tag, isLast }: any) => (
    <div className="relative pl-8 pb-8 group">
        {!isLast && <div className="absolute left-[11px] top-3 bottom-0 w-px bg-neutral-800 group-hover:bg-neutral-700 transition-colors" />}
        <div className={`absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-4 border-[#121212] z-10 flex items-center justify-center shrink-0 ${
            type === 'FOCUS' ? 'bg-accent-blue' : type === 'MEETING' ? 'bg-purple-500' : 'bg-neutral-600'
        }`}>
            {type === 'FOCUS' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-titanium-dark border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-white truncate max-w-full">{title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-900 border border-white/10 text-neutral-400 uppercase tracking-wider shrink-0">{tag}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                    <span className="flex items-center gap-1.5 shrink-0"><Clock size={12} /> {time}</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-700" />
                    <span className="font-mono">{duration}</span>
                </div>
            </div>
            
            {type === 'FOCUS' && (
                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4 mt-1 sm:mt-0 shrink-0">
                    <div className="text-right">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold">Efficiency</div>
                        <div className="text-sm font-bold text-green-400">92%</div>
                    </div>
                </div>
            )}
        </div>
    </div>
);

const DailyReport = () => {
    const { sessions, metrics, loading } = useDailyReport();

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-4 h-24"><Skeleton className="h-full w-full" /></div>
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-4 h-24"><Skeleton className="h-full w-full" /></div>
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-4 h-24"><Skeleton className="h-full w-full" /></div>
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-4 h-24"><Skeleton className="h-full w-full" /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#121212] rounded-[2rem] p-6 border border-white/5 h-96">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="space-y-6">
                        <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 h-64">
                            <Skeleton className="h-full w-full" />
                        </div>
                        <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 h-48">
                            <Skeleton className="h-full w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Focus Time" value={metrics.focusTime} sub="Target: 6h" icon={Clock} trend={12} color="text-accent-blue" />
                <StatCard label="Flow Efficiency" value={`${metrics.efficiency}%`} icon={Zap} trend={5} color="text-green-400" />
                <StatCard label="Sessions" value={metrics.sessions.toString()} sub={`Avg: ${sessions.length > 0 ? '1h 10m' : '0m'}`} icon={Layers} />
                <StatCard label="Meetings" value={metrics.meetings} sub="1 Event" icon={CalendarDays} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timeline */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Session Stream</h3>
                    </div>
                    <div className="bg-[#121212] rounded-[2rem] p-6 border border-white/5">
                        {sessions.length === 0 ? (
                            <div className="text-center py-10 text-neutral-500">No sessions recorded today</div>
                        ) : (
                            <div className="pt-2">
                                {sessions.map((session, i) => (
                                    <TimelineNode key={i} {...session} isLast={i === sessions.length - 1} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Widgets */}
                <div className="space-y-6">
                    <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-6">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Focus Distribution</h3>
                        <TagBreakdown />
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <TrendingUp size={24} className="text-accent-blue opacity-50" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">Insight</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                            Your morning sessions are <strong>25% more efficient</strong> than afternoon blocks. Consider moving high-complexity tasks to pre-12PM.
                        </p>
                        <button className="text-xs font-bold text-accent-blue hover:text-white transition-colors uppercase tracking-wide">View Analysis &rarr;</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyReport;
