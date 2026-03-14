
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, Plus, Trash2, Edit2, X, Check, Clock, Zap,
    Calendar, ChevronDown, AlertTriangle, Trophy, Flame,
    CheckCircle2, Circle, StickyNote
} from 'lucide-react';
import { Task } from '../../types';

// ── Types ────────────────────────────────────────────────────────────
export interface FocusGoal {
    _id?: string;
    title: string;
    target_deep_work: number;
    distraction_limit: number;
    priority_tasks: string[];
    notes: string;
    date: string;
    achieved: boolean;
}

import { DrillDownType } from '../dashboard/DrillDownView';

interface GoalsViewProps {
    onNavigate?: (type: DrillDownType, data: any) => void;
}

import { goalApi } from '../../services/goalApi';

// ── GoalsVimport { DrillDownType } from '../dashboard/DrillDownView';
import { useDashboardStore } from '../../store/useDashboardStore';

const GoalsView: React.FC<GoalsViewProps> = ({ onNavigate }) => {
    const { tasks, isLoading, error: storeError } = useDashboardStore();
    const state = { tasks };
    const [activeTab, setActiveTab] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY'>('WEEKLY');
    const [goals, setGoals] = useState<FocusGoal[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<FocusGoal | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Form State ──
    const emptyForm: FocusGoal = {
        title: '',
        target_deep_work: 120,
        distraction_limit: 5,
        priority_tasks: [],
        notes: '',
        date: new Date().toISOString().split('T')[0],
        achieved: false,
    };
    const [form, setForm] = useState<FocusGoal>(emptyForm);
    const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);

    // ── API Calls ──
    const fetchGoals = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await goalApi.getGoals();
            setGoals(response.data || []);
        } catch (e: any) {
            setError(e?.message || 'Could not load goals. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGoals(); }, []);

    const handleSubmit = async () => {
        if (!form.title.trim()) return;
        setLoading(true);
        setError(null);
        try {
            if (editingGoal?._id) {
                await goalApi.updateGoal(editingGoal._id, form);
            } else {
                await goalApi.createGoal(form);
            }
            await fetchGoals();
            resetForm();
        } catch {
            setError('Network error.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this goal?')) return;
        try {
            await goalApi.deleteGoal(id);
            await fetchGoals();
        } catch (e: any) {
            setError(e?.message || 'Failed to delete.');
        }
    };

    const handleToggleAchieved = async (goal: FocusGoal) => {
        try {
            if (!goal._id) return;
            await goalApi.updateGoal(goal._id, { achieved: !goal.achieved });
            await fetchGoals();
        } catch (e: any) {
            setError(e?.message || 'Failed to update.');
        }
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingGoal(null);
        setIsFormOpen(false);
        setTaskDropdownOpen(false);
    };

    const openEditForm = (goal: FocusGoal) => {
        setEditingGoal(goal);
        setForm({
            title: goal.title,
            target_deep_work: goal.target_deep_work,
            distraction_limit: goal.distraction_limit,
            priority_tasks: goal.priority_tasks || [],
            notes: goal.notes || '',
            date: goal.date ? goal.date.split('T')[0] : new Date().toISOString().split('T')[0],
            achieved: goal.achieved,
        });
        setIsFormOpen(true);
    };

    const togglePriorityTask = (taskTitle: string) => {
        setForm(prev => ({
            ...prev,
            priority_tasks: prev.priority_tasks.includes(taskTitle)
                ? prev.priority_tasks.filter(t => t !== taskTitle)
                : prev.priority_tasks.length < 3
                    ? [...prev.priority_tasks, taskTitle]
                    : prev.priority_tasks,
        }));
    };

    // ── Stats ──
    const todayStr = new Date().toISOString().split('T')[0];
    const todayGoal = goals.find(g => g.date?.split('T')[0] === todayStr);
    const achievedCount = goals.filter(g => g.achieved).length;
    const currentStreak = (() => {
        let streak = 0;
        const sorted = [...goals].filter(g => g.achieved).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const today = new Date(); today.setHours(0, 0, 0, 0);
        for (let i = 0; i < sorted.length; i++) {
            const d = new Date(sorted[i].date); d.setHours(0, 0, 0, 0);
            const expected = new Date(today); expected.setDate(expected.getDate() - i);
            if (d.getTime() === expected.getTime()) streak++;
            else break;
        }
        return streak;
    })();

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-24">

            {/* ── Header ── */}
            <header className="flex flex-col gap-8 mb-10">
                <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Daily Focus Goals</h1>
                        <p className="text-neutral-500">Set your intention each day and track your commitment.</p>
                    </div>
                    <button
                        onClick={() => { setEditingGoal(null); setForm(emptyForm); setIsFormOpen(true); }}
                        className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">New Goal</span>
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-accent-blue"><Trophy size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Goals Achieved</p>
                            <p className="text-xl font-bold text-white">{achievedCount} <span className="text-sm text-neutral-500 font-normal">/ {goals.length}</span></p>
                        </div>
                    </div>
                    <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-orange-400"><Flame size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Current Streak</p>
                            <p className="text-xl font-bold text-white">{currentStreak} <span className="text-sm text-neutral-500 font-normal">days</span></p>
                        </div>
                    </div>
                    <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-green-400"><Target size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Today's Goal</p>
                            <p className="text-xl font-bold text-white truncate max-w-[160px]">{todayGoal ? todayGoal.title : '—'}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Error Banner ── */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm"
                    >
                        <AlertTriangle size={16} /> {error}
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300"><X size={14} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Goal Creation / Edit Modal ── */}
            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={resetForm}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-[#1A1A1C] border border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="relative h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-end px-6 pb-4">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1A1A1C]" />
                                <div className="relative z-10 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent-blue flex items-center justify-center text-white shadow-lg">
                                        <Target size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">
                                        {editingGoal ? 'Edit Goal' : 'Set Today\'s Focus Goal'}
                                    </h3>
                                </div>
                                <button onClick={resetForm} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {/* Goal Title */}
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">Goal Title *</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g. Complete API integration"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors text-sm font-medium placeholder:text-neutral-600"
                                    />
                                </div>

                                {/* Target Deep Work + Distraction Limit */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                                            <Clock size={12} className="inline mr-1" /> Deep Work (min)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="30" max="480" step="15"
                                                value={form.target_deep_work}
                                                onChange={e => setForm({ ...form, target_deep_work: Number(e.target.value) })}
                                                className="flex-1 accent-accent-blue h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="w-14 text-right font-mono text-white text-sm">{form.target_deep_work}m</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                                            <Zap size={12} className="inline mr-1" /> Max Switches
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="0" max="20"
                                                value={form.distraction_limit}
                                                onChange={e => setForm({ ...form, distraction_limit: Number(e.target.value) })}
                                                className="flex-1 accent-orange-400 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="w-8 text-right font-mono text-white text-sm">{form.distraction_limit}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Priority Tasks (from existing tasks) */}
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                                        Priority Tasks <span className="text-neutral-600">(pick up to 3)</span>
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}
                                            className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between hover:border-white/20 transition-colors"
                                        >
                                            <span className={form.priority_tasks.length ? 'text-white' : 'text-neutral-600'}>
                                                {form.priority_tasks.length ? `${form.priority_tasks.length} task(s) selected` : 'Select tasks...'}
                                            </span>
                                            <ChevronDown size={14} className={`text-neutral-500 transition-transform ${taskDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {taskDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                    className="absolute top-full mt-2 left-0 right-0 bg-[#1A1A1C] border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar"
                                                >
                                                    {tasks.filter(t => t.status !== 'DONE').map(t => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => togglePriorityTask(t.title)}
                                                            className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 hover:bg-white/5 transition-colors"
                                                        >
                                                            {form.priority_tasks.includes(t.title) ? (
                                                                <CheckCircle2 size={16} className="text-accent-blue shrink-0" />
                                                            ) : (
                                                                <Circle size={16} className="text-neutral-600 shrink-0" />
                                                            )}
                                                            <span className="text-white truncate">{t.title}</span>
                                                            <span className={`ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${t.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                                                t.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-neutral-500/20 text-neutral-400'
                                                                }`}>{t.priority}</span>
                                                        </button>
                                                    ))}
                                                    {tasks.filter(t => t.status !== 'DONE').length === 0 && (
                                                        <p className="px-4 py-3 text-sm text-neutral-500">No open tasks available.</p>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Selected pills */}
                                    {form.priority_tasks.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {form.priority_tasks.map(t => (
                                                <span key={t} className="inline-flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue text-xs font-bold px-2.5 py-1 rounded-lg">
                                                    {t}
                                                    <button onClick={() => togglePriorityTask(t)} className="hover:text-white"><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                                        <Calendar size={12} className="inline mr-1" /> Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={e => setForm({ ...form, date: e.target.value })}
                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors text-sm font-medium"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                                        <StickyNote size={12} className="inline mr-1" /> Notes / Intention
                                    </label>
                                    <textarea
                                        placeholder="e.g. No Slack before noon, focus on API first..."
                                        rows={3}
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors text-sm font-medium placeholder:text-neutral-600 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 p-6 pt-2 border-t border-white/5">
                                <button onClick={resetForm} className="flex-1 py-3 rounded-xl text-neutral-400 hover:text-white font-bold transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !form.title.trim()}
                                    className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>{editingGoal ? 'Save Changes' : 'Set Goal'}</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Goals List ── */}
            {loading && goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-neutral-500">
                    <div className="w-8 h-8 border-2 border-neutral-700 border-t-accent-blue rounded-full animate-spin mb-4" />
                    <p className="text-sm">Loading goals...</p>
                </div>
            ) : goals.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-32 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center mb-6">
                        <Target size={32} className="text-neutral-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No goals yet</h3>
                    <p className="text-neutral-500 mb-6 max-w-sm">Start each day with clarity. Set your focus goal to track what matters most.</p>
                    <button
                        onClick={() => { setEditingGoal(null); setForm(emptyForm); setIsFormOpen(true); }}
                        className="px-6 py-3 bg-accent-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Create Your First Goal
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    {goals.map((goal, i) => {
                        const goalDate = goal.date ? goal.date.split('T')[0] : '';
                        const isToday = goalDate === todayStr;

                        return (
                            <motion.div
                                key={goal._id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`group relative bg-[#151515] border rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl overflow-hidden ${isToday ? 'border-accent-blue/30 shadow-lg shadow-blue-900/10' : 'border-white/5 hover:border-white/15'
                                    }`}
                            >
                                {/* Today indicator glow */}
                                {isToday && <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 blur-[80px] opacity-[0.08] pointer-events-none" />}

                                <div className="flex items-start gap-4 relative z-10">
                                    {/* Achieve toggle */}
                                    <button
                                        onClick={() => handleToggleAchieved(goal)}
                                        className={`mt-0.5 shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${goal.achieved
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-neutral-600 text-transparent hover:border-neutral-400'
                                            }`}
                                    >
                                        <Check size={14} strokeWidth={3} />
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {isToday && (
                                                <span className="bg-accent-blue/20 text-accent-blue text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Today</span>
                                            )}
                                            {goal.achieved && (
                                                <span className="bg-green-500/20 text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Achieved</span>
                                            )}
                                        </div>
                                        <h3 className={`text-base font-bold mb-2 ${goal.achieved ? 'text-neutral-500 line-through' : 'text-white'}`}>
                                            {goal.title}
                                        </h3>

                                        {/* Metrics row */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                                            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                                                <Clock size={12} className="text-blue-400" /> {goal.target_deep_work}m deep work
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                                                <Zap size={12} className="text-orange-400" /> ≤{goal.distraction_limit} switches
                                            </span>
                                            <span className="flex items-center gap-1 text-neutral-600">
                                                <Calendar size={12} /> {goalDate}
                                            </span>
                                        </div>

                                        {/* Priority Tasks */}
                                        {goal.priority_tasks && goal.priority_tasks.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {goal.priority_tasks.map(t => (
                                                    <span key={t} className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-md">{t}</span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {goal.notes && (
                                            <p className="mt-3 text-xs text-neutral-500 italic border-l-2 border-white/10 pl-3">{goal.notes}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={() => openEditForm(goal)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => goal._id && handleDelete(goal._id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GoalsView;
