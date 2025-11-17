import { useEffect } from 'react';

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
  return inventory.slice();
}

export async function addItem(item: InventoryItem) {
  await ensureInit();
  inventory = [...inventory, item];
  await trySaveStorage();
  notify();
}

export function subscribe(cb: (items: InventoryItem[]) => void) {
  listeners.add(cb);
  // call synchronously with current items (don't await persistence)
  cb(inventory.slice());
  return () => listeners.delete(cb);
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
