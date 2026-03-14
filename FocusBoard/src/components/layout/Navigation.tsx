
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PieChart, FolderKanban, Tags, Calendar, Settings as SettingsIcon, Hexagon, ChevronRight, Users, Building2, CircleHelp, Sparkles, Blocks, X, Target, Headset } from 'lucide-react';

export type Page =
    | 'dashboard'
    | 'analytics'
    | 'squad'
    | 'tasks'
    | 'team'
    | 'integrations' // Added integrations
    | 'settings'
    | 'calendar'
    | 'session-details'
    | 'categories'
    | 'goals'
    | 'support-tickets'
    // Support Pages
    | 'help'
    | 'shortcuts'
    | 'privacy'
    | 'terms'
    | 'status'
    // Public / Auth Pages
    | 'login'
    | 'signup'
    | 'verify-email'
    | 'forgot-password'
    | 'reset-password'
    | 'locked'
    | 'onboarding';

interface NavigationProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onShowChangelog: () => void;
}

const NavSection = ({ title, isCollapsed, children }: { title?: string, isCollapsed: boolean, children: React.ReactNode }) => (
    <div className={`mb-8 ${isCollapsed ? 'px-0 flex flex-col items-center' : ''}`}>
        {title && !isCollapsed && (
            <motion.h4
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 truncate"
            >
                {title}
            </motion.h4>
        )}
        <div className={`flex flex-col gap-1 ${isCollapsed ? 'w-full items-center' : ''}`}>
            {children}
        </div>
    </div>
);

const NavItem = ({ page, icon: Icon, label, badge, currentPage, setCurrentPage, isCollapsed }: { page: Page; icon: any; label: string; badge?: string; currentPage: Page; setCurrentPage: (page: Page) => void; isCollapsed: boolean }) => {
    // Don't show these pages in the nav bar
    if (['session-details', 'login', 'signup', 'verify-email', 'forgot-password', 'reset-password', 'locked', 'onboarding', 'shortcuts', 'privacy', 'terms', 'status'].includes(page)) return null;

    const isActive = currentPage === page;
    return (
        <button
            onClick={() => setCurrentPage(page)}
            title={isCollapsed ? label : undefined}
            className={`
      group flex items-center rounded-xl text-sm font-medium transition-all duration-200 outline-none relative
      ${isActive
                    ? 'bg-accent-blue text-white shadow-md shadow-blue-900/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }
      ${isCollapsed
                    ? 'w-10 h-10 justify-center p-0'
                    : 'w-full px-4 py-2.5'
                }
    `}
        >
            <Icon
                size={20}
                className={`${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'} ${!isCollapsed ? 'mr-3' : ''}`}
                strokeWidth={2}
            />
            {!isCollapsed && (
                <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="tracking-wide truncate flex-1 text-left"
                >
                    {label}
                </motion.span>
            )}
            {!isCollapsed && badge && (
                <span className="bg-accent-blue/20 text-accent-blue text-[9px] font-bold px-1.5 py-0.5 rounded ml-2">{badge}</span>
            )}
            {isCollapsed && isActive && (
                <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-5 bg-accent-blue rounded-r-full sm:hidden"
                />
            )}
        </button>
    );
};

