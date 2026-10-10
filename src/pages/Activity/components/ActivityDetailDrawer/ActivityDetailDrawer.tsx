import React from 'react';
import {
  Button,
  Drawer,
  DrawerCloseButton,
  FlexLayout,
  Pill,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { Edit3 } from 'lucide-react';
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
  onEdit?: (_tx: Transaction) => void;
}

export const ActivityDetailDrawer: React.FC<ActivityDetailDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
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

  if (isSale) {
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
    badgeLabel = 'Payment';
  } else if (isService) {
    badgeLabel = 'Service';
  } else if (isExpense) {
    badgeLabel = 'Expense';
  } else if (isOpening) {
    badgeLabel = 'Opening Due';
  }

  return (
    <Drawer
      open={isOpen}
      position="bottom"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="hs-activity-drawer"
      style={{ maxHeight: '90vh' }}
    >
      <StackLayout gap={2} style={{ padding: 'var(--salt-spacing-200)' }}>
        {/* Header */}
        <FlexLayout align="center" justify="space-between">
          <FlexLayout align="center" gap={1}>
            <Text styleAs="h2">
              <b>Transaction Details</b>
            </Text>
            <Pill>{badgeLabel}</Pill>
          </FlexLayout>
          <DrawerCloseButton onClick={onClose} />
        </FlexLayout>

        {/* Details Table */}
        <div className="hs-activity-drawer__content">
          <div className="hs-activity-drawer__row">
            <Text styleAs="notation" color="secondary">
              Transaction ID
            </Text>
            <Text styleAs="notation">
              <b>{transaction.id || 'N/A'}</b>
            </Text>
          </div>

          <div className="hs-activity-drawer__row">
            <Text styleAs="notation" color="secondary">
              Date
            </Text>
            <Text styleAs="notation">
              <b>{formatDate(transaction.date)}</b>
            </Text>
          </div>

          <div className="hs-activity-drawer__row">
            <Text styleAs="notation" color="secondary">
              Associated Party
            </Text>
            <Text styleAs="notation">
              <b>{partyName}</b>
            </Text>
          </div>

          <div className="hs-activity-drawer__row">
            <Text styleAs="notation" color="secondary">
              Category
            </Text>
            <Text styleAs="notation">
              <b>{(transaction as any).category || 'N/A'}</b>
            </Text>
          </div>

          {typeof weightKg === 'number' && weightKg > 0 && (
            <div className="hs-activity-drawer__row">
              <Text styleAs="notation" color="secondary">
                Weight
              </Text>
              <Text styleAs="notation">
                <b>{formatWeight(weightKg)}</b>
              </Text>
            </div>
          )}

          {typeof derivedRate === 'number' && (
            <div className="hs-activity-drawer__row">
              <Text styleAs="notation" color="secondary">
                Derived Rate
              </Text>
              <Text styleAs="notation">
                <b>₹{derivedRate} / Kg</b>
              </Text>
            </div>
          )}

          <div className="hs-activity-drawer__row">
            <Text styleAs="notation" color="secondary">
              Total Amount
            </Text>
            <Text styleAs="h3">
              <b>{formatRupee(amount)}</b>
            </Text>
          </div>

          <div className="hs-activity-drawer__row">
            <Text styleAs="notation" color="secondary">
              Cash Settled
            </Text>
            <Text styleAs="notation" color="success">
              <b>{formatRupee(cash)}</b>
            </Text>
          </div>

          <div className="hs-activity-drawer__row">
            <Text styleAs="notation" color="secondary">
              Remaining Due (Credit)
            </Text>
            <Text styleAs="notation" color="warning">
              <b>{formatRupee(credit)}</b>
            </Text>
          </div>

          {transaction.note && (
            <div className="hs-activity-drawer__row">
              <Text styleAs="notation" color="secondary">
                Notes
              </Text>
              <Text styleAs="notation" color="secondary">
                {transaction.note}
              </Text>
            </div>
          )}
        </div>

        {/* Actions */}
        <FlexLayout gap={1}>
          <Button onClick={onClose} style={{ flex: 1, height: '44px' }}>
            Close
          </Button>
          {onEdit && (
            <Button
              sentiment="accented"
              onClick={() => onEdit(transaction)}
              style={{ flex: 1, height: '44px' }}
            >
              <FlexLayout align="center" justify="center" gap={0.5}>
                <Edit3 size={16} />
                <span>Edit Transaction</span>
              </FlexLayout>
            </Button>
          )}
        </FlexLayout>
      </StackLayout>
    </Drawer>
  );
};

export default ActivityDetailDrawer;
