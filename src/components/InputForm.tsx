import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Clock,
  Briefcase,
  FileText,
  Type,
  X,
  Laptop,
  DollarSign,
  Dumbbell,
  Film,
  BookOpen,
  Gamepad2,
  TrendingUp,
  Mic,
  Compass,
  ChevronDown,
  Crown,
  Globe,
  Users,
  Eye,
} from 'lucide-react';
import { AnalysisInput, IndustryType, LanguageType, PlatformType } from '../types';
import { FreemiumState } from '../utils/freemiumManager';

interface InputFormProps {
  onAnalyze: (input: AnalysisInput) => void;
  isAnalyzing: boolean;
  freemiumState?: FreemiumState;
  onOpenPricing?: (reason?: 'limit_reached' | 'pro_feature_locked') => void;
}

const INDUSTRIES: {
  id: IndustryType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
  ringColor: string;
}[] = [
    { id: 'tech', label: 'Tech', icon: Laptop, bgColor: 'bg-amber-500/10', textColor: 'text-amber-950 font-bold', borderColor: 'border-amber-400', ringColor: 'focus:ring-amber-300' },
    { id: 'finance', label: 'Finance', icon: DollarSign, bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-950 font-bold', borderColor: 'border-emerald-400', ringColor: 'focus:ring-emerald-300' },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell, bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-950 font-bold', borderColor: 'border-cyan-400', ringColor: 'focus:ring-cyan-300' },
    { id: 'entertainment', label: 'Entertainment', icon: Film, bgColor: 'bg-purple-500/10', textColor: 'text-purple-950 font-bold', borderColor: 'border-purple-400', ringColor: 'focus:ring-purple-300' },
    { id: 'beauty', label: 'Beauty', icon: Sparkles, bgColor: 'bg-rose-500/10', textColor: 'text-rose-950 font-bold', borderColor: 'border-rose-400', ringColor: 'focus:ring-rose-300' },
    { id: 'education', label: 'Education', icon: BookOpen, bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-950 font-bold', borderColor: 'border-indigo-400', ringColor: 'focus:ring-indigo-300' },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2, bgColor: 'bg-violet-500/10', textColor: 'text-violet-950 font-bold', borderColor: 'border-violet-400', ringColor: 'focus:ring-violet-300' },
    { id: 'business', label: 'Business', icon: TrendingUp, bgColor: 'bg-blue-500/10', textColor: 'text-blue-950 font-bold', borderColor: 'border-blue-400', ringColor: 'focus:ring-blue-300' },
    { id: 'storytelling', label: 'Storytelling', icon: Mic, bgColor: 'bg-pink-500/10', textColor: 'text-pink-950 font-bold', borderColor: 'border-pink-400', ringColor: 'focus:ring-pink-300' },
    { id: 'lifestyle', label: 'Lifestyle', icon: Compass, bgColor: 'bg-orange-500/10', textColor: 'text-orange-950 font-bold', borderColor: 'border-orange-400', ringColor: 'focus:ring-orange-300' },
  ];

const PLATFORMS: { id: PlatformType; label: string }[] = [
  { id: 'all', label: 'All Platforms' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'reels', label: 'Instagram Reels' },
  { id: 'shorts', label: 'YouTube Shorts' },
];

const LANGUAGES: { id: LanguageType; label: string; flag: string }[] = [
  { id: 'all', label: 'All Languages / Auto-Detect', flag: '🌐' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'es', label: 'Spanish (Español)', flag: '🇪🇸' },
  { id: 'hi', label: 'Hindi / Hinglish (हिंदी)', flag: '🇮🇳' },
  { id: 'fr', label: 'French (Français)', flag: '🇫🇷' },
  { id: 'de', label: 'German (Deutsch)', flag: '🇩🇪' },
  { id: 'pt', label: 'Portuguese (Português)', flag: '🇵🇹' },
  { id: 'ja', label: 'Japanese (日本語)', flag: '🇯🇵' },
  { id: 'zh', label: 'Chinese (中文)', flag: '🇨🇳' },
  { id: 'ar', label: 'Arabic (العربية)', flag: '🇸🇦' },
  { id: 'ru', label: 'Russian (Русский)', flag: '🇷🇺' },
  { id: 'it', label: 'Italian (Italiano)', flag: '🇮🇹' },
  { id: 'ko', label: 'Korean (한국어)', flag: '🇰🇷' },
  { id: 'id', label: 'Indonesian (Bahasa)', flag: '🇮🇩' },
  { id: 'vi', label: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳' },
  { id: 'tr', label: 'Turkish (Türkçe)', flag: '🇹🇷' },
];

export const InputForm: React.FC<InputFormProps> = ({
  onAnalyze,
  isAnalyzing,
  freemiumState,
  onOpenPricing,
}) => {
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [industry, setIndustry] = useState<IndustryType>('tech');
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [highestViews, setHighestViews] = useState<number>(0);
  const [targetPlatform, setTargetPlatform] = useState<PlatformType>('all');
  const [language, setLanguage] = useState<LanguageType>('en');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !transcript.trim()) return;

    if (freemiumState && !freemiumState.isPro) {
      const remaining = Math.max(0, freemiumState.maxFreeDailyCredits + (freemiumState.bonusCredits || 0) - freemiumState.dailyCreditsUsed);
      if (remaining <= 0) {
        if (onOpenPricing) onOpenPricing('limit_reached');
        return;
      }
    }

    onAnalyze({
      title,
      image: imageFile,
      imageDataUrl: imagePreviewUrl,
      transcript,
      industry,
      followerCount: Math.max(0, followerCount),
      highestViews: Math.max(0, highestViews),
      targetPlatform,
      language,
    });
  };

  // Real-time metrics
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/90 bg-white/70 p-7 sm:p-10 shadow-2xl backdrop-blur-md">
      {/* Form Header */}
      <div className="mb-6 border-b border-slate-200/70 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Analyze Your Video
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Enter your video details below to calculate viral reach potential and receive targeted optimization advice.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field 1: Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Type className="h-4 w-4 text-slate-500" />
              1. Reel / Short / TikTok Title
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 font-medium">
              {title.length} chars
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Stop Buying iPhone 16 Until You See This Secret AI Setting"
            className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400/80 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/60 shadow-2xs transition-all"
            required
          />
        </div>

        {/* Fields 2 & 3: Side-by-Side Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Field 2: Thumbnail / First Frame Upload */}
          <div className="lg:col-span-5">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              2. Thumbnail / First Frame Image
            </label>

            {imagePreviewUrl ? (
              <div className="relative group overflow-hidden rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center h-52 shadow-2xs">
                <img
                  src={imagePreviewUrl}
                  alt="Short-form video thumbnail frame analysis"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-rose-600 transition-all cursor-pointer shadow-md"
                  title="Remove Image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300/80 bg-[#fefcf8]/90 p-5 text-center hover:border-amber-400 hover:bg-[#fffdfa] transition-all cursor-pointer h-52 shadow-2xs"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fef3c7]/90 text-[#d97706] group-hover:scale-105 transition-transform border border-amber-200/70 shadow-2xs">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-bold text-slate-800">
                  Upload Thumbnail or First Frame
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  PNG, JPG, WebP (9:16 vertical recommended)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Field 3: Transcript / Script */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="h-4 w-4 text-slate-500" />
                3. Transcript / Script
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>{wordCount} words</span>
                {wordCount > 0 && (
                  <>
                    <span>•</span>
                    <span>~{Math.max(1, Math.round(wordCount / 2.6))}s est. read</span>
                  </>
                )}
              </div>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste or type your video transcript here... First 3 seconds/words will be analyzed as the hook."
              className="w-full h-52 rounded-xl border border-slate-200/90 bg-white/90 p-4 text-sm font-normal text-slate-900 placeholder:text-slate-400/80 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/60 shadow-2xs transition-all resize-none leading-relaxed"
              required
            />
          </div>
        </div>

        {/* Fields 4, 5, 6 & 7: Bottom Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
          {/* Field 4: Niche / Industry */}
          <div className="md:col-span-3">
            {(() => {
              const currentIndConfig = INDUSTRIES.find((ind) => ind.id === industry) || INDUSTRIES[0];
              const IconComp = currentIndConfig.icon;

              return (
                <>
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
                    <IconComp className={`h-4 w-4 ${currentIndConfig.textColor}`} />
                    4. Niche / Industry
                  </label>
                  <div className="relative">
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value as IndustryType)}
                      className={`w-full appearance-none rounded-xl border ${currentIndConfig.borderColor} ${currentIndConfig.bgColor} ${currentIndConfig.textColor} px-3 py-3 text-sm font-bold focus:outline-none focus:ring-2 ${currentIndConfig.ringColor} shadow-2xs transition-all cursor-pointer`}
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.id} value={ind.id} className="text-slate-900 bg-white font-medium py-1">
                          {ind.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-slate-600">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Field 5: Video Language */}
          <div className="md:col-span-3">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <Globe className="h-4 w-4 text-amber-600" />
              5. Language
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageType)}
                className="w-full appearance-none rounded-xl border border-amber-300/80 bg-amber-50/40 px-3 py-3 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/60 shadow-2xs transition-all cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id} className="text-slate-900 font-medium py-1">
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Field 6: Follower Count */}
          <div className="md:col-span-3">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <Users className="h-4 w-4 text-blue-600" />
              6. Followers
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={followerCount || ''}
                onChange={(e) => setFollowerCount(parseInt(e.target.value) || 0)}
                placeholder="e.g. 10000"
                className="w-full rounded-xl border border-blue-200 bg-blue-50/40 px-3 py-3 text-sm font-semibold text-slate-900 placeholder:text-blue-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200/60 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Field 7: Highest Views */}
          <div className="md:col-span-3">
            <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <Eye className="h-4 w-4 text-rose-600" />
              7. Highest Views
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={highestViews || ''}
                onChange={(e) => setHighestViews(parseInt(e.target.value) || 0)}
                placeholder="e.g. 500000"
                className="w-full rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-3 text-sm font-semibold text-slate-900 placeholder:text-rose-300 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200/60 shadow-2xs transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200/70">
          {/* Target Platform Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Target Platform:</span>
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-full border border-slate-200/80">
              {PLATFORMS.map((plat) => (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => setTargetPlatform(plat.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${targetPlatform === plat.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {plat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Group: Submit Button & Freemium Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full sm:w-auto">

            {/* Primary Gradient Submit Button */}
            <button
              type="submit"
              disabled={isAnalyzing || (!title.trim() && !transcript.trim())}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Analyzing Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-200 fill-amber-200" />
                  <span>Analyse Viral Score</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

