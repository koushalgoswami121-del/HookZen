import { DetailedScriptAnalysis, IndustryType, LetterGrade } from '../types';
import { isMeaninglessText } from './scoringEngine';

/**
 * 100% Offline, Deterministic Script Analyzer for Hookzen.
 * NO external AI APIs (No Gemini, OpenAI, Claude, Grok, or network calls).
 * Uses predefined rules, heuristics, scoring formulas, keyword detection,
 * sentence analysis, pattern matching, and deterministic template filling.
 */

// 1. Hook Analysis Rules
const SLOW_INTRO_PATTERNS = [
  /\bhi guys\b/i,
  /\bhello guys\b/i,
  /\bmy name is\b/i,
  /\bwelcome back\b/i,
  /\bin this video\b/i,
  /\btoday i'm going to\b/i,
  /\btoday i will\b/i,
  /\bso basically\b/i,
  /\bhey everyone\b/i,
  /\bwhat's up guys\b/i,
];

const QUESTION_PATTERNS = [
  /\?/,
  /\bwhy\b/i,
  /\bhow\b/i,
  /\bwhat if\b/i,
  /\bever wonder\b/i,
  /\bdid you know\b/i,
  /\bhave you ever\b/i,
];

const CONTRARIAN_PATTERNS = [
  /\bwrong\b/i,
  /\blies\b/i,
  /\bnobody tells you\b/i,
  /\bstop doing\b/i,
  /\bdon't do\b/i,
  /\bnever do\b/i,
  /\bmyth\b/i,
  /\bfake\b/i,
  /\bruining\b/i,
  /\bdestroying\b/i,
  /\bterrible advice\b/i,
  /\blose viewers\b/i,
  /\blosing\b/i,
  /\bfailing\b/i,
  /\bwasting\b/i,
  /\bbiggest mistake\b/i,
  /\bworst mistake\b/i,
  /\bkill your\b/i,
];

const SURPRISING_FACT_PATTERNS = [
  /\btested \d+\b/i,
  /\baudited \d+\b/i,
  /\bcost me\b/i,
  /\bmillion views\b/i,
  /\b\d+%\b/i, // Catch any percentage like 90%, 95%, 99%, 50%, 10%
  /\b\d+\s*percent\b/i,
  /\bguaranteed\b/i,
  /\bactually works\b/i,
  /\bsecret hack\b/i,
  /\b9 out of 10\b/i,
  /\b\d+x faster\b/i,
  /\bin \d+ seconds\b/i,
];

const STATISTIC_PATTERNS = [
  /\b\d+%\b/i,
  /\b\d+\s*(percent|out of|\/10|x|k|m|b)\b/i,
  /\b\d+\s*(creators|people|users|editors|videos)\b/i,
];

const CURIOSITY_PATTERNS_HOOK = [
  /\bbefore (they|you)\b/i,
  /\buntil (you|they)\b/i,
  /\bthis single\b/i,
  /\bthe reason why\b/i,
  /\bhere's why\b/i,
  /\bwhat happens when\b/i,
  /\bsecret\b/i,
  /\bnobody\b/i,
  /\bhidden\b/i,
  /\bmistake\b/i,
  /\btruth\b/i,
];

const AUDIENCE_CALLOUT_PATTERNS = [
  /\b(if you|creators|editors|anyone|most creators|90% of creators|people who)\b/i,
];

const NUMBER_PATTERN = /\b\d+(\.\d+)?(k|m|b|%)?\b/i;

const CURIOSITY_KEYWORDS = [
  'but',
  'however',
  'until',
  'secret',
  'why',
  'nobody',
  'hidden',
  'mistake',
  'truth',
  'unreal',
  'crazy',
  'mystery',
  'before',
  'reason',
  'trick',
];

