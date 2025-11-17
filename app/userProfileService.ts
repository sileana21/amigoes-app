import type { User } from 'firebase/auth';
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function createUserProfileIfMissing(user: User) {
  if (!user.uid) return;

  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);

  // Only create the document if it doesn't exist yet
  if (!snapshot.exists()) {
    await setDoc(ref, {
      email: user.email ?? '',
      coins: 0,
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
