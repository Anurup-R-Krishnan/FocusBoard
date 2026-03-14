
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Bell, Shield, LogOut,
    CreditCard, Calendar, Mail, Database,
    Trash2, Eye, EyeOff, Clock, Check, X,
    Monitor, Palette, Moon, Sun, Smartphone,
    Target, Ban, List, Globe, Laptop, AlertTriangle, ChevronRight, Edit2,
    CircleHelp, FileText, Lock, PanelLeft
} from 'lucide-react';
import { Page } from '../layout/Navigation';
import { API_BASE_URL } from '../../services/apiBase';
import { getToken } from '../../services/authApi';

// --- Types ---

type SettingsTab = 'ACCOUNT' | 'TRACKING' | 'APPEARANCE' | 'NOTIFICATIONS' | 'DATA';

interface SettingsViewProps {
    onLogout: () => void;
    onNavigate?: (page: Page) => void;
}

const loadStoredBoolean = (key: string, fallback: boolean) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
};

const loadStoredString = (key: string, fallback: string) => {
    const raw = localStorage.getItem(key);
    return raw ?? fallback;
};

// --- Shared Components ---

const Toggle = ({ value, onChange }: { value: boolean, onChange: (val: boolean) => void }) => (
    <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-accent-blue ${value ? 'bg-accent-blue' : 'bg-neutral-700'}`}
    >
        <motion.div
            layout
            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md ${value ? 'left-6' : 'left-1'}`}
        />
    </button>
);

const SectionHeader = ({ title, description }: { title: string, description?: string }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
    </div>
);

const SettingRow = ({ label, description, children, danger = false }: { label: string, description?: string, children: React.ReactNode, danger?: boolean }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
        <div className="pr-4">
            <h3 className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</h3>
            {description && <p className="text-xs text-neutral-500 mt-0.5 max-w-sm">{description}</p>}
        </div>
        <div>{children}</div>
    </div>
);

// --- Sub-Views ---

