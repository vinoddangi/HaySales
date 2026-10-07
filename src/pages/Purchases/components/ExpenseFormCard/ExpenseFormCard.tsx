import React, { useState } from 'react';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
import { DatePicker } from '../../../../components/DatePicker';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { Text } from '../../../../components/Text';
import { TextField } from '../../../../components/TextField';
import {
  ExpenseCategory,
  INITIAL_ASSETS,
  VALID_EXPENSE_CATEGORIES,
} from '../../../../models';
import { formatRupee, getTodayDateString } from '../../../../utils/formatters';
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
  { value: '', label: 'Select' },
  ...VALID_EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
];

const ASSET_OPTIONS = [
  { value: '', label: 'Select' },
  ...Object.values(INITIAL_ASSETS).map((asset) => ({
    value: asset.id,
    label: `${asset.name} (Value: ${formatRupee(asset.currentBookValue)})`,
  })),
];

export const ExpenseFormCard: React.FC<ExpenseFormCardProps> = ({
  isSaving,
  onSubmit,
}) => {
  const [date, setDate] = useState(() => getTodayDateString());
  const [category, setCategory] = useState<string>('');
  const [targetAssetId, setTargetAssetId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [paidInFull, setPaidInFull] = useState<boolean>(true);
  const [vendorName, setVendorName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const isDepreciation = category === 'Depreciation';
  const isProfitDistribution = category === 'Profit Distribution';

  const effectiveCashPaid = isDepreciation ? 0 : paidInFull ? amount : cashPaid;

  const selectedAsset =
    isDepreciation && targetAssetId ? INITIAL_ASSETS[targetAssetId] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || amount <= 0) return;
    if (isDepreciation && !targetAssetId) return;

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
    setCategory('');
    setTargetAssetId('');
    setAmount(0);
    setCashPaid(0);
    setPaidInFull(true);
    setVendorName('');
    setNote('');
  };

  const isFormValid = Boolean(
    category && amount > 0 && (!isDepreciation || targetAssetId),
  );

  return (
    <form onSubmit={handleSubmit} className="hs-expense-form-card">
      <Text
        variant="title-sm"
        weight="bold"
        className="hs-expense-form-card__section-title"
      >
        Record Operating Farm Expense
      </Text>

      {/* 1. Date and Expense Category */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <DatePicker
            label="Expense Date"
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
              <Text variant="body-sm" appearance="secondary">
                Original Cost: {formatRupee(selectedAsset.purchaseCost)}
              </Text>
              <Text variant="body-sm" weight="bold" sentiment="warning">
                Book Value: {formatRupee(selectedAsset.currentBookValue)}
              </Text>
            </Flex>
          )}
        </div>
      )}

      {/* 3. Profit Distribution Notice */}
      {isProfitDistribution && (
        <div className="hs-expense-form-card__distribution-box">
          <Text
            variant="title-sm"
            weight="bold"
            className="hs-expense-form-card__distribution-title"
          >
            Partner Profit Distribution
          </Text>
          <Text variant="body-sm" appearance="secondary">
            Deducted directly from business Retained Profit and paid out in
            cash.
          </Text>
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
          <Flex align="center" justify="between" fullWidth>
            <Checkbox
              label="Paid in Full (100% Cash Outflow)"
              checked={paidInFull}
              onChange={(checked) => setPaidInFull(checked)}
            />
          </Flex>

          {!paidInFull && (
            <TextField
              label="Cash Paid Now (₹)"
              type="number"
              placeholder="0"
              value={cashPaid ? String(cashPaid) : ''}
              onChange={(val) => setCashPaid(Number(val) || 0)}
            />
          )}

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
          <Text variant="body-sm" appearance="secondary">
            Expense Category:
          </Text>
          <Text variant="body-sm" weight="bold">
            {category || '—'}
          </Text>
        </div>
        <div className="hs-expense-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Total Outflow:
          </Text>
          <Text variant="body-sm" weight="bold">
            {formatRupee(amount)}
          </Text>
        </div>
        <div className="hs-expense-form-card__summary-row">
          <Text variant="body-sm" appearance="secondary">
            {isDepreciation
              ? 'Asset Value Reduction:'
              : isProfitDistribution
                ? 'Deducted From Retained Profit:'
                : 'Cash Paid:'}
          </Text>
          <Text variant="body-sm" weight="bold" sentiment="negative">
            {isDepreciation
              ? formatRupee(amount)
              : formatRupee(effectiveCashPaid)}
          </Text>
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

export default ExpenseFormCard;