// 2. Emotional Dictionaries
const EMOTION_DICTIONARY = {
  fear: ['cost', 'ruin', 'danger', 'lose', 'risk', 'warning', 'fail', 'scared', 'worst', 'disaster', 'never'],
  urgency: ['now', 'stop', 'before', 'fast', 'today', 'immediately', 'quick', 'deadline', 'wait', 'right now'],
  surprise: ['shocking', 'insane', 'unbelievable', 'secret', 'weird', 'crazy', 'actual', 'truth', 'hidden'],
  curiosity: ['why', 'how', 'what if', 'nobody', 'mystery', 'unlock', 'discover', 'reason', 'behind'],
  excitement: ['game changer', 'ultimate', 'amazing', 'huge', 'best', 'boost', 'explosion', 'magic', 'incredible'],
  achievement: ['master', 'grow', 'win', '10x', 'succeed', 'profit', 'results', 'rich', 'level up', 'freedom'],
  loss: ['miss', 'wasted', 'losing', 'dropped', 'forgot', 'spent', 'broke', 'regret', 'lost'],
  pain: ['struggle', 'hard', 'frustrated', 'hate', 'stuck', 'tired of', 'annoying', 'painful', 'terrible'],
  desire: ['want', 'dream', 'freedom', 'easiest', 'perfect', 'effortless', 'love', 'wealth', 'rich', 'shortcut'],
};

