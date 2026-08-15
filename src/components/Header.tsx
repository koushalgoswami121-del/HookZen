import React, { useState, useEffect } from 'react';
import { Zap, History, BookOpen, Crown, Sparkles, LogOut, User as UserIcon, ChevronDown, Settings } from 'lucide-react';
import { User } from 'firebase/auth';
import { FreemiumState } from '../utils/freemiumManager';

interface HeaderProps {
  onOpenHistory: () => void;
  historyCount: number;
  onOpenBlog?: () => void;
  onGoHome?: () => void;
  isBlogActive?: boolean;
  freemiumState: FreemiumState;
  onOpenPricing: () => void;
  user?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  isSigningIn?: boolean;
  onOpenAuthModal?: (mode: 'signin' | 'signup') => void;
  onOpenAccountSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  historyCount,
  onOpenBlog,
  onGoHome,
  isBlogActive = false,
  freemiumState,
  onOpenPricing,
  user = null,
  onSignIn,
  onSignOut,
  isSigningIn = false,
  onOpenAuthModal,
  onOpenAccountSettings,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const remainingCredits = freemiumState.isPro
    ? Infinity
    : Math.max(0, freemiumState.maxFreeDailyCredits + (freemiumState.bonusCredits || 0) - freemiumState.dailyCreditsUsed);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 20) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`no-print sticky top-0 z-30 w-full px-4 pt-3 pb-2 sm:px-8 bg-watercolor/90 backdrop-blur-md transition-all duration-300 transform ${isVisible
        ? 'translate-y-0 opacity-100'
        : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      role="banner"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-2xl p-1 transition-all cursor-pointer"
          aria-label="HookZen - Short-Form Video Viral Analyzer Home"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8ebd0] overflow-hidden shadow-md border border-[#eedab2]">
            <img src="/logo.png" alt="HookZen Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl leading-tight">
              HookZen
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-tight">
              Short-Form Video Viral Analyzer
            </p>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Credits Display Badge */}
          <button
            onClick={onOpenPricing}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer ${freemiumState.isPro
              ? 'bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-200/90'
              : 'bg-white/90 border-slate-200/90 text-slate-800 hover:bg-white hover:border-slate-300'
              }`}
            title={freemiumState.isPro ? 'Pro Subscription Active' : 'Free Credits (Refreshes Monthly) - Click for Pro'}
            aria-label="View Credits and Subscription Details"
          >
            {freemiumState.isPro ? (
              <>
                <Crown className="h-3.5 w-3.5 text-amber-600 fill-amber-500" aria-hidden="true" />
                <span className="font-extrabold text-amber-950">PRO Member</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" aria-hidden="true" />
                <span>
                  <strong className="text-amber-600 font-black">{remainingCredits}</strong>/{freemiumState.maxFreeDailyCredits} Credits
                </span>
              </>
            )}
          </button>

          {/* Google Auth / Account Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 p-1 pl-1.5 pr-3 text-xs font-bold text-slate-800 hover:bg-white hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
                title={user.displayName || user.email || 'Google Account'}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    className="h-6 w-6 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[11px] font-black text-slate-950">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate font-semibold">
                  {user.displayName ? user.displayName.split(' ')[0] : 'Account'}
                </span>
                {freemiumState.isPro && (
                  <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950">
                    PRO
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <div className="flex items-center gap-2.5 pb-2.5 mb-2 border-b border-slate-100">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="h-9 w-9 rounded-full object-cover border border-amber-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-black text-slate-950">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.displayName || 'Signed In User'}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Cloud Account Synced</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Profile Sub-Menu Items */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-slate-500" />
                      <span>Saved Video History</span>
                    </div>
                    {historyCount > 0 && (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                        {historyCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenPricing();
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {freemiumState.isPro ? (
                        <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                      ) : (
                        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                      )}
                      <span>
                        {freemiumState.isPro ? 'Pro Subscription' : 'Upgrade to Pro'}
                      </span>
                    </div>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${freemiumState.isPro
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                    >
                      {freemiumState.isPro
                        ? freemiumState.planType === 'lifetime'
                          ? 'LIFETIME'
                          : 'PRO'
                        : `${remainingCredits}/${freemiumState.maxFreeDailyCredits} FREE`}
                    </span>
                  </button>

                  {onOpenAccountSettings && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAccountSettings();
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="h-3.5 w-3.5 text-slate-500" />
                        <span>Account Settings</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Cancel/Delete</span>
                    </button>
                  )}

                  {onSignOut && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer mt-1"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Single combined Account button */}
              <button
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal('signin');
                  else if (onSignIn) onSignIn();
                }}
                disabled={isSigningIn}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-2xs hover:shadow-md transition-all cursor-pointer border border-amber-400/80 disabled:opacity-60"
                title="Create or access your HookZen account"
                aria-label="Create or access your HookZen account"
              >
                {isSigningIn ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                ) : (
                  <UserIcon className="h-4 w-4 text-slate-950" />
                )}
                <span>{isSigningIn ? 'Loading…' : 'Account'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


