
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Check, ArrowRight, Bell, Shield, Monitor, Clock, Globe, Layers, Plus, X, Lock, Eye, EyeOff } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const totalSteps = 5;

  const nextStep = () => setStep(prev => Math.min(totalSteps, prev + 1));
  
  // State for steps
  const [permissions, setPermissions] = useState({ notifications: false, activity: false, system: false });
  const [schedule, setSchedule] = useState({ timezone: 'UTC-8 (PST)', start: '09:00', end: '17:00' });
  const [projects, setProjects] = useState(['General', 'Learning']);
  const [privacy, setPrivacy] = useState({ localOnly: true, analytics: false, incognito: false });

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Progress Bar (Only show after Welcome) */}
      {step > 0 && step < totalSteps && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-1 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-accent-blue"
                initial={{ width: 0 }}
                animate={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
          </div>
      )}

      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
            {step === 0 && (
                <WelcomeStep key="welcome" onNext={nextStep} />
            )}
            {step === 1 && (
                <PermissionsStep key="permissions" data={permissions} onChange={setPermissions} onNext={nextStep} />
            )}
            {step === 2 && (
                <ScheduleStep key="schedule" data={schedule} onChange={setSchedule} onNext={nextStep} />
            )}
            {step === 3 && (
                <ProjectsStep key="projects" data={projects} onChange={setProjects} onNext={nextStep} />
            )}
            {step === 4 && (
                <PrivacyStep key="privacy" data={privacy} onChange={setPrivacy} onNext={nextStep} />
            )}
            {step === 5 && (
                <CompletionStep key="completion" onComplete={onComplete} />
            )}
        </AnimatePresence>
      </div>
      
      {step > 0 && step < totalSteps && (
          <div className="absolute bottom-8 text-[10px] text-neutral-600 font-mono">
              Step {step} of {totalSteps - 1}
          </div>
      )}
    </div>
  );
};

// --- Step Components ---

const StepLayout = ({ title, subtitle, children, onNext, buttonLabel = "Continue" }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="bg-titanium-surface/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center"
    >
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">{title}</h2>
        <p className="text-neutral-400 mb-10 max-w-md">{subtitle}</p>
        
        <div className="w-full mb-10 text-left">
            {children}
        </div>

        <button 
            onClick={onNext}
            className="group flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-neutral-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
            {buttonLabel} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
    </motion.div>
);

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
        className="flex flex-col items-center text-center"
    >
        <div className="w-20 h-20 bg-gradient-to-br from-white to-neutral-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-white/20 mb-8">
            <Hexagon size={40} className="text-black fill-black" />
        </div>
        
        <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tighter mb-6">
            Welcome to<br/>FocusBoard
        </h1>
        
        <p className="text-lg text-neutral-400 max-w-lg mb-12 leading-relaxed">
            Your new command center for deep work is ready. Let's customize your workspace to match your flow.
        </p>

        <button 
            onClick={onNext}
            className="group flex items-center gap-3 px-10 py-5 bg-accent-blue hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_40px_rgba(47,88,205,0.4)]"
        >
            Start Setup <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
    </motion.div>
);

