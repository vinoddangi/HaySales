import clsx from 'clsx';
import React from 'react';
import { Card, FlexLayout, Pill, StackLayout, Text } from '@salt-ds/core';
import { Banknote } from 'lucide-react';
import { formatRupee } from '../../../../utils/formatters';
import './SalesOnCashCard.css';

export interface SalesOnCashCardProps {
  amount: number;
  percentage: number;
  onClick?: () => void;
  className?: string;
}

export const SalesOnCashCard: React.FC<SalesOnCashCardProps> = ({
  amount,
  percentage,
  onClick,
  className,
}) => {
  return (
    <Card
      onClick={onClick}
      className={clsx('hs-sales-cash-card', className)}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <StackLayout gap={1}>
        <FlexLayout direction="row" align="center" justify="space-between">
          <FlexLayout direction="row" align="center" gap={1}>
            <Banknote size={16} className="hs-sales-cash-card__icon" />
            <Text styleAs="label" color="success">
              <b>Sales on Cash</b>
            </Text>
          </FlexLayout>
          <Pill>{percentage.toFixed(0)}%</Pill>
        </FlexLayout>

        <Text styleAs="h2">
          <b>{formatRupee(amount)}</b>
        </Text>
        <Text styleAs="notation" color="secondary">
          Direct cash received
        </Text>
      </StackLayout>
    </Card>
  );
};

export default SalesOnCashCard;
