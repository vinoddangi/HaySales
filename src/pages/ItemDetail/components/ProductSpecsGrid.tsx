import { ShieldCheck } from 'lucide-react';
import React from 'react';
import { Card, Text } from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';

interface Specification {
  label: string;
  value: string;
}

interface ProductSpecsGridProps {
  specifications: Specification[];
}

export const ProductSpecsGrid: React.FC<ProductSpecsGridProps> = ({
  specifications,
}) => {
  return (
    <div className="space-y-2 px-4">
      <Flex align="center" gap="xs">
        <ShieldCheck className="h-4 w-4 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Certified Feed Specifications
        </Text>
      </Flex>
      <Grid columns={2} gap="sm" fullWidth>
        {specifications.map((spec, idx) => (
          <Card
            key={idx}
            variant="outlined"
            className="bg-m3-surface-container-low p-2.5"
          >
            <Text styleAs="caption" appearance="secondary" className="block">
              {spec.label}
            </Text>
            <Text
              styleAs="body-sm"
              appearance="primary"
              weight="bold"
              className="mt-0.5 block"
            >
              {spec.value}
            </Text>
          </Card>
        ))}
      </Grid>
    </div>
  );
};
