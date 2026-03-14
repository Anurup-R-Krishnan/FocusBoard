
import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string; // Tailwind text color class
  isSelected?: boolean;
  onClick?: () => void;
  trendData?: number[]; // Array of numbers for sparkline
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, trend, color = 'text-white', isSelected, onClick, trendData }) => {
  
  // Simple Sparkline Generator
  const renderSparkline = () => {
      if (!trendData || trendData.length < 2) return null;
      const height = 40;
      const width = 120;
      const max = Math.max(...trendData);
      const min = Math.min(...trendData);
      const range = max - min || 1;
      
      const points = trendData.map((d, i) => {
          const x = (i / (trendData.length - 1)) * width;
          const y = height - ((d - min) / range) * height;
          return `${x},${y}`;
      }).join(' ');

      return (
          <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible opacity-30 group-hover:opacity-50 transition-opacity">
              <polyline 
                points={points} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                vectorEffect="non-scaling-stroke"
              />
          </svg>
      );
  };

  return (
    <motion.button 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full bg-titanium-dark border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-white/20 group h-full min-h-[140px]
        ${isSelected ? 'border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-titanium-border hover:border-neutral-500 hover:shadow-lg'}
      `}
      role="radio"
      aria-checked={isSelected}
      aria-label={`${label}: ${value} ${unit || ''}. Click to view trends.`}
    >
        {/* Background Sparkline */}
        <div className={`absolute bottom-4 right-4 w-1/2 h-10 ${color}`}>
            {renderSparkline()}
        </div>

        <div className="absolute top-0 right-0 p-4 opacity-10">
            <div className={`w-16 h-16 rounded-full bg-current ${color}`} />
        </div>

        <div className="flex items-center gap-2 relative z-10 min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 truncate">{label}</span>
            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
        </div>
        
        <div className="flex items-baseline gap-1 relative z-10">
            <motion.span 
                key={value}
                initial={{ opacity: 0.5, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-4xl sm:text-5xl font-bold tracking-tight ${color}`}
            >
                {value}
            </motion.span>
            {unit && <span className="text-sm text-neutral-400 font-medium shrink-0">{unit}</span>}
        </div>
        
        {/* Hover Hint */}
        <div className="absolute top-4 right-4 text-xs text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
             View Logic →
        </div>
    </motion.button>
  );
};

export default MetricCard;
