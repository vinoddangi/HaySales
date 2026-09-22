import { History, ReceiptCent, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { CustomerInfoBadge, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import {
  Customer,
  MonthlyRolloutStatus,
  Transaction,
} from '../../../store/slices/customersApi';
import {
  calculateCustomerBalance,
  formatRupee,
  formatWeight,
} from '../../../utils/formatters';
import { LedgerPaymentForm } from './LedgerPaymentForm';
import { TransactionHistoryList } from './TransactionHistoryList';

export interface LedgerDetailDrawerProps {
  isOpen: boolean;
  customer: Customer | undefined;
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  isPaying: boolean;
  rolloutStatus?: MonthlyRolloutStatus | null;
  currentYear?: number;
  onClose: () => void;
  onPay: (
    _paymentAmount: number,
    _date?: string,
    _discount?: number,
  ) => Promise<void>;
}

export const LedgerDetailDrawer: React.FC<LedgerDetailDrawerProps> = ({
  isOpen,
  customer,
  transactions,
  isLoadingTransactions,
  isPaying,
  rolloutStatus,
  currentYear = new Date().getFullYear(),
  onClose,
  onPay,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'payment'>('history');

  const { totalBilledAmount, totalPayments, totalWeightKg, avgRate } =
    useMemo(() => {
      let salesAmt = 0;
      let servicesAmt = 0;
      let paymentsAmt = 0;
      let weight = 0;

      transactions.forEach((t) => {
        if (t.type === 'SALE') {
          salesAmt += t.amount || 0;
          weight += t.weightKg || 0;
          paymentsAmt += t.cashPaid || 0;
        } else if (t.type === 'SERVICE') {
          servicesAmt += t.amount || 0;
          paymentsAmt += t.cashPaid || 0;
        } else if (t.type === 'PAYMENT') {
          paymentsAmt += t.amount || t.cashPaid || 0;
        }
      });

      const totalBilled = salesAmt + servicesAmt;
      const avg = weight > 0 ? salesAmt / weight : 0;
      return {
        totalBilledAmount: totalBilled,
        totalPayments: paymentsAmt,
        totalWeightKg: weight,
        avgRate: avg,
      };
    }, [transactions]);

  if (!isOpen || !customer) return null;

  const effectiveOutstandingDue =
    customer.outstandingAmount !== undefined
      ? customer.outstandingAmount
      : calculateCustomerBalance(transactions);

  // Compute if customer has a baseline previous year opening debt that isn't yet an explicit transaction doc
  const currentYearTransactionsBalance = calculateCustomerBalance(
    transactions.filter(
      (t) => t.type !== 'OPENING_BALANCE' && t.item !== 'Previous Outstanding',
    ),
  );
  const impliedOpeningDebt = Math.max(
    0,
    effectiveOutstandingDue - currentYearTransactionsBalance,
  );

  const hasExplicitOpening = transactions.some(
    (t) => t.type === 'OPENING_BALANCE' || t.item === 'Previous Outstanding',
  );

  const displayTransactions = [...transactions];
  if (!hasExplicitOpening && impliedOpeningDebt > 0) {
    displayTransactions.push({
      id: `opening_bal_${customer.id}`,
      customerId: customer.id,
      customerName: customer.name,
      type: 'OPENING_BALANCE',
      item: 'Previous Outstanding',
      amount: impliedOpeningDebt,
      remainingDue: impliedOpeningDebt,
      cashPaid: 0,
      date: `${currentYear}-01-01T00:00:00.000Z`,
      note: `Carried forward outstanding balance from ${currentYear - 1}`,
    });
  }

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 flex h-[90vh] w-full max-w-lg animate-slide-up flex-col rounded-t-3xl border-t border-m3-outline-variant bg-m3-surface shadow-2xl">
        {/* Top Handle & Header */}
        <div className="flex flex-col border-b border-m3-outline-variant/30 px-5 pb-3 pt-3">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-m3-outline-variant/60" />
          <Flex align="center" justify="between" fullWidth>
            <div>
              <Text styleAs="h3" appearance="primary" weight="bold">
                {customer.name}
              </Text>
              <Text styleAs="caption" appearance="secondary">
                Customer Ledger & Account Statement
              </Text>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-m3-on-surface-variant hover:bg-m3-surface-container-high active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </Flex>
        </div>

        {/* Customer Info Card */}
        <div className="px-5 pb-1 pt-3">
          <CustomerInfoBadge
            customer={customer}
            outstandingDue={effectiveOutstandingDue}
          />
        </div>

        {/* Customer Transaction Totals Metrics */}
        <div className="grid grid-cols-4 gap-2 px-5 py-2">
          <div className="rounded-xl border border-m3-outline-variant/40 bg-m3-surface-container-low p-2 text-center">
            <span className="block text-[10px] font-semibold text-m3-on-surface-variant">
              Total Sales
            </span>
            <span className="block truncate text-xs font-bold text-blue-600 dark:text-blue-400">
              {formatRupee(totalBilledAmount)}
            </span>
          </div>

          <div className="rounded-xl border border-m3-outline-variant/40 bg-m3-surface-container-low p-2 text-center">
            <span className="block text-[10px] font-semibold text-m3-on-surface-variant">
              Total Paid
            </span>
            <span className="block truncate text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupee(totalPayments)}
            </span>
          </div>

          <div className="rounded-xl border border-m3-outline-variant/40 bg-m3-surface-container-low p-2 text-center">
            <span className="block text-[10px] font-semibold text-m3-on-surface-variant">
              Quantity
            </span>
            <span className="block truncate text-xs font-bold text-amber-600 dark:text-amber-400">
              {formatWeight(totalWeightKg)}
            </span>
          </div>

          <div className="rounded-xl border border-m3-outline-variant/40 bg-m3-surface-container-low p-2 text-center">
            <span className="block text-[10px] font-semibold text-m3-on-surface-variant">
              Avg Rate
            </span>
            <span className="block truncate text-xs font-bold text-purple-600 dark:text-purple-400">
              {avgRate > 0 ? `₹${avgRate.toFixed(2)}/kg` : '—'}
            </span>
          </div>
        </div>

        {/* Tab Navigation: Full History vs Record Payment */}
        <div className="px-5 pt-1">
          <div className="flex rounded-xl border border-m3-outline-variant/40 bg-m3-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-m3-surface text-m3-primary shadow-sm'
                  : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Statement ({transactions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                activeTab === 'payment'
                  ? 'bg-m3-primary text-m3-on-primary shadow-sm'
                  : effectiveOutstandingDue > 0
                    ? 'text-blue-600 hover:bg-m3-surface-container dark:text-blue-400'
                    : 'text-m3-on-surface-variant hover:text-m3-on-surface'
              }`}
            >
              <ReceiptCent className="h-4 w-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {activeTab === 'history' ? (
            <div className="flex h-full flex-col">
              <TransactionHistoryList
                transactions={displayTransactions}
                isLoading={isLoadingTransactions}
              />
              {effectiveOutstandingDue > 0 && (
                <div className="pb-1 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('payment')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-m3-primary py-2.5 text-xs font-bold text-m3-on-primary shadow-sm hover:opacity-95 active:scale-[0.99]"
                  >
                    <ReceiptCent className="h-4 w-4" />
                    <span>
                      Collect Payment (Due: ₹
                      {effectiveOutstandingDue.toLocaleString('en-IN')})
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-1">
              <LedgerPaymentForm
                outstandingDue={effectiveOutstandingDue}
                isPaying={isPaying}
                rolloutStatus={rolloutStatus}
                onPay={onPay}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