const Navigation: React.FC<NavigationProps> = ({ currentPage, setCurrentPage, isCollapsed, onToggleCollapse, onShowChangelog }) => {
    const [showWhatsNew, setShowWhatsNew] = useState(() => localStorage.getItem('focusboard_whatsnew_hidden') !== 'true');

    return (
        <motion.nav
            layout
            initial={false}
            animate={{ width: isCollapsed ? 80 : 260 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`
            fixed bottom-0 left-0 right-0 z-[60] h-[4.5rem] pb-safe sm:pb-0 bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2
            sm:relative sm:h-screen sm:flex-col sm:justify-start sm:border-t-0 sm:border-r sm:border-white/10 sm:bg-[#121212]
            ${isCollapsed ? 'sm:p-3 items-center' : 'sm:p-6'}
        `}
        >

            {/* Toggle Button (Desktop) */}
            <button
                onClick={onToggleCollapse}
                className="hidden sm:flex absolute -right-3 top-10 w-6 h-6 bg-neutral-800 border border-white/10 rounded-full items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors z-50 shadow-lg group focus:outline-none"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <ChevronRight size={12} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>

            {/* Logo area */}
            <div className={`hidden sm:flex items-center gap-3 mb-12 cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-4'}`} onClick={() => setCurrentPage('dashboard')}>
                <motion.div
                    layout
                    className="w-9 h-9 min-w-[2.25rem] rounded-xl bg-gradient-to-br from-white to-neutral-400 flex items-center justify-center shadow-lg shadow-white/5"
                >
                    <Hexagon size={20} className="text-black fill-black" />
                </motion.div>

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="truncate"
                        >
                            <span className="block text-sm font-bold text-white tracking-tight leading-none">FocusBoard</span>
                            <span className="block text-[10px] text-neutral-500 font-medium mt-0.5">Pro Workspace</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop Sidebar Structure */}
            <div className="hidden sm:block flex-1 overflow-y-auto overflow-x-hidden w-full no-scrollbar">
                <NavSection title="Overview" isCollapsed={isCollapsed}>
                    <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                    <NavItem page="analytics" icon={PieChart} label="Reports" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                    <NavItem page="calendar" icon={Calendar} label="Calendar" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                </NavSection>

                <NavSection title="Management" isCollapsed={isCollapsed}>
                    <NavItem page="tasks" icon={FolderKanban} label="Projects" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                    <NavItem page="categories" icon={Tags} label="Categories" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                    <NavItem page="goals" icon={Target} label="Daily Goals" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                    <NavItem page="support-tickets" icon={Headset} label="Customer Care" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                    <NavItem page="team" icon={Building2} label="Team" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                    <NavItem page="integrations" icon={Blocks} label="Integrations" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                    <NavItem page="squad" icon={Users} label="Live Squad" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                </NavSection>
            </div>

            {/* Desktop Bottom */}
            <div className={`hidden sm:flex flex-col mt-auto pt-4 pb-4 border-t border-white/5 w-full ${isCollapsed ? 'items-center gap-2' : 'gap-1'}`}>
                {showWhatsNew && (
                    <div className={`relative group/whatsnew ${isCollapsed ? 'w-10 flex justify-center' : 'w-full'}`}>
                        <button
                            onClick={() => {
                                localStorage.setItem('focusboard_whatsnew_hidden', 'true');
                                setShowWhatsNew(false);
                                onShowChangelog();
                            }}
                            className={`group flex items-center rounded-xl text-sm font-medium transition-all duration-200 outline-none ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-4 py-2.5'} text-neutral-400 hover:text-white hover:bg-white/5`}
                            title="What's New"
                        >
                            <Sparkles size={20} className="text-yellow-500/80 group-hover:text-yellow-400 transition-colors" />
                            {!isCollapsed && <span className="ml-3">What's New</span>}
                        </button>
                        {!isCollapsed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    localStorage.setItem('focusboard_whatsnew_hidden', 'true');
                                    setShowWhatsNew(false);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-neutral-600 hover:text-white hover:bg-white/10 opacity-0 group-hover/whatsnew:opacity-100 transition-all"
                                title="Dismiss"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                )}
                <NavItem page="help" icon={CircleHelp} label="Help & Support" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
                <NavItem page="settings" icon={SettingsIcon} label="Settings" currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
            </div>

            {/* Mobile Nav (Simplified) */}
            <div className="flex w-full justify-around items-center h-full sm:hidden pb-2">
                <button onClick={() => setCurrentPage('dashboard')} className={`p-2 rounded-lg ${currentPage === 'dashboard' ? 'text-white' : 'text-neutral-500'}`}><LayoutDashboard size={24} /></button>
                <button onClick={() => setCurrentPage('tasks')} className={`p-2 rounded-lg ${currentPage === 'tasks' ? 'text-white' : 'text-neutral-500'}`}><FolderKanban size={24} /></button>
                <button onClick={() => setCurrentPage('team')} className={`p-2 rounded-lg ${currentPage === 'team' ? 'text-white' : 'text-neutral-500'}`}><Building2 size={24} /></button>
                <button onClick={() => setCurrentPage('goals')} className={`p-2 rounded-lg ${currentPage === 'goals' ? 'text-white' : 'text-neutral-500'}`}><Target size={24} /></button>
                <button onClick={() => setCurrentPage('integrations')} className={`p-2 rounded-lg ${currentPage === 'integrations' ? 'text-white' : 'text-neutral-500'}`}><Blocks size={24} /></button>
                <button onClick={() => setCurrentPage('settings')} className={`p-2 rounded-lg ${currentPage === 'settings' ? 'text-white' : 'text-neutral-500'}`}><SettingsIcon size={24} /></button>
            </div>
        </motion.nav>
    );
};

export default Navigation;
