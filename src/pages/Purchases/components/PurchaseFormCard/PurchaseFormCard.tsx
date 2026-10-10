import React from 'react';
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
import { useForm } from '../../../../hooks/useForm';
import { CropCategory, VALID_CROP_CATEGORIES } from '../../../../models';
import {
  formatRupee,
  formatWeight,
  getTodayDateString,
} from '../../../../utils/formatters';
import './PurchaseFormCard.css';

export interface PurchaseFormData {
  category: CropCategory;
  weight: number;
  amount: number;
  cashPaid: number;
  vendorName?: string;
  note?: string;
  date: string;
}

export interface PurchaseFormCardProps {
  isSaving: boolean;
  onSubmit: (_data: PurchaseFormData) => Promise<void>;
  onDataChange?: (
    _key: keyof PurchaseFormData,
    _value: any,
    _allValues: PurchaseFormData,
  ) => void;
}

const CROP_OPTIONS = [
  { value: '', label: 'Select Crop' },
  ...VALID_CROP_CATEGORIES.map((crop) => ({ value: crop, label: crop })),
];

interface PurchaseFormState {
  date: string;
  category: CropCategory | '';
  weight: number;
  amount: number;
  cashPaid: number;
  paidInFull: boolean;
  vendorName: string;
  note: string;
}

export const PurchaseFormCard: React.FC<PurchaseFormCardProps> = ({
  isSaving,
  onSubmit,
  onDataChange,
}) => {
  const form = useForm<PurchaseFormState>({
    initialValues: {
      date: getTodayDateString(),
      category: '',
      weight: 0,
      amount: 0,
      cashPaid: 0,
      paidInFull: true,
      vendorName: '',
      note: '',
    },
    validate: (vals) =>
      Boolean(vals.category && vals.amount > 0 && vals.weight > 0),
    isSaving,
    onDataChange: (key, val, allVals) => {
      onDataChange?.(
        key as keyof PurchaseFormData,
        val,
        allVals as unknown as PurchaseFormData,
      );
    },
    onSubmit: async (vals) => {
      const effectiveCashPaid = vals.paidInFull ? vals.amount : vals.cashPaid;
      await onSubmit({
        category: vals.category as CropCategory,
        weight: vals.weight,
        amount: vals.amount,
        cashPaid: effectiveCashPaid,
        vendorName: vals.vendorName.trim() || undefined,
        note: vals.note.trim() || undefined,
        date: vals.date,
      });
      form.reset();
    },
  });

  const { values, setValue, isValid } = form;
  const effectiveCashPaid = values.paidInFull ? values.amount : values.cashPaid;
  const avgRate =
    values.weight > 0 && values.amount > 0 ? values.amount / values.weight : 0;

  return (
    <Card className="hs-purchase-form-card">
      <form onSubmit={form.handleSubmit}>
        <StackLayout gap={2}>
          <Text styleAs="label">
            <b>RECORD STOCK PURCHASE</b>
          </Text>

          {/* 1. Date and Crop Type */}
          <GridLayout columns={2} gap={2}>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Purchase Date</FormFieldLabel>
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
                <FormFieldLabel>Crop Type</FormFieldLabel>
                <select
                  value={values.category}
                  onChange={(e) =>
                    setValue('category', e.target.value as CropCategory)
                  }
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
                  {CROP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </GridItem>
          </GridLayout>

          {/* 2. Weight (Kg) and Purchase Amount (₹) */}
          <GridLayout columns={2} gap={2}>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Weight (Kg)</FormFieldLabel>
                <Input
                  inputProps={{
                    type: 'number',
                    placeholder: '0',
                    value: values.weight ? String(values.weight) : '',
                    onChange: (e) =>
                      setValue('weight', Number(e.target.value) || 0),
                  }}
                />
              </FormField>
            </GridItem>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Purchase Amount (₹)</FormFieldLabel>
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
            </GridItem>
          </GridLayout>

          {/* 3. Supplier Name */}
          <FormField>
            <FormFieldLabel>Supplier Name (Optional)</FormFieldLabel>
            <Input
              inputProps={{
                placeholder: 'e.g. Ramesh Patel, Mandi Trader',
                value: values.vendorName,
                onChange: (e) => setValue('vendorName', e.target.value),
              }}
            />
          </FormField>

          {/* 4. Payment Settlement Checkbox */}
          <Checkbox
            label="Paid in Full (All Cash)"
            checked={values.paidInFull}
            onChange={(e) => setValue('paidInFull', e.target.checked)}
          />

          {!values.paidInFull && (
            <FormField>
              <FormFieldLabel>Cash Paid (₹)</FormFieldLabel>
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

          {/* 5. Remarks / Note */}
          <FormField>
            <FormFieldLabel>Note / Remarks (Optional)</FormFieldLabel>
            <Input
              inputProps={{
                placeholder: 'e.g. Lot #12, 14% moisture, direct from farm',
                value: values.note,
                onChange: (e) => setValue('note', e.target.value),
              }}
            />
          </FormField>

          {/* 6. Summary Card */}
          <Card
            style={{
              backgroundColor: 'var(--salt-container-secondary-background)',
              padding: 'var(--salt-spacing-150)',
            }}
          >
            <StackLayout gap={1}>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Calculated Buying Rate:
                </Text>
                <Text styleAs="notation">
                  <b>{avgRate > 0 ? `${formatRupee(avgRate)} / Kg` : '—'}</b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Total Purchase Cost:
                </Text>
                <Text styleAs="notation">
                  <b>
                    {formatRupee(values.amount)} ({formatWeight(values.weight)})
                  </b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Cash Outflow Now:
                </Text>
                <Text styleAs="notation" color="error">
                  <b>{formatRupee(effectiveCashPaid)}</b>
                </Text>
              </FlexLayout>
            </StackLayout>
          </Card>

          {/* 7. Action Button */}
          <Button
            sentiment="accented"
            type="submit"
            disabled={!isValid || isSaving}
            style={{ width: '100%', height: '44px' }}
          >
            {isSaving ? 'Recording Purchase...' : 'Record Stock Purchase'}
          </Button>
        </StackLayout>
      </form>
    </Card>
  );
};

export default PurchaseFormCard;
