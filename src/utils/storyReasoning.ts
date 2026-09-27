import { ContentUnderstanding } from './ContentUnderstanding';

export type OpportunityType =
  | 'contradiction'
  | 'unexpected_outcome'
  | 'curiosity'
  | 'transformation'
  | 'specific_evidence'
  | 'confession'
  | 'mistake'
  | 'discovery'
  | 'warning'
  | 'identity_challenge'
  | 'reframe'
  | 'stakes'
  | 'comparison'
  | 'open_loop';

export interface HookOpportunity {
  type: OpportunityType;
  angle: string;
  coreTension: string;
  keyElement: string;
  reason: string;
}

export interface StoryReasoningAnswers {
  believedBefore: string;
  actuallyHappened: string;
  gapExpectationReality: string;
  surprisingElement: string;
  whatChanged: string;
  strongestConcreteDetail: string;
  emotionalTension: string;
  valuableInsight: string;
  needToKnowNext: string;
  strongestOpeningAngle: string;
}

export interface StoryReasoning {
  answers: StoryReasoningAnswers;
  centralConflict: string;
  expectationVsReality?: string;
  strongestSurprise?: string;
  strongestEvidence?: string;
  emotionalTension?: string;
  transformation?: string;
  coreInsight?: string;
  hookOpportunities: HookOpportunity[];
  confidence: number;
}

/**
 * Story Reasoning Layer
 *
 * Synthesizes understanding into narrative answers and extracts
 * strictly script-grounded psychological opportunities.
 */
