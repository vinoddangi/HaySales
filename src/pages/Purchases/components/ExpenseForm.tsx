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
  const [vendorName, setVendorName] = useState('');
  const [note, setNote] = useState('');

  const selectedYear = new Date(date).getFullYear();
  const isCYSelected = !isNaN(selectedYear) && selectedYear >= currentYear;
  const isBlockedByBackup = hasPendingBackup && isCYSelected;
  const isBlockedByRollout = isTransactionMonthLocked(date, rolloutStatus);
  const isFormBlocked = isBlockedByBackup || isBlockedByRollout;

  const handleSubmit = async () => {
    if (amount <= 0 || isFormBlocked) return;
    await onSubmit({
      expenseCategory: category,
      amount,
      vendorName: vendorName.trim() || undefined,
      note: note.trim() || undefined,
      date,
    });
    // Reset form
    setAmount(0);
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
        <SummaryRow
          label="Total Outflow:"
          value={formatRupee(amount)}
          isTotal
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
