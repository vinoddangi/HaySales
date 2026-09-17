import { Archive, Database, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { useAppDispatch } from '../../../store/hooks';
import { useBackupYearlyTransactionsMutation } from '../../../store/slices/customersApi';
import { showSnackbar } from '../../../store/slices/uiSlice';

export const TransactionBackupSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentYear = new Date().getFullYear();
  const [showConfirm, setShowConfirm] = useState(false);

  const [backupTransactions, { isLoading }] =
    useBackupYearlyTransactionsMutation();

  const handleExecuteBackup = async () => {
    try {
      const result = await backupTransactions({ year: currentYear }).unwrap();
      setShowConfirm(false);
      dispatch(
        showSnackbar({
          message: `Synced & archived ${result.backedUpCount} transactions into Transactions-${result.targetYear}!`,
        }),
      );
    } catch (err) {
      console.error('Backup error:', err);
      dispatch(
        showSnackbar({
          message: 'Error executing transaction backup & rollout.',
        }),
      );
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
        <Database className="h-3.5 w-3.5 text-m3-primary" />
        <span>Financial Year Rollover & Backup</span>
      </h3>

      <Card variant="outlined" className="space-y-3.5 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-m3-primary" />
            <h4 className="text-xs font-bold text-m3-on-surface">
              Archive & Rollout Transactions ({currentYear})
            </h4>
          </div>
          <p className="text-[11px] leading-relaxed text-m3-on-surface-variant">
            Moves active transactions into{' '}
            <code className="rounded bg-m3-surface-container-high px-1 py-0.5 font-mono text-[10px] text-m3-primary">
              Transactions-({currentYear})
            </code>
            . If documents already exist in this year's archive, it merges new
            records, recalculates the cumulative balance, and creates an updated{' '}
            <strong>Previous Outstanding</strong> entry.
          </p>
        </div>

        {/* Action button */}
        {!showConfirm ? (
          <div className="flex justify-end pt-1">
            <Button
              variant="tonal"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => setShowConfirm(true)}
              disabled={isLoading}
              className="text-xs font-semibold"
            >
              Rollout & Archive ({currentYear})
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Confirm Archival for Year {currentYear}?
            </p>
            <p className="text-[10px] text-m3-on-surface-variant">
              Active customer transactions will be moved to{' '}
              <code>Transactions-{currentYear}</code> and replaced with an
              opening balance entry.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="filled"
                size="sm"
                onClick={handleExecuteBackup}
                disabled={isLoading}
                className="flex-1 text-xs"
              >
                {isLoading ? 'Archiving...' : 'Yes, Execute Rollover'}
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
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
