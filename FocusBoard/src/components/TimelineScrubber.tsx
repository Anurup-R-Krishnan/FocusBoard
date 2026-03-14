import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TimeSegment } from '../types';

interface TimelineScrubberProps {
  timeline: TimeSegment[];
  currentTime: Date;
  onTagRequest: (id: string) => void;
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ timeline, currentTime, onTagRequest }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const [pixelsPerMin, setPixelsPerMin] = useState(2); // Zoom state

  // Constants
  const MINS_IN_DAY = 24 * 60;
  
  // Auto scroll to current time on mount/update
  useEffect(() => {
    if (scrollRef.current) {
        const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
        const scrollPos = (currentMins * pixelsPerMin) - (scrollRef.current.clientWidth / 2);
        
        if (document.activeElement !== scrollRef.current) {
           scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
    }
  }, [currentTime, pixelsPerMin]); // Re-scroll on zoom change

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!scrollRef.current) return;
    const SCROLL_AMOUNT = 100;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            scrollRef.current.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
            break;
        case 'ArrowRight':
            e.preventDefault();
            scrollRef.current.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
            break;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const zoomFactor = -e.deltaY * 0.005;
          setPixelsPerMin(prev => Math.min(10, Math.max(0.5, prev + zoomFactor)));
      }
  };

  const renderMarkers = () => {
    const markers = [];
    for (let i = 0; i <= 24; i++) {
        markers.push(
            <div key={i} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: i * 60 * pixelsPerMin }}>
                <span className="absolute top-2 left-1 text-[10px] text-neutral-600 font-medium select-none">
                    {i === 0 || i === 24 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
                </span>
            </div>
        );
    }
    return markers;
  };

  const getSegmentColor = (type: string) => {
    switch (type) {
        case 'FOCUS': return { bg: 'bg-accent-blue', color: 'rgba(47,88,205,0.6)', border: 'border-accent-blue/30' };
        case 'BREAK': return { bg: 'bg-accent-green', color: 'rgba(48,209,88,0.6)', border: 'border-accent-green/30' };
        case 'DISTRACTED': return { bg: 'bg-accent-orange', color: 'rgba(255,59,48,0.6)', border: 'border-accent-orange/30' };
        case 'RECOVERY': return { bg: 'bg-orange-400', color: 'rgba(251,146,60,0.6)', border: 'border-orange-400/30' };
        case 'MEETING': return { bg: 'bg-accent-purple', color: 'rgba(191,90,242,0.6)', border: 'border-accent-purple/30' };
        default: return { bg: 'bg-neutral-800', color: 'rgba(100,100,100,0.5)', border: 'border-white/10' };
    }
  };

  const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();

  return (
    <div 
        className="relative w-full h-full flex flex-col overflow-hidden bg-titanium-dark rounded-2xl border border-titanium-border focus:ring-1 focus:ring-white/20 focus:outline-none transition-shadow"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        aria-label="Timeline Scrubber. Use Left/Right arrows to navigate. Ctrl+Scroll to zoom."
    >
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 flex items-baseline gap-2 pointer-events-none">
        <span className="text-2xl font-semibold text-white tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Timeline</span>
      </div>

      {/* Scrubber Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar relative cursor-grab active:cursor-grabbing"
        style={{ width: '100%' }}
      >
         <div className="relative h-full" style={{ width: MINS_IN_DAY * pixelsPerMin }}>
            {/* Background Grid */}
            {renderMarkers()}

            {/* Current Time Indicator Line */}
            <div 
                className="absolute top-8 bottom-0 w-0.5 bg-red-500 z-20 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                style={{ left: currentMins * pixelsPerMin }}
            >
                <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-red-500 rounded-full shadow-sm" />
            </div>

            {/* Segments */}
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-14">
                {timeline.map((segment) => {
                    const width = (segment.end - segment.start) * pixelsPerMin;
                    const left = segment.start * pixelsPerMin;
                    const style = getSegmentColor(segment.type);
                    const hasTags = segment.tags && segment.tags.length > 0;
                    
                    return (
                        <motion.div
                            key={segment.id}
                            layoutId={`segment-${segment.id}`}
                            className={`absolute top-0 bottom-0 rounded-2xl border cursor-pointer ${style.bg} ${style.border} overflow-hidden`}
                            style={{ left, width: Math.max(width, 4) }} 
                            onHoverStart={() => setIsHovering(segment.id)}
                            onHoverEnd={() => setIsHovering(null)}
                            whileHover={{ 
                                scaleY: 1.25, 
                                scaleX: 1.05, 
                                zIndex: 10,
                                boxShadow: `0 0 20px ${style.color}, inset 0 0 15px rgba(255,255,255,0.2)`
                            }}
                            onClick={() => onTagRequest(segment.id)}
                        >
                            {/* Tag Indicator Dot */}
                            {hasTags && (
                                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-sm opacity-80" />
                            )}
                            
                            {/* Hover Tooltip */}
                            {isHovering === segment.id && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: -25 }}
                                    className="absolute left-1/2 -translate-x-1/2 -top-2 px-3 py-1.5 bg-titanium-surface/90 backdrop-blur-md border border-white/20 rounded-xl whitespace-nowrap z-30 shadow-2xl flex flex-col items-center pointer-events-none"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${style.bg}`} />
                                        <span className="text-xs font-bold text-white tracking-wide">
                                            {segment.type}
                                        </span>
                                    </div>
                                    {hasTags && (
                                        <span className="text-[10px] text-neutral-300 mt-0.5 font-medium">
                                            {segment.tags?.join(', ')}
                                        </span>
                                    )}
                                    <span className="text-[9px] text-neutral-500 font-mono mt-1 border-t border-white/10 pt-0.5 w-full text-center">
                                        {Math.floor(segment.end - segment.start)} MIN
                                    </span>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
         </div>
      </div>
    </div>
  );
};

export default TimelineScrubber;