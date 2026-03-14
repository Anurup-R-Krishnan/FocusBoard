
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AnalyticsSidebar, { ReportType } from './AnalyticsSidebar';
import DailyReport from './reports/DailyReport';
import WeeklyReport from './reports/WeeklyReport';
import MonthlyReport from './reports/MonthlyReport';
import ClientReport from './reports/ClientReport';
import ProjectReport from './reports/ProjectReport';
import ComparisonView from './reports/ComparisonView';
import ExportScreen from './ExportScreen';
import TagBreakdown from './TagBreakdown';
import { Calendar as CalendarIcon, ChevronDown, Download, SlidersHorizontal, PanelLeft } from 'lucide-react';
import { Task, Category, TimeSegment } from '../../types';
import FocusGauge from '../dashboard/FocusGauge';
import { useDashboardStore } from '../../store/useDashboardStore';
import { DrillDownType } from '../dashboard/DrillDownView';

interface AnalyticsViewProps {
    onNavigate?: (type: DrillDownType, data: any) => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigate }) => {
    const { metrics, timeline, tasks, isLoading, error } = useDashboardStore();

    // Map to state expected by the view
    const state = { metrics, timeline, tasks };
    const categories: any[] = []; // temporary fallback
    const [activeTab, setActiveTab] = useState<ReportType>('DAILY');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(),
        end: new Date(),
    });
    const [quickFilter, setQuickFilter] = useState<'today' | 'week' | 'month'>('today');

    const applyQuickFilter = (filter: 'today' | 'week' | 'month') => {
        setQuickFilter(filter);
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (filter) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                start.setDate(now.getDate() - now.getDay());
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
        }

        setDateRange({ start, end });
    };

    useEffect(() => {
        applyQuickFilter('today');
    }, []);

    // Responsive sidebar init
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getHeaderInfo = () => {
        switch (activeTab) {
            case 'DAILY': return { title: 'Daily Report', subtitle: 'Detailed session breakdown', range: 'Today, Oct 24' };
            case 'WEEKLY': return { title: 'Weekly Performance', subtitle: 'Trends & Analysis', range: 'Oct 18 - Oct 24' };
            case 'MONTHLY': return { title: 'Monthly Summary', subtitle: 'High-level overview', range: 'October 2023' };
            case 'CATEGORY': return { title: 'Category Breakdown', subtitle: 'Time distribution by tag', range: 'Last 30 Days' };
            case 'PROJECT': return { title: 'Project Insights', subtitle: 'Resource allocation', range: 'Last 30 Days' };
            case 'CLIENT': return { title: 'Client Report', subtitle: 'Billable hours & budgets', range: 'Q4 2023' };
            case 'COMPARE': return { title: 'Period Comparison', subtitle: 'Performance deltas', range: 'Week vs Last Week' };
            case 'EXPORT': return { title: 'Data Export', subtitle: 'Download reports', range: 'All Time' };
            default: return { title: 'Analytics', subtitle: '', range: '' };
        }
    };

    const header = getHeaderInfo();

    // Calculate Tag Breakdown Data for 'CATEGORY' tab
    const categoryChartData = useMemo(() => {
        const stats: Record<string, number> = {};
        let totalMinutes = 0;

        timeline.forEach(seg => {
            if (seg.tags && seg.tags.length > 0) {
                const tag = seg.tags[0];
                const duration = seg.end - seg.start;
                stats[tag] = (stats[tag] || 0) + duration;
                totalMinutes += duration;
            }
        });

        // Default color map if category not found
        const defaultColors = ['#3B82F6', '#EC4899', '#A855F7', '#EAB308', '#10B981', '#EF4444'];

        return Object.entries(stats).map(([label, minutes], i) => {
            const cat = categories.find(c => c.label === label);
            // Convert tailwind class to rough hex or use fallback
            let color = defaultColors[i % defaultColors.length];
            if (cat) {
                if (cat.color.includes('blue')) color = '#3B82F6';
                else if (cat.color.includes('pink')) color = '#EC4899';
                else if (cat.color.includes('purple')) color = '#A855F7';
                else if (cat.color.includes('yellow')) color = '#EAB308';
                else if (cat.color.includes('green') || cat.color.includes('emerald')) color = '#10B981';
                else if (cat.color.includes('red') || cat.color.includes('orange')) color = '#EF4444';
            }

            return {
                label,
                value: Math.round((minutes / (totalMinutes || 1)) * 100),
                color
            };
        }).sort((a, b) => b.value - a.value);
    }, [categories, timeline]);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-black overflow-hidden selection:bg-accent-blue/30 selection:text-white">

            {/* Sidebar */}
            <AnalyticsSidebar
                activeTab={activeTab}
                onChange={setActiveTab}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end px-6 py-8 border-b border-white/5 bg-titanium-dark/50 backdrop-blur-md z-10 shrink-0 gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 rounded-xl bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-white/5"
                        >
                            <PanelLeft size={20} />
                        </button>
                        <div>
                            <motion.h2
                                key={header.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1"
                            >
                                {header.title}
                            </motion.h2>
                            <motion.p
                                key={header.subtitle}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs sm:text-sm text-neutral-500 font-medium"
                            >
                                {header.subtitle}
                            </motion.p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        {/* Quick Filters */}
                        {(activeTab !== 'EXPORT' && activeTab !== 'COMPARE') && (
                            <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 rounded-xl p-1">
                                <button
                                    onClick={() => applyQuickFilter('today')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${quickFilter === 'today' ? 'bg-accent-blue text-white' : 'text-neutral-400 hover:text-white'}`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => applyQuickFilter('week')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${quickFilter === 'week' ? 'bg-accent-blue text-white' : 'text-neutral-400 hover:text-white'}`}
                                >
                                    This Week
                                </button>
                                <button
                                    onClick={() => applyQuickFilter('month')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${quickFilter === 'month' ? 'bg-accent-blue text-white' : 'text-neutral-400 hover:text-white'}`}
                                >
                                    This Month
                                </button>
                            </div>
                        )}

                        {/* Filter Action */}
                        {['CATEGORY', 'PROJECT', 'CLIENT'].includes(activeTab) && (
                            <button className="p-2.5 bg-neutral-900 border border-white/10 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
                                <SlidersHorizontal size={18} />
                            </button>
                        )}

                        {/* Quick Export Action */}
                        {activeTab !== 'EXPORT' && (
                            <button
                                className="p-2.5 bg-neutral-900 border border-white/10 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
                                title="Quick Export PDF"
                            >
                                <Download size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto pb-20">
                        <AnimatePresence mode="wait">
                            {activeTab === 'DAILY' && <DailyReport key="daily" />}
                            {activeTab === 'WEEKLY' && <WeeklyReport key="weekly" />}
                            {activeTab === 'MONTHLY' && <MonthlyReport key="monthly" />}

                            {activeTab === 'CATEGORY' && (
                                <motion.div
                                    key="category"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-titanium-dark border border-titanium-border rounded-[22px] p-8 h-[600px]"
                                >
                                    <TagBreakdown data={categoryChartData.length > 0 ? categoryChartData : undefined} />
                                </motion.div>
                            )}

                            {activeTab === 'PROJECT' && <ProjectReport key="project" tasks={tasks} />}
                            {activeTab === 'CLIENT' && <ClientReport key="client" />}

                            {activeTab === 'COMPARE' && <ComparisonView key="compare" />}
                            {activeTab === 'EXPORT' && <ExportScreen key="export" />}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
