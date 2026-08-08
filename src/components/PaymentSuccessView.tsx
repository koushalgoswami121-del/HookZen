import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { CheckCircle2, Sparkles, Crown, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FreemiumState, saveFreemiumState, getFreemiumState } from '../utils/freemiumManager';
import { fetchUserProfileFromFirestore, saveUserProfileToFirestore } from '../lib/firebase';

interface PaymentSuccessViewProps {
  user: User | null;
  onComplete: () => void;
  onUpdateFreemiumState: (newState: FreemiumState) => void;
}

export const PaymentSuccessView: React.FC<PaymentSuccessViewProps> = ({
  user,
  onComplete,
  onUpdateFreemiumState,
}) => {
  const [isVerifying, setIsVerifying] = useState(true);

  // Confetti celebration on launch
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      });
    } catch (e) {
      console.warn('Confetti launch error:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncSubscription() {
      try {
        // Detect selected plan from URL search parameters or saved pending state
        const urlParams = new URLSearchParams(window.location.search);
        const urlPlan = urlParams.get('plan') as 'monthly' | 'annual' | 'lifetime' | null;
        const pendingPlan = localStorage.getItem('pending_plan_type') as 'monthly' | 'annual' | 'lifetime' | null;

        const plan: 'monthly' | 'annual' | 'lifetime' =
          urlPlan || pendingPlan || 'annual';

        // Activate Pro status with exact plan type
        const currentState = getFreemiumState();
        const updatedState: FreemiumState = {
          ...currentState,
          isPro: true,
          planType: plan,
          dailyCreditsUsed: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
        };

        saveFreemiumState(updatedState);
        onUpdateFreemiumState(updatedState);

        // Persist to user's Firebase Cloud profile
        if (user) {
          try {
            await saveUserProfileToFirestore(user.uid, {
              isPro: true,
              planType: plan,
              updatedAt: new Date().toISOString(),
            });
          } catch (cloudErr) {
            console.warn('Non-fatal cloud sync note:', cloudErr);
          }
        }

        // Clean up pending storage
        localStorage.removeItem('pending_plan_type');
      } catch (err) {
        console.warn('Error verifying subscription during success callback:', err);
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }

    syncSubscription();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleManualRedirect = () => {
    if (window.history.pushState) {
      window.history.pushState(null, '', '/');
    }
    onComplete();
  };

  const activeState = getFreemiumState();
  const planTitle =
    activeState.planType === 'lifetime'
      ? 'HookZen Lifetime Pass'
      : activeState.planType === 'annual'
      ? 'HookZen Pro Annual'
      : 'HookZen Pro Monthly';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-3xl bg-white/90 backdrop-blur-xl border border-amber-200/80 p-8 sm:p-10 shadow-2xl space-y-8 text-center text-slate-900 relative overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />

        {/* Success Icon Badge */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white shadow-xl shadow-amber-500/25 ring-8 ring-amber-100/60 animate-bounce">
          <Crown className="h-10 w-10 text-white" />
          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        {/* Header Message */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Payment Verified &amp; Upgraded</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Welcome to {planTitle}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            Your account has been upgraded. You now have unlimited video script scoring, FYP viral hook generation, and deep retention audits.
          </p>
        </div>

        {/* Status Box */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-xs">
            <span className="font-bold text-slate-600">Subscription Plan:</span>
            <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {planTitle} Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 pt-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Unlimited Audits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Full Script Brain</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-4 pt-2">
          {isVerifying ? (
            <div className="text-xs text-slate-500 font-semibold animate-pulse">
              Syncing subscription status...
            </div>
          ) : (
            <div className="text-xs text-emerald-600 font-bold">
              ✓ Account ready
            </div>
          )}

          <button
            onClick={handleManualRedirect}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Start Using Hookzen Pro</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
