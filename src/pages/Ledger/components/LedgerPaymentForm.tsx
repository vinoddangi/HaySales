import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { formatRupee } from '../../../utils/formatters';

export interface LedgerPaymentFormProps {
  outstandingDue: number;
  isPaying: boolean;
  onPay: (_paymentAmount: number, _date?: string) => Promise<void>;
}

export const LedgerPaymentForm: React.FC<LedgerPaymentFormProps> = ({
  outstandingDue,
  isPaying,
  onPay,
}) => {
  const [date, setDate] = useState(
    () => new Date().toISOString().split('T')[0],
  );
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [allDueClear, setAllDueClear] = useState(false);

  const discountDuringPayment = allDueClear
    ? Math.max(0, outstandingDue - paymentAmount)
    : 0;
  const effectivePaymentAmount = allDueClear ? outstandingDue : paymentAmount;

  const handleSubmit = async () => {
    if (effectivePaymentAmount <= 0) return;
    await onPay(effectivePaymentAmount, date);
    setPaymentAmount(0);
    setAllDueClear(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-m3-outline-variant bg-m3-surface-container-low p-4">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-m3-primary">
        Record Payment
      </h4>

      {/* Date Field */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
          Payment Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs font-medium focus:border-m3-primary focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between border-b border-m3-outline-variant/30 pb-2.5">
        <span className="text-xs font-semibold text-m3-on-surface">
          Settle Entire Balance
        </span>
        <input
          type="checkbox"
          checked={allDueClear}
          onChange={(e) => setAllDueClear(e.target.checked)}
          className="h-4 w-4 rounded border-m3-outline text-m3-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Amount Paid (₹)
          </label>
          <input
            type="number"
            placeholder="0"
            value={paymentAmount || ''}
            disabled={allDueClear}
            max={outstandingDue}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2.5 text-xs font-medium focus:border-m3-primary focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
            Discount Given (₹)
          </label>
          <input
            type="text"
            readOnly
            value={formatRupee(discountDuringPayment)}
            className="w-full rounded-lg border border-m3-outline bg-m3-surface-container-high p-2.5 text-xs font-bold text-emerald-600 opacity-90"
          />
        </div>
      </div>

      <Button
        variant="filled"
        className="w-full text-xs"
        onClick={handleSubmit}
        disabled={
          isPaying ||
          effectivePaymentAmount <= 0 ||
          effectivePaymentAmount > outstandingDue
        }
      >
        {isPaying ? 'Processing...' : 'Process Payment'}
      </Button>
    </div>
  );
};
