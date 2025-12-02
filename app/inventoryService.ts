import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

export type InventoryItem = {
  id: string;
  name: string;
  emoji?: string;
  image?: any;
  rarity?: string;
  sourceId?: number | string;
};

const STORAGE_KEY = 'AMIGO_INVENTORY_V1';
let inventory: InventoryItem[] = [];
let inited = false;
const listeners = new Set<(items: InventoryItem[]) => void>();

async function tryLoadStorage() {
  try {
    // try dynamic require so the app doesn't crash if the package isn't installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      inventory = JSON.parse(raw);
    }
  } catch (e) {
    // package not available or read error — fall back to in-memory only
    // console.log('AsyncStorage not available for inventory persistence');
  }
}

async function trySaveStorage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  } catch (e) {
    // ignore
  }
}

async function ensureInit() {
  if (inited) return;
  inited = true;
  await tryLoadStorage();
}

export async function getInventory(): Promise<InventoryItem[]> {
  await ensureInit();
  // If user signed in, prefer Firestore-backed inventory
  const user = auth.currentUser;
  if (user) {
    try {
      const ref = collection(db, 'users', user.uid, 'inventory');
      const snap = await getDocs(ref);
      // Map and deduplicate by sourceId (if present) to avoid duplicates
      const raw = snap.docs.map(d => ({ id: d.id, name: d.data().name, sourceId: d.data().sourceId } as InventoryItem));
      const seen = new Map<string | number, InventoryItem>();
      const items: InventoryItem[] = [];
      for (const it of raw) {
        const key = it.sourceId ?? it.id;
        if (!seen.has(String(key))) {
          seen.set(String(key), it);
          items.push(it);
        }
      }
      // keep local cache in sync for offline
      inventory = items;
      await trySaveStorage();
      return items;
    } catch (e) {
      // fallback to local
      return inventory.slice();
    }
  }

  return inventory.slice();
}

export async function addItem(item: InventoryItem) {
  await ensureInit();
  const user = auth.currentUser;
  if (user) {
    try {
      const refCollection = collection(db, 'users', user.uid, 'inventory');

      // If item has a sourceId, check for existing item with same sourceId to prevent duplicates
      if (item.sourceId != null) {
        const q = query(refCollection, where('sourceId', '==', item.sourceId));
        const existing = await getDocs(q);
        if (!existing.empty) {
          // update local cache from existing snapshot to keep UI consistent
          const items = existing.docs.map(d => ({ id: d.id, name: d.data().name, sourceId: d.data().sourceId } as InventoryItem));
          // merge unique
          const merged = [...inventory];
          for (const it of items) {
            if (!merged.find(m => String(m.sourceId) === String(it.sourceId))) merged.push(it);
          }
          inventory = merged;
          await trySaveStorage();
          notify();
          return;
        }
      }

      const ref = doc(db, 'users', user.uid, 'inventory', item.id);
      await setDoc(ref, {
        itemId: item.id,
        name: item.name,
        sourceId: item.sourceId ?? null,
        purchasedAt: serverTimestamp(),
      });
      // update local cache
      // avoid duplicates locally by sourceId or id
      if (!inventory.find(i => (i.sourceId != null && item.sourceId != null && String(i.sourceId) === String(item.sourceId)) || i.id === item.id)) {
        inventory = [...inventory, item];
      }
      await trySaveStorage();
      notify();
      return;
    } catch (e) {
      // fallthrough to local-only
      console.warn('Failed to save inventory to Firestore, using local cache', e);
    }
  }

  // local-only fallback: avoid duplicates by sourceId or id
  if (!inventory.find(i => (i.sourceId != null && item.sourceId != null && String(i.sourceId) === String(item.sourceId)) || i.id === item.id)) {
    inventory = [...inventory, item];
  }
  await trySaveStorage();
  notify();
}

export function subscribe(cb: (items: InventoryItem[]) => void) {
  listeners.add(cb);
  // call synchronously with current items (don't await persistence)
  cb(inventory.slice());

  // If user is signed in, also set up a Firestore realtime listener
  const user = auth.currentUser;
  let unsub: (() => void) | null = null;
  if (user) {
    try {
      const ref = collection(db, 'users', user.uid, 'inventory');
      unsub = onSnapshot(ref, (snap) => {
        const raw = snap.docs.map(d => ({ id: d.id, name: d.data().name, sourceId: d.data().sourceId } as InventoryItem));
        // dedupe by sourceId
        const seen = new Map<string | number, InventoryItem>();
        const items: InventoryItem[] = [];
        for (const it of raw) {
          const key = it.sourceId ?? it.id;
          if (!seen.has(String(key))) {
            seen.set(String(key), it);
            items.push(it);
          }
        }
        inventory = items;
        notify();
      });
    } catch (e) {
      // ignore
    }
  }

  return () => {
    listeners.delete(cb);
    if (unsub) unsub();
  };
}

function notify() {
  const snapshot = inventory.slice();
  listeners.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (e) {
      // ignore listener errors
    }
  });
}

export async function clearInventory() {
  inventory = [];
  await trySaveStorage();
  notify();
}
