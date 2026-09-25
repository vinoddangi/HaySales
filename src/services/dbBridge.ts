/**
 * Generic Transport / Database Driver Layer
 * Pure generic transport bridge for database operations.
 * Resolves path hierarchy into stores/collections dynamically without any business-domain checks.
 */

import {
  collection as firestoreCollection,
  collectionGroup as firestoreCollectionGroup,
  deleteDoc as firestoreDeleteDoc,
  doc as firestoreDoc,
  getDoc as firestoreGetDoc,
  getDocs as firestoreGetDocs,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  writeBatch as firestoreWriteBatch,
} from 'firebase/firestore';
import { mockDataStore } from '../mock/mockDataStore';
import { db as firebaseDb } from '../store/firebaseConfig';
import {
  deleteStoreItem,
  getStoreData,
  getStoreItem,
  openLocalDatabase,
  putStoreItem,
  recordPendingChange,
  StoreName,
} from './indexedDBService';

export type DatabaseMode = 'local' | 'server' | 'mock';

const STORAGE_KEY = 'haysales_db_mode';

class DatabaseConfig {
  private mode: DatabaseMode = 'local';

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'server' || saved === 'local' || saved === 'mock') {
        this.mode = saved;
      }
    }
  }

  getMode(): DatabaseMode {
    if (mockDataStore.isEnabled()) return 'mock';
    return this.mode;
  }

  setMode(mode: DatabaseMode): void {
    this.mode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    mockDataStore.setEnabled(mode === 'mock');
  }

  isLocal(): boolean {
    return this.getMode() === 'local';
  }

  isServer(): boolean {
    return this.getMode() === 'server';
  }

  isMock(): boolean {
    return this.getMode() === 'mock';
  }
}

export const dbConfig = new DatabaseConfig();

/**
 * Ensures local IndexedDB is opened when in local mode.
 */
export async function ensureLocalInitialized(): Promise<void> {
  if (typeof window === 'undefined') return;
  await openLocalDatabase();
}

// ----------------------------------------------------------------------
// Generic References
// ----------------------------------------------------------------------

export interface GenericDocRef {
  type: 'doc';
  path: string;
  segments: string[];
  id: string;
  parent: GenericCollectionRef;
  ref?: any;
}

export interface GenericCollectionRef {
  type: 'collection';
  path: string;
  segments: string[];
  id?: string;
  parent?: GenericDocRef | null;
}

export interface GenericDocumentSnapshot<T = any> {
  id: string;
  ref: GenericDocRef;
  exists(): boolean;
  data(): T;
}

export interface GenericQuerySnapshot<T = any> {
  empty: boolean;
  size: number;
  docs: GenericDocumentSnapshot<T>[];
  forEach(_callback: (_doc: GenericDocumentSnapshot<T>) => void): void;
}

