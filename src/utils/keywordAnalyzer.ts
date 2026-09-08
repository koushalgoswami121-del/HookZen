import { IndustryType, KeywordAnalysisResult } from '../types';
import { FLUFF_WORDS, INDUSTRY_KEYWORDS, VIRAL_POWER_WORDS } from './dictionaries';
import { isMeaninglessText } from './scoringEngine';

/**
 * Analyzes title and script for industry relevance, keyword density, viral trigger words, and readability.
 */
export function analyzeKeywords(
  title: string,
  transcript: string,
  industry: IndustryType
): KeywordAnalysisResult {
  const cleanTitle = title.trim();
  const cleanScript = transcript.trim();

  if (isMeaninglessText(cleanTitle, cleanScript)) {
    return {
      keywordScore: 0,
      detectedIndustryKeywords: [],
      viralTriggerWords: [],
      fluffWords: [],
      readabilityScore: 0,
    };
  }
  const combinedText = `${title} ${transcript}`.toLowerCase();
  const industryData = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS.tech;

  const hasNonAscii = /[^\x00-\x7F]/.test(combinedText);

  // 1. Detect Industry Keywords
  const detectedIndustryKeywords: string[] = [];
  for (const kw of industryData.keywords) {
    if (combinedText.includes(kw.toLowerCase())) {
      detectedIndustryKeywords.push(kw);
    }
  }

  // 2. Detect Viral Trigger Words
  const viralTriggerWords: string[] = [];
  for (const vw of VIRAL_POWER_WORDS) {
    if (combinedText.includes(vw.toLowerCase()) && !viralTriggerWords.includes(vw)) {
      viralTriggerWords.push(vw);
    }
  }

  // 3. Detect Fluff Words
  const fluffWords: string[] = [];
  for (const fw of FLUFF_WORDS) {
    if (combinedText.includes(fw.toLowerCase())) {
      fluffWords.push(fw);
    }
  }

  // 4. Calculate Readability Grade
  const words = combinedText.split(/\s+/).filter(Boolean);
  const sentenceCount = Math.max(1, combinedText.split(/[.!?¿¡\u3002\uFF01\uFF1F]+/).filter(Boolean).length);
  const avgSentenceLen = words.length / sentenceCount;

  let readabilityScore = 85;
  if (avgSentenceLen > 22) readabilityScore -= 20;
  if (avgSentenceLen < 3 && !hasNonAscii) readabilityScore -= 10;

  // 5. Keyword Score Calculation (0 - 100)
  if (words.length < 1 && combinedText.length < 2) {
    return {
      keywordScore: 10,
      detectedIndustryKeywords: [],
      viralTriggerWords: [],
      fluffWords: [],
      readabilityScore: 10,
    };
  }

  // Multi-lingual & non-English baseline boost
  let keywordScore = hasNonAscii ? 45 : 25; // Base starting point

  // Industry Keyword match (+40 max)
  const industryMatchRatio = Math.min(1, detectedIndustryKeywords.length / 3);
  keywordScore += Math.round(industryMatchRatio * 35);

  // Viral Trigger match (+30 max)
  const triggerMatchRatio = Math.min(1, viralTriggerWords.length / 3);
  keywordScore += Math.round(triggerMatchRatio * 30);

  // Word count & Readability bonus
  if (words.length >= 5 || combinedText.length >= 15) {
    keywordScore += Math.round((readabilityScore / 100) * 15);
  }

  // Fluff penalty (-20 max)
  keywordScore -= Math.min(20, fluffWords.length * 5);

  keywordScore = Math.min(100, Math.max(25, Math.round(keywordScore)));

  return {
    keywordScore,
    detectedIndustryKeywords,
    viralTriggerWords,
    fluffWords,
    readabilityScore: Math.round(readabilityScore),
  };
}
