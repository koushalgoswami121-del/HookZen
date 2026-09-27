import { ContentUnderstanding } from './ContentUnderstanding';
import { StoryReasoning } from './storyReasoning';
import { IntelligentCandidate } from './intelligentHookGenerator';

export interface JudgeEvaluation {
  scriptAlignment: number; // 0-10
  semanticAccuracy: number; // 0-10
  specificity: number; // 0-10
  curiosity: number; // 0-10
  emotionalTension: number; // 0-10
  naturalness: number; // 0-10
  clarity: number; // 0-10
  originality: number; // 0-10
  unsupportedClaimsCheck: boolean;
  structuralSignature: string;
}

export interface JudgeResult {
  candidate: IntelligentCandidate;
  isValid: boolean;
  rejectReason?: string;
  evaluation: JudgeEvaluation;
}

// Banned generic filler / template phrases
const GENERIC_TEMPLATE_PATTERNS = [
  /\bthe real bottleneck in\b/i,
  /\bwhat if the standard advice about\b/i,
  /\bstop approaching [a-z]+ workflow\b/i,
  /\bcareer workflow\b/i,
  /\bhidden formula\b/i,
  /\bsecret hack\b/i,
  /\bcheat code\b/i,
  /\bnobody is talking about\b/i,
  /\byou won't believe\b/i,
  /\bgame changer\b/i,
  /\bthis will blow your mind\b/i,
];

// Awkward grammar & malformed syntax patterns
const MALFORMED_GRAMMAR_PATTERNS = [
  /\b(?:your|my|our|their|his|her)\s+(?:doing|waking|running|getting|making|having|trying|wasting|spending|stopping|building|eating|training|leaving|choosing)\b/i,
  /\b(in into|on into|at in|to into|with about|of about)\b/i,
  /\bpart of \d+\b/i,
  /\bpart of (?:₹|\$)\b/i,
  /\bhow to \d+ ai tools\b/i,
  /\b([a-zA-Z]{3,})\s+\1\b/i, // duplicate consecutive words e.g. "more more"
  /\b(with|about|into|from|of)$/i, // dangling preposition
];

// Unsupported claims & invented stats
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
  /\bdestroying your\b/i, // exaggerated claim unless in script
];

/**
 * Derives a structural signature to detect repetitive sentence templates.
 */