export function reasonAboutStory(u: ContentUnderstanding): StoryReasoning {
  const cd = u.concreteDetails;

  // A. Believed Before
  const believedBefore = u.initialBelief || u.expectation || 'The standard or conventional approach was correct';

  // B. What Actually Happened
  const actuallyHappened = u.discovery || u.outcome || u.problem || 'The outcome contradicted standard assumptions';

  // C. Gap between Expectation & Reality
  const gapExpectationReality = u.contradiction || u.conflict || `Expected ${believedBefore}, but encountered ${actuallyHappened}`;

  // D. Surprising Element
  const surprisingElement = u.discovery || u.contradiction || 'The counter-intuitive result achieved';

  // E. What Changed
  const whatChanged = u.transformation || u.action || 'A fundamental pivot in approach and priorities';

  // F. Strongest Concrete Detail
  const strongestConcreteDetail =
    cd.monetary && cd.timeSacrifice
      ? `${cd.monetary} vs ${cd.timeSacrifice}`
      : cd.monetary || cd.timeSacrifice || cd.timeline || cd.toolCount || (u.evidence.length > 0 ? u.evidence[0] : u.subject);

  // G. Emotional Tension
  const emotionalTension = u.emotionalCore || (u.stakes ? `Stakes: ${u.stakes}` : 'Fear of wasting effort on the wrong path');

  // H. Most Valuable Insight
  const valuableInsight = u.lesson || u.discovery || 'Rethinking the core premise of success in this domain';

  // I. What Would Make Someone Need to Know What Happens Next
  const needToKnowNext =
    cd.monetary && cd.timeline
      ? `How saying no to ${cd.monetary} actually paid off ${cd.timeline}`
      : `Why the expected choice failed and what replaced it`;

  // J. Strongest Opening Angle
  const strongestOpeningAngle =
    cd.monetary
      ? `A counter-intuitive financial or career decision involving ${cd.monetary}`
      : u.contradiction
      ? `Challenging the dominant belief around ${u.topic}`
      : `A real-world test that produced unexpected results`;

  const answers: StoryReasoningAnswers = {
    believedBefore,
    actuallyHappened,
    gapExpectationReality,
    surprisingElement,
    whatChanged,
    strongestConcreteDetail,
    emotionalTension,
    valuableInsight,
    needToKnowNext,
    strongestOpeningAngle,
  };

  // -------------------------------------------------------------
  // Script-Grounded Opportunity Detection
  // Do NOT force every script into every category!
  // Only select opportunities genuinely supported by THIS script.
  // -------------------------------------------------------------
  const hookOpportunities: HookOpportunity[] = [];

  // 1. Specific Evidence Opportunity (Only if tangible metrics / concrete numbers exist)
  if (cd.monetary || cd.timeSacrifice || cd.toolCount || cd.metrics.length > 0) {
    const detail = cd.monetary || cd.timeSacrifice || cd.toolCount || cd.metrics[0];
    hookOpportunities.push({
      type: 'specific_evidence',
      angle: `Lead directly with the concrete metric (${detail}) to instantly anchor reality`,
      coreTension: `Trading ${detail} against long-term freedom or efficiency`,
      keyElement: detail,
      reason: `Real numbers immediately establish credibility and raise specific curiosity`,
    });
  }

  // 2. Contradiction / Paradox Opportunity (Only if explicit contradiction exists)
  if (u.contradiction || u.conflict) {
    hookOpportunities.push({
      type: 'contradiction',
      angle: 'Expose the clash between the conventional "no-brainer" move and the painful reality',
      coreTension: gapExpectationReality,
      keyElement: u.contradiction || u.conflict || '',
      reason: 'Violating an obvious assumption stops the scroll immediately',
    });
  }

  // 3. Reframe Opportunity (If a deeper realization / lesson inverted value)
  if (u.lesson || u.discovery) {
    hookOpportunities.push({
      type: 'reframe',
      angle: 'Invert what constitutes true value (e.g. salary vs skill ownership/time)',
      coreTension: 'Measuring opportunity by sticker price vs measuring by freedom/compounding skills',
      keyElement: u.lesson || u.discovery || '',
      reason: 'Reframes give viewers a new lens to view their own decisions',
    });
  }

  // 4. Unexpected Outcome / Story Arc (If narrativeType is story or experiment with measurable result)
  if ((u.narrativeType === 'story' || u.narrativeType === 'experiment') && (u.outcome || cd.timeline)) {
    hookOpportunities.push({
      type: 'unexpected_outcome',
      angle: `Reveal the surprising result that emerged ${cd.timeline || 'after the test'}`,
      coreTension: 'Short-term sacrifice leading to unexpected compensation',
      keyElement: u.outcome || cd.timeline || '',
      reason: 'Story payoffs with timeline payoffs create irresistible narrative loops',
    });
  }

  // 5. Confession / Vulnerable Decision (If first-person struggle or counter-intuitive choice)
  if (u.narrativeType === 'story' && u.initialBelief) {
    hookOpportunities.push({
      type: 'confession',
      angle: 'Admit to the initial instinctive reaction and why walking away felt crazy',
      coreTension: 'Personal doubt during the decision versus total clarity in retrospect',
      keyElement: u.initialBelief,
      reason: 'Authentic creator vulnerability creates deep viewer trust and resonance',
    });
  }

  // 6. Transformation Opportunity (If action led to a new skill or new operating state)
  if (u.transformation || (u.action && u.outcome)) {
    hookOpportunities.push({
      type: 'transformation',
      angle: 'Showcase the shift from chasing external metrics to building proprietary leverage',
      coreTension: 'Trapped in existing routines vs owning a valuable independent capability',
      keyElement: u.transformation || u.action || '',
      reason: 'Viewers want to see how someone achieved personal sovereignty or breakthrough',
    });
  }

  // 7. Comparison / Experiment Opportunity (Only for experiments / tool comparisons)
  if (u.narrativeType === 'experiment' || cd.toolCount) {
    hookOpportunities.push({
      type: 'comparison',
      angle: `Direct head-to-head comparison where the expensive favorite lost`,
      coreTension: 'Price and hype vs actual practical utility',
      keyElement: cd.toolCount || '5 AI tools',
      reason: 'Fair experiments with surprising winners are highly engaging',
    });
  }

  // 8. Warning / Mistake Opportunity (Only if explicit mistake or waste occurred)
  if (u.narrativeType === 'problem-solution' || (u.problem && /wasted|mistake|destroy|sabotage|stop/i.test(u.problem))) {
    hookOpportunities.push({
      type: 'warning',
      angle: 'Warn against the common trap that burns resources without return',
      coreTension: 'Doing what everyone recommends only to suffer wasted capital or effort',
      keyElement: u.problem || '',
      reason: 'Loss aversion is twice as psychologically potent as prospective gain',
    });
  }

  return {
    answers,
    centralConflict: u.conflict || gapExpectationReality,
    expectationVsReality: gapExpectationReality,
    strongestSurprise: surprisingElement,
    strongestEvidence: strongestConcreteDetail,
    emotionalTension,
    transformation: u.transformation,
    coreInsight: valuableInsight,
    hookOpportunities,
    confidence: u.confidence,
  };
}
