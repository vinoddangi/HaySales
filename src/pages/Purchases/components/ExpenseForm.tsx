import React, { useState } from 'react';
import { isTransactionMonthLocked } from '../../../api';
import { VALID_EXPENSE_CATEGORIES } from '../../../business/purchasesBusiness';
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
import { ExpenseCategoryType, MonthlyRolloutStatus } from '../../../types';
import { formatRupee } from '../../../utils/formatters';

export interface ExpenseFormProps {
  isSaving: boolean;
  hasPendingBackup?: boolean;
  rolloutStatus?: MonthlyRolloutStatus | null;
  currentYear?: number;
  onSubmit: (_data: {
    expenseCategory: ExpenseCategoryType;
    amount: number;
    cashPaid: number;
    vendorName?: string;
    note?: string;
    date: string;
  }) => Promise<void>;
}

const CATEGORY_OPTIONS = VALID_EXPENSE_CATEGORIES.map((cat) => ({
  value: cat,
  label: cat,
}));

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isSaving,
  hasPendingBackup = false,
  rolloutStatus,
  currentYear = new Date().getFullYear(),
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [category, setCategory] = useState<ExpenseCategoryType>('Fuel');
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

  const effectiveCashPaid = allCash ? amount : cashPaid;

  const handleSubmit = async () => {
    if (amount <= 0 || isFormBlocked) return;
    await onSubmit({
      expenseCategory: category,
      amount,
      cashPaid: effectiveCashPaid,
      vendorName: vendorName.trim() || undefined,
      note: note.trim() || undefined,
      date,
    });
    // Reset form
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
          label="Expense Category"
          required
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={(e) => setCategory(e.target.value as ExpenseCategoryType)}
        />
      </Grid>

      <Input
        label="Expense Amount (₹)"
        type="number"
        required
        placeholder="0"
        value={amount || ''}
        onChange={(e) => setAmount(Number(e.target.value))}
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
          Paid in Full (100% Cash Outflow)
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
        label="Paid To / Person / Station (Optional)"
        type="text"
        placeholder="e.g. Indian Oil Pump, Tractor Driver, Bank"
        value={vendorName}
        onChange={(e) => setVendorName(e.target.value)}
      />

      <Input
        label="Description / Note (Optional)"
        type="text"
        placeholder="e.g. 50 Liters diesel for generator, Monthly loan interest"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* Summary Box */}
      <SummaryBox>
        <SummaryRow
          label="Category:"
          value={
            <span className="text-rose-600 dark:text-rose-400">{category}</span>
          }
        />
        <SummaryRow label="Total Outflow:" value={formatRupee(amount)} />
        <SummaryRow
          label="Cash Paid:"
          value={formatRupee(effectiveCashPaid)}
          isTotal
          className="text-rose-600 dark:text-rose-400"
        />
      </SummaryBox>

      <Button
        variant="filled"
        className="w-full bg-rose-600 text-white hover:bg-rose-700"
        onClick={handleSubmit}
        disabled={isSaving || amount <= 0 || isFormBlocked}
      >
        {isSaving
          ? 'Recording...'
          : isBlockedByBackup
            ? `Backup Required for ${currentYear}`
            : isBlockedByRollout
              ? 'Monthly Rollout Required'
              : 'Record Expense'}
      </Button>
    </Flex>
  );
};
