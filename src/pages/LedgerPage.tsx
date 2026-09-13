import { AlertTriangle, CheckCircle, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react'; // Added useEffect
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import {
  useAddTransactionMutation,
  useGetCustomersQuery,
  useGetTransactionsQuery,
} from '../store/slices/customersApi';

const formatRupee = (num: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

export const LedgerPage: React.FC = () => {
  const { data: customers = [] } = useGetCustomersQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Payment States
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [allDueClear, setAllDueClear] = useState(false);

  const [addTransaction, { isLoading: isPaying }] = useAddTransactionMutation();

  // Fetches ALL transactions for the selected customer (removed limitCount restrictor)
  const { data: transactions = [], isLoading: loadingTx } =
    useGetTransactionsQuery(
      selectedCustId
        ? { customerId: selectedCustId }
        : { customerId: '', limitCount: 0 },
      { skip: !selectedCustId },
    );

  const customer = customers.find((c) => c.id === selectedCustId);
  const outstandingDue = (customer as any)?.totalOutstandingDue || 0;

  const discountDuringPayment = allDueClear
    ? Math.max(0, outstandingDue - paymentAmount)
    : 0;
  const effectivePaymentAmount = allDueClear ? outstandingDue : paymentAmount;

  // Auto-reset payment states on close or selection change
  useEffect(() => {
    if (!isDrawerOpen || !selectedCustId) {
      setPaymentAmount(0);
      setAllDueClear(false);
    }
  }, [selectedCustId, isDrawerOpen]);

  // Filters customers with outstanding dues by default, searches all when typing
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.Name.toLowerCase().includes(
      searchTerm.toLowerCase(),
    );
    const hasPendingDue = ((c as any).totalOutstandingDue || 0) > 0;
    return searchTerm ? matchesSearch : hasPendingDue;
  });

  const handlePay = async () => {
    if (!selectedCustId || effectivePaymentAmount <= 0) return;
    try {
      await addTransaction({
        customerId: selectedCustId,
        type: 'PAYMENT',
        paymentAmount: effectivePaymentAmount,
      }).unwrap();
      setIsDrawerOpen(false);
      alert('Payment successfully recorded!');
    } catch (err) {
      console.error(err);
      alert('Failed to record payment');
    }
  };

  return (
    <div className="animate-fade-in space-y-4 p-4 pb-24">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-m3-on-surface-variant" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-m3-outline bg-m3-surface py-2.5 pl-9 pr-4 text-xs text-m3-on-surface"
        />
      </div>

      {/* Customer List Card */}
      <Card variant="filled" className="space-y-2 bg-m3-surface-container p-4">
        <h3 className="text-sm font-bold">Customer Dues Ledger</h3>
        <div className="max-h-[65vh] divide-y divide-m3-outline-variant overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <p className="py-4 text-center text-xs text-m3-on-surface-variant">
              No customers found with pending dues.
            </p>
          ) : (
            filteredCustomers.map((c) => {
              const due = (c as any).totalOutstandingDue || 0;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCustId(c.id);
                    setIsDrawerOpen(true);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-3.5 transition-colors hover:bg-m3-primary-container"
                >
                  <span className="text-xs font-semibold text-m3-on-surface">
                    {c.Name}
                  </span>
                  <span
                    className={`text-xs font-bold ${due > 0 ? 'text-m3-error' : 'text-emerald-600'}`}
                  >
                    {formatRupee(due)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Bottom Drawer */}
      {isDrawerOpen && customer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div
            className="absolute inset-0"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] w-full max-w-md animate-slide-up space-y-4 overflow-y-auto rounded-t-3xl border-t border-m3-outline-variant bg-m3-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-m3-outline-variant/30 pb-3">
              <h3 className="text-sm font-bold text-m3-on-surface">
                Ledger details
              </h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full p-1 hover:bg-m3-surface-container-high"
              >
                <X className="h-4 w-4 text-m3-on-surface-variant" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-m3-on-surface">
                  {customer.Name}
                </p>
                <p className="text-xs text-m3-on-surface-variant">
                  Outstanding Due:{' '}
                  <span className="font-bold text-red-500">
                    {formatRupee(outstandingDue)}
                  </span>
                </p>
              </div>
              {outstandingDue < 50000 ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle className="h-4 w-4" /> Credit OK
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                  <AlertTriangle className="h-4 w-4" /> Cash Only
                </span>
              )}
            </div>

            {/* Quick Payment Form */}
            <div className="space-y-3 rounded-xl border border-m3-outline-variant bg-m3-surface-container-low p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-m3-primary">
                Record Payment
              </h4>

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
                    className="w-full rounded-lg border border-m3-outline bg-m3-surface p-2.5 text-xs font-medium"
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
                onClick={handlePay}
                disabled={
                  isPaying ||
                  effectivePaymentAmount <= 0 ||
                  effectivePaymentAmount > outstandingDue
                }
              >
                {isPaying ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>

            {/* Transactions List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Transaction History
                </h4>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  Cash Inflows Highlighted
                </span>
              </div>

              {loadingTx ? (
                <p className="py-4 text-center text-xs">Loading history...</p>
              ) : transactions.length === 0 ? (
                <p className="py-4 text-center text-xs text-m3-on-surface-variant">
                  No transactions found.
                </p>
              ) : (
                <div className="max-h-[30vh] space-y-2.5 overflow-y-auto pr-1">
                  {transactions.map((tx: any) => {
                    const isSale = tx.type === 'SALE';
                    const amount = tx.amount || 0;
                    const cash = tx.cashPaid || 0;
                    const credit = tx.remainingDue ?? amount;

                    return (
                      <div
                        key={tx.id}
                        className={`flex items-center justify-between rounded-xl border p-3.5 text-xs transition-all ${
                          !isSale
                            ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
                            : 'border-m3-outline-variant bg-m3-surface-container-low'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-m3-on-surface">
                              {isSale
                                ? `Sale: ${tx.item || 'Item'}`
                                : 'Payment Received'}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                !isSale
                                  ? 'bg-emerald-500/20 text-emerald-600'
                                  : 'bg-neutral-500/20 text-neutral-600'
                              }`}
                            >
                              {!isSale ? 'Cash In' : 'Invoice'}
                            </span>
                          </div>
                          <p className="text-[10px] text-m3-on-surface-variant">
                            {tx.weightKg ? `${tx.weightKg} kg • ` : ''}
                            {new Date(
                              tx.date?.seconds * 1000 || tx.date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-0.5 text-right">
                          {isSale ? (
                            <>
                              <p className="text-[10px] font-medium text-m3-on-surface-variant">
                                Total: {formatRupee(amount)}
                              </p>
                              {cash > 0 && (
                                <p className="text-[10px] font-semibold text-emerald-600">
                                  Paid: {formatRupee(cash)}
                                </p>
                              )}
                              {credit > 0 && (
                                <p className="font-bold text-red-500">
                                  Due: +{formatRupee(credit)}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm font-extrabold text-emerald-600">
                              -{formatRupee(tx.paymentAmount || 0)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
