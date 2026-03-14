
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Monitor, Wifi, WifiOff } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

interface ActivityEntry {
    id: string;
    app_name: string;
    window_title: string;
    timestamp: Date;
    duration: number; // seconds spent
}

const APP_ICONS: Record<string, string> = {
    'zen-browser': '🌐',
    'firefox': '🦊',
    'chrome': '🌍',
    'chromium': '🌍',
    'code': '💻',
    'vscode': '💻',
    'terminal': '⬛',
    'alacritty': '⬛',
    'kitty': '⬛',
    'wezterm': '⬛',
    'slack': '💬',
    'discord': '🎮',
    'spotify': '🎵',
    'idle': '💤',
    'unknown': '❓',
};

const getAppEmoji = (appName: string): string => {
    const lower = appName.toLowerCase();
    for (const [key, emoji] of Object.entries(APP_ICONS)) {
        if (lower.includes(key)) return emoji;
    }
    return '🖥️';
};

const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const LiveActivityFeed: React.FC = () => {
    const { currentActivity } = useSessionStore();
    const [entries, setEntries] = useState<ActivityEntry[]>([]);
    const [isLive, setIsLive] = useState(false);
    const lastSignatureRef = useRef<string>('');
    const feedRef = useRef<HTMLDivElement>(null);

    // Listen for activity changes from the store
    useEffect(() => {
        if (!currentActivity) return;

        const signature = `${currentActivity.app_name}::${currentActivity.window_title}`;
        if (signature === lastSignatureRef.current) {
            // Same activity — increment duration on the last entry
            setEntries(prev => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                updated[0] = { ...updated[0], duration: updated[0].duration + 1 };
                return updated;
            });
            return;
        }

        lastSignatureRef.current = signature;
        setIsLive(true);

        const entry: ActivityEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            app_name: currentActivity.app_name,
            window_title: currentActivity.window_title,
            timestamp: new Date(),
            duration: 0,
        };

        setEntries(prev => [entry, ...prev].slice(0, 50)); // keep last 50
    }, [currentActivity]);

    // Auto-scroll
    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = 0;
        }
    }, [entries.length]);

    const latestEntry = entries[0];
    const isIdle = latestEntry?.app_name === 'Idle';

    return (
        <div className="bg-[#1C1C1E] h-full border border-white/10 rounded-[22px] flex flex-col overflow-hidden relative shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-800 rounded-xl text-white">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                            Live Activity
                            {isLive && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    LIVE
                                </span>
                            )}
                        </h3>
                        <p className="text-[10px] text-neutral-600 mt-0.5">
                            {entries.length} events tracked
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-neutral-500">
                    {isLive ? <Wifi size={14} className="text-green-400" /> : <WifiOff size={14} />}
                </div>
            </div>

            {/* Current Activity Hero */}
            {latestEntry && (
                <div className={`mx-4 mb-3 p-3 rounded-xl border transition-colors ${isIdle
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-accent-blue/5 border-accent-blue/20'
                    }`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{getAppEmoji(latestEntry.app_name)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                                {latestEntry.app_name}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">
                                {latestEntry.window_title}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-xs font-mono font-bold text-white">
                                {formatDuration(latestEntry.duration)}
                            </div>
                            <div className="text-[9px] text-neutral-600">
                                {formatTime(latestEntry.timestamp)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed List */}
            <div ref={feedRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-1">
                <AnimatePresence initial={false}>
                    {entries.slice(1).map((entry) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2.5 py-2 border-b border-white/[0.03] last:border-0"
                        >
                            <span className="text-sm shrink-0">{getAppEmoji(entry.app_name)}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-neutral-300 truncate">
                                    {entry.app_name}
                                </div>
                                <div className="text-[10px] text-neutral-600 truncate">
                                    {entry.window_title}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-[10px] font-mono text-neutral-500">
                                    {formatDuration(entry.duration)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {entries.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <Monitor size={32} className="text-neutral-700 mb-3" />
                        <p className="text-sm text-neutral-500 font-medium">No activity detected</p>
                        <p className="text-[10px] text-neutral-600 mt-1">
                            Activity will appear here as you use your computer
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveActivityFeed;
