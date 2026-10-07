import { ChevronRight, Users } from 'lucide-react';
import React from 'react';
import { CustomerLedgerSummary } from '../../../../business/ledgerBusiness';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { EmptyState } from '../../../../components/EmptyState';
import { Flex } from '../../../../components/layouts/Flex';
import { ListItem } from '../../../../components/ListItem';
import { Progress } from '../../../../components/Progress';
import { SectionHeader } from '../../../../components/SectionHeader';
import { Text } from '../../../../components/Text';
import { formatRupee } from '../../../../utils/formatters';
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
    <Card variant="filled" className="hs-customer-ledger-list">
      <SectionHeader
        title="Customer Accounts"
        subtitle={`${customers.length} Accounts`}
      />

      {isLoading ? (
        <Card.Content>
          <Flex align="center" justify="center" padding="lg">
            <Progress type="circular" indeterminate fourColor />
          </Flex>
        </Card.Content>
      ) : customers.length === 0 ? (
        <Card.Content>
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            headline="No Accounts Found"
            body="No customer ledger accounts match your filter criteria."
          />
        </Card.Content>
      ) : (
        <Card.Content noPadding className="hs-customer-ledger-list__items">
          {customers.map((c, idx) => {
            const hasDue = c.currentOutstanding > 0;
            const isSelected = selectedCustomerId === c.customerId;
            return (
              <ListItem
                key={c.customerId}
                headline={c.customerName}
                supporting={`${c.transactionCount} entries • Total Billed: ${formatRupee(c.totalBilled)}`}
                trailing={
                  <Flex align="center" gap="xs">
                    <Flex direction="column" align="end" gap="none">
                      <Text
                        variant="label-md"
                        weight="bold"
                        sentiment={hasDue ? 'negative' : 'positive'}
                      >
                        {hasDue
                          ? formatRupee(c.currentOutstanding)
                          : 'All Clear'}
                      </Text>
                      <Badge
                        sentiment={hasDue ? 'negative' : 'positive'}
                        appearance="subtle"
                        size="sm"
                      >
                        {hasDue ? 'Due' : 'Zero Due'}
                      </Badge>
                    </Flex>
                    <ChevronRight className="text-m3-on-surface-variant h-4 w-4 shrink-0" />
                  </Flex>
                }
                divider={idx < customers.length - 1}
                clickable
                onClick={() => onSelectCustomer(c.customerId)}
                className={
                  isSelected
                    ? 'hs-customer-ledger-list__item--active'
                    : undefined
                }
              />
            );
          })}
        </Card.Content>
      )}
    </Card>
  );
};

export default CustomerLedgerList;
