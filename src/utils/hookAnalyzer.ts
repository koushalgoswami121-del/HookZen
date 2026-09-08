import { HookAnalysisResult, IndustryType } from '../types';
import { CURIOSITY_PATTERNS, VIRAL_POWER_WORDS } from './dictionaries';
import { isMeaninglessText } from './scoringEngine';

/**
 * Analyzes video title and opening script hook (first 3s / 15 words) for emotional intensity & scroll-stopping power.
 */
export function analyzeHook(
  title: string,
  transcript: string,
  _industry: IndustryType
): HookAnalysisResult {
  const cleanTitle = title.trim();
  const cleanScript = transcript.trim();

  // Extract opening script hook (first 18 words)
  const scriptWords = cleanScript.split(/\s+/).filter(Boolean);
  const hookText = scriptWords.slice(0, 18).join(' ');

  const titleLower = cleanTitle.toLowerCase();
  const hookLower = hookText.toLowerCase();
  const hasNonAscii = /[^\x00-\x7F]/.test(cleanTitle) || /[^\x00-\x7F]/.test(cleanScript);

  // Gibberish / Meaningless check
  if (isMeaninglessText(cleanTitle, cleanScript)) {
    return {
      hookText: hookText || cleanTitle || 'No hook provided',
      hookType: 'Weak / Descriptive',
      emotionalIntensity: 0,
      titleHookScore: 0,
      scriptHookScore: 0,
      overallHookScore: 0,
      detectedPowerWords: [],
    };
  }

  // 1. Detect Power Words
  const detectedPowerWords: string[] = [];
  for (const pw of VIRAL_POWER_WORDS) {
    if (titleLower.includes(pw) || hookLower.includes(pw)) {
      if (!detectedPowerWords.includes(pw)) {
        detectedPowerWords.push(pw);
      }
    }
  }

  // 2. Classify Hook Strategy
  let hookType: HookAnalysisResult['hookType'] = 'Weak / Descriptive';
  if (/stop (doing|buying|using|making|saying)/i.test(titleLower) || /stop (doing|buying|using|making|saying)|lose|losing|ruin|ruining|mistake|kill/i.test(hookLower)) {
    hookType = 'Negative Framing';
  } else if (/\d+%\s*(of)?/i.test(titleLower) || /\d+%\s*(of)?/i.test(hookLower) || /\d+\s*(mistakes|hacks|reasons|steps|tools|ways|prompts|creators|videos)/i.test(titleLower) || /\d+\s*(mistakes|hacks|reasons|steps|creators|videos)/i.test(hookLower)) {
    hookType = 'Quantified Challenge';
  } else if (CURIOSITY_PATTERNS.some((pat) => pat.test(titleLower) || pat.test(hookLower)) || /before|until|reason why|this single|what happens/i.test(hookLower)) {
    hookType = 'Curiosity Gap';
  } else if (/forget|wait|don't scroll|listen to this|watch this|secret|insane|crazy/i.test(titleLower) || /forget|wait|listen/i.test(hookLower)) {
    hookType = 'Pattern Interrupt';
  } else if (/if you (have|are|want|use|build|workout|invest)|creators|editors|most people/i.test(titleLower) || /if you|creators|editors|most people/i.test(hookLower)) {
    hookType = 'Direct Calling';
  } else if (/how to/i.test(titleLower) || /how to/i.test(hookLower)) {
    hookType = 'Value Pitch';
  }

  // 3. Score Title Hook (0 - 100)
  let titleHookScore = 40; // Base score for valid title
  if (cleanTitle.length >= 8 && cleanTitle.length <= 80) titleHookScore += 20; // Optimal title length
  else if (cleanTitle.length > 3) titleHookScore += 10;

  if (/\d+/.test(cleanTitle) || /%/.test(cleanTitle)) titleHookScore += 20; // Numbers/percentages add high specificity
  if (/[!?¿¡]/.test(cleanTitle) || /[\u{1F300}-\u{1F9FF}]/u.test(cleanTitle)) titleHookScore += 10; // Punctuation & Emoji punch
  if (detectedPowerWords.length > 0) titleHookScore += Math.min(30, detectedPowerWords.length * 12);
  if (hookType !== 'Weak / Descriptive') titleHookScore += 20;

  titleHookScore = Math.min(100, Math.max(20, Math.round(titleHookScore)));

  // 4. Score Script Hook (0 - 100)
  let scriptHookScore = scriptWords.length > 3 || (hasNonAscii && cleanScript.length > 10) ? 45 : 20;
  if (hookText.length > 15) scriptHookScore += 15;
  if (/\d+%|\b\d+\b/i.test(hookLower)) scriptHookScore += 20; // Specific statistics / numbers
  if (detectedPowerWords.length > 0) scriptHookScore += Math.min(25, detectedPowerWords.length * 10);
  if (/you|your|this|why|stop|never|lose|losing|before|creators|tú|tu|du|vous|aap|tum|kya|que|wie|como|как|あなた|你|너|انت/i.test(hookLower)) scriptHookScore += 15;
  if (hookType !== 'Weak / Descriptive') scriptHookScore += 15;

  scriptHookScore = Math.min(100, Math.max(20, Math.round(scriptHookScore)));

  // 5. Calculate Emotional Intensity & Combined Hook Score
  const emotionalIntensity = Math.min(
    100,
    Math.round(
      detectedPowerWords.length * 20 +
      (hookType !== 'Weak / Descriptive' ? 30 : 10) +
      (titleHookScore * 0.3)
    )
  );

  const overallHookScore = Math.round(titleHookScore * 0.45 + scriptHookScore * 0.55);

  return {
    hookText: hookText || cleanTitle || 'No hook provided',
    hookType,
    emotionalIntensity,
    titleHookScore,
    scriptHookScore,
    overallHookScore,
    detectedPowerWords,
  };
}
