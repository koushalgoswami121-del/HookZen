import React, { useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Crown, Lock, CheckCircle2 } from 'lucide-react';

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
  onSignIn,
  isSigningIn,
  mode = 'signin',
  onOpenPrivacy,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 flex min-h-full items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl border border-amber-200/80 p-6 sm:p-8 shadow-2xl space-y-6 my-auto text-slate-900 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Decorative Glows */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-indigo-400/15 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer border border-slate-200"
          aria-label="Close authentication modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header Badge */}
        <div className="space-y-3 pt-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3.5 py-1 text-xs font-bold text-amber-900">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 fill-amber-400" />
            <span>HookZen Creator Account</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {mode === 'signup' ? 'Create Your HookZen Account' : 'Sign In to HookZen'}
          </h2>

          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
            Sync your video virality audits, FYP hook suggestions, and Pro subscription safely across all your devices.
          </p>
        </div>

        {/* Auth Method Container (STRICTLY GOOGLE SIGN-IN ONLY) */}
        <div className="space-y-4 pt-1">
          <button
            onClick={() => {
              onSignIn();
            }}
            disabled={isSigningIn}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-3 border border-slate-800 active:scale-[0.99] group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <svg className={`h-4 w-4 ${isSigningIn ? 'animate-spin' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
          </button>

          <p className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>Official Google OAuth 2.0 • Secure &amp; Instant</span>
          </p>
        </div>

        {/* Feature List */}
        <div className="rounded-2xl bg-amber-50/60 border border-amber-200/70 p-3.5 text-left text-xs font-medium text-slate-700 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Automatic cloud backup for video analysis history</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Multi-device access to your Pro subscription</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Zero passwords to remember — 1-click authentication</span>
          </div>
        </div>

        {/* Trust Note */}
        <div className="flex flex-col items-center justify-center gap-1 text-[11px] text-slate-400 font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Privacy guaranteed • We never post to your Google profile</span>
          </div>
          {onOpenPrivacy && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrivacy();
              }}
              className="text-amber-700 hover:text-amber-900 underline font-semibold cursor-pointer"
            >
              Read Privacy Policy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
