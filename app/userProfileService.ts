import type { User } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function createUserProfileIfMissing(user: User, username: string) {
  if (!user.uid) return;

  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);

  // Only create the document if it doesn't exist yet
  if (!snapshot.exists()) {
    await setDoc(ref, {
      email: user.email ?? '',
      username: username,
      coins: 0,
        dailySteps: 0,
      petName: 'Sunny',
      petLevel: 1,
      createdAt: serverTimestamp(),
    });
  }
}

export async function updateCoins(userId: string, newCoins: number) {
  if (!userId) return;
  
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, {
    coins: newCoins,
  });
}

export async function getUserProfile(uid: string) {
  if (!uid) return null;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function updatePetName(userId: string, petName: string) {
  if (!userId) return;
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { petName });
}

export async function updateDailySteps(userId: string, dailySteps: number) {
  if (!userId) return;
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { dailySteps });
}

export async function getLeaderboard(limit_count: number = 50) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('dailySteps', 'desc'), limit(limit_count));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc, index) => ({
    id: doc.id,
    name: doc.data().username || 'Anonymous',
    steps: doc.data().dailySteps || 0,
    rank: index + 1,
  }));
}