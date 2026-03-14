
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, Loader2, AlertCircle, Search, Headset,
    MessageSquare, Clock, CheckCircle2, AlertTriangle,
    Star, Send, Trash2, Edit2
} from 'lucide-react';

import {
    createIssueType,
    getAllIssueTypes,
    updateIssueType,
    deleteIssueType,
    createTicket,
    getAllTickets,
    updateTicket,
    deleteTicket,
    createResolution,
    getAllResolutions,
    deleteResolution,
    createFeedback,
    getAllFeedback,
    deleteFeedback,
    createLead,
    getAllLeads,
    updateLead,
    deleteLead,
    type IssueType,
    type IssueTypePayload,
    type SupportTicket,
    type TicketPayload,
    type TicketResolution,
    type ResolutionPayload,
    type UserFeedback,
    type FeedbackPayload,
    type Lead,
    type LeadPayload,
} from '../../services/supportApi';

type TabView = 'tickets' | 'issue-types' | 'resolutions' | 'feedback' | 'leads';

const PRIORITY_COLORS: Record<string, string> = {
    'Low': 'bg-neutral-500/20 text-neutral-400',
    'Medium': 'bg-yellow-500/20 text-yellow-400',
    'High': 'bg-orange-500/20 text-orange-400',
    'Critical': 'bg-red-500/20 text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
    'Open': 'bg-blue-500/20 text-blue-400',
    'In Progress': 'bg-yellow-500/20 text-yellow-400',
    'Resolved': 'bg-green-500/20 text-green-400',
    'Closed': 'bg-neutral-500/20 text-neutral-400',
};

// Confirm Dialog
const ConfirmDialog = ({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) => (
    <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onCancel} />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="bg-titanium-surface border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full">
                <div className="flex items-start gap-3 mb-6">
                    <AlertCircle size={20} className="text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-white font-medium">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold border border-white/10 hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-colors">OK</button>
                </div>
            </div>
        </motion.div>
    </>
);

