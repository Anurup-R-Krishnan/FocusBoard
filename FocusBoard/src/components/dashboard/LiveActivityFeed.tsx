import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Monitor, Wifi, WifiOff } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

interface ActivityEntry {
    id: string;
    app_name: string;
    window_title: string;
    timestamp: Date;
    duration: number; // seconds
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

const formatTime = (date: Date): string =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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

    useEffect(() => {
        if (!currentActivity) return;

        const signature = `${currentActivity.app_name}::${currentActivity.window_title}`;
        if (signature === lastSignatureRef.current) {
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

        setEntries(prev => [entry, ...prev].slice(0, 50));
    }, [currentActivity]);

    useEffect(() => {
        if (feedRef.current) feedRef.current.scrollTop = 0;
    }, [entries.length]);

    const latestEntry = entries[0];
    const isIdle = latestEntry?.app_name === 'Idle';

    return (
        <div className="bg-[#1C1C1E] h-full border border-white/10 rounded-[22px] flex flex-col overflow-hidden shadow-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isLive ? 'bg-accent-green/15' : 'bg-neutral-800'}`}>
                        <Radio size={16} className={isLive ? 'text-accent-green' : 'text-neutral-400'} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white tracking-tight">Now Playing</h3>
                            {isLive && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                                    LIVE
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {entries.length > 0 ? `${entries.length} app switches detected` : 'Listening for activity…'}
                        </p>
                    </div>
                </div>
                <div className="text-neutral-500">
                    {isLive
                        ? <Wifi size={15} className="text-accent-green" />
                        : <WifiOff size={15} />
                    }
                </div>
            </div>

            {/* Current Activity — Hero Card */}
            {latestEntry && (
                <div className={`mx-4 mt-4 mb-2 p-4 rounded-2xl border transition-colors ${
                    isIdle
                        ? 'bg-yellow-500/[0.07] border-yellow-500/25'
                        : 'bg-accent-blue/[0.07] border-accent-blue/25'
                }`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl leading-none shrink-0">{getAppEmoji(latestEntry.app_name)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate leading-tight">
                                {latestEntry.app_name}
                            </div>
                            {latestEntry.window_title && (
                                <div className="text-xs text-neutral-400 truncate mt-0.5 leading-snug">
                                    {latestEntry.window_title}
                                </div>
                            )}
                        </div>
                        <div className="text-right shrink-0 pl-2">
                            <div className="text-sm font-mono font-bold text-white tabular-nums">
                                {formatDuration(latestEntry.duration)}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                                {formatTime(latestEntry.timestamp)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Feed */}
            <div ref={feedRef} className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 mt-1">
                <AnimatePresence initial={false}>
                    {entries.slice(1).map((entry) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                        >
                            <span className="text-base shrink-0 leading-none">{getAppEmoji(entry.app_name)}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-neutral-200 truncate leading-tight">
                                    {entry.app_name}
                                </div>
                                {entry.window_title && (
                                    <div className="text-xs text-neutral-500 truncate mt-0.5 leading-snug">
                                        {entry.window_title}
                                    </div>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs font-mono text-neutral-400 tabular-nums">
                                    {formatDuration(entry.duration)}
                                </div>
                                <div className="text-[10px] text-neutral-600 mt-0.5">
                                    {formatTime(entry.timestamp)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {entries.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <Monitor size={32} className="text-neutral-700 mb-3" />
                        <p className="text-sm font-medium text-neutral-400">No activity detected</p>
                        <p className="text-xs text-neutral-600 mt-1.5 max-w-[180px] leading-relaxed">
                            App switches will appear here as you work
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveActivityFeed;
