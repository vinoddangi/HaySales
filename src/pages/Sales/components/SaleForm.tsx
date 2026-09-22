import React, { useState } from 'react';
import { isTransactionMonthLocked } from '../../../api';
import { VALID_CROP_ITEMS } from '../../../business/monthlyRolloutBusiness';
import { calculateSaleTotals } from '../../../business/salesBusiness';
import {
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
import { formatRupee } from '../../../utils/formatters';

export interface SaleFormProps {
  outstandingDue: number;
  isCreditAllowed: boolean;
  isSaving: boolean;
  rolloutStatus?: MonthlyRolloutStatus | null;
  onSubmit: (_saleData: {
    item: string;
    weightKg: number;
    amount: number;
    cashPaid: number;
    date: string;
  }) => Promise<void>;
}

const ITEM_OPTIONS = [
  { value: '', label: 'Select type' },
  ...VALID_CROP_ITEMS.map((c) => ({ value: c, label: c })),
];

export const SaleForm: React.FC<SaleFormProps> = ({
  outstandingDue,
  isCreditAllowed,
  isSaving,
  rolloutStatus,
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [selectedItem, setSelectedItem] = useState('');
  const [weightKg, setWeightKg] = useState(0);
  const [amount, setAmount] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [allCash, setAllCash] = useState(false);

  const isBlockedByRollout = isTransactionMonthLocked(date, rolloutStatus);
  const isFormBlocked = isBlockedByRollout;

  const avgRate = weightKg > 0 ? amount / weightKg : 0;
  const effectiveCashPaid = allCash ? amount : cashPaid;
  const { remainingDue } = calculateSaleTotals(amount, 0, effectiveCashPaid);
  const newOutstandingDue = outstandingDue + remainingDue;

  const handleSubmit = async () => {
    if (!selectedItem || amount <= 0 || isFormBlocked) return;
    await onSubmit({
      item: selectedItem,
      weightKg,
      amount,
      cashPaid: effectiveCashPaid,
      date,
    });
    // Reset form
    setSelectedItem('');
    setWeightKg(0);
    setAmount(0);
    setCashPaid(0);
    setAllCash(false);
  };

  return (
    <Flex direction="column" gap="md" fullWidth>
      {/* Banner if month requires prior rollout */}
      {isFormBlocked && (
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
          label="Item Type"
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
          placeholder="0"
          value={weightKg || ''}
          onChange={(e) => setWeightKg(Number(e.target.value))}
        />
        <Input
          label="Amount (₹)"
          type="number"
          required
          placeholder="0"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
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
          All Cash (Wipes out remaining dues)
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
        <SummaryRow label="Avg Rate:" value={`${formatRupee(avgRate)}/kg`} />
        <SummaryRow label="Total Price:" value={formatRupee(amount)} />
        <SummaryRow
          label="New Total Due:"
          value={formatRupee(newOutstandingDue)}
          isTotal
          isHighlight
        />
      </SummaryBox>

      {remainingDue > 0 && !isCreditAllowed && (
        <Text variant="body-sm" color="warning" weight="medium">
          ⚠️ Customer balance exceeds credit limit indicator (credit sale
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
          : isBlockedByRollout
            ? 'Monthly Rollout Required'
            : 'Process Sale'}
      </Button>
    </Flex>
  );
};
