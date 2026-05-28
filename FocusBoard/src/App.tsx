
import React, { useState, useEffect } from 'react';
import Dashboard from './components/dashboard/Dashboard';
import AnalyticsView from './components/analytics/AnalyticsView';
import SquadView from './components/squad/SquadView';
import SettingsView from './components/settings/SettingsView';
import TasksView from './components/tasks/TasksView';
import CalendarView from './components/calendar/CalendarView';
import GoalsView from './components/goals/GoalsView';
import CategoriesView from './components/categories/CategoriesView';
import SupportTicketsView from './components/support/SupportTicketsView';
import TeamView from './components/team/TeamView';
import IntegrationsView from './components/integrations/IntegrationsView';
import DrillDownView, { DrillDownType } from './components/dashboard/DrillDownView';
import { HelpCenter, ShortcutsPage, PrivacyPolicy, TermsOfService, SystemStatus } from './components/support/SupportViews';
import ChangelogModal from './components/overlays/ChangelogModal';
import Navigation, { Page } from './components/layout/Navigation';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import { LoginView, SignUpView, ForgotPasswordView, ResetPasswordView, VerifyEmailView, AccountLockView } from './components/auth/AuthViews';
import SetupWizard from './components/SetupWizard';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { postActivity } from './services/activityService';
import { useDashboardStore } from './store/useDashboardStore';
import { useSessionStore } from './store/useSessionStore';
import { AUTH_BASE_URL } from './services/apiBase';
import { UserData } from './services/authApi';

const API_BASE = AUTH_BASE_URL;
const IS_DEV = Boolean((import.meta as any).env?.DEV);
// Default to false for desktop app - preserve auth session across restarts
const FORCE_LOGIN_EVERY_TIME = (import.meta as any).env?.VITE_FORCE_LOGIN === 'true' || false;
const LAST_AUTHED_PAGE_KEY = 'focusboard_last_authed_page';
const ONBOARDING_COMPLETE_KEY = 'focusboard_onboarding_complete';
const TRACKING_ENABLED_KEY = 'focusboard_tracking_enabled';
const IDLE_TIMEOUT_KEY = 'focusboard_tracking_idle_timeout';

const loadTrackingEnabled = () => {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem(TRACKING_ENABLED_KEY);
    if (raw === null) return false;
    return raw === 'true';
};

const loadOnboardingComplete = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
};

const authedPages: Page[] = [
    'dashboard',
    'analytics',
    'squad',
    'tasks',
    'team',
    'integrations',
    'settings',
    'calendar',
    'categories',
    'goals',
    'support-tickets',
    'help',
    'shortcuts',
    'privacy',
    'terms',
    'status',
];

