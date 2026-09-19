import React, { useState } from 'react';
import {
  BackupWarningBanner,
  Button,
  Input,
  SummaryBox,
  SummaryRow,
} from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { formatRupee } from '../../../utils/formatters';

export interface PaymentFormProps {
  outstandingDue: number;
  isSaving: boolean;
  hasPendingBackup?: boolean;
  currentYear?: number;
  onSubmit: (_effectivePaymentAmount: number, _date?: string) => Promise<void>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  outstandingDue,
  isSaving,
  hasPendingBackup = false,
  currentYear = new Date().getFullYear(),
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [allDueClear, setAllDueClear] = useState(false);

  const selectedYear = new Date(date).getFullYear();
  const isCYSelected = !isNaN(selectedYear) && selectedYear >= currentYear;
  const isBlockedByBackup = hasPendingBackup && isCYSelected;

  const discountDuringPayment = allDueClear
    ? Math.max(0, outstandingDue - paymentAmount)
    : 0;
  const effectivePaymentAmount = allDueClear ? outstandingDue : paymentAmount;
  const newOutstandingDue = Math.max(
    0,
    outstandingDue - effectivePaymentAmount,
  );

  const handleSubmit = async () => {
    if (effectivePaymentAmount <= 0 || isBlockedByBackup) return;
    await onSubmit(effectivePaymentAmount, date);
    setPaymentAmount(0);
    setAllDueClear(false);
  };

  return (
    <Flex direction="column" gap="md" fullWidth>
      {/* Banner if CY selected and previous year backup is pending */}
      {isBlockedByBackup && (
        <BackupWarningBanner currentYear={currentYear} isFormBanner />
      )}

      {/* Date Field */}
      <Input
        label="Payment Date"
        type="date"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* All Due Clear Checkbox */}
      <Flex direction="column" gap="sm" fullWidth>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-m3-on-surface">
          <input
            type="checkbox"
            checked={allDueClear}
            onChange={(e) => setAllDueClear(e.target.checked)}
            className="h-4 w-4 rounded border-m3-outline text-m3-primary"
          />
          All Due Clear (Settles entire balance)
        </label>

        <Grid columns={2} gap="md" fullWidth>
          <Input
            label="Amount Paid (₹)"
            type="number"
            required={!allDueClear}
            placeholder="0"
            value={paymentAmount || ''}
            disabled={allDueClear}
            max={outstandingDue}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
          />
          <Input
            label="Discount Given (₹)"
            type="text"
            readOnly
            value={formatRupee(discountDuringPayment)}
            className="bg-m3-surface-container-high font-bold text-emerald-600 opacity-90"
          />
        </Grid>
      </Flex>

      <SummaryBox>
        <SummaryRow
          label="Outstanding Due:"
          value={formatRupee(outstandingDue)}
        />
        <SummaryRow
          label="Payment Applied:"
          value={`-${formatRupee(effectivePaymentAmount)}`}
          className="font-bold text-emerald-600 dark:text-emerald-400"
        />
        <SummaryRow
          label="New Balance Due:"
          value={formatRupee(newOutstandingDue)}
          isTotal
          isHighlight
        />
      </SummaryBox>

      <Button
        variant="filled"
        className="w-full"
        onClick={handleSubmit}
        disabled={
          isSaving ||
          effectivePaymentAmount <= 0 ||
          effectivePaymentAmount > outstandingDue ||
          isBlockedByBackup
        }
      >
        {isSaving
          ? 'Processing...'
          : isBlockedByBackup
            ? `Backup Required for ${currentYear}`
            : 'Process Payment'}
      </Button>
    </Flex>
  );
};