// --- Issue Types Tab ---
const IssueTypesTab: React.FC = () => {
    const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchId, setSearchId] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);
    const [form, setForm] = useState<IssueTypePayload>({ name: '', defaultPriority: 'Medium', slaResolutionDays: 3, supportEmail: '', isActive: true, autoReplyTemplate: '' });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getAllIssueTypes();
            setIssueTypes(result.data);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => setForm({ name: '', defaultPriority: 'Medium', slaResolutionDays: 3, supportEmail: '', isActive: true, autoReplyTemplate: '' });

    const handleCreate = () => {
        if (!form.name) return;
        setConfirmAction({
            message: 'Are you sure you want to create this issue type?',
            action: async () => {
                const created = await createIssueType(form);
                setIssueTypes(prev => [created, ...prev]);
                setIsCreating(false);
                resetForm();
            }
        });
    };

    const handleUpdate = (id: string) => {
        setConfirmAction({
            message: 'Confirm changes to this issue type?',
            action: async () => {
                const updated = await updateIssueType(id, form);
                setIssueTypes(prev => prev.map(t => t._id === id ? updated : t));
                setEditingId(null);
                resetForm();
            }
        });
    };

    const handleDelete = (id: string) => {
        setConfirmAction({
            message: 'Are you sure you want to delete this issue type?',
            action: async () => {
                await deleteIssueType(id);
                setIssueTypes(prev => prev.filter(t => t._id !== id));
            }
        });
    };

    const startEdit = (it: IssueType) => {
        setEditingId(it._id);
        setForm({ name: it.name, defaultPriority: it.defaultPriority, slaResolutionDays: it.slaResolutionDays, supportEmail: it.supportEmail, isActive: it.isActive, autoReplyTemplate: it.autoReplyTemplate });
    };

    const filtered = searchId ? issueTypes.filter(t => t._id.includes(searchId) || t.name.toLowerCase().includes(searchId.toLowerCase())) : issueTypes;

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-white animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" placeholder="Search by ID or name..." value={searchId} onChange={e => setSearchId(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue" />
                </div>
                <button onClick={() => { setIsCreating(true); resetForm(); }}
                    className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shrink-0">
                    <Plus size={16} /> New Issue Type
                </button>
            </div>

            {/* Create/Edit Form */}
            <AnimatePresence>
                {(isCreating || editingId) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-white">{editingId ? 'Edit Issue Type' : 'New Issue Type'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input placeholder="Issue Type Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <select value={form.defaultPriority} onChange={e => setForm({ ...form, defaultPriority: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none">
                                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                                </select>
                                <input type="number" placeholder="SLA (days)" value={form.slaResolutionDays} onChange={e => setForm({ ...form, slaResolutionDays: Number(e.target.value) })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <input placeholder="Support Email" value={form.supportEmail} onChange={e => setForm({ ...form, supportEmail: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors w-full ${form.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {form.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                                <textarea placeholder="Auto-Reply Template" value={form.autoReplyTemplate} onChange={e => setForm({ ...form, autoReplyTemplate: e.target.value })} rows={2}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none resize-none sm:col-span-2" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }}
                                    className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold">Cancel</button>
                                <button onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                                    className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200">
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Data Grid */}
            <div className="bg-titanium-dark border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    <span>Name</span><span>Priority</span><span>SLA</span><span>Status</span><span>Actions</span>
                </div>
                {filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <AlertTriangle size={32} className="text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm">No issue types found.</p>
                        <p className="text-neutral-600 text-xs mt-1">Create your first issue type to categorize support tickets.</p>
                    </div>
                ) : filtered.map(it => (
                    <div key={it._id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors">
                        <div>
                            <div className="text-sm font-bold text-white">{it.name}</div>
                            <div className="text-[10px] text-neutral-600 font-mono">{it._id}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${PRIORITY_COLORS[it.defaultPriority] || PRIORITY_COLORS['Medium']}`}>{it.defaultPriority}</span>
                        <span className="text-xs text-neutral-400 font-mono">{it.slaResolutionDays}d</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${it.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{it.isActive ? 'Active' : 'Inactive'}</span>
                        <div className="flex gap-2">
                            <button onClick={() => startEdit(it)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(it._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
            <AnimatePresence>{confirmAction && <ConfirmDialog message={confirmAction.message} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />}</AnimatePresence>
        </div>
    );
};

// --- Tickets Tab ---
const TicketsTab: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [searchId, setSearchId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);
    const [form, setForm] = useState<TicketPayload>({ userId: '', issueTypeId: '', subject: '', description: '', screenshotUrl: '', deviceInfo: '', priority: 'Medium', consentToShareLogs: false });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [ticketRes, issueRes] = await Promise.all([
                getAllTickets(1, 100, statusFilter ? `status=${encodeURIComponent(statusFilter)}` : ''),
                getAllIssueTypes()
            ]);
            setTickets(ticketRes.data);
            setIssueTypes(issueRes.data);
        } catch { } finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => setForm({ userId: '', issueTypeId: '', subject: '', description: '', screenshotUrl: '', deviceInfo: '', priority: 'Medium', consentToShareLogs: false });

    const handleCreate = () => {
        if (!form.subject || !form.description || !form.userId || !form.issueTypeId) return;
        setConfirmAction({
            message: 'Are you sure you want to submit this support ticket?',
            action: async () => {
                const created = await createTicket(form);
                setTickets(prev => [created, ...prev]);
                setIsCreating(false);
                resetForm();
            }
        });
    };

    const handleUpdate = (id: string) => {
        setConfirmAction({
            message: 'Confirm changes to this ticket?',
            action: async () => {
                const updated = await updateTicket(id, form);
                setTickets(prev => prev.map(t => t._id === id ? updated : t));
                setEditingId(null);
                resetForm();
            }
        });
    };

    const handleDelete = (id: string) => {
        setConfirmAction({
            message: 'Permanently delete this ticket?',
            action: async () => {
                await deleteTicket(id);
                setTickets(prev => prev.filter(t => t._id !== id));
                setSelectedTicket(null);
            }
        });
    };

    const startEdit = (t: SupportTicket) => {
        setEditingId(t._id);
        setSelectedTicket(null);
        setForm({ userId: t.userId?._id || t.userId || '', issueTypeId: t.issueTypeId?._id || t.issueTypeId || '', subject: t.subject, description: t.description, screenshotUrl: t.screenshotUrl, deviceInfo: t.deviceInfo, priority: t.priority, consentToShareLogs: t.consentToShareLogs });
    };

    const filtered = searchId ? tickets.filter(t => t._id.includes(searchId) || t.subject.toLowerCase().includes(searchId.toLowerCase())) : tickets;

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-white animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" placeholder="Search by ID or subject..." value={searchId} onChange={e => setSearchId(e.target.value)}
                        className="w-full bg-titanium-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue transition-colors" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="bg-titanium-dark border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue">
                    <option value="">All Statuses</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option>
                </select>
                <button onClick={() => { setIsCreating(true); resetForm(); }}
                    className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shrink-0">
                    <Plus size={16} /> New Ticket
                </button>
            </div>

            <AnimatePresence>
                {(isCreating || editingId) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-white">{editingId ? 'Edit Ticket' : 'New Support Ticket'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input placeholder="User ID" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <select value={form.issueTypeId} onChange={e => setForm({ ...form, issueTypeId: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none">
                                    <option value="">Select Issue Type</option>
                                    {issueTypes.map(it => <option key={it._id} value={it._id}>{it.name}</option>)}
                                </select>
                                <input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none sm:col-span-2" />
                                <textarea placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none resize-none sm:col-span-2" />
                                <input placeholder="Screenshot URL" value={form.screenshotUrl} onChange={e => setForm({ ...form, screenshotUrl: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <input placeholder="OS / Device Info" value={form.deviceInfo} onChange={e => setForm({ ...form, deviceInfo: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none">
                                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                                </select>
                                <button onClick={() => setForm({ ...form, consentToShareLogs: !form.consentToShareLogs })}
                                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${form.consentToShareLogs ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400 border border-white/10'}`}>
                                    {form.consentToShareLogs ? '✓ Consent to share logs' : 'Consent to share logs'}
                                </button>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }}
                                    className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold">Cancel</button>
                                <button onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                                    className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200">
                                    {editingId ? 'Update' : 'Submit Ticket'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ticket Cards */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-titanium-dark border border-white/10 rounded-2xl px-6 py-16 text-center">
                        <MessageSquare size={32} className="text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm">No tickets found.</p>
                        <p className="text-neutral-600 text-xs mt-1">Create a new ticket to get started.</p>
                    </div>
                ) : filtered.map((t, i) => (
                    <motion.div key={t._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedTicket(t)}
                        className="bg-titanium-dark border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-all group cursor-pointer hover:bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${STATUS_COLORS[t.status] || STATUS_COLORS['Open']}`}>{t.status}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS['Medium']}`}>{t.priority}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white truncate">{t.subject}</h4>
                                <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{t.description}</p>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600">
                                    <span className="font-mono">{t._id.slice(0, 8)}...</span>
                                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                                    {t.issueTypeId?.name && <span className="bg-white/5 px-2 py-0.5 rounded">{t.issueTypeId.name}</span>}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={e => { e.stopPropagation(); startEdit(t); }} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                <button onClick={e => { e.stopPropagation(); handleDelete(t._id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Ticket Detail Drawer */}
            <AnimatePresence>
                {selectedTicket && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]" onClick={() => setSelectedTicket(null)} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-titanium-surface border-l border-white/10 z-[95] overflow-y-auto">
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-white">Ticket Details</h2>
                                    <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"><X size={18} /></button>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${STATUS_COLORS[selectedTicket.status] || ''}`}>{selectedTicket.status}</span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${PRIORITY_COLORS[selectedTicket.priority] || ''}`}>{selectedTicket.priority}</span>
                                </div>
                                <div className="space-y-4">
                                    <div><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Subject</p><p className="text-sm text-white font-medium">{selectedTicket.subject}</p></div>
                                    <div><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Description</p><p className="text-sm text-neutral-300 leading-relaxed">{selectedTicket.description}</p></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Issue Type</p><p className="text-sm text-white">{selectedTicket.issueTypeId?.name || 'N/A'}</p></div>
                                        <div><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Created</p><p className="text-sm text-white">{new Date(selectedTicket.createdAt).toLocaleString()}</p></div>
                                        <div><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Device Info</p><p className="text-sm text-white">{selectedTicket.deviceInfo || 'N/A'}</p></div>
                                        <div><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Log Consent</p><p className="text-sm text-white">{selectedTicket.consentToShareLogs ? 'Yes' : 'No'}</p></div>
                                    </div>
                                    <div><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Ticket ID</p><p className="text-xs text-neutral-400 font-mono break-all">{selectedTicket._id}</p></div>
                                    {selectedTicket.screenshotUrl && (
                                        <div><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Screenshot</p><a href={selectedTicket.screenshotUrl} target="_blank" rel="noreferrer" className="text-xs text-accent-blue hover:underline break-all">{selectedTicket.screenshotUrl}</a></div>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button onClick={() => startEdit(selectedTicket)} className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"><Edit2 size={14} /> Edit</button>
                                    <button onClick={() => handleDelete(selectedTicket._id)} className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>{confirmAction && <ConfirmDialog message={confirmAction.message} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />}</AnimatePresence>
        </div>
    );
};

// --- Resolutions Tab ---
const ResolutionsTab: React.FC = () => {
    const [resolutions, setResolutions] = useState<TicketResolution[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);
    const [form, setForm] = useState<ResolutionPayload>({ ticketId: '', agentName: '', resolutionNotes: '', escalateToDevTeam: false, statusUpdate: 'Resolved', resolvedAt: '' });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getAllResolutions();
            setResolutions(result.data);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => setForm({ ticketId: '', agentName: '', resolutionNotes: '', escalateToDevTeam: false, statusUpdate: 'Resolved', resolvedAt: '' });

    const handleCreate = () => {
        if (!form.ticketId || !form.agentName) return;
        setConfirmAction({
            message: 'Are you sure you want to create this resolution?',
            action: async () => {
                const payload = { ...form, resolvedAt: form.resolvedAt || new Date().toISOString() };
                const created = await createResolution(payload);
                setResolutions(prev => [created, ...prev]);
                setIsCreating(false);
                resetForm();
            }
        });
    };

    const handleDelete = (id: string) => {
        setConfirmAction({
            message: 'Are you sure you want to delete this resolution?',
            action: async () => {
                await deleteResolution(id);
                setResolutions(prev => prev.filter(r => r._id !== id));
            }
        });
    };

    const filtered = searchId ? resolutions.filter(r => r._id.includes(searchId)) : resolutions;

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-white animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" placeholder="Search by resolution ID..." value={searchId} onChange={e => setSearchId(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue" />
                </div>
                <button onClick={() => { setIsCreating(true); resetForm(); }}
                    className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shrink-0">
                    <Plus size={16} /> New Resolution
                </button>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-white">New Resolution</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input placeholder="Ticket ID" value={form.ticketId} onChange={e => setForm({ ...form, ticketId: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <input placeholder="Agent Name" value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <textarea placeholder="Resolution Steps / Notes" value={form.resolutionNotes} onChange={e => setForm({ ...form, resolutionNotes: e.target.value })} rows={3}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none resize-none sm:col-span-2" />
                                <select value={form.statusUpdate} onChange={e => setForm({ ...form, statusUpdate: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none">
                                    <option value="Resolved">Resolved</option><option value="Waiting on User">Waiting on User</option><option value="Open">Open</option>
                                </select>
                                <button onClick={() => setForm({ ...form, escalateToDevTeam: !form.escalateToDevTeam })}
                                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${form.escalateToDevTeam ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-neutral-800 text-neutral-400 border border-white/10'}`}>
                                    {form.escalateToDevTeam ? '⚠ Escalate to Dev Team' : 'Escalate to Dev Team'}
                                </button>
                                <input type="datetime-local" value={form.resolvedAt} onChange={e => setForm({ ...form, resolvedAt: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none sm:col-span-2" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setIsCreating(false); resetForm(); }} className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold">Cancel</button>
                                <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200">Create</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-titanium-dark border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    <span>Agent</span><span>Ticket</span><span>Status</span><span>Escalated</span><span>Actions</span>
                </div>
                {filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <CheckCircle2 size={32} className="text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm">No resolutions found.</p>
                        <p className="text-neutral-600 text-xs mt-1">Add a resolution when a ticket is resolved by an agent.</p>
                    </div>
                ) : filtered.map(r => (
                    <div key={r._id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors">
                        <div>
                            <div className="text-sm font-bold text-white">{r.agentName}</div>
                            <div className="text-[10px] text-neutral-600 line-clamp-1">{r.resolutionNotes || 'No notes'}</div>
                        </div>
                        <span className="text-xs text-neutral-400 font-mono">{(r.ticketId?.subject || r.ticketId || '').toString().slice(0, 20)}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_COLORS[r.statusUpdate] || STATUS_COLORS['Open']}`}>{r.statusUpdate}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${r.escalateToDevTeam ? 'bg-orange-500/20 text-orange-400' : 'bg-neutral-500/20 text-neutral-400'}`}>{r.escalateToDevTeam ? 'Yes' : 'No'}</span>
                        <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
            <AnimatePresence>{confirmAction && <ConfirmDialog message={confirmAction.message} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />}</AnimatePresence>
        </div>
    );
};

// --- Feedback Tab ---
const FeedbackTab: React.FC = () => {
    const [feedback, setFeedback] = useState<UserFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);
    const [form, setForm] = useState<FeedbackPayload>({ ticketId: '', satisfactionRating: 5, issueFixed: 'Yes', agentHelpfulness: 5, comments: '', canUseAsTestimonial: false });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getAllFeedback();
            setFeedback(result.data);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => setForm({ ticketId: '', satisfactionRating: 5, issueFixed: 'Yes', agentHelpfulness: 5, comments: '', canUseAsTestimonial: false });

    const handleCreate = () => {
        if (!form.ticketId) return;
        setConfirmAction({
            message: 'Are you sure you want to submit this feedback?',
            action: async () => {
                const created = await createFeedback(form);
                setFeedback(prev => [created, ...prev]);
                setIsCreating(false);
                resetForm();
            }
        });
    };

    const handleDelete = (id: string) => {
        setConfirmAction({
            message: 'Are you sure you want to delete this feedback?',
            action: async () => {
                await deleteFeedback(id);
                setFeedback(prev => prev.filter(f => f._id !== id));
            }
        });
    };

    const filtered = searchId ? feedback.filter(f => f._id.includes(searchId)) : feedback;

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-white animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" placeholder="Search by feedback ID..." value={searchId} onChange={e => setSearchId(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue" />
                </div>
                <button onClick={() => { setIsCreating(true); resetForm(); }}
                    className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shrink-0">
                    <Plus size={16} /> New Feedback
                </button>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-white">New Feedback</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input placeholder="Resolved Ticket ID" value={form.ticketId} onChange={e => setForm({ ...form, ticketId: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <select value={form.issueFixed} onChange={e => setForm({ ...form, issueFixed: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none">
                                    <option value="Yes">Issue Fixed - Yes</option><option value="No">Issue Fixed - No</option><option value="Partially">Issue Fixed - Partially</option>
                                </select>
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Satisfaction ({form.satisfactionRating}/5)</label>
                                    <input type="range" min="1" max="5" value={form.satisfactionRating} onChange={e => setForm({ ...form, satisfactionRating: Number(e.target.value) })}
                                        className="w-full accent-accent-blue" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Agent Helpfulness ({form.agentHelpfulness}/10)</label>
                                    <input type="range" min="1" max="10" value={form.agentHelpfulness} onChange={e => setForm({ ...form, agentHelpfulness: Number(e.target.value) })}
                                        className="w-full accent-accent-blue" />
                                </div>
                                <textarea placeholder="Additional comments..." value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} rows={3}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none resize-none sm:col-span-2" />
                                <button onClick={() => setForm({ ...form, canUseAsTestimonial: !form.canUseAsTestimonial })}
                                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${form.canUseAsTestimonial ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400 border border-white/10'}`}>
                                    {form.canUseAsTestimonial ? '✓ Can use as testimonial' : 'Can use as testimonial'}
                                </button>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setIsCreating(false); resetForm(); }} className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold">Cancel</button>
                                <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200">Submit</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-titanium-dark border border-white/10 rounded-2xl px-6 py-16 text-center">
                        <Star size={32} className="text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm">No feedback found.</p>
                        <p className="text-neutral-600 text-xs mt-1">Submit feedback after a ticket has been resolved.</p>
                    </div>
                ) : filtered.map(f => (
                    <div key={f._id} className="bg-[#151515] border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-all group">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} className={s <= f.satisfactionRating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-700'} />
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${f.issueFixed === 'Yes' ? 'bg-green-500/20 text-green-400' : f.issueFixed === 'No' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {f.issueFixed}
                                    </span>
                                </div>
                                {f.comments && <p className="text-xs text-neutral-400 line-clamp-2">{f.comments}</p>}
                                <div className="text-[10px] text-neutral-600 font-mono mt-2">Ticket: {(f.ticketId?.subject || f.ticketId || '').toString().slice(0, 30)}</div>
                            </div>
                            <button onClick={() => handleDelete(f._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
            <AnimatePresence>{confirmAction && <ConfirmDialog message={confirmAction.message} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />}</AnimatePresence>
        </div>
    );
};

// --- Leads Tab ---
const LeadsTab: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchId, setSearchId] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ message: string; action: () => void } | null>(null);
    const [form, setForm] = useState<LeadPayload>({ name: '', email: '', message: '', source: 'landing_page' });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getAllLeads();
            setLeads(result.data);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => setForm({ name: '', email: '', message: '', source: 'landing_page' });

    const handleCreate = () => {
        if (!form.name || !form.email) return;
        setConfirmAction({
            message: 'Create this lead?',
            action: async () => {
                const created = await createLead(form);
                setLeads(prev => [created, ...prev]);
                setIsCreating(false);
                resetForm();
            }
        });
    };

    const handleUpdate = (id: string) => {
        setConfirmAction({
            message: 'Save changes to this lead?',
            action: async () => {
                const updated = await updateLead(id, form);
                setLeads(prev => prev.map(l => l._id === id ? updated : l));
                setEditingId(null);
                resetForm();
            }
        });
    };

    const handleDelete = (id: string) => {
        setConfirmAction({
            message: 'Delete this lead?',
            action: async () => {
                await deleteLead(id);
                setLeads(prev => prev.filter(l => l._id !== id));
            }
        });
    };

    const startEdit = (lead: Lead) => {
        setEditingId(lead._id);
        setIsCreating(true);
        setForm({ name: lead.name, email: lead.email, message: lead.message || '', source: lead.source || 'landing_page' });
    };

    const filtered = searchId ? leads.filter(l => l._id.includes(searchId) || l.email.toLowerCase().includes(searchId.toLowerCase())) : leads;

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="text-white animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" placeholder="Search by ID or email..." value={searchId} onChange={e => setSearchId(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue" />
                </div>
                <button onClick={() => { setIsCreating(true); setEditingId(null); resetForm(); }}
                    className="px-4 py-2.5 bg-accent-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shrink-0">
                    <Plus size={16} /> New Lead
                </button>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-white">{editingId ? 'Edit Lead' : 'New Lead'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none" />
                                <textarea placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none resize-none sm:col-span-2" />
                                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                                    className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none sm:col-span-2">
                                    {['landing_page', 'referral', 'organic', 'paid_ad', 'social', 'email_campaign', 'other'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }}
                                    className="flex-1 py-2.5 rounded-xl text-neutral-400 hover:text-white font-bold">Cancel</button>
                                <button onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                                    className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200">
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-titanium-dark border border-white/10 rounded-2xl px-6 py-16 text-center">
                        <MessageSquare size={32} className="text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm">No leads found.</p>
                        <p className="text-neutral-600 text-xs mt-1">Capture leads to track customer interest.</p>
                    </div>
                ) : filtered.map(l => (
                    <div key={l._id} className="bg-[#151515] border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-all group">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white">{l.name}</div>
                                <div className="text-xs text-neutral-400">{l.email}</div>
                                {l.message && <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{l.message}</p>}
                                <div className="text-[10px] text-neutral-600 font-mono mt-2">Source: {l.source || 'unknown'}</div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(l)} className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(l._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <AnimatePresence>{confirmAction && <ConfirmDialog message={confirmAction.message} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />}</AnimatePresence>
        </div>
    );
};

// --- Stat Card ---
const StatCard = ({ label, value, icon: Icon, gradient }: { label: string; value: string | number; icon: any; gradient: string }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-white/10 p-5">
        <div className={`absolute inset-0 opacity-20 ${gradient}`} />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</span>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><Icon size={16} className="text-white" /></div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        </div>
    </motion.div>
);

// --- Main View ---
const SupportTicketsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabView>('tickets');
    const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, avgSatisfaction: 0, issueTypes: 0, resolutions: 0, feedbackCount: 0, leadsCount: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [tRes, iRes, rRes, fRes, lRes] = await Promise.all([
                    getAllTickets(),
                    getAllIssueTypes(),
                    getAllResolutions(),
                    getAllFeedback(),
                    getAllLeads()
                ]);
                const tickets = tRes.data;
                const fb = fRes.data;
                const avgSat = fb.length > 0 ? (fb.reduce((a, f) => a + f.satisfactionRating, 0) / fb.length).toFixed(1) : '0';
                setStats({
                    total: tickets.length,
                    open: tickets.filter(t => t.status === 'Open').length,
                    resolved: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
                    avgSatisfaction: Number(avgSat),
                    issueTypes: iRes.data.length,
                    resolutions: rRes.data.length,
                    feedbackCount: fb.length,
                    leadsCount: lRes.data.length,
                });
            } catch { }
        };
        fetchStats();
    }, [activeTab]);

    const tabs: { key: TabView; label: string; icon: any; count: number }[] = [
        { key: 'tickets', label: 'Tickets', icon: MessageSquare, count: stats.total },
        { key: 'issue-types', label: 'Issue Types', icon: AlertTriangle, count: stats.issueTypes },
        { key: 'resolutions', label: 'Resolutions', icon: CheckCircle2, count: stats.resolutions },
        { key: 'feedback', label: 'Feedback', icon: Star, count: stats.feedbackCount },
        { key: 'leads', label: 'Leads', icon: Send, count: stats.leadsCount },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-24">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
                        <Headset size={20} className="text-accent-blue" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Customer Care</h1>
                        <p className="text-xs text-neutral-500">Manage support tickets, resolutions, feedback, and leads</p>
                    </div>
                </div>
            </header>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                <StatCard label="Total Tickets" value={stats.total} icon={MessageSquare} gradient="bg-gradient-to-br from-blue-600 to-blue-900" />
                <StatCard label="Open" value={stats.open} icon={Clock} gradient="bg-gradient-to-br from-yellow-600 to-orange-900" />
                <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} gradient="bg-gradient-to-br from-emerald-600 to-green-900" />
                <StatCard label="Avg. Satisfaction" value={`${stats.avgSatisfaction}/5`} icon={Star} gradient="bg-gradient-to-br from-purple-600 to-violet-900" />
            </div>

            {/* Tab Switcher with Count Badges */}
            <div className="bg-titanium-dark p-1.5 rounded-2xl border border-white/10 inline-flex mb-8 gap-1">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`relative px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all duration-200 ${isActive ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}>
                            <Icon size={14} /> {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-black/10' : 'bg-white/10'}`}>{tab.count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    {activeTab === 'tickets' && <TicketsTab />}
                    {activeTab === 'issue-types' && <IssueTypesTab />}
                    {activeTab === 'resolutions' && <ResolutionsTab />}
                    {activeTab === 'feedback' && <FeedbackTab />}
                    {activeTab === 'leads' && <LeadsTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SupportTicketsView;
