import React, { useState } from 'react';
import { Button } from '../../../../components/Button';
import { Checkbox } from '../../../../components/Checkbox';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { TextField } from '../../../../components/TextField';
import { formatRupee } from '../../../../utils/formatters';
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
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [allDueClear, setAllDueClear] = useState<boolean>(false);

  const effectivePaymentAmount =
    allDueClear && paymentAmount === 0 ? outstandingDue : paymentAmount;
  const discountDuringPayment =
    allDueClear && paymentAmount > 0
      ? Math.max(0, outstandingDue - paymentAmount)
      : 0;
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
      <span className="hs-ledger-payment-form__title">
        Record Account Payment
      </span>

      {/* 1. Date */}
      <TextField
        label="Payment Date"
        type="date"
        required
        value={date}
        onChange={(val) => setDate(val)}
      />

      {/* 2. All Due Clear Checkbox */}
      <Flex align="center" justify="between" fullWidth>
        <Checkbox
          label="Settle Entire Balance (All Due Clear)"
          checked={allDueClear}
          onChange={(checked) => setAllDueClear(checked)}
        />
      </Flex>

      {/* 3. Payment Amount and Discount */}
      <Grid columns={2} gap="md" fullWidth>
        <Grid.Item>
          <TextField
            label="Amount Paid (₹)"
            type="number"
            required={!allDueClear}
            placeholder="0"
            disabled={allDueClear && paymentAmount === 0}
            value={paymentAmount ? String(paymentAmount) : ''}
            onChange={(val) => setPaymentAmount(Number(val) || 0)}
          />
        </Grid.Item>
        <Grid.Item>
          <TextField
            label="Discount Given (₹)"
            type="text"
            disabled
            value={formatRupee(discountDuringPayment)}
          />
        </Grid.Item>
      </Grid>

      {/* 4. Summary Box */}
      <div className="hs-ledger-payment-form__summary">
        <div className="hs-ledger-payment-form__summary-row">
          <span className="hs-ledger-payment-form__summary-label">
            Current Outstanding Due:
          </span>
          <span className="hs-ledger-payment-form__summary-value">
            {formatRupee(outstandingDue)}
          </span>
        </div>
        <div className="hs-ledger-payment-form__summary-row">
          <span className="hs-ledger-payment-form__summary-label">
            Payment Applied:
          </span>
          <span className="hs-ledger-payment-form__summary-value hs-ledger-payment-form__summary-value--highlight">
            -{formatRupee(effectivePaymentAmount)}
          </span>
        </div>
        {discountDuringPayment > 0 && (
          <div className="hs-ledger-payment-form__summary-row">
            <span className="hs-ledger-payment-form__summary-label">
              Discount Waived:
            </span>
            <span className="hs-ledger-payment-form__summary-value">
              -{formatRupee(discountDuringPayment)}
            </span>
          </div>
        )}
        <div className="hs-ledger-payment-form__summary-row">
          <span className="hs-ledger-payment-form__summary-label">
            New Balance Due:
          </span>
          <span className="hs-ledger-payment-form__summary-value">
            {formatRupee(newOutstandingDue)}
          </span>
        </div>
      </div>

      {/* 5. Submit Button */}
      <Button
        variant="filled"
        type="submit"
        disabled={isPaying || !isFormValid}
      >
        {isPaying ? 'Processing Payment...' : 'Process Payment'}
      </Button>
    </form>
  );
};
