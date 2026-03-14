import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, X } from 'lucide-react';

interface BreakToastProps {
  isVisible: boolean;
  onDismiss: () => void;
  onTakeBreak: () => void;
}

const BreakToast: React.FC<BreakToastProps> = ({ isVisible, onDismiss, onTakeBreak }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-6 right-4 sm:right-6 z-50 w-80 bg-titanium-surface/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-4 flex items-start gap-3"
        >
          <div className="bg-accent-blue/20 p-2 rounded-full">
            <Coffee size={20} className="text-accent-blue" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Time for a break?</h4>
            <p className="text-xs text-neutral-400 mt-1">You've been in deep focus for 50 minutes. Recharge your cognitive battery.</p>
            <div className="mt-3 flex gap-2">
                <button 
                    onClick={() => { onTakeBreak(); onDismiss(); }}
                    className="text-xs font-medium bg-white text-black px-3 py-1.5 rounded-full hover:bg-neutral-200 transition-colors"
                >
                    Take Break
                </button>
                <button 
                    onClick={onDismiss}
                    className="text-xs font-medium text-neutral-400 px-3 py-1.5 hover:text-white transition-colors"
                >
                    Dismiss
                </button>
            </div>
          </div>
          <button onClick={onDismiss} className="text-neutral-500 hover:text-white">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BreakToast;