import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { HistoryModal } from './components/HistoryModal';
import { BlogView } from './components/BlogView';
import { AdminSpaceView } from './components/AdminSpaceView';
import { PaymentSuccessView } from './components/PaymentSuccessView';
import { PaymentCancelView } from './components/PaymentCancelView';
import { ViralGrowthSection } from './components/ViralGrowthSection';
import { PricingModal } from './components/PricingModal';
import { AuthModal } from './components/AuthModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AnalysisInput, ViralScoreResult } from './types';
import { calculateViralScore } from './utils/scoringEngine';
import { ensureV2Result } from './utils/v2Adapter';
import { formatTo12HrTime } from './utils/formatTime';
import {
  getFreemiumState,
  saveFreemiumState,
  getRemainingCredits,
  useCredit,
  checkAndSyncIpCredits,
  toggleProStatus,
  resetFreemiumToSignedOut,
  FreemiumState,
} from './utils/freemiumManager';
import {
  subscribeToAuth,
  loginWithGoogle,
  handleAuthRedirectResult,
  logout,
  saveUserHistoryItemToFirestore,
  fetchUserHistoryFromFirestore,
  clearUserHistoryInFirestore,
  fetchUserProfileFromFirestore,
  saveUserProfileToFirestore,
  subscribeToUserProfile,
  deleteAccountPermanently,
  getPublicIp,
  fetchIpUsageFromFirestore,
  saveIpUsageToFirestore,
} from './lib/firebase';
import { Smartphone, ArrowLeft, BookOpen, TrendingUp, Zap, Flame, Target, Activity, Eye, BarChart3, CheckCircle2, Crown, ShieldCheck, Mail } from 'lucide-react';
import { AnalyzingAnimation } from './components/AnalyzingAnimation';

