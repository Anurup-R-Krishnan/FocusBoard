
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Mail, Lock, ArrowRight, Github, Chrome, Check, AlertTriangle, Shield, Key, User } from 'lucide-react';
import { Page } from '../layout/Navigation';

import { AUTH_BASE_URL } from '../../services/apiBase';
const API_BASE = AUTH_BASE_URL;

// --- Shared Layout ---

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, footer }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
    {/* Ambient Background */}
    <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md relative z-10"
    >
      <div className="flex justify-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-neutral-400 flex items-center justify-center shadow-2xl shadow-white/10">
          <Hexagon size={28} className="text-black fill-black" />
        </div>
      </div>

      <div className="bg-titanium-surface/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-sm text-neutral-400 mt-2">{subtitle}</p>
        </div>

        {children}
      </div>

      {footer && (
        <div className="mt-8 text-center">
          {footer}
        </div>
      )}
    </motion.div>

    <div className="absolute bottom-6 text-[10px] text-neutral-600 font-mono">
      FocusBoard Secure Authorization • v1.2
    </div>
  </div>
);

// --- Input Component ---

const InputField = ({ icon: Icon, type, placeholder, value, onChange }: any) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors">
      <Icon size={18} />
    </div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-titanium-dark/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent-blue focus:bg-titanium-dark transition-all text-sm font-medium"
    />
  </div>
);

// --- Error Banner ---

const ErrorBanner = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3"
  >
    <AlertTriangle size={16} className="text-red-400 shrink-0" />
    <p className="text-xs text-red-300 font-medium">{message}</p>
  </motion.div>
);

// --- Success Banner ---

const SuccessBanner = ({ message }: { message: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3"
  >
    <Check size={16} className="text-green-400 shrink-0" />
    <p className="text-xs text-green-300 font-medium">{message}</p>
  </motion.div>
);

// --- 1. Login Page ---

export const LoginView: React.FC<{ onNavigate: (p: Page) => void, onLogin: (token: string) => void }> = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_id: email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      onLogin(data.data.token);
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Enter your credentials to access your workspace."
      footer={
        <p className="text-sm text-neutral-500">
          Don't have an account? <button onClick={() => onNavigate('signup')} className="text-white font-medium hover:underline">Sign up</button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e: any) => setEmail(e.target.value)} />
        <div className="space-y-1">
          <InputField icon={Lock} type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
          <div className="flex justify-end">
            <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs text-neutral-400 hover:text-accent-blue transition-colors mt-1.5">Forgot password?</button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
        </button>

        {import.meta.env.DEV && (
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch(`${API_BASE}/dev-login`, { method: 'POST' });
                const data = await res.json();
                if (data.success) onLogin(data.data.token);
                else setError(data.message);
              } catch (err) {
                setError('Dev login failed.');
              }
              setLoading(false);
            }}
            className="w-full bg-accent-blue/20 text-accent-blue border border-accent-blue/30 font-bold py-3rounded-xl hover:bg-accent-blue/30 transition-colors flex items-center justify-center gap-2 mt-2 py-3.5 rounded-xl"
          >
            <Shield size={16} /> Login as Admin (Dev Only)
          </button>
        )}
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#19191b] px-2 text-neutral-500 font-medium">Or continue with</span></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-titanium-dark border border-white/10 hover:bg-white/5 transition-colors text-white text-sm font-medium">
          <Github size={18} /> GitHub
        </button>
        <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-titanium-dark border border-white/10 hover:bg-white/5 transition-colors text-white text-sm font-medium">
          <Chrome size={18} /> Google
        </button>
      </div>
    </AuthLayout>
  );
};

// --- 2. Sign Up Page ---

export const SignUpView: React.FC<{ onNavigate: (p: Page) => void }> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email_id: email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess('Account created successfully! Redirecting to login...');
      setLoading(false);
      setTimeout(() => onNavigate('login'), 1500);
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your 14-day free trial. No credit card required."
      footer={
        <p className="text-sm text-neutral-500">
          Already have an account? <button onClick={() => onNavigate('login')} className="text-white font-medium hover:underline">Log in</button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message={success} />}

        <InputField icon={User} type="text" placeholder="Full name" value={name} onChange={(e: any) => setName(e.target.value)} />
        <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e: any) => setEmail(e.target.value)} />
        <InputField icon={Lock} type="password" placeholder="Create password (min 6 chars)" value={password} onChange={(e: any) => setPassword(e.target.value)} />

        <div className="text-[10px] text-neutral-500 leading-tight py-1">
          By creating an account, you agree to our <span className="text-neutral-300">Terms of Service</span> and <span className="text-neutral-300">Privacy Policy</span>.
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-blue text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
        </button>
      </form>

      <div className="mt-6 flex justify-center gap-4">
        {/* Socials shortened */}
        <div className="flex gap-4 opacity-50">
          <Github size={20} className="text-neutral-400" />
          <Chrome size={20} className="text-neutral-400" />
        </div>
      </div>
    </AuthLayout>
  );
};

