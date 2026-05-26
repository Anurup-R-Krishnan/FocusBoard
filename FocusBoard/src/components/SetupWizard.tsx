import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type Status = 'idle' | 'enabling' | 'checking' | 'success' | 'error';

interface SetupWizardProps {
  onReady: () => void;
  onSkip: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onReady, onSkip }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  const checkHealth = async (): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:5000/health');
      return res.ok;
    } catch (_e) {
      return false;
    }
  };

  const handleEnable = async () => {
    setStatus('enabling');
    setMessage('Enabling systemd services...');
    try {
      await invoke('setup_systemd_service');
      setStatus('checking');
      setMessage('Waiting for backend to start...');
      await new Promise((r) => setTimeout(r, 2000));
      const ok = await checkHealth();
      if (ok) {
        setStatus('success');
        setMessage('Backend is running.');
        setTimeout(onReady, 800);
      } else {
        setStatus('error');
        setMessage('Backend did not start. Check systemd user services.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(String(err?.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
        <h1 className="text-xl font-semibold mb-2">Enable Background Tracking</h1>
        <p className="text-sm text-white/70 mb-6">
          FocusBoard needs a background service to track activity continuously. This installs and starts
          two systemd user services: the backend and the monitor.
        </p>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium disabled:opacity-50"
            onClick={handleEnable}
            disabled={status === 'enabling' || status === 'checking'}
          >
            Enable Services
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-white/20 text-sm"
            onClick={onSkip}
            disabled={status === 'enabling' || status === 'checking'}
          >
            Skip
          </button>
        </div>
        {message && (
          <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-400' : 'text-white/70'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
