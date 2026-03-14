
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Clock, Tag, Calendar, Zap, CheckCircle2,
    TrendingUp, StickyNote, Activity, Layers, X,
    Calculator, Bell, ChevronRight, Brain, Target, ShieldAlert,
    MoreHorizontal, Heart, Smartphone, Flame, BarChart3, Users, Briefcase, PieChart, Edit3, Save,
    AppWindow, Globe, Monitor, Code, PenTool, Terminal, Hash, Layout, MessageCircle, DollarSign, Trash2, Flag,
    CheckSquare, Paperclip, History, Plus, CalendarDays, Filter
} from 'lucide-react';
import { TimeSegment, Task, SquadMember, ActivityEvent, FocusMetrics } from '../../types';
import { getAllCategories } from '../../services/categoryApi';
import { trackingRuleApi } from '../../services/trackingRuleApi';
import { useDashboardStore } from '../../store/useDashboardStore';
import SyncWaveform from './SyncWaveform';
import TrendAnalysisChart from './TrendChart';
import TimelineScrubber from './TimelineScrubber';

export type DrillDownType = 'SESSION' | 'METRIC' | 'SQUAD' | 'PROJECT' | 'TASK' | 'DAILY_OVERVIEW' | 'WEEKLY_OVERVIEW';

interface DrillDownViewProps {
    viewType: DrillDownType;
    data: any; // Dynamic based on type
    onBack: () => void;
    onUpdateTags?: (tags: string[]) => void;
    onUpdateSegment?: (id: string, updates: Partial<TimeSegment>) => void;
    onUpdateTask?: (id: string, updates: Partial<Task>) => void;
    onDeleteTask?: (id: string) => void;
    tasks?: Task[];
    metrics?: FocusMetrics;
}

