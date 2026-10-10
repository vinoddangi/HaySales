import React from 'react';
import { Card, GridLayout, GridItem, StackLayout, Text } from '@salt-ds/core';
import { IndianRupee, Users } from 'lucide-react';
import { formatRupee } from '../../../../utils/formatters';
import './LedgerOverviewCards.css';

export interface LedgerOverviewCardsProps {
  totalOutstanding: number;
  customersWithDuesCount: number;
  totalCustomersCount: number;
}

export const LedgerOverviewCards: React.FC<LedgerOverviewCardsProps> = ({
  totalOutstanding,
  customersWithDuesCount,
  totalCustomersCount,
}) => {
  return (
    <GridLayout columns={2} gap={1} className="hs-ledger-overview-cards">
      <GridItem>
        <Card className="hs-ledger-overview-card hs-ledger-overview-card--outstanding">
          <StackLayout gap={0.5}>
            <div className="hs-ledger-overview-card__header">
              <Text styleAs="label">
                <b>TOTAL OUTSTANDING</b>
              </Text>
              <IndianRupee size={16} />
            </div>
            <Text styleAs="h3" color="error">
              <b>{formatRupee(totalOutstanding)}</b>
            </Text>
            <Text styleAs="notation" color="secondary">
              Receivables Balance
            </Text>
          </StackLayout>
        </Card>
      </GridItem>

      <GridItem>
        <Card className="hs-ledger-overview-card hs-ledger-overview-card--accounts">
          <StackLayout gap={0.5}>
            <div className="hs-ledger-overview-card__header">
              <Text styleAs="label">
                <b>ACCOUNTS DUE</b>
              </Text>
              <Users size={16} />
            </div>
            <Text styleAs="h3" color="warning">
              <b>
                {customersWithDuesCount} / {totalCustomersCount}
              </b>
            </Text>
            <Text styleAs="notation" color="secondary">
              Active Debtors
            </Text>
          </StackLayout>
        </Card>
      </GridItem>
    </GridLayout>
  );
};

export default LedgerOverviewCards;
