import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquadMember, ActivityEvent } from '../../types';
import { Zap } from 'lucide-react';

interface SquadWidgetProps {
  squad: SquadMember[];
  onNudge: (id: string) => void;
  latestActivity?: ActivityEvent; // Prop for live feed
}

const SquadWidget: React.FC<SquadWidgetProps> = ({ squad, onNudge, latestActivity }) => {
  // Derive aggregate state
  const focusedCount = squad.filter(m => m.status === 'FOCUS' || m.status === 'RECOVERY').length;

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'FOCUS': return 'bg-accent-green shadow-[0_0_8px_rgba(48,209,88,0.6)]';
        case 'RECOVERY': return 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]';
        case 'DISTRACTED': return 'bg-accent-orange shadow-[0_0_8px_rgba(255,59,48,0.6)]';
        case 'MEETING': return 'bg-accent-purple';
        default: return 'bg-neutral-500';
    }
  };

  return (
    <div className="bg-titanium-dark border border-titanium-border rounded-[22px] p-6 flex flex-col justify-between h-full relative overflow-hidden hover:border-white/10 transition-colors">
      
      {/* Header & Status */}
      <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">The Squad</h3>
            <span className="text-white text-xs font-semibold bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                {focusedCount}/{squad.length} <span className="text-neutral-500 font-normal">Focused</span>
            </span>
        </div>

        {/* Avatars */}
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {squad.map((member) => (
                <div key={member.id} className="group relative flex flex-col items-center min-w-[3.5rem]">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="relative w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shadow-lg"
                        style={{ backgroundColor: member.avatarUrl && !member.avatarUrl.startsWith('#') ? 'transparent' : member.avatarUrl }}
                    >
                        {/* Fallback Initials if color */}
                        {member.avatarUrl?.startsWith('#') && (
                            <span className="text-white font-bold text-sm">{member.name.substring(0,2).toUpperCase()}</span>
                        )}
                        
                        {/* Status Indicator Dot (Corner) */}
                        <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${getStatusColor(member.status)} ring-2 ring-neutral-800`} />
                    </motion.div>
                    
                    {/* Nudge Button (Overlay) */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1, opacity: 1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10 focus:opacity-100 focus:outline-none"
                        onClick={(e) => { e.stopPropagation(); onNudge(member.id); }}
                        title={`Nudge ${member.name}`}
                    >
                        <Zap size={12} className="text-black fill-current" />
                    </motion.button>

                    <span className="mt-2 text-[10px] text-neutral-400 font-medium truncate w-full text-center">{member.name}</span>
                </div>
            ))}
            
            {/* Add Member Placeholder */}
             <div className="flex flex-col items-center min-w-[3.5rem] opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                <div className="w-14 h-14 rounded-2xl border border-dashed border-neutral-600 flex items-center justify-center">
                    <span className="text-xl text-neutral-500 font-light">+</span>
                </div>
                 <span className="mt-2 text-[10px] text-neutral-500 font-medium">Invite</span>
             </div>
        </div>
      </div>

      {/* Activity Ticker Footer */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="relative h-5 overflow-hidden">
            <AnimatePresence mode="wait">
                {latestActivity ? (
                    <motion.div
                        key={latestActivity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-[10px] sm:text-xs text-neutral-500 font-mono"
                    >
                        <div className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse shrink-0" />
                        <span className="font-bold text-neutral-300 whitespace-nowrap">{latestActivity.memberName}</span> 
                        <span className="truncate">{latestActivity.message}</span>
                        <span className="text-[9px] opacity-40 ml-auto whitespace-nowrap">{latestActivity.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="text-[10px] text-neutral-600 font-mono flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 bg-neutral-700 rounded-full" />
                        Waiting for activity...
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SquadWidget;