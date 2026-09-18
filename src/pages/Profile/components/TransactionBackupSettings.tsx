import { Archive, Calendar, Database, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { useAppDispatch } from '../../../store/hooks';
import { useBackupYearlyTransactionsMutation } from '../../../store/slices/customersApi';
import { showSnackbar } from '../../../store/slices/uiSlice';

export const TransactionBackupSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showConfirm, setShowConfirm] = useState(false);

  const [backupTransactions, { isLoading }] =
    useBackupYearlyTransactionsMutation();

  const yearOptions = [
    { value: currentYear, label: `${currentYear} (CY)` },
    { value: currentYear - 1, label: `${currentYear - 1} (PY)` },
  ];

  const handleExecuteBackup = async () => {
    try {
      const result = await backupTransactions({ year: selectedYear }).unwrap();
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
              Archive & Rollout Transactions
            </h4>
          </div>
          <p className="text-[11px] leading-relaxed text-m3-on-surface-variant">
            Moves active transactions into{' '}
            <code className="rounded bg-m3-surface-container-high px-1 py-0.5 font-mono text-[10px] text-m3-primary">
              Transactions-({selectedYear})
            </code>
            . Merges active records into the archive without double-counting
            previously logged balances, and carries forward the single exact
            outstanding balance as an updated{' '}
            <strong>Previous Outstanding</strong> entry.
          </p>
        </div>

        {/* Year Selector Dropdown */}
        <div className="space-y-1.5 rounded-xl border border-m3-outline-variant/30 bg-m3-surface-container-low p-3">
          <label
            htmlFor="backup-year-select"
            className="flex items-center gap-1.5 text-xs font-bold text-m3-on-surface"
          >
            <Calendar className="h-3.5 w-3.5 text-m3-primary" />
            <span>Target Financial / Archive Year:</span>
          </label>
          <select
            id="backup-year-select"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setShowConfirm(false);
            }}
            className="w-full rounded-lg border border-m3-outline-variant bg-m3-surface px-3 py-2 text-xs font-semibold text-m3-on-surface focus:border-m3-primary focus:outline-none"
          >
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
              Rollout & Archive ({selectedYear})
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Confirm Archival for Year {selectedYear}?
            </p>
            <p className="text-[10px] text-m3-on-surface-variant">
              Active customer transactions will be moved to{' '}
              <code>Transactions-{selectedYear}</code> and replaced with an
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
                {isLoading
                  ? 'Archiving...'
                  : `Yes, Archive for ${selectedYear}`}
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
