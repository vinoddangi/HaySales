import { ChevronRight } from 'lucide-react';
import React from 'react';
import { Badge, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
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
    <Flex direction="column" gap="sm" fullWidth>
      <Flex align="center" justify="between" fullWidth>
        <Text styleAs="label" appearance="secondary" uppercase>
          Recent Activity
        </Text>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-bold text-m3-primary hover:underline"
        >
          <span>View Ledger</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </Flex>

      <Flex direction="column" gap="sm" fullWidth>
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
            <Flex
              key={tx.id || Math.random().toString()}
              align="center"
              justify="between"
              fullWidth
              padding="sm"
              className="rounded-xl border border-m3-outline-variant bg-m3-surface-container-low text-xs"
            >
              <div className="space-y-0.5">
                <Flex align="center" gap="xs">
                  <Text styleAs="body-sm" appearance="primary" weight="bold">
                    {isPayment
                      ? 'Payment Received'
                      : isOpening
                        ? 'Opening Balance'
                        : tx.item || 'Sale Item'}
                  </Text>
                  {isFullCashSale && (
                    <Badge sentiment="positive" size="sm">
                      Cash
                    </Badge>
                  )}
                  {credit > 0 && !isPayment && !isOpening && (
                    <Badge sentiment="credit" size="sm">
                      Credit
                    </Badge>
                  )}
                </Flex>
                <Flex align="center" gap="xs">
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

              <Text styleAs="body-sm" appearance="primary" weight="black">
                {formatRupee(amount)}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
};
