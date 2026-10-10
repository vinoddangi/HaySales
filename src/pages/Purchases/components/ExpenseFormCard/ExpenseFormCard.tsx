import React, { useMemo } from 'react';
import {
  Button,
  Card,
  Checkbox,
  FlexLayout,
  FormField,
  FormFieldLabel,
  GridLayout,
  GridItem,
  Input,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { extractFixedAssetsFromTransactions } from '../../../../business';
import { useForm } from '../../../../hooks/useForm';
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
  { value: '', label: 'Select Expense Category' },
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

  const { values, setValue, isValid } = form;
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
    <Card className="hs-expense-form-card">
      <form onSubmit={form.handleSubmit}>
        <StackLayout gap={2}>
          <Text styleAs="label">
            <b>RECORD OPERATING FARM EXPENSE</b>
          </Text>

          {/* 1. Date and Expense Category */}
          <GridLayout columns={2} gap={2}>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Expense Date</FormFieldLabel>
                <Input
                  inputProps={{
                    type: 'date',
                    value: values.date,
                    onChange: (e) => setValue('date', e.target.value),
                  }}
                />
              </FormField>
            </GridItem>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Expense Category</FormFieldLabel>
                <select
                  value={values.category}
                  onChange={(e) => setValue('category', e.target.value)}
                  style={{
                    width: '100%',
                    height: 'var(--salt-size-base, 36px)',
                    borderRadius: 'var(--salt-palette-corner-rounded, 6px)',
                    border: '1px solid var(--salt-palette-neutral-border)',
                    backgroundColor: 'var(--salt-container-primary-background)',
                    color: 'var(--salt-palette-neutral-primary-foreground)',
                    padding: '0 8px',
                    fontSize: '14px',
                  }}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </GridItem>
          </GridLayout>

          {/* 2. Depreciation Asset Selector if category is Depreciation */}
          {isDepreciation && (
            <StackLayout
              gap={1}
              className="hs-expense-form-card__depreciation-box"
            >
              <FormField necessity="required">
                <FormFieldLabel>
                  Select Fixed Asset to Depreciate
                </FormFieldLabel>
                <select
                  value={values.targetAssetId}
                  onChange={(e) => setValue('targetAssetId', e.target.value)}
                  style={{
                    width: '100%',
                    height: 'var(--salt-size-base, 36px)',
                    borderRadius: 'var(--salt-palette-corner-rounded, 6px)',
                    border: '1px solid var(--salt-palette-neutral-border)',
                    backgroundColor: 'var(--salt-container-primary-background)',
                    color: 'var(--salt-palette-neutral-primary-foreground)',
                    padding: '0 8px',
                    fontSize: '14px',
                  }}
                >
                  {assetOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
              {selectedAsset && (
                <FlexLayout justify="space-between">
                  <Text styleAs="notation" color="secondary">
                    Original Cost: {formatRupee(selectedAsset.purchaseCost)}
                  </Text>
                  <Text styleAs="notation" color="warning">
                    <b>
                      Book Value: {formatRupee(selectedAsset.currentBookValue)}
                    </b>
                  </Text>
                </FlexLayout>
              )}
            </StackLayout>
          )}

          {/* 3. Profit Distribution Notice */}
          {isProfitDistribution && (
            <Card
              style={{
                backgroundColor: 'var(--salt-container-secondary-background)',
                padding: 'var(--salt-spacing-100)',
              }}
            >
              <StackLayout gap={0.5}>
                <Text styleAs="label">
                  <b>Partner Profit Distribution</b>
                </Text>
                <Text styleAs="notation" color="secondary">
                  Deducted directly from business Retained Profit and paid out
                  in cash.
                </Text>
              </StackLayout>
            </Card>
          )}

          {/* 4. Expense Amount */}
          <FormField necessity="required">
            <FormFieldLabel>
              {isDepreciation
                ? 'Depreciation Written Down (₹)'
                : 'Expense Amount (₹)'}
            </FormFieldLabel>
            <Input
              inputProps={{
                type: 'number',
                placeholder: '0',
                value: values.amount ? String(values.amount) : '',
                onChange: (e) =>
                  setValue('amount', Number(e.target.value) || 0),
              }}
            />
          </FormField>

          {/* 5. Settlement (Operational expenses only) */}
          {!isDepreciation && !isProfitDistribution && (
            <>
              <Checkbox
                label="Paid in Full (100% Cash Outflow)"
                checked={values.paidInFull}
                onChange={(e) => setValue('paidInFull', e.target.checked)}
              />

              {!values.paidInFull && (
                <FormField>
                  <FormFieldLabel>Cash Paid Now (₹)</FormFieldLabel>
                  <Input
                    inputProps={{
                      type: 'number',
                      placeholder: '0',
                      value: values.cashPaid ? String(values.cashPaid) : '',
                      onChange: (e) =>
                        setValue('cashPaid', Number(e.target.value) || 0),
                    }}
                  />
                </FormField>
              )}

              <FormField>
                <FormFieldLabel>
                  Paid To / Person / Station (Optional)
                </FormFieldLabel>
                <Input
                  inputProps={{
                    placeholder: 'e.g. Indian Oil Pump, Tractor Driver, Mandi',
                    value: values.vendorName,
                    onChange: (e) => setValue('vendorName', e.target.value),
                  }}
                />
              </FormField>
            </>
          )}

          {/* 6. Description / Note */}
          <FormField>
            <FormFieldLabel>Description / Note (Optional)</FormFieldLabel>
            <Input
              inputProps={{
                placeholder: isProfitDistribution
                  ? 'e.g. Partner profit withdrawal'
                  : isDepreciation
                    ? 'e.g. Annual wear and tear write down'
                    : 'e.g. 50 Liters diesel for pump, Monthly repair',
                value: values.note,
                onChange: (e) => setValue('note', e.target.value),
              }}
            />
          </FormField>

          {/* 7. Summary Card */}
          <Card
            style={{
              backgroundColor: 'var(--salt-container-secondary-background)',
              padding: 'var(--salt-spacing-150)',
            }}
          >
            <StackLayout gap={1}>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Expense Category:
                </Text>
                <Text styleAs="notation">
                  <b>{values.category || '—'}</b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Total Outflow:
                </Text>
                <Text styleAs="notation">
                  <b>{formatRupee(values.amount)}</b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  {isDepreciation
                    ? 'Asset Value Reduction:'
                    : isProfitDistribution
                      ? 'Deducted From Retained Profit:'
                      : 'Cash Paid:'}
                </Text>
                <Text styleAs="notation" color="error">
                  <b>
                    {isDepreciation
                      ? formatRupee(values.amount)
                      : formatRupee(effectiveCashPaid)}
                  </b>
                </Text>
              </FlexLayout>
            </StackLayout>
          </Card>

          {/* 8. Action Button */}
          <Button
            sentiment="accented"
            type="submit"
            disabled={!isValid || isSaving}
            style={{ width: '100%', height: '44px' }}
          >
            {isDepreciation
              ? 'Record Asset Depreciation'
              : isProfitDistribution
                ? 'Record Profit Distribution'
                : isSaving
                  ? 'Recording Expense...'
                  : 'Record Expense'}
          </Button>
        </StackLayout>
      </form>
    </Card>
  );
};

export default ExpenseFormCard;
