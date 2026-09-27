/**
 * HookZen Authoritative Scoring Configuration (V2.0)
 *
 * Core Principle: "AI is the Analyst, Code is the Accountant"
 * The weights here are the single source of truth for the entire application.
 * All sub-scores must be multiplied by these weights to produce the overall score.
 */

export const SCORING_WEIGHTS = {
  hook: 0.30,          // Hook Strength (30%)
  retention: 0.25,     // Retention Potential (25%)
  structure: 0.20,     // Content & Story Structure (20%)
  visual: 0.10,        // Visual / First Frame (10%)
  engagement: 0.10,    // Engagement Potential (10%)
  discoverability: 0.05, // Search & Discoverability (5%)
} as const;

export type ScoringComponentKey = keyof typeof SCORING_WEIGHTS;

// Verify weights sum to 1.0 (with floating-point tolerance)
export function validateScoringWeights(): boolean {
  const sum = Object.values(SCORING_WEIGHTS).reduce((acc, w) => acc + w, 0);
  return Math.abs(sum - 1.0) < 0.0001;
}

export interface ComponentScoreInput {
  score: number; // 0 - 100
  confidence: 'high' | 'medium' | 'low';
}

export interface AuthoritativeScoreResult {
  overallScore: number; // 0 - 100
  weightedBreakdown: Record<ScoringComponentKey, {
    score: number;
    weight: number;
    weightedContribution: number;
  }>;
  overallConfidence: 'High' | 'Medium' | 'Low';
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  tier: 'Exceptional Potential' | 'Strong Potential' | 'Good Potential' | 'Needs Improvement' | 'High Risk';
  percentileRank: number; // strictly defined benchmark percentile
}

/**
 * Calculates the authoritative overall score from the 6 component scores.
 * Rounding is performed ONLY at the final step to eliminate discrepancy.
 */
export function computeAuthoritativeScore(
  scores: Record<ScoringComponentKey, ComponentScoreInput>
): AuthoritativeScoreResult {
  let unroundedSum = 0;
  const weightedBreakdown: AuthoritativeScoreResult['weightedBreakdown'] = {} as any;

  (Object.keys(SCORING_WEIGHTS) as ScoringComponentKey[]).forEach((key) => {
    const weight = SCORING_WEIGHTS[key];
    const rawScore = Math.max(0, Math.min(100, scores[key]?.score ?? 0));
    const weightedContribution = rawScore * weight;
    unroundedSum += weightedContribution;

    weightedBreakdown[key] = {
      score: Math.round(rawScore),
      weight,
      weightedContribution: Number(weightedContribution.toFixed(2)),
    };
  });

  const overallScore = Math.min(100, Math.max(0, Math.round(unroundedSum)));

  // Authoritative Tier and Letter Grade Mapping
  let tier: AuthoritativeScoreResult['tier'];
  let letterGrade: AuthoritativeScoreResult['letterGrade'];
  let percentileRank: number;

  if (overallScore >= 85) {
    tier = 'Exceptional Potential';
    letterGrade = overallScore >= 95 ? 'A+' : 'A';
    percentileRank = 85 + Math.round(((overallScore - 85) / 15) * 14); // 85th - 99th percentile
  } else if (overallScore >= 70) {
    tier = 'Strong Potential';
    letterGrade = 'B';
    percentileRank = 70 + Math.round(((overallScore - 70) / 15) * 14); // 70th - 84th percentile
  } else if (overallScore >= 50) {
    tier = 'Good Potential';
    letterGrade = 'C';
    percentileRank = 50 + Math.round(((overallScore - 50) / 20) * 19); // 50th - 69th percentile
  } else if (overallScore >= 35) {
    tier = 'Needs Improvement';
    letterGrade = 'D';
    percentileRank = 25 + Math.round(((overallScore - 35) / 15) * 24); // 25th - 49th percentile
  } else {
    tier = 'High Risk';
    letterGrade = 'F';
    percentileRank = Math.max(1, Math.round((overallScore / 34) * 24)); // 1st - 24th percentile
  }

  // Aggregate confidence: if >=2 components are low, overall confidence is Low; if >=4 are high, High; else Medium
  const confidences = Object.values(scores).map(s => s.confidence);
  const lowCount = confidences.filter(c => c === 'low').length;
  const highCount = confidences.filter(c => c === 'high').length;

  let overallConfidence: 'High' | 'Medium' | 'Low' = 'Medium';
  if (lowCount >= 2) {
    overallConfidence = 'Low';
  } else if (highCount >= 4) {
    overallConfidence = 'High';
  }

  return {
    overallScore,
    weightedBreakdown,
    overallConfidence,
    letterGrade,
    tier,
    percentileRank,
  };
}

export function mapScoreToTier(score: number): 'Exceptional' | 'Strong' | 'Good' | 'Needs Improvement' | 'High Risk' {
  if (score >= 85) return 'Exceptional';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Good';
  if (score >= 35) return 'Needs Improvement';
  return 'High Risk';
}

/**
 * Creator Context Helper: Categorizes followers and historical views into descriptive advisory tiers.
 * Purely informational — NEVER alters the content quality score!
 */
export function getCreatorContext(
  followerCount: number,
  highestViews: number = 0,
  socialHandle?: string,
  socialPlatform?: 'instagram' | 'youtube' | 'tiktok',
  postsCount?: number
) {
  let followerTier: string;
  let followerDescription: string;

  if (followerCount >= 100000) {
    followerTier = 'Established Creator (100k+)';
    followerDescription = 'Existing audience provides an immediate algorithmic jump-start. Strong hooks will convert into high sharing velocity.';
  } else if (followerCount >= 25000) {
    followerTier = 'Mid-Tier Creator (25k-100k)';
    followerDescription = 'Solid subscriber base allows faster testing across initial 200-viewer test buckets.';
  } else if (followerCount >= 5000) {
    followerTier = 'Growing Creator (5k-25k)';
    followerDescription = 'Content is tested heavily on the FYP / Shorts shelf. Retention in the first 3 seconds dictates broad distribution.';
  } else if (followerCount >= 1000) {
    followerTier = 'Emerging Creator (1k-5k)';
    followerDescription = 'Distribution relies almost 100% on algorithmic watch-through rate and early hook hold rather than follower feed.';
  } else {
    followerTier = 'New / Seed Account (<1k)';
    followerDescription = 'Short-form platforms treat your video objectively in cold test buckets. Hook strength and first-frame clarity are critical.';
  }

  let viewBenchmark: string;
  if (highestViews >= 500000) {
    viewBenchmark = 'Proven Viral Distribution (500k+ past peak)';
  } else if (highestViews >= 100000) {
    viewBenchmark = 'High-Reach Baseline (100k-500k past peak)';
  } else if (highestViews >= 10000) {
    viewBenchmark = 'Active Reach (10k-100k past peak)';
  } else {
    viewBenchmark = 'Early Growth Baseline (<10k past peak)';
  }

  return {
    followerCount,
    highestViews,
    followerTier,
    followerDescription,
    viewBenchmark,
    socialHandle,
    socialPlatform,
    postsCount,
    note: 'Follower count and social profile data are used strictly for contextual platform advice and never alter your content quality score.',
  };
}