const isAuthedPage = (page: Page | null): page is Page => {
    return Boolean(page && authedPages.includes(page));
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [backendReady, setBackendReady] = useState<boolean | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>(() => {
        if (!loadOnboardingComplete()) return 'onboarding';
        const saved = typeof window !== 'undefined' ? localStorage.getItem('focusboard_current_page') as Page : null;
        return saved || 'login';
    });

    useEffect(() => {
        if (typeof window !== 'undefined' && currentPage !== 'session-details') {
            localStorage.setItem('focusboard_current_page', currentPage);
        }
        if (typeof window !== 'undefined' && isAuthenticated && currentPage !== 'session-details') {
            localStorage.setItem(LAST_AUTHED_PAGE_KEY, currentPage);
        }
    }, [currentPage, isAuthenticated]);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [trackingEnabled, setTrackingEnabled] = useState<boolean>(() => loadTrackingEnabled());
    const [user, setUser] = useState<UserData | null>(null);
    const { initSockets, stopSockets } = useDashboardStore();

    // Generic Detail State
    const [drillDown, setDrillDown] = useState<{ type: DrillDownType, data: any } | null>(null);
    const [previousPage, setPreviousPage] = useState<Page>('dashboard');

    // Auto-login: check localStorage for existing JWT on mount
    useEffect(() => {
        if (FORCE_LOGIN_EVERY_TIME) {
            localStorage.removeItem('focusboard_token');
            localStorage.removeItem(LAST_AUTHED_PAGE_KEY);
            setIsAuthenticated(false);
            setCurrentPage('login');
            setIsAuthLoading(false);
            return;
        }
        const isE2EFlag = typeof window !== 'undefined' && localStorage.getItem('focusboard_e2e') === 'true';

        if (isE2EFlag) {
            const token = localStorage.getItem('focusboard_token');
            if (token) {
                setIsAuthenticated(true);
                setCurrentPage(prev => prev === 'login' ? 'dashboard' : prev);
                setIsAuthLoading(false);
                return;
            }
            localStorage.removeItem('focusboard_e2e');
        }

        const token = localStorage.getItem('focusboard_token');
        if (!token) {
            setIsAuthLoading(false);
            return;
        }

        fetch(`${API_BASE}/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => {
                if (res.ok) {
                    return res.json().then(json => {
                        if (json.data) {
                            setUser(json.data);
                        }
                        setIsAuthenticated(true);
                        const lastAuthed = localStorage.getItem(LAST_AUTHED_PAGE_KEY) as Page | null;
                        setCurrentPage(prev => {
                            if (isAuthedPage(lastAuthed)) return lastAuthed;
                            return prev === 'login' ? 'dashboard' : prev;
                        });
                    });
                } else {
                    localStorage.removeItem('focusboard_token');
                }
            })
            .catch(() => {
                localStorage.removeItem('focusboard_token');
            })
            .finally(() => setIsAuthLoading(false));
    }, []);

    useEffect(() => {
        let mounted = true;
        const checkBackend = async () => {
            try {
                const res = await fetch('http://localhost:5000/health');
                if (!mounted) return;
                setBackendReady(res.ok);
            } catch (_e) {
                if (!mounted) return;
                setBackendReady(false);
            }
        };
        checkBackend();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        const handler = (event: Event) => {
            const custom = event as CustomEvent<{ enabled: boolean }>;
            if (custom?.detail?.enabled === undefined) return;
            setTrackingEnabled(Boolean(custom.detail.enabled));
        };
        if (typeof window === 'undefined') return undefined;
        window.addEventListener('focusboard_tracking_changed', handler as EventListener);
        return () => window.removeEventListener('focusboard_tracking_changed', handler as EventListener);
    }, []);

    useEffect(() => {
        const handler = (event: Event) => {
            const custom = event as CustomEvent<{ minutes: number }>;
            if (!custom?.detail?.minutes) return;
            const seconds = Math.max(30, Math.floor(custom.detail.minutes * 60));
            invoke('set_idle_threshold', { seconds }).catch(() => {
                if (IS_DEV) {
                    // eslint-disable-next-line no-console
                    console.warn('Failed to update idle threshold in native monitor.');
                }
            });
        };
        if (typeof window === 'undefined') return undefined;
        window.addEventListener('focusboard_idle_timeout_changed', handler as EventListener);
        return () => window.removeEventListener('focusboard_idle_timeout_changed', handler as EventListener);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(TRACKING_ENABLED_KEY, String(trackingEnabled));
        const isTauri = '__TAURI_INTERNALS__' in window;
        if (!isTauri) return;
        invoke('set_tracking_enabled', { enabled: trackingEnabled }).catch(() => {
            if (IS_DEV) {
                // eslint-disable-next-line no-console
                console.warn('Failed to update tracking state in native monitor.');
            }
        });
    }, [trackingEnabled]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = Number(localStorage.getItem(IDLE_TIMEOUT_KEY));
        const minutes = Number.isFinite(stored) && stored > 0 ? stored : 5;
        const seconds = Math.max(30, Math.floor(minutes * 60));
        const isTauri = '__TAURI_INTERNALS__' in window;
        if (!isTauri) return;
        invoke('set_idle_threshold', { seconds }).catch(() => {
            if (IS_DEV) {
                // eslint-disable-next-line no-console
                console.warn('Failed to initialize idle threshold in native monitor.');
            }
        });
    }, []);

    // Listen for activity updates from Rust monitor
    useEffect(() => {
        if (!isAuthenticated || !trackingEnabled) return;

        let unlisten: Promise<() => void> | null = null;

        // Guard: Only attempt to listen if running inside the Tauri window
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            try {
                unlisten = listen('activity-update', (event: any) => {
                    const payload = event.payload;
                    if (!trackingEnabled) return;
                    const current = useSessionStore.getState().currentActivity;
                    const sameActivity =
                        current &&
                        current.app_name === payload.app_name &&
                        current.window_title === payload.window_title &&
                        current.idle_time === payload.idle_time;

                    if (!sameActivity) {
                        useSessionStore.getState().setCurrentActivity(payload);
                    }

                    postActivity(payload);
                });
            } catch (error) {
                if (IS_DEV) {
                    // eslint-disable-next-line no-console
                    console.warn("Tauri event listener failed to attach.");
                }
            }
        } else {
            if (IS_DEV) {
                // eslint-disable-next-line no-console
                console.warn("Tauri API not available (running in browser mode). Activity tracking disabled.");
            }
        }

        return () => {
            if (unlisten) {
                unlisten
                    .then(fn => fn && fn())
                    .catch(() => {
                        if (IS_DEV) {
                            // eslint-disable-next-line no-console
                            console.warn('Failed to detach Tauri activity listener.');
                        }
                    });
            }
        };
    }, [isAuthenticated, trackingEnabled]);

    // Respect system zoom settings in production builds.

    // Browser-mode activity poller: tracks tab title changes when NOT inside Tauri
    useEffect(() => {
        if (!isAuthenticated || !trackingEnabled) return;
        const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
        if (isTauri) return; // Tauri mode uses the native monitor instead

        let lastTitle = '';
        const poll = () => {
            const title = document.title || 'Untitled';
            const hasFocus = document.hasFocus();
            const appName = hasFocus ? 'Browser' : 'Browser (Background)';
            const signature = `${appName}::${title}`;

            if (signature !== lastTitle) {
                lastTitle = signature;
                useSessionStore.getState().setCurrentActivity({
                    app_name: appName,
                    window_title: title,
                    idle_time: hasFocus ? 0 : 999,
                    timestamp: new Date().toISOString(),
                });
            }
        };

        poll(); // fire once immediately
        const interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, [isAuthenticated, trackingEnabled]);

    useEffect(() => {
        if (isAuthenticated) {
            initSockets();
            return () => {
                stopSockets();
            };
        }
        stopSockets();
    }, [isAuthenticated, initSockets, stopSockets]);

    const handleNavigateDetail = (type: DrillDownType, data: any) => {
        setPreviousPage(currentPage);
        setDrillDown({ type, data });
        setCurrentPage('session-details'); // Reusing route key for "detail view"
    };

    const handleBackToDashboard = () => {
        setDrillDown(null);
        setCurrentPage(previousPage);
    };

    const handleLogin = (token: string) => {
        localStorage.setItem('focusboard_token', token);
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        }
        fetch(`${API_BASE}/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(json => {
                if (json.data) setUser(json.data);
            })
            .catch(() => {});
        const lastAuthed = localStorage.getItem(LAST_AUTHED_PAGE_KEY) as Page | null;
        setCurrentPage(isAuthedPage(lastAuthed) ? lastAuthed : 'dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('focusboard_token');
        localStorage.removeItem(LAST_AUTHED_PAGE_KEY);
        setIsAuthenticated(false);
        setUser(null);
        setCurrentPage('login');
    };

    // --- Loading screen while checking auth token ---
    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (backendReady === false) {
        return (
            <SetupWizard
                onReady={() => setBackendReady(true)}
                onSkip={() => setBackendReady(true)}
            />
        );
    }

    // --- Auth / Public / Onboarding Routes Layout ---
    if (currentPage === 'onboarding') {
        return (
            <OnboardingFlow
                onComplete={(prefs) => {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
                        if (typeof prefs?.trackingEnabled === 'boolean') {
                            localStorage.setItem(TRACKING_ENABLED_KEY, String(prefs.trackingEnabled));
                            window.dispatchEvent(new CustomEvent('focusboard_tracking_changed', { detail: { enabled: prefs.trackingEnabled } }));
                        }
                        if (prefs?.schedule) {
                            localStorage.setItem('focusboard_schedule', JSON.stringify(prefs.schedule));
                        }
                        if (prefs?.projects) {
                            localStorage.setItem('focusboard_onboarding_projects', JSON.stringify(prefs.projects));
                        }
                        if (prefs?.privacy) {
                            localStorage.setItem('focusboard_privacy', JSON.stringify(prefs.privacy));
                        }
                    }
                    setCurrentPage(isAuthenticated ? 'dashboard' : 'login');
                }}
            />
        );
    }

    if (!isAuthenticated) {
        switch (currentPage) {
            case 'signup': return <SignUpView onNavigate={setCurrentPage} />;
            case 'verify-email': return <VerifyEmailView onNavigate={setCurrentPage} />;
            case 'forgot-password': return <ForgotPasswordView onNavigate={setCurrentPage} />;
            case 'reset-password': return <ResetPasswordView onNavigate={setCurrentPage} />;
            case 'locked': return <AccountLockView onNavigate={setCurrentPage} />;
            case 'login':
            default:
                return <LoginView onNavigate={setCurrentPage} onLogin={handleLogin} />;
        }
    }

    // --- Main App Layout ---
    return (
        <div className="antialiased text-slate-500 dark:text-slate-400 bg-black min-h-screen font-sans selection:bg-accent-blue selection:text-white flex flex-col sm:flex-row overflow-hidden">

            {currentPage !== 'session-details' && (
                <Navigation
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                    onShowChangelog={() => setIsChangelogOpen(true)}
                />
            )}

            {/* Main Content Area */}
            <main className={`flex-1 h-screen overflow-y-auto overflow-x-hidden relative bg-black ${currentPage !== 'session-details' ? 'pb-24 sm:pb-0' : ''} scroll-smooth`}>
                {currentPage === 'dashboard' && (
                    <Dashboard onNavigate={handleNavigateDetail} onPageChange={setCurrentPage} user={user} />
                )}
                {currentPage === 'analytics' && (
                    <AnalyticsView />
                )}
                {currentPage === 'tasks' && (
                    <TasksView onNavigate={handleNavigateDetail} />
                )}
                {currentPage === 'categories' && (
                    <CategoriesView />
                )}
                {currentPage === 'team' && <TeamView />}
                {currentPage === 'goals' && (
                    <GoalsView />
                )}
                {currentPage === 'integrations' && <IntegrationsView />}
                {currentPage === 'calendar' && <CalendarView />}
                {currentPage === 'squad' && (
                    <SquadView />
                )}
                {currentPage === 'settings' && <SettingsView onLogout={handleLogout} onNavigate={setCurrentPage} />}
                {currentPage === 'support-tickets' && <SupportTicketsView />}

                {/* Support Pages */}
                {currentPage === 'help' && <HelpCenter onNavigate={setCurrentPage} />}
                {currentPage === 'shortcuts' && <ShortcutsPage />}
                {currentPage === 'privacy' && <PrivacyPolicy />}
                {currentPage === 'terms' && <TermsOfService />}
                {currentPage === 'status' && <SystemStatus />}

                {currentPage === 'session-details' && drillDown && (
                    <DrillDownView
                        viewType={drillDown.type}
                        data={drillDown.data}
                        onBack={handleBackToDashboard}
                    />
                )}
            </main>

            <ChangelogModal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />

        </div>
    );
};

export default App;
