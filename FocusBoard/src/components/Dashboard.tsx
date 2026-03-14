import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useFocusSimulation } from '../mockState';
import FocusGauge from './FocusGauge';
import TimelineScrubber from './TimelineScrubber';
import MetricCard from './MetricCard';
import SquadWidget from './SquadWidget';
import TrendAnalysisChart from './TrendChart';
import TagModal from './TagModal';
import BreakToast from './BreakToast';
import ControlsPanel from './ControlsPanel';
import SettingsDrawer from './SettingsDrawer';
import ShortcutHUD from './ShortcutHUD';
import { Menu, Activity, ChevronRight, Star, Clock } from 'lucide-react';
import { SessionState } from '../types';

type MetricType = 'score' | 'deepWork' | 'contextSwitches';

const Dashboard: React.FC = () => {
  const { state, controls } = useFocusSimulation();
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showBreakToast, setShowBreakToast] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('score');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when typing in inputs (if any)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'f' || e.key === 'F') controls.startFocus();
      if (e.key === 'b' || e.key === 'B') controls.takeBreak();
      if (e.key === 'd' || e.key === 'D') controls.addDistraction();
      if (e.key === ' ') {
         e.preventDefault(); 
         controls.togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controls]);

  // Simulate break toast trigger
  useEffect(() => {
    if (state.metrics.deepWorkMinutes > 0 && state.metrics.deepWorkMinutes % 50 === 0 && state.sessionState === 'FOCUS') {
        setShowBreakToast(true);
    }
  }, [state.metrics.deepWorkMinutes, state.sessionState]);

  const handleTagRequest = (id: string) => {
    setSelectedSegmentId(id);
    setIsTagModalOpen(true);
  };

  const getStatusColor = (status: SessionState) => {
      switch (status) {
          case 'FOCUS': return 'bg-accent-green text-black border-accent-green';
          case 'BREAK': return 'bg-accent-purple text-white border-accent-purple';
          case 'DISTRACTED': return 'bg-accent-orange text-white border-accent-orange';
          case 'RECOVERY': return 'bg-orange-400 text-black border-orange-400';
          case 'MEETING': return 'bg-blue-500 text-white border-blue-500';
          default: return 'bg-neutral-800 text-neutral-400 border-neutral-700';
      }
  };

  // Metric Selection Logic
  const getTrendData = () => {
      switch (selectedMetric) {
          case 'deepWork': return { 
              data: state.metrics.deepWorkTrend, 
              title: "Deep Work Minutes", 
              color: "bg-accent-blue" 
            };
          case 'contextSwitches': return { 
              data: state.metrics.contextSwitchesTrend, 
              title: "Context Switches", 
              color: "bg-accent-orange" 
            };
          default: return { 
              data: state.metrics.weeklyTrend, 
              title: "Focus Trends", 
              color: "bg-neutral-600 group-hover:bg-white" 
            };
      }
  };

  const trendConfig = getTrendData();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 pb-32 overflow-hidden relative selection:bg-accent-blue selection:text-white">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-20 gap-4">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">
                        {state.currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h1>
                    <p className="text-[11px] text-neutral-500 font-medium mt-1">
                        Welcome back, Alex
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                 {/* Session State Indicator */}
                 <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 shadow-lg transition-colors duration-300 ${getStatusColor(state.sessionState)}`}>
                    <div className={`w-2 h-2 rounded-full ${state.sessionState === 'IDLE' ? 'bg-neutral-500' : 'bg-white animate-pulse'}`} />
                    <span className="text-xs font-bold tracking-wide">{state.sessionState}</span>
                 </div>

                 <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold hover:bg-neutral-800 transition-colors group">
                    <Star size={12} className="text-yellow-400" fill="currentColor" />
                    <span>Get Pro</span>
                    <ChevronRight size={12} className="text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
                 </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="sm:hidden p-2.5 rounded-full bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-neutral-700"
                >
                    <Menu size={22} />
                </button>
            </div>
        </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min"
      >
        
        {/* Hero Block: Focus Gauge */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-1 lg:col-span-1 h-64 bg-titanium-dark rounded-[2rem] border border-titanium-border flex items-center justify-center relative overflow-hidden group shadow-2xl cursor-pointer" onClick={() => setSelectedMetric('score')}>
            <FocusGauge metrics={state.metrics} recoveryProgress={state.sessionState === 'RECOVERY' ? state.recoveryProgress : undefined} />
        </motion.div>

        {/* Timeline Block */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 lg:col-span-3 h-64 shadow-2xl shadow-black/50">
            <TimelineScrubber 
                timeline={state.timeline} 
                currentTime={state.currentTime} 
                onTagRequest={handleTagRequest}
            />
        </motion.div>

        {/* Metrics Strip */}
        <motion.div variants={itemVariants} className="col-span-1">
            <MetricCard 
                label="Deep Work" 
                value={Math.floor(state.metrics.deepWorkMinutes)} 
                unit="min" 
                color="text-accent-blue"
                isSelected={selectedMetric === 'deepWork'}
                onClick={() => setSelectedMetric('deepWork')}
            />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1">
            <MetricCard 
                label="Context Switches" 
                value={state.metrics.contextSwitches} 
                color="text-accent-orange"
                isSelected={selectedMetric === 'contextSwitches'}
                onClick={() => setSelectedMetric('contextSwitches')}
            />
        </motion.div>
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-1 lg:col-span-1 row-span-2 md:row-span-1 h-full">
             {/* Trend Chart disguised as a card for Bento variation */}
             <div className="bg-titanium-dark border border-titanium-border rounded-[2rem] p-5 h-full relative overflow-hidden hover:border-neutral-700 transition-colors">
                <TrendAnalysisChart 
                    data={trendConfig.data} 
                    title={trendConfig.title}
                    color={trendConfig.color}
                    lastWeekData={selectedMetric === 'score' ? state.metrics.lastWeekTrend : undefined}
                />
             </div>
        </motion.div>

        {/* Squad Block (Large bottom tile) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-3 lg:col-span-4 h-auto sm:h-32">
            <SquadWidget squad={state.squad} onNudge={controls.triggerNudge} />
        </motion.div>

      </motion.div>

      <ControlsPanel 
        sessionState={state.sessionState}
        isPlaying={state.isPlaying}
        speedMultiplier={state.speedMultiplier}
        onTogglePlay={controls.togglePlay}
        onStartFocus={controls.startFocus}
        onResumeFocus={controls.resumeFocus}
        onTakeBreak={controls.takeBreak}
        onAddDistraction={controls.addDistraction}
        onTag={() => handleTagRequest(state.timeline[state.timeline.length - 1]?.id)}
        onToggleSpeed={() => controls.setSpeed(state.speedMultiplier === 1 ? 60 : 1)}
      />

      <TagModal 
        isOpen={isTagModalOpen} 
        onClose={() => { setIsTagModalOpen(false); setSelectedSegmentId(null); }} 
        onTag={(tag) => {
            // Use selected segment or fallback to latest
            const targetId = selectedSegmentId || state.timeline[state.timeline.length - 1]?.id;
            if (targetId) controls.tagSegment(targetId, tag);
        }}
      />

      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <BreakToast 
        isVisible={showBreakToast} 
        onDismiss={() => setShowBreakToast(false)} 
        onTakeBreak={controls.takeBreak}
      />
      
      <ShortcutHUD />
    </div>
  );
};

export default Dashboard;