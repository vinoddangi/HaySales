import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { formatRupee } from '../../../utils/formatters';

export interface SaleFormProps {
  outstandingDue: number;
  isCreditAllowed: boolean;
  isSaving: boolean;
  onSubmit: (_saleData: {
    item: string;
    weightKg: number;
    amount: number;
    cashPaid: number;
    date: string;
  }) => Promise<void>;
}

export const SaleForm: React.FC<SaleFormProps> = ({
  outstandingDue,
  isCreditAllowed,
  isSaving,
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

  const avgRate = weightKg > 0 ? amount / weightKg : 0;
  const effectiveCashPaid = allCash ? amount : cashPaid;
  const remainingDue = Math.max(0, amount - effectiveCashPaid);
  const newOutstandingDue = outstandingDue + remainingDue;

  const handleSubmit = async () => {
    if (!selectedItem || amount <= 0) return;
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

        {/* Item Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Item Type
          </label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
          >
            <option value="">Select type</option>
            <option value="Chana">Chana</option>
            <option value="Gavatri">Gavatri</option>
            <option value="B. Kutty">B. Kutty</option>
            <option value="Kutty">Kutty</option>
            <option value="Tuvar">Tuvar</option>
            <option value="Others">Others</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Weight (kg)
          </label>
          <input
            type="number"
            placeholder="0"
            value={weightKg || ''}
            onChange={(e) => setWeightKg(Number(e.target.value))}
            className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Amount (₹)
          </label>
          <input
            type="number"
            placeholder="0"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
          />
        </div>
      </div>

      {/* All Cash Checkbox */}
      <div className="space-y-2">
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
          <div>
            <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
              Cash Paid (₹)
            </label>
            <input
              type="number"
              placeholder="0"
              value={cashPaid || ''}
              onChange={(e) => setCashPaid(Number(e.target.value))}
              className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Summary Box */}
      <div className="space-y-1.5 rounded border border-m3-outline-variant bg-m3-surface-container-low p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-m3-on-surface-variant">Avg Rate:</span>{' '}
          <strong>{formatRupee(avgRate)}/kg</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-m3-on-surface-variant">Total Price:</span>{' '}
          <strong>{formatRupee(amount)}</strong>
        </div>
        <div className="flex justify-between border-t border-m3-outline-variant/30 pt-1.5 font-bold text-m3-primary">
          <span>New Total Due:</span>{' '}
          <span>{formatRupee(newOutstandingDue)}</span>
        </div>
      </div>

      {remainingDue > 0 && !isCreditAllowed && (
        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
          ⚠️ Customer balance exceeds credit limit indicator (credit sale
          permitted).
        </p>
      )}

      <Button
        variant="filled"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSaving || !selectedItem || amount <= 0}
      >
        {isSaving ? 'Processing...' : 'Process Sale'}
      </Button>
    </div>
  );
};
