import { ChevronRight, Phone, User, Users } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Card,
  EmptyState,
  PageContainer,
  Text,
} from '../../components/common';
import { Flex } from '../../components/layout';
import { useGetCustomersQuery } from '../../store/slices/customersApi';

export const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: customers = [], error, isLoading } = useGetCustomersQuery();

  return (
    <PageContainer spacing="md" bottomPadding="lg">
      <Flex align="center" justify="between" fullWidth>
        <Text styleAs="h2" appearance="primary" weight="bold">
          Customers Directory
        </Text>
        <Badge sentiment="neutral" size="md">
          {customers.length} Total
        </Badge>
      </Flex>

      {isLoading ? (
        <Card
          variant="filled"
          className="bg-m3-surface-container p-6 text-center"
        >
          <Text
            styleAs="body-sm"
            appearance="secondary"
            className="animate-pulse"
          >
            Loading customers...
          </Text>
        </Card>
      ) : error ? (
        <Card
          variant="filled"
          className="bg-m3-error-container/20 p-6 text-center"
        >
          <Text styleAs="body-sm" sentiment="negative" weight="medium">
            Error loading customer data.
          </Text>
        </Card>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No Customers Found"
          description="Add your first customer in Firestore to see them listed here."
        />
      ) : (
        <Flex direction="column" gap="sm" fullWidth>
          {customers.map((customer) => (
            <Card
              key={customer.id}
              variant="outlined"
              clickable
              onClick={() => navigate('/ledger')}
              className="flex items-center justify-between p-3.5 transition-colors hover:border-m3-primary/40"
            >
              <Flex align="center" gap="md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-m3-primary-container text-m3-on-primary-container">
                  <User className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <Text
                    styleAs="h4"
                    appearance="primary"
                    weight="bold"
                    className="block"
                  >
                    {customer.name}
                  </Text>
                  {customer.mobile ? (
                    <Flex align="center" gap="xs">
                      <Phone className="h-3 w-3 text-m3-on-surface-variant" />
                      <Text styleAs="caption" appearance="secondary">
                        {customer.mobile}
                      </Text>
                    </Flex>
                  ) : (
                    <Text
                      styleAs="caption"
                      appearance="secondary"
                      className="block"
                    >
                      Active Customer
                    </Text>
                  )}
                </div>
              </Flex>
              <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
            </Card>
          ))}
        </Flex>
      )}
    </PageContainer>
  );
};
