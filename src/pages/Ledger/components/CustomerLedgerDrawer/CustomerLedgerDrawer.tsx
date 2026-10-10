import React from 'react';
import {
  Drawer,
  DrawerCloseButton,
  FlexLayout,
  GridLayout,
  GridItem,
  Card,
  StackLayout,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@salt-ds/core';
import { History, Receipt } from 'lucide-react';
import { CustomerLedgerDetail } from '../../../../business/ledgerBusiness';
import { CustomerTransactionData } from '../../../../models';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import { LedgerPaymentForm } from '../LedgerPaymentForm';
import { TransactionHistoryList } from '../TransactionHistoryList';
import './CustomerLedgerDrawer.css';
import { useCustomerLedgerDrawer } from './useCustomerLedgerDrawer';

export interface CustomerLedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  detail: CustomerLedgerDetail | null;
  transactions: CustomerTransactionData[];
  isLoadingTransactions?: boolean;
  isPaying: boolean;
  onPay: (
    _paymentAmount: number,
    _date?: string,
    _discount?: number,
  ) => Promise<void>;
}

export const CustomerLedgerDrawer: React.FC<CustomerLedgerDrawerProps> = ({
  isOpen,
  onClose,
  detail,
  transactions,
  isLoadingTransactions,
  isPaying,
  onPay,
}) => {
  const {
    activeTab,
    setActiveTab,
    totalBilled,
    totalPaid,
    totalWeight,
    avgRate,
    currentOutstanding,
  } = useCustomerLedgerDrawer({
    detail,
    transactions,
  });

  if (!isOpen || !detail) return null;

  const hasDue = currentOutstanding > 0;

  return (
    <Drawer
      open={isOpen}
      position="bottom"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="hs-ledger-drawer"
      style={{ maxHeight: '90vh' }}
    >
      <StackLayout gap={2} style={{ padding: 'var(--salt-spacing-200)' }}>
        {/* Header */}
        <FlexLayout justify="space-between" align="center">
          <div>
            <Text styleAs="h2">
              <b>{detail.customerName}</b>
            </Text>
            <Text styleAs="notation" color="secondary">
              {detail.customer.village
                ? `Village: ${detail.customer.village}`
                : ''}
              {detail.customer.mobile
                ? ` • Mobile: ${detail.customer.mobile}`
                : ''}
            </Text>
          </div>
          <DrawerCloseButton onClick={onClose} />
        </FlexLayout>

        {/* 1. Customer Summary Metrics */}
        <GridLayout columns={4} gap={1} className="hs-ledger-drawer__metrics">
          <GridItem>
            <Card style={{ padding: 'var(--salt-spacing-100)' }}>
              <StackLayout gap={0.5}>
                <Text styleAs="notation" color="secondary">
                  Outstanding Due
                </Text>
                <Text styleAs="h4" color={hasDue ? 'error' : 'success'}>
                  <b>
                    {hasDue ? formatRupee(currentOutstanding) : '₹0 (Clear)'}
                  </b>
                </Text>
              </StackLayout>
            </Card>
          </GridItem>

          <GridItem>
            <Card style={{ padding: 'var(--salt-spacing-100)' }}>
              <StackLayout gap={0.5}>
                <Text styleAs="notation" color="secondary">
                  Total Billed
                </Text>
                <Text styleAs="h4">
                  <b>{formatRupee(totalBilled)}</b>
                </Text>
              </StackLayout>
            </Card>
          </GridItem>

          <GridItem>
            <Card style={{ padding: 'var(--salt-spacing-100)' }}>
              <StackLayout gap={0.5}>
                <Text styleAs="notation" color="secondary">
                  Total Paid
                </Text>
                <Text styleAs="h4" color="success">
                  <b>{formatRupee(totalPaid)}</b>
                </Text>
              </StackLayout>
            </Card>
          </GridItem>

          <GridItem>
            <Card style={{ padding: 'var(--salt-spacing-100)' }}>
              <StackLayout gap={0.5}>
                <Text styleAs="notation" color="secondary">
                  Weight / Rate
                </Text>
                <Text styleAs="h4">
                  <b>{totalWeight > 0 ? formatWeight(totalWeight) : '—'}</b>
                </Text>
                {avgRate > 0 && (
                  <Text styleAs="notation" color="secondary">
                    @ {formatRupee(avgRate)}/kg
                  </Text>
                )}
              </StackLayout>
            </Card>
          </GridItem>
        </GridLayout>

        {/* 2. Tab Switcher */}
        <ToggleButtonGroup
          value={activeTab}
          onChange={(event) => {
            const val = (event.currentTarget as HTMLButtonElement).value;
            if (val === 'statement' || val === 'payment') {
              setActiveTab(val);
            }
          }}
          style={{ width: '100%' }}
        >
          <ToggleButton value="statement" style={{ flex: 1 }}>
            <FlexLayout align="center" justify="center" gap={1}>
              <History size={16} />
              <span>Statement ({transactions.length})</span>
            </FlexLayout>
          </ToggleButton>
          <ToggleButton value="payment" style={{ flex: 1 }}>
            <FlexLayout align="center" justify="center" gap={1}>
              <Receipt size={16} />
              <span>Record Payment</span>
            </FlexLayout>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* 3. Tab Content */}
        <div
          className="hs-ledger-drawer__content"
          style={{ overflowY: 'auto', maxHeight: '55vh' }}
        >
          {activeTab === 'statement' ? (
            <TransactionHistoryList
              transactions={transactions}
              isLoading={isLoadingTransactions}
            />
          ) : (
            <LedgerPaymentForm
              outstandingDue={detail.currentOutstanding}
              isPaying={isPaying}
              onPay={onPay}
            />
          )}
        </div>
      </StackLayout>
    </Drawer>
  );
};

export default CustomerLedgerDrawer;
