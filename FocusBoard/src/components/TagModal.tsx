import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, PenTool, Coffee, BookOpen, MessageCircle } from 'lucide-react';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTag: (tag: string) => void;
}

const tags = [
  { label: 'Coding', icon: Code, color: 'text-blue-400' },
  { label: 'Design', icon: PenTool, color: 'text-pink-400' },
  { label: 'Meeting', icon: MessageCircle, color: 'text-purple-400' },
  { label: 'Reading', icon: BookOpen, color: 'text-yellow-400' },
  { label: 'Break', icon: Coffee, color: 'text-green-400' },
];

const TagModal: React.FC<TagModalProps> = ({ isOpen, onClose, onTag }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-none"
          />
          
          {/* Modal Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 w-full max-w-sm bg-titanium-surface border border-titanium-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden bottom-0 sm:bottom-auto sm:top-auto"
            style={{ maxHeight: '80vh' }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Tag Session</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X size={20} className="text-neutral-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {tags.map((tag) => (
                  <motion.button
                    key={tag.label}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                        onTag(tag.label);
                        onClose();
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-titanium-dark border border-titanium-border hover:border-neutral-500 transition-colors group"
                  >
                    <tag.icon size={24} className={`mb-2 ${tag.color} group-hover:scale-110 transition-transform duration-300`} />
                    <span className="text-sm font-medium text-neutral-300">{tag.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Handle bar for mobile feel */}
            <div className="w-full h-6 flex items-center justify-center sm:hidden">
                <div className="w-12 h-1 bg-neutral-700 rounded-full" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TagModal;