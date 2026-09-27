import {
  AnalysisInput,
  CategoryScores,
  ComponentDiagnostic,
  FixThisFirstAction,
  OptimizationTip,
  PlatformOptimizations,
  ScoringComponentKey,
  ViralHookItem,
  ViralScoreResult,
} from '../types';
import { INDUSTRY_KEYWORDS, FLUFF_WORDS } from './dictionaries';
import { analyzeHook } from './hookAnalyzer';
import { analyzeImageCanvas } from './imageAnalyzer';
import { analyzeKeywords } from './keywordAnalyzer';
import { analyzePacing } from './pacingAnalyzer';
import { getRandomHookSuggestions } from './viralHooksPool';
import { analyzeScriptDeterministically } from './deterministicAnalyzer';
import { extractScriptInsights } from './scriptBrain';
import { generateViralLogicHooks } from './viralLogic';
import { computeAuthoritativeScore, getCreatorContext, SCORING_WEIGHTS } from './scoringConfig';

export function isGibberishWord(word: string): boolean {
  const w = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!w) return false;

  // Standard numbers like 2026, 100, 50, etc. are valid
  if (/^\d+$/.test(w)) return false;

  // Extremely short words (1-2 chars) handled separately by word count or common word checks
  if (w.length < 3) return false;

  // 1. Repeating characters like "aaaa", "zzzz"
  if (/([a-z])\1{2,}/i.test(w)) return true;

  // 2. Keyboard rows / mash patterns & nonsense letter clusters
  const keyboardMash = /(asdf|qwerty|zxcv|hjkl|dfgh|fghj|ghjk|qwer|wert|erty|rtyu|tyui|yuio|uiop|zxcvb|xcvbn|cvbnm|12345|sfub|fud|fudh|dhf|fhd|ksj|dksj|fudhf|sfubf)/i;
  if (keyboardMash.test(w)) return true;

  // 3. Invalid English starting consonant clusters
  const invalidStarts = /^(sf|bf|fp|fq|fz|gj|hx|jx|kx|px|qx|vx|wx|zx|cb|cd|cf|cg|cj|ck|cm|cn|cp|cq|cr|cs|ct|cv|cw|cx|cy|cz)/i;
  if (invalidStarts.test(w) && w.length >= 4) return true;

  // 4. Consecutive consonants >= 4 unless standard English blend
  const fourConsonants = /[^aeiouy0-9]{4,}/i;
  if (fourConsonants.test(w)) {
    if (!/(schm|ngth|rts|lps|mpt|nds|ghts)/i.test(w)) return true;
  }

  // 5. Zero vowels in 3+ letter non-number words
  const vowels = w.match(/[aeiouy]/gi);
  if (!vowels) return true;

  // 6. Low vowel percentage in longer words
  if (w.length >= 5 && vowels.length / w.length < 0.18) return true;

  return false;
}

export function isMeaninglessText(title: string, transcript: string): boolean {
  const t = (title || '').trim();
  const sc = (transcript || '').trim();
  const combined = `${t} ${sc}`.trim();

  if (!combined) return true;

  // Clean words (supporting Unicode letters/numbers)
  const unicodeWords = combined.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);

  // Rule 1: Less than 5 words -> Always return true (0 Rating)
  if (unicodeWords.length < 5) return true;

  // Rule 2: Explicit test / meta comments
  const lower = combined.toLowerCase();
  if (
    /\b(i am putting random words|putting random words|random words|this is a test|just testing|testing this|random text|blah blah|lorem ipsum|asdfgh|qwertyuiop|zxcvbnm|test test test)\b/i.test(
      lower
    )
  ) {
    return true;
  }

  // Rule 3: Pure repetitive character/word strings
  if (/^(.)\1{2,}$/i.test(combined.replace(/\s/g, ''))) return true;

  // Rule 4: Gibberish word check (e.g. sfubfudhf, asdfgh, fhdksjf)
  let gibberishCount = 0;
  for (const word of unicodeWords) {
    if (isGibberishWord(word)) {
      gibberishCount++;
    }
  }

  // If any word is gibberish in <= 10 word input OR >= 25% of words are gibberish
  if (gibberishCount > 0 && unicodeWords.length <= 10) return true;
  if (gibberishCount / unicodeWords.length >= 0.25) return true;

  // Rule 5: Repetitive word frequencies (e.g. "test test test test test")
  const wordCounts: Record<string, number> = {};
  for (const w of unicodeWords) {
    const cleanW = w.toLowerCase();
    wordCounts[cleanW] = (wordCounts[cleanW] || 0) + 1;
  }
  const maxFreq = Math.max(...Object.values(wordCounts));
  if (maxFreq / unicodeWords.length >= 0.4) return true;

  return false;
}

/**
 * Executes HookZen's Authoritative 6-Component Coaching & Scoring Engine (V2.0).
 *
 * Core Principle: "AI is the Analyst, Code is the Accountant"
 *
 * 1. Hook Strength (30%)
 * 2. Retention Potential (25%)
 * 3. Content & Story Structure (20%)
 * 4. Visual / First Frame (10%)
 * 5. Engagement Potential (10%)
 * 6. Search & Discoverability (5%)
 *
 * Follower counts and historical views NEVER alter the content score.
 * They are provided strictly as advisory "Creator Context".
 */
