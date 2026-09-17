import { X } from 'lucide-react';
import React from 'react';
import { CustomerInfoBadge } from '../../../components/common/CustomerInfoBadge';
import { Customer, Transaction } from '../../../store/slices/customersApi';
import { calculateCustomerBalance } from '../../../utils/formatters';
import { LedgerPaymentForm } from './LedgerPaymentForm';
import { TransactionHistoryList } from './TransactionHistoryList';

export interface LedgerDetailDrawerProps {
  isOpen: boolean;
  customer: Customer | undefined;
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  isPaying: boolean;
  onClose: () => void;
  onPay: (_paymentAmount: number, _date?: string) => Promise<void>;
}

export const LedgerDetailDrawer: React.FC<LedgerDetailDrawerProps> = ({
  isOpen,
  customer,
  transactions,
  isLoadingTransactions,
  isPaying,
  onClose,
  onPay,
}) => {
  if (!isOpen || !customer) return null;

  const effectiveOutstandingDue =
    customer.outstandingAmount !== undefined
      ? customer.outstandingAmount
      : calculateCustomerBalance(transactions);

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/40">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-md animate-slide-up space-y-4 overflow-y-auto rounded-t-3xl border-t border-m3-outline-variant bg-m3-surface p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-m3-outline-variant/30 pb-3">
          <h3 className="text-sm font-bold text-m3-on-surface">
            Customer Ledger Details
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-m3-surface-container-high"
          >
            <X className="h-4 w-4 text-m3-on-surface-variant" />
          </button>
        </div>

        {/* Customer Badge with calculated live outstanding due */}
        <CustomerInfoBadge
          customer={customer}
          outstandingDue={effectiveOutstandingDue}
        />

        {/* Quick Payment Form */}
        <LedgerPaymentForm
          outstandingDue={effectiveOutstandingDue}
          isPaying={isPaying}
          onPay={onPay}
        />

        {/* Transaction History List */}
        <TransactionHistoryList
          transactions={transactions}
          isLoading={isLoadingTransactions}
        />
      </div>
    </div>
  );
};
