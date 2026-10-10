import clsx from 'clsx';
import React from 'react';
import { Card, FlexLayout, StackLayout, Text } from '@salt-ds/core';
import { TrendingUp } from 'lucide-react';
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
      elevation="raised"
      onClick={onClick}
      className={clsx('hs-total-sales-card', className)}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <StackLayout gap={1}>
        <FlexLayout direction="row" align="center" justify="space-between">
          <Text styleAs="label" color="success">
            <b>Total Sales</b>
          </Text>
          <div className="hs-total-sales-card__icon-wrapper">
            <TrendingUp size={14} className="hs-total-sales-card__icon" />
          </div>
        </FlexLayout>

        <Text styleAs="h2">
          <b>{formatRupee(amount)}</b>
        </Text>

        <Text styleAs="notation" color="secondary">
          {formatWeight(weight)} • {invoicesCount} Invoices
        </Text>

        <div className="hs-total-sales-card__rate-badge">
          <Text styleAs="notation">Avg Rate:</Text>
          <Text styleAs="label" color="success">
            <b>{avgRate > 0 ? `₹${avgRate.toFixed(2)} /kg` : '₹0.00 /kg'}</b>
          </Text>
        </div>
      </StackLayout>
    </Card>
  );
};

export default TotalSalesCard;
