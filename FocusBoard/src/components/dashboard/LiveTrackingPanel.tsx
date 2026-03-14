import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Monitor, Globe } from 'lucide-react';
import { BackendActivity } from '../../services/activityApi';

interface LiveTrackingPanelProps {
    activities: BackendActivity[];
    currentActivity?: { app_name: string; window_title: string } | null;
}

function getAppIcon(appName: string) {
    const lower = appName.toLowerCase();
    if (lower.includes('chrome') || lower.includes('firefox') || lower.includes('safari') || lower.includes('browser')) {
        return <Globe size={14} className="text-blue-400 shrink-0" />;
    }
    return <Monitor size={14} className="text-neutral-400 shrink-0" />;
}

function formatDuration(startTime: string, endTime?: string | null): string {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const seconds = Math.max(0, Math.floor((end - start) / 1000));
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}

function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getCategoryStyle(categoryName?: string): string {
    if (!categoryName || categoryName === 'Uncategorized') return 'bg-neutral-800 text-neutral-500';
    const lower = categoryName.toLowerCase();
    if (lower.includes('develop') || lower.includes('code')) return 'bg-blue-500/20 text-blue-400';
    if (lower.includes('design')) return 'bg-purple-500/20 text-purple-400';
    if (lower.includes('communic') || lower.includes('email') || lower.includes('slack')) return 'bg-yellow-500/20 text-yellow-400';
    if (lower.includes('meet')) return 'bg-green-500/20 text-green-400';
    if (lower.includes('social') || lower.includes('news') || lower.includes('distract')) return 'bg-red-500/20 text-red-400';
    return 'bg-neutral-700/50 text-neutral-400';
}

// Running timer for the top active item
function LiveTimer({ startTime }: { startTime: string }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = new Date(startTime).getTime();
        const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return (
        <span className="font-mono tabular-nums text-[10px] text-accent-green font-bold">
            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </span>
    );
}

const LiveTrackingPanel: React.FC<LiveTrackingPanelProps> = ({ activities, currentActivity }) => {
    const isEmpty = activities.length === 0 && !currentActivity;

    // The most recent activity that has no end_time is "currently active"
    const activeActivity = activities.find(a => !a.end_time) ?? null;
    const pastActivities = activities.filter(a => !!a.end_time).slice(0, 12);

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-[22px] h-full flex flex-col overflow-hidden shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-800 rounded-xl">
                        <Activity size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                            Activity Feed
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-accent-green">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                                LIVE TRACKING
                            </span>
                            {activities.length > 0 && (
                                <span className="text-[10px] text-neutral-600">·</span>
                            )}
                            {activities.length > 0 && (
                                <span className="text-[10px] text-neutral-500">{activities.length} events today</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-neutral-600" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <div className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center">
                            <Activity size={18} className="text-neutral-600" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 font-medium">No activity recorded yet</p>
                            <p className="text-xs text-neutral-700 mt-1">Start a focus session to begin tracking</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {/* Active (running) item */}
                        <AnimatePresence>
                            {activeActivity && (
                                <motion.div
                                    key={activeActivity._id}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="flex items-center gap-3 px-3 py-2.5 bg-accent-green/10 border border-accent-green/20 rounded-xl"
                                >
                                    <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            {getAppIcon(activeActivity.app_name)}
                                            <span className="text-xs font-bold text-white truncate">{activeActivity.app_name}</span>
                                        </div>
                                        {activeActivity.window_title && (
                                            <p className="text-[10px] text-neutral-500 truncate mt-0.5 italic">{activeActivity.window_title}</p>
                                        )}
                                    </div>
                                    <LiveTimer startTime={activeActivity.start_time} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Current Tauri activity (if different from active DB activity) */}
                        <AnimatePresence>
                            {currentActivity && !activeActivity && (
                                <motion.div
                                    key="tauri-current"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="flex items-center gap-3 px-3 py-2.5 bg-accent-blue/10 border border-accent-blue/20 rounded-xl"
                                >
                                    <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            {getAppIcon(currentActivity.app_name)}
                                            <span className="text-xs font-bold text-white truncate">{currentActivity.app_name}</span>
                                        </div>
                                        {currentActivity.window_title && (
                                            <p className="text-[10px] text-neutral-500 truncate mt-0.5 italic">{currentActivity.window_title}</p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-accent-blue font-bold">NOW</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Past activities */}
                        <AnimatePresence initial={false}>
                            {pastActivities.map((act, i) => {
                                const categoryName = (act as any).category_id?.name;
                                return (
                                    <motion.div
                                        key={act._id || i}
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors group"
                                    >
                                        <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-neutral-700" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                {getAppIcon(act.app_name)}
                                                <span className="text-xs font-semibold text-neutral-300 truncate">{act.app_name}</span>
                                                {categoryName && (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${getCategoryStyle(categoryName)}`}>
                                                        {categoryName}
                                                    </span>
                                                )}
                                            </div>
                                            {act.window_title && (
                                                <p className="text-[10px] text-neutral-600 truncate mt-0.5 italic">{act.window_title}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-0.5">
                                            <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                                                {formatDuration(act.start_time, act.end_time)}
                                            </span>
                                            <span className="text-[9px] text-neutral-700">
                                                {formatTime(act.start_time)}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveTrackingPanel;
