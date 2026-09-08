import React from 'react';
import { Flame, Zap, TrendingUp, BarChart3, Target, Eye, ShieldCheck, Play, ArrowUpRight, HelpCircle, ChevronDown, User, Mail } from 'lucide-react';

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

      {/* FAQ & About Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-20 pt-16 border-t border-slate-200/80">

        {/* FAQ */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100/80 border border-slate-200 text-slate-700 shadow-sm">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            <details className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm open:bg-slate-50 transition-all cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-slate-800 list-none flex items-center justify-between outline-none">
                1. Can HookZen help me make better-performing videos?
                <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">
                Absolutely. HookZen analyzes your short-form content and identifies the elements that can influence performance, including your hook, retention potential, script structure, topic relevance, SEO, and engagement. You'll get a Viral Potential Score plus specific recommendations to strengthen your video before you post it. HookZen provides an AI-powered estimate based on your content actual performance can vary depending on factors such as audience, trends, timing, and distribution.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm open:bg-slate-50 transition-all cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-slate-800 list-none flex items-center justify-between outline-none">
                2. How is HookZen different from ChatGPT or Gemini?
                <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">
                HookZen is built specifically for short-form content performance analysis. Instead of starting with a blank chat, HookZen evaluates your content across multiple performance factors and gives you a structured score, retention estimate, weaknesses, strengths, and specific recommendations in one report, saving you time.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm open:bg-slate-50 transition-all cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-slate-800 list-none flex items-center justify-between outline-none">
                3. What does the Viral Potential Score actually mean?
                <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">
                The 0–100 score is an estimate of how strongly your content matches characteristics commonly associated with strong short-form performance. It is not a percentage chance of going viral. Actual results can also depend on your audience, account history, platform, trends, timing, distribution, and viewer behavior.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm open:bg-slate-50 transition-all cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-slate-800 list-none flex items-center justify-between outline-none">
                4. Do I need to upload my actual video?
                <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">
                Not always. You can analyze your script, title, and other content details. However, visual analysis is only performed when visual content is actually provided. HookZen will never pretend it analyzed visuals that it couldn't see.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm open:bg-slate-50 transition-all cursor-pointer">
              <summary className="text-sm sm:text-base font-bold text-slate-800 list-none flex items-center justify-between outline-none">
                5. Why should I pay for HookZen when I can use free AI tools?
                <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">
                You can use general-purpose AI tools, but you'll spend more time explaining what you want and interpreting the results. HookZen is designed to give creators a ready-to-use performance report with scoring, retention analysis, SEO insights, strengths, weaknesses, and optimization recommendations in one workflow.
              </p>
            </details>
          </div>
        </div>

        {/* About Me */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 border border-amber-200 text-amber-800 shadow-sm">
              <User className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Built by a Creator</h3>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-6 sm:p-8 shadow-sm">
            <h4 className="text-lg font-extrabold text-slate-800 mb-4">
              Built by a creator who wanted a better way to improve content.
            </h4>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-medium">
              <p>
                I built HookZen because I noticed how much time creators can spend wondering whether a script is actually strong enough to publish.
              </p>
              <p>
                You can ask a general AI tool for feedback, but getting a detailed, structured analysis often means writing long prompts, asking follow-up questions, and piecing everything together yourself.
              </p>
              <p>
                HookZen was created to make that process simple.
              </p>
              <p>
                It brings the important parts of short-form content analysis into one place — from hooks and retention to structure, SEO, engagement, and actionable improvements.
              </p>
              <p>
                I'm still building and improving HookZen every day, and I'm committed to making it genuinely useful for creators rather than making empty promises about going viral.
              </p>
              <p className="font-bold text-slate-800 pt-1">
                Your content deserves more than a guess. HookZen helps you understand what you can improve before you hit publish.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <h5 className="text-sm font-bold text-slate-800 mb-2">Have a question or feedback?</h5>
              <a href="mailto:support@hookzen.me" className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 border border-amber-200/80 hover:bg-amber-100 transition-colors">
                <Mail className="h-4 w-4" />
                <span>Mail us here</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
