import React from 'react';
import { Checkbox } from '../../../../components/Checkbox';
import { DatePicker } from '../../../../components/DatePicker';
import { Form, useForm } from '../../../../components/Form';
import { IconAlertTriangle } from '../../../../components/Icon';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Select } from '../../../../components/Select';
import { Text } from '../../../../components/Text';
import { TextField } from '../../../../components/TextField';
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
  { value: '', label: 'Select' },
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

  const { values, setValue } = form;
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
    <Form form={form} className="hs-sale-form-card">
      <Text
        variant="title-sm"
        weight="bold"
        className="hs-sale-form-card__section-title"
      >
        Record Crop Sale Invoice
      </Text>

      {/* 1. Date & Crop Type in 2-column Grid */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <DatePicker
            label="Sale Date"
            required
            value={values.date}
            onChange={(val) => setValue('date', val)}
          />
        </Grid.Item>
        <Grid.Item>
          <Select
            label="Crop Type"
            required
            value={values.category}
            options={CROP_OPTIONS}
            onChange={(val) => setValue('category', val as CropCategory)}
          />
        </Grid.Item>
      </Grid>

      {/* 2. Weight (Kg) and Sale Amount (₹) in 2-column Grid */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <TextField
            label="Weight (Kg)"
            type="number"
            required
            placeholder="0"
            value={values.weight ? String(values.weight) : ''}
            onChange={(val) => setValue('weight', Number(val) || 0)}
          />
        </Grid.Item>
        <Grid.Item>
          <TextField
            label="Sale Amount (₹)"
            type="number"
            required
            placeholder="0"
            value={values.amount ? String(values.amount) : ''}
            onChange={(val) => setValue('amount', Number(val) || 0)}
          />
        </Grid.Item>
      </Grid>

      {/* 3. Full Cash Payment Checkbox (Row layout matching Payment Form) */}
      <Flex align="center" justify="between" fullWidth>
        <Checkbox
          label="Full Cash Payment (All Cash)"
          checked={values.allCash}
          onChange={(checked) => setValue('allCash', checked)}
        />
      </Flex>

      {/* 4. Cash Paid and Discount in 2-column Grid */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <TextField
            label="Cash Paid (₹)"
            type="number"
            placeholder="0"
            disabled={values.allCash}
            value={
              values.allCash
                ? values.amount > 0
                  ? String(values.amount)
                  : ''
                : values.cashPaid
                  ? String(values.cashPaid)
                  : ''
            }
            onChange={(val) => setValue('cashPaid', Number(val) || 0)}
          />
        </Grid.Item>
        <Grid.Item>
          <TextField
            label="Discount (₹)"
            type="number"
            placeholder="0"
            value={values.discount ? String(values.discount) : ''}
            onChange={(val) => setValue('discount', Number(val) || 0)}
          />
        </Grid.Item>
      </Grid>

      {/* 5. Remarks / Note */}
      <TextField
        label="Note / Remarks (Optional)"
        type="text"
        placeholder="e.g. Bag count, vehicle number"
        value={values.note}
        onChange={(val) => setValue('note', val)}
      />

      {/* 6. Summary Box */}
      <Form.Summary>
        <Form.Summary.Row
          label="Rate:"
          value={avgRate > 0 ? `${formatRupee(avgRate)} / Kg` : '—'}
        />
        <Form.Summary.Row
          label="Total Amount:"
          value={`${formatRupee(values.amount)} (${formatWeight(values.weight)})`}
        />
        <Form.Summary.Row
          label="Cash Paid:"
          value={formatRupee(effectiveCashPaid)}
          sentiment="positive"
        />
        {values.discount > 0 && (
          <Form.Summary.Row
            label="Discount:"
            value={`-${formatRupee(values.discount)}`}
            sentiment="warning"
          />
        )}
        <Form.Summary.Row
          label="Added Due:"
          value={formatRupee(remainingDue)}
        />
        <Form.Summary.Row
          label="New Total Due:"
          value={formatRupee(newOutstandingDue)}
          sentiment={newOutstandingDue > 0 ? 'negative' : 'neutral'}
        />
      </Form.Summary>

      {/* 7. Credit Warning */}
      {remainingDue > 0 && isOverCreditLimit && (
        <div className="hs-sale-form-card__warning-box">
          <IconAlertTriangle
            size="sm"
            className="hs-sale-form-card__warning-icon"
          />
          <Text variant="body-sm">
            Customer balance ({formatRupee(newOutstandingDue)}) exceeds credit
            limit ({formatRupee(creditLimit)}). Credit sale permitted.
          </Text>
        </div>
      )}

      {/* 8. Submit Button */}
      <Form.Submit label="Process Sale" submittingLabel="Processing Sale..." />
    </Form>
  );
};

export default SaleFormCard;
