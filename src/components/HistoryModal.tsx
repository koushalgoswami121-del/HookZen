import React from 'react';
import { X, History, Trash2, ArrowUpRight, Zap, TrendingUp, Crown, BarChart3, Lock, Sparkles, Cloud, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { ViralScoreResult } from '../types';
import { formatTo12HrTime } from '../utils/formatTime';
import { FreemiumState } from '../utils/freemiumManager';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ViralScoreResult[];
  onSelectHistoryItem: (item: ViralScoreResult) => void;
  onClearHistory: () => void;
  freemiumState?: FreemiumState;
  onOpenPricing?: (reason?: 'pro_feature_locked' | 'limit_reached') => void;
  user?: User | null;
  onSignIn?: () => void;
  isSigningIn?: boolean;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
  freemiumState,
  onOpenPricing,
  user = null,
  onSignIn,
  isSigningIn = false,
}) => {
  if (!isOpen) return null;

  const isPro = freemiumState?.isPro ?? false;

  // Calculate historical metrics
  const totalAudits = history.length;
  const avgScore = totalAudits > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.overallScore, 0) / totalAudits)
    : 0;
  const maxScore = totalAudits > 0
    ? Math.max(...history.map(h => h.overallScore))
    : 0;

  // Score progression series
  const scoreProgress = [...history].reverse().slice(-6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <History className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 id="history-modal-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Analysis History</span>
                {isPro && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 border border-amber-300">
                    <Crown className="h-3 w-3 text-amber-600 fill-amber-400" />
                    <span>Pro Analytics Unlocked</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {history.length} analysis run{history.length === 1 ? '' : 's'} saved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                aria-label="Clear all analysis history"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
              aria-label="Close analysis history modal"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ☁️ GOOGLE ACCOUNT CLOUD SYNC BANNER */}
        {user ? (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3 text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs shrink-0">
                <Cloud className="h-4 w-4 fill-white text-white" />
              </div>
              <div>
                <p className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <span>Google Cloud Sync Active</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  History is saved under <span className="font-bold">{user.email}</span>
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 text-[10px] font-black">
              SYNCED
            </span>
          </div>
        ) : (
          <div className="py-10 px-6 text-center space-y-4 rounded-2xl bg-gradient-to-b from-slate-50 to-amber-50/30 border border-slate-200 shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 border border-amber-300 mx-auto shadow-2xs">
              <Lock className="h-7 w-7 text-amber-800" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Sign In Required to Access History</h3>
              <p className="text-xs text-slate-600 font-medium">
                Audit reports and channel history trends are saved securely under your Google Account so you can access your data across all devices and sessions.
              </p>
            </div>
            {onSignIn && (
              <button
                onClick={onSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                <span>{isSigningIn ? 'Signing in with Google...' : 'Sign in with Google to Access History'}</span>
              </button>
            )}
          </div>
        )}

        {/* 👑 HISTORICAL TREND TRACKER & SCORE COMPARISON GRAPH */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-indigo-50/40 p-4 space-y-3 relative overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Historical Trend Tracker & Channel Growth
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                Avg Score: {avgScore}/100
              </span>
            </div>

            {isPro ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Audits Completed</span>
                    <p className="text-base font-black text-slate-900">{totalAudits}</p>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Avg Virality</span>
                    <p className="text-base font-black text-amber-700">{avgScore}/100</p>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Peak Score</span>
                    <p className="text-base font-black text-emerald-700">{maxScore}/100</p>
                  </div>
                </div>

                {/* Score Evolution Bar Graph */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Recent Score Evolution (Last {scoreProgress.length} Audits)</span>
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <Sparkles className="h-3 w-3 text-emerald-500" />
                      <span>Tracking Improvement</span>
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-2 h-20 bg-white/90 p-2.5 rounded-xl border border-slate-200/80">
                    {scoreProgress.map((item, idx) => {
                      const heightPct = Math.max(15, item.overallScore);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div
                            className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110 flex items-end justify-center pb-1 text-[10px] font-black text-white"
                            style={{
                              height: `${heightPct}%`,
                              backgroundColor: item.overallScore >= 75 ? '#d97706' : item.overallScore >= 60 ? '#3b82f6' : '#64748b'
                            }}
                          >
                            <span className="text-[9px] drop-shadow-xs">{item.overallScore}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-semibold truncate max-w-full">
                            #{idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl bg-white/60 p-4 border border-dashed border-amber-300 text-center space-y-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                  <Lock className="h-3 w-3 text-amber-700" />
                  <span>Historical Trend Tracker Locked</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Compare scores across past video script checks to track your channel growth and viral improvement over time.
                </p>
                {onOpenPricing && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPricing('pro_feature_locked');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Crown className="h-3.5 w-3.5 text-amber-200 fill-amber-200" />
                    <span>Unlock Trend Tracker with Pro ($9.99/mo)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {history.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Zap className="h-8 w-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No saved history yet.</p>
            <p>Run your first video analysis to store results locally.</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-xs hover:border-slate-300 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                      "{item.input.title || 'Untitled Video'}"
                    </span>
                    <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 capitalize">
                      {item.input.industry}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{formatTo12HrTime(item.timestamp)}</span>
                    <span>•</span>
                    <span>{item.input.lengthSeconds}s</span>
                    <span>•</span>
                    <span>{item.pacingAnalysis.wordCount} words</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">{item.overallScore} <span className="text-xs font-normal text-slate-400">/100</span></div>
                    <div className="text-[10px] font-bold text-slate-500">{item.tier}</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 pt-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
