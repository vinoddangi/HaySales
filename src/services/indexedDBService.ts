import { Customer, Transaction } from '../types';

export const DB_NAME = 'HaySalesOfflineDB';
export const DB_VERSION = 4; // Upgraded with archives store

export type StoreName =
  | 'customers'
  | 'transactions'
  | 'purchases'
  | 'monthly_rollout'
  | 'metadata'
  | 'pending_changes'
  | 'archives';

export interface PendingChange {
  id: string; // Document path, e.g. 'customers/123' or 'customers/123/transactions/456'
  path: string;
  action: 'SET' | 'DELETE';
  data?: any;
  timestamp: string;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Open or upgrade the IndexedDB database.
 */
export async function openLocalDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Clean delete deprecated sync_queue store if existing
      if (db.objectStoreNames.contains('sync_queue')) {
        db.deleteObjectStore('sync_queue');
      }

      // 1. Customers store
      if (!db.objectStoreNames.contains('customers')) {
        const custStore = db.createObjectStore('customers', { keyPath: 'id' });
        custStore.createIndex('name', 'name', { unique: false });
      }

      // 2. Transactions store (Sales + Payments + Services)
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('customerId', 'customerId', { unique: false });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
      }

      // 3. Purchases & Expenses store
      if (!db.objectStoreNames.contains('purchases')) {
        const pStore = db.createObjectStore('purchases', { keyPath: 'id' });
        pStore.createIndex('date', 'date', { unique: false });
        pStore.createIndex('type', 'type', { unique: false });
        pStore.createIndex('category', 'category', { unique: false });
      }

      // 4. Monthly Rollout store
      if (!db.objectStoreNames.contains('monthly_rollout')) {
        const rStore = db.createObjectStore('monthly_rollout', {
          keyPath: 'month',
        });
        rStore.createIndex('period', 'summary.period', { unique: false });
      }

      // 5. Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }

      // 6. Pending Changes store (for tracking delta modifications)
      if (!db.objectStoreNames.contains('pending_changes')) {
        const pcStore = db.createObjectStore('pending_changes', {
          keyPath: 'id',
        });
        pcStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 7. Archives store (for historical yearly archives like transactions-2025, purchases-2025)
      if (!db.objectStoreNames.contains('archives')) {
        const arcStore = db.createObjectStore('archives', { keyPath: 'id' });
        arcStore.createIndex('collectionName', 'collectionName', {
          unique: false,
        });
        arcStore.createIndex('parentId', 'parentId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Delete the entire local database (clean slate)
 */
export async function deleteLocalDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

/**
 * Get all records from a specific store
 */
export async function getStoreData<T = any>(
  storeName: StoreName,
): Promise<T[]> {
  const db = await openLocalDatabase();
  const target = db.objectStoreNames.contains(storeName)
    ? storeName
    : 'archives';
  if (!db.objectStoreNames.contains(target)) {
    return [];
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(target, 'readonly');
    const store = tx.objectStore(target);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a single record by key
 */
export async function getStoreItem<T = any>(
  storeName: StoreName,
  key: string,
): Promise<T | undefined> {
  const db = await openLocalDatabase();
  const target = db.objectStoreNames.contains(storeName)
    ? storeName
    : 'archives';
  if (!db.objectStoreNames.contains(target)) {
    return undefined;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(target, 'readonly');
    const store = tx.objectStore(target);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Put a single record into a store
 */
export async function putStoreItem<T = any>(
  storeName: StoreName,
  item: T,
): Promise<void> {
  const db = await openLocalDatabase();
  const target = db.objectStoreNames.contains(storeName)
    ? storeName
    : 'archives';
  if (!db.objectStoreNames.contains(target)) {
    return;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(target, 'readwrite');
    const store = tx.objectStore(target);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a single record by key
 */
export async function deleteStoreItem(
  storeName: StoreName,
  key: string,
): Promise<void> {
  const db = await openLocalDatabase();
  const target = db.objectStoreNames.contains(storeName)
    ? storeName
    : 'archives';
  if (!db.objectStoreNames.contains(target)) {
    return;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(target, 'readwrite');
    const store = tx.objectStore(target);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Bulk save array of items into a store
 */
export async function bulkSaveStoreItems<T = any>(
  storeName: StoreName,
  items: T[],
): Promise<void> {
  if (!items || items.length === 0) return;
  const db = await openLocalDatabase();
  const target = db.objectStoreNames.contains(storeName)
    ? storeName
    : 'archives';
  if (!db.objectStoreNames.contains(target)) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(target, 'readwrite');
    const store = tx.objectStore(target);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear all data inside a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openLocalDatabase();
  if (!db.objectStoreNames.contains(storeName)) {
    return;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all local IndexedDB stores
 */
export async function clearAllLocalData(): Promise<void> {
  await clearStore('customers');
  await clearStore('transactions');
  await clearStore('purchases');
  await clearStore('monthly_rollout');
  await clearStore('metadata');
  await clearStore('pending_changes');
  await clearStore('archives');
}

/**
 * Check if the local database has any data
 */
export async function hasLocalData(): Promise<boolean> {
  try {
    const customers = await getStoreData('customers');
    return customers.length > 0;
  } catch {
    return false;
  }
}

/**
 * Sync Local IndexedDB with live data from Cloud Firestore
 */
export async function syncLocalDatabaseFromCloud(): Promise<{
  customersCount: number;
  transactionsCount: number;
  purchasesCount: number;
  monthlyRolloutCount: number;
  metadataCount: number;
}> {
  const { collection, collectionGroup, getDocs } =
    await import('firebase/firestore');
  const { db: firestoreInstance } = await import('../store/firebaseConfig');

  // 1. Fetch Customers
  const custSnap = await getDocs(collection(firestoreInstance, 'customers'));
  const customers: Customer[] = [];
  for (const docSnap of custSnap.docs) {
    const cData = docSnap.data();
    customers.push({
      id: docSnap.id,
      name: cData.name || '',
      mobile: cData.mobile || '',
      village: cData.village || '',
      creditLimit: cData.creditLimit,
      outstandingAmount: cData.outstandingAmount || 0,
    });
  }

  // 2. Fetch Transactions (using collectionGroup for instant parallel fetch)
  let transactions: Transaction[] = [];
  try {
    const txSnap = await getDocs(
      collectionGroup(firestoreInstance, 'transactions'),
    );
    txSnap.forEach((tDoc) => {
      const data = tDoc.data();
      const parentCustId = data.customerId || tDoc.ref.parent.parent?.id || '';
      transactions.push({
        id: tDoc.id,
        customerId: parentCustId,
        ...data,
      } as Transaction);
    });
  } catch {
    // Fallback: iterate customer subcollections if collectionGroup is restricted
    for (const cust of customers) {
      const txSnap = await getDocs(
        collection(firestoreInstance, 'customers', cust.id, 'transactions'),
      );
      txSnap.forEach((tDoc) => {
        transactions.push({
          id: tDoc.id,
          customerId: cust.id,
          ...tDoc.data(),
        } as Transaction);
      });
    }
  }

  // 3. Fetch Purchases & Expenses
  const purchasesSnap = await getDocs(
    collection(firestoreInstance, 'purchases'),
  );
  const purchases: Transaction[] = [];
  purchasesSnap.forEach((pDoc) => {
    purchases.push({
      id: pDoc.id,
      ...pDoc.data(),
    } as Transaction);
  });

  // Check if separate expenses collection exists
  try {
    const expensesSnap = await getDocs(
      collection(firestoreInstance, 'expenses'),
    );
    expensesSnap.forEach((eDoc) => {
      if (!purchases.some((p) => p.id === eDoc.id)) {
        purchases.push({
          id: eDoc.id,
          type: 'EXPENSE',
          category: 'Expense',
          ...eDoc.data(),
        } as Transaction);
      }
    });
  } catch {
    // Ignore if not present
  }

  // 4. Fetch Monthly Rollout
  const rolloutSnap = await getDocs(
    collection(firestoreInstance, 'monthly_rollout'),
  );
  const rollouts: any[] = [];
  rolloutSnap.forEach((rDoc) => {
    rollouts.push({
      id: rDoc.id,
      ...rDoc.data(),
    });
  });

  // 5. Fetch Metadata
  const metaSnap = await getDocs(collection(firestoreInstance, 'metadata'));
  const metadata: any[] = [];
  metaSnap.forEach((mDoc) => {
    metadata.push({
      key: mDoc.id,
      id: mDoc.id,
      ...mDoc.data(),
    });
  });

  // Clear existing local stores and populate with fresh cloud data
  await clearAllLocalData();

  await bulkSaveStoreItems('customers', customers);
  await bulkSaveStoreItems('transactions', transactions);
  await bulkSaveStoreItems('purchases', purchases);
  await bulkSaveStoreItems('monthly_rollout', rollouts);
  await bulkSaveStoreItems('metadata', metadata);

  return {
    customersCount: customers.length,
    transactionsCount: transactions.length,
    purchasesCount: purchases.length,
    monthlyRolloutCount: rollouts.length,
    metadataCount: metadata.length,
  };
}

/**
 * Record a pending change into the delta tracking queue
 */
export async function recordPendingChange(
  change: PendingChange,
): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_changes', 'readwrite');
    const store = tx.objectStore('pending_changes');
    const req = store.put({
      ...change,
      id: change.path, // Use path as unique key to coalesce repeat updates to same doc
      timestamp: change.timestamp || new Date().toISOString(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Record a batch of pending changes
 */
export async function recordPendingChangesBatch(
  changes: PendingChange[],
): Promise<void> {
  if (!changes || changes.length === 0) return;
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_changes', 'readwrite');
    const store = tx.objectStore('pending_changes');
    const now = new Date().toISOString();
    for (const ch of changes) {
      store.put({
        ...ch,
        id: ch.path,
        timestamp: ch.timestamp || now,
      });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve all pending changes currently in the queue
 */
export async function getPendingChanges(): Promise<PendingChange[]> {
  return getStoreData<PendingChange>('pending_changes');
}

/**
 * Get count of pending changes
 */
export async function getPendingChangesCount(): Promise<number> {
  try {
    const changes = await getStoreData('pending_changes');
    return changes.length;
  } catch {
    return 0;
  }
}

/**
 * Clear all pending changes
 */
export async function clearPendingChanges(): Promise<void> {
  return clearStore('pending_changes');
}

/**
 * Publish ONLY modified / delta records from local queue to Cloud Firestore
 */
export async function publishPendingChangesToCloud(): Promise<{
  publishedCount: number;
}> {
  const changes = await getPendingChanges();
  if (!changes || changes.length === 0) {
    return { publishedCount: 0 };
  }

  const { writeBatch: serverWriteBatch, doc: serverDoc } =
    await import('firebase/firestore');
  const { db: firestoreInstance } = await import('../store/firebaseConfig');

  // Chunk batches (max 450 operations per batch)
  const batchList: Array<() => Promise<void>> = [];
  let currentBatch = serverWriteBatch(firestoreInstance);
  let opCount = 0;

  const commitAndRenew = () => {
    const batchToCommit = currentBatch;
    batchList.push(() => batchToCommit.commit());
    currentBatch = serverWriteBatch(firestoreInstance);
    opCount = 0;
  };

  for (const change of changes) {
    const targetDocRef = serverDoc(firestoreInstance, change.path);
    if (change.action === 'DELETE') {
      currentBatch.delete(targetDocRef);
    } else {
      currentBatch.set(targetDocRef, change.data || {}, { merge: true });
    }
    opCount++;
    if (opCount >= 450) {
      commitAndRenew();
    }
  }

  if (opCount > 0) {
    commitAndRenew();
  }

  // Execute all batch commits
  for (const commitFn of batchList) {
    await commitFn();
  }

  // Clear pending changes upon successful publish
  await clearPendingChanges();

  return { publishedCount: changes.length };
}
