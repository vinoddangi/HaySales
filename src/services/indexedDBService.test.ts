import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllLocalData,
  clearPendingChanges,
  getPendingChanges,
  getPendingChangesCount,
  getStoreData,
  getStoreItem,
  hasLocalData,
  PendingChange,
  putStoreItem,
  recordPendingChange,
  recordPendingChangesBatch,
} from './indexedDBService';

describe('indexedDBService - Pending Delta Tracking', () => {
  // Simple in-memory mock for indexedDB in test environment if needed
  const mockStore: Record<string, Map<string, any>> = {};

  beforeEach(() => {
    mockStore['pending_changes'] = new Map();
    mockStore['customers'] = new Map();
    mockStore['transactions'] = new Map();
    mockStore['purchases'] = new Map();
    mockStore['monthly_rollout'] = new Map();
    mockStore['metadata'] = new Map();
    mockStore['archives'] = new Map();

    const fakeTx = (_storeNames: string | string[], _mode: string) => {
      return {
        objectStore: (rawName: string) => {
          const name = mockStore[rawName] ? rawName : 'archives';
          return {
            put: (item: any) => {
              const map = mockStore[name] || new Map();
              const key = item.id || item.key || item.month || 'default';
              map.set(key, item);
              mockStore[name] = map;
              const req = { onsuccess: null as any, onerror: null as any };
              setTimeout(() => req.onsuccess && req.onsuccess({} as any), 0);
              return req;
            },
            get: (key: string) => {
              const map = mockStore[name] || new Map();
              const res = map.get(key);
              const req = {
                result: res,
                onsuccess: null as any,
                onerror: null as any,
              };
              setTimeout(() => req.onsuccess && req.onsuccess({} as any), 0);
              return req;
            },
            getAll: () => {
              const map = mockStore[name] || new Map();
              const res = Array.from(map.values());
              const req = {
                result: res,
                onsuccess: null as any,
                onerror: null as any,
              };
              setTimeout(() => req.onsuccess && req.onsuccess({} as any), 0);
              return req;
            },
            delete: (key: string) => {
              const map = mockStore[name] || new Map();
              map.delete(key);
              const req = { onsuccess: null as any, onerror: null as any };
              setTimeout(() => req.onsuccess && req.onsuccess({} as any), 0);
              return req;
            },
            clear: () => {
              const map = mockStore[name] || new Map();
              map.clear();
              const req = { onsuccess: null as any, onerror: null as any };
              setTimeout(() => req.onsuccess && req.onsuccess({} as any), 0);
              return req;
            },
          };
        },
        oncomplete: null as any,
        onerror: null as any,
      };
    };

    const fakeDb = {
      objectStoreNames: {
        contains: (_name: string) => true,
      },
      transaction: (storeNames: any, mode: any) => {
        const tx = fakeTx(storeNames, mode);
        setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
        return tx;
      },
      close: vi.fn(),
    };

    const fakeIndexedDb = {
      open: () => {
        const req = {
          result: fakeDb,
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
        };
        setTimeout(
          () => req.onsuccess && req.onsuccess({ target: req } as any),
          0,
        );
        return req;
      },
      deleteDatabase: () => {
        const req = {
          onsuccess: null as any,
          onerror: null as any,
          onblocked: null as any,
        };
        setTimeout(() => req.onsuccess && req.onsuccess({} as any), 0);
        return req;
      },
    };

    Object.defineProperty(window, 'indexedDB', {
      value: fakeIndexedDb,
      writable: true,
    });
  });

  it('records and retrieves pending changes', async () => {
    const change1: PendingChange = {
      id: 'customers/123',
      path: 'customers/123',
      action: 'SET',
      data: { id: '123', name: 'Ramesh Patel' },
      timestamp: '2026-09-21T00:00:00Z',
    };

    await recordPendingChange(change1);

    const count = await getPendingChangesCount();
    expect(count).toBe(1);

    const changes = await getPendingChanges();
    expect(changes).toHaveLength(1);
    expect(changes[0].path).toBe('customers/123');
    expect(changes[0].data.name).toBe('Ramesh Patel');
  });

  it('coalesces multiple updates to the same document path', async () => {
    await recordPendingChange({
      id: 'customers/123/transactions/sale_1',
      path: 'customers/123/transactions/sale_1',
      action: 'SET',
      data: { amount: 1000 },
      timestamp: '2026-09-21T00:00:00Z',
    });

    await recordPendingChange({
      id: 'customers/123/transactions/sale_1',
      path: 'customers/123/transactions/sale_1',
      action: 'SET',
      data: { amount: 1500 },
      timestamp: '2026-09-21T00:05:00Z',
    });

    const count = await getPendingChangesCount();
    expect(count).toBe(1);

    const changes = await getPendingChanges();
    expect(changes[0].data.amount).toBe(1500);
  });

  it('records batch of changes and clears queue', async () => {
    await recordPendingChangesBatch([
      {
        id: 'purchases/p1',
        path: 'purchases/p1',
        action: 'SET',
        data: { weightKg: 5000 },
        timestamp: '2026-09-21T00:00:00Z',
      },
      {
        id: 'purchases/p2',
        path: 'purchases/p2',
        action: 'DELETE',
        timestamp: '2026-09-21T00:00:00Z',
      },
    ]);

    expect(await getPendingChangesCount()).toBe(2);

    await clearPendingChanges();
    expect(await getPendingChangesCount()).toBe(0);
  });

  it('clears all local data properly', async () => {
    await clearAllLocalData();
    const hasData = await hasLocalData();
    expect(hasData).toBe(false);
  });

  it('safely handles archive and custom store collections', async () => {
    await putStoreItem('transactions-2025' as any, {
      id: 'tx_archive_1',
      amount: 5000,
      year: 2025,
    });

    const item = await getStoreItem('transactions-2025' as any, 'tx_archive_1');
    expect(item).toBeDefined();
    expect(item?.amount).toBe(5000);

    const allArchives = await getStoreData('archives');
    expect(allArchives).toHaveLength(1);
  });
});
