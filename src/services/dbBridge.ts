import {
  deleteStoreItem,
  getStoreData,
  getStoreItem,
  putStoreItem,
  recordPendingChange,
} from './indexedDBService';

export type DatabaseMode = 'local' | 'server';

const DB_MODE_KEY = 'haysales_db_mode';

class DatabaseConfig {
  private mode: DatabaseMode = 'local';

  constructor() {
    try {
      if (
        typeof window !== 'undefined' &&
        typeof localStorage !== 'undefined' &&
        typeof localStorage.getItem === 'function'
      ) {
        const saved = localStorage.getItem(DB_MODE_KEY);
        if (saved === 'server' || saved === 'local') {
          this.mode = saved;
        }
      }
    } catch {
      // Ignore storage error
    }
  }

  getMode(): DatabaseMode {
    return this.mode;
  }

  setMode(mode: DatabaseMode): void {
    this.mode = mode;
    try {
      if (
        typeof window !== 'undefined' &&
        typeof localStorage !== 'undefined' &&
        typeof localStorage.setItem === 'function'
      ) {
        localStorage.setItem(DB_MODE_KEY, mode);
      }
    } catch {
      // Ignore storage error
    }
  }

  isLocal(): boolean {
    return this.getMode() === 'local';
  }
}

export const dbConfig = new DatabaseConfig();

export interface GenericDocRef {
  id: string;
  path: string;
}

export interface GenericCollectionRef {
  path: string;
}

export interface GenericDocumentSnapshot<T = any> {
  id: string;
  ref: GenericDocRef;
  exists: () => boolean;
  data: () => T | undefined;
}

export interface GenericQuerySnapshot<T = any> {
  empty: boolean;
  size: number;
  docs: GenericDocumentSnapshot<T>[];
  forEach: (_callback: (_doc: GenericDocumentSnapshot<T>) => void) => void;
}

export function doc(
  pathOrCollection: string,
  ...pathSegments: string[]
): GenericDocRef {
  const fullPath = [pathOrCollection, ...pathSegments]
    .join('/')
    .replace(/\/+/g, '/');
  const segments = fullPath.split('/').filter(Boolean);
  const id = segments[segments.length - 1] || '';
  return { id, path: fullPath };
}

export function collection(
  path: string,
  ...pathSegments: string[]
): GenericCollectionRef {
  const fullPath = [path, ...pathSegments].join('/').replace(/\/+/g, '/');
  return { path: fullPath };
}

function resolveStoreName(path: string): { storeName: string; id: string } {
  const segments = path.split('/').filter(Boolean);
  const storeName = segments[0] || 'metadata';
  const id = segments[1] || '';
  return { storeName, id };
}

export async function getDoc<T = any>(
  ref: GenericDocRef,
): Promise<GenericDocumentSnapshot<T>> {
  const { storeName, id } = resolveStoreName(ref.path);
  const item = await getStoreItem<T>(storeName, id);

  return {
    id,
    ref,
    exists: () => item !== null && item !== undefined,
    data: () => item || undefined,
  };
}

export async function getDocs<T = any>(
  colRef: GenericCollectionRef,
): Promise<GenericQuerySnapshot<T>> {
  const { storeName } = resolveStoreName(colRef.path);
  const items = await getStoreData<T>(storeName);

  const docs: GenericDocumentSnapshot<T>[] = items.map((item: any) => {
    const itemId = String(item.id || item.key || '');
    return {
      id: itemId,
      ref: doc(storeName, itemId),
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
  const { storeName, id } = resolveStoreName(ref.path);
  const key = id || ref.id;

  let existing: any = {};
  if (options.merge) {
    existing = (await getStoreItem(storeName, key)) || {};
  }

  const merged = { ...existing, ...data };
  if (!merged.id && key) merged.id = key;

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
  const { storeName, id } = resolveStoreName(ref.path);
  const key = id || ref.id;

  const existing = (await getStoreItem(storeName, key)) || {};
  const merged = { ...existing, ...updates };

  await putStoreItem(storeName, merged);
  await recordPendingChange({
    id: ref.path,
    path: ref.path,
    action: 'UPDATE',
    data: merged,
    timestamp: new Date().toISOString(),
  });
}

export async function deleteDoc(ref: GenericDocRef): Promise<void> {
  const { storeName, id } = resolveStoreName(ref.path);
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
  colRef: GenericCollectionRef,
  data: any,
): Promise<GenericDocRef> {
  const { storeName } = resolveStoreName(colRef.path);
  const generatedId =
    data.id ||
    `${storeName.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const targetDoc = doc(storeName, generatedId);
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

export function writeBatch(): GenericWriteBatch {
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
