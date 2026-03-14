import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, X } from 'lucide-react';

const shortcuts = [
  { key: 'F', action: 'Start Focus' },
  { key: 'B', action: 'Take Break' },
  { key: 'D', action: 'Distraction' },
  { key: 'Space', action: 'Play/Pause' },
  { key: '?', action: 'Toggle Help' },
];

const ShortcutHUD: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '?' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !e.repeat) {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
      if (e.key === 'Escape') setIsVisible(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVisible(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-titanium-surface border border-white/10 rounded-2xl shadow-2xl p-6 z-[101]"
          >
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Command size={20} className="text-white" />
                    <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
                </div>
                <button onClick={() => setIsVisible(false)} className="text-neutral-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
             </div>

             <div className="grid grid-cols-1 gap-2">
                {shortcuts.map((s) => (
                    <div key={s.key} className="flex items-center justify-between p-3 rounded-lg bg-titanium-dark border border-white/5">
                        <span className="text-sm text-neutral-300 font-medium">{s.action}</span>
                        <div className="flex gap-1">
                             <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs font-mono text-white min-w-[24px] text-center">
                                {s.key}
                             </kbd>
                        </div>
                    </div>
                ))}
             </div>
             
             <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] text-neutral-500">FocusBoard Pro • v1.0.2</p>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShortcutHUD;