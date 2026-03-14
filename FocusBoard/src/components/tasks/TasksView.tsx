
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../types';
import { Plus, CheckCircle2, Circle, Clock, MoreHorizontal, X, ArrowRight, Trash2, Play, LayoutGrid, Briefcase, Users, DollarSign, Archive, Eye, RotateCcw, Edit3, PieChart, Filter, SortAsc, Search, Download, PlusCircle } from 'lucide-react';
import { DrillDownType } from '../dashboard/DrillDownView';
import ClientReport from '../analytics/reports/ClientReport';
import ProjectReport from '../analytics/reports/ProjectReport';
import { useDashboardStore } from '../../store/useDashboardStore';
import { clientApi, Client } from '../../services/clientApi';

interface TasksViewProps {
    onNavigate: (type: DrillDownType, data: any) => void;
}

type ViewMode = 'TASKS' | 'PROJECTS' | 'CLIENTS';
type SortMode = 'PRIORITY' | 'DUE_DATE' | 'TIME';

const TasksView: React.FC<TasksViewProps> = ({ onNavigate }) => {
    const { tasks, createTask, deleteTask, setActiveTask, moveTask, toggleTaskBillable, toggleTaskArchived, renameProject, renameClient } = useDashboardStore();
    const activeTaskId = tasks.length > 0 ? tasks[0].id : null;
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('TASKS');
    const [clientViewMode, setClientViewMode] = useState<'GRID' | 'REPORT'>('GRID');
    const [projectViewMode, setProjectViewMode] = useState<'GRID' | 'REPORT'>('GRID');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    // Filters & Sort
    const [filterProject, setFilterProject] = useState<string>('');
    const [filterClient, setFilterClient] = useState<string>('');
    const [sortMode, setSortMode] = useState<SortMode>('PRIORITY');

    // Client Management State
    const [clients, setClients] = useState<Client[]>([]);
    const [clientSearch, setClientSearch] = useState('');
    const [clientSortBy, setClientSortBy] = useState<string>('name');
    const [clientSortOrder, setClientSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientLoading, setClientLoading] = useState(false);

    // Renaming State
    const [editingItem, setEditingItem] = useState<{ type: 'PROJECT' | 'CLIENT', oldName: string } | null>(null);

    // Filter tasks based on archive state + new filters
    const visibleTasks = tasks.filter(t => {
        const archiveMatch = showArchived ? t.archived : !t.archived;
        const projectMatch = filterProject ? t.project === filterProject : true;
        const clientMatch = filterClient ? t.client === filterClient : true;
        return archiveMatch && projectMatch && clientMatch;
    });

    // Sort Tasks
    const sortTasks = (taskList: Task[]) => {
        return [...taskList].sort((a, b) => {
            if (sortMode === 'PRIORITY') {
                const pMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return pMap[b.priority] - pMap[a.priority];
            }
            if (sortMode === 'TIME') {
                return (b.timeSpent || 0) - (a.timeSpent || 0);
            }
            if (sortMode === 'DUE_DATE') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            return 0;
        });
    };

    // Unique Lists for Dropdowns
    const uniqueProjects = Array.from(new Set(tasks.map(t => t.project))).filter(Boolean);
    const uniqueClients = Array.from(new Set(tasks.map(t => t.client))).filter(Boolean);

    // Client API Functions
    const loadClients = async () => {
        setClientLoading(true);
        try {
            const params: any = { includeHours: true };
            if (clientSearch) params.search = clientSearch;
            if (clientSortBy) params.sortBy = clientSortBy;
            params.sortOrder = clientSortOrder;
            const data = await clientApi.getClients(params);
            setClients(data as Client[]);
        } catch (error) {
            console.error('Failed to load clients:', error);
        } finally {
            setClientLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'CLIENTS') {
            loadClients();
        }
    }, [viewMode, clientSearch, clientSortBy, clientSortOrder]);

    const handleCreateClient = async (clientData: Partial<Client>) => {
        try {
            await clientApi.createClient(clientData);
            await loadClients();
            setIsClientModalOpen(false);
        } catch (error) {
            console.error('Failed to create client:', error);
        }
    };

    const handleUpdateClient = async (clientData: Partial<Client>) => {
        if (!editingClient) return;
        try {
            await clientApi.updateClient(editingClient._id, clientData);
            await loadClients();
            setEditingClient(null);
        } catch (error) {
            console.error('Failed to update client:', error);
        }
    };

    const handleDeleteClients = async () => {
        if (selectedClients.length === 0) return;
        try {
            await clientApi.bulkDeleteClients(selectedClients);
            setSelectedClients([]);
            await loadClients();
        } catch (error) {
            console.error('Failed to delete clients:', error);
        }
    };

    const handleExportClients = async () => {
        try {
            const blob = await clientApi.exportClients('csv');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clients.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export clients:', error);
        }
    };

    // Grouping Utilities
    const getProjects = () => {
        const groups: Record<string, { tasks: Task[], time: number }> = {};
        visibleTasks.forEach(t => {
            const key = t.project || 'Unassigned';
            if (!groups[key]) groups[key] = { tasks: [], time: 0 };
            groups[key].tasks.push(t);
            groups[key].time += (t.timeSpent || 0);
        });
        return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
    };

    const getClients = () => {
        return clients.map(client => ({
            name: client.name,
            company: client.company,
            email: client.email,
            phone: client.phone,
            hourlyRate: client.hourlyRate,
            notes: client.notes,
            color: client.color,
            time: 0,
            tasks: visibleTasks.filter(t => t.client === client.name),
            trackedHours: (client as any).trackedHours || 0,
            estimatedBillable: (client as any).estimatedBillable || 0,
            _id: client._id
        }));
    };

    const columns = [
        { id: 'TODO', label: 'To Do', color: 'bg-neutral-500' },
        { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-accent-blue' },
        { id: 'DONE', label: 'Done', color: 'bg-accent-green' },
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'text-accent-orange';
            case 'MEDIUM': return 'text-yellow-400';
            case 'LOW': return 'text-neutral-400';
            default: return 'text-neutral-400';
        }
    };

    const handleArchiveProject = (tasksToArchive: Task[]) => {
        tasksToArchive.forEach(t => {
            if (!t.archived) toggleTaskArchived(t.id);
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto h-full pb-24 flex flex-col" onClick={() => setActiveMenuId(null)}>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        Work
                        {showArchived && <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-400 font-medium uppercase tracking-wider border border-white/10">Archived View</span>}
                    </h1>
                    <p className="text-sm text-neutral-500 font-medium">Manage tasks, projects, and client deliverables.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Archive Toggle */}
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`p-2.5 rounded-xl border transition-colors ${showArchived ? 'bg-neutral-800 border-white/20 text-white' : 'bg-transparent border-transparent text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'}`}
                        title={showArchived ? "Hide Archived Items" : "Show Archived Items"}
                    >
                        {showArchived ? <Eye size={18} /> : <Archive size={18} />}
                    </button>

                    <div className="w-px h-8 bg-white/10 hidden sm:block" />

                    {/* View Switcher */}
                    <div className="bg-neutral-900 p-1 rounded-xl border border-white/10 flex">
                        <button
                            onClick={() => setViewMode('TASKS')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'TASKS' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={14} /> Tasks
                        </button>
                        <button
                            onClick={() => setViewMode('PROJECTS')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'PROJECTS' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                        >
                            <Briefcase size={14} /> Projects
                        </button>
                        <button
                            onClick={() => setViewMode('CLIENTS')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'CLIENTS' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                        >
                            <Users size={14} /> Clients
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue hover:bg-blue-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-900/20 ml-auto sm:ml-0"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </div>
            </header>

            {/* Toolbar for Tasks View */}
            {viewMode === 'TASKS' && (
                <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar pb-1">
                    <div className="flex items-center bg-neutral-900 border border-white/10 rounded-lg p-1">
                        <select
                            value={filterProject}
                            onChange={(e) => setFilterProject(e.target.value)}
                            className="bg-transparent text-xs text-neutral-400 font-medium px-2 py-1 outline-none cursor-pointer hover:text-white"
                        >
                            <option value="">All Projects</option>
                            {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="w-px h-4 bg-white/10" />
                        <select
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value)}
                            className="bg-transparent text-xs text-neutral-400 font-medium px-2 py-1 outline-none cursor-pointer hover:text-white"
                        >
                            <option value="">All Clients</option>
                            {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center bg-neutral-900 border border-white/10 rounded-lg p-1">
                        <span className="text-[10px] font-bold text-neutral-500 px-2 uppercase tracking-wide flex items-center gap-1">
                            <SortAsc size={12} /> Sort
                        </span>
                        <button
                            onClick={() => setSortMode('PRIORITY')}
                            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${sortMode === 'PRIORITY' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
                        >Priority</button>
                        <button
                            onClick={() => setSortMode('DUE_DATE')}
                            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${sortMode === 'DUE_DATE' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
                        >Due Date</button>
                        <button
                            onClick={() => setSortMode('TIME')}
                            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${sortMode === 'TIME' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
                        >Time</button>
                    </div>

                    {(filterProject || filterClient) && (
                        <button onClick={() => { setFilterProject(''); setFilterClient(''); }} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
                            <X size={12} /> Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* VIEW CONTENT */}
            <div className="flex-1 overflow-hidden">

                {viewMode === 'TASKS' && (
                    <div className="overflow-x-auto h-full pb-4">
                        <div className="flex gap-6 min-w-[800px] h-full">
                            {columns.map((col) => {
                                const colTasks = sortTasks(visibleTasks.filter(t => t.status === col.id));

                                return (
                                    <div key={col.id} className="flex-1 flex flex-col gap-4">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                                <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{col.label}</span>
                                                <span className="text-xs text-neutral-600 font-mono bg-neutral-900 px-1.5 py-0.5 rounded ml-1">{colTasks.length}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-titanium-dark/30 border border-white/5 rounded-3xl p-2 space-y-3 relative overflow-y-auto no-scrollbar">
                                            <AnimatePresence>
                                                {colTasks.map((task) => (
                                                    <motion.div
                                                        key={task.id}
                                                        layoutId={task.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        onClick={() => onNavigate && onNavigate('TASK', task)}
                                                        className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-visible
                                                    ${activeTaskId === task.id ? 'bg-neutral-800 border-accent-blue shadow-[0_0_15px_rgba(47,88,205,0.15)]' : 'bg-titanium-surface border-titanium-border hover:border-neutral-500'}
                                                    ${task.archived ? 'opacity-60 grayscale-[0.5]' : ''}
                                                `}
                                                    >
                                                        {/* Task Card Content (Same as before) */}
                                                        {activeTaskId === task.id && (
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue rounded-l-2xl" />
                                                        )}

                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wide">
                                                                    {task.project}
                                                                </span>
                                                                {task.billable && (
                                                                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/40" title="Billable Task">
                                                                        <DollarSign size={8} className="text-green-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                                                                <button
                                                                    className="text-neutral-600 hover:text-white transition-colors p-1 -mr-2"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveMenuId(activeMenuId === task.id ? null : task.id);
                                                                    }}
                                                                >
                                                                    <MoreHorizontal size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <h3 className={`font-medium text-sm mb-3 ${task.status === 'DONE' ? 'text-neutral-500 line-through' : 'text-white'}`}>
                                                            {task.title}
                                                        </h3>

                                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                            <div className="flex items-center gap-1.5 text-neutral-500 text-[10px] font-medium">
                                                                {task.status === 'DONE' ? <CheckCircle2 size={12} className="text-accent-green" /> : <Clock size={12} />}
                                                                <span>{Math.round(task.timeSpent || 0)}m</span>
                                                                {task.dueDate && <span className="ml-2 text-neutral-600">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>}
                                                            </div>

                                                            {col.id !== 'DONE' && !task.archived && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveTask(task.id);
                                                                    }}
                                                                    className={`p-1.5 rounded-full transition-all ${activeTaskId === task.id ? 'bg-accent-blue text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'}`}
                                                                    title={activeTaskId === task.id ? 'Active Task' : 'Set as Active'}
                                                                >
                                                                    <Play size={10} fill={activeTaskId === task.id ? "currentColor" : "none"} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Context Menu */}
                                                        <AnimatePresence>
                                                            {activeMenuId === task.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                                    className="absolute top-8 right-2 z-20 w-40 bg-titanium-surface border border-white/10 rounded-lg shadow-xl overflow-hidden"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {task.status !== 'TODO' && (
                                                                        <button
                                                                            onClick={() => { moveTask(task.id, 'TODO'); setActiveMenuId(null); }}
                                                                            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                                                        >
                                                                            <ArrowRight size={12} className="rotate-180" /> To Do
                                                                        </button>
                                                                    )}
                                                                    {task.status !== 'IN_PROGRESS' && (
                                                                        <button
                                                                            onClick={() => { moveTask(task.id, 'IN_PROGRESS'); setActiveMenuId(null); }}
                                                                            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                                                        >
                                                                            <ArrowRight size={12} /> In Progress
                                                                        </button>
                                                                    )}
                                                                    {task.status !== 'DONE' && (
                                                                        <button
                                                                            onClick={() => { moveTask(task.id, 'DONE'); setActiveMenuId(null); }}
                                                                            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                                                        >
                                                                            <CheckCircle2 size={12} /> Done
                                                                        </button>
                                                                    )}
                                                                    <div className="h-px bg-white/10" />
                                                                    <button
                                                                        onClick={() => { toggleTaskBillable(task.id); setActiveMenuId(null); }}
                                                                        className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                                                    >
                                                                        <DollarSign size={12} className={task.billable ? "text-green-400" : "text-neutral-500"} />
                                                                        {task.billable ? 'Mark Non-Billable' : 'Mark Billable'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { toggleTaskArchived(task.id); setActiveMenuId(null); }}
                                                                        className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                                                    >
                                                                        {task.archived ? <RotateCcw size={12} /> : <Archive size={12} />}
                                                                        {task.archived ? 'Restore' : 'Archive'}
                                                                    </button>
                                                                    <div className="h-px bg-white/10" />
                                                                    <button
                                                                        onClick={() => { deleteTask(task.id); setActiveMenuId(null); }}
                                                                        className="w-full px-3 py-2 text-xs text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                                    >
                                                                        <Trash2 size={12} /> Delete
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewMode === 'PROJECTS' && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-end mb-4">
                            <div className="bg-neutral-900 p-0.5 rounded-lg border border-white/5 flex">
                                <button
                                    onClick={() => setProjectViewMode('GRID')}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md flex items-center gap-2 transition-colors ${projectViewMode === 'GRID' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    <LayoutGrid size={12} /> Grid
                                </button>
                                <button
                                    onClick={() => setProjectViewMode('REPORT')}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md flex items-center gap-2 transition-colors ${projectViewMode === 'REPORT' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    <PieChart size={12} /> Report
                                </button>
                            </div>
                        </div>

                        {projectViewMode === 'REPORT' ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto">
                                <ProjectReport tasks={visibleTasks} />
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full pb-8">
                                {getProjects().map((proj, i) => (
                                    <motion.div
                                        key={proj.name}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-titanium-dark border border-titanium-border rounded-[22px] p-6 hover:border-neutral-500 transition-colors group cursor-pointer relative"
                                        onClick={() => onNavigate && onNavigate('PROJECT', proj.tasks[0])}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-accent-blue transition-colors flex items-center gap-2">
                                                    {proj.name}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'PROJECT', oldName: proj.name }); }}
                                                        className="p-1 hover:bg-white/10 rounded-full text-neutral-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                </h3>
                                                <p className="text-sm text-neutral-500">{proj.tasks.length} Tasks</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleArchiveProject(proj.tasks);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                title="Archive Project"
                                            >
                                                <Archive size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="text-neutral-400 font-medium">Completion</span>
                                                    <span className="text-white font-bold">{Math.round((proj.tasks.filter(t => t.status === 'DONE').length / proj.tasks.length) * 100) || 0}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-accent-blue rounded-full"
                                                        style={{ width: `${(proj.tasks.filter(t => t.status === 'DONE').length / proj.tasks.length) * 100 || 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        {[...Array(Math.min(3, proj.tasks.length))].map((_, idx) => (
                                                            <div key={idx} className="w-6 h-6 rounded-full bg-neutral-700 border border-titanium-dark" />
                                                        ))}
                                                    </div>
                                                    {proj.tasks.some(t => t.billable) && (
                                                        <div className="px-2 py-0.5 bg-green-500/10 rounded text-[9px] text-green-400 font-bold uppercase tracking-wider border border-green-500/20">
                                                            Billable
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-neutral-400 font-mono">
                                                    {Math.floor(proj.time / 60)}h {Math.round(proj.time % 60)}m
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'CLIENTS' && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-end mb-4">
                            <div className="bg-neutral-900 p-0.5 rounded-lg border border-white/5 flex">
                                <button
                                    onClick={() => setClientViewMode('GRID')}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md flex items-center gap-2 transition-colors ${clientViewMode === 'GRID' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    <LayoutGrid size={12} /> Grid
                                </button>
                                <button
                                    onClick={() => setClientViewMode('REPORT')}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md flex items-center gap-2 transition-colors ${clientViewMode === 'REPORT' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    <PieChart size={12} /> Report
                                </button>
                            </div>
                        </div>

                        {/* Client Toolbar */}
                        {clientViewMode === 'GRID' && (
                            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-titanium-dark/50 rounded-xl border border-white/5">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    <input
                                        type="text"
                                        placeholder="Search clients..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent-blue"
                                    />
                                </div>
                                <select
                                    value={clientSortBy}
                                    onChange={(e) => setClientSortBy(e.target.value)}
                                    className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="hours">Sort by Hours</option>
                                    <option value="billable">Sort by Billable</option>
                                </select>
                                <button
                                    onClick={() => setClientSortOrder(clientSortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="p-2 bg-neutral-900 border border-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                >
                                    <SortAsc size={16} className={clientSortOrder === 'desc' ? 'rotate-180' : ''} />
                                </button>
                                <div className="h-6 w-px bg-white/10" />
                                <button
                                    onClick={() => setIsClientModalOpen(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-accent-blue rounded-lg text-white text-sm font-medium hover:bg-accent-blue/80 transition-colors"
                                >
                                    <PlusCircle size={16} /> Add Client
                                </button>
                                {selectedClients.length > 0 && (
                                    <>
                                        <button
                                            onClick={handleDeleteClients}
                                            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 size={16} /> Delete ({selectedClients.length})
                                        </button>
                                        <button
                                            onClick={handleExportClients}
                                            className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-white/10 rounded-lg text-neutral-400 text-sm font-medium hover:text-white transition-colors"
                                        >
                                            <Download size={16} /> Export
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {clientViewMode === 'REPORT' ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto">
                                <ClientReport />
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto pb-8">
                                {getClients().map((client, i) => (
                                    <motion.div
                                        key={client.name}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-titanium-dark border border-titanium-border rounded-[22px] p-6 hover:border-neutral-500 transition-colors cursor-pointer relative group"
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-lg font-bold text-white border border-white/10">
                                                    {client.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                                                        {client.name}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'CLIENT', oldName: client.name }); }}
                                                            className="p-1 hover:bg-white/10 rounded-full text-neutral-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Edit3 size={12} />
                                                        </button>
                                                    </h3>
                                                    <p className="text-xs text-neutral-500 mt-0.5">{client.tasks.length} Active Items</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleArchiveProject(client.tasks);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
                                                title="Archive Client"
                                            >
                                                <Archive size={16} />
                                            </button>
                                        </div>

                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5 mb-4">
                                            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                                                <Clock size={12} /> Total Time Tracked
                                            </div>
                                            <div className="text-xl font-mono font-bold text-white">
                                                {Math.floor(client.time / 60)}<span className="text-sm text-neutral-500">h</span> {Math.round(client.time % 60)}<span className="text-sm text-neutral-500">m</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-neutral-500">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                Active Engagement
                                            </div>
                                            {client.tasks.some(t => t.billable) && <DollarSign size={12} className="text-green-500" />}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={(data) => { createTask(data); setIsCreateModalOpen(false); }}
            />

            <RenameModal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                initialValue={editingItem?.oldName || ''}
                title={editingItem?.type === 'PROJECT' ? 'Rename Project' : 'Rename Client'}
                onSave={(newName) => {
                    if (editingItem?.type === 'PROJECT') renameProject(editingItem.oldName, newName);
                    if (editingItem?.type === 'CLIENT') renameClient(editingItem.oldName, newName);
                    setEditingItem(null);
                }}
            />

            <ClientModal
                isOpen={isClientModalOpen || !!editingClient}
                onClose={() => { setIsClientModalOpen(false); setEditingClient(null); }}
                onSave={(data) => {
                    if (editingClient) {
                        handleUpdateClient(data);
                    } else {
                        handleCreateClient(data);
                    }
                }}
                initialData={editingClient}
            />
        </div>
    );
};

const CreateTaskModal: React.FC<{ isOpen: boolean, onClose: () => void, onCreate: (task: any) => void }> = ({ isOpen, onClose, onCreate }) => {
    // ... existing CreateTaskModal implementation ...
    const [title, setTitle] = useState('');
    const [project, setProject] = useState('General');
    const [client, setClient] = useState('Internal');
    const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
    const [isBillable, setIsBillable] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({ title, project, client, priority, billable: isBillable });
        setTitle('');
        setProject('General');
        setClient('Internal');
        setIsBillable(true);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-titanium-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 z-[70]"
            >
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Create Task</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors"><X size={20} className="text-neutral-400" /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue transition-colors"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Project</label>
                                <input
                                    type="text"
                                    value={project}
                                    onChange={e => setProject(e.target.value)}
                                    className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors"
                                    list="projects"
                                />
                                <datalist id="projects">
                                    <option value="General" />
                                    <option value="Frontend" />
                                    <option value="Backend" />
                                    <option value="Design" />
                                </datalist>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Client</label>
                                <input
                                    type="text"
                                    value={client}
                                    onChange={e => setClient(e.target.value)}
                                    className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors"
                                    list="clients"
                                />
                                <datalist id="clients">
                                    <option value="Internal" />
                                    <option value="Acme Corp" />
                                </datalist>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Priority</label>
                                <div className="flex gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p as any)}
                                            className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${priority === p ? 'bg-white text-black border-white' : 'bg-titanium-dark border-white/10 text-neutral-500 hover:text-white'}`}
                                        >
                                            {p[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Status</label>
                                <button
                                    type="button"
                                    onClick={() => setIsBillable(!isBillable)}
                                    className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${isBillable ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-titanium-dark border-white/10 text-neutral-500 hover:text-white'}`}
                                >
                                    <DollarSign size={14} />
                                    {isBillable ? 'Billable' : 'Non-Billable'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-accent-blue rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-600 transition-colors">
                            Create Task
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

const ClientModal: React.FC<{ 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (data: Partial<Client>) => void,
    initialData?: Client | null
}> = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [company, setCompany] = useState(initialData?.company || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [phone, setPhone] = useState(initialData?.phone || '');
    const [hourlyRate, setHourlyRate] = useState(initialData?.hourlyRate?.toString() || '150');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [color, setColor] = useState(initialData?.color || '#3B82F6');

    React.useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setCompany(initialData.company || '');
            setEmail(initialData.email || '');
            setPhone(initialData.phone || '');
            setHourlyRate(initialData.hourlyRate?.toString() || '150');
            setNotes(initialData.notes || '');
            setColor(initialData.color || '#3B82F6');
        } else {
            setName('');
            setCompany('');
            setEmail('');
            setPhone('');
            setHourlyRate('150');
            setNotes('');
            setColor('#3B82F6');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
            name,
            company,
            email,
            phone,
            hourlyRate: parseFloat(hourlyRate) || 0,
            notes,
            color
        });
    };

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-titanium-surface border border-white/10 rounded-2xl shadow-2xl p-6 z-[90]"
            >
                <h3 className="text-lg font-bold text-white mb-4">{initialData ? 'Edit Client' : 'New Client'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue"
                            placeholder="Client name"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Company</label>
                        <input
                            type="text"
                            value={company}
                            onChange={e => setCompany(e.target.value)}
                            className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue"
                            placeholder="Company name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue"
                                placeholder="client@example.com"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue"
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Hourly Rate ($)</label>
                        <input
                            type="number"
                            value={hourlyRate}
                            onChange={e => setHourlyRate(e.target.value)}
                            className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue"
                            placeholder="150"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Color</label>
                        <div className="flex gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-titanium-surface' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue resize-none"
                            placeholder="Additional notes..."
                            rows={3}
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-accent-blue rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-600 transition-colors">
                            {initialData ? 'Update Client' : 'Create Client'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

const RenameModal: React.FC<{ isOpen: boolean, onClose: () => void, initialValue: string, title: string, onSave: (val: string) => void }> = ({ isOpen, onClose, initialValue, title, onSave }) => {
    // ... existing RenameModal ...
    const [value, setValue] = useState(initialValue);

    // Sync when opened
    React.useEffect(() => { setValue(initialValue); }, [initialValue, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-titanium-surface border border-white/10 rounded-2xl shadow-2xl p-6 z-[90]"
            >
                <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
                <input
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue mb-6"
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white">Cancel</button>
                    <button onClick={() => onSave(value)} className="px-4 py-2 text-sm font-bold text-white bg-accent-blue rounded-xl hover:bg-blue-600">Save</button>
                </div>
            </motion.div>
        </div>
    )
}

export default TasksView;
