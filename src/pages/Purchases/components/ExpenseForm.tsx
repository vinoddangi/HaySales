import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { ExpenseCategoryType } from '../../../types';
import { formatRupee } from '../../../utils/formatters';

export interface ExpenseFormProps {
  isSaving: boolean;
  onSubmit: (_data: {
    expenseCategory: ExpenseCategoryType;
    amount: number;
    vendorName?: string;
    note?: string;
    date: string;
  }) => Promise<void>;
}

const EXPENSE_CATEGORIES: ExpenseCategoryType[] = [
  'Interest',
  'Fuel',
  'Labor',
  'Food / Drink',
  'Tools',
  'Others',
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isSaving,
  onSubmit,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [category, setCategory] = useState<ExpenseCategoryType>('Fuel');
  const [amount, setAmount] = useState(0);
  const [vendorName, setVendorName] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async () => {
    if (amount <= 0) return;
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Date Field */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
          />
        </div>

        {/* Expense Category */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Expense Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategoryType)}
            className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount (₹) */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
          Expense Amount (₹)
        </label>
        <input
          type="number"
          placeholder="0"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
        />
      </div>

      {/* Paid To / Beneficiary */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
          Paid To / Person / Station (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Indian Oil Pump, Tractor Driver, Bank"
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
        />
      </div>

      {/* Description / Note */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
          Description / Note (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. 50 Liters diesel for generator, Monthly loan interest"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
        />
      </div>

      {/* Summary Box */}
      <div className="space-y-1.5 rounded border border-m3-outline-variant bg-m3-surface-container-low p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-m3-on-surface-variant">Category:</span>{' '}
          <strong className="text-rose-600 dark:text-rose-400">
            {category}
          </strong>
        </div>
        <div className="flex justify-between border-t border-m3-outline-variant/30 pt-1.5 font-bold text-m3-on-surface">
          <span>Total Outflow:</span> <span>{formatRupee(amount)}</span>
        </div>
      </div>

      <Button
        variant="filled"
        className="w-full bg-rose-600 text-white hover:bg-rose-700"
        onClick={handleSubmit}
        disabled={isSaving || amount <= 0}
      >
        {isSaving ? 'Recording...' : 'Record Expense'}
      </Button>
    </div>
  );
};
