import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import { Transaction } from '../../../types';
import { cn } from '../../../utils/cn';
import { formatDate, formatRupee } from '../../../utils/formatters';

export interface TransactionHistoryListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export const TransactionHistoryList: React.FC<TransactionHistoryListProps> = ({
  transactions,
  isLoading,
}) => {
  // Compute running balance chronologically (from oldest to newest) to detect which transactions hit 0 balance
  const chronological = [...transactions].reverse();
  const clearedTxIds = new Set<string>();
  let runningDue = 0;

  chronological.forEach((tx) => {
    if (tx.type === 'PAYMENT') {
      runningDue -= Number(tx.paymentAmount) || 0;
    } else {
      const credit =
        tx.remainingDue !== undefined
          ? Number(tx.remainingDue) || 0
          : (Number(tx.amount) || 0) - (Number(tx.cashPaid) || 0);
      runningDue += credit;
    }

    if (runningDue <= 0 && tx.id) {
      clearedTxIds.add(tx.id);
      runningDue = 0; // prevent negative skew
    }
  });

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
          Transaction History
        </h4>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
          Settled Milestones Highlighted
        </span>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-xs text-m3-on-surface-variant">
          Loading history...
        </p>
      ) : transactions.length === 0 ? (
        <p className="py-6 text-center text-xs text-m3-on-surface-variant">
          No transactions found.
        </p>
      ) : (
        <div className="max-h-[35vh] space-y-2.5 overflow-y-auto pr-1">
          {transactions.map((tx) => {
            const isPayment = tx.type === 'PAYMENT';
            const isService = tx.type === 'SERVICE';
            const isOpening =
              tx.type === 'OPENING_BALANCE' ||
              tx.item === 'Previous Outstanding';
            const amount = tx.amount || 0;
            const cash = tx.cashPaid || 0;
            const credit = tx.remainingDue ?? amount;
            const isFullCashSale =
              !isPayment && !isOpening && credit === 0 && cash > 0;
            const isPartialCash =
              !isPayment && !isOpening && cash > 0 && credit > 0;
            const isCleared = tx.id ? clearedTxIds.has(tx.id) : false;

            return (
              <div
                key={tx.id || Math.random().toString()}
                className={cn(
                  'relative flex items-center justify-between rounded-xl border p-3.5 text-xs transition-all',
                  {
                    'shadow-xs border-emerald-500/40 bg-emerald-500/[0.08]':
                      isCleared,
                    'border-teal-500/30 bg-teal-500/[0.05]':
                      !isCleared && isFullCashSale,
                    'border-emerald-500/20 bg-emerald-500/[0.03]':
                      !isCleared && !isFullCashSale && isPayment,
                    'border-amber-500/30 bg-amber-500/[0.04]':
                      !isCleared && !isFullCashSale && isOpening,
                    'border-cyan-500/30 bg-cyan-500/[0.05]':
                      !isCleared && !isFullCashSale && isService,
                    'border-m3-outline-variant bg-m3-surface-container-low':
                      !isCleared &&
                      !isFullCashSale &&
                      !isPayment &&
                      !isOpening &&
                      !isService,
                  },
                )}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-m3-on-surface">
                      {isPayment
                        ? 'Payment Received'
                        : isOpening
                          ? 'Previous Outstanding'
                          : isService
                            ? `Service: ${tx.item || 'Service'}`
                            : isFullCashSale
                              ? `Cash Sale: ${tx.item || 'Item'}`
                              : `Sale: ${tx.item || 'Item'}`}
                    </span>

                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase',
                        {
                          'bg-emerald-500/20 text-emerald-600': isPayment,
                          'bg-teal-500/20 text-teal-700 dark:text-teal-300':
                            isFullCashSale,
                          'bg-amber-500/20 text-amber-600 dark:text-amber-400':
                            isOpening,
                          'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400':
                            isPartialCash,
                          'bg-neutral-500/20 text-neutral-600':
                            !isPayment &&
                            !isFullCashSale &&
                            !isOpening &&
                            !isPartialCash,
                        },
                      )}
                    >
                      {isPayment
                        ? 'Cash In'
                        : isFullCashSale
                          ? '💵 100% Cash'
                          : isOpening
                            ? 'Opening Due'
                            : isPartialCash
                              ? 'Part-Cash'
                              : 'Credit Invoice'}
                    </span>

                    {/* Zero Due / Settled Milestone Highlight */}
                    {isCleared && (
                      <span className="shadow-xs inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>0 DUE • ALL CLEAR</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-m3-on-surface-variant">
                    {tx.weightKg ? `${tx.weightKg} kg • ` : ''}
                    {formatDate(tx.date)}
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  {isPayment ? (
                    <p className="text-sm font-extrabold text-emerald-600">
                      -{formatRupee(tx.paymentAmount || 0)}
                    </p>
                  ) : isFullCashSale ? (
                    <div>
                      <p className="text-sm font-extrabold text-teal-700 dark:text-teal-400">
                        {formatRupee(cash)}
                      </p>
                      <p className="text-[9px] font-semibold text-emerald-600">
                        Paid in Full (₹0 Due)
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-medium text-m3-on-surface-variant">
                        Total: {formatRupee(amount)}
                      </p>
                      {cash > 0 && (
                        <p className="text-[10px] font-semibold text-emerald-600">
                          Cash: {formatRupee(cash)}
                        </p>
                      )}
                      {credit > 0 && (
                        <p className="font-bold text-red-500">
                          Due: +{formatRupee(credit)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
