import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import {
  Zap,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  FileText,
  Clock,
  ImageIcon,
  MessageSquare,
  X,
  RotateCcw,
  CheckCircle2,
  Layers,
  Target,
  Lightbulb,
  Eye,
  TrendingDown,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Shuffle,
  Crown,
  FileDown,
  Loader2,
  Bot,
  Wand2,
  AlertTriangle,
  Award,
  HelpCircle,
  HeartHandshake,
  BookOpen,
  Flame,
  Activity,
  Video,
  AlertCircle,
} from 'lucide-react';
import { ViralScoreResult } from '../types';
import { formatTo12HrTime } from '../utils/formatTime';
import { FreemiumState } from '../utils/freemiumManager';
import { analyzeScriptDeterministically } from '../utils/deterministicAnalyzer';

interface AnalysisDashboardProps {
  result: ViralScoreResult;
  onReset?: () => void;
  freemiumState?: FreemiumState;
  onOpenPricing?: (reason?: 'pro_feature_locked' | 'limit_reached') => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  result,
  onReset,
  freemiumState,
  onOpenPricing,
}) => {
  const breakdownRef = React.useRef<HTMLDivElement>(null);
  const [showOptimizedModal, setShowOptimizedModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);
  const [platformTab, setPlatformTab] = useState<'tiktok' | 'reels' | 'shorts'>('tiktok');
  const [activeTipCategory, setActiveTipCategory] = useState<'all' | 'hook' | 'pacing' | 'keywords' | 'visual'>('all');
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [showDeeperAnalysis, setShowDeeperAnalysis] = useState(false);

  useEffect(() => {
    if (result.actionableTips && result.actionableTips.length > 0) {
      setExpandedTipId(result.actionableTips[0].id);
    }
  }, [result]);

  const [animatedScore, setAnimatedScore] = useState(0);

  const {
    overallScore,
    categoryScores,
    hookAnalysis,
    pacingAnalysis,
    keywordAnalysis,
    imageMetrics,
    suggestedTitleAlternatives,
    optimizedScript,
    platformOptimizations,
    input,
  } = result;

  const detailed = result.detailedAnalysis || analyzeScriptDeterministically(input.title || '', input.transcript || '', input.industry || 'General');

  useEffect(() => {
    // Scroll smoothly to top so user sees the score card & score animation first!
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let startTimestamp: number | null = null;
    const duration = 1500; // ms animation duration
    const target = overallScore;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeProgress * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const handle = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(handle);
  }, [overallScore, result.id]);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(optimizedScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyTitle = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopiedTitle(t);
    setTimeout(() => setCopiedTitle(null), 2000);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<false | 'standard' | 'client_detail'>(false);

  const formatHookTextForPdf = (hookText: string): string => {
    if (!hookText) return '';
    let formatted = hookText;

    // 1. Strip off trailing repeated title or snippet after "until you watch this!"
    formatted = formatted.replace(/(until you watch this!)\s+.*/i, '$1');
    formatted = formatted.replace(/(until you watch this\!?)\s+.*/i, '$1');

    // 2. If input.title is provided, replace occurrences of title or short title with [your topic]
    if (input.title && input.title.trim().length > 0) {
      const titleClean = input.title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const titleRegex = new RegExp(`\\b${titleClean}\\b`, 'gi');
      formatted = formatted.replace(titleRegex, '[your topic]');

      // Replace short title (without leading My/The/A)
      const shortTitle = input.title.replace(/^(my|the|a|an)\s+/gi, '').trim();
      if (shortTitle.length > 3) {
        const shortClean = shortTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const shortRegex = new RegExp(`\\b${shortClean}\\b`, 'gi');
        formatted = formatted.replace(shortRegex, '[your topic]');
      }
    }

    // 3. Replace explicit industry name if present in hook
    if (input.industry && input.industry.trim().length > 0) {
      const indRegex = new RegExp(`\\b${input.industry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      formatted = formatted.replace(indRegex, '[your topic]');
    }

    // 4. Replace common industry terms
    const commonTerms = ['Tech', 'Technology', 'Finance', 'Fitness', 'Business', 'Lifestyle', 'Education', 'Gaming', 'Beauty', 'Marketing', 'Crypto', 'E-commerce', 'Health', 'Software', 'Coding'];
    for (const term of commonTerms) {
      const reg = new RegExp(`\\b${term}\\b`, 'gi');
      formatted = formatted.replace(reg, '[your topic]');
    }

    // 5. Replace generic topic/industry tags
    formatted = formatted.replace(/\[(topic name|topic|niche|industry|category|your industry)\]/gi, '[your topic]');

    // 6. Deduplicate repeated [your topic]
    formatted = formatted.replace(/(\[your topic\]\s*)+/gi, '[your topic]');

    return formatted.replace(/\s+/g, ' ').trim();
  };

  const handleDownloadPdf = async (mode: 'standard' | 'client_detail' = 'standard') => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(mode);
    setShowDeeperAnalysis(true);

    const originalTitle = document.title;
    const sanitizedTitle = (input.title || 'Video_Audit_Report').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const fileName = mode === 'client_detail'
      ? `HookZen_Client_Detailed_Audit_${sanitizedTitle}.pdf`
      : `HookZen_Virality_Summary_${sanitizedTitle}.pdf`;
    document.title = fileName;

    await new Promise((resolve) => setTimeout(resolve, 300));

    const targetId = mode === 'client_detail' ? 'pdf-client-detail-template' : 'pdf-standard-template';
    const pdfTemplate = document.getElementById(targetId);
    const fallbackElement = document.getElementById('dashboard-content');
    const reportElement = pdfTemplate || fallbackElement;

    try {
      if (!reportElement) throw new Error('Dashboard element not found');

      const canvas = await html2canvas(reportElement, {
        scale: 2.0,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#F8FAFC',
        windowWidth: 1050,
        onclone: (clonedDoc) => {
          const clonedTemplate = clonedDoc.getElementById(targetId);
          if (clonedTemplate) {
            clonedTemplate.classList.remove('hidden');
            clonedTemplate.style.display = 'block';
            clonedTemplate.style.position = 'relative';
            clonedTemplate.style.top = '0';
            clonedTemplate.style.width = '1000px';
            clonedTemplate.style.margin = '0 auto';
            clonedTemplate.style.padding = '0';
            clonedTemplate.style.background = '#F8FAFC';
          }
          const noPrints = clonedDoc.querySelectorAll('.no-print, button, [role="dialog"]');
          noPrints.forEach((np) => ((np as HTMLElement).style.display = 'none'));
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(fileName);
    } catch (err) {
      console.warn('html2canvas capture failed, generating vector jsPDF report:', err);

      try {
        const doc = new jsPDF('p', 'pt', 'letter');

        // Executive Dark Header
        doc.setFillColor(9, 13, 22);
        doc.rect(0, 0, 612, 85, 'F');

        doc.setFillColor(245, 158, 11);
        doc.rect(0, 82, 612, 3, 'F');

        doc.setTextColor(245, 158, 11);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('HOOKZEN PRO', 40, 42);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(mode === 'client_detail' ? 'EXECUTIVE CLIENT DETAILED MISTAKES AUDIT' : 'EXECUTIVE VIRALITY AUDIT REPORT', 40, 58);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.text(`CONFIDENTIAL • Date: ${new Date().toLocaleDateString()}`, 430, 42);

        // Video Information
        let y = 115;
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const displayTitle = (input.title || 'Untitled Video Script').slice(0, 55);
        doc.text(`Video Title: "${displayTitle}"`, 40, y);

        y += 20;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Topic / Industry: ${input.industry || 'General Short-Form Content'}`, 40, y);

        // Virality Score Box
        y += 25;
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(40, y, 532, 75, 10, 10, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('GO VIRAL INDEX SCORE:', 60, y + 32);

        doc.setTextColor(245, 158, 11);
        doc.setFontSize(32);
        doc.text(`${overallScore}/100`, 240, y + 38);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`VIRALITY POTENTIAL: ${potentialInfo.label}  •  GRADE: ${detailed.letterGrade}`, 60, y + 58);

        // Breakdown Scores
        y += 100;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Key Category Performance Metrics:', 40, y);

        y += 22;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`• First 3s Hook Power: ${categoryScores.hookScore}/100`, 50, y);
        doc.text(`• Curiosity Gap Score: ${curiosityScore}/100`, 50, y + 18);
        doc.text(`• Script Pacing Score: ${categoryScores.pacingScore}/100`, 50, y + 36);
        doc.text(`• SEO Keyword Density: ${categoryScores.keywordScore}/100`, 50, y + 54);

        // Recommended Hook Variations Section
        y += 90;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Recommended High-Converting Viral Hook Variations:', 40, y);

        y += 20;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);

        const hookList = (result.suggestedTitleAlternatives && result.suggestedTitleAlternatives.length > 0)
          ? result.suggestedTitleAlternatives.map(formatHookTextForPdf)
          : [
            "Everyone is doing [your topic] completely wrong. Here is what actually works instead...",
            "3 Mistakes Everyone Makes in [your topic]",
            "Why Nobody Is Talking About This [your topic] Hack",
            "How to Get 10x Results in [your topic] Faster",
            "Stop Doing [your topic] Right Now Until You Watch This"
          ];

        hookList.slice(0, 5).forEach((titleAlt, i) => {
          const lines = doc.splitTextToSize(`${i + 1}. "${titleAlt}"`, 510);
          doc.text(lines, 50, y);
          y += (lines.length * 14) + 6;
        });

        doc.save(fileName);
      } catch (fallbackErr) {
        console.error('All PDF generation methods failed:', fallbackErr);
        window.print();
      }
    } finally {
      document.title = originalTitle;
      setIsGeneratingPdf(false);
    }
  };

  const handleToggleDeeperAnalysis = () => {
    if (!showDeeperAnalysis) {
      setShowDeeperAnalysis(true);
      setTimeout(() => {
        breakdownRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setShowDeeperAnalysis(false);
    }
  };

  // Virality Potential text & color
  const getPotentialLabel = (score: number) => {
    if (score >= 85) return { label: 'VERY HIGH', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (score >= 70) return { label: 'HIGH', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' };
    if (score >= 50) return { label: 'MODERATE', badgeBg: 'bg-blue-100 text-blue-900 border-blue-300' };
    return { label: 'LOW', badgeBg: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  const potentialInfo = getPotentialLabel(overallScore);

  // Video Duration in Seconds (Default ~30s if not set)
  const videoDurationSec = input.lengthSeconds || Math.max(15, Math.min(120, Math.round((pacingAnalysis.wordCount || 10) / 2.6) + 10));

  // Audience Retention Curve Data Points
  const hookScore = Math.round(Number(categoryScores.hookScore) || 50);
  const pacingScore = Math.round(Number(categoryScores.pacingScore) || 50);
  const curiosityScore = Math.round(Number(categoryScores.curiosityScore ?? detailed?.curiosity?.score) || (overallScore > 0 ? Math.min(98, Math.max(10, overallScore + 3)) : 70));
  const keywordScore = Math.round(Number(categoryScores.keywordScore) || 50);
  const overall = overallScore || 50;

  // 3-second hook retention: 50% base + up to 42% from hookScore
  const retention3s = Math.round(52 + (hookScore / 100) * 42);

  // Mid-video retention (at ~50% duration)
  const retentionMid = Math.max(20, Math.round(retention3s * (0.62 + (pacingScore / 100) * 0.32)));

  // Completion rate (at 100% duration)
  const retentionEnd = Math.max(12, Math.round(retentionMid * (0.55 + (overall / 100) * 0.38)));

  const t3 = Math.min(3, Math.round(videoDurationSec * 0.15));
  const t25 = Math.round(videoDurationSec * 0.3);
  const t50 = Math.round(videoDurationSec * 0.5);
  const t75 = Math.round(videoDurationSec * 0.75);

  const retentionData = [
    { second: '0s', secNum: 0, retention: 100, stage: 'Start' },
    { second: `${t3}s`, secNum: t3, retention: retention3s, stage: 'The Hook (3s)' },
    { second: `${t25}s`, secNum: t25, retention: Math.round(retention3s - (retention3s - retentionMid) * 0.45), stage: 'Early Transition' },
    { second: `${t50}s`, secNum: t50, retention: retentionMid, stage: 'Mid-Video Body' },
    { second: `${t75}s`, secNum: t75, retention: Math.round(retentionMid - (retentionMid - retentionEnd) * 0.55), stage: 'Pre-CTA' },
    { second: `${videoDurationSec}s`, secNum: videoDurationSec, retention: retentionEnd, stage: 'Video Completion' },
  ];

  // Semi-circle Arc Gauge parameters
  const radius = 40;
  const arcLength = Math.PI * radius; // ~125.66
  const filledLength = (animatedScore / 100) * arcLength;
  const strokeDashoffset = arcLength - filledLength;

  return (
    <div id="dashboard-content" className="space-y-7 pb-12">
      {/* WHITE-LABEL PRINT HEADER FOR AGENCY PDF EXPORTS */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider">
              {freemiumState?.isPro ? 'HookZen Pro Agency Audit' : 'HookZen Virality Report'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              White-Label Short-Form Video Virality & Retention Audit Document
            </p>
          </div>
          <div className="text-right text-xs text-slate-700 font-bold">
            <p>Target Platform: <span className="capitalize font-black text-slate-900">{input.targetPlatform}</span></p>
            <p>Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* 1. REPORT TITLE */}
      <div className="text-center space-y-1.5 pt-2">
        <h1 className="font-serif-display text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl tracking-tight leading-tight">
          Performance Analysis Report
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span>AI-powered short-form performance analyzer and retention forecast.</span>
          {result.timestamp && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/80">
              <Clock className="h-3 w-3 text-amber-600" />
              <span>{formatTo12HrTime(result.timestamp)}</span>
            </span>
          )}
        </p>
      </div>

      {/* 2. TOP SCORE BANNER CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-white/90 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Go Viral Score Intro */}
          <div className="md:col-span-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 border border-amber-200">
                <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Viral Potential Score
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              A data-informed estimate of short-form performance potential based on content signals.
            </p>
            <div className="mt-3 bg-amber-50 rounded-lg p-2.5 border border-amber-200 flex items-start gap-2 shadow-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-900 leading-tight font-medium">
                <strong>Important:</strong> This score is an AI estimate based on content characteristics. It is not a guarantee of views or virality. Actual performance can vary significantly based on audience, distribution, and timing.
              </p>
            </div>
          </div>

          {/* Center Column: Semi-Circular Arc Gauge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center py-2 border-y md:border-y-0 md:border-x border-slate-200/60 px-4">
            <div className="relative w-52 h-28 flex items-end justify-center">
              <svg className="w-52 h-28 overflow-visible" viewBox="0 0 100 55">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="65%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                {/* Background Arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Foreground Filled Arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Score Text */}
              <div className="absolute bottom-1 flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {animatedScore}<span className="text-xl font-bold text-slate-500">/100</span>
                </span>
              </div>
            </div>

            {/* Bottom Virality Potential & Grade Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <div className={`rounded-full border px-4 py-1 text-xs font-black uppercase tracking-wider ${potentialInfo.badgeBg} shadow-2xs`}>
                POTENTIAL: {potentialInfo.label}
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider shadow-2xs bg-slate-100 text-slate-700 border-slate-300`}>
                CONFIDENCE: {result.confidence || 'MEDIUM'}
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider shadow-2xs ${detailed.letterGrade === 'A+'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-400'
                : detailed.letterGrade === 'A'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : detailed.letterGrade === 'B'
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : detailed.letterGrade === 'C'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                GRADE: {detailed.letterGrade}
              </div>
            </div>
          </div>

          {/* Right Column: Analyzed Title & Metadata Box */}
          <div className="md:col-span-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="text-slate-500">🔗</span>
              <span>Analyzed Video</span>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-2xs space-y-2">
              <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-3">
                <span className="text-slate-500 font-medium">Title: </span>
                {input.title || 'Untitled Video'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/90 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200 shadow-2xs">
                  <span>🌐</span>
                  <span>
                    {!input.language || input.language === 'all'
                      ? 'All Languages Supported'
                      : input.language.toUpperCase()}
                  </span>
                </span>
                {input.industry && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                    <span className="capitalize">{input.industry}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PREDICTED AUDIENCE RETENTION GRAPH */}
      <div className="relative overflow-hidden rounded-3xl border border-white/90 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-600" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Predicted Viewer Retention
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              This is a model estimate based on your script/video characteristics, not observed audience data.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <div className="h-2.5 w-6 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600" />
            <span>Viewer Stay %</span>
          </div>
        </div>

        {/* Recharts Area Chart Container */}
        <div className="relative h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={retentionData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#d97706" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={true} />
              <XAxis
                dataKey="second"
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                label={{ value: `Video Duration (${videoDurationSec} Seconds)`, position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 12, fontWeight: 700 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                tickFormatter={(val) => `${val}%`}
                axisLine={false}
                label={{ value: 'Audience Retention (%)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 12, fontWeight: 700 }}
              />
              <Tooltip
                formatter={(val: any) => [`${val}% Viewers Retained`, 'Retention Rate']}
                labelFormatter={(label, items) => {
                  const stage = items && items[0] ? items[0].payload.stage : '';
                  return `Timestamp: ${label} (${stage})`;
                }}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="retention"
                stroke="#d97706"
                strokeWidth={3.5}
                fillOpacity={1}
                fill="url(#retentionGradient)"
              />
              {/* Highlight Reference Dots */}
              <ReferenceDot x={`${t3}s`} y={retention3s} r={6} fill="#f59e0b" stroke="#ffffff" strokeWidth={2.5} />
              <ReferenceDot x={`${t50}s`} y={retentionMid} r={6} fill="#d97706" stroke="#ffffff" strokeWidth={2.5} />
              <ReferenceDot x={`${videoDurationSec}s`} y={retentionEnd} r={6} fill="#6366f1" stroke="#ffffff" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Retention Stage Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
          {/* Stage 1: Hook Drop (0s - 3s) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Hook Phase (0s - 3s)
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${retention3s >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                {retention3s}% Retained
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {retention3s >= 75 ? 'Strong Early Retention' : 'Early Viewer Scroll-Away'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {retention3s >= 75
                ? 'Your opening hook captures attention quickly. Most viewers stay past 3s.'
                : 'Over 30%+ of viewers scroll away in first 3 seconds. Strengthen your opening curiosity line or visual pattern interrupt.'}
            </p>
          </div>

          {/* Stage 2: Mid-Video Retention */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Mid-Video ({t50}s)
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${retentionMid >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                {retentionMid}% Retained
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {retentionMid >= 50 ? 'Steady Engagement Flow' : 'Midway Attention Drop'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {retentionMid >= 50
                ? 'Pacing maintains solid attention through the middle of the script.'
                : 'Script pacing slows down around midway. Trim filler words or add visual transitions to maintain momentum.'}
            </p>
          </div>

          {/* Stage 3: Completion Rate */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Completion Rate ({videoDurationSec}s)
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${retentionEnd >= 35 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'
                }`}>
                {retentionEnd}% Finish
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {retentionEnd >= 35 ? 'High Algorithm Push' : 'Low Full Watch-Through'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {retentionEnd >= 35
                ? 'High completion rate tells short-form algorithms to push your video to broader FYP feeds.'
                : 'Fewer viewers reach the end. End with a crisp call-to-action or looping sentence.'}
            </p>
          </div>
        </div>

        {/* Action Button Below Graph: Analyse Deeper & Tips to Improve */}
        <div className="flex items-center justify-center pt-3 border-t border-slate-200/60 no-print">
          <button
            onClick={handleToggleDeeperAnalysis}
            className="flex items-center gap-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{showDeeperAnalysis ? 'Hide Analysis & Tips' : 'Analyse Deeper & Tips to Improve'}</span>
            {showDeeperAnalysis ? (
              <ChevronUp className="h-4 w-4 text-amber-400 ml-1" />
            ) : (
              <ArrowDown className="h-4 w-4 text-amber-400 animate-bounce ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* 5. SPLIT CONTAINER: ANALYSIS BREAKDOWN + TOP IMPROVEMENT TIPS */}
      {
        showDeeperAnalysis && (
          <>
            <div ref={breakdownRef} id="breakdown-section" className="grid grid-cols-1 gap-7 lg:grid-cols-12 scroll-mt-6 animate-in fade-in duration-200">
              {/* Left Column: Analysis Breakdown (5 cols) */}
              <div className="lg:col-span-5 relative overflow-hidden rounded-3xl border border-white/90 bg-white/70 p-6 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Analysis Breakdown
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/80">
                    Key Metrics
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Card 1: Opening Hook */}
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2.5 hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-sm font-bold text-slate-900">First 3s Hook</span>
                      </div>
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${categoryScores.hookScore >= 75
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        {categoryScores.hookScore}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-900">{hookAnalysis.hookType}: </strong>
                      {categoryScores.hookScore >= 65
                        ? 'Captures curiosity early to prevent viewer scroll-away.'
                        : 'Low early urgency. Try opening with a bold statement or direct question.'}
                    </p>
                  </div>

                  {/* Card 2: Script Structure */}
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2 hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="text-sm font-bold text-slate-900">Script Structure</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${categoryScores.pacingScore >= 75
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                          {categoryScores.pacingScore}/100
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {categoryScores.pacingScore >= 75
                        ? `Good sentence rhythm and structural balance across your transcript.`
                        : categoryScores.pacingScore >= 45
                          ? `Script pacing is medium; sentence structure needs improvement for better viewer retention.`
                          : `Script structure looks unorganized with poor pacing and weak sentence rhythm.`}
                    </p>

                    {pacingAnalysis.structuralBeats.fluffWordCount > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-700">Filler Words:</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 font-mono">
                          {keywordAnalysis.fluffWords.slice(0, 3).join(', ')} ({pacingAnalysis.structuralBeats.fluffWordCount})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Niche & SEO Alignment + Pro FYP Keyword Density Matrix */}
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2.5 hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500 shrink-0" />
                        <span className="text-sm font-bold text-slate-900">SEO & FYP Algorithm</span>
                      </div>
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${categoryScores.keywordScore >= 70
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        {categoryScores.keywordScore}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {keywordAnalysis.detectedIndustryKeywords.length > 0 ? (
                        <span>Detected high-intent topic keywords for search indexing.</span>
                      ) : (
                        <span>Add explicit niche topic words in title/script so algorithms push to the right FYP.</span>
                      )}
                    </p>

                    {/* Pro FYP Keyword Density Breakdown */}
                    {freemiumState?.isPro ? (
                      <div className="mt-2 rounded-xl bg-purple-50/70 border border-purple-200/80 p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-950">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            FYP SEO Keyword Density Matrix
                          </span>
                          <span className="bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-mono">
                            {((keywordAnalysis.detectedIndustryKeywords.length * 3) / Math.max(1, pacingAnalysis.wordCount || 15) * 100).toFixed(1)}% Density
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="bg-white/90 p-2 rounded-lg border border-purple-100">
                            <span className="text-slate-500 font-semibold block text-[10px]">TikTok FYP Index</span>
                            <strong className="text-purple-900 font-bold">
                              {categoryScores.keywordScore >= 70 ? 'High Discoverability' : 'Moderate Indexing'}
                            </strong>
                          </div>
                          <div className="bg-white/90 p-2 rounded-lg border border-purple-100">
                            <span className="text-slate-500 font-semibold block text-[10px]">Shorts SEO Rank</span>
                            <strong className="text-purple-900 font-bold">Top 15% Niche</strong>
                          </div>
                        </div>

                        {keywordAnalysis.detectedIndustryKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {keywordAnalysis.detectedIndustryKeywords.map((kw, i) => (
                              <span key={i} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-200 shadow-2xs">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => onOpenPricing && onOpenPricing('pro_feature_locked')}
                        className="mt-2 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 p-2.5 text-center cursor-pointer hover:bg-purple-100/60 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-purple-950">
                          <Crown className="h-3.5 w-3.5 fill-purple-400 text-purple-600" />
                          <span>Unlock FYP SEO Keyword Density Matrix</span>
                        </div>
                        <p className="text-[11px] text-purple-800 font-medium">
                          Analyze TikTok & Shorts search engine index density and high-volume tags with Pro.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card 4: Thumbnail & Visual Format */}
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2 hover:border-cyan-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-cyan-600 shrink-0" />
                        <span className="text-sm font-bold text-slate-900">Visual Format</span>
                      </div>
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${categoryScores.visualScore >= 70
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                        {categoryScores.visualScore}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {imageMetrics.hasImage ? (
                        imageMetrics.isNineToSixteen
                          ? 'Full-screen 9:16 vertical ratio maximizes smartphone feeds.'
                          : 'Horizontal frame causes black bars. Vertical 9:16 yields 35%+ more clicks.'
                      ) : (
                        'Upload a 9:16 vertical cover image with bold text overlay for higher feed CTR.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Top Improvement Tips (7 cols) */}
              <div className="lg:col-span-7 relative overflow-hidden rounded-3xl border border-white/90 bg-white/70 p-6 shadow-xl backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Actionable Optimization Tips
                    </h3>
                  </div>
                  {result.actionableTips && result.actionableTips.length > 0 && (
                    <span className="text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-200 px-3 py-1 rounded-full">
                      +{result.actionableTips.reduce((sum, t) => sum + (t.impactPts || 0), 0)} Total Potential Points
                    </span>
                  )}
                </div>

                {/* Category Filter Tabs */}
                {result.actionableTips && result.actionableTips.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: 'all', label: 'All Tips', count: result.actionableTips.length },
                      { id: 'hook', label: 'Hook', count: result.actionableTips.filter(t => t.category === 'hook').length },
                      { id: 'pacing', label: 'Pacing', count: result.actionableTips.filter(t => t.category === 'pacing').length },
                      { id: 'keywords', label: 'SEO', count: result.actionableTips.filter(t => t.category === 'keywords').length },
                      { id: 'visual', label: 'Thumbnail', count: result.actionableTips.filter(t => t.category === 'visual').length },
                    ]
                      .filter(cat => cat.id === 'all' || cat.count > 0)
                      .map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveTipCategory(cat.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTipCategory === cat.id
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                            }`}
                        >
                          <span>{cat.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTipCategory === cat.id
                            ? 'bg-amber-400 text-slate-950 font-extrabold'
                            : 'bg-slate-200/80 text-slate-700'
                            }`}>
                            {cat.count}
                          </span>
                        </button>
                      ))}
                  </div>
                )}

                {/* Tips List Accordion */}
                <div className="space-y-2.5">
                  {(() => {
                    const tips = result.actionableTips || [];
                    const filteredTips = activeTipCategory === 'all'
                      ? tips
                      : tips.filter(t => t.category === activeTipCategory);

                    if (filteredTips.length === 0) {
                      return (
                        <div className="p-5 text-center text-xs sm:text-sm font-medium text-slate-500 rounded-2xl bg-slate-50 border border-slate-200/80">
                          No tips in this category. Your content is performing well here!
                        </div>
                      );
                    }

                    return filteredTips.map((tip) => {
                      const isExpanded = expandedTipId === tip.id;
                      let icon = <MessageSquare className="h-4 w-4 text-slate-700" />;
                      let categoryLabel = "General";

                      if (tip.category === 'visual') {
                        icon = <ImageIcon className="h-4 w-4 text-amber-700" />;
                        categoryLabel = "Thumbnail";
                      } else if (tip.category === 'pacing') {
                        icon = <Clock className="h-4 w-4 text-indigo-700" />;
                        categoryLabel = "Pacing";
                      } else if (tip.category === 'keywords') {
                        icon = <Sparkles className="h-4 w-4 text-purple-700" />;
                        categoryLabel = "SEO";
                      } else if (tip.category === 'hook') {
                        icon = <Zap className="h-4 w-4 text-rose-700" />;
                        categoryLabel = "Hook";
                      }

                      return (
                        <div
                          key={tip.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${isExpanded
                            ? 'border-amber-300 bg-white shadow-xs'
                            : 'border-slate-200/80 bg-white/80 hover:border-slate-300 hover:bg-white'
                            }`}
                        >
                          {/* Clickable Header */}
                          <button
                            onClick={() => setExpandedTipId(isExpanded ? null : tip.id)}
                            className="w-full flex items-center justify-between p-3.5 text-left gap-3 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                                {icon}
                              </div>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wide shrink-0">
                                {categoryLabel}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {tip.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${tip.priority === 'critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                +{tip.impactPts} pts
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {/* Expandable Details Body */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                                {tip.description}
                              </p>

                              {tip.exampleFix && (
                                <div className="flex items-start gap-2 text-xs text-slate-800 bg-amber-50/80 rounded-xl p-3 border border-amber-200/70">
                                  <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold text-slate-900">Recommended Fix: </span>
                                    <span>{tip.exampleFix}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* 6. STRENGTHS & WEAKNESSES DIAGNOSTICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Strengths Card */}
              <div className="rounded-3xl border border-emerald-200/90 bg-emerald-50/40 p-6 shadow-md backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 border-b border-emerald-200 pb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Script Strengths ({detailed.strengths.length})
                  </h3>
                </div>
                <ul className="space-y-2 text-xs font-semibold text-slate-800">
                  {detailed.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 rounded-xl bg-white/90 p-3 border border-emerald-100 shadow-2xs">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses Card */}
              <div className="rounded-3xl border border-rose-200/90 bg-rose-50/40 p-6 shadow-md backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 border-b border-rose-200 pb-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Areas to Improve ({detailed.weaknesses.length})
                  </h3>
                </div>
                <ul className="space-y-2 text-xs font-semibold text-slate-800">
                  {detailed.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 rounded-xl bg-white/90 p-3 border border-rose-100 shadow-2xs">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </>
        )
      }

      {/* 5. PRO FREEMIUM BANNER */}
      {
        onOpenPricing && (
          <div className="rounded-3xl border border-amber-300/80 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-6 sm:p-7 text-white shadow-lg no-print">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-black text-amber-100 backdrop-blur-xs">
                  <Crown className="h-3.5 w-3.5 fill-amber-300 text-amber-200" />
                  <span>{freemiumState?.isPro ? 'HookZen Pro Active' : 'HookZen Pro Tier'}</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {freemiumState?.isPro ? 'You have Unlimited Pro Intelligence Unlocked!' : 'Unlock Unlimited Video Audits & AI Script Doctor'}
                </h3>
                <p className="text-xs text-amber-100 font-medium max-w-xl">
                  {freemiumState?.isPro
                    ? 'Perform unlimited analyses, generate custom high-retention hooks, and enjoy a 100% ad-free experience.'
                    : 'Get unlimited daily checks, AI hook auto-rewrites, and a 100% ad-free experience for $9.99/mo.'}
                </p>
              </div>

              <button
                onClick={() => onOpenPricing(freemiumState?.isPro ? undefined : 'pro_feature_locked')}
                className="shrink-0 rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-slate-900 hover:bg-amber-50 transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Crown className="h-4 w-4 text-amber-600 fill-amber-500" />
                <span>{freemiumState?.isPro ? 'Manage Pro Subscription' : 'Upgrade to Pro ($9.99/mo)'}</span>
              </button>
            </div>
          </div>
        )
      }

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 no-print">
        {/* Single Button: Download Report */}
        <button
          onClick={() => handleDownloadPdf('client_detail')}
          disabled={Boolean(isGeneratingPdf)}
          className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 disabled:opacity-60 px-7 py-3.5 text-sm font-extrabold text-white shadow-lg hover:brightness-105 transition-all cursor-pointer active:scale-[0.98]"
        >
          <Download className={`h-4.5 w-4.5 text-amber-100 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
          <span>{isGeneratingPdf ? 'Downloading Report...' : 'Download Report'}</span>
        </button>

        {/* Button 2: Start a New Analysis */}
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-5 py-3.5 text-xs font-bold text-slate-800 hover:bg-white hover:border-slate-300 shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4 text-slate-600" />
            <span>Start New Analysis</span>
          </button>
        )}
      </div>

      {/* 6. OPTIMIZED SCRIPT & PLAN MODAL */}
      {
        showOptimizedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Sparkles className="h-5 w-5 fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Optimized Script & Growth Plan
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Fluff-free script rewrite and publishing recommendations
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowOptimizedModal(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                {/* High-Converting Title Options */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      High-Converting Title Ideas
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {detailed.scoredTitles.slice(0, 5).map((titleItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs font-bold text-slate-800 hover:bg-white transition-all gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-slate-900 font-extrabold">"{titleItem.title}"</span>
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {titleItem.reason}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyTitle(titleItem.title)}
                          className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800 cursor-pointer transition-all shrink-0"
                        >
                          {copiedTitle === titleItem.title ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedTitle === titleItem.title ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optimized Script Rewrite */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-600" />
                      Fluff-Free Script Rewrite
                    </h4>
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer transition-all shadow-2xs"
                    >
                      {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={optimizedScript}
                    rows={8}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100 leading-relaxed shadow-inner focus:outline-none"
                  />
                </div>

                {/* Platform Publishing Checklist */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-600" />
                      Platform Publishing Checklist
                    </h4>
                    <div className="flex items-center gap-1 text-xs">
                      {(['tiktok', 'reels', 'shorts'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPlatformTab(p)}
                          className={`rounded-full px-3 py-0.5 text-xs font-bold capitalize transition-all cursor-pointer ${platformTab === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    {platformOptimizations[platformTab].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3 font-semibold text-slate-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 pt-4 text-right">
                <button
                  onClick={() => setShowOptimizedModal(false)}
                  className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* TEMPLATE 1: STANDARD VIRALITY SUMMARY PDF TEMPLATE */}
      <div
        id="pdf-standard-template"
        className="hidden pointer-events-none fixed -top-[9999px] left-0 w-[1000px] bg-[#F8FAFC] text-slate-900 font-sans border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* HEADER / BRANDING BANNER */}
        <div className="bg-[#0B1220] text-white p-7 border-b-2 border-amber-500 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-1.5">
                HOOKZEN <span className="text-amber-400">PRO</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                EXECUTIVE VIRALITY AUDIT REPORT
              </p>
            </div>
            <div className="text-right flex items-center gap-6">
              <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-sm">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-black text-white tracking-wider uppercase">CONFIDENTIAL</span>
              </div>
              <p className="text-xs font-bold text-slate-300">
                Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* VIDEO TITLE METADATA SECTION */}
        <div className="p-7 bg-[#F8FAFC] border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                <svg className="w-6 h-6 fill-amber-500" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">Video Title</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {input.title || 'My Morning Routine For Better Productivity and Energy'}
                </h2>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-xs font-bold text-slate-500">Topic / Industry:</span>
                  <span className="bg-amber-100/90 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-0.5 rounded-full capitalize">
                    {input.industry || 'Lifestyle'}
                  </span>
                </div>
              </div>
            </div>
            {/* Minimalist Sun/Mountain Graphic */}
            <div className="w-48 h-24 relative opacity-90 pointer-events-none">
              <svg viewBox="0 0 200 120" className="w-full h-full">
                <circle cx="155" cy="52" r="32" fill="#FDE68A" opacity="0.8" />
                <path d="M 10 105 Q 75 45 135 105 Q 165 75 200 105 L 200 120 L 10 120 Z" fill="#E2E8F0" opacity="0.7" />
                <path d="M 50 105 Q 115 55 180 105 L 200 105 L 200 120 L 50 120 Z" fill="#CBD5E1" opacity="0.6" />
                {/* Flying Birds */}
                <path d="M 135 28 Q 138 23 141 28 Q 144 23 147 28" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M 165 20 Q 167 16 169 20 Q 171 16 173 20" fill="none" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* GO VIRAL INDEX SCORE CARD */}
        <div className="p-7 bg-[#F8FAFC]">
          <div className="bg-[#0B1220] rounded-2xl p-6 text-white shadow-xl flex items-center justify-between border border-slate-800">
            {/* Left */}
            <div className="pr-6">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                GO VIRAL INDEX SCORE
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-amber-400 tracking-tight">{overallScore}</span>
                <span className="text-3xl font-bold text-white">/100</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-16 w-px bg-slate-800" />

            {/* Middle */}
            <div className="px-6 space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">
                  VIRALITY POTENTIAL
                </span>
                <span className={`inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${overallScore < 40 ? 'bg-red-950/90 text-red-400 border border-red-900/60' :
                  overallScore < 70 ? 'bg-amber-950/90 text-amber-400 border border-amber-900/60' :
                    'bg-emerald-950/90 text-emerald-400 border border-emerald-900/60'
                  }`}>
                  {potentialInfo.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  GRADE
                </span>
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black ${['A+', 'A'].includes(detailed.letterGrade) ? 'border-emerald-500 text-emerald-400' :
                  ['B', 'C'].includes(detailed.letterGrade) ? 'border-amber-500 text-amber-400' :
                    'border-red-500 text-red-500'
                  }`}>
                  {detailed.letterGrade}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-16 w-px bg-slate-800" />

            {/* Right Gauge */}
            <div className="pl-6 flex flex-col items-center justify-center min-w-[150px]">
              <svg viewBox="0 0 100 55" className="w-32 h-16">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none"
                  stroke={overallScore < 40 ? '#EF4444' : overallScore < 70 ? '#F59E0B' : '#10B981'}
                  strokeWidth="10"
                  strokeDasharray="126"
                  strokeDashoffset={126 - (126 * Math.min(overallScore, 100)) / 100}
                  strokeLinecap="round"
                />
                <g transform={`rotate(${-90 + (Math.min(overallScore, 100) * 180) / 100}, 50, 50)`}>
                  <line x1="50" y1="50" x2="18" y2="50" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />
                </g>
              </svg>
              <span className="text-xs font-bold text-slate-300 mt-1">
                {potentialInfo.label} Potential
              </span>
            </div>
          </div>
        </div>

        {/* KEY CATEGORY PERFORMANCE METRICS */}
        <div className="px-7 py-3 bg-[#F8FAFC]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Key Category Performance Metrics
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm mb-1.5">
                  ⚡
                </div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  First 3s Hook Power
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-purple-700">{categoryScores.hookScore}</span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${categoryScores.hookScore}%` }} />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm mb-1.5">
                  ?
                </div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  Curiosity Gap Score
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-amber-600">{curiosityScore}</span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${curiosityScore}%` }} />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm mb-1.5">
                  📄
                </div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  Script Pacing Score
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-blue-600">{categoryScores.pacingScore}</span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${categoryScores.pacingScore}%` }} />
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm mb-1.5">
                  🔍
                </div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  SEO Keyword Density
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-emerald-600">{categoryScores.keywordScore}</span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${categoryScores.keywordScore}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECOMMENDED HIGH-CONVERTING VIRAL HOOK VARIATIONS */}
        <div className="px-7 py-4 bg-[#F8FAFC]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Recommended High-Converting Viral Hook Variations
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {(result.suggestedTitleAlternatives && result.suggestedTitleAlternatives.length > 0
              ? result.suggestedTitleAlternatives.map(formatHookTextForPdf)
              : [
                "Stop doing [your topic] until you watch this!",
                "Everyone is doing [your topic] completely wrong. Here is what actually works instead...",
                "The 1-minute [your topic] trick that 95% of creators have no idea exists!",
                "How to get 10x results in [your topic] without wasting hours...",
                "If you are struggling with [your topic], save this video right now!"
              ]
            ).slice(0, 5).map((hookText, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    "{hookText}"
                  </p>
                </div>
                <span className="text-amber-500 text-xs shrink-0">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-[#F8FAFC] border-t border-slate-200/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>This report is confidential and intended for authorized use only.</span>
          </div>
        </div>
      </div>

      {/* TEMPLATE 2: EXECUTIVE CLIENT DETAILED MISTAKES AUDIT PDF TEMPLATE (EXACTLY MATCHES PROMPT DESIGN) */}
      <div
        id="pdf-client-detail-template"
        className="hidden pointer-events-none fixed -top-[9999px] left-0 w-[1000px] bg-[#F8FAFC] text-slate-900 font-sans border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* HEADER / BRANDING BANNER */}
        <div className="bg-[#0B1220] text-white p-7 border-b-2 border-amber-500 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-1.5">
                HOOKZEN <span className="text-amber-400">PRO</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                EXECUTIVE CLIENT DETAILED MISTAKES AUDIT
              </p>
            </div>
            <div className="text-right flex items-center gap-6">
              <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-sm">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-black text-white tracking-wider uppercase">CONFIDENTIAL</span>
              </div>
              <p className="text-xs font-bold text-slate-300">
                Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* VIDEO TITLE METADATA SECTION */}
        <div className="p-7 bg-[#F8FAFC] border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                <svg className="w-6 h-6 fill-amber-500" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">Video Title</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {input.title || 'My Morning Routine For Better Productivity and Energy'}
                </h2>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-xs font-bold text-slate-500">Topic / Industry:</span>
                  <span className="bg-amber-100/90 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-0.5 rounded-full capitalize">
                    {input.industry || 'Lifestyle'}
                  </span>
                </div>
              </div>
            </div>
            {/* Minimalist Sun/Mountain Graphic */}
            <div className="w-48 h-24 relative opacity-90 pointer-events-none">
              <svg viewBox="0 0 200 120" className="w-full h-full">
                <circle cx="155" cy="52" r="32" fill="#FDE68A" opacity="0.8" />
                <path d="M 10 105 Q 75 45 135 105 Q 165 75 200 105 L 200 120 L 10 120 Z" fill="#E2E8F0" opacity="0.7" />
                <path d="M 50 105 Q 115 55 180 105 L 200 105 L 200 120 L 50 120 Z" fill="#CBD5E1" opacity="0.6" />
                {/* Flying Birds */}
                <path d="M 135 28 Q 138 23 141 28 Q 144 23 147 28" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M 165 20 Q 167 16 169 20 Q 171 16 173 20" fill="none" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* GO VIRAL INDEX SCORE CARD */}
        <div className="p-7 bg-[#F8FAFC]">
          <div className="bg-[#0B1220] rounded-2xl p-6 text-white shadow-xl flex items-center justify-between border border-slate-800">
            {/* Left */}
            <div className="pr-6">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                GO VIRAL INDEX SCORE
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-amber-400 tracking-tight">{overallScore}</span>
                <span className="text-3xl font-bold text-white">/100</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-16 w-px bg-slate-800" />

            {/* Middle */}
            <div className="px-6 space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">
                  VIRALITY POTENTIAL
                </span>
                <span className={`inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${overallScore < 40 ? 'bg-red-950/90 text-red-400 border border-red-900/60' :
                  overallScore < 70 ? 'bg-amber-950/90 text-amber-400 border border-amber-900/60' :
                    'bg-emerald-950/90 text-emerald-400 border border-emerald-900/60'
                  }`}>
                  {potentialInfo.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  GRADE
                </span>
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black ${['A+', 'A'].includes(detailed.letterGrade) ? 'border-emerald-500 text-emerald-400' :
                  ['B', 'C'].includes(detailed.letterGrade) ? 'border-amber-500 text-amber-400' :
                    'border-red-500 text-red-500'
                  }`}>
                  {detailed.letterGrade}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-16 w-px bg-slate-800" />

            {/* Right Gauge */}
            <div className="pl-6 flex flex-col items-center justify-center min-w-[150px]">
              <svg viewBox="0 0 100 55" className="w-32 h-16">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none"
                  stroke={overallScore < 40 ? '#EF4444' : overallScore < 70 ? '#F59E0B' : '#10B981'}
                  strokeWidth="10"
                  strokeDasharray="126"
                  strokeDashoffset={126 - (126 * Math.min(overallScore, 100)) / 100}
                  strokeLinecap="round"
                />
                <g transform={`rotate(${-90 + (Math.min(overallScore, 100) * 180) / 100}, 50, 50)`}>
                  <line x1="50" y1="50" x2="18" y2="50" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />
                </g>
              </svg>
              <span className="text-xs font-bold text-slate-300 mt-1">
                {potentialInfo.label} Potential
              </span>
            </div>
          </div>
        </div>

        {/* KEY CATEGORY PERFORMANCE METRICS */}
        <div className="px-7 py-3 bg-[#F8FAFC]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Key Category Performance Metrics
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm mb-1.5">
                  ⚡
                </div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  First 3s Hook Power
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-purple-700">{categoryScores.hookScore}</span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${categoryScores.hookScore}%` }} />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm mb-1.5">
                  ?
                </div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  Curiosity Gap Score
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-amber-600">{curiosityScore}</span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${curiosityScore}%` }} />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm mb-1.5">
                  📄
                </div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  Script Pacing Score
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-blue-600">{categoryScores.pacingScore}</span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${categoryScores.pacingScore}%` }} />
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm mb-1.5">
                  🔍
                </div>
                <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                  SEO Keyword Density
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xl font-black text-emerald-600">{categoryScores.keywordScore}</span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${categoryScores.keywordScore}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECOMMENDED HIGH-CONVERTING VIRAL HOOK VARIATIONS */}
        <div className="px-7 py-4 bg-[#F8FAFC]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Recommended High-Converting Viral Hook Variations
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {(result.suggestedTitleAlternatives && result.suggestedTitleAlternatives.length > 0
              ? result.suggestedTitleAlternatives.map(formatHookTextForPdf)
              : [
                "Stop doing [your topic] until you watch this!",
                "Everyone is doing [your topic] completely wrong. Here is what actually works instead...",
                "The 1-minute [your topic] trick that 95% of creators have no idea exists!",
                "How to get 10x results in [your topic] without wasting hours...",
                "If you are struggling with [your topic], save this video right now!"
              ]
            ).slice(0, 5).map((hookText, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    "{hookText}"
                  </p>
                </div>
                <span className="text-amber-500 text-xs shrink-0">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-[#F8FAFC] border-t border-slate-200/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>This report is confidential and intended for authorized use only.</span>
          </div>
        </div>
      </div>
    </div >
  );
};
