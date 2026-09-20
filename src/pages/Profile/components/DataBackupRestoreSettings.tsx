import {
  Database,
  ExternalLink,
  HardDriveDownload,
  HardDriveUpload,
  RefreshCw,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  downloadAllCsvBackups,
  restoreAllBundledCsvsToFirestoreApi,
} from '../../../api/dataBackup.api';
import { Button, Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import {
  useGetAllTransactionsQuery,
  useGetCustomersQuery,
  useGetPurchasesQuery,
} from '../../../store/slices/customersApi';
import { useAppDispatch } from '../../../store/hooks';
import { showSnackbar } from '../../../store/slices/uiSlice';

const GOOGLE_DRIVE_FOLDER_ID = '1hG506Zm9k2A2HWqRjzP60F0Sg5ZtXp4e';
const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;

export const DataBackupRestoreSettings: React.FC = () => {
  const dispatch = useAppDispatch();

  // Live queries for stats
  const { data: customers = [] } = useGetCustomersQuery();
  const { data: allTransactions = [] } = useGetAllTransactionsQuery();
  const { data: allPurchases = [] } = useGetPurchasesQuery();

  const salesCount = allTransactions.filter((t) => t.type === 'SALE').length;
  const paymentsCount = allTransactions.filter(
    (t) => t.type === 'PAYMENT',
  ).length;
  const servicesCount = allTransactions.filter(
    (t) => t.type === 'SERVICE',
  ).length;
  const purchasesCount = allPurchases.filter(
    (p) => p.type === 'PURCHASE',
  ).length;
  const expensesCount = allPurchases.filter((p) => p.type === 'EXPENSE').length;

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // 1. Action: Backup (Exports all CSV files to Google Drive folder / local)
  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const count = await downloadAllCsvBackups();
      dispatch(
        showSnackbar({
          message: `✅ Backup complete! Generated all 6 CSV backup files (${count} records) for Google Drive.`,
        }),
      );
    } catch (err) {
      console.error('Backup error:', err);
      dispatch(
        showSnackbar({
          message: '❌ Error generating backup files.',
        }),
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  // 2. Action: Restore (Restores CSV files into Firestore DB)
  const handleRestore = async () => {
    if (
      !window.confirm(
        'Are you sure you want to restore the database from CSV backup files? Existing records with matching IDs will be merged/updated.',
      )
    ) {
      return;
    }

    try {
      setIsRestoring(true);
      const res = await restoreAllBundledCsvsToFirestoreApi();
      dispatch(
        showSnackbar({
          message: `✅ Restore complete! Restored ${res.totalRestored} records into Firestore DB.`,
        }),
      );
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error('Restore error:', err);
      dispatch(
        showSnackbar({
          message: `❌ Error restoring database: ${(err as Error).message}`,
        }),
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <Flex align="center" gap="xs" className="px-1">
        <Database className="h-4 w-4 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Database Backup & Restore
        </Text>
      </Flex>

      {/* Main Container Card */}
      <Card variant="outlined" className="space-y-4 p-4">
        {/* Google Drive Status Banner */}
        <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/[0.08] p-3">
          <div className="space-y-0.5">
            <Flex align="center" gap="xs">
              <HardDriveDownload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Google Drive Storage Folder
              </span>
            </Flex>
            <Text
              styleAs="caption"
              appearance="secondary"
              className="block text-[11px]"
            >
              Target folder for CSV backups and recovery
            </Text>
          </div>
          <a
            href={GOOGLE_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
          >
            Open Drive Folder <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Live Database Record Breakdown */}
        <div className="space-y-1.5 pt-1">
          <Text
            styleAs="label"
            appearance="secondary"
            className="text-[11px] uppercase tracking-wider"
          >
            Live Database Records
          </Text>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-2.5 text-center">
              <span className="block text-lg font-bold text-m3-primary">
                {customers.length}
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

        {/* 2 Actions: Backup & Restore */}
        <div className="space-y-2 rounded-xl border border-m3-outline/20 bg-m3-surface-container-low p-3.5">
          <Flex align="center" gap="xs">
            <RefreshCw className="h-4 w-4 text-m3-primary" />
            <span className="text-xs font-bold text-m3-on-surface">
              Backup & Restore Actions
            </span>
          </Flex>

          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
            {/* 1. Backup */}
            <Button
              variant="filled"
              size="md"
              icon={<HardDriveUpload className="h-4 w-4" />}
              onClick={handleBackup}
              disabled={isBackingUp}
              className="justify-center text-xs font-semibold"
            >
              {isBackingUp ? 'Backing up...' : 'Backup'}
            </Button>

            {/* 2. Restore */}
            <Button
              variant="tonal"
              size="md"
              icon={<HardDriveDownload className="h-4 w-4" />}
              onClick={handleRestore}
              disabled={isRestoring}
              className="justify-center text-xs font-semibold"
            >
              {isRestoring ? 'Restoring...' : 'Restore'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