// --- 3. Verify Email Page ---

export const VerifyEmailView: React.FC<{ onNavigate: (p: Page) => void }> = ({ onNavigate }) => {
  return (
    <AuthLayout
      title="Check your Inbox"
      subtitle="We've sent a verification link to alex@example.com"
      footer={
        <button onClick={() => onNavigate('onboarding')} className="text-sm text-neutral-500 hover:text-white transition-colors">
          Skip Verification (Demo)
        </button>
      }
    >
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center text-accent-green border border-accent-green/20">
          <Mail size={32} />
        </div>

        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-12 h-14 bg-titanium-dark border border-white/10 rounded-xl flex items-center justify-center text-xl font-mono text-white">
              {i === 1 ? '4' : ''}
            </div>
          ))}
        </div>

        <button
          onClick={() => onNavigate('onboarding')}
          className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors mt-2"
        >
          Verify & Continue
        </button>

        <button
          onClick={() => onNavigate('login')}
          className="text-xs text-accent-blue font-bold hover:underline"
        >
          Resend verification email
        </button>
      </div>
    </AuthLayout>
  );
};

// --- 4. Forgot Password ---

export const ForgotPasswordView: React.FC<{ onNavigate: (p: Page) => void }> = ({ onNavigate }) => {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive password reset instructions."
      footer={
        <button onClick={() => onNavigate('login')} className="text-sm text-neutral-500 hover:text-white transition-colors">
          Return to login
        </button>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onNavigate('reset-password'); }} className="space-y-6">
        <InputField icon={Mail} type="email" placeholder="Email address" />
        <button
          type="submit"
          className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors"
        >
          Send Reset Link
        </button>
      </form>
    </AuthLayout>
  );
};

// --- 5. Reset Password ---

export const ResetPasswordView: React.FC<{ onNavigate: (p: Page) => void }> = ({ onNavigate }) => {
  return (
    <AuthLayout
      title="New Password"
      subtitle="Create a new strong password for your account."
    >
      <form onSubmit={(e) => { e.preventDefault(); onNavigate('login'); }} className="space-y-4">
        <InputField icon={Lock} type="password" placeholder="New Password" />
        <InputField icon={Lock} type="password" placeholder="Confirm Password" />

        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <h4 className="text-[10px] text-neutral-400 uppercase font-bold mb-2">Password Requirements</h4>
          <ul className="text-xs text-neutral-500 space-y-1">
            <li className="flex items-center gap-2"><Check size={10} className="text-accent-green" /> At least 8 characters</li>
            <li className="flex items-center gap-2"><Check size={10} className="text-accent-green" /> One uppercase letter</li>
            <li className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border border-neutral-600" /> One number</li>
          </ul>
        </div>

        <button
          type="submit"
          className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors mt-2"
        >
          Reset Password
        </button>
      </form>
    </AuthLayout>
  );
};

// --- 6. Account Locked ---

export const AccountLockView: React.FC<{ onNavigate: (p: Page) => void }> = ({ onNavigate }) => {
  return (
    <AuthLayout
      title="Account Locked"
      subtitle="Security Check"
    >
      <div className="flex flex-col items-center text-center gap-6 py-2">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
          <Shield size={32} />
        </div>

        <p className="text-sm text-neutral-300">
          We detected suspicious activity on your account. To protect your data, access has been temporarily suspended.
        </p>

        <div className="w-full bg-titanium-dark border border-white/10 rounded-xl p-4 flex items-center gap-3 text-left">
          <AlertTriangle size={20} className="text-yellow-500 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white">Security Alert #8832</div>
            <div className="text-[10px] text-neutral-500">Login attempt from unknown device (HK)</div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('login')}
          className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors"
        >
          Contact Support
        </button>
      </div>
    </AuthLayout>
  );
};
