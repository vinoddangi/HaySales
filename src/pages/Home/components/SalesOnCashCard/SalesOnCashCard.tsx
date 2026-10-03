import clsx from 'clsx';
import { Banknote } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Text } from '../../../../components/Text';
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
      variant="outlined"
      clickable={Boolean(onClick)}
      onClick={onClick}
      className={clsx('hs-sales-cash-card', className)}
    >
      <Card.Content>
        <Flex align="center" justify="between" fullWidth>
          <Flex align="center" gap="xs">
            <Banknote className="hs-sales-cash-card__icon" />
            <Text
              variant="label-sm"
              uppercase
              weight="bold"
              sentiment="positive"
            >
              Sales on Cash
            </Text>
          </Flex>
          <Badge sentiment="positive" size="sm">
            {percentage.toFixed(0)}%
          </Badge>
        </Flex>

        <Text as="div" variant="title-lg" weight="bold">
          {formatRupee(amount)}
        </Text>
        <Text variant="body-sm" appearance="secondary">
          Direct cash received
        </Text>
      </Card.Content>
    </Card>
  );
};

export default SalesOnCashCard;
