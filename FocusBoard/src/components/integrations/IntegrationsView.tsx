
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Blocks, Calendar, MessageSquare, Github, CheckCircle2,
    AlertCircle, RefreshCw, Key, Webhook, Plus, Trash2,
    ExternalLink, Settings, X, Search, Terminal, Zap, Shield,
    ChevronRight, Copy, Activity, Eye, EyeOff, Lock, Server,
    ArrowUpRight, Clock, FileText
} from 'lucide-react';
import Skeleton from '../shared/Skeleton';
import { integrationApi } from '../../services/integrationApi';

// --- Types ---

type IntegrationCategory = 'All' | 'Calendar' | 'Communication' | 'Developer' | 'Project' | 'Automation';

interface Integration {
    id: string;
    backendId?: string;
    name: string;
    category: IntegrationCategory;
    icon: any;
    color: string; // Tailwind bg color for brand
    description: string;
    longDescription?: string;
    features?: string[];
    connected: boolean;
    syncStatus?: 'Synced' | 'Syncing' | 'Error' | 'Pending';
    lastSync?: string;
    lastSyncRaw?: string;
    createdAt?: string;
    updatedAt?: string;
    config?: Record<string, any>;
}

interface WebhookLog {
    id: string;
    event: string;
    status: number;
    latency: string;
    timestamp: string;
}

interface DeveloperKey {
    id: string;
    name: string;
    prefix: string;
    created: string;
    lastUsed: string;
}

// --- Integration Catalog ---

const INTEGRATIONS: Integration[] = [
    {
        id: 'gcal',
        name: 'Google Calendar',
        category: 'Calendar',
        icon: Calendar,
        color: 'bg-blue-500',
        description: 'Two-way sync for your schedule and time blocking.',
        longDescription: 'Connect your Google Calendar to automatically import events as time blocks in your FocusBoard. Enable two-way sync to update your GCal availability when you enter deep focus mode.',
        features: ['Two-way event sync', 'Status updates', 'Meeting detection'],
        connected: false,
    },
    {
        id: 'outlook',
        name: 'Outlook',
        category: 'Calendar',
        icon: Calendar,
        color: 'bg-cyan-600',
        description: 'Sync meetings and events from Outlook.',
        connected: false
    },
    {
        id: 'slack',
        name: 'Slack',
        category: 'Communication',
        icon: MessageSquare,
        color: 'bg-purple-600',
        description: 'Get focus nudges and status updates directly in Slack.',
        features: ['Status sync', 'Do Not Disturb toggle', 'Channel notifications'],
        connected: false,
    },
    {
        id: 'github',
        name: 'GitHub',
        category: 'Developer',
        icon: Github,
        color: 'bg-neutral-700',
        description: 'Automatically link Pull Requests to tasks.',
        connected: false
    },
    {
        id: 'jira',
        name: 'Jira',
        category: 'Project',
        icon: Blocks,
        color: 'bg-blue-600',
        description: 'Sync issues and track time against Jira tickets.',
        connected: false
    },
    {
        id: 'zapier',
        name: 'Zapier',
        category: 'Automation',
        icon: Zap,
        color: 'bg-orange-500',
        description: 'Connect FocusBoard to 5,000+ other apps.',
        connected: false
    },
    {
        id: 'notion',
        name: 'Notion',
        category: 'Project',
        icon: FileText,
        color: 'bg-neutral-600',
        description: 'Import tasks from Notion databases.',
        connected: false
    },
];

const toIntegrationCategory = (value: string): IntegrationCategory => {
    const normalized = value.toLowerCase();
    if (normalized === 'calendar') return 'Calendar';
    if (normalized === 'communication') return 'Communication';
    if (normalized === 'developer') return 'Developer';
    if (normalized === 'project') return 'Project';
    if (normalized === 'automation') return 'Automation';
    return 'All';
};

const formatDateOrFallback = (isoDate?: string, fallback = '—') => {
    if (!isoDate) return fallback;
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString();
};