const AccountSettings = ({ onNavigate }: { onNavigate?: (p: Page) => void }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userProfile, setUserProfile] = useState<{ name: string, email: string, age?: number, parentEmail?: string, nsfwAlertPreference?: string } | null>(null);
    const [isSavingParental, setIsSavingParental] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() => loadStoredBoolean('focusboard_two_factor_enabled', true));

    useEffect(() => {
        localStorage.setItem('focusboard_two_factor_enabled', String(twoFactorEnabled));
    }, [twoFactorEnabled]);

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setUserProfile({
                        name: data.data.name,
                        email: data.data.email_id,
                        age: data.data.age,
                        parentEmail: data.data.parentEmail,
                        nsfwAlertPreference: data.data.nsfwAlertPreference || 'none'
                    });
                }
            })
            .catch((error) => {
                console.error(error);
                setProfileError('Failed to load profile settings.');
            });
    }, []);

    const handleDeleteAccount = () => {
        alert("Account deletion is not supported in the backend yet.");
        setShowDeleteConfirm(false);
    };

    const handleSaveParentalControls = async () => {
        const token = getToken();
        if (!token || !userProfile) return;
        setIsSavingParental(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/parental-controls`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    age: userProfile.age ? parseInt(userProfile.age.toString()) : undefined,
                    parentEmail: userProfile.parentEmail,
                    nsfwAlertPreference: userProfile.nsfwAlertPreference
                })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'Error updating controls');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to update parental controls.');
        } finally {
            setIsSavingParental(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Profile Card */}
            <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                        {userProfile ? (userProfile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()) : '??'}
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-accent-blue rounded-full text-white border-2 border-[#151515] hover:bg-blue-500 transition-colors">
                        <Edit2 size={12} />
                    </button>
                </div>
                <div className="flex-1 text-center sm:text-left">
                    {userProfile ? (
                        <>
                            <h3 className="text-lg font-bold text-white">{userProfile.name}</h3>
                            <p className="text-sm text-neutral-500">{userProfile.email}</p>
                        </>
                    ) : (
                        <>
                            <div className="h-6 w-32 bg-neutral-800 rounded animate-pulse mb-2"></div>
                            <div className="h-4 w-48 bg-neutral-800 rounded animate-pulse"></div>
                        </>
                    )}
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            Pro Plan
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                            Member since 2023
                        </span>
                    </div>
                </div>
                <button className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                    Manage Subscription
                </button>
            </div>

            {profileError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-300">
                    {profileError}
                </div>
            )}

            <div>
                <SectionHeader title="Profile & Email" description="Update your personal details and contact info." />
                <div className="space-y-4 max-w-lg">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase">First Name</label>
                            <input
                                type="text"
                                value={userProfile?.name?.split(' ')[0] || ''}
                                onChange={(e) => setUserProfile(prev => {
                                    if (!prev) return prev;
                                    const last = prev.name.split(' ').slice(1).join(' ').trim();
                                    const nextName = [e.target.value.trim(), last].filter(Boolean).join(' ');
                                    return { ...prev, name: nextName };
                                })}
                                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase">Last Name</label>
                            <input
                                type="text"
                                value={userProfile?.name?.split(' ').slice(1).join(' ') || ''}
                                onChange={(e) => setUserProfile(prev => {
                                    if (!prev) return prev;
                                    const first = prev.name.split(' ')[0] || '';
                                    const nextName = [first.trim(), e.target.value.trim()].filter(Boolean).join(' ');
                                    return { ...prev, name: nextName };
                                })}
                                className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Email Address</label>
                        <input
                            type="email"
                            value={userProfile?.email || ''}
                            onChange={(e) => setUserProfile(prev => prev ? { ...prev, email: e.target.value } : prev)}
                            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div>
                <SectionHeader title="Password & Security" description="Manage your login credentials and security layers." />
                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6">
                    <SettingRow label="Password" description="Last changed 3 months ago.">
                        <button
                            onClick={() => onNavigate && onNavigate('forgot-password')}
                            className="text-xs font-bold text-white bg-neutral-800 px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
                        >
                            Reset Password
                        </button>
                    </SettingRow>
                    <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security to your account.">
                        <Toggle value={twoFactorEnabled} onChange={setTwoFactorEnabled} />
                    </SettingRow>
                    <SettingRow label="Active Sessions" description="Manage devices currently logged in.">
                        <button className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1">
                            View all <ChevronRight size={12} />
                        </button>
                    </SettingRow>
                </div>
            </div>

            <div>
                <SectionHeader title="Parental Controls" description="Configure age and content filtering alerts." />
                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase">Age</label>
                            <input type="number" value={userProfile?.age || ''} onChange={(e) => setUserProfile(prev => prev ? { ...prev, age: parseInt(e.target.value) || undefined } : null)} className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none transition-colors" placeholder="e.g. 15" />
                            <p className="text-[10px] text-neutral-500">Users under 16 have NSFW detection enabled implicitly.</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase">Parent Email (Required &lt; 16)</label>
                            <input type="email" value={userProfile?.parentEmail || ''} onChange={(e) => setUserProfile(prev => prev ? { ...prev, parentEmail: e.target.value } : null)} className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none transition-colors" placeholder="parent@email.com" />
                        </div>
                        <div className="space-y-1.5 col-span-1 md:col-span-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase">NSFW Alert Preferences</label>
                            <select value={userProfile?.nsfwAlertPreference || 'none'} onChange={(e) => setUserProfile(prev => prev ? { ...prev, nsfwAlertPreference: e.target.value } : null)} className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent-blue focus:outline-none cursor-pointer">
                                <option value="none">None</option>
                                <option value="email">Email Alerts to Parent</option>
                                <option value="in_app">In-App Notifications</option>
                                <option value="both">Both Email and In-App</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={handleSaveParentalControls} disabled={isSavingParental} className="px-4 py-2 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50">
                            {isSavingParental ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5">
                <SectionHeader title="Support & Legal" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <button onClick={() => onNavigate && onNavigate('help')} className="p-4 bg-titanium-dark border border-white/10 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors group text-left">
                        <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400 group-hover:text-white transition-colors">
                            <CircleHelp size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Help Center</div>
                            <div className="text-xs text-neutral-500">Guides and FAQ</div>
                        </div>
                    </button>
                    <button onClick={() => onNavigate && onNavigate('privacy')} className="p-4 bg-titanium-dark border border-white/10 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors group text-left">
                        <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400 group-hover:text-white transition-colors">
                            <Lock size={20} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Privacy Policy</div>
                            <div className="text-xs text-neutral-500">Data handling</div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5">
                <h3 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} /> Danger Zone
                </h3>
                <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <div>
                        <span className="text-sm font-bold text-red-200">Delete Account</span>
                        <p className="text-xs text-red-200/60 mt-0.5">Permanently remove all data and access. This cannot be undone.</p>
                    </div>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowDeleteConfirm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-titanium-surface border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <h3 className="text-lg font-bold text-white mb-2">Delete Account?</h3>
                            <p className="text-sm text-neutral-400 mb-6">
                                Are you sure you want to delete your account? All your data, including tasks, history, and metrics will be permanently lost.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TrackingSettings = () => {
    const [idleTimeout, setIdleTimeout] = useState<number>(() => {
        const parsed = Number(localStorage.getItem('focusboard_tracking_idle_timeout'));
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
    });
    const [autoResume, setAutoResume] = useState<boolean>(() => loadStoredBoolean('focusboard_tracking_auto_resume', true));
    const [strictMode, setStrictMode] = useState<boolean>(() => loadStoredBoolean('focusboard_tracking_strict_mode', false));
    const [excludedApps, setExcludedApps] = useState([
        { name: 'Spotify', icon: '🎵' },
        { name: 'Slack', icon: '#️⃣' },
        { name: 'Finder', icon: '📂' }
    ]);
    const [newApp, setNewApp] = useState('');

    useEffect(() => {
        localStorage.setItem('focusboard_tracking_idle_timeout', String(idleTimeout));
    }, [idleTimeout]);

    useEffect(() => {
        localStorage.setItem('focusboard_tracking_auto_resume', String(autoResume));
    }, [autoResume]);

    useEffect(() => {
        localStorage.setItem('focusboard_tracking_strict_mode', String(strictMode));
    }, [strictMode]);

    useEffect(() => {
        const raw = localStorage.getItem('focusboard_tracking_excluded_apps');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                setExcludedApps(parsed);
            }
        } catch (_error) {
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('focusboard_tracking_excluded_apps', JSON.stringify(excludedApps));
    }, [excludedApps]);

    const addApp = (e: React.FormEvent) => {
        e.preventDefault();
        if (newApp && !excludedApps.some(a => a.name === newApp)) {
            setExcludedApps([...excludedApps, { name: newApp, icon: '📱' }]);
            setNewApp('');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <SectionHeader title="Focus Detection" description="Configure how FocusBoard detects your flow state." />

                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-6">
                    <div>
                        <div className="flex justify-between mb-4">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                <Clock size={16} className="text-accent-blue" /> Idle Timeout
                            </label>
                            <span className="text-sm font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-white">{idleTimeout} min</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="60"
                            value={idleTimeout}
                            onChange={(e) => setIdleTimeout(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                        />
                        <p className="text-xs text-neutral-500 mt-3 flex justify-between">
                            <span>1 min</span>
                            <span>Automatic pause trigger</span>
                            <span>60 min</span>
                        </p>
                    </div>

                    <SettingRow label="Auto-Resume" description="Resume session when you return to your computer.">
                        <Toggle value={autoResume} onChange={setAutoResume} />
                    </SettingRow>

                    <SettingRow label="Strict Mode" description="Block all distracting websites during Focus sessions.">
                        <Toggle value={strictMode} onChange={setStrictMode} />
                    </SettingRow>
                </div>
            </div>

            <div>
                <SectionHeader title="Excluded Applications" description="Activity in these apps will not negatively impact your focus score." />

                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6">
                    <form onSubmit={addApp} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Add app name (e.g. Music)"
                            value={newApp}
                            onChange={(e) => setNewApp(e.target.value)}
                            className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent-blue focus:outline-none transition-colors"
                        />
                        <button type="submit" className="px-4 py-2.5 bg-white text-black font-bold rounded-lg text-sm hover:bg-neutral-200 transition-colors">
                            Add
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        {excludedApps.map(app => (
                            <span key={app.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 rounded-lg text-sm font-medium text-white border border-white/5 group hover:border-white/20 transition-all">
                                <span className="opacity-70">{app.icon}</span>
                                {app.name}
                                <button onClick={() => setExcludedApps(excludedApps.filter(a => a.name !== app.name))} className="ml-1 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationSettings = () => {
    const [desktopNotifications, setDesktopNotifications] = useState<boolean>(() => loadStoredBoolean('focusboard_notif_desktop', true));
    const [soundEffects, setSoundEffects] = useState<boolean>(() => loadStoredBoolean('focusboard_notif_sounds', false));
    const [breakReminders, setBreakReminders] = useState<boolean>(() => loadStoredBoolean('focusboard_notif_breaks', true));
    const [emailSummaries, setEmailSummaries] = useState<boolean>(() => loadStoredBoolean('focusboard_notif_email_summaries', true));
    const [marketingEmails, setMarketingEmails] = useState<boolean>(() => loadStoredBoolean('focusboard_notif_marketing', false));

    useEffect(() => {
        localStorage.setItem('focusboard_notif_desktop', String(desktopNotifications));
    }, [desktopNotifications]);

    useEffect(() => {
        localStorage.setItem('focusboard_notif_sounds', String(soundEffects));
    }, [soundEffects]);

    useEffect(() => {
        localStorage.setItem('focusboard_notif_breaks', String(breakReminders));
    }, [breakReminders]);

    useEffect(() => {
        localStorage.setItem('focusboard_notif_email_summaries', String(emailSummaries));
    }, [emailSummaries]);

    useEffect(() => {
        localStorage.setItem('focusboard_notif_marketing', String(marketingEmails));
    }, [marketingEmails]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionHeader title="Notifications" description="Manage your alerts and communications." />
            <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6">
                <SettingRow label="Desktop Notifications" description="Popups for session starts, breaks, and nudges.">
                    <Toggle value={desktopNotifications} onChange={setDesktopNotifications} />
                </SettingRow>
                <SettingRow label="Sound Effects" description="Play sounds for timer completion and interactions.">
                    <Toggle value={soundEffects} onChange={setSoundEffects} />
                </SettingRow>
                <SettingRow label="Break Reminders" description="Get notified when it's time to rest your eyes.">
                    <Toggle value={breakReminders} onChange={setBreakReminders} />
                </SettingRow>
                <SettingRow label="Email Summaries" description="Receive a weekly report of your productivity.">
                    <Toggle value={emailSummaries} onChange={setEmailSummaries} />
                </SettingRow>
                <SettingRow label="Marketing Emails" description="Receive product updates and tips.">
                    <Toggle value={marketingEmails} onChange={setMarketingEmails} />
                </SettingRow>
            </div>
        </div>
    );
};

const AppearanceSettings = () => {
    const [theme, setTheme] = useState(() => loadStoredString('focusboard_theme', 'dark'));

    // Simple effect to simulate theme toggle (would attach to context in real app)
    useEffect(() => {
        document.documentElement.className = theme;
        // Also force dark background on body for full effect if needed
        document.body.style.backgroundColor = theme === 'light' ? '#f5f5f5' : '#000000';
        localStorage.setItem('focusboard_theme', theme);
    }, [theme]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <SectionHeader title="Theme" description="Choose your preferred interface style." />
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'light', icon: Sun, label: 'Light' },
                        { id: 'dark', icon: Moon, label: 'Dark' },
                        { id: 'system', icon: Monitor, label: 'System' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${theme === t.id ? 'bg-accent-blue/10 border-accent-blue shadow-lg shadow-blue-900/20' : 'bg-titanium-dark border-white/10 hover:bg-white/5'}`}
                        >
                            <div className="w-full aspect-video bg-neutral-900 rounded-lg border border-white/10 relative overflow-hidden flex items-center justify-center">
                                {t.id === 'light' && <div className="absolute inset-0 bg-neutral-200" />}
                                {t.id === 'system' && <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-900" />}
                                <t.icon size={24} className={`relative z-10 ${t.id === 'light' ? 'text-black' : 'text-white'}`} />
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${theme === t.id ? 'text-accent-blue' : 'text-neutral-400'}`}>
                                {t.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <SectionHeader title="Regional" />
                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Language</label>
                        <div className="relative">
                            <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <select className="w-full bg-neutral-900 border border-white/10 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:border-accent-blue focus:outline-none appearance-none cursor-pointer">
                                <option>English (US)</option>
                                <option>English (UK)</option>
                                <option>Spanish</option>
                                <option>French</option>
                                <option>Japanese</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Time Format</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input type="radio" name="timefmt" className="peer appearance-none w-5 h-5 border border-neutral-600 rounded-full checked:border-accent-blue checked:bg-accent-blue" defaultChecked />
                                    <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform" />
                                </div>
                                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">12-hour (9:00 PM)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input type="radio" name="timefmt" className="peer appearance-none w-5 h-5 border border-neutral-600 rounded-full checked:border-accent-blue checked:bg-accent-blue" />
                                    <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform" />
                                </div>
                                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">24-hour (21:00)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DataSettings = () => {
    const [incognitoMode, setIncognitoMode] = useState<boolean>(() => loadStoredBoolean('focusboard_data_incognito', false));
    const [localOnly, setLocalOnly] = useState<boolean>(() => loadStoredBoolean('focusboard_data_local_only', true));
    const [excludeFinancialApps, setExcludeFinancialApps] = useState<boolean>(() => loadStoredBoolean('focusboard_data_exclude_financial', true));
    const [retention, setRetention] = useState(() => loadStoredString('focusboard_data_retention', 'Never'));

    useEffect(() => {
        localStorage.setItem('focusboard_data_incognito', String(incognitoMode));
    }, [incognitoMode]);

    useEffect(() => {
        localStorage.setItem('focusboard_data_local_only', String(localOnly));
    }, [localOnly]);

    useEffect(() => {
        localStorage.setItem('focusboard_data_exclude_financial', String(excludeFinancialApps));
    }, [excludeFinancialApps]);

    useEffect(() => {
        localStorage.setItem('focusboard_data_retention', retention);
    }, [retention]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <SectionHeader title="Privacy" description="Manage how your data is collected and shared." />
                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6">
                    <SettingRow label="Incognito Mode" description="Hide your activity from team leaderboards.">
                        <Toggle value={incognitoMode} onChange={setIncognitoMode} />
                    </SettingRow>
                    <SettingRow label="Local Storage Only" description="Do not sync detailed session logs to the cloud.">
                        <Toggle value={localOnly} onChange={setLocalOnly} />
                    </SettingRow>
                    <SettingRow label="Exclude Financial Apps" description="Automatically block tracking for banking applications.">
                        <Toggle value={excludeFinancialApps} onChange={setExcludeFinancialApps} />
                    </SettingRow>
                </div>
            </div>

            <div>
                <SectionHeader title="Data Retention" />
                <div className="bg-titanium-dark border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Auto-Delete Data</label>
                        <select
                            value={retention}
                            onChange={(e) => setRetention(e.target.value)}
                            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-blue focus:outline-none appearance-none cursor-pointer"
                        >
                            <option>Never</option>
                            <option>After 1 Year</option>
                            <option>After 6 Months</option>
                            <option>After 30 Days</option>
                        </select>
                        <p className="text-xs text-neutral-600 mt-1">
                            Aggregated stats will be kept indefinitely unless you delete your account.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button className="flex items-center gap-2 text-sm font-bold text-white hover:text-accent-blue transition-colors group">
                            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                                <Database size={16} />
                            </div>
                            Download all my data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Settings Layout ---

const SettingsView: React.FC<SettingsViewProps> = ({ onLogout, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('ACCOUNT');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

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
        { id: 'ACCOUNT', label: 'Account', icon: User },
        { id: 'TRACKING', label: 'Tracking', icon: Target },
        { id: 'APPEARANCE', label: 'Appearance', icon: Palette },
        { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
        { id: 'DATA', label: 'Data & Privacy', icon: Shield },
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
                            <SidebarContent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} onLogout={onLogout} />
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
                            <SidebarContent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} onLogout={onLogout} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-[#050505] scroll-smooth relative">
                <div className="p-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10 border-b border-white/5 flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-white/10"
                    >
                        <PanelLeft size={20} />
                    </button>
                    <span className="font-bold text-white">Settings</span>
                </div>

                <div className="max-w-3xl mx-auto p-6 md:p-12 pb-32">
                    <AnimatePresence mode="wait">
                        {activeTab === 'ACCOUNT' && <AccountSettings key="account" onNavigate={onNavigate} />}
                        {activeTab === 'TRACKING' && <TrackingSettings key="tracking" />}
                        {activeTab === 'APPEARANCE' && <AppearanceSettings key="appearance" />}
                        {activeTab === 'NOTIFICATIONS' && <NotificationSettings key="notifications" />}
                        {activeTab === 'DATA' && <DataSettings key="data" />}
                    </AnimatePresence>

                    {/* Mobile Logout */}
                    <div className="mt-12 md:hidden">
                        <button
                            onClick={onLogout}
                            className="w-full py-4 rounded-xl bg-red-500/10 text-red-400 font-bold border border-red-500/20"
                        >
                            Sign Out
                        </button>
                        <div className="text-[10px] text-neutral-600 text-center mt-4 font-mono">v1.2.0 • Build 592</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SidebarContent = ({ tabs, activeTab, setActiveTab, setSidebarOpen, onLogout }: any) => (
    <div className="h-full flex flex-col bg-titanium-dark border-r border-white/10">
        <div className="p-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-neutral-400 hover:text-white"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 pb-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            {tabs.map((tab: any) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as SettingsTab); if (window.innerWidth < 768) setSidebarOpen(false); }}
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

        <div className="p-4 border-t border-white/5 hidden md:block">
            <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
            >
                <LogOut size={18} />
                Sign Out
            </button>
            <div className="text-[10px] text-neutral-600 text-center mt-4 font-mono">v1.2.0 • Build 592</div>
        </div>
    </div>
);

export default SettingsView;
