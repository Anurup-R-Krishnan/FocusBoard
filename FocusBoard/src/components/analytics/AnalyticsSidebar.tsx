
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Calendar, CalendarDays, Layout, Download, Tags, Briefcase, Users, X, PieChart
} from 'lucide-react';

export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CATEGORY' | 'PROJECT' | 'CLIENT' | 'COMPARE' | 'EXPORT';

interface AnalyticsSidebarProps {
    activeTab: ReportType;
    onChange: (tab: ReportType) => void;
    isOpen: boolean;
    onClose: () => void;
}

const AnalyticsSidebar: React.FC<AnalyticsSidebarProps> = ({ activeTab, onChange, isOpen, onClose }) => {
    const navItems = [
        {
            label: 'Time',
            items: [
                { id: 'DAILY', label: 'Daily', icon: Clock },
                { id: 'WEEKLY', label: 'Weekly', icon: Calendar },
                { id: 'MONTHLY', label: 'Monthly', icon: CalendarDays },
            ]
        },
        {
            label: 'Breakdown',
            items: [
                { id: 'CATEGORY', label: 'By Category', icon: Tags },
                { id: 'PROJECT', label: 'By Project', icon: Briefcase },
                { id: 'CLIENT', label: 'By Client', icon: Users },
            ]
        },
        {
            label: 'Tools',
            items: [
                { id: 'COMPARE', label: 'Comparison', icon: Layout },
                { id: 'EXPORT', label: 'Export', icon: Download },
            ]
        }
    ];

    return (
        <>
            {/* Desktop Static Sidebar (Collapsible) */}
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="hidden lg:block flex-shrink-0 h-full z-20 overflow-hidden"
                    >
                        <SidebarContent navItems={navItems} activeTab={activeTab} onChange={onChange} onClose={onClose} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="lg:hidden fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="lg:hidden fixed inset-y-0 left-0 w-72 z-[70] shadow-2xl h-full bg-titanium-dark"
                        >
                            <SidebarContent navItems={navItems} activeTab={activeTab} onChange={onChange} onClose={onClose} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

const SidebarContent = ({ navItems, activeTab, onChange, onClose }: any) => (
    <div className="w-64 h-full flex flex-col bg-titanium-dark border-r border-titanium-border">
        <div className="px-6 py-6 mb-2 flex justify-between items-center">
            <div className="overflow-hidden">
                <h1 className="text-xl font-bold text-white tracking-tight truncate">Reports</h1>
                <p className="text-xs text-neutral-500 mt-1 font-medium truncate">Analytics & Insights</p>
            </div>
            {/* Mobile Close Button */}
            <button onClick={onClose} className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 custom-scrollbar">
            {navItems.map((group: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2">
                    <div className="px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest opacity-70 truncate">
                        {group.label}
                    </div>
                    <div className="flex flex-col gap-1">
                        {group.items.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onChange(item.id as ReportType);
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={`
                                    group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap outline-none text-left
                                    ${activeTab === item.id
                                        ? 'bg-white/10 text-white shadow-lg border border-white/5'
                                        : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }
                                `}
                            >
                                <item.icon size={18} className={`shrink-0 ${activeTab === item.id ? 'text-accent-blue' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default AnalyticsSidebar;
