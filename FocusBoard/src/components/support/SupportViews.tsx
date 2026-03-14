
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Book, MessageCircle, Shield, FileText, Activity,
    CheckCircle2, AlertCircle, X, ExternalLink, Command,
    ArrowRight, ChevronRight, Zap, Keyboard, Globe, Server, Cloud, RefreshCw
} from 'lucide-react';
import {
    getAllResolutions,
    getAllTickets,
    type SupportTicket,
    type TicketResolution,
} from '../../services/supportApi';

// --- Shared Wrapper ---
const SupportLayout = ({ title, children, actions }: { title: string, children: React.ReactNode, actions?: React.ReactNode }) => (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1200px] mx-auto min-h-screen pb-32">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h1>
                <div className="h-1 w-12 bg-accent-blue rounded-full mt-4" />
            </div>
            {actions}
        </header>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
        >
            {children}
        </motion.div>
    </div>
);

// --- 1. Help Center ---
export const HelpCenter: React.FC<{ onNavigate: (page: any) => void }> = ({ onNavigate }) => {
    return (
        <SupportLayout title="Help Center">
            <div className="relative mb-12">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={24} />
                <input
                    type="text"
                    placeholder="Search documentation, tutorials, and FAQs..."
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue transition-colors shadow-2xl"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: 'Getting Started', icon: Zap, desc: 'Quick start guide to setting up your workspace.' },
                    { title: 'Projects & Tasks', icon: Book, desc: 'Managing your workflow effectively.' },
                    { title: 'Team & Roles', icon: MessageCircle, desc: 'Collaborating with your squad.' },
                    { title: 'Shortcuts', icon: Keyboard, desc: 'Speed up your workflow.', link: 'shortcuts' },
                    { title: 'Billing & Plans', icon: FileText, desc: 'Managing subscriptions and invoices.' },
                    { title: 'System Status', icon: Activity, desc: 'Check current operational status.', link: 'status' },
                ].map((item, i) => (
                    <motion.button
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => item.link && onNavigate(item.link)}
                        className="p-6 bg-titanium-dark border border-white/5 rounded-2xl text-left hover:bg-white/5 hover:border-white/10 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white mb-4 group-hover:bg-accent-blue group-hover:scale-110 transition-all duration-300">
                            <item.icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-neutral-400">{item.desc}</p>
                    </motion.button>
                ))}
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Still need help?</h3>
                    <p className="text-neutral-400">Our support team is available 24/7 to assist you.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => onNavigate('support-tickets')} className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors">Contact Support</button>
                    <button className="px-6 py-3 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-colors">Join Community</button>
                </div>
            </div>
        </SupportLayout>
    );
};

