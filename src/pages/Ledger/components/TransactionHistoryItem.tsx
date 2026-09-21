import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import { Badge, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { Transaction } from '../../../types';
import { cn } from '../../../utils/cn';
import {
  formatDate,
  formatRupee,
  formatWeightWithRate,
} from '../../../utils/formatters';

export interface TransactionHistoryItemProps {
  transaction: Transaction;
  isCleared: boolean;
}

export const TransactionHistoryItem: React.FC<TransactionHistoryItemProps> = ({
  transaction: tx,
  isCleared,
}) => {
  const isPayment = tx.type === 'PAYMENT';
  const isService = tx.type === 'SERVICE';
  const isOpening =
    tx.type === 'OPENING_BALANCE' || tx.item === 'Previous Outstanding';
  const paymentVal = isPayment
    ? Number(tx.paymentAmount) || Number(tx.amount) || 0
    : 0;
  const amount = Number(tx.amount) || 0;
  const cash = Number(tx.cashPaid) || 0;
  const credit =
    tx.remainingDue !== undefined
      ? Number(tx.remainingDue) || 0
      : Math.max(0, amount - cash);
  const isFullCashSale = !isPayment && !isOpening && credit === 0 && cash > 0;
  const isPartialCash = !isPayment && !isOpening && cash > 0 && credit > 0;

  const title = isPayment
    ? 'Payment Received'
    : isOpening
      ? 'Previous Outstanding'
      : isService
        ? `Service: ${tx.item || 'Service'}`
        : isFullCashSale
          ? `Cash Sale: ${tx.item || 'Item'}`
          : `Sale: ${tx.item || 'Item'}`;

  const subtitle =
    !isPayment && !isOpening && !isService && tx.weightKg && tx.weightKg > 0
      ? `${formatWeightWithRate(tx.weightKg, tx.rate, tx.amount)} • ${formatDate(tx.date)}`
      : tx.weightKg
        ? `${tx.weightKg.toLocaleString('en-IN')} kg • ${formatDate(tx.date)}`
        : formatDate(tx.date);

  return (
    <Flex
      align="center"
      justify="between"
      fullWidth
      padding="md"
      className={cn('relative rounded-xl border text-xs transition-all', {
        'shadow-xs border-emerald-500/40 bg-emerald-500/[0.08]': isCleared,
        'border-teal-500/30 bg-teal-500/[0.05]': !isCleared && isFullCashSale,
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
      })}
    >
      {/* 1. Left Section: Title, Badges, and Details */}
      <div className="space-y-1">
        <Flex wrap align="center" gap="xs">
          <Text styleAs="body-sm" appearance="primary" weight="bold">
            {title}
          </Text>

          {isPayment && (
            <Badge sentiment="positive" size="sm">
              Cash In
            </Badge>
          )}
          {isFullCashSale && (
            <Badge sentiment="positive" size="sm">
              💵 100% Cash
            </Badge>
          )}
          {isOpening && (
            <Badge sentiment="warning" size="sm">
              Opening Due
            </Badge>
          )}
          {isPartialCash && (
            <Badge sentiment="credit" size="sm">
              Part-Cash
            </Badge>
          )}
          {!isPayment && !isFullCashSale && !isOpening && !isPartialCash && (
            <Badge sentiment="neutral" size="sm">
              Credit Invoice
            </Badge>
          )}

          {/* Zero Due / Settled Milestone Highlight */}
          {isCleared && (
            <span className="shadow-xs inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-extrabold text-white">
              <CheckCircle2 className="h-3 w-3" />
              <span>0 DUE • ALL CLEAR</span>
            </span>
          )}
        </Flex>

        <Text styleAs="caption" appearance="secondary" className="block">
          {subtitle}
        </Text>
      </div>

      {/* 2. Right Section: Amounts & Balances */}
      <div className="space-y-0.5 text-right">
        {isPayment ? (
          <Text
            styleAs="amount"
            sentiment="positive"
            weight="black"
            className="block"
          >
            {formatRupee(paymentVal)}
          </Text>
        ) : isFullCashSale ? (
          <div>
            <Text
              styleAs="amount"
              sentiment="positive"
              weight="black"
              className="block"
            >
              {formatRupee(cash)}
            </Text>
            <Text
              styleAs="caption"
              sentiment="positive"
              weight="semibold"
              className="block"
            >
              Paid in Full (₹0 Due)
            </Text>
          </div>
        ) : (
          <>
            <Text styleAs="caption" appearance="secondary" className="block">
              Total: {formatRupee(amount)}
            </Text>
            {cash > 0 && (
              <Text
                styleAs="caption"
                sentiment="positive"
                weight="semibold"
                className="block"
              >
                Cash: {formatRupee(cash)}
              </Text>
            )}
            {credit > 0 && (
              <Text
                styleAs="body-sm"
                sentiment="negative"
                weight="bold"
                className="block"
              >
                Due: {formatRupee(credit)}
              </Text>
            )}
          </>
        )}
      </div>
    </Flex>
  );
};
