import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Mail, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { signUpWithEmail, signInWithEmail } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  isSigningIn: boolean;
  mode?: 'signin' | 'signup';
  onOpenPrivacy?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn, // This is Google sign-in passed from App
  isSigningIn,
  mode: initialMode = 'signin',
  onOpenPrivacy,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setEmail('');
    setPassword('');
    setName('');
    setErr('');
  }, [initialMode, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setIsEmailLoading(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose(); // Close modal on success; App.tsx auth observer handles the rest
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErr('Email already in use. Please sign in instead.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setErr('Invalid email or password.');
      } else if (error.code === 'auth/weak-password') {
        setErr('Password is too weak (requires 6+ chars).');
      } else {
        setErr('An error occurred. Please try again.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 flex min-h-full items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl border border-amber-200/80 p-6 sm:p-7 shadow-2xl space-y-6 my-auto text-slate-900 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Decorative Glows */}
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer border border-slate-200 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="space-y-3 pt-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3.5 py-1 text-xs font-bold text-amber-900">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 fill-amber-400" />
            <span>HookZen Creator Account</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
            Sync your video audits, FYP suggestions, and Pro pass across devices.
          </p>
        </div>

        {/* Custom Toggle Switch */}
        <div className="relative mx-auto flex w-[240px] rounded-full bg-slate-100 p-1 shadow-inner z-10">
          <div
            className={`absolute left-1 top-1 bottom-1 w-[116px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out border border-slate-200/50 ${mode === 'signup' ? 'translate-x-[116px]' : 'translate-x-0'
              }`}
          />
          <button
            onClick={() => setMode('signin')}
            className={`relative z-20 flex-1 rounded-full py-1.5 text-[11px] font-extrabold tracking-wide uppercase transition-colors cursor-pointer ${mode === 'signin' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`relative z-20 flex-1 rounded-full py-1.5 text-[11px] font-extrabold tracking-wide uppercase transition-colors cursor-pointer ${mode === 'signup' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Container */}
        <div className="relative z-10">
          {err && (
            <div className="mb-4 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold p-3 border border-rose-200">
              {err}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-left">
            {mode === 'signup' && (
              <div className="space-y-1 font-medium">
                <label className="text-[11px] font-bold uppercase text-slate-500 px-1">Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/50 transition-all placeholder:font-medium"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1 font-medium">
              <label className="text-[11px] font-bold uppercase text-slate-500 px-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/50 transition-all placeholder:font-medium"
              />
            </div>
            <div className="space-y-1 font-medium">
              <label className="text-[11px] font-bold uppercase text-slate-500 px-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/50 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isEmailLoading || isSigningIn}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isEmailLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google Button */}
          <button
            onClick={onSignIn}
            type="button"
            disabled={isSigningIn || isEmailLoading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <div className="flex h-5 w-5 items-center justify-center bg-white rounded-full">
              <svg className={`h-3.5 w-3.5 ${isSigningIn ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-3 relative z-10 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Secure & Privacy Guaranteed</span>
          </div>
          {onOpenPrivacy && (
            <button onClick={() => { onClose(); onOpenPrivacy(); }} className="text-amber-600 hover:text-amber-800 hover:underline cursor-pointer">
              Read Policy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
