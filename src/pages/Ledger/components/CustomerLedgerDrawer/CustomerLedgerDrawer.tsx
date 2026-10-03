import { History, Receipt, X } from 'lucide-react';
import React from 'react';
import { CustomerLedgerDetail } from '../../../../business/ledgerBusiness';
import { Text } from '../../../../components/Text';
import { CustomerTransactionData } from '../../../../models';
import { cn } from '../../../../utils/cn';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import { LedgerPaymentForm } from '../LedgerPaymentForm';
import { TransactionHistoryList } from '../TransactionHistoryList';
import './CustomerLedgerDrawer.css';
import { useCustomerLedgerDrawer } from './useCustomerLedgerDrawer';

export interface CustomerLedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  detail: CustomerLedgerDetail | null;
  transactions: CustomerTransactionData[];
  isLoadingTransactions?: boolean;
  isPaying: boolean;
  onPay: (
    _paymentAmount: number,
    _date?: string,
    _discount?: number,
  ) => Promise<void>;
}

export const CustomerLedgerDrawer: React.FC<CustomerLedgerDrawerProps> = ({
  isOpen,
  onClose,
  detail,
  transactions,
  isLoadingTransactions,
  isPaying,
  onPay,
}) => {
  const {
    activeTab,
    setActiveTab,
    totalBilled,
    totalPaid,
    totalWeight,
    avgRate,
    currentOutstanding,
  } = useCustomerLedgerDrawer({
    detail,
    transactions,
  });

  if (!isOpen || !detail) return null;

  const hasDue = currentOutstanding > 0;

  return (
    <div
      className="hs-ledger-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="hs-ledger-drawer-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hs-ledger-drawer-handle" />

        <div className="hs-ledger-drawer-topbar">
          <div>
            <Text variant="title-lg" weight="bold">
              {detail.customerName}
            </Text>
            <Text variant="body-sm" appearance="secondary">
              {detail.customer.village
                ? `Village: ${detail.customer.village}`
                : ''}
              {detail.customer.mobile
                ? ` • Mobile: ${detail.customer.mobile}`
                : ''}
            </Text>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hs-ledger-drawer-close-btn"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="hs-ledger-drawer">
          {/* 1. Customer Summary Metrics */}
          <div className="hs-ledger-drawer__metrics">
            <div
              className={cn(
                'hs-ledger-drawer__metric-card',
                hasDue
                  ? 'hs-ledger-drawer__metric-card--due'
                  : 'hs-ledger-drawer__metric-card--clear',
              )}
            >
              <Text variant="label-sm" appearance="secondary">
                Outstanding Due
              </Text>
              <Text
                variant="title-md"
                weight="bold"
                className={
                  hasDue
                    ? 'hs-ledger-drawer__metric-value--red'
                    : 'hs-ledger-drawer__metric-value--green'
                }
              >
                {hasDue ? formatRupee(currentOutstanding) : '₹0 (Clear)'}
              </Text>
            </div>

            <div className="hs-ledger-drawer__metric-card">
              <Text variant="label-sm" appearance="secondary">
                Total Billed
              </Text>
              <Text
                variant="title-md"
                weight="bold"
                className="hs-ledger-drawer__metric-value--blue"
              >
                {formatRupee(totalBilled)}
              </Text>
            </div>

            <div className="hs-ledger-drawer__metric-card">
              <Text variant="label-sm" appearance="secondary">
                Total Paid
              </Text>
              <Text
                variant="title-md"
                weight="bold"
                className="hs-ledger-drawer__metric-value--green"
              >
                {formatRupee(totalPaid)}
              </Text>
            </div>

            <div className="hs-ledger-drawer__metric-card">
              <Text variant="label-sm" appearance="secondary">
                Weight / Rate
              </Text>
              <Text
                variant="title-md"
                weight="bold"
                className="hs-ledger-drawer__metric-value--amber"
              >
                {totalWeight > 0 ? `${formatWeight(totalWeight)}` : '—'}
              </Text>
              {avgRate > 0 && (
                <Text variant="label-sm" appearance="secondary">
                  @ {formatRupee(avgRate)}/kg
                </Text>
              )}
            </div>
          </div>

          {/* 2. Tab Switcher */}
          <div className="hs-ledger-drawer__tabs">
            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              className={cn(
                'hs-ledger-drawer__tab-btn',
                activeTab === 'statement' &&
                  'hs-ledger-drawer__tab-btn--active',
              )}
            >
              <History className="h-4 w-4" />
              <span>Statement ({transactions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={cn(
                'hs-ledger-drawer__tab-btn',
                activeTab === 'payment' &&
                  'hs-ledger-drawer__tab-btn--active-pay',
              )}
            >
              <Receipt className="h-4 w-4" />
              <span>Record Payment</span>
            </button>
          </div>

          {/* 3. Tab Content */}
          <div className="hs-ledger-drawer__content">
            {activeTab === 'statement' ? (
              <TransactionHistoryList
                transactions={transactions}
                isLoading={isLoadingTransactions}
              />
            ) : (
              <LedgerPaymentForm
                outstandingDue={detail.currentOutstanding}
                isPaying={isPaying}
                onPay={onPay}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedgerDrawer;
