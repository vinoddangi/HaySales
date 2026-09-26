import React, { useState } from 'react';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { TextField } from '../../../../components/TextField';
import {
  ExpenseCategory,
  INITIAL_ASSETS,
  VALID_EXPENSE_CATEGORIES,
} from '../../../../models';
import { formatRupee } from '../../../../utils/formatters';
import './ExpenseFormCard.css';

export interface ExpenseFormData {
  category: ExpenseCategory;
  amount: number;
  cashPaid: number;
  vendorName?: string;
  note?: string;
  date: string;
  targetAssetId?: string;
}

export interface ExpenseFormCardProps {
  isSaving: boolean;
  onSubmit: (_data: ExpenseFormData) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select Expense Category' },
  ...VALID_EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
];

const ASSET_OPTIONS = Object.values(INITIAL_ASSETS).map((asset) => ({
  value: asset.id,
  label: `${asset.name} (Value: ${formatRupee(asset.currentBookValue)})`,
}));

export const ExpenseFormCard: React.FC<ExpenseFormCardProps> = ({
  isSaving,
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [category, setCategory] = useState<string>('Fuel');
  const [targetAssetId, setTargetAssetId] = useState<string>('asset_pickup');
  const [amount, setAmount] = useState<number>(0);
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [paidInFull, setPaidInFull] = useState<boolean>(true);
  const [vendorName, setVendorName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const isDepreciation = category === 'Depreciation';
  const isProfitDistribution = category === 'Profit Distribution';

  const effectiveCashPaid = isDepreciation ? 0 : paidInFull ? amount : cashPaid;

  const selectedAsset = isDepreciation
    ? INITIAL_ASSETS[targetAssetId] || Object.values(INITIAL_ASSETS)[0]
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || amount <= 0) return;

    await onSubmit({
      category: category as ExpenseCategory,
      amount,
      cashPaid: effectiveCashPaid,
      vendorName: vendorName.trim() || undefined,
      note: note.trim() || undefined,
      date,
      targetAssetId: isDepreciation ? targetAssetId : undefined,
    });

    // Reset form
    setAmount(0);
    setCashPaid(0);
    setPaidInFull(true);
    setVendorName('');
    setNote('');
  };

  const isFormValid = Boolean(category && amount > 0);

  return (
    <form onSubmit={handleSubmit} className="hs-expense-form-card">
      <h3 className="hs-expense-form-card__section-title">
        Record Operating Farm Expense
      </h3>

      {/* 1. Date and Expense Category */}
      <Grid columns={1} smColumns={2} gap="sm" fullWidth>
        <Grid.Item>
          <TextField
            label="Expense Date"
            type="date"
            required
            value={date}
            onChange={(val) => setDate(val)}
          />
        </Grid.Item>
        <Grid.Item>
          <Select
            label="Expense Category"
            required
            value={category}
            options={CATEGORY_OPTIONS}
            onChange={(val) => setCategory(val)}
          />
        </Grid.Item>
      </Grid>

      {/* 2. Depreciation Asset Selector if category is Depreciation */}
      {isDepreciation && (
        <div className="hs-expense-form-card__depreciation-box">
          <Select
            label="Select Fixed Asset to Depreciate"
            required
            value={targetAssetId}
            options={ASSET_OPTIONS}
            onChange={(val) => setTargetAssetId(val)}
          />
          {selectedAsset && (
            <Flex justify="between" fullWidth>
              <span className="text-m3-on-surface-variant text-xs">
                Original Cost: {formatRupee(selectedAsset.purchaseCost)}
              </span>
              <span className="text-xs font-bold text-amber-700">
                Book Value: {formatRupee(selectedAsset.currentBookValue)}
              </span>
            </Flex>
          )}
        </div>
      )}

      {/* 3. Profit Distribution Notice */}
      {isProfitDistribution && (
        <div className="hs-expense-form-card__distribution-box">
          <span className="hs-expense-form-card__distribution-title">
            Partner Profit Distribution
          </span>
          <span className="hs-expense-form-card__distribution-text">
            Deducted directly from business Retained Profit and paid out in
            cash.
          </span>
        </div>
      )}

      {/* 4. Expense Amount */}
      <TextField
        label={
          isDepreciation
            ? 'Depreciation Written Down (₹)'
            : 'Expense Amount (₹)'
        }
        type="number"
        required
        placeholder="0"
        value={amount ? String(amount) : ''}
        onChange={(val) => setAmount(Number(val) || 0)}
      />

      {/* 5. Settlement (Operational expenses only) */}
      {!isDepreciation && !isProfitDistribution && (
        <>
          <Flex direction="column" gap="sm" fullWidth>
            <Checkbox
              label="Paid in Full (100% Cash Outflow)"
              checked={paidInFull}
              onChange={(checked) => setPaidInFull(checked)}
            />

            {!paidInFull && (
              <TextField
                label="Cash Paid Now (₹)"
                type="number"
                placeholder="0"
                value={cashPaid ? String(cashPaid) : ''}
                onChange={(val) => setCashPaid(Number(val) || 0)}
              />
            )}
          </Flex>

          <TextField
            label="Paid To / Person / Station (Optional)"
            type="text"
            placeholder="e.g. Indian Oil Pump, Tractor Driver, Mandi"
            value={vendorName}
            onChange={(val) => setVendorName(val)}
          />
        </>
      )}

      {/* 6. Description / Note */}
      <TextField
        label="Description / Note (Optional)"
        type="text"
        placeholder={
          isProfitDistribution
            ? 'e.g. Partner profit withdrawal'
            : isDepreciation
              ? 'e.g. Annual wear and tear write down'
              : 'e.g. 50 Liters diesel for pump, Monthly repair'
        }
        value={note}
        onChange={(val) => setNote(val)}
      />

      {/* 7. Summary Box */}
      <div className="hs-expense-form-card__summary">
        <div className="hs-expense-form-card__summary-row">
          <span className="hs-expense-form-card__summary-label">
            Expense Category:
          </span>
          <span className="hs-expense-form-card__summary-value">
            {category}
          </span>
        </div>
        <div className="hs-expense-form-card__summary-row">
          <span className="hs-expense-form-card__summary-label">
            Total Outflow:
          </span>
          <span className="hs-expense-form-card__summary-value">
            {formatRupee(amount)}
          </span>
        </div>
        <div className="hs-expense-form-card__summary-row">
          <span className="hs-expense-form-card__summary-label">
            {isDepreciation
              ? 'Asset Value Reduction:'
              : isProfitDistribution
                ? 'Deducted From Retained Profit:'
                : 'Cash Paid:'}
          </span>
          <span className="hs-expense-form-card__summary-value hs-expense-form-card__summary-value--highlight">
            {isDepreciation
              ? formatRupee(amount)
              : formatRupee(effectiveCashPaid)}
          </span>
        </div>
      </div>

      {/* 8. Action Button */}
      <Button
        variant="filled"
        type="submit"
        disabled={isSaving || !isFormValid}
      >
        {isSaving
          ? 'Recording Expense...'
          : isDepreciation
            ? 'Record Asset Depreciation'
            : isProfitDistribution
              ? 'Record Profit Distribution'
              : 'Record Expense'}
      </Button>
    </form>
  );
};
