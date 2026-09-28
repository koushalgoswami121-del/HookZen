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
    <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5 text-slate-900 select-none">
      {/* Standalone Back Link OR Modal Close Button */}
      {isStandalonePage ? (
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to HookZen</span>
          </button>
        </div>
      ) : (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer z-20"
          aria-label="Close pricing modal"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Top Header Branding - Compact Single Screen Fit */}
      <div className="text-center mb-3 sm:mb-4">
        <div className="flex flex-col items-center justify-center gap-1 mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
            HOOKZEN
          </span>
          <div className="h-0.5 w-6 bg-orange-400 rounded-full" />
        </div>

        {/* Main Display Title */}
        <h1 className="text-2xl sm:text-3xl md:text-[32px] font-black text-slate-900 tracking-tight leading-tight">
          Choose your plan. Create with{' '}
          <span className="relative inline-block text-orange-500">
            confidence.
            <svg
              className="absolute -bottom-1 sm:-bottom-1.5 left-0 w-full text-orange-400 pointer-events-none"
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
        <p className="text-xs sm:text-[13px] text-slate-500 font-medium leading-tight max-w-lg mx-auto mt-1">
          Get AI-powered insights to make better short-form content. Choose the plan that fits your creator workflow.
        </p>

        {/* Segmented Billing Control */}
        <div className="mt-2.5 sm:mt-3 flex justify-center">
          <div className="inline-flex items-center p-1 rounded-full bg-white/95 border border-slate-200 shadow-2xs backdrop-blur-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#fef3e7] text-slate-900 border border-[#fed7aa] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="text-xs">Monthly</span>
              <span className="text-[11px] text-slate-500">$9.99/mo</span>
            </button>

            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-[#fef3e7] text-slate-900 border border-[#fed7aa] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="text-xs">Annual</span>
              <span className="text-[11px] text-slate-500">$79/yr</span>
              <span className="rounded-full bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.2 ml-0.5">
                Save 34%
              </span>
            </button>

            <button
              onClick={() => setBillingCycle('lifetime')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                billingCycle === 'lifetime'
                  ? 'bg-[#fef3e7] text-slate-900 border border-[#fed7aa] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="text-xs">Lifetime</span>
              <span className="text-[11px] text-slate-500">$149 one-time</span>
            </button>
          </div>
        </div>
      </div>

      {/* Context Alert for Unauthenticated Users (Slim) */}
      {!user && (
        <div className="max-w-lg mx-auto mb-3 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 font-medium flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-1.5 text-left">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>Sign in required to link your Pro access securely across devices.</span>
          </div>
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] shrink-0 cursor-pointer transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* 3 Pricing Cards Grid - Compact & Proportionate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4.5 items-stretch pt-0.5">
        {/* CARD 1: STARTER FREE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all relative">
          <div>
            {/* Top Left Icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 mb-3">
              <Sprout className="h-4.5 w-4.5 text-slate-700" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Starter Free</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">For casual creators testing their hooks.</p>

            {/* Price */}
            <div className="flex items-baseline gap-1 my-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">$0</span>
              <span className="text-xs font-semibold text-slate-500">/forever</span>
            </div>

            {/* Features List */}
            <ul className="space-y-2 text-[11px] sm:text-xs text-slate-700 font-medium mb-4">
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>
                  <strong>50 Free Credits</strong> (Refreshes monthly = 5 audits)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>0–100 Virality Score &amp; Grade</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>3s Hook Type &amp; Script Structure Audit</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>Actionable Script Strengths &amp; Tips</span>
              </li>
              <li className="flex items-start gap-2 text-slate-400">
                <X className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5 stroke-[2.5]" />
                <span>Unlimited Video Audits</span>
              </li>
            </ul>
          </div>

          <button
            disabled={true}
            className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs text-center shadow-2xs cursor-default"
          >
            {!freemiumState.isPro ? 'Active Free Plan' : 'Free Tier'}
          </button>
        </div>

        {/* CARD 2: PRO CREATOR (HIGHLIGHTED & SUBTLY ELEVATED) */}
        <div className="bg-white rounded-2xl border-2 border-orange-400 p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-orange-500/10 ring-2 ring-orange-400/10 relative transition-all md:-translate-y-1">
          {/* Top Right Pill Badge */}
          <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
            Most Popular
          </div>

          <div>
            {/* Top Left Icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 mb-3">
              <Crown className="h-4.5 w-4.5 text-orange-500 fill-orange-400" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Pro Creator</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">For serious short-form creators &amp; channels.</p>

            {/* Price */}
            <div className="flex items-baseline gap-1 my-3">
              {billingCycle === 'annual' ? (
                <>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">$79</span>
                  <span className="text-xs font-semibold text-slate-500">/year</span>
                  <span className="ml-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded-full border border-orange-200/80">
                    Save 34%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">$9.99</span>
                  <span className="text-xs font-semibold text-slate-500">/month</span>
                </>
              )}
            </div>

            {/* Features List with Custom Icons */}
            <ul className="space-y-2 text-[11px] sm:text-xs text-slate-800 font-medium mb-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  <strong>No Ads:</strong> 100% ad-free
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Infinity className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Unlimited Audits:</strong> Analyze without limits
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Deep Analysis:</strong> Detailed breakdown
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Search className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  <strong>FYP &amp; SEO:</strong> Keyword and search insights
                </span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleTogglePro(true, billingCycle === 'annual' ? 'annual' : 'monthly')}
            disabled={isActivating || (freemiumState.isPro && freemiumState.planType !== 'lifetime')}
            className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
              freemiumState.isPro && freemiumState.planType !== 'lifetime'
                ? 'bg-amber-400 text-slate-950 cursor-default shadow-xs'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20'
            }`}
          >
            <Crown className="h-3.5 w-3.5 fill-white text-white" />
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all relative">
          {/* Top Right Badge */}
          <div className="absolute top-4 right-4 bg-orange-50 text-orange-600 border border-orange-200/80 text-[10px] font-black px-2.5 py-0.5 rounded-full">
            Pay Once, Own Forever
          </div>

          <div>
            {/* Top Left Icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-200/80 text-orange-500 mb-3">
              <Zap className="h-4.5 w-4.5 text-orange-500 fill-orange-400" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Lifetime Pass</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Zero recurring bills. All future Pro updates.
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-1 my-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">$149</span>
              <span className="text-xs font-semibold text-slate-500">/one-time</span>
            </div>

            {/* Features List */}
            <ul className="space-y-2 text-[11px] sm:text-xs text-slate-700 font-medium mb-4">
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>Everything Included in Yearly features</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>No Monthly Subscription or Auto-Renews</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>All Current &amp; Future Pro Features</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5 stroke-[3]" />
                <span>Priority server speed</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleTogglePro(true, 'lifetime')}
            disabled={isActivating || (freemiumState.isPro && freemiumState.planType === 'lifetime')}
            className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wide transition-all border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              freemiumState.isPro && freemiumState.planType === 'lifetime'
                ? 'bg-emerald-600 text-white border-emerald-600 cursor-default'
                : 'border-orange-400 text-orange-600 hover:bg-orange-50 shadow-2xs'
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

      {/* Bottom Trust & Guarantee Footer - Slim & Balanced */}
      <div className="mt-4 sm:mt-5 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2.5 justify-center sm:justify-start">
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Secure SSL Encryption</p>
            <p className="text-[10px] text-slate-500 leading-tight">Your data is always protected.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-center sm:justify-start">
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Manage or Cancel Anytime</p>
            <p className="text-[10px] text-slate-500 leading-tight">In your account settings.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 justify-center sm:justify-start">
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Headphones className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Need help?</p>
            <p className="text-[10px] text-slate-500 leading-tight">
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
      <div className="min-h-screen bg-[#faf8f5] bg-watercolor flex flex-col justify-center items-center py-4 px-3 sm:px-6 relative overflow-hidden">
        {contentMarkup}
      </div>
    );
  }

  // If rendered as modal overlay
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md p-2 sm:p-4 flex min-h-full items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-3xl bg-[#faf8f5] border border-slate-200/90 shadow-2xl my-auto text-slate-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {contentMarkup}
      </div>
    </div>
  );
};