const formatTimeOrFallback = (isoDate?: string, fallback = '—') => {
    if (!isoDate) return fallback;
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatIntegrationSyncTime = (isoDate?: string) => {
    if (!isoDate) return undefined;
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toLocaleDateString();
};

// --- Sub-Components ---

const IntegrationDrawer = ({ integration, onClose, onUpdate }: { integration: Integration, onClose: () => void, onUpdate: (id: string, updates: Partial<Integration>) => Promise<void> | void }) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SETTINGS' | 'LOGS'>('OVERVIEW');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [config, setConfig] = useState({
        syncEvents: true,
        updateStatus: true,
        readOnly: false
    });

    useEffect(() => {
        setConfig({
            syncEvents: integration.config?.syncEvents ?? true,
            updateStatus: integration.config?.updateStatus ?? true,
            readOnly: integration.config?.readOnly ?? false,
        });
    }, [integration.id, integration.config]);

    const handleConnect = async () => {
        setIsConnecting(true);
        setActionError(null);
        try {
            await onUpdate(integration.id, { connected: true, syncStatus: 'Synced', lastSync: 'Just now', config });
        } catch (error: any) {
            setActionError(error?.message || 'Failed to connect integration.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (confirm(`Disconnect ${integration.name}? This will stop all sync activities.`)) {
            setIsDisconnecting(true);
            setActionError(null);
            try {
                await onUpdate(integration.id, { connected: false, syncStatus: 'Pending' });
                onClose();
            } catch (error: any) {
                setActionError(error?.message || 'Failed to disconnect integration.');
            } finally {
                setIsDisconnecting(false);
            }
        }
    };

    const persistConfig = async (nextConfig: typeof config) => {
        setConfig(nextConfig);
        if (!integration.connected) {
            return;
        }

        setActionError(null);
        try {
            await onUpdate(integration.id, { config: nextConfig });
        } catch (error: any) {
            setActionError(error?.message || 'Failed to update integration settings.');
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-2 right-2 w-full max-w-lg bg-[#121212] border border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="relative h-48 shrink-0 overflow-hidden">
                    <div className={`absolute inset-0 ${integration.color} opacity-20`} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121212]" />

                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="absolute bottom-6 left-6 flex items-end gap-4">
                        <div className={`w-16 h-16 rounded-2xl ${integration.color} flex items-center justify-center text-white shadow-xl shadow-black/50`}>
                            <integration.icon size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">{integration.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                {integration.connected ? (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                        <CheckCircle2 size={10} /> Connected
                                    </span>
                                ) : (
                                    <span className="text-xs font-medium text-neutral-400">Not connected</span>
                                )}
                                {integration.connected && (
                                    <span className="text-xs text-neutral-500">• Last synced {integration.lastSync}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 px-6 gap-6">
                    {['OVERVIEW', 'SETTINGS', 'LOGS'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-3 text-xs font-bold tracking-wider border-b-2 transition-colors ${activeTab === tab ? 'border-accent-blue text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {actionError && (
                        <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-300">
                            {actionError}
                        </div>
                    )}
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-8">
                            <p className="text-neutral-300 leading-relaxed text-sm">
                                {integration.longDescription || integration.description}
                            </p>

                            <div>
                                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Key Features</h3>
                                <div className="space-y-2">
                                    {(integration.features || ['Seamless data sync', 'Real-time updates', 'Secure connection']).map((feat, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-titanium-dark border border-white/5">
                                            <CheckCircle2 size={16} className="text-accent-blue shrink-0" />
                                            <span className="text-sm text-neutral-300">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!integration.connected ? (
                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {isConnecting ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <>Connect {integration.name} <ArrowUpRight size={18} /></>
                                    )}
                                </button>
                            ) : (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                                    <Shield size={20} className="text-green-400 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-green-400">Connection Active</h4>
                                        <p className="text-xs text-green-200/70 mt-1">Data is syncing securely. Last successful sync was {integration.lastSync}.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'SETTINGS' && (
                        <div className="space-y-6">
                            {!integration.connected ? (
                                <div className="text-center py-10 text-neutral-500 text-sm">
                                    Connect this integration to configure settings.
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Sync Options</h3>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-titanium-dark border border-white/5">
                                            <div className="text-sm text-white font-medium">Sync Calendar Events</div>
                                            <button
                                                onClick={() => persistConfig({ ...config, syncEvents: !config.syncEvents })}
                                                className={`w-10 h-5 rounded-full relative transition-colors ${config.syncEvents ? 'bg-accent-blue' : 'bg-neutral-700'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.syncEvents ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-titanium-dark border border-white/5">
                                            <div className="text-sm text-white font-medium">Update Status on Focus</div>
                                            <button
                                                onClick={() => persistConfig({ ...config, updateStatus: !config.updateStatus })}
                                                className={`w-10 h-5 rounded-full relative transition-colors ${config.updateStatus ? 'bg-accent-blue' : 'bg-neutral-700'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.updateStatus ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Danger Zone</h3>
                                        <button
                                            onClick={handleDisconnect}
                                            disabled={isDisconnecting}
                                            className="w-full py-3 border border-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isDisconnecting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />} Disconnect Integration
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'LOGS' && (
                        <div className="space-y-2">
                            {!integration.connected ? (
                                <div className="text-center py-10 text-neutral-500 text-sm">
                                    No activity logs available.
                                </div>
                            ) : (
                                <div className="font-mono text-xs space-y-1">
                                    <div className="flex justify-between text-neutral-500 px-2 mb-2">
                                        <span>Event</span>
                                        <span>Time</span>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((_, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                <span className="text-neutral-300">sync.completed</span>
                                            </div>
                                            <span className="text-neutral-600">10:{42 - i}:00 AM</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
};

const DeveloperTools = ({ integrations, onOpenIntegration }: { integrations: Integration[]; onOpenIntegration: (integration: Integration) => void }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const activeIntegrations = integrations.filter(integration => integration.connected);

    const keys: DeveloperKey[] = activeIntegrations.map(integration => {
        const normalized = integration.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        return {
            id: integration.backendId || integration.id,
            name: `${integration.name} Integration Key`,
            prefix: `fb_${normalized}_`,
            created: formatDateOrFallback(integration.createdAt),
            lastUsed: formatDateOrFallback(integration.lastSyncRaw || integration.updatedAt),
        };
    });

    const webhookLogs: WebhookLog[] = activeIntegrations
        .map((integration) => {
            const status = integration.syncStatus === 'Error' ? 500 : 200;
            return {
                id: integration.backendId || integration.id,
                event: `integration.sync.${(integration.syncStatus || 'pending').toLowerCase()}`,
                status,
                latency: 'N/A',
                timestamp: formatTimeOrFallback(integration.lastSyncRaw || integration.updatedAt),
            };
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* API Keys */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Key size={18} className="text-accent-blue" /> API Keys
                        </h3>
                        <p className="text-sm text-neutral-500 mt-1">Derived from your connected integrations on the backend.</p>
                    </div>
                </div>

                <div className="bg-titanium-dark border border-titanium-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="p-4 font-bold text-neutral-400 uppercase text-[10px] tracking-wider">Name</th>
                                    <th className="p-4 font-bold text-neutral-400 uppercase text-[10px] tracking-wider">Token</th>
                                    <th className="p-4 font-bold text-neutral-400 uppercase text-[10px] tracking-wider">Created</th>
                                    <th className="p-4 font-bold text-neutral-400 uppercase text-[10px] tracking-wider">Last Used</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {keys.map(key => (
                                    <tr key={key.id} className="group hover:bg-white/[0.02]">
                                        <td className="p-4 font-medium text-white">{key.name}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 group/key">
                                                <code className="font-mono text-xs text-neutral-400 bg-black/20 rounded px-2 py-1">{key.prefix}••••••••</code>
                                                <button
                                                    onClick={() => copyToClipboard(`${key.prefix}********`, key.id)}
                                                    className="opacity-0 group-hover/key:opacity-100 transition-opacity text-neutral-500 hover:text-white"
                                                >
                                                    {copiedId === key.id ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-neutral-500 text-xs">{key.created}</td>
                                        <td className="p-4 text-neutral-300 text-xs font-mono">{key.lastUsed}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => {
                                                    const integration = integrations.find(item => (item.backendId || item.id) === key.id);
                                                    if (integration) onOpenIntegration(integration);
                                                }}
                                                className="text-neutral-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                            >
                                                <Settings size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {keys.length === 0 && (
                                    <tr>
                                        <td className="p-4 text-neutral-500 text-sm" colSpan={5}>
                                            No connected integrations yet. Connect an app in Explore to populate keys.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Webhook Console */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                        <Webhook size={18} className="text-accent-purple" /> Webhooks
                    </h3>
                    <p className="text-sm text-neutral-500 mb-6">Receive real-time event notifications to your server.</p>

                    <div className="space-y-3">
                        <button className="w-full p-4 rounded-xl bg-titanium-dark border border-accent-blue/30 shadow-[0_0_15px_rgba(47,88,205,0.1)] flex items-start gap-3 transition-all hover:bg-white/5">
                            <div className="mt-1 w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                            <div className="text-left overflow-hidden">
                                <div className="text-sm font-bold text-white truncate">Integration Delivery Stream</div>
                                <div className="text-xs text-neutral-500 font-mono truncate mt-1">Derived from backend integration sync events</div>
                                <div className="flex gap-1 mt-2">
                                    <span className="text-[9px] bg-white/10 text-neutral-300 px-1.5 py-0.5 rounded">integration.sync.*</span>
                                    <span className="text-[9px] bg-white/10 text-neutral-300 px-1.5 py-0.5 rounded">integration.updated</span>
                                </div>
                            </div>
                        </button>
                        <button className="w-full p-3 rounded-xl border border-dashed border-white/10 text-neutral-500 hover:text-white hover:border-white/20 transition-colors text-sm font-bold flex items-center justify-center gap-2" disabled>
                            <Plus size={16} /> Endpoint Management Coming Soon
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden flex flex-col h-80 font-mono text-xs">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-titanium-dark">
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-neutral-400" />
                            <span className="font-bold text-neutral-300">Recent Deliveries</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-green-500 font-bold">Live</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                        {webhookLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.status === 200 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {log.status}
                                    </span>
                                    <span className="text-neutral-300 font-medium">{log.event}</span>
                                    <span className="text-neutral-600">{log.id}</span>
                                </div>
                                <div className="flex items-center gap-4 text-neutral-500">
                                    <span>{log.latency}</span>
                                    <span>{log.timestamp}</span>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                        {webhookLogs.length === 0 && (
                            <div className="h-full min-h-[120px] flex items-center justify-center text-neutral-500 text-sm">
                                No integration deliveries yet.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

// --- Main View ---

type IntegrationsTab = 'EXPLORE' | 'CONNECTED' | 'DEVELOPER';

const IntegrationsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<IntegrationsTab>('EXPLORE');
    const [integrations, setIntegrations] = useState(INTEGRATIONS);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<IntegrationCategory>('All');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchIntegrations = async () => {
            try {
                const connected = await integrationApi.getIntegrations();
                const connectedMap = new Map(connected.map((c: any) => [c.name.toLowerCase(), c]));

                setIntegrations(prev => prev.map(i => {
                    const match = connectedMap.get(i.name.toLowerCase());
                    if (match) {
                        return {
                            ...i,
                            backendId: match._id,
                            connected: Boolean(match.connected),
                            syncStatus: match.syncStatus || 'Pending',
                            lastSync: formatIntegrationSyncTime(match.lastSync || match.updatedAt),
                            lastSyncRaw: match.lastSync || match.updatedAt,
                            createdAt: match.createdAt,
                            updatedAt: match.updatedAt,
                            config: match.config || i.config,
                            category: toIntegrationCategory(match.category) === 'All' ? i.category : toIntegrationCategory(match.category)
                        };
                    }
                    return { ...i, connected: false };
                }));
            } catch (err) {
                console.error("Failed to load integrations", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchIntegrations();
    }, []);

    const handleUpdate = async (id: string, updates: Partial<Integration>) => {
        const current = integrations.find(i => i.id === id);
        if (!current) return;

        const optimistic = { ...current, ...updates };
        setIntegrations(prev => prev.map(i => i.id === id ? optimistic : i));
        if (selectedIntegration?.id === id) {
            setSelectedIntegration(optimistic);
        }

        try {
            if (updates.connected === false) {
                if (current.backendId) {
                    await integrationApi.deleteIntegration(current.backendId);
                }

                const disconnected = {
                    ...optimistic,
                    backendId: undefined,
                    connected: false,
                    syncStatus: 'Pending' as const,
                    lastSync: undefined,
                };

                setIntegrations(prev => prev.map(i => i.id === id ? disconnected : i));
                if (selectedIntegration?.id === id) {
                    setSelectedIntegration(disconnected);
                }
                return;
            }

            const payload = {
                name: current.name,
                category: optimistic.category === 'All' ? current.category : optimistic.category,
                connected: optimistic.connected,
                syncStatus: optimistic.syncStatus,
                config: optimistic.config || {},
                lastSync: updates.connected ? new Date().toISOString() : undefined,
            };

            const saved = current.backendId
                ? await integrationApi.updateIntegration(current.backendId, payload)
                : await integrationApi.createIntegration(payload);

            const persisted = {
                ...optimistic,
                backendId: saved._id,
                connected: Boolean(saved.connected),
                syncStatus: saved.syncStatus,
                lastSync: formatIntegrationSyncTime(saved.lastSync || saved.updatedAt),
                lastSyncRaw: saved.lastSync || saved.updatedAt,
                createdAt: saved.createdAt,
                updatedAt: saved.updatedAt,
                config: saved.config || optimistic.config,
                category: toIntegrationCategory(saved.category),
            };

            setIntegrations(prev => prev.map(i => i.id === id ? persisted : i));
            if (selectedIntegration?.id === id) {
                setSelectedIntegration(persisted);
            }
        } catch (error) {
            setIntegrations(prev => prev.map(i => i.id === id ? current : i));
            if (selectedIntegration?.id === id) {
                setSelectedIntegration(current);
            }
            throw error;
        }
    };

    const filteredIntegrations = integrations.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || i.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const activeIntegrations = integrations.filter(i => i.connected);

    return (
        <div className="flex flex-col h-screen bg-[#050505] overflow-hidden text-white">

            {/* Header */}
            <div className="px-6 py-8 sm:px-10 border-b border-white/5 bg-titanium-dark/50 backdrop-blur-xl z-20 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">App Store</h1>
                    <p className="text-neutral-400 max-w-xl">Supercharge your workflow by connecting your favorite tools.</p>
                </div>

                <div className="flex gap-1 bg-neutral-900 p-1 rounded-xl border border-white/10 self-start md:self-auto overflow-x-auto max-w-full">
                    {(['EXPLORE', 'CONNECTED', 'DEVELOPER'] as IntegrationsTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab === 'EXPLORE' ? 'Explore' : tab === 'CONNECTED' ? `Active (${activeIntegrations.length})` : 'Developer'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 scroll-smooth pb-32">
                <div className="max-w-7xl mx-auto">

                    {isLoading ? (
                        <div className="space-y-8 animate-in fade-in">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                <div className="flex gap-2">
                                    <Skeleton width={80} height={32} className="rounded-full" />
                                    <Skeleton width={80} height={32} className="rounded-full" />
                                    <Skeleton width={80} height={32} className="rounded-full" />
                                </div>
                                <Skeleton width={250} height={40} className="rounded-xl" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(k => (
                                    <Skeleton key={k} className="h-60 w-full rounded-[22px]" />
                                ))}
                            </div>
                        </div>
                    ) : activeTab === 'EXPLORE' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full pb-2 md:pb-0">
                                    {(['All', 'Calendar', 'Communication', 'Project', 'Developer', 'Automation'] as IntegrationCategory[]).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search apps..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-titanium-dark border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors placeholder:text-neutral-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <AnimatePresence>
                                    {filteredIntegrations.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => setSelectedIntegration(item)}
                                            className="bg-titanium-dark border border-titanium-border rounded-[22px] p-5 flex flex-col justify-between hover:border-white/20 hover:bg-white/[0.02] transition-all group cursor-pointer h-60 relative overflow-hidden"
                                        >
                                            {/* Hover Glow */}
                                            <div className={`absolute -right-10 -top-10 w-32 h-32 ${item.color} blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`} />

                                            <div>
                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${item.color}`}>
                                                        <item.icon size={24} />
                                                    </div>
                                                    {item.connected && (
                                                        <div className="bg-green-500/10 text-green-400 p-1.5 rounded-full border border-green-500/20">
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-accent-blue transition-colors">{item.name}</h3>
                                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{item.category}</p>
                                                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{item.description}</p>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs font-bold text-neutral-500 group-hover:text-white transition-colors">
                                                <span>{item.connected ? 'Manage' : 'Connect'}</span>
                                                <ArrowUpRight size={14} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CONNECTED' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeIntegrations.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {activeIntegrations.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedIntegration(item)}
                                            className="bg-titanium-dark border border-titanium-border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-white/20 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-5 w-full sm:w-auto">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${item.color}`}>
                                                    <item.icon size={28} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                                        {item.name}
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${item.syncStatus === 'Synced' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                                            {item.syncStatus}
                                                        </span>
                                                    </h3>
                                                    <p className="text-sm text-neutral-500 mt-1">Last synced: {item.lastSync}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                                <div className="hidden sm:flex flex-col items-end mr-4">
                                                    <span className="text-xs text-neutral-400 font-medium">Activity</span>
                                                    <div className="flex gap-0.5 mt-1">
                                                        {[1, 2, 3, 4, 5].map(k => <div key={k} className={`w-1 h-3 rounded-full ${k > 2 ? 'bg-green-500' : 'bg-neutral-800'}`} />)}
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs font-bold text-neutral-300 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                                    Configure
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-32 bg-titanium-dark border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-neutral-800/50 rounded-3xl flex items-center justify-center mb-6 text-neutral-600">
                                        <Blocks size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No active connections</h3>
                                    <p className="text-neutral-500 mb-8 max-w-sm">Connect your calendar, communication tools, and project management apps to get started.</p>
                                    <button
                                        onClick={() => setActiveTab('EXPLORE')}
                                        className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors shadow-xl shadow-white/5"
                                    >
                                        Browse App Store
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'DEVELOPER' && <DeveloperTools integrations={integrations} onOpenIntegration={setSelectedIntegration} />}

                </div>
            </div>

            {/* Drawer */}
            <AnimatePresence>
                {selectedIntegration && (
                    <IntegrationDrawer
                        integration={selectedIntegration}
                        onClose={() => setSelectedIntegration(null)}
                        onUpdate={handleUpdate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default IntegrationsView;
