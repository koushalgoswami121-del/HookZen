import {
  getPublicIp,
  fetchIpUsageFromFirestore,
  saveIpUsageToFirestore,
} from '../lib/firebase';

export interface FreemiumState {
  isPro: boolean;
  planType?: 'free' | 'monthly' | 'annual' | 'lifetime';
  dailyCreditsUsed: number;
  maxFreeDailyCredits: number;
  lastResetDate: string; // YYYY-MM-DD
}

const STORAGE_KEY = 'hookzen_freemium_state';
const MAX_FREE_DAILY = 50;
export const CREDITS_PER_ANALYSIS = 10;

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getFreemiumState(): FreemiumState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getTodayDateString();

    if (!raw) {
      const initial: FreemiumState = {
        isPro: false,
        planType: 'free',
        dailyCreditsUsed: 0,
        maxFreeDailyCredits: MAX_FREE_DAILY,
        lastResetDate: today,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed: FreemiumState = JSON.parse(raw);
    parsed.maxFreeDailyCredits = MAX_FREE_DAILY;

    // Default planType if missing
    if (!parsed.planType) {
      parsed.planType = parsed.isPro ? 'lifetime' : 'free';
    }
    
    // Check if a new day has started
    if (parsed.lastResetDate !== today) {
      parsed.dailyCreditsUsed = 0;
      parsed.lastResetDate = today;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    return parsed;
  } catch (err) {
    return {
      isPro: false,
      planType: 'free',
      dailyCreditsUsed: 0,
      maxFreeDailyCredits: MAX_FREE_DAILY,
      lastResetDate: getTodayDateString(),
    };
  }
}

export function saveFreemiumState(state: FreemiumState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save freemium state', err);
  }
}

// Asynchronously sync credits used by IP address from Firestore
export async function checkAndSyncIpCredits(): Promise<FreemiumState> {
  const currentState = getFreemiumState();
  if (currentState.isPro) return currentState;

  try {
    const ip = await getPublicIp();
    const today = getTodayDateString();
    const ipRecord = await fetchIpUsageFromFirestore(ip);

    if (ipRecord && ipRecord.lastResetDate === today) {
      // Enforce the maximum credits used across local and IP history
      const highestUsed = Math.max(currentState.dailyCreditsUsed, ipRecord.dailyCreditsUsed);
      if (highestUsed !== currentState.dailyCreditsUsed) {
        currentState.dailyCreditsUsed = highestUsed;
        saveFreemiumState(currentState);
      }
    }
  } catch (err) {
    console.warn('IP credit sync note:', err);
  }

  return currentState;
}

export function getRemainingCredits(): number {
  const state = getFreemiumState();
  if (state.isPro) return Infinity;
  return Math.max(0, state.maxFreeDailyCredits - state.dailyCreditsUsed);
}

export function useCredit(amount = CREDITS_PER_ANALYSIS): boolean {
  const state = getFreemiumState();
  if (state.isPro) return true; // Pro users have unlimited
  if (state.maxFreeDailyCredits - state.dailyCreditsUsed >= amount) {
    state.dailyCreditsUsed += amount;
    saveFreemiumState(state);

    // Save credit usage to IP tracking in Firestore asynchronously
    (async () => {
      try {
        const ip = await getPublicIp();
        await saveIpUsageToFirestore(ip, state.dailyCreditsUsed, state.lastResetDate);
      } catch (e) {
        console.warn('Asynchronous IP credit save note:', e);
      }
    })();

    return true;
  }
  return false;
}

export function toggleProStatus(
  enablePro?: boolean,
  planType?: 'free' | 'monthly' | 'annual' | 'lifetime',
  force?: boolean
): FreemiumState {
  const state = getFreemiumState();
  
  // Protect active Pro users from manual downgrade unless force flag is set
  if (state.isPro && enablePro === false && !force) {
    return state;
  }

  state.isPro = enablePro !== undefined ? enablePro : !state.isPro;
  
  if (state.isPro) {
    state.planType = planType || (state.planType && state.planType !== 'free' ? state.planType : 'lifetime');
  } else {
    state.planType = 'free';
  }

  saveFreemiumState(state);
  return state;
}

export function resetDailyCredits(): FreemiumState {
  const state = getFreemiumState();
  state.dailyCreditsUsed = 0;
  state.lastResetDate = getTodayDateString();
  saveFreemiumState(state);
  return state;
}

