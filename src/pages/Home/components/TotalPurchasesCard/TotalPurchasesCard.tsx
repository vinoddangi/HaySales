import clsx from 'clsx';
import React from 'react';
import { Card, FlexLayout, StackLayout, Text } from '@salt-ds/core';
import { ArrowDownLeft } from 'lucide-react';
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
      elevation="raised"
      onClick={onClick}
      className={clsx('hs-total-purchases-card', className)}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <StackLayout gap={1}>
        <FlexLayout direction="row" align="center" justify="space-between">
          <Text styleAs="label" color="warning">
            <b>Total Purchases</b>
          </Text>
          <div className="hs-total-purchases-card__icon-wrapper">
            <ArrowDownLeft size={16} />
          </div>
        </FlexLayout>

        <Text styleAs="h2">
          <b>{formatRupee(amount)}</b>
        </Text>

        <Text styleAs="notation" color="secondary">
          {formatWeight(weight)} • {ordersCount} Orders
        </Text>

        <div className="hs-total-purchases-card__rate-badge">
          <Text styleAs="notation">Avg Rate:</Text>
          <Text styleAs="label" color="warning">
            <b>{avgRate > 0 ? `₹${avgRate.toFixed(2)} /kg` : '₹0.00 /kg'}</b>
          </Text>
        </div>
      </StackLayout>
    </Card>
  );
};

export default TotalPurchasesCard;