const DrillDownView: React.FC<DrillDownViewProps> = ({ viewType, data, onBack, onUpdateTags, onUpdateSegment, onUpdateTask, onDeleteTask, tasks = [], metrics }) => {
    const renderView = () => {
        switch (viewType) {
            case 'SESSION':
                return <SessionDetailView segment={data} onBack={onBack} onUpdateTags={onUpdateTags!} onUpdateSegment={onUpdateSegment} tasks={tasks} />;
            case 'METRIC':
                return <MetricDetailView metricKey={data.key} label={data.label} metrics={data.allMetrics} onBack={onBack} />;
            case 'SQUAD':
                return <SquadDetailView squad={data.squad} feed={data.feed} onBack={onBack} />;
            case 'PROJECT':
                return <ProjectDetailView project={data} onBack={onBack} />;
            case 'TASK':
                return <TaskDetailView task={data} onBack={onBack} onUpdate={onUpdateTask} onDelete={onDeleteTask} />;
            case 'DAILY_OVERVIEW':
                return <DailyOverviewDetail timeline={data.timeline} currentTime={data.currentTime} onBack={onBack} onUpdateSegment={onUpdateSegment} />;
            case 'WEEKLY_OVERVIEW':
                return <WeeklyOverviewDetail metrics={data.metrics} tasks={data.tasks} onBack={onBack} />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[100] bg-[#050505] text-white overflow-y-auto selection:bg-accent-blue/30"
        >
            {renderView()}
        </motion.div>
    );
};

// --- Shared Components ---

const BackButton = ({ onClick, label = "Dashboard" }: { onClick: () => void, label?: string }) => (
    <button
        onClick={onClick}
        className="group flex items-center gap-3 pl-2 pr-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all backdrop-blur-xl sticky top-4 sm:top-6 z-50 w-fit"
    >
        <div className="p-1.5 rounded-full bg-black/40 group-hover:bg-black/60 transition-colors border border-white/5">
            <ArrowLeft size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors tracking-wide">{label}</span>
    </button>
);

const Card = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className={`bg-[#121212] border border-white/10 rounded-[2rem] overflow-hidden relative ${className}`}
    >
        {children}
    </motion.div>
);

const SectionHeader = ({ title, icon: Icon, color = "text-neutral-500" }: { title: string, icon?: any, color?: string }) => (
    <div className="flex items-center gap-2 mb-6 px-1">
        {Icon && <Icon size={14} className={color} />}
        <h3 className={`text-xs font-bold uppercase tracking-[0.15em] ${color}`}>{title}</h3>
    </div>
);

const getIsoWeekLabel = (date: Date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `Week ${weekNo}`;
};

// --- New: Daily Overview Detail ---

const DailyOverviewDetail: React.FC<{
    timeline: TimeSegment[],
    currentTime: Date,
    onBack: () => void,
    onUpdateSegment?: (id: string, u: Partial<TimeSegment>) => void
}> = ({ timeline, currentTime, onBack, onUpdateSegment }) => {

    // Sort timeline by start time
    const sortedTimeline = [...timeline].sort((a, b) => a.start - b.start);

    // Calculate stats
    const focusTime = timeline.filter(t => t.type === 'FOCUS').reduce((acc, t) => acc + (t.end - t.start), 0);
    const breakTime = timeline.filter(t => t.type === 'BREAK').reduce((acc, t) => acc + (t.end - t.start), 0);
    const sessions = timeline.filter(t => t.type === 'FOCUS').length;

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-10 min-h-screen">
            <div className="flex justify-between items-start mb-12">
                <BackButton onClick={onBack} />
                <div className="flex gap-2">
                    <span className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-neutral-400 border border-white/10">
                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="mb-12">
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">Daily Overview</h1>
                <div className="flex flex-wrap gap-8">
                    <div>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">Total Focus</span>
                        <span className="text-3xl font-mono text-white tracking-tight">{Math.floor(focusTime / 60)}h {focusTime % 60}m</span>
                    </div>
                    <div>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">Sessions</span>
                        <span className="text-3xl font-mono text-white tracking-tight">{sessions}</span>
                    </div>
                    <div>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">Break Time</span>
                        <span className="text-3xl font-mono text-neutral-400 tracking-tight">{Math.floor(breakTime / 60)}h {breakTime % 60}m</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Timeline Scrubber Large */}
                <Card className="p-1 h-64 bg-[#1C1C1E] border-white/10">
                    <div className="h-full w-full relative">
                        <div className="absolute top-4 left-6 z-10 pointer-events-none">
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Timeline Visualization</span>
                        </div>
                        <TimelineScrubber
                            timeline={timeline}
                            currentTime={currentTime}
                            onUpdateSegment={onUpdateSegment}
                        />
                    </div>
                </Card>

                {/* Session Agenda */}
                <Card className="p-6 sm:p-8">
                    <SectionHeader title="Session Log" icon={CalendarDays} />
                    <div className="space-y-1">
                        {sortedTimeline.map((seg, i) => {
                            const startTime = new Date();
                            startTime.setHours(Math.floor(seg.start / 60), seg.start % 60);
                            const endTime = new Date();
                            endTime.setHours(Math.floor(seg.end / 60), seg.end % 60);

                            return (
                                <div key={seg.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                                    <div className="w-full sm:w-16 text-xs text-neutral-500 font-mono sm:text-right shrink-0">
                                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>

                                    <div className="hidden sm:block relative">
                                        <div className={`w-3 h-3 rounded-full border-2 border-[#121212] ${seg.type === 'FOCUS' ? 'bg-accent-blue' :
                                                seg.type === 'BREAK' ? 'bg-accent-green' :
                                                    seg.type === 'MEETING' ? 'bg-accent-purple' : 'bg-neutral-600'
                                            }`} />
                                        {i !== sortedTimeline.length - 1 && (
                                            <div className="absolute top-3 left-1.5 bottom-[-20px] w-px bg-white/10 -translate-x-1/2" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                            <span className="text-sm font-bold text-white truncate max-w-full">
                                                {seg.userTitle || seg.type}
                                            </span>
                                            {seg.tags?.map(t => (
                                                <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-neutral-400 uppercase tracking-wide">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-xs text-neutral-500 truncate">
                                            {Math.floor(seg.end - seg.start)} minutes • {seg.notes || 'No notes'}
                                        </div>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                                        <button className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white">
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- New: Weekly Overview Detail ---

const WeeklyOverviewDetail: React.FC<{
    metrics: FocusMetrics,
    tasks: Task[],
    onBack: () => void
}> = ({ metrics, tasks, onBack }) => {

    // Group tasks by project for distribution
    const projectStats = useMemo(() => {
        const map: Record<string, number> = {};
        let total = 0;
        tasks.forEach(t => {
            const val = t.timeSpent || 0;
            if (val > 0) {
                map[t.project] = (map[t.project] || 0) + val;
                total += val;
            }
        });
        return Object.entries(map).map(([name, val]) => ({ name, val, pct: (val / total) * 100 })).sort((a, b) => b.val - a.val);
    }, [tasks]);

    const deepWorkHours = Math.floor((metrics.deepWorkMinutes || 0) / 60);
    const deepWorkRemainderMinutes = Math.round((metrics.deepWorkMinutes || 0) % 60);
    const efficiencyScore = Math.max(0, Math.min(100, Math.round(metrics.focusScore || 0)));

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-10 min-h-screen">
            <div className="flex justify-between items-start mb-12">
                <BackButton onClick={onBack} />
                <div className="flex gap-2">
                    <span className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-neutral-400 border border-white/10">
                        {getIsoWeekLabel(new Date())}
                    </span>
                </div>
            </div>

            <div className="mb-12">
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">Weekly Output</h1>
                <div className="flex flex-wrap gap-8">
                    <div>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">Deep Work</span>
                        <span className="text-3xl font-mono text-white tracking-tight">{deepWorkHours}h {deepWorkRemainderMinutes}m</span>
                    </div>
                    <div>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">Efficiency</span>
                        <span className="text-3xl font-mono text-green-400 tracking-tight">{efficiencyScore}%</span>
                    </div>
                    <div>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">Tasks Completed</span>
                        <span className="text-3xl font-mono text-white tracking-tight">{tasks.filter(t => t.status === 'DONE').length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Chart */}
                <Card className="lg:col-span-8 p-6 sm:p-8 h-80 sm:h-96">
                    <TrendAnalysisChart
                        data={metrics.weeklyTrend}
                        lastWeekData={metrics.lastWeekTrend}
                        title="Focus Performance"
                        color="bg-accent-blue"
                    />
                </Card>

                {/* Project Breakdown */}
                <Card className="lg:col-span-4 p-6 sm:p-8">
                    <SectionHeader title="Project Distribution" icon={PieChart} />
                    <div className="space-y-5 mt-4">
                        {projectStats.map((p, i) => (
                            <div key={p.name}>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="font-bold text-white flex items-center gap-2 min-w-0 flex-1">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : 'bg-neutral-600'}`} />
                                        <span className="truncate">{p.name}</span>
                                    </span>
                                    <span className="text-neutral-400 font-mono shrink-0 ml-2">{Math.floor(p.val / 60)}h</span>
                                </div>
                                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${p.pct}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : 'bg-neutral-600'}`}
                                    />
                                </div>
                            </div>
                        ))}
                        {projectStats.length === 0 && (
                            <div className="text-neutral-500 text-xs italic text-center py-8">No data recorded this week.</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// ... (Rest of existing DrillDownView components: TaskDetailView, SessionDetailView, ProjectDetailView, MetricDetailView, SquadDetailView) ...

// --- Task Detail View ---

const TaskDetailView: React.FC<{
    task: Task,
    onBack: () => void,
    onUpdate?: (id: string, updates: Partial<Task>) => void,
    onDelete?: (id: string) => void
}> = ({ task, onBack, onUpdate, onDelete }) => {
    const liveActivities = useDashboardStore(s => s.liveActivities);
    const [title, setTitle] = useState(task.title);
    const [notes, setNotes] = useState(task.notes || '');
    const [priority, setPriority] = useState(task.priority);
    const [billable, setBillable] = useState(task.billable || false);
    const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');

    // Mock Subtasks
    const [subtasks, setSubtasks] = useState([
        { id: 1, text: 'Initial research and scoping', done: true },
        { id: 2, text: 'Draft technical specifications', done: false },
        { id: 3, text: 'Review with stakeholders', done: false },
    ]);

    // Debounced save
    useEffect(() => {
        const timer = setTimeout(() => {
            if (title !== task.title || notes !== (task.notes || '')) {
                onUpdate?.(task.id, { title, notes });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [title, notes, task.id, onUpdate]);

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            onDelete?.(task.id);
            onBack();
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-10 min-h-screen">
            <div className="flex justify-between items-start mb-8">
                <BackButton onClick={onBack} label="Back to Board" />
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-colors">
                        <History size={14} /> Log Work
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>

            {/* Header / Title */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={10} /> {task.project}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={10} /> {task.client || 'Internal'}
                    </span>
                    <div className="ml-auto flex items-center gap-2 text-xs font-mono text-neutral-500">
                        <span>ID: {task.id.substring(0, 6).toUpperCase()}</span>
                    </div>
                </div>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-4xl sm:text-5xl font-bold text-white outline-none placeholder:text-neutral-700 leading-tight"
                    placeholder="Task Title"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Subtasks */}
                    <Card className="p-6">
                        <SectionHeader title="Subtasks" icon={CheckSquare} />
                        <div className="space-y-3">
                            {subtasks.map(st => (
                                <div key={st.id} className="flex items-start gap-3 group">
                                    <button
                                        onClick={() => setSubtasks(subtasks.map(s => s.id === st.id ? { ...s, done: !s.done } : s))}
                                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${st.done ? 'bg-accent-blue border-accent-blue' : 'border-neutral-600 hover:border-neutral-400'}`}
                                    >
                                        {st.done && <CheckCircle2 size={14} className="text-white" />}
                                    </button>
                                    <span className={`text-sm ${st.done ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>{st.text}</span>
                                </div>
                            ))}
                            <button className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-white mt-4 pl-1">
                                <Plus size={14} /> Add Subtask
                            </button>
                        </div>
                    </Card>

                    {/* Notes Section */}
                    <Card className="p-6">
                        <SectionHeader title="Description" icon={StickyNote} />
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add detailed notes, requirements, or links..."
                            className="w-full bg-transparent text-sm text-neutral-300 min-h-[200px] outline-none resize-none leading-relaxed placeholder:text-neutral-700 font-mono"
                        />
                    </Card>

                    {/* Activity Log */}
                    <div className="pt-4">
                        <SectionHeader title="Activity" icon={Activity} />
                        <div className="space-y-6 pl-4 border-l border-white/10 ml-2">
                            {liveActivities
                                .filter((activity) => {
                                    const windowTitle = (activity.window_title || '').toLowerCase();
                                    const taskTitle = task.title.toLowerCase();
                                    return windowTitle.includes(taskTitle);
                                })
                                .slice(0, 4)
                                .map((activity) => (
                                    <div key={activity._id || `${activity.app_name}-${activity.start_time}`} className="relative">
                                        <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 bg-neutral-800 rounded-full border border-neutral-600" />
                                        <div className="flex gap-2 items-center text-xs text-neutral-400">
                                            <span className="font-bold text-white">{activity.app_name || 'System'}</span>
                                            <span className="truncate">{activity.window_title || 'Activity captured'}</span>
                                            <span className="text-neutral-600 ml-auto">
                                                {new Date(activity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            {liveActivities.filter((activity) => {
                                const windowTitle = (activity.window_title || '').toLowerCase();
                                const taskTitle = task.title.toLowerCase();
                                return windowTitle.includes(taskTitle);
                            }).length === 0 && (
                                <div className="text-xs text-neutral-500">No tracked activity linked to this task yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <SectionHeader title="Properties" icon={Target} />

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">Priority</label>
                                <div className="flex gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => { setPriority(p as any); onUpdate?.(task.id, { priority: p as any }); }}
                                            className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${priority === p
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-neutral-900 border-white/5 text-neutral-500 hover:text-white'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">Due Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => { setDueDate(e.target.value); onUpdate?.(task.id, { dueDate: e.target.value ? new Date(e.target.value) : undefined }); }}
                                        className="w-full bg-neutral-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-accent-blue transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Billable</label>
                                <button
                                    onClick={() => { setBillable(!billable); onUpdate?.(task.id, { billable: !billable }); }}
                                    className={`w-10 h-6 rounded-full relative transition-colors ${billable ? 'bg-green-500' : 'bg-neutral-800'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${billable ? 'left-5' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <SectionHeader title="Attachments" icon={Paperclip} />
                        <div className="border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                            <Paperclip size={20} className="text-neutral-500 group-hover:text-white mb-2" />
                            <span className="text-xs text-neutral-400">Drop files to attach</span>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <SectionHeader title="Time Tracking" icon={Clock} />
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-400">Total Spent</span>
                                <span className="text-sm font-mono text-white font-bold">{Math.floor((task.timeSpent || 0) / 60)}h {Math.round((task.timeSpent || 0) % 60)}m</span>
                            </div>
                            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-blue w-3/4" />
                            </div>
                            <div className="text-[10px] text-neutral-500 text-center">Estimated: 4h 00m</div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// --- Session Detail View ---

const SessionDetailView: React.FC<{
    segment: TimeSegment,
    onBack: () => void,
    onUpdateTags: (t: string[]) => void,
    onUpdateSegment?: (id: string, u: Partial<TimeSegment>) => void,
    tasks: Task[]
}> = ({ segment, onBack, onUpdateTags, onUpdateSegment, tasks }) => {
    const liveActivities = useDashboardStore(s => s.liveActivities);
    const [newTag, setNewTag] = useState('');
    const [title, setTitle] = useState(segment.userTitle || (segment.tags?.[0] || 'Deep Work'));
    const [notes, setNotes] = useState(segment.notes || '');

    // --- Auto-Rule Suggestion State ---
    const [suggestRulePrompt, setSuggestRulePrompt] = useState<{ message: string, suggestedPattern: string, suggestedCategoryName?: string } | null>(null);

    const handleCreateRule = async () => {
        if (!suggestRulePrompt) return;
        try {
            const { data: categories } = await getAllCategories(1, 200);
            const normalizedSuggested = (suggestRulePrompt.suggestedCategoryName || '').toLowerCase();
            const matched = categories.find(category => category.name.toLowerCase() === normalizedSuggested)
                || categories.find(category => Boolean(category.isDefault))
                || categories[0];

            if (!matched?._id) {
                throw new Error('No category available to create a tracking rule.');
            }

            await trackingRuleApi.createRuleFromOverride(suggestRulePrompt.suggestedPattern, matched._id);

            setSuggestRulePrompt(null);
            alert("Global rule created successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to create rule.");
        }
    };

    const simulateRecategorize = (appName: string) => {
        const suggestedCategoryName = segment.tags?.[0];
        setSuggestRulePrompt({
            message: `Create a global tracking rule to always categorize '${appName}' automatically?`,
            suggestedPattern: appName,
            suggestedCategoryName
        });
    };

    const resolveAppIcon = (appName: string) => {
        const normalized = appName.toLowerCase();
        if (normalized.includes('code') || normalized.includes('studio')) return Code;
        if (normalized.includes('term')) return Terminal;
        if (normalized.includes('figma')) return PenTool;
        if (normalized.includes('slack')) return MessageCircle;
        if (normalized.includes('browser') || normalized.includes('chrome') || normalized.includes('arc') || normalized.includes('firefox')) return Globe;
        return AppWindow;
    };

    const extractDomain = (url?: string) => {
        if (!url) return null;
        try {
            return new URL(url).hostname;
        } catch {
            return null;
        }
    };

    const usageData = useMemo(() => {
        const sessionActivities = liveActivities.filter((activity) => {
            const startTime = new Date(activity.start_time || activity.createdAt || '');
            if (Number.isNaN(startTime.getTime())) return false;
            const minutes = startTime.getHours() * 60 + startTime.getMinutes();
            return minutes >= segment.start && minutes <= segment.end;
        });

        const relevantActivities = sessionActivities.length > 0
            ? sessionActivities
            : [
                {
                    app_name: segment.userTitle || segment.type,
                    window_title: segment.notes || segment.userTitle || segment.type,
                    start_time: new Date().toISOString(),
                    end_time: new Date().toISOString(),
                    url: '',
                } as any,
            ];

        const appDurations = new Map<string, number>();
        const siteDurations = new Map<string, number>();

        relevantActivities.forEach((activity) => {
            const start = new Date(activity.start_time || activity.createdAt || '');
            const end = activity.end_time ? new Date(activity.end_time) : start;
            const rawMinutes = (end.getTime() - start.getTime()) / 60000;
            const durationMinutes = Number.isFinite(rawMinutes) && rawMinutes > 0 ? rawMinutes : 1;
            const appName = activity.app_name || 'Unknown App';

            appDurations.set(appName, (appDurations.get(appName) || 0) + durationMinutes);

            const domain = extractDomain(activity.url);
            if (domain) {
                siteDurations.set(domain, (siteDurations.get(domain) || 0) + durationMinutes);
            }
        });

        const totalAppMinutes = Array.from(appDurations.values()).reduce((sum, val) => sum + val, 0) || 1;
        const totalSiteMinutes = Array.from(siteDurations.values()).reduce((sum, val) => sum + val, 0) || 1;

        const apps = Array.from(appDurations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, minutes], index) => ({
                name,
                icon: resolveAppIcon(name),
                time: `${Math.max(1, Math.round(minutes))}m`,
                percent: Math.max(1, Math.round((minutes / totalAppMinutes) * 100)),
                color: index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : index === 2 ? 'bg-green-500' : 'bg-neutral-500',
            }));

        const sites = Array.from(siteDurations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([domain, minutes]) => ({
                domain,
                time: `${Math.max(1, Math.round(minutes))}m`,
                percent: Math.max(1, Math.round((minutes / totalSiteMinutes) * 100)),
            }));

        const windows = relevantActivities
            .map((activity) => {
                const ts = new Date(activity.start_time || activity.createdAt || '');
                return {
                    time: Number.isNaN(ts.getTime()) ? '--:--' : ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    title: activity.window_title || activity.app_name || 'Untitled Activity',
                    app: activity.app_name || 'Unknown App',
                };
            })
            .slice(0, 10);

        return { apps, sites, windows };
    }, [liveActivities, segment.end, segment.notes, segment.start, segment.type, segment.userTitle]);

    // Sync local state if prop changes
    useEffect(() => {
        setTitle(segment.userTitle || (segment.tags?.[0] || 'Deep Work'));
        setNotes(segment.notes || '');
    }, [segment]);

    const duration = Math.floor(segment.end - segment.start);
    const startTime = new Date();
    startTime.setHours(Math.floor(segment.start / 60), segment.start % 60);

    const handleSave = () => {
        if (onUpdateSegment) {
            onUpdateSegment(segment.id, { userTitle: title, notes: notes });
        }
    };

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTag.trim()) {
            onUpdateTags([...(segment.tags || []), newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        onUpdateTags((segment.tags || []).filter(t => t !== tag));
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-10 min-h-screen">
            <div className="flex justify-between items-start mb-8 sm:mb-12">
                <BackButton onClick={onBack} />
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-blue rounded-full text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <Save size={14} /> Save Changes
                    </button>
                    <div className="text-[10px] font-mono text-neutral-500 bg-white/5 px-3 py-2 rounded-full border border-white/5">
                        ID: <span className="text-white">{segment.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="mb-12 relative">
                <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-accent-blue/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4 mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${segment.type === 'FOCUS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            segment.type === 'BREAK' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                'bg-neutral-800 text-neutral-400 border-white/10'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${segment.type === 'FOCUS' ? 'bg-blue-400' : 'bg-currentColor'}`} />
                        {segment.type} SESSION
                    </span>
                    <div className="hidden sm:block h-px w-8 bg-white/10" />
                    <span className="text-neutral-400 text-sm font-medium tracking-wide">
                        {startTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </motion.div>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="group relative"
                        >
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleSave}
                                className="w-full bg-transparent text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter text-white mb-4 leading-[0.9] border-none outline-none placeholder:text-neutral-700"
                                placeholder="Session Title"
                            />
                            <Edit3 className="absolute top-1/2 right-full mr-4 -translate-y-1/2 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                        </motion.div>
                        <div className="flex gap-4 items-center">
                            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/20">+15 Focus Points</span>
                            <span className="text-neutral-500 text-base">High-intensity cognitive block. Sustained flow state detected.</span>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-8 text-neutral-400 bg-white/5 px-6 py-4 rounded-3xl border border-white/10 backdrop-blur-md self-start lg:self-end"
                    >
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">Start Time</span>
                            <span className="text-xl text-white font-mono">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">Duration</span>
                            <span className="text-xl text-white font-mono">{duration}<span className="text-sm text-neutral-500 ml-1">min</span></span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">

                {/* Main Viz: Session Anatomy */}
                <Card className="col-span-1 md:col-span-8 p-6 sm:p-8 min-h-[300px] flex flex-col justify-between" delay={0.3}>
                    <div className="flex justify-between items-start mb-6">
                        <SectionHeader title="Session Anatomy" icon={Activity} color="text-indigo-400" />
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                                <div className="w-2 h-2 rounded-full bg-blue-500" /> Deep Work
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                                <div className="w-2 h-2 rounded-full bg-red-500" /> Distraction
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="h-24 sm:h-32 w-full relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent z-10" />
                            <SyncWaveform isActive={true} isDistracted={segment.type === 'DISTRACTED'} />
                        </div>

                        {/* Timeline Block Viz */}
                        <div className="mt-4 h-4 w-full flex rounded-full overflow-hidden opacity-80">
                            <div className="bg-blue-600 h-full" style={{ width: '60%' }} />
                            <div className="bg-blue-500 h-full" style={{ width: '20%' }} />
                            <div className="bg-red-500 h-full" style={{ width: '5%' }} />
                            <div className="bg-blue-600 h-full" style={{ width: '15%' }} />
                        </div>
                    </div>
                </Card>

                {/* Notes & Tags */}
                <Card className="col-span-1 md:col-span-4 p-6" delay={0.4}>
                    <SectionHeader title="Context & Notes" icon={StickyNote} color="text-neutral-400" />
                    <div className="space-y-6">
                        <div>
                            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-2">Tags</span>
                            <div className="flex flex-wrap gap-2">
                                {segment.tags?.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-neutral-300 group hover:border-white/20 transition-all">
                                        <Hash size={10} className="text-neutral-500" />
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"><X size={12} /></button>
                                    </span>
                                ))}
                                <form onSubmit={handleAddTag} className="inline-block">
                                    <input
                                        type="text"
                                        placeholder="+ Tag"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        className="bg-transparent border border-dashed border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-500 placeholder:text-neutral-700 focus:outline-none focus:border-blue-500 focus:text-white transition-all w-16 focus:w-24 hover:border-white/20 hover:text-neutral-300"
                                    />
                                </form>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-2">Notes</span>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                onBlur={handleSave}
                                placeholder="Add session notes..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue transition-colors min-h-[100px] resize-none font-mono"
                            />
                        </div>
                    </div>
                </Card>

                {/* --- USAGE DATA ROW --- */}

                {/* App Usage */}
                <Card className="col-span-1 md:col-span-4 p-6" delay={0.5}>
                    <SectionHeader title="Apps Used" icon={AppWindow} color="text-white" />
                    <div className="space-y-4">
                        {usageData.apps.map((app, i) => (
                            <div key={i} className="flex items-center gap-3 group relative">
                                <div className={`p-2 rounded-lg bg-white/5 text-neutral-400`}>
                                    <app.icon size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-neutral-200">{app.name}</span>
                                        <span className="text-neutral-500">{app.time}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${app.color}`} style={{ width: `${app.percent}%` }} />
                                    </div>
                                </div>
                                <div className="absolute right-0 top-0 bottom-0 pr-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => simulateRecategorize(app.name)}
                                        className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md border border-white/10 shrink-0"
                                        title="Simulate modifying this app's category"
                                    >
                                        Recategorize
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Websites */}
                <Card className="col-span-1 md:col-span-4 p-6" delay={0.6}>
                    <SectionHeader title="Websites" icon={Globe} color="text-white" />
                    <div className="space-y-1">
                        {usageData.sites.map((site, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-400 border border-white/5">
                                        {site.domain[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm text-neutral-300 truncate">{site.domain}</span>
                                </div>
                                <span className="text-xs text-neutral-500 font-mono">{site.time}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Window History */}
                <Card className="col-span-1 md:col-span-4 p-6" delay={0.7}>
                    <SectionHeader title="Window History" icon={Monitor} color="text-white" />
                    <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-white/10 h-full overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {usageData.windows.map((win, i) => (
                            <div key={i} className="relative group">
                                <div className="absolute -left-[15px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-800 border-2 border-neutral-600 group-hover:border-accent-blue transition-colors" />
                                <div className="text-[10px] text-neutral-500 font-mono mb-0.5">{win.time}</div>
                                <div className="text-sm text-neutral-200 font-medium leading-tight">{win.title}</div>
                                <div className="text-[10px] text-neutral-600 mt-0.5">{win.app}</div>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>

            {/* Auto-Rule Popup */}
            {suggestRulePrompt && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSuggestRulePrompt(null)} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-titanium-dark border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-4 text-accent-blue">
                            <Brain size={24} />
                            <h3 className="text-lg font-bold text-white">Smart Rule Suggestion</h3>
                        </div>
                        <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
                            {suggestRulePrompt.message}
                            <br /><br />
                            <span className="text-neutral-500 text-xs">This ensures future activities matching this pattern do not require manual tagging.</span>
                        </p>

                        <div className="bg-neutral-900 border border-white/10 rounded-xl p-3 mb-6 font-mono text-xs text-neutral-400">
                            Pattern: <span className="text-white">"{suggestRulePrompt.suggestedPattern}"</span>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setSuggestRulePrompt(null)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-neutral-400 hover:text-white transition-colors"
                            >
                                Not Now
                            </button>
                            <button
                                onClick={handleCreateRule}
                                className="px-5 py-2 rounded-lg text-sm font-bold bg-accent-blue text-white hover:bg-blue-600 shadow-lg shadow-blue-900/20 transition-colors"
                            >
                                Save Rule
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

// --- Project Detail View ---

const ProjectDetailView: React.FC<{ project: Task, onBack: () => void }> = ({ project, onBack }) => {
    const tasks = useDashboardStore(s => s.tasks);
    const squad = useDashboardStore(s => s.squad);
    const projectTasks = tasks.filter((task: any) => task.project === project.project);
    const totalMinutes = projectTasks.reduce((sum: number, task: any) => sum + (task.timeSpent || 0), 0);
    const completedCount = projectTasks.filter((task: any) => task.status === 'DONE').length;
    const efficiency = projectTasks.length === 0 ? 0 : Math.round((completedCount / projectTasks.length) * 100);
    const earliestDueDate = projectTasks
        .map((task: any) => task.dueDate)
        .filter(Boolean)
        .sort()[0];

    const weekdayMinutes: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    projectTasks.forEach((task: any) => {
        if (!task.updatedAt || !task.timeSpent) return;
        const weekday = new Date(task.updatedAt).getDay();
        weekdayMinutes[weekday] += task.timeSpent;
    });
    const weeklyActivity = [1, 2, 3, 4, 5, 6, 0].map((day) => weekdayMinutes[day] / 60);

    const projectMembers = squad.slice(0, 3);

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-10 min-h-screen">
            <div className="flex justify-between items-start mb-12">
                <BackButton onClick={onBack} label="Projects" />
                <button className="px-4 py-2 bg-accent-blue rounded-xl text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20">
                    Edit Project
                </button>
            </div>

            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/5">
                        {project.project || 'General'}
                    </span>
                    <div className="h-px w-10 bg-white/10" />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${project.status === 'DONE' ? 'text-green-400' : project.status === 'IN_PROGRESS' ? 'text-blue-400' : 'text-neutral-500'
                        }`}>
                        {project.status.replace('_', ' ')}
                    </span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">{project.title}</h1>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="text-neutral-500 text-xs font-bold uppercase mb-1">Total Time</div>
                        <div className="text-2xl font-mono text-white">{Math.floor(totalMinutes / 60)}h {Math.round(totalMinutes % 60)}m</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="text-neutral-500 text-xs font-bold uppercase mb-1">Sessions</div>
                        <div className="text-2xl font-mono text-white">{projectTasks.length}</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="text-neutral-500 text-xs font-bold uppercase mb-1">Efficiency</div>
                        <div className="text-2xl font-mono text-green-400">{efficiency}%</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="text-neutral-500 text-xs font-bold uppercase mb-1">Deadline</div>
                        <div className="text-2xl font-mono text-white">{earliestDueDate ? new Date(earliestDueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
                {/* Weekly Trend */}
                <Card className="col-span-1 md:col-span-8 p-6" delay={0.1}>
                    <SectionHeader title="Time Investment" icon={BarChart3} />
                    <div className="flex items-end gap-3 h-48 mt-6">
                        {weeklyActivity.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                                <div className="w-full bg-neutral-800 rounded-lg relative overflow-hidden group-hover:bg-accent-blue transition-colors" style={{ height: `${(val / 6) * 100}%` }}>
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <div className="text-[10px] text-center text-neutral-600 font-mono">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Team Members */}
                <Card className="col-span-1 md:col-span-4 p-6" delay={0.2}>
                    <SectionHeader title="Team" icon={Users} />
                    <div className="space-y-4">
                        {projectMembers.map((m, index) => (
                            <div key={m.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-green-500'}`}>
                                        {m.name[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{m.name}</div>
                                        <div className="text-[10px] text-neutral-500">{m.role || 'Member'}</div>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-neutral-400">{Math.floor(totalMinutes / Math.max(1, projectMembers.length) / 60)}h</span>
                            </div>
                        ))}
                        {projectMembers.length === 0 && <div className="text-xs text-neutral-500">No team members available.</div>}
                    </div>
                </Card>

                {/* Recent Tasks List */}
                <div className="col-span-1 md:col-span-12">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Tasks</h3>
                    <div className="space-y-3">
                        {projectTasks.slice(0, 6).map((task, i) => (
                            <motion.div
                                key={task.id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (i * 0.05) }}
                                className="bg-[#121212] border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${task.status === 'DONE' ? 'bg-accent-blue border-accent-blue' : 'border-neutral-600'}`}>
                                        {task.status === 'DONE' && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                    <span className={`text-sm ${task.status === 'DONE' ? 'text-neutral-500 line-through' : 'text-white'}`}>{task.title}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-neutral-700 border border-[#121212]" />
                                    </div>
                                    <div className="px-2 py-1 bg-neutral-800 rounded text-[10px] text-neutral-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No due'}</div>
                                </div>
                            </motion.div>
                        ))}
                        {projectTasks.length === 0 && (
                            <div className="text-xs text-neutral-500">No tasks found for this project yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Metric Detail View ---

const MetricDetailView: React.FC<{ metricKey: string, label: string, metrics: FocusMetrics, onBack: () => void }> = ({ metricKey, label, metrics, onBack }) => {
    // ... same as before
    const getLogicData = () => {
        const baseClass = "px-3 py-2 rounded-xl font-mono text-sm font-bold flex items-center justify-between w-full border transition-all";
        switch (metricKey) {
            case 'score':
                return {
                    terms: [
                        { label: 'Base Potential', val: 70, style: `${baseClass} bg-neutral-900 border-neutral-800 text-neutral-400`, op: '' },
                        { label: 'Deep Work Bonus', val: `+${Math.min(30, Math.floor((metrics.deepWorkMinutes / 60) * 5))}`, style: `${baseClass} bg-blue-500/10 border-blue-500/20 text-blue-400`, op: '+' },
                        { label: 'Distraction Penalty', val: `-${metrics.contextSwitches * 2}`, style: `${baseClass} bg-red-500/10 border-red-500/20 text-red-400`, op: '-' },
                    ],
                    total: metrics.focusScore,
                    unit: '/ 100',
                    desc: "Your Focus Score is a weighted index of cognitive depth versus interruptions.",
                    chartData: metrics.weeklyTrend,
                    drivers: {
                        positive: ["Long Focus Streak (>45m)", "Low App Switching"],
                        negative: ["2 Slack Interruptions"]
                    }
                };
            case 'deepWork':
                return {
                    terms: [
                        { label: 'Raw Duration', val: `${Math.floor(metrics.deepWorkMinutes)}m`, style: `${baseClass} bg-neutral-900 border-neutral-800 text-white`, op: '' },
                        { label: 'Intensity Multiplier', val: 'x1.0', style: `${baseClass} bg-green-500/10 border-green-500/20 text-green-400`, op: '×' },
                    ],
                    total: Math.floor(metrics.deepWorkMinutes),
                    unit: 'min',
                    desc: "Accumulated time spent in high-cognitive load states without task switching.",
                    chartData: metrics.deepWorkTrend,
                    drivers: {
                        positive: ["Morning Session Consistency"],
                        negative: ["Late Start (+15m delay)"]
                    }
                };
            case 'contextSwitches':
                return {
                    terms: [
                        { label: 'Active App Switch', val: metrics.contextSwitches, style: `${baseClass} bg-neutral-900 border-neutral-800 text-orange-400`, op: '' },
                        { label: 'Notification Intent', val: 0, style: `${baseClass} bg-neutral-900 border-neutral-800 text-neutral-500`, op: '+' },
                    ],
                    total: metrics.contextSwitches,
                    unit: 'count',
                    desc: "Frequency of attention shifts away from the primary active window.",
                    chartData: metrics.contextSwitchesTrend,
                    drivers: {
                        positive: ["DND Mode Enabled"],
                        negative: ["Email Checking"]
                    }
                };
            default:
                return { terms: [], total: 0, unit: '', desc: '', chartData: [], drivers: { positive: [], negative: [] } };
        }
    };

    const logic = getLogicData();
    const maxVal = Math.max(...logic.chartData, 10);

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-10 min-h-screen flex flex-col">
            <BackButton onClick={onBack} />

            <div className="mt-12 mb-12 sm:mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-end">
                <div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5"><Calculator size={16} className="text-white" /></div>
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">Metric Analysis</span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter mb-4 sm:mb-6">{label}</motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-xl text-neutral-400 leading-relaxed max-w-md">{logic.desc}</motion.p>
                </div>

                {/* Big Number Display */}
                <Card className="p-6 sm:p-8 flex items-center justify-between bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]" delay={0.2}>
                    <div>
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Current Value</span>
                        <div className="text-5xl sm:text-6xl font-mono font-bold text-white tracking-tight">
                            {logic.total} <span className="text-lg sm:text-2xl text-neutral-600 font-normal">{logic.unit.replace('/ ', '')}</span>
                        </div>
                    </div>
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-4 border-white/10 flex items-center justify-center">
                        <TrendingUp size={20} className="text-green-500" />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
                {/* Logic Stack */}
                <Card className="col-span-1 md:col-span-7 p-6 sm:p-8" delay={0.3}>
                    <SectionHeader title="Calculation Logic" icon={Brain} color="text-indigo-400" />

                    <div className="space-y-4 mt-8 relative z-10">
                        {logic.terms.map((term, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className="flex items-center gap-2 sm:gap-4"
                            >
                                {term.op && <span className="text-neutral-600 font-mono text-lg sm:text-xl font-bold w-6 text-center">{term.op}</span>}
                                <div className={`${term.style} ${!term.op ? 'ml-8 sm:ml-10' : ''}`}>
                                    <span className="text-neutral-300 text-xs sm:text-sm">{term.label}</span>
                                    <span className="font-mono text-sm sm:text-lg">{term.val}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>

                {/* Trend Chart Area */}
                <Card className="col-span-1 md:col-span-5 p-6" delay={0.4}>
                    <div className="h-48">
                        <TrendAnalysisChart data={logic.chartData} title="Weekly Trend" />
                    </div>
                </Card>

                {/* Drivers */}
                <div className="col-span-1 md:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card className="p-6 bg-green-900/10 border-green-500/20">
                        <h4 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2"><CheckCircle2 size={16} /> Positive Drivers</h4>
                        <ul className="space-y-2">
                            {logic.drivers.positive.map((d, i) => (
                                <li key={i} className="text-sm text-green-200/80">• {d}</li>
                            ))}
                        </ul>
                    </Card>
                    <Card className="p-6 bg-red-900/10 border-red-500/20">
                        <h4 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2"><ShieldAlert size={16} /> Negative Factors</h4>
                        <ul className="space-y-2">
                            {logic.drivers.negative.map((d, i) => (
                                <li key={i} className="text-sm text-red-200/80">• {d}</li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// --- Squad Detail View ---
const SquadDetailView: React.FC<{ squad: SquadMember[], feed: ActivityEvent[], onBack: () => void }> = ({ squad, feed, onBack }) => {
    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-10 min-h-screen">
            <div className="flex justify-between items-start mb-12">
                <BackButton onClick={onBack} />
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10">Manage Team</button>
                    <button className="px-4 py-2 bg-accent-blue rounded-xl text-xs font-bold text-white hover:bg-blue-600">Invite Member</button>
                </div>
            </div>

            <div className="mb-12">
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">Squad Status</h1>
                <div className="flex gap-8">
                    <div>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">Active Members</span>
                        <span className="text-2xl font-mono text-white">{squad.length}</span>
                    </div>
                    <div>
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">Team Focus</span>
                        <span className="text-2xl font-mono text-green-400">88%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {squad.map((member, i) => (
                    <Card key={member.id} className="p-6" delay={i * 0.05}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white border border-white/10`} style={{ backgroundColor: member.avatarUrl && !member.avatarUrl.startsWith('#') ? 'transparent' : member.avatarUrl }}>
                                    {member.avatarUrl?.startsWith('#') && member.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{member.name}</h3>
                                    <p className="text-xs text-neutral-500">{member.role}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${member.status === 'FOCUS' ? 'bg-green-500/10 text-green-400' : 'bg-neutral-800 text-neutral-500'}`}>
                                {member.status}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-neutral-400">Focus Score</span>
                                    <span className="text-white font-bold">{member.status === 'FOCUS' ? 92 : member.status === 'RECOVERY' ? 78 : member.status === 'DISTRACTED' ? 64 : 72}</span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-blue"
                                        style={{ width: `${member.status === 'FOCUS' ? 92 : member.status === 'RECOVERY' ? 78 : member.status === 'DISTRACTED' ? 64 : 72}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                                <span className="text-neutral-500">Last Active</span>
                                <span className="text-neutral-300 font-mono">{member.lastActive}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default DrillDownView;
