
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useComparisonData } from '../../../hooks/useComparisonData';

const ComparisonView = () => {
    const getThisWeek = () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { start, end, label: 'This Week' };
    };

    const getLastWeek = () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { start, end, label: 'Last Week' };
    };

    const [periodA] = useState(getThisWeek());
    const [periodB] = useState(getLastWeek());
    const { data, loading } = useComparisonData(periodA, periodB);

    if (loading) {
        return <div className="text-center py-10 text-neutral-500">Loading...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-titanium-dark border border-titanium-border p-4 rounded-[2rem]">
                <div className="flex-1 w-full sm:w-auto text-center">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Period A</p>
                    <button className="w-full sm:w-auto mx-auto flex items-center justify-center gap-8 px-6 py-3 bg-neutral-800 rounded-xl text-sm font-bold text-white hover:bg-neutral-700 transition-colors border border-white/5">
                        {data.periodA.label} <ChevronDown size={14} className="text-neutral-500" />
                    </button>
                </div>
                
                <div className="bg-neutral-900 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-neutral-500 border border-white/10 shrink-0">VS</div>
                
                <div className="flex-1 w-full sm:w-auto text-center">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Period B</p>
                    <button className="w-full sm:w-auto mx-auto flex items-center justify-center gap-8 px-6 py-3 bg-neutral-800 rounded-xl text-sm font-bold text-white hover:bg-neutral-700 transition-colors border border-white/5">
                        {data.periodB.label} <ChevronDown size={14} className="text-neutral-500" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-8 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-8">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Focus Score</h3>
                        <span className={`text-xl font-bold px-3 py-1 rounded-full ${data.focusScoreChange >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {data.focusScoreChange >= 0 ? '+' : ''}{data.focusScoreChange}%
                        </span>
                    </div>
                    
                    <div className="flex items-end justify-center gap-8 h-48 px-4">
                        <div className="flex flex-col justify-end gap-3 items-center group w-24">
                            <div className="w-full bg-accent-blue rounded-t-xl shadow-[0_0_20px_rgba(47,88,205,0.3)] group-hover:bg-blue-500 transition-colors relative" style={{ height: `${data.periodA.focusScore}%` }}>
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-bold text-white">{data.periodA.focusScore}</span>
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-wide">A</span>
                        </div>
                        <div className="flex flex-col justify-end gap-3 items-center group w-24">
                            <div className="w-full bg-neutral-800 rounded-t-xl group-hover:bg-neutral-700 transition-colors relative" style={{ height: `${data.periodB.focusScore}%` }}>
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-bold text-neutral-500">{data.periodB.focusScore}</span>
                            </div>
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">B</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-8 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-8">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Deep Work Hours</h3>
                        <span className={`text-xl font-bold px-3 py-1 rounded-full ${data.deepWorkChange >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {data.deepWorkChange >= 0 ? '+' : ''}{data.deepWorkChange}%
                        </span>
                    </div>
                    
                    <div className="flex items-end justify-center gap-8 h-48 px-4">
                        <div className="flex flex-col justify-end gap-3 items-center group w-24">
                            <div className="w-full bg-purple-500 rounded-t-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:bg-purple-400 transition-colors relative" style={{ height: `${Math.min(100, data.periodA.deepWorkHours * 4)}%` }}>
                                 <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-bold text-white">{data.periodA.deepWorkHours}h</span>
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-wide">A</span>
                        </div>
                        <div className="flex flex-col justify-end gap-3 items-center group w-24">
                            <div className="w-full bg-neutral-800 rounded-t-xl group-hover:bg-neutral-700 transition-colors relative" style={{ height: `${Math.min(100, data.periodB.deepWorkHours * 4)}%` }}>
                                 <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-bold text-neutral-500">{data.periodB.deepWorkHours}h</span>
                            </div>
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">B</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonView;
