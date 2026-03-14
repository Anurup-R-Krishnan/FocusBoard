
import React, { useState, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import FocusGauge from './FocusGauge';
import TimelineScrubber from './TimelineScrubber';
import MetricCard from './MetricCard';
import SquadWidget from './SquadWidget';
import SignalWidget from './SignalWidget';
import TrendAnalysisChart from './TrendChart';
import LiveTrackingPanel from './LiveTrackingPanel';
import BreakToast from '../overlays/BreakToast';
import ControlsPanel from '../controls/ControlsPanel';
import SettingsDrawer from '../overlays/SettingsDrawer';
import ShortcutHUD from '../overlays/ShortcutHUD';
import ZenMode from './ZenMode';
import TagModal from '../overlays/TagModal';
import FocusSessionModal from '../overlays/FocusSessionModal';
import { Menu, ChevronRight, Star, Maximize2, Filter, X, Pin, Flame, Trophy, TrendingUp, CalendarDays, ArrowUpRight, BarChart2 } from 'lucide-react';
import { SessionState, Task, TimeSegment } from '../../types';
import { DrillDownType } from './DrillDownView';
import { Page } from '../layout/Navigation';
import { UserData } from '../../services/authApi';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useSessionStore } from '../../store/useSessionStore';
import { updateActivity } from '../../services/activityApi';
import Skeleton from '../shared/Skeleton';
import LiveActivityFeed from './LiveActivityFeed';

