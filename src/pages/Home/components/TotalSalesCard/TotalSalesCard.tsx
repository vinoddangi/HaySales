import clsx from 'clsx';
import { TrendingUp } from 'lucide-react';
import React from 'react';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import './TotalSalesCard.css';

export interface TotalSalesCardProps {
  amount: number;
  weight: number;
  invoicesCount: number;
  avgRate: number;
  onClick?: () => void;
  className?: string;
}

export const TotalSalesCard: React.FC<TotalSalesCardProps> = ({
  amount,
  weight,
  invoicesCount,
  avgRate,
  onClick,
  className,
}) => {
  return (
    <Card
      variant="elevated"
      clickable={Boolean(onClick)}
      onClick={onClick}
      className={clsx('hs-total-sales-card', className)}
    >
      <Card.Content>
        <Flex align="center" justify="between" fullWidth>
          <span className="hs-total-sales-card__tag">Total Sales</span>
          <div className="hs-total-sales-card__icon-wrapper">
            <TrendingUp className="hs-total-sales-card__icon" />
          </div>
        </Flex>

        <div className="hs-total-sales-card__amount">{formatRupee(amount)}</div>

        <Flex
          wrap
          align="center"
          gap="xs"
          className="hs-total-sales-card__meta"
        >
          <span>{formatWeight(weight)}</span>
          <span>•</span>
          <span>{invoicesCount} Invoices</span>
        </Flex>

        <div className="hs-total-sales-card__rate-badge">
          <span className="hs-total-sales-card__rate-label">Avg Rate:</span>
          <span className="hs-total-sales-card__rate-val">
            {avgRate > 0 ? `₹${avgRate.toFixed(2)} /kg` : '₹0.00 /kg'}
          </span>
        </div>
      </Card.Content>
    </Card>
  );
};

export default TotalSalesCard;
