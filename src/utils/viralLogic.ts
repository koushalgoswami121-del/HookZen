import { ScriptInsights, SemanticContentModel } from './scriptBrain';
import { analyzeContentUnderstanding, ContentUnderstanding } from './ContentUnderstanding';
import { reasonAboutStory, StoryReasoning } from './storyReasoning';
import { generateIntelligentCandidates, IntelligentCandidate } from './intelligentHookGenerator';
import { judgeHookCandidate, extractStructuralSignature, JudgeResult } from './hookJudge';

export interface ViralHookCandidate {
  id?: string;
  title: string;
  category: string;
  score: number;
  breakdown: {
    relevance: number;
    curiosity: number;
    clarity: number;
    specificity: number;
    credibility: number;
    patternInterrupt: number;
    emotionalPull: number;
    audienceFit: number;
  };
  explanation: string;
}

export interface ViralLogicOptions {
  seed?: number;
  excludeTitles?: string[];
}

/**
 * Viral Logic™ Engine
 *
 * 100% Local, Deterministic AI Intelligence Pipeline:
 *
 * SCRIPT
 *   ↓
 * CONTENT UNDERSTANDING (src/utils/contentUnderstanding.ts)
 *   ↓
 * STORY REASONING (src/utils/storyReasoning.ts)
 *   ↓
 * PSYCHOLOGICAL OPPORTUNITY DETECTION
 *   ↓
 * ORIGINAL HOOK GENERATION (src/utils/intelligentHookGenerator.ts)
 *   ↓
 * HOOK CRITIC / JUDGE (src/utils/hookJudge.ts)
 *   ↓
 * VIRAL LOGIC SCORING
 *   ↓
 * DIVERSITY SELECTION
 *   ↓
 * TOP 5 HOOKS
 */

