import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

const iconMap = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: 'border-green-500/30 bg-green-500/10 text-green-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

const Toast: React.FC = () => {
    const { toasts, dismiss } = useToastStore();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = iconMap[toast.type];
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl ${colorMap[toast.type]}`}
                        >
                            <Icon size={16} className="shrink-0 mt-0.5" />
                            <span className="text-xs font-medium flex-1">{toast.message}</span>
                            <button
                                onClick={() => dismiss(toast.id)}
                                className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default Toast;
