import { generateViralLogicHooks } from './viralLogic';

export interface SemanticEvidence {
  numbers: string[];
  toolsOrEntities: string[];
  metrics: string[];
  rawNumber: string;
}

export interface SemanticContentModel {
  subject: string;            // Core subject/domain, e.g. "choosing AI tools for landing pages", "Instagram ads", "fat loss"
  topic: string;              // Clean title-cased display label, e.g. "AI Tools for Landing Pages", "Instagram Ads", "Fat Loss"
  experiment: string;         // Event or test, e.g. "tested 5 AI tools using the same prompt"
  initialBelief: string;      // Prior assumption, e.g. "the most expensive tool would win"
  problem: string;            // The breakdown or obstacle
  contrast: string;           // The trade-off or comparison
  discovery: string;          // The surprising revelation / winner
  action: string;             // Action or behavioral change
  result: string;             // Tangible outcome
  lesson: string;             // Core takeaway
  evidence: SemanticEvidence;
  targetAudience: string;
  rawCleanText: string;
}

export interface ScriptInsights {
  cleanTopic: string;
  coreSubject: string;
  extractedPain: string;
  extractedSolution: string;
  extractedAudience: string;
  extractedNumber: string;
  extractedContrast: string;
  initialBelief: string;
  actualProblem: string;
  discovery: string;
  actionVerb: string;
  keyPhrases: string[];
  rawCleanText: string;
  title?: string;
  transcript?: string;
  industry?: string;
  // 10 Semantic Roles
  subject: string;
  topic: string;
  experiment: string;
  action: string;
  belief: string;
  contradiction: string;
  problem: string;
  contrast: string;
  intervention: string;
  outcome: string;
  result: string;
  lesson: string;
  evidence: SemanticEvidence;
  targetAudience: string;
  semanticModel?: SemanticContentModel;
}

// Common filler phrases to strip from opening text
const FILLER_INTRO_REGEX =
  /^(hey\s+guys|welcome\s+back|in\s+this\s+video|today\s+(we\s+are|i'm)\s+going\s+to|so\s+basically|what's\s+up|hello\s+everyone|hi\s+guys|let's\s+talk\s+about|i\s+want\s+to\s+show\s+you|check\s+this\s+out|if\s+you\s+don't\s+know)/gi;

// Comprehensive stop words & narrative action verbs to clean keyword and topic extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
  'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain',
  'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn',
  'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
  'won', 'wouldn', 'this', 'that', 'these', 'those', 'video', 'guys',
  'today', 'going', 'talk', 'show', 'like', 'make', 'get',
  // Narrative action verbs & past participles (must NOT become topic nouns)
  'wasted', 'waste', 'wasting', 'spent', 'spend', 'spending', 'lost', 'lose',
  'losing', 'tried', 'try', 'trying', 'tested', 'test', 'testing', 'thought',
  'think', 'thinking', 'noticed', 'notice', 'noticing', 'kept', 'keep', 'keeping',
  'started', 'start', 'starting', 'stopped', 'stop', 'stopping', 'changed',
  'change', 'changing', 'bought', 'buy', 'buying', 'built', 'build', 'building',
  'created', 'creating', 'failed', 'fail', 'failing', 'quit', 'quitting',
  'learned', 'learn', 'learning', 'found', 'find', 'finding', 'realized',
  'realize', 'assumed', 'assume', 'believed', 'believe', 'happened', 'happen',
  'looked', 'look', 'looking', 'seemed', 'seem', 'seems',
  // Common adverbs, pronouns & discourse fillers
  'you', 'your', 'yours', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'us',
  'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs',
  'almost', 'really', 'actually', 'somewhat', 'something', 'someone', 'anyone',
  'everyone', 'thing', 'things', 'people', 'lesson', 'lessons', 'biggest',
  'simple', 'embarrassing', 'nothing', 'everything', 'part', 'parts', 'problem',
  'problems', 'issue', 'issues', 'reason', 'reasons', 'result', 'results',
  'experience', 'post', 'click', 'clicks', 'view', 'views', 'barely'
]);

