
import React, { useRef, useState, useEffect } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { TimeSegment } from '../../types';
import { GripVertical } from 'lucide-react';

interface TimelineScrubberProps {
  timeline: TimeSegment[];
  currentTime: Date;
    onTagRequest?: (id: string) => void;
  onUpdateSegment?: (id: string, updates: Partial<TimeSegment>) => void;
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ timeline, currentTime, onTagRequest, onUpdateSegment }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const [pixelsPerMin, setPixelsPerMin] = useState(2.5); // Slightly wider default
  const [isDragging, setIsDragging] = useState(false);

  // Constants
  const MINS_IN_DAY = 24 * 60;
  
  // Auto scroll
  useEffect(() => {
    if (scrollRef.current && !isDragging) {
        const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
        const scrollPos = (currentMins * pixelsPerMin) - (scrollRef.current.clientWidth / 2);
        
        if (document.activeElement !== scrollRef.current) {
           scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
    }
  }, [currentTime, pixelsPerMin, isDragging]);

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const zoomFactor = -e.deltaY * 0.005;
          setPixelsPerMin(prev => Math.min(8, Math.max(0.5, prev + zoomFactor)));
      }
  };

  const getSegmentStyle = (type: string, tags: string[] = []) => {
      const primaryTag = tags[0]?.toLowerCase();
      
      if (type === 'FOCUS') {
          if (primaryTag === 'coding') return { bg: 'bg-blue-500', shadow: 'shadow-blue-500/20' };
          if (primaryTag === 'design') return { bg: 'bg-pink-500', shadow: 'shadow-pink-500/20' };
          if (primaryTag === 'writing') return { bg: 'bg-yellow-500', shadow: 'shadow-yellow-500/20' };
          return { bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' };
      }
      
      switch (type) {
        case 'BREAK': return { bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' };
        case 'DISTRACTED': return { bg: 'bg-red-500', shadow: 'shadow-red-500/20' };
        case 'RECOVERY': return { bg: 'bg-orange-400', shadow: 'shadow-orange-400/20' };
        case 'MEETING': return { bg: 'bg-purple-500', shadow: 'shadow-purple-500/20' };
        default: return { bg: 'bg-neutral-700', shadow: 'shadow-none' };
    }
  };

  const renderTimeMarkers = () => {
      const markers = [];
      for(let i = 0; i <= 24; i++) {
          markers.push(
              <div key={i} className="absolute top-0 bottom-0 pointer-events-none border-l border-white/5" style={{ left: i * 60 * pixelsPerMin }}>
                  <span className="absolute top-3 left-2 text-[10px] font-medium text-neutral-500">
                      {i === 0 || i === 24 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`}
                  </span>
              </div>
          )
      }
      return markers;
  }

  const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();

  return (
    <div 
        className="w-full h-full flex flex-col overflow-hidden relative group bg-transparent"
        onWheel={handleWheel}
    >
        {/* Scrubber Container */}
        <div 
            ref={scrollRef}
            className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar relative"
        >
            <div className="relative h-full" style={{ width: MINS_IN_DAY * pixelsPerMin }}>
                
                {/* Grid Lines */}
                {renderTimeMarkers()}

                {/* Current Time Line */}
                <div 
                    className="absolute top-10 bottom-4 w-0.5 bg-red-500 z-30 pointer-events-none"
                    style={{ left: currentMins * pixelsPerMin }}
                >
                    <div className="absolute -top-1 -left-[3.5px] w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>

                {/* Event Blocks */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-16">
                    {timeline.map((segment) => {
                         const width = (segment.end - segment.start) * pixelsPerMin;
                         const left = segment.start * pixelsPerMin;
                         const style = getSegmentStyle(segment.type, segment.tags);
                         
                         return (
                             <motion.div
                                key={segment.id}
                                layoutId={`segment-${segment.id}`}
                                drag="x"
                                dragMomentum={false}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={(e, info) => {
                                    setIsDragging(false);
                                    if (onUpdateSegment) {
                                        const moveMins = Math.round(info.offset.x / pixelsPerMin);
                                        if (moveMins !== 0) {
                                            onUpdateSegment(segment.id, {
                                                start: Math.max(0, segment.start + moveMins),
                                                end: Math.min(MINS_IN_DAY, segment.end + moveMins)
                                            });
                                        }
                                    }
                                }}
                                className={`
                                    absolute top-1 bottom-1 rounded-xl cursor-grab active:cursor-grabbing
                                    ${style.bg}
                                    hover:brightness-110
                                    transition-colors duration-200 z-10 group/segment
                                `}
                                style={{ 
                                    left, 
                                    width: Math.max(width - 2, 4),
                                    boxShadow: `0 4px 12px -2px ${style.shadow.replace('shadow-', 'rgba(').replace(')', ',0.4)')}` 
                                }}
                                                                onClick={() => {
                                                                    if (!isDragging && onTagRequest) {
                                                                        onTagRequest(segment.id);
                                                                    }
                                                                }}
                                onHoverStart={() => setIsHovering(segment.id)}
                                onHoverEnd={() => setIsHovering(null)}
                             >
                                {/* Inner Content (Only visible if wide enough) */}
                                {width > 40 && (
                                    <div className="px-3 py-1.5 h-full flex flex-col justify-center overflow-hidden pointer-events-none">
                                        <span className="text-[10px] font-bold text-white/90 truncate leading-tight w-full block">
                                            {segment.userTitle || (segment.tags && segment.tags.length > 0 ? segment.tags[0] : segment.type)}
                                        </span>
                                        {width > 80 && (
                                            <span className="text-[9px] text-white/60 truncate font-medium flex items-center gap-1 w-full overflow-hidden">
                                                {Math.floor(segment.end - segment.start)}m 
                                                {segment.notes && <span className="opacity-70 truncate">• has notes</span>}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Resize Handle (Right) */}
                                {isHovering === segment.id && onUpdateSegment && (
                                    <motion.div 
                                        className="absolute right-0 top-0 bottom-0 w-4 cursor-e-resize flex items-center justify-center bg-black/10 hover:bg-black/20"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onPan={(e, info) => {
                                            e.stopPropagation();
                                            // Real-time resizing would require local state, here we commit on end for simplicity or could debounce
                                        }}
                                        onPanEnd={(e, info) => {
                                            e.stopPropagation();
                                            const expandMins = Math.round(info.offset.x / pixelsPerMin);
                                            if (expandMins !== 0) {
                                                onUpdateSegment(segment.id, {
                                                    end: Math.min(MINS_IN_DAY, Math.max(segment.start + 5, segment.end + expandMins))
                                                });
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <GripVertical size={10} className="text-white/50" />
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