export function doc(
  dbOrColOrPath: any,
  ...pathSegments: string[]
): GenericDocRef {
  let segments: string[] = [];

  if (
    dbOrColOrPath &&
    typeof dbOrColOrPath === 'object' &&
    dbOrColOrPath.type === 'collection'
  ) {
    // e.g. doc(collectionRef) or doc(collectionRef, 'customId')
    const customId =
      pathSegments[0] ||
      `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    segments = [...dbOrColOrPath.segments, customId];
  } else if (typeof dbOrColOrPath === 'string') {
    segments = [dbOrColOrPath, ...pathSegments]
      .join('/')
      .split('/')
      .filter(Boolean);
  } else {
    // db instance passed as first argument: e.g. doc(db, 'customers', custId, 'transactions', txId)
    segments = pathSegments.join('/').split('/').filter(Boolean);
  }

  const parentSegments = segments.slice(0, -1);
  return {
    type: 'doc',
    path: segments.join('/'),
    segments,
    id: segments[segments.length - 1] || '',
    parent: collection(parentSegments.join('/')),
  };
}

export function collection(
  dbOrDocOrPath: any,
  ...pathSegments: string[]
): GenericCollectionRef {
  let segments: string[] = [];

  if (
    dbOrDocOrPath &&
    typeof dbOrDocOrPath === 'object' &&
    dbOrDocOrPath.type === 'doc'
  ) {
    // e.g. collection(docRef, 'transactions')
    segments = [...dbOrDocOrPath.segments, ...pathSegments]
      .join('/')
      .split('/')
      .filter(Boolean);
  } else if (typeof dbOrDocOrPath === 'string') {
    segments = [dbOrDocOrPath, ...pathSegments]
      .join('/')
      .split('/')
      .filter(Boolean);
  } else {
    // db instance passed as first argument: e.g. collection(db, 'customers', custId, 'transactions')
    segments = pathSegments.join('/').split('/').filter(Boolean);
  }

  const parentSegments = segments.slice(0, -1);
  return {
    type: 'collection',
    path: segments.join('/'),
    segments,
    id: segments[segments.length - 1] || '',
    parent: parentSegments.length > 0 ? doc(parentSegments.join('/')) : null,
  };
}

export function collectionGroup(
  dbOrPath: any,
  collectionId?: string,
): GenericCollectionRef {
  const col =
    collectionId || (typeof dbOrPath === 'string' ? dbOrPath : 'transactions');
  return {
    type: 'collection',
    path: `__group__/${col}`,
    segments: ['__group__', col],
  };
}

export function increment(n: number) {
  return { __isIncrement: true, value: n };
}

const KNOWN_STORES = new Set([
  'customers',
  'transactions',
  'purchases',
  'monthly_rollout',
  'metadata',
  'pending_changes',
]);

/**
 * Pure generic path resolver:
 * - root collection path 'customers' -> store 'customers'
 * - subcollection path 'customers/123/transactions' -> store 'transactions', parentId '123'
 * - doc path 'customers/123/transactions/456' -> store 'transactions', id '456', parentId '123'
 */
function resolvePath(segments: string[]): {
  storeName: StoreName;
  id?: string;
  parentId?: string;
  isGroup?: boolean;
} {
  if (segments[0] === '__group__') {
    const col = segments[1] as StoreName;
    return {
      storeName: (KNOWN_STORES.has(col) ? col : 'transactions') as StoreName,
      isGroup: true,
    };
  }

  let rawStore: string;
  let id: string | undefined;
  let parentId: string | undefined;

  if (segments.length === 1) {
    rawStore = segments[0];
  } else if (segments.length === 2) {
    rawStore = segments[0];
    id = segments[1];
  } else if (segments.length === 3) {
    rawStore = segments[2];
    parentId = segments[1];
  } else {
    rawStore = segments[2];
    parentId = segments[1];
    id = segments[3];
  }

  return {
    storeName: (KNOWN_STORES.has(rawStore)
      ? rawStore
      : 'transactions') as StoreName,
    id,
    parentId,
  };
}

// ----------------------------------------------------------------------
// Generic DB Transport Operations
// ----------------------------------------------------------------------

export async function getDoc<T = any>(
  ref: GenericDocRef,
): Promise<GenericDocumentSnapshot<T>> {
  if (dbConfig.isServer()) {
    const fRef = firestoreDoc(firebaseDb, ref.path);
    const snap = await firestoreGetDoc(fRef);
    return {
      id: snap.id,
      ref,
      exists: () => snap.exists(),
      data: () => snap.data() as T,
    };
  }

  if (dbConfig.isMock()) {
    const { storeName, id } = resolvePath(ref.segments);
    let item: any = null;
    if (storeName === 'customers') {
      item = mockDataStore.getCustomers().find((c) => c.id === id);
    } else if (storeName === 'transactions') {
      item = mockDataStore.getTransactions().find((t) => t.id === id);
    } else if (storeName === 'purchases') {
      item = mockDataStore.getPurchases().find((p) => p.id === id);
    } else if (storeName === 'monthly_rollout') {
      item = mockDataStore.getMonthlyRollout();
    }
    return {
      id: id || ref.id,
      ref,
      exists: () => item !== undefined && item !== null,
      data: () => (item || {}) as T,
    };
  }

  // Local IndexedDB
  await ensureLocalInitialized();
  const { storeName, id } = resolvePath(ref.segments);

  if (!id) {
    return { id: ref.id, ref, exists: () => false, data: () => ({}) as T };
  }

  const item = await getStoreItem(storeName, id);
  return {
    id,
    ref,
    exists: () => item !== undefined && item !== null,
    data: () => (item || {}) as T,
  };
}

export async function getDocs<T = any>(
  ref: GenericCollectionRef,
): Promise<GenericQuerySnapshot<T>> {
  if (dbConfig.isServer()) {
    if (ref.segments[0] === '__group__') {
      const fSnap = await firestoreGetDocs(
        firestoreCollectionGroup(firebaseDb, ref.segments[1]),
      );
      const docs: GenericDocumentSnapshot<T>[] = fSnap.docs.map((d) => ({
        id: d.id,
        ref: doc(d.ref.path),
        exists: () => d.exists(),
        data: () => d.data() as T,
      }));
      return {
        empty: fSnap.empty,
        size: fSnap.size,
        docs,
        forEach: (cb) => docs.forEach(cb),
      };
    }

    const fRef = firestoreCollection(firebaseDb, ref.path);
    const fSnap = await firestoreGetDocs(fRef);
    const docs: GenericDocumentSnapshot<T>[] = fSnap.docs.map((d) => ({
      id: d.id,
      ref: doc(d.ref.path),
      exists: () => d.exists(),
      data: () => d.data() as T,
    }));
    return {
      empty: fSnap.empty,
      size: fSnap.size,
      docs,
      forEach: (cb) => docs.forEach(cb),
    };
  }

  if (dbConfig.isMock()) {
    const { storeName, parentId } = resolvePath(ref.segments);
    let items: any[] = [];
    if (storeName === 'customers') {
      items = mockDataStore.getCustomers();
    } else if (storeName === 'transactions') {
      items = parentId
        ? mockDataStore.getTransactions(parentId)
        : mockDataStore.getTransactions();
    } else if (storeName === 'purchases') {
      items = mockDataStore.getPurchases();
    } else if (storeName === 'monthly_rollout') {
      items = [mockDataStore.getMonthlyRollout()];
    }

    const docs: GenericDocumentSnapshot<T>[] = items.map((item) => {
      const itemId = String(item.id || item.key || item.month || '');
      const itemPath = parentId
        ? `${ref.segments[0]}/${parentId}/${storeName}/${itemId}`
        : `${storeName}/${itemId}`;
      return {
        id: itemId,
        ref: doc(itemPath),
        exists: () => true,
        data: () => item as T,
      };
    });

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
      forEach: (cb) => docs.forEach(cb),
    };
  }

  // Local IndexedDB
  await ensureLocalInitialized();
  const { storeName, parentId } = resolvePath(ref.segments);

  const db = await openLocalDatabase();
  let items: any[] = [];

  if (parentId) {
    const all = await getStoreData(storeName);
    items = all.filter(
      (item) => item.customerId === parentId || item.parentId === parentId,
    );
  } else if (db.objectStoreNames.contains(storeName)) {
    items = await getStoreData(storeName);
  }

  const docs: GenericDocumentSnapshot<T>[] = items.map((item) => {
    const itemId = String(item.id || item.key || item.month || '');
    const itemPath = parentId
      ? `${ref.segments[0]}/${parentId}/${storeName}/${itemId}`
      : `${storeName}/${itemId}`;
    return {
      id: itemId,
      ref: doc(itemPath),
      exists: () => true,
      data: () => item as T,
    };
  });

  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (cb) => docs.forEach(cb),
  };
}

export async function setDoc(
  ref: GenericDocRef,
  data: any,
  options: { merge?: boolean } = {},
): Promise<void> {
  if (dbConfig.isServer()) {
    const fRef = firestoreDoc(firebaseDb, ref.path);
    await firestoreSetDoc(fRef, data, options);
    return;
  }

  if (dbConfig.isMock()) {
    const { storeName, id } = resolvePath(ref.segments);
    const key = id || ref.id;
    if (storeName === 'customers') {
      mockDataStore.addCustomer({ ...data, id: key });
    } else if (storeName === 'transactions') {
      mockDataStore.addTransaction({ ...data, id: key });
    } else if (storeName === 'purchases') {
      mockDataStore.addPurchase({ ...data, id: key });
    }
    return;
  }

  // Local IndexedDB
  await ensureLocalInitialized();
  const { storeName, id, parentId } = resolvePath(ref.segments);
  const key = id || ref.id;

  let existing: any = {};
  if (options.merge) {
    existing = (await getStoreItem(storeName, key)) || {};
  }

  const merged = { ...existing, ...data };
  // Handle increment helper
  for (const k in merged) {
    if (merged[k] && typeof merged[k] === 'object' && merged[k].__isIncrement) {
      merged[k] = (existing[k] || 0) + merged[k].value;
    }
  }

  if (!merged.id && key) merged.id = key;
  if (parentId && !merged.customerId) merged.customerId = parentId;
  if (storeName === 'metadata' && !merged.key) merged.key = key;
  if (storeName === 'monthly_rollout' && !merged.month) merged.month = key;

  await putStoreItem(storeName, merged);
  await recordPendingChange({
    id: ref.path,
    path: ref.path,
    action: 'SET',
    data: merged,
    timestamp: new Date().toISOString(),
  });
}

export async function updateDoc(
  ref: GenericDocRef,
  updates: any,
): Promise<void> {
  if (dbConfig.isServer()) {
    const fRef = firestoreDoc(firebaseDb, ref.path);
    await firestoreUpdateDoc(fRef, updates);
    return;
  }

  if (dbConfig.isMock()) {
    const { storeName, id } = resolvePath(ref.segments);
    const key = id || ref.id;
    if (storeName === 'customers') {
      const cust = mockDataStore.getCustomers().find((c) => c.id === key);
      if (cust) Object.assign(cust, updates);
    } else if (storeName === 'transactions') {
      const tx = mockDataStore.getTransactions().find((t) => t.id === key);
      if (tx) Object.assign(tx, updates);
    }
    return;
  }

  // Local IndexedDB
  await ensureLocalInitialized();
  const { storeName, id } = resolvePath(ref.segments);
  const key = id || ref.id;

  const existing = (await getStoreItem(storeName, key)) || {};
  const merged = { ...existing };
  for (const k in updates) {
    if (
      updates[k] &&
      typeof updates[k] === 'object' &&
      updates[k].__isIncrement
    ) {
      merged[k] = (existing[k] || 0) + updates[k].value;
    } else {
      merged[k] = updates[k];
    }
  }

  await putStoreItem(storeName, merged);
  await recordPendingChange({
    id: ref.path,
    path: ref.path,
    action: 'SET',
    data: merged,
    timestamp: new Date().toISOString(),
  });
}

export async function deleteDoc(ref: GenericDocRef): Promise<void> {
  if (dbConfig.isServer()) {
    const fRef = firestoreDoc(firebaseDb, ref.path);
    await firestoreDeleteDoc(fRef);
    return;
  }

  if (dbConfig.isMock()) {
    const { storeName, id } = resolvePath(ref.segments);
    const key = id || ref.id;
    if (storeName === 'transactions') {
      mockDataStore.deleteTransaction(key);
    } else if (storeName === 'purchases') {
      mockDataStore.deletePurchase(key);
    }
    return;
  }

  // Local IndexedDB
  await ensureLocalInitialized();
  const { storeName, id } = resolvePath(ref.segments);
  const key = id || ref.id;
  await deleteStoreItem(storeName, key);
  await recordPendingChange({
    id: ref.path,
    path: ref.path,
    action: 'DELETE',
    timestamp: new Date().toISOString(),
  });
}

export async function addDoc(
  ref: GenericCollectionRef,
  data: any,
): Promise<GenericDocRef> {
  const generatedId =
    data.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const targetDoc = doc(ref.path, generatedId);
  await setDoc(targetDoc, { ...data, id: generatedId });
  return targetDoc;
}

export interface GenericWriteBatch {
  set(
    _ref: GenericDocRef,
    _data: any,
    _options?: { merge?: boolean },
  ): GenericWriteBatch;
  update(_ref: GenericDocRef, _updates: any): GenericWriteBatch;
  delete(_ref: GenericDocRef): GenericWriteBatch;
  commit(): Promise<void>;
}

export function writeBatch(_db?: any): GenericWriteBatch {
  if (dbConfig.isServer()) {
    const batch = firestoreWriteBatch(firebaseDb);
    return {
      set: (ref, data, opts) => {
        if (opts) {
          batch.set(firestoreDoc(firebaseDb, ref.path), data, opts);
        } else {
          batch.set(firestoreDoc(firebaseDb, ref.path), data);
        }
        return batch as any;
      },
      update: (ref, data) => {
        batch.update(firestoreDoc(firebaseDb, ref.path), data);
        return batch as any;
      },
      delete: (ref) => {
        batch.delete(firestoreDoc(firebaseDb, ref.path));
        return batch as any;
      },
      commit: () => batch.commit(),
    };
  }

  // Local IndexedDB Batch
  const operations: Array<() => Promise<void>> = [];

  return {
    set(ref: GenericDocRef, data: any, options: { merge?: boolean } = {}) {
      operations.push(() => setDoc(ref, data, options));
      return this;
    },
    update(ref: GenericDocRef, updates: any) {
      operations.push(() => updateDoc(ref, updates));
      return this;
    },
    delete(ref: GenericDocRef) {
      operations.push(() => deleteDoc(ref));
      return this;
    },
    async commit() {
      for (const op of operations) {
        await op();
      }
    },
  };
}

export const db = firebaseDb;
