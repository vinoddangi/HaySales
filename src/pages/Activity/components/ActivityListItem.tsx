import { Edit3 } from 'lucide-react';
import React from 'react';
import { Transaction } from '../../../types';
import { cn } from '../../../utils/cn';
import {
  formatRupee,
  formatWeight,
  parseTransactionDate,
} from '../../../utils/formatters';

export interface ActivityListItemProps {
  transaction: Transaction;
  onEdit: (_transaction: Transaction) => void;
}

export const ActivityListItem: React.FC<ActivityListItemProps> = ({
  transaction,
  onEdit,
}) => {
  const isSale = transaction.type === 'SALE';
  const isService = transaction.type === 'SERVICE';
  const isPayment = transaction.type === 'PAYMENT';
  const isPurchase = transaction.type === 'PURCHASE';
  const isExpense = transaction.type === 'EXPENSE';

  const txDate = parseTransactionDate(transaction.date) || new Date();
  const dayStr = txDate.getDate().toString().padStart(2, '0');
  const monthStr = txDate.toLocaleString('default', { month: 'short' });

  const amount = isPayment
    ? transaction.paymentAmount || transaction.amount || 0
    : transaction.amount || 0;
  const cash = transaction.cashPaid || 0;
  const credit = transaction.remainingDue ?? Math.max(0, amount - cash);
  const isFullCashSale = (isSale || isService) && credit === 0 && cash > 0;
  const avgRate =
    transaction.weightKg && transaction.weightKg > 0
      ? amount / transaction.weightKg
      : 0;

  const displayName =
    isSale || isService || isPayment
      ? transaction.customerName || 'Customer'
      : transaction.vendorName ||
        (isPurchase
          ? 'Stock Procurement'
          : transaction.expenseCategory || 'Expense Payee');

  const displaySubtitle = isSale
    ? `${transaction.item || 'Crop'} • ${formatWeight(transaction.weightKg || 0)} @ ₹${avgRate.toFixed(2)}/kg`
    : isService
      ? `Service: ${transaction.item || 'General'}${transaction.note ? ` • ${transaction.note}` : ''}`
      : isPayment
        ? 'Payment Received & Dues Settled'
        : isPurchase
          ? `${transaction.item || 'Crop'} • ${formatWeight(transaction.weightKg || 0)} @ ₹${avgRate.toFixed(2)}/kg`
          : `${transaction.expenseCategory || 'General Expense'}${transaction.note ? ` • ${transaction.note}` : ''}`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-m3-outline-variant/60 bg-m3-surface-container-low p-3.5 transition-all hover:bg-m3-surface-container">
      {/* 1. Date on DD badge */}
      <div className="shadow-2xs flex min-w-[44px] flex-col items-center justify-center rounded-xl bg-m3-surface-container-high px-2.5 py-1.5 text-center">
        <span className="text-base font-black leading-tight text-m3-primary">
          {dayStr}
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-m3-on-surface-variant">
          {monthStr}
        </span>
      </div>

      {/* 2. Details: Name, Item, Subtitle, Tags */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-bold text-m3-on-surface">
            {displayName}
          </span>

          {/* Status / Category Badges */}
          {isFullCashSale && (
            <span className="py-0.2 rounded bg-teal-500/10 px-1.5 text-[9px] font-bold text-teal-600 dark:text-teal-400">
              Cash
            </span>
          )}
          {(isSale || isService) && credit > 0 && (
            <span className="py-0.2 rounded bg-purple-500/10 px-1.5 text-[9px] font-bold text-purple-600 dark:text-purple-400">
              Credit
            </span>
          )}
          {isService && (
            <span className="py-0.2 rounded bg-cyan-500/10 px-1.5 text-[9px] font-bold text-cyan-600 dark:text-cyan-400">
              Service
            </span>
          )}
          {isPurchase && (
            <span className="py-0.2 rounded bg-amber-500/10 px-1.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
              {transaction.item || 'Stock'}
            </span>
          )}
          {isExpense && (
            <span className="py-0.2 rounded bg-rose-500/10 px-1.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
              {transaction.expenseCategory || 'Expense'}
            </span>
          )}
        </div>

        <div className="truncate text-[11px] font-medium text-m3-on-surface-variant">
          {displaySubtitle}
        </div>
      </div>

      {/* 3. Amount & Edit Action */}
      <div className="flex items-center gap-2.5">
        <div className="text-right">
          <div
            className={cn(
              'text-xs font-black tracking-tight',
              isPayment && 'text-emerald-600 dark:text-emerald-400',
              (isSale || isService) && 'text-m3-on-surface',
              isPurchase && 'text-amber-600 dark:text-amber-400',
              isExpense && 'text-rose-600 dark:text-rose-400',
            )}
          >
            {formatRupee(amount)}
          </div>
          <div className="text-[9px] font-medium text-m3-on-surface-variant">
            {isPayment
              ? 'Payment'
              : isService
                ? 'Service'
                : isSale
                  ? 'Sale'
                  : isPurchase
                    ? 'Purchase'
                    : 'Expense'}
          </div>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          className="rounded-full border border-m3-outline-variant/80 bg-m3-surface p-2 text-m3-on-surface-variant transition-all hover:border-m3-primary hover:bg-m3-primary/10 hover:text-m3-primary active:scale-95"
          title="Edit Record"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
