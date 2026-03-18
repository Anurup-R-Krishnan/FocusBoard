import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Clock, Monitor, Globe, TrendingUp } from 'lucide-react';
import { BackendActivity } from '../../services/activityApi';

interface LiveTrackingPanelProps {
    activities: BackendActivity[];
    currentActivity?: { app_name: string; window_title: string } | null;
}

function getAppIcon(appName: string) {
    const lower = appName.toLowerCase();
    if (lower.includes('chrome') || lower.includes('firefox') || lower.includes('safari') || lower.includes('browser') || lower.includes('zen')) {
        return <Globe size={13} className="text-blue-400 shrink-0" />;
    }
    return <Monitor size={13} className="text-neutral-400 shrink-0" />;
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

function getCategoryStyle(categoryName?: string): { dot: string; badge: string } {
    if (!categoryName || categoryName === 'Uncategorized') return { dot: 'bg-neutral-600', badge: 'bg-neutral-800 text-neutral-400' };
    const lower = categoryName.toLowerCase();
    if (lower.includes('develop') || lower.includes('code')) return { dot: 'bg-blue-400', badge: 'bg-blue-500/20 text-blue-300' };
    if (lower.includes('design')) return { dot: 'bg-purple-400', badge: 'bg-purple-500/20 text-purple-300' };
    if (lower.includes('communic') || lower.includes('email') || lower.includes('slack')) return { dot: 'bg-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' };
    if (lower.includes('meet')) return { dot: 'bg-accent-green', badge: 'bg-accent-green/20 text-accent-green' };
    if (lower.includes('social') || lower.includes('news') || lower.includes('distract')) return { dot: 'bg-red-400', badge: 'bg-red-500/20 text-red-300' };
    return { dot: 'bg-neutral-500', badge: 'bg-neutral-700/50 text-neutral-400' };
}

// Running timer for the active item
function LiveTimer({ startTime }: { startTime: string }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = new Date(startTime).getTime();
        const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;

    return (
        <span className="font-mono tabular-nums text-xs text-accent-green font-bold tracking-tight">
            {h > 0 ? `${String(h).padStart(2, '0')}:` : ''}
            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </span>
    );
}

const LiveTrackingPanel: React.FC<LiveTrackingPanelProps> = ({ activities, currentActivity }) => {
    const isEmpty = activities.length === 0 && !currentActivity;

    const activeActivity = activities.find(a => !a.end_time) ?? null;
    const pastActivities = activities.filter(a => !!a.end_time).slice(0, 20);

    const totalSessionSeconds = activities.reduce((acc, a) => {
        const start = new Date(a.start_time).getTime();
        const end = a.end_time ? new Date(a.end_time).getTime() : Date.now();
        return acc + Math.max(0, Math.floor((end - start) / 1000));
    }, 0);

    const sessionDisplay = totalSessionSeconds < 60
        ? `${totalSessionSeconds}s`
        : totalSessionSeconds < 3600
            ? `${Math.floor(totalSessionSeconds / 60)}m`
            : `${Math.floor(totalSessionSeconds / 3600)}h ${Math.floor((totalSessionSeconds % 3600) / 60)}m`;

    return (
        <div className="bg-[#1C1C1E] border border-white/10 rounded-[22px] h-full flex flex-col overflow-hidden shadow-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-800 rounded-xl">
                        <ClipboardList size={16} className="text-neutral-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white tracking-tight">Session Log</h3>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                                TRACKING
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {activities.length} events · {sessionDisplay} total
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-neutral-600" />
                    <Clock size={13} className="text-neutral-600" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 min-h-0">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-neutral-800/60 flex items-center justify-center">
                            <ClipboardList size={20} className="text-neutral-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-400">No activity recorded yet</p>
                            <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">Start a focus session to begin tracking</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 pt-3">

                        {/* Active (running) item */}
                        <AnimatePresence>
                            {activeActivity && (
                                <motion.div
                                    key={activeActivity._id}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="flex items-center gap-3 px-3 py-3 bg-accent-green/[0.08] border border-accent-green/25 rounded-2xl mb-1"
                                >
                                    <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            {getAppIcon(activeActivity.app_name)}
                                            <span className="text-sm font-bold text-white truncate">
                                                {activeActivity.app_name}
                                            </span>
                                        </div>
                                        {activeActivity.window_title && (
                                            <p className="text-xs text-neutral-400 truncate mt-0.5 leading-snug">
                                                {activeActivity.window_title}
                                            </p>
                                        )}
                                    </div>
                                    <LiveTimer startTime={activeActivity.start_time} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Current Tauri activity (when no DB active activity) */}
                        <AnimatePresence>
                            {currentActivity && !activeActivity && (
                                <motion.div
                                    key="tauri-current"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="flex items-center gap-3 px-3 py-3 bg-accent-blue/[0.08] border border-accent-blue/25 rounded-2xl mb-1"
                                >
                                    <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            {getAppIcon(currentActivity.app_name)}
                                            <span className="text-sm font-bold text-white truncate">
                                                {currentActivity.app_name}
                                            </span>
                                        </div>
                                        {currentActivity.window_title && (
                                            <p className="text-xs text-neutral-400 truncate mt-0.5 leading-snug">
                                                {currentActivity.window_title}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-accent-blue font-bold shrink-0">NOW</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Past activities */}
                        <AnimatePresence initial={false}>
                            {pastActivities.map((act, i) => {
                                const categoryName = (act as any).category_id?.name;
                                const style = getCategoryStyle(categoryName);
                                return (
                                    <motion.div
                                        key={act._id || i}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.015 }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                                    >
                                        {/* Category colour dot */}
                                        <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${style.dot}`} />

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {getAppIcon(act.app_name)}
                                                <span className="text-xs font-semibold text-neutral-200 truncate">
                                                    {act.app_name}
                                                </span>
                                                {categoryName && categoryName !== 'Uncategorized' && (
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                                                        {categoryName}
                                                    </span>
                                                )}
                                            </div>
                                            {act.window_title && (
                                                <p className="text-xs text-neutral-500 truncate mt-0.5 leading-snug">
                                                    {act.window_title}
                                                </p>
                                            )}
                                        </div>

                                        <div className="shrink-0 flex flex-col items-end gap-0.5">
                                            <span className="text-xs text-neutral-400 font-mono tabular-nums">
                                                {formatDuration(act.start_time, act.end_time)}
                                            </span>
                                            <span className="text-[10px] text-neutral-600 tabular-nums">
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
