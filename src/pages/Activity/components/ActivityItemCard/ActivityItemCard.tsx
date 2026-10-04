import clsx from 'clsx';
import {
  CreditCard,
  FileText,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Wrench,
} from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Text } from '../../../../components/Text';
import {
  CropTransactionData,
  CustomerTransactionData,
  ExpenseTransactionData,
  getRate,
  isExpenseTransaction,
  isOpeningDueTransaction,
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
import './ActivityItemCard.css';

export interface ActivityItemCardProps {
  transaction: Transaction;
  onClick?: (_tx: Transaction) => void;
  className?: string;
}

export const ActivityItemCard: React.FC<ActivityItemCardProps> = ({
  transaction,
  onClick,
  className,
}) => {
  const isSale = isSaleTransaction(transaction);
  const isPurchase = isPurchaseTransaction(transaction);
  const isPayment = isPaymentTransaction(transaction);
  const isService = isServiceTransaction(transaction);
  const isExpense = isExpenseTransaction(transaction);
  const isOpening = isOpeningDueTransaction(transaction);

  const amount = Number(transaction.amount || 0);
  const cash = Number(transaction.cashPaid || 0);
  const credit = Number(transaction.remainingDue ?? Math.max(0, amount - cash));

  const custTx = transaction as Partial<CustomerTransactionData>;
  const expTx = transaction as Partial<ExpenseTransactionData>;
  const cropTx = transaction as Partial<CropTransactionData>;

  const partyName =
    custTx.customerName ||
    expTx.vendorName ||
    expTx.partnerName ||
    custTx.customerId ||
    '';

  const weightKg = cropTx.weight;
  const derivedRate = getRate(transaction);

  // Determine Type labels, icons, and short badge sentiment
  let typeLabel = 'Transaction';
  let iconWrapClass = 'hs-activity-item-card__icon-wrap--sale';
  let IconComp = FileText;
  let badgeLabel = 'Transaction';
  let badgeSentiment:
    'positive' | 'negative' | 'warning' | 'info' | 'neutral' | 'accent' =
    'neutral';

  if (isSale) {
    typeLabel = `Sale: ${transaction.category || 'Crop'}`;
    iconWrapClass = 'hs-activity-item-card__icon-wrap--sale';
    IconComp = ShoppingBag;
    if (credit === 0 && (cash > 0 || amount === 0)) {
      badgeLabel = 'Cash';
      badgeSentiment = 'positive';
    } else if (cash === 0 && credit > 0) {
      badgeLabel = 'Credit';
      badgeSentiment = 'warning';
    } else if (cash > 0 && credit > 0) {
      badgeLabel = 'Partial Credit';
      badgeSentiment = 'info';
    } else {
      badgeLabel = 'Sale';
      badgeSentiment = 'accent';
    }
  } else if (isPurchase) {
    typeLabel = `Purchase: ${transaction.category || 'Crop'}`;
    iconWrapClass = 'hs-activity-item-card__icon-wrap--purchase';
    IconComp = ShoppingCart;
    if (credit === 0 && (cash > 0 || amount === 0)) {
      badgeLabel = 'Cash';
      badgeSentiment = 'positive';
    } else if (cash === 0 && credit > 0) {
      badgeLabel = 'Credit';
      badgeSentiment = 'warning';
    } else if (cash > 0 && credit > 0) {
      badgeLabel = 'Partial Credit';
      badgeSentiment = 'info';
    } else {
      badgeLabel = 'Purchase';
      badgeSentiment = 'info';
    }
  } else if (isPayment) {
    typeLabel = 'Payment Received';
    iconWrapClass = 'hs-activity-item-card__icon-wrap--payment';
    IconComp = Receipt;
    badgeLabel = 'Payment';
    badgeSentiment = 'positive';
  } else if (isService) {
    typeLabel = `Service: ${(transaction as any).category || 'Charge'}`;
    iconWrapClass = 'hs-activity-item-card__icon-wrap--service';
    IconComp = Truck;
    badgeLabel = 'Service';
    badgeSentiment = 'neutral';
  } else if (isExpense) {
    typeLabel = `Expense: ${(transaction as any).category || 'General'}`;
    iconWrapClass = 'hs-activity-item-card__icon-wrap--expense';
    IconComp = Wrench;
    badgeLabel = 'Expense';
    badgeSentiment = 'negative';
  } else if (isOpening) {
    typeLabel = 'Opening Due Balance';
    iconWrapClass = 'hs-activity-item-card__icon-wrap--payment';
    IconComp = CreditCard;
    badgeLabel = 'Opening Due';
    badgeSentiment = 'warning';
  }

  return (
    <Card
      variant="outlined"
      onClick={() => onClick?.(transaction)}
      className={clsx('hs-activity-item-card', className)}
    >
      <Card.Content>
        <Flex direction="column" gap="xs" fullWidth>
          {/* Main Top Row */}
          <Flex align="center" justify="between" fullWidth gap="sm">
            {/* Icon + Basic Info */}
            <Flex align="center" gap="sm" className="min-w-0">
              <div
                className={clsx(
                  'hs-activity-item-card__icon-wrap',
                  iconWrapClass,
                )}
              >
                <IconComp className="hs-activity-item-card__icon" />
              </div>

              <Flex direction="column" gap="none" className="min-w-0">
                <Flex align="center" gap="xs" wrap>
                  <Text variant="body-md" weight="bold" truncate>
                    {typeLabel}
                  </Text>
                  <Badge sentiment={badgeSentiment} size="sm">
                    {badgeLabel}
                  </Badge>
                </Flex>

                {partyName && (
                  <Text
                    variant="body-sm"
                    weight="medium"
                    appearance="secondary"
                    truncate
                  >
                    {partyName}
                  </Text>
                )}
              </Flex>
            </Flex>

            {/* Amount */}
            <Flex
              direction="column"
              align="end"
              gap="none"
              className="shrink-0"
            >
              <Text
                variant="title-md"
                weight="bold"
                sentiment={
                  isPayment || isSale
                    ? 'accent'
                    : isExpense
                      ? 'negative'
                      : 'neutral'
                }
              >
                {formatRupee(amount)}
              </Text>
              <Text variant="caption" appearance="secondary">
                {formatDate(transaction.date)}
              </Text>
            </Flex>
          </Flex>

          {/* Secondary Details Row (Weight, Rate, Breakdown) */}
          {((typeof weightKg === 'number' && weightKg > 0) ||
            typeof derivedRate === 'number' ||
            (cash > 0 && credit > 0) ||
            transaction.note) && (
            <Flex
              align="center"
              justify="between"
              fullWidth
              wrap
              gap="xs"
              className="hs-activity-item-card__details"
            >
              {/* Weight & Derived Rate */}
              <Flex align="center" gap="xs">
                {typeof weightKg === 'number' && weightKg > 0 && (
                  <Flex align="center" gap="none">
                    <Text variant="caption" appearance="secondary">
                      Weight:&nbsp;
                    </Text>
                    <Text variant="caption" weight="bold">
                      {formatWeight(weightKg)}
                    </Text>
                  </Flex>
                )}
                {typeof derivedRate === 'number' && (
                  <>
                    <Text variant="caption" appearance="secondary">
                      •
                    </Text>
                    <Flex align="center" gap="none">
                      <Text variant="caption" appearance="secondary">
                        Rate:&nbsp;
                      </Text>
                      <Text variant="caption" weight="bold">
                        ₹{derivedRate}/Kg
                      </Text>
                    </Flex>
                  </>
                )}
              </Flex>

              {/* Cash & Credit Breakdown / Note */}
              <Flex align="center" gap="xs">
                {cash > 0 && credit > 0 && (
                  <Text variant="caption" appearance="secondary">
                    Cash: {formatRupee(cash)} | Due: {formatRupee(credit)}
                  </Text>
                )}
                {transaction.note && (
                  <Text
                    variant="caption"
                    appearance="secondary"
                    truncate
                    className="max-w-[200px]"
                  >
                    {transaction.note}
                  </Text>
                )}
              </Flex>
            </Flex>
          )}
        </Flex>
      </Card.Content>
    </Card>
  );
};

export default ActivityItemCard;
