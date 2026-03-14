import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Square, Maximize2, Minimize2 } from 'lucide-react';
import { Task } from '../../types';

interface ZenModeProps {
  isOpen: boolean;
  onClose: () => void;
  activeTask: Task | undefined;
  currentTime: Date;
  metrics: { deepWorkMinutes: number };
}

const ZenMode: React.FC<ZenModeProps> = ({ isOpen, onClose, activeTask, currentTime, metrics }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
        document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8"
        >
            {/* Background Pulse */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-accent-blue/5 rounded-full blur-[100px] animate-pulse-slow" />
            </div>

            {/* Controls */}
            <div className="absolute top-8 right-8 flex gap-4 z-20">
                <button 
                    onClick={toggleFullscreen}
                    className="p-3 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>
                <button 
                    onClick={onClose}
                    className="p-3 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-2xl">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="inline-block px-3 py-1 rounded-full border border-accent-blue/30 bg-accent-blue/10 text-accent-blue text-xs font-bold tracking-widest uppercase mb-8">
                        Deep Focus Mode
                    </span>
                </motion.div>

                <motion.h1 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[12rem] leading-none font-bold tracking-tighter text-white font-mono tabular-nums select-none"
                >
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </motion.h1>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12"
                >
                    <p className="text-neutral-500 text-sm uppercase tracking-widest mb-2">Current Task</p>
                    <h2 className="text-3xl md:text-4xl font-semibold text-white">
                        {activeTask ? activeTask.title : 'Unassigned Focus'}
                    </h2>
                    {activeTask && (
                        <p className="text-accent-blue mt-2 font-medium">{activeTask.project}</p>
                    )}
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-16 flex items-center justify-center gap-8"
                >
                    <div className="text-center">
                        <p className="text-4xl font-bold text-white tabular-nums">{Math.floor(metrics.deepWorkMinutes)}</p>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Min Focused</p>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Action */}
            <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onClose}
                className="absolute bottom-12 flex items-center gap-3 px-8 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-all group"
            >
                <Square size={18} fill="currentColor" />
                <span className="font-bold tracking-wide">Stop Session</span>
            </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ZenMode;