export async function calculateViralScore(
  input: AnalysisInput
): Promise<ViralScoreResult> {
  const title = input?.title || '';
  const transcript = input?.transcript || '';
  const { image, imageDataUrl, industry, followerCount = 0, highestViews = 0, socialHandle, socialPlatform } = input || {};

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedLengthSeconds = Math.max(10, Math.round(wordCount / (160 / 60)));
  const creatorContext = getCreatorContext(followerCount, highestViews, socialHandle, socialPlatform);

  // 1. Run sub-analyzers
  const imageMetrics = await analyzeImageCanvas(image || imageDataUrl);

  // Check if title / transcript is meaningless or random noise (< 5 words or gibberish)
  if (isMeaninglessText(title, transcript)) {
    const emptyDiagnostics: Record<ScoringComponentKey, ComponentDiagnostic> = {
      hook: {
        name: 'Hook Strength',
        key: 'hook',
        weight: SCORING_WEIGHTS.hook,
        score: 0,
        weightedScore: 0,
        confidence: 'low',
        evidence: ['Input contains fewer than 5 words or unrecognized / gibberish text.'],
        strengths: [],
        weaknesses: ['Opening lacks a viable hook line.'],
        reasoning: 'Cannot evaluate hook power on meaningless or insufficient input.',
        recommendations: ['Provide a complete video title and opening sentence (at least 5 words).'],
      },
      retention: {
        name: 'Retention Potential',
        key: 'retention',
        weight: SCORING_WEIGHTS.retention,
        score: 0,
        weightedScore: 0,
        confidence: 'low',
        evidence: [`${wordCount} words detected`],
        strengths: [],
        weaknesses: ['Script is too short to measure speech rate or rhythm variation.'],
        reasoning: 'Viewer retention modeling requires a minimum spoken dialogue sample.',
        recommendations: ['Write a complete spoken script (50-120 words for a 30s video).'],
      },
      structure: {
        name: 'Content & Story Structure',
        key: 'structure',
        weight: SCORING_WEIGHTS.structure,
        score: 0,
        weightedScore: 0,
        confidence: 'low',
        evidence: ['Zero narrative beats detected.'],
        strengths: [],
        weaknesses: ['Missing narrative structure (Problem -> Solution -> Payoff).'],
        reasoning: 'No narrative components present in random or insufficient text.',
        recommendations: ['Structure your content with a clear problem and practical solution.'],
      },
      visual: {
        name: 'Visual / First Frame',
        key: 'visual',
        weight: SCORING_WEIGHTS.visual,
        score: imageMetrics.hasImage ? imageMetrics.visualScore : 0,
        weightedScore: 0,
        confidence: 'low',
        evidence: imageMetrics.hasImage ? ['Uploaded cover image detected.'] : ['No cover image was provided, so HookZen could not evaluate the visual first frame.'],
        strengths: [],
        weaknesses: imageMetrics.hasImage ? ['Insufficient script context to pair with visual framing.'] : ['Visual first frame cannot be evaluated without an uploaded image.'],
        reasoning: imageMetrics.hasImage ? 'Visual presentation works in tandem with spoken content.' : 'No cover image was provided, so HookZen could not evaluate the visual first frame.',
        recommendations: ['Upload a 9:16 cover image to enable visual first-frame analysis.'],
      },
      engagement: {
        name: 'Engagement Potential',
        key: 'engagement',
        weight: SCORING_WEIGHTS.engagement,
        score: 0,
        weightedScore: 0,
        confidence: 'low',
        evidence: ['No call to action or engagement prompts found.'],
        strengths: [],
        weaknesses: ['Missing Call to Action (CTA).'],
        reasoning: 'Engagement requires an explicit question or save prompt.',
        recommendations: ['End with a clear prompt like "Save this for later!"'],
      },
      discoverability: {
        name: 'Search & Discoverability',
        key: 'discoverability',
        weight: SCORING_WEIGHTS.discoverability,
        score: 0,
        weightedScore: 0,
        confidence: 'low',
        evidence: ['No niche topic keywords identified.'],
        strengths: [],
        weaknesses: ['Missing niche identifiers for algorithmic categorization.'],
        reasoning: 'Search and discovery systems scan keywords to index your video to relevant audiences.',
        recommendations: [`Include defining ${industry || 'topic'} terms in the title and script.`],
      },
    };

    const fixThisFirst: FixThisFirstAction = {
      component: 'Input Completeness',
      bottleneckTitle: 'Input Contains Fewer Than 5 Words or Unrecognized Text',
      impactPts: 100,
      problem: 'Your video title and transcript combined contain fewer than 5 words or consist of unrecognized / gibberish text (e.g. "sfubfudhf").',
      whyItMatters: 'Short-form platforms require clear spoken audio and text signals to categorize your content and push it to initial viewer pools.',
      concreteFix: `Enter a clear title like "3 Secrets to Growth in ${industry || 'your niche'}" and a complete spoken script with at least 15 words.`,
      urgency: 'critical',
    };

    return {
      id: `analysis-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      input,
      scoringVersion: '2.0',
      overallScore: 0,
      tier: 'High Risk',
      viralityTier: 'High Risk',
      percentileRank: 1,
      letterGrade: 'F',
      grade: 'F',
      confidence: 'Low',
      warnings: ['Input contains fewer than 5 words or unrecognized / gibberish text. Please provide a complete script.'],
      cleanScript: '',
      componentDiagnostics: emptyDiagnostics,
      fixThisFirst,
      creatorContext,
      categoryScores: {
        hookScore: 0,
        pacingScore: 0,
        keywordScore: 0,
        visualScore: imageMetrics.hasImage ? imageMetrics.visualScore : 0,
        curiosityScore: 0,
      },
      hookAnalysis: {
        overallHookScore: 0,
        titleHookScore: 0,
        scriptHookScore: 0,
        emotionalIntensity: 0,
        detectedPowerWords: [],
        hookType: 'Direct Hook',
        hookText: title || transcript || 'None',
      },
      pacingAnalysis: {
        wpm: 0,
        wordCount: wordCount,
        durationSeconds: estimatedLengthSeconds,
        pacingScore: 0,
        idealWpmRange: [160, 190],
        sentenceVariance: 0,
        estimatedPauseSeconds: 0,
        structuralBeats: {
          hasHook: false,
          hasValueDelivery: false,
          hasCallToAction: false,
          fluffWordCount: 0,
        },
      },
      keywordAnalysis: {
        keywordScore: 0,
        detectedIndustryKeywords: [],
        viralTriggerWords: [],
        fluffWords: [],
        readabilityScore: 0,
      },
      imageMetrics,
      retentionCurve: [
        { second: 0, retentionPct: 100, annotation: 'Video Start' },
        { second: 3, retentionPct: 5, annotation: '3s Dropoff Window' },
        { second: 15, retentionPct: 0, annotation: 'Mid-Video' },
        { second: 30, retentionPct: 0, annotation: 'End' },
      ],
      actionableTips: [
        {
          id: 'meaningless-content',
          category: 'hook',
          title: 'Input Contains Fewer Than 5 Words or Invalid / Nonsense Text',
          description: 'Your video title and transcript combined contain fewer than 5 words or consist of unrecognized / gibberish text. Please enter a complete video title and spoken script for an accurate pre-publish virality coaching report.',
          exampleFix: `Enter a clear title like "3 Secrets to Growth in ${industry}" and a spoken script with at least 15 words.`,
          priority: 'critical',
          impactPts: 100,
        },
      ],
      scriptHeatmap: [],
      platformOptimizations: {
        tiktok: ['Provide a full title & script to generate TikTok optimizations.'],
        reels: ['Provide a full title & script to generate Instagram Reels optimizations.'],
        shorts: ['Provide a full title & script to generate YouTube Shorts optimizations.'],
      },
      suggestedTitleAlternatives: [
        `Why most short videos fail in the first 3 seconds`,
        `The biggest mistake creators make before publishing`,
        `How to improve your video retention and watch time`,
        `Stop scrolling until you hear this advice`,
        `The one thing holding your content reach back right now`,
      ],
      optimizedScript: title || transcript ? `Please enter a complete script to optimize.` : '',
      detailedAnalysis: analyzeScriptDeterministically(title || 'Untitled', transcript || '', industry),
      viralHooks: [],
    };
  }

  // 2. Perform Sub-Analyses
  const hookAnalysis = analyzeHook(title, transcript, industry);
  const { pacingResult, scriptHeatmap, retentionCurve } = analyzePacing(
    transcript,
    estimatedLengthSeconds,
    industry
  );
  const keywordAnalysis = analyzeKeywords(title, transcript, industry);
  const detailedAnalysis = analyzeScriptDeterministically(title, transcript, industry);

  // 3. Build 6 Component Diagnostics with Evidence & Confidence
  const isShortScript = wordCount < 15;

  // Component 1: Hook Strength (30%)
  const hookScore = Math.max(10, Math.min(100, detailedAnalysis.hook.score));
  const hookConfidence = wordCount >= 10 && title.trim().length > 3 ? 'high' : 'medium';
  const hookEvidence: string[] = [
    `Hook Type: ${hookAnalysis.hookType}`,
    `Opening text evaluated: "${(hookAnalysis.hookText || title).slice(0, 55)}..."`,
  ];
  if (hookAnalysis.detectedPowerWords.length > 0) {
    hookEvidence.push(`Power words detected: ${hookAnalysis.detectedPowerWords.slice(0, 4).join(', ')}`);
  }
  if (detailedAnalysis.hook.rewardedElements.length > 0) {
    hookEvidence.push(`Rewards: ${detailedAnalysis.hook.rewardedElements.join(', ')}`);
  }
  if (detailedAnalysis.hook.penalizedElements.length > 0) {
    hookEvidence.push(`Penalties: ${detailedAnalysis.hook.penalizedElements.join(', ')}`);
  }

  const hookStrengths: string[] = [];
  const hookWeaknesses: string[] = [];
  if (hookScore >= 70) {
    hookStrengths.push('High-impact opening captures attention within the critical first 2 seconds.');
    if (detailedAnalysis.curiosity.hasUnansweredCuriosity) {
      hookStrengths.push('Unanswered curiosity gap holds viewers through the first transition.');
    }
  } else {
    hookWeaknesses.push('Opening hook lacks an immediate curiosity gap or emotional pattern interrupt.');
    if (detailedAnalysis.hook.penalizedElements.includes('Slow Intro ("Hi guys / Welcome back")')) {
      hookWeaknesses.push('Contains slow greeting filler ("Hi guys" / "Welcome back") which triggers immediate viewer scroll-away.');
    }
  }

  const hookDiagnostic: ComponentDiagnostic = {
    name: 'Hook Strength',
    key: 'hook',
    weight: SCORING_WEIGHTS.hook,
    score: hookScore,
    weightedScore: Number((hookScore * SCORING_WEIGHTS.hook).toFixed(2)),
    confidence: hookConfidence,
    evidence: hookEvidence,
    strengths: hookStrengths.length > 0 ? hookStrengths : ['Opening establishes general video subject.'],
    weaknesses: hookWeaknesses.length > 0 ? hookWeaknesses : ['Opening could be punchier for high-velocity feeds.'],
    reasoning: detailedAnalysis.hook.why || 'Viewers make a stay-or-scroll decision within 1.8 seconds. Strong hooks pair curiosity with clear stakes.',
    recommendations: [detailedAnalysis.hook.howToImprove || 'Start immediately with a bold question, surprising statistic, or contrarian claim.'],
  };

  // Component 2: Retention Potential (25%)
  const retentionScore = Math.max(10, Math.min(100, pacingResult.pacingScore));
  const retentionConfidence = wordCount < 15 ? 'low' : wordCount < 35 ? 'medium' : 'high';
  const retentionEvidence: string[] = [
    `Speaking pace: ${pacingResult.wpm} WPM (Target: ${pacingResult.idealWpmRange.join('-')} WPM)`,
    `Average sentence length: ${detailedAnalysis.retention.avgSentenceLength} words`,
    `${wordCount} total words across ~${estimatedLengthSeconds}s estimated duration`,
  ];
  if (isShortScript) {
    retentionEvidence.push('Warning: Low sample size (<15 words). Sentence pacing metrics carry lower statistical confidence.');
  }

  const retentionStrengths: string[] = [];
  const retentionWeaknesses: string[] = [];
  if (retentionScore >= 75) {
    retentionStrengths.push(`Cadence matches the optimal short-form tempo (${pacingResult.wpm} WPM).`);
    retentionStrengths.push('Sentence variance maintains active viewer engagement.');
  } else {
    if (pacingResult.wpm > 210) {
      retentionWeaknesses.push(`Speaking pace (${pacingResult.wpm} WPM) is overly dense; viewers may struggle to absorb key points without visual pauses.`);
    } else if (pacingResult.wpm < 140) {
      retentionWeaknesses.push(`Speaking pace (${pacingResult.wpm} WPM) is sluggish; slow delivery invites feed scroll-away.`);
    }
    if (detailedAnalysis.retention.longSentenceCount > 0) {
      retentionWeaknesses.push(`Found ${detailedAnalysis.retention.longSentenceCount} sentence(s) exceeding 22 words, creating pacing drag.`);
    }
  }

  const retentionDiagnostic: ComponentDiagnostic = {
    name: 'Retention Potential',
    key: 'retention',
    weight: SCORING_WEIGHTS.retention,
    score: retentionScore,
    weightedScore: Number((retentionScore * SCORING_WEIGHTS.retention).toFixed(2)),
    confidence: retentionConfidence,
    evidence: retentionEvidence,
    strengths: retentionStrengths.length > 0 ? retentionStrengths : ['Baseline conversational flow.'],
    weaknesses: retentionWeaknesses.length > 0 ? retentionWeaknesses : ['Could tighten sentence rhythm.'],
    reasoning: detailedAnalysis.retention.why || 'Mid-video drop-off is driven by word density and lack of pacing variance.',
    recommendations: ['Keep individual lines under 12 words.', 'Insert a visual pattern interrupt or sound cue every 4 to 5 seconds.'],
  };

  // Component 3: Content & Story Structure (20%)
  const structureScore = Math.max(10, Math.min(100, detailedAnalysis.story.score));
  const structureConfidence = wordCount < 20 ? 'low' : wordCount < 45 ? 'medium' : 'high';
  const structureEvidence: string[] = [];
  if (detailedAnalysis.story.detectedComponents.length > 0) {
    structureEvidence.push(`Detected narrative arc: ${detailedAnalysis.story.detectedComponents.join(' → ')}`);
  } else {
    structureEvidence.push('No distinct Problem/Solution story beats detected.');
  }
  if (pacingResult.structuralBeats.fluffWordCount > 0) {
    structureEvidence.push(`Filler words detected (${pacingResult.structuralBeats.fluffWordCount}): ${keywordAnalysis.fluffWords.slice(0, 3).join(', ')}`);
  }

  const structureStrengths: string[] = [];
  const structureWeaknesses: string[] = [];
  if (structureScore >= 70) {
    structureStrengths.push('Complete narrative arc drives higher watch-through rate.');
  } else {
    structureWeaknesses.push('Incomplete narrative progression; missing clear transition from Problem to Payoff.');
    if (pacingResult.structuralBeats.fluffWordCount > 0) {
      structureWeaknesses.push(`Introductory filler words ("${keywordAnalysis.fluffWords.slice(0, 2).join(', ')}") cause momentum loss.`);
    }
  }

  const structureDiagnostic: ComponentDiagnostic = {
    name: 'Content & Story Structure',
    key: 'structure',
    weight: SCORING_WEIGHTS.structure,
    score: structureScore,
    weightedScore: Number((structureScore * SCORING_WEIGHTS.structure).toFixed(2)),
    confidence: structureConfidence,
    evidence: structureEvidence,
    strengths: structureStrengths.length > 0 ? structureStrengths : ['Single-topic clarity.'],
    weaknesses: structureWeaknesses.length > 0 ? structureWeaknesses : ['Narrative transitions could be more pronounced.'],
    reasoning: detailedAnalysis.story.why || 'Structured storytelling drives 40%+ higher full completion rates compared to loose bullet points.',
    recommendations: [detailedAnalysis.story.howToImprove || 'Structure script into 4 beats: 1. Relatable Problem, 2. Conflict/Friction, 3. The Fix, 4. Concrete Result.'],
  };

  // Component 4: Visual / First Frame (10%)
  let visualScore = 50; // Neutral baseline when no image provided
  let visualConfidence: 'high' | 'medium' | 'low' = 'low';
  const visualEvidence: string[] = [];
  const visualStrengths: string[] = [];
  const visualWeaknesses: string[] = [];
  let visualReasoning = '';
  let visualRecommendations: string[] = [];

  if (imageMetrics.hasImage) {
    visualScore = imageMetrics.visualScore;
    visualConfidence = 'high';
    visualEvidence.push(`Aspect ratio: ${imageMetrics.isNineToSixteen ? '9:16 Vertical (Optimal)' : `${imageMetrics.aspectRatio} (Non-vertical)`}`);
    visualEvidence.push(`Visual contrast ratio: ${imageMetrics.contrastRatio}/100`);
    visualEvidence.push(`Color vibrancy: ${imageMetrics.colorVibrancy}/100`);

    if (imageMetrics.isNineToSixteen) {
      visualStrengths.push('Full-screen 9:16 vertical ratio maximizes mobile screen real estate.');
    } else {
      visualWeaknesses.push('Non-vertical image aspect ratio produces black bars on mobile feeds.');
    }

    if (imageMetrics.contrastRatio >= 45) {
      visualStrengths.push('High visual contrast grabs attention in fast-scrolling feeds.');
    } else {
      visualWeaknesses.push('Low visual contrast; subject may blend into feed background.');
    }

    visualReasoning = imageMetrics.feedback?.[0] || 'First frame visual impact determines whether scrolling viewers pause.';
    visualRecommendations = imageMetrics.feedback?.slice(1) || ['Add high-contrast text overlay to the center of your cover frame.'];
  } else {
    visualScore = 0;
    visualConfidence = 'low';
    visualEvidence.push('No cover image was provided, so HookZen could not evaluate the visual first frame.');
    visualWeaknesses.push('Visual first frame cannot be evaluated without an uploaded image.');
    visualReasoning = 'No cover image was provided, so HookZen could not evaluate the visual first frame.';
    visualRecommendations = ['Upload a 9:16 cover image to enable visual first-frame analysis.'];
  }

  const visualDiagnostic: ComponentDiagnostic = {
    name: 'Visual / First Frame',
    key: 'visual',
    weight: SCORING_WEIGHTS.visual,
    score: visualScore,
    weightedScore: Number((visualScore * SCORING_WEIGHTS.visual).toFixed(2)),
    confidence: visualConfidence,
    evidence: visualEvidence,
    strengths: visualStrengths.length > 0 ? visualStrengths : (imageMetrics.hasImage ? ['First frame evaluated.'] : []),
    weaknesses: visualWeaknesses.length > 0 ? visualWeaknesses : (!imageMetrics.hasImage ? ['No cover image uploaded.'] : []),
    reasoning: visualReasoning,
    recommendations: visualRecommendations,
  };

  // Component 5: Engagement Potential (10%)
  const engagementScore = Math.max(10, Math.min(100, detailedAnalysis.cta.score));
  const engagementConfidence = wordCount >= 10 ? 'medium' : 'low';
  const engagementEvidence: string[] = [
    detailedAnalysis.cta.hasCTA
      ? `Detected CTA: "${detailedAnalysis.cta.detectedCTA || 'Direct call to action'}"`
      : 'No closing Call to Action detected in the script.',
  ];

  const engagementStrengths: string[] = [];
  const engagementWeaknesses: string[] = [];
  if (detailedAnalysis.cta.hasCTA) {
    engagementStrengths.push('Includes an explicit Call to Action prompting viewer engagement.');
  } else {
    engagementWeaknesses.push('No direct closing CTA found; viewers have no prompt to save, comment, or share before scrolling.');
  }

  const engagementDiagnostic: ComponentDiagnostic = {
    name: 'Engagement Potential',
    key: 'engagement',
    weight: SCORING_WEIGHTS.engagement,
    score: engagementScore,
    weightedScore: Number((engagementScore * SCORING_WEIGHTS.engagement).toFixed(2)),
    confidence: engagementConfidence,
    evidence: engagementEvidence,
    strengths: engagementStrengths.length > 0 ? engagementStrengths : ['Script content provides value.'],
    weaknesses: engagementWeaknesses.length > 0 ? engagementWeaknesses : ['Could test stronger save triggers.'],
    reasoning: detailedAnalysis.cta.why || 'Content recommendation systems weigh active saves and shares significantly higher than passive views. A clear CTA helps convert viewers into active engagers.',
    recommendations: [detailedAnalysis.cta.howToImprove || 'End with a crisp, low-friction instruction like "Save this before your next upload!" or a question to spark comment debate.'],
  };

  // Component 6: Search & Discoverability (5%) - Renamed from "SEO & FYP Algorithm"
  const discoverabilityScore = Math.max(10, Math.min(100, keywordAnalysis.keywordScore));
  const discoverabilityConfidence = keywordAnalysis.detectedIndustryKeywords.length > 0 ? 'high' : 'medium';
  const discoverabilityEvidence: string[] = [];
  if (keywordAnalysis.detectedIndustryKeywords.length > 0) {
    discoverabilityEvidence.push(`Detected niche topic words: ${keywordAnalysis.detectedIndustryKeywords.slice(0, 5).join(', ')}`);
  } else {
    discoverabilityEvidence.push(`No defining ${industry} keywords found in title or spoken audio.`);
  }
  discoverabilityEvidence.push(`Readability score: ${keywordAnalysis.readabilityScore}/100`);

  const discoverabilityStrengths: string[] = [];
  const discoverabilityWeaknesses: string[] = [];
  if (keywordAnalysis.detectedIndustryKeywords.length >= 2) {
    discoverabilityStrengths.push('Strong niche topic words allow social search engines to categorize your video immediately.');
  } else {
    discoverabilityWeaknesses.push(`Lacks high-volume search phrases for the ${industry} niche.`);
  }

  const discoverabilityDiagnostic: ComponentDiagnostic = {
    name: 'Search & Discoverability',
    key: 'discoverability',
    weight: SCORING_WEIGHTS.discoverability,
    score: discoverabilityScore,
    weightedScore: Number((discoverabilityScore * SCORING_WEIGHTS.discoverability).toFixed(2)),
    confidence: discoverabilityConfidence,
    evidence: discoverabilityEvidence,
    strengths: discoverabilityStrengths.length > 0 ? discoverabilityStrengths : ['Easy to read vocabulary.'],
    weaknesses: discoverabilityWeaknesses.length > 0 ? discoverabilityWeaknesses : ['Could add more topic search terms.'],
    reasoning: 'TikTok, Reels, and YouTube Shorts transcribe spoken audio to match videos with search intent and user preference profiles.',
    recommendations: [`Mention defining ${industry} terms in the first 5 seconds: ${INDUSTRY_KEYWORDS[industry]?.keywords.slice(0, 3).join(', ') || 'niche terms'}.`],
  };

  // 4. Run the Accountant: Calculate Authoritative Overall Score
  const componentDiagnostics: Record<ScoringComponentKey, ComponentDiagnostic> = {
    hook: hookDiagnostic,
    retention: retentionDiagnostic,
    structure: structureDiagnostic,
    visual: visualDiagnostic,
    engagement: engagementDiagnostic,
    discoverability: discoverabilityDiagnostic,
  };

  const authoritativeResult = computeAuthoritativeScore({
    hook: { score: hookDiagnostic.score, confidence: hookDiagnostic.confidence },
    retention: { score: retentionDiagnostic.score, confidence: retentionDiagnostic.confidence },
    structure: { score: structureDiagnostic.score, confidence: structureDiagnostic.confidence },
    visual: { score: visualDiagnostic.score, confidence: visualDiagnostic.confidence },
    engagement: { score: engagementDiagnostic.score, confidence: engagementDiagnostic.confidence },
    discoverability: { score: discoverabilityDiagnostic.score, confidence: discoverabilityDiagnostic.confidence },
  });

  const overallScore = authoritativeResult.overallScore;
  const letterGrade = authoritativeResult.letterGrade;
  const tier = authoritativeResult.tier;
  const percentileRank = authoritativeResult.percentileRank;
  const confidence = authoritativeResult.overallConfidence;

  // 5. Determine "Fix This First" Primary Bottleneck
  // Rank components by point deficit weighted by importance: (100 - score) * weight
  const deficits = (Object.keys(componentDiagnostics) as ScoringComponentKey[])
    .map((key) => {
      const comp = componentDiagnostics[key];
      const deficit = (100 - comp.score) * comp.weight;
      return { key, comp, deficit };
    })
    .sort((a, b) => b.deficit - a.deficit);

  const primaryBottleneck = deficits[0].comp;
  const primaryDeficitPts = Math.round(deficits[0].deficit);

  const fixThisFirst: FixThisFirstAction = {
    component: primaryBottleneck.name,
    bottleneckTitle: primaryBottleneck.weaknesses[0] || `Improve ${primaryBottleneck.name}`,
    impactPts: Math.max(5, primaryDeficitPts),
    problem: primaryBottleneck.weaknesses.join(' ') || primaryBottleneck.reasoning,
    whyItMatters: primaryBottleneck.reasoning,
    concreteFix: primaryBottleneck.recommendations[0] || 'Review diagnostic tips below to resolve this bottleneck.',
    urgency: primaryDeficitPts >= 15 ? 'critical' : primaryDeficitPts >= 8 ? 'high' : 'medium',
  };

  // 6. Actionable Optimization Tips (Cross-Component Prioritized)
  const actionableTips: OptimizationTip[] = [];

  // Hook Tip
  if (hookScore < 75) {
    actionableTips.push({
      id: 'hook-1',
      category: 'hook',
      title: hookScore <= 40 ? 'Opening Lacks Hook Tension' : 'Make Opening 3 Seconds More Curious & Catchy',
      problem: hookDiagnostic.weaknesses[0] || 'The opening is too descriptive to capture fast-scrolling viewer interest.',
      description: `Your opening hook scored ${hookScore}/100. Viewers decide to stay or scroll within 1.8 seconds. Try using an intriguing question or bold opening claim.`,
      exampleFix: hookDiagnostic.recommendations[0],
      priority: hookScore <= 40 ? 'critical' : 'high',
      impact: 'High',
      impactPts: Math.round((100 - hookScore) * 0.30),
    });
  }

  // Retention / Pacing Tip
  if (retentionScore < 75) {
    actionableTips.push({
      id: 'pacing-1',
      category: 'pacing',
      title: 'Optimize Speaking Tempo & Sentence Rhythm',
      problem: retentionDiagnostic.weaknesses[0] || 'Pacing rhythm lacks variation, risking mid-video attention drop.',
      description: `Pacing scored ${retentionScore}/100. Short-form videos perform best with punchy sentences (under 12 words) and an energetic conversational tempo.`,
      exampleFix: 'Trim long sentences into 1-line statements and insert visual breaks every 4 seconds.',
      priority: retentionScore <= 50 ? 'critical' : 'high',
      impact: 'High',
      impactPts: Math.round((100 - retentionScore) * 0.25),
    });
  }

  // Story Structure Tip
  if (structureScore < 70) {
    actionableTips.push({
      id: 'structure-1',
      category: 'pacing',
      title: 'Structure Content with Problem -> Solution Arc',
      problem: structureDiagnostic.weaknesses[0] || 'Missing clear transition between problem and resolution.',
      description: `Structure scored ${structureScore}/100. Viewers stay engaged when scripts follow a narrative tension arc.`,
      exampleFix: 'State the relatable struggle in line 2, introduce friction in line 3, then deliver the unexpected fix.',
      priority: 'high',
      impact: 'Medium',
      impactPts: Math.round((100 - structureScore) * 0.20),
    });
  }

  // Engagement / CTA Tip
  if (engagementScore < 70) {
    actionableTips.push({
      id: 'engagement-1',
      category: 'hook',
      title: 'Add a Strong Closing Call to Action',
      problem: engagementDiagnostic.weaknesses[0] || 'Script ends without a prompt to save or comment.',
      description: `Engagement scored ${engagementScore}/100. Ending with an explicit save prompt boosts the save-to-view ratio.`,
      exampleFix: 'End with: "Save this video before your next upload so you don\'t make this mistake!"',
      priority: 'high',
      impact: 'Medium',
      impactPts: Math.round((100 - engagementScore) * 0.10),
    });
  }

  // Visual Tip
  if (!imageMetrics.hasImage) {
    actionableTips.push({
      id: 'visual-upload',
      category: 'visual',
      title: 'Upload a 9:16 Vertical Cover Image',
      problem: 'No cover image was provided, so HookZen could not evaluate the visual first frame.',
      description: 'Upload a 9:16 cover image to enable visual first-frame analysis.',
      exampleFix: 'Upload a 9:16 vertical image with large, bold text overlay.',
      priority: 'quick-win',
      impact: 'Medium',
      impactPts: 10,
    });
  } else if (imageMetrics.contrastRatio < 45 || !imageMetrics.isNineToSixteen) {
    actionableTips.push({
      id: 'visual-opt',
      category: 'visual',
      title: !imageMetrics.isNineToSixteen ? 'Switch to Vertical 9:16 Ratio' : 'Increase Text Contrast & Brightness',
      problem: visualDiagnostic.weaknesses[0] || 'Visual presentation could be optimized for mobile feeds.',
      description: `Visual scored ${visualScore}/100. High contrast and native 9:16 vertical sizing maximize feed click-through.`,
      exampleFix: 'Use bold white or bright yellow text on a darkened background.',
      priority: 'high',
      impact: 'Medium',
      impactPts: Math.round((100 - visualScore) * 0.10),
    });
  }

  // Discoverability Tip
  if (discoverabilityScore < 70) {
    const industryName = (industry || 'niche').toUpperCase();
    const terms = (INDUSTRY_KEYWORDS[industry]?.keywords || []).slice(0, 3).join(', ') || 'niche keywords';
    actionableTips.push({
      id: 'discoverability-1',
      category: 'keywords',
      title: `Mention Popular ${industryName} Keywords Early`,
      problem: discoverabilityDiagnostic.weaknesses[0] || 'Lacks clear niche search terms.',
      description: `Search & Discoverability scored ${discoverabilityScore}/100. Spoken keywords help index your video to relevant audiences.`,
      exampleFix: `Mention defining terms like: ${terms}.`,
      priority: 'quick-win',
      impact: 'Low',
      impactPts: Math.round((100 - discoverabilityScore) * 0.05),
    });
  }

  // 7. Platform Specific Optimizations
  const platformOptimizations: PlatformOptimizations = {
    tiktok: [
      'Add high-contrast auto-captions with word-by-word animation for sound-off viewing.',
      'Select a trending, low-volume background sound to complement pacing and engagement.',
      'Pin a provocative discussion question in your comment section immediately after posting.',
    ],
    reels: [
      'Keep critical text centered in the 1:1 grid safe zone so your profile feed view looks clean.',
      'Avoid placing text in the bottom 20% where captions and audio tags overlap.',
      'Add 3 to 5 targeted topic tags aligned with your specific niche.',
    ],
    shorts: [
      'Craft your final sentence to connect seamlessly with your opening hook for loop-friendly watch time.',
      'Select an eye-catching video frame for your YouTube mobile thumbnail shelf.',
      'Place your primary search keyword in the first sentence of your video title and description.',
    ],
  };

  // 8. Generate 5 Viral Hooks using Viral Logic™
  const scriptInsights = extractScriptInsights(title, transcript, industry);
  const rawViralHooks = generateViralLogicHooks(scriptInsights, 5);
  const viralHooks: ViralHookItem[] = rawViralHooks.map((h, idx) => ({
    id: h.id || `hook-${Date.now()}-${idx}`,
    title: h.title,
    explanation: h.explanation,
    category: h.category,
    score: h.score,
    breakdown: h.breakdown,
    viralLogicVersion: 'V2',
  }));

  // 9. Generate 5 Suggested Title Alternatives
  const topicOrTitle = (title || '').trim() || (transcript || '').trim();
  const randomHookIdeas = getRandomHookSuggestions(topicOrTitle, 5);
  const suggestedTitleAlternatives = randomHookIdeas.map((h) => h.title);

  // 10. Fluff-Free Script Rewrite
  const cleanLines = transcript
    .split('\n')
    .map((line) => {
      let l = line;
      for (const fluff of FLUFF_WORDS) {
        const reg = new RegExp(`\\b${fluff.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        l = l.replace(reg, '');
      }
      return l.replace(/\s+/g, ' ').trim();
    })
    .filter(Boolean);

  const optimizedScript = cleanLines.join('\n');

  // Backwards-compatible category scores object
  const categoryScores: CategoryScores = {
    hookScore,
    pacingScore: retentionScore,
    keywordScore: discoverabilityScore,
    visualScore,
    curiosityScore: detailedAnalysis.curiosity.score,
  };

  return {
    id: `analysis-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    input,
    scoringVersion: '2.0',
    overallScore,
    contentScore: overallScore,
    viralPotential: overallScore,
    viralityTier: tier,
    grade: letterGrade,
    confidence: wordCount < 15 ? 'Low' : confidence,
    modelVersion: 'v2.0',
    letterGrade,
    tier,
    percentileRank,
    componentDiagnostics,
    fixThisFirst,
    creatorContext,
    categoryScores,
    hookAnalysis,
    pacingAnalysis: pacingResult,
    keywordAnalysis,
    imageMetrics,
    retentionCurve,
    actionableTips,
    scriptHeatmap,
    platformOptimizations,
    suggestedTitleAlternatives,
    optimizedScript,
    cleanScript: optimizedScript,
    warnings: wordCount < 15 ? ['Script is very short (under 15 words). Analysis confidence is reduced.'] : [],
    detailedAnalysis,
    viralHooks,
  };
}
