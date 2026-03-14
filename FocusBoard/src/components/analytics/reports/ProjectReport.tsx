
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Task } from '../../types';
import { Briefcase, CheckCircle2, Clock, AlertCircle, Layers } from 'lucide-react';
import StatCard from '../shared/StatCard';

interface ProjectReportProps {
    tasks: Task[];
}

const ProjectReport: React.FC<ProjectReportProps> = ({ tasks }) => {
    const stats = useMemo(() => {
        const uniqueProjects = new Set(tasks.map(t => t.project).filter(Boolean));
        const totalHours = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0) / 60;
        const activeTasks = tasks.filter(t => t.status !== 'DONE' && !t.archived).length;
        const completedTasks = tasks.filter(t => t.status === 'DONE').length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Project Breakdown
        const projectMap = new Map<string, { hours: number, count: number }>();
        tasks.forEach(t => {
            if (!t.project) return;
            const curr = projectMap.get(t.project) || { hours: 0, count: 0 };
            projectMap.set(t.project, { 
                hours: curr.hours + ((t.timeSpent || 0) / 60), 
                count: curr.count + 1 
            });
        });

        const projectData = Array.from(projectMap.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.hours - a.hours);

        return {
            projectCount: uniqueProjects.size,
            totalHours,
            activeTasks,
            completionRate,
            projectData
        };
    }, [tasks]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label="Active Projects" 
                    value={stats.projectCount} 
                    icon={Briefcase} 
                    color="text-white"
                />
                <StatCard 
                    label="Total Hours" 
                    value={`${stats.totalHours.toFixed(1)}h`} 
                    icon={Clock} 
                    color="text-accent-blue"
                />
                <StatCard 
                    label="Pending Tasks" 
                    value={stats.activeTasks} 
                    icon={AlertCircle} 
                    color="text-orange-400" 
                />
                <StatCard 
                    label="Completion Rate" 
                    value={`${stats.completionRate}%`} 
                    icon={CheckCircle2} 
                    color="text-green-400"
                    trend={5}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hours by Project Chart */}
                <div className="lg:col-span-2 bg-titanium-dark border border-titanium-border rounded-[22px] p-6 sm:p-8">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">Time Investment by Project</h3>
                    <div className="space-y-5">
                        {stats.projectData.map((proj, i) => (
                            <div key={proj.name}>
                                <div className="flex justify-between items-center text-xs mb-2">
                                    <span className="font-bold text-white flex items-center gap-2 truncate min-w-0">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${i % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                        <span className="truncate">{proj.name}</span>
                                    </span>
                                    <span className="font-mono text-neutral-400 shrink-0 ml-2">{proj.hours.toFixed(1)}h</span>
                                </div>
                                <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden relative">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(proj.hours / Math.max(stats.projectData[0]?.hours || 1, 1)) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-full absolute left-0 top-0 rounded-full ${i % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`} 
                                    />
                                </div>
                            </div>
                        ))}
                        {stats.projectData.length === 0 && (
                            <div className="text-center py-10 text-neutral-500 text-xs">No project data available.</div>
                        )}
                    </div>
                </div>

                {/* Efficiency Widget */}
                <div className="bg-gradient-to-br from-neutral-800 to-titanium-dark border border-titanium-border rounded-[22px] p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Project Health</h3>
                        <p className="text-sm text-neutral-300 leading-relaxed">
                            Most time is being spent on <strong className="text-white">{stats.projectData[0]?.name || 'Unknown'}</strong>. 
                            Ensure this aligns with your quarterly goals.
                        </p>
                    </div>
                    <div className="mt-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Layers className="text-accent-blue" size={20} />
                            <span className="text-xl font-bold text-white">Focus Factor</span>
                        </div>
                        <div className="text-4xl font-bold text-white">8.5<span className="text-lg text-neutral-500">/10</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectReport;
