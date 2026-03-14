import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Timer, Tag, ChevronDown } from 'lucide-react';
import { getAllCategories, Category } from '../../services/categoryApi';

interface FocusSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (payload: { label: string; plannedMinutes: number; categoryId?: string | null }) => void;
}

const FocusSessionModal: React.FC<FocusSessionModalProps> = ({ isOpen, onClose, onStart }) => {
    const [label, setLabel] = useState('');
    const [plannedMinutes, setPlannedMinutes] = useState(25);
    const [categoryId, setCategoryId] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        getAllCategories(1, 200)
            .then(result => setCategories(result.data || []))
            .catch(() => setCategories([]))
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setLabel('');
        setPlannedMinutes(25);
        setCategoryId('');
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!label.trim() || plannedMinutes <= 0) return;
        onStart({
            label: label.trim(),
            plannedMinutes,
            categoryId: categoryId || null,
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0, scale: 0.96 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: "100%", opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-titanium-surface border border-titanium-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
                        style={{ maxHeight: '85vh' }}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Start Focus Session</h3>
                                    <p className="text-xs text-neutral-500">Name the session and set the timer.</p>
                                </div>
                                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                                    <X size={20} className="text-neutral-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                                        Session Label
                                    </label>
                                    <div className="relative">
                                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                        <input
                                            type="text"
                                            value={label}
                                            onChange={(e) => setLabel(e.target.value)}
                                            placeholder="e.g. Study Calculus"
                                            className="w-full bg-titanium-dark border border-white/10 rounded-xl px-9 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue transition-colors"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                                            Duration (min)
                                        </label>
                                        <div className="relative">
                                            <Timer size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                            <input
                                                type="number"
                                                min={5}
                                                max={180}
                                                value={plannedMinutes}
                                                onChange={(e) => setPlannedMinutes(Math.max(1, Number(e.target.value)))}
                                                className="w-full bg-titanium-dark border border-white/10 rounded-xl px-9 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                                            Category (optional)
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={categoryId}
                                                onChange={(e) => setCategoryId(e.target.value)}
                                                className="w-full bg-titanium-dark border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer"
                                            >
                                                <option value="">Uncategorized</option>
                                                {categories.map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                                        </div>
                                        {isLoading && (
                                            <p className="text-[10px] text-neutral-600 mt-1">Loading categories…</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!label.trim() || plannedMinutes <= 0}
                                    className="w-full py-3 mt-2 bg-accent-blue text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Start Session
                                </button>
                            </form>
                        </div>

                        <div className="w-full h-6 flex items-center justify-center sm:hidden bg-titanium-surface">
                            <div className="w-12 h-1 bg-neutral-700 rounded-full" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FocusSessionModal;
