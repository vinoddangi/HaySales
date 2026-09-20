import { ChevronRight, ReceiptCent } from 'lucide-react';
import React from 'react';
import { Badge, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { Transaction } from '../../../types';
import {
  formatDate,
  formatRupee,
  formatWeight,
  parseTransactionDate,
} from '../../../utils/formatters';

export interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

export const RecentTransactionsWidget: React.FC<
  RecentTransactionsWidgetProps
> = ({ transactions, onViewAll }) => {
  // Sort descending by date and take latest 6 transactions
  const sorted = [...transactions].sort((a, b) => {
    const timeA = parseTransactionDate(a.date)?.getTime() || 0;
    const timeB = parseTransactionDate(b.date)?.getTime() || 0;
    return timeB - timeA;
  });
  const recent = sorted.slice(0, 6);

  if (recent.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-m3-outline-variant p-6 text-center text-xs text-m3-on-surface-variant">
        No activity or payments recorded in this period.
      </div>
    );
  }

  return (
    <Flex direction="column" gap="sm" fullWidth>
      <Flex align="center" justify="between" fullWidth>
        <Text styleAs="label" appearance="secondary" uppercase>
          Recent Activity & Payments
        </Text>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-bold text-m3-primary hover:underline"
        >
          <span>View All Ledger</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </Flex>

      <Flex direction="column" gap="sm" fullWidth>
        {recent.map((tx) => {
          const isPayment = tx.type === 'PAYMENT';
          const isPurchase = tx.type === 'PURCHASE';
          const isExpense = tx.type === 'EXPENSE';
          const isOpening =
            tx.type === 'OPENING_BALANCE' || tx.item === 'Previous Outstanding';
          const amount = isPayment
            ? tx.paymentAmount || Number(tx.amount) || 0
            : tx.amount || 0;
          const cash = tx.cashPaid || 0;
          const credit = tx.remainingDue ?? amount - cash;
          const isFullCashSale =
            !isPayment &&
            !isPurchase &&
            !isExpense &&
            !isOpening &&
            credit === 0 &&
            cash > 0;
          const partyName = tx.customerName || tx.vendorName || '';

          return (
            <Flex
              key={tx.id || Math.random().toString()}
              align="center"
              justify="between"
              fullWidth
              padding="sm"
              className="rounded-xl border border-m3-outline-variant bg-m3-surface-container-low text-xs transition-colors hover:border-m3-outline"
            >
              <div className="space-y-0.5">
                <Flex align="center" gap="xs">
                  {isPayment && (
                    <ReceiptCent className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  )}
                  <Text styleAs="body-sm" appearance="primary" weight="bold">
                    {isPayment
                      ? 'Payment Received'
                      : isPurchase
                        ? `Purchase: ${tx.item || 'Item'}`
                        : isExpense
                          ? `Expense: ${tx.expenseCategory || 'General'}`
                          : isOpening
                            ? 'Opening Balance'
                            : tx.item || 'Sale Item'}
                  </Text>
                  {isPayment && (
                    <Badge sentiment="info" size="sm">
                      Payment
                    </Badge>
                  )}
                  {isFullCashSale && (
                    <Badge sentiment="positive" size="sm">
                      Cash
                    </Badge>
                  )}
                  {credit > 0 &&
                    !isPayment &&
                    !isPurchase &&
                    !isExpense &&
                    !isOpening && (
                      <Badge sentiment="credit" size="sm">
                        Credit
                      </Badge>
                    )}
                </Flex>
                <Flex align="center" gap="xs">
                  {partyName && (
                    <>
                      <Text
                        styleAs="caption"
                        appearance="primary"
                        weight="medium"
                      >
                        {partyName}
                      </Text>
                      <Text styleAs="caption" appearance="secondary">
                        •
                      </Text>
                    </>
                  )}
                  <Text styleAs="caption" appearance="secondary">
                    {formatDate(tx.date)}
                  </Text>
                  {tx.weightKg ? (
                    <>
                      <Text styleAs="caption" appearance="secondary">
                        •
                      </Text>
                      <Text styleAs="caption" appearance="secondary">
                        {formatWeight(tx.weightKg)}
                      </Text>
                    </>
                  ) : null}
                </Flex>
              </div>

              <Text
                styleAs="body-sm"
                appearance="primary"
                weight="black"
                className={isPayment ? 'text-blue-600 dark:text-blue-400' : ''}
              >
                {formatRupee(amount)}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
};
