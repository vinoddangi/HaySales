import { IndianRupee, Users } from 'lucide-react';
import React from 'react';
import { Grid } from '../../../../components/layouts/Grid';
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
        <div className="hs-ledger-overview-card">
          <div className="hs-ledger-overview-card__header hs-ledger-overview-card__header--due">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Total Outstanding</span>
          </div>
          <div className="hs-ledger-overview-card__value hs-ledger-overview-card__value--due">
            {formatRupee(totalOutstanding)}
          </div>
        </div>
      </Grid.Item>

      <Grid.Item>
        <div className="hs-ledger-overview-card">
          <div className="hs-ledger-overview-card__header hs-ledger-overview-card__header--accounts">
            <Users className="h-3.5 w-3.5" />
            <span>Accounts Due</span>
          </div>
          <div className="hs-ledger-overview-card__value hs-ledger-overview-card__value--accounts">
            {customersWithDuesCount}
            <span className="hs-ledger-overview-card__meta">
              / {totalCustomersCount}
            </span>
          </div>
        </div>
      </Grid.Item>
    </Grid>
  );
};
