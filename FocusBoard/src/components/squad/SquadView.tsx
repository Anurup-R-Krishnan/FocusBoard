import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquadMember, ActivityEvent } from '../../types';
import { Zap, Clock, Activity, MessageSquare } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { DrillDownType } from '../dashboard/DrillDownView';

interface SquadViewProps {
    onNavigate?: (type: DrillDownType, id: string) => void;
}

const SquadView: React.FC<SquadViewProps> = ({ onNavigate }) => {
    const { squad, triggerNudge } = useDashboardStore();
    // Simulate empty feed for now since we don't fetch one by default here
    const feed: any[] = [];
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'FOCUS': return 'bg-accent-green shadow-[0_0_12px_rgba(48,209,88,0.5)]';
            case 'RECOVERY': return 'bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.5)]';
            case 'DISTRACTED': return 'bg-accent-orange shadow-[0_0_12px_rgba(255,59,48,0.5)]';
            case 'MEETING': return 'bg-accent-purple shadow-[0_0_12px_rgba(191,90,242,0.5)]';
            default: return 'bg-neutral-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'FOCUS': return 'Deep Focus';
            case 'RECOVERY': return 'Recovering';
            case 'DISTRACTED': return 'Distracted';
            case 'MEETING': return 'In Meeting';
            default: return 'Idle';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col lg:flex-row gap-6 pb-24 sm:pb-8">

            {/* Main Column: Squad Grid */}
            <div className="flex-1 flex flex-col gap-6">
                <header className="mb-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Squad</h1>
                    <p className="text-sm text-neutral-500 font-medium">Real-time team presence and flow state.</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {squad.map((member, i) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-titanium-dark border border-titanium-border rounded-[22px] p-6 relative overflow-hidden group hover:border-neutral-600 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-lg"
                                        style={{ backgroundColor: member.avatarUrl && !member.avatarUrl.startsWith('#') ? 'transparent' : member.avatarUrl }}
                                    >
                                        {member.avatarUrl?.startsWith('#') && member.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg leading-none">{member.name}</h3>
                                        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide font-medium">{member.role}</p>
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(member.status)}`} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-neutral-500 font-medium">Status</span>
                                    <span className={`font-bold ${member.status === 'FOCUS' ? 'text-accent-green' : 'text-white'}`}>
                                        {getStatusLabel(member.status)}
                                    </span>
                                </div>

                                {member.currentTask && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-500 font-medium">Working on</span>
                                        <span className="text-white font-medium max-w-[140px] truncate text-right">{member.currentTask}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-neutral-500 font-medium">Last Active</span>
                                    <span className="text-neutral-400 font-mono">{member.lastActive}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
                                <button
                                    onClick={() => onNudge(member.id)}
                                    className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-titanium-border hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors flex items-center justify-center gap-2 group/btn"
                                >
                                    <Zap size={14} className="group-hover/btn:text-yellow-400 transition-colors" />
                                    Nudge
                                </button>
                                <button className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-titanium-border hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors flex items-center justify-center gap-2">
                                    <MessageSquare size={14} />
                                    Message
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Side Column: Activity Feed */}
            <div className="w-full lg:w-96 flex flex-col gap-5 pt-14">
                <div className="bg-titanium-dark border border-titanium-border rounded-[22px] h-[600px] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-titanium-surface">
                        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} />
                            Live Activity
                        </h2>
                        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-green"></span>
                            </span>
                            <span className="text-[9px] text-accent-green font-bold">LIVE</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar relative">
                        {/* Gradient fade at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-titanium-dark to-transparent pointer-events-none z-10" />

                        <AnimatePresence initial={false}>
                            {feed.map((event) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex gap-4 pb-4 border-b border-white/5 last:border-0 group"
                                >
                                    <div className="mt-1.5 relative">
                                        <div className="absolute inset-0 bg-white/20 blur-md rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
                                        {event.type === 'STATUS_CHANGE' && <div className="w-2 h-2 rounded-full bg-accent-blue relative z-10" />}
                                        {event.type === 'NUDGE' && <Zap size={12} className="text-yellow-400 relative z-10" />}
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            <span className="font-bold text-white hover:text-accent-blue cursor-pointer transition-colors">{event.memberName}</span> {event.message}
                                        </p>
                                        <span className="text-[10px] text-neutral-600 font-mono mt-1 block">
                                            {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {feed.length === 0 && (
                                <div className="text-center py-10 text-neutral-600 text-xs">
                                    No recent activity
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Team Stats */}
                <div className="bg-titanium-dark border border-titanium-border rounded-[22px] p-6">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Team Flow Score</h3>
                    <div className="flex items-end gap-3">
                        <span className="text-5xl font-bold text-white tracking-tighter">88</span>
                        <span className="text-sm text-accent-green mb-2 font-bold bg-accent-green/10 px-2 py-0.5 rounded-lg">▲ 4%</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-accent-blue to-accent-purple w-[88%] h-full rounded-full" />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SquadView;