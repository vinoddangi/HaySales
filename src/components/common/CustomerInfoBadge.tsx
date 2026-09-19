import { AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';
import { Customer } from '../../store/slices/customersApi';
import { formatRupee } from '../../utils/formatters';
import { Flex } from '../layout/Flex';
import { Text } from './Text';

export interface CustomerInfoBadgeProps {
  customer: Customer;
  outstandingDue?: number;
  creditLimit?: number;
}

export const CustomerInfoBadge: React.FC<CustomerInfoBadgeProps> = ({
  customer,
  outstandingDue = 0,
  creditLimit = 35000,
}) => {
  const effectiveCreditLimit = customer.creditLimit || creditLimit;
  const isCreditAllowed = outstandingDue < effectiveCreditLimit;

  return (
    <Flex
      align="center"
      justify="between"
      fullWidth
      padding="md"
      className="rounded-lg border border-m3-outline bg-m3-surface-container-low"
    >
      <div>
        <Text
          styleAs="body-sm"
          appearance="primary"
          weight="bold"
          className="block"
        >
          {customer.name}
        </Text>
        <Text styleAs="caption" appearance="secondary" className="block">
          Outstanding Due:{' '}
          <Text styleAs="caption" sentiment="negative" weight="bold">
            {formatRupee(outstandingDue)}
          </Text>
        </Text>
      </div>
      {isCreditAllowed ? (
        <Flex
          as="span"
          align="center"
          gap="xs"
          paddingHorizontal="sm"
          paddingVertical="xs"
          className="rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-600"
        >
          <CheckCircle className="h-4 w-4" />
          <Text styleAs="caption" sentiment="positive" weight="semibold">
            Credit OK (Limit {formatRupee(effectiveCreditLimit)})
          </Text>
        </Flex>
      ) : (
        <Flex
          as="span"
          align="center"
          gap="xs"
          paddingHorizontal="sm"
          paddingVertical="xs"
          className="rounded-full bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
        >
          <AlertTriangle className="h-4 w-4" />
          <Text styleAs="caption" sentiment="warning" weight="semibold">
            Above {formatRupee(effectiveCreditLimit)} Limit
          </Text>
        </Flex>
      )}
    </Flex>
  );
};
