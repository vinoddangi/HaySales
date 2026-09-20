import React, { useState } from 'react';
import { isTransactionMonthLocked } from '../../../api';
import { calculateSaleTotals } from '../../../business/salesBusiness';
import {
  BackupWarningBanner,
  Button,
  Input,
  RolloutWarningBanner,
  SelectField,
  SummaryBox,
  SummaryRow,
  Text,
} from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { MonthlyRolloutStatus } from '../../../types';
import { formatRupee, SERVICE_ITEMS } from '../../../utils/formatters';

export interface ServiceFormProps {
  outstandingDue: number;
  isCreditAllowed: boolean;
  isSaving: boolean;
  hasPendingBackup?: boolean;
  rolloutStatus?: MonthlyRolloutStatus | null;
  currentYear?: number;
  onSubmit: (_serviceData: {
    item: string;
    amount: number;
    cashPaid: number;
    date: string;
    note?: string;
  }) => Promise<void>;
}

const SERVICE_OPTIONS = [
  { value: '', label: 'Select service' },
  ...SERVICE_ITEMS.map((item) => ({ value: item, label: item })),
];

export const ServiceForm: React.FC<ServiceFormProps> = ({
  outstandingDue,
  isCreditAllowed,
  isSaving,
  hasPendingBackup = false,
  rolloutStatus,
  currentYear = new Date().getFullYear(),
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [selectedItem, setSelectedItem] = useState('');
  const [amount, setAmount] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [allCash, setAllCash] = useState(false);
  const [note, setNote] = useState('');

  const selectedYear = new Date(date).getFullYear();
  const isCYSelected = !isNaN(selectedYear) && selectedYear >= currentYear;
  const isBlockedByBackup = hasPendingBackup && isCYSelected;
  const isBlockedByRollout = isTransactionMonthLocked(date, rolloutStatus);
  const isFormBlocked = isBlockedByBackup || isBlockedByRollout;

  const effectiveCashPaid = allCash ? amount : cashPaid;
  const { remainingDue } = calculateSaleTotals(amount, 0, effectiveCashPaid);
  const newOutstandingDue = outstandingDue + remainingDue;

  const handleSubmit = async () => {
    if (!selectedItem || amount <= 0 || isFormBlocked) return;
    await onSubmit({
      item: selectedItem,
      amount,
      cashPaid: effectiveCashPaid,
      date,
      note: note.trim() || undefined,
    });
    // Reset form
    setSelectedItem('');
    setAmount(0);
    setCashPaid(0);
    setAllCash(false);
    setNote('');
  };

  return (
    <Flex direction="column" gap="md" fullWidth>
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

      <Grid columns={2} gap="md" fullWidth>
        <Input
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <SelectField
          label="Service Item"
          required
          value={selectedItem}
          options={SERVICE_OPTIONS}
          onChange={(e) => setSelectedItem(e.target.value)}
        />
      </Grid>

      <Grid columns={1} smColumns={2} gap="md" fullWidth>
        <Input
          label="Amount (₹)"
          type="number"
          required
          placeholder="0"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <Input
          label="Remarks / Note (Optional)"
          type="text"
          placeholder="e.g. Trip to village, harvest work"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Grid>

      {/* All Cash Checkbox */}
      <Flex direction="column" gap="sm" fullWidth>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-m3-on-surface">
          <input
            type="checkbox"
            checked={allCash}
            onChange={(e) => setAllCash(e.target.checked)}
            className="h-4 w-4 rounded border-m3-outline text-m3-primary"
          />
          All Cash (Paid immediately)
        </label>

        {!allCash && (
          <Input
            label="Cash Paid (₹)"
            type="number"
            placeholder="0"
            value={cashPaid || ''}
            onChange={(e) => setCashPaid(Number(e.target.value))}
          />
        )}
      </Flex>

      {/* Summary Box */}
      <SummaryBox>
        <SummaryRow label="Total Service Fee:" value={formatRupee(amount)} />
        <SummaryRow label="Cash Paid:" value={formatRupee(effectiveCashPaid)} />
        <SummaryRow label="Added to Dues:" value={formatRupee(remainingDue)} />
        <SummaryRow
          label="New Total Due:"
          value={formatRupee(newOutstandingDue)}
          isTotal
          isHighlight
        />
      </SummaryBox>

      {remainingDue > 0 && !isCreditAllowed && (
        <Text variant="body-sm" color="warning" weight="medium">
          ⚠️ Customer balance exceeds credit limit indicator (credit service
          permitted).
        </Text>
      )}

      <Button
        variant="filled"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSaving || !selectedItem || amount <= 0 || isFormBlocked}
      >
        {isSaving
          ? 'Processing...'
          : isBlockedByBackup
            ? `Backup Required for ${currentYear}`
            : isBlockedByRollout
              ? 'Monthly Rollout Required'
              : 'Record Service'}
      </Button>
    </Flex>
  );
};
