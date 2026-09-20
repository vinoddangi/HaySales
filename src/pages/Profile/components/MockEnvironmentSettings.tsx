import { Database, FlaskConical, RefreshCw, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';
import { fetchLiveEntitiesForMock } from '../../../api/dataBackup.api';
import { Button, Card, Switch, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { mockDataStore } from '../../../mock/mockDataStore';
import { useAppDispatch } from '../../../store/hooks';
import { showSnackbar } from '../../../store/slices/uiSlice';

export const MockEnvironmentSettings: React.FC = () => {
  const dispatch = useAppDispatch();

  const [isMockEnabled, setIsMockEnabled] = useState(mockDataStore.isEnabled());
  const [mockState, setMockState] = useState(mockDataStore.getState());
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggleMock = (enabled: boolean) => {
    mockDataStore.setEnabled(enabled);
    setIsMockEnabled(enabled);
    dispatch(
      showSnackbar({
        message: enabled
          ? '🧪 Mock Sandbox Enabled! Running directly from local CSV dataset.'
          : 'Switched back to Live Firestore connection.',
      }),
    );
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  // 1. Sync DB: Copy live Firestore records into Mock Store
  const handleSyncDb = async () => {
    try {
      setIsSyncing(true);
      const { customers, transactions, purchases } =
        await fetchLiveEntitiesForMock();
      mockDataStore.syncFromLiveDb(customers, transactions, purchases);
      setMockState({ ...mockDataStore.getState() });
      dispatch(
        showSnackbar({
          message: `✅ Synced ${customers.length} customers and ${transactions.length + purchases.length} records from Live DB to Mock!`,
        }),
      );
      if (isMockEnabled) {
        setTimeout(() => window.location.reload(), 400);
      }
    } catch (err) {
      console.error('Failed to sync DB to Mock:', err);
      dispatch(
        showSnackbar({
          message: `❌ Error syncing Live DB to Mock: ${(err as Error).message}`,
        }),
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Reset: Reset Mock back to original baseline CSV dataset
  const handleReset = () => {
    mockDataStore.resetToDefault();
    setMockState(mockDataStore.getState());
    dispatch(
      showSnackbar({
        message: '✅ Reset Mock dataset back to original CSV baseline.',
      }),
    );
    if (isMockEnabled) {
      setTimeout(() => window.location.reload(), 400);
    }
  };

  const salesCount = mockState.transactions.filter(
    (t) => t.type === 'SALE',
  ).length;
  const paymentsCount = mockState.transactions.filter(
    (t) => t.type === 'PAYMENT',
  ).length;
  const servicesCount = mockState.transactions.filter(
    (t) => t.type === 'SERVICE',
  ).length;
  const purchasesCount = mockState.purchases.filter(
    (p) => p.type === 'PURCHASE',
  ).length;
  const expensesCount = mockState.purchases.filter(
    (p) => p.type === 'EXPENSE',
  ).length;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <Flex align="center" gap="xs" className="px-1">
        <FlaskConical className="h-4 w-4 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Mock Environment
        </Text>
      </Flex>

      {/* Main Card */}
      <Card variant="outlined" className="space-y-4 p-4">
        {/* Toggle Switch Row */}
        <div className="flex items-center justify-between rounded-xl border border-m3-outline-variant/30 bg-m3-surface-container-low p-3">
          <Flex align="center" gap="md">
            <div
              className={`rounded-full p-2.5 transition-colors ${isMockEnabled ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}
            >
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <Flex align="center" gap="xs">
                <Text styleAs="body-sm" appearance="primary" weight="bold">
                  Mock Sandbox Mode
                </Text>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isMockEnabled ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}
                >
                  {isMockEnabled ? 'SANDBOX ON' : 'LIVE DB ON'}
                </span>
              </Flex>
              <Text
                styleAs="caption"
                appearance="secondary"
                className="mt-0.5 block text-[11px]"
              >
                {isMockEnabled
                  ? 'Active Mock Sandbox: loads offline from bundled CSV files'
                  : 'Live Production Mode: connected directly to Firestore database'}
              </Text>
            </div>
          </Flex>
          <Switch
            checked={isMockEnabled}
            onChange={handleToggleMock}
            activeColor="border-amber-600 bg-amber-600"
          />
        </div>

        {/* Dataset Breakdown Cards */}
        <div className="space-y-1.5 pt-1">
          <Text
            styleAs="label"
            appearance="secondary"
            className="text-[11px] uppercase tracking-wider"
          >
            Mock Records
          </Text>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-m3-primary">
                {mockState.customers.length}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Customers
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {salesCount}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Sales Records
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">
                {paymentsCount}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Payments
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-purple-600 dark:text-purple-400">
                {servicesCount}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Services (Daalu)
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-amber-600 dark:text-amber-400">
                {purchasesCount}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Farm Purchases
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-rose-600 dark:text-rose-400">
                {expensesCount}
              </span>
              <span className="block text-[10px] font-medium text-m3-on-surface-variant">
                Farm Expenses
              </span>
            </div>
          </div>
        </div>

        {/* 2 Actions: Sync DB & Reset */}
        <div className="space-y-2 rounded-xl border border-m3-outline/20 bg-m3-surface-container-low p-3.5">
          <Flex align="center" gap="xs">
            <RefreshCw className="h-4 w-4 text-m3-primary" />
            <span className="text-xs font-bold text-m3-on-surface">
              Mock Actions
            </span>
          </Flex>

          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
            {/* 1. Sync DB */}
            <Button
              variant="tonal"
              size="md"
              icon={<Database className="h-4 w-4" />}
              onClick={handleSyncDb}
              disabled={isSyncing}
              className="justify-center text-xs font-semibold"
            >
              {isSyncing ? 'Syncing DB...' : 'Sync DB'}
            </Button>

            {/* 2. Reset */}
            <Button
              variant="outlined"
              size="md"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={handleReset}
              className="justify-center text-xs font-semibold"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
