import { Archive, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { Button, Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { useAppDispatch } from '../../../store/hooks';
import {
  useBackupYearlyTransactionsMutation,
  useGetBackupStatusQuery,
} from '../../../store/slices/customersApi';
import { showSnackbar } from '../../../store/slices/uiSlice';

export const TransactionBackupSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentYear = new Date().getFullYear();
  const targetYear = currentYear - 1;
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: backupStatus } = useGetBackupStatusQuery();
  const [backupTransactions, { isLoading }] =
    useBackupYearlyTransactionsMutation();

  const isAlreadyBackedUp =
    backupStatus && backupStatus.lastBackedUpYear >= targetYear;

  const handleExecuteBackup = async () => {
    try {
      const result = await backupTransactions({ year: targetYear }).unwrap();
      setShowConfirm(false);
      dispatch(
        showSnackbar({
          message: `Archived ${result.backedUpCount} transactions & ${result.purchasesBackedUpCount} purchases for ${result.targetYear}!`,
        }),
      );
    } catch (err) {
      console.error('Backup error:', err);
      dispatch(
        showSnackbar({
          message: 'Error executing annual transaction & purchase backup.',
        }),
      );
    }
  };

  return (
    <div className="space-y-2">
      <Flex align="center" gap="xs" className="px-1">
        <Database className="h-3.5 w-3.5 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Annual Rollover & Backup
        </Text>
      </Flex>

      <Card variant="outlined" className="space-y-3.5 p-4">
        <div className="space-y-1">
          <Flex align="center" gap="xs">
            <Archive className="h-4 w-4 text-m3-primary" />
            <Text styleAs="body-sm" appearance="primary" weight="bold">
              Archive Previous Year Data ({targetYear})
            </Text>
          </Flex>

          {/* Current Backup Status Badge */}
          {backupStatus && (
            <div className="py-1">
              {isAlreadyBackedUp ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {targetYear} Backup Completed (Last backed up year:{' '}
                  {backupStatus.lastBackedUpYear})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  ⚠️ {targetYear} Backup Pending (Last backed up year:{' '}
                  {backupStatus.lastBackedUpYear || 'None'})
                </span>
              )}
            </div>
          )}

          <Text
            styleAs="caption"
            appearance="secondary"
            className="block leading-relaxed"
          >
            Archives previous year customer transactions into{' '}
            <code className="rounded bg-m3-surface-container-high px-1 py-0.5 font-mono text-[10px] text-m3-primary">
              transactions-{targetYear}
            </code>{' '}
            and farm purchases into{' '}
            <code className="rounded bg-m3-surface-container-high px-1 py-0.5 font-mono text-[10px] text-m3-primary">
              purchases-{targetYear}
            </code>
            . Carries forward each customer&apos;s exact balance as a single{' '}
            <strong>Previous Outstanding</strong> opening balance and unlocks
            new entries for {currentYear}. Customer profiles remain intact.
          </Text>
        </div>

        {/* Action button */}
        {!showConfirm ? (
          <div className="flex justify-end pt-1">
            <Button
              variant={isAlreadyBackedUp ? 'tonal' : 'filled'}
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => setShowConfirm(true)}
              disabled={isLoading}
              className="text-xs font-semibold"
            >
              {isAlreadyBackedUp
                ? `Re-run Annual Backup (${targetYear})`
                : `Perform Annual Backup (${targetYear})`}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs">
            <Text
              styleAs="body-sm"
              sentiment="warning"
              weight="bold"
              className="block"
            >
              Confirm Annual Archival for {targetYear}?
            </Text>
            <Text styleAs="caption" appearance="secondary" className="block">
              Previous year customer transactions and purchases will be archived
              to <code>transactions-{targetYear}</code> and{' '}
              <code>purchases-{targetYear}</code>. Active balances will roll
              forward as opening balances.
            </Text>
            <Flex align="center" gap="sm" className="pt-1">
              <Button
                variant="filled"
                size="sm"
                onClick={handleExecuteBackup}
                disabled={isLoading}
                className="flex-1 text-xs"
              >
                {isLoading
                  ? 'Archiving...'
                  : `Yes, Backup & Roll Over (${targetYear})`}
              </Button>
              <Button
                variant="outlined"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="text-xs"
              >
                Cancel
              </Button>
            </Flex>
          </div>
        )}
      </Card>
    </div>
  );
};
