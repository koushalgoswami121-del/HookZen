import { ComponentDiagnostic, FixThisFirstAction, ScoringComponentKey, ViralScoreResult } from '../types';
import { getCreatorContext, SCORING_WEIGHTS } from './scoringConfig';

/**
 * Backwards-compatibility adapter.
 * Ensures that any legacy V1 analysis loaded from Firestore or LocalStorage
 * can be safely consumed by V2 components without breaking or missing fields.
 */
export function ensureV2Result(item: any): ViralScoreResult {
  if (!item) {
    throw new Error('ensureV2Result received null or undefined item');
  }

  // If already full V2 format, return as-is
  if (item.scoringVersion === '2.0' && item.componentDiagnostics && item.fixThisFirst) {
    return item as ViralScoreResult;
  }

  const overallScore = Math.max(0, Math.min(100, Number(item.overallScore) || 0));
  const hookScore = Math.max(0, Math.min(100, Number(item.categoryScores?.hookScore ?? (item as any).hookStrength ?? item.hookAnalysis?.overallHookScore ?? overallScore)));
  const retentionScore = Math.max(0, Math.min(100, Number(item.categoryScores?.pacingScore ?? (item as any).retentionRate ?? item.pacingAnalysis?.pacingScore ?? overallScore)));
  const structureScore = Math.max(0, Math.min(100, Number(item.detailedAnalysis?.story?.score ?? (item as any).structureScore ?? 60)));
  const visualScore = Math.max(0, Math.min(100, Number(item.categoryScores?.visualScore ?? (item as any).visualScore ?? item.imageMetrics?.visualScore ?? (item.imageMetrics?.hasImage ? 50 : 0))));
  const engagementScore = Math.max(0, Math.min(100, Number(item.detailedAnalysis?.cta?.score ?? (item as any).emotionalPull ?? 50)));
  const discoverabilityScore = Math.max(0, Math.min(100, Number(item.categoryScores?.keywordScore ?? (item as any).scriptQuality ?? item.keywordAnalysis?.keywordScore ?? overallScore)));

  const componentDiagnostics: Record<ScoringComponentKey, ComponentDiagnostic> = {
    hook: {
      name: 'Hook Strength',
      key: 'hook',
      weight: SCORING_WEIGHTS.hook,
      score: hookScore,
      weightedScore: Number((hookScore * SCORING_WEIGHTS.hook).toFixed(2)),
      confidence: 'medium',
      evidence: item.hookAnalysis?.detectedPowerWords || [],
      strengths: hookScore >= 70 ? ['Captures curiosity early.'] : [],
      weaknesses: hookScore < 70 ? ['Opening hook could be more scroll-stopping.'] : [],
      reasoning: item.detailedAnalysis?.hook?.why || 'Legacy Hook evaluation.',
      recommendations: [item.detailedAnalysis?.hook?.howToImprove || 'Start immediately with a bold question or surprising number.'],
    },
    retention: {
      name: 'Retention Potential',
      key: 'retention',
      weight: SCORING_WEIGHTS.retention,
      score: retentionScore,
      weightedScore: Number((retentionScore * SCORING_WEIGHTS.retention).toFixed(2)),
      confidence: 'medium',
      evidence: [`${item.pacingAnalysis?.wpm || 160} WPM`],
      strengths: retentionScore >= 70 ? ['Consistent pacing rhythm.'] : [],
      weaknesses: retentionScore < 70 ? ['Sentence variance could be tightened.'] : [],
      reasoning: item.detailedAnalysis?.retention?.why || 'Legacy retention evaluation.',
      recommendations: ['Keep sentences punchy and under 12 words.'],
    },
    structure: {
      name: 'Content & Story Structure',
      key: 'structure',
      weight: SCORING_WEIGHTS.structure,
      score: structureScore,
      weightedScore: Number((structureScore * SCORING_WEIGHTS.structure).toFixed(2)),
      confidence: 'medium',
      evidence: item.detailedAnalysis?.story?.detectedComponents || [],
      strengths: structureScore >= 70 ? ['Clear narrative flow.'] : [],
      weaknesses: structureScore < 70 ? ['Missing narrative transition beats.'] : [],
      reasoning: item.detailedAnalysis?.story?.why || 'Story beats analyzed deterministically.',
      recommendations: ['Use Problem -> Conflict -> Solution -> Payoff structure.'],
    },
    visual: {
      name: 'Visual / First Frame',
      key: 'visual',
      weight: SCORING_WEIGHTS.visual,
      score: visualScore,
      weightedScore: Number((visualScore * SCORING_WEIGHTS.visual).toFixed(2)),
      confidence: item.imageMetrics?.hasImage ? 'high' : 'low',
      evidence: item.imageMetrics?.hasImage ? ['Uploaded cover image evaluated.'] : ['No cover image was provided, so HookZen could not evaluate the visual first frame.'],
      strengths: item.imageMetrics?.isNineToSixteen ? ['Vertical 9:16 aspect ratio.'] : [],
      weaknesses: !item.imageMetrics?.hasImage ? ['Visual first frame cannot be evaluated without an uploaded image.'] : [],
      reasoning: item.imageMetrics?.feedback?.[0] || (item.imageMetrics?.hasImage ? 'Visual presentation and contrast check.' : 'No cover image was provided, so HookZen could not evaluate the visual first frame.'),
      recommendations: ['Upload a 9:16 cover image to enable visual first-frame analysis.'],
    },
    engagement: {
      name: 'Engagement Potential',
      key: 'engagement',
      weight: SCORING_WEIGHTS.engagement,
      score: engagementScore,
      weightedScore: Number((engagementScore * SCORING_WEIGHTS.engagement).toFixed(2)),
      confidence: 'medium',
      evidence: item.detailedAnalysis?.cta?.hasCTA ? ['Call to action detected.'] : ['No direct CTA found.'],
      strengths: item.detailedAnalysis?.cta?.hasCTA ? ['Includes explicit call to action.'] : [],
      weaknesses: !item.detailedAnalysis?.cta?.hasCTA ? ['Missing prompt for saves, comments, or shares.'] : [],
      reasoning: item.detailedAnalysis?.cta?.why || 'Engagement and CTA evaluation.',
      recommendations: ['End with a crisp, low-friction call to action like "Save this for later!".'],
    },
    discoverability: {
      name: 'Search & Discoverability',
      key: 'discoverability',
      weight: SCORING_WEIGHTS.discoverability,
      score: discoverabilityScore,
      weightedScore: Number((discoverabilityScore * SCORING_WEIGHTS.discoverability).toFixed(2)),
      confidence: 'medium',
      evidence: item.keywordAnalysis?.detectedIndustryKeywords || [],
      strengths: discoverabilityScore >= 70 ? ['Strong niche topic keywords present.'] : [],
      weaknesses: discoverabilityScore < 70 ? ['Could include more clear niche keywords.'] : [],
      reasoning: 'Relevance to audience search and recommendation feeds.',
      recommendations: ['Include specific industry terms in the opening 5 seconds.'],
    },
  };

  const topTip = item.actionableTips?.[0];
  const fixThisFirst: FixThisFirstAction = {
    component: topTip?.category || 'Hook Strength',
    bottleneckTitle: topTip?.title || 'Strengthen Opening 3 Seconds',
    impactPts: topTip?.impactPts || 15,
    problem: topTip?.problem || topTip?.description || 'Viewers decide whether to stay within 2 seconds.',
    whyItMatters: 'The first 3 seconds are critical for holding viewer attention before they decide to scroll.',
    concreteFix: topTip?.exampleFix || 'Start directly with an intriguing question or surprising statistic.',
    urgency: topTip?.priority === 'critical' ? 'critical' : 'high',
  };

  const followerCount = item.input?.followerCount || 0;
  const highestViews = item.input?.highestViews || 0;
  const socialHandle = item.input?.socialHandle;
  const socialPlatform = item.input?.socialPlatform;
  const creatorContext = getCreatorContext(followerCount, highestViews, socialHandle, socialPlatform);

  return {
    ...item,
    scoringVersion: '2.0',
    componentDiagnostics,
    fixThisFirst,
    creatorContext,
  };
}
