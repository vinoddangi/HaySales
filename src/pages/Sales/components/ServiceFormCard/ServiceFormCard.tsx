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
import { ServiceCategory, VALID_SERVICE_CATEGORIES } from '../../../../models';
import { formatRupee, getTodayDateString } from '../../../../utils/formatters';
import './ServiceFormCard.css';

export interface ServiceFormData {
  category: ServiceCategory;
  amount: number;
  discount?: number;
  cashPaid: number;
  date: string;
  note?: string;
}

export interface ServiceFormCardProps {
  outstandingDue: number;
  creditLimit: number;
  isSaving: boolean;
  onSubmit: (_data: ServiceFormData) => Promise<void>;
  onDataChange?: (
    _key: keyof ServiceFormData,
    _value: any,
    _allValues: ServiceFormData,
  ) => void;
}

const SERVICE_OPTIONS = [
  { value: '', label: 'Select' },
  ...VALID_SERVICE_CATEGORIES.map((s) => ({ value: s, label: s })),
];

interface ServiceFormState {
  date: string;
  category: string;
  amount: number;
  discount: number;
  cashPaid: number;
  allCash: boolean;
  note: string;
}

export const ServiceFormCard: React.FC<ServiceFormCardProps> = ({
  outstandingDue,
  creditLimit,
  isSaving,
  onSubmit,
  onDataChange,
}) => {
  const form = useForm<ServiceFormState>({
    initialValues: {
      date: getTodayDateString(),
      category: '',
      amount: 0,
      discount: 0,
      cashPaid: 0,
      allCash: false,
      note: '',
    },
    validate: (vals) => Boolean(vals.category && vals.amount > 0),
    isSaving,
    onDataChange: (key, val, allVals) => {
      onDataChange?.(
        key as keyof ServiceFormData,
        val,
        allVals as unknown as ServiceFormData,
      );
    },
    onSubmit: async (vals) => {
      const effectiveCashPaid = vals.allCash ? vals.amount : vals.cashPaid;
      await onSubmit({
        category: vals.category as ServiceCategory,
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
  const isOverCreditLimit = newOutstandingDue > creditLimit;

  return (
    <Form form={form} className="hs-service-form-card">
      <Text
        variant="title-sm"
        weight="bold"
        className="hs-service-form-card__section-title"
      >
        Record Service Income
      </Text>

      {/* 1. Date and Service Item */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <DatePicker
            label="Service Date"
            required
            value={values.date}
            onChange={(val) => setValue('date', val)}
          />
        </Grid.Item>
        <Grid.Item>
          <Select
            label="Service Type"
            required
            value={values.category}
            options={SERVICE_OPTIONS}
            onChange={(val) => setValue('category', val)}
          />
        </Grid.Item>
      </Grid>

      {/* 2. Amount and Discount */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <TextField
            label="Amount (₹)"
            type="number"
            required
            placeholder="0"
            value={values.amount ? String(values.amount) : ''}
            onChange={(val) => setValue('amount', Number(val) || 0)}
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

      {/* 3. Full Cash Payment Checkbox (Row layout matching Payment Form) */}
      <Flex align="center" justify="between" fullWidth>
        <Checkbox
          label="Full Cash Payment (All Cash)"
          checked={values.allCash}
          onChange={(checked) => setValue('allCash', checked)}
        />
      </Flex>

      {/* 4. Cash Paid (when not all cash) */}
      {!values.allCash && (
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
        label="Remarks / Note (Optional)"
        type="text"
        placeholder="e.g. Village trip, threshing, driver"
        value={values.note}
        onChange={(val) => setValue('note', val)}
      />

      {/* 6. Summary Box */}
      <Form.Summary>
        <Form.Summary.Row
          label="Service Fee:"
          value={formatRupee(values.amount)}
        />
        <Form.Summary.Row
          label="Cash Received:"
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
          label="Added to Dues:"
          value={formatRupee(remainingDue)}
        />
        <Form.Summary.Row
          label="New Customer Total Due:"
          value={formatRupee(newOutstandingDue)}
          sentiment={newOutstandingDue > 0 ? 'negative' : 'neutral'}
        />
      </Form.Summary>

      {/* 7. Credit Warning */}
      {remainingDue > 0 && isOverCreditLimit && (
        <div className="hs-service-form-card__warning-box">
          <IconAlertTriangle
            size="sm"
            className="hs-service-form-card__warning-icon"
          />
          <Text variant="body-sm">
            Customer balance ({formatRupee(newOutstandingDue)}) exceeds credit
            limit ({formatRupee(creditLimit)}). Credit service permitted.
          </Text>
        </div>
      )}

      {/* 8. Submit Button */}
      <Form.Submit
        label="Record Service"
        submittingLabel="Recording Service..."
      />
    </Form>
  );
};

export default ServiceFormCard;
