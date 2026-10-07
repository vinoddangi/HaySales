import { IndianRupee, Users } from 'lucide-react';
import React from 'react';
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
          icon={<IndianRupee className="h-4 w-4" />}
          value={formatRupee(totalOutstanding)}
          label="Total Outstanding"
          sentiment="negative"
          variant="filled"
        />
      </Grid.Item>

      <Grid.Item>
        <StatCard
          icon={<Users className="h-4 w-4" />}
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
