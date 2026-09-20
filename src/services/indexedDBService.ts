/**
 * IndexedDB Service for HaySales offline local database.
 * Database Name: HaySalesOfflineDB
 * Stores: customers, transactions, purchases, monthly_rollout, metadata
 */

import initialSnapshot from '../data/initialDatabaseSnapshot.json';
import { Customer, Transaction } from '../types';

export const DB_NAME = 'HaySalesOfflineDB';
export const DB_VERSION = 2; // Clean upgraded version

export type StoreName =
  'customers' | 'transactions' | 'purchases' | 'monthly_rollout' | 'metadata';

let dbInstance: IDBDatabase | null = null;

/**
 * Open or upgrade the IndexedDB database.
 * If older version exists, recreates clean stores with no sync_queue.
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export const SNAPSHOT_VERSION_KEY = 'haysales_snapshot_version';
export const CURRENT_SNAPSHOT_VERSION = '2026_09_20_v5';

/**
 * Check if the database has already been initialized / seeded with the latest snapshot
 */
export async function isLocalDatabaseSeeded(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const savedVersion = localStorage.getItem(SNAPSHOT_VERSION_KEY);
    if (savedVersion !== CURRENT_SNAPSHOT_VERSION) {
      return false;
    }
  }
  try {
    const customers = await getStoreData('customers');
    const transactions = await getStoreData('transactions');
    return customers.length > 0 && transactions.length > 0;
  } catch {
    return false;
  }
}

/**
 * Seed the local IndexedDB with initial clean snapshot
 */
export async function seedLocalDatabaseFromSnapshot(
  forceClean = false,
): Promise<{
  customersCount: number;
  transactionsCount: number;
  purchasesCount: number;
  monthlyRolloutCount: number;
  metadataCount: number;
}> {
  if (forceClean) {
    await deleteLocalDatabase();
  }

  const db = await openLocalDatabase();

  const customers = (initialSnapshot.customers || []) as Customer[];
  const transactions = (initialSnapshot.transactions || []) as Transaction[];
  const purchases = (initialSnapshot.purchases || []) as Transaction[];
  const monthlyRollouts = (initialSnapshot.monthly_rollout || []) as any[];
  const metadata = (initialSnapshot.metadata || []) as any[];

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      ['customers', 'transactions', 'purchases', 'monthly_rollout', 'metadata'],
      'readwrite',
    );

    const custStore = tx.objectStore('customers');
    const txStore = tx.objectStore('transactions');
    const pStore = tx.objectStore('purchases');
    const rStore = tx.objectStore('monthly_rollout');
    const metaStore = tx.objectStore('metadata');

    custStore.clear();
    txStore.clear();
    pStore.clear();
    rStore.clear();
    metaStore.clear();

    customers.forEach((c) => custStore.put(c));
    transactions.forEach((t) => txStore.put(t));
    purchases.forEach((p) => pStore.put(p));
    monthlyRollouts.forEach((r) => rStore.put(r));
    metadata.forEach((m) => metaStore.put(m));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(SNAPSHOT_VERSION_KEY, CURRENT_SNAPSHOT_VERSION);
  }

  return {
    customersCount: customers.length,
    transactionsCount: transactions.length,
    purchasesCount: purchases.length,
    monthlyRolloutCount: monthlyRollouts.length,
    metadataCount: metadata.length,
  };
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
  const { collection, getDocs } = await import('firebase/firestore');
  const { db: firestoreInstance } = await import('../store/firebaseConfig');

  // 1. Fetch Customers
  const custSnap = await getDocs(collection(firestoreInstance, 'customers'));
  const customers: Customer[] = [];
  const transactions: Transaction[] = [];

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

    // Fetch transactions subcollection
    const txSnap = await getDocs(
      collection(firestoreInstance, 'customers', docSnap.id, 'transactions'),
    );
    txSnap.forEach((tDoc) => {
      transactions.push({
        id: tDoc.id,
        customerId: docSnap.id,
        ...tDoc.data(),
      } as Transaction);
    });
  }

  // 2. Fetch Purchases & Expenses
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

  // Also check if separate expenses root collection exists
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

  // 3. Fetch Monthly Rollout
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

  // 4. Fetch Metadata
  const metaSnap = await getDocs(collection(firestoreInstance, 'metadata'));
  const metadata: any[] = [];
  metaSnap.forEach((mDoc) => {
    metadata.push({
      key: mDoc.id,
      id: mDoc.id,
      ...mDoc.data(),
    });
  });

  // Clear existing local stores and populate with fetched cloud data
  await clearStore('customers');
  await clearStore('transactions');
  await clearStore('purchases');
  await clearStore('monthly_rollout');
  await clearStore('metadata');

  await bulkSaveStoreItems('customers', customers);
  await bulkSaveStoreItems('transactions', transactions);
  await bulkSaveStoreItems('purchases', purchases);
  await bulkSaveStoreItems('monthly_rollout', rollouts);
  await bulkSaveStoreItems('metadata', metadata);

  if (typeof window !== 'undefined') {
    localStorage.setItem(SNAPSHOT_VERSION_KEY, CURRENT_SNAPSHOT_VERSION);
  }

  return {
    customersCount: customers.length,
    transactionsCount: transactions.length,
    purchasesCount: purchases.length,
    monthlyRolloutCount: rollouts.length,
    metadataCount: metadata.length,
  };
}
