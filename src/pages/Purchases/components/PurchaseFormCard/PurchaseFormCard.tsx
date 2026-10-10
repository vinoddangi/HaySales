import React from 'react';
import { Checkbox } from '../../../../components/Checkbox';
import { DatePicker } from '../../../../components/DatePicker';
import { Form, useForm } from '../../../../components/Form';
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
  { value: '', label: 'Select' },
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

  const { values, setValue } = form;
  const effectiveCashPaid = values.paidInFull ? values.amount : values.cashPaid;
  const avgRate =
    values.weight > 0 && values.amount > 0 ? values.amount / values.weight : 0;

  return (
    <Form form={form} className="hs-purchase-form-card">
      <Text
        variant="title-sm"
        weight="bold"
        className="hs-purchase-form-card__section-title"
      >
        Record Stock Purchase
      </Text>

      {/* 1. Date and Crop Type */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <DatePicker
            label="Purchase Date"
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

      {/* 2. Weight (Kg) and Purchase Amount (₹) */}
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
            label="Purchase Amount (₹)"
            type="number"
            required
            placeholder="0"
            value={values.amount ? String(values.amount) : ''}
            onChange={(val) => setValue('amount', Number(val) || 0)}
          />
        </Grid.Item>
      </Grid>

      {/* 3. Supplier / Farmer Name */}
      <TextField
        label="Supplier Name (Optional)"
        type="text"
        placeholder="e.g. Ramesh Patel, Mandi Trader"
        value={values.vendorName}
        onChange={(val) => setValue('vendorName', val)}
      />

      {/* 4. Payment Settlement Checkbox */}
      <Flex align="center" justify="between" fullWidth>
        <Checkbox
          label="Paid in Full (All Cash)"
          checked={values.paidInFull}
          onChange={(checked) => setValue('paidInFull', checked)}
        />
      </Flex>

      {!values.paidInFull && (
        <TextField
          label="Cash Paid (₹)"
          type="number"
          placeholder="0"
          value={values.cashPaid ? String(values.cashPaid) : ''}
          onChange={(val) => setValue('cashPaid', Number(val) || 0)}
        />
      )}

      {/* 5. Remarks / Note */}
      <TextField
        label="Note / Remarks (Optional)"
        type="text"
        placeholder="e.g. Lot #12, 14% moisture, direct from farm"
        value={values.note}
        onChange={(val) => setValue('note', val)}
      />

      {/* 6. Summary Box */}
      <Form.Summary>
        <Form.Summary.Row
          label="Calculated Buying Rate:"
          value={avgRate > 0 ? `${formatRupee(avgRate)} / Kg` : '—'}
        />
        <Form.Summary.Row
          label="Total Purchase Cost:"
          value={`${formatRupee(values.amount)} (${formatWeight(values.weight)})`}
        />
        <Form.Summary.Row
          label="Cash Outflow Now:"
          value={formatRupee(effectiveCashPaid)}
          sentiment="negative"
        />
      </Form.Summary>

      {/* 7. Action Button */}
      <Form.Submit
        label="Record Stock Purchase"
        submittingLabel="Recording Purchase..."
      />
    </Form>
  );
};

export default PurchaseFormCard;
