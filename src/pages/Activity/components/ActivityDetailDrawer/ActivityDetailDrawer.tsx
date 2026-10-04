import { X } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Button } from '../../../../components/Button';
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
import './ActivityDetailDrawer.css';

export interface ActivityDetailDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityDetailDrawer: React.FC<ActivityDetailDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

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
    'N/A';

  const weightKg = cropTx.weight;
  const derivedRate = getRate(transaction);

  let badgeLabel = 'Transaction';
  let badgeSentiment:
    'positive' | 'negative' | 'warning' | 'info' | 'neutral' | 'accent' =
    'neutral';

  if (isSale) {
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
    badgeLabel = 'Payment';
    badgeSentiment = 'positive';
  } else if (isService) {
    badgeLabel = 'Service';
    badgeSentiment = 'neutral';
  } else if (isExpense) {
    badgeLabel = 'Expense';
    badgeSentiment = 'negative';
  } else if (isOpening) {
    badgeLabel = 'Opening Due';
    badgeSentiment = 'warning';
  }

  return (
    <div
      className="hs-activity-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hs-activity-drawer">
        <div className="hs-activity-drawer__handle" />

        <Flex direction="column" gap="md" fullWidth>
          {/* Header */}
          <Flex align="center" justify="between" fullWidth>
            <Flex align="center" gap="xs">
              <Text variant="title-md" weight="bold">
                Transaction Details
              </Text>
              <Badge sentiment={badgeSentiment} size="md">
                {badgeLabel}
              </Badge>
            </Flex>
            <button
              type="button"
              aria-label="Close details"
              onClick={onClose}
              className="text-m3-on-surface-variant hover:text-m3-on-surface p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </Flex>

          {/* Details Table */}
          <div className="hs-activity-drawer__content">
            <div className="hs-activity-drawer__row">
              <Text variant="body-sm" appearance="secondary">
                Transaction ID
              </Text>
              <Text variant="body-sm" weight="medium">
                {transaction.id || 'N/A'}
              </Text>
            </div>

            <div className="hs-activity-drawer__row">
              <Text variant="body-sm" appearance="secondary">
                Date
              </Text>
              <Text variant="body-sm" weight="medium">
                {formatDate(transaction.date)}
              </Text>
            </div>

            <div className="hs-activity-drawer__row">
              <Text variant="body-sm" appearance="secondary">
                Associated Party
              </Text>
              <Text variant="body-sm" weight="bold">
                {partyName}
              </Text>
            </div>

            <div className="hs-activity-drawer__row">
              <Text variant="body-sm" appearance="secondary">
                Category
              </Text>
              <Text variant="body-sm" weight="medium">
                {(transaction as any).category || 'N/A'}
              </Text>
            </div>

            {typeof weightKg === 'number' && weightKg > 0 && (
              <div className="hs-activity-drawer__row">
                <Text variant="body-sm" appearance="secondary">
                  Weight
                </Text>
                <Text variant="body-sm" weight="bold" sentiment="neutral">
                  {formatWeight(weightKg)}
                </Text>
              </div>
            )}

            {typeof derivedRate === 'number' && (
              <div className="hs-activity-drawer__row">
                <Text variant="body-sm" appearance="secondary">
                  Derived Rate
                </Text>
                <Text variant="body-sm" weight="bold" sentiment="accent">
                  ₹{derivedRate} / Kg
                </Text>
              </div>
            )}

            <div className="hs-activity-drawer__row">
              <Text variant="body-sm" appearance="secondary">
                Total Amount
              </Text>
              <Text variant="title-md" weight="bold" sentiment="accent">
                {formatRupee(amount)}
              </Text>
            </div>

            <div className="hs-activity-drawer__row">
              <Text variant="body-sm" appearance="secondary">
                Cash Settled
              </Text>
              <Text variant="body-sm" weight="bold" sentiment="positive">
                {formatRupee(cash)}
              </Text>
            </div>

            <div className="hs-activity-drawer__row">
              <Text variant="body-sm" appearance="secondary">
                Remaining Due (Credit)
              </Text>
              <Text variant="body-sm" weight="bold" sentiment="warning">
                {formatRupee(credit)}
              </Text>
            </div>

            {transaction.note && (
              <div className="hs-activity-drawer__row">
                <Text variant="body-sm" appearance="secondary">
                  Notes
                </Text>
                <Text variant="body-sm" appearance="secondary">
                  {transaction.note}
                </Text>
              </div>
            )}
          </div>

          {/* Close Action */}
          <Button variant="tonal" fullWidth onClick={onClose}>
            Close
          </Button>
        </Flex>
      </div>
    </div>
  );
};

export default ActivityDetailDrawer;
