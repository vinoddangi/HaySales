import clsx from 'clsx';
import { TrendingUp } from 'lucide-react';
import React from 'react';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Text } from '../../../../components/Text';
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
          <Text variant="label-sm" uppercase weight="bold" sentiment="positive">
            Total Sales
          </Text>
          <div className="hs-total-sales-card__icon-wrapper">
            <TrendingUp className="hs-total-sales-card__icon" />
          </div>
        </Flex>

        <Text as="div" variant="headline-sm" weight="bold" truncate>
          {formatRupee(amount)}
        </Text>

        <Text variant="body-sm" appearance="secondary" truncate>
          {formatWeight(weight)} • {invoicesCount} Invoices
        </Text>

        <div className="hs-total-sales-card__rate-badge">
          <Text variant="caption" weight="medium" sentiment="positive">
            Avg Rate:
          </Text>
          <Text variant="label-sm" weight="bold" sentiment="positive">
            {avgRate > 0 ? `₹${avgRate.toFixed(2)} /kg` : '₹0.00 /kg'}
          </Text>
        </div>
      </Card.Content>
    </Card>
  );
};

export default TotalSalesCard;