// --- 2. Keyboard Shortcuts ---
export const ShortcutsPage = () => {
    const categories = [
        {
            title: 'General',
            shortcuts: [
                { keys: ['?'], desc: 'Toggle Shortcut HUD' },
                { keys: ['/'], desc: 'Search' },
                { keys: ['Esc'], desc: 'Close Modal / Clear Selection' },
            ]
        },
        {
            title: 'Navigation',
            shortcuts: [
                { keys: ['G', 'D'], desc: 'Go to Dashboard' },
                { keys: ['G', 'T'], desc: 'Go to Tasks' },
                { keys: ['G', 'C'], desc: 'Go to Calendar' },
                { keys: ['G', 'S'], desc: 'Go to Settings' },
            ]
        },
        {
            title: 'Actions',
            shortcuts: [
                { keys: ['F'], desc: 'Start Focus Session' },
                { keys: ['B'], desc: 'Take a Break' },
                { keys: ['C'], desc: 'Create New Task' },
                { keys: ['Space'], desc: 'Play / Pause Timer' },
            ]
        }
    ];

    return (
        <SupportLayout title="Keyboard Shortcuts">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {categories.map((cat, i) => (
                    <div key={cat.title} className="space-y-4">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">{cat.title}</h3>
                        <div className="space-y-1">
                            {cat.shortcuts.map((s, j) => (
                                <div key={j} className="flex items-center justify-between p-3 rounded-xl bg-titanium-dark border border-white/5">
                                    <span className="text-sm font-medium text-white">{s.desc}</span>
                                    <div className="flex gap-1.5">
                                        {s.keys.map((k, idx) => (
                                            <kbd key={idx} className="min-w-[28px] h-7 px-2 flex items-center justify-center bg-[#2C2C2E] border-b-2 border-black rounded text-xs font-mono font-bold text-neutral-300">
                                                {k}
                                            </kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </SupportLayout>
    );
};

// --- 3. Privacy Policy ---
export const PrivacyPolicy = () => (
    <SupportLayout title="Privacy Policy">
        <div className="prose prose-invert prose-lg max-w-none text-neutral-300 space-y-8">
            <p className="text-xl leading-relaxed">
                At FocusBoard, we believe your productivity data is personal. We are committed to transparency and security in how we handle your information.
            </p>

            <section>
                <h3 className="text-white font-bold text-xl mb-4">1. Data Collection</h3>
                <p>We collect only the essential data required to provide our services:</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                    <li>Account information (email, name) for authentication.</li>
                    <li>Usage metrics (focus duration, task completion) to generate reports.</li>
                    <li>System logs for debugging and performance monitoring.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-white font-bold text-xl mb-4">2. Local-First Architecture</h3>
                <p>
                    By default, detailed activity logs (such as app usage and window titles) are stored locally on your device. Only aggregated statistics are synced to our servers for team reporting. You can opt-out of cloud sync entirely in Settings.
                </p>
            </section>

            <section>
                <h3 className="text-white font-bold text-xl mb-4">3. Third-Party Services</h3>
                <p>
                    We may use third-party services for payments (Stripe) and email delivery. These partners adhere to strict GDPR and CCPA compliance standards.
                </p>
            </section>

            <div className="p-6 bg-white/5 border border-white/10 rounded-xl mt-8">
                <p className="text-sm text-neutral-400">Last updated: October 24, 2023</p>
            </div>
        </div>
    </SupportLayout>
);

// --- 4. Terms of Service ---
export const TermsOfService = () => (
    <SupportLayout title="Terms of Service">
        <div className="prose prose-invert prose-lg max-w-none text-neutral-300 space-y-8">
            <p className="text-xl leading-relaxed">
                By accessing or using FocusBoard, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>

            <section>
                <h3 className="text-white font-bold text-xl mb-4">1. Usage License</h3>
                <p>
                    Permission is granted to temporarily download one copy of the materials (information or software) on FocusBoard's website for personal, non-commercial transitory viewing only.
                </p>
            </section>

            <section>
                <h3 className="text-white font-bold text-xl mb-4">2. Disclaimer</h3>
                <p>
                    The materials on FocusBoard's website are provided on an 'as is' basis. FocusBoard makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability.
                </p>
            </section>

            <section>
                <h3 className="text-white font-bold text-xl mb-4">3. Limitations</h3>
                <p>
                    In no event shall FocusBoard or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on FocusBoard.
                </p>
            </section>

            <div className="p-6 bg-white/5 border border-white/10 rounded-xl mt-8">
                <p className="text-sm text-neutral-400">Effective Date: January 1, 2023</p>
            </div>
        </div>
    </SupportLayout>
);

// --- 5. System Status ---
export const SystemStatus = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [resolutions, setResolutions] = useState<TicketResolution[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadStatusData = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const [ticketsResult, resolutionsResult] = await Promise.all([
                    getAllTickets(1, 200),
                    getAllResolutions(1, 200),
                ]);

                if (!mounted) return;
                setTickets(ticketsResult.data || []);
                setResolutions(resolutionsResult.data || []);
            } catch (error: any) {
                if (!mounted) return;
                setLoadError(error?.message || 'Unable to load system status data.');
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        loadStatusData();
        return () => {
            mounted = false;
        };
    }, []);

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => (t.status || 'Open') === 'Open' || t.status === 'In Progress').length;
    const criticalOpenTickets = tickets.filter(t => t.priority === 'Critical' && ((t.status || 'Open') === 'Open' || t.status === 'In Progress')).length;
    const resolvedTickets = Math.max(
        tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
        resolutions.length,
    );

    const stabilityScore = totalTickets === 0
        ? 100
        : Math.max(90, Math.min(100, ((totalTickets - criticalOpenTickets) / totalTickets) * 100));
    const syncScore = totalTickets === 0
        ? 100
        : Math.max(90, Math.min(100, ((totalTickets - openTickets) / totalTickets) * 100));
    const resolutionScore = totalTickets === 0
        ? 100
        : Math.max(90, Math.min(100, (resolvedTickets / totalTickets) * 100));

    const systems = [
        {
            name: 'API Gateway',
            status: criticalOpenTickets > 0 ? 'degraded' : 'operational',
            uptime: `${stabilityScore.toFixed(2)}%`,
            message: criticalOpenTickets > 0 ? `${criticalOpenTickets} critical ticket(s) currently open` : undefined,
        },
        {
            name: 'Real-time Sync',
            status: openTickets > 10 ? 'degraded' : 'operational',
            uptime: `${syncScore.toFixed(2)}%`,
            message: openTickets > 10 ? `${openTickets} unresolved sync-related tickets` : undefined,
        },
        {
            name: 'Database Clusters',
            status: criticalOpenTickets > 1 ? 'degraded' : 'operational',
            uptime: `${stabilityScore.toFixed(2)}%`,
            message: criticalOpenTickets > 1 ? 'Investigating elevated critical backlog' : undefined,
        },
        {
            name: 'Notification Service',
            status: openTickets > resolvedTickets ? 'degraded' : 'operational',
            uptime: `${resolutionScore.toFixed(2)}%`,
            message: openTickets > resolvedTickets ? 'Pending support workload may impact notifications' : undefined,
        },
        {
            name: 'CDN & Assets',
            status: 'operational',
            uptime: '100%',
        },
    ];

    const hasDegraded = systems.some(system => system.status === 'degraded');

    const incidents = [...tickets]
        .filter(ticket => ticket.priority === 'High' || ticket.priority === 'Critical')
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5)
        .map(ticket => ({
            id: ticket._id,
            date: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Unknown date',
            title: ticket.subject,
            status: ticket.status || 'Open',
            desc: ticket.description || 'No details provided.',
        }));

    return (
        <SupportLayout
            title="System Status"
            actions={
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${hasDegraded
                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${hasDegraded ? 'bg-yellow-400' : 'bg-green-500 animate-pulse'}`} />
                    {hasDegraded ? 'Degraded Services Detected' : 'All Systems Operational'}
                </div>
            }
        >
            {isLoading && (
                <div className="flex items-center justify-center gap-3 py-8 text-neutral-400">
                    <RefreshCw size={18} className="animate-spin" />
                    Loading live system metrics...
                </div>
            )}

            {loadError && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-300">
                    {loadError}
                </div>
            )}

            <div className="space-y-4">
                {systems.map((sys) => (
                    <div key={sys.name} className="flex items-center justify-between p-6 bg-titanium-dark border border-white/5 rounded-2xl group hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${sys.status === 'operational' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                <Server size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{sys.name}</h3>
                                {sys.message && <p className="text-xs text-yellow-500 mt-0.5">{sys.message}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-bold uppercase tracking-wider mb-1 ${sys.status === 'operational' ? 'text-green-400' : 'text-yellow-400'}`}>
                                {sys.status}
                            </div>
                            <div className="text-xs text-neutral-500 font-mono">{sys.uptime} uptime</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 bg-[#121212] border border-white/5 rounded-2xl p-8">
                <h3 className="text-lg font-bold text-white mb-6">Incident History</h3>
                <div className="space-y-8 relative before:absolute before:left-[9px] before:top-12 before:bottom-4 before:w-px before:bg-white/10">
                    {incidents.map((inc) => (
                        <div key={inc.id} className="relative pl-8">
                            <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-[#121212] border-2 border-neutral-600 flex items-center justify-center">
                                <div className="w-2 h-2 bg-neutral-600 rounded-full" />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                                <span className="text-sm font-bold text-white">{inc.title}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-neutral-300">{inc.status}</span>
                            </div>
                            <p className="text-sm text-neutral-400 mb-1">{inc.desc}</p>
                            <span className="text-xs text-neutral-600 font-mono">{inc.date}</span>
                        </div>
                    ))}
                    {incidents.length === 0 && (
                        <div className="relative pl-8 text-neutral-500 text-sm">
                            No high-priority incidents have been recorded yet.
                        </div>
                    )}
                </div>
            </div>
        </SupportLayout>
    );
};
