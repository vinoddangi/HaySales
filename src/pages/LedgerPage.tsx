import { AlertTriangle, CheckCircle, Search, X } from 'lucide-react';
import React, { useState } from 'react';
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

  const { data: transactions = [], isLoading: loadingTx } =
    useGetTransactionsQuery(
      selectedCustId
        ? { customerId: selectedCustId, limitCount: 5 }
        : { customerId: '', limitCount: 0 },
      { skip: !selectedCustId },
    );

  const customer = customers.find((c) => c.id === selectedCustId);
  const outstandingDue = (customer as any)?.totalOutstandingDue || 0;

  const discountDuringPayment = allDueClear
    ? Math.max(0, outstandingDue - paymentAmount)
    : 0;
  const effectivePaymentAmount = allDueClear ? outstandingDue : paymentAmount;

  // PRE-FILTERED SEARCH: Shows only outstanding dues by default, searches everyone on type!
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
      setPaymentAmount(0);
      setAllDueClear(false);
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
            <div className="space-y-3 pt-2">
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

              <Button
                variant="filled"
                className="mt-1 w-full"
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
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                Last 5 Transactions
              </h4>
              {loadingTx ? (
                <p className="text-center text-xs">Loading history...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center text-xs text-m3-on-surface-variant">
                  No transaction history found.
                </p>
              ) : (
                <div className="max-h-[25vh] space-y-2 overflow-y-auto">
                  {transactions.map((tx: any) => {
                    const isSale = tx.type === 'SALE';
                    const amount = tx.amount || 0;
                    const cash = tx.cashPaid || 0;
                    const credit = tx.remainingDue ?? amount;

                    return (
                      <div
                        key={tx.id}
                        className="flex justify-between rounded border border-m3-outline-variant bg-m3-surface-container-low p-3 text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-m3-on-surface">
                            {isSale
                              ? `Sale: ${tx.item || 'Item'}`
                              : 'Payment Received'}
                          </p>
                          <p className="text-[10px] text-m3-on-surface-variant">
                            {tx.weightKg ? `${tx.weightKg} kg` : ''} •{' '}
                            {new Date(
                              tx.date?.seconds * 1000 || tx.date,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-0.5 text-right">
                          {isSale ? (
                            <>
                              <p className="text-[10px] text-m3-on-surface-variant">
                                Cost: {formatRupee(amount)}
                              </p>
                              {cash > 0 && (
                                <p className="text-[10px] text-emerald-600">
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
                            <p className="font-bold text-emerald-600">
                              Paid: -{formatRupee(tx.paymentAmount || 0)}
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
