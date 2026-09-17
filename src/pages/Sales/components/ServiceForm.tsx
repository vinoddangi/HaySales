import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { formatRupee, SERVICE_ITEMS } from '../../../utils/formatters';

export interface ServiceFormProps {
  outstandingDue: number;
  isCreditAllowed: boolean;
  isSaving: boolean;
  onSubmit: (_serviceData: {
    item: string;
    amount: number;
    cashPaid: number;
    date: string;
    note?: string;
  }) => Promise<void>;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  outstandingDue,
  isCreditAllowed,
  isSaving,
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

  const effectiveCashPaid = allCash ? amount : cashPaid;
  const remainingDue = Math.max(0, amount - effectiveCashPaid);
  const newOutstandingDue = outstandingDue + remainingDue;

  const handleSubmit = async () => {
    if (!selectedItem || amount <= 0) return;
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

        {/* Service Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Service Item
          </label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
          >
            <option value="">Select service</option>
            {SERVICE_ITEMS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount and Note */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div>
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Remarks / Note (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Trip to village, harvest work"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
          All Cash (Paid immediately)
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
          <span className="text-m3-on-surface-variant">Total Service Fee:</span>{' '}
          <strong>{formatRupee(amount)}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-m3-on-surface-variant">Cash Paid:</span>{' '}
          <strong className="text-emerald-600">
            {formatRupee(effectiveCashPaid)}
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-m3-on-surface-variant">Added to Dues:</span>{' '}
          <strong className="text-amber-600">
            {formatRupee(remainingDue)}
          </strong>
        </div>
        <div className="flex justify-between border-t border-m3-outline-variant/30 pt-1.5 font-bold text-m3-primary">
          <span>New Total Due:</span>{' '}
          <span>{formatRupee(newOutstandingDue)}</span>
        </div>
      </div>

      {remainingDue > 0 && !isCreditAllowed && (
        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
          ⚠️ Customer balance exceeds credit limit indicator (credit service
          permitted).
        </p>
      )}

      <Button
        variant="filled"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSaving || !selectedItem || amount <= 0}
      >
        {isSaving ? 'Processing...' : 'Record Service'}
      </Button>
    </div>
  );
};
