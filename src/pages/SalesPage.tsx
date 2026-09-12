import { AlertTriangle, CheckCircle, Search } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import {
  useAddTransactionMutation,
  useGetCustomersQuery,
} from '../store/slices/customersApi';

const formatRupee = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

export const SalesPage: React.FC = () => {
  const { data: customers = [] } = useGetCustomersQuery();
  const [addTransaction, { isLoading: isSaving }] = useAddTransactionMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [txType, setTxType] = useState<'SALE' | 'PAYMENT'>('SALE');

  // Form States
  const [selectedItem, setSelectedItem] = useState('');
  const [weightKg, setWeightKg] = useState(0);
  const [amount, setAmount] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [allCash, setAllCash] = useState(false); // All Cash Toggle

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [allDueClear, setAllDueClear] = useState(false); // All Due Clear Toggle

  const filteredCustomers = customers.filter((c) =>
    c.Name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const customer = customers.find((c) => c.id === selectedCustId);
  const outstandingDue = (customer as any)?.totalOutstandingDue || 0;

  const avgRate = weightKg > 0 ? amount / weightKg : 0;
  const effectiveCashPaid = allCash ? amount : cashPaid;
  const remainingDue =
    txType === 'SALE' ? Math.max(0, amount - effectiveCashPaid) : 0;

  // If All Due Clear is checked, discount = outstandingDue - paymentAmount
  const discountDuringPayment = allDueClear
    ? Math.max(0, outstandingDue - paymentAmount)
    : 0;

  // Outstanding calculations
  const effectivePaymentAmount = allDueClear ? outstandingDue : paymentAmount;
  const newOutstandingDue =
    txType === 'PAYMENT'
      ? Math.max(0, outstandingDue - effectivePaymentAmount)
      : outstandingDue + remainingDue;

  const CREDIT_LIMIT = 50000;
  const isCreditAllowed = outstandingDue < CREDIT_LIMIT;

  const handleProcessTransaction = async () => {
    if (!selectedCustId) return;

    try {
      if (txType === 'SALE') {
        await addTransaction({
          customerId: selectedCustId,
          type: 'SALE',
          item: selectedItem,
          weightKg,
          amount,
          discount: 0, // Discount field removed
          cashPaid: effectiveCashPaid,
        }).unwrap();
      } else {
        await addTransaction({
          customerId: selectedCustId,
          type: 'PAYMENT',
          paymentAmount: effectivePaymentAmount, // Subtracts the full outstanding if All Due Clear is checked
        }).unwrap();
      }

      // Reset form states
      setSelectedItem('');
      setWeightKg(0);
      setAmount(0);
      setCashPaid(0);
      setAllCash(false);
      setPaymentAmount(0);
      setAllDueClear(false);
      alert('Transaction successfully processed!');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Error saving transaction.');
    }
  };

  return (
    <div className="animate-fade-in space-y-4 p-4 pb-24">
      <h2 className="text-lg font-bold text-m3-on-surface">Sales & Payments</h2>

      {/* 1. Customer Search */}
      <Card variant="filled" className="space-y-3 bg-m3-surface-container p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-m3-on-surface-variant" />
          <input
            type="text"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-m3-outline bg-m3-surface py-2 pl-9 pr-4 text-xs text-m3-on-surface"
          />
        </div>

        {searchTerm && (
          <ul className="max-h-32 divide-y divide-m3-outline-variant overflow-y-auto text-xs">
            {filteredCustomers.map((c) => (
              <li
                key={c.id}
                onClick={() => {
                  setSelectedCustId(c.id);
                  setSearchTerm('');
                }}
                className="cursor-pointer p-2 hover:bg-m3-primary-container"
              >
                {c.Name}
              </li>
            ))}
          </ul>
        )}

        {customer && (
          <div className="flex items-center justify-between rounded-lg border border-m3-outline p-3">
            <div>
              <p className="text-sm font-bold text-m3-on-surface">
                {customer.Name}
              </p>
              <p className="text-xs text-m3-on-surface-variant">
                Outstanding Due:{' '}
                <span className="font-semibold text-m3-error">
                  {formatRupee(outstandingDue)}
                </span>
              </p>
            </div>
            {isCreditAllowed ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle className="h-4 w-4" /> Credit OK
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                <AlertTriangle className="h-4 w-4" /> Cash Only
              </span>
            )}
          </div>
        )}
      </Card>

      {/* 2. Transaction Form */}
      {customer && (
        <Card variant="outlined" className="space-y-4 p-4">
          <div className="flex rounded-lg bg-m3-surface-container-high p-1">
            <button
              type="button"
              onClick={() => setTxType('SALE')}
              className={`flex-1 rounded-md py-1.5 text-xs font-bold ${txType === 'SALE' ? 'shadow-xs bg-m3-primary text-m3-on-primary' : 'text-m3-on-surface-variant'}`}
            >
              Sell Item
            </button>
            <button
              type="button"
              onClick={() => setTxType('PAYMENT')}
              className={`flex-1 rounded-md py-1.5 text-xs font-bold ${txType === 'PAYMENT' ? 'shadow-xs bg-m3-primary text-m3-on-primary' : 'text-m3-on-surface-variant'}`}
            >
              Receive Payment
            </button>
          </div>

          {txType === 'SALE' ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-m3-on-surface-variant">
                  Item Type
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface"
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
                    className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface"
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
                    className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface"
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
                      className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 rounded border border-m3-outline-variant bg-m3-surface-container-low p-3 text-xs">
                <div className="flex justify-between">
                  <span>Avg Rate:</span>{' '}
                  <strong>{formatRupee(avgRate)}/kg</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Price:</span>{' '}
                  <strong>{formatRupee(amount)}</strong>
                </div>
                <div className="flex justify-between border-t border-m3-outline-variant/30 pt-1.5 font-bold text-m3-primary">
                  <span>New Total Due:</span>{' '}
                  <span>{formatRupee(newOutstandingDue)}</span>
                </div>
              </div>

              <Button
                variant="filled"
                className="w-full"
                onClick={handleProcessTransaction}
                disabled={
                  isSaving ||
                  !selectedItem ||
                  (remainingDue > 0 && !isCreditAllowed)
                }
              >
                {isSaving ? 'Processing...' : 'Process Sale'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
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
                      max={outstandingDue}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full rounded border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface"
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
                  <span>Outstanding Due:</span>{' '}
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
                onClick={handleProcessTransaction}
                disabled={
                  isSaving ||
                  effectivePaymentAmount <= 0 ||
                  effectivePaymentAmount > outstandingDue
                }
              >
                {isSaving ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
