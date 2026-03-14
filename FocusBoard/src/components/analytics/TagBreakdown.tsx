
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagBreakdownProps {
    data?: { label: string; value: number; color: string }[];
}

const DEFAULT_DATA = [
  { label: 'Coding', value: 45, color: '#3B82F6' }, // Blue
  { label: 'Design', value: 30, color: '#ec4899' }, // Pink
  { label: 'Meetings', value: 15, color: '#a855f7' }, // Purple
  { label: 'Writing', value: 10, color: '#eab308' }, // Yellow
];

const TagBreakdown: React.FC<TagBreakdownProps> = ({ data = DEFAULT_DATA }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let accumulated = 0;

  // Calculate SVG paths
  const segments = data.map((item, index) => {
    const startAngle = (accumulated / total) * 360;
    const endAngle = ((accumulated + item.value) / total) * 360;
    accumulated += item.value;

    return {
      ...item,
      startAngle,
      endAngle,
      index
    };
  });

  const createArc = (start: number, end: number) => {
    const radius = 40;
    // Adjust angles to start from top (-90deg)
    const startRad = (start - 90) * (Math.PI / 180);
    const endRad = (end - 90) * (Math.PI / 180);
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    // If the slice is > 180 degrees, use large arc flag
    const largeArc = end - start <= 180 ? 0 : 1;

    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="h-full flex flex-col justify-between relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row items-center gap-8 h-full">
        {/* Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full rotate-0">
                {segments.map((segment) => (
                    <motion.path
                        key={segment.label}
                        d={createArc(segment.startAngle, segment.endAngle)}
                        fill={segment.color}
                        stroke="#151515"
                        strokeWidth="2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                            scale: hoveredIndex === segment.index ? 1.1 : 1,
                            opacity: hoveredIndex !== null && hoveredIndex !== segment.index ? 0.3 : 1 
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onMouseEnter={() => setHoveredIndex(segment.index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                    />
                ))}
                {/* Center Cutout */}
                <circle cx="50" cy="50" r="28" fill="#151515" />
            </svg>
            
            {/* Dynamic Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    {activeItem ? (
                        <motion.div 
                            key="active"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="text-center"
                        >
                            <span className="block text-2xl font-bold text-white tabular-nums">{activeItem.value}%</span>
                            <span className="block text-[10px] font-medium text-neutral-400 uppercase tracking-wide">{activeItem.label}</span>
                        </motion.div>
                    ) : (
                         <motion.div 
                            key="total"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="text-center"
                        >
                            <span className="block text-2xl font-bold text-white tabular-nums">{total}</span>
                            <span className="block text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Total</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-1 gap-3 content-center">
            {data.map((item, i) => (
                <motion.div 
                    key={item.label}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 ${hoveredIndex === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]`} style={{ backgroundColor: item.color, color: item.color }} />
                        <span className={`text-xs font-medium transition-colors ${hoveredIndex === i ? 'text-white' : 'text-neutral-400'}`}>
                            {item.label}
                        </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-white">{item.value}%</span>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TagBreakdown;
