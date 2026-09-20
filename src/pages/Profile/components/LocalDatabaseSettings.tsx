import {
  ArrowDownToLine,
  ArrowUpRight,
  Database,
  HardDrive,
  RefreshCw,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button, Card, Switch, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { DatabaseMode, dbConfig } from '../../../services/dbBridge';
import {
  getStoreData,
  isLocalDatabaseSeeded,
  seedLocalDatabaseFromSnapshot,
  syncLocalDatabaseFromCloud,
} from '../../../services/indexedDBService';
import { useAppDispatch } from '../../../store/hooks';
import { showSnackbar } from '../../../store/slices/uiSlice';
import { Customer, Transaction } from '../../../types';

interface LocalStats {
  customers: number;
  sales: number;
  payments: number;
  services: number;
  purchases: number;
  expenses: number;
  rollouts: number;
}

export const LocalDatabaseSettings: React.FC = () => {
  const dispatch = useAppDispatch();

  const [dbMode, setDbMode] = useState<DatabaseMode>(dbConfig.getMode());
  const [stats, setStats] = useState<LocalStats>({
    customers: 0,
    sales: 0,
    payments: 0,
    services: 0,
    purchases: 0,
    expenses: 0,
    rollouts: 0,
  });
  const [loading, setLoading] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncingPull, setSyncingPull] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const isSeeded = await isLocalDatabaseSeeded();
      if (!isSeeded) {
        await seedLocalDatabaseFromSnapshot(false);
      }

      const customers = (await getStoreData('customers')) as Customer[];
      const transactions = (await getStoreData(
        'transactions',
      )) as Transaction[];
      const purchases = (await getStoreData('purchases')) as Transaction[];
      const rollouts = (await getStoreData('monthly_rollout')) as any[];

      const sales = transactions.filter((t) => t.type === 'SALE').length;
      const payments = transactions.filter((t) => t.type === 'PAYMENT').length;
      const services = transactions.filter((t) => t.type === 'SERVICE').length;
      const farmPurchases = purchases.filter(
        (p) => p.type === 'PURCHASE',
      ).length;
      const expenses = purchases.filter((p) => p.type === 'EXPENSE').length;

      setStats({
        customers: customers.length,
        sales,
        payments,
        services,
        purchases: farmPurchases,
        expenses,
        rollouts: rollouts.length,
      });
    } catch (err) {
      console.error('Failed to load local DB stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleToggleMode = (isLocal: boolean) => {
    const nextMode = isLocal ? 'local' : 'server';
    dbConfig.setMode(nextMode);
    setDbMode(nextMode);
    dispatch(
      showSnackbar({
        message:
          nextMode === 'local'
            ? '📦 Local Offline DB Enabled (IndexedDB)!'
            : '🌐 Connected to Live Cloud Firestore!',
      }),
    );
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  // 1. Reset / Seed Local DB from snapshot
  const handleSeedFromSnapshot = async () => {
    try {
      setLoading(true);
      const res = await seedLocalDatabaseFromSnapshot(true);
      await loadStats();
      dispatch(
        showSnackbar({
          message: `✅ Local DB reloaded from snapshot: ${res.customersCount} customers, ${res.transactionsCount} txs, ${res.purchasesCount} purchases.`,
        }),
      );
      if (dbMode === 'local') {
        setTimeout(() => window.location.reload(), 400);
      }
    } catch (err) {
      console.error('Failed to reload snapshot:', err);
      dispatch(
        showSnackbar({
          message: `❌ Error reloading snapshot: ${(err as Error).message}`,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  // 2. Sync from Cloud Firestore into Local IndexedDB
  const handleSyncFromCloud = async () => {
    try {
      setSyncingPull(true);
      const res = await syncLocalDatabaseFromCloud();
      await loadStats();
      dispatch(
        showSnackbar({
          message: `✅ Synced from Cloud Firestore: ${res.customersCount} customers, ${res.transactionsCount} txs, ${res.purchasesCount} purchases.`,
        }),
      );
      if (dbMode === 'local') {
        setTimeout(() => window.location.reload(), 400);
      }
    } catch (err) {
      console.error('Failed to sync from Firestore:', err);
      dispatch(
        showSnackbar({
          message: `❌ Failed to sync from Firestore: ${(err as Error).message}`,
        }),
      );
    } finally {
      setSyncingPull(false);
    }
  };

  // 3. Publish Local Data to Cloud Firestore
  const handlePublishToCloud = async () => {
    try {
      setSyncingCloud(true);
      const customers = (await getStoreData('customers')) as Customer[];
      const transactions = (await getStoreData(
        'transactions',
      )) as Transaction[];
      const purchases = (await getStoreData('purchases')) as Transaction[];
      const rollouts = (await getStoreData('monthly_rollout')) as any[];
      const metadata = (await getStoreData('metadata')) as any[];

      const { writeBatch: serverWriteBatch, doc: serverDoc } =
        await import('firebase/firestore');
      const { db: firestoreInstance } =
        await import('../../../store/firebaseConfig');

      // Helper to chunk operations into batches of 450 (Firestore limit is 500)
      const batchList: Array<() => Promise<void>> = [];
      let currentBatch = serverWriteBatch(firestoreInstance);
      let opCount = 0;

      const commitAndRenew = () => {
        const batchToCommit = currentBatch;
        batchList.push(() => batchToCommit.commit());
        currentBatch = serverWriteBatch(firestoreInstance);
        opCount = 0;
      };

      const addOp = (action: () => void) => {
        action();
        opCount++;
        if (opCount >= 450) {
          commitAndRenew();
        }
      };

      // 1. Customers
      for (const cust of customers) {
        if (!cust.id) continue;
        addOp(() => {
          const ref = serverDoc(
            firestoreInstance,
            'customers',
            String(cust.id),
          );
          currentBatch.set(ref, cust, { merge: true });
        });
      }

      // 2. Transactions
      for (const tx of transactions) {
        if (!tx.customerId || !tx.id) continue;
        addOp(() => {
          const ref = serverDoc(
            firestoreInstance,
            'customers',
            String(tx.customerId),
            'transactions',
            String(tx.id),
          );
          currentBatch.set(ref, tx, { merge: true });
        });
      }

      // 3. Purchases & Expenses
      for (const p of purchases) {
        if (!p.id) continue;
        addOp(() => {
          const ref = serverDoc(firestoreInstance, 'purchases', String(p.id));
          currentBatch.set(ref, p, { merge: true });
        });
      }

      // 4. Monthly Rollout
      for (const r of rollouts) {
        const key = r.month || r.id;
        if (!key) continue;
        addOp(() => {
          const ref = serverDoc(
            firestoreInstance,
            'monthly_rollout',
            String(key),
          );
          currentBatch.set(ref, r, { merge: true });
        });
      }

      // 5. Metadata
      for (const m of metadata) {
        const key = m.key || m.id;
        if (!key) continue;
        addOp(() => {
          const ref = serverDoc(firestoreInstance, 'metadata', String(key));
          currentBatch.set(ref, m, { merge: true });
        });
      }

      if (opCount > 0) {
        commitAndRenew();
      }

      // Execute batches sequentially
      for (const commitBatch of batchList) {
        await commitBatch();
      }

      dispatch(
        showSnackbar({
          message: `🚀 Successfully published all local data (${customers.length} customers, ${transactions.length + purchases.length} records) to Cloud Firestore!`,
        }),
      );
    } catch (err) {
      console.error('Failed to publish data to Firestore:', err);
      dispatch(
        showSnackbar({
          message: `❌ Failed to publish to Firestore: ${(err as Error).message}`,
        }),
      );
    } finally {
      setSyncingCloud(false);
    }
  };

  const isLocalMode = dbMode === 'local';

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <Flex align="center" gap="xs" className="px-1">
        <Database className="h-4 w-4 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Local Database
        </Text>
      </Flex>

      {/* Main Card */}
      <Card variant="outlined" className="space-y-4 p-4">
        {/* Toggle Switch Row */}
        <div className="flex items-center justify-between rounded-xl border border-m3-outline-variant/30 bg-m3-surface-container-low p-3">
          <Flex align="center" gap="md">
            <div
              className={`rounded-full p-2.5 transition-colors ${
                isLocalMode
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isLocalMode ? (
                <HardDrive className="h-5 w-5" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
            </div>
            <div>
              <Flex align="center" gap="xs">
                <Text styleAs="body-sm" appearance="primary" weight="bold">
                  {isLocalMode ? 'Local Database' : 'Server Database'}
                </Text>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isLocalMode
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {isLocalMode ? 'OFFLINE' : 'ONLINE'}
                </span>
              </Flex>
              <Text
                styleAs="caption"
                appearance="secondary"
                className="mt-0.5 block text-[11px]"
              >
                {isLocalMode
                  ? 'Browser IndexedDB storage'
                  : 'Live Cloud Firestore connection'}
              </Text>
            </div>
          </Flex>
          <Switch
            checked={isLocalMode}
            onChange={handleToggleMode}
            activeColor="border-amber-600 bg-amber-600"
          />
        </div>

        {/* Dataset Breakdown Cards */}
        <div className="space-y-1.5 pt-1">
          <Flex align="center" justify="between">
            <Text
              styleAs="label"
              appearance="secondary"
              className="text-[11px] uppercase tracking-wider"
            >
              Local Records
            </Text>
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] font-medium text-m3-primary hover:underline"
            >
              <RefreshCw
                className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </Flex>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-m3-primary">
                {stats.customers}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Customers
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {stats.sales}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Sales
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats.payments}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Payments
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-purple-600 dark:text-purple-400">
                {stats.services}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Services
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-amber-600 dark:text-amber-400">
                {stats.purchases}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Purchases
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-rose-600 dark:text-rose-400">
                {stats.expenses}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Expenses
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 rounded-xl border border-m3-outline/20 bg-m3-surface-container-low p-3.5">
          <Flex align="center" gap="xs">
            <RefreshCw className="h-4 w-4 text-m3-primary" />
            <span className="text-xs font-bold text-m3-on-surface">
              Actions
            </span>
          </Flex>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* 1. Sync from Live Cloud DB */}
            <Button
              variant="tonal"
              size="sm"
              icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
              onClick={handleSyncFromCloud}
              disabled={syncingPull || syncingCloud || loading}
              className="justify-center px-2 text-xs font-medium"
            >
              {syncingPull ? 'Syncing...' : 'Sync'}
            </Button>

            {/* 2. Publish to Cloud Firestore */}
            <Button
              variant="filled"
              size="sm"
              icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              onClick={handlePublishToCloud}
              disabled={syncingCloud || syncingPull || loading}
              className="justify-center px-2 text-xs font-medium"
            >
              {syncingCloud ? 'Publishing...' : 'Publish'}
            </Button>

            {/* 3. Reset to Baseline DB Snapshot */}
            <Button
              variant="outlined"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={handleSeedFromSnapshot}
              disabled={loading || syncingCloud || syncingPull}
              className="justify-center px-2 text-xs font-medium"
            >
              {loading ? 'Resetting...' : 'Reset'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
