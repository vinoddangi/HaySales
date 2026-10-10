import React from 'react';
import {
  Card,
  FlexLayout,
  Pill,
  Spinner,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { ChevronRight, Users } from 'lucide-react';
import { CustomerLedgerSummary } from '../../../../business/ledgerBusiness';
import { formatRupee } from '../../../../utils/formatters';
import { EmptyState } from '../../../../views/EmptyState';
import './CustomerLedgerList.css';

export interface CustomerLedgerListProps {
  customers: CustomerLedgerSummary[];
  selectedCustomerId?: string | null;
  onSelectCustomer: (_customerId: string) => void;
  isLoading?: boolean;
}

export const CustomerLedgerList: React.FC<CustomerLedgerListProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  isLoading,
}) => {
  return (
    <Card className="hs-customer-ledger-list">
      <StackLayout gap={1}>
        <FlexLayout
          justify="space-between"
          align="center"
          className="hs-customer-ledger-list__header"
        >
          <Text styleAs="label">
            <b>CUSTOMER ACCOUNTS</b>
          </Text>
          <Text styleAs="notation" color="secondary">
            {customers.length} Accounts
          </Text>
        </FlexLayout>

        {isLoading ? (
          <FlexLayout
            align="center"
            justify="center"
            style={{ padding: 'var(--salt-spacing-300)' }}
          >
            <Spinner size="medium" />
          </FlexLayout>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<Users size={36} />}
            headline="No Accounts Found"
            body="No customer ledger accounts match your filter criteria."
          />
        ) : (
          <StackLayout gap={0.5} className="hs-customer-ledger-list__items">
            {customers.map((c) => {
              const hasDue = c.currentOutstanding > 0;
              const isSelected = selectedCustomerId === c.customerId;
              return (
                <div
                  key={c.customerId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectCustomer(c.customerId)}
                  className={`hs-customer-ledger-list__item ${isSelected ? 'hs-customer-ledger-list__item--active' : ''}`}
                >
                  <FlexLayout
                    justify="space-between"
                    align="center"
                    style={{ width: '100%' }}
                  >
                    <div>
                      <Text>
                        <b>{c.customerName}</b>
                      </Text>
                      <Text styleAs="notation" color="secondary">
                        {c.transactionCount} entries • Total Billed:{' '}
                        {formatRupee(c.totalBilled)}
                      </Text>
                    </div>

                    <FlexLayout align="center" gap={1}>
                      <div style={{ textAlign: 'right' }}>
                        <Text color={hasDue ? 'error' : 'success'}>
                          <b>
                            {hasDue
                              ? formatRupee(c.currentOutstanding)
                              : 'All Clear'}
                          </b>
                        </Text>
                        <Pill>{hasDue ? 'Due' : 'Zero Due'}</Pill>
                      </div>
                      <ChevronRight
                        size={18}
                        className="hs-customer-ledger-list__chevron"
                      />
                    </FlexLayout>
                  </FlexLayout>
                </div>
              );
            })}
          </StackLayout>
        )}
      </StackLayout>
    </Card>
  );
};

export default CustomerLedgerList;
