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
import { AlertTriangle } from 'lucide-react';
import { useForm } from '../../../../hooks/useForm';
import { CropCategory, VALID_CROP_CATEGORIES } from '../../../../models';
import {
  formatRupee,
  formatWeight,
  getTodayDateString,
} from '../../../../utils/formatters';
import './SaleFormCard.css';

export interface SaleFormData {
  category: CropCategory;
  weight: number;
  amount: number;
  discount?: number;
  cashPaid: number;
  date: string;
  note?: string;
}

export interface SaleFormCardProps {
  outstandingDue: number;
  creditLimit: number;
  isSaving: boolean;
  onSubmit: (_data: SaleFormData) => Promise<void>;
  onDataChange?: (
    _key: keyof SaleFormData,
    _value: any,
    _allValues: SaleFormData,
  ) => void;
}

const CROP_OPTIONS = [
  { value: '', label: 'Select Crop' },
  ...VALID_CROP_CATEGORIES.map((crop) => ({ value: crop, label: crop })),
];

interface SaleFormState {
  date: string;
  category: CropCategory | '';
  weight: number;
  amount: number;
  discount: number;
  cashPaid: number;
  allCash: boolean;
  note: string;
}

export const SaleFormCard: React.FC<SaleFormCardProps> = ({
  outstandingDue,
  creditLimit,
  isSaving,
  onSubmit,
  onDataChange,
}) => {
  const form = useForm<SaleFormState>({
    initialValues: {
      date: getTodayDateString(),
      category: '',
      weight: 0,
      amount: 0,
      discount: 0,
      cashPaid: 0,
      allCash: false,
      note: '',
    },
    validate: (vals) =>
      Boolean(vals.category && vals.amount > 0 && vals.weight > 0),
    isSaving,
    onDataChange: (key, val, allVals) => {
      onDataChange?.(
        key as keyof SaleFormData,
        val,
        allVals as unknown as SaleFormData,
      );
    },
    onSubmit: async (vals) => {
      const effectiveCashPaid = vals.allCash ? vals.amount : vals.cashPaid;
      await onSubmit({
        category: vals.category as CropCategory,
        weight: vals.weight,
        amount: vals.amount,
        discount: vals.discount > 0 ? vals.discount : undefined,
        cashPaid: effectiveCashPaid,
        date: vals.date,
        note: vals.note.trim() || undefined,
      });
      form.reset();
    },
  });

  const { values, setValue, isValid } = form;
  const effectiveCashPaid = values.allCash ? values.amount : values.cashPaid;
  const remainingDue = Math.max(
    0,
    values.amount - values.discount - effectiveCashPaid,
  );
  const newOutstandingDue = outstandingDue + remainingDue;
  const avgRate =
    values.weight > 0 && values.amount > 0 ? values.amount / values.weight : 0;
  const isOverCreditLimit = newOutstandingDue > creditLimit;

  return (
    <Card className="hs-sale-form-card">
      <form onSubmit={form.handleSubmit}>
        <StackLayout gap={2}>
          <Text styleAs="label">
            <b>RECORD CROP SALE INVOICE</b>
          </Text>

          {/* 1. Date & Crop Type in 2-column Grid */}
          <GridLayout columns={2} gap={2}>
            <GridItem>
              <FormField necessity="required">
                <FormFieldLabel>Sale Date</FormFieldLabel>
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

          {/* 2. Weight (Kg) and Sale Amount (₹) */}
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
                <FormFieldLabel>Sale Amount (₹)</FormFieldLabel>
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

          {/* 3. Full Cash Payment Checkbox */}
          <Checkbox
            label="Full Cash Payment (All Cash)"
            checked={values.allCash}
            onChange={(e) => setValue('allCash', e.target.checked)}
          />

          {/* 4. Cash Paid and Discount */}
          <GridLayout columns={2} gap={2}>
            <GridItem>
              <FormField>
                <FormFieldLabel>Cash Paid (₹)</FormFieldLabel>
                <Input
                  disabled={values.allCash}
                  inputProps={{
                    type: 'number',
                    placeholder: '0',
                    value: values.allCash
                      ? values.amount > 0
                        ? String(values.amount)
                        : ''
                      : values.cashPaid
                        ? String(values.cashPaid)
                        : '',
                    onChange: (e) =>
                      setValue('cashPaid', Number(e.target.value) || 0),
                  }}
                />
              </FormField>
            </GridItem>
            <GridItem>
              <FormField>
                <FormFieldLabel>Discount (₹)</FormFieldLabel>
                <Input
                  inputProps={{
                    type: 'number',
                    placeholder: '0',
                    value: values.discount ? String(values.discount) : '',
                    onChange: (e) =>
                      setValue('discount', Number(e.target.value) || 0),
                  }}
                />
              </FormField>
            </GridItem>
          </GridLayout>

          {/* 5. Remarks / Note */}
          <FormField>
            <FormFieldLabel>Note / Remarks (Optional)</FormFieldLabel>
            <Input
              inputProps={{
                placeholder: 'e.g. Bag count, vehicle number',
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
                  Rate:
                </Text>
                <Text styleAs="notation">
                  <b>{avgRate > 0 ? `${formatRupee(avgRate)} / Kg` : '—'}</b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Total Amount:
                </Text>
                <Text styleAs="notation">
                  <b>
                    {formatRupee(values.amount)} ({formatWeight(values.weight)})
                  </b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Cash Paid:
                </Text>
                <Text styleAs="notation" color="success">
                  <b>{formatRupee(effectiveCashPaid)}</b>
                </Text>
              </FlexLayout>
              {values.discount > 0 && (
                <FlexLayout justify="space-between">
                  <Text styleAs="notation" color="secondary">
                    Discount:
                  </Text>
                  <Text styleAs="notation" color="warning">
                    <b>-{formatRupee(values.discount)}</b>
                  </Text>
                </FlexLayout>
              )}
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  Added Due:
                </Text>
                <Text styleAs="notation">
                  <b>{formatRupee(remainingDue)}</b>
                </Text>
              </FlexLayout>
              <FlexLayout justify="space-between">
                <Text styleAs="notation" color="secondary">
                  New Total Due:
                </Text>
                <Text
                  styleAs="notation"
                  color={newOutstandingDue > 0 ? 'error' : 'secondary'}
                >
                  <b>{formatRupee(newOutstandingDue)}</b>
                </Text>
              </FlexLayout>
            </StackLayout>
          </Card>

          {/* 7. Credit Warning */}
          {remainingDue > 0 && isOverCreditLimit && (
            <FlexLayout
              align="center"
              gap={1}
              style={{
                padding: 'var(--salt-spacing-100)',
                backgroundColor:
                  'var(--salt-status-warning-background, #fff8e1)',
                borderRadius: 'var(--salt-palette-corner-rounded, 6px)',
              }}
            >
              <AlertTriangle
                size={18}
                color="var(--salt-status-warning-foreground, #b78103)"
              />
              <Text styleAs="notation">
                Customer balance ({formatRupee(newOutstandingDue)}) exceeds
                credit limit ({formatRupee(creditLimit)}). Credit sale
                permitted.
              </Text>
            </FlexLayout>
          )}

          {/* 8. Submit Button */}
          <Button
            sentiment="accented"
            type="submit"
            disabled={!isValid || isSaving}
            style={{ width: '100%', height: '44px' }}
          >
            {isSaving ? 'Processing Sale...' : 'Process Sale'}
          </Button>
        </StackLayout>
      </form>
    </Card>
  );
};

export default SaleFormCard;
