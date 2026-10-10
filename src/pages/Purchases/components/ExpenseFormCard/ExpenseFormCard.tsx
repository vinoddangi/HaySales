import React, { useMemo } from 'react';
import { Checkbox } from '../../../../components/Checkbox';
import { DatePicker } from '../../../../components/DatePicker';
import { Form, useForm } from '../../../../components/Form';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { Text } from '../../../../components/Text';
import { TextField } from '../../../../components/TextField';
import { extractFixedAssetsFromTransactions } from '../../../../business';
import { ExpenseCategory, VALID_EXPENSE_CATEGORIES } from '../../../../models';
import { useGetOperationTransactionsQuery } from '../../../../store/api';
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
  onDataChange?: (
    _key: keyof ExpenseFormData,
    _value: any,
    _allValues: ExpenseFormData,
  ) => void;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select' },
  ...VALID_EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
];

interface ExpenseFormState {
  date: string;
  category: string;
  targetAssetId: string;
  amount: number;
  cashPaid: number;
  paidInFull: boolean;
  vendorName: string;
  note: string;
}

export const ExpenseFormCard: React.FC<ExpenseFormCardProps> = ({
  isSaving,
  onSubmit,
  onDataChange,
}) => {
  const form = useForm<ExpenseFormState>({
    initialValues: {
      date: getTodayDateString(),
      category: '',
      targetAssetId: '',
      amount: 0,
      cashPaid: 0,
      paidInFull: true,
      vendorName: '',
      note: '',
    },
    validate: (vals) => {
      const isDep = vals.category === 'Depreciation';
      return Boolean(
        vals.category && vals.amount > 0 && (!isDep || vals.targetAssetId),
      );
    },
    isSaving,
    onDataChange: (key, val, allVals) => {
      onDataChange?.(
        key as keyof ExpenseFormData,
        val,
        allVals as unknown as ExpenseFormData,
      );
    },
    onSubmit: async (vals) => {
      const isDep = vals.category === 'Depreciation';
      const effectiveCashPaid = isDep
        ? 0
        : vals.paidInFull
          ? vals.amount
          : vals.cashPaid;
      await onSubmit({
        category: vals.category as ExpenseCategory,
        amount: vals.amount,
        cashPaid: effectiveCashPaid,
        vendorName: vals.vendorName.trim() || undefined,
        note: vals.note.trim() || undefined,
        date: vals.date,
        targetAssetId: isDep ? vals.targetAssetId : undefined,
      });
      form.reset();
    },
  });

  const { data: opTransactions = [] } = useGetOperationTransactionsQuery();
  const availableAssets = useMemo(
    () => extractFixedAssetsFromTransactions(opTransactions),
    [opTransactions],
  );

  const assetOptions = useMemo(
    () => [
      { value: '', label: 'Select Fixed Asset' },
      ...availableAssets.map((asset) => ({
        value: asset.id,
        label: `${asset.name} (Value: ${formatRupee(asset.currentBookValue)})`,
      })),
    ],
    [availableAssets],
  );

  const { values, setValue } = form;
  const isDepreciation = values.category === 'Depreciation';
  const isProfitDistribution = values.category === 'Profit Distribution';
  const effectiveCashPaid = isDepreciation
    ? 0
    : values.paidInFull
      ? values.amount
      : values.cashPaid;
  const selectedAsset =
    isDepreciation && values.targetAssetId
      ? availableAssets.find((a) => a.id === values.targetAssetId) || null
      : null;

  return (
    <Form form={form} className="hs-expense-form-card">
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
            value={values.date}
            onChange={(val) => setValue('date', val)}
          />
        </Grid.Item>
        <Grid.Item>
          <Select
            label="Expense Category"
            required
            value={values.category}
            options={CATEGORY_OPTIONS}
            onChange={(val) => setValue('category', val)}
          />
        </Grid.Item>
      </Grid>

      {/* 2. Depreciation Asset Selector if category is Depreciation */}
      {isDepreciation && (
        <div className="hs-expense-form-card__depreciation-box">
          <Select
            label="Select Fixed Asset to Depreciate"
            required
            value={values.targetAssetId}
            options={assetOptions}
            onChange={(val) => setValue('targetAssetId', val)}
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
        value={values.amount ? String(values.amount) : ''}
        onChange={(val) => setValue('amount', Number(val) || 0)}
      />

      {/* 5. Settlement (Operational expenses only) */}
      {!isDepreciation && !isProfitDistribution && (
        <>
          <Flex align="center" justify="between" fullWidth>
            <Checkbox
              label="Paid in Full (100% Cash Outflow)"
              checked={values.paidInFull}
              onChange={(checked) => setValue('paidInFull', checked)}
            />
          </Flex>

          {!values.paidInFull && (
            <TextField
              label="Cash Paid Now (₹)"
              type="number"
              placeholder="0"
              value={values.cashPaid ? String(values.cashPaid) : ''}
              onChange={(val) => setValue('cashPaid', Number(val) || 0)}
            />
          )}

          <TextField
            label="Paid To / Person / Station (Optional)"
            type="text"
            placeholder="e.g. Indian Oil Pump, Tractor Driver, Mandi"
            value={values.vendorName}
            onChange={(val) => setValue('vendorName', val)}
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
        value={values.note}
        onChange={(val) => setValue('note', val)}
      />

      {/* 7. Summary Box */}
      <Form.Summary>
        <Form.Summary.Row
          label="Expense Category:"
          value={values.category || '—'}
        />
        <Form.Summary.Row
          label="Total Outflow:"
          value={formatRupee(values.amount)}
        />
        <Form.Summary.Row
          label={
            isDepreciation
              ? 'Asset Value Reduction:'
              : isProfitDistribution
                ? 'Deducted From Retained Profit:'
                : 'Cash Paid:'
          }
          value={
            isDepreciation
              ? formatRupee(values.amount)
              : formatRupee(effectiveCashPaid)
          }
          sentiment="negative"
        />
      </Form.Summary>

      {/* 8. Action Button */}
      <Form.Submit
        label={
          isDepreciation
            ? 'Record Asset Depreciation'
            : isProfitDistribution
              ? 'Record Profit Distribution'
              : 'Record Expense'
        }
        submittingLabel="Recording Expense..."
      />
    </Form>
  );
};

export default ExpenseFormCard;
