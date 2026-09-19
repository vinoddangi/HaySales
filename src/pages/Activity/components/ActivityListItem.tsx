import { Edit3 } from 'lucide-react';
import React from 'react';
import { Badge, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { Transaction } from '../../../types';
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

  const amountColor = isPayment
    ? 'success'
    : isPurchase
      ? 'warning'
      : isExpense
        ? 'error'
        : 'onSurface';

  const typeLabel = isPayment
    ? 'Payment'
    : isService
      ? 'Service'
      : isSale
        ? 'Sale'
        : isPurchase
          ? 'Purchase'
          : 'Expense';

  return (
    <Flex
      align="center"
      justify="between"
      gap="md"
      fullWidth
      padding="md"
      className="rounded-2xl border border-m3-outline-variant/60 bg-m3-surface-container-low transition-all hover:bg-m3-surface-container"
    >
      {/* 1. Date badge */}
      <Flex
        direction="column"
        align="center"
        justify="center"
        paddingHorizontal="sm"
        paddingVertical="xs"
        className="shadow-2xs min-w-[44px] rounded-xl bg-m3-surface-container-high text-center"
      >
        <span className="text-base font-black leading-tight text-m3-primary">
          {dayStr}
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-m3-on-surface-variant">
          {monthStr}
        </span>
      </Flex>

      {/* 2. Details: Name, Item, Subtitle, Tags */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <Flex align="center" gap="xs">
          <Text
            variant="body-sm"
            weight="bold"
            color="onSurface"
            className="truncate"
          >
            {displayName}
          </Text>

          {/* Status / Category Badges */}
          {isFullCashSale && <Badge variant="cash">Cash</Badge>}
          {(isSale || isService) && credit > 0 && (
            <Badge variant="credit">Credit</Badge>
          )}
          {isService && <Badge variant="service">Service</Badge>}
          {isPurchase && (
            <Badge variant="purchase">{transaction.item || 'Stock'}</Badge>
          )}
          {isExpense && (
            <Badge variant="expense">
              {transaction.expenseCategory || 'Expense'}
            </Badge>
          )}
        </Flex>

        <Text variant="caption" color="muted" className="block truncate">
          {displaySubtitle}
        </Text>
      </div>

      {/* 3. Amount & Edit Action */}
      <Flex align="center" gap="sm">
        <div className="text-right">
          <Text variant="amount" color={amountColor} className="block">
            {formatRupee(amount)}
          </Text>
          <Text variant="caption" color="muted">
            {typeLabel}
          </Text>
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
      </Flex>
    </Flex>
  );
};