export default function App() {
  const [currentView, setCurrentView] = useState<'calculator' | 'blog' | 'payment_success' | 'payment_cancel' | 'adminspace' | 'pricing'>('calculator');
  const [blogSlug, setBlogSlug] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<ViralScoreResult | null>(null);
  const [history, setHistory] = useState<ViralScoreResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [blogKey, setBlogKey] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Freemium Pricing State
  const [freemiumState, setFreemiumState] = useState<FreemiumState>(() => getFreemiumState());

  // Authoritative Effective Freemium State: Unauthenticated users can never have Pro privileges
  const effectiveFreemiumState: FreemiumState = useMemo(() => {
    if (!user && freemiumState.isPro) {
      return {
        ...freemiumState,
        isPro: false,
        planType: 'free',
        bonusCredits: 0,
      };
    }
    return freemiumState;
  }, [user, freemiumState]);

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [pricingReason, setPricingReason] = useState<'limit_reached' | 'pro_feature_locked' | 'general'>('general');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const feedbackResolveRef = useRef<((submitted: boolean) => void) | null>(null);

  // Auth tracking refs
  const prevUserRef = useRef<User | null>(null);
  const isInitialAuthRef = useRef(true);

  // Central redirect to home page upon sign-in (closing modals and resetting path to '/')
  const handleRedirectToHomeAfterSignIn = () => {
    setIsAuthModalOpen(false);
    setIsPricingOpen(false);
    setIsHistoryOpen(false);
    setIsAccountSettingsOpen(false);
    setCurrentResult(null);
    setCurrentView('calculator');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPricing = (reason: 'limit_reached' | 'pro_feature_locked' | 'general' = 'general') => {
    setPricingReason(reason);
    setIsPricingOpen(true);
  };

  const handleCancelSubscription = async () => {
    const updated = toggleProStatus(false, 'free', true);
    setFreemiumState(updated);
    if (user) {
      await saveUserProfileToFirestore(user.uid, {
        isPro: false,
        planType: 'free',
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (user) {
      await deleteAccountPermanently(user);
      setUser(null);
    }
    setHistory([]);
    const updated = resetFreemiumToSignedOut();
    setFreemiumState(updated);
    setIsAccountSettingsOpen(false);
  };

  // Check for redirect sign-in return (essential for mobile & tablet browsers)
  useEffect(() => {
    handleAuthRedirectResult().then((redirectUser) => {
      if (redirectUser) {
        setUser(redirectUser);
        handleRedirectToHomeAfterSignIn();
      }
    });
  }, []);

  // Initial IP credit sync on boot
  useEffect(() => {
    checkAndSyncIpCredits().then((synced) => {
      setFreemiumState(synced);
    });
  }, []);

  // Listen to Firebase Auth state & sync Firestore history and freemium profile per user account
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      const isInitial = isInitialAuthRef.current;
      isInitialAuthRef.current = false;

      const hadNoUser = prevUserRef.current === null;
      prevUserRef.current = currentUser;
      setUser(currentUser);

      if (currentUser) {
        // Automatically route to home page if user just signed in
        if (hadNoUser && !isInitial) {
          handleRedirectToHomeAfterSignIn();
        }
        try {
          // 1. Sync User Freemium Profile from Firestore & IP usage (prevents incognito & account switching credit exploits)
          const cloudProfile = await fetchUserProfileFromFirestore(currentUser.uid);
          const localState = getFreemiumState();
          const ip = await getPublicIp();
          const ipRecord = await fetchIpUsageFromFirestore(ip);

          // Pro status is strictly derived from the authenticated user's verified cloud profile
          const isPaid = Boolean(cloudProfile?.isPro);

          const today = localState.lastResetDate;
          const cloudUsed = (cloudProfile && cloudProfile.lastResetDate === today) ? Number(cloudProfile.dailyCreditsUsed || 0) : 0;
          const ipUsed = (ipRecord && ipRecord.lastResetDate === today) ? Number(ipRecord.dailyCreditsUsed || 0) : 0;
          const localUsed = Number(localState.dailyCreditsUsed || 0);

          let maxCreditsUsed = 0;
          if (!isPaid) {
            // For returning users with a verified cloud history today, their cloud profile is the absolute source of truth.
            // This prevents IP usage from anonymous tabs from unfairly draining their logged-in account balance.
            if (cloudProfile && cloudProfile.lastResetDate === today && cloudProfile.dailyCreditsUsed !== undefined) {
              maxCreditsUsed = cloudUsed;
            } else {
              // Brand new sign-ups are initialized with the anonymous IP/local usage to prevent endless trial abuse.
              maxCreditsUsed = Math.max(localUsed, ipUsed);
            }
          }

          const mergedState: FreemiumState = {
            ...localState,
            isPro: isPaid,
            planType: isPaid
              ? (cloudProfile?.planType || (localState.planType !== 'free' ? localState.planType : 'monthly'))
              : 'free',
            dailyCreditsUsed: maxCreditsUsed,
            bonusCredits: cloudProfile?.bonusCredits || localState.bonusCredits || 0,
            lastResetDate: today,
          };

          setFreemiumState(mergedState);
          saveFreemiumState(mergedState);

          if (!isPaid) {
            // Ensure IP record in Firestore is also updated to reflect max credits used
            await saveIpUsageToFirestore(ip, maxCreditsUsed, today);
          }

          await saveUserProfileToFirestore(currentUser.uid, {
            isPro: mergedState.isPro,
            planType: mergedState.planType,
            dailyCreditsUsed: mergedState.dailyCreditsUsed,
            bonusCredits: mergedState.bonusCredits,
            lastResetDate: mergedState.lastResetDate,
          });

          // 2. Sync User History
          const cloudHistory = await fetchUserHistoryFromFirestore(currentUser.uid);
          if (cloudHistory && cloudHistory.length > 0) {
            setHistory(cloudHistory.map(ensureV2Result));
          } else {
            // Seed cloud history with local history if available
            const saved = localStorage.getItem('go_viral_history');
            if (saved) {
              const local: ViralScoreResult[] = JSON.parse(saved);
              if (local.length > 0) {
                const adapted = local.map(ensureV2Result);
                setHistory(adapted);
                for (const item of adapted) {
                  await saveUserHistoryItemToFirestore(currentUser.uid, item);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error synchronizing cloud history & profile:', e);
        }
      } else {
        // User is signed out / anonymous: reset Pro status, plan type, and account-bound bonus credits
        try {
          const cleanState = resetFreemiumToSignedOut();
          setFreemiumState(cleanState);
          checkAndSyncIpCredits(false).then((synced) => {
            setFreemiumState(synced);
          });
        } catch (e) {
          console.warn('Error resetting signed out state:', e);
        }

        // Fallback to local storage when signed out
        try {
          const saved = localStorage.getItem('go_viral_history');
          if (saved) {
            const local: ViralScoreResult[] = JSON.parse(saved);
            setHistory(local.map(ensureV2Result));
          } else {
            setHistory([]);
          }
        } catch (e) {
          console.warn('Failed to load local history:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-Time Background Sync for Bonus Credits & Pro Status updates
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserProfile(user.uid, (cloudProfile) => {
      if (!cloudProfile) return;

      setFreemiumState(prev => {
        let hasChanges = false;
        const newState = { ...prev };

        if (cloudProfile.bonusCredits !== undefined && prev.bonusCredits !== cloudProfile.bonusCredits) {
          newState.bonusCredits = cloudProfile.bonusCredits;
          hasChanges = true;
        }

        if (cloudProfile.dailyCreditsUsed !== undefined && prev.dailyCreditsUsed !== cloudProfile.dailyCreditsUsed && cloudProfile.lastResetDate === prev.lastResetDate) {
          newState.dailyCreditsUsed = cloudProfile.dailyCreditsUsed;
          hasChanges = true;
        }

        if (cloudProfile.isPro !== undefined && prev.isPro !== cloudProfile.isPro) {
          newState.isPro = cloudProfile.isPro;
          newState.planType = cloudProfile.planType || 'free';
          hasChanges = true;
        }

        if (hasChanges) {
          saveFreemiumState(newState);
          return newState;
        }
        return prev;
      });
    });
    return () => unsub();
  }, [user]);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    try {
      setIsSigningIn(true);
      const signedInUser = await loginWithGoogle();
      if (signedInUser) {
        handleRedirectToHomeAfterSignIn();
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        err?.code !== 'auth/popup-blocked'
      ) {
        console.error('Google sign in error:', err);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // 1. Instantly reset Pro status in state and localStorage
      const cleanState = resetFreemiumToSignedOut();
      setFreemiumState(cleanState);
      setUser(null);

      // 2. Perform Firebase sign out
      await logout();

      // 3. Re-sync public IP credits for anonymous browsing
      const ipSynced = await checkAndSyncIpCredits(false);
      setFreemiumState(ipSynced);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Path routing listener for /adminspace, /blog, /payment/success, /payment/cancel, and checkout returns
  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (path === '/adminspace' || path.startsWith('/adminspace')) {
        setCurrentView('adminspace');
      } else if (path === '/pricing' || path.startsWith('/pricing')) {
        setCurrentView('pricing');
      } else if (
        path.includes('/payment/success') ||
        path.includes('/success') ||
        search.includes('checkout_success') ||
        search.includes('checkout_id') ||
        search.includes('success=true') ||
        search.includes('status=success') ||
        search.includes('status=succeeded')
      ) {
        setCurrentView('payment_success');
      } else if (
        path.includes('/payment/cancel') ||
        path.includes('/cancel') ||
        search.includes('checkout_canceled') ||
        search.includes('canceled=true') ||
        search.includes('status=cancel') ||
        search.includes('status=canceled')
      ) {
        setCurrentView('payment_cancel');
      } else if (path.startsWith('/blog')) {
        setCurrentView('blog');
        const parts = path.split('/blog/');
        if (parts[1]) {
          setBlogSlug(parts[1]);
        } else {
          setBlogSlug(null);
        }
      } else {
        setCurrentView('calculator');
      }
    };

    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  // Save history helper (local + cloud firestore)
  const saveToHistory = async (result: ViralScoreResult) => {
    const updated = [result, ...history.filter((h) => h.id !== result.id)].slice(0, 50);
    setHistory(updated);
    try {
      localStorage.setItem('go_viral_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist history:', e);
    }

    if (user) {
      await saveUserHistoryItemToFirestore(user.uid, result);
    }
  };

  const handleClearHistory = async () => {
    const idsToClear = history.map((h) => h.id);
    setHistory([]);
    try {
      localStorage.removeItem('go_viral_history');
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }

    if (user && idsToClear.length > 0) {
      await clearUserHistoryInFirestore(user.uid, idsToClear);
    }
  };

  // Run Analysis
  const handleAnalyze = async (input: AnalysisInput) => {
    // Authoritative Pro status: User must be authenticated AND have Pro active
    const isProUser = Boolean(user && effectiveFreemiumState.isPro);

    // Check & sync IP credits first, but bypass if the user is authenticated via an account
    const syncedState = await checkAndSyncIpCredits(!!user);
    if (!user && syncedState.isPro) {
      syncedState.isPro = false;
      syncedState.planType = 'free';
      syncedState.bonusCredits = 0;
      saveFreemiumState(syncedState);
    }
    setFreemiumState(syncedState);

    // Check if free user has sufficient credits remaining (< 10 credits) on this IP address or device
    const remaining = getRemainingCredits();
    const stateWithBonus = syncedState.maxFreeDailyCredits + (syncedState.bonusCredits || 0) - syncedState.dailyCreditsUsed;
    if (!isProUser && (stateWithBonus < 10 || remaining < 10)) {
      handleOpenPricing('limit_reached');
      return;
    }

    setIsAnalyzing(true);
    const analysisStartTime = Date.now();

    try {
      const result = await calculateViralScore(input);

      // Guarantee minimum 3.5s animation so it never feels instant
      const elapsed = Date.now() - analysisStartTime;
      const minDuration = 3500;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      // Deduct 10 credits per analysis if not Pro
      if (!isProUser) {
        useCredit(10);
      }
      const updatedState = getFreemiumState();

      // FEEDBACK INTERCEPTION LOGIC
      // If the user has used exactly 30 credits (meaning this is their 3rd generation)
      // and they haven't given feedback yet, pause the result reveal to ask them.
      const hasGivenFeedback = localStorage.getItem('hkz_feedback_given');
      if (updatedState.dailyCreditsUsed === 30 && !hasGivenFeedback) {
        setIsFeedbackOpen(true);
        // Pause until user submits/skips modal
        await new Promise<void>((resolve) => {
          feedbackResolveRef.current = (submitted) => resolve();
        });
      }

      setFreemiumState(updatedState);

      if (user) {
        await saveUserProfileToFirestore(user.uid, {
          isPro: updatedState.isPro,
          planType: updatedState.planType,
          dailyCreditsUsed: updatedState.dailyCreditsUsed,
          bonusCredits: updatedState.bonusCredits,
          lastResetDate: updatedState.lastResetDate,
        });
      }

      setCurrentResult(result);
      await saveToHistory(result);
      setCurrentView('calculator');
    } catch (err) {
      console.error('Scoring error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setCurrentResult(null);
    setCurrentView('calculator');
  };

  const handleOpenBlog = () => {
    setCurrentView('blog');
    setBlogSlug(null);
    if (window.history.pushState) {
      window.history.pushState(null, '', '/blog');
    }
  };

  const handleGoHome = () => {
    setCurrentView('calculator');
    setBlogSlug(null);
    if (window.history.pushState) {
      window.history.pushState(null, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'adminspace') {
    return (
      <AdminSpaceView
        onGoHome={handleGoHome}
        onPostsUpdated={() => setBlogKey((prev) => prev + 1)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-watercolor text-slate-900 font-sans antialiased selection:bg-amber-200 flex flex-col justify-between">
      {/* Analyzing Animation Overlay */}
      {isAnalyzing && <AnalyzingAnimation />}
      <div>
        {/* Header */}
        <Header
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={history.length}
          onOpenBlog={handleOpenBlog}
          onGoHome={handleGoHome}
          isBlogActive={currentView === 'blog'}
          freemiumState={effectiveFreemiumState}
          onOpenPricing={() => handleOpenPricing('general')}
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          isSigningIn={isSigningIn}
          onOpenAuthModal={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
        />

        {/* Main Container */}
        <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10">
          {currentView === 'payment_success' ? (
            <PaymentSuccessView
              user={user}
              onComplete={handleGoHome}
              onUpdateFreemiumState={(newState) => setFreemiumState(newState)}
            />
          ) : currentView === 'payment_cancel' ? (
            <PaymentCancelView
              onReturnToPricing={() => {
                handleGoHome();
                handleOpenPricing('general');
              }}
              onGoHome={handleGoHome}
            />
          ) : currentView === 'pricing' ? (
            <PricingModal
              isOpen={true}
              isStandalonePage={true}
              onClose={handleGoHome}
              freemiumState={effectiveFreemiumState}
              onUpdateState={(newState) => setFreemiumState(newState)}
              reason={pricingReason}
              user={user}
              onSignIn={() => {
                setAuthModalMode('signin');
                setIsAuthModalOpen(true);
              }}
              isSigningIn={isSigningIn}
            />
          ) : currentView === 'blog' ? (
            <BlogView
              key={blogKey}
              onBackToApp={handleGoHome}
              initialSlug={blogSlug}
            />
          ) : (
            <>
              {/* Hero Banner Section */}
              {!currentResult && (
                <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-1 sm:pt-4 pb-2">
                  {/* Top Tag & Viral Live Growth Badge - Hidden on mobile screens */}
                  <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-sky-50 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-extrabold text-slate-800 border border-sky-200/80 shadow-2xs">
                      <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600" />
                      <span>Short-Form Video Intelligence</span>
                    </div>

                    <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-emerald-800 border border-emerald-200/80 shadow-2xs">
                      <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                      <span>Shorts &amp; Reels FYP Algorithm Engine</span>
                    </div>
                  </div>

                  {/* Serif Display Title with Sketch Accents */}
                  <h1 className="relative inline-block font-serif-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.2] sm:leading-[1.15]">
                    {/* Yellow Spark Rays left of Will */}
                    <span className="relative inline-block">
                      <svg className="absolute -left-5 sm:-left-6 -top-2 sm:-top-2.5 h-6 w-6 sm:h-7 sm:w-7 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M4 12h3M6 6l2 2M12 4v3" />
                      </svg>
                      Will
                    </span>{' '}
                    Your Short-Form Video{' '}
                    <span className="relative inline-block">
                      Go Viral?
                      {/* Yellow Wavy Underline */}
                      <svg className="absolute left-0 -bottom-2 sm:-bottom-2.5 w-full h-3 sm:h-3.5 text-amber-400" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M 0 6 Q 25 12, 50 6 T 100 6" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-medium pt-0.5 px-2">
                    Analyze your Reel, Short, or TikTok script, title, thumbnail, industry, and pacing before posting.{' '}
                    <span className="hidden sm:inline">Instant score breakdown out of 100 with targeted feedback.</span>
                  </p>
                </div>
              )}

              {/* Action bar when result is active */}
              {currentResult && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                  <button
                    onClick={handleNewAnalysis}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-800 border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                    aria-label="Analyze another video"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Analyze Another Video</span>
                  </button>

                  <div className="flex items-center justify-center sm:justify-end gap-2 text-xs text-slate-500 font-medium">
                    <span>Analyzed at</span>
                    <span className="text-slate-800 font-bold">{formatTo12HrTime(currentResult.timestamp)}</span>
                  </div>
                </div>
              )}

              {/* Input Form vs Analysis Dashboard */}
              {!currentResult ? (
                <>
                  <InputForm
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    freemiumState={effectiveFreemiumState}
                    onOpenPricing={handleOpenPricing}
                  />
                  <ViralGrowthSection />
                </>
              ) : (
                <AnalysisDashboard
                  result={currentResult}
                  onReset={handleNewAnalysis}
                  freemiumState={effectiveFreemiumState}
                  onOpenPricing={handleOpenPricing}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Freemium & Pro Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        freemiumState={effectiveFreemiumState}
        onUpdateState={(updated) => {
          setFreemiumState(updated);
          if (user) {
            saveUserProfileToFirestore(user.uid, {
              isPro: updated.isPro,
              planType: updated.planType,
              dailyCreditsUsed: updated.dailyCreditsUsed,
              lastResetDate: updated.lastResetDate,
            });
          }
        }}
        reason={pricingReason}
        user={user}
        onSignIn={() => {
          setIsPricingOpen(false);
          setAuthModalMode('signup');
          setIsAuthModalOpen(true);
        }}
        isSigningIn={isSigningIn}
      />

      {/* History Slideover Drawer */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={(item) => {
          setCurrentResult(item);
          setCurrentView('calculator');
        }}
        onClearHistory={handleClearHistory}
        freemiumState={effectiveFreemiumState}
        onOpenPricing={handleOpenPricing}
        user={user}
        onSignIn={handleSignIn}
        isSigningIn={isSigningIn}
      />

      {/* Auth Modal (Google Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignIn={handleSignIn}
        onSuccess={handleRedirectToHomeAfterSignIn}
        isSigningIn={isSigningIn}
        mode={authModalMode}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* Feedback Modal for 3rd generation milestone */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={(submitted) => {
          setIsFeedbackOpen(false);
          if (feedbackResolveRef.current) {
            feedbackResolveRef.current(submitted);
            feedbackResolveRef.current = null;
          }
        }}
        user={user}
      />

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        user={user}
        freemiumState={effectiveFreemiumState}
        onCancelSubscription={handleCancelSubscription}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/60 bg-white/40 py-6 text-xs text-slate-500 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              HookZen
            </span>
            <span className="text-slate-300">
              •
            </span>
            <span className="text-slate-500">AI Viral Score Calculator for Shorts, TikTok &amp; Reels</span>
          </div>

          <div className="flex items-center gap-4 font-medium text-slate-600">

            <button onClick={handleOpenBlog} className="hover:text-amber-800 transition-colors flex items-center gap-1 cursor-pointer">
              <BookOpen className="h-3 w-3 text-amber-600" />
              <span>Blog &amp; Guides</span>
            </button>
            <span>•</span>
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-amber-800 transition-colors flex items-center gap-1 cursor-pointer">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}