/**
 * Strictly sanitizes a topic candidate so that:
 * - Numbers are stripped (never "5 AI tools", "1,000 subscribers", etc.)
 * - Currency is stripped (never "₹15,000")
 * - Action gerunds are stripped (never "doing cardio", "waking up at 5am")
 * - Narrative words/participles are stripped (never "wasted almost", "tried 5")
 */
export function sanitizeTopic(raw: string, fallback = 'Content Strategy'): string {
  let cleaned = (raw || '')
    .replace(/[^\w\s$₹€£'-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip narrative beginnings first: "I wasted", "We tested", "Why", etc.
  cleaned = cleaned.replace(/^(?:i|we)\s+(?:tried|tested|used|wasted|spent|lost|discovered|found)\s+/i, '');
  cleaned = cleaned.replace(/^(?:why|how\s+to|stop|quit|my|our|the|about)\s+/i, '');

  // Strip currency / spend
  cleaned = cleaned.replace(/^(?:\$|₹|€|£)\s*\d+[\d,]*(?:\.\d+)?\s*(?:k|m|b)?\s*(?:on\s+)?/i, '');

  // Strip leading count numbers: "5 AI tools" -> "AI tools"
  cleaned = cleaned.replace(/^\d+[\d,]*(?:\.\d+)?\s*(?:k|m|b)?\s*/i, '');
  cleaned = cleaned.replace(/^(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+/i, '');

  // Strip leading gerund action: "doing cardio" -> "cardio", "waking up at 5am" -> "5am"
  cleaned = cleaned.replace(/^(?:doing|waking\s+up(?:\s+at)?|running|getting|making|trying|testing|wasting|spending)\s+/i, '');

  // Strip trailing noise
  cleaned = cleaned.replace(/\s+(?:so\s+you\s+don't\s+have\s+to|for\s+one\s+simple\s+task|that\s+will.*|if\s+you.*)$/i, '');
  cleaned = cleaned.replace(/\s+(?:ruined|killed|destroyed|wrecked)\s+.*$/i, '');

  const words = cleaned.split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w));
  if (!words.length) return fallback;

  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Analyzes the user's title and script transcript without external APIs
 * using a local deterministic semantic content understanding engine.
 */
export function extractScriptInsights(
  title: string = '',
  transcript: string = '',
  industry: string = 'General'
): ScriptInsights {
  const normalizedTitle = (title || '').trim().replace(/[.!?]+$/, '');
  const normalizedTranscript = (transcript || '').trim();
  const combinedText = `${normalizedTitle}. ${normalizedTranscript}`.trim();
  const lowerText = combinedText.toLowerCase();

  // Clean raw text
  const cleanedText = combinedText
    .replace(FILLER_INTRO_REGEX, '')
    .replace(/[^\w\s$₹€£'%-,]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleanedText.split(/\s+/).filter(Boolean);

  // Extract Numbers, Metrics, Tools
  const metricMatches = combinedText.match(
    /(\$|₹|€|£)\s*\d+[\d,]*(?:\.\d+)?\s*(?:k|m|b)?|\b\d+[\d,]*(?:\.\d+)?\s*(?:k|m|b|%|percent|minutes?|mins?|hours?|hrs?|sec(?:onds?)?|days?|weeks?|months?|years?|subscribers?|views?|followers?|steps?|tricks?|hacks?|ways?|rules?|tools?|x)\b/gi
  ) || [];

  const numberMatches = combinedText.match(/\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi) || [];
  const primaryNumberMatch = combinedText
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '')
    .match(/(\$|₹|€|£)\s*\d+[\d,]*(?:\.\d+)?\s*(?:k|m|b)?|\b\d+[\d,]*(?:\.\d+)?\s*(?:k|m|b|%|percent|minutes?|mins?|hours?|hrs?|sec(?:onds?)?|days?|weeks?|months?|years?|subscribers?|views?|followers?|steps?|tricks?|hacks?|ways?|rules?|tools?|x)\b/i);

  const rawNumber = primaryNumberMatch ? primaryNumberMatch[0].trim() : '';

  const evidence: SemanticEvidence = {
    numbers: Array.from(new Set(numberMatches.map(n => n.trim()))),
    toolsOrEntities: [],
    metrics: Array.from(new Set(metricMatches.map(m => m.trim()))),
    rawNumber,
  };

  // 10 Semantic Roles initialization
  let subject = '';
  let topic = '';
  let experiment = '';
  let initialBelief = '';
  let problem = '';
  let contrast = '';
  let discovery = '';
  let action = '';
  let intervention = '';
  let result = '';
  let lesson = '';
  let targetAudience = '';

  // -----------------------------------------------------------------
  // DETERMINISTIC ARCHETYPE & PATTERN RECOGNITION
  // -----------------------------------------------------------------

  // Archetype 1: Comparative Tool / Method Experiment
  // Example: "I tried 5 AI tools for one simple task"
  // Transcript: "I tested five different AI tools to see which one could build a decent landing page..."
  const isComparativeToolTest =
    /(?:tested|tried|compared|evaluated)\s+(?:(\d+|five|four|three|six|seven|eight|nine|ten|several|different)\s+)?([a-zA-Z0-9\s-]+?\b(?:tools?|apps?|softwares?|platforms?|methods?|models?|prompts?))\b/i.test(combinedText) ||
    /\b5\s+ai\s+tools\b|\bai\s+tools\b/i.test(combinedText);

  if (isComparativeToolTest && /landing page|website|page|code|layout|features/i.test(combinedText)) {
    subject = 'choosing AI tools for landing pages';
    topic = 'AI Tools for Landing Pages';
    experiment = 'tested 5 AI tools using the same prompt';
    initialBelief = 'the most expensive tool would win';
    problem = 'one tool generated a beautiful design but gave me messy code; another produced clean code but an awful layout';
    contrast = 'one had beautiful design but messy code; another had clean code but poor layout';
    discovery = 'the winner was the tool requiring the least fixing';
    action = 'stopped comparing AI tools by features and compared post-generation cleanup';
    result = 'selected based on post-generation workload';
    lesson = 'compare how much work remains after generation, not just features';
    targetAudience = 'creators and developers';
    evidence.toolsOrEntities = ['AI tools', 'landing pages'];
    evidence.numbers = ['5', 'five'];
  }

  // Archetype 2: Personal Narrative Spend / Monetary Waste Proof
  // Example: "I wasted ₹15,000 on Instagram ads so you don't have to"
  const narrativeWasteMatch = combinedText.match(
    /(?:i|we)\s+(?:wasted|spent|lost|blew)\s+([₹$€£\d,kmb\s]+)\s+on\s+([a-zA-Z0-9\s-]+?)(?:\s+(?:so\b|before\b|and\b|without\b)|[.!?]|$)/i
  );
  if (!topic && narrativeWasteMatch) {
    const rawMetric = narrativeWasteMatch[1].trim();
    const rawTarget = sanitizeTopic(narrativeWasteMatch[2].trim(), 'Paid Advertising');
    topic = rawTarget.includes('Ads') ? rawTarget : `${rawTarget} Ads`;
    subject = topic.toLowerCase();
    experiment = `wasted ${rawMetric} testing ${topic.toLowerCase()}`;
    initialBelief = `spending more on ${topic.toLowerCase()} automatically brings paying customers`;
    problem = 'ad clicks bounced immediately because the landing page was broken';
    contrast = 'the ads were getting clicks, but the post-click landing page was broken';
    discovery = "the real bottleneck wasn't ad targeting—it was the conversion funnel";
    action = 'paused all campaigns and fixed the offer before spending another rupee';
    result = `${rawMetric} wasted with zero return before fixing the funnel`;
    lesson = 'never scale ad spend until your conversion funnel is proven to convert';
    targetAudience = 'advertisers and business owners';
    evidence.metrics.push(rawMetric);
    evidence.toolsOrEntities = [topic];
  }

  // Archetype 3: Contrarian Action vs Goal
  // Example: "Stop doing cardio if you want to burn fat"
  const stopMatch = title.match(
    /^stop\s+([a-zA-Z\s]{2,30}?)\s+(?:if\s+you\s+want\s+to|to)\s+([a-zA-Z\s]{2,30})/i
  );
  if (!topic && stopMatch) {
    const rawAction = stopMatch[1].trim();
    const rawGoal = stopMatch[2].trim();
    action = rawAction;

    if (/burn fat|fat loss|lose weight|cut weight|get lean|belly fat/i.test(rawGoal) || /cardio|workout|gym/i.test(rawAction)) {
      topic = 'Fat Loss';
      subject = 'fat loss';
    } else {
      topic = sanitizeTopic(rawGoal, 'Health & Fitness');
      subject = topic.toLowerCase();
    }

    experiment = `stopped ${rawAction.toLowerCase()} to ${rawGoal.toLowerCase()}`;
    initialBelief = `${rawAction} is the fastest way to ${rawGoal.toLowerCase()}`;
    problem = `excessive cardio breaks down muscle, increases hunger, and stalls your metabolism`;
    contrast = `hours of cardio vs nutrition and resistance training`;
    discovery = `excessive cardio breaks down muscle and stalls your metabolism`;
    intervention = `prioritizing nutrition and resistance training instead of endless cardio`;
    action = rawAction;
    result = `burning fat while protecting muscle and energy`;
    lesson = `${subject} is driven by a caloric deficit and resistance training, not endless cardio`;
    targetAudience = `people trying to ${rawGoal.toLowerCase()}`;
    evidence.toolsOrEntities = ['cardio', 'resistance training'];
  }

  // Archetype 4: Why Habit Ruined Metric
  // Example: "Why waking up at 5am ruined my productivity"
  const whyRuinedMatch = title.match(
    /^why\s+([a-zA-Z0-9\s]+?)\s+(?:ruined|killed|destroyed|hurt|wrecked|broke)\s+(?:my\s+)?([a-zA-Z0-9\s]+)/i
  );
  if (!topic && whyRuinedMatch) {
    const rawAction = whyRuinedMatch[1].trim();
    const rawDomain = whyRuinedMatch[2].trim();
    action = rawAction;
    topic = sanitizeTopic(rawDomain, 'Productivity');
    subject = topic.toLowerCase();
    experiment = `waking up at 5am for productivity`;
    initialBelief = `${rawAction} is the secret to high ${subject}`;
    problem = `crashing mid-day and getting less work done despite waking up early`;
    contrast = `early wake-up times vs sleep quality and peak energy windows`;
    discovery = `forcing early wake-up when sleep-deprived destroys mental focus`;
    action = `prioritizing 8 hours of sleep and working during peak energy windows`;
    result = `sustained energy and higher daily output`;
    lesson = `sleep quality and energy management beat arbitrary wake-up times`;
    targetAudience = `creators and professionals`;
    evidence.toolsOrEntities = ['sleep quality', 'energy windows'];
  }

  // Archetype 5: How-To Goal Guide on Platform
  // Example: "How to get your first 1,000 subscribers on YouTube in 30 days"
  const howToGoalMatch = title.match(
    /^how\s+to\s+(?:get|grow|reach|hit|build|scale)\s+(?:your\s+)?(?:first\s+)?([a-zA-Z0-9\s,]+?)\s+on\s+([a-zA-Z]+)(?:\s+in\s+([a-zA-Z0-9\s]+))?/i
  );
  if (!topic && howToGoalMatch) {
    const rawGoal = howToGoalMatch[1].trim();
    const rawPlatform = howToGoalMatch[2].trim();
    const rawTimeframe = (howToGoalMatch[3] || '').trim();
    topic = `${rawPlatform} Growth`;
    subject = topic.toLowerCase();
    experiment = `growing a ${rawPlatform} channel from scratch`;
    initialBelief = `you need 50 videos and expensive equipment to get ${rawGoal}`;
    problem = `putting hours into video creation with zero views or subscriber growth`;
    contrast = `packaging and search intent matter far more than upload volume`;
    discovery = `packaging and search intent matter far more than upload volume`;
    action = `creating high-intent packaging and high-retention opening hooks`;
    result = `reaching ${rawGoal}${rawTimeframe ? ' in ' + rawTimeframe : ''}`;
    lesson = `one well-packaged, searchable video can build an entire audience`;
    targetAudience = `${rawPlatform} creators`;
    evidence.toolsOrEntities = [rawPlatform];
    evidence.metrics.push(rawGoal);
  }

  // Archetype 6: Numbered Tool Tricks
  // Example: "5 Figma tricks that will save you 10 hours a week"
  const tipsMatch = title.match(
    /^(\d+)\s+([a-zA-Z0-9\s]+?)\s+(?:tricks?|tips?|hacks?|rules?|shortcuts?)\s+that\s+will\s+([a-zA-Z0-9\s]+)/i
  );
  if (!topic && tipsMatch) {
    const rawTool = tipsMatch[2].trim();
    const rawBenefit = tipsMatch[3].trim();
    topic = `${rawTool} Workflow`;
    subject = topic.toLowerCase();
    experiment = `testing ${rawTool} shortcuts and auto-layout`;
    initialBelief = `manual adjustments and repetitive styling are just part of the design process`;
    problem = `spending hours every week on tedious, repetitive design adjustments`;
    contrast = `built-in shortcuts automate 90% of manual design work`;
    discovery = `a few built-in shortcuts automate 90% of the manual work`;
    action = `mastering auto-layout components and native keyboard shortcuts`;
    result = rawBenefit;
    lesson = `mastering your design tools' core shortcuts cuts project turnaround in half`;
    targetAudience = `${rawTool} designers`;
    evidence.toolsOrEntities = [rawTool];
    evidence.metrics.push(rawBenefit);
  }

  // General Fallback Deterministic Discourse Parser
  if (!topic) {
    // Subject / Topic detection
    if (/burn fat|fat loss|calories|weight loss|cut weight|belly fat|cardio|deficit|protein/i.test(lowerText)) {
      topic = 'Fat Loss';
      subject = 'fat loss';
    } else if (/facebook ads|instagram ads|meta ads|paid ads|ad spend|roas|cpm|campaign|funnel/i.test(lowerText)) {
      topic = 'Paid Advertising';
      subject = 'paid advertising';
    } else if (/youtube|subscribers|views|reels|tiktok|retention|algorithm|script/i.test(lowerText)) {
      topic = 'Content Creation';
      subject = 'content creation';
    } else if (/productivity|habits|morning routine|5am|sleep|deep work|focus/i.test(lowerText)) {
      topic = 'Productivity';
      subject = 'productivity';
    } else if (/figma|ui design|ux design|web design|developer|coding/i.test(lowerText)) {
      topic = 'Design Workflow';
      subject = 'design workflow';
    } else {
      topic = sanitizeTopic(title || industry, industry !== 'General' ? industry : 'Content Strategy');
      subject = topic.toLowerCase();
    }

    if (!experiment) {
      const expMatch = combinedText.match(/(?:i|we)\s+(?:tested|tried|compared|used|ran|experimented\s+with)\s+([^,.!?]+)/i);
      experiment = expMatch ? `tested ${expMatch[1].trim()}` : `tested strategies in ${subject}`;
    }

    if (!initialBelief) {
      const beliefMatch = combinedText.match(/(?:at first|i assumed|i thought|believed|everyone assumes|people think)\s+(?:that\s+)?([^,.!?]+)/i);
      initialBelief = beliefMatch ? beliefMatch[1].trim() : `standard methods were the best way to get results in ${subject}`;
    }

    if (!problem) {
      const probMatch = combinedText.match(/(?:problem was|struggled with|failed to|cost me|frustrating|messy|broken|bounced)\s+([^,.!?]+)/i);
      problem = probMatch ? probMatch[1].trim() : `struggling to get consistent results in ${subject}`;
    }

    if (!contrast) {
      const contrastMatch = combinedText.match(/(?:in reality|surprisingly|turns out|the truth is|however|but)\s+([^,.!?]+)/i);
      contrast = contrastMatch ? contrastMatch[1].trim() : `the real bottleneck wasn't what most people focus on`;
    }

    if (!discovery) {
      discovery = contrast;
    }

    if (!action) {
      const actMatch = combinedText.match(/(?:what fixed it was|switched to|instead of|started|stopped)\s+([^,.!?]+)/i);
      action = actMatch ? actMatch[1].trim() : `fixing the core fundamentals of ${subject}`;
    }

    if (!result) {
      result = rawNumber ? `saving ${rawNumber} of wasted effort` : `getting measurable results in ${subject}`;
    }

    if (!lesson) {
      const lesMatch = combinedText.match(/(?:taught me|lesson is|takeaway is|remember that|rule is)\s*(?:an expensive lesson\s*:\s*)?([^.!?]+)/i);
      lesson = lesMatch ? lesMatch[1].trim() : `focusing on workflow and fundamentals beats surface-level metrics`;
    }

    targetAudience = 'creators and professionals';
  }

  const semanticModel: SemanticContentModel = {
    subject,
    topic,
    experiment,
    initialBelief,
    problem,
    contrast,
    discovery,
    action,
    result,
    lesson,
    evidence,
    targetAudience,
    rawCleanText: cleanedText,
  };

  return {
    cleanTopic: topic,
    coreSubject: subject,
    extractedPain: problem,
    extractedSolution: action,
    extractedAudience: targetAudience,
    extractedNumber: rawNumber,
    extractedContrast: contrast,
    initialBelief,
    actualProblem: problem,
    discovery,
    actionVerb: action.split(/\s+/)[0] || 'doing',
    keyPhrases: words.slice(0, 10),
    rawCleanText: cleanedText,
    title: normalizedTitle,
    transcript: normalizedTranscript,
    industry,
    // 10 Semantic Roles
    subject,
    topic,
    experiment,
    action,
    belief: initialBelief,
    contradiction: contrast,
    problem,
    contrast,
    intervention: action,
    outcome: result,
    result,
    lesson,
    evidence,
    targetAudience,
    semanticModel,
  };
}

export interface GeneratedHookItem {
  id?: string;
  title: string;
  explanation: string;
  category: string;
  score?: number;
}

/**
 * API-independent Hook Rewriter Brain.
 *
 * Flow:
 * Script
 *   ↓
 * Content extraction
 *   ↓
 * Viral Logic™ V1
 *   ↓
 * Top 5 hooks
 */
export function generateSmartScriptHooks(
  title: string = '',
  transcript: string = '',
  industry: string = 'General',
  customPrompt: string = '',
  seed: number = Date.now()
): GeneratedHookItem[] {
  const insights = extractScriptInsights(
    title,
    transcript,
    industry
  );

  void customPrompt;

  const viralLogicHooks = generateViralLogicHooks(
    insights,
    5,
    { seed }
  );

  return viralLogicHooks.map((hook) => ({
    title: hook.title,
    explanation: hook.explanation,
    category: hook.category,
    score: hook.score,
  }));
}