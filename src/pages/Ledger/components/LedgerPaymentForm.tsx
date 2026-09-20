import React, { useState } from 'react';
import { isTransactionMonthLocked } from '../../../api';
import {
  BackupWarningBanner,
  Button,
  Input,
  RolloutWarningBanner,
  Text,
} from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { MonthlyRolloutStatus } from '../../../types';
import { formatRupee } from '../../../utils/formatters';

export interface LedgerPaymentFormProps {
  outstandingDue: number;
  isPaying: boolean;
  hasPendingBackup?: boolean;
  rolloutStatus?: MonthlyRolloutStatus | null;
  currentYear?: number;
  onPay: (_paymentAmount: number, _date?: string) => Promise<void>;
}

export const LedgerPaymentForm: React.FC<LedgerPaymentFormProps> = ({
  outstandingDue,
  isPaying,
  hasPendingBackup = false,
  rolloutStatus,
  currentYear = new Date().getFullYear(),
  onPay,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [allDueClear, setAllDueClear] = useState(false);

  const selectedYear = new Date(date).getFullYear();
  const isCYSelected = !isNaN(selectedYear) && selectedYear >= currentYear;
  const isBlockedByBackup = hasPendingBackup && isCYSelected;
  const isBlockedByRollout = isTransactionMonthLocked(date, rolloutStatus);
  const isFormBlocked = isBlockedByBackup || isBlockedByRollout;

  const discountDuringPayment = allDueClear
    ? Math.max(0, outstandingDue - paymentAmount)
    : 0;
  const effectivePaymentAmount = allDueClear ? outstandingDue : paymentAmount;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      effectivePaymentAmount <= 0 ||
      isFormBlocked ||
      isPaying ||
      isSubmitting
    )
      return;
    try {
      setIsSubmitting(true);
      await onPay(effectivePaymentAmount, date);
      setPaymentAmount(0);
      setAllDueClear(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      direction="column"
      gap="md"
      fullWidth
      padding="md"
      className="rounded-xl border border-m3-outline-variant bg-m3-surface-container-low"
    >
      <Text variant="caption" color="primary" weight="black">
        Record Payment
      </Text>

      {/* Banner if CY selected and previous year backup is pending */}
      {isBlockedByBackup && (
        <BackupWarningBanner currentYear={currentYear} isFormBanner />
      )}

      {/* Banner if month requires prior rollout */}
      {isBlockedByRollout && (
        <RolloutWarningBanner
          lastRolledOutMonth={rolloutStatus?.lastRolledOutMonth}
          isFormBanner
        />
      )}

      <Input
        label="Payment Date"
        type="date"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Flex
        align="center"
        justify="between"
        fullWidth
        className="border-b border-m3-outline-variant/30 pb-2.5"
      >
        <Text variant="body-sm" color="onSurface" weight="semibold">
          Settle Entire Balance
        </Text>
        <input
          type="checkbox"
          checked={allDueClear}
          onChange={(e) => setAllDueClear(e.target.checked)}
          className="h-4 w-4 rounded border-m3-outline text-m3-primary"
        />
      </Flex>

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

      <Button
        variant="filled"
        className="w-full text-xs"
        onClick={handleSubmit}
        disabled={
          isPaying ||
          effectivePaymentAmount <= 0 ||
          effectivePaymentAmount > outstandingDue ||
          isFormBlocked
        }
      >
        {isPaying
          ? 'Processing...'
          : isBlockedByBackup
            ? `Backup Required for ${currentYear}`
            : isBlockedByRollout
              ? 'Monthly Rollout Required'
              : 'Process Payment'}
      </Button>
    </Flex>
  );
};
