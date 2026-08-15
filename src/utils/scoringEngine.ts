import {
  AnalysisInput,
  CategoryScores,
  OptimizationTip,
  PlatformOptimizations,
  ViralScoreResult,
} from '../types';
import { INDUSTRY_KEYWORDS } from './dictionaries';
import { analyzeHook } from './hookAnalyzer';
import { analyzeImageCanvas } from './imageAnalyzer';
import { analyzeKeywords } from './keywordAnalyzer';
import { analyzePacing } from './pacingAnalyzer';
import { getRandomHookSuggestions } from './viralHooksPool';
import { analyzeScriptDeterministically } from './deterministicAnalyzer';

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
 * Executes a deterministic, local 4-vector scoring engine.
 * Priority Vectors:
 * 1. Hook & Emotional Intensity (30%)
 * 2. Pacing & WPM Retention (25%)
 * 3. Keyword Relevance & Industry Fit (25%)
 * 4. Visual Frame & Contrast Impact (20%)
 */
export async function calculateViralScore(
  input: AnalysisInput
): Promise<ViralScoreResult> {
  const { title, image, imageDataUrl, transcript, industry, followerCount, highestViews, targetPlatform } = input;

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const estimatedLengthSeconds = Math.max(10, Math.round(wordCount / (160 / 60)));

  // 1. Run sub-analyzers
  const imageMetrics = await analyzeImageCanvas(image || imageDataUrl);

  // Check if title / transcript is meaningless or random noise
  if (isMeaninglessText(title, transcript)) {
    return {
      id: `analysis-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      input,
      overallScore: 0,
      tier: 'Needs Optimization',
      percentileRank: 0,
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
        hookType: 'Weak / Descriptive',
        hookText: title || transcript || 'None',
      },
      pacingAnalysis: {
        wpm: 0,
        wordCount: transcript.trim() ? transcript.trim().split(/\s+/).length : 0,
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
        { second: 0, retentionPct: 100 },
        { second: 3, retentionPct: 10 },
        { second: 15, retentionPct: 5 },
        { second: 30, retentionPct: 0 },
      ],
      actionableTips: [
        {
          id: 'meaningless-content',
          category: 'hook',
          title: 'Input Contains Fewer Than 5 Words or Invalid / Nonsense Text',
          description: 'Your video title and transcript combined contain fewer than 5 words or consist of unrecognized / gibberish text (e.g. "sfubfudhf"). Please enter a complete video title and spoken script (at least 5 meaningful words) for an accurate virality rating.',
          exampleFix: `Enter a clear title like "3 Secrets to Growth in ${industry}" and a complete spoken script with at least 5 words.`,
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
        `Everyone is doing [your topic] completely wrong. Here is what actually works instead...`,
        `3 Mistakes Everyone Makes in [your topic]`,
        `Why Nobody Is Talking About This [your topic] Hack`,
        `How to Get 10x Results in [your topic] Faster`,
        `Stop Doing [your topic] Right Now Until You Watch This`,
      ],
      optimizedScript: title || transcript ? `[Please enter a full, meaningful script to optimize]` : '',
      letterGrade: 'F',
      detailedAnalysis: analyzeScriptDeterministically(title || 'Untitled', transcript || '', industry),
    };
  }
  const hookAnalysis = analyzeHook(title, transcript, industry);
  const { pacingResult, scriptHeatmap, retentionCurve } = analyzePacing(
    transcript,
    estimatedLengthSeconds,
    industry
  );
  const keywordAnalysis = analyzeKeywords(title, transcript, industry);
  const detailedAnalysis = analyzeScriptDeterministically(title, transcript, industry);

  // 2. Compute Category Weights
  const categoryScores: CategoryScores = {
    hookScore: detailedAnalysis.hook.score,
    pacingScore: pacingResult.pacingScore,
    keywordScore: keywordAnalysis.keywordScore,
    visualScore: imageMetrics.visualScore,
    curiosityScore: detailedAnalysis.curiosity.score,
  };

  // 3. Overall Score & Letter Grade from deterministic engine
  const overallScore = detailedAnalysis.overallScore;
  const letterGrade = detailedAnalysis.letterGrade;

  // Tier classification
  let tier: ViralScoreResult['tier'] = 'Needs Optimization';
  let percentileRank = Math.min(99, Math.max(5, Math.round(overallScore * 0.95)));

  if (overallScore >= 85) {
    tier = 'Viral Potential';
    percentileRank = Math.min(99, 90 + Math.round((overallScore - 85) * 0.6));
  } else if (overallScore >= 72) {
    tier = 'Strong Contender';
    percentileRank = 75 + Math.round((overallScore - 72) * 1.1);
  } else if (overallScore >= 55) {
    tier = 'Moderate Reach';
    percentileRank = 50 + Math.round((overallScore - 55) * 1.4);
  }

  // 4b. Viral Resemblance Score Calculation
  // Uses Follower Count and Highest Views as a multiplier for Viral resemblance
  const contentQualityScore = overallScore;
  let viralPotentialBase = contentQualityScore;

  // A channel with massive history implies higher base virality capability
  if (highestViews > 500000) {
    viralPotentialBase += 15;
  } else if (highestViews > 50000) {
    viralPotentialBase += 8;
  }

  // Follower leverage
  if (followerCount > 100000) {
    viralPotentialBase += 10;
  } else if (followerCount < 1000) {
    // Harder to go viral from scratch with poor content, but great content can still pop
    if (contentQualityScore < 70) viralPotentialBase -= 10;
  }

  const finalViralPotential = Math.min(100, Math.max(0, Math.round(viralPotentialBase)));

  // 4. Generate Priority Actionable Tips with Plain English explanations
  const actionableTips: OptimizationTip[] = [];

  // Hook Tips
  if (hookAnalysis.overallHookScore < 75) {
    actionableTips.push({
      id: 'hook-1',
      category: 'hook',
      title: hookAnalysis.overallHookScore <= 20 ? 'Script or Title is Too Short or Unclear' : 'Make the First 3 Seconds More Catchy & Curious',
      problem: hookAnalysis.overallHookScore <= 20 ? 'The opening is too vague to capture viewer interest.' : 'The hook lacks a strong curiosity gap or pattern interrupt.',
      description: hookAnalysis.overallHookScore <= 20
        ? `Your title and opening scored ${hookAnalysis.overallHookScore}/100. People decide to keep watching in less than 2 seconds. Try using an intriguing question or bold opening line.`
        : `Your opening hook scored ${hookAnalysis.overallHookScore}/100. Viewers decide to stay or scroll within 1.8 seconds. Start right away with a mystery or bold statement.`,
      priority: 'critical',
      impact: 'High',
    });
  }

  if (pacingResult.wordCount < 5) {
    actionableTips.push({
      id: 'pacing-0',
      category: 'pacing',
      title: 'Script is Too Short to Measure Pacing',
      problem: 'The script lacks enough dialogue to analyze retention potential.',
      description: 'Your script has under 5 words. Great short videos usually have 50 to 120 words spoken clearly over 15 to 45 seconds.',
      priority: 'critical',
      impact: 'High',
    });
  }

  if (pacingResult.structuralBeats.fluffWordCount > 0) {
    actionableTips.push({
      id: 'pacing-fluff',
      category: 'pacing',
      title: `Remove Filler Words`,
      problem: `We detected extra introductory/filler words like "${keywordAnalysis.fluffWords.slice(0, 3).join(', ')}".`,
      description: `Getting straight to the point prevents early viewer drop-off.`,
      exampleFix: 'Start immediately with the main idea or problem statement.',
      priority: 'high',
      impact: 'Medium',
    });
  }

  // Search & Keyword Visibility Tips
  if (keywordAnalysis.detectedIndustryKeywords.length < 2) {
    actionableTips.push({
      id: 'keyword-1',
      category: 'keywords',
      title: `Add Popular ${industry.toUpperCase()} Topic Words`,
      problem: 'Script lacks clear niche identifiers for the algorithm to categorize it.',
      description: `Social media apps analyze what you say to show your video to the right audience.`,
      exampleFix: `Try mentioning defining terms like: ${INDUSTRY_KEYWORDS[industry]?.keywords.slice(0, 4).join(', ')}.`,
      priority: 'high',
      impact: 'Medium',
    });
  }

  if (!imageMetrics.hasImage) {
    actionableTips.push({
      id: 'visual-upload',
      category: 'visual',
      title: 'Upload a Full Vertical (9:16) Cover Image',
      problem: 'Visual score unavailable — video or cover image not provided.',
      description: 'Without visual data, we only evaluate your text/script. Upload a vertical thumbnail to get visual feedback.',
      exampleFix: 'Upload a 9:16 vertical image with large, readable text overlay.',
      priority: 'high',
      impact: 'High',
    });
  } else {
    if (!imageMetrics.isNineToSixteen) {
      actionableTips.push({
        id: 'visual-1',
        category: 'visual',
        title: 'Use Full Screen Vertical Size (9:16 Ratio)',
        problem: 'Image aspect ratio generates black bars on mobile platforms.',
        description: 'Vertical full-screen images take up the whole display and feel native to short-form algorithms.',
        priority: 'critical',
        impact: 'High',
      });
    }

    if (imageMetrics.contrastRatio < 45) {
      actionableTips.push({
        id: 'visual-2',
        category: 'visual',
        title: 'Increase Text Contrast & Brightness',
        problem: 'Cover thumbnail lacks enough visual contrast, reducing scroll-stopping power.',
        description: `Your contrast scored ${imageMetrics.contrastRatio}/100. High contrast elements perform better in dense social feeds.`,
        exampleFix: 'Add bright yellow or white text with a dark drop-shadow layout.',
        priority: 'quick-win',
        impact: 'Medium',
      });
    }
  }

  // Platform Specific Optimization Rules
  const platformOptimizations: PlatformOptimizations = {
    tiktok: [
      'Add bright auto-captions so people can watch without sound.',
      'Add a soft trending background music track set to low volume.',
      'Pin a fun question in your comments right after posting.',
    ],
    reels: [
      'Keep important text in the middle so it looks good when cropped in your grid.',
      'Avoid placing text at the very bottom where Instagram captions show up.',
      'Add 3 to 5 relevant topic tags when sharing.',
    ],
    shorts: [
      'Make your ending sentence connect smoothly back to your opening sentence for infinite loops.',
      'Pick an eye-catching video frame for your YouTube mobile thumbnail.',
      'Include clear topic words in the first 2 lines of your video description.',
    ],
  };

  // 5. Generate 5 Suggested Title Alternatives dynamically randomized from the 100+ Hooks Pool!
  const topicOrTitle = (title || '').trim() || (transcript || '').trim();
  const randomHookIdeas = getRandomHookSuggestions(topicOrTitle, 5);
  const suggestedTitleAlternatives = randomHookIdeas.map(h => h.title);

  // 6. Generate Fluff-Free Optimized Script
  const cleanLines = transcript
    .split('\n')
    .map((line) => {
      let l = line;
      for (const fluff of keywordAnalysis.fluffWords) {
        const reg = new RegExp(`\\b${fluff.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        l = l.replace(reg, '');
      }
      return l.replace(/\s+/g, ' ').trim();
    })
    .filter(Boolean);

  const optimizedScript = cleanLines.join('\n');

  return {
    id: `analysis-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    input,
    overallScore,
    contentScore: contentQualityScore,
    viralPotential: finalViralPotential,
    confidence: 'Medium',
    modelVersion: 'v1.4',
    letterGrade,
    tier,
    percentileRank,
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
    detailedAnalysis,
  };
}
