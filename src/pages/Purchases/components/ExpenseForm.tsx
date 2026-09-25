import React, { useState } from 'react';
import { isTransactionMonthLocked } from '../../../api';
import {
  DEFAULT_FIXED_ASSETS,
  VALID_EXPENSE_CATEGORIES,
} from '../../../business/purchasesBusiness';
import {
  Button,
  Input,
  RolloutWarningBanner,
  SelectField,
  SummaryBox,
  SummaryRow,
} from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { ExpenseCategoryType, MonthlyRolloutStatus } from '../../../types';
import { formatRupee } from '../../../utils/formatters';

export interface ExpenseFormProps {
  isSaving: boolean;
  rolloutStatus?: MonthlyRolloutStatus | null;
  onSubmit: (_data: {
    category: ExpenseCategoryType;
    amount: number;
    cashPaid: number;
    vendorName?: string;
    note?: string;
    date: string;
    targetAssetId?: string;
  }) => Promise<void>;
}

const CATEGORY_OPTIONS = VALID_EXPENSE_CATEGORIES.map((cat) => ({
  value: cat,
  label: cat,
}));

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isSaving,
  rolloutStatus,
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [category, setCategory] = useState<ExpenseCategoryType>('Fuel');
  const [targetAssetId, setTargetAssetId] = useState<string>(
    DEFAULT_FIXED_ASSETS[0].id,
  );
  const [amount, setAmount] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [allCash, setAllCash] = useState(true);
  const [vendorName, setVendorName] = useState('');
  const [note, setNote] = useState('');

  const isBlockedByRollout = isTransactionMonthLocked(date, rolloutStatus);
  const isFormBlocked = isBlockedByRollout;

  const effectiveCashPaid = allCash ? amount : cashPaid;

  // Find currently selected fixed asset if category is Depreciation
  const selectedAsset =
    category === 'Depreciation'
      ? DEFAULT_FIXED_ASSETS.find((a) => a.id === targetAssetId) ||
        DEFAULT_FIXED_ASSETS[0]
      : null;

  const handleSubmit = async () => {
    if (amount <= 0 || isFormBlocked) return;
    await onSubmit({
      category,
      amount,
      cashPaid: effectiveCashPaid,
      vendorName: vendorName.trim() || undefined,
      note: note.trim() || undefined,
      date,
      targetAssetId: category === 'Depreciation' ? targetAssetId : undefined,
    });
    // Reset form
    setAmount(0);
    setCashPaid(0);
    setAllCash(true);
    setVendorName('');
    setNote('');
  };

  return (
    <Flex direction="column" gap="md" fullWidth>
      {/* Banner if month requires prior rollout */}
      {isFormBlocked && (
        <RolloutWarningBanner
          lastRolledOutMonth={rolloutStatus?.lastRolledOutMonth}
          isFormBanner
        />
      )}

      <Grid columns={2} gap="md" fullWidth>
        <Input
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <SelectField
          label="Expense Category"
          required
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={(e) => setCategory(e.target.value as ExpenseCategoryType)}
        />
      </Grid>

      {/* Fixed Asset Selector (shown when category is Depreciation) */}
      {category === 'Depreciation' && (
        <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 text-xs">
          <SelectField
            label="Select Fixed Asset to Depreciate"
            required
            value={targetAssetId}
            options={DEFAULT_FIXED_ASSETS.map((asset) => ({
              value: asset.id,
              label: `${asset.name} (Value: ${formatRupee(asset.currentBookValue)})`,
            }))}
            onChange={(e) => setTargetAssetId(e.target.value)}
          />

          {selectedAsset && (
            <div className="flex items-center justify-between pt-1 text-[11px] text-m3-on-surface-variant">
              <span>
                Original Cost:{' '}
                <strong className="text-m3-on-surface">
                  {formatRupee(selectedAsset.purchaseCost)}
                </strong>
              </span>
              <span>
                Current Book Value:{' '}
                <strong className="text-amber-700 dark:text-amber-400">
                  {formatRupee(selectedAsset.currentBookValue)}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      <Input
        label={
          category === 'Depreciation'
            ? 'Depreciation Amount (₹)'
            : 'Expense Amount (₹)'
        }
        type="number"
        required
        placeholder="0"
        value={amount || ''}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      {/* Payment Settlement (only for standard operational expenses) */}
      {category !== 'Profit Distribution' && category !== 'Depreciation' && (
        <>
          <Flex direction="column" gap="sm" fullWidth>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-m3-on-surface">
              <input
                type="checkbox"
                checked={allCash}
                onChange={(e) => setAllCash(e.target.checked)}
                className="h-4 w-4 rounded border-m3-outline text-m3-primary"
              />
              Paid in Full (100% Cash Outflow)
            </label>

            {!allCash && (
              <Input
                label="Cash Paid Now (₹)"
                type="number"
                placeholder="0"
                value={cashPaid || ''}
                onChange={(e) => setCashPaid(Number(e.target.value))}
              />
            )}
          </Flex>

          <Input
            label="Paid To / Person / Station (Optional)"
            type="text"
            placeholder="e.g. Indian Oil Pump, Tractor Driver, Bank"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
          />
        </>
      )}

      {category === 'Profit Distribution' && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <p className="font-semibold">Equally Distributed Profit</p>
          <p className="mt-0.5 text-[11px] opacity-80">
            Deducted directly from business Retained Profit and paid out in
            cash.
          </p>
        </div>
      )}

      <Input
        label="Description / Note (Optional)"
        type="text"
        placeholder={
          category === 'Profit Distribution'
            ? 'e.g. Equal partner profit withdrawal'
            : 'e.g. 50 Liters diesel for generator, Monthly loan interest'
        }
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* Summary Box */}
      <SummaryBox>
        <SummaryRow
          label="Category:"
          value={
            <span
              className={
                category === 'Profit Distribution'
                  ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                  : 'font-semibold text-rose-600 dark:text-rose-400'
              }
            >
              {category}
            </span>
          }
        />
        <SummaryRow
          label={
            category === 'Profit Distribution'
              ? 'Profit Distributed:'
              : category === 'Depreciation'
                ? 'Depreciation Written Down:'
                : 'Total Outflow:'
          }
          value={formatRupee(amount)}
        />
        <SummaryRow
          label={
            category === 'Profit Distribution'
              ? 'Deducted From:'
              : category === 'Depreciation'
                ? 'Target Asset Book Value:'
                : 'Cash Paid:'
          }
          value={
            category === 'Profit Distribution'
              ? 'Retained Profit'
              : category === 'Depreciation'
                ? `${selectedAsset?.name || 'Asset'} (Remaining: ${formatRupee(
                    Math.max(
                      0,
                      (selectedAsset?.currentBookValue || 0) - amount,
                    ),
                  )})`
                : formatRupee(effectiveCashPaid)
          }
          isTotal
          className={
            category === 'Profit Distribution'
              ? 'text-emerald-600 dark:text-emerald-400'
              : category === 'Depreciation'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
          }
        />
      </SummaryBox>

      <Button
        variant="filled"
        className={
          category === 'Depreciation'
            ? 'w-full bg-amber-600 text-white hover:bg-amber-700'
            : 'w-full bg-rose-600 text-white hover:bg-rose-700'
        }
        onClick={handleSubmit}
        disabled={isSaving || amount <= 0 || isFormBlocked}
      >
        {isSaving
          ? 'Recording...'
          : isBlockedByRollout
            ? 'Monthly Rollout Required'
            : category === 'Depreciation'
              ? 'Record Asset Depreciation'
              : category === 'Profit Distribution'
                ? 'Record Profit Distribution'
                : 'Record Expense'}
      </Button>
    </Flex>
  );
};
