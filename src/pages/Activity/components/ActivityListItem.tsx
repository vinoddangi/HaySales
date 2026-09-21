import { Calendar, Edit3 } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../components/common';
import { Transaction } from '../../../types';
import { cn } from '../../../utils/cn';
import { sanitizeTransactionDisplay } from '../../../utils/dataSanitizer';
import { formatRupee } from '../../../utils/formatters';

export interface ActivityListItemProps {
  transaction: Transaction;
  onEdit: (_transaction: Transaction) => void;
}

export const ActivityListItem: React.FC<ActivityListItemProps> = ({
  transaction,
  onEdit,
}) => {
  const itemData = sanitizeTransactionDisplay(transaction);

  // Subtle border / background accent by activity nature
  const getNatureCardStyle = () => {
    if (itemData.isPayment)
      return 'border-emerald-500/30 bg-emerald-500/[0.02]';
    if (itemData.isFullCash)
      return 'border-emerald-500/20 bg-emerald-500/[0.02]';
    if (itemData.isFullCredit || itemData.isPartialCash)
      return 'border-purple-500/20 bg-purple-500/[0.02]';
    if (itemData.isService) return 'border-sky-500/20 bg-sky-500/[0.02]';
    if (itemData.isPurchase) return 'border-amber-500/20 bg-amber-500/[0.02]';
    if (itemData.isExpense) return 'border-rose-500/20 bg-rose-500/[0.02]';
    return 'border-m3-outline-variant/60 bg-m3-surface-container-low';
  };

  return (
    <div
      className={cn(
        'hover:shadow-xs rounded-2xl border p-3.5 transition-all hover:border-m3-outline-variant hover:bg-m3-surface-container/60',
        getNatureCardStyle(),
      )}
    >
      {/* Header Row: Large Customer Name & Amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Customer / Party Name - Large size */}
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-base font-black tracking-tight text-m3-on-surface sm:text-lg">
              {itemData.displayName}
            </h3>

            {/* Badges */}
            <Badge variant={itemData.badgeSentiment} size="sm">
              {itemData.badgeLabel}
            </Badge>
          </div>

          {/* Subtitle / Item & Rate Specs */}
          <p className="mt-1 line-clamp-1 text-xs font-medium text-m3-on-surface-variant">
            {itemData.displaySubtitle}
          </p>
        </div>

        {/* Right Section: Large Amount & Type */}
        <div className="shrink-0 text-right">
          <div
            className={cn(
              'text-base font-black tracking-tight sm:text-lg',
              itemData.amountColorClass,
            )}
          >
            {itemData.formattedAmount}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
            {itemData.typeLabel}
          </div>
        </div>
      </div>

      {/* Footer / Meta Row: Date, Payment Nature & Edit Action */}
      <div className="mt-2.5 flex items-center justify-between border-t border-m3-outline-variant/40 pt-2 text-[11px] text-m3-on-surface-variant">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date */}
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-3 w-3 opacity-70" />
            <span>{itemData.formattedDate}</span>
          </div>

          {/* Settlement Status */}
          {itemData.isPartialCash ? (
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">
                Paid: {formatRupee(itemData.cashPaid)}
              </span>
              <span className="text-m3-outline">•</span>
              <span className="text-rose-600 dark:text-rose-400">
                Due: {formatRupee(itemData.remainingDue)}
              </span>
            </div>
          ) : itemData.isFullCash ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Paid in Full
            </span>
          ) : itemData.isFullCredit ? (
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              Full Credit Due
            </span>
          ) : itemData.isPayment ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Payment Received
            </span>
          ) : null}
        </div>

        {/* Edit Action Button in Footer */}
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-m3-primary transition-all hover:bg-m3-primary/10 active:scale-95"
          title="Edit Record"
          aria-label="Edit Record"
        >
          <Edit3 className="h-3 w-3" />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
};
