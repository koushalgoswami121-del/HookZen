import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  Zap,
  Sparkles,
  X,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  FileDown,
  Bot,
  TrendingUp,
  Cloud,
  Lock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { FreemiumState, toggleProStatus } from '../utils/freemiumManager';
import { saveUserProfileToFirestore } from '../lib/firebase';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  freemiumState: FreemiumState;
  onUpdateState: (newState: FreemiumState) => void;
  reason?: 'limit_reached' | 'pro_feature_locked' | 'general';
  user?: User | null;
  onSignIn?: () => void;
  isSigningIn?: boolean;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  freemiumState,
  onUpdateState,
  reason = 'general',
  user = null,
  onSignIn,
  isSigningIn = false,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('annual');
  const [isActivating, setIsActivating] = useState(false);

  // Close modal on Escape key
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

  const POLAR_MONTHLY_CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_TTO1bMO8aauIImAFpZftt5HjnncmgA2u6SQvy1wLKEF';
  const POLAR_YEARLY_CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_aGmfxo8xDnpWHiMuA0qpF4Q5P2O1CaBOBgIl44bAt7X';
  const POLAR_LIFETIME_CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_rOTZcvExdcMLC5hAfscDfgTtdMBcFHxtKiQVk2fqZVZ';

  const handleTogglePro = async (enable: boolean, selectedPlan?: 'free' | 'monthly' | 'annual' | 'lifetime') => {
    if (enable) {
      const targetPlan = selectedPlan || billingCycle;

      // Save pending plan to local storage & cloud profile so returning from checkout upgrades exact plan
      try {
        localStorage.setItem('pending_plan_type', targetPlan);
      } catch (e) {
        console.warn('Could not set pending_plan_type in localStorage', e);
      }

      if (user) {
        try {
          await saveUserProfileToFirestore(user.uid, {
            pendingPlanType: targetPlan,
            planType: targetPlan,
          });
        } catch (cloudErr) {
          console.warn('Cloud sync pending plan note:', cloudErr);
        }
      }

      let checkoutUrl = POLAR_MONTHLY_CHECKOUT_URL;
      if (targetPlan === 'lifetime') {
        checkoutUrl = POLAR_LIFETIME_CHECKOUT_URL;
      } else if (targetPlan === 'annual') {
        checkoutUrl = POLAR_YEARLY_CHECKOUT_URL;
      }

      // Direct redirect to official Polar checkout page
      window.location.href = checkoutUrl;
      return;
    }

    // If attempting to switch to Free plan while Pro is active, block manual downgrade
    if (!enable) {
      if (freemiumState.isPro) {
        // Pro plan is active; manual downgrade to free is locked
        return;
      }
      setIsActivating(true);
      const updated = toggleProStatus(false, 'free');
      onUpdateState(updated);

      if (user) {
        await saveUserProfileToFirestore(user.uid, {
          isPro: false,
          planType: 'free',
        });
      }

      setTimeout(() => {
        setIsActivating(false);
        onClose();
      }, 400);
      return;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 flex min-h-full items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 my-auto text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Labeled Exit Button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 font-bold border border-amber-200">
              <Crown className="h-5 w-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">HookZen Subscription Plans</h2>
              <p className="text-xs text-slate-500 font-medium">Simple, creator-friendly pricing with no hidden fees</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer border border-slate-200 shadow-2xs"
            aria-label="Close subscription modal"
          >
            <span>Close</span>
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Modal Banner Context Alert */}
        {!user && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-indigo-50/80 p-4 border border-indigo-200 text-indigo-950 text-sm font-semibold shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-indigo-200 shadow-2xs">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <p className="font-extrabold text-indigo-950 text-sm">Google Account Required to Purchase Pro</p>
                <p className="text-xs text-indigo-800 font-medium">
                  Sign in with Google so your unlimited Pro access is stored safely on your account across all devices.
                </p>
              </div>
            </div>
            {onSignIn && (
              <button
                onClick={onSignIn}
                disabled={isSigningIn}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-60"
              >
                {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
            )}
          </div>
        )}

        {!freemiumState.isPro && reason === 'limit_reached' && (
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-900 text-sm font-semibold">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
              <Zap className="h-4 w-4 fill-amber-600 text-amber-700" />
            </div>
            <div>
              <p className="font-extrabold text-amber-950">Daily Free Credits Depleted ({freemiumState.dailyCreditsUsed}/{freemiumState.maxFreeDailyCredits} Used)</p>
              <p className="text-xs text-amber-800 font-medium">
                Each video analysis requires 10 credits. You've used all 50 daily free credits. Upgrade to HookZen Pro for unlimited analyses!
              </p>
            </div>
          </div>
        )}

        {!freemiumState.isPro && reason === 'pro_feature_locked' && (
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50/80 p-4 border border-amber-200 text-amber-950 text-sm font-semibold">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
              <Crown className="h-4 w-4 text-amber-700 fill-amber-400" />
            </div>
            <div>
              <p className="font-extrabold text-amber-950">Pro Feature Locked</p>
              <p className="text-xs text-amber-800 font-medium">
                Unlock unlimited video audits, 100% ad-free experience, and competitor benchmarking with HookZen Pro.
              </p>
            </div>
          </div>
        )}

        {/* Title & Billing Switcher */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Go Viral Consistently with Pro
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Choose the plan that fits your creator workflow. Toggle or cancel anytime.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="flex items-center justify-center pt-1">
            <div className="inline-flex items-center rounded-full bg-slate-100 p-1 border border-slate-200 text-xs font-bold gap-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-full px-3.5 py-1.5 transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly ($9.99/mo)
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`rounded-full px-3.5 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-slate-900 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual ($79/yr)</span>
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                  Save 34%
                </span>
              </button>
              <button
                onClick={() => setBillingCycle('lifetime')}
                className={`rounded-full px-3.5 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'lifetime'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                    : 'text-slate-700 hover:text-slate-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <Sparkles className="h-3 w-3 fill-slate-950 text-slate-950" />
                <span>Lifetime ($79)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid (Equal Heights) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-2">
          {/* Card 1: Free Plan */}
          <div className={`flex flex-col justify-between rounded-3xl border p-6 space-y-5 transition-all ${
            !freemiumState.isPro
              ? 'bg-white border-slate-300 shadow-md ring-2 ring-slate-400/20'
              : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">Starter Free</h3>
                  {!freemiumState.isPro && (
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-800">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">For casual creators testing their hooks</p>
              </div>

              <div className="flex items-baseline gap-1 border-b border-slate-100 pb-4">
                <span className="text-3xl font-black text-slate-900">$0</span>
                <span className="text-xs text-slate-500 font-semibold">/forever</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>50 Free Credits</strong> (Refreshes monthly = 5 full video audits)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>0–100 Virality Score &amp; Grade</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>3s Hook Type &amp; Script Structure Audit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Actionable Script Strengths &amp; Tips</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400">
                  <X className="h-4 w-4 shrink-0 mt-0.5 text-slate-300" />
                  <span>Unlimited Video Audits</span>
                </li>
              </ul>
            </div>

            {freemiumState.isPro ? (
              <div className="space-y-2">
                <button
                  disabled={true}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Free Plan Locked (Pro Active)</span>
                </button>
                <div className="rounded-xl bg-amber-50/90 border border-amber-200/80 p-2.5 text-center text-[11px] text-amber-950 font-medium leading-tight">
                  🔒 Your Pro subscription is active. Downgrading to Free is disabled until your current billing period expires or payment fails.
                </div>
              </div>
            ) : (
              <button
                disabled={true}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 cursor-default"
              >
                Active Free Plan
              </button>
            )}
          </div>

          {/* Card 2: Pro Subscription */}
          <div className={`relative flex flex-col justify-between rounded-3xl border-2 p-6 space-y-5 transition-all ${
            freemiumState.isPro && freemiumState.planType !== 'lifetime'
              ? 'bg-gradient-to-b from-amber-50/90 via-white to-amber-50/40 border-amber-400 shadow-xl ring-2 ring-amber-400/30'
              : billingCycle === 'annual' || billingCycle === 'monthly'
              ? 'bg-white border-amber-300 shadow-lg hover:shadow-xl ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 opacity-90'
          }`}>
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-0.5 text-[11px] font-black text-slate-950 shadow-sm flex items-center gap-1">
              <Sparkles className="h-3 w-3 fill-slate-950" />
              <span>MOST POPULAR</span>
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>Pro Creator</span>
                    <Crown className="h-4 w-4 text-amber-500 fill-amber-400" />
                  </h3>
                  {freemiumState.isPro && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      freemiumState.planType !== 'lifetime'
                        ? 'bg-amber-200 text-amber-950 border border-amber-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {freemiumState.planType !== 'lifetime' ? 'Active Subscription' : 'Included in Lifetime'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">For serious short-form creators &amp; channels</p>
              </div>

              <div className="flex items-baseline gap-1 border-b border-slate-100 pb-4">
                <span className="text-3xl font-black text-slate-900">
                  {billingCycle === 'annual' ? '$79' : '$9.99'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {billingCycle === 'annual' ? '/year' : '/month'}
                </span>
                {billingCycle === 'annual' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-1">
                    $6.58/mo
                  </span>
                )}
              </div>

              <ul className="space-y-2.5 text-xs text-slate-800 font-medium">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>No Ads</strong>: 100% ad-free experience across all tools.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Unlimited Audits</strong>: No daily cap on video script &amp; title checks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>FYP SEO Keyword Density</strong>: Search index breakdown.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Bot className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Historical Trend Tracker</strong>: Channel growth benchmarking.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleTogglePro(true, billingCycle === 'annual' ? 'annual' : 'monthly')}
              disabled={isActivating || (freemiumState.isPro && freemiumState.planType !== 'lifetime')}
              className={`w-full py-3 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                freemiumState.isPro && freemiumState.planType !== 'lifetime'
                  ? 'bg-amber-400 text-slate-950 cursor-default'
                  : freemiumState.isPro && freemiumState.planType === 'lifetime'
                  ? 'bg-slate-100 text-slate-500 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-600 hover:to-amber-700 font-black'
              }`}
            >
              <Crown className="h-4 w-4 fill-current" />
              <span>
                {freemiumState.isPro && freemiumState.planType !== 'lifetime'
                  ? 'Pro Active (Enjoy Unlimited)'
                  : freemiumState.isPro && freemiumState.planType === 'lifetime'
                  ? 'Included in Lifetime Pass'
                  : billingCycle === 'annual'
                  ? 'Get Pro Yearly ($79/yr)'
                  : 'Get Pro Monthly ($9.99/mo)'}
              </span>
              {(!freemiumState.isPro) && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Card 3: Lifetime Pass (Warm Gold & Slate Aesthetic - No Dark Purple) */}
          <div className={`relative flex flex-col justify-between rounded-3xl border-2 transition-all p-6 space-y-5 ${
            freemiumState.isPro && freemiumState.planType === 'lifetime'
              ? 'bg-gradient-to-b from-amber-100/90 via-white to-amber-50/70 border-amber-400 text-slate-900 shadow-xl ring-2 ring-amber-400/40'
              : billingCycle === 'lifetime'
              ? 'bg-gradient-to-b from-amber-50/90 via-white to-amber-100/40 border-amber-400 text-slate-900 shadow-xl ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 text-slate-900 shadow-md hover:shadow-lg hover:border-amber-300'
          }`}>
            {/* Top Badge */}
            <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-0.5 text-[10px] font-black shadow-xs flex items-center gap-1.5 border whitespace-nowrap ${
              freemiumState.isPro && freemiumState.planType === 'lifetime'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-amber-400 text-slate-950 border-amber-300'
            }`}>
              <Sparkles className="h-3 w-3 fill-current" />
              <span>
                {freemiumState.isPro && freemiumState.planType === 'lifetime'
                  ? '✓ ACTIVE PLAN • OWNED FOREVER'
                  : 'BEST VALUE • ONE-TIME PAYMENT'}
              </span>
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">
                    Lifetime Pass
                  </h3>
                  {freemiumState.isPro && freemiumState.planType === 'lifetime' ? (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black">
                      Active Lifetime
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold">
                      Pay Once, Own Forever
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Zero recurring bills. All future Pro updates included.
                </p>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-2 border-b border-slate-100 pb-3.5">
                <span className="text-3xl font-black text-slate-900">
                  $79
                </span>
                <span className="text-sm font-semibold line-through text-slate-400">
                  $149
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  /one-time
                </span>
                <span className="ml-auto rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5">
                  Save $70
                </span>
              </div>

              {/* Micro Scarcity Bar */}
              <div className="rounded-xl p-2.5 text-xs space-y-1.5 border bg-amber-50/90 border-amber-200 text-slate-800">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-600 fill-amber-500" />
                    <span>Early Bird Launch Edition</span>
                  </span>
                  <span className="text-amber-800 font-extrabold">84/100 Claimed</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-amber-200/80 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full w-[84%]" />
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs font-medium text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>All Current &amp; Future Pro Features</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Unlimited Video Script Audits Forever</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>No Monthly Subscription or Auto-Renews</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Priority Server Speed &amp; White-label PDFs</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleTogglePro(true, 'lifetime')}
              disabled={isActivating || (freemiumState.isPro && freemiumState.planType === 'lifetime')}
              className={`w-full py-3 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                freemiumState.isPro && freemiumState.planType === 'lifetime'
                  ? 'bg-emerald-600 text-white cursor-default shadow-xs'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black'
              }`}
            >
              {freemiumState.isPro && freemiumState.planType === 'lifetime' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span>Lifetime Plan Active (Owned Forever)</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-slate-950 text-slate-950" />
                  <span>Get Lifetime Pass ($79)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions & Exit Options */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Secure SSL Encryption • Manage or Cancel Anytime in Account Settings</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
            >
              Continue with Free Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


