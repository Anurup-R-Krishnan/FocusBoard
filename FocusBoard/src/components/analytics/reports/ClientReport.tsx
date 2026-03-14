
import React, { useMemo } from 'react';
import { Briefcase, Clock, ArrowRight } from 'lucide-react';
import { useClientReport } from '../../../hooks/useClientReport';
import Skeleton from '../../shared/Skeleton';

const ClientReport = () => {
    const dateRange = useMemo(() => ({
        start: new Date(new Date().setDate(1)),
        end: new Date(),
    }), []);
    const { clients, totalBillable, totalBillableHours, loading } = useClientReport(dateRange);
    const rate = 150;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-titanium-dark border border-titanium-border p-6 rounded-[22px] h-24"><Skeleton className="h-full w-full" /></div>
                    <div className="bg-titanium-dark border border-titanium-border p-6 rounded-[22px] h-24"><Skeleton className="h-full w-full" /></div>
                    <div className="bg-titanium-dark border border-titanium-border p-6 rounded-[22px] h-24"><Skeleton className="h-full w-full" /></div>
                </div>
                <div className="bg-titanium-dark border border-titanium-border rounded-[22px] p-6 h-80">
                    <Skeleton className="h-full w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-titanium-dark border border-titanium-border p-6 rounded-[22px] flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Billable</p>
                        <p className="text-3xl font-mono font-bold text-white truncate">${totalBillable.toLocaleString()}<span className="text-lg text-neutral-600">.00</span></p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl text-green-400 shrink-0"><Briefcase size={24} /></div>
                </div>
                <div className="bg-titanium-dark border border-titanium-border p-6 rounded-[22px] flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Billable Hours</p>
                        <p className="text-3xl font-mono font-bold text-white truncate">{totalBillableHours.toFixed(1)}<span className="text-lg text-neutral-600">h</span></p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0"><Clock size={24} /></div>
                </div>
                <div className="bg-titanium-dark border border-titanium-border p-6 rounded-[22px] flex flex-col justify-center items-center text-center cursor-pointer hover:bg-white/5 transition-colors group">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 group-hover:text-white transition-colors">Action</p>
                    <div className="flex items-center gap-2 text-accent-blue font-bold">
                        Create Invoice <ArrowRight size={16} />
                    </div>
                </div>
            </div>

            {/* Client Table */}
            <div className="bg-titanium-dark border border-titanium-border rounded-[22px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-5 font-bold text-neutral-500 uppercase text-[10px] tracking-wider w-1/3 min-w-[200px]">Client</th>
                                <th className="p-5 font-bold text-neutral-500 uppercase text-[10px] tracking-wider w-1/4 min-w-[150px]">Budget Usage</th>
                                <th className="p-5 font-bold text-neutral-500 uppercase text-[10px] tracking-wider text-right">Hours</th>
                                <th className="p-5 font-bold text-neutral-500 uppercase text-[10px] tracking-wider text-right hidden lg:table-cell">Team</th>
                                <th className="p-5 font-bold text-neutral-500 uppercase text-[10px] tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {clients.map((client) => {
                                const budgetPercent = Math.min(100, (client.total / client.budget) * 100);
                                return (
                                    <tr key={client.name} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg shrink-0 ${client.color}`}>
                                                    {client.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-white text-sm truncate">{client.name}</div>
                                                    <div className="text-[10px] text-neutral-500 font-medium truncate">
                                                        {client.billable > 0 ? 'Active Contract' : 'Internal'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 align-middle">
                                            <div className="w-full max-w-[200px]">
                                                <div className="flex justify-between text-[10px] mb-1 font-medium">
                                                    <span className="text-neutral-400">{Math.round(budgetPercent)}%</span>
                                                    <span className="text-neutral-600">{client.total}/{client.budget}h</span>
                                                </div>
                                                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-red-500' : 'bg-white'}`}
                                                        style={{ width: `${budgetPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right font-mono text-neutral-300">
                                            <span className="block text-white font-bold">{client.total.toFixed(1)}h</span>
                                            <span className="text-[10px] text-neutral-600">{client.billable}h billable</span>
                                        </td>
                                        <td className="p-5 text-right hidden lg:table-cell">
                                            <div className="flex -space-x-2 justify-end">
                                                {client.team.map(m => (
                                                    <div key={m} className="w-6 h-6 rounded-full bg-neutral-700 border border-titanium-dark flex items-center justify-center text-[9px] text-white font-bold" title={m}>
                                                        {m}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right font-mono font-bold text-white">
                                            ${(client.billable * rate).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClientReport;
