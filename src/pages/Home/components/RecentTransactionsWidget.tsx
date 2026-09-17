import { ChevronRight } from 'lucide-react';
import React from 'react';
import { Transaction } from '../../../types';
import {
  formatDate,
  formatRupee,
  formatWeight,
} from '../../../utils/formatters';

export interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

export const RecentTransactionsWidget: React.FC<
  RecentTransactionsWidgetProps
> = ({ transactions, onViewAll }) => {
  const recent = transactions.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-m3-outline-variant p-6 text-center text-xs text-m3-on-surface-variant">
        No transactions recorded in this period.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
          Recent Activity
        </span>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-bold text-m3-primary hover:underline"
        >
          <span>View Ledger</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {recent.map((tx) => {
          const isPayment = tx.type === 'PAYMENT';
          const isOpening =
            tx.type === 'OPENING_BALANCE' || tx.item === 'Previous Outstanding';
          const amount = isPayment ? tx.paymentAmount || 0 : tx.amount || 0;
          const cash = tx.cashPaid || 0;
          const credit = tx.remainingDue ?? amount - cash;
          const isFullCashSale =
            !isPayment && !isOpening && credit === 0 && cash > 0;

          return (
            <div
              key={tx.id || Math.random().toString()}
              className="flex items-center justify-between rounded-xl border border-m3-outline-variant bg-m3-surface-container-low p-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-m3-on-surface">
                    {isPayment
                      ? 'Payment Received'
                      : isOpening
                        ? 'Opening Balance'
                        : tx.item || 'Sale Item'}
                  </span>
                  {isFullCashSale && (
                    <span className="py-0.2 rounded bg-teal-500/10 px-1.5 text-[9px] font-bold text-teal-600 dark:text-teal-400">
                      Cash
                    </span>
                  )}
                  {credit > 0 && !isPayment && !isOpening && (
                    <span className="py-0.2 rounded bg-purple-500/10 px-1.5 text-[9px] font-bold text-purple-600 dark:text-purple-400">
                      Credit
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-m3-on-surface-variant">
                  <span>{formatDate(tx.date)}</span>
                  {tx.weightKg ? (
                    <>
                      <span>•</span>
                      <span>{formatWeight(tx.weightKg)}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="text-right font-extrabold text-m3-on-surface">
                {formatRupee(amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
