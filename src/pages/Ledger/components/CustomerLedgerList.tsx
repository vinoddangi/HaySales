import { ChevronRight } from 'lucide-react';
import React from 'react';
import { Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { Customer } from '../../../types';
import { formatRupee } from '../../../utils/formatters';

export interface CustomerLedgerListProps {
  customers: Customer[];
  onSelectCustomer: (_customerId: string) => void;
}

export const CustomerLedgerList: React.FC<CustomerLedgerListProps> = ({
  customers,
  onSelectCustomer,
}) => {
  return (
    <Card variant="filled" className="bg-m3-surface-container p-4">
      <Flex direction="column" gap="sm" fullWidth>
        <Flex align="center" justify="between" fullWidth className="pb-1">
          <Text variant="title" color="onSurface" weight="bold">
            Customer Accounts
          </Text>
          <Text variant="caption" color="muted" weight="semibold">
            {customers.length} Customers
          </Text>
        </Flex>

        <div className="max-h-[65vh] divide-y divide-m3-outline-variant/40 overflow-y-auto">
          {customers.length === 0 ? (
            <p className="py-6 text-center text-xs text-m3-on-surface-variant">
              No customer accounts found.
            </p>
          ) : (
            customers.map((c) => {
              const due = c.outstandingAmount || 0;
              return (
                <Flex
                  key={c.id}
                  align="center"
                  justify="between"
                  fullWidth
                  onClick={() => onSelectCustomer(c.id)}
                  className="cursor-pointer rounded-lg px-2 py-3.5 transition-colors hover:bg-m3-primary-container"
                >
                  <div className="min-w-0 flex-1 space-y-0.5 pr-2">
                    <Text
                      variant="body-sm"
                      weight="semibold"
                      color="onSurface"
                      className="block truncate"
                    >
                      {c.name}
                    </Text>
                    {c.mobile ? (
                      <Text variant="caption" color="muted" className="block">
                        {c.mobile}
                      </Text>
                    ) : (
                      <Text variant="caption" color="muted" className="block">
                        Limit: {formatRupee(c.creditLimit || 35000)}
                      </Text>
                    )}
                  </div>

                  <Flex align="center" gap="sm" className="shrink-0">
                    <div className="text-right">
                      <Text
                        variant="amount"
                        color={due > 0 ? 'error' : 'success'}
                        className="block text-xs font-bold"
                      >
                        {due > 0 ? formatRupee(due) : 'All Clear'}
                      </Text>
                      <Text
                        variant="caption"
                        color="muted"
                        className="block text-[9px]"
                      >
                        {due > 0 ? 'Due Balance' : 'Zero Due'}
                      </Text>
                    </div>
                    <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
                  </Flex>
                </Flex>
              );
            })
          )}
        </div>
      </Flex>
    </Card>
  );
};
