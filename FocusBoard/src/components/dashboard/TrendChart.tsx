import React from 'react';
import { motion } from 'framer-motion';

interface TrendAnalysisChartProps {
  title?: string;
  data: number[];
  lastWeekData?: number[];
  color?: string; // Hex or tailwind class for bars
}

const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({ title = "Focus Trends", data, lastWeekData, color = "bg-neutral-600 group-hover:bg-accent-blue" }) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const maxVal = Math.max(...data, ...[lastWeekData ? Math.max(...lastWeekData) : 100], 10) * 1.1; // Dynamic scale

  return (
    <div className="flex flex-col h-full justify-between gap-3" aria-label={`${title} Weekly Analysis`}>
        <div className="flex justify-between items-start">
             <div>
                 <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{title}</span>
                 <p className="text-[10px] text-neutral-400 mt-0.5">Weekly Performance</p>
             </div>
             <div className="flex gap-3 text-[10px] font-medium">
                <span className="flex items-center gap-1.5 text-neutral-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 ring-1 ring-neutral-700" />
                    Last Week
                </span>
                <span className="flex items-center gap-1.5 text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                    This Week
                </span>
             </div>
        </div>
        
        <div className="flex justify-between items-end h-full px-1 gap-1 sm:gap-2 mt-2">
            {data.map((value, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end cursor-crosshair">
                    <div className="relative w-full flex justify-center items-end h-full rounded-t-lg hover:bg-white/5 transition-colors pt-4 pb-1">
                        {/* Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-titanium-surface border border-neutral-700 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap z-20 pointer-events-none flex flex-col items-center">
                            <span className="font-bold text-lg leading-none">{value.toFixed(0)}</span>
                            <span className="text-neutral-400 text-[9px] uppercase tracking-wide">Value</span>
                        </div>
                        
                        <div className="relative w-1.5 sm:w-2 h-full flex items-end">
                            {/* Last Week Bar (Background Ghost) */}
                            {lastWeekData && (
                                <div 
                                    className="absolute bottom-0 w-full rounded-full bg-neutral-800/80 border border-neutral-800"
                                    style={{ height: `${(lastWeekData[i] / maxVal) * 100}%` }}
                                />
                            )}

                            {/* Current Week Bar (Foreground) */}
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${(value / maxVal) * 100}%` }}
                                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                                className={`relative z-10 w-full rounded-full ${i === 4 ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.3)]' : color} transition-colors duration-300`}
                            />
                        </div>
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-white transition-colors">{days[i]}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default TrendAnalysisChart;