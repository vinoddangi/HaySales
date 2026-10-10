import React from 'react';
import { Checkbox } from '../../../../components/Checkbox';
import { DatePicker } from '../../../../components/DatePicker';
import { Form, useForm } from '../../../../components/Form';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Text } from '../../../../components/Text';
import { TextField } from '../../../../components/TextField';
import { formatRupee, getTodayDateString } from '../../../../utils/formatters';
import './LedgerPaymentForm.css';

export interface LedgerPaymentFormProps {
  outstandingDue: number;
  isPaying: boolean;
  onPay: (
    _paymentAmount: number,
    _date?: string,
    _discount?: number,
  ) => Promise<void>;
  onDataChange?: (
    _key: 'date' | 'paymentAmount' | 'allDueClear' | 'discount',
    _value: any,
    _allValues: {
      date: string;
      paymentAmount: number;
      allDueClear: boolean;
      discount: number;
    },
  ) => void;
}

interface LedgerPaymentFormState {
  date: string;
  paymentAmount: number;
  allDueClear: boolean;
  discount: number;
}

export const LedgerPaymentForm: React.FC<LedgerPaymentFormProps> = ({
  outstandingDue,
  isPaying,
  onPay,
  onDataChange,
}) => {
  const form = useForm<LedgerPaymentFormState>({
    initialValues: {
      date: getTodayDateString(),
      paymentAmount: 0,
      allDueClear: false,
      discount: 0,
    },
    validate: (vals) => {
      const effectiveAmt = vals.allDueClear
        ? outstandingDue - vals.discount
        : vals.paymentAmount;
      const totalCleared = effectiveAmt + vals.discount;
      return totalCleared > 0 && totalCleared <= outstandingDue;
    },
    isSaving: isPaying,
    onDataChange,
    onSubmit: async (vals) => {
      const effectiveAmt = vals.allDueClear
        ? outstandingDue - vals.discount
        : vals.paymentAmount;
      await onPay(effectiveAmt, vals.date, vals.discount);
      form.reset({
        date: getTodayDateString(),
        paymentAmount: 0,
        allDueClear: false,
        discount: 0,
      });
    },
  });

  const { values, setValue } = form;
  const effectivePaymentAmount = values.allDueClear
    ? outstandingDue - values.discount
    : values.paymentAmount;
  const discountDuringPayment = values.discount;
  const totalClearedAmount = effectivePaymentAmount + discountDuringPayment;
  const newOutstandingDue = Math.max(0, outstandingDue - totalClearedAmount);

  return (
    <Form form={form} className="hs-ledger-payment-form">
      <Text variant="title-sm" weight="bold" sentiment="accent">
        Record Account Payment
      </Text>

      {/* 1. Date */}
      <DatePicker
        label="Payment Date"
        required
        value={values.date}
        onChange={(val) => setValue('date', val)}
      />

      {/* 2. Full Clear Checkbox */}
      <Flex align="center" gap="xs">
        <Checkbox
          checked={values.allDueClear}
          onChange={(checked) => {
            setValue('allDueClear', checked);
            if (checked) {
              setValue('paymentAmount', outstandingDue);
            }
          }}
        />
        <Text variant="body-md" weight="bold">
          Pay Full Outstanding Due ({formatRupee(outstandingDue)})
        </Text>
      </Flex>

      {/* 3. Amounts Grid */}
      <Grid columns={2} gap="sm">
        <Grid.Item>
          <TextField
            label="Payment Received (₹)"
            type="number"
            required
            disabled={values.allDueClear}
            value={effectivePaymentAmount ? String(effectivePaymentAmount) : ''}
            onChange={(val) =>
              setValue('paymentAmount', Math.max(0, Number(val) || 0))
            }
            supportingText="Cash paid today"
          />
        </Grid.Item>

        <Grid.Item>
          <TextField
            label="Discount Waived (₹)"
            type="number"
            value={values.discount ? String(values.discount) : ''}
            onChange={(val) =>
              setValue('discount', Math.max(0, Number(val) || 0))
            }
            supportingText="Write-off / settlement"
          />
        </Grid.Item>

        <Grid.Item span={2}>
          <TextField
            label="Total Balance Cleared (₹)"
            type="text"
            disabled
            value={formatRupee(discountDuringPayment)}
          />
        </Grid.Item>
      </Grid>

      {/* 4. Summary Box */}
      <Form.Summary>
        <Form.Summary.Row
          label="Current Outstanding Due:"
          value={formatRupee(outstandingDue)}
        />
        <Form.Summary.Row
          label="Payment Applied:"
          value={`-${formatRupee(effectivePaymentAmount)}`}
          sentiment="positive"
        />
        {discountDuringPayment > 0 && (
          <Form.Summary.Row
            label="Discount Waived:"
            value={`-${formatRupee(discountDuringPayment)}`}
          />
        )}
        <Form.Summary.Row
          label="New Balance Due:"
          value={formatRupee(newOutstandingDue)}
        />
      </Form.Summary>

      {/* 5. Submit Button */}
      <Form.Submit
        fullWidth
        label={`Record Payment of ${formatRupee(effectivePaymentAmount)}`}
        submittingLabel="Recording Payment..."
      />
    </Form>
  );
};

export default LedgerPaymentForm;
