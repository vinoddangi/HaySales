import clsx from 'clsx';
import { CreditCard } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
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
      variant="outlined"
      clickable={Boolean(onClick)}
      onClick={onClick}
      className={clsx('hs-sales-credit-card', className)}
    >
      <Card.Content>
        <Flex align="center" justify="between" fullWidth>
          <Flex align="center" gap="xs">
            <CreditCard className="hs-sales-credit-card__icon" />
            <span className="hs-sales-credit-card__title">Sales on Credit</span>
          </Flex>
          <Badge sentiment="credit" size="sm">
            {percentage.toFixed(0)}%
          </Badge>
        </Flex>

        <div className="hs-sales-credit-card__amount">
          {formatRupee(amount)}
        </div>
        <div className="hs-sales-credit-card__subtitle">
          Credit given to buyers
        </div>
      </Card.Content>
    </Card>
  );
};

export default SalesOnCreditCard;
