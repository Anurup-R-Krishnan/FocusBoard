
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const updates = [
    {
      version: 'v1.2.0',
      date: 'October 24, 2023',
      highlights: [
        'Introduced "Zen Mode" for distraction-free deep work sessions.',
        'Added new "Team View" for managing workspace members and permissions.',
        'Enhanced analytics with detailed Project and Client reports.',
        'Keyboard shortcuts are now fully customizable.',
      ],
      tag: 'Major Update'
    },
    {
      version: 'v1.1.5',
      date: 'October 10, 2023',
      highlights: [
        'Dark mode contrast improvements.',
        'Fixed an issue with calendar sync latency.',
        'Added export to CSV for all reports.',
      ],
      tag: 'Improvement'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-titanium-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-accent-blue/20 to-purple-500/20 p-8 text-center relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/10 shadow-xl">
                        <Sparkles size={32} className="text-yellow-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">What's New</h2>
                    <p className="text-neutral-300 text-sm mt-1">Discover the latest features and improvements.</p>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/20 rounded-full text-white/50 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {updates.map((update, i) => (
                    <div key={update.version} className="relative pl-6 border-l border-white/10">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-accent-blue border-2 border-titanium-surface" />
                        
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-bold text-white">{update.version}</span>
                            <span className="text-xs font-mono text-neutral-500">{update.date}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${update.tag === 'Major Update' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-neutral-300'}`}>
                                {update.tag}
                            </span>
                        </div>
                        
                        <ul className="space-y-3">
                            {update.highlights.map((point, j) => (
                                <li key={j} className="flex items-start gap-3 text-sm text-neutral-300 leading-relaxed">
                                    <CheckCircle2 size={16} className="text-accent-green mt-0.5 shrink-0 opacity-80" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-titanium-dark shrink-0">
                <button 
                    onClick={onClose}
                    className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                    Awesome, let's go <ArrowRight size={16} />
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChangelogModal;