const UNSUPPORTED_CLAIM_PATTERNS = [
  /\b95%\b/i,
  /\b99%\b/i,
  /\b100%\b/i,
  /\b10x\b/i,
  /\b100x\b/i,
  /\bguaranteed\b/i,
  /\bguarantee\b/i,
  /\bmillions of\b/i,
  /\bwill go viral\b/i,
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clean(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();
}

function sentenceCase(value: string): string {
  const text = clean(value);
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function removeTrailingPunctuation(value: string): string {
  return clean(value).replace(/[.!?]+$/, '');
}

function hasRealNumber(value: string): boolean {
  if (!value) return false;
  return /\d/.test(value) || /\$|₹|€|£/.test(value);
}

function containsUnsupportedClaim(hook: string): boolean {
  return UNSUPPORTED_CLAIM_PATTERNS.some(pattern => pattern.test(hook));
}

function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string): number {
  const aWords = new Set(normalizeForComparison(a).split(' ').filter(Boolean));
  const bWords = new Set(normalizeForComparison(b).split(' ').filter(Boolean));

  if (!aWords.size || !bWords.size) return 0;

  let intersection = 0;
  for (const word of aWords) {
    if (bWords.has(word)) intersection++;
  }

  const union = new Set([...aWords, ...bWords]).size;
  return union ? intersection / union : 0;
}

/**
 * Hard pre-scoring validation layer (Preserved for backward compatibility).
 */
export function passesHardQualityFilter(
  hook: string,
  model?: SemanticContentModel
): { isValid: boolean; reason?: string } {
  const text = hook.trim();
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length < 6) return { isValid: false, reason: 'Too short' };
  if (words.length > 28) return { isValid: false, reason: 'Too long' };

  if (/\[.*?\]/.test(text)) {
    return { isValid: false, reason: 'Placeholder found' };
  }

  if (containsUnsupportedClaim(text)) {
    return { isValid: false, reason: 'Unsupported claim' };
  }

  if (/\b(?:your|my|our|their|his|her)\s+(?:doing|waking|running|getting|making|having|trying|wasting|spending|stopping|building|eating|training|leaving|choosing)\b/i.test(text)) {
    return { isValid: false, reason: 'Pronoun + gerund violation' };
  }

  if (/\b(?:on\s+on|in\s+in|to\s+to|with\s+with|at\s+at|by\s+by|from\s+from|in\s+into|on\s+onto|at\s+in|to\s+into|with\s+about|of\s+about)\b/i.test(text)) {
    return { isValid: false, reason: 'Double preposition' };
  }

  if (/\b(?:before|after)\s+you\s+(?:doing|running|spending|trying|waking|getting|eating|making|choosing)\b/i.test(text)) {
    return { isValid: false, reason: 'Before/after you + gerund' };
  }

  if (/[,\s]+(?:that|with|and|to|for|because|which|the|a|an|or|but|if|about|on|in|at|by)$/i.test(text.replace(/[.!?]+$/, ''))) {
    return { isValid: false, reason: 'Dangling ending' };
  }

  if (/\b([a-zA-Z]{3,})\s+\1\b/i.test(text)) {
    return { isValid: false, reason: 'Duplicate consecutive word' };
  }

  if (/\b(?:spend|wasting|cost me|spent)\s+\d+\s+on\b/i.test(text)) {
    return { isValid: false, reason: 'Un-denominated spend number' };
  }

  if (/\b(?:part of|approach to|results with|bottleneck in|myth about|stalling your|truth about|advice about|understand|about|with)\s+(?:\$|₹|€|£|\d+|five|ten)\b/i.test(text)) {
    return { isValid: false, reason: 'Incidental number treated as topic' };
  }

  if (/\bpart of\s+(?:5|five|10|ten|\d+)\b/i.test(text)) {
    return { isValid: false, reason: 'Incidental number treated as topic' };
  }

  if (/\b(?:5|five|10|ten|\d+)\s+ai\s+tools\s+(?:isn't|is\s+the|might|ruined|stalling)\b/i.test(text)) {
    return { isValid: false, reason: 'Incidental phrase treated as topic' };
  }

  if (/\bthe real bottleneck in\b|\bwhat if the standard advice about\b|\bstop approaching [a-z]+ workflow\b/i.test(text)) {
    return { isValid: false, reason: 'Generic template detected' };
  }

  if (/\bwasted almost\b|\bwasted instagram\b|\bstopping doing\b|\bstop changing your\b/i.test(text)) {
    return { isValid: false, reason: 'Malformed phrase' };
  }

  return { isValid: true };
}

export function validateHookGrammar(hook: string, topic?: string): { isValid: boolean; reason?: string } {
  return passesHardQualityFilter(hook, topic ? ({ topic } as any) : undefined);
}

/**
 * Scores an intelligent candidate based on deep script alignment, psychological strength,
 * concrete specificity, curiosity, and naturalness.
 */
function scoreIntelligentCandidate(
  cand: IntelligentCandidate,
  understanding: ContentUnderstanding,
  reasoning: StoryReasoning
): ViralHookCandidate['breakdown'] {
  const title = cand.title;
  const cd = understanding.concreteDetails;

  // 1. Relevance: Deep alignment with conflict, lesson, or action
  let relevance = 88;
  if (cand.groundedIn) relevance += 4;
  if (cd.monetary && title.includes(cd.monetary)) relevance += 4;

  // 2. Curiosity: Information gap, unexpected twist, or counter-intuitive decision
  let curiosity = 80;
  if (/why|how|what actually|secret|realized|trap|no-brainer/i.test(title)) curiosity += 8;
  if (/—|--|:/.test(title)) curiosity += 6; // dash pause or setup/punchline
  if (cand.opportunityType === 'unexpected_outcome' || cand.opportunityType === 'curiosity') curiosity += 6;

  // 3. Clarity: Clean syntax, conversational rhythm, easy to read in 2 seconds
  const words = title.split(/\s+/).length;
  let clarity = 92;
  if (words >= 11 && words <= 20) clarity += 4;
  if (words > 25) clarity -= 10;

  // 4. Specificity: Preference for concrete numbers, timelines, and skills over generic summaries
  let specificity = 75;
  if (hasRealNumber(title)) specificity += 15;
  if (cd.timeline && title.toLowerCase().includes(cd.timeline.toLowerCase())) specificity += 5;
  if (cd.keySkill && title.toLowerCase().includes(cd.keySkill.toLowerCase())) specificity += 5;

  // 5. Credibility: Backed by script evidence, zero invented stats
  let credibility = 95;
  if (containsUnsupportedClaim(title)) credibility = 30;

  // 6. Pattern Interrupt: Stops passive scrolling with unexpected choice
  let patternInterrupt = 80;
  if (/turned down|saying no|walked away|rejected|gave up|sounded crazy|smartest move/i.test(title)) {
    patternInterrupt += 12;
  }
  if (cand.opportunityType === 'contradiction' || cand.opportunityType === 'confession') {
    patternInterrupt += 5;
  }

  // 7. Emotional Pull: Relatability, fear of wrong career move, desire for time freedom
  let emotionalPull = 78;
  if (/buying back|life|time|terrifying|freedom|bet on myself|own my time/i.test(title)) {
    emotionalPull += 14;
  }

  // 8. Audience Fit: Tailored to creators, professionals, or builders
  const audienceFit = 92;

  return {
    relevance: clamp(relevance),
    curiosity: clamp(curiosity),
    clarity: clamp(clarity),
    specificity: clamp(specificity),
    credibility: clamp(credibility),
    patternInterrupt: clamp(patternInterrupt),
    emotionalPull: clamp(emotionalPull),
    audienceFit: clamp(audienceFit),
  };
}

function calculateOverallScore(breakdown: ViralHookCandidate['breakdown']): number {
  return clamp(
    breakdown.relevance * 0.2 +
      breakdown.curiosity * 0.2 +
      breakdown.clarity * 0.15 +
      breakdown.specificity * 0.15 +
      breakdown.credibility * 0.1 +
      breakdown.patternInterrupt * 0.1 +
      breakdown.emotionalPull * 0.05 +
      breakdown.audienceFit * 0.05
  );
}

function createIntelligentExplanation(
  cand: IntelligentCandidate,
  breakdown: ViralHookCandidate['breakdown']
): string {
  const strengths: Array<[number, string]> = [
    [breakdown.specificity, 'grounds the claim with concrete numbers from the script'],
    [breakdown.patternInterrupt, 'shatters conventional expectations in the opening seconds'],
    [breakdown.curiosity, 'creates an immediate curiosity gap around the outcome'],
    [breakdown.emotionalPull, 'taps directly into personal time freedom vs salary sacrifice'],
    [breakdown.relevance, 'speaks directly to the core lesson of the story'],
  ];

  strengths.sort((a, b) => b[0] - a[0]);
  const primary = strengths[0]?.[1] || 'captures attention immediately';

  return `${cand.category} hook that ${primary}.`;
}

/**
 * Selects 5 top hooks ensuring high diversity across:
 * - Psychological opportunity / category
 * - Structural sentence signatures (no repeated "What if...", "I turned down...")
 * - Exclusion history
 */
function selectDiverseTopHooks(
  candidates: Array<{ candidate: ViralHookCandidate; signature: string; opportunityType: string }>,
  count = 5,
  options?: ViralLogicOptions
): ViralHookCandidate[] {
  const excludeSet = new Set((options?.excludeTitles || []).map(t => normalizeForComparison(t)));
  const seed = options?.seed || 0;

  // Filter exclusions
  let pool = candidates.filter(c => !excludeSet.has(normalizeForComparison(c.candidate.title)));
  if (pool.length < count) pool = candidates;

  // Deterministic seed offset for refresh variety
  const scoredWithSeed = pool.map((item, i) => {
    const seedOffset = seed > 0 ? ((Math.sin(seed + i * 19) + 1) * 2.5) : 0;
    return {
      ...item,
      effectiveScore: item.candidate.score + seedOffset,
    };
  });

  scoredWithSeed.sort((a, b) => b.effectiveScore - a.effectiveScore);

  const selected: ViralHookCandidate[] = [];
  const usedCategories = new Set<string>();
  const usedSignatures = new Set<string>();

  // Pass 1: Strict Diversity (Both unique Category AND unique Structural Signature)
  for (const item of scoredWithSeed) {
    if (selected.length >= count) break;

    const cand = item.candidate;
    if (usedCategories.has(cand.category)) continue;
    if (usedSignatures.has(item.signature)) continue;

    // Check lexical similarity
    const tooSimilar = selected.some(existing => similarity(existing.title, cand.title) > 0.55);
    if (tooSimilar) continue;

    selected.push(cand);
    usedCategories.add(cand.category);
    usedSignatures.add(item.signature);
  }

  // Pass 2: Relax Category restriction if needed, but maintain structural signature uniqueness
  for (const item of scoredWithSeed) {
    if (selected.length >= count) break;

    const cand = item.candidate;
    if (selected.some(s => s.title === cand.title)) continue;
    if (usedSignatures.has(item.signature)) continue;

    const tooSimilar = selected.some(existing => similarity(existing.title, cand.title) > 0.65);
    if (tooSimilar) continue;

    selected.push(cand);
    usedSignatures.add(item.signature);
  }

  // Pass 3: Fill remaining if diversity was too restrictive
  for (const item of scoredWithSeed) {
    if (selected.length >= count) break;

    const cand = item.candidate;
    if (selected.some(s => s.title === cand.title)) continue;

    selected.push(cand);
  }

  return selected.slice(0, count);
}

/**
 * Complete Diagnostic Pipeline for Testing & Development
 */
export function runIntelligencePipelineDiagnostics(
  title: string,
  transcript: string,
  industry = 'General'
) {
  // 1. Content Understanding
  const understanding = analyzeContentUnderstanding(title, transcript, industry);

  // 2. Story Reasoning
  const reasoning = reasonAboutStory(understanding);

  // 3. Intelligent Candidate Generation
  const rawCandidates = generateIntelligentCandidates(understanding, reasoning);

  // 4. Hook Critic / Judge
  const acceptedSignatures = new Map<string, number>();
  const judgedResults: JudgeResult[] = [];
  const rejectedCandidates: Array<{ title: string; reason: string }> = [];

  for (const cand of rawCandidates) {
    const judgeRes = judgeHookCandidate(cand, understanding, reasoning, acceptedSignatures);
    judgedResults.push(judgeRes);
    if (judgeRes.isValid) {
      const sig = judgeRes.evaluation.structuralSignature;
      acceptedSignatures.set(sig, (acceptedSignatures.get(sig) || 0) + 1);
    } else {
      rejectedCandidates.push({
        title: cand.title,
        reason: judgeRes.rejectReason || 'Critic rejection',
      });
    }
  }

  // 5. Viral Logic Scoring
  const valid = judgedResults.filter(j => j.isValid);
  const scoredItems = valid.map((j, idx) => {
    const cand = j.candidate;
    const breakdown = scoreIntelligentCandidate(cand, understanding, reasoning);
    const score = calculateOverallScore(breakdown);
    const explanation = createIntelligentExplanation(cand, breakdown);

    const viralCand: ViralHookCandidate = {
      id: `hk_${Date.now()}_${idx}`,
      title: cand.title,
      category: cand.category,
      score,
      breakdown,
      explanation,
    };

    return {
      candidate: viralCand,
      signature: j.evaluation.structuralSignature,
      opportunityType: cand.opportunityType,
    };
  });

  // 6. Diversity Selection (Top 5)
  const top5 = selectDiverseTopHooks(scoredItems, 5);

  return {
    understanding,
    reasoning,
    rawCandidates,
    judgedResults,
    rejectedCandidates,
    scoredItems,
    top5,
  };
}

/**
 * Main Viral Logic™ Entry Point
 *
 * Integrates directly into existing HookZen flow:
 * SCRIPT → CONTENT UNDERSTANDING → STORY REASONING → OPPORTUNITIES →
 * GENERATOR → HOOK JUDGE → VIRAL LOGIC SCORING → DIVERSITY → TOP 5
 */
export function generateViralLogicHooks(
  insights: ScriptInsights,
  count = 5,
  options?: ViralLogicOptions
): ViralHookCandidate[] {
  const title = insights.title || insights.cleanTopic || '';
  const transcript = insights.transcript || insights.rawCleanText || '';
  const industry = insights.industry || 'General';

  // 1. Content Understanding
  const understanding = analyzeContentUnderstanding(title, transcript, industry);

  // 2. Story Reasoning
  const reasoning = reasonAboutStory(understanding);

  // 3. Candidate Generation (15-30 candidates)
  const rawCandidates = generateIntelligentCandidates(understanding, reasoning);

  // 4. Hook Critic / Judge
  const acceptedSignatures = new Map<string, number>();
  const judgedValid: Array<{ candidate: IntelligentCandidate; signature: string }> = [];

  for (const cand of rawCandidates) {
    const judgeRes = judgeHookCandidate(cand, understanding, reasoning, acceptedSignatures);
    if (judgeRes.isValid) {
      const sig = judgeRes.evaluation.structuralSignature;
      acceptedSignatures.set(sig, (acceptedSignatures.get(sig) || 0) + 1);
      judgedValid.push({ candidate: cand, signature: sig });
    }
  }

  // 5. Viral Logic Scoring
  const seed = options?.seed || Date.now();
  const scoredItems = judgedValid.map((item, idx) => {
    const cand = item.candidate;
    const breakdown = scoreIntelligentCandidate(cand, understanding, reasoning);
    const score = calculateOverallScore(breakdown);
    const explanation = createIntelligentExplanation(cand, breakdown);

    const viralCandidate: ViralHookCandidate = {
      id: `hk_${seed}_${idx}`,
      title: cand.title,
      category: cand.category,
      score,
      breakdown,
      explanation,
    };

    return {
      candidate: viralCandidate,
      signature: item.signature,
      opportunityType: cand.opportunityType,
    };
  });

  // 6. Diversity Selection
  return selectDiverseTopHooks(scoredItems, count, options);
}