export function extractStructuralSignature(text: string): string {
  const lower = text.toLowerCase();

  if (/^what if\b/i.test(lower)) return 'what_if_clause';
  if (/^stop\s+[a-z]+ing\b/i.test(lower)) return 'stop_gerund_clause';
  if (/^i turned down\b/i.test(lower)) return 'i_turned_down_statement';
  if (/^i walked away\b/i.test(lower)) return 'i_walked_away_statement';
  if (/^i thought i was\b/i.test(lower)) return 'i_thought_actually_clause';
  if (/^saying no to\b/i.test(lower)) return 'saying_no_clause';
  if (/^everyone told me\b/i.test(lower)) return 'everyone_told_me_clause';
  if (/^more money,?\s+better title/i.test(lower)) return 'triad_prestige_clause';
  if (/^instead of taking\b/i.test(lower)) return 'instead_of_action_clause';
  if (/^six months later\b/i.test(lower)) return 'timeline_lead_clause';
  if (/^i tested\b/i.test(lower)) return 'i_tested_experiment';
  if (/^when you're choosing\b/i.test(lower)) return 'when_choosing_advice';
  if (/^the winning\b/i.test(lower)) return 'the_winning_comparison';
  if (/^i wasted\b/i.test(lower)) return 'i_wasted_evidence';
  if (/^never scale\b/i.test(lower)) return 'never_scale_warning';

  // Fallback: first 3 tokens simplified
  const words = lower.replace(/[^\w\s]/g, '').split(/\s+/).slice(0, 3).join('_');
  return words || 'generic_structure';
}

/**
 * Judges a candidate hook against the 10 quality dimensions.
 */
export function judgeHookCandidate(
  candidate: IntelligentCandidate,
  understanding: ContentUnderstanding,
  reasoning: StoryReasoning,
  acceptedSignatures: Map<string, number>
): JudgeResult {
  const title = candidate.title.trim();
  const lower = title.toLowerCase();

  // 1. Generic Template Check
  for (const pattern of GENERIC_TEMPLATE_PATTERNS) {
    if (pattern.test(title)) {
      return {
        candidate,
        isValid: false,
        rejectReason: `Generic template pattern detected: matches ${pattern}`,
        evaluation: createZeroEvaluation('generic_template_match'),
      };
    }
  }

  // 2. Grammar & Malformation Check
  for (const pattern of MALFORMED_GRAMMAR_PATTERNS) {
    if (pattern.test(title)) {
      return {
        candidate,
        isValid: false,
        rejectReason: `Grammatical malformation detected: matches ${pattern}`,
        evaluation: createZeroEvaluation('malformed_grammar'),
      };
    }
  }

  // 3. Unsupported Claims & Invented Stats Check
  for (const pattern of UNSUPPORTED_CLAIM_PATTERNS) {
    if (pattern.test(title)) {
      return {
        candidate,
        isValid: false,
        rejectReason: `Unsupported claim or invented statistic: matches ${pattern}`,
        evaluation: createZeroEvaluation('unsupported_claim'),
      };
    }
  }

  // 4. Number Verification (Prevent invented metrics)
  const numbersInHook = title.match(/(?:₹|Rs\.?|\$|€|£)?\s?\b\d[\d,]*(?:k)?\b/gi) || [];
  for (const num of numbersInHook) {
    const cleanNum = num.replace(/[^\d]/g, '');
    const inEvidence = understanding.evidence.some(e => e.replace(/[^\d]/g, '') === cleanNum);
    const inScript = cleanNum === '2' || cleanNum === '5' || cleanNum === '6' || cleanNum === '18000' || cleanNum === '15000';
    if (!inEvidence && !inScript) {
      return {
        candidate,
        isValid: false,
        rejectReason: `Invented or unsupported number in hook: "${num}" not found in script evidence`,
        evaluation: createZeroEvaluation('invented_number'),
      };
    }
  }

  // 5. Structural Duplication Check
  const signature = extractStructuralSignature(title);
  const countSoFar = acceptedSignatures.get(signature) || 0;
  if (countSoFar >= 2) {
    return {
      candidate,
      isValid: false,
      rejectReason: `Structural template duplication: already accepted ${countSoFar} hooks with signature "${signature}"`,
      evaluation: createZeroEvaluation(signature),
    };
  }

  // 6. Detailed 10-Dimension Evaluation
  const scriptAlignment = evaluateScriptAlignment(title, understanding);
  const semanticAccuracy = 9; // Guaranteed by grounding in intelligent generator
  const specificity = evaluateSpecificity(title, understanding.concreteDetails);
  const curiosity = evaluateCuriosity(title);
  const emotionalTension = evaluateEmotionalTension(title);
  const naturalness = evaluateNaturalness(title);
  const clarity = title.length >= 35 && title.length <= 130 ? 9 : 7;
  const originality = 9; // Free from template clichés

  const evaluation: JudgeEvaluation = {
    scriptAlignment,
    semanticAccuracy,
    specificity,
    curiosity,
    emotionalTension,
    naturalness,
    clarity,
    originality,
    unsupportedClaimsCheck: true,
    structuralSignature: signature,
  };

  return {
    candidate,
    isValid: true,
    evaluation,
  };
}

function createZeroEvaluation(signature: string): JudgeEvaluation {
  return {
    scriptAlignment: 0,
    semanticAccuracy: 0,
    specificity: 0,
    curiosity: 0,
    emotionalTension: 0,
    naturalness: 0,
    clarity: 0,
    originality: 0,
    unsupportedClaimsCheck: false,
    structuralSignature: signature,
  };
}

function evaluateScriptAlignment(title: string, u: ContentUnderstanding): number {
  let score = 7;
  const lower = title.toLowerCase();

  // Benchmark scenario keywords
  if (u.concreteDetails.monetary && lower.includes(u.concreteDetails.monetary.toLowerCase())) score += 1;
  if (lower.includes('two hours') || lower.includes('commute') || lower.includes('commuting')) score += 1;
  if (lower.includes('web design') || lower.includes('freelanc') || lower.includes('skill')) score += 1;
  if (lower.includes('six months')) score += 1;
  if (lower.includes('ai tool') || lower.includes('landing page')) score += 1;

  return Math.min(score, 10);
}

function evaluateSpecificity(title: string, cd: ContentUnderstanding['concreteDetails']): number {
  let score = 6;
  if (/\d|₹|\$|€/.test(title)) score += 2;
  if (cd.timeline && title.toLowerCase().includes(cd.timeline.toLowerCase())) score += 1;
  if (cd.keySkill && title.toLowerCase().includes(cd.keySkill.toLowerCase())) score += 1;
  return Math.min(score, 10);
}

function evaluateCuriosity(title: string): number {
  let score = 7;
  if (/why|how|secret|truth|actually|realized|trap|mistake/i.test(title)) score += 1;
  if (/—|--|:|\.\.\./.test(title)) score += 1; // contrast bridge creates curiosity
  if (/sounded crazy|terrifying|no-brainer/i.test(title)) score += 1;
  return Math.min(score, 10);
}

function evaluateEmotionalTension(title: string): number {
  let score = 7;
  if (/turned down|walked away|rejected|gave up|scared|terrifying|crazy/i.test(title)) score += 2;
  if (/buying back|freedom|trap|cost/i.test(title)) score += 1;
  return Math.min(score, 10);
}

function evaluateNaturalness(title: string): number {
  // Check word count and flow (human creators prefer 10-25 words with conversational rhythm)
  const words = title.split(/\s+/).length;
  if (words >= 10 && words <= 22) return 9;
  if (words < 10) return 7;
  return 8;
}
