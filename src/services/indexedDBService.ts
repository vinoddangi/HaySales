import { Customer, Transaction } from '../models';

export const DB_NAME = 'HaySalesOfflineDB';
export const DB_VERSION = 2;

export interface PendingChange {
  id: string; // Doc path or unique id
  path: string; // e.g. "customers/123" or "customer_transactions/abc"
  action: 'SET' | 'UPDATE' | 'DELETE';
  data?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Open local IndexedDB instance with 3 core tables + delta tracking
 */
export function openLocalDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Customers master store
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }

      // 2. Customer Transactions store (Sales, Services, Payments)
      if (!db.objectStoreNames.contains('customer_transactions')) {
        const ctStore = db.createObjectStore('customer_transactions', {
          keyPath: 'id',
        });
        ctStore.createIndex('customerId', 'customerId', { unique: false });
        ctStore.createIndex('date', 'date', { unique: false });
      }

      // 3. Operations Transactions store (Purchases, Operating Expenses)
      if (!db.objectStoreNames.contains('operation_transactions')) {
        const opStore = db.createObjectStore('operation_transactions', {
          keyPath: 'id',
        });
        opStore.createIndex('category', 'category', { unique: false });
        opStore.createIndex('date', 'date', { unique: false });
      }

      // 4. Pending delta change tracking queue
      if (!db.objectStoreNames.contains('pending_changes')) {
        db.createObjectStore('pending_changes', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Fetch all documents from a specific object store
 */
export async function getStoreData<T = any>(storeName: string): Promise<T[]> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve([]);
      return;
    }
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetch a single document by key from an object store
 */
export async function getStoreItem<T = any>(
  storeName: string,
  key: string,
): Promise<T | null> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve(null);
      return;
    }
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save or update an item in an object store
 */
export async function putStoreItem(
  storeName: string,
  item: any,
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
 * Delete an item from an object store
 */
export async function deleteStoreItem(
  storeName: string,
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
 * Clear all records from a specific store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      resolve();
      return;
    }
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Bulk save items into an object store
 */
export async function bulkSaveStoreItems(
  storeName: string,
  items: any[],
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
 * Clean wipe of all local stores
 */
export async function clearAllLocalData(): Promise<void> {
  const stores = [
    'customers',
    'customer_transactions',
    'operation_transactions',
    'pending_changes',
  ];
  for (const s of stores) {
    await clearStore(s);
  }
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
      id: change.path,
      timestamp: change.timestamp || new Date().toISOString(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all pending delta changes
 */
export async function getPendingChanges(): Promise<PendingChange[]> {
  return getStoreData<PendingChange>('pending_changes');
}

/**
 * Get count of pending delta changes
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
 * Clear pending changes queue
 */
export async function clearPendingChanges(): Promise<void> {
  return clearStore('pending_changes');
}

/**
 * Publish ONLY pending delta changes to Cloud Firestore
 */
export async function publishPendingChangesToCloud(): Promise<{
  publishedCount: number;
}> {
  const changes = await getPendingChanges();
  if (!changes || changes.length === 0) {
    return { publishedCount: 0 };
  }

  const { writeBatch, doc } = await import('firebase/firestore');
  const { db: firestoreDb } = await import('../store/firebaseConfig');

  const batchList: Array<() => Promise<void>> = [];
  let currentBatch = writeBatch(firestoreDb);
  let opCount = 0;

  const commitAndRenew = () => {
    const batchToCommit = currentBatch;
    batchList.push(() => batchToCommit.commit());
    currentBatch = writeBatch(firestoreDb);
    opCount = 0;
  };

  for (const change of changes) {
    const targetDocRef = doc(firestoreDb, change.path);
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

  for (const commitFn of batchList) {
    await commitFn();
  }

  await clearPendingChanges();
  return { publishedCount: changes.length };
}

/**
 * Sync Local Database from Cloud Firestore (3 core collections)
 */
export async function syncLocalDatabaseFromCloud(): Promise<{
  customersCount: number;
  customerTransactionsCount: number;
  operationTransactionsCount: number;
}> {
  const { collection, getDocs } = await import('firebase/firestore');
  const { db: firestoreDb } = await import('../store/firebaseConfig');

  // 1. Fetch Customers
  const custSnap = await getDocs(collection(firestoreDb, 'customers'));
  const customers: Customer[] = [];
  custSnap.forEach((d) => {
    const data = d.data();
    customers.push({
      id: d.id,
      name: data.name || '',
      mobile: data.mobile || '',
      village: data.village || '',
      creditLimit: data.creditLimit,
    });
  });

  // 2. Fetch Customer Transactions
  const ctSnap = await getDocs(
    collection(firestoreDb, 'customer_transactions'),
  );
  const customerTransactions: Transaction[] = [];
  ctSnap.forEach((d) => {
    customerTransactions.push({
      id: d.id,
      ...d.data(),
    } as Transaction);
  });

  // 3. Fetch Operations Transactions
  const opSnap = await getDocs(
    collection(firestoreDb, 'operation_transactions'),
  );
  const operationTransactions: Transaction[] = [];
  opSnap.forEach((d) => {
    operationTransactions.push({
      id: d.id,
      ...d.data(),
    } as Transaction);
  });

  // Clear existing local stores & bulk save fresh records
  await clearStore('customers');
  await clearStore('customer_transactions');
  await clearStore('operation_transactions');

  await bulkSaveStoreItems('customers', customers);
  await bulkSaveStoreItems('customer_transactions', customerTransactions);
  await bulkSaveStoreItems('operation_transactions', operationTransactions);

  return {
    customersCount: customers.length,
    customerTransactionsCount: customerTransactions.length,
    operationTransactionsCount: operationTransactions.length,
  };
}

/**
 * Merged 2-Way Sync: First pushes pending deltas to cloud, then pulls fresh data
 */
export async function syncAndPublishCloudDatabase(): Promise<{
  publishedCount: number;
  customersCount: number;
  customerTransactionsCount: number;
  operationTransactionsCount: number;
}> {
  // 1. Push local changes
  const { publishedCount } = await publishPendingChangesToCloud();

  // 2. Pull latest server data
  const pullResult = await syncLocalDatabaseFromCloud();

  return {
    publishedCount,
    ...pullResult,
  };
}

/**
 * Check if the local IndexedDB contains data
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const customers = await getStoreData('customers');
    return customers.length > 0;
  } catch {
    return false;
  }
}

/**
 * Seed or reset Local IndexedDB using the clean initial database snapshot (Jan 2026 data).
 */
export async function seedLocalDatabaseFromSnapshot(
  snapshotData?: any,
): Promise<{
  customersCount: number;
  customerTransactionsCount: number;
  operationTransactionsCount: number;
}> {
  const snapshot =
    snapshotData ||
    (await import('../data/initialDatabaseSnapshot.json')).default;

  // Clear existing local stores
  await clearAllLocalData();

  // Populate local stores directly from snapshot
  await bulkSaveStoreItems('customers', snapshot.customers || []);
  await bulkSaveStoreItems(
    'customer_transactions',
    snapshot.customer_transactions || [],
  );
  await bulkSaveStoreItems(
    'operation_transactions',
    snapshot.operation_transactions || [],
  );

  return {
    customersCount: (snapshot.customers || []).length,
    customerTransactionsCount: (snapshot.customer_transactions || []).length,
    operationTransactionsCount: (snapshot.operation_transactions || []).length,
  };
}

if (typeof window !== 'undefined') {
  (window as any).seedLocalDatabase = seedLocalDatabaseFromSnapshot;
}
