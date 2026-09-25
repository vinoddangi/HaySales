import {
  ArrowDownToLine,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Database,
  HardDrive,
  List,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button, Card, Switch, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { DatabaseMode, dbConfig } from '../../../services/dbBridge';
import {
  clearAllLocalData,
  getPendingChanges,
  getPendingChangesCount,
  getStoreData,
  PendingChange,
  publishPendingChangesToCloud,
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
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingItems, setPendingItems] = useState<PendingChange[]>([]);
  const [showPendingDetails, setShowPendingDetails] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncingPull, setSyncingPull] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);

      const customers = (await getStoreData('customers')) as Customer[];
      const transactions = (await getStoreData(
        'transactions',
      )) as Transaction[];
      const purchases = (await getStoreData('purchases')) as Transaction[];
      const rollouts = (await getStoreData('monthly_rollout')) as any[];
      const allPending = await getPendingChanges();

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
      setPendingCount(allPending.length);
      setPendingItems(allPending);
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

  // 1. Clear Local DB
  const handleClearLocalDb = async () => {
    try {
      setLoading(true);
      await clearAllLocalData();
      await loadStats();
      dispatch(
        showSnackbar({
          message: '🗑️ Local DB cleared. Click "Sync" to fetch from Firestore.',
        }),
      );
      if (dbMode === 'local') {
        setTimeout(() => window.location.reload(), 400);
      }
    } catch (err) {
      console.error('Failed to clear local DB:', err);
      dispatch(
        showSnackbar({
          message: `❌ Error clearing local DB: ${(err as Error).message}`,
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

  // 3. Publish Modified / Delta Records to Cloud Firestore
  const handlePublishToCloud = async () => {
    try {
      setSyncingCloud(true);
      const count = await getPendingChangesCount();
      if (count === 0) {
        dispatch(
          showSnackbar({
            message:
              '✨ Database is already in sync with Cloud Firestore. No pending changes to publish.',
          }),
        );
        return;
      }

      const res = await publishPendingChangesToCloud();
      await loadStats();
      dispatch(
        showSnackbar({
          message: `🚀 Successfully published ${res.publishedCount} modified record${
            res.publishedCount === 1 ? '' : 's'
          } to Cloud Firestore!`,
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

  // 4. Reload Clean Snapshot (2026 data) into Local IndexedDB
  const handleReloadSnapshot = async () => {
    try {
      setLoading(true);
      const res = await seedLocalDatabaseFromSnapshot();
      await loadStats();
      dispatch(
        showSnackbar({
          message: `✅ Local DB loaded with clean 2026 data: ${res.transactionsCount} txs, ${res.customersCount} customers.`,
        }),
      );
      if (dbMode === 'local') {
        setTimeout(() => window.location.reload(), 400);
      }
    } catch (err) {
      console.error('Failed to reload snapshot into local DB:', err);
      dispatch(
        showSnackbar({
          message: `❌ Failed to load snapshot: ${(err as Error).message}`,
        }),
      );
    } finally {
      setLoading(false);
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

        {/* Pending Sync / Delta Status */}
        {isLocalMode && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={async () => {
                const latest = await getPendingChanges();
                setPendingItems(latest);
                setPendingCount(latest.length);
                if (latest.length > 0 || !showPendingDetails) {
                  setShowPendingDetails((prev) => !prev);
                }
              }}
              className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                pendingCount > 0
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 hover:bg-amber-500/15 dark:text-amber-200'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <Flex align="center" gap="xs">
                <List className="h-4 w-4" />
                <span className="text-xs font-semibold">
                  {pendingCount > 0
                    ? `⚡ ${pendingCount} modified record${
                        pendingCount === 1 ? '' : 's'
                      } pending publish`
                    : '✅ All changes synced with Cloud Firestore'}
                </span>
              </Flex>
              {pendingCount > 0 && (
                <Flex align="center" gap="xs">
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    {showPendingDetails ? 'HIDE' : 'VIEW DETAILS'}
                  </span>
                  {showPendingDetails ? (
                    <ChevronUp className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  )}
                </Flex>
              )}
            </button>

            {/* Expandable Pending Changes Details List */}
            {isLocalMode && pendingCount > 0 && showPendingDetails && (
              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-amber-500/20 bg-m3-surface-container-lowest p-2.5 text-xs">
                <Flex align="center" justify="between" className="px-1 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                    Pending Delta Changes ({pendingItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const latest = await getPendingChanges();
                      setPendingItems(latest);
                      setPendingCount(latest.length);
                    }}
                    className="text-[10px] text-m3-primary hover:underline"
                  >
                    Refresh List
                  </button>
                </Flex>
                {pendingItems.length === 0 ? (
                  <div className="p-3 text-center text-m3-on-surface-variant">
                    No pending changes found.
                  </div>
                ) : (
                  pendingItems.map((item, idx) => {
                    const d = item.data || {};
                    const isDelete = item.action === 'DELETE';
                    const summaryText =
                      d.customerName ||
                      d.name ||
                      d.vendorName ||
                      d.item ||
                      d.month ||
                      d.lastBackedUpYear ||
                      item.path.split('/').pop() ||
                      item.id;
                    const amountText =
                      d.amount !== undefined
                        ? ` • ₹${Number(d.amount).toLocaleString('en-IN')}`
                        : '';

                    return (
                      <div
                        key={item.id || item.path || idx}
                        className="flex items-center justify-between rounded-lg border border-m3-outline-variant/30 bg-m3-surface-container-low p-2"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <Flex align="center" gap="xs">
                            <span
                              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                                isDelete
                                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                  : 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {item.action}
                            </span>
                            <span className="truncate font-semibold text-m3-on-surface">
                              {summaryText}
                              {amountText}
                            </span>
                          </Flex>
                          <span className="mt-0.5 block truncate font-mono text-[10px] text-m3-on-surface-variant">
                            {item.path}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-m3-on-surface-variant">
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 rounded-xl border border-m3-outline/20 bg-m3-surface-container-low p-3.5">
          <Flex align="center" gap="xs">
            <RefreshCw className="h-4 w-4 text-m3-primary" />
            <span className="text-xs font-bold text-m3-on-surface">
              Actions
            </span>
          </Flex>

          <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
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

            {/* 2. Load Clean Snapshot (2026 Data) */}
            <Button
              variant="tonal"
              size="sm"
              icon={
                <Database className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              }
              onClick={handleReloadSnapshot}
              disabled={loading || syncingCloud || syncingPull}
              className="justify-center px-2 text-xs font-medium"
            >
              {loading ? 'Loading...' : 'Load 2026'}
            </Button>

            {/* 3. Publish to Cloud Firestore */}
            <Button
              variant="filled"
              size="sm"
              icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              onClick={handlePublishToCloud}
              disabled={syncingCloud || syncingPull || loading}
              className="justify-center px-2 text-xs font-medium"
            >
              {syncingCloud
                ? 'Publishing...'
                : pendingCount > 0
                  ? `Publish (${pendingCount})`
                  : 'Publish'}
            </Button>

            {/* 4. Clear Local DB */}
            <Button
              variant="outlined"
              size="sm"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={handleClearLocalDb}
              disabled={loading || syncingCloud || syncingPull}
              className="justify-center px-2 text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            >
              {loading ? 'Clearing...' : 'Clear'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
