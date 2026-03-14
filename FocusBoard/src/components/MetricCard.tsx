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
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, trend, color = 'text-white', isSelected, onClick }) => {
  return (
    <motion.button 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full bg-titanium-dark border rounded-2xl p-5 flex flex-col justify-between h-32 sm:h-40 relative overflow-hidden cursor-pointer transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-white/20 ${isSelected ? 'border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-titanium-border hover:border-neutral-600'}`}
      role="radio"
      aria-checked={isSelected}
      aria-label={`${label}: ${value} ${unit || ''}. Click to view trends.`}
    >
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <div className={`w-16 h-16 rounded-full bg-current ${color}`} />
        </div>

        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 z-10">{label.toUpperCase()}</span>
            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white z-10" />}
        </div>
        
        <div className="flex items-baseline gap-1 z-10">
            <motion.span 
                key={value}
                initial={{ opacity: 0.5, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-4xl sm:text-5xl font-bold tracking-tight ${color}`}
            >
                {value}
            </motion.span>
            {unit && <span className="text-sm text-neutral-400 font-medium">{unit}</span>}
        </div>
    </motion.button>
  );
};

export default MetricCard;