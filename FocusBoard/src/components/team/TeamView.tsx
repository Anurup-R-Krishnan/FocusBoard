
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Briefcase, Shield, BarChart3, ChevronDown, Check, Plus,
    MoreHorizontal, Mail, Search, Lock, Globe, Clock, ArrowUpRight,
    Zap, AlertCircle, LayoutGrid, List, PanelLeft, X
} from 'lucide-react';
import StatCard from '../analytics/shared/StatCard';
import Skeleton from '../shared/Skeleton';
import { useDashboardStore } from '../../store/useDashboardStore';

// --- Types & Static Data ---

type TeamTab = 'OVERVIEW' | 'MEMBERS' | 'ROLES' | 'PROJECTS';

interface Member {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    lastActive: string;
    avatar: string;
}

const ROLES_PERMISSIONS = [
    { id: 'manage_projects', label: 'Manage Projects', owner: true, admin: true, member: true, guest: false },
    { id: 'invite_members', label: 'Invite Members', owner: true, admin: true, member: false, guest: false },
    { id: 'view_analytics', label: 'View Team Analytics', owner: true, admin: true, member: true, guest: false },
    { id: 'billing', label: 'Manage Billing', owner: true, admin: false, member: false, guest: false },
    { id: 'delete_workspace', label: 'Delete Workspace', owner: true, admin: false, member: false, guest: false },
];

// --- Sub-Components ---

const WorkspaceSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [current, setCurrent] = useState('FocusBoard Pro');
    const workspaces = ['FocusBoard Pro', 'Personal', 'Side Hustle'];

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors w-full"
            >
                <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0">
                    {current[0]}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Workspace</div>
                    <div className="text-sm font-bold text-white truncate">{current}</div>
                </div>
                <ChevronDown size={16} className={`text-neutral-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-titanium-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            {workspaces.map(ws => (
                                <button
                                    key={ws}
                                    onClick={() => { setCurrent(ws); setIsOpen(false); }}
                                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <span className="font-medium">{ws}</span>
                                    {current === ws && <Check size={14} className="text-accent-blue" />}
                                </button>
                            ))}
                            <div className="h-px bg-white/5 my-1" />
                            <button className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-neutral-400 hover:bg-white/5 hover:text-white transition-colors">
                                <Plus size={14} /> Create Workspace
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const TeamOverview = ({ members, tasks }: { members: Member[], tasks: any[] }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Total Focus"
                value={`${Math.floor(tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0) / 60)}h`}
                sub="Tracked"
                icon={Clock}
                color="text-accent-blue"
            />
            <StatCard label="Active Projects" value={tasks.filter(t => t.status !== 'DONE').length.toString()} icon={Briefcase} color="text-white" />
            <StatCard
                label="Team Efficiency"
                value={`${tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100)}%`}
                icon={Zap}
                color="text-green-400"
            />
            <StatCard label="Members" value={members.length.toString()} sub="Active" icon={Users} color="text-purple-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-titanium-dark border border-titanium-border rounded-[2rem] p-6 h-80 relative overflow-hidden">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">Project Throughput</h3>
                <div className="space-y-4">
                    {Array.from(new Set(tasks.map((task: any) => task.project).filter(Boolean))).slice(0, 6).map((projectName: any) => {
                        const projectTasks = tasks.filter((task: any) => task.project === projectName);
                        const completed = projectTasks.filter((task: any) => task.status === 'DONE').length;
                        const pct = projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100);
                        return (
                            <div key={projectName}>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-neutral-300 font-medium truncate max-w-[70%]">{projectName}</span>
                                    <span className="text-neutral-500 font-mono">{pct}%</span>
                                </div>
                                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-blue" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                    {tasks.length === 0 && (
                        <div className="h-48 flex items-center justify-center text-neutral-500 text-xs">No project task data available yet.</div>
                    )}
                </div>
            </div>

            <div className="bg-titanium-dark border border-titanium-border rounded-[22px] p-6">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">Top Contributors</h3>
                <div className="space-y-4">
                    {members.slice(0, 3).map((m) => {
                        const memberTasks = tasks.filter((task: any) => (task.user_id || task.assigneeId || task.assignee) === m.id);
                        const hours = Math.floor(memberTasks.reduce((sum: number, task: any) => sum + (task.timeSpent || 0), 0) / 60);
                        return (
                            <div key={m.id} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-white/5">
                                    {m.avatar}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white">{m.name}</div>
                                    <div className="text-[10px] text-neutral-500">{m.role}</div>
                                </div>
                                <div className="text-xs font-mono text-accent-blue font-bold">{hours}h</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
);

const MemberList = ({ members }: { members: Member[] }) => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                    type="text"
                    placeholder="Search members..."
                    className="w-full bg-titanium-dark border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
                />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20">
                <Mail size={16} /> Invite Member
            </button>
        </div>

        <div className="bg-titanium-dark border border-titanium-border rounded-[22px] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="p-4 pl-6 font-bold text-neutral-500 uppercase text-[10px] tracking-wider">User</th>
                            <th className="p-4 font-bold text-neutral-500 uppercase text-[10px] tracking-wider">Role</th>
                            <th className="p-4 font-bold text-neutral-500 uppercase text-[10px] tracking-wider">Status</th>
                            <th className="p-4 font-bold text-neutral-500 uppercase text-[10px] tracking-wider">Last Active</th>
                            <th className="p-4 pr-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {members.map((member) => (
                            <tr key={member.id} className="group hover:bg-white/5 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                            {member.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{member.name}</div>
                                            <div className="text-[10px] text-neutral-500">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${member.role === 'Owner' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        member.role === 'Admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            member.role === 'Guest' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-neutral-800 text-neutral-400 border-neutral-700'
                                        }`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-green-500' : member.status === 'Invited' ? 'bg-yellow-500' : 'bg-neutral-500'}`} />
                                        <span className="text-neutral-300">{member.status}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-neutral-500 font-mono text-xs">
                                    {member.lastActive}
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-500 hover:text-white transition-colors">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const RolesUI = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-titanium-dark border border-titanium-border rounded-[22px] overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white">Permissions Matrix</h3>
                <p className="text-sm text-neutral-500 mt-1">Configure what each role can access within this workspace.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="p-5 font-bold text-neutral-500 uppercase text-[10px] tracking-wider w-1/3">Permission</th>
                            <th className="p-5 text-center font-bold text-purple-400 uppercase text-[10px] tracking-wider w-1/6">Owner</th>
                            <th className="p-5 text-center font-bold text-blue-400 uppercase text-[10px] tracking-wider w-1/6">Admin</th>
                            <th className="p-5 text-center font-bold text-neutral-300 uppercase text-[10px] tracking-wider w-1/6">Member</th>
                            <th className="p-5 text-center font-bold text-orange-400 uppercase text-[10px] tracking-wider w-1/6">Guest</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {ROLES_PERMISSIONS.map(perm => (
                            <tr key={perm.id} className="hover:bg-white/[0.01]">
                                <td className="p-5 font-medium text-neutral-300">{perm.label}</td>
                                <td className="p-5 text-center"><div className="flex justify-center"><Check size={16} className={perm.owner ? "text-green-500" : "text-neutral-700"} /></div></td>
                                <td className="p-5 text-center"><div className="flex justify-center"><Check size={16} className={perm.admin ? "text-green-500" : "text-neutral-700"} /></div></td>
                                <td className="p-5 text-center"><div className="flex justify-center"><Check size={16} className={perm.member ? "text-green-500" : "text-neutral-700"} /></div></td>
                                <td className="p-5 text-center"><div className="flex justify-center"><Check size={16} className={perm.guest ? "text-green-500" : "text-neutral-700"} /></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const SharedProjects = ({ projects }: { projects: any[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {projects.map((project, i) => (
            <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-titanium-dark border border-titanium-border rounded-[22px] p-6 hover:border-white/20 transition-all cursor-pointer group"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-xl ${i % 2 === 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        <Briefcase size={20} />
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${project.status === 'On Track' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {project.status}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent-blue transition-colors">{project.title}</h3>
                <p className="text-xs text-neutral-500 mb-6">Due {project.due} • {project.members} members</p>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-neutral-400">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${i % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`} style={{ width: `${project.progress}%` }} />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(m => (
                            <div key={m} className="w-6 h-6 rounded-full bg-neutral-700 border border-titanium-dark" />
                        ))}
                        {project.members > 3 && (
                            <div className="w-6 h-6 rounded-full bg-neutral-800 border border-titanium-dark flex items-center justify-center text-[8px] text-neutral-400">+{project.members - 3}</div>
                        )}
                    </div>
                    <button className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1 group/btn">
                        View <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </motion.div>
        ))}

        {/* New Project Card */}
        <button className="bg-transparent border border-dashed border-white/10 rounded-[22px] p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/5 hover:border-white/20 transition-all text-neutral-500 hover:text-white group h-full min-h-[240px]">
            <div className="w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center transition-colors">
                <Plus size={24} />
            </div>
            <span className="font-bold text-sm">Create New Project</span>
        </button>
    </div>
);

// --- Main View ---

const TeamView = () => {
    const { squad, tasks, isLoading } = useDashboardStore();
    const [activeTab, setActiveTab] = useState<TeamTab>('OVERVIEW');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    if (isLoading) {
        return (
            <div className="flex flex-col md:flex-row h-screen bg-black overflow-hidden">
                <div className="hidden md:block w-64 flex-shrink-0 h-full bg-titanium-dark border-r border-titanium-border p-4">
                    <Skeleton width="100%" height={60} className="mb-8" />
                    <Skeleton width="100%" height={40} className="mb-2" />
                    <Skeleton width="100%" height={40} className="mb-2" />
                    <Skeleton width="100%" height={40} className="mb-2" />
                </div>
                <div className="flex-1 p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto">
                        <Skeleton width={300} height={40} className="mb-8" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <Skeleton className="h-28 w-full" />
                            <Skeleton className="h-28 w-full" />
                            <Skeleton className="h-28 w-full" />
                            <Skeleton className="h-28 w-full" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-80"><Skeleton className="h-full w-full" /></div>
                            <div className="h-80"><Skeleton className="h-full w-full" /></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const members: Member[] = squad.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email || s.email_id || 'No email',
        role: s.role,
        status: s.status,
        lastActive: s.lastActive || s.last_active_at || '-',
        avatar: s.avatar || s.name.substring(0, 2).toUpperCase()
    }));

    const uniqueProjects = Array.from(new Set(tasks.map(t => t.project).filter(Boolean))).map((title, i) => {
        const projectTasks = tasks.filter((task: any) => task.project === title);
        const completed = projectTasks.filter((task: any) => task.status === 'DONE').length;
        const progress = projectTasks.length === 0 ? 0 : Math.round((completed / projectTasks.length) * 100);
        const status = progress >= 70 ? 'On Track' : 'At Risk';
        const dueCandidates = projectTasks.map((task: any) => task.dueDate).filter(Boolean).sort();
        const due = dueCandidates.length > 0
            ? new Date(dueCandidates[0]).toLocaleDateString([], { month: 'short', day: 'numeric' })
            : 'No deadline';

        return {
            id: `p${i}`,
            title,
            members: new Set(projectTasks.map((task: any) => task.user_id || task.assigneeId || task.assignee).filter(Boolean)).size || 1,
            progress,
            status,
            due,
        };
    });

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

    const tabs = [
        { id: 'OVERVIEW', label: 'Overview', icon: BarChart3 },
        { id: 'MEMBERS', label: 'Members', icon: Users },
        { id: 'ROLES', label: 'Roles', icon: Shield },
        { id: 'PROJECTS', label: 'Projects', icon: LayoutGrid },
    ];

    return (
        <div className="flex flex-col md:flex-row h-screen bg-black overflow-hidden">

            {/* Desktop Static Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 256, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="hidden md:block flex-shrink-0 h-full z-20 overflow-hidden"
                    >
                        <div className="w-64 h-full">
                            <SidebarContent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Drawer Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="md:hidden fixed inset-y-0 left-0 w-72 z-[70] shadow-2xl h-full bg-titanium-dark"
                        >
                            <SidebarContent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-[#050505] scroll-smooth p-6 lg:p-10 pb-32">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8 flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-white/10"
                        >
                            <PanelLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h1>
                            <p className="text-sm text-neutral-500 mt-1">Manage your team workspace and settings.</p>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        {activeTab === 'OVERVIEW' && <TeamOverview key="overview" members={members} tasks={tasks} />}
                        {activeTab === 'MEMBERS' && <MemberList key="members" members={members} />}
                        {activeTab === 'ROLES' && <RolesUI key="roles" />}
                        {activeTab === 'PROJECTS' && <SharedProjects key="projects" projects={uniqueProjects} />}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const SidebarContent = ({ tabs, activeTab, setActiveTab, setSidebarOpen }: any) => (
    <div className="h-full flex flex-col bg-titanium-dark border-r border-titanium-border">
        <div className="p-6 pb-2 flex justify-between items-start">
            <WorkspaceSwitcher />
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-neutral-400 hover:text-white"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            {tabs.map((tab: any) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as TeamTab); if (window.innerWidth < 768) setSidebarOpen(false); }}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap outline-none
                            ${isActive ? 'bg-white text-black font-bold shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Icon size={18} />
                        {tab.label}
                    </button>
                );
            })}
        </nav>

        <div className="p-4 border-t border-white/5">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/5">
                <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                    <Lock size={12} className="text-accent-blue" /> Pro Plan
                </h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed mb-3">
                    You're using 5/10 seats on your current plan.
                </p>
                <button className="text-[10px] font-bold text-accent-blue hover:text-white transition-colors">
                    Manage Billing &rarr;
                </button>
            </div>
        </div>
    </div>
);

export default TeamView;
