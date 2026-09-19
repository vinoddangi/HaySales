import { CheckCircle2, Star } from 'lucide-react';
import React from 'react';
import { Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';

interface ProductInfoProps {
  title: string;
  subtitle: string;
  price: number;
  unit: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  description: string;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  title,
  subtitle,
  price,
  unit,
  rating,
  reviewsCount,
  stock,
  description,
}) => {
  return (
    <div className="space-y-4 px-4 pt-2">
      <Card variant="filled" className="space-y-3 bg-m3-surface-container p-4">
        <Flex align="start" justify="between" gap="sm" fullWidth>
          <div>
            <Text
              styleAs="h2"
              appearance="primary"
              weight="bold"
              className="block"
            >
              {title}
            </Text>
            <Text styleAs="body-sm" appearance="secondary" className="block">
              {subtitle}
            </Text>
          </div>
          <div className="text-right">
            <Text
              styleAs="h1"
              sentiment="accent"
              weight="bold"
              className="block"
            >
              ${price.toFixed(2)}
            </Text>
            <Text styleAs="caption" appearance="secondary" className="block">
              per {unit}
            </Text>
          </div>
        </Flex>

        <Flex
          align="center"
          justify="between"
          fullWidth
          className="border-t border-m3-outline-variant/30 pt-3"
        >
          <Flex align="center" gap="xs">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <Text styleAs="body-sm" sentiment="warning" weight="bold">
              {rating}
            </Text>
            <Text styleAs="caption" appearance="secondary">
              ({reviewsCount} verified reviews)
            </Text>
          </Flex>
          <Flex align="center" gap="xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <Text styleAs="body-sm" sentiment="positive" weight="semibold">
              {stock} in barn
            </Text>
          </Flex>
        </Flex>
      </Card>

      {/* Description */}
      <Flex direction="column" gap="xs" fullWidth>
        <Text styleAs="label" appearance="secondary" uppercase>
          Description
        </Text>
        <Text styleAs="body-sm" appearance="primary">
          {description}
        </Text>
      </Flex>
    </div>
  );
};
