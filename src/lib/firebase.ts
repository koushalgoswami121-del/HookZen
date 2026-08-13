import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  deleteUser,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { ViralScoreResult } from '../types';

// Always use Firebase's own default authDomain for the sign-in popup.
//
// WHY: Using a custom authDomain (www.hookzen.me) requires Vercel to proxy
// the /__/auth/handler route from Firebase Hosting. That proxy breaks the
// cross-frame postMessage that delivers the auth result back to the app —
// the sign-in popup completes but the result is silently dropped, leaving
// the user logged out. Firebase's own firebaseapp.com domain has no such
// limitation and works reliably on all hosting platforms.
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: `${firebaseConfigData.projectId}.firebaseapp.com`,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with explicit browserLocalPersistence
export const auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence).catch(() => { });
} catch {
  // ignore
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore (with offline persistent cache where supported)
const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    databaseId
  );
} catch {
  firestoreInstance = getFirestore(app, databaseId);
}
export const db = firestoreInstance;

// Timeout wrapper helper to prevent hanging when offline or firestore backend is slow
const withTimeout = <T>(promise: Promise<T>, ms = 4000, fallback: T): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(fallback);
    }, ms);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }).catch(() => {
      clearTimeout(timeoutId);
      return fallback;
    }),
    timeoutPromise,
  ]);
};

// IP Address Fetcher and Sanitizer
let cachedIpAddress: string | null = null;

export async function getPublicIp(): Promise<string> {
  if (cachedIpAddress) return cachedIpAddress;

  try {
    const saved = sessionStorage.getItem('hkz_user_ip');
    if (saved) {
      cachedIpAddress = saved;
      return saved;
    }
  } catch (e) {
    // ignore
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedIpAddress = data.ip;
        try { sessionStorage.setItem('hkz_user_ip', data.ip); } catch (e) { }
        return data.ip;
      }
    }
  } catch (e) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('https://api.db-ip.com/v2/free/self', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ipAddress) {
          cachedIpAddress = data.ipAddress;
          try { sessionStorage.setItem('hkz_user_ip', data.ipAddress); } catch (e) { }
          return data.ipAddress;
        }
      }
    } catch (e2) {
      // ignore
    }
  }

  const fingerprint = `fp_${navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)}_${screen.width}x${screen.height}`;
  cachedIpAddress = fingerprint;
  return fingerprint;
}

export interface IpUsageRecord {
  dailyCreditsUsed: number;
  lastResetDate: string;
}

export const fetchIpUsageFromFirestore = async (ip: string): Promise<IpUsageRecord | null> => {
  const fetchTask = (async (): Promise<IpUsageRecord | null> => {
    const sanitizedKey = ip.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ipRef = doc(db, 'ip_usage', sanitizedKey);
    const snap = await getDoc(ipRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        dailyCreditsUsed: Number(data.dailyCreditsUsed || 0),
        lastResetDate: String(data.lastResetDate || ''),
      };
    }
    return null;
  })();

  return withTimeout(fetchTask, 3000, null);
};

export const saveIpUsageToFirestore = async (
  ip: string,
  creditsUsed: number,
  lastResetDate: string
): Promise<void> => {
  try {
    const sanitizedKey = ip.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ipRef = doc(db, 'ip_usage', sanitizedKey);
    const snap = await getDoc(ipRef);
    let finalCreditsUsed = creditsUsed;
    if (snap.exists()) {
      const data = snap.data();
      if (data.lastResetDate === lastResetDate) {
        finalCreditsUsed = Math.max(Number(data.dailyCreditsUsed || 0), creditsUsed);
      }
    }
    await setDoc(
      ipRef,
      {
        dailyCreditsUsed: finalCreditsUsed,
        lastResetDate,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to record IP credit usage in Firestore:', err);
  }
};

// Google Sign In — uses redirect flow (no popup).
// Page navigates to Google, user picks account, Google redirects back to hookzen.me.
// Call handleRedirectResult() on app mount to complete the sign-in.
export const loginWithGoogle = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider);
    // Page will navigate away — no code runs after this line
  } catch (error: any) {
    console.error('Error initiating Google Sign-In redirect:', error);
    throw error;
  }
};

// Call once on app mount to complete sign-in after Google redirects back to hookzen.me
export const handleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      const user = result.user;
      // Save/update user profile in Firestore (non-blocking)
      (async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(
            userRef,
            {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (fsErr) {
          console.warn('User profile Firestore sync warning:', fsErr);
        }
      })();
      return user;
    }
    return null;
  } catch (error: any) {
    console.error('Error handling Google redirect result:', error);
    return null;
  }
};

// Sign Out Helper
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Subscribe to Auth state changes
export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore User History Operations
export const saveUserHistoryItemToFirestore = async (
  userId: string,
  result: ViralScoreResult
): Promise<void> => {
  try {
    const historyRef = doc(db, 'users', userId, 'history', result.id);
    await setDoc(historyRef, {
      ...result,
      userId,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Failed to save history item to Firestore:', error);
  }
};

export const fetchUserHistoryFromFirestore = async (
  userId: string
): Promise<ViralScoreResult[]> => {
  const fetchTask = (async (): Promise<ViralScoreResult[]> => {
    const historyColRef = collection(db, 'users', userId, 'history');
    const q = query(historyColRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const results: ViralScoreResult[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push(data as ViralScoreResult);
    });
    return results;
  })();

  return withTimeout(fetchTask, 4000, []);
};

export const clearUserHistoryInFirestore = async (
  userId: string,
  historyIds: string[]
): Promise<void> => {
  try {
    const promises = historyIds.map((id) =>
      deleteDoc(doc(db, 'users', userId, 'history', id))
    );
    await Promise.all(promises);
  } catch (error) {
    console.warn('Failed to clear user history in Firestore:', error);
  }
};

// User Profile & Freemium Cloud Sync Operations
export interface CloudUserProfile {
  isPro?: boolean;
  planType?: 'free' | 'monthly' | 'annual' | 'lifetime';
  pendingPlanType?: 'monthly' | 'annual' | 'lifetime';
  dailyCreditsUsed?: number;
  lastResetDate?: string;
  updatedAt?: string;
}

export const fetchUserProfileFromFirestore = async (
  userId: string
): Promise<CloudUserProfile | null> => {
  const fetchTask = (async (): Promise<CloudUserProfile | null> => {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        isPro: data.isPro,
        planType: data.planType,
        dailyCreditsUsed: data.dailyCreditsUsed,
        lastResetDate: data.lastResetDate,
      };
    }
    return null;
  })();

  return withTimeout(fetchTask, 4000, null);
};

export const saveUserProfileToFirestore = async (
  userId: string,
  profile: CloudUserProfile
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Failed to save user profile to Firestore:', error);
  }
};

export const deleteUserDataFromFirestore = async (userId: string): Promise<void> => {
  try {
    // Delete history
    const historyColRef = collection(db, 'users', userId, 'history');
    const snapshot = await getDocs(historyColRef);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    // Delete user profile doc
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.warn('Failed to delete user data from Firestore:', error);
  }
};

export const deleteAccountPermanently = async (currentUser: User): Promise<void> => {
  const userId = currentUser.uid;
  // Wipe database documents first
  await deleteUserDataFromFirestore(userId);

  // Try deleting Firebase Auth user account
  try {
    await deleteUser(currentUser);
  } catch (err) {
    console.warn('deleteUser auth failed (re-auth may be required), signing out instead:', err);
    await signOut(auth);
  }
};


