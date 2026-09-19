import { X } from 'lucide-react';
import React from 'react';
import { CustomerInfoBadge, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
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
  hasPendingBackup?: boolean;
  currentYear?: number;
  onClose: () => void;
  onPay: (_paymentAmount: number, _date?: string) => Promise<void>;
}

export const LedgerDetailDrawer: React.FC<LedgerDetailDrawerProps> = ({
  isOpen,
  customer,
  transactions,
  isLoadingTransactions,
  isPaying,
  hasPendingBackup = false,
  currentYear = new Date().getFullYear(),
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
      <Flex
        direction="column"
        gap="md"
        padding="lg"
        fullWidth
        className="relative z-10 max-h-[85vh] max-w-md animate-slide-up overflow-y-auto rounded-t-3xl border-t border-m3-outline-variant bg-m3-surface shadow-2xl"
      >
        {/* Header */}
        <Flex
          align="center"
          justify="between"
          fullWidth
          className="border-b border-m3-outline-variant/30 pb-3"
        >
          <Text styleAs="h4" appearance="primary" weight="bold">
            Customer Ledger Details
          </Text>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-m3-surface-container-high"
          >
            <X className="h-4 w-4 text-m3-on-surface-variant" />
          </button>
        </Flex>

        {/* Customer Badge with calculated live outstanding due */}
        <CustomerInfoBadge
          customer={customer}
          outstandingDue={effectiveOutstandingDue}
        />

        {/* Quick Payment Form */}
        <LedgerPaymentForm
          outstandingDue={effectiveOutstandingDue}
          isPaying={isPaying}
          hasPendingBackup={hasPendingBackup}
          currentYear={currentYear}
          onPay={onPay}
        />

        {/* Transaction History List */}
        <TransactionHistoryList
          transactions={transactions}
          isLoading={isLoadingTransactions}
        />
      </Flex>
    </div>
  );
};
