import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusMetrics } from '../../types';
import { Info } from 'lucide-react';

interface FocusGaugeProps {
  metrics: FocusMetrics;
  recoveryProgress?: number;
}

const FocusGauge: React.FC<FocusGaugeProps> = ({ metrics, recoveryProgress }) => {
  const { focusScore, deepWorkMinutes, contextSwitches } = metrics;
  const [showBreakdown, setShowBreakdown] = useState(false);

  // SVG Properties
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = focusScore / 100;
  const recoveryPercent = (recoveryProgress || 0) / 100;
  
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const bgArcPath = describeArc(100, 100, 80, 0, 180);
  const progressAngle = percent * 180;
  const progressPath = describeArc(100, 100, 80, 0, progressAngle);
  const gradientId = recoveryProgress !== undefined ? "recoveryGradient" : "gaugeGradient";

  return (
    <div 
        className="relative flex flex-col items-center justify-center w-full h-full p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 rounded-[2rem]"
        onMouseEnter={() => setShowBreakdown(true)}
        onMouseLeave={() => setShowBreakdown(false)}
        onClick={() => setShowBreakdown(!showBreakdown)}
        role="button"
        tabIndex={0}
        aria-label={`Focus Score Gauge. Current score is ${focusScore} out of 100. ${recoveryProgress !== undefined ? 'Currently in recovery mode.' : 'Click for score breakdown.'}`}
        aria-expanded={showBreakdown}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowBreakdown(!showBreakdown);
            }
        }}
    >
      <div className="relative w-64 h-32 overflow-hidden mb-2">
        <svg width="100%" height="100%" viewBox="0 0 200 110" className="overflow-visible" role="img" aria-hidden="true">
           <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2F58CD" />
              <stop offset="100%" stopColor="#93C5FD" />
            </linearGradient>
            <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <path d={bgArcPath} fill="none" stroke="#1C1C1E" strokeWidth={stroke} strokeLinecap="round" className="opacity-50" />
          <motion.path 
            d={progressPath} 
            fill="none" 
            stroke={`url(#${gradientId})`} 
            strokeWidth={stroke} 
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }} 
            transition={{ duration: 1, ease: "easeOut" }}
            filter="url(#glow)"
          />
        </svg>
        
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end">
            <motion.span 
                key={focusScore}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-bold tracking-tighter text-white tabular-nums leading-none"
            >
                {focusScore}
            </motion.span>
        </div>
      </div>
      
      <div className="text-center mt-2 flex items-center justify-center gap-1.5 relative z-10">
        <div>
            <p className="text-neutral-500 text-sm font-medium tracking-wide uppercase">
                {recoveryProgress !== undefined ? 'Recovering...' : 'Focus Score'}
            </p>
            {recoveryProgress !== undefined ? (
                 <div className="w-24 h-1 bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${recoveryProgress}%` }}
                        className="h-full bg-orange-500"
                    />
                 </div>
            ) : (
                <p className="text-xs text-titanium-highlight mt-0.5">Peak Performance</p>
            )}
        </div>
        {recoveryProgress === undefined && <Info size={12} className="text-neutral-600" />}
      </div>

      {/* Breakdown Tooltip/Overlay */}
      <AnimatePresence>
          {showBreakdown && (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 bg-titanium-dark/95 backdrop-blur-md rounded-[2rem] p-5 flex flex-col justify-center items-center z-20 border border-white/10"
            >
                <h4 className="text-sm font-bold text-white mb-3">Score Breakdown</h4>
                <div className="w-full space-y-2 text-xs">
                    <div className="flex justify-between items-center text-neutral-400">
                        <span>Base Score</span>
                        <span className="font-mono text-white">70</span>
                    </div>
                    <div className="flex justify-between items-center text-accent-blue">
                        <span>Deep Work Bonus</span>
                        <span className="font-mono">+{Math.min(30, Math.floor((deepWorkMinutes / 60) * 5))}</span>
                    </div>
                    <div className="flex justify-between items-center text-accent-orange">
                        <span>Distraction Penalty</span>
                        <span className="font-mono">-{contextSwitches * 2}</span>
                    </div>
                    {recoveryProgress !== undefined && (
                        <div className="flex justify-between items-center text-orange-400">
                             <span>Recovery Cap</span>
                             <span className="font-mono">Active</span>
                        </div>
                    )}
                    <div className="h-px bg-white/10 my-1" />
                    <div className="flex justify-between items-center font-bold text-white text-sm">
                        <span>Total</span>
                        <span>{focusScore}</span>
                    </div>
                </div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default FocusGauge;