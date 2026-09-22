import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import { Badge, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { Transaction } from '../../../types';
import { cn } from '../../../utils/cn';
import { sanitizeTransactionDisplay } from '../../../utils/dataSanitizer';
import { formatRupee } from '../../../utils/formatters';

export interface TransactionHistoryItemProps {
  transaction: Transaction;
  isCleared: boolean;
}

export const TransactionHistoryItem: React.FC<TransactionHistoryItemProps> = ({
  transaction: tx,
  isCleared,
}) => {
  const data = sanitizeTransactionDisplay(tx);

  const isFullCashSale =
    data.isSale && data.remainingDue === 0 && data.cashPaid > 0;
  const isPartialCash =
    data.isSale && data.cashPaid > 0 && data.remainingDue > 0;

  const title = data.isPayment
    ? 'Payment Received'
    : data.isOpening
      ? 'Previous Outstanding'
      : data.isService
        ? `Service: ${data.item}`
        : isFullCashSale
          ? `Cash Sale: ${data.item}`
          : `Sale: ${data.item}`;

  const subtitle =
    !data.isPayment && !data.isOpening && !data.isService && data.weightKg > 0
      ? `${data.formattedWeight} @ ${data.formattedRate} • ${data.formattedDate}`
      : data.weightKg > 0
        ? `${data.formattedWeight} • ${data.formattedDate}`
        : data.formattedDate;

  return (
    <Flex
      align="center"
      justify="between"
      fullWidth
      padding="md"
      className={cn('relative rounded-xl border text-xs transition-all', {
        'shadow-xs border-emerald-500/40 bg-emerald-500/[0.08]': isCleared,
        'border-emerald-500/30 bg-emerald-500/[0.05]':
          !isCleared && isFullCashSale,
        'border-emerald-500/20 bg-emerald-500/[0.03]':
          !isCleared && !isFullCashSale && data.isPayment,
        'border-amber-500/30 bg-amber-500/[0.04]':
          !isCleared && !isFullCashSale && data.isOpening,
        'border-sky-500/40 bg-sky-500/[0.08]': !isCleared && data.isService,
        'border-m3-outline-variant bg-m3-surface-container-low':
          !isCleared &&
          !isFullCashSale &&
          !data.isPayment &&
          !data.isOpening &&
          !data.isService,
      })}
    >
      {/* 1. Left Section: Title, Badges, and Details */}
      <div className="space-y-1">
        <Flex wrap align="center" gap="xs">
          <Text styleAs="body-sm" appearance="primary" weight="bold">
            {title}
          </Text>

          {data.isPayment && (
            <Badge sentiment="positive" size="sm">
              Cash In
            </Badge>
          )}
          {data.isService && (
            <Badge sentiment="service" size="sm">
              🔧 Service Income
            </Badge>
          )}
          {isFullCashSale && (
            <Badge sentiment="positive" size="sm">
              💵 100% Cash
            </Badge>
          )}
          {data.isOpening && (
            <Badge sentiment="warning" size="sm">
              Opening Due
            </Badge>
          )}
          {isPartialCash && (
            <Badge sentiment="credit" size="sm">
              Part-Cash
            </Badge>
          )}
          {!data.isPayment &&
            !data.isService &&
            !isFullCashSale &&
            !data.isOpening &&
            !isPartialCash && (
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

      {/* 2. Right Section: Amounts & Balances with Payment-Nature Colors */}
      <div className="space-y-0.5 text-right">
        {data.isPayment ? (
          <Text
            styleAs="amount"
            weight="black"
            className={cn('block', data.amountColorClass)}
          >
            {formatRupee(data.paymentAmount)}
          </Text>
        ) : isFullCashSale ? (
          <div>
            <Text
              styleAs="amount"
              weight="black"
              className={cn('block', data.amountColorClass)}
            >
              {formatRupee(data.cashPaid)}
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
              Total: {formatRupee(data.amount)}
            </Text>
            {data.cashPaid > 0 && (
              <Text
                styleAs="caption"
                sentiment="positive"
                weight="semibold"
                className="block"
              >
                Cash: {formatRupee(data.cashPaid)}
              </Text>
            )}
            {data.remainingDue > 0 && (
              <Text
                styleAs="body-sm"
                weight="bold"
                className={cn('block', data.amountColorClass)}
              >
                Due: {formatRupee(data.remainingDue)}
              </Text>
            )}
          </>
        )}
      </div>
    </Flex>
  );
};
