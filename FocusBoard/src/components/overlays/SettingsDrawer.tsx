import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Clock, Volume2, Shield, Moon, Monitor, Layout, Coffee } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToggleState {
    breakReminders: boolean;
    soundEffects: boolean;
    blockNotifications: boolean;
    darkMode: boolean;
    compactMode: boolean;
    demoOverlay: boolean;
}

const defaultToggles: ToggleState = {
    breakReminders: true,
    soundEffects: false,
    blockNotifications: true,
    darkMode: true,
    compactMode: false,
    demoOverlay: true,
};

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
    const [toggles, setToggles] = useState<ToggleState>(defaultToggles);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('focusboard_settings');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            setToggles({ ...defaultToggles, ...parsed });
        } catch (_error) {
            setToggles(defaultToggles);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('focusboard_settings', JSON.stringify(toggles));
    }, [toggles]);

    const toggleSetting = (key: keyof ToggleState) => {
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const SettingRow = ({ icon: Icon, label, value, type = 'toggle', onClick }: any) => (
        <div
            className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0 group cursor-pointer hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors"
            onClick={onClick}
        >
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400 group-hover:text-white transition-colors">
                <Icon size={16} />
            </div>
            <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">{label}</span>
        </div>
        {type === 'toggle' ? (
             <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${value ? 'bg-accent-green' : 'bg-neutral-700'}`}>
                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm duration-300 ${value ? 'left-5' : 'left-1'}`} />
             </div>
        ) : (
            <span className="text-sm text-neutral-500 font-mono bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 group-hover:border-neutral-600 transition-colors">{value}</span>
        )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            
            {/* Drawer */}
            <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 35, stiffness: 350 }}
                className="fixed top-2 left-2 bottom-2 w-80 bg-titanium-surface border border-white/10 rounded-2xl z-[70] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-titanium-dark/50">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-white">Preferences</h2>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">Customize Your Flow</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white border border-transparent hover:border-neutral-700">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent-blue mb-3">Focus Session</h3>
                        <div className="space-y-1">
                            <SettingRow icon={Clock} label="Focus Duration" value="50 min" type="value" />
                            <SettingRow icon={Coffee} label="Short Break" value="10 min" type="value" />
                            <SettingRow icon={Coffee} label="Long Break" value="30 min" type="value" />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent-orange mb-3">Notifications</h3>
                        <div className="space-y-1">
                            <SettingRow icon={Bell} label="Break Reminders" value={toggles.breakReminders} onClick={() => toggleSetting('breakReminders')} />
                            <SettingRow icon={Volume2} label="Sound Effects" value={toggles.soundEffects} onClick={() => toggleSetting('soundEffects')} />
                            <SettingRow icon={Shield} label="Block Notifications" value={toggles.blockNotifications} onClick={() => toggleSetting('blockNotifications')} />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent-purple mb-3">Interface</h3>
                        <div className="space-y-1">
                            <SettingRow icon={Moon} label="Dark Mode" value={toggles.darkMode} onClick={() => toggleSetting('darkMode')} />
                            <SettingRow icon={Layout} label="Compact Mode" value={toggles.compactMode} onClick={() => toggleSetting('compactMode')} />
                            <SettingRow icon={Monitor} label="Demo Overlay" value={toggles.demoOverlay} onClick={() => toggleSetting('demoOverlay')} />
                        </div>
                    </section>
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-titanium-dark border-t border-white/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                        <span className="text-[10px] text-neutral-400 font-medium">System Online</span>
                    </div>
                    <p className="text-[10px] text-neutral-600 text-center font-mono">FocusBoard v1.0.2 • Build 340</p>
                </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsDrawer;