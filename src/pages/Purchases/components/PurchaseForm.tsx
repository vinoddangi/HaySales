import React, { useState } from 'react';
import { isTransactionMonthLocked } from '../../../api';
import { VALID_CROP_ITEMS } from '../../../business/monthlyRolloutBusiness';
import { calculatePurchaseRate } from '../../../business/purchasesBusiness';
import {
  BackupWarningBanner,
  Button,
  Input,
  RolloutWarningBanner,
  SelectField,
  SummaryBox,
  SummaryRow,
} from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { MonthlyRolloutStatus } from '../../../types';
import { formatRupee } from '../../../utils/formatters';

export interface PurchaseFormProps {
  isSaving: boolean;
  hasPendingBackup?: boolean;
  rolloutStatus?: MonthlyRolloutStatus | null;
  currentYear?: number;
  onSubmit: (_data: {
    item: string;
    weightKg: number;
    amount: number;
    cashPaid: number;
    vendorName?: string;
    note?: string;
    date: string;
  }) => Promise<void>;
}

const ITEM_OPTIONS = [
  { value: '', label: 'Select type' },
  ...VALID_CROP_ITEMS.map((c) => ({ value: c, label: c })),
];

export const PurchaseForm: React.FC<PurchaseFormProps> = ({
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
  const [weightKg, setWeightKg] = useState(0);
  const [amount, setAmount] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [allCash, setAllCash] = useState(true);
  const [vendorName, setVendorName] = useState('');
  const [note, setNote] = useState('');

  const selectedYear = new Date(date).getFullYear();
  const isCYSelected = !isNaN(selectedYear) && selectedYear >= currentYear;
  const isBlockedByBackup = hasPendingBackup && isCYSelected;
  const isBlockedByRollout = isTransactionMonthLocked(date, rolloutStatus);
  const isFormBlocked = isBlockedByBackup || isBlockedByRollout;

  const avgRate = calculatePurchaseRate(amount, weightKg);
  const effectiveCashPaid = allCash ? amount : cashPaid;

  const handleSubmit = async () => {
    if (!selectedItem || amount <= 0 || isFormBlocked) return;
    await onSubmit({
      item: selectedItem,
      weightKg,
      amount,
      cashPaid: effectiveCashPaid,
      vendorName: vendorName.trim() || undefined,
      note: note.trim() || undefined,
      date,
    });
    // Reset form
    setSelectedItem('');
    setWeightKg(0);
    setAmount(0);
    setCashPaid(0);
    setAllCash(true);
    setVendorName('');
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
          label="Item / Crop Type"
          required
          value={selectedItem}
          options={ITEM_OPTIONS}
          onChange={(e) => setSelectedItem(e.target.value)}
        />
      </Grid>

      <Grid columns={2} gap="md" fullWidth>
        <Input
          label="Weight (kg)"
          type="number"
          required
          placeholder="0"
          value={weightKg || ''}
          onChange={(e) => setWeightKg(Number(e.target.value))}
        />
        <Input
          label="Purchase Amount (₹)"
          type="number"
          required
          placeholder="0"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </Grid>

      <Input
        label="Supplier / Farmer Name (Optional)"
        type="text"
        placeholder="e.g. Ramesh Patel, Mandi Trader"
        value={vendorName}
        onChange={(e) => setVendorName(e.target.value)}
      />

      {/* Payment Settlement */}
      <Flex direction="column" gap="sm" fullWidth>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-m3-on-surface">
          <input
            type="checkbox"
            checked={allCash}
            onChange={(e) => setAllCash(e.target.checked)}
            className="h-4 w-4 rounded border-m3-outline text-m3-primary"
          />
          Paid in Full (100% Cash Paid)
        </label>

        {!allCash && (
          <Input
            label="Cash Paid Now (₹)"
            type="number"
            placeholder="0"
            value={cashPaid || ''}
            onChange={(e) => setCashPaid(Number(e.target.value))}
          />
        )}
      </Flex>

      <Input
        label="Remarks / Note (Optional)"
        type="text"
        placeholder="e.g. Lot #12, 14% moisture, direct from farm"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* Summary Box */}
      <SummaryBox>
        <SummaryRow
          label="Avg Buy Rate:"
          value={`${formatRupee(avgRate)}/kg`}
        />
        <SummaryRow label="Total Cost:" value={formatRupee(amount)} />
        <SummaryRow
          label="Cash Paid:"
          value={formatRupee(effectiveCashPaid)}
          isTotal
          className="text-amber-600 dark:text-amber-400"
        />
      </SummaryBox>

      <Button
        variant="filled"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSaving || !selectedItem || amount <= 0 || isFormBlocked}
      >
        {isSaving
          ? 'Recording...'
          : isBlockedByBackup
            ? `Backup Required for ${currentYear}`
            : isBlockedByRollout
              ? 'Monthly Rollout Required'
              : 'Record Stock Purchase'}
      </Button>
    </Flex>
  );
};