const PermissionsStep = ({ data, onChange, onNext }: any) => {
    const toggle = (key: string) => onChange({ ...data, [key]: !data[key] });
    
    const PermissionRow = ({ label, desc, icon: Icon, active, onClick }: any) => (
        <div 
            onClick={onClick}
            className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${active ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
        >
            <div className={`p-3 rounded-xl ${active ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1">
                <h3 className={`font-bold text-sm ${active ? 'text-white' : 'text-neutral-300'}`}>{label}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${active ? 'bg-accent-green border-transparent' : 'border-neutral-600'}`}>
                {active && <Check size={14} className="text-white" />}
            </div>
        </div>
    );

    return (
        <StepLayout 
            title="System Access" 
            subtitle="To provide real-time coaching and metrics, FocusBoard needs access to a few system features."
            onNext={onNext}
        >
            <div className="space-y-3">
                <PermissionRow 
                    label="Desktop Notifications" 
                    desc="Get nudges to take breaks and stay on track."
                    icon={Bell}
                    active={data.notifications}
                    onClick={() => toggle('notifications')}
                />
                <PermissionRow 
                    label="Activity Tracking" 
                    desc="Analyze active window usage to calculate focus score. (Local Only)"
                    icon={Monitor}
                    active={data.activity}
                    onClick={() => toggle('activity')}
                />
                <PermissionRow 
                    label="Focus Mode Control" 
                    desc="Automatically enable DND during deep work sessions."
                    icon={Shield}
                    active={data.system}
                    onClick={() => toggle('system')}
                />
            </div>
        </StepLayout>
    );
};

const ScheduleStep = ({ data, onChange, onNext }: any) => {
    return (
        <StepLayout 
            title="Your Rhythm" 
            subtitle="Define your standard work hours to calibrate the focus energy meter."
            onNext={onNext}
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Timezone</label>
                    <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <select 
                            value={data.timezone}
                            onChange={(e) => onChange({...data, timezone: e.target.value})}
                            className="w-full bg-titanium-dark border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white appearance-none focus:outline-none focus:border-accent-blue transition-colors"
                        >
                            <option>UTC-8 (PST) Pacific Time</option>
                            <option>UTC-5 (EST) Eastern Time</option>
                            <option>UTC+0 (GMT) Greenwich Mean Time</option>
                            <option>UTC+1 (CET) Central European Time</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Work Hours</label>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                            <input 
                                type="time" 
                                value={data.start}
                                onChange={(e) => onChange({...data, start: e.target.value})}
                                className="w-full bg-titanium-dark border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-accent-blue transition-colors"
                            />
                        </div>
                        <span className="text-neutral-500 font-medium">to</span>
                        <div className="flex-1 relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                            <input 
                                type="time" 
                                value={data.end}
                                onChange={(e) => onChange({...data, end: e.target.value})}
                                className="w-full bg-titanium-dark border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-accent-blue transition-colors"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-3 items-start">
                    <Monitor size={18} className="text-neutral-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-neutral-400 leading-relaxed">
                        Metrics collected outside these hours will be categorized as "Overtime" or "Personal" automatically.
                    </p>
                </div>
            </div>
        </StepLayout>
    );
};

const ProjectsStep = ({ data, onChange, onNext }: any) => {
    const [input, setInput] = useState('');

    const add = () => {
        if (input.trim() && !data.includes(input.trim())) {
            onChange([...data, input.trim()]);
            setInput('');
        }
    };

    const remove = (tag: string) => {
        onChange(data.filter((t: string) => t !== tag));
    };

    return (
        <StepLayout 
            title="Initial Setup" 
            subtitle="What are the main areas or projects you want to track right now?"
            onNext={onNext}
        >
            <div className="space-y-6">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && add()}
                            placeholder="e.g. Design System, Q3 Marketing"
                            className="w-full bg-titanium-dark border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-accent-blue transition-colors"
                        />
                    </div>
                    <button 
                        onClick={add}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl px-4 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
                    {data.map((tag: string) => (
                        <motion.span 
                            key={tag}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/30 text-blue-300 text-sm font-medium"
                        >
                            {tag}
                            <button onClick={() => remove(tag)} className="hover:text-white"><X size={14} /></button>
                        </motion.span>
                    ))}
                    {data.length === 0 && (
                        <div className="text-neutral-600 text-sm italic w-full text-center py-8">No projects added yet.</div>
                    )}
                </div>
                
                <div className="border-t border-white/5 pt-4">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-3">Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                        {['Coding', 'Writing', 'Meetings', 'Research', 'Admin'].filter(t => !data.includes(t)).map(t => (
                            <button 
                                key={t}
                                onClick={() => onChange([...data, t])}
                                className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs hover:border-white/20 hover:text-white transition-colors"
                            >
                                + {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </StepLayout>
    );
};

const PrivacyStep = ({ data, onChange, onNext }: any) => {
    const toggle = (key: string) => onChange({ ...data, [key]: !data[key] });

    return (
        <StepLayout 
            title="Privacy First" 
            subtitle="We believe your productivity data belongs to you. Configure how your data is handled."
            onNext={onNext}
            buttonLabel="Finish Setup"
        >
            <div className="space-y-4">
                <div 
                    onClick={() => toggle('localOnly')}
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${data.localOnly ? 'bg-green-500/10 border-green-500/30' : 'bg-neutral-900 border-white/5 opacity-50'}`}
                >
                    <div className={`p-2 rounded-lg ${data.localOnly ? 'bg-green-500 text-white' : 'bg-neutral-800 text-neutral-500'}`}>
                        <Lock size={18} />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className={`font-bold text-sm ${data.localOnly ? 'text-green-400' : 'text-neutral-400'}`}>Local-First Storage</h3>
                        <p className="text-xs text-neutral-400 mt-1">Detailed activity logs and screenshots never leave your device. Only aggregated stats are synced.</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${data.localOnly ? 'bg-green-500' : 'bg-neutral-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.localOnly ? 'left-5' : 'left-1'}`} />
                    </div>
                </div>

                <div 
                    onClick={() => toggle('incognito')}
                    className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${data.incognito ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5'}`}
                >
                    <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
                        {data.incognito ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-sm text-white">Incognito Mode</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">Hide specific task names from team leaderboards.</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${data.incognito ? 'bg-accent-blue' : 'bg-neutral-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.incognito ? 'left-5' : 'left-1'}`} />
                    </div>
                </div>
            </div>
        </StepLayout>
    );
};

const CompletionStep = ({ onComplete }: { onComplete: () => void }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center"
    >
        <div className="w-24 h-24 bg-accent-green rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(48,209,88,0.3)] mb-8">
            <Check size={48} className="text-black stroke-[3]" />
        </div>
        
        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            You're All Set!
        </h1>
        
        <p className="text-neutral-400 max-w-md mb-12">
            FocusBoard has been configured to your preferences. 
            Time to enter the flow state.
        </p>

        <button 
            onClick={onComplete}
            className="group flex items-center gap-3 px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-neutral-200 transition-all"
        >
            Enter Dashboard
        </button>
    </motion.div>
);

export default OnboardingFlow;
