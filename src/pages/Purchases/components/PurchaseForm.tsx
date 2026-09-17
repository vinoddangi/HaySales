import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { formatRupee } from '../../../utils/formatters';

export interface PurchaseFormProps {
  isSaving: boolean;
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

export const PurchaseForm: React.FC<PurchaseFormProps> = ({
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
  const [allCash, setAllCash] = useState(true);
  const [vendorName, setVendorName] = useState('');
  const [note, setNote] = useState('');

  const avgRate = weightKg > 0 ? amount / weightKg : 0;
  const effectiveCashPaid = allCash ? amount : cashPaid;

  const handleSubmit = async () => {
    if (!selectedItem || amount <= 0) return;
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
            Item / Crop Type
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
            Purchase Amount (₹)
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

      {/* Supplier / Farmer Name */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
          Supplier / Farmer Name (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Ramesh Patel, Mandi Trader"
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
        />
      </div>

      {/* Payment Settlement */}
      <div className="space-y-2">
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
          <div>
            <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
              Cash Paid Now (₹)
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

      {/* Remarks / Notes */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
          Remarks / Note (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Lot #12, 14% moisture, direct from farm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
        />
      </div>

      {/* Summary Box */}
      <div className="space-y-1.5 rounded border border-m3-outline-variant bg-m3-surface-container-low p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-m3-on-surface-variant">Avg Buy Rate:</span>{' '}
          <strong>{formatRupee(avgRate)}/kg</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-m3-on-surface-variant">Total Cost:</span>{' '}
          <strong>{formatRupee(amount)}</strong>
        </div>
        <div className="flex justify-between border-t border-m3-outline-variant/30 pt-1.5 font-bold text-amber-600 dark:text-amber-400">
          <span>Cash Paid:</span> <span>{formatRupee(effectiveCashPaid)}</span>
        </div>
      </div>

      <Button
        variant="filled"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSaving || !selectedItem || amount <= 0}
      >
        {isSaving ? 'Recording...' : 'Record Stock Purchase'}
      </Button>
    </div>
  );
};
