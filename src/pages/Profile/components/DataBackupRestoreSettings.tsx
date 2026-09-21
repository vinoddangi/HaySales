import {
  Database,
  ExternalLink,
  HardDriveDownload,
  HardDriveUpload,
  ShieldCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  clearAllFirestoreDataApi,
  downloadAllCsvBackups,
  exportAllDataAsCsv,
  restoreAllBundledCsvsToFirestoreApi,
  restoreFromCsvApi,
} from '../../../api/dataBackup.api';
import { Button, Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import {
  downloadGoogleDriveFileContent,
  getGoogleDriveAccessToken,
  GOOGLE_DRIVE_FOLDER_ID,
  GOOGLE_DRIVE_FOLDER_URL,
  listGoogleDriveBackupFiles,
  uploadCsvToGoogleDrive,
} from '../../../services/googleDriveService';
import { syncLocalDatabaseFromCloud } from '../../../services/indexedDBService';
import { useAppDispatch } from '../../../store/hooks';
import {
  useGetAllTransactionsQuery,
  useGetCustomersQuery,
  useGetPurchasesQuery,
} from '../../../store/slices/customersApi';
import { showSnackbar } from '../../../store/slices/uiSlice';

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

  // 1. Action: Backup (Uploads all 6 CSV files directly into Google Drive folder)
  const handleBackup = async () => {
    try {
      setIsBackingUp(true);

      // Step A: Request Google Drive OAuth permission on demand if not already authorized
      const accessToken = await getGoogleDriveAccessToken();

      // Step B: Export live data directly from Firestore
      const exports = await exportAllDataAsCsv();
      let uploadedCount = 0;

      // Step C: Upload each CSV file directly to Google Drive folder
      for (const item of Object.values(exports)) {
        if (item.csvContent) {
          await uploadCsvToGoogleDrive(
            item.fileName,
            item.csvContent,
            GOOGLE_DRIVE_FOLDER_ID,
            accessToken,
          );
          uploadedCount++;
        }
      }

      dispatch(
        showSnackbar({
          message: `✅ Backup uploaded directly to Google Drive folder! (${uploadedCount} CSV datasets)`,
        }),
      );
    } catch (err: any) {
      console.error('Drive backup error:', err);
      const isAuthDisabled =
        err?.code === 'auth/operation-not-allowed' ||
        String(err?.message || '').includes('operation-not-allowed');

      if (isAuthDisabled) {
        // Fallback: Download CSV files directly to device
        const total = await downloadAllCsvBackups();
        dispatch(
          showSnackbar({
            message: `⚠️ Google Sign-In not enabled in Firebase Console. Downloaded ${total} records directly to your device as CSV fallback.`,
          }),
        );
      } else {
        dispatch(
          showSnackbar({
            message: `❌ Drive backup failed: ${err.message || 'Error uploading to Google Drive'}`,
          }),
        );
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  // 2. Action: Restore (Cleans existing Firestore data, then restores latest CSV files from Google Drive)
  const handleRestore = async () => {
    if (
      !window.confirm(
        '⚠️ Warning: Restoring will completely clear all existing Firestore records and replace them with the Google Drive backup. Do you want to proceed?',
      )
    ) {
      return;
    }

    try {
      setIsRestoring(true);

      // Step A: Request Google Drive OAuth permission on demand
      const accessToken = await getGoogleDriveAccessToken();

      // Step B: List backup files in Google Drive folder
      const driveFiles = await listGoogleDriveBackupFiles(
        GOOGLE_DRIVE_FOLDER_ID,
        accessToken,
      );

      // Step C: Clean wipe all existing Firestore records first for an exact 1:1 restore
      await clearAllFirestoreDataApi();

      let restoredRecords = 0;

      if (driveFiles.length > 0) {
        // Find latest files for each dataset type matching Firestore collections 1:1
        const types: Array<
          | 'customers'
          | 'transactions'
          | 'purchases'
          | 'sales'
          | 'payments'
          | 'services'
          | 'expenses'
        > = [
          'customers',
          'transactions',
          'purchases',
          'sales',
          'payments',
          'services',
          'expenses',
        ];

        for (const type of types) {
          const match = driveFiles.find((f) =>
            f.name.toLowerCase().startsWith(type),
          );
          if (match) {
            const csvText = await downloadGoogleDriveFileContent(
              match.id,
              accessToken,
            );
            const res = await restoreFromCsvApi(type, csvText);
            restoredRecords += res.successCount;
          }
        }
      } else {
        // Fallback to bundled CSVs if folder is empty
        const res = await restoreAllBundledCsvsToFirestoreApi();
        restoredRecords = res.totalRestored;
      }

      // Step D: Sync local IndexedDB cache with restored Firestore records
      await syncLocalDatabaseFromCloud();

      dispatch(
        showSnackbar({
          message: `✅ Restore complete! Wiped and restored ${restoredRecords} records into Firestore DB from Google Drive.`,
        }),
      );
      setTimeout(() => window.location.reload(), 600);
    } catch (err: any) {
      console.error('Drive restore error:', err);
      const isAuthDisabled =
        err?.code === 'auth/operation-not-allowed' ||
        String(err?.message || '').includes('operation-not-allowed');

      if (isAuthDisabled) {
        dispatch(
          showSnackbar({
            message: `⚠️ Google Sign-In is not enabled in Firebase Console. Please enable Google provider under Firebase Authentication -> Sign-in method.`,
          }),
        );
      } else {
        dispatch(
          showSnackbar({
            message: `❌ Error restoring database: ${err.message || 'Error restoring from Google Drive'}`,
          }),
        );
      }
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
            Live Database Collections (Firestore)
          </Text>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-3 text-center">
              <span className="block text-xl font-bold text-m3-primary">
                {customers.length}
              </span>
              <span className="block text-xs font-semibold text-m3-on-surface">
                /customers
              </span>
              <span className="block text-[10px] text-m3-on-surface-variant">
                Customer Profiles
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-3 text-center">
              <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {allTransactions.length}
              </span>
              <span className="block text-xs font-semibold text-m3-on-surface">
                /customers/{`{id}`}/transactions
              </span>
              <span className="block text-[10px] text-m3-on-surface-variant">
                Sales ({salesCount}) • Payments ({paymentsCount}) • Services (
                {servicesCount})
              </span>
            </div>
            <div className="rounded-xl border border-m3-outline/20 bg-m3-surface-container-lowest p-3 text-center">
              <span className="block text-xl font-bold text-amber-600 dark:text-amber-400">
                {allPurchases.length}
              </span>
              <span className="block text-xs font-semibold text-m3-on-surface">
                /purchases
              </span>
              <span className="block text-[10px] text-m3-on-surface-variant">
                Purchases ({purchasesCount}) • Expenses ({expensesCount})
              </span>
            </div>
          </div>
        </div>

        {/* 2 Actions: Backup & Restore */}
        <div className="space-y-2 rounded-xl border border-m3-outline/20 bg-m3-surface-container-low p-3.5">
          <Flex align="center" gap="xs">
            <ShieldCheck className="h-4 w-4 text-m3-primary" />
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
