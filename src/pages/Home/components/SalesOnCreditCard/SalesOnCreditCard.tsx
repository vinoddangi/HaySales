import clsx from 'clsx';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { IconCreditCard } from '../../../../components/Icon';
import { Flex } from '../../../../components/layouts/Flex';
import { Text } from '../../../../components/Text';
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
            <IconCreditCard size="sm" className="hs-sales-credit-card__icon" />
            <Text
              variant="label-sm"
              uppercase
              weight="bold"
              sentiment="warning"
            >
              Sales on Credit
            </Text>
          </Flex>
          <Badge sentiment="credit" size="sm">
            {percentage.toFixed(0)}%
          </Badge>
        </Flex>

        <Text as="div" variant="title-lg" weight="bold">
          {formatRupee(amount)}
        </Text>
        <Text variant="body-sm" appearance="secondary">
          Credit given to buyers
        </Text>
      </Card.Content>
    </Card>
  );
};

export default SalesOnCreditCard;
