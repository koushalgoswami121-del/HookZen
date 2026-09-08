import {
  getPublicIp,
  getDeviceFingerprint,
  fetchIpUsageFromFirestore,
  saveIpUsageToFirestore,
} from '../lib/firebase';

export interface FreemiumState {
  isPro: boolean;
  planType?: 'free' | 'monthly' | 'annual' | 'lifetime';
  dailyCreditsUsed: number; // Credits used in the current monthly cycle (retained for database compatibility)
  maxFreeDailyCredits: number; // 50 credits refreshed monthly (retained for database compatibility)
  bonusCredits?: number;
  lastResetDate: string; // YYYY-MM
}

const STORAGE_KEY = 'hookzen_freemium_state';
export const MAX_FREE_MONTHLY_CREDITS = 50;
const MAX_FREE_DAILY = MAX_FREE_MONTHLY_CREDITS;
export const CREDITS_PER_ANALYSIS = 10;

export function getCurrentMonthString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function toMonthString(dateStr?: string): string {
  if (!dateStr) return getCurrentMonthString();
  return dateStr.slice(0, 7);
}

export function isSameMonth(date1?: string, date2?: string): boolean {
  if (!date1 || !date2) return false;
  return toMonthString(date1) === toMonthString(date2);
}

export function getFreemiumState(): FreemiumState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const currentMonth = getCurrentMonthString();

    if (!raw) {
      const initial: FreemiumState = {
        isPro: false,
        planType: 'free',
        dailyCreditsUsed: 0,
        maxFreeDailyCredits: MAX_FREE_MONTHLY_CREDITS,
        lastResetDate: currentMonth,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed: FreemiumState = JSON.parse(raw);
    parsed.maxFreeDailyCredits = MAX_FREE_MONTHLY_CREDITS;

    // Default planType if missing
    if (!parsed.planType) {
      parsed.planType = parsed.isPro ? 'lifetime' : 'free';
    }

    // Check if a new month has started
    if (!isSameMonth(parsed.lastResetDate, currentMonth)) {
      parsed.dailyCreditsUsed = 0;
      parsed.lastResetDate = currentMonth;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    return parsed;
  } catch (err) {
    return {
      isPro: false,
      planType: 'free',
      dailyCreditsUsed: 0,
      maxFreeDailyCredits: MAX_FREE_MONTHLY_CREDITS,
      lastResetDate: getCurrentMonthString(),
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

// Asynchronously sync credits used by IP address from Firestore (bypassed for logged-in users)
export async function checkAndSyncIpCredits(isUserLoggedIn = false): Promise<FreemiumState> {
  const currentState = getFreemiumState();
  if (currentState.isPro) return currentState;

  // If the user is logged into an account, we do not restrict them by the IP address.
  // Their account's cloud balance is their unique source of truth.
  if (isUserLoggedIn) return currentState;

  try {
    const ip = await getPublicIp();
    const fp = getDeviceFingerprint();
    const currentMonth = getCurrentMonthString();

    // Check both vectors in parallel
    const [ipRecord, fpRecord] = await Promise.all([
      fetchIpUsageFromFirestore(ip),
      fetchIpUsageFromFirestore(fp)
    ]);

    let highestUsed = currentState.dailyCreditsUsed;
    if (ipRecord && isSameMonth(ipRecord.lastResetDate, currentMonth)) {
      highestUsed = Math.max(highestUsed, ipRecord.dailyCreditsUsed);
    }
    if (fpRecord && isSameMonth(fpRecord.lastResetDate, currentMonth)) {
      highestUsed = Math.max(highestUsed, fpRecord.dailyCreditsUsed);
    }

    if (highestUsed !== currentState.dailyCreditsUsed) {
      currentState.dailyCreditsUsed = highestUsed;
      saveFreemiumState(currentState);
    }
  } catch (err) {
    console.warn('Credits sync note:', err);
  }

  return currentState;
}

export function getRemainingCredits(): number {
  const state = getFreemiumState();
  if (state.isPro) return Infinity;
  return Math.max(0, (state.maxFreeDailyCredits + (state.bonusCredits || 0)) - state.dailyCreditsUsed);
}

export function useCredit(amount = CREDITS_PER_ANALYSIS): boolean {
  const state = getFreemiumState();
  if (state.isPro) return true; // Pro users have unlimited
  if ((state.maxFreeDailyCredits + (state.bonusCredits || 0)) - state.dailyCreditsUsed >= amount) {
    state.dailyCreditsUsed += amount;
    saveFreemiumState(state);

    // Save credit usage to IP & Fingerprint tracking in Firestore asynchronously
    (async () => {
      try {
        const ip = await getPublicIp();
        const fp = getDeviceFingerprint();
        await Promise.all([
          saveIpUsageToFirestore(ip, state.dailyCreditsUsed, state.lastResetDate),
          saveIpUsageToFirestore(fp, state.dailyCreditsUsed, state.lastResetDate)
        ]);
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

export function resetMonthlyCredits(): FreemiumState {
  const state = getFreemiumState();
  state.dailyCreditsUsed = 0;
  state.lastResetDate = getCurrentMonthString();
  saveFreemiumState(state);
  return state;
}

export const resetDailyCredits = resetMonthlyCredits;


