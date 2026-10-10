import React from 'react';
import { Card, FlexLayout, Pill, StackLayout, Text } from '@salt-ds/core';
import { clsx } from 'clsx';
import {
  CreditCard,
  Edit3,
  FileText,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Wrench,
} from 'lucide-react';
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
  onEdit?: (_tx: Transaction) => void;
  className?: string;
}

export const ActivityItemCard: React.FC<ActivityItemCardProps> = ({
  transaction,
  onClick,
  onEdit,
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

  let typeLabel = 'Transaction';
  let iconWrapClass = 'hs-activity-item-card__icon-wrap--sale';
  let IconComp = FileText;
  let badgeLabel = 'Transaction';

  if (isSale) {
    typeLabel = `Sale: ${transaction.category || 'Crop'}`;
    iconWrapClass = 'hs-activity-item-card__icon-wrap--sale';
    IconComp = ShoppingBag;
    if (credit === 0 && (cash > 0 || amount === 0)) {
      badgeLabel = 'Cash';
    } else if (cash === 0 && credit > 0) {
      badgeLabel = 'Credit';
    } else if (cash > 0 && credit > 0) {
      badgeLabel = 'Partial Credit';
    } else {
      badgeLabel = 'Sale';
    }
  } else if (isPurchase) {
    typeLabel = `Purchase: ${transaction.category || 'Crop'}`;
    iconWrapClass = 'hs-activity-item-card__icon-wrap--purchase';
    IconComp = ShoppingCart;
    if (credit === 0 && (cash > 0 || amount === 0)) {
      badgeLabel = 'Cash';
    } else if (cash === 0 && credit > 0) {
      badgeLabel = 'Credit';
    } else if (cash > 0 && credit > 0) {
      badgeLabel = 'Partial Credit';
    } else {
      badgeLabel = 'Purchase';
    }
  } else if (isPayment) {
    typeLabel = 'Payment Received';
    iconWrapClass = 'hs-activity-item-card__icon-wrap--payment';
    IconComp = Receipt;
    badgeLabel = 'Payment';
  } else if (isService) {
    typeLabel = `Service: ${(transaction as any).category || 'Charge'}`;
    iconWrapClass = 'hs-activity-item-card__icon-wrap--service';
    IconComp = Truck;
    badgeLabel = 'Service';
  } else if (isExpense) {
    typeLabel = `Expense: ${(transaction as any).category || 'General'}`;
    iconWrapClass = 'hs-activity-item-card__icon-wrap--expense';
    IconComp = Wrench;
    badgeLabel = 'Expense';
  } else if (isOpening) {
    typeLabel = 'Opening Due Balance';
    iconWrapClass = 'hs-activity-item-card__icon-wrap--payment';
    IconComp = CreditCard;
    badgeLabel = 'Opening Due';
  }

  return (
    <Card
      onClick={() => onClick?.(transaction)}
      className={clsx('hs-activity-item-card', className)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <StackLayout gap={1}>
        {/* Main Top Row */}
        <FlexLayout align="center" justify="space-between" gap={1}>
          {/* Icon + Basic Info */}
          <FlexLayout
            align="center"
            gap={1}
            className="hs-activity-item-card__header-left"
          >
            <div
              className={clsx(
                'hs-activity-item-card__icon-wrap',
                iconWrapClass,
              )}
            >
              <IconComp size={18} className="hs-activity-item-card__icon" />
            </div>

            <div className="hs-activity-item-card__header-info">
              <FlexLayout align="center" gap={0.5}>
                <Text>
                  <b>{typeLabel}</b>
                </Text>
                <Pill>{badgeLabel}</Pill>
              </FlexLayout>

              {partyName && (
                <Text styleAs="notation" color="secondary">
                  {partyName}
                </Text>
              )}
            </div>
          </FlexLayout>

          {/* Amount & Quick Edit */}
          <FlexLayout align="center" gap={1}>
            <div style={{ textAlign: 'right' }}>
              <Text
                styleAs="h4"
                color={
                  isPayment || isSale
                    ? 'success'
                    : isExpense
                      ? 'error'
                      : 'secondary'
                }
              >
                <b>{formatRupee(amount)}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                {formatDate(transaction.date)}
              </Text>
            </div>

            {onEdit && (
              <button
                type="button"
                aria-label="Edit transaction"
                className="hs-activity-item-card__edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(transaction);
                }}
              >
                <Edit3 size={16} />
              </button>
            )}
          </FlexLayout>
        </FlexLayout>

        {/* Secondary Details Row (Weight, Rate, Breakdown) */}
        {((typeof weightKg === 'number' && weightKg > 0) ||
          typeof derivedRate === 'number' ||
          (cash > 0 && credit > 0) ||
          transaction.note) && (
          <FlexLayout
            align="center"
            justify="space-between"
            className="hs-activity-item-card__details"
          >
            {/* Weight & Derived Rate */}
            <FlexLayout align="center" gap={0.5}>
              {typeof weightKg === 'number' && weightKg > 0 && (
                <Text styleAs="notation" color="secondary">
                  Weight: <b>{formatWeight(weightKg)}</b>
                </Text>
              )}
              {typeof derivedRate === 'number' && (
                <Text styleAs="notation" color="secondary">
                  • Rate: <b>₹{derivedRate}/Kg</b>
                </Text>
              )}
            </FlexLayout>

            {/* Cash & Credit Breakdown / Note */}
            <FlexLayout align="center" gap={0.5}>
              {cash > 0 && credit > 0 && (
                <Text styleAs="notation" color="secondary">
                  Cash: {formatRupee(cash)} | Due: {formatRupee(credit)}
                </Text>
              )}
              {transaction.note && (
                <Text styleAs="notation" color="secondary">
                  {transaction.note}
                </Text>
              )}
            </FlexLayout>
          </FlexLayout>
        )}
      </StackLayout>
    </Card>
  );
};

export default ActivityItemCard;
