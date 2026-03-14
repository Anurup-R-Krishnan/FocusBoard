
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: any;
    trend?: number;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, trend, color = "text-white" }) => (
    <div className="bg-[#151515] border border-white/5 p-5 rounded-2xl flex flex-col justify-between group hover:border-white/10 transition-colors h-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity transform scale-150 pointer-events-none">
            <Icon size={120} />
        </div>
        
        <div className="flex justify-between items-start z-10">
            <div className="p-2 rounded-lg bg-white/5 text-neutral-400 group-hover:text-white transition-colors shrink-0">
                <Icon size={18} />
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ml-2 ${trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        
        <div className="z-10 min-w-0">
            <h3 className={`text-3xl font-bold tracking-tight truncate ${color}`} title={String(value)}>{value}</h3>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mt-1 flex items-center gap-1 truncate">
                <span className="truncate">{label}</span> 
                {sub && (
                    <span className="text-neutral-600 normal-case tracking-normal border-l border-neutral-700 pl-1 ml-1 truncate shrink-0 max-w-[50%]">
                        {sub}
                    </span>
                )}
            </p>
        </div>
    </div>
);

export default StatCard;
