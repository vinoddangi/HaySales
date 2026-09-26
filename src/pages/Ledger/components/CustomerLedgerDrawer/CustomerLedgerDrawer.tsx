import { History, Receipt, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { CustomerLedgerDetail } from '../../../../business/ledgerBusiness';
import {
  CustomerTransactionData,
  isSaleTransaction,
  isServiceTransaction,
} from '../../../../models';
import { cn } from '../../../../utils/cn';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import { LedgerPaymentForm } from '../LedgerPaymentForm';
import { TransactionHistoryList } from '../TransactionHistoryList';
import './CustomerLedgerDrawer.css';

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
  const [activeTab, setActiveTab] = useState<'statement' | 'payment'>(
    'statement',
  );

  const { totalSales, totalPaid, totalWeight, avgRate } = useMemo(() => {
    let sales = 0;
    let services = 0;
    let payments = 0;
    let weight = 0;

    transactions.forEach((t) => {
      if (isSaleTransaction(t)) {
        sales += Number(t.amount) || 0;
        weight += Number(t.weight) || 0;
        payments += Number(t.cashPaid) || 0;
      } else if (isServiceTransaction(t)) {
        services += Number(t.amount) || 0;
        payments += Number(t.cashPaid) || 0;
      } else if (t.type === 'PAYMENT') {
        payments += Number(t.amount) || 0;
      }
    });

    const totalBilled = sales + services;
    const avg = weight > 0 ? sales / weight : 0;

    return {
      totalSales: totalBilled,
      totalPaid: payments,
      totalWeight: weight,
      avgRate: avg,
    };
  }, [transactions]);

  if (!isOpen || !detail) return null;

  return (
    <div className="hs-ledger-drawer-backdrop" onClick={onClose}>
      <div
        className="hs-ledger-drawer-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hs-ledger-drawer-handle" />

        <div className="hs-ledger-drawer-topbar">
          <div>
            <h3 className="hs-ledger-drawer__name">{detail.customerName}</h3>
            <span className="hs-ledger-drawer__meta">
              {detail.customer.village
                ? `Village: ${detail.customer.village}`
                : ''}
              {detail.customer.mobile
                ? ` • Mobile: ${detail.customer.mobile}`
                : ''}
            </span>
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
            <div className="hs-ledger-drawer__metric-card">
              <span className="hs-ledger-drawer__metric-label">
                Total Billed
              </span>
              <span className="hs-ledger-drawer__metric-value hs-ledger-drawer__metric-value--blue">
                {formatRupee(totalSales)}
              </span>
            </div>

            <div className="hs-ledger-drawer__metric-card">
              <span className="hs-ledger-drawer__metric-label">Total Paid</span>
              <span className="hs-ledger-drawer__metric-value hs-ledger-drawer__metric-value--green">
                {formatRupee(totalPaid)}
              </span>
            </div>

            <div className="hs-ledger-drawer__metric-card">
              <span className="hs-ledger-drawer__metric-label">Weight</span>
              <span className="hs-ledger-drawer__metric-value hs-ledger-drawer__metric-value--amber">
                {formatWeight(totalWeight)}
              </span>
            </div>

            <div className="hs-ledger-drawer__metric-card">
              <span className="hs-ledger-drawer__metric-label">Avg Rate</span>
              <span className="hs-ledger-drawer__metric-value hs-ledger-drawer__metric-value--purple">
                {avgRate > 0 ? `${formatRupee(avgRate)}/kg` : '—'}
              </span>
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
