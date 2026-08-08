import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);

export interface UserIdentifier {
  userId?: string;
  email?: string;
}

export async function updateUserPremiumStatus(
  identifier: UserIdentifier,
  isPremium: boolean,
  planType: 'monthly' | 'annual' | 'lifetime' | 'free' = 'monthly'
): Promise<boolean> {
  let updatedCount = 0;
  try {
    // 1. Direct match by User ID (doc ID)
    if (identifier.userId) {
      const userRef = doc(db, 'users', identifier.userId);
      await setDoc(
        userRef,
        {
          isPro: isPremium,
          premium: isPremium,
          planType: isPremium ? planType : 'free',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(
        `[Firestore] Successfully set user ${identifier.userId} premium status to ${isPremium} (${isPremium ? planType : 'free'})`
      );
      updatedCount++;
    }

    // 2. Search match by Email if provided
    if (identifier.email) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', identifier.email.toLowerCase()));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const updatePromises = querySnap.docs.map((docSnap) =>
          setDoc(
            docSnap.ref,
            {
              isPro: isPremium,
              premium: isPremium,
              planType: isPremium ? planType : 'free',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          )
        );
        await Promise.all(updatePromises);
        console.log(
          `[Firestore] Successfully set user(s) with email ${identifier.email} premium status to ${isPremium} (${isPremium ? planType : 'free'})`
        );
        updatedCount += querySnap.size;
      } else {
        // Also try case-exact email if lower-case didn't yield results
        const qExact = query(usersRef, where('email', '==', identifier.email));
        const exactSnap = await getDocs(qExact);
        if (!exactSnap.empty) {
          const updatePromises = exactSnap.docs.map((docSnap) =>
            setDoc(
              docSnap.ref,
              {
                isPro: isPremium,
                premium: isPremium,
                planType: isPremium ? planType : 'free',
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            )
          );
          await Promise.all(updatePromises);
          console.log(
            `[Firestore] Successfully set user(s) with exact email ${identifier.email} premium status to ${isPremium}`
          );
          updatedCount += exactSnap.size;
        } else {
          console.log(`[Firestore] No user found with email: ${identifier.email}`);
        }
      }
    }

    return updatedCount > 0;
  } catch (error) {
    console.error('[Firestore] Error updating user premium status:', error);
    return false;
  }
}

export function extractUserFromPolarEvent(event: any): {
  userId?: string;
  email?: string;
  planType: 'monthly' | 'annual' | 'lifetime';
} {
  const data = event.data || {};
  const metadata = data.metadata || data.checkout?.metadata || {};

  const userId =
    metadata.userId ||
    metadata.user_id ||
    data.external_customer_id ||
    data.customer?.external_id ||
    undefined;

  const email =
    data.customer_email ||
    data.customer?.email ||
    data.user?.email ||
    metadata.email ||
    undefined;

  let planType: 'monthly' | 'annual' | 'lifetime' = 'monthly';
  if (
    metadata.planType === 'annual' ||
    metadata.planType === 'lifetime' ||
    metadata.planType === 'monthly'
  ) {
    planType = metadata.planType;
  } else if (
    data.product?.name?.toLowerCase().includes('annual') ||
    data.recurring_interval === 'year'
  ) {
    planType = 'annual';
  } else if (data.product?.name?.toLowerCase().includes('lifetime')) {
    planType = 'lifetime';
  }

  return { userId, email, planType };
}
