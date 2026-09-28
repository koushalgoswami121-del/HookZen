import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  Zap,
  X,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Search,
  Infinity,
  CreditCard,
  Headphones,
  Sprout,
  ArrowLeft
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
  isStandalonePage?: boolean;
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
  isStandalonePage = false,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');
  const [isActivating, setIsActivating] = useState(false);

  // Close modal on Escape key if in modal mode
  useEffect(() => {
    if (isStandalonePage) return;
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
  }, [isOpen, onClose, isStandalonePage]);

  if (!isOpen) return null;

  const POLAR_MONTHLY_CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_TTO1bMO8aauIImAFpZftt5HjnncmgA2u6SQvy1wLKEF';
  const POLAR_YEARLY_CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_aGmfxo8xDnpWHiMuA0qpF4Q5P2O1CaBOBgIl44bAt7X';
  const POLAR_LIFETIME_CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_rOTZcvExdcMLC5hAfscDfgTtdMBcFHxtKiQVk2fqZVZ';

  const handleTogglePro = async (enable: boolean, selectedPlan?: 'free' | 'monthly' | 'annual' | 'lifetime') => {
    if (enable) {
      if (!user) {
        if (onSignIn) onSignIn();
        return;
      }

      const targetPlan: 'monthly' | 'annual' | 'lifetime' =
        selectedPlan && selectedPlan !== 'free'
          ? selectedPlan
          : billingCycle === 'lifetime'
          ? 'lifetime'
          : billingCycle === 'annual'
          ? 'annual'
          : 'monthly';

      // Save pending plan to local storage & cloud profile so returning from checkout upgrades exact plan
      try {
        localStorage.setItem('pending_plan_type', targetPlan);
      } catch (e) {
        console.warn('Could not set pending_plan_type in localStorage', e);
      }

      try {
        await saveUserProfileToFirestore(user.uid, {
          pendingPlanType: targetPlan,
          planType: targetPlan,
        });
      } catch (cloudErr) {
        console.warn('Cloud sync pending plan note:', cloudErr);
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

  const contentMarkup = (
    <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-slate-900 select-none">
      {/* Standalone Back Link OR Modal Close Button */}
      {isStandalonePage ? (
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to HookZen</span>
          </button>
        </div>
      ) : (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer z-20"
          aria-label="Close pricing modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Top Header Branding */}
      <div className="text-center space-y-2 mb-8">
        <div className="flex flex-col items-center justify-center gap-1.5 mb-2">
          <span className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-500">
            HOOKZEN
          </span>
          <div className="h-0.5 w-7 bg-orange-400 rounded-full" />
        </div>

        {/* Main Display Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Choose your plan.
          <br />
          Create with{' '}
          <span className="relative inline-block text-orange-500">
            confidence.
            <svg
              className="absolute -bottom-2 sm:-bottom-2.5 left-0 w-full text-orange-400 pointer-events-none"
              viewBox="0 0 250 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M3 12C60 3 185 3 247 11C200 6 90 7 15 13"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Sub-headline */}
        <div className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg mx-auto pt-2">
          <p>Get AI-powered insights to make better short-form content.</p>
          <p>Choose the plan that fits your creator workflow.</p>
        </div>

        {/* Segmented Billing Control */}
        <div className="pt-6 flex justify-center">
          <div className="inline-flex items-center p-1 sm:p-1.5 rounded-full bg-white/90 border border-slate-200 shadow-sm backdrop-blur-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#fef3e7] text-slate-900 border border-[#fed7aa] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Monthly</span>
              <span className="text-[11px] text-slate-500">$9.99/mo</span>
            </button>

            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full transition-all cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-[#fef3e7] text-slate-900 border border-[#fed7aa] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Annual</span>
              <span className="text-[11px] text-slate-500">$79/yr</span>
              <span className="rounded-full bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 ml-1">
                Save 34%
              </span>
            </button>

            <button
              onClick={() => setBillingCycle('lifetime')}
              className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full transition-all cursor-pointer ${
                billingCycle === 'lifetime'
                  ? 'bg-[#fef3e7] text-slate-900 border border-[#fed7aa] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="text-xs sm:text-sm">Lifetime</span>
              <span className="text-[11px] text-slate-500">$149 one-time</span>
            </button>
          </div>
        </div>
      </div>

      {/* Context Alert for Unauthenticated Users */}
      {!user && (
        <div className="max-w-xl mx-auto mb-8 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-center text-xs text-amber-900 font-medium flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2 text-left">
            <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Sign in required so your Pro access is linked securely across devices.</span>
          </div>
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 cursor-pointer transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-2">
        {/* CARD 1: STARTER FREE */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative">
          <div>
            {/* Top Left Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 mb-6">
              <Sprout className="h-6 w-6 text-slate-700" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Starter Free</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">For casual creators testing their hooks.</p>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 my-6">
              <span className="text-4xl sm:text-5xl font-black text-slate-900">$0</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">/forever</span>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 font-medium mb-8">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>
                  <strong>50 Free Credits</strong> (Refreshes monthly = 5 full video audits)
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>0–100 Virality Score &amp; Grade</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>3s Hook Type &amp; Script Structure Audit</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>Actionable Script Strengths &amp; Tips</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-400">
                <X className="h-4 w-4 text-slate-300 shrink-0 mt-0.5 stroke-[2.5]" />
                <span>Unlimited Video Audits</span>
              </li>
            </ul>
          </div>

          <button
            disabled={true}
            className="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm text-center shadow-2xs cursor-default"
          >
            {!freemiumState.isPro ? 'Active Free Plan' : 'Free Tier'}
          </button>
        </div>

        {/* CARD 2: PRO CREATOR (HIGHLIGHTED & ELEVATED) */}
        <div className="bg-white rounded-[28px] border-2 border-orange-400 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-orange-500/10 ring-4 ring-orange-400/10 relative transition-all md:-translate-y-2">
          {/* Top Right Pill Badge */}
          <div className="absolute top-6 right-6 sm:top-7 sm:right-7 bg-orange-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs">
            Most Popular
          </div>

          <div>
            {/* Top Left Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 mb-6">
              <Crown className="h-6 w-6 text-orange-500 fill-orange-400" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pro Creator</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">For serious short-form creators &amp; channels.</p>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 my-6">
              {billingCycle === 'annual' ? (
                <>
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">$79</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">/year</span>
                  <span className="ml-2 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/80">
                    Save 34%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">$9.99</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">/month</span>
                </>
              )}
            </div>

            {/* Features List with Custom Icons */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-800 font-medium mb-8">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  <strong>No Ads:</strong> 100% ad-free
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Infinity className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Unlimited Audits:</strong> Analyze without limits
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <TrendingUp className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Deep Analysis:</strong> Detailed performance breakdown
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Search className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  <strong>FYP &amp; SEO:</strong> Keyword and search insights
                </span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleTogglePro(true, billingCycle === 'annual' ? 'annual' : 'monthly')}
            disabled={isActivating || (freemiumState.isPro && freemiumState.planType !== 'lifetime')}
            className={`w-full py-3.5 rounded-2xl text-sm font-black tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              freemiumState.isPro && freemiumState.planType !== 'lifetime'
                ? 'bg-amber-400 text-slate-950 cursor-default shadow-xs'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:shadow-orange-500/35'
            }`}
          >
            <Crown className="h-4 w-4 fill-white text-white" />
            <span>
              {freemiumState.isPro && freemiumState.planType !== 'lifetime'
                ? 'Active Pro Subscription'
                : billingCycle === 'annual'
                ? 'Get Pro Annual →'
                : 'Get Pro Monthly →'}
            </span>
          </button>
        </div>

        {/* CARD 3: LIFETIME PASS */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative">
          {/* Top Right Badge */}
          <div className="absolute top-6 right-6 sm:top-7 sm:right-7 bg-orange-50 text-orange-600 border border-orange-200/80 text-[11px] font-black px-3.5 py-1 rounded-full">
            Pay Once, Own Forever
          </div>

          <div>
            {/* Top Left Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-500 mb-6">
              <Zap className="h-6 w-6 text-orange-500 fill-orange-400" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lifetime Pass</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Zero recurring bills. All future Pro updates included.
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 my-6">
              <span className="text-4xl sm:text-5xl font-black text-slate-900">$149</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">/one-time</span>
            </div>

            {/* Features List */}
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 font-medium mb-8">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>Everything Included in Yearly features</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>No Monthly Subscription or Auto-Renews</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>All Current &amp; Future Pro Features</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>Priority server speed</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleTogglePro(true, 'lifetime')}
            disabled={isActivating || (freemiumState.isPro && freemiumState.planType === 'lifetime')}
            className={`w-full py-3.5 rounded-2xl text-sm font-black tracking-wide transition-all border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              freemiumState.isPro && freemiumState.planType === 'lifetime'
                ? 'bg-emerald-600 text-white border-emerald-600 cursor-default'
                : 'border-orange-400 text-orange-600 hover:bg-orange-50 shadow-2xs hover:shadow-sm'
            }`}
          >
            <span>
              {freemiumState.isPro && freemiumState.planType === 'lifetime'
                ? 'Active Lifetime Plan'
                : 'Get Lifetime Pass →'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Trust & Guarantee Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
        <div className="flex items-center gap-3 justify-center sm:justify-start">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Secure SSL Encryption</p>
            <p className="text-[11px] text-slate-500">Your data is always protected.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-center sm:justify-start">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Manage or Cancel Anytime</p>
            <p className="text-[11px] text-slate-500">In your account settings.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-center sm:justify-start">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Need help?</p>
            <p className="text-[11px] text-slate-500">
              Contact{' '}
              <a href="mailto:support@hookzen.me" className="text-orange-600 hover:underline font-semibold">
                support@hookzen.me
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // If rendered as standalone page
  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-[#faf8f5] bg-watercolor relative overflow-hidden">
        {contentMarkup}
      </div>
    );
  }

  // If rendered as modal overlay
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 lg:p-8 flex min-h-full items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl rounded-3xl bg-[#faf8f5] border border-slate-200/90 shadow-2xl my-auto text-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {contentMarkup}
      </div>
    </div>
  );
};
