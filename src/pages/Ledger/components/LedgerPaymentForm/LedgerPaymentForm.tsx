import React, { useState } from 'react';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
import { DatePicker } from '../../../../components/DatePicker';
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
}

export const LedgerPaymentForm: React.FC<LedgerPaymentFormProps> = ({
  outstandingDue,
  isPaying,
  onPay,
}) => {
  const [date, setDate] = useState(getTodayDateString());
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [allDueClear, setAllDueClear] = useState(false);
  const [discount, setDiscount] = useState<number>(0);

  const effectivePaymentAmount = allDueClear
    ? outstandingDue - discount
    : paymentAmount;
  const discountDuringPayment = discount;
  const totalClearedAmount = effectivePaymentAmount + discountDuringPayment;
  const newOutstandingDue = Math.max(0, outstandingDue - totalClearedAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalClearedAmount <= 0 || isPaying) return;

    await onPay(effectivePaymentAmount, date, discountDuringPayment);
    setPaymentAmount(0);
    setAllDueClear(false);
  };

  const isFormValid =
    totalClearedAmount > 0 && totalClearedAmount <= outstandingDue;

  return (
    <form onSubmit={handleSubmit} className="hs-ledger-payment-form">
      <Text variant="title-sm" weight="bold" sentiment="accent">
        Record Account Payment
      </Text>

      {/* 1. Date */}
      <DatePicker
        label="Payment Date"
        required
        value={date}
        onChange={(val) => setDate(val)}
      />

      {/* 2. Full Clear Checkbox */}
      <Flex align="center" gap="xs">
        <Checkbox
          checked={allDueClear}
          onChange={(checked) => {
            setAllDueClear(checked);
            if (checked) {
              setPaymentAmount(outstandingDue);
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
            disabled={allDueClear}
            value={effectivePaymentAmount ? String(effectivePaymentAmount) : ''}
            onChange={(val) => setPaymentAmount(Math.max(0, Number(val) || 0))}
            supportingText="Cash paid today"
          />
        </Grid.Item>

        <Grid.Item>
          <TextField
            label="Discount Waived (₹)"
            type="number"
            value={discount ? String(discount) : ''}
            onChange={(val) => setDiscount(Math.max(0, Number(val) || 0))}
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
      <div className="hs-ledger-payment-form__summary">
        <div className="hs-ledger-payment-form__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Current Outstanding Due:
          </Text>
          <Text variant="body-sm" weight="bold">
            {formatRupee(outstandingDue)}
          </Text>
        </div>
        <div className="hs-ledger-payment-form__summary-row">
          <Text variant="body-sm" appearance="secondary">
            Payment Applied:
          </Text>
          <Text variant="body-sm" weight="bold" sentiment="positive">
            -{formatRupee(effectivePaymentAmount)}
          </Text>
        </div>
        {discountDuringPayment > 0 && (
          <div className="hs-ledger-payment-form__summary-row">
            <Text variant="body-sm" appearance="secondary">
              Discount Waived:
            </Text>
            <Text variant="body-sm" weight="bold">
              -{formatRupee(discountDuringPayment)}
            </Text>
          </div>
        )}
        <div className="hs-ledger-payment-form__summary-row">
          <Text variant="body-sm" appearance="secondary">
            New Balance Due:
          </Text>
          <Text variant="body-sm" weight="bold">
            {formatRupee(newOutstandingDue)}
          </Text>
        </div>
      </div>

      {/* 5. Submit Button */}
      <Button
        variant="filled"
        type="submit"
        disabled={!isFormValid || isPaying}
        fullWidth
      >
        {isPaying
          ? 'Recording Payment...'
          : `Record Payment of ${formatRupee(effectivePaymentAmount)}`}
      </Button>
    </form>
  );
};

export default LedgerPaymentForm;
