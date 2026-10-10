import clsx from 'clsx';
import React from 'react';
import { Card, FlexLayout, Pill, StackLayout, Text } from '@salt-ds/core';
import { CreditCard } from 'lucide-react';
import { formatRupee } from '../../../../utils/formatters';
import './SalesOnCreditCard.css';

export interface SalesOnCreditCardProps {
  amount: number;
  percentage: number;
  onClick?: () => void;
  className?: string;
}

export const SalesOnCreditCard: React.FC<SalesOnCreditCardProps> = ({
  amount,
  percentage,
  onClick,
  className,
}) => {
  return (
    <Card
      onClick={onClick}
      className={clsx('hs-sales-credit-card', className)}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <StackLayout gap={1}>
        <FlexLayout direction="row" align="center" justify="space-between">
          <FlexLayout direction="row" align="center" gap={1}>
            <CreditCard size={16} className="hs-sales-credit-card__icon" />
            <Text styleAs="label" color="warning">
              <b>Sales on Credit</b>
            </Text>
          </FlexLayout>
          <Pill>{percentage.toFixed(0)}%</Pill>
        </FlexLayout>

        <Text styleAs="h2">
          <b>{formatRupee(amount)}</b>
        </Text>
        <Text styleAs="notation" color="secondary">
          Credit given to buyers
        </Text>
      </StackLayout>
    </Card>
  );
};

export default SalesOnCreditCard;
