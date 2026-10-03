import clsx from 'clsx';
import { ChevronRight, Receipt } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Text } from '../../../../components/Text';
import {
  CropTransactionData,
  CustomerTransactionData,
  isExpenseTransaction,
  isPaymentTransaction,
  isPurchaseTransaction,
  isSaleTransaction,
  isServiceTransaction,
  Transaction,
} from '../../../../models';
import {
  formatDate,
  formatRupee,
  formatWeight,
} from '../../../../utils/formatters';
import './RecentActivityCard.css';

export interface RecentActivityCardProps {
  transactions: Transaction[];
  onViewAll?: () => void;
  className?: string;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  transactions,
  onViewAll,
  className,
}) => {
  // Sort descending by date and take latest 6 transactions
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 6);

  return (
    <Card
      variant="outlined"
      className={clsx('hs-recent-activity-card', className)}
    >
      <Card.Content>
        {/* Header */}
        <Flex
          align="center"
          justify="between"
          fullWidth
          className="hs-recent-activity-card__header"
        >
          <Text
            variant="label-sm"
            weight="bold"
            uppercase
            appearance="secondary"
          >
            Recent Activity &amp; Payments
          </Text>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="hs-recent-activity-card__link"
            >
              <Text variant="label-sm" weight="bold" sentiment="accent">
                View All Ledger
              </Text>
              <ChevronRight className="hs-recent-activity-card__link-icon" />
            </button>
          )}
        </Flex>

        {recent.length === 0 ? (
          <div className="hs-recent-activity-card__empty">
            <Text variant="body-sm" appearance="secondary">
              No activity or transactions recorded in this period.
            </Text>
          </div>
        ) : (
          <Flex
            direction="column"
            gap="xs"
            fullWidth
            className="hs-recent-activity-card__list"
          >
            {recent.map((tx, idx) => {
              const isPayment = isPaymentTransaction(tx);
              const isSale = isSaleTransaction(tx);
              const isService = isServiceTransaction(tx);
              const isPurchase = isPurchaseTransaction(tx);
              const isExpense = isExpenseTransaction(tx);

              const amount = Number(tx.amount || 0);
              const cash = Number(tx.cashPaid || 0);
              const credit = Number(
                tx.remainingDue ?? Math.max(0, amount - cash),
              );
              const isFullCashSale = isSale && credit === 0 && cash > 0;

              const custTx = tx as Partial<CustomerTransactionData>;
              const cropTx = tx as Partial<CropTransactionData>;
              const partyName =
                custTx.customerName ||
                (tx as any).vendorName ||
                (tx as any).partnerName ||
                '';

              const weightKg = cropTx.weight;

              let typeLabel = 'Sale Item';
              if (isPayment) typeLabel = 'Payment Received';
              else if (isService)
                typeLabel = `Service: ${(tx as any).category || 'Pickup'}`;
              else if (isPurchase)
                typeLabel = `Purchase: ${(tx as any).category || 'Item'}`;
              else if (isExpense)
                typeLabel = `Expense: ${(tx as any).category || 'General'}`;
              else if (isSale)
                typeLabel = `Sale: ${(tx as any).category || 'Crop'}`;

              return (
                <div
                  key={tx.id || `tx-${idx}`}
                  className="hs-recent-activity-item"
                >
                  <Flex align="center" justify="between" fullWidth>
                    <Flex direction="column" gap="xs">
                      <Flex align="center" gap="xs">
                        {isPayment && (
                          <Receipt className="hs-recent-activity-item__icon hs-recent-activity-item__icon--payment" />
                        )}
                        <Text variant="body-sm" weight="bold">
                          {typeLabel}
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
                        {credit > 0 && isSale && (
                          <Badge sentiment="credit" size="sm">
                            Credit
                          </Badge>
                        )}
                      </Flex>

                      <Flex align="center" gap="xs">
                        {partyName && (
                          <>
                            <Text variant="caption" weight="medium">
                              {partyName}
                            </Text>
                            <Text variant="caption" appearance="secondary">
                              •
                            </Text>
                          </>
                        )}
                        <Text variant="caption" appearance="secondary">
                          {formatDate(tx.date)}
                        </Text>
                        {typeof weightKg === 'number' && weightKg > 0 && (
                          <>
                            <Text variant="caption" appearance="secondary">
                              •
                            </Text>
                            <Text variant="caption" appearance="secondary">
                              {formatWeight(weightKg)}
                            </Text>
                          </>
                        )}
                      </Flex>
                    </Flex>

                    <Text
                      variant="body-md"
                      weight="bold"
                      sentiment={isPayment ? 'info' : 'neutral'}
                    >
                      {formatRupee(amount)}
                    </Text>
                  </Flex>
                </div>
              );
            })}
          </Flex>
        )}
      </Card.Content>
    </Card>
  );
};

export default RecentActivityCard;
