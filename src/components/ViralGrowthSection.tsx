import React from 'react';
import { Flame, Zap, TrendingUp, BarChart3, Target, Eye, ShieldCheck, Play, ArrowUpRight } from 'lucide-react';

export const ViralGrowthSection: React.FC = () => {
  return (
    <section className="mt-14 space-y-10">
      {/* Header Divider */}
      <div className="flex items-center gap-4 text-center">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 border border-amber-200/80 text-amber-900 text-xs font-extrabold uppercase tracking-wider shadow-2xs">
          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
          <span>The Short-Form Viral Growth Engine</span>
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />
      </div>

      {/* 4 Viral Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Zap className="h-5 w-5 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">3s Hook Retention</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Detects pattern interrupts, curiosity gaps, and scroll-stopping triggers in the opening 3 seconds.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
            <span>+70% Drop-off Defense</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
            <TrendingUp className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Script Flow & Structure</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Evaluates sentence cadence, eliminates filler words, and ensures crisp structural rhythm.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg w-fit">
            <span>Zero Fluff Rhythm</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
            <Target className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">FYP Algorithmic SEO</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Evaluates title and transcript keyword density for TikTok Search, YouTube Shorts, and Reels feeds.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit">
            <span>Search &amp; Recommendation Index</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
            <Eye className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Thumbnail CTR Contrast</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Analyzes thumbnail visual framing, focal points, and text contrast for feed click-through-rates.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-fit">
            <span>Visual Frame Stop-Rate</span>
          </div>
        </div>
      </div>

      {/* Virality Score Matrix Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
              <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
              <span>Viral Growth Thresholds</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Understand Your 0-100 Virality Score
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Our scoring model combines hook strength, transcript pacing, search intent keyword density, and visual contrast into an actionable virality index.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 text-center space-y-1">
              <span className="text-lg font-black text-emerald-400">85–100</span>
              <p className="text-[11px] font-extrabold text-white">🔥 High Viral</p>
              <p className="text-[9px] text-slate-400 font-medium">Breakout reach</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 text-center space-y-1">
              <span className="text-lg font-black text-sky-400">70–84</span>
              <p className="text-[11px] font-extrabold text-white">📈 Growth Ready</p>
              <p className="text-[9px] text-slate-400 font-medium">Solid retention</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 text-center space-y-1">
              <span className="text-lg font-black text-amber-400">50–69</span>
              <p className="text-[11px] font-extrabold text-white">⚡ Moderate</p>
              <p className="text-[9px] text-slate-400 font-medium">Minor drop-offs</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 text-center space-y-1">
              <span className="text-lg font-black text-rose-400">0–49</span>
              <p className="text-[11px] font-extrabold text-white">⚠️ Needs Fix</p>
              <p className="text-[9px] text-slate-400 font-medium">Weak hook/pace</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
