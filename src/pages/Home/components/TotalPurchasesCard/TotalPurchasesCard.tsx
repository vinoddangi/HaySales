import clsx from 'clsx';
import { ArrowDownLeft } from 'lucide-react';
import React from 'react';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import './TotalPurchasesCard.css';

export interface TotalPurchasesCardProps {
  amount: number;
  weight: number;
  ordersCount: number;
  avgRate: number;
  onClick?: () => void;
  className?: string;
}

export const TotalPurchasesCard: React.FC<TotalPurchasesCardProps> = ({
  amount,
  weight,
  ordersCount,
  avgRate,
  onClick,
  className,
}) => {
  return (
    <Card
      variant="elevated"
      clickable={Boolean(onClick)}
      onClick={onClick}
      className={clsx('hs-total-purchases-card', className)}
    >
      <Card.Content>
        <Flex align="center" justify="between" fullWidth>
          <span className="hs-total-purchases-card__tag">Total Purchases</span>
          <div className="hs-total-purchases-card__icon-wrapper">
            <ArrowDownLeft className="hs-total-purchases-card__icon" />
          </div>
        </Flex>

        <div className="hs-total-purchases-card__amount">
          {formatRupee(amount)}
        </div>

        <Flex
          wrap
          align="center"
          gap="xs"
          className="hs-total-purchases-card__meta"
        >
          <span>{formatWeight(weight)}</span>
          <span>•</span>
          <span>{ordersCount} Orders</span>
        </Flex>

        <div className="hs-total-purchases-card__rate-badge">
          <span className="hs-total-purchases-card__rate-label">Avg Rate:</span>
          <span className="hs-total-purchases-card__rate-val">
            {avgRate > 0 ? `₹${avgRate.toFixed(2)} /kg` : '₹0.00 /kg'}
          </span>
        </div>
      </Card.Content>
    </Card>
  );
};

export default TotalPurchasesCard;
