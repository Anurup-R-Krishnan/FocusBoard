
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, PenTool, Coffee, BookOpen, MessageCircle, Briefcase, Plus, ArrowRight } from 'lucide-react';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTag: (tag: string) => void;
  onCreateProject?: (projectData: { title: string, category: string }) => void;
}

const tags = [
  { label: 'Coding', icon: Code, color: 'text-blue-400' },
  { label: 'Design', icon: PenTool, color: 'text-pink-400' },
  { label: 'Meeting', icon: MessageCircle, color: 'text-purple-400' },
  { label: 'Reading', icon: BookOpen, color: 'text-yellow-400' },
  { label: 'Break', icon: Coffee, color: 'text-green-400' },
];

const TagModal: React.FC<TagModalProps> = ({ isOpen, onClose, onTag, onCreateProject }) => {
  const [view, setView] = useState<'TAG' | 'CREATE_PROJECT'>('TAG');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCategory, setProjectCategory] = useState('General');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateProject && projectTitle.trim()) {
        onCreateProject({ title: projectTitle, category: projectCategory });
        onClose();
        // Reset state
        setTimeout(() => {
            setView('TAG');
            setProjectTitle('');
        }, 300);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-titanium-surface border border-titanium-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '80vh' }}
          >
             <AnimatePresence mode="wait">
                {view === 'TAG' ? (
                    <motion.div 
                        key="tag-view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white">Tag Session</h3>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                            <X size={20} className="text-neutral-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
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
                        
                        {onCreateProject && (
                             <button 
                                onClick={() => setView('CREATE_PROJECT')}
                                className="w-full py-3 rounded-xl border border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                             >
                                 <Plus size={16} /> Create Project from Session
                             </button>
                        )}
                    </motion.div>
                ) : (
                     <motion.div 
                        key="project-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white">New Project</h3>
                            <button onClick={() => setView('TAG')} className="text-sm text-neutral-500 hover:text-white">Cancel</button>
                        </div>
                        
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Project Name</label>
                                <input 
                                    type="text" 
                                    value={projectTitle}
                                    onChange={(e) => setProjectTitle(e.target.value)}
                                    placeholder="e.g. Q4 Marketing Plan"
                                    className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue transition-colors"
                                    autoFocus
                                />
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Category</label>
                                <select 
                                    value={projectCategory}
                                    onChange={(e) => setProjectCategory(e.target.value)}
                                    className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors appearance-none"
                                >
                                    <option value="General">General</option>
                                    <option value="Frontend">Frontend</option>
                                    <option value="Backend">Backend</option>
                                    <option value="Design">Design</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                            </div>

                            <button 
                                type="submit"
                                disabled={!projectTitle.trim()}
                                className="w-full py-3 mt-2 bg-accent-blue text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Create Project <ArrowRight size={16} />
                            </button>
                        </form>
                    </motion.div>
                )}
             </AnimatePresence>
            
            {/* Handle bar for mobile feel */}
            <div className="w-full h-6 flex items-center justify-center sm:hidden bg-titanium-surface">
                <div className="w-12 h-1 bg-neutral-700 rounded-full" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TagModal;
