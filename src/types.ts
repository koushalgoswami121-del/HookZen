export type IndustryType =
  | 'tech'
  | 'fitness'
  | 'finance'
  | 'entertainment'
  | 'beauty'
  | 'education'
  | 'gaming'
  | 'business'
  | 'storytelling'
  | 'lifestyle';

export type PlatformType = 'all' | 'tiktok' | 'reels' | 'shorts';

export type LanguageType =
  | 'all'
  | 'en'
  | 'es'
  | 'hi'
  | 'fr'
  | 'de'
  | 'pt'
  | 'ja'
  | 'zh'
  | 'ar'
  | 'ru'
  | 'it'
  | 'ko'
  | 'id'
  | 'vi'
  | 'tr';

export interface ImageAnalysisMetrics {
  hasImage: boolean;
  dataUrl?: string;
  width: number;
  height: number;
  aspectRatio: number;
  isNineToSixteen: boolean;
  averageBrightness: number; // 0 - 255
  contrastRatio: number; // 0 - 100
  colorVibrancy: number; // 0 - 100
  focalEntropy: number; // 0 - 100
  visualScore: number; // 0 - 100
  feedback: string[];
}

export interface PacingAnalysisResult {
  wordCount: number;
  durationSeconds: number;
  wpm: number;
  idealWpmRange: [number, number];
  pacingScore: number; // 0 - 100
  sentenceVariance: number; // 0 - 100
  estimatedPauseSeconds: number;
  structuralBeats: {
    hasHook: boolean;
    hasValueDelivery: boolean;
    hasCallToAction: boolean;
    fluffWordCount: number;
  };
}

export interface HookAnalysisResult {
  hookText: string;
  hookType:
  | 'Curiosity Gap'
  | 'Negative Framing'
  | 'Quantified Challenge'
  | 'Pattern Interrupt'
  | 'Direct Calling'
  | 'Value Pitch'
  | 'Weak / Descriptive';
  emotionalIntensity: number; // 0 - 100
  titleHookScore: number; // 0 - 100
  scriptHookScore: number; // 0 - 100
  overallHookScore: number; // 0 - 100
  detectedPowerWords: string[];
}

export interface KeywordAnalysisResult {
  keywordScore: number; // 0 - 100
  detectedIndustryKeywords: string[];
  viralTriggerWords: string[];
  fluffWords: string[];
  readabilityScore: number; // Flesch-Kincaid estimate
}

export interface CategoryScores {
  hookScore: number; // 30%
  pacingScore: number; // 25%
  keywordScore: number; // 25%
  visualScore: number; // 20%
  curiosityScore: number;
}

export interface OptimizationTip {
  id: string;
  category: 'hook' | 'pacing' | 'keywords' | 'visual' | 'platform';
  title: string;
  description: string;
  exampleFix?: string;
  priority: 'critical' | 'high' | 'quick-win';
  impactPts?: number; // legacy
  problem?: string; // New: What is wrong
  impact?: 'High' | 'Medium' | 'Low'; // New: Expected impact category
}

export interface ScriptHeatmapLine {
  lineNumber: number;
  text: string;
  wordCount: number;
  estimatedSecs: number;
  wpm: number;
  isHook: boolean;
  containsPowerWord: boolean;
  isFluff: boolean;
  sentiment: 'neutral' | 'high-energy' | 'frictional' | 'cta';
}

export interface RetentionPoint {
  second: number;
  retentionPct: number;
  annotation?: string;
}

export interface PlatformOptimizations {
  tiktok: string[];
  reels: string[];
  shorts: string[];
}

export type LetterGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface CategoryExplainScore {
  score: number;
  why: string;
  howToImprove: string;
}

export interface ScoredTitleItem {
  title: string;
  score: number;
  reason: string;
}

export interface ImprovedHookItem {
  title: string;
  explanation: string;
  category: string;
}

export interface DetailedScriptAnalysis {
  overallScore: number;
  letterGrade: LetterGrade;
  hook: CategoryExplainScore & {
    openingLines: string;
    detectedType: string;
    isStrong: boolean;
    rewardedElements: string[];
    penalizedElements: string[];
  };
  curiosity: CategoryExplainScore & {
    detectedCuriosityWords: string[];
    hasUnansweredCuriosity: boolean;
  };
  emotional: CategoryExplainScore & {
    intensity: number;
    detectedEmotions: string[];
  };
  story: CategoryExplainScore & {
    hasProblem: boolean;
    hasConflict: boolean;
    hasSolution: boolean;
    hasResult: boolean;
    detectedComponents: string[];
  };
  retention: CategoryExplainScore & {
    avgSentenceLength: number;
    longSentenceCount: number;
    repetitiveWordCount: number;
    hasSlowIntro: boolean;
    punchySentenceCount: number;
  };
  cta: CategoryExplainScore & {
    hasCTA: boolean;
    detectedCTA?: string;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvedHooks: ImprovedHookItem[];
  scoredTitles: ScoredTitleItem[];
  thumbnailTexts: string[];
  improvedCTAs: string[];
}

export interface AnalysisInput {
  title: string;
  image?: File | null;
  imageDataUrl?: string;
  imageMetrics?: ImageAnalysisMetrics | null;
  transcript: string;
  industry: IndustryType;
  followerCount: number;
  highestViews: number;
  targetPlatform: PlatformType;
  language?: LanguageType;
}

export interface ViralScoreResult {
  id: string;
  timestamp: string;
  input: AnalysisInput;
  overallScore: number; // 0 - 100
  contentScore?: number; // 0 - 100 Content Quality Score
  viralPotential?: number; // 0 - 100 Viral resemblance Score
  confidence?: 'High' | 'Medium' | 'Low'; // Prediction confidence
  modelVersion?: string;
  letterGrade: LetterGrade;
  tier: 'Viral Breakout' | 'Strong Contender' | 'Moderate Reach' | 'Needs Optimization' | 'Viral Potential';
  percentileRank: number; // e.g. 96th percentile
  categoryScores: CategoryScores;
  hookAnalysis: HookAnalysisResult;
  pacingAnalysis: PacingAnalysisResult;
  keywordAnalysis: KeywordAnalysisResult;
  imageMetrics: ImageAnalysisMetrics;
  retentionCurve: RetentionPoint[];
  actionableTips: OptimizationTip[];
  scriptHeatmap: ScriptHeatmapLine[];
  platformOptimizations: PlatformOptimizations;
  suggestedTitleAlternatives: string[];
  optimizedScript: string;
  detailedAnalysis: DetailedScriptAnalysis;
}
