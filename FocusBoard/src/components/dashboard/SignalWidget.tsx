import React from 'react';
import SyncWaveform from './SyncWaveform';
import { SquadMember } from '../../types';

interface SignalWidgetProps {
  squad: SquadMember[];
}

const SignalWidget: React.FC<SignalWidgetProps> = ({ squad }) => {
  // Derive team state
  const focusedCount = squad.filter(m => m.status === 'FOCUS' || m.status === 'RECOVERY').length;
  const distractedCount = squad.filter(m => m.status === 'DISTRACTED').length;
  
  const isTeamFocused = focusedCount > squad.length / 2;
  const isTeamDistracted = distractedCount > 0;
  
  // Calculate a mock "Signal Strength" based on focus
  const signalStrength = Math.round((focusedCount / squad.length) * 100);

  return (
    <div className="bg-titanium-dark border border-titanium-border rounded-[22px] h-full relative overflow-hidden flex flex-col hover:border-white/10 transition-colors">
        {/* Header Overlay */}
        <div className="absolute top-5 left-6 z-10 pointer-events-none">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Sync Signal</h3>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                {isTeamDistracted ? 'NOISE DETECTED' : isTeamFocused ? 'FLOW STATE LOCKED' : 'SIGNAL IDLE'}
            </p>
        </div>
        
        {/* Signal Strength Indicator */}
        <div className="absolute top-5 right-6 z-10 pointer-events-none text-right">
             <div className={`text-xl font-bold tracking-tighter ${isTeamDistracted ? 'text-red-500' : isTeamFocused ? 'text-accent-blue' : 'text-neutral-500'}`}>
                 {signalStrength}%
             </div>
             <div className="flex gap-0.5 justify-end mt-1">
                 {[1,2,3,4,5].map(i => (
                     <div key={i} className={`w-1 h-2 rounded-sm ${signalStrength >= i * 20 ? (isTeamDistracted ? 'bg-red-500' : 'bg-accent-blue') : 'bg-neutral-800'}`} />
                 ))}
             </div>
        </div>

        {/* Waveform Visualization */}
        <div className="absolute inset-0 pt-8 flex items-center justify-center">
            <div className="w-full h-full opacity-80">
                <SyncWaveform isActive={isTeamFocused || isTeamDistracted} isDistracted={isTeamDistracted} />
            </div>
        </div>
        
        {/* Background Gradient */}
        <div className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-t ${isTeamDistracted ? 'from-red-500/50' : isTeamFocused ? 'from-blue-500/50' : 'from-transparent'} to-transparent`} />
    </div>
  );
};

export default SignalWidget;