import { IndustryType, PacingAnalysisResult, RetentionPoint, ScriptHeatmapLine } from '../types';
import { CALL_TO_ACTION_PATTERNS, FLUFF_WORDS, INDUSTRY_KEYWORDS, VIRAL_POWER_WORDS } from './dictionaries';
import { isMeaninglessText } from './scoringEngine';

/**
 * Evaluates video script pacing, words per minute, rhythm variation, fluff, and retention curve prediction.
 */
export function analyzePacing(
  transcript: string,
  durationSeconds: number,
  industry: IndustryType
): { pacingResult: PacingAnalysisResult; scriptHeatmap: ScriptHeatmapLine[]; retentionCurve: RetentionPoint[] } {
  const cleanScript = transcript.trim();

  // If script is meaningless or nonsense text
  if (isMeaninglessText('', cleanScript)) {
    return {
      pacingResult: {
        wpm: 0,
        wordCount: cleanScript ? cleanScript.split(/\s+/).length : 0,
        durationSeconds: durationSeconds || 30,
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
      scriptHeatmap: [],
      retentionCurve: [
        { second: 0, retentionPct: 100 },
        { second: 3, retentionPct: 5 },
        { second: 15, retentionPct: 0 },
        { second: 30, retentionPct: 0 },
      ],
    };
  }

  // Handle CJK (Chinese, Japanese, Korean) where space splitting yields 1 single string
  const isCjk = /[\u3000-\u9FFF\uAC00-\uD7AF]/.test(cleanScript);
  const rawWords = cleanScript ? cleanScript.split(/\s+/).filter(Boolean) : [];
  const wordCount = isCjk
    ? Math.max(rawWords.length, Math.round(cleanScript.replace(/\s+/g, '').length / 2.2))
    : rawWords.length;

  const validDuration = Math.max(5, durationSeconds || 30);
  const wpm = Math.round((wordCount / validDuration) * 60);

  const [minOptimalWpm, maxOptimalWpm] = INDUSTRY_KEYWORDS[industry]?.optimalWpm || [160, 190];

  // Calculate pacing score (0-100) based on script rhythm, fluff, and length completeness
  let pacingScore = 85;

  if (wordCount < 4) {
    pacingScore = 15; // Sparse/Incomplete script
  } else if (wpm > 240) {
    const diff = wpm - 240;
    pacingScore -= Math.min(30, Math.round(diff * 0.5)); // Overly dense text penalty
  }

  // Detect sentences & rhythm variance
  const sentences = cleanScript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let sentenceLengths: number[] = [];
  if (sentences.length > 1 && wordCount >= 8) {
    sentenceLengths = sentences.map((s) => s.split(/\s+/).length);
    const avgLen = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLen, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);

    // Dynamic rhythm variance score (good short video pacing mixes punchy short sentences with medium ones)
    const sentenceVariance = Math.min(100, Math.round((stdDev / (avgLen || 1)) * 120));
    if (sentenceVariance > 25 && sentenceVariance < 80) {
      pacingScore += 10;
    }
  } else if (wordCount < 10) {
    pacingScore -= 15;
  }

  // Count fluff words
  const lowerTranscript = cleanScript.toLowerCase();
  let fluffCount = 0;
  for (const fluff of FLUFF_WORDS) {
    const regex = new RegExp(`\\b${fluff.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    if (matches) fluffCount += matches.length;
  }

  if (fluffCount > 0) {
    pacingScore -= Math.min(25, fluffCount * 4);
  }

  pacingScore = Math.min(100, Math.max(15, Math.round(pacingScore)));

  // Structural beat detection
  const first15Words = rawWords.slice(0, 15).join(' ').toLowerCase();
  const hasHookBeat = VIRAL_POWER_WORDS.some((pw) => first15Words.includes(pw.toLowerCase()));
  const hasValueDelivery = wordCount >= 20;
  const hasCTA = CALL_TO_ACTION_PATTERNS.some((pat) => pat.test(lowerTranscript));

  const pacingResult: PacingAnalysisResult = {
    wordCount,
    durationSeconds: validDuration,
    wpm,
    idealWpmRange: [minOptimalWpm, maxOptimalWpm],
    pacingScore,
    sentenceVariance: sentences.length > 1 ? 65 : 20,
    estimatedPauseSeconds: Math.max(1, Math.round((validDuration * 0.12))),
    structuralBeats: {
      hasHook: hasHookBeat,
      hasValueDelivery,
      hasCallToAction: hasCTA,
      fluffWordCount: fluffCount,
    },
  };

  // Generate line-by-line script heatmap
  const rawLines = cleanScript.split('\n').filter((l) => l.trim().length > 0);
  const displayLines = rawLines.length > 0 ? rawLines : [cleanScript || 'No transcript provided'];

  const scriptHeatmap: ScriptHeatmapLine[] = displayLines.map((lineText, idx) => {
    const lineWords = lineText.split(/\s+/).filter(Boolean).length;
    const isHook = idx === 0 || idx === 1;
    const lineLower = lineText.toLowerCase();

    const containsPower = VIRAL_POWER_WORDS.some((pw) => lineLower.includes(pw));
    const isFluff = FLUFF_WORDS.some((fw) => lineLower.includes(fw));
    const isCtaLine = CALL_TO_ACTION_PATTERNS.some((pat) => pat.test(lineLower));

    let sentiment: ScriptHeatmapLine['sentiment'] = 'neutral';
    if (isHook || containsPower) sentiment = 'high-energy';
    if (isCtaLine) sentiment = 'cta';
    if (isFluff) sentiment = 'frictional';

    const lineSecs = Math.max(1, Math.round((lineWords / (wpm || 160)) * 60));
    const lineWpm = Math.round((lineWords / lineSecs) * 60);

    return {
      lineNumber: idx + 1,
      text: lineText,
      wordCount: lineWords,
      estimatedSecs: lineSecs,
      wpm: lineWpm,
      isHook,
      containsPowerWord: containsPower,
      isFluff,
      sentiment,
    };
  });

  // Retention Prediction Curve Algorithm (Simulation based on pacing, hook strength & dropoff)
  const retentionCurve: RetentionPoint[] = [];
  const totalSteps = Math.min(30, Math.max(6, validDuration));
  const stepInterval = validDuration / totalSteps;

  let currentRetention = 100;
  // First 3 seconds retention drop-off heavily depends on initial hook presence
  const initialDropPenalty = hasHookBeat ? 12 : 28;

  for (let i = 0; i <= totalSteps; i++) {
    const second = Math.round(i * stepInterval);

    if (second === 0) {
      currentRetention = 100;
      retentionCurve.push({ second, retentionPct: 100, annotation: 'Video Start' });
    } else if (second <= 3) {
      currentRetention = 100 - (second / 3) * initialDropPenalty;
      retentionCurve.push({ second, retentionPct: Math.round(currentRetention), annotation: '3s Hook Window' });
    } else {
      // Mid-video decay rate driven by WPM pacing & fluff
      let decayFactor = 0.8;
      if (wpm < minOptimalWpm - 30 || wpm > maxOptimalWpm + 40) decayFactor = 1.6;
      if (fluffCount > 2) decayFactor += 0.5;

      // End CTA spike if present
      let stepDrop = (stepInterval / validDuration) * 35 * decayFactor;
      if (second >= validDuration - 3 && hasCTA) {
        stepDrop *= 0.5; // Strong CTA preserves end retention
      }

      currentRetention = Math.max(18, currentRetention - stepDrop);
      const isHalfway = Math.abs(second - validDuration / 2) < stepInterval;
      const isEnd = second >= validDuration;

      retentionCurve.push({
        second,
        retentionPct: Math.round(currentRetention),
        annotation: isHalfway ? 'Mid-Video Payoff' : isEnd ? 'Final CTA / Loop' : undefined,
      });
    }
  }

  return { pacingResult, scriptHeatmap, retentionCurve };
}