interface DashboardProps {
    onNavigate: (type: DrillDownType, data: any) => void;
    onPageChange: (page: Page) => void;
    user?: UserData | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onPageChange, user }) => {
    const store = useDashboardStore();
    const session = useSessionStore();
    const liveActivities = useDashboardStore(s => s.liveActivities);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showBreakToast, setShowBreakToast] = useState(false);
    const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
    const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
    const [isZenModeOpen, setIsZenModeOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<{ type: 'project' | 'client'; value: string } | null>(null);
    const [pinnedFilters, setPinnedFilters] = useState<Array<{ type: 'project' | 'client'; value: string }>>([]);

    // Map store state back into the "state/controls" format the Dashboard expects
    const state = {
        metrics: store.metrics,
        timeline: store.timeline,
        tasks: store.tasks,
        squad: store.squad,
        sessionState: session.sessionState,
        currentTime: new Date(),
        currentActivity: session.currentActivity,
        activityFeed: [] as any[],
        activeTaskId: store.tasks.length > 0 ? store.tasks[0].id : null,
        isPlaying,
        speedMultiplier,
        recoveryProgress: 0
    };

    const isLoading = store.isLoading;
    const error = store.error;

    const activeTask = state.tasks.find((task: any) => task.isActive) ||
        state.tasks.find((task: any) => task.id === state.activeTaskId) ||
        null;

    const controls = {
        triggerNudge: store.triggerNudge,
        updateSegment: (id: string, updates: any) => {
            const previousTimeline = useDashboardStore.getState().timeline;
            const updatedTimeline = previousTimeline.map((segment: any) => (
                segment.id === id ? { ...segment, ...updates } : segment
            ));

            useDashboardStore.setState({ timeline: updatedTimeline });

            const targetSegment = updatedTimeline.find((segment: any) => segment.id === id);
            const activityId = targetSegment?._id || targetSegment?.id;
            if (!activityId) {
                return;
            }

            updateActivity(activityId, {
                window_title: targetSegment.userTitle || targetSegment.title || targetSegment.window_title,
                color: targetSegment.color,
            }).catch((error: any) => {
                useDashboardStore.setState({
                    timeline: previousTimeline,
                    error: error?.message || 'Failed to update segment',
                } as any);
            });
        },
        tagSegment: (id: string, tag: string) => {
            const previousTimeline = useDashboardStore.getState().timeline;
            const updatedTimeline = previousTimeline.map((segment: any) => {
                if (segment.id !== id) return segment;
                const currentTags = Array.isArray(segment.tags) ? segment.tags : [];
                const nextTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag];
                return {
                    ...segment,
                    tags: nextTags,
                    title: segment.title || tag,
                    userTitle: segment.userTitle || tag,
                };
            });

            useDashboardStore.setState({ timeline: updatedTimeline });

            const targetSegment = updatedTimeline.find((segment: any) => segment.id === id);
            const activityId = targetSegment?._id || targetSegment?.id;
            if (!activityId) {
                return;
            }

            updateActivity(activityId, {
                window_title: targetSegment.userTitle || targetSegment.title || tag,
            }).catch((error: any) => {
                useDashboardStore.setState({
                    timeline: previousTimeline,
                    error: error?.message || 'Failed to tag segment',
                } as any);
            });
        },
        togglePlay: () => {
            setIsPlaying(prev => !prev);
        },
        startFocus: () => {
            setIsFocusModalOpen(true);
        },
        resumeFocus: session.resumeSession,
        takeBreak: session.pauseSession,
        addDistraction: session.pauseSession,
        setSpeed: (multiplier: number) => {
            setSpeedMultiplier(multiplier === 60 ? 60 : 1);
        },
        createTask: store.createTask,
        updateTask: store.updateTask,
        deleteTask: store.deleteTask,
    };
    const projects = Array.from(new Set(state.tasks.map((t: Task) => t.project))).filter(Boolean);
    const clients = Array.from(new Set(state.tasks.map((t: Task) => t.client))).filter(Boolean);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'f' || e.key === 'F') setIsFocusModalOpen(true);
            if (e.key === 'b' || e.key === 'B') session.pauseSession();
            if (e.key === 'd' || e.key === 'D') session.pauseSession();
            if (e.key === ' ') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [session]);

    useEffect(() => {
        const elapsedMinutes = Math.floor(session.elapsedSeconds / 60);
        if (session.sessionState === 'FOCUS' && elapsedMinutes > 0 && elapsedMinutes % 50 === 0) {
            setShowBreakToast(true);
        }
    }, [session.elapsedSeconds, session.sessionState]);

    // Filter Logic
    const filteredTimeline = activeFilter
        ? state.timeline.filter((seg: TimeSegment) => {
            // Find associated task
            const task = state.tasks.find((t: Task) => t.id === seg.taskId);
            if (!task) return false;
            if (activeFilter.type === 'project') return task.project === activeFilter.value;
            if (activeFilter.type === 'client') return task.client === activeFilter.value;
            return false;
        })
        : state.timeline;

    const togglePin = (filter: { type: 'project' | 'client', value: string }) => {
        if (pinnedFilters.some(f => f.value === filter.value && f.type === filter.type)) {
            setPinnedFilters(prev => prev.filter(f => !(f.value === filter.value && f.type === filter.type)));
        } else {
            setPinnedFilters(prev => [...prev, filter]);
        }
    };

    const handleTagRequest = (id: string) => {
        setSelectedSegmentId(id);
        setIsTagModalOpen(true);
    };

    const getStatusColor = (status: SessionState) => {
        switch (status) {
            case 'FOCUS': return 'bg-accent-green text-black border-accent-green';
            case 'BREAK': return 'bg-accent-purple text-white border-accent-purple';
            case 'DISTRACTED': return 'bg-accent-orange text-white border-accent-orange';
            case 'RECOVERY': return 'bg-orange-400 text-black border-orange-400';
            case 'MEETING': return 'bg-blue-500 text-white border-blue-500';
            default: return 'bg-neutral-800 text-neutral-400 border-neutral-700';
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    // Calculate daily stats for header
    const todaysFocusTime = state.timeline
        .filter((t: TimeSegment) => t.type === 'FOCUS')
        .reduce((acc: number, t: TimeSegment) => acc + (t.end - t.start), 0);
    const hours = Math.floor(todaysFocusTime / 60);
    const minutes = Math.round(todaysFocusTime % 60);
    const remainingSeconds = Math.max(0, Math.floor(session.plannedMinutes * 60) - session.elapsedSeconds);
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecondsDisplay = remainingSeconds % 60;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 lg:p-8 pb-32 sm:pb-32 overflow-hidden relative">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col min-w-0">
                        <Skeleton width={200} height={32} className="mb-2" />
                        <Skeleton width={150} height={16} />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton width={100} height={32} circle />
                        <Skeleton width={100} height={32} circle />
                    </div>
                </header>
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {/* Row 1: Timeline */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 h-[24rem]">
                        <Skeleton className="h-full w-full" />
                    </div>

                    {/* Row 2: Metrics Bento */}
                    <div className="col-span-1 lg:col-span-1 h-72 md:h-80">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="col-span-1 lg:col-span-2 h-72 md:h-80">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1 h-72 md:h-80 flex flex-col gap-6">
                        <Skeleton className="flex-1 w-full" />
                        <Skeleton className="flex-1 w-full" />
                    </div>

                    {/* Row 3: Squad & Signals */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 h-52">
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1 h-52">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4">
                <p className="text-red-400">Failed to load dashboard data.</p>
                <p className="text-neutral-500 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-6 lg:p-8 pb-32 sm:pb-32 overflow-hidden relative selection:bg-accent-blue selection:text-white">

            {/* Background Grid Pattern */}
            <div
                className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Ambient Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[400px] bg-accent-blue/5 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-30 gap-4 max-w-[1600px] mx-auto w-full">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-none text-white truncate">
                            {state.currentTime.toLocaleDateString([], { weekday: 'long' })}
                            <span className="text-neutral-500 ml-2 font-medium hidden xs:inline">{state.currentTime.toLocaleDateString([], { month: 'long', day: 'numeric' })}</span>
                            <span className="text-neutral-500 ml-2 font-medium inline xs:hidden">{state.currentTime.toLocaleDateString([], { month: 'numeric', day: 'numeric' })}</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1 truncate">
                            <p className="text-xs text-neutral-400 font-medium truncate">Good {(() => { const h = state.currentTime.getHours(); if (h < 12) return 'Morning'; if (h < 17) return 'Afternoon'; return 'Evening'; })()}, {user?.firstName || 'User'}</p>
                            <div className="h-1 w-1 rounded-full bg-neutral-600 shrink-0" />
                            <p className="text-xs text-neutral-500 shrink-0">4h 12m remaining</p>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="sm:hidden p-2.5 rounded-full bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-neutral-700 shrink-0"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            {state.currentActivity && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent-blue/10 border border-accent-blue/20 text-[10px] font-bold text-accent-blue animate-pulse">
                                    <span className="w-1 h-1 rounded-full bg-accent-blue" />
                                    LIVE TRACKING
                                </div>
                            )}
                            <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 shadow-lg transition-colors duration-300 ${getStatusColor(state.sessionState)}`}>
                                <div className={`w-2 h-2 rounded-full ${state.sessionState === 'IDLE' ? 'bg-neutral-500' : 'bg-white animate-pulse'}`} />
                                <span className="text-xs font-bold tracking-wide">{state.sessionState}</span>
                            </div>
                        </div>
                        {state.currentActivity && (
                            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium">
                                <span className="max-w-[150px] truncate underline decoration-accent-blue/30 decoration-2">{state.currentActivity.app_name}</span>
                                <span className="text-neutral-700">|</span>
                                <span className="max-w-[200px] truncate italic">{state.currentActivity.window_title}</span>
                            </div>
                        )}
                    </div>

                    {state.sessionState === 'FOCUS' && (
                        <button
                            onClick={() => setIsZenModeOpen(true)}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/50 text-accent-blue text-xs font-semibold hover:bg-accent-blue hover:text-white transition-colors"
                        >
                            <Maximize2 size={12} />
                            <span>Zen Mode</span>
                        </button>
                    )}

                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1C1E] border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors group">
                        <Star size={12} className="text-yellow-400" fill="currentColor" />
                        <span>Get Pro</span>
                        <ChevronRight size={12} className="text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 z-0 relative"
            >

                {/* Row 1: Daily Timeline (Full Width) */}
                <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-4 h-[24rem] flex flex-col bg-[#1C1C1E] border border-white/10 rounded-[22px] overflow-hidden relative group/timeline shadow-lg">

                    {/* Rich Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 pb-2 gap-4 bg-gradient-to-b from-white/[0.02] to-transparent">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="min-w-0">
                                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 flex items-center gap-2 truncate">
                                    <CalendarDays size={14} /> Daily Overview
                                </h3>
                                <div className="flex items-baseline gap-2 truncate">
                                    <span className="text-2xl font-bold text-white tracking-tight">Today</span>
                                    <span className="text-sm text-neutral-500 font-medium hidden sm:inline truncate">
                                        {state.currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden sm:block h-8 w-px bg-white/10 mx-2" />

                            {/* Quick Stats */}
                            <div className="hidden sm:flex items-center gap-6 shrink-0">
                                <div>
                                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">Logged</span>
                                    <span className="text-sm font-mono font-bold text-white">{hours}h {minutes}m</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">Target</span>
                                    <span className="text-sm font-mono font-bold text-neutral-400">6h 30m</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Filter Controls (Mobile compacted) */}
                            <div className="flex-1 sm:flex-none flex gap-2">
                                {/* Project Filter */}
                                <div className="flex-1 sm:w-auto bg-neutral-900 border border-white/10 rounded-lg p-1 flex gap-1 items-center">
                                    <Filter size={12} className="text-neutral-500 ml-2" />
                                    <select
                                        className="bg-transparent text-xs text-neutral-400 font-medium px-2 py-1.5 outline-none cursor-pointer hover:text-white w-full sm:w-auto"
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (!value) {
                                                setActiveFilter(null);
                                                return;
                                            }
                                            setActiveFilter({ type: 'project', value });
                                        }}
                                        value={activeFilter?.type === 'project' ? activeFilter.value : ''}
                                    >
                                        <option value="">Filter Project</option>
                                        {projects.map((p: any) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                {/* Client Filter */}
                                <div className="flex-1 sm:w-auto bg-neutral-900 border border-white/10 rounded-lg p-1 flex gap-1 items-center">
                                    <Filter size={12} className="text-neutral-500 ml-2" />
                                    <select
                                        className="bg-transparent text-xs text-neutral-400 font-medium px-2 py-1.5 outline-none cursor-pointer hover:text-white w-full sm:w-auto"
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (!value) {
                                                setActiveFilter(null);
                                                return;
                                            }
                                            setActiveFilter({ type: 'client', value });
                                        }}
                                        value={activeFilter?.type === 'client' ? activeFilter.value : ''}
                                    >
                                        <option value="">Filter Client</option>
                                        {clients.map((c: any) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={() => onNavigate('DAILY_OVERVIEW', { timeline: state.timeline, currentTime: state.currentTime })}
                                className="p-2.5 bg-accent-blue/10 border border-accent-blue/20 hover:bg-accent-blue/20 rounded-lg text-accent-blue hover:text-white transition-colors flex items-center gap-2 group shrink-0"
                            >
                                <span className="text-xs font-bold hidden sm:inline">View Report</span>
                                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Scrubber Container */}
                    <div className="flex-1 w-full relative min-h-0">
                        <div className="absolute inset-0">
                            <TimelineScrubber
                                timeline={filteredTimeline as TimeSegment[]}
                                currentTime={state.currentTime}
                                onTagRequest={(id: string) => {
                                    const segment = state.timeline.find((t: TimeSegment) => t.id === id);
                                    if (segment) onNavigate('SESSION', segment);
                                }}
                                onUpdateSegment={controls.updateSegment}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Row 2: Metrics Bento */}

                {/* Focus Score */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 lg:col-span-1 h-72 md:h-80"
                    onClick={() => onNavigate('METRIC', { key: 'score', label: 'Focus Score', allMetrics: state.metrics })}
                >
                    <div className="bg-[#1C1C1E] h-full rounded-[22px] border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-lg cursor-pointer hover:border-white/20 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

                        {/* Details Top */}
                        <div className="absolute top-5 left-5 flex items-center gap-1.5 text-orange-400/80">
                            <Flame size={14} fill="currentColor" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">4 Day Streak</span>
                        </div>

                        <FocusGauge metrics={state.metrics} recoveryProgress={state.sessionState === 'RECOVERY' ? state.recoveryProgress : undefined} />

                        {/* Details Bottom */}
                        <div className="absolute bottom-5 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                <Trophy size={12} className="text-yellow-400" />
                                <span className="text-[10px] font-medium text-neutral-300">Top 10% Performance</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Weekly Summary */}
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 h-72 md:h-80">
                    <div
                        onClick={() => onNavigate('WEEKLY_OVERVIEW', { metrics: state.metrics, tasks: state.tasks })}
                        className="bg-[#1C1C1E] h-full border border-white/10 rounded-[22px] p-6 relative overflow-hidden hover:border-white/20 hover:bg-white/[0.02] transition-all flex flex-col group cursor-pointer"
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-2 z-10 relative gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-800 rounded-xl group-hover:bg-neutral-700 transition-colors text-white">
                                    <BarChart2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        Weekly Output <ArrowUpRight size={14} className="text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-[10px] text-neutral-500">Mon - Sun</p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                                <div className="flex items-center justify-start sm:justify-end gap-1.5">
                                    <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                                        {Math.floor((state.metrics?.deepWorkTrend?.reduce((a: number, b: number) => a + b, 0) || 0) / 60)}
                                        <span className="text-lg text-neutral-500">h</span>
                                        {Math.round((state.metrics?.deepWorkTrend?.reduce((a: number, b: number) => a + b, 0) || 0) % 60)}
                                        <span className="text-lg text-neutral-500">m</span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-start sm:justify-end gap-3 text-xs mt-1">
                                    <span className="font-medium text-neutral-500">Avg: {((state.metrics?.deepWorkTrend?.reduce((a: number, b: number) => a + b, 0) || 0) / 7 / 60).toFixed(1)}h/day</span>
                                    <span className="flex items-center gap-1 text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">
                                        <TrendingUp size={10} /> +12%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 w-full mt-2">
                            <TrendAnalysisChart
                                data={state.metrics.weeklyTrend}
                                title="" // Handled by outer container
                                color="bg-neutral-600 group-hover:bg-accent-blue"
                                lastWeekData={state.metrics.lastWeekTrend}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Compact Metrics Stack */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-2 lg:col-span-1 h-72 md:h-80 flex flex-col gap-6"
                >
                    <div className="flex-1 min-h-0">
                        <MetricCard
                            label="Deep Work"
                            value={Math.floor(state.metrics.deepWorkMinutes)}
                            unit="min"
                            color="text-blue-400"
                            trendData={state.metrics.deepWorkTrend}
                            onClick={() => onNavigate('METRIC', { key: 'deepWork', label: 'Deep Work', allMetrics: state.metrics })}
                        />
                    </div>
                    <div className="flex-1 min-h-0">
                        <MetricCard
                            label="Switches"
                            value={state.metrics.contextSwitches}
                            color="text-orange-400"
                            trendData={state.metrics.contextSwitchesTrend}
                            onClick={() => onNavigate('METRIC', { key: 'contextSwitches', label: 'Context Switches', allMetrics: state.metrics })}
                        />
                    </div>
                </motion.div>

                {/* Row 2.5: Live Activity Feed */}
                <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-4 h-80">
                    <LiveActivityFeed />
                </motion.div>

                {/* Row 3: Squad (Split) */}

                {/* Squad Contacts Card */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-2 lg:col-span-3 h-52 cursor-pointer relative group"
                    onClick={() => onNavigate('SQUAD', { squad: state.squad, feed: state.activityFeed })}
                >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px] pointer-events-none z-10" />
                    <SquadWidget squad={state.squad} onNudge={controls.triggerNudge} latestActivity={state.activityFeed[0]} />
                </motion.div>

                {/* Signal/Wave Card */}
                <motion.div
                    variants={itemVariants}
                    className="col-span-1 md:col-span-2 lg:col-span-1 h-52"
                >
                    <SignalWidget squad={state.squad} />
                </motion.div>

                {/* Row 4: Live Tracking Panel (Full Width) */}
                <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-4 h-72">
                    <LiveTrackingPanel
                        activities={liveActivities}
                        currentActivity={state.currentActivity}
                    />
                </motion.div>

            </motion.div>

            <ControlsPanel
                sessionState={state.sessionState}
                isPlaying={state.isPlaying}
                speedMultiplier={state.speedMultiplier}
                onTogglePlay={controls.togglePlay}
                onStartFocus={controls.startFocus}
                onResumeFocus={controls.resumeFocus}
                onTakeBreak={controls.takeBreak}
                onAddDistraction={controls.addDistraction}
                onTag={() => handleTagRequest(state.timeline[state.timeline.length - 1]?.id)}
                onToggleSpeed={() => controls.setSpeed(state.speedMultiplier === 1 ? 60 : 1)}
            />

            <TagModal
                isOpen={isTagModalOpen}
                onClose={() => { setIsTagModalOpen(false); setSelectedSegmentId(null); }}
                onTag={(tag) => {
                    const targetId = selectedSegmentId || state.timeline[state.timeline.length - 1]?.id;
                    if (targetId) controls.tagSegment(targetId, tag);
                }}
                onCreateProject={(projectData) => {
                    controls.createTask({
                        title: projectData.title,
                        project: projectData.category,
                        priority: 'MEDIUM'
                    });
                    const targetId = selectedSegmentId || state.timeline[state.timeline.length - 1]?.id;
                    if (targetId) controls.tagSegment(targetId, projectData.title);
                }}
            />

            <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <FocusSessionModal
                isOpen={isFocusModalOpen}
                onClose={() => setIsFocusModalOpen(false)}
                onStart={(payload) => {
                    session.startSession(payload).catch((error) => {
                        console.error('Failed to start focus session:', error);
                    });
                }}
            />

            <ZenMode
                isOpen={isZenModeOpen}
                onClose={() => setIsZenModeOpen(false)}
                activeTask={activeTask}
                currentTime={state.currentTime}
                metrics={state.metrics}
            />

            <BreakToast
                isVisible={showBreakToast}
                onDismiss={() => setShowBreakToast(false)}
                onTakeBreak={controls.takeBreak}
            />

            <ShortcutHUD />
        </div>
    );
};

export default Dashboard;
