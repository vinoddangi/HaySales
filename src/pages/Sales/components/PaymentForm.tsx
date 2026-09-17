import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { formatRupee } from '../../../utils/formatters';

export interface PaymentFormProps {
  outstandingDue: number;
  isSaving: boolean;
  onSubmit: (_effectivePaymentAmount: number, _date?: string) => Promise<void>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  outstandingDue,
  isSaving,
  onSubmit,
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
  const newOutstandingDue = Math.max(
    0,
    outstandingDue - effectivePaymentAmount,
  );

  const handleSubmit = async () => {
    if (effectivePaymentAmount <= 0) return;
    await onSubmit(effectivePaymentAmount, date);
    setPaymentAmount(0);
    setAllDueClear(false);
  };

  return (
    <div className="space-y-4">
      {/* Date Field */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
          Payment Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
        />
      </div>

      {/* All Due Clear Checkbox */}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-m3-on-surface">
          <input
            type="checkbox"
            checked={allDueClear}
            onChange={(e) => setAllDueClear(e.target.checked)}
            className="h-4 w-4 rounded border-m3-outline text-m3-primary"
          />
          All Due Clear (Settles entire balance)
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
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
              className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface focus:border-m3-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
              Discount Given (₹)
            </label>
            <input
              type="text"
              readOnly
              value={formatRupee(discountDuringPayment)}
              className="w-full rounded border border-m3-outline bg-m3-surface-container-high p-2 text-xs font-semibold text-m3-on-surface-variant opacity-80"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 rounded border border-m3-outline-variant bg-m3-surface-container-low p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-m3-on-surface-variant">Outstanding Due:</span>{' '}
          <strong>{formatRupee(outstandingDue)}</strong>
        </div>
        <div className="flex justify-between font-bold text-emerald-600">
          <span>Payment Applied:</span>{' '}
          <span>-{formatRupee(effectivePaymentAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-m3-outline-variant/30 pt-1.5 font-bold text-m3-primary">
          <span>New Balance Due:</span>{' '}
          <span>{formatRupee(newOutstandingDue)}</span>
        </div>
      </div>

      <Button
        variant="filled"
        className="w-full"
        onClick={handleSubmit}
        disabled={
          isSaving ||
          effectivePaymentAmount <= 0 ||
          effectivePaymentAmount > outstandingDue
        }
      >
        {isSaving ? 'Processing...' : 'Process Payment'}
      </Button>
    </div>
  );
};
