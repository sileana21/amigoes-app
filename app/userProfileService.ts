import type { User } from 'firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/*
Firestore data model (decisions):

- users (collection)
  - {uid} (document)
    - email: string
    - username: string (unique across users)
    - coins, petName, petLevel, dailySteps, createdAt, ...
    - friends (subcollection)
      - {friendUid} (document) => { uid, username, displayName?, createdAt }

- friendRequests (top-level collection)
  - {autoId} (document)
    - from: uid (requesting user)
    - to: uid (target user)
    - status: 'pending' | 'accepted' | 'declined'
    - createdAt, updatedAt

Rationale:
- Keeping `friendRequests` as a top-level collection makes it easy to query incoming/outgoing requests and keeps requests separate from user documents.
- Storing accepted friends under `users/{uid}/friends/{friendUid}` provides fast reads for a user's friends list.

All helper functions below follow this model.
*/

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
        totalSteps: 0,
        friendCount: 0,
        equippedItems: {},
      petName: 'Sunny',
      petLevel: 1,
      createdAt: serverTimestamp(),
    });
  }
}

// Username helpers
export async function isUsernameAvailable(username: string) {
  if (!username) return false;
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  return snap.empty;
}

export async function getUserByUsername(username: string) {
  if (!username) return null;
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as any;
}

export async function setUsername(userId: string, username: string) {
  if (!userId || !username) return { success: false, error: 'missing' };
  // check availability
  const existing = await getUserByUsername(username);
  if (existing && existing.id !== userId) {
    return { success: false, error: 'taken' };
  }
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { username });
  return { success: true };
}

// Friend request / friendship helpers
export async function sendFriendRequest(fromUid: string, toUsername: string) {
  if (!fromUid || !toUsername) return { success: false, error: 'missing' };
  const toUser = await getUserByUsername(toUsername);
  if (!toUser) return { success: false, error: 'not-found' };
  const toUid = toUser.id;
  if (toUid === fromUid) return { success: false, error: 'self' };

  // Check if already friends
  const friendRef = doc(db, 'users', fromUid, 'friends', toUid);
  const friendSnap = await getDoc(friendRef);
  if (friendSnap.exists()) return { success: false, error: 'already-friends' };

  // Check for existing pending requests (either direction)
  const requestsRef = collection(db, 'friendRequests');
  const q1 = query(requestsRef, where('from', '==', fromUid), where('to', '==', toUid), where('status', '==', 'pending'));
  const q2 = query(requestsRef, where('from', '==', toUid), where('to', '==', fromUid), where('status', '==', 'pending'));
  const [r1, r2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  if (!r1.empty || !r2.empty) return { success: false, error: 'request-exists' };

  await addDoc(requestsRef, {
    from: fromUid,
    to: toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { success: true };
}

export async function listIncomingRequests(uid: string) {
  if (!uid) return [];
  const requestsRef = collection(db, 'friendRequests');
  const q = query(requestsRef, where('to', '==', uid), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listOutgoingRequests(uid: string) {
  if (!uid) return [];
  const requestsRef = collection(db, 'friendRequests');
  const q = query(requestsRef, where('from', '==', uid), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function acceptFriendRequest(requestId: string, currentUserUid: string) {
  if (!requestId || !currentUserUid) return { success: false, error: 'missing' };
  const reqRef = doc(db, 'friendRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) return { success: false, error: 'not-found' };
  const data: any = reqSnap.data();
  if (data.to !== currentUserUid) return { success: false, error: 'not-authorized' };

  const fromUid = data.from;
  const toUid = data.to;

  // Create friend docs for both users
  const fromFriendRef = doc(db, 'users', fromUid, 'friends', toUid);
  const toFriendRef = doc(db, 'users', toUid, 'friends', fromUid);

  // Grab minimal profile info
  const fromProfile = await getUserProfile(fromUid);
  const toProfile = await getUserProfile(toUid);

  await setDoc(fromFriendRef, {
    uid: toUid,
    username: toProfile?.username || null,
    email: toProfile?.email || null,
    createdAt: serverTimestamp(),
  });

  await setDoc(toFriendRef, {
    uid: fromUid,
    username: fromProfile?.username || null,
    email: fromProfile?.email || null,
    createdAt: serverTimestamp(),
  });

  // Increment friendCount for both users
  try {
    const fromRef = doc(db, 'users', fromUid);
    const toRef = doc(db, 'users', toUid);
    await updateDoc(fromRef, { friendCount: increment(1) });
    await updateDoc(toRef, { friendCount: increment(1) });
  } catch (e) {
    console.warn('Failed to increment friendCount', e);
  }

  // After creating friend docs, delete the friend request so it no longer appears
  await deleteDoc(reqRef);
  return { success: true };
}

export async function declineFriendRequest(requestId: string, currentUserUid: string) {
  if (!requestId || !currentUserUid) return { success: false, error: 'missing' };
  const reqRef = doc(db, 'friendRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) return { success: false, error: 'not-found' };
  const data: any = reqSnap.data();
  if (data.to !== currentUserUid && data.from !== currentUserUid) return { success: false, error: 'not-authorized' };

  // Remove the request document so it no longer shows up
  await deleteDoc(reqRef);
  return { success: true };
}

export async function listFriends(uid: string) {
  if (!uid) return [];
  const friendsRef = collection(db, 'users', uid, 'friends');
  const snap = await getDocs(friendsRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setEquippedItems(userId: string, equipped: any) {
  if (!userId) return { success: false };
  const ref = doc(db, 'users', userId);
  try {
    await updateDoc(ref, { equippedItems: equipped });
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
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

export async function updateDailySteps(userId: string, newDailySteps: number) {
  if (!userId) return;
  const ref = doc(db, 'users', userId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const prevDaily = snap.data()?.dailySteps || 0;
    const delta = newDailySteps - prevDaily;

    if (delta > 0) {
      await updateDoc(ref, {
        dailySteps: newDailySteps,
        totalSteps: increment(delta),
      });
    } else {
      await updateDoc(ref, { dailySteps: newDailySteps });
    }
  } catch (e) {
    console.warn('Failed to update dailySteps', e);
  }
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