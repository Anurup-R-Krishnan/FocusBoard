import React from 'react';
import { motion } from 'framer-motion';
import { SquadMember } from '../types';
import SyncWaveform from './SyncWaveform';
import { Zap } from 'lucide-react';

interface SquadWidgetProps {
  squad: SquadMember[];
  onNudge: (id: string) => void;
}

const SquadWidget: React.FC<SquadWidgetProps> = ({ squad, onNudge }) => {
  // Derive aggregate state
  const focusedCount = squad.filter(m => m.status === 'FOCUS' || m.status === 'RECOVERY').length;
  const distractedCount = squad.filter(m => m.status === 'DISTRACTED').length;
  
  const isTeamFocused = focusedCount > squad.length / 2;
  const isTeamDistracted = distractedCount > 0;

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
    <div className="bg-titanium-dark border border-titanium-border rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 h-full relative overflow-hidden">
      
      {/* Left: Status Text & Avatars */}
      <div className="flex-1 w-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">The Sync-Up</h3>
            <span className="text-white text-sm font-semibold">
                {focusedCount}/{squad.length} <span className="text-neutral-500 font-normal">in Deep Focus</span>
            </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {squad.map((member) => (
                <div key={member.id} className="group relative flex flex-col items-center min-w-[3rem]">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="relative w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: member.avatarUrl && !member.avatarUrl.startsWith('#') ? 'transparent' : member.avatarUrl }}
                    >
                         {/* Fallback Initials if color */}
                         {member.avatarUrl?.startsWith('#') && (
                             <span className="text-white font-bold text-sm">{member.name.substring(0,2).toUpperCase()}</span>
                         )}
                    </motion.div>
                    
                    {/* Status Dot with Animation on Change */}
                    <motion.div 
                        key={`${member.id}-${member.status}`} // Trigger animation on status change
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="absolute bottom-0 right-0"
                    >
                        <motion.div
                            animate={
                                member.status === 'FOCUS' ? { scale: [1, 1.2, 1], boxShadow: ["0 0 0px rgba(48,209,88,0)", "0 0 8px rgba(48,209,88,0.6)", "0 0 0px rgba(48,209,88,0)"] } : 
                                member.status === 'DISTRACTED' ? { opacity: [1, 0.5, 1] } : {}
                            }
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className={`w-3.5 h-3.5 rounded-full border-2 border-titanium-dark ${getStatusColor(member.status)}`} 
                        />
                    </motion.div>
                    
                    {/* Nudge Button (Visible on Hover) */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute -top-2 -right-2 bg-titanium-surface border border-titanium-border rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 focus:opacity-100 focus:outline-none"
                        onClick={() => onNudge(member.id)}
                        title={`Nudge ${member.name}`}
                        aria-label={`Nudge ${member.name}`}
                    >
                        <Zap size={12} className="text-yellow-400" fill="currentColor" />
                    </motion.button>

                    <span className="mt-2 text-xs text-neutral-400 font-medium">{member.name}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Right: Waveform */}
      <div className="w-full sm:w-64 h-24 sm:h-full bg-black/20 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center relative">
          <SyncWaveform isActive={isTeamFocused || isTeamDistracted} isDistracted={isTeamDistracted} />
          {!isTeamFocused && !isTeamDistracted && (
              <span className="absolute text-xs text-neutral-600 font-mono">SIGNAL_IDLE</span>
          )}
      </div>
    </div>
  );
};

export default SquadWidget;