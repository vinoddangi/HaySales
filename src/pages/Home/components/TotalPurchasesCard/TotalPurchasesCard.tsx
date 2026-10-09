import clsx from 'clsx';
import React from 'react';
import { Card } from '../../../../components/Card';
import { IconArrowDownLeft } from '../../../../components/Icon';
import { Flex } from '../../../../components/layouts/Flex';
import { Text } from '../../../../components/Text';
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
          <Text variant="label-sm" uppercase weight="bold" sentiment="warning">
            Total Purchases
          </Text>
          <div className="hs-total-purchases-card__icon-wrapper">
            <IconArrowDownLeft size="sm" />
          </div>
        </Flex>

        <Text as="div" variant="headline-sm" weight="bold" truncate>
          {formatRupee(amount)}
        </Text>

        <Text variant="body-sm" appearance="secondary" truncate>
          {formatWeight(weight)} • {ordersCount} Orders
        </Text>

        <div className="hs-total-purchases-card__rate-badge">
          <Text variant="caption" weight="medium" sentiment="warning">
            Avg Rate:
          </Text>
          <Text variant="label-sm" weight="bold" sentiment="warning">
            {avgRate > 0 ? `₹${avgRate.toFixed(2)} /kg` : '₹0.00 /kg'}
          </Text>
        </div>
      </Card.Content>
    </Card>
  );
};

export default TotalPurchasesCard;
