import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Coffee, AlertCircle, Tag, FastForward, RotateCcw } from 'lucide-react';
import { SessionState } from '../../types';

interface ControlsPanelProps {
  sessionState: SessionState;
  isPlaying: boolean;
  speedMultiplier: number;
  onTogglePlay: () => void;
  onStartFocus: () => void;
  onResumeFocus: () => void;
  onTakeBreak: () => void;
  onAddDistraction: () => void;
  onTag: () => void;
  onToggleSpeed: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  sessionState,
  isPlaying,
  speedMultiplier,
  onTogglePlay,
  onStartFocus,
  onResumeFocus,
  onTakeBreak,
  onAddDistraction,
  onTag,
  onToggleSpeed
}) => {
  
  const ButtonBase = ({ children, onClick, active, colorClass = "bg-titanium-dark", title, disabled = false }: any) => (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.92 }}
      whileHover={disabled ? {} : { scale: 1.05 }}
      onClick={!disabled ? onClick : undefined}
      title={title}
      className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center border transition-all duration-300 
        ${active ? 'border-white bg-neutral-800 shadow-lg shadow-white/10' : 'border-titanium-border ' + colorClass}
        ${disabled ? 'opacity-30 cursor-not-allowed grayscale border-transparent bg-titanium-dark/50' : 'cursor-pointer'}
      `}
    >
      {children}
    </motion.button>
  );

  const canStartFocus = sessionState === 'IDLE';
  const canTakeBreak = sessionState === 'FOCUS';
  const canDistract = sessionState === 'FOCUS';
  const canResume = sessionState === 'BREAK' || sessionState === 'DISTRACTED' || sessionState === 'RECOVERY';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-titanium-surface/80 backdrop-blur-2xl border border-white/10 p-2 sm:p-3 rounded-[2.5rem] shadow-2xl flex items-center gap-2 sm:gap-4 z-[40] ring-1 ring-white/5">
        
        {/* Primary State Action Button */}
        <AnimatePresence mode="wait">
            {canStartFocus && (
                <motion.button
                    key="start"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStartFocus}
                    className="h-14 px-6 sm:h-16 sm:px-8 bg-white rounded-2xl flex items-center gap-3 shadow-[0_0_25px_rgba(255,255,255,0.15)] group hover:shadow-[0_0_35px_rgba(255,255,255,0.25)] transition-shadow"
                >
                    <Play fill="black" size={20} className="text-black group-hover:scale-110 transition-transform" />
                    <span className="text-black font-bold tracking-tight text-lg">Focus</span>
                </motion.button>
            )}

            {(sessionState === 'FOCUS' || sessionState === 'RECOVERY') && (
                 <motion.button
                    key="stop"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onTakeBreak}
                    className="h-14 px-6 sm:h-16 sm:px-8 bg-titanium-dark border border-titanium-border rounded-2xl flex items-center gap-2 hover:bg-neutral-800 transition-colors group"
                >
                    <Pause fill="currentColor" size={20} className="text-white group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold tracking-tight text-lg">Pause</span>
                </motion.button>
            )}

            {(sessionState === 'BREAK' || sessionState === 'DISTRACTED') && (
                <motion.div key="resume" className="flex gap-2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onResumeFocus}
                        className="h-14 px-6 sm:h-16 sm:px-8 bg-accent-blue rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(47,88,205,0.5)] hover:bg-blue-600 transition-colors"
                    >
                        <Play fill="white" size={20} className="text-white" />
                        <span className="text-white font-bold tracking-tight text-lg">Resume</span>
                    </motion.button>
                     <ButtonBase onClick={onTakeBreak} colorClass="bg-titanium-dark hover:bg-red-500/10 hover:border-red-500/30" title="End Session">
                         <div className="w-4 h-4 bg-red-500 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    </ButtonBase>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="w-px h-8 bg-white/10" />

        <ButtonBase onClick={onTag} title="Tag Segment" colorClass="hover:bg-white/5">
            <Tag size={20} className="text-neutral-400 hover:text-white transition-colors" />
        </ButtonBase>

        {/* Action Buttons */}
        <ButtonBase 
            onClick={onTakeBreak} 
            colorClass="hover:bg-accent-green/10 hover:border-accent-green/50" 
            title="Take Break"
            disabled={!canTakeBreak && sessionState !== 'RECOVERY'}
        >
            <Coffee size={20} className="text-neutral-400 hover:text-accent-green transition-colors" />
        </ButtonBase>

        <ButtonBase 
            onClick={onAddDistraction} 
            colorClass="hover:bg-accent-orange/10 hover:border-accent-orange/50" 
            title="Log Distraction"
            disabled={!canDistract && sessionState !== 'RECOVERY'}
        >
            <AlertCircle size={20} className="text-neutral-400 hover:text-accent-orange transition-colors" />
        </ButtonBase>

        <div className="w-px h-8 bg-white/10 hidden sm:block" />

        {/* Simulation Speed Controls */}
        <div className="flex gap-2">
            <ButtonBase onClick={onTogglePlay} active={!isPlaying} title={isPlaying ? "Pause Simulation" : "Resume Simulation"}>
                {isPlaying ? <Pause size={18} className="text-neutral-400" /> : <Play size={18} className="text-neutral-400" />}
            </ButtonBase>
            
            <ButtonBase onClick={onToggleSpeed} active={speedMultiplier > 1} title="Demo Mode (60x Speed)">
                <FastForward size={18} className={speedMultiplier > 1 ? "text-accent-blue animate-pulse" : "text-neutral-400"} />
            </ButtonBase>
        </div>
    </div>
  );
};

export default ControlsPanel;