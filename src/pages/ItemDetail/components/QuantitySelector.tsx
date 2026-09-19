import { Minus, Plus } from 'lucide-react';
import React from 'react';
import { Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';

interface QuantitySelectorProps {
  quantity: number;
  maxStock: number;
  totalPrice: string;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  totalPrice,
  onIncrement,
  onDecrement,
}) => {
  return (
    <div className="px-4">
      <Card variant="outlined" className="space-y-3 p-3.5">
        <Flex align="center" justify="between" fullWidth>
          <Text styleAs="body-sm" appearance="primary" weight="bold">
            Order Quantity
          </Text>
          <Flex align="center" gap="sm">
            <button
              onClick={onDecrement}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-m3-surface-container-highest text-m3-on-surface transition-colors hover:bg-m3-surface-container-high"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <Text
              styleAs="body"
              appearance="primary"
              weight="bold"
              align="center"
              className="w-8"
            >
              {quantity}
            </Text>
            <button
              onClick={onIncrement}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-m3-surface-container-highest text-m3-on-surface transition-colors hover:bg-m3-surface-container-high"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </Flex>
        </Flex>
        <Flex
          align="center"
          justify="between"
          fullWidth
          className="border-t border-m3-outline-variant/30 pt-2"
        >
          <Text styleAs="caption" appearance="secondary">
            Calculated Total
          </Text>
          <Text styleAs="title" sentiment="accent" weight="bold">
            ${totalPrice}
          </Text>
        </Flex>
      </Card>
    </div>
  );
};