// 3. Story Components
const STORY_PATTERNS = {
  problem: /\b(struggling|hard|mistake|wrong|couldn't|failed|hate|stuck|problem|issue|lost|wasted)\b/i,
  conflict: /\b(but then|tried everything|however|until|almost gave up|realized|suddenly|instead|despite)\b/i,
  solution: /\b(finally found|here's how|the trick is|simple fix|strategy|tool|discovered|method|solution|hack)\b/i,
  result: /\b(now i|grew by|increased|made \$|saved|worked|changed everything|results|got \d+)\b/i,
};

// 4. CTA Patterns
const CTA_PATTERNS = [
  /\bfollow\b/i,
  /\bcomment\b/i,
  /\bshare\b/i,
  /\bsave\b/i,
  /\btry this\b/i,
  /\banalyze your hook\b/i,
  /\bimprove your hook\b/i,
  /\bsubscribe\b/i,
  /\blink in bio\b/i,
  /\bclick the link\b/i,
  /\bdrop a\b/i,
  /\bsave this\b/i,
];

// 5. Pattern Interrupt Triggers
const PATTERN_INTERRUPTS = [
  /\bwait\b/i,
  /\blook at this\b/i,
  /\bhere's the crazy part\b/i,
  /\blisten\b/i,
  /\bstop scrolling\b/i,
  /\bhold on\b/i,
  /\bcheck this out\b/i,
];

export function analyzeScriptDeterministically(
  title: string,
  transcript: string,
  industry: IndustryType = 'General' as IndustryType
): DetailedScriptAnalysis {
  const cleanTitle = (title || '').trim();
  const cleanScript = (transcript || '').trim();

  // If input is meaningless / random words / keyboard mash / nonsense / <5 words, return 0 across all vectors
  if (isMeaninglessText(cleanTitle, cleanScript)) {
    return {
      hook: {
        score: 0,
        why: "Input contains fewer than 5 words or consists of unrecognized / gibberish text (e.g. 'sfubfudhf').",
        howToImprove: 'Provide a complete video title and spoken script with at least 5 meaningful words.',
        openingLines: cleanTitle || cleanScript || 'None',
        detectedType: 'Nonsense / Insufficient Input',
        isStrong: false,
        rewardedElements: [],
        penalizedElements: ['Fewer than 5 words or gibberish text'],
      },
      curiosity: {
        score: 0,
        why: 'No curiosity triggers or open loops found in random words.',
        howToImprove: 'Add open loop triggers like "why", "secret", or "nobody tells you".',
        detectedCuriosityWords: [],
        hasUnansweredCuriosity: false,
      },
      emotional: {
        score: 0,
        why: 'Zero emotional drivers detected in random text.',
        howToImprove: 'Inject strong emotional contrast (urgency, frustration, excitement).',
        intensity: 0,
        detectedEmotions: [],
      },
      story: {
        score: 0,
        why: 'No story arc present in random words.',
        howToImprove: 'Structure your script with Problem -> Conflict -> Solution beats.',
        hasProblem: false,
        hasConflict: false,
        hasSolution: false,
        hasResult: false,
        detectedComponents: [],
      },
      retention: {
        score: 0,
        why: 'Cannot measure sentence pacing on invalid or random text.',
        howToImprove: 'Write clear, punchy lines under 12 words per sentence.',
        avgSentenceLength: 0,
        longSentenceCount: 0,
        repetitiveWordCount: 0,
        hasSlowIntro: false,
        punchySentenceCount: 0,
      },
      cta: {
        score: 0,
        why: 'No call-to-action found in random text.',
        howToImprove: 'End with a clear prompt like "Save this for later!".',
        hasCTA: false,
      },
      overallScore: 0,
      letterGrade: 'F',
      strengths: [],
      weaknesses: [
        'Input consists of random words or meaningless text.',
        'Missing opening hook and video structure.',
        'Lacks core narrative and value delivery.',
      ],
      suggestions: [
        'Provide a real video title and spoken script to generate an accurate analysis.',
      ],
      improvedHooks: [],
      scoredTitles: [],
      thumbnailTexts: [],
      improvedCTAs: [],
    };
  }

  const fullText = `${cleanTitle}. ${cleanScript}`.replace(/\s+/g, ' ').trim();
  const lowerText = fullText.toLowerCase();

  // Split into sentences and lines
  const sentences = fullText
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const scriptLines = cleanScript
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // First 1-3 lines or first 25 words for Hook Analysis
  const firstLines = scriptLines.slice(0, 3).join(' ') || sentences.slice(0, 2).join(' ') || cleanTitle;
  const openingWords = firstLines.split(/\s+/).slice(0, 25).join(' ');
  const lowerOpening = openingWords.toLowerCase();

  // ==========================================
  // 1. HOOK ANALYSIS (Lines 1-3)
  // ==========================================
  const rewardedElements: string[] = [];
  const penalizedElements: string[] = [];

  // Check for slow intro penalty
  const hasSlowIntro = SLOW_INTRO_PATTERNS.some((p) => p.test(lowerOpening));

  // Check rewards
  if (STATISTIC_PATTERNS.some((p) => p.test(lowerOpening)) || SURPRISING_FACT_PATTERNS.some((p) => p.test(lowerOpening))) {
    rewardedElements.push('Surprising Statistic / Bold Claim');
  }
  if (CONTRARIAN_PATTERNS.some((p) => p.test(lowerOpening))) {
    rewardedElements.push('Contrarian / High-Stakes Pain Hook');
  }
  if (CURIOSITY_PATTERNS_HOOK.some((p) => p.test(lowerOpening))) {
    rewardedElements.push('Open Loop / Curiosity Trigger');
  }
  if (QUESTION_PATTERNS.some((p) => p.test(lowerOpening))) {
    rewardedElements.push('Intriguing Question');
  }
  if (NUMBER_PATTERN.test(lowerOpening) && !rewardedElements.includes('Surprising Statistic / Bold Claim')) {
    rewardedElements.push('Quantified Specific Number');
  }
  if (AUDIENCE_CALLOUT_PATTERNS.some((p) => p.test(lowerOpening))) {
    rewardedElements.push('Target Audience Callout');
  }

  // Base score depends on whether actual viral hook elements exist
  let hookScore = 20; // Default base for plain text without hooks
  if (rewardedElements.length > 0) {
    hookScore = 55 + rewardedElements.length * 15;
  }
  if (hasSlowIntro) {
    penalizedElements.push('Slow Intro ("Hi guys / Welcome back")');
    hookScore = Math.max(10, hookScore - 25);
  }

  hookScore = Math.min(98, Math.max(10, hookScore));
  const isGoodHook = hookScore >= 70;

  let hookType = 'Weak / Descriptive';
  if (STATISTIC_PATTERNS.some((p) => p.test(lowerOpening))) hookType = 'Statistical Claim';
  else if (CONTRARIAN_PATTERNS.some((p) => p.test(lowerOpening))) hookType = 'Contrarian Take';
  else if (/\?/i.test(lowerOpening)) hookType = 'Question Hook';
  else if (NUMBER_PATTERN.test(lowerOpening)) hookType = 'Quantified Challenge';
  else if (CURIOSITY_PATTERNS_HOOK.some((p) => p.test(lowerOpening))) hookType = 'Curiosity Gap';
  else if (hasSlowIntro) hookType = 'Slow Intro / Low Retention';

  const hookWhy = hasSlowIntro
    ? `Opening contains filler intro words ("${openingWords.slice(0, 30)}..."), causing viewers to scroll away in under 2 seconds.`
    : isGoodHook
    ? `Strong opening hook! Rewards detected: ${rewardedElements.join(', ') || 'Direct engagement'}.`
    : `Opening hook is mild. It lacks strong curiosity triggers, numbers, or a contrarian angle.`;

  const hookHowToImprove = hasSlowIntro
    ? `Immediately remove greeting fillers ("Hi guys") and start directly with a bold question, surprising statistic, or contrarian claim.`
    : `Start the very first sentence with a surprising number or bold mistake (e.g. "I tested 100 viral videos...").`;

  // ==========================================
  // 2. CURIOSITY DETECTION
  // ==========================================
  const detectedCuriosityWords: string[] = [];
  CURIOSITY_KEYWORDS.forEach((word) => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) {
      if (!detectedCuriosityWords.includes(word)) {
        detectedCuriosityWords.push(word);
      }
    }
  });

  // Check if curiosity is introduced in line 1 without immediate resolution
  const hasUnansweredCuriosity =
    detectedCuriosityWords.length > 0 &&
    (lowerOpening.includes('why') || lowerOpening.includes('secret') || lowerOpening.includes('mistake') || lowerOpening.includes('until') || lowerOpening.includes('before'));

  let curiosityScore = detectedCuriosityWords.length > 0
    ? 45 + detectedCuriosityWords.length * 12 + (hasUnansweredCuriosity ? 15 : 0)
    : 15;
  if (STATISTIC_PATTERNS.some((p) => p.test(lowerOpening))) curiosityScore += 12; // Statistics create immediate curiosity gaps!
  curiosityScore = Math.min(98, Math.max(10, curiosityScore));

  const curiosityWhy = detectedCuriosityWords.length > 0
    ? `Detected ${detectedCuriosityWords.length} curiosity triggers (${detectedCuriosityWords.slice(0, 4).map((w) => `"${w}"`).join(', ')}). ${
        hasUnansweredCuriosity ? 'Unanswered curiosity gap holds viewer attention past 5s.' : 'Consider delaying the reveal.'
      }`
    : `No curiosity triggers ("secret", "why", "hidden", "mistake") detected in the text.`;

  const curiosityHowToImprove = `Add curiosity gap words like "secret", "nobody tells you", or "until" in the first 2 sentences before revealing your core tip.`;

  // ==========================================
  // 3. EMOTIONAL ANALYSIS
  // ==========================================
  const detectedEmotions: string[] = [];
  let emotionalIntensity = 15;

  Object.entries(EMOTION_DICTIONARY).forEach(([emotionName, keywords]) => {
    const matched = keywords.some((kw) => lowerText.includes(kw));
    if (matched) {
      detectedEmotions.push(emotionName);
      emotionalIntensity += 15;
    }
  });

  // Additional intensity boost for power words
  const powerWordMatches = lowerText.match(/\b(insane|crazy|disaster|secret|mistake|ruin|hack|guaranteed|shocking|lose|failing)\b/g);
  if (powerWordMatches) {
    emotionalIntensity += powerWordMatches.length * 8;
  }

  const emotionalScore = Math.min(98, Math.max(10, emotionalIntensity));

  const emotionalWhy = detectedEmotions.length > 0
    ? `Script triggers key emotional drivers: ${detectedEmotions.map((e) => e.toUpperCase()).join(', ')}.`
    : `Script reads neutral and lacks high-contrast emotional words (fear, urgency, excitement).`;

  const emotionalHowToImprove = `Inject emotional tension by highlighting pain ("frustrated", "wasted time") before revealing excitement or achievement.`;

  // ==========================================
  // 4. STORY ANALYSIS
  // ==========================================
  const hasProblem = STORY_PATTERNS.problem.test(lowerText);
  const hasConflict = STORY_PATTERNS.conflict.test(lowerText);
  const hasSolution = STORY_PATTERNS.solution.test(lowerText);
  const hasResult = STORY_PATTERNS.result.test(lowerText);

  const detectedComponents: string[] = [];
  if (hasProblem) detectedComponents.push('Problem');
  if (hasConflict) detectedComponents.push('Conflict');
  if (hasSolution) detectedComponents.push('Solution');
  if (hasResult) detectedComponents.push('Result');

  const storyScore = detectedComponents.length > 0
    ? Math.min(98, 30 + detectedComponents.length * 16)
    : 15;

  const storyWhy = detectedComponents.length >= 3
    ? `Strong story arc detected (${detectedComponents.join(' → ')}). Storytelling drives 40% higher watch-through.`
    : `Incomplete story arc. Detected: ${detectedComponents.length > 0 ? detectedComponents.join(', ') : 'None'}. Missing: ${
        ['Problem', 'Conflict', 'Solution', 'Result'].filter((c) => !detectedComponents.includes(c)).join(', ')
      }.`;

  const storyHowToImprove = `Structure your script in 4 beats: 1. Problem ("I was struggling with X"), 2. Conflict ("Until this happened"), 3. Solution ("Here is the fix"), 4. Result ("Now I get 10x output").`;

  // ==========================================
  // 5. RETENTION ANALYSIS (Pacing)
  // ==========================================
  const words = fullText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  const sentenceWordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avgSentenceLength = sentenceWordCounts.length > 0
    ? Math.round(sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length)
    : 15;

  const longSentenceCount = sentenceWordCounts.filter((len) => len > 22).length;
  const punchySentenceCount = sentenceWordCounts.filter((len) => len >= 3 && len <= 12).length;

  // Repetitive words check (excluding basic stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'in', 'of', 'for', 'is', 'it', 'you', 'your', 'i', 'my', 'that', 'this', 'on', 'with', 'so']);
  const wordFreq: Record<string, number> = {};
  words.forEach((w) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  });

  const repetitiveWordCount = Object.values(wordFreq).filter((count) => count >= 4).length;

  // Pattern interrupts count
  const patternInterruptCount = PATTERN_INTERRUPTS.reduce((acc, pat) => (pat.test(lowerText) ? acc + 1 : acc), 0);

  let retentionScore = totalWords >= 10 ? 50 : 20;
  if (avgSentenceLength <= 14) retentionScore += 15;
  else if (avgSentenceLength > 20) retentionScore -= 15;

  retentionScore -= longSentenceCount * 6;
  retentionScore += punchySentenceCount * 3;
  retentionScore += patternInterruptCount * 8;
  if (repetitiveWordCount > 2) retentionScore -= 8;
  if (hasSlowIntro) retentionScore -= 15;

  retentionScore = Math.min(98, Math.max(10, retentionScore));

  const retentionWhy = `Average sentence length is ${avgSentenceLength} words. Found ${punchySentenceCount} punchy short lines, ${longSentenceCount} long sentences, and ${patternInterruptCount} pattern interrupts.`;

  const retentionHowToImprove = `Keep sentence length under 12 words per line. Break long paragraphs into quick 1-line statements to maintain fast visual pacing.`;

  // ==========================================
  // 6. CTA ANALYSIS
  // ==========================================
  const endSnippet = scriptLines.slice(-2).join(' ') || sentences.slice(-2).join(' ') || lowerText;
  const lowerEnd = endSnippet.toLowerCase();

  const hasCTA = CTA_PATTERNS.some((p) => p.test(lowerEnd));
  let detectedCTA = undefined;
  if (hasCTA) {
    const matchedCTA = CTA_PATTERNS.find((p) => p.test(lowerEnd));
    detectedCTA = matchedCTA ? endSnippet : 'Clear Action Prompt';
  }

  const ctaScore = hasCTA ? 92 : 15;
  const ctaWhy = hasCTA
    ? `Clear Call To Action (CTA) detected at the end of the script, boosting engagement and saves.`
    : `No closing CTA found ("Follow", "Save", "Comment", "Try this"). Viewers need a direct instruction before scrolling.`;

  const ctaHowToImprove = `End your script with a high-value action instruction like: "Save this video for your next edit!" or "Comment 'HOOK' for the full guide."`;

  // ==========================================
  // 7. SEO ANALYSIS (5%)
  // ==========================================
  const hasTitleKeywords = cleanTitle.length > 3;
  let seoScore = 30;
  if (hasTitleKeywords) seoScore += 25;
  if (totalWords >= 15 && totalWords <= 350) seoScore += 25;
  if (repetitiveWordCount === 0) seoScore += 10;
  seoScore = Math.min(98, Math.max(10, seoScore));

  // ==========================================
  // 8. OVERALL SCORE & LETTER GRADE
  // Weight Breakdown:
  // Hook 35%, Curiosity 20%, Story 15%, Emotion 10%, Pacing (Retention) 10%, CTA 5%, SEO 5%
  // ==========================================
  const overallScore = Math.round(
    hookScore * 0.35 +
    curiosityScore * 0.20 +
    storyScore * 0.15 +
    emotionalScore * 0.10 +
    retentionScore * 0.10 +
    ctaScore * 0.05 +
    seoScore * 0.05
  );

  let letterGrade: LetterGrade = 'F';
  if (overallScore >= 90) letterGrade = 'A+';
  else if (overallScore >= 80) letterGrade = 'A';
  else if (overallScore >= 70) letterGrade = 'B';
  else if (overallScore >= 55) letterGrade = 'C';
  else if (overallScore >= 35) letterGrade = 'D';

  // ==========================================
  // 8. STRENGTHS & WEAKNESSES LISTS
  // ==========================================
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (hookScore >= 70) strengths.push('High-impact opening hook stops feed scrolling early.');
  else weaknesses.push('The first sentence is weak and lacks a scroll-stopping trigger.');

  if (hasUnansweredCuriosity || curiosityScore >= 70) strengths.push('Strong curiosity gaps keep viewers watching past 5 seconds.');
  else weaknesses.push('Lacks curiosity gap before revealing key answers.');

  if (emotionalScore >= 70) strengths.push(`Triggers strong emotional nodes (${detectedEmotions.slice(0, 3).join(', ')}).`);
  else weaknesses.push('Emotional intensity is neutral; needs stronger emotional contrast.');

  if (storyScore >= 75) strengths.push(`Complete story framework present (${detectedComponents.join(' → ')}).`);
  else weaknesses.push('Story structure is missing problem/conflict transitions.');

  if (retentionScore >= 75) strengths.push(`Fast, punchy sentence rhythm (${avgSentenceLength} words/line avg).`);
  else weaknesses.push('Sentences are too long or contain repetitive word patterns.');

  if (hasCTA) strengths.push('Includes a direct Call-To-Action to maximize saves & comments.');
  else weaknesses.push('Missing a clear CTA at the end of the script.');

  // Ensure min 3 of each
  if (strengths.length < 3) strengths.push('Clean clarity and easy-to-follow core message topic.');
  if (strengths.length < 3) strengths.push('Good foundation for short-form video adaptation.');

  // ==========================================
  // 9. ACTIONABLE SUGGESTIONS GENERATOR
  // ==========================================
  const suggestions: string[] = [];
  if (hookScore < 70) suggestions.push('The first sentence is weak — replace slow intros with a bold claim or question.');
  if (curiosityScore < 70) suggestions.push('Add curiosity before revealing the answer (use "nobody tells you" or "until").');
  if (retentionScore < 70) suggestions.push('Reduce sentence length to under 12 words for fast-paced short-form delivery.');
  if (emotionalScore < 70) suggestions.push('Create stronger emotional contrast by highlighting pain before success.');
  if (storyScore < 70) suggestions.push('Structure your content into a clear Problem → Conflict → Solution arc.');
  if (!hasCTA) suggestions.push('End with a direct CTA (e.g. "Save this video right now!").');
  suggestions.push('Start with a surprising statistic or quantified test result.');

  // ==========================================
  // 10. HOOK GENERATOR (5 Templates)
  // ==========================================
  const isGenericTopic = !cleanTitle || cleanTitle.trim().length < 3 || ['tech', 'fitness', 'finance', 'real estate', 'gaming', 'fashion', 'e-commerce', 'general'].includes(cleanTitle.toLowerCase().trim());
  const topicKeyword = !isGenericTopic ? cleanTitle.trim() : '[your topic]';
  const cleanSnippet = (sentences[0] || cleanTitle || 'viral content')
    .replace(/^(hey guys|welcome back|in this video|today|so basically|what's up|hello)/gi, '')
    .trim();

  const shortSnippet = cleanSnippet.length > 40 ? `${cleanSnippet.slice(0, 38)}...` : cleanSnippet;

  const improvedHooks = [
    {
      title: `Everyone is doing ${topicKeyword} completely wrong. Here is what actually works instead...`,
      explanation: 'Contrarian positioning immediately separates your video from generic feed advice.',
      category: 'Contrarian Take Template',
    },
    {
      title: `I tested 100 ${topicKeyword} strategies, and this single change doubled my views!`,
      explanation: 'Quantified social proof + mystery result triggers immediate curiosity.',
      category: 'I Tested Template',
    },
    {
      title: `Nobody tells you this about ${topicKeyword}, but doing this mistake cost me 2M views...`,
      explanation: 'Insider secret + negative consequence creates FOMO and scroll stop.',
      category: 'Nobody Tells You Template',
    },
    {
      title: `The biggest mistake people make with ${topicKeyword}? ${shortSnippet}`,
      explanation: 'Direct callout of mistake forces viewers to check if they are guilty.',
      category: 'Biggest Mistake Template',
    },
    {
      title: `I wish I knew this ${topicKeyword} hack earlier... Stop doing it the hard way!`,
      explanation: 'Shortcut promise lowers friction and promises fast value.',
      category: 'Wish I Knew Template',
    },
  ];

  // ==========================================
  // 11. TITLE GENERATOR (10 Scored Titles)
  // ==========================================
  const scoredTitles = [
    {
      title: `I Tested 100 ${topicKeyword} Hacks — Here Is What Actually Works`,
      score: 97,
      reason: 'Contains quantified test result + contrarian resolution.',
    },
    {
      title: `Why 95% of People Are Doing ${topicKeyword} Completely Wrong`,
      score: 95,
      reason: 'High curiosity gap with specific percentage callout.',
    },
    {
      title: `The 3-Second ${topicKeyword} Mistake Ruining Your Viral Reach`,
      score: 94,
      reason: 'Urgent negative warning with time constraint.',
    },
    {
      title: `Stop Doing ${topicKeyword} Like This Until You Watch This Video`,
      score: 92,
      reason: 'Direct negative pattern interrupt forcing a immediate pause.',
    },
    {
      title: `This Simple ${topicKeyword} Trick Changed My Results Forever`,
      score: 90,
      reason: 'High-value transformation arc promise.',
    },
    {
      title: `How I Mastered ${topicKeyword} in 7 Days (Step-by-Step)`,
      score: 88,
      reason: 'Clear timeline promise with low learning friction.',
    },
    {
      title: `The Secret ${topicKeyword} Strategy Top Creators Don't Want You to Know`,
      score: 86,
      reason: 'Insider gatekeeping frame triggers high curiosity.',
    },
    {
      title: `If You're Still Struggling With ${topicKeyword}, Try This Right Now`,
      score: 85,
      reason: 'Direct target audience calling out specific pain point.',
    },
    {
      title: `3 Unbelievable ${topicKeyword} Secrets You Need to Know in 2026`,
      score: 83,
      reason: 'Numbered list with current temporal relevance.',
    },
    {
      title: `Don't Make This ${topicKeyword} Error Before Posting Your Next Short`,
      score: 81,
      reason: 'Pre-action fear threshold trigger.',
    },
  ];

  // ==========================================
  // 12. THUMBNAIL TEXT GENERATOR (5 Texts <= 5 Words)
  // ==========================================
  const thumbnailTexts = [
    'STOP DOING THIS!',
    '100 VIDEO EXPERIMENT',
    'THE 3-SECOND SECRET',
    "DON'T MAKE THIS MISTAKE",
    'DO THIS INSTEAD!',
  ];

  // ==========================================
  // 13. IMPROVED CTAS
  // ==========================================
  const improvedCTAs = [
    'Save this video before you edit your next Short!',
    'Comment "HOOK" to get my free 10-step viral script checklist!',
    'Follow @Hookzen for daily high-retention script breakdowns.',
    'Share this with a friend who needs to stop making this mistake!',
  ];

  return {
    overallScore,
    letterGrade,
    hook: {
      score: hookScore,
      why: hookWhy,
      howToImprove: hookHowToImprove,
      openingLines: openingWords,
      detectedType: hookType,
      isStrong: isGoodHook,
      rewardedElements,
      penalizedElements,
    },
    curiosity: {
      score: curiosityScore,
      why: curiosityWhy,
      howToImprove: curiosityHowToImprove,
      detectedCuriosityWords,
      hasUnansweredCuriosity,
    },
    emotional: {
      score: emotionalScore,
      why: emotionalWhy,
      howToImprove: emotionalHowToImprove,
      intensity: emotionalIntensity,
      detectedEmotions,
    },
    story: {
      score: storyScore,
      why: storyWhy,
      howToImprove: storyHowToImprove,
      hasProblem,
      hasConflict,
      hasSolution,
      hasResult,
      detectedComponents,
    },
    retention: {
      score: retentionScore,
      why: retentionWhy,
      howToImprove: retentionHowToImprove,
      avgSentenceLength,
      longSentenceCount,
      repetitiveWordCount,
      hasSlowIntro,
      punchySentenceCount,
    },
    cta: {
      score: ctaScore,
      why: ctaWhy,
      howToImprove: ctaHowToImprove,
      hasCTA,
      detectedCTA,
    },
    strengths,
    weaknesses,
    suggestions,
    improvedHooks,
    scoredTitles,
    thumbnailTexts,
    improvedCTAs,
  };
}
