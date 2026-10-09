import React from 'react';
import { IconIndianRupee, IconUsers } from '../../../../components/Icon';
import { Grid } from '../../../../components/layouts/Grid';
import { StatCard } from '../../../../components/StatCard';
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
    <Grid columns={2} gap="sm" fullWidth>
      <Grid.Item>
        <StatCard
          icon={<IconIndianRupee size="md" />}
          value={formatRupee(totalOutstanding)}
          label="Total Outstanding"
          sentiment="negative"
          variant="filled"
        />
      </Grid.Item>

      <Grid.Item>
        <StatCard
          icon={<IconUsers size="md" />}
          value={`${customersWithDuesCount} / ${totalCustomersCount}`}
          label="Accounts Due"
          sentiment="warning"
          variant="filled"
        />
      </Grid.Item>
    </Grid>
  );
};

export default LedgerOverviewCards;
