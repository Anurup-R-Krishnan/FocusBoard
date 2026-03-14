import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityHeatmapProps {
    heatmapData?: number[][];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ heatmapData }) => {
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const [hoveredCell, setHoveredCell] = useState<{day: string, hour: number, intensity: number} | null>(null);

  const gridData = useMemo(() => {
        if (heatmapData && heatmapData.length === days.length) {
            return days.map((day, rowIdx) => ({
                day,
                hours: hours.map((hour, colIdx) => ({
                    hour,
                    intensity: Math.max(0, Math.min(3, heatmapData[rowIdx]?.[colIdx] ?? 0)),
                })),
            }));
        }

    return days.map(day => ({
        day,
                hours: hours.map((hour, colIdx) => ({
            hour,
                        intensity: (day.charCodeAt(0) + hour + colIdx) % 4
        }))
    }));
    }, [days, heatmapData, hours]);

  const getIntensityColor = (intensity: number) => {
    switch(intensity) {
        case 0: return 'bg-neutral-800 border-transparent';
        case 1: return 'bg-accent-blue/20 border-accent-blue/20';
        case 2: return 'bg-accent-blue/50 border-accent-blue/40';
        case 3: return 'bg-accent-blue border-accent-blue shadow-[0_0_10px_rgba(47,88,205,0.5)]';
        default: return 'bg-neutral-800';
    }
  };

  const getIntensityLabel = (intensity: number) => {
      switch(intensity) {
          case 0: return 'Idle';
          case 1: return 'Light Focus';
          case 2: return 'Deep Work';
          case 3: return 'Flow State';
          default: return 'Unknown';
      }
  };

  return (
    <div className="h-full bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 flex flex-col relative overflow-visible group hover:border-neutral-600 transition-colors duration-500">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Peak Hours</h3>
            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium bg-neutral-900/50 p-1.5 rounded-lg border border-white/5">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-[2px] bg-neutral-800" />
                    <div className="w-2 h-2 rounded-[2px] bg-accent-blue/20" />
                    <div className="w-2 h-2 rounded-[2px] bg-accent-blue/50" />
                    <div className="w-2 h-2 rounded-[2px] bg-accent-blue" />
                </div>
                <span>More</span>
            </div>
        </div>

        <div className="flex-1 flex flex-col justify-between relative">
            {/* Header Row (Hours) */}
            <div className="flex justify-between pl-10 mb-2">
                {hours.map(h => (
                    <span key={h} className="text-[10px] text-neutral-600 font-mono w-full text-center">
                        {h > 12 ? h - 12 : h}
                    </span>
                ))}
            </div>

            {/* Grid */}
            <div className="flex flex-col justify-between h-full gap-2 relative z-10">
                {gridData.map((row, dIndex) => (
                    <div key={row.day} className="flex items-center gap-2 h-full">
                        <span className="text-[10px] font-bold text-neutral-500 w-8 text-right font-mono">{row.day}</span>
                        <div className="flex-1 flex gap-1.5 h-full">
                            {row.hours.map((cell, hIndex) => (
                                <div key={cell.hour} className="relative flex-1 h-full">
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: (dIndex * 0.05) + (hIndex * 0.02) }}
                                        whileHover={{ scale: 1.2, zIndex: 50 }}
                                        onMouseEnter={() => setHoveredCell({ day: row.day, hour: cell.hour, intensity: cell.intensity })}
                                        onMouseLeave={() => setHoveredCell(null)}
                                        className={`w-full h-full rounded-[4px] border ${getIntensityColor(cell.intensity)} transition-all duration-200 cursor-crosshair`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Tooltip Layer */}
            <AnimatePresence>
                {hoveredCell && (
                    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                        {/* 
                           Note: In a production app, use proper popper.js positioning. 
                           Here we use a fixed central HUD or follow cursor logic if we tracked coordinates.
                           For simplicity/cleanliness, we'll display it at the bottom left of the chart area.
                        */}
                    </div>
                )}
            </AnimatePresence>
        </div>
        
        {/* Detail Footer */}
        <div className="h-6 mt-2 flex items-center justify-end text-xs font-medium text-white">
            <AnimatePresence mode="wait">
                {hoveredCell ? (
                    <motion.div 
                        key="info"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-2 bg-neutral-800/80 px-3 py-1 rounded-full border border-white/10"
                    >
                        <span className="text-neutral-400">{hoveredCell.day} {hoveredCell.hour > 12 ? hoveredCell.hour - 12 : hoveredCell.hour}:00</span>
                        <div className="w-px h-3 bg-white/20" />
                        <span className={hoveredCell.intensity > 1 ? "text-accent-blue" : "text-white"}>
                            {getIntensityLabel(hoveredCell.intensity)}
                        </span>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="text-neutral-600 italic text-[10px]"
                    >
                        Hover over cells for details
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default ActivityHeatmap;